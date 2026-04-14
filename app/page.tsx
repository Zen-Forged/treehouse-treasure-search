// app/page.tsx
// Treehouse — Discovery Feed
// Item 6: Sign in link moved left, inline with logo+title group

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Compass, ChevronDown, Heart } from "lucide-react";
import { getFeedPosts, getAllMalls } from "@/lib/posts";
import { getSession, signOut, onAuthChange } from "@/lib/auth";
import { colors } from "@/lib/tokens";
import { flagKey, loadFollowedIds } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import { MallHeroCard, GenericMallHero } from "@/components/MallHeroCard";
import type { Post, Mall } from "@/types/treehouse";

const SCROLL_KEY      = "treehouse_feed_scroll";
const LAST_VIEWED_KEY = "treehouse_last_viewed_post";

// ─── Scroll-triggered reveal hook ─────────────────────────────────────────────

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
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
  }, [threshold]);

  return { ref, visible };
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyFeed() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 72, textAlign: "center" }}
    >
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: colors.surface, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Compass size={20} style={{ color: colors.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        The shelves are quiet.
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.7, maxWidth: 230, margin: "0 auto 28px" }}>
        Be the first vendor to share a find in your area.
      </p>
      <button
        onClick={() => router.push("/shelves")}
        style={{ padding: "12px 24px", borderRadius: 24, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", letterSpacing: "0.2px", background: colors.green, border: "none", boxShadow: "0 2px 12px rgba(30,77,43,0.25)" }}
      >
        Add a Booth
      </button>
    </motion.div>
  );
}

// ─── Masonry skeleton ──────────────────────────────────────────────────────────

const SKELETON_HEIGHTS = [130, 160, 170, 105, 115, 145, 155, 118];
const SKELETON_OFFSET  = Math.round(SKELETON_HEIGHTS[0] * 0.5);

function SkeletonMasonry() {
  const col1 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 0);
  const col2 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      {[col1, col2].map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: ci === 1 ? SKELETON_OFFSET : 0 }}>
          {col.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: (ci * col.length + i) * 0.05 }}
              style={{ borderRadius: 16, overflow: "hidden", background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="skeleton-shimmer" style={{ height: h }} />
              <div style={{ padding: "10px 11px 13px" }}>
                <div className="skeleton-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 7, width: "80%" }} />
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Masonry tile ──────────────────────────────────────────────────────────────

function MasonryTile({
  post, index, isFollowed, onToggleSave, isLastViewed,
}: {
  post: Post;
  index: number;
  isFollowed: boolean;
  onToggleSave: (postId: string) => void;
  isLastViewed: boolean;
}) {
  const [imgErr,      setImgErr]      = useState(false);
  const [imgHeight,   setImgHeight]   = useState<number | null>(null);
  const [hovered,     setHovered]     = useState(false);
  const [highlighted, setHighlighted] = useState(isLastViewed);
  const imgRef = useRef<HTMLImageElement>(null);
  const { ref: revealRef, visible } = useScrollReveal(0.1);
  const hasImg = !!post.image_url && !imgErr;
  const fallbackHeights = [120, 145, 110, 160, 130, 105, 150, 125];
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
    const computed = Math.min(260, Math.max(90, Math.round(containerWidth * ratio)));
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

  const staggerDelay = Math.min(index * 0.04, 0.28);

  return (
    <div
      ref={revealRef}
      data-post-id={post.id}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0px)" : "translateY(16px)",
        transition: `opacity 0.38s ease ${staggerDelay}s, transform 0.44s cubic-bezier(0.22,1,0.36,1) ${staggerDelay}s`,
        willChange: "opacity, transform",
      }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }} onClick={handleTileClick}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            borderRadius: 16, overflow: "hidden", background: colors.surface,
            border: highlighted
              ? `1.5px solid rgba(30,77,43,0.55)`
              : `1px solid ${colors.border}`,
            boxShadow: highlighted
              ? `0 0 0 3px rgba(30,77,43,0.13), 0 4px 18px rgba(26,24,16,0.11)`
              : hovered
                ? "0 6px 20px rgba(26,24,16,0.13), 0 2px 6px rgba(26,24,16,0.07)"
                : "0 2px 10px rgba(26,24,16,0.07), 0 1px 3px rgba(26,24,16,0.04)",
            position: "relative",
            transition: "box-shadow 0.30s ease, border-color 0.60s ease",
          }}
        >
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", height: imgHeight ?? fallbackH, overflow: "hidden" }}>
              <img
                ref={imgRef}
                src={post.image_url!}
                alt={post.title}
                onLoad={handleLoad}
                onError={() => setImgErr(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter: hovered
                    ? "brightness(1.04) saturate(1.10)"
                    : "brightness(0.99) saturate(0.96)",
                  transform: hovered ? "scale(1.018)" : "scale(1)",
                  transition: "filter 0.42s ease, transform 0.52s cubic-bezier(0.22,1,0.36,1)",
                  transformOrigin: "center center",
                }}
              />
              <button
                onClick={handleHeartClick}
                aria-label={isFollowed ? "Remove from My Finds" : "Save"}
                style={{
                  position: "absolute", top: 8, right: 8,
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isFollowed ? colors.greenSolid : "rgba(0,0,0,0.30)",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                  border: "none", cursor: "pointer",
                  transition: "background 0.18s, transform 0.12s",
                  boxShadow: isFollowed ? "0 2px 8px rgba(30,77,43,0.40)" : "0 1px 5px rgba(0,0,0,0.22)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Heart size={16} strokeWidth={isFollowed ? 0 : 1.8}
                  style={{ color: "rgba(255,255,255,0.96)", fill: isFollowed ? "rgba(255,255,255,0.96)" : "none" }} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 13px 10px", minHeight: fallbackH, display: "flex", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.35 }}>{post.title}</div>
            </div>
          )}
          <div style={{ padding: "10px 11px 13px", borderTop: hasImg ? `1px solid ${colors.borderLight}` : "none" }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, color: colors.textPrimary,
              lineHeight: 1.35,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
            }}>
              {post.title}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── Two-column masonry ────────────────────────────────────────────────────────

