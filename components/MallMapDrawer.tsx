// components/MallMapDrawer.tsx
// Session 154 — Home chrome restructure. Initial bottom-sheet drawer composing
// <BottomSheet> (Layer 2 primitive, session 149) + <TreehouseMap> (session 108)
// + migrated <MapControlPill> from app/(tabs)/map/page.tsx.
//
// Session 155 — D-Reversal-2 (Iteration 1): page-drawer reshape.
//   Reversed session 154 D2's BottomSheet composition (rounded top + scrim +
//   handle pill + 65vh height + tap-outside-to-dismiss) → page-drawer inline
//   geometry with own header bar (leaf + mall name + close X).
//
// Session 155 — D-Reversal-2 (Iteration 2): chrome-less geometry.
//   David: "Lets make is so the map component pull up doesn't have it's own
//   heading of location. It just pull right under the location and chevron.
//   No close button either, the chevron flips to close."
//
//   Iteration 2 reshape:
//   - Drawer top: MASTHEAD_HEIGHT + STRIP_HEIGHT (strip stays sticky above,
//     no longer covered by drawer)
//   - No header bar at all — strip IS the chrome; drawer is pure content
//   - No close X — chevron on the strip is the toggle (open ↔ close)
//   - Strip's onTap becomes a toggle (consumer's job; smoke route updates)
//   - role="region" not dialog — drawer is now a content panel disclosed by
//     the strip-as-button, not a modal dialog
//   - z-index: 30 (below strip's z-39 so strip wins on any pixel overlap)
//   - PiX import retained for MapControlPill's Clear state (header retired
//     but pill's Clear glyph still uses it); FONT_LORA + PiLeaf imports
//     retire (no header text/glyph)
//
//   Tensions this resolves on top of Iteration 1:
//   - Identity duplication retired (header repeated strip's leaf + name)
//   - Close-affordance unification: chevron-on-strip is the single open/close
//     toggle; no separate X button to learn
//   - Strip-as-persistent-chrome reads more like the FB Marketplace pattern
//     David anchored on at session 154 — strip stays visible even when the
//     map panel is expanded
//
// Design record: docs/home-chrome-restructure-design.md D-Reversal-2 §Iteration 2.
//
// Composition:
//   - Custom page-drawer geometry  inline (no BottomSheet — page-drawer pattern
//                                  has 1 consumer; promote to Layer 2 primitive
//                                  only on 2nd consumer per CLAUDE.md rule)
//   - <TreehouseMap>               Mapbox map fills entire drawer (no header)
//   - <MapControlPill>             Reset affordance (only in specific-mall scope;
//                                  session 158 dial D retired the all-Kentucky
//                                  List view branch — MapCarousel now surfaces
//                                  the browse-the-locations affordance)
//   - <MapCarousel>                Bottom thumbnail strip — session 158 sibling
//                                  layer between drawer + BottomNav
//
// Pure presentation primitive — drawer-open state lives in consumer
// (<HomeChrome> in Arc 2). Drawer reads `open` prop and renders. Pin commit
// fires `onMallPick(id)`; consumer handles scope update + drawer close +
// analytics fire. Clear pill fires `onClear()` (drawer stays open per D2;
// scope clears).
//
// Lazy mount: <TreehouseMap> is dynamic-imported with ssr:false (preserves
// session 108's mapbox-gl SSR-safety pattern).

