// lib/visitorTracker.ts
// Session 194 Ask #2 — Visitor tracking.
//
// Fires `visitor_engaged` once per browser session when the engagement
// threshold is met:
//   • First meaningful interaction (any track() call other than
//     visitor_engaged itself — hook lives in lib/clientEvents.ts), OR
//   • 10s elapsed since initVisitorTracker() was called
//
// Whichever fires first. Subsequent triggers no-op via the sessionStorage
// guard (`th_visitor_engaged_fired`).
//
// ─── UUID model (Design B — bot filtering by design) ─────────────────────
// `visitor_id` is minted at the engagement moment, NOT at page load. Bots
// that bounce in <10s without tapping NEVER receive a visitor_id and NEVER
// appear in the events table. Returning visitors are signaled via
// `is_first_session: false` in payload — the UUID is already in localStorage
// from a prior engaged session.
//
// ─── Persistence ─────────────────────────────────────────────────────────
//   localStorage `th_visitor_id`              — UUID, persists forever
//   localStorage `th_visitor_first_seen_at`   — ISO timestamp of first engagement
//   sessionStorage `th_visitor_engaged_fired` — per-tab-session fire guard
//
// ─── Circular-import avoidance ───────────────────────────────────────────
// lib/clientEvents.ts track() calls `notifyVisitorInteraction()` to hook
// the engagement signal. To avoid a circular dependency, visitorTracker.ts
// POSTs to /api/events directly (does NOT call track()). The route's
// CLIENT_EVENT_TYPES whitelist accepts `visitor_engaged` per session-194 C4.
//
// ─── Tier B headroom (not in v1) ─────────────────────────────────────────
//   • Pause dwell timer on tab visibilitychange (count only foregrounded time)
//   • Server-side bot heuristics on payload (UA, IP-density, request rate)
//   • visitor_returned distinct event type for cohort analysis split

const VISITOR_ID_KEY         = "th_visitor_id";
const VISITOR_FIRST_SEEN_KEY = "th_visitor_first_seen_at";
const SESSION_FIRED_KEY      = "th_visitor_engaged_fired";  // sessionStorage
const EVENT_SESSION_KEY      = "th_event_session";          // matches lib/clientEvents.ts
const MALL_ID_KEY            = "treehouse_saved_mall_id";   // matches lib/useSavedMallId.ts

const DWELL_THRESHOLD_MS = 10_000;

interface VisitorEngagedPayload {
  visitor_id:        string;
  is_first_session:  boolean;
  trigger:           "interaction" | "dwell_10s";
  time_to_engage_ms: number;
  page_path:         string;
  mall_scope:        string | null;
  first_event_type?: string;
}

// Module-scope state. Per-tab — no cross-tab synchronization needed since
// each tab has its own sessionStorage guard + can legitimately fire its own
// visitor_engaged event (multi-tab = multiple browser sessions, intentional).
let mountTimeMs         = 0;
let dwellTimerId: ReturnType<typeof setTimeout> | null = null;
let hasFiredThisSession = false;
let isInitialized       = false;

/**
 * Mount the tracker. Called from a client component on app boot.
 * Returns a cleanup function (clear dwell timer) for React effect cleanup.
 *
 * Idempotent — safe to call on every layout mount; second-call no-ops if
 * the tracker is already running (SPA navigation re-mounts the root client
 * component but the timer should not restart).
 */
export function initVisitorTracker(): () => void {
  if (typeof window === "undefined") return () => {};
  if (isInitialized) return () => {};

  isInitialized = true;
  mountTimeMs   = Date.now();

  // Check sessionStorage guard — if already fired this session (e.g. a
  // full page reload after engagement), no-op.
  try {
    hasFiredThisSession = sessionStorage.getItem(SESSION_FIRED_KEY) === "1";
  } catch { /* private mode — falls through to !hasFiredThisSession default */ }

  if (hasFiredThisSession) return () => {};

  // Start 10s dwell timer. Cleared on cleanup OR on interaction-fire.
  dwellTimerId = setTimeout(() => {
    fireVisitorEngaged("dwell_10s");
  }, DWELL_THRESHOLD_MS);

  return () => {
    if (dwellTimerId !== null) {
      clearTimeout(dwellTimerId);
      dwellTimerId = null;
    }
    isInitialized = false;
  };
}

