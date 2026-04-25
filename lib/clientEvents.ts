// lib/clientEvents.ts
// R3 (session 58) — client-side analytics event tracker.
//
// Design record: docs/r3-analytics-design.md
//
// Fire-and-forget POST to /api/events for UI events (D2 hybrid capture:
// client-side path). Never blocks the calling interaction. Failures are
// silent — analytics must never disrupt UX.
//
// session_id rooted in sessionStorage (D3) so it auto-clears when the tab
// closes. No localStorage persistence — that would be PII-adjacent. No IP,
// email, or user-agent capture.

const SESSION_KEY = "th_event_session";

export type ClientEventType =
  | "page_viewed"
  | "post_saved"
  | "post_unsaved"
  | "filter_applied";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      // crypto.randomUUID is widely supported on the targets we care about
      // (iOS Safari 15+, Chrome 92+). Fallback to Date.now-based pseudo if
      // unavailable rather than blocking the call.
      id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage unavailable (Safari private mode edge cases). Don't
    // block the event — fall back to an in-memory id for this navigation.
    return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Fire-and-forget event capture. Returns immediately. The fetch happens in
 * the background; failures only log silently in the console of consumers
 * who happen to inspect.
 *
 * `keepalive: true` covers the page-unload-during-navigation case — the
 * browser flushes the request even if the originating page has already
 * unloaded. No `navigator.sendBeacon` shim needed for v1.
 *
 * Server-rendered first paint silently no-ops (typeof window check).
 *
 * ─── Debug overlay (session 58 QA aid) ─────────────────────────────────
 * When `localStorage.th_track_debug === "1"`, every track() call also
 * surfaces a transient toast in the bottom-left of the page so a tester
 * can see in real-time whether their click reached the tracker. Toggle:
 *
 *   localStorage.setItem("th_track_debug", "1")    — enable
 *   localStorage.removeItem("th_track_debug")      — disable
 *
 * Off by default. Doesn't ship to non-debug users.
 */
export function track(
  event_type: ClientEventType,
  payload: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();

  // Debug overlay — only when explicitly enabled via localStorage flag.
  try {
    if (localStorage.getItem("th_track_debug") === "1") {
      showDebugToast(`[track] ${event_type} ${shortPayload(payload)}`);
    }
  } catch { /* private mode — skip overlay */ }

  // Explicit `void` discards the promise — we don't await and don't catch
  // anywhere it could surface to the user.
  void fetch("/api/events", {
    method:    "POST",
    headers:   { "Content-Type": "application/json" },
    body:      JSON.stringify({ event_type, session_id, payload }),
    keepalive: true,
  }).catch(() => { /* silent */ });
}

// ── Debug overlay implementation ────────────────────────────────────────
function shortPayload(p: Record<string, unknown>): string {
  const entries = Object.entries(p).slice(0, 2);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}=${typeof v === "string" ? v.slice(0, 18) : JSON.stringify(v)}`)
    .join(" ");
}

function showDebugToast(text: string): void {
  if (typeof document === "undefined") return;
  const id = "th-track-debug-stack";
  let stack = document.getElementById(id);
  if (!stack) {
    stack = document.createElement("div");
    stack.id = id;
    Object.assign(stack.style, {
      position:        "fixed",
      bottom:          "16px",
      left:            "16px",
      zIndex:          "999999",
      display:         "flex",
      flexDirection:   "column-reverse",
      gap:             "6px",
      pointerEvents:   "none",
      maxWidth:        "calc(100vw - 32px)",
    });
    document.body.appendChild(stack);
  }
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    background:    "rgba(30,77,43,0.95)",
    color:         "#f6f1e6",
    padding:       "8px 12px",
    borderRadius:  "10px",
    fontFamily:    "ui-monospace, Menlo, Consolas, monospace",
    fontSize:      "11px",
    lineHeight:    "1.4",
    boxShadow:     "0 6px 18px rgba(0,0,0,0.32)",
    transition:    "opacity 0.4s, transform 0.4s",
    transform:     "translateY(8px)",
    opacity:       "0",
    whiteSpace:    "nowrap",
    overflow:      "hidden",
    textOverflow:  "ellipsis",
  });
  toast.textContent = text;
  stack.appendChild(toast);
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity   = "1";
  });
  // Auto-fade after 2.4s
  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 500);
  }, 2400);
}
