// components/DistancePill.tsx
// R17 Arc 1 — distance pill primitive (pure presentational).
//
// Visual locked at D6, revised session 158 dial F to green-on-green
// treatment matching the V1 mockup. Reads as a "distance is a brand
// affordance" pill — soft green tint bg + saturated green text — rather
// than a neutral postmark stamp.
//   - Background: rgba(46,86,57,0.10) — translucent v2.accent.green
//   - No border — solid color is the only signal
//   - 999px radius (full pill)
//   - 3px × 10px padding
//   - Inter 10px / 700 weight / 0.12em letter-spacing
//   - text-transform: uppercase
//   - color: v2.accent.green
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
        background:     "rgba(46,86,57,0.10)",
        borderRadius:   999,
        padding:        "3px 10px",
        fontFamily:     FONT_INTER,
        fontSize:       10,
        fontWeight:     700,
        letterSpacing:  "0.12em",
        textTransform:  "uppercase",
        color:          v2.accent.green,
        whiteSpace:     "nowrap",
        lineHeight:     1.2,
      }}
    >
      {miles.toFixed(1)} MI
    </span>
  );
}
