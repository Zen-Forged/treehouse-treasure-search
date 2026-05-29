// components/share-shelf/brandMarks.tsx
//
// Session 201 Arc 3 — shared brand-signature marks for the Share My Shelf
// card set. Two recurring elements make the 5-card Story sequence + Feed
// companion read as ONE designed sequence (not 5 cards sharing a palette),
// per the Shape B brand-signature-system pick:
//
//   <ShelfLeafBubble>  — the round leaf corner signature. Lived inline on
//     StoryFindCard + FeedCard (top-right); extracted here + adopted on the
//     hero + CTA so every card carries the same corner mark.
//   <ShelfBrandFooter> — the "Treehouse Finds" wordmark lockup centered at
//     the card's bottom edge, so the wordmark is present on every slide
//     (was buried on the CTA card alone before this pass). Wordmark-only by
//     design — the leaf glyph is carried by ShelfLeafBubble, so the full
//     leaf+wordmark lockup is distributed across each card (corner + footer)
//     rather than doubling the leaf.
//
// tone "onDark"  = cream marks (green hero / photo find/feed card bgs)
// tone "onLight" = green marks (cream CTA card bg)
//
// All sizes are absolute px calibrated to the 1080-wide capture canvas
// (≈7.7× the V2 mockup scale). FONT_NUMERAL = Times New Roman, the
// canonical wordmark face (matches StickyMasthead + the CTA card lockup).

"use client";

import { PiLeafFill } from "react-icons/pi";
import { FONT_NUMERAL, v2 } from "@/lib/tokens";

export type ShelfMarkTone = "onDark" | "onLight";

/** Round leaf corner signature. Present top-right on every card. */
export function ShelfLeafBubble({
  size = 80,
  tone = "onDark",
}: {
  size?: number;
  tone?: ShelfMarkTone;
}) {
  const bubbleBg  = tone === "onDark" ? v2.surface.card : v2.accent.green;
  const leafColor = tone === "onDark" ? v2.accent.green : v2.surface.card;
  return (
    <div
      style={{
        width:          size,
        height:         size,
        borderRadius:   size / 2,
        background:     bubbleBg,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        flexShrink:     0,
      }}
    >
      <PiLeafFill size={Math.round(size * 0.6)} color={leafColor} />
    </div>
  );
}

/** "Treehouse Finds" wordmark lockup, centered at the card bottom edge. */
export function ShelfBrandFooter({
  tone = "onDark",
}: {
  tone?: ShelfMarkTone;
}) {
  const color = tone === "onDark" ? "rgba(255, 252, 245, 0.90)" : v2.accent.green;
  return (
    <div
      style={{
        fontFamily:    FONT_NUMERAL,
        fontWeight:    600,
        fontSize:      32,
        letterSpacing: "0.05em",
        textAlign:     "center",
        color,
      }}
    >
      Treehouse Finds
    </div>
  );
}
