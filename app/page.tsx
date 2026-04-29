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
import FlagGlyph from "@/components/FlagGlyph";
import { getFeedPosts, getActiveMalls } from "@/lib/posts";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  MOTION_EASE_OUT,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
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
    <div
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
          fontFamily: FONT_LORA,
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
          fontFamily: FONT_LORA,
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
    </div>
  );
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
}: {
  post: Post;
  index: number;
  isFollowed: boolean;
  onToggleSave: (postId: string) => void;
  isLastViewed: boolean;
  skipEntrance: boolean;
}) {
  const [imgErr,      setImgErr]      = useState(false);
  const [highlighted, setHighlighted] = useState(isLastViewed);
  const [tapped,      setTapped]      = useState(false);
  const { ref: revealRef, visible } = useScrollReveal(0.1, skipEntrance);
  const hasImg = !!post.image_url && !imgErr;

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
        {/* Polaroid frame — session 83 PoC of "consistent container against
            random imagery" (Polaroid evolved direction A from
            docs/mockups/card-container-v1.html). Warm-cream paper card with
            generous bottom mat for the existing FONT_SYS italic timestamp.
            Home only. */}
        <div
          style={{
            background: "#faf2e0",
            padding: "7px 7px 8px",
            borderRadius: 4,
            boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)",
          }}
        >
        {/* Photograph slot — session 88 (A1): fixed 4:5 aspect ratio matching
            /flagged FindTile, so the masonry layout is stable from frame 1.
            Previously each tile resized as its image loaded (height computed
            from natural aspect ratio in onLoad), which produced cascading
            layout reflows that read as 'animation.' Trade-off: tiles no
            longer match real photo aspect ratios; vendor photos taken
            portrait from a phone naturally sit close to 4:5 so the cropping
            is minimal. The motion.div carries the visible photograph chrome;
            siblings (heart, tap-flash) overlay the slot. */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/5",
            transform: tapped ? "scale(1.028)" : "scale(1)",
            transition: tapped
              ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1)"
              : "transform 0.32s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          {/* Session 88 — layoutId stripped per David's 'pull out all
              animations' call. Track D shared-element morph (tile photo
              → /find/[id] hero) is gone with this; revisit in a future
              full session. */}
          <div
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
                  fontFamily: FONT_LORA,
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
          </div>

          {/* Session 88 — flag layoutId stripped too (full Nuke per David). */}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 36,
              height: 36,
              zIndex: 3,
            }}
          >
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
          </div>
        </div>

        {/* Relative timestamp — Variant D from feed-timestamp-v1.html mockup,
            italicized session 69 to nod toward IM Fell italic vocabulary. */}
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
      {/* Session 90 — sign-in/sign-out moved off the masthead onto the
          BottomNav (sign-in tab) and /login (sign-out affordance). The
          right slot is now empty here; the StickyMasthead's default share
          treatment fills it. */}
      <StickyMasthead />

      {/* 1.5 Mall scope header (FeedHero wrapper) — moved above the
          FeaturedBanner per session-68 QA so the persisted mall filter is
          the first thing the eye lands on after the masthead. */}
      <FeedHero
        selectedMall={selectedMall}
        onTapMall={() => setMallSheetOpen(true)}
      />

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
          <EmptyFeed />
        ) : (
          <MasonryGrid
            posts={filtered}
            followedIds={followedIds}
            onToggleSave={handleToggleSave}
            lastViewedId={lastViewedId}
            skipEntrance={skipTileEntrance}
          />
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
