// app/page.tsx
// Treehouse — Discovery Feed (v1.1i, docs/design-system.md §Feed, session 21A)
//
// Layout top-to-bottom:
//   1. Masthead (Mode B) — back/menu left slot (empty for now — Nav Shelf
//      lands here in 21B), centered "Treehouse Finds" wordmark, right slot
//      sign-in/sign-out text link (preserved from v0.2 auth affordance;
//      profile-circle icon deferred pending real profile page)
//   2. Feed hero on paper — IM Fell italic eyebrow ("Finds from across" /
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

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CircleUser } from "lucide-react";
import FlagGlyph from "@/components/FlagGlyph";
import { getFeedPosts, getActiveMalls } from "@/lib/posts";
import { getSession, signOut, onAuthChange } from "@/lib/auth";
import {
  v1,
  FONT_IM_FELL,
  FONT_SYS,
  MOTION_EASE_OUT,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
  MOTION_EMPTY_DURATION,
  MOTION_SHARED_ELEMENT_EASE,
  MOTION_SHARED_ELEMENT_BACK,
} from "@/lib/tokens";
import { TREEHOUSE_LENS_FILTER } from "@/lib/treehouseLens";
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
import VendorCTACard from "@/components/VendorCTACard";
import type { Post, Mall } from "@/types/treehouse";

const SCROLL_KEY      = "treehouse_feed_scroll";
const LAST_VIEWED_KEY = "treehouse_last_viewed_post";
// Set on first feed mount in a session — any subsequent mount (back-nav,
// re-foregrounding, etc.) treats the page as "already visited" and skips
// the masonry tile entrance fade so the shared-element morph from
// /find/[id] reads as the only motion on screen, not a stagger of every
// tile fading back in. Mirrors FB Marketplace back-nav behavior.
const FEED_VISITED_KEY = "treehouse_feed_visited";
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

// ── Empty state (paper-voice rewrite) ──────────────────────────────────────────
function EmptyFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_EMPTY_DURATION, ease: MOTION_EASE_OUT }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 72,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontSize: 20,
          color: v1.inkPrimary,
          marginBottom: 10,
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
        }}
      >
        The shelves are quiet.
      </div>
      <p
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 14,
          color: v1.inkMuted,
          lineHeight: 1.7,
          maxWidth: 230,
          margin: "0 auto",
        }}
      >
        Check back soon — new finds land here the moment a vendor posts them.
      </p>
    </motion.div>
  );
}

// ── Skeleton masonry ──────────────────────────────────────────────────────────
const SKELETON_HEIGHTS = [130, 160, 170, 105, 115, 145, 155, 118];
const SKELETON_OFFSET  = Math.round(SKELETON_HEIGHTS[0] * 0.5);

