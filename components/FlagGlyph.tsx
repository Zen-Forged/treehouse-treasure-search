// components/FlagGlyph.tsx
// Save-state glyph — rendered as a leaf (PiLeaf / PiLeafFill from
// react-icons/pi). Session 89: visual swapped from the chevron-cut flag
// (session 61) to a leaf to reinforce the brand vocabulary that already
// runs through Treehouse Finds (paper, parchment, organic forms).
//
// File + component name kept as `FlagGlyph` so callsite imports stay
// unchanged — internal identifier per the user-facing-copy-scrub rule
// (memory: feedback_user_facing_copy_scrub_skip_db_identifiers.md).
// User-visible labels move to "Save / Saved / Unsave" in callsites.
//
// Drop-in API: same `size` + `strokeWidth` + `style` props. Saved state
// is detected from `style.fill` — when callsites pass a non-"none" fill
// (typically `v1.green`), we render `PiLeafFill`. Otherwise the outline
// `PiLeaf` is used. `strokeWidth` is preserved in the prop type for
// caller compatibility but Phosphor icons ignore it (their stroke is
// baked into the path geometry).
//
// Used in: BottomNav Saved tab, feed masonry tile, /flagged tile,
// /find/[id] photo bubble.

import * as React from "react";
import { PiLeafBold, PiLeafFill } from "react-icons/pi";

interface Props {
  size?:        number;
  strokeWidth?: number;
  style?:       React.CSSProperties;
}

export default function FlagGlyph({
  size = 17,
  style,
}: Props) {
  const fillProp  = style?.fill;
  const isFilled  = !!fillProp && fillProp !== "none";
  // Session 89 (iPhone QA #1) — PiLeaf → PiLeafBold for the unsaved state
  // so the leaf's outline weight matches the BottomNav Home icon's
  // strokeWidth 2.0. PiLeafFill stays for the saved state (solid green;
  // no stroke matching needed since it's filled, not outlined).
  const Icon      = isFilled ? PiLeafFill : PiLeafBold;

  // Phosphor icons fill from `color`. Strip `fill` from the forwarded
  // style — leaving it on the wrapper would cascade to descendant SVG
  // children and override the icon's intrinsic styling.
  const wrapperStyle: React.CSSProperties = { ...style };
  delete (wrapperStyle as { fill?: string }).fill;

  return (
    <Icon
      size={size}
      style={wrapperStyle}
      aria-hidden="true"
    />
  );
}