"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { PiX } from "react-icons/pi";
import MapCarousel from "./MapCarousel";
import MallMatchChip from "./MallMatchChip";
import {
  v2,
  FONT_SYS,
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";
import { MASTHEAD_HEIGHT } from "./StickyMasthead";
import { STRIP_HEIGHT, SEARCH_BAR_WRAP_HEIGHT } from "./MallStrip";
import type { Mall } from "@/types/treehouse";
import type { MallStats } from "@/lib/posts";

// SSR-safe map import — mapbox-gl's UMD bundle touches window at module
// evaluation. Mirrors /map page's session-108 dynamic import.
const TreehouseMap = nextDynamic(() => import("./TreehouseMap"), {
  ssr: false,
});

interface MallMapDrawerProps {
  open:           boolean;
  onClose:        () => void;
  malls:          Mall[];
  selectedMallId: string | null;
  mallStats?:     Record<string, MallStats>;
  savedByMallId?: Record<string, number>;
  /**
   * Fires when user commits a pin via callout tap.
   * Consumer applies setMallId(id) + closes drawer + scrolls to top + fires
   * filter_applied analytics.
   */
  onMallPick:     (mallId: string) => void;
  /**
   * Fires when user taps "Clear" pill (scope set → all-Kentucky).
   * Consumer applies setMallId(null) + fires filter_applied (filter_value: "all").
   * Drawer STAYS open per D2 — user may want to pick a different mall after clearing.
   */
  onClear:        () => void;
  /**
   * Session 165 Finding 5 — fires when user taps a MallMatchChip rendered
   * above the map when SearchBar query matches a mall name/city. Optional:
   * falls back to onMallPick if not supplied. Consumer typically performs
   * scope-change + close-drawer + URL query clear + analytics with
   * source: "search_mall_match" (vs. pin-tap source: "map_pin") so R3
   * data captures the discovery path that drove the scope change.
   */
  onMallSearchPick?: (mallId: string) => void;
  /**
   * Session 165 Finding 5 — current SearchBar query string. Drawer renders
   * MallMatchChip when query matches an active mall name/city. Optional;
   * defaults to "" (chip won't render). Passed as prop rather than read via
   * useSearchParams internally so the drawer stays free of router-state
   * dependencies — keeps the /home-chrome-test smoke route + any other
   * future direct consumer prerenderable without a Suspense wrapper.
   */
  query?:           string;
}

export default function MallMapDrawer({
  open,
  onClose: _onClose,
  malls,
  selectedMallId,
  mallStats,
  savedByMallId,
  onMallPick,
  onClear,
  onMallSearchPick,
  query = "",
}: MallMapDrawerProps) {
  // Suppress unused-var lint while keeping prop in the contract — onClose is
  // still called by consumers (pin-commit flow + future Esc handler) even
  // though the drawer has no internal close button. Iteration-2 reshape
  // deliberately moves close affordance to the strip's chevron toggle.
  void _onClose;

  // Transient peek state — pin tap renders highlighted pin + PinCallout above
  // it. Tap callout → commit. Tap empty map → clear. Same pattern as /map
  // page (session 108 D26).
  const [peekedMallId, setPeekedMallId] = React.useState<string | null>(null);

  // Session 161 dial — Reset is now always visible per David's iPhone QA:
  // "Show reset button on the map at all times to reset to the default
  // kentucky view." Tapping Reset while already in all-Kentucky scope must
  // still force a re-fit (user may have panned/zoomed manually). This
  // counter bumps on every Reset tap and is forwarded to TreehouseMap so
  // the fitBounds effect re-runs regardless of whether selectedMallId
  // actually changes.
  const [resetKey, setResetKey] = React.useState(0);
  const handleReset = React.useCallback(() => {
    setResetKey((n) => n + 1);
    onClear();
  }, [onClear]);

  // Body scroll lock while drawer open — inline pattern from <BottomSheet>
  // (session 149). Without this, scrolling inside the map can bleed through
  // to the page beneath when the drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // When drawer opens with scope already set, auto-peek the selected mall
  // so the callout surfaces immediately (Navigate / Explore CTAs visible
  // without an extra tap). Same affordance as /map page's mount-only
  // peek effect (session 108).
  React.useEffect(() => {
    if (!open) return;
    if (selectedMallId) {
      setPeekedMallId(selectedMallId);
    } else {
      setPeekedMallId(null);
    }
    // Only fires when drawer transitions to open (not on selectedMallId
    // changes while open — those originate from inside the drawer and
    // a re-peek would feel like a bug per session 108 D26 reasoning).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            // region (not dialog) — iteration-2 reshape demotes this from a
            // modal dialog to a content panel disclosed by the strip's
            // aria-expanded button. Strip stays in tab order; closes via
            // chevron-on-strip toggle.
            role="region"
            aria-label="Active locations map"
            // Session 157 desktop containment — x: "-50%" pairs with left:
            // "50%" + maxWidth: 430 to center the drawer in the mobile
            // column on wider viewports. Framer-motion composes x + y into
            // one transform so the slide-up animation still works.
            initial={{ y: "100%", x: "-50%" }}
            animate={{ y: 0,      x: "-50%" }}
            exit={{    y: "100%", x: "-50%" }}
            transition={{
              duration: MOTION_BOTTOM_SHEET_SHEET_DURATION,
              ease: MOTION_BOTTOM_SHEET_EASE,
            }}
            style={{
              position:      "fixed",
              // Slide up to the strip's bottom edge — strip stays sticky above.
              // CSS nested calc() is well-supported; MASTHEAD_HEIGHT is itself
              // a calc(...) string from <StickyMasthead>. Session 157 — chrome
              // stack now masthead + SearchBar wrap + strip, so drawer top
              // includes SEARCH_BAR_WRAP_HEIGHT.
              top:           `calc(${MASTHEAD_HEIGHT} + ${SEARCH_BAR_WRAP_HEIGHT}px + ${STRIP_HEIGHT}px)`,
              // Mobile-column containment — mirrors StickyMasthead +
              // MallStrip + BottomNav fixed-chrome pattern. Without this,
              // the drawer (and its full-bleed Mapbox canvas) extends to
              // the entire viewport on desktop instead of staying inside
              // the 430px column with the rest of the app chrome.
              left:          "50%",
              width:         "100%",
              maxWidth:      430,
              bottom:        0,
              background:    v2.bg.main,
              // Below strip's z-39 so strip wins on any pixel overlap at the
              // border-bottom seam. Strip's borderBottom 1px serves as the
              // visual separator between strip + drawer.
              zIndex:        30,
              display:       "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Map + contextual pill — fills entire drawer (no header).
                Positioned wrapper so MapControlPill anchors against map area. */}
            <div
              style={{
                position: "relative",
                flex:     1,
                overflow: "hidden",
              }}
            >
              {/* Session 165 Finding 5 (Shape A dual-slot) — MallMatchChip
                  surfaces when SearchBar query matches an active mall while
                  drawer is open. Positioned absolute over the map (top-center)
                  so it doesn't shrink the map render area; pointer-events stay
                  on the chip itself (parent wrapper has pointerEvents:none so
                  taps elsewhere fall through to the map). Tap routes through
                  onMallPick — same handler as pin-commit, which sets scope +
                  closes drawer + clears query downstream via HomeChrome. */}
              <div
                style={{
                  position:      "absolute",
                  top:           12,
                  left:          "50%",
                  transform:     "translateX(-50%)",
                  zIndex:        20,
                  pointerEvents: "none",
                  display:       "flex",
                  justifyContent: "center",
                  width:         "100%",
                  padding:       "0 16px",
                  boxSizing:     "border-box",
                }}
              >
                <div style={{ pointerEvents: "auto" }}>
                  <MallMatchChip
                    malls={malls}
                    query={query}
                    currentMallId={selectedMallId}
                    onPick={(mall) => {
                      // Prefer onMallSearchPick (chip-specific handler with
                      // correct analytics source + query clear); fall back
                      // to onMallPick if not supplied so the chip still
                      // functions in any future consumer that doesn't wire
                      // the search-specific path.
                      (onMallSearchPick ?? onMallPick)(mall.id);
                    }}
                  />
                </div>
              </div>

              <TreehouseMap
                malls={malls}
                selectedMallId={selectedMallId}
                peekedMallId={peekedMallId}
                mallStats={mallStats}
                savedByMallId={savedByMallId}
                resetKey={resetKey}
                onPinTap={(id) => setPeekedMallId(id)}
                onMapTap={() => setPeekedMallId(null)}
                onCommit={(id) => {
                  setPeekedMallId(null);
                  onMallPick(id);
                }}
              />

              {/* Reset pill — session 161 dial: always visible per David's
                  iPhone QA "Show reset button on the map at all times to
                  reset to the default kentucky view." Pre-session-161 the
                  pill was gated on `selectedMallId !== null` (session 158
                  dial D simplified to Reset-only, gated on scope being set).
                  Now it renders unconditionally; handler bumps resetKey
                  alongside onClear so the fitBounds effect re-runs even
                  when scope is already null. */}
              <MapControlPill onClear={handleReset} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session 158 — MapCarousel sibling. Fixed chrome layer between drawer
          (z-30) and BottomNav (z-50). Has its own AnimatePresence tied to the
          same `open` prop so it slides up alongside the drawer. peekedMallId
          is the single source of truth for "which mall is currently focused"
          — pin tap, card tap, and arrow tap (Arc 3) all write to it. */}
      <MapCarousel
        open={open}
        malls={malls}
        selectedMallId={selectedMallId}
        peekedMallId={peekedMallId}
        onCardTap={(id) => setPeekedMallId(id)}
      />
    </>
  );
}

// ─── MapControlPill ────────────────────────────────────────────────────────
// Migrated from app/(tabs)/map/page.tsx session-108 implementation; restyled
// session 155 to secondary/utility pill style (not a primary action). Session
// 158 dial D retired the dual-state variant — list-view branch dropped since
// the bottom MapCarousel surfaces the same browse-the-locations affordance.
// Pill now renders only in specific-mall scope as the Reset affordance.
//
// Secondary pill spec (mirrors <BottomSheet> TopBar button canonical):
//   bg     v2.bg.main       (#F7F3EB — system canonical, matches all chrome)
//   border 1px v2.border.light
//   text   v2.text.secondary
//   shadow project-canonical subtle "0 1px 2px rgba(43,33,26,0.04)"
function MapControlPill({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      style={{
        position:        "absolute",
        top:             12,
        right:           12,
        zIndex:          5,
        display:         "flex",
        alignItems:      "center",
        gap:             6,
        padding:         "8px 14px 8px 12px",
        borderRadius:    999,
        background:      v2.bg.main,
        color:           v2.text.secondary,
        border:          `1px solid ${v2.border.light}`,
        cursor:          "pointer",
        fontFamily:      FONT_SYS,
        fontSize:        13,
        fontWeight:      600,
        letterSpacing:   "0.01em",
        boxShadow:       "0 1px 2px rgba(43,33,26,0.04)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <PiX size={15} aria-hidden="true" />
      Reset
    </button>
  );
}
