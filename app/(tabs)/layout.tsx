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
import MastheadPaperAirplane from "@/components/MastheadPaperAirplane";
import ShareSheet from "@/components/ShareSheet";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v1, v2 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const shopperAuth         = useShopperAuth();
  const saves               = useShopperSaves();
  const [malls, setMalls]   = useState<Mall[]>([]);
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

  // Session 123 — stampGlyph plumbing retires alongside the postal stamp on
  // PostcardMallCard. The slim card no longer renders a stamp; the prop
  // dropped from the component interface.

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
      {/* LEFT slot — Profile entry on Home, back button on every other tab.
          Session 120 reversal: previously profile was on every tab (session
          109 design). David's iPhone QA call: profile icon only stays on
          Home; Saved/Map should show the back button so the user can
          return to where they came from. Geometry matches across the two
          components so the slot doesn't shift dimensions on tab switch.

          RIGHT slot — Home → airplane that opens <ShareSheet> with mall
          entity (session 137). The sheet's 3-channel grid (SMS + QR +
          Copy Link) shares the active mall scope (or all-Kentucky when
          no mall picked); the mall-share URL goes through the same
          ?mall=<slug> intake as the prior MastheadShareButton handled.

          /map → null right slot. Session 137 retires the airplane on
          /map entirely per Q3 — share isn't a /map affordance; the
          map's job is scope-pick + visit. The 3-tier engagement+share
          lattice (memory: project_layered_engagement_share_hierarchy)
          puts share-mall on the surface where mall identity is
          presented as content, not on the surface where the user
          interacts with the map.

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
          pathname === "/" ? (
            <button
              onClick={() => setShareOpen(true)}
              aria-label="Share this mall"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: v1.iconBubble,
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

      {showPostcardCard && (
        <div style={{ padding: "12px 16px 0" }}>
          <PostcardMallCard
            mall={selectedMall ?? "all-kentucky"}
            allKentuckySubtitle={allKentuckySubtitle}
            onTap={handlePostcardTap}
          />
        </div>
      )}

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
