// components/ui/SlimHeader.tsx
// Layer 2 primitive — entity-discriminated context block for sheets that
// need a "what am I looking at right now" header. Extracted from
// ShareSheet's 3 near-identical variants (SlimHeader / MallSlimHeader /
// FindSlimHeader at session 137) at session 149.
//
// Variants map to props as:
//   Booth (session 135): title + boothPill + contextRow + addressLine
//   Mall  (session 137): title + (no pill) + contextRow + addressLine
//   Find  (session 137): title (titleClamp=2) + boothPill + contextRow + addressLine
//
// Stack:
//   [Title (28px Cormorant, optional 2-line clamp)]
//   [Booth pill (optional, "BOOTH N" small-caps Inter)]
//   [Context row (optional, PiMapPin + label centered)]
//   [Address subtitle (optional, 12px Inter)]
//   [Section divider — always]
//
// v1 → v2 token migration applied at extraction:
//   FONT_LORA        → FONT_CORMORANT     (title + context row label)
//   FONT_SYS         → FONT_INTER          (booth pill + address)
//   v1.inkPrimary    → v2.text.primary    (title + context row label)
//   v1.inkMid        → v2.text.secondary  (pill text + glyph + address)
//   v1.inkHairline   → v2.border.light    (pill border + divider)
//   rgba(255,255,255,0.4) → v2.surface.card  (pill bg — frosted-glass
//                                             retire per session 132)
//
// Lora descender clearance rule (feedback_lora_lineheight_minimum_for_clamp,
// promoted session 107, 12+ cumulative firings): titles with WebkitLineClamp
// need lineHeight 1.3+ to keep g/j/p/y descenders inside the line-box.
// Unclamped titles use the session-135 calibrated 1.05 (no overflow clipping
// risk). Primitive applies the floor automatically based on titleClamp prop.

"use client";

import { PiMapPin } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";

export interface SlimHeaderProps {
  /** Main heading — Cormorant 28px 500. */
  title: string;
  /** When set, title is clamped to N lines via WebkitLineClamp and lineHeight
   * is raised to 1.3 for descender clearance. Omit for non-clamped titles
   * (Booth / Mall use unclamped 1.05). */
  titleClamp?: number;
  /** Optional "BOOTH N" pill below the title — small-caps Inter inside a
   * v2.surface.card pill with v2.border.light hairline. */
  boothPill?: string;
  /** Optional centered row with leading PiMapPin glyph (e.g., mall name,
   * vendor name). Pass label only — the primitive supplies the icon for
   * vocabulary consistency. */
  contextLabel?: string;
  /** Optional 3rd-tier subtitle (e.g., full street address, "Mall, City"
   * composite). */
  addressLine?: string;
}

export function SlimHeader({
  title,
  titleClamp,
  boothPill,
  contextLabel,
  addressLine,
}: SlimHeaderProps) {
  const clamped = typeof titleClamp === "number" && titleClamp > 0;

  return (
    <div style={{ paddingTop: 12, flexShrink: 0 }}>
      {/* Title */}
      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontWeight: 500,
          fontSize: 28,
          color: v2.text.primary,
          textAlign: "center",
          lineHeight: clamped ? 1.3 : 1.05,
          letterSpacing: "-0.015em",
          padding: "0 8px",
          ...(clamped
            ? {
                display: "-webkit-box",
                WebkitLineClamp: titleClamp,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }
            : null),
        }}
      >
        {title}
      </div>

      {/* Booth pill — small-caps "BOOTH N" */}
      {boothPill && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              padding: "7px 22px",
              border: `1px solid ${v2.border.light}`,
              borderRadius: 8,
              background: v2.surface.card,
              fontFamily: FONT_INTER,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: v2.text.secondary,
              textTransform: "uppercase",
            }}
          >
            BOOTH {boothPill}
          </div>
        </div>
      )}

      {/* Context row — PiMapPin + label */}
      {contextLabel && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, marginTop: 14 }}>
          <PiMapPin
            size={14}
            color={v2.text.secondary}
            style={{ marginTop: 3, flexShrink: 0 }}
            aria-hidden="true"
          />
          <span
            style={{
              fontFamily: FONT_CORMORANT,
              fontWeight: 500,
              fontSize: 16,
              color: v2.text.primary,
              lineHeight: 1.3,
            }}
          >
            {contextLabel}
          </span>
        </div>
      )}

      {/* Address subtitle */}
      {addressLine && (
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize: 12,
            color: v2.text.secondary,
            textAlign: "center",
            lineHeight: 1.4,
            marginTop: 4,
            padding: "0 12px",
          }}
        >
          {addressLine}
        </div>
      )}

      {/* Section divider — always present so the sheet body has a consistent
          boundary regardless of which optional rows are visible. */}
      <div style={{ height: 1, background: v2.border.light, marginTop: 18 }} />
    </div>
  );
}
