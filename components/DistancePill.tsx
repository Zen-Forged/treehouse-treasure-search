// components/DistancePill.tsx
// R17 Arc 1 — distance pill primitive (pure presentational).
//
// Reads as a postmark stamp paired with the postal eyebrow vocabulary
// already in use on the cartographic find card + post-it booth eyebrow.
// Visual locked at D6:
//   - Background: paper-warm  (#ede6d5)
//   - 1px ink-hairline border
//   - 999px radius (full pill)
//   - 3px × 10px padding
//   - sys-font 10px / 700 weight / 0.12em letter-spacing
//   - text-transform: uppercase
//   - color: ink-muted
//
// Copy locked at D7: `"X.Y MI"` minimal — Frame α. One decimal, "MI"
// suffix in small-caps. No glyph (D6) — pill stays decorative (D8).
//
// Renders nothing when miles === null (D15 mall-coords-missing OR
// useUserLocation status !== granted). The consumer doesn't branch.

"use client";

import * as React from "react";
import { v2, FONT_INTER } from "@/lib/tokens";

export interface DistancePillProps {
  /** Distance in miles (1-decimal). Renders nothing if null. */
  miles: number | null;
}

export default function DistancePill({ miles }: DistancePillProps) {
  if (miles == null) return null;

  return (
    <span
      style={{
        display:        "inline-block",
        background:     v2.surface.warm,
        border:         `1px solid ${v2.border.light}`,
        borderRadius:   999,
        padding:        "3px 10px",
        fontFamily:     FONT_INTER,
        fontSize:       10,
        fontWeight:     700,
        letterSpacing:  "0.12em",
        textTransform:  "uppercase",
        color:          v2.text.muted,
        whiteSpace:     "nowrap",
        lineHeight:     1.2,
      }}
    >
      {miles.toFixed(1)} MI
    </span>
  );
}
