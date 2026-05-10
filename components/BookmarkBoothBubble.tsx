// components/BookmarkBoothBubble.tsx
//
// v2 Arc 4.1 — Booth-tier 🔖 engagement bubble per the 3-tier engagement+share
// lattice (session 137 project memory + extended in v2 migration session 138).
// Mirrors v2 HomeFeedTile heart bubble shape so booth-bookmark + find-save
// feel like siblings across the lattice (constant bg + border, icon weight
// shifts on state via Phosphor PiBookmarkSimpleFill / PiBookmarkSimple pair).
//
// Verbal mapping established session 67 (preserved across v2 migration):
//   <FlagGlyph>            → "save / flag a find"  (find-tier, v1; v2 swaps to PiLeaf in HomeFeedTile)
//   <BookmarkBoothBubble>  → "bookmark a booth"    (booth-tier)
//   <StarFavoriteBubble>   → "favorite a mall"     (mall-tier, v2)
//
// State semantics: parent owns the saved boolean (derived from the
// useShopperBoothBookmarks hook), passes it down. The component is a pure
// render — toggle logic lives in the consumer so the cross-instance
// broadcast in the hook stays single-sourced.
//
// v2 dial decisions (Arc 4.1):
//   - Phosphor weight pair (PiBookmarkSimpleFill + PiBookmarkSimple) replaces
//     Lucide Bookmark. Matches session 140 PiLeafFill/PiLeaf treatment on
//     HomeFeedTile photo card hearts.
//   - 44×44 bubble + 22px glyph (single shape; no size variants).
//   - v2.surface.warm bg + 1px v2.border.light border (solid; closes session
//     132 frosted-glass-retire holdout — was rgba + backdrop-filter blur).
//   - color: v2.accent.green constant; weight communicates state, not color.
//
// Dead-code byproduct (this commit): retired `size?: "tile" | "hero" | "masthead"`
// prop. `tile` had no live consumer (was for /shelves grid retired session
// 116 cf52976); `masthead` was already noted "no longer used" in v1 file
// header. Single shape simplifies the contract.

"use client";

import { PiBookmarkSimple, PiBookmarkSimpleFill } from "react-icons/pi";
import { v2 } from "@/lib/tokens";

interface Props {
  saved:   boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function BookmarkBoothBubble({ saved, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove booth bookmark" : "Bookmark this booth"}
      style={{
        width:  44,
        height: 44,
        borderRadius: 22,
        background: v2.surface.warm,
        border: `1px solid ${v2.border.light}`,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: v2.accent.green,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {saved ? (
        <PiBookmarkSimpleFill size={22} aria-hidden />
      ) : (
        <PiBookmarkSimple size={22} aria-hidden />
      )}
    </button>
  );
}
