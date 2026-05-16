// components/HomeHero.tsx
// Home hero primitive — session 167 chrome-unification arc (design record
// at docs/chrome-unification-design.md D9 + D12 + D13).
//
// 33vh sticky-collapsing photographic strip. At rest it shows the full hero
// photo (BG.png) from y=0 to ~33vh. As user scrolls, hero sticky-collapses
// so its bottom edge stays pinned at MASTHEAD_HEIGHT — only the bottom slice
// (MASTHEAD_HEIGHT tall) remains visible at the top of viewport. The
// collapsed strip + the chip overlay together form the visual "masthead" on
// Home.
//
// Replaces the session 164/166 HomeHero variant which:
//   - baked the wordmark into the hero photo (home-hero.png)
//   - embedded a SearchBar at the hero bottom edge
//   - rendered on both Home + Saved (different stickyThinHeight per surface)
//
// This rewrite:
//   - Drops the wordmark-baked assumption (BG.png is photo-only per D9).
//     Wordmark is now a separate sticky element in TabsChrome (D13).
//   - Drops the embedded SearchBar (D14). Hero is purely photographic.
//   - Renders on Home only (per D12 + session 166 dial 7 lock). Saved gets
//     <StickyMasthead> directly per chrome-unification design.
//
// Sticky-collapse mechanism unchanged from session 164/166 — the constants
// just migrated to lib/chromeTokens.ts (MASTHEAD_HEIGHT). Math:
//
//   top: calc(MASTHEAD_HEIGHT - 33vh)
//
// As user scrolls, hero rises with feed content. Once hero's top would scroll
// above (MASTHEAD_HEIGHT - 33vh), it pins. Only the bottom MASTHEAD_HEIGHT
// stays visible at top of viewport. Natural image continuity since it's the
// same DOM node with the same image scrolled into its sticky position.
//
// Consumers: app/(tabs)/layout.tsx (via TabsChrome — Home only).

"use client";

import * as React from "react";
import {
  MASTHEAD_HEIGHT,
  HERO_BG_URL,
  STRIP_Z,
  stripFadeGradient,
} from "@/lib/chromeTokens";
import { v2 } from "@/lib/tokens";

const HERO_HEIGHT_VH = 33;

export default function HomeHero() {
  const sectionStyle: React.CSSProperties = {
    // Sticky-collapsing-header behavior — see file-top.
    position:           "sticky",
    top:                `calc(${MASTHEAD_HEIGHT} - ${HERO_HEIGHT_VH}vh)`,
    zIndex:             STRIP_Z,  // hero sits below chip (CHIP_Z=38) — chip overlays
    width:              "100%",
    height:             `${HERO_HEIGHT_VH}vh`,
    // Cream-fade gradient on top of BG.png. The fade target is v2.bg.tabs so
    // the masthead's bottom edge bleeds into the (tabs)/-surfaces page bg
    // continuously (no visible seam).
    //
    // BG.png is positioned center-center so at rest the full vertical center
    // of the photo is visible. When sticky-collapses, only the bottom slice
    // remains in viewport (top of hero scrolls above viewport). The full
    // photo composition is preserved during the collapse — no background-
    // position animation needed.
    backgroundImage:    `${stripFadeGradient(v2.bg.tabs)}, url('${HERO_BG_URL}')`,
    backgroundSize:     "auto, cover",
    backgroundPosition: "center, center",
    backgroundRepeat:   "no-repeat",
    overflow:           "hidden",
  };

  return <section style={sectionStyle} aria-label="Treehouse Finds" />;
}
