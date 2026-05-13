// app/(tabs)/layout.tsx
// Shared chrome for the three root tab pages (Home / Map / Saved).
//
// R10 follow-up (session 109) — eliminates the masthead + postcard-card
// flicker that occurred on tab-to-tab navigation. Before this layout, each
// page rendered the chrome inside its own component tree; switching tabs
// unmounted+remounted the entire chrome even though the visible content
// didn't change. With Next.js App Router's nested-layout primitive, the
// chrome is rendered ONCE in the layout and persists across child route
// changes (Next.js only swaps the children slot when navigating between
// sibling pages under the same layout).
//
// The `(tabs)` directory name is a route-group — the parens make it
// invisible to the URL, so /, /map, /flagged remain the public paths.
//
// Owned here:
//   - Outer wrapper (paperCream bg, maxWidth 430, flex column)
//   - <StickyMasthead> with profile-left + share-right (Home/Map only).
//     Wordmark is the 72px shared primitive used on /find + /shelf too.
//   - <PostcardMallCard> (mall scope identifier). Tap behavior:
//       Home + Saved → routes to /map
//       /map         → no-op (informational; affordances on the map pill)
//   - <BottomNav> 2-tab (Home / Saved) — Map retired session 110.
//   - URL-state intake: ?mall=<slug> consumed on layout mount.
//
// Owned by individual pages:
//   - SearchBar (Home only — search is a Home concern per D20 reversal)
//   - FeaturedBanner (Home + Saved with different admin keys)
//   - <MallSheet> + the new contextual map pill (/map only)
//   - main body content + per-page state (post lists, map, etc.)

"use client";

import * as React from "react";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import StickyMasthead from "@/components/StickyMasthead";
import BottomNav from "@/components/BottomNav";
import MastheadBackButton from "@/components/MastheadBackButton";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import SearchBarRow from "@/components/SearchBarRow";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { useMapDrawer } from "@/lib/useMapDrawer";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v2 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const saves               = useShopperSaves();
  const { drawerOpen, closeDrawer } = useMapDrawer();
  const [malls, setMalls]   = useState<Mall[]>([]);

  // Session 157 — SearchBar URL plumbing isolated to <SearchBarRow>
  // (components/SearchBarRow.tsx) which owns its own useSearchParams
  // call inside a <Suspense> boundary below. Keeps the layout itself
  // statically prerenderable for non-Home pages (/flagged etc.) that
  // don't need ?q= state.
  //
  // Session 159 — Share Mall affordance retires entirely. Per David Q2 (a):
  // 3-tier engagement+share lattice (project_layered_engagement_share_hierarchy)
  // drops the Mall outbound tier. Share Booth + Share Find remain. The
  // Home masthead-right slot is reclaimed for the Profile button (Q3,
  // universal across all pages). Retires alongside: shareOpen useState,
  // MastheadPaperAirplane + ShareSheet imports, the inline mall-share
  // button, the conditional ShareSheet mount.

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  // Saved-badge count = total saves across all malls. Session 122
  // reverses session-110's "badge filters by mall scope" rule: R18
  // (session 121) restructured /flagged to show all saves regardless of
  // scope, and the badge should mirror what the page shows. Sourcing
  // from saves.ids.size — the hook is reactive and avoids the post-
  // fetch round trip that the mall-filter version needed.
  const bookmarkCount = saves.ids.size;

  // Session 109 — receive shared mall scope from URL.
  // When a recipient taps a shared link with `?mall=<slug>`, intake the
  // slug, look up the mall id, persist via setMallId, then drop the query
  // param from the URL so subsequent navigation has clean URLs and a page
  // refresh doesn't re-apply the scope. Idempotent — if the param matches
  // current scope or the slug is unknown, no-op.
  //
  // Reads window.location.search directly (not Next.js useSearchParams)
  // because useSearchParams in a client-component layout forces every
  // child page off the static-prerender path, which the original page
  // structure had committed to. window.location is client-only inside
  // useEffect, so no SSR concern.
  useEffect(() => {
    if (malls.length === 0) return;       // wait for malls to load
    const slugParam = new URLSearchParams(window.location.search).get("mall");
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
    // Strip the query param. router.replace() preserves the layout so
    // chrome doesn't flicker on the URL change.
    router.replace(pathname);
    // mallId intentionally excluded — the effect must not refire after we
    // call setMallId with the new id, which would dead-loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malls, pathname]);

  // Session 159 — selectedMall derived value retires alongside the Share
  // Mall airplane (the only consumer). mallId state remains, written by
  // the ?mall=<slug> intake effect above for Home + Saved chrome that
  // composes against the shopper's current scope (HomeChrome, etc.).

  const activeNav: "home" | "flagged" =
    pathname === "/flagged" ? "flagged" : "home";

  return (
    <div
      style={{
        minHeight:      "100vh",
        // Session 140 — tab chrome migrates to v2.bg.main (#F7F3EB).
        // v1 surfaces still consume v1.paperCream directly; only the
        // shared tab layout migrates so chrome unifies across Home/Saved/Map.
        background:     v2.bg.main,
        maxWidth:       430,
        margin:         "0 auto",
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* Session 159 — masthead slots (David Q2 + Q3):
          LEFT slot — drawer-open back-button (closes drawer) → non-Home
          back-button → null on Home.
          RIGHT slot — <MastheadProfileButton /> universally (Q3:
          "Relocate the profile icon to where the Share icon use to
          reside in the masthead. Propogates on all pages."). Profile
          self-derives auth state via useShopperAuth, routes to /me when
          authed, /login when guest. Share Mall affordance retires
          entirely (Q2 a): the 3-tier engagement+share lattice drops the
          Mall outbound tier. */}
      {pathname === "/" && (
        <Suspense fallback={null}>
          <SearchBarRow />
        </Suspense>
      )}

      <StickyMasthead
        left={
          drawerOpen
            ? <MastheadBackButton onClick={closeDrawer} />
            : pathname !== "/"
              ? <MastheadBackButton fallback="/" />
              : null
        }
        right={<MastheadProfileButton />}
      />

      {children}

      <BottomNav active={activeNav} flaggedCount={bookmarkCount} />
    </div>
  );
}
