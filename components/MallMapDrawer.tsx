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
//   - <MapControlPill>             Clear / List view affordance (migrated from /map)
//   - <MallSheet>                  all-malls picker (sibling modal; opens from List view)
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
import { PiX, PiList } from "react-icons/pi";
import MallSheet from "./MallSheet";
import {
  v2,
  FONT_SYS,
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";
import { MASTHEAD_HEIGHT } from "./StickyMasthead";
import { STRIP_HEIGHT } from "./MallStrip";
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

  // MallSheet picker opens via the List view pill when scope=all-Kentucky.
  const [sheetOpen, setSheetOpen] = React.useState(false);

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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: MOTION_BOTTOM_SHEET_SHEET_DURATION,
              ease: MOTION_BOTTOM_SHEET_EASE,
            }}
            style={{
              position:      "fixed",
              // Slide up to the strip's bottom edge — strip stays sticky above.
              // CSS nested calc() is well-supported; MASTHEAD_HEIGHT is itself
              // a calc(...) string from <StickyMasthead>.
              top:           `calc(${MASTHEAD_HEIGHT} + ${STRIP_HEIGHT}px)`,
              left:          0,
              right:         0,
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
              <TreehouseMap
                malls={malls}
                selectedMallId={selectedMallId}
                peekedMallId={peekedMallId}
                mallStats={mallStats}
                savedByMallId={savedByMallId}
                onPinTap={(id) => setPeekedMallId(id)}
                onMapTap={() => setPeekedMallId(null)}
                onCommit={(id) => {
                  setPeekedMallId(null);
                  onMallPick(id);
                }}
              />

              {/* Contextual pill — scope set → "Clear"; all-Kentucky → "List view".
                  Migrated from app/(tabs)/map/page.tsx MapContextualPill (which
                  retires when /map page deletes in Arc 3.3). */}
              <MapControlPill
                scopeSet={selectedMallId !== null}
                onClear={onClear}
                onOpenList={() => setSheetOpen(true)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MallSheet picker — sibling modal layering above the page-drawer when
          "List view" tapped. Clean two-layer stack (drawer-panel → picker-modal)
          identical to pre-session-154's /map page → MallSheet relationship. */}
      <MallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        malls={malls}
        activeMallId={selectedMallId}
        onSelect={(id) => {
          setSheetOpen(false);
          if (id) {
            onMallPick(id);
          } else {
            onClear();
          }
        }}
      />
    </>
  );
}

// ─── MapControlPill ────────────────────────────────────────────────────────
// Migrated from app/(tabs)/map/page.tsx session-108 implementation; session 155
// refinement restyles from primary (saturated v2.accent.green + cream text) to
// secondary/utility pill style — pill is utility chrome (Reset / List view),
// not a primary action, and shouldn't compete visually with map content.
//
// Secondary pill spec (mirrors <BottomSheet> TopBar button canonical):
//   bg     v2.surface.card  (#FFFCF5 — lifts subtly off the map cream land)
//   border 1px v2.border.light
//   text   v2.text.secondary
//   shadow project-canonical subtle "0 1px 2px rgba(43,33,26,0.04)"
//          (session 151 pattern; extracted as v2.shadow.card on 3rd consumer)
//
// PiX + PiList glyphs match v2-pure Phosphor vocabulary (session 145 sweep).
function MapControlPill({
  scopeSet,
  onClear,
  onOpenList,
}: {
  scopeSet:   boolean;
  onClear:    () => void;
  onOpenList: () => void;
}) {
  const Icon  = scopeSet ? PiX : PiList;
  // "Reset" reads more accurately than "Clear" — tap returns scope from a
  // specific mall to all-Kentucky (the default), not a destructive clear.
  const label = scopeSet ? "Reset" : "List view";
  const onTap = scopeSet ? onClear : onOpenList;
  return (
    <button
      type="button"
      onClick={onTap}
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
        background:      v2.surface.card,
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
      <Icon size={15} aria-hidden="true" />
      {label}
    </button>
  );
}
