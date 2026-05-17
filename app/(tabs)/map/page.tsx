// app/(tabs)/map/page.tsx
// Session 178 F2 Arc 1.2 — Map page extraction R-session, real /map route.
//
// Pure execution against docs/map-page-extraction-design.md (locked
// session 176 C2). Reverses session 109's /map page deletion + retires
// session 155's drawer-overlay reshape; revives the pre-155 "contained
// window" feel David explicitly referenced.
//
// Composition top-to-bottom per D9 + D10 + D11 + Frame A:
//   1. StickyMasthead (standard chrome — back-button left, profile right,
//      wordmark center). Matches /find/[id] + /shelf/[slug] visual
//      contract exactly so cross-surface chrome continuity reads as
//      "still part of the app" (verbatim from David's ask).
//   2. MallPickerChip stickyTop={0} — mirror of Home's MallStrip per D2.
//      Same primitive, same visual treatment, same current-scope label.
//      Arc 1.2: display-only (onTap is console.log no-op); Arc 2.2 wires
//      MallSheet picker per D6.
//   3. <MapPageBody> bordered window per Frame A (D5 + D14).
//   4. <MapCarousel> page-level chrome sibling per D15 (always-open since
//      /map has no drawer to gate on). Bottom-fixed; shelf-aware fitBounds
//      padding handled inside TreehouseMap.
//
// TabsChrome early-returns null on /map (this commit) so the (tabs)/
// HomeHero + floating Profile overlay + drawer don't double-render against
// this page's inline StickyMasthead. The (tabs)/layout still provides
// BottomNav inheritance + the maxWidth-430 mobile column wrapper.
//
// Arc 1.2 ships scope state + handlers stubbed to console.log. Arc 1.3
// upgrades the handlers (Arc 1.3 deliberately separate from Arc 1.2 to
// validate Frame A geometry on real device BEFORE handler wiring lands).
//
// What's NOT here yet:
//   - MallPickerChip onTap → MallSheet picker (Arc 2.2)
//   - PinCallout commit → router.push('/') routing (Arc 3.1)
//   - Framer-motion slide-up transition (Arc 4.1)
//   - Search via `?q=` query (intentionally absent per D6 — David verbatim:
//     "It should not include a search bar")
//
// Risk R6 carries: Mapbox preview-only token still not set up
// (Tier B2, 24-session carry now: 156→178) — /map will silently fail
// tile fetches on Vercel preview as expected; production-PWA QA is the
// fallback for this commit, same as every Mapbox-touching ship since
// session 156. Watchdog from session 156 will surface the "Map didn't
// load. Tap to retry." overlay if Vercel preview tile fetches fail.

"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useRouter } from "next/navigation";
import StickyMasthead from "@/components/StickyMasthead";
import MastheadBackButton from "@/components/MastheadBackButton";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MallPickerChip from "@/components/MallPickerChip";
import MapPageBody from "@/components/MapPageBody";
import MapCarousel from "@/components/MapCarousel";
import MallSheet from "@/components/MallSheet";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v2 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

// Session 178 — module-scope cache for malls per
// feedback_module_scope_cache_for_warm_nav_hydration ✅ Promoted at
// session 168 (6th cumulative firing post-promotion; mirrors TabsChrome's
// cachedMalls pattern from session 175 — same warm-nav hydration concern
// applies here when user navigates Home → /map → Home → /map).
let cachedMalls: Mall[] | null = null;

