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
import MapPageTransition from "@/components/MapPageTransition";
import MapCarousel from "@/components/MapCarousel";
// Session 179 — MallSheet import retired per David iPhone QA finding 4
// ("When selecting the thin mall chip it should navigate back to explore").
// MallSheet picker (session 178 D6 — chip onTap → opens MallSheet scope-
// picker) no longer has a trigger on /map; scope-changing now happens via
// pin tap → callout → Explore CTA (commits + routes to /) OR Reset button
// (clears scope, stays on /map). MallSheet.tsx file kept on disk for
// parked-component pattern (session 152 precedent); current zero
// runtime consumers in (tabs)/ flow. BoothPickerSheet.tsx still references
// MallSheet inheritance pattern in its file-top comment.
//
// Bounded reversal of session 178 D6 per
// feedback_surface_locked_design_reversals ✅ Promoted — D6 specified
// "tap chip → opens MallSheet scope-picker per Q-A locked in session
// 178 design pass." Session 179 reverses chip's role from "picker
// trigger" to "back-to-Explore navigation" (mirror of Home chip's
// forward-to-/map role); MallSheet picker becomes dormant on /map.
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
  // Session 179 — sheetOpen state retired alongside MallSheet import per
  // feedback_dead_code_cleanup_as_byproduct ✅ Promoted (finding 4 +
  // session 178 D6 reversal). No remaining consumer of bottom-sheet
  // open/close state on /map.

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
        // Matches /find/[id] + /shelf/[slug] exactly — David QA: "I'd
        // actually like the explore page masthead buttons to match... they
        // should all appear the same." Step 1 unifies /map's masthead bg
        // to the detail-page bg vocabulary (v2.surface.warm vs Arc 1.2's
        // v2.bg.tabs). Step 2 (next commit) flips v1.iconBubble token
        // value rgba → solid #EFEBDF so the button bubbles read identically
        // across every masthead-consuming surface regardless of underlying bg.
        bg={v2.surface.warm}
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
        // Session 180 — David iPhone QA finding 2: "Change the mall
        // selector chip at the top to the same bg color as the rest of
        // the page." /map's page bg is v2.surface.warm (#FBF6EA) per
        // session 179 (tabs)/layout pathname branch; passing the same
        // value as stickyBg dissolves the chip's sticky-strip color
        // boundary into the page-bg surface. Schema-forced extension
        // (additive prop) per feedback_schema_forced_deviation_not_
        // design_reversal ✅ Promoted — 8th cumulative firing.
        stickyBg={v2.surface.warm}
        // Session 179 — David iPhone QA finding 3: "The carat should be
        // turned on the Map page to show it's opened." chevron-up on /map
        // mirrors Home's chevron-down: tap-down = expand to /map,
        // tap-up = collapse back to /. Pair behavior with finding 4 below.
        chevronDirection="up"
        onTap={() => {
          // Session 179 — David iPhone QA finding 4: "When selecting the
          // thin mall chip it should navigate back to explore." Bounded
          // reversal of session 178 D6 (chip → MallSheet scope-picker) per
          // feedback_surface_locked_design_reversals ✅ Promoted. Chip's
          // role on /map becomes navigation back to / (mirror of Home
          // chip's forward-to-/map role). MallSheet picker retired (state
          // + JSX + import removed elsewhere in this commit).
          //
          // Scope-changing on /map now happens exclusively via pin tap
          // → callout → Explore CTA (commits + routes to /) OR Reset
          // (clears scope, stays on /map).
          //
          // Analytics: home_strip_tapped intentionally NOT fired on this
          // path — back-navigation is not picker engagement; semantically
          // different from Home chip's "tap to expand" event. Operational
          // drift flagged: if R3 analytics needs explicit back-nav
          // tracking, add a dedicated event in a follow-up commit (avoid
          // overloading home_strip_tapped with mismatched semantic).
          router.push("/");
        }}
      />

      <MapPageTransition>
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
            // to distinguish from map_page_sheet (D6 picker) + map_page_reset.
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
      </MapPageTransition>

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

      {/* Session 179 — MallSheet JSX retired per finding 4 + session 178
          D6 reversal (chip-as-back-to-Explore replaces chip-as-picker-
          trigger). map_page_sheet analytics path also retires here;
          map_page_pin (Explore CTA on PinCallout) + map_page_reset
          (Reset button) preserved as the surviving scope-management
          analytics paths. */}
    </>
  );
}
