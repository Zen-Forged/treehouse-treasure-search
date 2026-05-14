// components/HomeHero.tsx
// Home hero primitive — Frame C + Shape A sticky behavior from
// docs/home-hero-design.md.
//
// Composition: 33vh background-image hero (wordmark baked into asset) +
// cream-fade overlay gradient at the bottom + embedded SearchBar anchored
// 32px from hero bottom (D7 V2 dial).
//
// Sticky behavior (D16 V2 — reverses D5):
//   position: sticky; top: calc(STICKY_THIN_HEIGHT_PX - 33vh)
// As user scrolls, hero rises with feed content until its top edge reaches
// the negative offset, then pins. Only the bottom STICKY_THIN_HEIGHT (90px)
// stays visible at top of viewport — natural image continuity since it's
// the same DOM node + same image scrolled into its sticky position.
// Wordmark portion scrolls out the top naturally.
//
// Consumers: app/(tabs)/layout.tsx (Arc 3 adoption — shared across Home,
// Saved, Map). Asset at /public/home-hero.png; swap mechanism is file
// replacement per D4.

"use client";

import * as React from "react";
import SearchBar from "@/components/SearchBar";
import { v2 } from "@/lib/tokens";

interface Props {
  searchQuery:        string;
  onSearchChange:     (q: string) => void;
  searchPlaceholder?: string;
}

const HERO_HEIGHT_VH        = 33;
const STICKY_THIN_HEIGHT_PX = 90;  // D17 — visible-strip height when sticky pins
const SEARCH_BOTTOM_OFFSET  = 32;  // D7 V2 — was 52, dropped 20px per David's iPhone QA
const SEARCH_HORIZ_PADDING  = 16;

export default function HomeHero({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const sectionStyle: React.CSSProperties = {
    // Shape A sticky-header behavior — see file-top comment.
    position:           "sticky",
    top:                `calc(${STICKY_THIN_HEIGHT_PX}px - ${HERO_HEIGHT_VH}vh)`,
    zIndex:             10,  // D18 — sit above scrolling feed content
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
    // Layered backgrounds: cream-fade overlay (D9) on top, hero asset
    // (D12) below. Cover-sizing + center anchor keeps the baked-in
    // wordmark visible across iPhone SE → 14 Pro Max widths.
    backgroundImage:
      `linear-gradient(180deg,
        rgba(247,243,235,0) 0%,
        rgba(247,243,235,0) 78%,
        rgba(247,243,235,0.30) 90%,
        rgba(247,243,235,0.78) 98%,
        ${v2.bg.main} 100%),
       url('/home-hero.png')`,
    backgroundSize:     "auto, cover",
    backgroundPosition: "center, center",
    backgroundRepeat:   "no-repeat",
    overflow:           "hidden",
  };

  const searchWrapStyle: React.CSSProperties = {
    position: "absolute",
    left:     SEARCH_HORIZ_PADDING,
    right:    SEARCH_HORIZ_PADDING,
    bottom:   SEARCH_BOTTOM_OFFSET,
    zIndex:   2,
  };

  return (
    <section style={sectionStyle} aria-label="Treehouse Finds">
      <div style={searchWrapStyle}>
        <SearchBar
          initialQuery={searchQuery}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
        />
      </div>
    </section>
  );
}
