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
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown } from "lucide-react";
import { getFeedPosts, getActiveMalls } from "@/lib/posts";
import { getSession, signOut, onAuthChange } from "@/lib/auth";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import { flagKey, loadFollowedIds } from "@/lib/utils";
import { safeStorage } from "@/lib/safeStorage";
import { getSiteSettingUrl } from "@/lib/siteSettings";
import BottomNav from "@/components/BottomNav";
import MallSheet from "@/components/MallSheet";
import StickyMasthead from "@/components/StickyMasthead";
import FeaturedBanner from "@/components/FeaturedBanner";
import type { Post, Mall } from "@/types/treehouse";

const SCROLL_KEY      = "treehouse_feed_scroll";
const LAST_VIEWED_KEY = "treehouse_last_viewed_post";
const SAVED_MALL_KEY  = "treehouse_saved_mall_id";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
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
    try { sessionStorage.setItem(LAST_VIEWED_KEY, post.id); } catch {}
  }

  function handleTilePointerDown() {
    setTapped(true);
    setTimeout(() => setTapped(false), 320);
  }

  const staggerDelay = skipEntrance ? 0 : Math.min(index * 0.04, 0.28);

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
        <div
          style={{
            position: "relative",
            width: "100%",
            height: imgHeight ?? fallbackH,
            borderRadius: v1.imageRadius,
            overflow: "hidden",
            background: v1.postit,
            border: highlighted
              ? `1.5px solid ${v1.green}`
              : `1px solid ${v1.inkHairline}`,
            boxShadow: highlighted
              ? `0 0 0 3px rgba(30,77,43,0.13), 0 4px 14px rgba(42,26,10,0.11)`
              : "0 2px 8px rgba(42,26,10,0.08), 0 1px 3px rgba(42,26,10,0.05)",
            transform: tapped ? "scale(1.028)" : "scale(1)",
            transition: tapped
              ? "transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.30s ease, border-color 0.60s ease"
              : "transform 0.32s cubic-bezier(0.22,1,0.36,1), box-shadow 0.30s ease, border-color 0.60s ease",
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

          {/* Frosted paperCream heart top-right — always visible, state-
              independent bg, green glyph when saved (matches Find Map's tile
              heart + Find Detail v1.1f save-state treatment). */}
          <button
            onClick={handleHeartClick}
            aria-label={isFollowed ? "Remove from saved" : "Save"}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 30,
              height: 30,
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
            <Heart
              size={14}
              strokeWidth={isFollowed ? 0 : 1.6}
              style={{
                color: isFollowed ? v1.green : v1.inkPrimary,
                fill:  isFollowed ? v1.green : "none",
              }}
            />
          </button>

          {/* Tap flash overlay — subtle green wash on touch for tactile
              feedback, matches the v0.2 spring-tap feel. */}
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
// Tappable mall name opens <MallSheet>. State-dependent eyebrow + address/geo line.
function FeedHero({
  selectedMall,
  onTapMall,
}: {
  selectedMall: Mall | null;
  onTapMall:    () => void;
}) {
  const isAll = selectedMall === null;

  const eyebrow = isAll ? "Finds from across" : "Finds from";
  const title   = isAll ? "Kentucky" : selectedMall!.name;
  const cityLine = !isAll
    ? (selectedMall!.city
        ? `${selectedMall!.city}${selectedMall!.state ? `, ${selectedMall!.state}` : ""}`
        : null)
    : null;
  const address = !isAll ? selectedMall!.address ?? null : null;
  const mapLink = !isAll
    ? address
      ? `https://maps.apple.com/?q=${encodeURIComponent(address)}`
      : `https://maps.apple.com/?q=${encodeURIComponent(
          `${selectedMall!.name} ${selectedMall!.city ?? ""} ${selectedMall!.state ?? ""}`
        )}`
    : null;

  return (
    <div style={{ padding: "20px 22px 6px" }}>
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: FONT_IM_FELL,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkMuted,
          lineHeight: 1.4,
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>

      {/* Mall / geography name — tappable → MallSheet */}
      <button
        onClick={onTapMall}
        aria-label="Choose a mall"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 8,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 26,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          style={{
            color: v1.inkMuted,
            transform: "translateY(-2px)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Address line (specific mall) or geo subtitle (All) */}
      {isAll ? (
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_IM_FELL,
            fontStyle: "italic",
            fontSize: 13.5,
            color: v1.inkMuted,
            lineHeight: 1.5,
          }}
        >
          Kentucky & Southern Indiana
        </div>
      ) : (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {/* Small pin glyph inline with address (pin = mall, locked v1.1g) */}
          <svg
            width={13}
            height={16}
            viewBox="0 0 18 22"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
              stroke={v1.inkMuted}
              strokeWidth="1.3"
              fill="none"
            />
            <circle cx="9" cy="8.3" r="2" fill={v1.inkMuted} />
          </svg>
          {address && mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: FONT_SYS,
                fontSize: 14,
                color: v1.inkMuted,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 3,
                lineHeight: 1.5,
              }}
            >
              {address}
            </a>
          ) : cityLine ? (
            <span
              style={{
                fontFamily: FONT_SYS,
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.5,
              }}
            >
              {cityLine}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function DiscoveryFeedPage() {
  const [posts,             setPosts]             = useState<Post[]>([]);
  const [malls,             setMalls]             = useState<Mall[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(false);
  const [mallId,            setMallId]            = useState<string | null>(null);
  const [mallSheetOpen,     setMallSheetOpen]     = useState(false);
  const [followedIds,       setFollowedIds]       = useState<Set<string>>(new Set());
  const [bookmarkCount,     setBookmarkCount]     = useState(0);
  const [isAuthed,          setIsAuthed]          = useState<boolean | null>(null);
  const [lastViewedId,      setLastViewedId]      = useState<string | null>(null);
  const [featuredImageUrl,  setFeaturedImageUrl]  = useState<string | null>(null);
  const wasHidden        = useRef(false);
  const pendingScrollY   = useRef<number | null>(null);
  const scrollRestored   = useRef(false);

  const isRestoringScroll = pendingScrollY.current !== null && !scrollRestored.current;

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

  // ── Feed load ────────────────────────────────────────────────────────────────
  async function loadFeed() {
    setLoading(true);
    setError(false);
    try {
      const data = await getFeedPosts(80);
      setPosts(data);
      setLoading(false);
    } catch {
      setError(true);
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

  // ── Malls + saved selection persistence ──────────────────────────────────────
  useEffect(() => {
    getActiveMalls().then((data) => {
      setMalls(data);
      // On initial load, restore saved mall ID from safeStorage.
      // If the saved mall is no longer in the list (mall removed), fall back to All.
      try {
        const savedId = safeStorage.getItem(SAVED_MALL_KEY);
        if (savedId && data.some((m) => m.id === savedId)) {
          setMallId(savedId);
        }
        // else: default stays null (All malls) per v1.1i "feed first-load defaults to All malls"
      } catch {}
    });
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
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        try { safeStorage.removeItem(flagKey(postId)); } catch {}
        next.delete(postId);
        setBookmarkCount((c) => Math.max(0, c - 1));
      } else {
        try { safeStorage.setItem(flagKey(postId), "1"); } catch {}
        next.add(postId);
        setBookmarkCount((c) => c + 1);
      }
      return next;
    });
  }

  function handleMallSelect(nextMallId: string | null) {
    setMallId(nextMallId);
    try {
      if (nextMallId) safeStorage.setItem(SAVED_MALL_KEY, nextMallId);
      else            safeStorage.removeItem(SAVED_MALL_KEY);
    } catch {}
    setMallSheetOpen(false);
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
      {/* ── 1. Masthead (Mode B) ────────────────────────────────────────── */}
      {/* 1. StickyMasthead (Mode B) — v1.1l primitive */}
      <StickyMasthead
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "max(14px, env(safe-area-inset-top, 14px)) 18px 12px",
          gap: 12,
        }}
      >
        {/* Left slot — logo as brand mark */}
        <div style={{ justifySelf: "start" }} aria-hidden="true">
          <Image
            src="/logo.png"
            alt=""
            width={34}
            height={34}
            style={{ opacity: 0.92 }}
          />
        </div>

        {/* Centered wordmark */}
        <div
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 18,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            whiteSpace: "nowrap",
          }}
        >
          Treehouse Finds
        </div>

        {/* Right slot — sign-in / sign-out text link */}
        <div style={{ justifySelf: "end" }}>
          {isAuthed === false && (
            <Link
              href="/login"
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 3,
                whiteSpace: "nowrap",
              }}
            >
              Sign in
            </Link>
          )}
          {isAuthed === true && (
            <button
              onClick={handleSignOut}
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 3,
                WebkitTapHighlightColor: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              Sign out
            </button>
          )}
          {isAuthed === null && <span aria-hidden="true">&nbsp;</span>}
        </div>
      </StickyMasthead>

      {/* 1.5 FeaturedBanner (eyebrow variant, v1.1l) — admin-editable.
          Only renders when an image URL is set; otherwise collapses quietly. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.04, ease: EASE }}
      >
        <FeaturedBanner
          variant="eyebrow"
          imageUrl={featuredImageUrl}
          minHeight={200}
          marginBottom={6}
        />
      </motion.div>

      {/* ── 2. Feed hero on paper ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, delay: 0.06, ease: EASE }}
      >
        <FeedHero
          selectedMall={selectedMall}
          onTapMall={() => setMallSheetOpen(true)}
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
              skipEntrance={isRestoringScroll}
            />
          </AnimatePresence>
        )}

        {/* ── Vendor CTA — bottom of feed ────────────────────────────── */}
        {!loading && (
          <div style={{ padding: "40px 6px 0", textAlign: "center" }}>
            {/* v1.1j — diamond ornament retired; plain hairline */}
            <div style={{ padding: "0 16px 24px" }}>
              <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
            </div>
            <p
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.75,
                margin: "0 0 14px",
              }}
            >
              Are you a vendor? Bring your booth to Treehouse.
            </p>
            <Link
              href="/vendor-request"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 24px",
                borderRadius: 999,
                background: v1.green,
                color: "#f5ecd8",
                fontFamily: FONT_IM_FELL,
                fontSize: 16,
                letterSpacing: "-0.005em",
                textDecoration: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Request Digital Booth
            </Link>
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
