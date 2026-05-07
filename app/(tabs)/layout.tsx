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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StickyMasthead from "@/components/StickyMasthead";
import PostcardMallCard from "@/components/PostcardMallCard";
import BottomNav from "@/components/BottomNav";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton from "@/components/MastheadBackButton";
import MastheadShareButton from "@/components/MastheadShareButton";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const shopperAuth         = useShopperAuth();
  const saves               = useShopperSaves();
  const [malls, setMalls]   = useState<Mall[]>([]);

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

  // Stamp glyph is now ALWAYS "map" (D13 reversed session 110).
  // Original D13 mirrored the active BottomNav tab (Home glyph on Home,
  // Map glyph on /map, Saved glyph on /flagged). With Profile retired
  // from nav (session 109) and Map retired from nav (session 110), the
  // BottomNav-mirroring rule no longer maps cleanly — and the card's
  // primary role is now navigation to /map (from Home/Saved). The map
  // pin glyph reads as "tap here to change/view location" universally,
  // matching the actual interaction.
  const stampGlyph = "map" as const;

  const activeNav: "home" | "map" | "flagged" =
    pathname === "/map"     ? "map"   :
    pathname === "/flagged" ? "flagged" :
                              "home";

  // All-Kentucky subtitle for the slim PostcardMallCard. Slim card now
  // mounts only on /map (showPostcardCard), so the subtitle is purely a
  // /map concern: "X active locations · Kentucky". Session-120 had a
  // /flagged branch here, but the slim card never rendered on /flagged
  // even then; the branch retired with R18 (session 121) once Saved
  // dropped its rich-card chrome too.
  const allKentuckySubtitle = `${malls.length} active locations · Kentucky`;

  // PostcardMallCard tap:
  //   - Home + Saved   → routes to /map (the unified scope-change surface)
  //   - /map           → no-op (card is informational on /map; the new
  //                      contextual pill on the map handles clear/list
  //                      affordances per session-110 design)
  //
  // D19 is now fully reversed: session 107 partial reversal kept the
  // /map → MallSheet behavior; session 110 drops it. The card's "from:
  // <mall>" identifier role stays universal across surfaces.
  const handlePostcardTap = pathname === "/map"
    ? undefined
    : () => router.push("/map");

  // Session 120 — Home (`/`) AND Saved (`/flagged`) both render their own
  // <RichPostcardMallCard> inline (folds mall hero photo + SearchBar into
  // the postcard). The slim card now only appears on /map. Saved suppresses
  // the rich card itself on the empty-bookmarks state — that's owned by
  // the page, not the layout.
  const showPostcardCard = pathname === "/map";

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     v1.paperCream,
        maxWidth:       430,
        margin:         "0 auto",
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
      }}
    >
      {/* LEFT slot — Profile entry on Home, back button on every other tab.
          Session 120 reversal: previously profile was on every tab (session
          109 design). David's iPhone QA call: profile icon only stays on
          Home; Saved/Map should show the back button so the user can
          return to where they came from. Geometry matches across the two
          components so the slot doesn't shift dimensions on tab switch.

          RIGHT slot — Home + Map → MastheadShareButton with scope-encoding
          URL builder. The shared URL only encodes ?mall=<slug> (the mall
          scope), never which finds the user has saved.

          Saved was added to this slot in session 116 in prep for guest user
          accounts (R1, shipped session 114). R18 (session 121) retires the
          share button from /flagged: Saved no longer participates in mall
          scope, so there is no payload to encode and a shared `/flagged`
          URL would be misleading (recipient sees their own saves, not the
          sender's). */}
      <StickyMasthead
        left={
          pathname === "/"
            ? <MastheadProfileButton authedInitials={shopperAuth.shopper?.initials} />
            : <MastheadBackButton fallback="/" />
        }
        right={
          (pathname === "/" || pathname === "/map") ? (
            <MastheadShareButton
              urlBuilder={() => {
                const slug = mallId
                  ? (malls.find((m) => m.id === mallId)?.slug ?? null)
                  : null;
                const base = `${window.location.origin}${pathname}`;
                return slug ? `${base}?mall=${slug}` : base;
              }}
            />
          ) : null
        }
      />

      {showPostcardCard && (
        <div style={{ padding: "12px 16px 0" }}>
          <PostcardMallCard
            mall={selectedMall ?? "all-kentucky"}
            stampGlyph={stampGlyph}
            allKentuckySubtitle={allKentuckySubtitle}
            onTap={handlePostcardTap}
          />
        </div>
      )}

      {children}

      <BottomNav active={activeNav} flaggedCount={bookmarkCount} />
    </div>
  );
}
