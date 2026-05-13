// components/ShareBubble.tsx
//
// Session 159 — share airplane primitive for photo-overlay placement.
// David Q4 (session-159 opener): "Relocate the Share icon that's currently
// in the masthead to sit inside the image component. Stacked under the
// saved/leaf icon vertically. (this applies to find pages, and booth
// pages, but will no longer be available on the explore page)."
// David Q6: "Change the color of the share (airplane) icon to match the
// color of the Save leaf icon with the same bg color for the circle."
//
// The bubble matches the save/bookmark bubble vocabulary on each surface
// via the `variant` prop so the stacked pair reads as siblings:
//   - variant="frosted"  → matches /find/[id]'s heart bubble (frosted-paper
//                          rgba bg + blur + thin border). Color stays
//                          v1.inkPrimary by default; consumer can flip via
//                          `color` prop.
//   - variant="v2"       → matches <BookmarkBoothBubble> on /shelf/[slug]
//                          + /my-shelf BoothHero (v2.surface.warm solid +
//                          1px v2.border.light + v2.accent.green glyph).
//
// Geometry is 44×44 with a 22px airplane glyph (uses MastheadPaperAirplane
// at size=28 to compensate for its 18×18 bounding-box-in-24×24-viewBox
// shape — see MastheadPaperAirplane header for the bounding-box math).
//
// State semantics: stateless. Parent owns share-sheet open state + opens
// it via onClick. Mirrors BookmarkBoothBubble's pure-render contract so
// share/save bubbles compose identically on the photo overlay.

"use client";

import MastheadPaperAirplane from "./MastheadPaperAirplane";
import { v1, v2 } from "@/lib/tokens";

interface ShareBubbleProps {
  onClick:  (e: React.MouseEvent) => void;
  ariaLabel?: string;
  variant?: "frosted" | "v2";
}

export default function ShareBubble({
  onClick,
  ariaLabel = "Share",
  variant = "v2",
}: ShareBubbleProps) {
  const isFrosted = variant === "frosted";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width:  44,
        height: 44,
        borderRadius: 22,
        background: isFrosted ? "rgba(245,242,235,0.85)" : v2.surface.warm,
        backdropFilter:        isFrosted ? "blur(8px)" : undefined,
        WebkitBackdropFilter:  isFrosted ? "blur(8px)" : undefined,
        border: isFrosted ? "0.5px solid rgba(42,26,10,0.12)" : `1px solid ${v2.border.light}`,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <MastheadPaperAirplane
        size={28}
        color={isFrosted ? v1.inkPrimary : v2.accent.green}
      />
    </button>
  );
}
