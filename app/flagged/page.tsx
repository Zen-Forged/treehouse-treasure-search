// app/flagged/page.tsx
// Session 99 — destination redesign per docs/flagged-destination-design.md.
// Each booth becomes a self-contained destination container with horizontal
// find rows inside and an "Explore the booth →" CTA at the footer. Replaces
// the session-70 cartographic-spine + session-82 BoothLockupCard + session-89
// 3-col grid layout.
//
// Behavior change: booth-bookmark glyph (session 82) is no longer surfaced on
// /flagged. Booth-bookmarking remains accessible from /shelves where it's the
// primary interaction. /flagged is now scoped to "places I saved finds at,"
// and the destination affordance is the footer "Explore the booth →" CTA.
//
// Preserved:
//   - localStorage bookmark scanning + stale pruning (BOOKMARK_PREFIX)
//   - Grouping by vendor, sorted by booth number
//   - Per-find unsave gesture (now via 18px leaf bubble on polaroid thumbnail)
//   - Focus event refresh, BottomNav passthrough, skeleton loader
//   - Scroll-restore (SCROLL_KEY)
//   - Track D preview-cache on tap (treehouse_find_preview:${id})
//   - R3 events: page_viewed, post_unsaved, filter_applied
//
// New:
//   - flagged_booth_explored R3 event on CTA tap

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
// ArrowLeft retired (R10 session 107) — Saved is now a root tab page; back button gone.
import { getPostsByIds, getActiveMalls } from "@/lib/posts";
import { BOOKMARK_PREFIX, loadBookmarkCount } from "@/lib/utils";
import { useSavedMallId } from "@/lib/useSavedMallId";
import {
  v1,
  FONT_LORA,
  FONT_NUMERAL,
} from "@/lib/tokens";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import { writeFindContext, setPostCache, type FindRef } from "@/lib/findContext";
import BottomNav from "@/components/BottomNav";
import MallSheet from "@/components/MallSheet";
// R10 (session 107) — MallScopeHeader retired here; replaced by PostcardMallCard.
// StickyMasthead also retired — Saved is a root tab page, gets TabPageMasthead.
import TabPageMasthead from "@/components/TabPageMasthead";
import PostcardMallCard from "@/components/PostcardMallCard";
import FeaturedBanner from "@/components/FeaturedBanner";
import PolaroidTile from "@/components/PolaroidTile";
import EmptyStatePrimitive from "@/components/EmptyState";
import FormButton from "@/components/FormButton";
import type { Post, Mall } from "@/types/treehouse";

// Session 85 — back-nav scroll anchoring. Module-scope cache survives
// /find/[id] navigation (App Router unmounts the page; module scope persists
// for the SPA session). SCROLL_KEY persists scroll position across the same
// boundary.
const SCROLL_KEY = "treehouse_flagged_scroll";
let cachedFlaggedPosts: Post[] | null = null;

// ── Bookmark helpers ───────────────────────────────────────────────────────────

function loadFlaggedIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        ids.push(key.slice(BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return ids;
}

function removeBookmark(postId: string) {
  try { localStorage.removeItem(`${BOOKMARK_PREFIX}${postId}`); } catch {}
}

function pruneStaleBookmarks(savedIds: string[], returnedIds: string[]) {
  const returnedSet = new Set(returnedIds);
  for (const id of savedIds) {
    if (!returnedSet.has(id)) removeBookmark(id);
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────────

type BoothGroup = {
  vendorId:    string | null;
  boothNumber: string | null;
  vendorName:  string;
  vendorSlug?: string;
  mallId:      string | null;
  mallName:    string | null;
  posts:       Post[];
};

function groupByBooth(posts: Post[]): BoothGroup[] {
  const map = new Map<string, BoothGroup>();
  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? null;
    const vendorId   = post.vendor?.id ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug = post.vendor?.slug;
    const mallId     = post.mall_id ?? null;
    const mallName   = post.mall?.name ?? null;
    const key        = vendorId ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { vendorId, boothNumber: booth, vendorName, vendorSlug, mallId, mallName, posts: [] });
    map.get(key)!.posts.push(post);
  }

  const groups = Array.from(map.values()).map((g) => ({
    ...g,
    posts: [
      ...g.posts.filter((p) => p.status !== "sold"),
      ...g.posts.filter((p) => p.status === "sold"),
    ],
  }));

  return groups.sort((a, b) => {
    if (!a.boothNumber && b.boothNumber) return 1;
    if (a.boothNumber && !b.boothNumber) return -1;
    if (!a.boothNumber && !b.boothNumber) return a.vendorName.localeCompare(b.vendorName);
    const cmp = a.boothNumber!.localeCompare(b.boothNumber!, undefined, { numeric: true });
    return cmp !== 0 ? cmp : a.vendorName.localeCompare(b.vendorName);
  });
}

// ── Booth destination container ───────────────────────────────────────────────
// Single callsite — kept inline per the design record (extract on 2nd
// callsite per project pattern, sessions 83 + 95).
function BoothDestinationContainer({
  group,
  scopeIsAllMalls,
  flatFindRefs,
}: {
  group: BoothGroup;
  scopeIsAllMalls: boolean;
  // Phase C — the FULL ordered list of saved finds in the user's current
  // /flagged view (mall-scope-filtered, flattened across booth groups).
  // Tap on a row writes this as the swipe-nav context so the user can
  // swipe across all their saved finds, not just within one booth.
  flatFindRefs: FindRef[];
}) {
  const showMallSubtitle = scopeIsAllMalls && !!group.mallName;

  function handleTileTap(post: Post) {
    // Preview-cache write — same shape as Home + session 99 baseline. Lets
    // /find/[id]'s photograph paint synchronously on first commit.
    if (post.image_url) {
      try {
        sessionStorage.setItem(
          `treehouse_find_preview:${post.id}`,
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      } catch {}
    }
    // Phase C swipe-nav handoff — write the context blob with cursor at
    // this post's position in the flattened saved-finds list. /find/[id]
    // reads this on mount and exposes prev/next ids for the drag gesture.
    const cursor = flatFindRefs.findIndex((r) => r.id === post.id);
    writeFindContext({
      originPath: "/flagged",
      findRefs: flatFindRefs,
      cursorIndex: cursor >= 0 ? cursor : 0,
    });
  }

  function handleExploreBooth() {
    track("flagged_booth_explored", {
      vendor_id:         group.vendorId,
      vendor_slug:       group.vendorSlug ?? null,
      mall_id:           group.mallId,
      save_count_at_tap: group.posts.length,
    });
  }

  return (
    <article
      style={{
        background: v1.paperWarm,
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(42, 26, 10, 0.05)",
      }}
    >
      {/* Booth header (D3) */}
      <header
        style={{
          padding: "13px 16px 12px",
          borderBottom: `1px solid ${v1.inkHairline}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              flex: 1,
              fontFamily: FONT_LORA,
              fontWeight: 500,
              fontSize: 21,
              color: v1.inkPrimary,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {group.vendorName}
          </div>
          {group.boothNumber && (
            <div
              style={{
                flexShrink: 0,
                fontFamily: FONT_NUMERAL,
                fontWeight: 500,
                color: v1.green,
                fontSize: 21,
                lineHeight: 1.2,
              }}
            >
              {group.boothNumber}
            </div>
          )}
        </div>

        {/* All-Kentucky-Locations scope subtitle (mall name when scope spans
            multiple malls — preserves session-70 D5 carry-forward). */}
        {showMallSubtitle && (
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1.4,
            }}
          >
            at {group.mallName}
          </div>
        )}
      </header>

      {/* Find rows (D4) — horizontal: polaroid thumbnail + title + price */}
      {group.posts.map((post) => (
        <Link
          key={post.id}
          href={`/find/${post.id}`}
          onClick={() => handleTileTap(post)}
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "block",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: `1px solid ${v1.inkHairline}`,
            }}
          >
            {/* Polaroid thumbnail — 62px wrapper. Leaf bubble retired
                session 99 iPhone QA: hit area too small + redundant on a
                page where every find is by definition saved. Unsave path
                now lives only on /find/[id]; focus event re-syncs /flagged
                state on return. */}
            <div style={{ width: 62, flexShrink: 0 }}>
              <PolaroidTile
                src={post.image_url ?? ""}
                alt={post.title}
                bottomMat="inside"
                loading="lazy"
                fallback={
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 9,
                      color: v1.inkFaint,
                      textAlign: "center",
                      padding: "0 4px",
                      lineHeight: 1.3,
                    }}
                  >
                    no photograph
                  </div>
                }
              />
            </div>

            {/* Title — Lora 14, 3-line clamp */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: FONT_LORA,
                fontWeight: 400,
                fontSize: 14,
                color: v1.inkPrimary,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {post.title}
            </div>

            {/* Price — Lora 14 priceInk, top-aligned to title's first line */}
            {typeof post.price_asking === "number" && post.price_asking > 0 && (
              <div
                style={{
                  flexShrink: 0,
                  fontFamily: FONT_LORA,
                  fontWeight: 500,
                  fontSize: 14,
                  color: v1.priceInk,
                  alignSelf: "flex-start",
                  paddingTop: 1,
                }}
              >
                ${Math.round(post.price_asking)}
              </div>
            )}
          </div>
        </Link>
      ))}

      {/* Footer "Explore the booth →" CTA (D6) — outlined green button,
          inside the booth container, under the last find row. Routes to
          /shelf/[slug] (shopper-facing booth window). Inline-not-extracted
          per the design record (single callsite for now). */}
      {group.vendorSlug && (
        <Link
          href={`/shelf/${group.vendorSlug}`}
          onClick={handleExploreBooth}
          style={{
            textDecoration: "none",
            margin: 12,
            padding: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: `1px solid ${v1.green}`,
            background: v1.paperWarm,
            color: v1.green,
            fontFamily: FONT_LORA,
            fontWeight: 500,
            fontSize: 14,
            borderRadius: 8,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Explore the booth <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>→</span>
        </Link>
      )}
    </article>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function FlaggedPage() {
  const [posts,           setPosts]           = useState<Post[]>(cachedFlaggedPosts ?? []);
  const [malls,           setMalls]           = useState<Mall[]>([]);
  const [loading,         setLoading]         = useState<boolean>(cachedFlaggedPosts === null);
  const [bookmarkCount,   setBookmarkCount]   = useState(0);
  const [bannerImageUrl,  setBannerImageUrl]  = useState<string | null>(null);
  const [savedMallId,     setSavedMallId]     = useSavedMallId();
  const [mallSheetOpen,   setMallSheetOpen]   = useState(false);
  const pendingScrollY = useRef<number | null>(null);
  const scrollRestored = useRef(false);

  function syncCount() { setBookmarkCount(loadBookmarkCount()); }

  async function loadPosts() {
    const ids = loadFlaggedIds();
    if (ids.length === 0) {
      setPosts([]);
      cachedFlaggedPosts = [];
      setLoading(false);
      return;
    }
    const data = await getPostsByIds(ids);
    if (data.length < ids.length) {
      pruneStaleBookmarks(ids, data.map(p => p.id));
      setBookmarkCount(loadBookmarkCount());
    }
    setPosts(data);
    cachedFlaggedPosts = data;
    // Phase C — populate the shared post cache for instant tap-to-detail
    // metadata paint when the user steps into any saved find. Mirrors
    // Home loadFeed's setPostCache loop. The cache is shared across the
    // detail page's swipe-nav handoff via lib/findContext.
    for (const p of data) setPostCache(p);
    setLoading(false);
  }

  useEffect(() => {
    getSiteSettingUrl("find_map_banner_image_url").then(setBannerImageUrl);
  }, []);

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  useEffect(() => { syncCount(); loadPosts(); }, []);

  useEffect(() => {
    track("page_viewed", { path: "/flagged", saved_count: loadBookmarkCount() });
  }, []);

  useEffect(() => {
    function onFocus() { syncCount(); loadPosts(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) pendingScrollY.current = y;
      }
    } catch {}

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

  function handleMallSelect(nextMallId: string | null) {
    setSavedMallId(nextMallId);
    setMallSheetOpen(false);
    const mallSlug = nextMallId
      ? (malls.find(m => m.id === nextMallId)?.slug ?? null)
      : null;
    track("filter_applied", {
      filter_type:  "mall",
      filter_value: mallSlug ?? "all",
      page:         "/flagged",
    });
  }

  const filteredPosts = savedMallId
    ? posts.filter(p => p.mall_id === savedMallId)
    : posts;
  const groups = groupByBooth(filteredPosts);

  // Phase C — flat ordered ref list passed to each BoothDestinationContainer
  // so a tap on any find row writes the swipe-nav context with the full
  // mall-scope-filtered list (not just the tapped booth's slice). The
  // order matches `groups` flattened — booth-by-booth in render order.
  const flatFindRefs: FindRef[] = groups.flatMap((g) =>
    g.posts.map((p) => ({
      id:        p.id,
      image_url: p.image_url ?? null,
      title:     p.title ?? null,
    })),
  );

  const selectedMall = malls.find(m => m.id === savedMallId) ?? null;

  const saveCountsByMall: Record<string, number> = {};
  for (const p of posts) {
    if (p.mall_id) saveCountsByMall[p.mall_id] = (saveCountsByMall[p.mall_id] ?? 0) + 1;
  }

  const findCount = filteredPosts.length;
  const findNoun = findCount === 1 ? "find" : "finds";
  // R10 (session 107) — scopeEyebrow* + scopeGeoLine retired with the
  // MallScopeHeader swap. PostcardMallCard composes the address row from the
  // mall fields directly, and the all-Kentucky variant uses a literary
  // subtitle rather than a per-page eyebrow + geo line. findNoun retained
  // because the all-Kentucky subtitle still pluralizes against findCount.

  const filterHidesAllSaves = savedMallId !== null && posts.length > 0 && filteredPosts.length === 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* R10 (session 107) — Saved is a root tab page (D6). TabPageMasthead
          replaces the back-button-only StickyMasthead. BottomNav stays fixed
          so users can navigate without an explicit back. */}
      <TabPageMasthead />

      {!loading && posts.length > 0 && (
        <div style={{ padding: "0 16px" }}>
          <PostcardMallCard
            mall={selectedMall ?? "all-kentucky"}
            stampGlyph="saved"
            allKentuckySubtitle={`${findCount} saved ${findNoun} · Kentucky`}
            onTap={() => setMallSheetOpen(true)}
          />
        </div>
      )}

      <FeaturedBanner
        variant="overlay"
        imageUrl={bannerImageUrl}
        minHeight={180}
        marginBottom={6}
      />

      {!loading && groups.length > 0 && (
        <div style={{ padding: "14px 44px 18px" }}>
          <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
        </div>
      )}

      <main
        style={{
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          flex: 1,
        }}
      >
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "20px 22px 0" }}>
            {[140, 190, 120].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 8 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title="No finds saved yet"
              subtitle="Tap the leaf on any find to save it here."
            />
          </div>
        ) : filterHidesAllSaves ? (
          <div style={{ padding: "0 22px" }}>
            <EmptyStatePrimitive
              title={`No saved finds at ${selectedMall?.name ?? "this mall"}.`}
              subtitle="Saved finds at other malls are hidden by the active filter."
              cta={
                <FormButton variant="link" onClick={() => setSavedMallId(null)}>
                  Show all malls
                </FormButton>
              }
            />
          </div>
        ) : (
          /* Editorial preamble + booth-container stack. Containers float
             on the page paperCream background (scrim retired session 99
             iPhone QA). Each container is a self-contained destination
             unit. */
          <>
            <div
              style={{
                padding: "0 22px 6px",
                fontFamily: FONT_LORA,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkMuted,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              The search continues at these destinations.
            </div>
            <div
              style={{
                padding: "14px 14px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {groups.map((group) => (
                <BoothDestinationContainer
                  key={(group.boothNumber ?? "nb") + "·" + group.vendorName}
                  group={group}
                  scopeIsAllMalls={savedMallId === null}
                  flatFindRefs={flatFindRefs}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <MallSheet
        open={mallSheetOpen}
        onClose={() => setMallSheetOpen(false)}
        malls={malls}
        activeMallId={savedMallId}
        onSelect={handleMallSelect}
        findCounts={saveCountsByMall}
        countUnit={{ singular: "saved find", plural: "saved finds" }}
      />

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />
    </div>
  );
}
