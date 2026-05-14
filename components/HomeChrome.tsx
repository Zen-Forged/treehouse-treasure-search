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
import { useRouter } from "next/navigation";
import MallStrip, { type MallStripScope } from "@/components/MallStrip";
import MallMapDrawer from "@/components/MallMapDrawer";
import { track } from "@/lib/clientEvents";
import { useMapDrawer } from "@/lib/useMapDrawer";
import type { Mall } from "@/types/treehouse";
import type { MallStats } from "@/lib/posts";

interface HomeChromeProps {
  malls:          Mall[];
  mallId:         string | null;
  onSetMallId:    (id: string | null) => void;
  mallStats?:     Record<string, MallStats>;
  savedByMallId?: Record<string, number>;
  /**
   * Session 165 Finding 5 — current SearchBar query string, threaded down
   * to MallMapDrawer so the drawer-context MallMatchChip can surface when
   * the query matches an active mall. Passed via prop (rather than read
   * via useSearchParams here) so HomeChrome stays free of router-state
   * dependencies. Defaults to "" — chip won't render when omitted.
   */
  query?:         string;
}

export default function HomeChrome({
  malls,
  mallId,
  onSetMallId,
  mallStats,
  savedByMallId,
  query = "",
}: HomeChromeProps) {
  // Session 157 — drawer state lifted to MapDrawerProvider (app root) so
  // (tabs) layout masthead can read drawerOpen for the back-button affordance
  // when the drawer is expanded. Local useState retires; HomeChrome is now
  // a consumer + setter, not the owner. Drawer mount is still here (only
  // Home shows the drawer) but state crosses the layout boundary via context.
  const { drawerOpen, closeDrawer, toggleDrawer } = useMapDrawer();
  const router = useRouter();

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
          toggleDrawer();
        }}
      />

      {/* Session 157 — SearchBar render lifted out of HomeChrome into the
          (tabs) layout. It now sits as fixed chrome between masthead and
          MallStrip (always visible during scroll). Layout owns the URL
          plumbing; Home page reads q from URL via useSearchParams. */}

      <MallMapDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        malls={malls}
        selectedMallId={mallId}
        mallStats={mallStats}
        savedByMallId={savedByMallId}
        query={query}
        onMallPick={(id) => {
          // Pin-commit: apply scope + close drawer + fire filter_applied.
          onSetMallId(id);
          closeDrawer();
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
        onMallSearchPick={(id) => {
          // Session 165 Finding 5 (Shape A dual-slot) — drawer-context chip
          // tap fires here. Same scope-change + drawer-close as pin-commit
          // but additionally clears the URL query (the typed mall name was
          // a navigation intent, not a tag-search refinement) and analytics
          // source: "search_mall_match" so R3 captures the discovery path.
          onSetMallId(id);
          closeDrawer();
          router.replace("/", { scroll: false });
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         "/",
            source:       "search_mall_match",
          });
        }}
      />
    </>
  );
}
