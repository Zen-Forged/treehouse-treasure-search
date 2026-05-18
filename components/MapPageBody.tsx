// components/MapPageBody.tsx
// Session 178 F2 Arc 1.1 — Map page extraction R-session implementation
// (design record: docs/map-page-extraction-design.md, session 176 C2).
//
// Frame A bordered window primitive. Composes <TreehouseMap> + <MapControlPill>
// overlay inside a bordered/rounded container with breathing room around
// (left/right/top — bottom edge meets the page-level <MapCarousel> shelf
// per D15). Reads as a deliberately "contained window" rather than full-bleed
// per D5; David's verbatim ask: "I liked the first iteration where it felt
// a bit contained in a window an not extending the entire screen."
//
// Pure presentation primitive — consumer owns peekedMallId + resetKey state
// (lifted from the retired MallMapDrawer's internal state so the page-level
// <MapCarousel> sibling can read the same peek source per D12 single source
// of truth). Card-tap, pin-tap, neighbor-arrow tap all converge on the
// peekedMallId state held by app/(tabs)/map/page.tsx.
//
// What this primitive does NOT contain:
//   - <MapCarousel>           page-level chrome sibling (D15)
//   - drawer wrapper          dedicated route, no overlay container
//   - body scroll lock        no longer needed (no overlay)
//   - framer-motion           transition wrapper at the page level (Arc 4.1)
//   - MallMatchChip overlay   search bar retires from /map per David's verbatim
//                             ("It should not include a search bar")
//
// Consumers:
//   - Arc 1.1 (this commit):   app/map-page-test/page.tsx smoke route
//   - Arc 1.2:                 app/(tabs)/map/page.tsx production wiring
//
// Frame A spec (D5 + D14):
//   - 1px solid v2.border.medium around the window
//   - border-radius 14px
//   - 14px page padding (left/right/top); bottom edge flush against carousel shelf
//   - Subtle drop shadow `0 2px 6px rgba(0,0,0,0.04)` for soft elevation
//   - MapControlPill (Reset) anchored top-right INSIDE the bordered window
//     at top:12 right:12 (D14)
//
// Mapbox SSR-safety: TreehouseMap dynamic-imported with ssr:false (mirrors
// session-108 + session-156 pattern; mapbox-gl's UMD touches window at
// module evaluation).

