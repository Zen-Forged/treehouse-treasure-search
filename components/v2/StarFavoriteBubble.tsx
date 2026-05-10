// components/v2/StarFavoriteBubble.tsx
//
// v2 Arc 1.2 — Mall-tier engagement affordance per the 3-tier engagement+share
// lattice (session 137 project memory + extended in v2 migration session 138).
// 44×44 bubble; mirrors <BookmarkBoothBubble> shape so save-bubble and
// favorite-bubble feel like siblings across the lattice.
//
// Currently dormant — no consumer as of session 139 Arc 1.2.5. ★ Favorite
// Mall retired on Saved page per Q1 (a) reversal of session-138 Q6 (a);
// next consumer is Home + Map's RichPostcardMallCard in v2 Arc 5
// (/map migration). Kept in tree because Arc 5 will wire it verbatim.
//
// localStorage-only persistence (D5 (a)) — hook wiring lands in Arc 1.3
// via useShopperFavoriteMalls. This component is presentational only.
"use client";

import { v2 } from "@/lib/tokens";

interface StarFavoriteBubbleProps {
  size?: number;
  isFavorite: boolean;
  onToggle: () => void;
}

export default function StarFavoriteBubble({
  size = 42,
  isFavorite,
  onToggle,
}: StarFavoriteBubbleProps) {
  const glyphSize = Math.round(size * 0.52);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "Unfavorite this mall" : "Favorite this mall"}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: isFavorite ? v2.accent.greenSoft : v2.surface.warm,
        border: `1px solid ${isFavorite ? v2.accent.green : v2.border.light}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: v2.accent.green,
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        transition: "background-color 160ms ease, border-color 160ms ease",
      }}
    >
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 1.5}
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}
