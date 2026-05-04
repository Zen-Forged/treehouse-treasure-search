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
//   - <StickyMasthead> (fixed-position wordmark, 72px; left/right slots
//     filled in commits 3 + 4 — empty for now). Reverses R10 D6: the 86px
//     hero TabPageMasthead retires from root tabs in favor of the same
//     primitive used on /find/[id] + /shelf/[slug], so the wordmark is
//     visually identical across every page that has chrome. Now that the
//     postcard mall card grounds the "where" identity below the masthead,
//     the wordmark doesn't need to do double-duty as the page title.
//   - <PostcardMallCard> (mall scope identifier; tap behavior varies per
//     pathname — Map opens MallSheet, Home/Saved route to /map per D19
//     partial reversal, session 107)
//   - <BottomNav> (4-tab flat for now; will trim to 3-tab in commit 3)
//   - <MallSheet> (only opens on /map per the unified-filter design)
//
// Owned by individual pages:
//   - SearchBar (Home only — search is a Home concern per D20 reversal)
//   - FeaturedBanner (Home + Saved with different admin keys)
//   - main body content + per-page state (post lists, map, etc.)

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StickyMasthead from "@/components/StickyMasthead";
import PostcardMallCard from "@/components/PostcardMallCard";
import MallSheet from "@/components/MallSheet";
import BottomNav from "@/components/BottomNav";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadShareButton from "@/components/MastheadShareButton";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { getActiveMalls } from "@/lib/posts";
import { loadBookmarkCount } from "@/lib/utils";
import { track } from "@/lib/clientEvents";
import { v1 } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mallId, setMallId] = useSavedMallId();
  const [malls, setMalls]   = useState<Mall[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    getActiveMalls().then(setMalls);
    setBookmarkCount(loadBookmarkCount());

    // Refresh bookmark count when the user returns from a detail page (the
    // detail page may have unsaved a find).
    const onFocus = () => setBookmarkCount(loadBookmarkCount());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

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

  // Per-pathname chrome derivation. Unknown pathnames (shouldn't happen
  // inside this route group) fall back to home defaults.
  const stampGlyph: "home" | "map" | "saved" =
    pathname === "/map"     ? "map"   :
    pathname === "/flagged" ? "saved" :
                              "home";

  const activeNav: "home" | "map" | "flagged" =
    pathname === "/map"     ? "map"   :
    pathname === "/flagged" ? "flagged" :
                              "home";

  // All-Kentucky subtitle varies by surface:
  //   - Home + Map identify the location count    ("4 active locations · Kentucky")
  //   - Saved identifies the saved-find count     ("12 saved finds · Kentucky")
  // Specific-mall scope ignores this prop (PostcardMallCard renders the
  // mall's address row instead).
  const allKentuckySubtitle =
    pathname === "/flagged"
      ? `${bookmarkCount} saved ${bookmarkCount === 1 ? "find" : "finds"} · Kentucky`
      : `${malls.length} active locations · Kentucky`;

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

  // /flagged hides the postcard card entirely until bookmarks load (matches
  // pre-layout behavior at app/flagged/page.tsx — no card on the empty
  // state). The empty-state EmptyState primitive owns the page when
  // bookmarks are zero.
  const showPostcardCard = !(pathname === "/flagged" && bookmarkCount === 0);

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
      {/* Profile-left mirrors the back-button geometry of detail pages.
          Right slot:
          - Home + Map → MastheadShareButton with scope-encoding URL builder
            (per David's session-109 ask: "share the location with selected
            mall filters applied")
          - Saved     → null (saved finds are private; sharing them publicly
            is semantically wrong) */}
      <StickyMasthead
        left={<MastheadProfileButton />}
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

      <MallSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        malls={malls}
        activeMallId={mallId}
        onSelect={(id) => {
          setMallId(id);
          setSheetOpen(false);
          // R3 filter_applied event with page='/map' — scope change is
          // /map's responsibility per the unified-filter design.
          const slug = id ? (malls.find(m => m.id === id)?.slug ?? null) : null;
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: slug ?? "all",
            page:         "/map",
          });
        }}
      />
    </div>
  );
}
