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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StickyMasthead, { MASTHEAD_HEIGHT } from "@/components/StickyMasthead";
import BottomNav from "@/components/BottomNav";
import MastheadBackButton from "@/components/MastheadBackButton";
import MastheadPaperAirplane from "@/components/MastheadPaperAirplane";
import ShareSheet from "@/components/ShareSheet";
import SearchBar from "@/components/SearchBar";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { useMapDrawer } from "@/lib/useMapDrawer";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1, v2 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [mallId, setMallId] = useSavedMallId();
  const saves               = useShopperSaves();
  const { drawerOpen, closeDrawer } = useMapDrawer();
  const [malls, setMalls]   = useState<Mall[]>([]);

  // Session 157 — SearchBar lifted from in-page-flow into the layout's
  // fixed chrome stack. Layout owns the URL plumbing (single source of
  // truth via ?q= URL param); Home page reads the same param via
  // useSearchParams for filtering. Reactive — typing here re-renders Home
  // automatically without prop drilling.
  const q = searchParams.get("q") ?? "";
  const handleSearchChange = useCallback((next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    // Always replace to "/" — SearchBar only mounts on pathname === "/",
    // so URL stays on the same route.
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);
  // Session 137 — mall-entity ShareSheet state. Mounted only on Home
  // (/); /map drops its airplane affordance entirely per Q3 of session
  // 137 (share isn't a /map concern; the map's job is scope-pick + visit).
  const [shareOpen, setShareOpen] = useState(false);

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

  const selectedMall = mallId ? (malls.find((m) => m.id === mallId) ?? null) : null;

  // Session 155 — Arc 3.2 retires the slim <PostcardMallCard> mount entirely
  // (was conditional on pathname === "/map"). /map is being retired alongside
  // (Arc 3.3); the map drawer is now a Home chrome affordance on the strip's
  // chevron toggle, not a destination page. Layout no longer mounts any
  // mall-card chrome — chrome is split between universal (masthead + nav)
  // and page-owned (<HomeChrome> on Home; SavedMallCardV2 on Saved).
  //
  // allKentuckySubtitle + handlePostcardTap + showPostcardCard all retire.

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
      {/* LEFT slot — session 157 cleanup. Profile retired from masthead-left
          (moved to BottomNav far right per Item 2). Slot is now empty on
          Home by default; becomes a back button when the map drawer is
          expanded (Item 3 — closes drawer instead of navigating back) or
          when the user is on a non-Home tab (existing detail-page back-
          button affordance, geometry matches the drawer back button so
          the slot doesn't shift dimensions on transition).

          Auth chrome relocation lineage: ≤87 right → 90 BottomNav Profile
          tab → 109 masthead-left → 120 masthead-left Home-only → 157
          BottomNav far right. See components/BottomNav.tsx header for the
          full reversal record.

          RIGHT slot — Home → airplane that opens <ShareSheet> with mall
          entity (session 137). The sheet's 3-channel grid (SMS + QR +
          Copy Link) shares the active mall scope (or all-Kentucky when
          no mall picked); the mall-share URL goes through the same
          ?mall=<slug> intake as the prior MastheadShareButton handled.

          Saved → null right slot per R18 (session 121): Saved no longer
          participates in mall scope, so there is no payload to encode and
          a shared `/flagged` URL would be misleading (recipient sees their
          own saves, not the sender's). */}
      {/* Session 157 — fixed SearchBar row, Home-only. Sits between the
          masthead and MallStrip in the sticky chrome stack. Variant A +
          T3 spec: bg v2.surface.input (cooler well, session-153 canonical),
          wrap padding 6/6 (T1 trim from baseline 8/8). Total wrap height
          56px — exported as SEARCH_BAR_WRAP_HEIGHT from MallStrip so
          consumers (MallStrip, MallMapDrawer) compute top: positions
          correctly. z-index 39 matches MallStrip — both sit below masthead
          z-40 so the wordmark stays on top during any pixel overlap. */}
      {pathname === "/" && (
        <div
          style={{
            position:    "fixed",
            top:         MASTHEAD_HEIGHT,
            left:        "50%",
            transform:   "translateX(-50%)",
            width:       "100%",
            maxWidth:    430,
            background:  v2.bg.main,
            padding:     "6px 16px",
            zIndex:      39,
          }}
        >
          <SearchBar
            initialQuery={q}
            onChange={handleSearchChange}
          />
        </div>
      )}

      <StickyMasthead
        left={
          // Session 157 — slot ranks: drawer-open back-button (closes drawer,
          // overlay not history) → non-Home back-button (routes history /
          // fallback to "/") → null on Home (Profile moved to nav).
          drawerOpen
            ? <MastheadBackButton onClick={closeDrawer} />
            : pathname !== "/"
              ? <MastheadBackButton fallback="/" />
              : null
        }
        right={
          pathname === "/" ? (
            <button
              onClick={() => setShareOpen(true)}
              aria-label="Share this mall"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: v2.surface.warm,
                border: "none",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <MastheadPaperAirplane />
            </button>
          ) : null
        }
      />

      {children}

      <BottomNav active={activeNav} flaggedCount={bookmarkCount} />

      {/* Session 137 — mall ShareSheet, mounted only on Home. Entity
          handles the all-Kentucky scope inline (string literal); when
          a specific mall is picked the entity carries the Mall row and
          the sheet shares /?mall=<slug>. */}
      {pathname === "/" && (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          entity={{ kind: "mall", mall: selectedMall ?? "all-kentucky" }}
        />
      )}
    </div>
  );
}
