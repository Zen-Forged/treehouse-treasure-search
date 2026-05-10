// app/flagged/page.tsx
// R18 (session 121) — per-mall card stack restructure.
// Session 122 — iPhone-QA refinement pass on per-mall card chrome.
// Session 139 Arc 1.4 — wire to v2 primitives:
//   - Inline <SavedMallCard> retires (was 200+ lines below the grouping
//     util); <SavedMallCardV2> + <AccordionBoothSection> + <SavedFindRow>
//     now own per-mall + per-booth + per-find render.
//   - Session-122 page header h1 ("X saved finds across Y locations" with
//     FlagGlyph) retires; each mall card now carries its own "X finds
//     waiting to be found" line.
//   - <PolaroidTile> 3-col grid retires; row primitive owns the find list.
//   - <SavedEmptyState> v2 primitive replaces <EmptyStatePrimitive> in
//     the no-saves branch.
//   - useShopperFindsFound hook (Arc 1.3) wires ✓ Found Find-tier
//     engagement state; localStorage-only.
//   - Tap-target shape changes Link → router.push (SavedFindRow is
//     role=button; Link wrapping invalid HTML).
//
// Preserved verbatim:
//   - useShopperSaves hook (DB if authed, localStorage if guest)
//   - Scroll-restore (SCROLL_KEY) + force-top fallback for first-visit /
//     cross-tab scrollY inheritance under shared layout
//   - Phase C swipe-nav handoff (writeFindContext + flatFindRefs)
//   - Track D preview-cache on tap (treehouse_find_preview:${id})
//   - R3 events: page_viewed, post_unsaved (via useShopperSaves toggle),
//     flagged_directions_tapped (per-mall Get Directions)
//   - Sync-footer for unauthed shoppers with localStorage saves (R1 D6)
//   - FeaturedBanner site-setting overlay
//   - Stale-prune unwinding dead localStorage keys
//   - Per-mall sort: distance asc when granted, save-recency desc fallback
//   - Per-booth sort within mall: save-recency desc
//   - Per-find sort within booth: active-first then sold; created_at desc
//     within each band
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPostsByIds, getActiveMalls } from "@/lib/posts";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import { useShopperFindsFound } from "@/lib/useShopperFindsFound";
import { v1, FONT_LORA } from "@/lib/tokens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import { writeFindContext, setPostCache, type FindRef } from "@/lib/findContext";
import FeaturedBanner from "@/components/FeaturedBanner";
import SavedMallCardV2 from "@/components/v2/SavedMallCardV2";
import AccordionBoothSection from "@/components/v2/AccordionBoothSection";
import SavedFindRow from "@/components/v2/SavedFindRow";
import SavedEmptyState from "@/components/v2/SavedEmptyState";
import { milesFromUser } from "@/lib/distance";
import { useUserLocation } from "@/lib/useUserLocation";
import { navigateUrl } from "@/lib/mapsDeepLink";
import type { Post, Mall } from "@/types/treehouse";

// Module-scope cache + scroll key — same shape as session 99 baseline.
const SCROLL_KEY = "treehouse_flagged_scroll";
let cachedFlaggedPosts: Post[] | null = null;

// ── Grouping ──────────────────────────────────────────────────────────────────

type BoothSection = {
  vendorId:    string | null;
  boothNumber: string | null;
  vendorName:  string;
  vendorSlug:  string | undefined;
  posts:       Post[];
  /** Most recent post created_at within this booth — drives section order. */
  recency:     number;
};

type MallSection = {
  mallId:       string;
  mallName:     string;
  mallAddress:  string | null;
  mallLat:      number | null;
  mallLng:      number | null;
  booths:       BoothSection[];
  /** Most recent post created_at across all saves at this mall — drives mall order fallback. */
  recency:      number;
  /** Total saved finds at this mall — used for analytics on Get Directions tap. */
  totalSaves:   number;
};

