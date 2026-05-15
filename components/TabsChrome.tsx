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
import MallMapDrawer from "@/components/MallMapDrawer";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton from "@/components/MastheadBackButton";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useMapDrawer } from "@/lib/useMapDrawer";
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

export default function TabsChrome() {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mallId, setMallId] = useSavedMallId();
  const { drawerOpen, closeDrawer, toggleDrawer } = useMapDrawer();
  const [malls, setMalls] = useState<Mall[]>([]);

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  // Session 166 dial 3 (post-Arc-3.1.3 iPhone QA) — when drawer opens at
  // scrollY=0, hero is still at full 33vh (no scroll engaged sticky-
  // collapse yet), so the drawer renders BEHIND the hero from y=152 down.
  // David's ask: "The hero and search header should collapse and move to
  // the top as if the user had scrolled down past the hero-image."
  //
  // Force-scroll to a value just past the hero sticky-engagement threshold
  // (33vh ≈ 280px - 90px sticky-visible-strip = 190px). 200px scrolls a
  // hair past the threshold so both hero AND chip engage their sticky
  // pins in one shot. Behavior 'smooth' so the auto-scroll reads as a
  // natural transition not an abrupt jump. No-op when scrollY already
  // past 190 (user scrolled before opening drawer — preserve their
  // scroll position).
  useEffect(() => {
    if (!drawerOpen) return;
    if (typeof window === "undefined") return;

    // Session 166 dial 10 — compute the sticky-engagement threshold
    // dynamically since STICKY_THIN_HEIGHT is now safe-area-aware (varies
    // ~158px on non-notched → ~191px on notched iPhones via env(safe-area-
    // inset-top)). Engagement happens at scrollY = 33vh - STICKY_THIN_HEIGHT.
    //
    // Reads --th-safe-area-inset-top (CSS var bridge in globals.css since
    // env() can only be used inside CSS). Matches HomeHero's HERO_STRIP_
    // HEIGHT_HOME formula: max(14, safe-area) + 84 + 60 = MASTHEAD_HEIGHT
    // + 60. Scrolling to exactly this value flushes feed top with chip
    // sticky-pinned bottom on any device.
    const safeAreaTopRaw = getComputedStyle(document.documentElement)
      .getPropertyValue("--th-safe-area-inset-top")
      .trim();
    const safeAreaTop      = parseFloat(safeAreaTopRaw) || 0;
    const mastheadHeight   = Math.max(14, safeAreaTop) + 84;
    const stickyThinHeight = mastheadHeight + 60;
    const heroFlowPx       = window.innerHeight * 0.33;
    const engagementY      = heroFlowPx - stickyThinHeight;

    if (window.scrollY < engagementY) {
      window.scrollTo({ top: engagementY, behavior: "smooth" });
    }
  }, [drawerOpen]);

  const isHome = pathname === "/";
  const q      = searchParams.get("q") ?? "";

  // Session 166 dial 7 (post-dial-6 iPhone QA round 4) — chip + drawer
  // retire on Saved per David's "We do not need the mall-chip on the saved
  // page as it's not filtered by location and stores all finds."
  //
  // Within-session reversal of Call 2 Option C (resolved earlier this
  // session as "hero universal across Home + Saved, SearchBar conditional
  // on Home only"). Updated read: hero universal, chip + drawer also
  // Home-only since chip has no functional purpose on Saved (R18 session
  // 121 retired mall-scoping for Saved content; chip would be a dead
  // affordance there). Hero stays universal as identity beat per Option C
  // original intent. Surfaced explicitly per
  // feedback_surface_locked_design_reversals ✅ Promoted.
  const showChipAndDrawer = isHome;

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

  return (
    <>
      <HomeHero
        // Option C as amended at dial 7 — SearchBar Home-only AND chip +
        // drawer Home-only. On Saved, hero renders alone (no search input,
        // no chip below it) as identity beat. R18 (session 121) retired
        // mall-scoping for Saved content, so chip would be a dead
        // affordance there.
        searchQuery={isHome ? q : undefined}
        onSearchChange={isHome ? handleSearchChange : undefined}
      />

      {/* Session 166 Shape A commit 2 — Back button restored as floating
          overlay at top-left of viewport WHEN drawer is open. Arc 3.1.3
          retired StickyMasthead which removed the masthead-left back
          slot (session 157 wiring closed the drawer on tap). Restores
          that close-drawer affordance. Drawer is Home-only post-dial-7,
          so drawerOpen===true implies isHome — no separate pathname gate
          needed. MastheadBackButton primitive reused with onClick prop
          (session 157 pattern) so handler runs closeDrawer instead of
          router.back(). */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            top:      OVERLAY_TOP,
            left:     OVERLAY_X,
            zIndex:   OVERLAY_Z,
          }}
        >
          <MastheadBackButton onClick={closeDrawer} />
        </div>
      )}

      {/* Session 166 Shape A commit 1 — Profile chrome affordance restored
          as floating overlay at top-right of viewport. Arc 3.1.3 retired
          StickyMasthead from (tabs)/ which also retired the masthead-right
          Profile slot (session 159 placement). Universal across Home +
          Saved per the original session 159 Q3 lock ("Profile universal
          across all pages"). MastheadProfileButton self-derives auth state
          via useShopperAuth — routes guest→/login, admin→/admin,
          shopper→/me. Floats over hero photo at top (dark woodgrain area
          of asset; doesn't compete with centered wordmark) and stays
          pinned at viewport top during scroll. */}
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

      {showChipAndDrawer && (
        <MallPickerChip
          mallName={mallName}
          onTap={() => {
            // Reuses session 154 home_strip_tapped event name — same
            // semantic ("user tapped the mall picker chrome to engage map
            // wayfinding"); event-key stability avoids R3 schema drift.
            track("home_strip_tapped", {
              mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
            });
            toggleDrawer();
          }}
        />
      )}

      {showChipAndDrawer && <MallMapDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        malls={malls}
        selectedMallId={mallId}
        query={q}
        onMallPick={(id) => {
          setMallId(id);
          closeDrawer();
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         pathname,
            source:       "map_pin",
          });
        }}
        onClear={() => {
          setMallId(null);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: "all",
            page:         pathname,
            source:       "map_reset",
          });
        }}
        onMallSearchPick={(id) => {
          // Session 165 Shape A dual-slot — drawer-context MallMatchChip
          // tap fires here. Scope-change + drawer-close + clear query
          // (the typed mall name was navigation intent, not search
          // refinement) + analytics source: "search_mall_match".
          setMallId(id);
          closeDrawer();
          router.replace("/", { scroll: false });
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         pathname,
            source:       "search_mall_match",
          });
        }}
      />}
    </>
  );
}
