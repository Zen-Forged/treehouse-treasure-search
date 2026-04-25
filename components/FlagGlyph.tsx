// components/FlagGlyph.tsx
// Save-state glyph — rectangular flag on a pole with a chevron-cut right edge.
// Session 61, Variant B from docs/mockups/save-glyph-v1.html.
//
// Drop-in replacement for Lucide's <Pin>/<Heart>: same `size` + `strokeWidth`
// + `style` props, uses `currentColor` for stroke so inline `style.color`
// resolves the stroke (the same pattern Lucide icons use). Inline `style.fill`
// overrides the default `fill="none"` for saved-state filling.
//
// Used in: feed masonry tile, Find Detail photo bubble, Find Map saved-tile
// badge, and BottomNav Find Map tab.

import * as React from "react";

interface Props {
  size?:        number;
  strokeWidth?: number;
  style?:       React.CSSProperties;
}

export default function FlagGlyph({
  size = 17,
  strokeWidth = 1.7,
  style,
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {/* Two elements so saved-state fill renders cleanly:
            - line = pole (strokes only; never fills since lines have no
              interior)
            - path = chevron-cut flag (closed → fills when style.fill is set)
          Callsites pass strokeWidth={1.7} regardless of saved state so the
          pole stays visible; saved/unsaved differ via color + fill only. */}
      <line x1="4" y1="22" x2="4" y2="4" />
      <path d="M4 4h13l-2 4 2 4H4z" />
    </svg>
  );
}