function MasonryGrid({
  posts, followedIds, onToggleSave, lastViewedId,
}: {
  posts: Post[];
  followedIds: Set<string>;
  onToggleSave: (postId: string) => void;
  lastViewedId: string | null;
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {col1.map((post, i) => (
          <div key={post.id} ref={i === 0 ? firstTileRef : undefined}>
            <MasonryTile
              post={post} index={i * 2}
              isFollowed={followedIds.has(post.id)}
              onToggleSave={onToggleSave}
              isLastViewed={post.id === lastViewedId}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: offset }}>
        {col2.map((post, i) => (
          <MasonryTile
            key={post.id} post={post} index={i * 2 + 1}
            isFollowed={followedIds.has(post.id)}
            onToggleSave={onToggleSave}
            isLastViewed={post.id === lastViewedId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Mall dropdown ────────────────────────────────────────────────────────────

function MallDropdown({ malls, selectedId, onChange }: { malls: Mall[]; selectedId: string | null; onChange: (id: string | null) => void }) {
  if (malls.length <= 1) return null;
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none", zIndex: 1 }}>
        <MapPin size={11} style={{ color: colors.textMuted }} />
        <span style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500 }}>Spot</span>
      </div>
      <select value={selectedId ?? ""} onChange={e => onChange(e.target.value || null)}
        style={{ width: "100%", appearance: "none", WebkitAppearance: "none", background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "8px 32px 8px 64px", fontSize: 12, color: colors.textPrimary, fontFamily: "Georgia, serif", cursor: "pointer", outline: "none" }}>
        <option value="">All Treehouse Spots</option>
        {malls.map(m => <option key={m.id} value={m.id}>{m.name}{m.city ? `, ${m.city}` : ""}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: colors.textMuted, pointerEvents: "none" }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryFeedPage() {
  const router = useRouter();
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [malls,         setMalls]         = useState<Mall[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [mallId,        setMallId]        = useState<string | null>(null);
  const [followedIds,   setFollowedIds]   = useState<Set<string>>(new Set());
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [isAuthed,      setIsAuthed]      = useState<boolean | null>(null);
  const [lastViewedId,  setLastViewedId]  = useState<string | null>(null);
  const feedRef          = useRef<HTMLDivElement>(null);
  const wasHidden        = useRef(false);
  const pendingScrollY   = useRef<number | null>(null);
  const scrollRestored   = useRef(false);

  function syncBookmarks() {
    const ids = loadFollowedIds();
    setFollowedIds(ids);
    setBookmarkCount(ids.size);
  }

  async function loadFeed() {
    let live = true;
    setLoading(true); setError(false);
    try {
      const data = await getFeedPosts(80);
      if (live) { setPosts(data); setLoading(false); }
    } catch {
      if (live) { setError(true); setLoading(false); }
    }
    return () => { live = false; };
  }

  useEffect(() => {
    syncBookmarks();
    function onFocus() { syncBookmarks(); }
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

  useEffect(() => { getAllMalls().then(setMalls); }, []);

  useEffect(() => {
    getSession().then(s => setIsAuthed(!!s?.user));
    const unsub = onAuthChange(user => setIsAuthed(!!user));
    return unsub;
  }, []);

  useEffect(() => { loadFeed(); }, []);

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

  function handleToggleSave(postId: string) {
    setFollowedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        try { localStorage.removeItem(flagKey(postId)); } catch {}
        next.delete(postId);
        setBookmarkCount(c => Math.max(0, c - 1));
      } else {
        try { localStorage.setItem(flagKey(postId), "1"); } catch {}
        next.add(postId);
        setBookmarkCount(c => c + 1);
      }
      return next;
    });
  }

  async function handleSignOut() {
    await signOut();
    setIsAuthed(false);
  }

  const filtered     = posts.filter(p => !mallId || p.mall_id === mallId);
  const selectedMall = malls.find(m => m.id === mallId) ?? null;

  function handleHeroExplore() {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function handleGenericExplore() {
    if (malls.length === 1) setMallId(malls[0].id);
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: colors.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${colors.border}`, padding: "0 16px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: "max(16px, env(safe-area-inset-top, 16px))", paddingBottom: 12 }}>
          <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
            Treehouse Finds
          </span>
          {isAuthed === false && (
            <Link href="/login"
              style={{ fontSize: 13, color: colors.green, fontFamily: "Georgia, serif", fontStyle: "italic", textDecoration: "none", whiteSpace: "nowrap", marginLeft: 2 }}>
              · Sign in
            </Link>
          )}
          {isAuthed === true && (
            <button onClick={handleSignOut}
              style={{ fontSize: 13, color: colors.textMuted, fontFamily: "Georgia, serif", fontStyle: "italic", background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent", marginLeft: 2 }}>
              · Sign out
            </button>
          )}
        </div>

        <MallDropdown malls={malls} selectedId={mallId} onChange={setMallId} />
      </header>

      {/* ── Main ── */}
      <main style={{ padding: "16px 14px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        <div style={{ marginBottom: 20 }}>
          <AnimatePresence mode="wait">
            {selectedMall ? (
              <motion.div key={selectedMall.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
                <MallHeroCard mall={selectedMall} onExplore={handleHeroExplore} />
              </motion.div>
            ) : (
              <motion.div key="generic" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
                <GenericMallHero onExplore={handleGenericExplore} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={feedRef} style={{ scrollMarginTop: 80 }}>
          {!loading && filtered.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: colors.textMid, fontWeight: 400, letterSpacing: "-0.1px" }}>
                Recently added
              </span>
            </div>
          )}

          {loading ? <SkeletonMasonry /> : error ? (
            <div style={{ textAlign: "center", paddingTop: 60, fontFamily: "Georgia, serif", color: colors.textMuted, fontSize: 14 }}>
              Couldn&apos;t load finds. Check your connection and try again.
            </div>
          ) : filtered.length === 0 ? <EmptyFeed /> : (
            <AnimatePresence>
              <MasonryGrid
                posts={filtered}
                followedIds={followedIds}
                onToggleSave={handleToggleSave}
                lastViewedId={lastViewedId}
              />
            </AnimatePresence>
          )}
        </div>
      </main>

      <BottomNav active="home" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,210,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
