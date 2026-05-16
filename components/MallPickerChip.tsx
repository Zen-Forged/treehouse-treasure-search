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
import { CHIP_TOP, CHIP_Z } from "@/lib/chromeTokens";

interface MallPickerChipProps {
  mallName: string;
  onTap:    () => void;
}

// Session 166 dial 6 (post-dial-3 iPhone QA round 3) — TOP_PADDING 22 → 12,
// BOTTOM_PADDING 10 → 6 per David's "reduce the padding on the top and the
// bottom of the mall chip selector." Reverses session-164 design-record D11
// values (22/18/10) within bounded scope per
// feedback_within_session_design_record_reversal ✅ Promoted-via-memory.
// Tightens the chip strip from 62px tall to 48px (-14px), giving the feed
// more vertical real estate when chip is sticky-pinned.
const TOP_PADDING       = 12;
const HORIZ_PADDING     = 18;
const BOTTOM_PADDING    = 6;
const PIN_SIZE          = 22;
const NAME_FONT_SIZE    = 22;
const CHEVRON_SIZE      = 18;
const CHEVRON_LEFT_GAP  = 10;
const PIN_NAME_GAP      = 8;

// Session 166 dial 2 — chip becomes position:sticky.
// Session 167 chrome-unification — sticky-top changes from STICKY_THIN_HEIGHT
// (HomeHero's collapsed bottom edge) to CHIP_TOP (= MASTHEAD_HEIGHT - 30).
// Chip now sticky-pins 30px ABOVE the masthead bottom edge with z-index above
// the hero strip, OVERLAYING the bottom 30px of the photo to "trim" it per
// David's verbatim "scroll over the top of the bottom portion of the hero
// image to trim the bottom of the photo." See chrome-unification-design D5.
//
// Height = TOP_PADDING + max(PIN_SIZE, NAME_FONT_SIZE * 1.3, CHEVRON_SIZE)
//        + BOTTOM_PADDING = 12 + 29 + 6 = 47px. Rounded to 48 for safe
// integer arithmetic in downstream consumers (e.g. MallMapDrawer's top calc).
export const CHIP_VISIBLE_HEIGHT_PX = 48;

export default function MallPickerChip({ mallName, onTap }: MallPickerChipProps) {
  return (
    <div
      style={{
        padding:    `${TOP_PADDING}px ${HORIZ_PADDING}px ${BOTTOM_PADDING}px`,
        // Sticky-pinned 30px above masthead bottom edge, with z-index above
        // hero strip. Chip's body extends downward from CHIP_TOP, occluding
        // the bottom 30px of the photo behind it. Upward box-shadow casts a
        // subtle shadow ONTO the photo it covers, reinforcing the "layered
        // over" reading. Per chrome-unification design D5 + D15.
        position:   "sticky",
        top:        CHIP_TOP,
        zIndex:     CHIP_Z,
        // (tabs)/-surfaces tier so seam between feed-scrolling-under-chip
        // and the chip strip itself stays visually continuous below the
        // chip's body. Chip sits on v2.bg.tabs cream.
        background: v2.bg.tabs,
        // Upward box-shadow per D15 — the chip is layered ABOVE the photo
        // (not below the photo) so its shadow casts UP onto the photo it's
        // covering, not DOWN onto content below.
        boxShadow:  "0 -2px 8px rgba(42,26,10,0.10)",
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
