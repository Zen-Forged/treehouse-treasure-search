// app/page.tsx
// Treehouse — Discovery Feed
// Only available posts are shown — sold items are filtered at the query level.
// Heart icon: top-right of each tile image, always visible, toggleable from feed.
// No mode toggle — mode is now managed via authentication.
// Header: plain "Sign in" link when unauthed, "Sign out" when authed.

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Compass, ChevronDown, Heart } from "lucide-react";
import { getFeedPosts, getAllMalls } from "@/lib/posts";
import { getSession, signOut, onAuthChange } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import { MallHeroCard, GenericMallHero } from "@/components/MallHeroCard";
import type { Post, Mall } from "@/types/treehouse";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:           "#f5f2eb",
  surface:      "#edeae1",
  surfaceDeep:  "#e4e0d6",
  border:       "rgba(26,24,16,0.09)",
  borderLight:  "rgba(26,24,16,0.05)",
  textPrimary:  "#1c1a14",
  textMid:      "#4a4840",
  textMuted:    "#8a8476",
  textFaint:    "#b4ae9e",
  green:        "#1e4d2b",
  greenLight:   "rgba(30,77,43,0.08)",
  greenSolid:   "rgba(30,77,43,0.90)",
  greenBorder:  "rgba(30,77,43,0.20)",
  header:       "rgba(245,242,235,0.96)",
};

const SCROLL_KEY      = "treehouse_feed_scroll";
const BOOKMARK_PREFIX = "treehouse_bookmark_";

function flagKey(postId: string) { return `${BOOKMARK_PREFIX}${postId}`; }

// ─── Bookmark helpers ──────────────────────────────────────────────────────────

