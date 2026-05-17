// components/MapPageTransition.tsx
// Session 178 F2 Arc 4.1 — Map page slide-up enter transition per session
// 176 C2 design record (docs/map-page-extraction-design.md) D4.
//
// David's verbatim ask (session 176): "still make it feel like a seamless
// transition though as much as possible." This wrapper carries layer 2 of
// the seamless framing per design record §What "seamless transition" means:
//
//   1. Visual chrome continuity (Arcs 1-2 already ship)
//   2. Spatial transition mechanic — slide-up matches prior drawer's enter
//      animation (this commit). User perceives "expanded the drawer" not
//      "jumped to new page."
//   3. Mall scope continuity (useSavedMallId broadcast — already wired)
//
// SCOPE — enter-only animation
// Per design record risk R5: "Framer-motion + Next.js App Router route
// transitions are non-trivial — exit animation requires AnimatePresence at
// layout level or manual control." Exit animation deferred — Next.js App
// Router navigates by unmounting; no parent AnimatePresence to drive exit
// elegantly without restructuring (tabs)/layout. Enter-only carries 80%
// of the perceptual weight (the "this is part of the previous flow" cue
// happens at arrival, not departure); exit is a router.back() that
// behaves as a standard route transition. If iPhone QA at Arc 5 finds
// the abrupt exit jarring, Tier B candidate: layout-level AnimatePresence
// wrapper or Next.js View Transitions API once Next 15 lands.
//
// IMPLEMENTATION
// Wraps only the map body content (MapPageBody) not the whole page:
//   - StickyMasthead is position:fixed — unaffected by transform parents
//     (transform creates a containing block for fixed-position descendants,
//     so wrapping it would break the masthead's viewport anchoring).
//   - MallPickerChip is position:sticky — transform-creates-containing-block
//     would change its scroll-containing-block, making sticky behave oddly.
//   - MapCarousel already animates itself via its own AnimatePresence
//     (sessions 158 + 161). Adding another wrapper would double-animate.
//
// Animating MapPageBody alone surfaces the "drawer expanded into the
// page" perception (the bordered window with the map slides up) while
// chrome (masthead + chip + carousel) lands at its normal position.
// Conservative choice — surfaces the right cue without sticky/fixed
// positioning casualties.
//
// Timing carries the prior drawer's enter duration verbatim
// (MOTION_BOTTOM_SHEET_SHEET_DURATION + MOTION_BOTTOM_SHEET_EASE from
// session 154 token foundation) — preserves the muscle-memory cadence
// users built tapping the strip across sessions 154-177.

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";

interface MapPageTransitionProps {
  children: React.ReactNode;
}

export default function MapPageTransition({ children }: MapPageTransitionProps) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{
        duration: MOTION_BOTTOM_SHEET_SHEET_DURATION,
        ease:     MOTION_BOTTOM_SHEET_EASE,
      }}
      style={{
        // flex:1 + minHeight:0 + flex column so the wrapped MapPageBody
        // (which is itself flex:1 + minHeight:0 + flex column) sits inside
        // a contiguous flex chain reaching the layout's vertical bounds.
        flex:          1,
        minHeight:     0,
        display:       "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </motion.div>
  );
}
