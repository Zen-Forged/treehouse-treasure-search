// components/AddFindSheet.tsx
// v1.2 primitive — bottom sheet shown from /my-shelf to start a new find.
// Replaces /post as a standalone capture surface; see build spec §1 and the
// approved mockup docs/mockups/add-find-sheet-v1-2.html (Frame 3 — stripped).
//
// STRUCTURALLY MODELED ON <MallSheet>. Same chrome, same transform-free
// centering (left:0 right:0 margin:0 auto — per DECISION_GATE Tech Rule
// "Framer Motion transforms": never combine a centering transform with a
// Framer y animation on the same element).
//
// Layout:
//   1. Backdrop (tap to dismiss)
//   2. Sheet container — paperCream, 20px top radius, shadow, max-height 78vh
//   3. Drag handle (visual only; backdrop dismisses)
//   4. Header: IM Fell 22px "Add a find" (no subhead — stripped variant)
//   5. Hairline divider
//   6. Two rows, 24px glyph column + label + empty right slot:
//      - Camera glyph + "Take a photo"
//      - ImagePlus glyph + "Choose from library"
//
// Stateless: the sheet does NOT own the file inputs. Parent wires hidden
// `<input type="file">` refs and calls back into `onTakePhoto` /
// `onChooseFromLibrary` which trigger the respective inputs' .click().

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ImagePlus } from "lucide-react";
import { v1, FONT_LORA } from "@/lib/tokens";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export interface AddFindSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user taps the "Take a photo" row. */
  onTakePhoto: () => void;
  /** Called when the user taps the "Choose from library" row. */
  onChooseFromLibrary: () => void;
  /**
   * Header label. Defaults to "Add a find" for the primary capture flow.
   * Retake-photo callers (session 94 capture-flow refinement) pass
   * "Replace photo" so the sheet doesn't read as a fresh add.
   */
  title?: string;
}

export default function AddFindSheet({
  open,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
  title = "Add a find",
}: AddFindSheetProps) {
  // Lock body scroll while open (same pattern as MallSheet)
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
          {/* ── 1. Backdrop ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(30,20,10,0.38)",
              zIndex: 100,
            }}
            aria-hidden="true"
          />

          {/* ── 2. Sheet container ──────────────────────────────────────
              Centering: left:0 right:0 margin:0 auto (no transform) so
              Framer's y animation doesn't wipe the centering mid-slide.
              See Decision Gate Tech Rules. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add a find"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              margin: "0 auto",
              width: "100%",
              maxWidth: 430,
              maxHeight: "78vh",
              background: v1.paperCream,
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 30px rgba(30,20,10,0.28)",
              zIndex: 101,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* ── 3. Drag handle ──────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 12,
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 999,
                  background: v1.inkFaint,
                }}
                aria-hidden="true"
              />
            </div>

            {/* ── 4. Header ───────────────────────────────────────────── */}
            <div style={{ padding: "10px 22px 2px", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: FONT_LORA,
                  fontSize: 22,
                  color: v1.inkPrimary,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.2,
                }}
              >
                {title}
              </div>
            </div>

            {/* ── 5. Divider ──────────────────────────────────────────── */}
            <div style={{ padding: "14px 22px 12px", flexShrink: 0 }}>
              <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
            </div>

            {/* ── 6. Rows ─────────────────────────────────────────────── */}
            <div style={{ padding: "0 22px 12px", display: "flex", flexDirection: "column" }}>
              <SheetRow
                glyph={
                  <Camera size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
                }
                label="Take a photo"
                onClick={onTakePhoto}
                isLast={false}
              />
              <SheetRow
                glyph={
                  <ImagePlus size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
                }
                label="Choose from library"
                onClick={onChooseFromLibrary}
                isLast={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Single sheet row — glyph + IM Fell 18px label, clean single-line rows ──
function SheetRow({
  glyph,
  label,
  onClick,
  isLast,
}: {
  glyph: React.ReactNode;
  label: string;
  onClick: () => void;
  isLast: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        columnGap: 14,
        alignItems: "center",
        width: "100%",
        minHeight: 64,
        padding: "16px 10px",
        background: "transparent",
        border: "none",
        borderBottom: isLast ? "none" : `1px solid ${v1.inkHairline}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {glyph}
      </div>
      <span
        style={{
          fontFamily: FONT_LORA,
          fontSize: 18,
          color: v1.inkPrimary,
          lineHeight: 1.25,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <div aria-hidden="true" />
    </button>
  );
}
