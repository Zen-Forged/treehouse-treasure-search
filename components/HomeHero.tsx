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
  // Session 166 Arc 3.1.1 — search props now optional per Call 2 Option C.
  // When omitted (e.g., on Saved per session 121 R18 D-lock), HomeHero
  // renders the hero photo + cream-fade only, no embedded SearchBar.
  searchQuery?:       string;
  onSearchChange?:    (q: string) => void;
  searchPlaceholder?: string;
}

const HERO_HEIGHT_VH        = 33;

// Session 166 dial 10 (post-Shape-A iPhone QA) — sticky-stop point on Home
// extends so the embedded SearchBar's TOP edge pins at the bottom of where
// the /find + /shelf StickyMasthead would be (David's "top of search bar
// hits what would be the bottom of the masthead").
//
// Math: MASTHEAD_HEIGHT (max(14, safe-area) + 84) + SearchBar height (44)
// + SEARCH_BOTTOM_OFFSET (16) = MASTHEAD_HEIGHT + 60. Hero strip extends
// down to viewport y = MASTHEAD_HEIGHT + 60.
//
// On Saved (no embedded SearchBar), keep the session-164 D17 strip height
// of 90px since there's no search-bar-to-masthead alignment to satisfy.
const HERO_STRIP_HEIGHT_HOME  = "calc(max(14px, env(safe-area-inset-top, 14px)) + 144px)";
const HERO_STRIP_HEIGHT_SAVED = "90px";

// Export the Home value — chip + drawer (Home-only consumers post-dial-7)
// use this constant to align their sticky pin / drawer top with the hero
// strip's bottom edge. Renamed from STICKY_THIN_HEIGHT_PX since it's no
// longer a single pixel number.
export const STICKY_THIN_HEIGHT = HERO_STRIP_HEIGHT_HOME;
// Session 166 dial (post-Arc 3.1.3 iPhone QA) — search bar drops from 32 to
// 16 per David's "drop down more so there is more headroom" call. In sticky-
// collapsed state, this shifts search bar bottom from viewport y=58 to y=74,
// freeing up 20px more headroom above the input within the 90px visible strip.
const SEARCH_BOTTOM_OFFSET  = 16;
const SEARCH_HORIZ_PADDING  = 16;

export default function HomeHero({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const showSearch       = searchQuery !== undefined && onSearchChange !== undefined;
  const stickyThinHeight = showSearch ? HERO_STRIP_HEIGHT_HOME : HERO_STRIP_HEIGHT_SAVED;
  const sectionStyle: React.CSSProperties = {
    // Shape A sticky-header behavior — see file-top comment.
    position:           "sticky",
    top:                `calc(${stickyThinHeight} - ${HERO_HEIGHT_VH}vh)`,
    zIndex:             10,  // D18 — sit above scrolling feed content
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
