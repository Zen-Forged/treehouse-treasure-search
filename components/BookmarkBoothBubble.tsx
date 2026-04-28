// components/BookmarkBoothBubble.tsx
// Booth-bookmark glyph — Lucide Bookmark in a frosted/wash bubble.
//
// Verbal mapping established session 67:
//   <FlagGlyph>            → "save / flag a find"  (find-save pattern)
//   <BookmarkBoothBubble>  → "bookmark a booth"    (booth-save pattern)
// Two save vocabularies for two object classes; both use the green-fill
// saved-state behavior on cream-paper backgrounds.
//
// Three visual variants via the `size` prop:
//   - "tile"     — 28px frosted bubble on /shelves grid hero tiles, 14px glyph
//   - "hero"     — 36px frosted bubble on BoothHero photo corner (session 80
//                  bookmark relocation, docs/bookmark-relocation-design.md
//                  D5), 18px glyph. Same frosted-paper formula as tile,
//                  sized to match /find/[id] flag rect for visual sibling
//                  rhythm with that surface.
//   - "masthead" — 38px wash bubble on /shelf/[slug] right slot, 18px glyph
//                  (matches the existing share-airplane bubble dimensions so
//                   the two right-slot affordances visually pair). Session 80:
//                   this variant is no longer used on /shelf/[slug] (bookmark
//                   moved to BoothHero corner) but kept available for any
//                   future masthead-bookmark surface.
//
// State semantics: parent owns the saved boolean (derived from
// `loadBookmarkedBoothIds()` in lib/utils.ts), passes it down. The component
// is a pure render — toggle logic + localStorage write live in the consumer
// so the grid-level `bookmarkedIds` set stays single-sourced.

"use client";

import { Bookmark } from "lucide-react";
import { v1 } from "@/lib/tokens";

interface Props {
  saved:   boolean;
  size?:   "tile" | "hero" | "masthead";
  onClick: (e: React.MouseEvent) => void;
}

export default function BookmarkBoothBubble({ saved, size = "tile", onClick }: Props) {
  const isMasthead = size === "masthead";
  const isHero     = size === "hero";
  const bubble = isMasthead ? 38 : isHero ? 36 : 28;
  const glyph  = isMasthead ? 18 : isHero ? 18 : 14;

  // Tile + hero: frosted-paper wash (matches the FlagGlyph feed-tile + find-
  // detail bubble formula). Masthead: existing v1.iconBubble wash (matches
  // the share-airplane bubble on the same masthead).
  const bg = isMasthead
    ? v1.iconBubble
    : "rgba(245,242,235,0.85)";

  const border = isMasthead ? "none" : "0.5px solid rgba(42,26,10,0.12)";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={saved ? "Remove booth bookmark" : "Bookmark this booth"}
      style={{
        width:  bubble,
        height: bubble,
        borderRadius: "50%",
        background: bg,
        backdropFilter:        isMasthead ? undefined : "blur(8px)",
        WebkitBackdropFilter:  isMasthead ? undefined : "blur(8px)",
        border,
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Bookmark
        size={glyph}
        strokeWidth={1.8}
        style={{
          color:  saved ? v1.green : v1.inkPrimary,
          fill:   saved ? v1.green : "none",
        }}
      />
    </button>
  );
}