/**
 * Hook called from lib/clientEvents.ts track() on every UI event.
 * Fires visitor_engaged on the FIRST meaningful interaction this session.
 * Subsequent calls no-op via the hasFiredThisSession guard.
 *
 * `triggerEventType` is the ClientEventType that called track() — captured
 * in payload.first_event_type for cohort analysis (which surface earned the
 * engagement).
 *
 * Defensive guard skips visitor_engaged itself (clientEvents.ts also gates
 * this, but belt-and-suspenders since recursion would be silent + wasteful).
 */
export function notifyVisitorInteraction(triggerEventType: string): void {
  if (typeof window === "undefined") return;
  if (hasFiredThisSession) return;
  if (triggerEventType === "visitor_engaged") return;
  fireVisitorEngaged("interaction", triggerEventType);
}

function fireVisitorEngaged(
  trigger: "interaction" | "dwell_10s",
  firstEventType?: string,
): void {
  // Re-check under the race window — interaction + dwell timer can both
  // fire in the same tick if the threshold is hit at exactly 10s.
  if (hasFiredThisSession) return;
  hasFiredThisSession = true;

  // Cancel pending dwell timer — interaction-triggered fire wins the race.
  if (dwellTimerId !== null) {
    clearTimeout(dwellTimerId);
    dwellTimerId = null;
  }

  try { sessionStorage.setItem(SESSION_FIRED_KEY, "1"); } catch { /* */ }

  // ─── Mint visitor_id at engagement moment (Design B — bot filtering) ──
  let visitorId      = "";
  let isFirstSession = false;
  try {
    visitorId = localStorage.getItem(VISITOR_ID_KEY) ?? "";
    if (!visitorId) {
      visitorId = mintUuid("v");
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      localStorage.setItem(VISITOR_FIRST_SEEN_KEY, new Date().toISOString());
      isFirstSession = true;
    }
  } catch {
    // localStorage unavailable (Safari private mode) — synthesize ephemeral
    // ID so the event still fires. is_first_session always true since we
    // can't read prior storage to check.
    visitorId      = mintUuid("v");
    isFirstSession = true;
  }

  // ─── Reuse the lib/clientEvents.ts session_id (canonical R3 session) ──
  let sessionId = "";
  try {
    sessionId = sessionStorage.getItem(EVENT_SESSION_KEY) ?? "";
    if (!sessionId) {
      sessionId = mintUuid("s");
      sessionStorage.setItem(EVENT_SESSION_KEY, sessionId);
    }
  } catch {
    sessionId = mintUuid("s");
  }

  const payload: VisitorEngagedPayload = {
    visitor_id:        visitorId,
    is_first_session:  isFirstSession,
    trigger,
    time_to_engage_ms: Date.now() - mountTimeMs,
    page_path:         typeof location !== "undefined" ? location.pathname : "/",
    mall_scope:        readMallScope(),
    ...(firstEventType ? { first_event_type: firstEventType } : {}),
  };

  // Fire-and-forget POST. Bypasses lib/clientEvents.ts track() to avoid
  // circular import (track() calls notifyVisitorInteraction → recursion).
  // `keepalive: true` covers the page-unload-during-navigation case so the
  // browser flushes the request even if the originating page unloaded.
  fetch("/api/events", {
    method:    "POST",
    headers:   { "Content-Type": "application/json" },
    body:      JSON.stringify({
      event_type: "visitor_engaged",
      session_id: sessionId,
      payload,
    }),
    keepalive: true,
  }).catch(() => { /* fire-and-forget — never throw, never block UI */ });
}

function mintUuid(prefix: "v" | "s"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes that don't expose crypto.randomUUID.
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function readMallScope(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Match lib/useSavedMallId.ts semantics: localStorage holds either the
    // mall slug OR is absent (treated as null = all-Kentucky scope). No
    // sentinel string for all-Kentucky.
    return localStorage.getItem(MALL_ID_KEY);
  } catch {
    return null;
  }
}
