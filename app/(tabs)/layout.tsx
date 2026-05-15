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

  const activeNav: "home" | "flagged" =
    pathname === "/flagged" ? "flagged" : "home";

  return (
    <div
      style={{
        minHeight:      "100vh",
        // Session 166 dial 8 — (tabs)/-surfaces bg migrates from v2.bg.main
        // (#F7F3EB, session 140 chrome migration) to v2.bg.tabs (#E6DECF,
        // slightly warmer cream) per David's iPhone QA round 4 finding.
        // (tabs)/-scoped tier extraction; non-(tabs)/ surfaces remain on
        // v2.bg.main (~37 consumers across post-flow, auth, admin, etc.).
        background:     v2.bg.tabs,
        maxWidth:       430,
        margin:         "0 auto",
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* TabsChrome owns HomeHero + MallPickerChip + MallMapDrawer +
          URL plumbing. Suspense-wrapped because it consumes
          useSearchParams — without the boundary, Next.js 14 forces every
          child page into dynamic rendering. */}
      <Suspense fallback={null}>
        <TabsChrome />
      </Suspense>

      {children}

      <BottomNav active={activeNav} flaggedCount={bookmarkCount} />
    </div>
  );
}
