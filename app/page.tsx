// app/page.tsx
// Treehouse — Discovery Feed
// The front door. Buyers browse what's new at local peddler and antique malls
// before they make the trip. Vendors gain visibility. Malls get foot traffic.

"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Compass, ChevronDown } from "lucide-react";
import { getFeedPosts, getAllMalls } from "@/lib/posts";
import type { Post, Mall } from "@/types/treehouse";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:           "#f0ede6",
  surface:      "#e8e4db",
  surfaceHover: "#e2ddd4",
  border:       "rgba(26,26,24,0.1)",
  borderLight:  "rgba(26,26,24,0.06)",
  textPrimary:  "#1a1a18",
  textMid:      "#4a4a42",
  textMuted:    "#8a8478",
  textFaint:    "#b0aa9e",
  green:        "#1e4d2b",
  greenLight:   "rgba(30,77,43,0.08)",
  greenBorder:  "rgba(30,77,43,0.18)",
  sold:         "#8a8478",
  header:       "rgba(240,237,230,0.94)",
};

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFeed({ filter }: { filter: string }) {
  const router     = useRouter();
  const isFiltered = filter !== "all";
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
        {isFiltered ? "Nothing here yet." : "The shelves are quiet."}
      </div>
      <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65, maxWidth: 230, margin: "0 auto 26px" }}>
        {isFiltered ? "Try a different filter or check back soon." : "Be the first vendor to share a find in your area."}
      </p>
      {!isFiltered && (
        <button
          onClick={() => router.push("/post")}
          style={{ padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", letterSpacing: "0.2px", background: C.green, border: "none" }}
        >
          Post a find
        </button>
      )}
    </motion.div>
  );
}

// ─── Masonry skeleton ─────────────────────────────────────────────────────────

const SKELETON_HEIGHTS = [130, 160, 170, 105, 115, 145, 155, 118];

