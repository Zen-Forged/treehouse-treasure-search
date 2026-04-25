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
 */
export function track(
  event_type: ClientEventType,
  payload: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  // Explicit `void` discards the promise — we don't await and don't catch
  // anywhere it could surface to the user.
  void fetch("/api/events", {
    method:    "POST",
    headers:   { "Content-Type": "application/json" },
    body:      JSON.stringify({ event_type, session_id, payload }),
    keepalive: true,
  }).catch(() => { /* silent */ });
}
