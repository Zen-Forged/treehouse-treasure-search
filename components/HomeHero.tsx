// components/HomeHero.tsx
// Home hero primitive — Frame C from docs/home-hero-design.md.
//
// Composition: 33vh background-image hero (wordmark baked into asset) +
// cream-fade overlay gradient at the bottom + embedded SearchBar anchored
// 52px from hero bottom. Self-contained section; scrolls away with the
// feed per D5.
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
const SEARCH_BOTTOM_OFFSET  = 52;
const SEARCH_HORIZ_PADDING  = 16;

export default function HomeHero({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const sectionStyle: React.CSSProperties = {
    position:           "relative",
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