function SkeletonMasonry() {
  // Split into two columns, staggered
  const col1 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 0);
  const col2 = SKELETON_HEIGHTS.filter((_, i) => i % 2 === 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "start" }}>
      {[col1, col2].map((col, ci) => (
        <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: ci === 1 ? 22 : 0 }}>
          {col.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: (ci * col.length + i) * 0.05 }}
              style={{ borderRadius: 12, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div className="skeleton-shimmer" style={{ height: h }} />
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Masonry tile (image only) ────────────────────────────────────────────────

function MasonryTile({ post, index }: { post: Post; index: number }) {
  const [imgErr,    setImgErr]    = useState(false);
  const [imgHeight, setImgHeight] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  // Natural-height fallback pool so tiles without images still look varied
  const fallbackHeights = [120, 145, 110, 160, 130, 105, 150, 125];
  const fallbackH = fallbackHeights[index % fallbackHeights.length];

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const containerWidth = img.parentElement?.offsetWidth ?? 160;
    const ratio = img.naturalHeight / img.naturalWidth;
    // Clamp between 90 and 260 so nothing gets absurdly tall
    const computed = Math.min(260, Math.max(90, Math.round(containerWidth * ratio)));
    setImgHeight(computed);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          borderRadius: 12,
          overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 4px rgba(26,26,24,0.07)",
          position: "relative",
          opacity: isSold ? 0.62 : 1,
          transition: "opacity 0.2s",
        }}>
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", height: imgHeight ?? fallbackH }}>
              <img
                ref={imgRef}
                src={post.image_url!}
                alt={post.title}
                onLoad={handleLoad}
                onError={() => setImgErr(true)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter: isSold ? "grayscale(0.5) brightness(0.9)" : "brightness(0.97) saturate(0.93)",
                }}
              />

              {/* Price badge — top right */}
              {post.price_asking != null && !isSold && (
                <div style={{
                  position: "absolute", top: 7, right: 7,
                  fontFamily: "monospace", fontSize: 11, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 5,
                  background: "rgba(240,237,230,0.94)",
                  color: C.textPrimary,
                  border: `1px solid ${C.border}`,
                  backdropFilter: "blur(6px)",
                }}>
                  ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
                </div>
              )}

              {/* Sold badge — top left */}
              {isSold && (
                <div style={{
                  position: "absolute", top: 7, left: 7,
                  fontSize: 7, fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "1.5px", padding: "2px 6px", borderRadius: 4,
                  background: "rgba(240,237,230,0.92)",
                  color: C.textMuted,
                  border: `1px solid ${C.border}`,
                }}>
                  Found a home
                </div>
              )}
            </div>
          ) : (
            // No-image fallback: show title in a small content block
            <div style={{ padding: "14px 12px", minHeight: fallbackH, display: "flex", alignItems: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3 }}>
                {post.title}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Two-column staggered masonry ─────────────────────────────────────────────

function MasonryGrid({ posts }: { posts: Post[] }) {
  const col1 = posts.filter((_, i) => i % 2 === 0);
  const col2 = posts.filter((_, i) => i % 2 === 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, alignItems: "start" }}>
      {/* Left column — starts flush */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {col1.map((post, i) => (
          <MasonryTile key={post.id} post={post} index={i * 2} />
        ))}
      </div>
      {/* Right column — offset down for stagger */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
        {col2.map((post, i) => (
          <MasonryTile key={post.id} post={post} index={i * 2 + 1} />
        ))}
      </div>
    </div>
  );
}

// ─── Mall dropdown ────────────────────────────────────────────────────────────

function MallDropdown({
  malls,
  selectedId,
  onChange,
}: {
  malls: Mall[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div style={{ position: "relative", marginBottom: 9 }}>
      <div style={{
        position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
        display: "flex", alignItems: "center", gap: 5,
        pointerEvents: "none", zIndex: 1,
      }}>
        <MapPin size={11} style={{ color: C.textMuted }} />
        <span style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500 }}>
          Mall
        </span>
      </div>
      <select
        value={selectedId ?? ""}
        onChange={e => onChange(e.target.value || null)}
        style={{
          width: "100%",
          appearance: "none",
          WebkitAppearance: "none",
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: "8px 32px 8px 64px",
          fontSize: 12,
          color: C.textPrimary,
          fontFamily: "inherit",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="">All malls</option>
        {malls.map(m => (
          <option key={m.id} value={m.id}>
            {m.name}{m.city ? `, ${m.city}` : ""}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          color: C.textMuted, pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterKey = "all" | "available" | "recent";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All finds" },
  { key: "available", label: "Available" },
  { key: "recent",    label: "Just in"   },
];

function FilterBar({ active, onChange }: { active: FilterKey; onChange: (k: FilterKey) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 1 }} className="hide-scrollbar">
      {FILTERS.map(f => {
        const on = active === f.key;
        return (
          <button key={f.key} onClick={() => onChange(f.key)} style={{
            flexShrink: 0, padding: "6px 14px", borderRadius: 20, fontSize: 11,
            fontWeight: on ? 600 : 400, letterSpacing: "0.15px", cursor: "pointer", transition: "all 0.18s ease",
            color:      on ? "#fff" : C.textMid,
            background: on ? C.green : C.surface,
            border:     on ? "none" : `1px solid ${C.border}`,
          }}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoveryFeedPage() {
  const router = useRouter();

  const [posts,    setPosts]    = useState<Post[]>([]);
  const [malls,    setMalls]    = useState<Mall[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [filter,   setFilter]   = useState<FilterKey>("all");
  const [mallId,   setMallId]   = useState<string | null>(null);

  // Load malls once
  useEffect(() => {
    getAllMalls().then(setMalls);
  }, []);

  // Load posts whenever mall filter changes
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    getFeedPosts(80)
      .then(data => { if (live) { setPosts(data); setLoading(false); } })
      .catch(()  => { if (live) { setError(true);  setLoading(false); } });
    return () => { live = false; };
  }, []);

  const filtered = posts.filter(p => {
    if (mallId && p.mall_id !== mallId) return false;
    if (filter === "available") return p.status === "available";
    if (filter === "recent")   return (Date.now() - new Date(p.created_at).getTime()) < 7 * 86_400_000;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: C.header,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 15px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "max(14px, env(safe-area-inset-top, 14px))", paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Image src="/logo.png" alt="Treehouse" width={23} height={23} />
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: C.textPrimary, letterSpacing: "0.2px", lineHeight: 1 }}>Treehouse</span>
                <span style={{ fontSize: 7, color: C.textMuted, textTransform: "uppercase", letterSpacing: "2.5px", lineHeight: 1 }}>Local finds</span>
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

          {/* Mall selector */}
          <MallDropdown malls={malls} selectedId={mallId} onChange={setMallId} />

          {/* Status filter pills */}
          <div style={{ paddingBottom: 10 }}>
            <FilterBar active={filter} onChange={setFilter} />
          </div>
        </header>

        {/* ── Feed ── */}
        <main style={{ padding: "12px 13px", paddingBottom: "max(80px, env(safe-area-inset-bottom, 80px))" }}>
          {loading ? (
            <SkeletonMasonry />
          ) : error ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: C.textMuted, fontSize: 13 }}>
              Couldn't load finds. Check your connection and try again.
            </div>
          ) : filtered.length === 0 ? (
            <EmptyFeed filter={filter} />
          ) : (
            <AnimatePresence>
              <MasonryGrid posts={filtered} />
            </AnimatePresence>
          )}
        </main>

      </div>
    </div>
  );
}
