// components/PiLeafIcon.tsx
// Thin wrapper around react-icons/pi PiLeafBold.
// Matches the lucide-react API shape (size, strokeWidth, style, className)
// so all existing usages continue to work without changes.
// Session 169 — Review Board #1 system-wide PiLeaf → PiLeafBold sweep.
// Component name kept as PiLeafIcon for callsite-import stability per
// feedback_user_facing_copy_scrub_skip_db_identifiers.

import { PiLeafBold } from "react-icons/pi";

interface PiLeafIconProps {
  size?: number;
  strokeWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function PiLeafIcon({
  size = 21,
  // react-icons uses a numeric strokeWidth via CSS var --react-icons-stroke-width
  // but PiLeaf is a filled/path icon so strokeWidth is not exposed the same way.
  // We pass it as stroke on the svg element via style override.
  strokeWidth,
  style,
  className,
}: PiLeafIconProps) {
  return (
    <PiLeafBold
      size={size}
      style={{
        ...(strokeWidth ? { strokeWidth } : {}),
        ...style,
      }}
      className={className}
    />
  );
}
