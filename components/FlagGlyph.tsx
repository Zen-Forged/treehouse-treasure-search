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
//
// Session 160 — David iPhone QA Finding 5 redirect: PiLeaf Regular reads
// at ≈Lucide strokeWidth 1.0–1.4 (per session 97 fingerprint), but the
// paired airplane bubble on /find/[id] photo uses MastheadPaperAirplane
// at strokeWidth 1.7. New optional `weight: "regular" | "bold"` prop
// lets callsites opt INTO PiLeafBold (≈Lucide 2.0, slightly overshoots
// 1.7 but in the right direction — closest available Phosphor variant).
// Default WAS "regular" so BottomNav Saved tab + feed masonry tile +
// /flagged tile remained at the session-97 calibration; /find/[id] photo
// bubble opted in via weight="bold" to visually match the airplane.
//
// Session 169 — David Review Board #1: "update all PiLeaf instances to
// the bold variant." Default flips "regular" → "bold" so EVERY FlagGlyph
// consumer renders PiLeafBold by default; explicit callsites (incl. the
// session-160 /find/[id] photo opt-in) stay unchanged. Fully promotes
// the session-160 bounded local revival to system-wide canonical, per
// `feedback_surface_locked_design_reversals` — session 97 project-wide
// retirement + session 160 bounded local revival converge on system-wide
// PiLeafBold canonical. Saved-state PiLeafFill is unchanged (filled =
// no stroke concern). Paired with direct PiLeaf → PiLeafBold swaps at 8
// non-FlagGlyph callsites in the same commit (HomeFeedTile +
// SavedFindRow + SavedMallCardV2 + BottomNav + my-shelf empty state +
// TreehouseMap LeafBubblePin + PiLeafIcon wrapper + ShareSheet footer
// disclaimer).

import * as React from "react";
import { PiLeaf, PiLeafBold, PiLeafFill } from "react-icons/pi";

interface Props {
  size?:        number;
  strokeWidth?: number;
  style?:       React.CSSProperties;
  /**
   * Phosphor weight variant for the unfilled (saved=false) state.
   * Default "bold" (session 169 system-wide flip) — PiLeafBold (heavier,
   * matches Lucide strokeWidth ≈2.0 visually). Opt-out via "regular" —
   * PiLeaf (kept available for any future thin-leaf use case). Filled
   * state ignores this; saved bubbles always render PiLeafFill.
   */
  weight?: "regular" | "bold";
}

export default function FlagGlyph({
  size = 20,
  style,
  weight = "bold",
}: Props) {
  const fillProp  = style?.fill;
  const isFilled  = !!fillProp && fillProp !== "none";
  // Session 160 — when weight="bold" AND outline state, swap to PiLeafBold.
  // PiLeafFill stays for the saved state regardless of weight (solid green;
  // no stroke matching needed since it's filled, not outlined).
  const OutlineIcon = weight === "bold" ? PiLeafBold : PiLeaf;
  const Icon        = isFilled ? PiLeafFill : OutlineIcon;

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