function loadFollowedIds(): Set<string> {
  const followed = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        followed.add(key.slice(BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return followed;
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
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <Compass size={20} style={{ color: C.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        The shelves are quiet.
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 230, margin: "0 auto 28px" }}>
        Be the first vendor to share a find in your area.
      </p>
      <button
        onClick={() => router.push("/post")}
        style={{ padding: "12px 24px", borderRadius: 24, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", letterSpacing: "0.2px", background: C.green, border: "none", boxShadow: "0 2px 12px rgba(30,77,43,0.25)" }}
      >
        Post a find
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
              style={{ borderRadius: 16, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}` }}>
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
  post, index, isFollowed, onToggleSave,
}: {
  post: Post;
  index: number;
  isFollowed: boolean;
  onToggleSave: (postId: string) => void;
}) {
  const [imgErr,    setImgErr]    = useState(false);
  const [imgHeight, setImgHeight] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasImg = !!post.image_url && !imgErr;
  const fallbackHeights = [120, 145, 110, 160, 130, 105, 150, 125];
  const fallbackH = fallbackHeights[index % fallbackHeights.length];

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden", background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 10px rgba(26,24,16,0.07), 0 1px 3px rgba(26,24,16,0.04)",
          position: "relative",
        }}>
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", height: imgHeight ?? fallbackH }}>
              <img ref={imgRef} src={post.image_url!} alt={post.title}
                onLoad={handleLoad} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter: "brightness(0.99) saturate(0.96)" }} />
              {/* Heart — top-right corner, always visible, toggleable */}
              <button
                onClick={handleHeartClick}
                aria-label={isFollowed ? "Remove from My Finds" : "Save"}
                style={{
                  position: "absolute", top: 8, right: 8,
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isFollowed ? C.greenSolid : "rgba(0,0,0,0.30)",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                  border: "none", cursor: "pointer",
                  transition: "background 0.18s, transform 0.12s",
                  boxShadow: isFollowed ? "0 2px 8px rgba(30,77,43,0.40)" : "0 1px 5px rgba(0,0,0,0.22)",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Heart
                  size={16}
                  strokeWidth={isFollowed ? 0 : 1.8}
                  style={{
                    color: "rgba(255,255,255,0.96)",
                    fill: isFollowed ? "rgba(255,255,255,0.96)" : "none",
                  }}
                />
              </button>
            </div>
          ) : (
            <div style={{ padding: "16px 13px 10px", minHeight: fallbackH, display: "flex", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.35 }}>{post.title}</div>
            </div>
          )}
          <div style={{ padding: "10px 11px 13px", borderTop: hasImg ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, color: C.textPrimary,
              lineHeight: 1.35,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
            }}>
              {post.title}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Two-column masonry ────────────────────────────────────────────────────────

function MasonryGrid({
  posts, followedIds, onToggleSave,
}: {
  posts: Post[];
  followedIds: Set<string>;
  onToggleSave: (postId: string) => void;
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
            <MasonryTile post={post} index={i * 2} isFollowed={followedIds.has(post.id)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: offset }}>
        {col2.map((post, i) => (
          <MasonryTile key={post.id} post={post} index={i * 2 + 1} isFollowed={followedIds.has(post.id)} onToggleSave={onToggleSave} />
        ))}
      </div>
    </div>
  );
}

// ─── Mall dropdown ─────────────────────────────────────────────────────────────

function MallDropdown({ malls, selectedId, onChange }: { malls: Mall[]; selectedId: string | null; onChange: (id: string | null) => void }) {
  if (malls.length <= 1) return null;
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none", zIndex: 1 }}>
        <MapPin size={11} style={{ color: C.textMuted }} />
        <span style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500 }}>Mall</span>
      </div>
      <select value={selectedId ?? ""} onChange={e => onChange(e.target.value || null)}
        style={{ width: "100%", appearance: "none", WebkitAppearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 32px 8px 64px", fontSize: 12, color: C.textPrimary, fontFamily: "Georgia, serif", cursor: "pointer", outline: "none" }}>
        <option value="">All malls</option>
        {malls.map(m => <option key={m.id} value={m.id}>{m.name}{m.city ? `, ${m.city}` : ""}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} />
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
  const hasFetched = useRef(false);
  const feedRef    = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        const y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) requestAnimationFrame(() => { window.scrollTo({ top: y, behavior: "instant" }); });
      }
    } catch {}
    function onScroll() { try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY))); } catch {} }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { getAllMalls().then(setMalls); }, []);

  useEffect(() => {
    getSession().then(s => setIsAuthed(!!s?.user));
    const unsub = onAuthChange(user => setIsAuthed(!!user));
    return unsub;
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let live = true;
    setLoading(true); setError(false);
    getFeedPosts(80)
      .then(data => { if (live) { setPosts(data); setLoading(false); } })
      .catch(()  => { if (live) { setError(true);  setLoading(false); } });
    return () => { live = false; };
  }, []);

  // Toggle save/unsave from feed tile
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
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "max(16px, env(safe-area-inset-top, 16px))", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
              Treehouse Finds
            </span>
          </div>
          {/* Auth CTA — plain text, no pill */}
          {isAuthed === false && (
            <Link href="/login"
              style={{
                fontSize: 13, color: C.green,
                fontFamily: "Georgia, serif", fontStyle: "italic",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
              Sign in
            </Link>
          )}
          {isAuthed === true && (
            <button
              onClick={handleSignOut}
              style={{
                fontSize: 13, color: C.textMuted,
                fontFamily: "Georgia, serif", fontStyle: "italic",
                background: "none", border: "none", cursor: "pointer",
                padding: 0, whiteSpace: "nowrap",
                WebkitTapHighlightColor: "transparent",
              }}>
              Sign out
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
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.textMid, fontWeight: 400, letterSpacing: "-0.1px" }}>
                {selectedMall ? `Finds from ${selectedMall.name}` : "Recently added"}
              </span>
            </div>
          )}

          {loading ? <SkeletonMasonry /> : error ? (
            <div style={{ textAlign: "center", paddingTop: 60, fontFamily: "Georgia, serif", color: C.textMuted, fontSize: 14 }}>
              Couldn&apos;t load finds. Check your connection and try again.
            </div>
          ) : filtered.length === 0 ? <EmptyFeed /> : (
            <AnimatePresence>
              <MasonryGrid posts={filtered} followedIds={followedIds} onToggleSave={handleToggleSave} />
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
