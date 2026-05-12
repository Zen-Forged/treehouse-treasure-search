// components/HomeChrome.tsx
// Session 154-155 — Arc 2.1 Home-only chrome wrapper. Composes <MallStrip>
// (persistent text strip below masthead) + <MallMapDrawer> (page-drawer
// disclosed by strip's chevron toggle) + standalone <SearchBar> row.
//
// Replaces the chunky <RichPostcardMallCard> mount that previously folded
// mall hero photo + search into one card at the top of Home. The strip-then-
// search vertical reading order matches the design record's "you're here,
// now find a thing" semantic ordering (D5).
//
// Design record: docs/home-chrome-restructure-design.md D1 + D2 + D5 + D7
//                + D-Reversal-2 (iterations 1 + 2).
//
// Why this is a Home-only component (per D7):
//   - Saved (/flagged) keeps its R18 per-mall stack chrome (Q2=b lock)
//   - /find, /shelf, /me, /admin etc. don't have a mall-scope picker
//   - Layout owns universal chrome (masthead + nav + ShareSheet); HomeChrome
//     owns the Home-specific scope picker + map drawer + search row
//
// Drawer-open state lives here (transient React state per D3); strip's
// chevron toggle flips it via setDrawerOpen((prev) => !prev). Scope state
// (mallId + setMallId) is owned by the parent page (Home owns useSavedMallId
// for the feed filter); HomeChrome receives mallId + onSetMallId as props
// so a single hook instance writes the canonical scope.
//
// Analytics: home_strip_tapped (D12) fires on every strip tap (open + close
// gestures both signal map-drawer engagement intent).

"use client";

import * as React from "react";
import MallStrip, { type MallStripScope } from "@/components/MallStrip";
import MallMapDrawer from "@/components/MallMapDrawer";
import SearchBar from "@/components/SearchBar";
import { track } from "@/lib/clientEvents";
import type { Mall } from "@/types/treehouse";
import type { MallStats } from "@/lib/posts";

interface HomeChromeProps {
  malls:          Mall[];
  mallId:         string | null;
  onSetMallId:    (id: string | null) => void;
  /**
   * Initial value for the SearchBar (deep-linked ?q= URL state). Mirrors
   * the prior <RichPostcardMallCard searchInitialQuery=...> contract.
   */
  searchInitialQuery: string;
  /**
   * Debounced (200ms inside SearchBar) onChange callback. Parent owns
   * ?q= URL state + posts filter — same contract as the prior wiring.
   */
  onSearchChange: (next: string) => void;
  mallStats?:     Record<string, MallStats>;
  savedByMallId?: Record<string, number>;
}

export default function HomeChrome({
  malls,
  mallId,
  onSetMallId,
  searchInitialQuery,
  onSearchChange,
  mallStats,
  savedByMallId,
}: HomeChromeProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Derive strip's identity from the malls array + current mallId. When
  // mallId is null OR doesn't resolve to an active mall (stale id, mid-fetch),
  // strip reads as all-Kentucky.
  const selectedMall = mallId
    ? malls.find((m) => m.id === mallId) ?? null
    : null;
  const stripScope: MallStripScope = selectedMall
    ? { id: selectedMall.id, slug: selectedMall.slug, name: selectedMall.name }
    : "all-kentucky";

  return (
    <>
      <MallStrip
        mall={stripScope}
        isOpen={drawerOpen}
        onTap={() => {
          // home_strip_tapped fires on every tap (open + close) per smoke
          // route precedent — close gesture is itself meaningful engagement
          // signal without a payload extension.
          track("home_strip_tapped", {
            mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
          });
          setDrawerOpen((prev) => !prev);
        }}
      />

      {/* Standalone SearchBar row — pulled out of RichPostcardMallCard.
          Sits inside page body (NOT sticky), scrolls away normally per D5.
          Padding 12px top / 16px L+R / 4px bottom matches the existing
          page padding rhythm. */}
      <div style={{ padding: "12px 16px 4px" }}>
        <SearchBar
          initialQuery={searchInitialQuery}
          onChange={onSearchChange}
        />
      </div>

      <MallMapDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        malls={malls}
        selectedMallId={mallId}
        mallStats={mallStats}
        savedByMallId={savedByMallId}
        onMallPick={(id) => {
          // Pin-commit: apply scope + close drawer + fire filter_applied.
          onSetMallId(id);
          setDrawerOpen(false);
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         "/",
            source:       "map_pin",
          });
        }}
        onClear={() => {
          // "Reset" pill: scope → null (all-Kentucky); drawer STAYS open per D2.
          onSetMallId(null);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: "all",
            page:         "/",
            source:       "map_reset",
          });
        }}
      />
    </>
  );
}
