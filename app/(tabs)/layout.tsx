// app/(tabs)/layout.tsx
// Shared chrome for the (tabs)/ root tab pages (Home / Saved).
//
// Session 166 Arc 3.1.3 — chrome restructure per session 164 design record
// (docs/home-hero-design.md). The session 154-157 chrome stack (StickyMasthead
// + SearchBarRow + MallStrip + Home-only HomeChrome wrapper) is replaced by
// a single <TabsChrome /> orchestrator that composes:
//   - <HomeHero> sticky-collapsing-header (33vh → 90px on scroll)
//   - <MallPickerChip> inline below hero (universal Home + Saved per Call 2
//     Option C; SearchBar inside hero conditional on Home only)
//   - <MallMapDrawer> page-drawer picker (canonical (tabs)/ picker; was
//     mounted via HomeChrome on Home-only — now layout-level universal)
//
// The route-group `(tabs)` directory name keeps /, /flagged as public paths.
//
// Owned here:
//   - Outer wrapper (v2.bg.main, maxWidth 430, flex column)
//   - <TabsChrome /> orchestrator (wrapped in <Suspense> since it uses
//     useSearchParams; Suspense boundary keeps the layout's child-page
//     prerender ability intact)
//   - <BottomNav> 2-tab (Home / Saved) with saved-count badge
//
// Retired this session:
//   - <StickyMasthead> + masthead slots (MastheadProfileButton,
//     MastheadBackButton). Outside (tabs)/, StickyMasthead + its
//     consumers stay verbatim (/find, /shelf, /my-shelf, /me, /login,
//     /vendor-request, /admin, etc.).
//   - <SearchBarRow> fixed-position search row (now inside HomeHero per
//     Frame C D6).
//   - `?mall=<slug>` URL intake (moved to <TabsChrome /> which already
//     pays the useSearchParams cost).

"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import TabsChrome from "@/components/TabsChrome";
import MallParamReceiver from "@/components/MallParamReceiver";
import StandaloneLaunchGate from "@/components/StandaloneLaunchGate";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { v2 } from "@/lib/tokens";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const saves    = useShopperSaves();

  // Saved-badge count = total saves across all malls. Session 122 reverses
  // session-110's "badge filters by mall scope" rule: R18 (session 121)
  // restructured /flagged to show all saves regardless of scope, and the
  // badge should mirror what the page shows. Sourcing from saves.ids.size
  // — the hook is reactive and avoids the post-fetch round trip that the
  // mall-filter version needed.
  const bookmarkCount = saves.ids.size;

  // Session 179 — Map tab restored at position 3 (BottomNav.tsx). Active
  // prop now branches on pathname === "/map" so the Map nav slot highlights
  // when user is on /map. Coupled with BottomNav.tsx tabs[] extension in
  // same commit per feedback_single_coupled_commit_when_must_move_together
  // ✅ Promoted — adding the tab without wiring active prop would render
  // the Map slot permanently un-highlighted mid-commit.
  // Session 205 — /home hub tab added at BottomNav slot 1 (10th R10 D1
  // iteration). The prior "/" tab's key renamed "home" → "explore" in the
  // same commit (BottomNav.tsx); this is the sole consumer of the old key.
  // /home → "home" (the hub); "/" → "explore" (the feed).
  const activeNav: "home" | "explore" | "flagged" | "map" =
    pathname === "/home"    ? "home" :
    pathname === "/flagged" ? "flagged" :
    pathname === "/map"     ? "map" :
    "explore";

  // Session 179 — David iPhone QA finding 1: "change BG to match the
  // masthead BG" on /map. The /map page's StickyMasthead uses
  // bg={v2.surface.warm} (#FBF6EA) per session 178 QA dial 1; David wants
  // page bg to unify with the masthead so the chrome reads as a
  // continuous surface tier on the /map back-context. Scope-bounded
  // override: pathname === "/map" → v2.surface.warm; Home + Saved stay
  // on v2.bg.tabs (#E6DECF) per session 166 dial 8 chrome-tier extraction.
  //
  // Coupled with the chip-as-back behavior + carat-up visual (C8) — all
  // three reshape /map's chrome to signal "you are inside the map
  // context, chip exits back to Explore" rather than "you are picking
  // a scope, chip opens the picker sheet."
  const isMap = pathname === "/map";

  return (
    <div
      style={{
        minHeight:      "100vh",
        // Session 166 dial 8 — (tabs)/-surfaces bg migrates from v2.bg.main
        // (#F7F3EB, session 140 chrome migration) to v2.bg.tabs (#E6DECF,
        // slightly warmer cream) per David's iPhone QA round 4 finding.
        // (tabs)/-scoped tier extraction; non-(tabs)/ surfaces remain on
        // v2.bg.main (~37 consumers across post-flow, auth, admin, etc.).
        // Session 179 — /map bg overrides to v2.surface.warm to match the
        // /map page's StickyMasthead bg (finding 1).
        background:     isMap ? v2.surface.warm : v2.bg.tabs,
        maxWidth:       430,
        margin:         "0 auto",
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* Session 183 F2 Shape B — TabsChrome (Base chrome: HomeHero photo,
          Profile overlay, MallPickerChip) renders OUTSIDE Suspense since
          it no longer calls useSearchParams. URL-dependent code split into
          two Suspense-contained components: SearchBarSlot (inside HomeHero,
          for ?q= read/write) + MallParamReceiver (sibling here, for
          ?mall= intake). On warm-nav from /find/[id] → /, the floating
          chrome stack paints synchronously while only the URL-bound
          subtrees suspend briefly — addresses David's session 182 iPhone
          QA finding 2 (whole-chrome-invisible-during-Suspense-fallback). */}
      {/* Session 207 #1 — cold-launch redirect guard. Mounts once per cold
          launch in this persistent (tabs)/ layout; redirects standalone
          launches that land on "/" (cached pre-205 installs) to "/home".
          See components/StandaloneLaunchGate.tsx for the race-free rationale. */}
      <StandaloneLaunchGate />
      <TabsChrome />
      <Suspense fallback={null}>
        <MallParamReceiver />
      </Suspense>

      {children}

      <BottomNav active={activeNav} flaggedCount={bookmarkCount} />
    </div>
  );
}
