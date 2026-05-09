// components/MastheadPaperAirplane.tsx
// Shared paper-airplane glyph used by every share affordance in the
// masthead right slot. Single source of truth replacing 3 prior
// implementations:
//   - /shelf/[slug]: private MastheadPaperAirplane fn (custom SVG)
//   - /(tabs)/layout.tsx Home: inline custom SVG (session 137 commit 5)
//   - /find/[id]: <Send> from lucide-react (session 78)
//
// Session 137 follow-up — the three implementations diverged on icon
// scale: the custom SVG paths fit an 18×18 bounding box inside the
// 24×24 viewBox, while Lucide Send fits a 20×20 bounding box. At the
// same render size the custom-SVG airplane appeared ~11% smaller than
// the Lucide one. David caught the inconsistency on iPhone QA: Home +
// /shelf airplane (custom SVG) read as smaller than /find airplane
// (Lucide). Shape A pick — match the bigger /find size, retain the
// project-canonical custom paths.
//
// Default size is 24 so the airplane's effective rendered size (~18px,
// from the 18×18 path bounding box * 24/24 viewBox) matches Lucide
// Send's effective render at width=22 (~18.3px from its 20×20 box).
// Callers don't need to think about the bounding-box math; the default
// is calibrated for the 44×44 iconBubble masthead context.

"use client";

import { v1 } from "@/lib/tokens";

interface MastheadPaperAirplaneProps {
  size?:        number;
  color?:       string;
  strokeWidth?: number;
}

export default function MastheadPaperAirplane({
  size        = 24,
  color       = v1.green,
  strokeWidth = 1.7,
}: MastheadPaperAirplaneProps = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}
