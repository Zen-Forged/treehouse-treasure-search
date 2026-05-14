// components/MallPickerChip.tsx
// Session 166 Arc 2.1 — Frame C mall picker primitive per
// docs/home-hero-design.md D10 + D11.
//
// Composition (D10 — left → right inline row):
//   - PinIcon:   Phosphor PiMapPinFill, 22px, color v2.accent.green (#285C3C)
//   - Mall name: Cormorant 22px weight 500, color v1.inkPrimary (#2A1E12),
//                letter-spacing 0.002em
//   - Chevron:   Phosphor PiCaretDown, 18px, color v2.text.secondary (#5C5246),
//                10px left margin
//
// No background, no border, no eyebrow. Single inline row. Identity-level
// serif anchoring the hero composition. Departs from MallStrip's small-caps
// eyebrow vocab on purpose (Frame C voice).
//
// Padding (D11):
//   - 22px top breathing room from hero bottom edge
//   - 18px horizontal page padding (matches project convention)
//   - 10px bottom breathing room before tile grid begins
//
// Pure presentation primitive — no internal state. Consumer owns the mall
// scope state + onTap behavior (typically opens MallSheet picker or routes
// to the map drawer).
//
// Consumers: app/home-hero-test (smoke route Arc 2.2), app/(tabs)/layout.tsx
// (production wiring Arc 3.1).

"use client";

import * as React from "react";
import { PiMapPinFill, PiCaretDown } from "react-icons/pi";
import { v1, v2, FONT_CORMORANT } from "@/lib/tokens";

interface MallPickerChipProps {
  mallName: string;
  onTap:    () => void;
}

const TOP_PADDING       = 22;
const HORIZ_PADDING     = 18;
const BOTTOM_PADDING    = 10;
const PIN_SIZE          = 22;
const NAME_FONT_SIZE    = 22;
const CHEVRON_SIZE      = 18;
const CHEVRON_LEFT_GAP  = 10;
const PIN_NAME_GAP      = 8;

export default function MallPickerChip({ mallName, onTap }: MallPickerChipProps) {
  return (
    <div
      style={{
        padding: `${TOP_PADDING}px ${HORIZ_PADDING}px ${BOTTOM_PADDING}px`,
      }}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={`Change location — current: ${mallName}`}
        style={{
          display:        "inline-flex",
          alignItems:     "center",
          background:     "transparent",
          border:         "none",
          padding:        0,
          cursor:         "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <PiMapPinFill
          size={PIN_SIZE}
          color={v2.accent.green}
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily:    FONT_CORMORANT,
            fontSize:      NAME_FONT_SIZE,
            fontWeight:    500,
            color:         v1.inkPrimary,
            letterSpacing: "0.002em",
            // 1.3 floor for Cormorant descender clearance per
            // feedback_lora_lineheight_minimum_for_clamp ✅ Promoted-via-memory
            // (Cormorant + Lora share the same descender geometry).
            lineHeight:    1.3,
            marginLeft:    PIN_NAME_GAP,
            textAlign:     "left",
          }}
        >
          {mallName}
        </span>
        <PiCaretDown
          size={CHEVRON_SIZE}
          color={v2.text.secondary}
          aria-hidden="true"
          style={{
            marginLeft: CHEVRON_LEFT_GAP,
            flexShrink: 0,
          }}
        />
      </button>
    </div>
  );
}
