// components/PiLeafIcon.tsx
// Thin wrapper around react-icons/pi PiLeaf.
// Matches the lucide-react API shape (size, strokeWidth, style, className)
// so all existing usages continue to work without changes.

import { PiLeaf } from "react-icons/pi";

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
    <PiLeaf
      size={size}
      style={{
        ...(strokeWidth ? { strokeWidth } : {}),
        ...style,
      }}
      className={className}
    />
  );
}
