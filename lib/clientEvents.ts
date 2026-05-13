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
  | "filter_applied"
  // ── R3 v1.1 amendment (session 73) — see migration 012 ──────────────────
  | "booth_bookmarked"
  | "booth_unbookmarked"
  | "find_shared"
  | "tag_extracted"
  | "tag_skipped"
  // ── Session 99 — /flagged destination redesign ────────────────────────
  | "flagged_booth_explored"
  // ── Session 100 — /find/[id] swipe-between-finds nav ─────────────────
  | "find_swiped"
  // ── R17 (session 117 design / 118+ impl) — geolocation-aware discovery
  | "location_prompted"
  | "location_granted"
  | "location_denied"
  | "find_navigate_tapped"
  | "find_view_on_map_tapped"
  // ── R18 (session 121) — Saved per-mall restructure ───────────────────
  | "flagged_directions_tapped"
  // ── Session 135 — Share Booth redesign (Frame C, 3-channel grid) ─────
  // docs/share-booth-redesign-design.md D13. Existing `find_shared` event
  // covers /find/[id] navigator.share() — these three are sheet-channel
  // signals from ShareBoothSheet. share_booth_email_sent stays server-side
  // via /api/share-booth (unchanged by this redesign).
  | "share_booth_channel_tapped"
  | "share_booth_qr_viewed"
  | "share_booth_sms_initiated"
  // ── Session 137 — Share Sheet generalization (Mall + Find entities) ──
  // 3-tier engagement+share lattice (memory: project_layered_engagement_share_hierarchy).
  // Mall + Find entities use SMS + QR + Copy Link channels (no Email — kept
  // booth-only because the booth window email is the load-bearing curated
  // experience). Per-entity events mirror session 135's share_booth_* shape;
  // copy_link_completed is the success signal for the new clipboard channel
  // (the channel_tapped event fires on tap regardless of clipboard outcome).
  | "share_mall_channel_tapped"
  | "share_mall_qr_viewed"
  | "share_mall_sms_initiated"
  | "share_mall_copy_link_completed"
  | "share_find_channel_tapped"
  | "share_find_qr_viewed"
  | "share_find_sms_initiated"
  | "share_find_copy_link_completed"
  // ── Session 154 — Home chrome restructure (D12 in design record) ────
  // Tap on the persistent MallStrip below masthead opens the MallMapDrawer.
  // Discoverability signal for the click-to-expand affordance + engagement
  // funnel for map-driven scope picks. Payload: { mall_slug | "all-kentucky" }.
  | "home_strip_tapped"
  // ── Session 152 — Share My Shelf image generator (booth-only) ────────
  // 4th channel tile inside BoothShareBody (Email + SMS + QR + Shelf Image).
  // share_booth_channel_tapped fires on tile tap with channel: "shelf_image".
  // share_shelf_image_viewed fires on sub-screen mount (parallel to
  // share_booth_qr_viewed pattern from session 135).
  // share_shelf_image_downloaded fires on successful download OR successful
  // navigator.share() resolution (covers both mobile native-share flow and
  // desktop direct-download flow). Method field disambiguates.
  | "share_shelf_image_viewed"
  | "share_shelf_image_downloaded"
  // ── Session 158 — Map enrichment (D14 in docs/map-enrichment-design.md) ──
  // map_carousel_card_tapped fires when a mall card is tapped in the new
  // <MapCarousel> below MallMapDrawer; sort_position is 0-indexed within the
  // current sort (distance-asc when granted, alphabetical when denied).
  // map_callout_neighbor_stepped fires when the flanking chevron bubbles on
  // PinCallout step the peeked mall to the prev/next in carousel sort order.
  | "map_carousel_card_tapped"
  | "map_callout_neighbor_stepped";

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
  let debugMode = false;
  try {
    debugMode = localStorage.getItem("th_track_debug") === "1";
    if (debugMode) {
      showDebugToast(`[track] ${event_type} ${shortPayload(payload)}`);
    }
  } catch { /* private mode — skip overlay */ }

  // Fire-and-forget fetch. In debug mode we DO observe the result and show
  // it in a follow-up toast — invaluable for QA when the click-to-DB chain
  // breaks somewhere in the middle.
  fetch("/api/events", {
    method:    "POST",
    headers:   { "Content-Type": "application/json" },
    body:      JSON.stringify({ event_type, session_id, payload }),
    keepalive: true,
  })
    .then(async res => {
      if (!debugMode) return;
      if (res.ok) {
        showDebugToast(`✓ ${event_type} → ${res.status}`, "ok");
      } else {
        let detail = "";
        try { const j = await res.json(); detail = j?.error ?? ""; } catch { /* */ }
        showDebugToast(`✗ ${event_type} → ${res.status} ${detail}`, "err");
      }
    })
    .catch(err => {
      if (debugMode) {
        showDebugToast(`✗ ${event_type} → network error: ${String(err).slice(0, 40)}`, "err");
      }
    });
}

// ── Debug overlay implementation ────────────────────────────────────────
function shortPayload(p: Record<string, unknown>): string {
  const entries = Object.entries(p).slice(0, 2);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}=${typeof v === "string" ? v.slice(0, 18) : JSON.stringify(v)}`)
    .join(" ");
}

function showDebugToast(text: string, kind: "info" | "ok" | "err" = "info"): void {
  if (typeof document === "undefined") return;
  const id = "th-track-debug-stack";
  let stack = document.getElementById(id);
  if (!stack) {
    stack = document.createElement("div");
    stack.id = id;
    Object.assign(stack.style, {
      position:        "fixed",
      bottom:          "16px",
      left:             "16px",
      zIndex:           "999999",
      display:          "flex",
      flexDirection:    "column-reverse",
      gap:              "6px",
      pointerEvents:    "none",
      maxWidth:         "calc(100vw - 32px)",
    });
    document.body.appendChild(stack);
  }
  const bg =
    kind === "ok"  ? "rgba(30,77,43,0.95)" :
    kind === "err" ? "rgba(140,30,30,0.95)" :
                     "rgba(20,20,20,0.92)";
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    background:    bg,
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
    maxWidth:      "calc(100vw - 32px)",
    wordBreak:     "break-word",
  });
  toast.textContent = text;
  stack.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity   = "1";
  });
  // Errors linger longer so they're readable
  const lifeMs = kind === "err" ? 6000 : 2800;
  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 500);
  }, lifeMs);
}
