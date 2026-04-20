// components/BoothPickerSheet.tsx
// BoothPickerSheet — bottom-sheet booth picker for multi-booth vendors.
// Session 35 (2026-04-20), approved in docs/mockups/my-shelf-multi-booth-v1.html.
//
// Inherits motion + chrome from <MallSheet> (session 20 primitive):
//   - Backdrop: rgba(30,20,10,0.38), fade 220ms
//   - Sheet: paperCream bg, 20px top radius, y-slide-in 340ms
//   - Transform-free centering: left:0, right:0, margin:0 auto, maxWidth 430
//     (never combine a centering transform with Framer y animation on the
//     same element — session-21A rule)
//   - Handle: 44×4 pill, inkFaint
//   - Body scroll locked while open
//   - 22px horizontal padding throughout
//
// Mockup-approved decisions (session 34):
//   - Booth name LEADS (bold IM Fell 17px), mall + booth number as FONT_SYS 13px subtitle.
//     Reframed session 34: "This page is for the Booth owners. It should feel like
//     their page, not the malls page." Booth identity centers the hierarchy.
//   - X-glyph at left (per locked glyph hierarchy: pin=mall, X=booth, session 17)
//   - Active row: inkWash background + green ✓ at right
//   - Pending rows are NOT passed in — filter happens upstream (getVendorsByUserId
//     only returns rows with user_id linked, i.e. approved). The mockup's Frame 3
//     "Small Town Finds · Pending" row is not final behavior; this was David's
//     explicit answer at review (question 5).
//   - "+ Add another booth" CTA INSIDE the sheet, dashed border, routes to
//     /vendor-request?email=<encoded> so the vendor doesn't re-type.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Vendor } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

export interface BoothPickerSheetProps {
  open:           boolean;
  onClose:        () => void;
  vendors:        Vendor[];       // filtered upstream to approved/linked rows only
  activeVendorId: string;
  onSelect:       (vendorId: string) => void;
  vendorEmail:    string;         // used to prefill /vendor-request on "Add another"
}

export default function BoothPickerSheet({
  open,
  onClose,
  vendors,
  activeVendorId,
  onSelect,
  vendorEmail,
}: BoothPickerSheetProps) {
  const router = useRouter();

  // Lock body scroll while sheet is open — matches <MallSheet> behavior.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function handleAddAnother() {
    const qs = vendorEmail ? `?email=${encodeURIComponent(vendorEmail)}` : "";
    router.push(`/vendor-request${qs}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────── */}
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

          {/* ── Sheet container ─────────────────────────────────────── */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Switch booth"
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
            {/* Handle */}
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

            {/* Eyebrow + title */}
            <div style={{ padding: "10px 22px 2px", flexShrink: 0, textAlign: "center" }}>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: v1.inkMuted,
                  lineHeight: 1.2,
                  marginBottom: 2,
                }}
              >
                Your booths
              </div>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontSize: 21,
                  color: v1.inkPrimary,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.2,
                }}
              >
                Switch to
              </div>
            </div>

            {/* Hairline divider */}
            <div style={{ padding: "14px 22px 0", flexShrink: 0 }}>
              <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
            </div>

            {/* Scrollable rows */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "0 22px 22px",
              }}
            >
              {vendors.map(vendor => (
                <BoothRow
                  key={vendor.id}
                  vendor={vendor}
                  active={vendor.id === activeVendorId}
                  onClick={() => {
                    onSelect(vendor.id);
                    onClose();
                  }}
                />
              ))}

              {/* Add another booth — dashed affordance inside the sheet */}
              <button
                onClick={handleAddAnother}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  marginTop: 20,
                  padding: "14px 12px",
                  border: `1px dashed ${v1.inkFaint}`,
                  borderRadius: 10,
                  background: "transparent",
                  color: v1.inkMid,
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  cursor: "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
                Add another booth
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── BoothRow ────────────────────────────────────────────────────────────────
// One row per vendor. Booth name leads, mall + booth number subtitle.
// X-glyph at left (pin=mall / X=booth hierarchy).
function BoothRow({
  vendor,
  active,
  onClick,
}: {
  vendor:  Vendor;
  active:  boolean;
  onClick: () => void;
}) {
  const mallName     = vendor.mall?.name ?? "";
  const boothNumber  = vendor.booth_number;
  const subtitleBits = [mallName, boothNumber ? `Booth ${boothNumber}` : null].filter(Boolean);
  const subtitle     = subtitleBits.join(" · ");

  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        columnGap: 12,
        alignItems: "center",
        width: "100%",
        minHeight: 60,
        padding: "12px 8px",
        background: active ? "rgba(42,26,10,0.04)" : "transparent",
        border: "none",
        borderBottom: `1px solid ${v1.inkHairline}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.14s ease",
      }}
    >
      {/* X-glyph — booth identity */}
      <span
        aria-hidden="true"
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 22,
          color: active ? v1.inkPrimary : v1.inkMuted,
          lineHeight: 1,
          textAlign: "center",
        }}
      >
        ✕
      </span>

      {/* Booth name (leads) + mall/booth subtitle */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 17,
            color: v1.inkPrimary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {vendor.display_name}
        </span>
        {subtitle && (
          <span
            style={{
              fontFamily: FONT_SYS,
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Active checkmark */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          color: active ? v1.green : "transparent",
          fontSize: 15,
          fontFamily: FONT_SYS,
          fontWeight: 600,
          lineHeight: 1,
        }}
        aria-hidden={!active}
      >
        ✓
      </span>
    </button>
  );
}
