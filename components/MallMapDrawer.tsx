// components/MallMapDrawer.tsx
// Session 154 — Home chrome restructure. Initial bottom-sheet drawer composing
// <BottomSheet> (Layer 2 primitive, session 149) + <TreehouseMap> (session 108)
// + migrated <MapControlPill> from app/(tabs)/map/page.tsx.
//
// Session 155 — D-Reversal-2: page-drawer reshape.
//   Reversed session 154 D2's BottomSheet composition (rounded top + scrim +
//   handle pill + 65vh height + tap-outside-to-dismiss) → page-drawer inline
//   geometry (top: MASTHEAD_HEIGHT, borderRadius: 0, fills viewport remainder,
//   no scrim, X-button as sole dismiss affordance, custom header bar with
//   leaf + mall name + close button).
//
//   David's tension (session 155): "the bar is on the top, but then drop down
//   pulls up component from the bottom, then there is another button inside
//   the map (list view) that then shows the list. It feels disjointed."
//
//   David's reshape: "What if the bottom-up drawer we had went all the way up
//   to the bottom of the masthead with no rounded corners to make it feel like
//   it's a full page? Then a close button to collapse? I think if that was
//   implemented then everything else could stay as it is."
//
//   Two tensions resolved: (1) directional disjoint dissolves when drawer
//   fills viewport edge-to-edge — reads as page transition, not modal open;
//   (2) MallSheet picker over the page-drawer is a clean two-layer stack
//   (page → picker) identical to pre-session-154 /map page → MallSheet.
//
// Design record: docs/home-chrome-restructure-design.md D2 + D-Reversal-2.
//
// Composition:
//   - Custom page-drawer geometry  inline (no BottomSheet — page-drawer pattern
//                                  has 1 consumer; promote to Layer 2 primitive
//                                  only on 2nd consumer per CLAUDE.md rule)
//   - <TreehouseMap>               Mapbox map fills below header (session 108)
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
import { PiX, PiList, PiLeaf } from "react-icons/pi";
import MallSheet from "./MallSheet";
import {
  v2,
  FONT_LORA,
  FONT_SYS,
  MOTION_BOTTOM_SHEET_EASE,
  MOTION_BOTTOM_SHEET_SHEET_DURATION,
} from "@/lib/tokens";
import { MASTHEAD_HEIGHT } from "./StickyMasthead";
import type { Mall } from "@/types/treehouse";
import type { MallStats } from "@/lib/posts";

// SSR-safe map import — mapbox-gl's UMD bundle touches window at module
// evaluation. Mirrors /map page's session-108 dynamic import.
const TreehouseMap = nextDynamic(() => import("./TreehouseMap"), {
  ssr: false,
});

// Drawer header bar height. Houses leaf + mall name (left) + close X (right).
// 48px sits between iOS standard 44px tap target + tighter 40px strip height;
// gives the X button breathing room without consuming too much map space.
const HEADER_HEIGHT = 48;

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
  onClose,
  malls,
  selectedMallId,
  mallStats,
  savedByMallId,
  onMallPick,
  onClear,
}: MallMapDrawerProps) {
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

  // Header identity — mirror strip's identity: leaf + mall name. Resolve mall
  // name via lookup on the malls array. Fallback to "All Kentucky locations"
  // for null/unresolvable scope so transient mismatches (stale id, malls
  // array refetch) don't crash the header.
  const selectedMall = selectedMallId
    ? malls.find((m) => m.id === selectedMallId) ?? null
    : null;
  const headerName = selectedMall ? selectedMall.name : "All Kentucky locations";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
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
              top:           MASTHEAD_HEIGHT,
              left:          0,
              right:         0,
              bottom:        0,
              background:    v2.bg.main,
              // Above MallStrip (z-39) so it covers the strip while open.
              // Below modal-tier z-100 (MallSheet's backdrop sits at 100 via
              // BottomSheet primitive) so picker can layer cleanly above us.
              zIndex:        50,
              display:       "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Header: leaf + mall name (mirrors strip identity) + close X.
                Tap close = sole dismiss affordance (no scrim, no swipe handle —
                page-drawer pattern per D-Reversal-2 Q-A=a). */}
            <div
              style={{
                height:       HEADER_HEIGHT,
                background:   v2.surface.warm,
                borderBottom: `1px solid ${v2.border.light}`,
                display:      "flex",
                alignItems:   "center",
                padding:      "0 18px",
                gap:          10,
                flexShrink:   0,
              }}
            >
              <PiLeaf size={16} color={v2.text.secondary} aria-hidden="true" />
              <span
                style={{
                  fontFamily:   FONT_LORA,
                  fontSize:     16,
                  fontWeight:   500,
                  // 1.3 floor for descender clearance — feedback_lora_lineheight_minimum_for_clamp.
                  lineHeight:   1.3,
                  color:        v2.text.primary,
                  flex:         1,
                  minWidth:     0,
                  whiteSpace:   "nowrap",
                  overflow:     "hidden",
                  textOverflow: "ellipsis",
                  textAlign:    "left",
                }}
              >
                {headerName}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close map"
                style={{
                  width:                   36,
                  height:                  36,
                  borderRadius:            "50%",
                  border:                  `1px solid ${v2.border.light}`,
                  background:              v2.surface.card,
                  display:                 "flex",
                  alignItems:              "center",
                  justifyContent:          "center",
                  color:                   v2.text.secondary,
                  padding:                 0,
                  cursor:                  "pointer",
                  flexShrink:              0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <PiX size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Map + contextual pill — fills remaining drawer height.
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

      {/* MallSheet picker — sibling modal so it layers above the page-drawer
          when "List view" tapped. Drawer stays mounted underneath. Clean
          two-layer stack (page → picker) identical to pre-session-154's
          /map page → MallSheet relationship. */}
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
// Migrated verbatim from app/(tabs)/map/page.tsx session-108 implementation.
// Floats top-right inside the map container; two states (Clear / List view)
// determined by scopeSet prop. PiX + PiList glyphs match v2-pure Phosphor
// vocabulary (session 145 BottomNav D1 sweep canonical).
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
  const label = scopeSet ? "Clear" : "List view";
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
        background:      v2.accent.green,
        color:           "#f5ecd8",
        border:          "none",
        cursor:          "pointer",
        fontFamily:      FONT_SYS,
        fontSize:        13,
        fontWeight:      600,
        letterSpacing:   "0.01em",
        boxShadow:       "0 4px 12px rgba(43,33,26,0.18)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <Icon size={15} aria-hidden="true" />
      {label}
    </button>
  );
}