function groupByMallAndBooth(
  posts: Post[],
  mallsById: Map<string, Mall>,
): MallSection[] {
  // First, bucket posts by booth.
  const boothMap = new Map<string, BoothSection>();
  for (const post of posts) {
    if (!post.mall_id) continue; // defensive — saved posts should always have a mall

    const vendorId    = post.vendor?.id ?? null;
    const vendorName  = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug  = post.vendor?.slug;
    const boothNumber = post.vendor?.booth_number ?? null;
    // Booth bucket scoped per-mall — same vendor at multiple malls is rare
    // but the key needs to disambiguate just in case.
    const key = `${post.mall_id}::${vendorId ?? `__orphan__${post.id}`}`;

    if (!boothMap.has(key)) {
      boothMap.set(key, {
        vendorId,
        boothNumber,
        vendorName,
        vendorSlug,
        posts:   [],
        recency: 0,
      });
    }
    boothMap.get(key)!.posts.push(post);
  }

  // Sort posts within each booth: active first, sold last; within each band
  // by created_at desc. Compute per-booth recency = max created_at in band.
  const allBooths: BoothSection[] = Array.from(boothMap.values());
  const tsOf = (p: Post) => new Date(p.created_at).getTime();
  for (const booth of allBooths) {
    const active = booth.posts.filter((p: Post) => p.status !== "sold").sort((a: Post, b: Post) => tsOf(b) - tsOf(a));
    const sold   = booth.posts.filter((p: Post) => p.status === "sold").sort((a: Post, b: Post) => tsOf(b) - tsOf(a));
    booth.posts   = [...active, ...sold];
    booth.recency = booth.posts.reduce((m: number, p: Post) => Math.max(m, tsOf(p)), 0);
  }

  // Roll booths up into mall sections, resolving mall metadata from the
  // mallsById map. Defensive fallback to post.mall.* if the mall isn't in
  // the active set (e.g. a save references a mall that was later
  // deactivated — show what we know).
  const mallMap = new Map<string, MallSection>();
  for (const booth of allBooths) {
    const sample = booth.posts[0];
    const mallId = sample.mall_id!;
    const mall   = mallsById.get(mallId);

    if (!mallMap.has(mallId)) {
      mallMap.set(mallId, {
        mallId,
        mallName:    mall?.name        ?? sample.mall?.name        ?? "Unknown Location",
        mallAddress: mall?.address     ?? sample.mall?.address     ?? null,
        mallLat:     mall?.latitude    ?? sample.mall?.latitude    ?? null,
        mallLng:     mall?.longitude   ?? sample.mall?.longitude   ?? null,
        booths:      [],
        recency:     0,
        totalSaves:  0,
      });
    }
    mallMap.get(mallId)!.booths.push(booth);
  }

  // Per-mall recency + total + booth-section order (save recency desc).
  const allMalls: MallSection[] = Array.from(mallMap.values());
  for (const mall of allMalls) {
    mall.booths.sort((a: BoothSection, b: BoothSection) => b.recency - a.recency);
    mall.recency    = mall.booths.reduce((m: number, b: BoothSection) => Math.max(m, b.recency), 0);
    mall.totalSaves = mall.booths.reduce((n: number, b: BoothSection) => n + b.posts.length, 0);
  }

  return allMalls;
}

