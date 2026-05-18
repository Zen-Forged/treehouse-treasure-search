// components/TabsChrome.tsx
// Session 166 Arc 3.1.2 — orchestrator for the new (tabs)/ chrome stack
// per session 164 design record (docs/home-hero-design.md).
//
// Replaces session 154-157's chrome stack:
//   - StickyMasthead (84px sticky)            → retired from (tabs)/
//   - SearchBarRow (56px fixed below masthead) → retired (search lives
//     inside HomeHero per Frame C D6)
//   - MallStrip (36px fixed below search)     → retired (replaced by
//     inline MallPickerChip below hero per D10 + D11)
//   - HomeChrome (Home-only composition of MallStrip + MallMapDrawer)
//                                              → retired (functionality
//                                              absorbed here at layout level)
//
// With the new chrome stack (universal across Home + Saved per Call 2
// Option C resolved session 166):
//   - <HomeHero> — sticky-collapsing-header per D16 (33vh hero collapses
//     to STICKY_THIN_HEIGHT_PX=90 sticky strip on scroll). SearchBar
//     embedded inside hero, conditional on pathname === "/" per session
//     121 R18 D-lock (saved finds don't participate in search).
//   - <MallPickerChip> — inline below hero per D10 + D11. Identity-level
//     serif anchoring the hero composition. Tap → opens MallMapDrawer.
//   - <MallMapDrawer> — page-drawer picker (canonical (tabs)/ picker
//     since session 154; sessions 154-165 evolved it extensively).
//     Mounted at layout level so the drawer is available from both
//     Home + Saved chrome.
//
// Schema-forced deviation surfaced at Arc 3 entry per
// feedback_schema_forced_deviation_not_design_reversal ✅ Promoted-via-memory
// (would be 6th cumulative firing): design record D10 says
// "Tap fires onTap — typically opens existing MallSheet primitive."
// MallSheet has been dormant in (tabs)/ chrome since session 158;
// canonical (tabs)/ picker today is MallMapDrawer (sessions 154-165).
// NOT a design reversal — ship with production-canonical picker, surface
// the contract drift here for traceability.
//
// `?mall=<slug>` URL intake moves from layout into TabsChrome since
// this is where malls + setMallId now live together. Reads via
// useSearchParams (was window.location to keep layout statically
// prerenderable); TabsChrome itself is wrapped in <Suspense> by the
// layout so the dynamic-rendering bailout is contained here.

"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HomeHero from "@/components/HomeHero";
import MallPickerChip from "@/components/MallPickerChip";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton from "@/components/MastheadBackButton";
import StickyMasthead from "@/components/StickyMasthead";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import type { Mall } from "@/types/treehouse";

// Session 166 Shape A — floating chrome affordances (Profile right /
// optional Back left when drawer open) overlay the hero photo as
// position:fixed at top of viewport. Restores access lost when Arc 3.1.3
// retired StickyMasthead from (tabs)/ chrome.
//
// Session 166 round-6 dial — viewport-y + horizontal-x match
// StickyMasthead exactly per David's "back and profile button were
// always in the exact same location horizontally and vertically on
// the screen … use /find and /shelf as reference." Both calls derive
// from StickyMasthead's slot geometry:
//   - OVERLAY_TOP: same as StickyMasthead's button viewport-y =
//     paddingTop + (innerGrid - buttonHeight)/2 = max(14, env-safe-area)
//     + (72 - 44)/2 = max(14, env-safe-area) + 14.
//   - OVERLAY_X:   matches StickyMasthead paddingLeft/Right = 18.
// Visual parity across /find + /shelf + Home + Saved chrome corners.
const OVERLAY_TOP    = "calc(max(14px, env(safe-area-inset-top, 14px)) + 14px)";
const OVERLAY_X      = 18;
const OVERLAY_Z      = 50;

// Session 175 — module-scope cache for malls per
// feedback_module_scope_cache_for_warm_nav_hydration ✅ Promoted
// (5th cumulative firing post-promotion at session 168). On cold mount
// the cache is null → getActiveMalls() fetches + populates; on warm-nav
// re-mount (Saved → Explore tab switch) useState initializer hydrates
// from cache synchronously, eliminating the chip's "All Kentucky
// locations" → actual-mall-name flicker David surfaced on iPhone QA
// session 175 (paired with useSavedMallId's cachedMallId for full
// sync-hydration of selectedMall computation on warm-nav).
let cachedMalls: Mall[] | null = null;

