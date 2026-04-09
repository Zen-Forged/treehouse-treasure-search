// app/page.tsx
// Treehouse — Discovery Feed

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Compass, ChevronDown } from "lucide-react";
import { getFeedPosts, getAllMalls } from "@/lib/posts";
import { safeStorage } from "@/lib/safeStorage";
import BottomNav from "@/components/BottomNav";
import { MallHeroCard, GenericMallHero } from "@/components/MallHeroCard";
import type { Post, Mall } from "@/types/treehouse";

const C = {
  bg:           "#f0ede6",
  surface:      "#e8e4db",
  surfaceHover: "#e2ddd4",
  surfaceDeep:  "#dedad0",
  border:       "rgba(26,26,24,0.1)",
  borderLight:  "rgba(26,26,24,0.06)",
  textPrimary:  "#1a1a18",
  textMid:      "#4a4a42",
  textMuted:    "#8a8478",
  textFaint:    "#b0aa9e",
  green:        "#1e4d2b",
  greenLight:   "rgba(30,77,43,0.08)",
  greenSolid:   "rgba(30,77,43,0.88)",
  greenBorder:  "rgba(30,77,43,0.18)",
  sold:         "#8a8478",
  header:       "rgba(240,237,230,0.94)",
};

const SCROLL_KEY      = "treehouse_feed_scroll";
const BOOKMARK_PREFIX = "treehouse_bookmark_";

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
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 600, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        The shelves are quiet.
      </div>
      <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, maxWidth: 230, margin: "0 auto 26px" }}>
        Be the first vendor to share a find in your area.
      </p>
      <button
        onClick={() => router.push("/post")}
        style={{ padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", letterSpacing: "0.2px", background: C.green, border: "none" }}
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
      {[col1, col2].map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: ci === 1 ? SKELETON_OFFSET : 0 }}>
          {col.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: (ci * col.length + i) * 0.05 }}
              style={{ borderRadius: 14, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="skeleton-shimmer" style={{ height: h }} />
              {/* Text band skeleton */}
              <div style={{ padding: "10px 10px 12px" }}>
                <div className="skeleton-shimmer" style={{ height: 10, borderRadius: 4, marginBottom: 6, width: "80%" }} />
                <div className="skeleton-shimmer" style={{ height: 9, borderRadius: 4, width: "45%" }} />
              </div>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Masonry tile ──────────────────────────────────────────────────────────────

function MasonryTile({ post, index, isFollowed }: { post: Post; index: number; isFollowed: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const [imgHeight, setImgHeight] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";
  const fallbackHeights = [120, 145, 110, 160, 130, 105, 150, 125];
  const fallbackH = fallbackHeights[index % fallbackHeights.length];

  const boothLabel = post.vendor?.booth_number
    ? `Booth ${post.vendor.booth_number}`
    : post.vendor?.display_name ?? null;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const containerWidth = img.parentElement?.offsetWidth ?? 160;
    const ratio = img.naturalHeight / img.naturalWidth;
    const computed = Math.min(260, Math.max(90, Math.round(containerWidth * ratio)));
    setImgHeight(computed);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          borderRadius: 14,
          overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 6px rgba(26,26,24,0.06)",
          position: "relative",
          opacity: isSold ? 0.62 : 1,
          transition: "opacity 0.2s",
        }}>
          {/* Image area */}
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", height: imgHeight ?? fallbackH }}>
              <img ref={imgRef} src={post.image_url!} alt={post.title} onLoad={handleLoad} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: isSold ? "grayscale(0.55) brightness(0.88)" : "brightness(0.97) saturate(0.93)" }} />
              {isSold && (
                <div style={{ position: "absolute", top: 8, left: 8, fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 7px", borderRadius: 4, background: "rgba(240,237,230,0.92)", color: C.textMuted, border: `1px solid ${C.border}`, backdropFilter: "blur(6px)" }}>
                  Unavailable
                </div>
              )}
              {isFollowed && (
                <div style={{ position: "absolute", bottom: 7, right: 7, width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.greenSolid, boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }}>
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M1 1h8v10L5 8.5 1 11V1Z" fill="rgba(255,255,255,0.95)" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "14px 12px 10px", minHeight: fallbackH, display: "flex", alignItems: "flex-start" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>{post.title}</div>
            </div>
          )}

          {/* Text band — always shown below image */}
          <div style={{ padding: "9px 10px 11px", borderTop: hasImg ? `1px solid ${C.borderLight}` : "none" }}>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 12,
              fontWeight: 600,
              color: C.textPrimary,
              lineHeight: 1.3,
              marginBottom: boothLabel ? 4 : 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}>
              {post.title}
            </div>
            {boothLabel && (
              <div style={{
                fontSize: 10,
                color: C.textFaint,
                fontFamily: "monospace",
                letterSpacing: "0.3px",
                lineHeight: 1,
              }}>
                {boothLabel}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Two-column masonry ────────────────────────────────────────────────────────

function MasonryGrid({ posts, followedIds }: { posts: Post[]; followedIds: Set<string> }) {
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {col1.map((post, i) => (
          <div key={post.id} ref={i === 0 ? firstTileRef : undefined}>
            <MasonryTile post={post} index={i * 2} isFollowed={followedIds.has(post.id)} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: offset }}>
        {col2.map((post, i) => (
          <MasonryTile key={post.id} post={post} index={i * 2 + 1} isFollowed={followedIds.has(post.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Mall dropdown (hidden when only 1 mall) ──────────────────────────────────

function MallDropdown({ malls, selectedId, onChange }: { malls: Mall[]; selectedId: string | null; onChange: (id: string | null) => void }) {
  if (malls.length <= 1) return null;

  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <div style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 5, pointerEvents: "none", zIndex: 1 }}>
        <MapPin size={11} style={{ color: C.textMuted }} />
        <span style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500 }}>Mall</span>
      </div>
      <select value={selectedId ?? ""} onChange={e => onChange(e.target.value || null)}
        style={{ width: "100%", appearance: "none", WebkitAppearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 32px 8px 64px", fontSize: 12, color: C.textPrimary, fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
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
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [malls,       setMalls]       = useState<Mall[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(false);
  const [mallId,      setMallId]      = useState<string | null>(null);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const feedRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setFollowedIds(loadFollowedIds()); }, []);
  useEffect(() => { getAllMalls().then(setMalls); }, []);
  useEffect(() => {
    let live = true;
    setLoading(true); setError(false);
    getFeedPosts(80)
      .then(data => { if (live) { setPosts(data); setLoading(false); } })
      .catch(()  => { if (live) { setError(true);  setLoading(false); } });
    return () => { live = false; };
  }, []);

  const filtered     = posts.filter(p => !mallId || p.mall_id === mallId);
  const flaggedCount = followedIds.size;
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
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: C.header, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 15px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "max(14px, env(safe-area-inset-top, 14px))", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Image src="/logo.png" alt="Treehouse" width={22} height={22} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: C.textPrimary, letterSpacing: "0.1px", lineHeight: 1 }}>Treehouse</span>
                <span style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1 }}>Local finds</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/post")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: "0.15px", color: "#fff", cursor: "pointer", background: C.green, border: "none", boxShadow: "0 1px 6px rgba(30,77,43,0.2)" }}
            >
              <Plus size={12} strokeWidth={2.5} />
              Post a find
            </button>
          </div>
          <MallDropdown malls={malls} selectedId={mallId} onChange={setMallId} />
        </header>

        {/* ── Main content ── */}
        <main style={{ padding: "14px 14px 0", paddingBottom: "max(100px, calc(env(safe-area-inset-bottom, 0px) + 90px))" }}>

          {/* ── Mall Hero Card ── */}
          <div style={{ marginBottom: 18 }}>
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

          {/* ── Feed section anchor ── */}
          <div ref={feedRef} style={{ scrollMarginTop: 80 }}>

            {/* Section label */}
            {!loading && filtered.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "1.8px", color: C.textFaint, fontWeight: 500 }}>
                  {selectedMall ? selectedMall.name : "What did you find today?"}
                </span>
                <span style={{ fontSize: 10, color: C.textFaint, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                  {filtered.length} {filtered.length === 1 ? "find" : "finds"}
                </span>
              </div>
            )}

            {/* ── Masonry grid ── */}
            {loading ? <SkeletonMasonry /> : error ? (
              <div style={{ textAlign: "center", paddingTop: 60, color: C.textMuted, fontSize: 13 }}>Couldn't load finds. Check your connection and try again.</div>
            ) : filtered.length === 0 ? <EmptyFeed /> : (
              <AnimatePresence><MasonryGrid posts={filtered} followedIds={followedIds} /></AnimatePresence>
            )}
          </div>
        </main>
      </div>

      <BottomNav active="home" flaggedCount={flaggedCount} />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(220,216,208,0.7) 25%, rgba(200,196,188,0.9) 50%, rgba(220,216,208,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
