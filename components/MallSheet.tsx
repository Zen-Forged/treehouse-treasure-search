// components/MallSheet.tsx
// MallSheet — canonical mall-selection bottom sheet for Treehouse v1.1i.
//
// Committed in docs/design-system.md §MallSheet (session 20). First consumer
// is app/page.tsx (Feed); will be reused by /post and /vendor-request in a
// future sprint.
//
// Props contract (locked in spec):
//
//   open:         boolean
//   onClose:      () => void
//   malls:        Mall[]
//   activeMallId: string | null          // null == All is active
//   onSelect:     (mallId: string | null) => void
//   findCounts?:  Record<string, number> // optional per-mall counts
//
// Selection invokes onSelect and the consumer is responsible for persistence
// (safeStorage) and calling onClose. This keeps the sheet stateless w.r.t.
// which mall is "chosen" — it just renders what the consumer tells it.
//
// Structure (top-to-bottom):
//   1. Backdrop (tap to dismiss)
//   2. Sheet container (paperCream, 20px top radius, shadow)
//   3. Drag handle (visual only — backdrop tap does the dismiss)
//   4. Header "Choose a mall" IM Fell 22px
//   5. Subhead "Kentucky & Southern Indiana — tap to filter the feed." IM Fell italic 14px muted
//   6. Diamond divider
//   7. All malls row — no pin glyph, italic label, active-underline on active
//   8. Mall rows — pin glyph + IM Fell 18px name + system-ui 13px city + right-aligned find-count
//
// The active state (whether All or a specific mall) gets a 1px hairline
// underline on its label in inkPrimary, matching the Booth page ViewToggle's
// active treatment. First cross-cutting use of the text-link-with-hairline
// active pattern beyond Booth.

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ── Pin glyph — matches Find Detail / Find Map (pin = mall, locked v1.1g) ─────
function PinGlyph({ size = 18, muted = false }: { size?: number; muted?: boolean }) {
  const stroke = muted ? v1.inkMuted : v1.inkPrimary;
  const fill   = muted ? v1.inkMuted : v1.inkPrimary;
  return (
    <svg
      width={size}
      height={size * (22 / 18)}
      viewBox="0 0 18 22"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
        stroke={stroke}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={fill} />
    </svg>
  );
}