"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { PiX } from "react-icons/pi";
import { v2, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";
import type { MallStats } from "@/lib/posts";

// SSR-safe map import — mapbox-gl's UMD bundle touches window at module
// evaluation. Same dynamic-import shape as MallMapDrawer (session 108).
const TreehouseMap = nextDynamic(() => import("./TreehouseMap"), {
  ssr: false,
});

export interface MapPageBodyProps {
  malls:           Mall[];
  selectedMallId:  string | null;
  peekedMallId:    string | null;
  mallStats?:      Record<string, MallStats>;
  savedByMallId?:  Record<string, number>;
  /**
   * Bumps from parent on Reset taps so TreehouseMap's fitBounds effect
   * re-runs even when selectedMallId is already null. Mirrors the
   * resetKey contract from MallMapDrawer (session 161).
   */
  resetKey:        number;
  /** Pin tap → consumer sets peekedMallId. */
  onPinTap:        (mallId: string) => void;
  /** Empty-map tap → consumer clears peekedMallId. */
  onMapTap:        () => void;
  /**
   * PinCallout "Explore" CTA tap → consumer commits scope + routes to /
   * (Explore feed) per D7. The map page is "pick where to shop"; committing
   * a scope means "let me see what's there."
   */
  onCommit:        (mallId: string) => void;
  /**
   * MapControlPill Reset tap → consumer clears scope + bumps resetKey +
   * clears peekedMallId. PinCallout dismiss is part of the Reset semantic
   * (session 165 dial).
   */
  onReset:         () => void;
}

// Frame A geometry constants — extracted so consumers can compose against
// the same values (e.g., page-level layout reservation for the MapCarousel
// sibling that sits flush below the window's bottom edge).
const FRAME_PAD_X = 14;
// Session 180 — David iPhone QA finding 1 of 5: "anchor the top of the
// map to the bottom of the masthead, no padding." With C1's chip-bg
// flip dissolving the chip strip into the warm page-bg, the masthead +
// chip + page-bg above the bordered window read as one continuous
// chrome surface; the 14px top breathing room above the bordered window
// became a visible page-bg gap between chip-bottom and bordered-window-
// top. Retiring it (14 → 0) anchors the bordered window's top edge
// flush against the chip-bottom edge (= visual bottom of the unified
// masthead/chip/page-bg chrome stack).
//
// Within-session dial of session-178 design-record D14 value (FRAME_PAD_
// TOP=14, "14px page padding (left/right/top)") per
// feedback_within_session_design_record_reversal ✅ Promoted-via-memory
// at session 128. Bounded reversal — side padding (FRAME_PAD_X=14)
// preserved so bordered window doesn't extend edge-to-edge horizontally.
const FRAME_PAD_TOP = 0;
const FRAME_RADIUS = 14;
const FRAME_BORDER = 1;
const FRAME_SHADOW = "0 2px 6px rgba(0,0,0,0.04)";

const PILL_TOP = 12;
const PILL_RIGHT = 12;

export default function MapPageBody({
  malls,
  selectedMallId,
  peekedMallId,
  mallStats,
  savedByMallId,
  resetKey,
  onPinTap,
  onMapTap,
  onCommit,
  onReset,
}: MapPageBodyProps) {
  return (
    <div
      style={{
        // Outer wrapper provides the bordered-window padding around the map.
        // flex:1 so this primitive fills whatever vertical space the page
        // gives it between MallStrip-top and MapCarousel-bottom (D13).
        flex:    1,
        padding: `${FRAME_PAD_TOP}px ${FRAME_PAD_X}px 0`,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        // Frame A bordered window — contains TreehouseMap + MapControlPill.
        // position:relative so the pill anchors against the window bounds
        // rather than the viewport.
        style={{
          position:     "relative",
          flex:         1,
          minHeight:    0,
          border:       `${FRAME_BORDER}px solid ${v2.border.medium}`,
          borderRadius: FRAME_RADIUS,
          boxShadow:    FRAME_SHADOW,
          overflow:     "hidden",
          background:   v2.bg.main,
        }}
      >
        <TreehouseMap
          malls={malls}
          selectedMallId={selectedMallId}
          peekedMallId={peekedMallId}
          mallStats={mallStats}
          savedByMallId={savedByMallId}
          resetKey={resetKey}
          onPinTap={onPinTap}
          onMapTap={onMapTap}
          onCommit={onCommit}
        />

        {/* MapControlPill (Reset) — always visible per session 161 dial.
            Inline implementation (vs. import from MallMapDrawer) because
            MallMapDrawer retires in Arc 3.2; pill needs its own home before
            the wrapper goes away. Visual contract identical (session-155
            secondary pill style). */}
        <MapControlPill onReset={onReset} />
      </div>
    </div>
  );
}

// ─── MapControlPill ────────────────────────────────────────────────────────
// Migrated from MallMapDrawer (sessions 108 → 155 → 158 → 161). Secondary
// pill visual contract preserved verbatim:
//   bg     v2.bg.main       (#F7F3EB — system canonical)
//   border 1px v2.border.light
//   text   v2.text.secondary
//   shadow project-canonical subtle "0 1px 2px rgba(43,33,26,0.04)"
//
// Anchored top-right INSIDE the bordered window per D14. iPhone QA at
// Arc 5 may dial placement (top-right vs bottom-right vs floating-outside-
// window); design record Tier B item B8 holds the dial.
function MapControlPill({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      style={{
        position:                "absolute",
        top:                     PILL_TOP,
        right:                   PILL_RIGHT,
        zIndex:                  20,
        display:                 "flex",
        alignItems:              "center",
        gap:                     6,
        padding:                 "8px 14px 8px 12px",
        borderRadius:            999,
        background:              v2.bg.main,
        color:                   v2.text.secondary,
        // Session 179 — David iPhone QA finding 9: "Add a thin stroke
        // around the reset button." v2.border.light (#E5DED2) was too
        // faint to read against the v2.bg.main #F7F3EB pill bg. Bumped to
        // rgba(42,26,10,0.18) matching BottomNav stroke vocabulary
        // (BottomNav.tsx C.border line 165 + nav-outer-border line 257)
        // since David's finding-7 anchored this dial bundle to nav-bar
        // visual continuity. Inline rgba (not v2.border.medium #D6CCBC)
        // for cross-surface vocabulary match — chrome boundaries on
        // /map share the same stroke value as nav-bar chrome boundaries.
        border:                  `1px solid rgba(42,26,10,0.18)`,
        cursor:                  "pointer",
        fontFamily:              FONT_SYS,
        fontSize:                13,
        fontWeight:              600,
        letterSpacing:           "0.01em",
        boxShadow:               "0 1px 2px rgba(43,33,26,0.04)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <PiX size={15} aria-hidden="true" />
      Reset
    </button>
  );
}
