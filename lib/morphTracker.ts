// lib/morphTracker.ts
// Session 79 — module-scope tracker for the most-recently-tapped post tile.
//
// Used to gate `layoutId` on shared-element tile transitions: only the tile
// the user actually tapped gets a `find-${id}` layoutId, so framer-motion
// doesn't connect ALL tiles' layoutIds across page mount/unmount (which
// produces the "tiles slide into place from above" effect when scroll
// position differs between unmount and remount, or "tiles scattered across
// the page" when one source page's layoutIds map to many predecessors on
// the destination).
//
// Without this gate, framer-motion's behavior is:
//   - Home page at scroll Y unmounts. Captures all tile rects at viewport
//     coords (DOM_y - Y).
//   - /find/[id] mounts at scroll 0.
//   - User taps back. /find unmounts. Home re-mounts at scroll 0.
//   - All tile motion.divs with layoutId reconnect to their predecessors.
//     Every tile animates from "Y pixels above current" to "current"
//     while scroll restore is queued in a useEffect (which runs AFTER
//     framer's useLayoutEffect-time measurement).
//
// With this gate, only the tapped tile has a layoutId. Framer connects
// that one tile to the /find/[id] photograph predecessor (the back-morph
// the user actually wanted). Every other tile renders without a layoutId,
// so framer has nothing to track and they stay perfectly still.
//
// Lifecycle:
//   - Tile tap handler: setLastTappedPostId(post.id)
//   - Tile render: layoutId={getLastTappedPostId() === post.id ? `find-${post.id}` : undefined}
//   - Source page mount: scheduleClearLastTapped(500) — gives the back-morph
//     time to complete (~300ms), then clears so future lateral navigations
//     (e.g. BottomNav tab switches) don't carry the layoutId forward.

let lastTappedPostId: string | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export function setLastTappedPostId(id: string | null): void {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  lastTappedPostId = id;
}

export function getLastTappedPostId(): string | null {
  return lastTappedPostId;
}

export function scheduleClearLastTapped(delayMs = 500): void {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    lastTappedPostId = null;
    clearTimer = null;
  }, delayMs);
}