// ── Sort helper: All first, then alphabetical by name ─────────────────────────
function sortMalls(malls: Mall[]): Mall[] {
  return [...malls].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export interface MallSheetProps {
  open:         boolean;
  onClose:      () => void;
  malls:        Mall[];
  activeMallId: string | null;
  onSelect:     (mallId: string | null) => void;
  findCounts?:  Record<string, number>;
  // Per-consumer unit label for the count column. Defaults to "find" / "finds".
  // Booths passes { singular: "booth", plural: "booths" }; Find Map passes
  // { singular: "saved find", plural: "saved finds" }.
  countUnit?:   { singular: string; plural: string };
}

export default function MallSheet({
  open,
  onClose,
  malls,
  activeMallId,
  onSelect,
  findCounts,
  countUnit = { singular: "find", plural: "finds" },
}: MallSheetProps) {
  const sorted = sortMalls(malls);

  // Lock body scroll while the sheet is open so the page behind doesn't jitter
  // when the user drags within the sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Total find count across all malls (for the "All malls" row).
  const totalFindCount = findCounts
    ? Object.values(findCounts).reduce((sum, n) => sum + n, 0)
    : null;

  // Number of malls with at least one live find — used for the beta-era
  // "N mall live · more soon" copy. Defaults to all malls if no counts passed.
  const liveMallCount = findCounts
    ? Object.values(findCounts).filter((n) => n > 0).length
    : malls.length;

  const allCountLabel = totalFindCount !== null
    ? liveMallCount <= 1
      ? `${liveMallCount} mall live · more soon`
      : `${totalFindCount} ${countUnit.plural} · ${liveMallCount} malls`
    : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── 1. Backdrop ─────────────────────────────────────────────── */}
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

          {/* ── 2. Sheet container ────────────────────────────────────────
              Centering: use `left: 0, right: 0, margin: 0 auto, maxWidth: 430`
              rather than `left: 50% + translateX(-50%)`. Framer Motion's `y`
              animation sets `transform` on the element and wipes out the
              static `translateX(-50%)` mid-animation, which was pinning the
              sheet to the right half of the viewport (see DECISION_GATE Tech
              Rules: never combine a centering transform with a Framer y
              animation on the same element). The margin-auto pattern is
              transform-free and matches the 430px column-centering used by
              every page wrapper in the app. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose a mall"
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
            {/* ── 3. Drag handle ────────────────────────────────────────── */}
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

            {/* ── 4. Header ─────────────────────────────────────────────── */}
            <div style={{ padding: "10px 22px 2px", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontSize: 22,
                  color: v1.inkPrimary,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.2,
                }}
              >
                Choose a mall
              </div>
            </div>

            {/* ── 5. Subhead ────────────────────────────────────────────── */}
            <div style={{ padding: "4px 22px 14px", flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkMuted,
                  lineHeight: 1.5,
                }}
              >
                Kentucky & Southern Indiana — tap to filter the feed.
              </div>
            </div>

            {/* ── 6. Diamond divider ────────────────────────────────────── */}
            <div
              style={{
                padding: "4px 22px 12px",
                flexShrink: 0,
              }}
            >
              {/* v1.1j — diamond ornament retired; plain hairline */}
              <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
            </div>

            {/* ── Scrollable rows ───────────────────────────────────────── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "0 22px 22px",
              }}
            >
              {/* ── 7. All malls row (no pin glyph, italic, special) ───── */}
              <MallRow
                active={activeMallId === null}
                onClick={() => onSelect(null)}
                leftGlyph={null}
                label={
                  <span
                    style={{
                      fontFamily: FONT_IM_FELL,
                      fontStyle: "italic",
                      fontSize: 19,
                      color: v1.inkPrimary,
                      lineHeight: 1.25,
                      letterSpacing: "-0.005em",
                      display: "inline-block",
                      borderBottom:
                        activeMallId === null
                          ? `1px solid ${v1.inkPrimary}`
                          : "1px solid transparent",
                      paddingBottom: 1,
                    }}
                  >
                    All malls
                  </span>
                }
                subLabel={null}
                rightLabel={allCountLabel}
                subRightLabel={null}
                isAllRow
              />

              {/* ── 8. Mall rows ───────────────────────────────────────── */}
              {sorted.map((mall) => {
                const isActive = activeMallId === mall.id;
                const count    = findCounts?.[mall.id];
                const countLabel =
                  typeof count === "number"
                    ? count > 0
                      ? `${count} ${count === 1 ? countUnit.singular : countUnit.plural}`
                      : "—"
                    : "—";
                const cityState = [mall.city, mall.state]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <MallRow
                    key={mall.id}
                    active={isActive}
                    onClick={() => onSelect(mall.id)}
                    leftGlyph={<PinGlyph size={18} muted={!isActive} />}
                    label={
                      <span
                        style={{
                          fontFamily: FONT_IM_FELL,
                          fontSize: 18,
                          color: v1.inkPrimary,
                          lineHeight: 1.25,
                          letterSpacing: "-0.005em",
                          display: "inline-block",
                          borderBottom: isActive
                            ? `1px solid ${v1.inkPrimary}`
                            : "1px solid transparent",
                          paddingBottom: 1,
                        }}
                      >
                        {mall.name}
                      </span>
                    }
                    subLabel={
                      cityState ? (
                        <span
                          style={{
                            fontFamily: FONT_SYS,
                            fontSize: 13,
                            color: v1.inkMuted,
                            lineHeight: 1.4,
                          }}
                        >
                          {cityState}
                        </span>
                      ) : null
                    }
                    rightLabel={countLabel}
                    subRightLabel={null}
                  />
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── MallRow primitive ─────────────────────────────────────────────────────────
// Single row inside the sheet. Takes care of layout, active tint, hairline
// bottom border, and tap target sizing. Grid is 24px auto 1fr auto for normal
// rows, or 1fr auto for the All row (no pin column).
function MallRow({
  active,
  onClick,
  leftGlyph,
  label,
  subLabel,
  rightLabel,
  subRightLabel,
  isAllRow = false,
}: {
  active:         boolean;
  onClick:        () => void;
  leftGlyph:      React.ReactNode | null;
  label:          React.ReactNode;
  subLabel:       React.ReactNode | null;
  rightLabel:     string | null;
  subRightLabel:  string | null;
  isAllRow?:      boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: isAllRow ? "1fr auto" : "24px 1fr auto",
        columnGap: 14,
        alignItems: "center",
        width: "100%",
        minHeight: 56,
        padding: "12px 10px",
        background: active ? "rgba(42,26,10,0.03)" : "transparent",
        border: "none",
        borderBottom: `1px solid ${v1.inkHairline}`,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        transition: "background 0.14s ease",
      }}
    >
      {/* Left glyph column (skipped on All row) */}
      {!isAllRow && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {leftGlyph}
        </div>
      )}

      {/* Middle: label + optional subLabel stacked */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        {label}
        {subLabel}
      </div>

      {/* Right: optional find-count */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        {rightLabel && (
          <span
            style={{
              fontFamily: FONT_SYS,
              fontStyle: "italic",
              fontSize: 12.5,
              color: v1.inkMuted,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {rightLabel}
          </span>
        )}
        {subRightLabel && (
          <span
            style={{
              fontFamily: FONT_SYS,
              fontSize: 11,
              color: v1.inkFaint,
              lineHeight: 1.4,
            }}
          >
            {subRightLabel}
          </span>
        )}
      </div>
    </button>
  );
}