export default function MapPage() {
  const router = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls] = React.useState<Mall[]>(() => cachedMalls ?? []);
  const [peekedMallId, setPeekedMallId] = React.useState<string | null>(null);
  const [resetKey, setResetKey] = React.useState(0);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    getActiveMalls().then((next) => {
      cachedMalls = next;
      setMalls(next);
    });
  }, []);

  // Auto-peek the selected mall on mount so the PinCallout surfaces
  // immediately (Directions / Explore CTAs visible without an extra tap).
  // Mirrors MallMapDrawer's auto-peek effect (session 108). Only fires
  // when the page first mounts (not on selectedMallId changes after mount
  // — those originate from inside the page; re-peeking would feel like a
  // bug per session 108 D26 reasoning).
  React.useEffect(() => {
    if (mallId) setPeekedMallId(mallId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive picker chip's identity from malls + current mallId. Stale id
  // OR null → "All Kentucky locations" (canonical all-scope label,
  // matches TabsChrome's selectedMall pattern verbatim).
  const selectedMall = mallId
    ? malls.find((m) => m.id === mallId) ?? null
    : null;
  const mallName = selectedMall ? selectedMall.name : "All Kentucky locations";

  return (
    <>
      <StickyMasthead
        bg={v2.bg.tabs}
        left={<MastheadBackButton fallback="/" />}
        right={<MastheadProfileButton />}
      />

      <MallPickerChip
        mallName={mallName}
        // D11 — no hero on /map, so chip pins flush below masthead at
        // top:0 (StickyMasthead is position:fixed at the top of the
        // viewport; its spacer reserves the page-flow height so the chip
        // pins below it in document flow when scrolled).
        stickyTop={0}
        onTap={() => {
          // Arc 2.2 — opens MallSheet scope-picker per D6. Reuses
          // home_strip_tapped analytics event name from TabsChrome (same
          // semantic — "user tapped the mall picker chrome to engage
          // scope wayfinding"); event-key stability avoids R3 schema drift.
          track("home_strip_tapped", {
            mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
          });
          setSheetOpen(true);
        }}
      />

      <MapPageBody
        malls={malls}
        selectedMallId={mallId}
        peekedMallId={peekedMallId}
        resetKey={resetKey}
        onPinTap={(id) => setPeekedMallId(id)}
        onMapTap={() => setPeekedMallId(null)}
        onCommit={(id) => {
          // Arc 3.1 — D7: PinCallout "Explore" CTA on /map commits scope
          // + routes back to / (Explore feed). The map page is "pick
          // where to shop" utility — committing a scope means "let me
          // see what's there" = Explore feed with the new scope active.
          //
          // useSavedMallId's cross-instance event broadcast (session 110
          // fix to session 109 shared-layout drift) ensures the chip on
          // Home hydrates to the new mall name synchronously on next
          // nav — no flash through the all-Kentucky chip state on
          // return.
          //
          // peekedMallId clear runs but is purely cosmetic at this point
          // since /map is about to unmount on router.push('/').
          //
          // Analytics fire as filter_applied with source: "map_page_pin"
          // to distinguish from drawer-context map_pin commits (which
          // still fire on Home until Arc 3.2 retires the drawer). Once
          // Arc 3.2 retires the drawer, source values consolidate around
          // map_page_pin + map_carousel_card + search_mall_match.
          setMallId(id);
          setPeekedMallId(null);
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         "/map",
            source:       "map_page_pin",
          });
          router.push("/");
        }}
        onReset={() => {
          // Reset is the single "back to the default Kentucky view"
          // affordance per session 165 dial — clears scope + dismisses
          // peek + bumps resetKey so TreehouseMap's fitBounds effect
          // re-runs even when scope was already null (mirrors
          // MallMapDrawer's handleReset semantic from session 161).
          setMallId(null);
          setPeekedMallId(null);
          setResetKey((n) => n + 1);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: "all",
            page:         "/map",
            source:       "map_page_reset",
          });
        }}
      />

      <MapCarousel
        // /map has no drawer to gate on — carousel is always visible per
        // D15 (page-level chrome sibling, not drawer-internal). The `open`
        // prop drives MapCarousel's AnimatePresence; passing true mounts
        // it without entrance animation on the page (matches the design
        // record's "always visible" framing).
        open={true}
        malls={malls}
        selectedMallId={mallId}
        peekedMallId={peekedMallId}
        onCardTap={(id) => setPeekedMallId(id)}
      />

      <MallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        malls={malls}
        activeMallId={mallId}
        // D6 — tap a mall → commits scope + closes sheet (stays on /map,
        // map flies to new scope via the useEffect inside TreehouseMap
        // that fires on selectedMallId change). All-Kentucky row at top
        // of the sheet maps to (mallId === null) → setMallId(null).
        // Auto-peek the newly committed scope so PinCallout surfaces
        // immediately with Directions/Explore CTAs visible — matches
        // /map's mount-time auto-peek behavior; consistent affordance
        // across both code-path entries to a scope.
        onSelect={(id) => {
          setMallId(id);
          setPeekedMallId(id);
          setSheetOpen(false);
          const picked = id ? malls.find((m) => m.id === id) : null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? (id ?? "all"),
            page:         "/map",
            source:       "map_page_sheet",
          });
        }}
        // findCounts intentionally omitted — /map's scope picker is a
        // "switch what slice of Kentucky you're looking at" affordance,
        // not a "see find inventory per location" affordance (the
        // MapCarousel + the map pins themselves surface inventory cues).
        // Skipping findCounts also avoids an extra fetch on /map mount.
      />
    </>
  );
}
