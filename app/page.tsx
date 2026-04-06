// app/page.tsx
// Treehouse — Discovery Feed
// The front door. Buyers browse what's new at local peddler and antique malls
// before they make the trip. Vendors gain visibility. Malls get foot traffic.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Compass } from "lucide-react";
import { getFeedPosts } from "@/lib/posts";
import type { Post } from "@/types/treehouse";

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

function timeAgo(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{ borderRadius: 14, overflow: "hidden", background: C.surface, border: `1px solid ${C.border}` }}
    >
      <div className="skeleton-shimmer" style={{ width: "100%", paddingBottom: "68%" }} />
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton-shimmer" style={{ height: 15, width: "62%", borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "38%", borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "82%", borderRadius: 4 }} />
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFeed({ filter }: { filter: string }) {
  const router    = useRouter();
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

// ─── Vendor + mall attribution tag ───────────────────────────────────────────

function VendorMallTag({ post }: { post: Post }) {
  const vendor = post.vendor;
  const mall   = post.mall;
  if (!vendor && !mall) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.preventDefault()}>
      <MapPin size={9} style={{ color: C.textMuted, flexShrink: 0 }} />
      <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1, display: "flex", alignItems: "center", gap: 3, flexWrap: "nowrap" }}>
        {vendor && (
          vendor.slug
            ? <Link href={`/vendor/${vendor.slug}`} style={{ color: C.textMid, textDecoration: "none" }} onClick={e => e.stopPropagation()}>{vendor.display_name}</Link>
            : <span>{vendor.display_name}</span>
        )}
        {vendor && mall && <span style={{ opacity: 0.4 }}>·</span>}
        {mall && (
          mall.slug
            ? <Link href={`/mall/${mall.slug}`} style={{ color: C.textMuted, textDecoration: "none" }} onClick={e => e.stopPropagation()}>{mall.name}{mall.city ? `, ${mall.city}` : ""}</Link>
            : <span>{mall.name}{mall.city ? `, ${mall.city}` : ""}</span>
        )}
      </div>
    </div>
  );
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.05, 0.35), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          borderRadius: 14, overflow: "hidden",
          background: C.surface,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 4px rgba(26,26,24,0.07)",
          position: "relative", isolation: "isolate",
          opacity: isSold ? 0.65 : 1,
          transition: "opacity 0.2s",
        }}>
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", paddingBottom: "68%" }}>
              <img
                src={post.image_url!} alt={post.title}
                onError={() => setImgErr(true)}
                style={{
                  position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  filter: isSold ? "grayscale(0.5) brightness(0.9)" : "brightness(0.96) saturate(0.92)",
                }}
              />
              {/* Subtle bottom gradient for text legibility */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to bottom, transparent, rgba(26,26,24,0.55))" }} />

              {isSold && (
                <div style={{ position: "absolute", top: 10, left: 10, fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 5, background: "rgba(240,237,230,0.92)", color: C.textMuted, border: `1px solid ${C.border}` }}>
                  Found a home
                </div>
              )}
              {post.price_asking != null && !isSold && (
                <div style={{ position: "absolute", top: 10, right: 10, fontFamily: "monospace", fontSize: 13, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: "rgba(240,237,230,0.94)", color: C.textPrimary, border: `1px solid ${C.border}`, backdropFilter: "blur(8px)" }}>
                  ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
                </div>
              )}

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 13px 11px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: "#f5f0e8", lineHeight: 1.25, textShadow: "0 1px 8px rgba(0,0,0,0.5)", marginBottom: 4 }}>
                  {post.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.preventDefault()}>
                  <MapPin size={9} style={{ color: "rgba(240,237,230,0.7)", flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.7)", lineHeight: 1, display: "flex", alignItems: "center", gap: 3, flexWrap: "nowrap" }}>
                    {post.vendor && (
                      post.vendor.slug
                        ? <Link href={`/vendor/${post.vendor.slug}`} style={{ color: "rgba(240,237,230,0.85)", textDecoration: "none" }} onClick={e => e.stopPropagation()}>{post.vendor.display_name}</Link>
                        : <span>{post.vendor.display_name}</span>
                    )}
                    {post.vendor && post.mall && <span style={{ opacity: 0.5 }}>·</span>}
                    {post.mall && (
                      post.mall.slug
                        ? <Link href={`/mall/${post.mall.slug}`} style={{ color: "rgba(240,237,230,0.7)", textDecoration: "none" }} onClick={e => e.stopPropagation()}>{post.mall.name}{post.mall.city ? `, ${post.mall.city}` : ""}</Link>
                        : <span>{post.mall.name}{post.mall.city ? `, ${post.mall.city}` : ""}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 14px 12px", minHeight: 100 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600, color: C.textPrimary, lineHeight: 1.3, marginBottom: 8 }}>{post.title}</div>
              {post.caption && (
                <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                  {post.caption}
                </p>
              )}
              <VendorMallTag post={post} />
            </div>
          )}

          {hasImg && post.caption && (
            <div style={{ padding: "9px 13px 12px" }}>
              <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.62, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                {post.caption}
              </p>
            </div>
          )}

          <div style={{ position: "absolute", bottom: hasImg && post.caption ? 12 : (hasImg ? 11 : 12), right: 13 }}>
            <span style={{ fontSize: 9, color: C.textFaint, fontFamily: "monospace" }}>{timeAgo(post.created_at)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
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
  const router  = useRouter();
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [filter,  setFilter]  = useState<FilterKey>("all");

  useEffect(() => {
    let live = true;
    setLoading(true); setError(false);
    getFeedPosts(80)
      .then(data => { if (live) { setPosts(data); setLoading(false); } })
      .catch(()  => { if (live) { setError(true);  setLoading(false); } });
    return () => { live = false; };
  }, []);

  const filtered = posts.filter(p => {
    if (filter === "available") return p.status === "available";
    if (filter === "recent")   return (Date.now() - new Date(p.created_at).getTime()) < 7 * 86_400_000;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: C.header,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 15px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "max(14px, env(safe-area-inset-top, 14px))", paddingBottom: 11 }}>
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
          <div style={{ paddingBottom: 10 }}>
            <FilterBar active={filter} onChange={setFilter} />
          </div>
        </header>

        {/* Feed */}
        <main style={{ padding: "12px 13px", paddingBottom: "max(80px, env(safe-area-inset-bottom, 80px))" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {[0,1,2].map(i => <SkeletonCard key={i} delay={i * 0.07} />)}
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: C.textMuted, fontSize: 13 }}>Couldn't load finds. Check your connection and try again.</div>
          ) : filtered.length === 0 ? (
            <EmptyFeed filter={filter} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <AnimatePresence>
                {filtered.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
