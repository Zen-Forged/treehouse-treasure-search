// components/PhotoLightbox.tsx
// PhotoLightbox — full-screen photo viewer with pinch-zoom + pan + double-tap.
// Session 61, fix #2.
//
// Behavior contract:
//   - Tap the photo on /find/[id] → opens this lightbox over everything.
//   - Pinch to zoom, 1× → 4× bound, snaps back to 1× if you spread to <1.05.
//   - Double-tap toggles 1× ↔ 2.5× centered on the image.
//   - When zoomed >1×, single-finger drag pans.
//   - X button (top-right, safe-area-inset aware) and ESC close the viewer.
//   - Body scroll is locked while open so the page doesn't jitter under
//     gestures.
//
// Why hand-rolled, not a library:
//   The whole repo is dependency-light and pinch-zoom for a single image is
//   ~80 lines of touch math. A library would add 8–10KB for behavior we'd
//   still need to wrap and theme. If carousel-between-photos lands later
//   (post-MVP — see CLAUDE.md "Sprint 6+ parked"), reconsider react-zoom-pan-pinch.
//
// Non-passive touch listeners:
//   We need preventDefault() on touchmove to stop iOS Safari's native page
//   zoom from kicking in over our gesture. React synthetic touch events are
//   passive — preventDefault is a silent no-op there — so we attach via
//   addEventListener on a ref'd stage div instead.

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";

const EASE              = [0.25, 0.46, 0.45, 0.94] as const;
const MIN_SCALE         = 1;
const MAX_SCALE         = 4;
const DOUBLE_TAP_MS     = 280;
const DOUBLE_TAP_SCALE  = 2.5;
const SNAP_BACK_BELOW   = 1.05;

interface Props {
  open:    boolean;
  src:     string | null;
  alt:     string;
  onClose: () => void;
}

interface Transform { scale: number; tx: number; ty: number; }
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

function dist(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export default function PhotoLightbox({ open, src, alt, onClose }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  // transformRef holds the latest transform for the touch handlers (which
  // are bound once and need to read live values without re-binding).
  // transform state is what React renders.
  const transformRef = useRef<Transform>(IDENTITY);
  const [transform, setTransformState] = useState<Transform>(IDENTITY);

  // gesture is mutable session state for the in-progress pinch/pan.
  const gestureRef = useRef({
    pinching:     false,
    panning:      false,
    startDist:    0,
    startScale:   1,
    startTx:      0,
    startTy:      0,
    startTouchX:  0,
    startTouchY:  0,
    lastTapTime:  0,
  });

  function applyTransform(next: Transform) {
    transformRef.current = next;
    setTransformState(next);
  }

  // Reset on open so a previously-zoomed close doesn't leak into the next view
  useEffect(() => {
    if (open) applyTransform(IDENTITY);
  }, [open]);

  // Body scroll lock + ESC handler
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Touch handlers — non-passive so preventDefault works on touchmove
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !open) return;

    const g = gestureRef.current;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        g.pinching     = true;
        g.panning      = false;
        g.startDist    = dist(e.touches[0], e.touches[1]);
        g.startScale   = transformRef.current.scale;
        g.startTx      = transformRef.current.tx;
        g.startTy      = transformRef.current.ty;
        return;
      }

      if (e.touches.length === 1) {
        // Double-tap toggle
        const now = Date.now();
        if (now - g.lastTapTime < DOUBLE_TAP_MS) {
          const cur = transformRef.current;
          applyTransform(
            cur.scale > 1.01
              ? IDENTITY
              : { scale: DOUBLE_TAP_SCALE, tx: 0, ty: 0 },
          );
          g.lastTapTime = 0;
          return;
        }
        g.lastTapTime = now;

        // Pan setup, only meaningful when already zoomed
        if (transformRef.current.scale > 1.01) {
          g.panning      = true;
          g.pinching     = false;
          g.startTouchX  = e.touches[0].clientX;
          g.startTouchY  = e.touches[0].clientY;
          g.startTx      = transformRef.current.tx;
          g.startTy      = transformRef.current.ty;
        }
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (g.pinching && e.touches.length === 2) {
        e.preventDefault();
        const newDist  = dist(e.touches[0], e.touches[1]);
        const ratio    = newDist / (g.startDist || 1);
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, g.startScale * ratio));
        // Scale tx/ty proportionally so the image doesn't jump out from
        // under the user's fingers. Not a true pinch-around-centroid (that
        // would need the touch midpoint relative to the image), but close
        // enough on a centered fit-image and avoids the jarring re-anchor.
        const scaleRatio = newScale / (g.startScale || 1);
        applyTransform({
          scale: newScale,
          tx:    g.startTx * scaleRatio,
          ty:    g.startTy * scaleRatio,
        });
        return;
      }

      if (g.panning && e.touches.length === 1) {
        e.preventDefault();
        const dx = e.touches[0].clientX - g.startTouchX;
        const dy = e.touches[0].clientY - g.startTouchY;
        applyTransform({
          scale: transformRef.current.scale,
          tx:    g.startTx + dx,
          ty:    g.startTy + dy,
        });
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        g.pinching = false;
        g.panning  = false;
        // Snap fully back to identity if barely zoomed — avoids "stuck at 1.02×"
        if (transformRef.current.scale < SNAP_BACK_BELOW) {
          applyTransform(IDENTITY);
        }
      }
    }

    el.addEventListener("touchstart",  onTouchStart, { passive: false });
    el.addEventListener("touchmove",   onTouchMove,  { passive: false });
    el.addEventListener("touchend",    onTouchEnd,   { passive: false });
    el.addEventListener("touchcancel", onTouchEnd,   { passive: false });
    return () => {
      el.removeEventListener("touchstart",  onTouchStart);
      el.removeEventListener("touchmove",   onTouchMove);
      el.removeEventListener("touchend",    onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open]);

  const isGesturing = gestureRef.current.pinching || gestureRef.current.panning;

  return (
    <AnimatePresence>
      {open && src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE }}
          style={{
            position: "fixed",
            inset:    0,
            zIndex:   1000,
            background: "rgba(0,0,0,0.96)",
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          aria-modal="true"
          role="dialog"
        >
          {/* Stage — owns gestures, holds the transformed image */}
          <div
            ref={stageRef}
            style={{
              position: "absolute",
              inset:    0,
              display:  "flex",
              alignItems:    "center",
              justifyContent: "center",
              overflow: "hidden",
              touchAction: "none",
            }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                maxWidth:  "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
                transformOrigin: "center center",
                transition: isGesturing
                  ? "none"
                  : "transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)",
                filter:       TREEHOUSE_LENS_FILTER,
                WebkitFilter: TREEHOUSE_LENS_FILTER,
                userSelect:    "none",
                WebkitUserSelect: "none",
                pointerEvents: "none", // touches go to the stage, not the img
              }}
            />
          </div>

          {/* Close button — safe-area aware so it clears the iPhone notch */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo"
            style={{
              position: "absolute",
              top:   "calc(env(safe-area-inset-top, 0px) + 16px)",
              right: "calc(env(safe-area-inset-right, 0px) + 16px)",
              width:  40,
              height: 40,
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              backdropFilter:       "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems:    "center",
              justifyContent: "center",
              color:  "#fff",
              cursor: "pointer",
              zIndex: 2,
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