function SkeletonMasonry() {
  const col1 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 0);
  const col2 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 1);
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
          {col.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: (ci * col.length + i) * 0.05 }}
              style={{
                borderRadius: v1.imageRadius,
                overflow: "hidden",
                background: v1.postit,
                border: `1px solid ${v1.inkHairline}`,
                height: h,
              }}
            >
              <div className="skeleton-shimmer" style={{ height: "100%" }} />
            </motion.div>
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
}: {
  post: Post;
  index: number;
  isFollowed: boolean;
  onToggleSave: (postId: string) => void;
  isLastViewed: boolean;
  skipEntrance: boolean;
}) {
  const [imgErr,      setImgErr]      = useState(false);
  const [imgHeight,   setImgHeight]   = useState<number | null>(null);
  const [highlighted, setHighlighted] = useState(isLastViewed);
  const [tapped,      setTapped]      = useState(false);
  const { ref: revealRef, visible } = useScrollReveal(0.1, skipEntrance);
  const hasImg = !!post.image_url && !imgErr;
  const fallbackHeights = [180, 210, 160, 230, 195, 155, 220, 185];
  const fallbackH = fallbackHeights[index % fallbackHeights.length];

  useEffect(() => {
    if (!isLastViewed) return;
    const t = setTimeout(() => setHighlighted(false), 1600);
    return () => clearTimeout(t);
  }, [isLastViewed]);

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const containerWidth = img.parentElement?.offsetWidth ?? 160;
    const ratio = img.naturalHeight / img.naturalWidth;
    // Clamp heights so no single tile dominates the column; variable height is
    // the point of the masonry, but a 4x-aspect tile would break the rhythm.
    const computed = Math.min(310, Math.max(120, Math.round(containerWidth * ratio)));
    setImgHeight(computed);
  }

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
  }

  function handleTilePointerDown() {
    setTapped(true);
    setTimeout(() => setTapped(false), 320);
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
        onPointerDown={handleTilePointerDown}
        style={{ display: "block", textDecoration: "none" }}
      >
        {/* Photograph slot — fixed-height layout reservation so the masonry
            grid stays put when the photograph lifts out via layoutId during
            forward nav (Track D phase 5, docs/marketplace-transitions-design.md
            implementation note 3). The motion.div carries the visible
            photograph chrome; siblings (heart, tap-flash) overlay the slot. */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: imgHeight ?? fallbackH,
            transform: tapped ? "scale(1.028)" : "scale(1)",
            transition: tapped
              ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)"
              : "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <motion.div
            layoutId={`find-${post.id}`}
            transition={{ duration: MOTION_SHARED_ELEMENT_BACK, ease: MOTION_SHARED_ELEMENT_EASE }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: v1.imageRadius,
              overflow: "hidden",
              background: v1.postit,
              border: highlighted
                ? `1.5px solid ${v1.green}`
                : `1px solid ${v1.inkHairline}`,
              boxShadow: highlighted
                ? `0 0 0 3px rgba(30,77,43,0.13), 0 4px 14px rgba(42,26,10,0.11)`
                : "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
              transition: "box-shadow 0.30s ease, border-color 0.60s ease",
            }}
          >
            {hasImg ? (
              <img
                src={post.image_url!}
                alt={post.title}
                onLoad={handleLoad}
                onError={() => setImgErr(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:       TREEHOUSE_LENS_FILTER,
                  WebkitFilter: TREEHOUSE_LENS_FILTER,
                }}
              />
            ) : (
              // Fallback — paper card with italic title (only appears when the
              // image failed to load). The feed tile's contract is photograph-only,
              // but no-image is still a rare possibility so we degrade quietly.
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "14px 12px",
                  display: "flex",
                  alignItems: "flex-end",
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: v1.inkMuted,
                  lineHeight: 1.35,
                }}
              >
                {post.title}
              </div>
            )}

            {/* Tap flash overlay — subtle green wash on touch for tactile
                feedback, matches the v0.2 spring-tap feel. Lives inside the
                motion.div so its rounded clipping matches the photograph. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(30,77,43,0.08)",
                opacity: tapped ? 1 : 0,
                transition: tapped ? "opacity 0.08s ease" : "opacity 0.28s ease",
                pointerEvents: "none",
              }}
            />
          </motion.div>

          {/* Frosted paperCream save flag top-right — always visible, state-
              independent bg, green-filled flag when saved. Session 61:
              heart → flag per save-glyph-v1.html Variant B. The flag-on-pole
              reads as a physical-place marker (booth, vendor location) rather
              than a commerce-style favorite. Sibling of the motion.div so it
              stays in the layout slot during a layoutId flight. */}
          <button
            onClick={handleHeartClick}
            aria-label={isFollowed ? "Remove flag" : "Flag"}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(232,221,199,0.78)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: `0.5px solid rgba(42,26,10,0.12)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              zIndex: 2,
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
        </div>

        {/* Relative timestamp — Variant D from feed-timestamp-v1.html mockup,
            italicized session 69 to nod toward IM Fell italic vocabulary. */}
        <div
          style={{
            padding: "4px 0 0",
            fontFamily: FONT_SYS,
            fontStyle: "italic",
            fontSize: 10,
            color: v1.inkMuted,
            letterSpacing: "0.01em",
            lineHeight: 1.2,
            textAlign: "left",
          }}
        >
          {formatTimeAgo(post.created_at)}
        </div>
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
}: {
  posts: Post[];
  followedIds: Set<string>;
  onToggleSave: (postId: string) => void;
  lastViewedId: string | null;
  skipEntrance: boolean;
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
          />
        ))}
      </div>
    </div>
  );
}

// ── Feed hero — paper, no gradient, no CTA ────────────────────────────────────
// Thin wrapper around <MallScopeHeader>. Computes the geo line from the
// selected mall (address link when one mall picked, italic geography when All).
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

  return (
    <MallScopeHeader
      eyebrowAll="Finds from across"
      eyebrowOne="Finds from"
      mallName={isAll ? null : selectedMall!.name}
      geoLine={geoLine}
      onTap={onTapMall}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function DiscoveryFeedPage() {
  // Hydrate from module-scope cache so back-nav from /find/[id] mounts
  // tiles synchronously — the destination motion.div for the shared-element
  // back-morph needs to exist before framer-motion releases the source rect.
  const [posts,             setPosts]             = useState<Post[]>(cachedFeedPosts ?? []);
  const [malls,             setMalls]             = useState<Mall[]>([]);
  const [loading,           setLoading]           = useState<boolean>(cachedFeedPosts === null);
  const [error,             setError]             = useState(false);
  const [mallId,            setMallId]            = useSavedMallId();
  const [mallSheetOpen,     setMallSheetOpen]     = useState(false);
  const [followedIds,       setFollowedIds]       = useState<Set<string>>(new Set());
  const [bookmarkCount,     setBookmarkCount]     = useState(0);
  const [isAuthed,          setIsAuthed]          = useState<boolean | null>(null);
  const [lastViewedId,      setLastViewedId]      = useState<string | null>(null);
  const [featuredImageUrl,  setFeaturedImageUrl]  = useState<string | null>(null);
  const wasHidden        = useRef(false);
  const pendingScrollY   = useRef<number | null>(null);
  const scrollRestored   = useRef(false);

  // Snapshot the "have we been here before this session?" flag on first
  // render so it stays stable across re-renders. Set the flag in a
  // mount-effect so subsequent navs read it as true.
  const [hasVisitedBefore] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try { return !!sessionStorage.getItem(FEED_VISITED_KEY); } catch { return false; }
  });

  useEffect(() => {
    try { sessionStorage.setItem(FEED_VISITED_KEY, "1"); } catch {}
  }, []);

  const isRestoringScroll = pendingScrollY.current !== null && !scrollRestored.current;
  const skipTileEntrance  = hasVisitedBefore || isRestoringScroll;

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

  // ── Feed load ────────────────────────────────────────────────────────────────
  async function loadFeed() {
    // Only flip into "loading" state when we have nothing cached to render.
    // On back-nav with a warm cache, refresh in the background so the user
    // never sees a skeleton replace tiles they were just looking at.
    if (cachedFeedPosts === null) setLoading(true);
    setError(false);
    try {
      const data = await getFeedPosts(80);
      setPosts(data);
      cachedFeedPosts = data;
      setLoading(false);
    } catch {
      // Only surface the error state if we have no cached posts to fall
      // back on; otherwise keep showing the cached feed.
      if (cachedFeedPosts === null) setError(true);
      setLoading(false);
    }
  }

  useEffect(() => { loadFeed(); }, []);

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

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    getSession().then((s) => setIsAuthed(!!s?.user));
    const unsub = onAuthChange((user) => setIsAuthed(!!user));
    return unsub;
  }, []);

  // ── Visibility change: reload feed + sync bookmarks when tab comes back ──
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        wasHidden.current = true;
      } else if (document.visibilityState === "visible" && wasHidden.current) {
        wasHidden.current = false;
        syncBookmarks();
        loadFeed();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

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

  async function handleSignOut() {
    await signOut();
    setIsAuthed(false);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = posts.filter((p) => !mallId || p.mall_id === mallId);
  const selectedMall = malls.find((m) => m.id === mallId) ?? null;

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
      <StickyMasthead
        right={
          isAuthed === false ? (
            <Link
              href="/login"
              aria-label="Sign in"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                color: v1.inkMuted,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <CircleUser size={22} strokeWidth={1.4} />
            </Link>
          ) : isAuthed === true ? (
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: FONT_SYS,
                fontSize: 13,
                fontWeight: 500,
                color: v1.inkMuted,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                WebkitTapHighlightColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              Sign out
            </button>
          ) : null
        }
      />

      {/* 1.5 Mall scope header (FeedHero wrapper) — moved above the
          FeaturedBanner per session-68 QA so the persisted mall filter is
          the first thing the eye lands on after the masthead. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.04, ease: EASE }}
      >
        <FeedHero
          selectedMall={selectedMall}
          onTapMall={() => setMallSheetOpen(true)}
        />
      </motion.div>

      {/* ── 2. FeaturedBanner (eyebrow variant) — admin-editable. Only
             renders when an image URL is set; otherwise collapses quietly. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.06, ease: EASE }}
      >
        <FeaturedBanner
          variant="eyebrow"
          imageUrl={featuredImageUrl}
          minHeight={200}
          marginBottom={6}
        />
      </motion.div>

      {/* ── 3. Diamond divider ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.34, delay: 0.12, ease: EASE }}
        style={{
          padding: "16px 44px 14px",
        }}
      >
        {/* v1.1j — diamond ornament retired; plain hairline */}
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </motion.div>

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
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              color: v1.inkMuted,
              fontSize: 15,
              lineHeight: 1.65,
            }}
          >
            Couldn&apos;t load finds. Check your connection and try again.
          </div>
        ) : filtered.length === 0 ? (
          <EmptyFeed />
        ) : (
          <AnimatePresence>
            <MasonryGrid
              posts={filtered}
              followedIds={followedIds}
              onToggleSave={handleToggleSave}
              lastViewedId={lastViewedId}
              skipEntrance={skipTileEntrance}
            />
          </AnimatePresence>
        )}

        {/* ── Vendor CTA — bottom of feed ────────────────────────────── */}
        {/* Editorial banner card per docs/mockups/vendor-cta-v2.html (γ).    */}
        {/* Renders outside the empty/has-finds conditional, so when a mall   */}
        {/* has no posts the card sits below <EmptyFeed /> for free.          */}
        {!loading && (
          <div style={{ padding: "40px 6px 0" }}>
            <div style={{ padding: "0 16px 24px" }}>
              <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
            </div>
            <VendorCTACard />
          </div>
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
