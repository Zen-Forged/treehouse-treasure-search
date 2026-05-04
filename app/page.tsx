// app/page.tsx
// Treehouse — Discovery Feed (v1.1i, docs/design-system.md §Feed, session 21A)
//
// Layout top-to-bottom:
//   1. Masthead (Mode B) — back/menu left slot (empty for now — Nav Shelf
//      lands here in 21B), centered "Treehouse Finds" wordmark, right slot
//      sign-in/sign-out text link (preserved from v0.2 auth affordance;
//      profile-circle icon deferred pending real profile page)
//   2. Feed hero on paper — Lora italic eyebrow ("Finds from across" /
//      "Finds from") + 26px mall/geography name as tappable MallSheet
//      trigger + chevron-down glyph + state-dependent address/geo line
//   3. Diamond divider
//   4. Paper masonry — 2-column grid with 50% right-column offset preserved
//      (live ResizeObserver on first tile), 6px radius + 1px inkHairline
//      border on each tile, background v1.postit, no titles / no prices / no
//      captions on tiles. Frosted paperCream heart top-right — always visible,
//      state-independent bg, green glyph when saved. Sold filtered at data
//      layer (getFeedPosts .eq status "available"), never rendered here.
//   5. Empty state + vendor CTA + BottomNav
//
// Preserved from v0.2:
//   - feed fetch (80 posts)
//   - scroll restore via sessionStorage "treehouse_feed_scroll"
//   - last-viewed tile highlight via sessionStorage "treehouse_last_viewed_post"
//   - visibilitychange → reload feed + bookmark sync
//   - skipEntrance during scroll restoration (prevents flicker on return nav)
//   - spring-tap feedback on tiles
//
// New v1.1i:
//   - safeStorage mall persistence via SAVED_MALL_KEY
//   - <MallSheet> primitive for mall selection (replaces ChevronDown dropdown)
//   - MallHeroCard / GenericMallHero retired (replaced by paper feed hero)
//   - colors import dropped (v1 token set only on this page now)
//   - Frosted hearts on every tile (previously: save reachable only from
//     Find Detail)

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import FlagGlyph from "@/components/FlagGlyph";
import { getFeedPosts, getActiveMalls, searchPosts } from "@/lib/posts";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  MOTION_EASE_OUT,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
} from "@/lib/tokens";
import { flagKey, loadFollowedIds, formatTimeAgo } from "@/lib/utils";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { safeStorage } from "@/lib/safeStorage";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import { track } from "@/lib/clientEvents";
import BottomNav from "@/components/BottomNav";
import MallSheet from "@/components/MallSheet";
import MallScopeHeader from "@/components/MallScopeHeader";
import StickyMasthead from "@/components/StickyMasthead";
import FeaturedBanner from "@/components/FeaturedBanner";
import PolaroidTile from "@/components/PolaroidTile";
import EmptyState from "@/components/EmptyState";
import SearchBar from "@/components/SearchBar";
import { writeFindContext, setPostCache, type FindRef } from "@/lib/findContext";
import type { Post, Mall } from "@/types/treehouse";

const SCROLL_KEY      = "treehouse_feed_scroll";
const LAST_VIEWED_KEY = "treehouse_last_viewed_post";
// Per-post preview cache key. Source surfaces (this page + /flagged) write
// the image_url here on tile tap so /find/[id] can render its
// <motion.button layoutId> hero synchronously on first mount, before the
// post-fetch resolves. Without this, framer-motion has lost the source
// rect by the time the destination's motion node mounts post-fetch and
// the shared-element morph silently snaps. The key format is duplicated
// inline in /flagged + /find/[id] — Next.js page files can't export
// arbitrary symbols, so the constant stays page-local here.
const findPreviewKey = (id: string) => `treehouse_find_preview:${id}`;

// Module-scope feed cache. Survives /find/[id] navigation (which unmounts
// this page in App Router). On back-nav we hydrate from this so the
// MasonryGrid mounts synchronously with tiles already laid out — the
// destination motion.div for the back morph exists immediately.
let cachedFeedPosts: Post[] | null = null;

// Session 76 Track E — local EASE replaced by MOTION_EASE_OUT import
// (docs/animation-consistency-design.md). Alias kept so MasonryTile's
// inline CSS transitions can reference it without a name change.
const EASE = MOTION_EASE_OUT;

