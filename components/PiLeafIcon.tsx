// components/PiLeafIcon.tsx
// Inline SVG recreation of the PiLeaf (Phosphor Icons) leaf/sprout glyph.
// Used as the "Your Finds" tab icon throughout the ecosystem layer.
// strokeWidth and size are configurable to match lucide-react's API shape.

import React from "react";

interface PiLeafIconProps {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function PiLeafIcon({
  size = 21,
  strokeWidth = 1.7,
  style,
  className,
}: PiLeafIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth * (256 / 21)} // scale stroke to viewBox
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
    >
      {/*
        Phosphor "Leaf" regular path:
        A leaf shape curving from bottom-left stem up and around,
        plus a centre vein line. Matches the pi PiLeaf icon.
      */}
      <path d="M208,40c0,0-152,24-168,144c0,0,40-64,128-72" />
      <line x1="40" y1="216" x2="208" y2="40" />
    </svg>
  );
}