// ──────────────────────────────────────────────────────────────────────────────
export default function FlaggedPage() {
  const [posts,           setPosts]           = useState<Post[]>(cachedFlaggedPosts ?? []);
  const [malls,           setMalls]           = useState<Mall[]>([]);
  const [loading,         setLoading]         = useState<boolean>(cachedFlaggedPosts === null);
  const [bannerImageUrl,  setBannerImageUrl]  = useState<string | null>(null);
  const shopperAuth                            = useShopperAuth();
  const saves                                  = useShopperSaves();
  const findsFound                             = useShopperFindsFound();
  const userLoc                                = useUserLocation();
  const router                                 = useRouter();
  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  useEffect(() => {
    getSiteSettingUrl("find_map_banner_image_url").then(setBannerImageUrl);
  }, []);

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  // Re-fetch posts whenever the save set changes — auth-state transitions
  // (sign-in flips the hook from localStorage to DB) and cross-page
  // toggles broadcast through useShopperSaves's custom event. Stale-prune
  // unwinds dead localStorage keys when the post no longer exists.
  useEffect(() => {
    if (saves.isLoading) return;
    let cancelled = false;
    const ids = Array.from(saves.ids);
    if (ids.length === 0) {
      setPosts([]);
      cachedFlaggedPosts = [];
      setLoading(false);
      return;
    }
    getPostsByIds(ids).then((data) => {
      if (cancelled) return;
      if (data.length < ids.length) {
        const returned = new Set(data.map((p) => p.id));
        for (const id of ids) {
          if (!returned.has(id)) saves.toggle(id, false);
        }
      }
      setPosts(data);
      cachedFlaggedPosts = data;
      // Phase C — populate the shared post cache for instant tap-to-detail
      // metadata paint.
      for (const p of data) setPostCache(p);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [saves.ids, saves.isLoading]);

  useEffect(() => {
    track("page_viewed", { path: "/flagged", saved_count: saves.ids.size });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let restoreY: number | null = null;
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) restoreY = y;
      }
    } catch {}
    if (restoreY !== null) {
      pendingScrollY.current = restoreY;
    } else {
      // Session 122 — no saved scroll for this surface (first visit, or
      // user landed here from another tab). Force top. Next App Router
      // doesn't auto-reset scroll between sibling pages under a shared
      // layout, so without this the page inherits the previous tab's
      // scrollY. Synchronous on mount — fires before content paints.
      window.scrollTo(0, 0);
    }

    function onScroll() {
      try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch {}
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (scrollRestored.current) return;
    if (pendingScrollY.current === null) return;
    scrollRestored.current = true;
    const y = pendingScrollY.current;
    requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
  }, [loading]);

  // Build the malls lookup so we can resolve mall metadata (latitude /
  // longitude / address). Active-mall metadata wins; fallback to
  // post.mall.* values inside groupByMallAndBooth covers deactivated malls.
  const mallsById = new Map<string, Mall>();
  for (const m of malls) mallsById.set(m.id, m);

  const mallSections = groupByMallAndBooth(posts, mallsById);

  // Compute miles per mall, then sort: distance asc when granted (and the
  // mall has lat/lng); save recency desc as fallback. Malls with miles
  // outrank malls without (shouldn't happen at MVP scale — every active
  // mall has coords — but the order is defensive).
  const sortedMallsWithMiles = mallSections
    .map((mall) => ({
      mall,
      miles: milesFromUser(
        { lat: userLoc.lat, lng: userLoc.lng },
        mall.mallLat,
        mall.mallLng,
      ),
    }))
    .sort((a, b) => {
      if (a.miles != null && b.miles != null) return a.miles - b.miles;
      if (a.miles != null) return -1;
      if (b.miles != null) return 1;
      return b.mall.recency - a.mall.recency;
    });

  // Phase C swipe-nav handoff — flat ordered list across all malls + booths.
  // Order matches render order so the swipe gesture walks through saves in
  // the same sequence the user sees.
  const flatFindRefs: FindRef[] = sortedMallsWithMiles.flatMap(({ mall }) =>
    mall.booths.flatMap((b) =>
      b.posts.map((p) => ({
        id:        p.id,
        image_url: p.image_url ?? null,
        title:     p.title ?? null,
      })),
    ),
  );

  function handleTilePress(post: Post, cursorIndex: number) {
    if (post.image_url) {
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${post.id}`,
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      } catch {}
    }
    writeFindContext({
      originPath:  "/flagged",
      findRefs:    flatFindRefs,
      cursorIndex,
    });
    router.push(`/find/${post.id}`);
  }

  function handleGetDirections(mall: MallSection) {
    track("flagged_directions_tapped", {
      mall_id:     mall.mallId,
      saved_count: mall.totalSaves,
    });
    if (mall.mallLat != null && mall.mallLng != null) {
      // window.location.href, not router.push — native maps deep-links use
      // the maps:// scheme (iOS) which Next router can't handle.
      window.location.href = navigateUrl(mall.mallLat, mall.mallLng);
    }
  }

  return (
    <>
      <FeaturedBanner
        variant="overlay"
        imageUrl={bannerImageUrl}
        minHeight={180}
        marginBottom={6}
      />

      <main
        style={{
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          flex:          1,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 14px 0" }}>
            {[200, 240, 180].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 12 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <SavedEmptyState exploreHref="/" />
        ) : (
          <div
            style={{
              padding:       "14px 14px 18px",
              display:       "flex",
              flexDirection: "column",
              gap:           14,
            }}
          >
            {sortedMallsWithMiles.map(({ mall, miles }) => (
              <SavedMallCardV2
                key={mall.mallId}
                mallName={mall.mallName}
                mallAddress={mall.mallAddress ?? ""}
                distanceMi={miles}
                findsCount={mall.totalSaves}
                onGetDirections={() => handleGetDirections(mall)}
              >
                {mall.booths.map((booth) => (
                  <AccordionBoothSection
                    key={(booth.boothNumber ?? "nb") + "·" + booth.vendorName}
                    boothNumber={booth.boothNumber}
                    boothName={booth.vendorName}
                    defaultExpanded
                  >
                    {booth.posts.map((post) => {
                      const cursor = flatFindRefs.findIndex((r) => r.id === post.id);
                      const isFoundNow = findsFound.isFound(post.id);
                      return (
                        <SavedFindRow
                          key={post.id}
                          postId={post.id}
                          imageUrl={post.image_url ?? undefined}
                          title={post.title}
                          price={post.price_asking}
                          isFound={isFoundNow}
                          isSaved={saves.isSaved(post.id)}
                          dim={post.status === "sold"}
                          onToggleFound={() => findsFound.toggle(post.id, !isFoundNow)}
                          onToggleSaved={() => saves.toggle(post.id, false)}
                          onTapDetail={() => handleTilePress(post, cursor >= 0 ? cursor : 0)}
                        />
                      );
                    })}
                  </AccordionBoothSection>
                ))}
              </SavedMallCardV2>
            ))}
          </div>
        )}

        {/* R1 — sync footer per design record D6. Visible only to guests
            with localStorage saves. */}
        {!shopperAuth.isLoading && !shopperAuth.isAuthed && saves.ids.size > 0 && (
          <div
            style={{
              textAlign: "center",
              padding:   "20px 22px 32px",
            }}
          >
            <Link
              href="/login"
              style={{
                fontFamily:     FONT_LORA,
                fontStyle:      "italic",
                fontSize:       13,
                color:          v1.green,
                textDecoration: "none",
                lineHeight:     1.5,
              }}
            >
              Sync your finds across devices →
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
