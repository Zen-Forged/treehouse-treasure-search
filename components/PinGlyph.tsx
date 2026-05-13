// components/PinGlyph.tsx
// Custom location-pin glyph — teardrop outline with a filled center dot.
// Extracted from BoothPage's MallBlock inline SVG (session 128, v2 Arc 4.3)
// on the 2nd-consumer surface: session 157 added MallStrip as a second
// consumer (replaces the v2 PiLeaf eyebrow on Home's mall strip per
// David's "use the location marker from /shelf" call). Extraction follows
// the project convention of promoting inline SVGs to standalone components
// only when a second consumer appears (no premature abstraction).
//
// Geometry preserved from BoothPage's original: 18×22 viewBox, classic
// teardrop with 6.8 unit height-to-width ratio (so size 18 → renders at
// 18w × 22h on screen). The optional color prop lets the strip eyebrow
// pass v2.text.secondary (muted chrome voice) while BoothPage MallBlock
// keeps its default v2.text.primary (anchor identity voice).

"use client";

import { v2 } from "@/lib/tokens";

interface PinGlyphProps {
  size?:  number;
  /**
   * Stroke + center-dot color. Defaults to v2.text.primary (matches the
   * MallBlock anchor-identity voice). MallStrip passes v2.text.secondary
   * to match the strip's muted chrome treatment.
   */
  color?: string;
}

export default function PinGlyph({
  size = 18,
  color,
}: PinGlyphProps = {}) {
  const c = color ?? v2.text.primary;
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
        stroke={c}
        strokeWidth="1.3"
        fill="none"
      />
      <circle cx="9" cy="8.3" r="2" fill={c} />
    </svg>
  );
}
