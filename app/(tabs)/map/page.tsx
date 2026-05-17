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
import StickyMasthead from "@/components/StickyMasthead";
import MastheadBackButton from "@/components/MastheadBackButton";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MallPickerChip from "@/components/MallPickerChip";
import MapPageBody from "@/components/MapPageBody";
import MapCarousel from "@/components/MapCarousel";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls } from "@/lib/posts";
import { v2 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

// Session 178 — module-scope cache for malls per
// feedback_module_scope_cache_for_warm_nav_hydration ✅ Promoted at
// session 168 (6th cumulative firing post-promotion; mirrors TabsChrome's
// cachedMalls pattern from session 175 — same warm-nav hydration concern
// applies here when user navigates Home → /map → Home → /map).
let cachedMalls: Mall[] | null = null;

export default function MapPage() {
  const [mallId] = useSavedMallId();
  const [malls, setMalls] = React.useState<Mall[]>(() => cachedMalls ?? []);
  const [peekedMallId, setPeekedMallId] = React.useState<string | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

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
          // Arc 1.2 — display-only. Arc 2.2 wires MallSheet picker per D6.
          // eslint-disable-next-line no-console
          console.log("[/map] MallPickerChip tap — picker lands at Arc 2.2");
        }}
      />

      <MapPageBody
        malls={malls}
        selectedMallId={mallId}
        peekedMallId={peekedMallId}
        resetKey={resetKey}
        onPinTap={(id) => {
          // eslint-disable-next-line no-console
          console.log("[/map] onPinTap", id);
          setPeekedMallId(id);
        }}
        onMapTap={() => {
          // eslint-disable-next-line no-console
          console.log("[/map] onMapTap");
          setPeekedMallId(null);
        }}
        onCommit={(id) => {
          // Arc 1.2 — stub. Arc 3.1 wires scope commit + router.push('/')
          // per D7 (committing a scope = "let me see what's there" = Explore
          // feed). Today it just logs.
          // eslint-disable-next-line no-console
          console.log("[/map] onCommit (Arc 3.1 wires scope+route)", id);
        }}
        onReset={() => {
          // Arc 1.2 — local-only Reset (peek dismiss + fitBounds re-fire).
          // Scope clearing lives in useSavedMallId hook setter; Arc 1.3
          // wires the setter pathway. For Arc 1.2 the Reset visual + the
          // fitBounds re-fire are validatable in isolation.
          // eslint-disable-next-line no-console
          console.log("[/map] onReset");
          setPeekedMallId(null);
          setResetKey((n) => n + 1);
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
    </>
  );
}
