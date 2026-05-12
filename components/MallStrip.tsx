// components/MallStrip.tsx
// Session 154 — persistent thin location strip below the masthead on Home.
// Replaces the chunky <RichPostcardMallCard> mount at top of Home.
//
// Design record: docs/home-chrome-restructure-design.md D1 + D10 + D11.
//
// Why this primitive exists:
//   David's session-154 tension surfaced: "the mall card on the homepage just
//   takes up too much space. It also loses context once you start scrolling
//   so there is no way to know where you're at unless you scroll to the top."
//   Resolved by retiring the chunky card entirely + adopting a thin strip
//   that's always visible during scroll (position: fixed below masthead).
//
//   Reference scan: FB Marketplace literal — top of FB Marketplace is just
//   "Within X miles of {ZIP}" as a thin clickable text + radius-slider drawer
//   on tap. Strip is the FB Marketplace pattern adapted to Treehouse vocabulary
//   (mall name instead of radius; leaf glyph instead of pin; v2 paper-cream
//   surface instead of generic FB white).
//
// Reverses session 120 R10 V3.1 lock (rich postcard with photo + 22px name +
// address + dashed-divider pill). The chunky card's vertical cost (~140-180px)
// was real; this strip is 40px. Photo + address retire entirely — surfaced as
// Tier B "Mall Details sheet" headroom for a future ask. Per
// feedback_surface_locked_design_reversals (~56th cumulative firing).
//
// Pure presentation primitive — NO internal state, NO data fetching. Consumer
// (<HomeChrome>) owns drawer open state, scope hook, analytics fire. MallStrip
// just renders + delegates onTap.
//
// Tap target: full strip width. <button> element so role + keyboard activation
// land for free.
//
// Position contract: <MallStrip> renders position:fixed at top:MASTHEAD_HEIGHT.
// Consumer must reserve padding-top: MASTHEAD_HEIGHT + 40px on page body so
// content doesn't underlay the strip.

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { PiLeaf, PiCaretDown } from "react-icons/pi";
import { v2, FONT_LORA } from "@/lib/tokens";
import { MASTHEAD_HEIGHT } from "./StickyMasthead";
import type { Mall } from "@/types/treehouse";

// Same shape as RichPostcardMallCard's MallScope but trimmed to the fields
// MallStrip actually reads (name only for display; id/slug for analytics
// payload via the consumer). When RichPostcardMallCard retires in Arc 4 (per
// design record), this is the surviving definition; Arc 4 cleanup may
// promote it to types/treehouse.ts if a 2nd consumer emerges.
export type MallStripScope =
  | Pick<Mall, "id" | "slug" | "name">
  | "all-kentucky";

interface MallStripProps {
  mall:   MallStripScope;
  /**
   * Drawer open state. Drives chevron rotation 0° → 180° via CSS transition
   * (200ms). MallStrip doesn't OWN the state — consumer toggles it; primitive
   * just reads.
   */
  isOpen: boolean;
  onTap:  () => void;
}

// Measure-and-shrink bounds for the mall name. Long names step down 1px
// at a time until the rendered width fits inside the strip's available row.
// Same primitive as session 116 PostcardMallCard + RichPostcardMallCard.
// Min font 13px per design record (above the 10px project floor).
const NAME_FONT_MAX = 16;
const NAME_FONT_MIN = 13;

// Exported for <MallMapDrawer>'s top: MASTHEAD_HEIGHT + STRIP_HEIGHT calc
// (session 155 D-Reversal-2 iteration 2 — drawer slides up to strip's bottom
// edge, not masthead's bottom edge; strip stays sticky-visible above).
export const STRIP_HEIGHT = 40;
const STRIP_PADDING = 18;
const STRIP_GAP     = 10;

export default function MallStrip({ mall, isOpen, onTap }: MallStripProps) {
  const isAllKentucky = mall === "all-kentucky";
  const name = isAllKentucky ? "All Kentucky locations" : mall.name;

  // Measure-and-shrink. Render initially at MAX, then step down by 1px
  // until the inner row fits or we hit MIN. useLayoutEffect runs before
  // paint so the shrink resolves synchronously (no flash of overflow).
  const nameRef = useRef<HTMLSpanElement>(null);
  const rowRef  = useRef<HTMLDivElement>(null);
  const [nameSize, setNameSize] = useState(NAME_FONT_MAX);

  useLayoutEffect(() => {
    if (!nameRef.current || !rowRef.current) return;
    setNameSize(NAME_FONT_MAX);
    let size = NAME_FONT_MAX;
    // The row has icon (16px) + gap + name + gap + chevron (14px) +
    // 2*padding. Name's available width = row width - that overhead.
    // Easier than computing: shrink until scrollWidth fits clientWidth.
    while (size > NAME_FONT_MIN) {
      nameRef.current.style.fontSize = `${size}px`;
      if (nameRef.current.scrollWidth <= nameRef.current.clientWidth) break;
      size -= 1;
    }
    setNameSize(size);
  }, [name]);

  return (
    <button
      type="button"
      onClick={onTap}
      aria-expanded={isOpen}
      aria-label={`${name} — ${isOpen ? "close map" : "open map"}`}
      style={{
        position:    "fixed",
        top:         MASTHEAD_HEIGHT,
        left:        "50%",
        transform:   "translateX(-50%)",
        width:       "100%",
        maxWidth:    430,
        height:      STRIP_HEIGHT,
        zIndex:      39, // Just below masthead z-40 so it doesn't overlay the wordmark
        background:  v2.surface.warm,
        borderTop:   "none",
        borderBottom: `1px solid ${v2.border.light}`,
        borderLeft:  "none",
        borderRight: "none",
        padding:     `0 ${STRIP_PADDING}px`,
        display:     "flex",
        alignItems:  "center",
        gap:         STRIP_GAP,
        cursor:      "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        ref={rowRef}
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        STRIP_GAP,
          flex:       1,
          minWidth:   0, // Lets the name truncate inside flex
        }}
      >
        <PiLeaf size={16} color={v2.text.secondary} aria-hidden="true" />
        <span
          ref={nameRef}
          style={{
            fontFamily:  FONT_LORA,
            fontSize:    nameSize,
            fontWeight:  500,
            // 1.3 floor for descender clearance — feedback_lora_lineheight_minimum_for_clamp.
            lineHeight:  1.3,
            color:       v2.text.primary,
            flex:        1,
            minWidth:    0,
            whiteSpace:  "nowrap",
            overflow:    "hidden",
            textOverflow:"ellipsis",
            textAlign:   "left",
          }}
        >
          {name}
        </span>
      </div>
      <PiCaretDown
        size={14}
        color={v2.text.secondary}
        aria-hidden="true"
        style={{
          transition: "transform 200ms ease",
          transform:  isOpen ? "rotate(180deg)" : "rotate(0deg)",
          flexShrink: 0,
        }}
      />
    </button>
  );
}
