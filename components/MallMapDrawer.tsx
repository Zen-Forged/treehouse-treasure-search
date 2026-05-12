// components/MallMapDrawer.tsx
// Session 154 — Home chrome restructure. Bottom-sheet drawer composing
// <BottomSheet> (Layer 2 primitive, session 149) + <TreehouseMap>
// (session 108) + migrated <MapControlPill> from app/(tabs)/map/page.tsx.
//
// Design record: docs/home-chrome-restructure-design.md D2.
//
// Why this primitive exists:
//   Companion to <MallStrip>. Tap on the strip opens this drawer with the
//   Mapbox map fitting/flying to the current scope. The drawer becomes the
//   canonical map UX on Home (replaces the /map page tab — Q1=a lock).
//
//   FB Marketplace literal: tap the location text → bottom sheet rises with
//   the map. Dismiss by handle / ✕ / dimmed area. Pin commit closes drawer
//   and updates strip + feed scope.
//
// Composition:
//   - <BottomSheet>     scrim + sheet container + handle + ✕ close (session 149)
//   - <TreehouseMap>    Mapbox map at 60vh inside body
//   - <MapControlPill>  Clear / List view affordance (migrated from /map page)
//   - <MallSheet>       all-malls picker (sibling modal; opens from List view)
//
// Pure presentation primitive — drawer-open state lives in consumer
// (<HomeChrome> in Arc 2). MallMapDrawer just reads `open` prop and renders.
// Pin commit fires `onMallPick(id)`; consumer handles the scope update +
// drawer close + analytics fire. Clear pill fires `onClear()` (drawer stays
// open per D2; scope clears).
//
// Lazy mount: <TreehouseMap> is dynamic-imported with ssr:false (preserves
// session 108's mapbox-gl SSR-safety pattern). Pre-import on the page level
// for fast first-open if the parent wants — see /home-chrome-test smoke
// route for the canonical mount pattern.

"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { PiX, PiList } from "react-icons/pi";
import { BottomSheet } from "./ui/BottomSheet";
import MallSheet from "./MallSheet";
import { v2, FONT_LORA, FONT_SYS } from "@/lib/tokens";
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

// Map height inside drawer body. 60vh keeps the drawer ~65vh total (handle +
// TopBar add ~52px of chrome above the map). Tested to expose ~30-35% of
// the page above the drawer for the dimmed-overlay tap-to-dismiss surface.
const MAP_HEIGHT_VH = 60;

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
      <BottomSheet
        open={open}
        onClose={onClose}
        ariaLabel="Active locations map"
      >
        {/* Title row — FONT_LORA matches StickyMasthead + design record D2 */}
        <div
          style={{
            display:       "flex",
            justifyContent: "center",
            paddingBottom: 10,
            paddingTop:    4,
          }}
        >
          <span
            style={{
              fontFamily: FONT_LORA,
              fontSize:   16,
              fontWeight: 500,
              lineHeight: 1.3,
              color:      v2.text.primary,
            }}
          >
            Active locations
          </span>
        </div>

        {/* Map + contextual pill, anchored together inside a relative wrapper
            so the pill positions against the map container. */}
        <div
          style={{
            position:     "relative",
            height:       `${MAP_HEIGHT_VH}vh`,
            margin:       "0 -22px", // Extend edge-to-edge inside BottomSheet's 22px body padding
            overflow:     "hidden",
            borderTop:    `1px solid ${v2.border.light}`,
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
      </BottomSheet>

      {/* MallSheet picker — sibling modal so it can layer above the drawer
          when "List view" tapped. Drawer stays mounted underneath. */}
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
