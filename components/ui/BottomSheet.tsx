// components/ui/BottomSheet.tsx
// Layer 2 primitive — modal scrim + bottom-sheet container + handle pill
// + TopBar (back + close). Extracted from ShareSheet's 3 duplicated body
// components (Booth / Mall / Find) at session 149.
//
// Consumers: ShareSheet (3 entity bodies). Future candidates: any modal/
// picker that needs the same scrim + slide-up shape (BoothPickerSheet,
// EditBoothSheet, AddFindSheet are v2-migrated but could later adopt this
// primitive for chrome unification).
//
// Intrinsic sizing PRESERVED verbatim from session 41+135 calibrated values
// (handle 44×4, TopBar 36px, max-width 430px, max-height 92vh, sheet radius
// 20px, scrim opacity 0.38, sheet shadow rgba(30,20,10,0.28)). These are
// primitive-intrinsic dimensions, not consumer-tunable, and the lint:spacing
// baseline already counts them as ShareSheet's debt — extraction moves them
// to ONE site rather than three.
//
// v1 → v2 token migration applied at extraction:
//   v1.paperCream   → v2.bg.main         (sheet bg)
//   v1.inkFaint     → v2.text.muted      (handle pill)
//   v1.inkHairline  → v2.border.light    (TopBar button border)
//   v1.inkMid       → v2.text.secondary  (TopBar glyph stroke)
//   rgba(255,255,255,0.5) → v2.surface.card  (TopBar button bg —
//                                             frosted-glass retire
//                                             per session 132)
//
// PRESERVED as canonical modal vocabulary (NOT frosted-glass primitive):
//   - Backdrop rgba(30,20,10,0.38) — modal scrim
//   - Sheet boxShadow rgba(30,20,10,0.28) — sheet-rise elevation
//   (session 146 Arc 7.4.2 precedent for AddFindSheet)

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  v2,
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_BACKDROP_DURATION,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";

export interface BottomSheetProps {
  /** Whether the sheet is mounted + visible. AnimatePresence handles fade/slide. */
  open: boolean;
  /** Fired when close button or backdrop tapped (unless closeDisabled). */
  onClose: () => void;
  /** Aria label for the dialog. Required for accessibility — describe the sheet's purpose. */
  ariaLabel: string;
  /** Whether the TopBar's back-arrow is visible. Pair with onBack. */
  showBack?: boolean;
  /** Fired when back-arrow tapped. Required when showBack is true. */
  onBack?: () => void;
  /** Disables BOTH close button AND backdrop click (e.g., during an async submit). */
  closeDisabled?: boolean;
  /** Sheet body content (rendered inside the scrollable region). */
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  ariaLabel,
  showBack = false,
  onBack,
  closeDisabled = false,
  children,
}: BottomSheetProps) {
  // Body scroll lock — mirrors the duplicated useEffect previously in each
  // ShareSheet body component. Live only while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_BOTTOM_SHEET_BACKDROP_DURATION, ease: MOTION_BOTTOM_SHEET_EASE }}
            onClick={closeDisabled ? undefined : onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(30,20,10,0.38)",
              zIndex: 100,
            }}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: MOTION_BOTTOM_SHEET_SHEET_DURATION, ease: MOTION_BOTTOM_SHEET_EASE }}
            style={{
              position: "fixed",
              left: 0, right: 0, bottom: 0,
              margin: "0 auto",
              width: "100%",
              maxWidth: 430,
              maxHeight: "92vh",
              background: v2.bg.main,
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 30px rgba(30,20,10,0.28)",
              zIndex: 101,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle pill */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div
                aria-hidden="true"
                style={{ width: 44, height: 4, borderRadius: 999, background: v2.text.muted }}
              />
            </div>

            {/* Top bar — × always; ← only when showBack. Fixed 36px slot so
                screen swaps inside the sheet don't cause vertical flicker. */}
            <TopBar
              showBack={showBack}
              onBack={onBack}
              onClose={onClose}
              closeDisabled={closeDisabled}
            />

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "6px 22px 22px",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── TopBar ────────────────────────────────────────────────────────────────
function TopBar({
  showBack,
  onBack,
  onClose,
  closeDisabled,
}: {
  showBack: boolean;
  onBack?: () => void;
  onClose: () => void;
  closeDisabled: boolean;
}) {
  const button: React.CSSProperties = {
    width: 36, height: 36,
    borderRadius: "50%",
    border: `1px solid ${v2.border.light}`,
    background: v2.surface.card,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: v2.text.secondary,
    padding: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 22px", height: 36, flexShrink: 0 }}>
      {showBack && onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" style={button}>
          <ArrowLeftGlyph />
        </button>
      ) : (
        <div style={{ width: 36, height: 36 }} aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close"
        style={{ ...button, opacity: closeDisabled ? 0.5 : 1, cursor: closeDisabled ? "default" : "pointer" }}
      >
        <CloseGlyph />
      </button>
    </div>
  );
}

function ArrowLeftGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
