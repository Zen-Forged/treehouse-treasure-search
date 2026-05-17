// components/HomeHero.tsx
// Home hero primitive — Frame C composition from docs/home-hero-design.md.
//
// Composition: 33vh background-image hero (wordmark baked into asset) +
// cream-fade overlay gradient at the bottom + embedded SearchBar anchored
// 16px from hero bottom (Home only; Saved omits SearchBar per R18 lock).
//
// Sticky behavior (session 176 scroll-and-compress dial — BOUNDED revision
// of session 175 Option α; session 175 reversed session 164 D16-D19):
//   - Home (showSearch=true):  position: sticky; top: -SCROLL_BEFORE_STICKY_PX
//     At scrollY=0 hero sits at top:0 (full 33vh visible, chrome bubbles
//     overlay photograph as designed). User scrolls — hero scrolls UP with
//     content for SCROLL_BEFORE_STICKY_PX pixels. Once user has scrolled
//     past that threshold, sticky activates pinning hero with the top
//     SCROLL_BEFORE_STICKY_PX of hero offscreen. Visible pinned hero =
//     33vh - SCROLL_BEFORE_STICKY_PX (compressed but wordmark + SearchBar
//     still visible).
//   - Saved (showSearch=false): position: static; height: 33vh
//     Hero renders in document flow at top of page as identity beat;
//     scrolls away with content when user scrolls down. (Unchanged from
//     session 175 Option α — David's reference image for session 176.)
//
// David's session 176 iPhone QA: "I'd like to allow the hero header image
// to scroll a bit more before it becomes sticky (see image from the saved
// page as reference to the position)." Bounded revision of session 175
// Option α — full-identity-beat thesis stays for scrollY=0 (hero at full
// 33vh), partial-compression activates only AFTER user scrolls past
// SCROLL_BEFORE_STICKY_PX threshold.
//
// BOUNDED REVIVAL of session 164 D16-D19 + session 166 dial 10
// collapsing-header pattern (negative-top sticky), at smaller magnitude.
// Session 164 collapsed to 158-191px (~58-72% compression on iPhone SE
// 33vh = 220px). Session 176 compresses by SCROLL_BEFORE_STICKY_PX
// (~36% on iPhone SE). The structural pattern (negative-top sticky)
// returns; the magnitude tightens to "a bit" per David's verbatim ask.
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

// Session 176 — scroll distance allowed before hero pins via negative-top
// sticky. At scrollY < SCROLL_BEFORE_STICKY_PX: hero scrolls naturally with
// content (in-flow visual). At scrollY >= SCROLL_BEFORE_STICKY_PX: sticky
// activates pinning hero at top:-SCROLL_BEFORE_STICKY_PX (top of hero
// offscreen by that amount; bottom of hero at calc(33vh -
// SCROLL_BEFORE_STICKY_PX) from viewport top). Easily dial-able from
// David's iPhone QA.
//
// Session 177 dial — 80 → 40 per David's iPhone QA on v0.176.0: "The
// sticky position of the explore header goes too far and cuts off part
// of the logo. It should look more like the second image attached with
// just some padding between the top of the logo and the screen up top."
// 80px compression pushed the wordmark's leaf glyph flush against the
// URL bar at compressed state; 40px halves the compression magnitude so
// ~40px of breathing room above the wordmark remains visible when
// sticky-pinned. Bounded refinement of session 176 C1 — structural
// pattern (negative-top sticky) preserved; magnitude tightens.
const SCROLL_BEFORE_STICKY_PX = 40;

// Session 176 — hero's VISIBLE bottom edge in viewport coordinates when the
// hero is sticky-pinned (Home, scrollY > SCROLL_BEFORE_STICKY_PX) OR when
// it sits at the top of document flow (Saved at scrollY=0; Home at
// scrollY=0 with hero unpinned). Consumers (MallPickerChip + MallMap-
// Drawer, both Home-only) pin themselves at or below this edge.
//
// Bounded-revises session 175 — formerly `${HERO_HEIGHT_VH}vh` (full hero
// always visible when pinned per Option α). Now `calc(${HERO_HEIGHT_VH}vh
// - ${SCROLL_BEFORE_STICKY_PX}px)` — hero compresses by
// SCROLL_BEFORE_STICKY_PX when pinned because negative-top sticky leaves
// that portion offscreen. Chip + drawer inherit the compressed bottom-edge
// automatically via this single export.
//
// Session lineage: 164 D16-D19 named STICKY_THIN_HEIGHT (collapsed strip
// 158-191px) → 175 Option α renamed to HERO_BOTTOM_EDGE (full 33vh, no
// collapse) → 176 keeps name, value compresses by 80px (~36% iPhone SE).
export const HERO_BOTTOM_EDGE =
  `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`;
const SEARCH_BOTTOM_OFFSET = 16;
const SEARCH_HORIZ_PADDING = 16;

export default function HomeHero({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: Props) {
  const showSearch = searchQuery !== undefined && onSearchChange !== undefined;
  // Session 176 — Home (showSearch=true) sticky-pinned with negative-top
  // offset so hero scrolls SCROLL_BEFORE_STICKY_PX pixels before pinning;
  // Saved (showSearch=false) position:static in document flow. See file-top.
  const sectionStyle: React.CSSProperties = {
    position:           showSearch ? "sticky" : "static",
    ...(showSearch ? { top: -SCROLL_BEFORE_STICKY_PX, zIndex: 10 } : {}),
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
