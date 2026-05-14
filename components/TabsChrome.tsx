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
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useMapDrawer } from "@/lib/useMapDrawer";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import type { Mall } from "@/types/treehouse";

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
    if (window.scrollY < 190) {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  }, [drawerOpen]);

  const isHome = pathname === "/";
  const q      = searchParams.get("q") ?? "";

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
        // Option C — SearchBar Home-only. On Saved, hero renders without
        // search input; chip + drawer still mount for identity continuity.
        searchQuery={isHome ? q : undefined}
        onSearchChange={isHome ? handleSearchChange : undefined}
      />

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

      <MallMapDrawer
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
      />
    </>
  );
}
