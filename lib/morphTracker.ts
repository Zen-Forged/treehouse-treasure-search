// lib/morphTracker.ts
// Session 79 — reactive store for the most-recently-tapped post tile.
//
// Used to gate `layoutId` AND `layout` on shared-element tile transitions:
// only the tile the user actually tapped renders with framer-motion's
// shared-element machinery. Every other tile renders as a plain div with
// no layout tracking at all.
//
// Why a reactive store (not just a module-scope variable):
//
// At render time, the tile reads "am I the morphing tile?" If we use a
// plain module-scope variable, setting it inside a tap handler does NOT
// trigger React to re-render. The source tile renders BEFORE the tap with
// no layoutId, the tap fires, the variable updates, navigation begins —
// but React never re-rendered the source page, so the tile never
// committed a layoutId to the DOM. By the time the source page unmounts,
// framer has no source rect to morph from. The forward morph silently
// snaps.
//
// Solution: store + listeners + useSyncExternalStore. Setting the value
// notifies subscribers, every subscribed tile re-renders, the tapped tile
// commits its layoutId, navigation completes, framer connects to the
// /find/[id] photograph predecessor on mount. Forward morph works.
//
// Usage:
//   - Tile tap handler: setLastTappedPostId(post.id)
//   - Tile render: const morphingId = useLastTappedPostId();
//                  const isMorphTile = morphingId === post.id;
//                  <motion.div
//                    layoutId={isMorphTile ? `find-${post.id}` : undefined}
//                    layout={isMorphTile ? "position" : false}
//                  />
//   - Source page mount: scheduleClearLastTapped(500) — gives the
//     back-morph time to complete (~300ms), then clears so future lateral
//     navigations don't carry the layoutId forward.

import { useSyncExternalStore } from "react";

let lastTappedPostId: string | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  return lastTappedPostId;
}

function getServerSnapshot(): string | null {
  return null;
}

export function setLastTappedPostId(id: string | null): void {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  if (lastTappedPostId === id) return;
  lastTappedPostId = id;
  emit();
}

export function getLastTappedPostId(): string | null {
  return lastTappedPostId;
}

export function useLastTappedPostId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function scheduleClearLastTapped(delayMs = 500): void {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    if (lastTappedPostId !== null) {
      lastTappedPostId = null;
      emit();
    }
    clearTimer = null;
  }, delayMs);
}