// ── Scroll reveal (unchanged from v0.2) ───────────────────────────────────────
function useScrollReveal(threshold = 0.1, skipAnimation = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(skipAnimation);

  useEffect(() => {
    if (skipAnimation) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -20px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, skipAnimation]);

  return { ref, visible };
}

// ── Skeleton masonry ──────────────────────────────────────────────────────────
// Session 88 (A1) — fixed 4:5 aspect to match the real tiles. Eight slots
// per render. Offset on column 2 retained for visual rhythm. Skeleton no
// longer carries variable heights (the real tiles don't either now).
const SKELETON_SLOT_COUNT = 8;
const SKELETON_OFFSET = 70;

function SkeletonMasonry() {
  const slots = Array.from({ length: SKELETON_SLOT_COUNT });
  const col1 = slots.filter((_, i) => i % 2 === 0);
  const col2 = slots.filter((_, i) => i % 2 === 1);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        alignItems: "start",
      }}
    >
      {[col1, col2].map((col, ci) => (
        <div
          key={ci}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: ci === 1 ? SKELETON_OFFSET : 0,
          }}
        >
          {col.map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: v1.imageRadius,
                overflow: "hidden",
                background: v1.postit,
                border: `1px solid ${v1.inkHairline}`,
                aspectRatio: "4/5",
              }}
            >
              <div className="skeleton-shimmer" style={{ height: "100%" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Masonry tile (photograph-only, 6px radius, inkHairline border) ────────────
function MasonryTile({
  post,
  index,
  isFollowed,
  onToggleSave,
  isLastViewed,
  skipEntrance,
  findRefs,
}: {
  post: Post;
  index: number;
  isFollowed: boolean;
  onToggleSave: (postId: string) => void;
  isLastViewed: boolean;
  skipEntrance: boolean;
  // Phase A — full ordered feed list for /find/[id] swipe context.
  // `index` is the cursorIndex in this list (the masonry split into
  // 2 columns is reversible: col1 takes even original indices,
  // col2 takes odd, so MasonryTile's `index` prop equals the
  // position in `findRefs`).
  findRefs: FindRef[];
}) {
  const [highlighted, setHighlighted] = useState(isLastViewed);
  const { ref: revealRef, visible } = useScrollReveal(0.1, skipEntrance);

  useEffect(() => {
    if (!isLastViewed) return;
    const t = setTimeout(() => setHighlighted(false), 1600);
    return () => clearTimeout(t);
  }, [isLastViewed]);

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave(post.id);
  }

  function handleTileClick() {
    try {
      sessionStorage.setItem(LAST_VIEWED_KEY, post.id);
      // Track D phase 5 — cache the image URL so /find/[id] can mount its
      // <motion.button layoutId> hero synchronously on first render. Without
      // this, the destination's motion node only mounts after the post fetch
      // resolves, by which time framer-motion has lost the source rect.
      if (post.image_url) {
        sessionStorage.setItem(
          findPreviewKey(post.id),
          JSON.stringify({ image_url: post.image_url, title: post.title }),
        );
      }
    } catch {}
    // Phase A (session 100) — write the swipe-context handoff blob.
    // /find/[id] reads this on mount to know the user's browsing context
    // (origin path, ordered list of nearby finds, cursor). Phase B uses
    // it to drive left/right swipe between adjacent finds without
    // growing the back stack.
    writeFindContext({
      originPath: "/",
      findRefs,
      cursorIndex: index,
    });
  }

  const staggerDelay = skipEntrance ? 0 : Math.min(index * MOTION_STAGGER, MOTION_STAGGER_MAX);

  return (
    <div
      ref={revealRef}
      data-post-id={post.id}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0px)" : "translateY(16px)",
        transition: skipEntrance
          ? "none"
          : `opacity 0.38s ease ${staggerDelay}s, transform 0.44s cubic-bezier(0.22,1,0.36,1) ${staggerDelay}s`,
        willChange: skipEntrance ? "auto" : "opacity, transform",
      }}
    >
      <Link
        href={`/find/${post.id}`}
        onClick={handleTileClick}
        style={{ display: "block", textDecoration: "none" }}
      >
        <PolaroidTile
          src={post.image_url ?? ""}
          alt={post.title}
          tap
          highlighted={highlighted}
          innerBorder
          photoRadius={v1.imageRadius}
          fallback={
            // Photograph-only contract; no-image is rare but we degrade quietly
            // with an italic title in the photo slot.
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "14px 12px",
                display: "flex",
                alignItems: "flex-end",
                fontFamily: FONT_LORA,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.35,
              }}
            >
              {post.title}
            </div>
          }
          topRight={
            <button
              onClick={handleHeartClick}
              aria-label={isFollowed ? "Unsave" : "Save"}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "rgba(245,242,235,0.85)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: `0.5px solid rgba(42,26,10,0.12)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <FlagGlyph
                size={17}
                strokeWidth={1.7}
                style={{
                  color: isFollowed ? v1.green : v1.inkPrimary,
                  fill:  isFollowed ? v1.green : "none",
                }}
              />
            </button>
          }
          below={
            // Relative timestamp — Variant D from feed-timestamp-v1.html mockup,
            // italicized session 69 to nod toward IM Fell italic vocabulary.
            <div
              style={{
                padding: "4px 0 0",
                fontFamily: FONT_SYS,
                fontStyle: "italic",
                fontSize: 11.5,
                color: v1.inkMuted,
                letterSpacing: "0.01em",
                lineHeight: 1.2,
                textAlign: "left",
              }}
            >
              {formatTimeAgo(post.created_at)}
            </div>
          }
        />
      </Link>
    </div>
  );
}

