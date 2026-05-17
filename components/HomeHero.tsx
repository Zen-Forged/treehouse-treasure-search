// components/HomeHero.tsx
// Home hero primitive — Frame C composition from docs/home-hero-design.md.
//
// Composition: 33vh background-image hero (wordmark baked into asset) +
// cream-fade overlay gradient at the bottom + embedded SearchBar anchored
// 16px from hero bottom (Home only; Saved omits SearchBar per R18 lock).
//
// Sticky behavior (session 175 Option α — REVERSES session 164 D16-D19):
//   - Home (showSearch=true):  position: sticky; top: 0; height: 33vh
//     Hero stays at full 33vh pinned to viewport top throughout scroll.
//     Page content scrolls under the hero. NO collapse — wordmark +
//     SearchBar stay visible as full identity beat during scroll.
//   - Saved (showSearch=false): position: static; height: 33vh
//     Hero renders in document flow at top of page as identity beat;
//     scrolls away with content when user scrolls down.
//
// David's session 175 iPhone QA: "I want the sticky hero image to stop
// when it hits this location on the screen. This then is what is used
// as a static (in-place) hero for the saved page." Reverses the
// session 164 collapsing-header thesis (33vh → 90-191px on scroll) in
// favor of full-identity sticky on Home + static identity beat on Saved.
//
// Consumers: app/(tabs)/layout.tsx (shared across Home + Saved).
// Asset at /public/home-hero.png; swap mechanism is file replacement.

"use client";

import * as React from "react";
import SearchBar from "@/components/SearchBar";
import { v2 } from "@/lib/tokens";

interface Props {
  // Session 166 Arc 3.1.1 — search props now optional per Call 2 Option C.
  // When omitted (e.g., on Saved per session 121 R18 D-lock), HomeHero
  // renders the hero photo + cream-fade only, no embedded SearchBar.
  searchQuery?:       string;
  onSearchChange?:    (q: string) => void;
  searchPlaceholder?: string;
}

const HERO_HEIGHT_VH = 33;

// Session 175 Option α — hero's bottom edge in viewport coordinates when
// the hero is sticky-pinned at top:0 (Home) OR when it sits at the top of
// document flow (Saved at scrollY=0). Consumers (MallPickerChip + MallMap-
// Drawer, both Home-only) pin themselves at or below this edge.
//
// Reverses session 164 D16-D19 + session 166 dial 10 — formerly
// STICKY_THIN_HEIGHT named for the collapsing-header thin-strip state
// (HERO_STRIP_HEIGHT_HOME = "calc(max(14, safe-area) + 144px)" ≈ 158-191px
// per device safe area); now `${HERO_HEIGHT_VH}vh` since the hero no
// longer collapses on scroll — it stays at full 33vh as the "stop state"
// per David's session 175 iPhone QA.
export const HERO_BOTTOM_EDGE = `${HERO_HEIGHT_VH}vh`;
const SEARCH_BOTTOM_OFFSET = 16;
const SEARCH_HORIZ_PADDING = 16;

export default function HomeHero({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const showSearch = searchQuery !== undefined && onSearchChange !== undefined;
  // Session 175 Option α — Home (showSearch=true) sticky-pinned at top:0;
  // Saved (showSearch=false) position:static in document flow. See file-top.
  const sectionStyle: React.CSSProperties = {
    position:           showSearch ? "sticky" : "static",
    ...(showSearch ? { top: 0, zIndex: 10 } : {}),
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
    // Layered backgrounds: cream-fade overlay (D9) on top, hero asset
    // (D12) below. Cover-sizing + center anchor keeps the baked-in
    // wordmark visible across iPhone SE → 14 Pro Max widths.
    //
    // Session 166 dial 8 — gradient rgba migrates from (247,243,235) to
    // (230,222,207) so the fade target matches v2.bg.tabs (#E6DECF) for
    // continuous seam between hero bottom edge + (tabs)/ page bg.
    backgroundImage:
      `linear-gradient(180deg,
        rgba(230,222,207,0) 0%,
        rgba(230,222,207,0) 78%,
        rgba(230,222,207,0.30) 90%,
        rgba(230,222,207,0.78) 98%,
        ${v2.bg.tabs} 100%),
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
      {showSearch && (
        <div style={searchWrapStyle}>
          <SearchBar
            initialQuery={searchQuery}
            placeholder={searchPlaceholder}
            onChange={onSearchChange}
          />
        </div>
      )}
    </section>
  );
}
