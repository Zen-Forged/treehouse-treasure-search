// app/flagged/page.tsx
// R18 (session 121) — per-mall card stack restructure.
// Session 122 — iPhone-QA refinement pass on the per-mall card chrome
// + page-level header. Frame C (session-121 split-header-strip) retires;
// see "Session 122 refinement" block below for the reversal.
//
// Replaces the session-99 booth-destination-container + scope-filter
// architecture with a flat stack of per-mall cards. Each mall card carries
// its own DistancePill and Get Directions CTA. Booth groupings nest inside
// the mall card with a dashed-top divider per booth section.
//
// Session 122 refinement (reverses session-121 D5/D6/D7/D9):
//   - Frame C retires. The 110×88 mall-hero photo on the left of the card
//     header drops entirely. Card chrome stacks at full card width.
//   - Eyebrow "Saved finds from:" deletes — the page-level header carries
//     the "saved" identity; per-card eyebrow was redundant.
//   - Mall name allowed to wrap up to 2 lines (was 1-line ellipsis) so
//     long mall names don't truncate to "...".
//   - DistancePill moves below the address in its own row, left-aligned
//     (was top-right of the chrome stack).
//   - MapPin icon retires from the address line (Saved-only — Home rich
//     card keeps it). Saves are personal; reduce location-identity chrome.
//   - Page-level header inserted above the per-mall card stack:
//     "{count} Saved find{s} waiting to be found" in 22px FONT_LORA
//     weight 500 — matches the Home rich-card mall-name typography.
//   - MallSection.mallHeroUrl retires (dead after photo drops); the
//     mallsById fetch stays in place for canonical name/address/coords
//     resolution per session-121 design.
//
// What changed from the session-120 baseline:
//   - Search bar removed (it was an implicit feature-parity decision in
//     session 120; David's session-121 spec retired it).
//   - Mall scope filter removed entirely; Saved no longer participates in
//     mall scope. Show all saves grouped by mall.
//   - <BoothDestinationContainer> retires; booth grouping nests inside
//     the new <SavedMallCard> with dashed-top section dividers.
//   - Per-booth "Explore the booth →" CTA retires; one mall-level
//     `Get Directions` CTA per mall card.
//   - <RichPostcardMallCard> retires from this surface; this page owns
//     its own per-mall card primitive.
//   - R17 Arc 2's DistancePill-above-each-booth-container (session 119)
//     reverses; pill now lives in each mall card header.
//   - The save leaf bubble returns to every find tile (session-99 hit-area
//     concern is moot at the new 3-col grid scale).
//
// Mall stacking order: distance asc when geolocation granted; save recency
// (most recent post created_at across the mall's saves) as fallback.
//
// Booth section order within a mall: save recency.
//
// Cascade on unsave: useShopperSaves hook is reactive; when ids changes,
// posts re-fetch, group rebuilds. Last find at booth → booth section drops;
// last find at mall → mall card drops.
//
// Preserved from session 99/120:
//   - useShopperSaves hook (DB if authed, localStorage if guest)
//   - Scroll-restore (SCROLL_KEY)
//   - Track D preview-cache on tap (treehouse_find_preview:${id})
//   - Phase C swipe-nav handoff via lib/findContext (flatFindRefs across
//     all malls + booths)
//   - R3 events: page_viewed, post_unsaved (via useShopperSaves toggle)
//   - flagged_directions_tapped event on Get Directions (renames + shifts
//     scope from per-booth flagged_booth_explored to per-mall directions)
//   - Sync-footer for unauthed shoppers with localStorage saves
//   - FeaturedBanner site-setting overlay
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPostsByIds, getActiveMalls } from "@/lib/posts";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useShopperSaves } from "@/lib/useShopperSaves";
import {
  v1,
  FONT_LORA,
  FONT_NUMERAL,
  FONT_SYS,
} from "@/lib/tokens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import { writeFindContext, setPostCache, type FindRef } from "@/lib/findContext";
import FeaturedBanner from "@/components/FeaturedBanner";
import PolaroidTile from "@/components/PolaroidTile";
import EmptyStatePrimitive from "@/components/EmptyState";
import FlagGlyph from "@/components/FlagGlyph";
import DistancePill from "@/components/DistancePill";
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

// ── Per-mall card (inline; single callsite) ───────────────────────────────────
// Session 122 refinement: Frame C (110×88 photo + right-chrome) retires.
// Card chrome stacks at full card width: name → address → DistancePill.