export default function TabsChrome() {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls] = useState<Mall[]>(() => cachedMalls ?? []);

  useEffect(() => {
    getActiveMalls().then((next) => {
      cachedMalls = next; // populate cache for future re-mounts
      setMalls(next);
    });
  }, []);

  // Session 178 F2 Arc 3.2 — useMapDrawer + close-on-leave-Home effect
  // retire alongside MallMapDrawer. Map scope-picker moved to dedicated
  // /map route at Arc 1; no shared drawer-open state to manage across
  // route transitions, no "drawer still open after nav back to Home"
  // race to resolve. Dead-code retire per
  // feedback_dead_code_cleanup_as_byproduct ✅ Promoted.
  //
  // Session 175 Option α had already retired the session 166 dial 3
  // drawer-open auto-scroll for unrelated reasons; CSS var
  // --th-safe-area-inset-top in globals.css kept as substrate for any
  // future safe-area-aware JS consumer (single line, zero cost).

  const isHome = pathname === "/";
  const q      = searchParams.get("q") ?? "";

  // Session 166 dial 7 — chip retires on Saved per David's "We do not
  // need the mall-chip on the saved page as it's not filtered by location
  // and stores all finds." Within-session reversal of Call 2 Option C
  // (resolved earlier in session 166 as "hero universal across Home +
  // Saved, SearchBar conditional on Home only"). Updated read: hero
  // universal, chip Home-only since R18 (session 121) retired mall-scoping
  // for Saved content. Hero stays universal as identity beat per Option C
  // original intent.
  //
  // Session 178 F2 Arc 3.2 — variable rename `showChipAndDrawer` → `showChip`
  // since MallMapDrawer retired this arc (chip is the only Home-only
  // conditional now).
  const showChip = isHome;

  // Session 157 — search URL plumbing pattern preserved verbatim from
  // SearchBarRow.tsx. Typing in search always replaces to "/" regardless
  // of current pathname so search from Saved (if ever exposed) routes to
  // Home with the query applied. Currently only Home renders the input
  // (per Option C) so the cross-route case is dormant.
  const handleSearchChange = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  // Session 109 — receive shared mall scope from URL. Moved here from
  // layout (was reading window.location to keep layout prerenderable;
  // TabsChrome already pays the useSearchParams cost so use the reactive
  // hook). When `?mall=<slug>` arrives, look up the mall id + persist +
  // strip the param. Idempotent — no-ops if scope matches OR slug unknown.
  useEffect(() => {
    if (malls.length === 0) return;
    const slugParam = searchParams.get("mall");
    if (!slugParam) return;
    const target = malls.find((m) => m.slug === slugParam);
    if (!target) return;
    if (target.id !== mallId) {
      setMallId(target.id);
      track("filter_applied", {
        filter_type:  "mall",
        filter_value: target.slug,
        page:         pathname,
        source:       "shared_url",
      });
    }
    // Strip the query param. Preserve other params (notably ?q=).
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mall");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // mallId intentionally excluded — re-firing after setMallId would dead-loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malls, searchParams, pathname]);

  // Derive picker chip's identity from malls + current mallId. Stale id
  // OR null → "All Kentucky locations" (canonical all-scope label).
  const selectedMall = mallId
    ? malls.find((m) => m.id === mallId) ?? null
    : null;
  const mallName = selectedMall ? selectedMall.name : "All Kentucky locations";

  // Session 178 F2 Arc 1.2 — /map renders its own chrome (StickyMasthead +
  // MallPickerChip + MapPageBody + MapCarousel) since the (tabs)/ HomeHero
  // pattern doesn't apply on the map page (no hero photo, standard masthead
  // per D9 + D10). TabsChrome early-returns null on /map so we don't
  // double-render the floating Profile overlay, HomeHero, or MallPickerChip.
  // Placed AFTER all hook calls per React rules-of-hooks — hooks must run
  // unconditionally so a route transition between (tabs)/ children doesn't
  // change the hook order. This early-return is a temporary scaffold —
  // Arc 3.2 simplifies TabsChrome substantially when MallMapDrawer +
  // useMapDrawer retire (the drawer composition was TabsChrome's primary
  // purpose; once retired the orchestrator may collapse to a thin layout
  // shim or fold into (tabs)/layout.tsx directly).
  if (pathname === "/map") return null;

  // Session 182 — Saved chrome restructure per David's "I want to change
  // the header on the saved page to match the other pages (not explore
  // page)." Replace HomeHero (33vh background-image identity beat) with
  // the slim <StickyMasthead> pattern /me + /map + /find/[id] + /shelf
  // use. Saved gains the same back-button-left + wordmark-center +
  // Profile-right chrome as /map, so the cross-(tabs) chrome reads
  // consistently when navigating Home → Saved → Map.
  //
  // Floating MastheadBackButton + MastheadProfileButton overlays retire
  // on Saved this commit — their slots now live inside StickyMasthead's
  // left + right props. Home keeps the floating Profile overlay (HomeHero
  // has no slots for Profile to sit in) + no back button (Home is the
  // root, no back-from route).
  //
  // BOUNDED REVERSAL of session 175 Option α + session 121 R18 D-lock per
  // feedback_surface_locked_design_reversals ✅ Promoted (~80+ cumulative
  // firings; 11th firing this session). Session 175 made the hero
  // universal across Home + Saved as a full-identity-beat thesis ("hero
  // stays full 33vh sticky on Home; static on Saved"). David's session
  // 182 redirect scopes that reversal narrowly: Home keeps the hero
  // (still load-bearing identity beat for the Explore surface); Saved
  // adopts the slim StickyMasthead because shoppers reaching Saved
  // already know what app they're in — the identity beat is redundant
  // chrome competing with their saved-finds content.
  //
  // bg prop omitted — StickyMasthead defaults to v2.bg.main (#E6DECF)
  // which matches Saved's page bg (v2.bg.tabs, same hex per session 166
  // dial 8 tier extraction). No bg dial needed.
  if (pathname === "/flagged") {
    return (
      <StickyMasthead
        left={<MastheadBackButton fallback="/" />}
        right={<MastheadProfileButton />}
      />
    );
  }

  return (
    <>
      <HomeHero
        // Option C as amended at dial 7 — SearchBar Home-only AND chip +
        // drawer Home-only. On Saved, hero renders alone (no search input,
        // no chip below it) as identity beat. R18 (session 121) retired
        // mall-scoping for Saved content, so chip would be a dead
        // affordance there.
        //
        // Session 182 — Saved path now early-returns above with
        // StickyMasthead instead of mounting HomeHero. HomeHero on this
        // path only renders for pathname === "/" (Home). The Saved-branch
        // of `searchQuery` ternary is dormant but kept for traceability;
        // if a future Saved-page redesign re-mounts HomeHero, the prop
        // contract still works.
        searchQuery={isHome ? q : undefined}
        onSearchChange={isHome ? handleSearchChange : undefined}
      />

      {/* Session 166 Shape A commit 1 — Profile chrome affordance restored
          as floating overlay at top-right of viewport. Arc 3.1.3 retired
          StickyMasthead from (tabs)/ which also retired the masthead-right
          Profile slot (session 159 placement). Session 182 — Saved branch
          retired (Profile now lives in StickyMasthead right slot for
          Saved); Profile overlay is now Home-only since Home is the only
          surface where HomeHero (no slots) is the chrome primitive.
          MastheadProfileButton self-derives auth state via useShopperAuth
          — routes guest→/login, admin→/admin, shopper→/me. Floats over
          hero photo at top (dark woodgrain area of asset; doesn't compete
          with centered wordmark) and stays pinned at viewport top during
          scroll. */}
      <div
        style={{
          position: "fixed",
          top:      OVERLAY_TOP,
          right:    OVERLAY_X,
          zIndex:   OVERLAY_Z,
        }}
      >
        <MastheadProfileButton />
      </div>

      {showChip && (
        <MallPickerChip
          mallName={mallName}
          onTap={() => {
            // Reuses session 154 home_strip_tapped event name — same
            // semantic ("user tapped the mall picker chrome to engage map
            // wayfinding"); event-key stability avoids R3 schema drift.
            //
            // Session 178 F2 Arc 3.1 — handler routes to /map per design
            // record D1. Reverses session 109's /map page deletion +
            // retires session 155's drawer-overlay reshape; chip is the
            // canonical entry path to the dedicated /map route.
            //
            // Tier B5 (chip caret visual): chevron-down currently implies
            // "opens drawer below"; Arc 3.1 routes instead. Deferred to
            // iPhone QA at Arc 5 — flip to chevron-right / PiArrowRight
            // if QA flags ambiguity.
            //
            // Session 178 F2 Arc 3.2 — MallMapDrawer mount + all drawer
            // handlers (onMallPick / onClear / onMallSearchPick from
            // sessions 109 / 158 / 165) retired in same commit as
            // useMapDrawer / MapDrawerProvider per
            // feedback_dead_code_cleanup_as_byproduct ✅ Promoted and
            // feedback_single_coupled_commit_when_must_move_together
            // ✅ Promoted (drawer wrapper + handlers + context +
            // app-layout provider all interlocked; splitting would leave
            // intermediate commits with dangling-reference compile
            // errors).
            //
            // Search-context MallMatchChip dual-slot pattern from session
            // 165 Shape A loses the drawer-overlay slot here; Home's
            // inline MallMatchChip mount in app/(tabs)/page.tsx
            // (session 165) is the surviving consumer + carries the
            // search_mall_match analytics path forward unchanged.
            track("home_strip_tapped", {
              mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
            });
            router.push("/map");
          }}
        />
      )}
    </>
  );
}