// ── Masonry grid with live 50% right-column offset ────────────────────────────
function MasonryGrid({
  posts,
  followedIds,
  onToggleSave,
  lastViewedId,
  skipEntrance,
  findRefs,
}: {
  posts: Post[];
  followedIds: Set<string>;
  onToggleSave: (postId: string) => void;
  lastViewedId: string | null;
  skipEntrance: boolean;
  findRefs: FindRef[];
}) {
  const col1 = posts.filter((_, i) => i % 2 === 0);
  const col2 = posts.filter((_, i) => i % 2 === 1);
  const firstTileRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(SKELETON_OFFSET);

  useEffect(() => {
    const el = firstTileRef.current;
    if (!el) return;
    function measure() { setOffset(Math.round(el!.offsetHeight * 0.5)); }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [posts]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        alignItems: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {col1.map((post, i) => (
          <div key={post.id} ref={i === 0 ? firstTileRef : undefined}>
            <MasonryTile
              post={post}
              index={i * 2}
              isFollowed={followedIds.has(post.id)}
              onToggleSave={onToggleSave}
              isLastViewed={post.id === lastViewedId}
              skipEntrance={skipEntrance}
              findRefs={findRefs}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: offset }}>
        {col2.map((post, i) => (
          <MasonryTile
            key={post.id}
            post={post}
            index={i * 2 + 1}
            isFollowed={followedIds.has(post.id)}
            onToggleSave={onToggleSave}
            isLastViewed={post.id === lastViewedId}
            skipEntrance={skipEntrance}
            findRefs={findRefs}
          />
        ))}
      </div>
    </div>
  );
}

// ── Feed hero — paper, no gradient, no CTA ────────────────────────────────────
// Thin wrapper around <MallScopeHeader>. Computes the geo line from the
// selected mall (address link when one mall picked, italic geography when All).
//
// R11 (Wave 1 Task 7, session 91) — when the user has filtered to a specific
// mall AND that mall has hero_image_url set, render the photo as a banner
// BELOW the MallScopeHeader using the same <FeaturedBanner> primitive that
// powers the home Featured Find banner — so dimensions match exactly (200px
// min-height, 16px corner radius, 10px horizontal padding via v1.bannerRadius).
// All-malls and no-hero cases fall back to the text-only header — FeaturedBanner
// returns null when imageUrl is absent, so the layout collapses cleanly.
function FeedHero({
  selectedMall,
  onTapMall,
}: {
  selectedMall: Mall | null;
  onTapMall:    () => void;
}) {
  const isAll = selectedMall === null;

  const geoLine = isAll
    ? { kind: "italic" as const, text: "Kentucky & Southern Indiana" }
    : (() => {
        const address = selectedMall!.address ?? null;
        const cityLine = selectedMall!.city
          ? `${selectedMall!.city}${selectedMall!.state ? `, ${selectedMall!.state}` : ""}`
          : null;
        const text = address ?? cityLine ?? "";
        if (!text) return null;
        const href = `https://maps.apple.com/?q=${encodeURIComponent(
          address ?? `${selectedMall!.name} ${selectedMall!.city ?? ""} ${selectedMall!.state ?? ""}`
        )}`;
        return { kind: "address" as const, text, href };
      })();

  const heroUrl = !isAll ? (selectedMall!.hero_image_url ?? null) : null;

  return (
    <>
      <MallScopeHeader
        eyebrowAll="Finds from across"
        eyebrowOne="Finds from"
        mallName={isAll ? null : selectedMall!.name}
        geoLine={geoLine}
        onTap={onTapMall}
      />
      <FeaturedBanner variant="eyebrow" imageUrl={heroUrl} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
function DiscoveryFeedInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // R16 — discovery query mirrored to ?q= URL state. Initial value pulled
  // from URL so deep-links (?q=brass) restore search context. Cleared by
  // SearchBar's × button → empty string → URL ?q= param dropped.
  const initialQ = searchParams.get("q") ?? "";
  const [q,      setQ]      = useState<string>(initialQ);
  const searching           = q.trim().length > 0;

  // Hydrate from module-scope cache so back-nav from /find/[id] mounts
  // tiles synchronously — the destination motion.div for the shared-element
  // back-morph needs to exist before framer-motion releases the source rect.
  // Cache is intentionally feed-only (not search-scoped); search results
  // fresh-fetch on every mount, including back-nav into a search URL.
  const [posts,             setPosts]             = useState<Post[]>(searching ? [] : (cachedFeedPosts ?? []));
  const [malls,             setMalls]             = useState<Mall[]>([]);
  const [loading,           setLoading]           = useState<boolean>(searching || cachedFeedPosts === null);
  const [error,             setError]             = useState(false);
  const [mallId,            setMallId]            = useSavedMallId();
  const [mallSheetOpen,     setMallSheetOpen]     = useState(false);
  const [followedIds,       setFollowedIds]       = useState<Set<string>>(new Set());
  const [bookmarkCount,     setBookmarkCount]     = useState(0);
  const [lastViewedId,      setLastViewedId]      = useState<string | null>(null);
  const [featuredImageUrl,  setFeaturedImageUrl]  = useState<string | null>(null);
  const wasHidden        = useRef(false);
  const pendingScrollY   = useRef<number | null>(null);
  const scrollRestored   = useRef(false);

  // Session 78 — David: "These should be fixed and not transition." Drop
  // the per-tile entrance fade entirely. The shared-element morph is now
  // the only motion that runs on this page; tiles render at full opacity
  // from frame 1 on every visit (cold start, back-nav, foreground).
  const skipTileEntrance = true;

  // ── Bookmarks ────────────────────────────────────────────────────────────────
  function syncBookmarks() {
    const ids = loadFollowedIds();
    setFollowedIds(ids);
    setBookmarkCount(ids.size);
  }

  useEffect(() => {
    syncBookmarks();
    function onFocus() { syncBookmarks(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // R3 — page_viewed analytics event (fire-and-forget; runs once on mount).
  useEffect(() => { track("page_viewed", { path: "/" }); }, []);

  // ── Feed / search load ──────────────────────────────────────────────────────
  // R16 — branches on `q`. Empty query → existing 30-day getFeedPosts (cache
  // honored). Non-empty → searchPosts with mall scope pushed server-side so
  // the empty state can mean "no results in current mall" not "filtered out
  // client-side." Search path bypasses cachedFeedPosts; cache is feed-only.
  const loadPosts = useCallback(async () => {
    const isSearching = q.trim().length > 0;
    if (isSearching) setLoading(true);
    else if (cachedFeedPosts === null) setLoading(true);
    setError(false);
    try {
      const data = isSearching
        ? await searchPosts({ query: q, mallId: mallId ?? null, limit: 80 })
        : await getFeedPosts(80);
      setPosts(data);
      if (!isSearching) cachedFeedPosts = data;
      // Phase B QA fix #2 — populate the /find/[id] post cache with every
      // loaded post (feed OR search). Tapping any tile hits the cache on
      // detail mount; metadata paints synchronously alongside the photo.
      // Subsequent swipes through the context list ride the same cache.
      for (const p of data) setPostCache(p);
      setLoading(false);
    } catch {
      // Only surface the error state if we have no cached posts to fall
      // back on; otherwise keep showing the cached feed.
      if (!isSearching && cachedFeedPosts === null) setError(true);
      setLoading(false);
    }
  }, [q, mallId]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Load featured-find banner URL on mount — fire-and-forget; banner renders
  // null when no image is set (v1.1l graceful collapse).
  useEffect(() => {
    getSiteSettingUrl("featured_find_image_url").then(setFeaturedImageUrl);
  }, []);

  // ── Scroll + last-viewed restore ────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) pendingScrollY.current = y;
      }
      const lastId = sessionStorage.getItem(LAST_VIEWED_KEY);
      if (lastId) {
        setLastViewedId(lastId);
        sessionStorage.removeItem(LAST_VIEWED_KEY);
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

  // ── Malls load + stale-id fallback ──────────────────────────────────────────
  // Saved mall id is restored by useSavedMallId on mount. If the persisted id
  // points to a mall that's no longer active (mall removed/inactivated), fall
  // back to All so the user doesn't see an empty feed behind a stale filter.
  useEffect(() => {
    getActiveMalls().then((data) => {
      setMalls(data);
      if (mallId && !data.some((m) => m.id === mallId)) {
        setMallId(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Visibility change: reload feed + sync bookmarks when tab comes back ──
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        wasHidden.current = true;
      } else if (document.visibilityState === "visible" && wasHidden.current) {
        wasHidden.current = false;
        syncBookmarks();
        loadPosts();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadPosts]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleToggleSave(postId: string) {
    let nextSavedState: "saved" | "unsaved" = "saved";
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        try { safeStorage.removeItem(flagKey(postId)); } catch {}
        next.delete(postId);
        setBookmarkCount((c) => Math.max(0, c - 1));
        nextSavedState = "unsaved";
      } else {
        try { safeStorage.setItem(flagKey(postId), "1"); } catch {}
        next.add(postId);
        setBookmarkCount((c) => c + 1);
        nextSavedState = "saved";
      }
      return next;
    });
    // R3 — emit save / unsave event from the feed-card heart toggle. Mirror
    // of the /find/[id] handler; the heart icon is the only engagement
    // mechanic on a find (terminology section in design record).
    track(nextSavedState === "saved" ? "post_saved" : "post_unsaved", { post_id: postId });
  }

  // R16 — SearchBar fires onChange (debounced 200ms inside the primitive).
  // Update local q state + write through to ?q= URL so deep-linking and
  // browser back work cleanly. router.replace (not push) keeps the
  // browser history compact during typing.
  const handleSearchChange = useCallback((next: string) => {
    setQ(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim().length > 0) params.set("q", next);
    else                        params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router, searchParams]);

  function handleMallSelect(nextMallId: string | null) {
    setMallId(nextMallId);
    setMallSheetOpen(false);
    // R3 — filter_applied event. mall_id of null = "All malls".
    // R3 v1.1 (session 73) — `page` field added so per-tab adoption is
    // queryable via `payload->>'page'`. Mirror added to /shelves + /flagged.
    const mallSlug = nextMallId
      ? (malls.find(m => m.id === nextMallId)?.slug ?? null)
      : null;
    track("filter_applied", {
      filter_type:  "mall",
      filter_value: mallSlug ?? "all",
      page:         "/",
    });
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = posts.filter((p) => !mallId || p.mall_id === mallId);
  const selectedMall = malls.find((m) => m.id === mallId) ?? null;

  // Phase A (session 100) — minimal payload of the user's browsing
  // context for /find/[id] swipe nav. Derived from `filtered` so the
  // ordered list reflects what the user actually sees in the grid
  // (mall scope honored). Each tile's `index` prop equals the position
  // in this list.
  const findRefs = useMemo<FindRef[]>(
    () => filtered.map((p) => ({
      id: p.id,
      image_url: p.image_url ?? null,
      title: p.title ?? null,
    })),
    [filtered],
  );

  // Per-mall find counts for MallSheet (unfiltered source — shows how many
  // are available at each mall, not how many match the current filter).
  const findCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) {
      if (p.mall_id) counts[p.mall_id] = (counts[p.mall_id] ?? 0) + 1;
    }
    return counts;
  }, [posts]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* ── 1. Masthead — session-70 locked-grid slot API ───────────────── */}
      {/* Session 90 — auth chrome moved to BottomNav (Profile tab) and
          /login. Right slot explicitly empty: the StickyMasthead default
          share treatment is opt-out here so the Home masthead stays the
          quietest surface in the app. */}
      <StickyMasthead right={null} />

      {/* 1.5 Mall scope header (FeedHero wrapper) — moved above the
          FeaturedBanner per session-68 QA so the persisted mall filter is
          the first thing the eye lands on after the masthead. */}
      <FeedHero
        selectedMall={selectedMall}
        onTapMall={() => setMallSheetOpen(true)}
      />

      {/* ── 1.75 SearchBar (R16) ─────────────────────────────────────────
          Slotted BELOW the mall scope per session-105 iPhone QA reversal of
          design record D2. Reasoning: the mall picker is the primary "where
          am I shopping" choice; search is the secondary "what am I looking
          for here" affordance. Subordinate visual position matches the
          conceptual subordination. Search inherits whatever mall is picked
          (single mall OR all-Kentucky scope) — no widen CTA on empty state
          (D12 reversed same session). */}
      <div style={{ padding: "0 22px 6px" }}>
        <SearchBar initialQuery={initialQ} onChange={handleSearchChange} />
      </div>

      {/* ── 2. FeaturedBanner (eyebrow variant) — admin-editable. Only
             renders when an image URL is set; otherwise collapses quietly. */}
      <FeaturedBanner
        variant="eyebrow"
        imageUrl={featuredImageUrl}
        minHeight={200}
        marginBottom={6}
      />

      {/* ── 3. Diamond divider ─────────────────────────────────────────── */}
      <div style={{ padding: "16px 44px 14px" }}>
        {/* v1.1j — diamond ornament retired; plain hairline */}
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </div>

      {/* ── 4. Paper masonry ───────────────────────────────────────────── */}
      <main
        style={{
          padding: "0 22px",
          paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
        }}
      >
        {loading ? (
          <SkeletonMasonry />
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 60,
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              color: v1.inkMuted,
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            Couldn&apos;t load finds. Check your connection and try again.
          </div>
        ) : filtered.length === 0 ? (
          searching ? (
            // R16 — search-empty state. Italic Lora subtitle only; no
            // widen-to-all-Kentucky CTA (D12 reversed session 105 per
            // David's "search only the selected mall location" framing).
            // If the user wants to broaden, they use the mall picker
            // above — no hand-holding affordance per the minimalistic-
            // magic rule.
            <EmptyState
              subtitle={
                selectedMall
                  ? `Nothing matching "${q.trim()}" at ${selectedMall.name} yet.`
                  : `Nothing matching "${q.trim()}" yet.`
              }
            />
          ) : (
            <EmptyState
              title="The shelves are quiet."
              subtitle="Check back soon — new finds land here the moment a vendor posts them."
            />
          )
        ) : (
          <MasonryGrid
            posts={filtered}
            followedIds={followedIds}
            onToggleSave={handleToggleSave}
            lastViewedId={lastViewedId}
            skipEntrance={skipTileEntrance}
            findRefs={findRefs}
          />
        )}

      </main>

      <BottomNav active="home" flaggedCount={bookmarkCount} />

      {/* ── MallSheet ──────────────────────────────────────────────────── */}
      <MallSheet
        open={mallSheetOpen}
        onClose={() => setMallSheetOpen(false)}
        malls={malls}
        activeMallId={mallId}
        onSelect={handleMallSelect}
        findCounts={findCounts}
      />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(230,220,200,0.6) 25%,
            rgba(210,200,180,0.8) 50%,
            rgba(230,220,200,0.6) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
}

// Suspense wrapper required for useSearchParams in App Router client
// components (R16 — added with the SearchBar slot in session 105).
export default function DiscoveryFeedPage() {
  return (
    <Suspense>
      <DiscoveryFeedInner />
    </Suspense>
  );
}