function SavedMallCard({
  mall,
  miles,
  onTilePress,
  flatFindRefs,
  saves,
}: {
  mall:         MallSection;
  miles:        number | null;
  onTilePress:  (post: Post, cursorIndex: number) => void;
  flatFindRefs: FindRef[];
  saves:        ReturnType<typeof useShopperSaves>;
}) {
  function handleGetDirections() {
    track("flagged_directions_tapped", {
      mall_id:     mall.mallId,
      saved_count: mall.totalSaves,
    });
    if (mall.mallLat != null && mall.mallLng != null) {
      // window.location.href, not router.push — native maps deep-links use
      // the maps:// scheme (iOS) which Next router can't handle. R17 Arc 1
      // pattern (lib/LocationActions.tsx).
      window.location.href = navigateUrl(mall.mallLat, mall.mallLng);
    }
  }

  return (
    <article
      style={{
        background:   v1.paperWarm,
        border:       `1px solid ${v1.inkHairline}`,
        borderRadius: 12,
        overflow:     "hidden",
        boxShadow:    "0 1px 3px rgba(42, 26, 10, 0.05)",
      }}
    >
      {/* Header — name + DistancePill in top flex row (pill top-right,
          align-start so 2-line names don't push it center); address below
          full-width. Reverses session-122 Round 1 ask 3 (pill below address
          left-justified): now that the photo retired and chrome stacks at
          full card width, the right side has clear space for the pill,
          and the more-compact 2-row layout reads cleaner per David's
          iPhone QA. */}
      <div style={{ padding: "14px 14px 12px" }}>
        <div
          style={{
            display:    "flex",
            alignItems: "flex-start",
            gap:        8,
          }}
        >
          <div
            style={{
              flex:            1,
              minWidth:        0,
              fontFamily:      FONT_LORA,
              fontWeight:      500,
              fontSize:        19,
              color:           v1.inkPrimary,
              lineHeight:      1.25,
              letterSpacing:   "-0.005em",
              display:         "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow:        "hidden",
              wordBreak:       "break-word",
            }}
          >
            {mall.mallName}
          </div>

          {/* DistancePill renders null on guest / denied / mall coords
              missing — wrapper omitted entirely so flex gap stays tight. */}
          {miles != null && (
            <div style={{ flexShrink: 0 }}>
              <DistancePill miles={miles} />
            </div>
          )}
        </div>

        {mall.mallAddress && (
          <div
            style={{
              marginTop:  4,
              color:      v1.inkMuted,
              fontFamily: FONT_SYS,
              fontSize:   12,
              lineHeight: 1.3,
            }}
          >
            {mall.mallAddress}
          </div>
        )}
      </div>

      {/* Booth subgroups — flat list of finds per booth, separated by
          dashed-top divider with booth name + number eyebrow. */}
      <div style={{ padding: "0 14px" }}>
        {mall.booths.map((booth) => (
          <div
            key={(booth.boothNumber ?? "nb") + "·" + booth.vendorName}
            style={{ borderTop: `1px dashed ${v1.inkHairline}` }}
          >
            <div
              style={{
                paddingTop:    10,
                paddingBottom: 8,
                display:       "flex",
                alignItems:    "baseline",
                gap:           6,
                flexWrap:      "wrap",
              }}
            >
              {booth.boothNumber && (
                <div
                  style={{
                    fontFamily:     FONT_NUMERAL,
                    fontWeight:     700,
                    fontSize:       11,
                    letterSpacing:  "0.1em",
                    textTransform:  "uppercase",
                    color:          v1.inkMuted,
                  }}
                >
                  Booth {booth.boothNumber}
                </div>
              )}
              <div
                style={{
                  fontFamily: FONT_LORA,
                  fontStyle:  "italic",
                  fontSize:   13,
                  color:      v1.inkMid,
                }}
              >
                {booth.boothNumber ? `· ${booth.vendorName}` : booth.vendorName}
              </div>
            </div>

            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap:                 8,
                paddingBottom:       12,
              }}
            >
              {booth.posts.map((post) => {
                const cursor = flatFindRefs.findIndex((r) => r.id === post.id);
                return (
                  <Link
                    key={post.id}
                    href={`/find/${post.id}`}
                    onClick={() => onTilePress(post, cursor >= 0 ? cursor : 0)}
                    style={{
                      textDecoration:          "none",
                      color:                   "inherit",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <PolaroidTile
                      src={post.image_url ?? ""}
                      alt={post.title}
                      bottomMat="inside"
                      loading="lazy"
                      dim={post.status === "sold"}
                      fallback={
                        <div
                          style={{
                            width:          "100%",
                            height:         "100%",
                            display:        "flex",
                            alignItems:     "center",
                            justifyContent: "center",
                            fontFamily:     FONT_LORA,
                            fontStyle:      "italic",
                            fontSize:       9,
                            color:          v1.inkFaint,
                            textAlign:      "center",
                            padding:        "0 4px",
                            lineHeight:     1.3,
                          }}
                        >
                          no photograph
                        </div>
                      }
                      topRight={
                        // R18 D8 — save leaf bubble returns to every saved-
                        // find tile. Reverses session-99's "leaf retired —
                        // hit area too small + redundant" call: at the new
                        // 3-col grid scale the bubble is well-sized, and
                        // single-tap unsave is the canonical interaction
                        // for the Saved page.
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saves.toggle(post.id, false);
                          }}
                          aria-label="Unsave"
                          style={{
                            width:                   "100%",
                            height:                  "100%",
                            borderRadius:            "50%",
                            background:              "rgba(245,242,235,0.85)",
                            backdropFilter:          "blur(8px)",
                            WebkitBackdropFilter:    "blur(8px)",
                            border:                  `0.5px solid rgba(42,26,10,0.12)`,
                            display:                 "flex",
                            alignItems:              "center",
                            justifyContent:          "center",
                            padding:                 0,
                            cursor:                  "pointer",
                            WebkitTapHighlightColor: "transparent",
                          }}
                        >
                          <FlagGlyph
                            size={14}
                            strokeWidth={1.7}
                            style={{ color: v1.green, fill: v1.green }}
                          />
                        </button>
                      }
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Get Directions footer — only when mall has lat/lng coords (every
          active mall has them per session-103 add-mall.ts pipeline; defensive
          gate for malls predating that pipeline). */}
      {mall.mallLat != null && mall.mallLng != null && (
        <div style={{ padding: "0 14px 14px" }}>
          <button
            type="button"
            onClick={handleGetDirections}
            style={{
              width:                   "100%",
              background:              v1.green,
              color:                   "#f5ecd5",
              border:                  "none",
              borderRadius:            999,
              padding:                 "10px 18px",
              fontFamily:              FONT_SYS,
              fontSize:                11,
              fontWeight:              700,
              letterSpacing:           "0.14em",
              textTransform:           "uppercase",
              cursor:                  "pointer",
              display:                 "flex",
              alignItems:              "center",
              justifyContent:          "center",
              gap:                     6,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Get Directions
            <span aria-hidden style={{ fontSize: 13, lineHeight: 1 }}>↗</span>
          </button>
        </div>
      )}
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function FlaggedPage() {
  const [posts,           setPosts]           = useState<Post[]>(cachedFlaggedPosts ?? []);
  const [malls,           setMalls]           = useState<Mall[]>([]);
  const [loading,         setLoading]         = useState<boolean>(cachedFlaggedPosts === null);
  const [bannerImageUrl,  setBannerImageUrl]  = useState<string | null>(null);
  const shopperAuth                            = useShopperAuth();
  const saves                                  = useShopperSaves();
  const userLoc                                = useUserLocation();
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

  // Build the malls lookup so we can resolve hero_image_url (not in
  // getPostsByIds SELECT). Active-mall metadata wins; fallback to
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
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title="No finds saved yet"
              subtitle="Tap the leaf on any find to save it here."
            />
          </div>
        ) : (
          <div
            style={{
              padding:       "14px 14px 18px",
              display:       "flex",
              flexDirection: "column",
              gap:           14,
            }}
          >
            {/* Page header — outline saved-leaf glyph + count +
                "saved finds waiting to be found". Typography matches the
                Home rich-card "Finds from:" eyebrow (RichPostcardMallCard):
                FONT_LORA italic, 17px, ink-muted, lineHeight 1. Glyph is
                outline-only (no bg container) — same icon used in
                BottomNav, sized to read with the text x-height. Only
                renders in the populated branch; loading + empty branches
                keep their existing chrome. */}
            <h1
              style={{
                margin:     0,
                display:    "flex",
                alignItems: "center",
                gap:        6,
                fontFamily: FONT_LORA,
                fontStyle:  "italic",
                fontSize:   17,
                color:      v1.inkMuted,
                lineHeight: 1,
              }}
            >
              <FlagGlyph
                size={18}
                strokeWidth={1.7}
                style={{ color: v1.inkMuted, flexShrink: 0 }}
              />
              <span>
                {posts.length} {posts.length === 1 ? "saved find" : "saved finds"} across {sortedMallsWithMiles.length} {sortedMallsWithMiles.length === 1 ? "location" : "locations"}
              </span>
            </h1>

            {sortedMallsWithMiles.map(({ mall, miles }) => (
              <SavedMallCard
                key={mall.mallId}
                mall={mall}
                miles={miles}
                onTilePress={handleTilePress}
                flatFindRefs={flatFindRefs}
                saves={saves}
              />
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
