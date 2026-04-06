// app/page.tsx
// Treehouse — Discovery Feed
// The front door. Buyers browse what's new at local peddler and antique malls
// before they make the trip. Vendors gain visibility. Malls get foot traffic.

"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Compass } from "lucide-react";
import { getFeedPosts } from "@/lib/posts";
import type { Post, PostStatus } from "@/types/treehouse";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const ms   = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  const hrs  = Math.floor(ms / 3_600_000);
  const days = Math.floor(ms / 86_400_000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  if (days <  7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "rgba(13,31,13,0.4)",
        border: "1px solid rgba(109,188,109,0.06)",
      }}
    >
      <div className="skeleton-shimmer" style={{ width: "100%", paddingBottom: "68%" }} />
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="skeleton-shimmer" style={{ height: 15, width: "62%", borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "38%", borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "82%", borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "65%", borderRadius: 4 }} />
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFeed({ filter }: { filter: string }) {
  const router = useRouter();
  const isFiltered = filter !== "all";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 72, paddingBottom: 40, textAlign: "center" }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: "rgba(13,31,13,0.55)",
        border: "1px solid rgba(109,188,109,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <Compass size={20} style={{ color: "#3a2e18" }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 600, color: "#c8b47e", marginBottom: 10, lineHeight: 1.3 }}>
        {isFiltered ? "Nothing here yet." : "The shelves are quiet."}
      </div>
      <p style={{ fontSize: 13, color: "#3a2e18", lineHeight: 1.65, maxWidth: 230, margin: "0 auto 26px" }}>
        {isFiltered
          ? "Try a different filter or check back soon."
          : "Be the first vendor to share a find in your area."}
      </p>
      {!isFiltered && (
        <button
          onClick={() => router.push("/post")}
          style={{
            padding: "11px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            color: "#f5f0e8", cursor: "pointer", letterSpacing: "0.2px",
            background: "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))",
            border: "1px solid rgba(109,188,109,0.16)",
          }}
        >
          Post a find
        </button>
      )}
    </motion.div>
  );
}

// ─── Feed card ────────────────────────────────────────────────────────────────

function PostCard({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: Math.min(index * 0.05, 0.35), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "rgba(13,31,13,0.55)",
          border: "1px solid rgba(109,188,109,0.09)",
          boxShadow: "0 2px 18px rgba(0,0,0,0.26)",
          position: "relative", isolation: "isolate",
          opacity: isSold ? 0.72 : 1,
          transition: "opacity 0.2s",
        }}>

          {/* ── Image ──────────────────────────────────────────────────── */}
          {hasImg ? (
            <div style={{ position: "relative", width: "100%", paddingBottom: "68%" }}>
              <img
                src={post.image_url!}
                alt={post.title}
                onError={() => setImgErr(true)}
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  filter: isSold
                    ? "brightness(0.58) saturate(0.4) sepia(0.12)"
                    : "brightness(0.82) saturate(0.78) sepia(0.06)",
                }}
              />
              {/* Bottom gradient */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
                background: "linear-gradient(to bottom, transparent, rgba(5,13,5,0.82))",
              }} />

              {/* Status badge */}
              {isSold && (
                <div style={{
                  position: "absolute", top: 10, left: 10,
                  fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
                  padding: "3px 8px", borderRadius: 5,
                  background: "rgba(5,13,5,0.88)", color: "#7a6535",
                  border: "1px solid rgba(122,101,53,0.3)",
                }}>
                  Found a home
                </div>
              )}

              {/* Price badge */}
              {post.price_asking != null && !isSold && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                  padding: "3px 9px", borderRadius: 6,
                  background: "rgba(5,13,5,0.82)", color: "#c8b47e",
                  border: "1px solid rgba(200,180,126,0.18)",
                  backdropFilter: "blur(8px)",
                }}>
                  ${post.price_asking % 1 === 0 ? post.price_asking.toFixed(0) : post.price_asking.toFixed(2)}
                </div>
              )}

              {/* Title over image bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 13px 11px" }}>
                <div style={{
                  fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600,
                  color: "#f5f0e8", lineHeight: 1.25,
                  textShadow: "0 1px 10px rgba(5,13,5,0.85)",
                  marginBottom: 4,
                }}>
                  {post.title}
                </div>
                <VendorMallTag post={post} />
              </div>
            </div>
          ) : (
            /* No-image fallback */
            <div style={{ padding: "16px 14px 12px", minHeight: 100 }}>
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 600,
                color: "#f5f0e8", lineHeight: 1.3, marginBottom: 8,
              }}>
                {post.title}
              </div>
              {post.caption && (
                <p style={{
                  fontSize: 12, color: "#6a5528", lineHeight: 1.6, margin: "0 0 10px",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                } as React.CSSProperties}>
                  {post.caption}
                </p>
              )}
              <VendorMallTag post={post} />
            </div>
          )}

          {/* ── Caption excerpt (below image) ───────────────────────────── */}
          {hasImg && post.caption && (
            <div style={{ padding: "9px 13px 12px" }}>
              <p style={{
                fontSize: 12, color: "#7a6535", lineHeight: 1.62, margin: 0,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              } as React.CSSProperties}>
                {post.caption}
              </p>
            </div>
          )}

          {/* ── Time ago (bottom right) */}
          <div style={{ position: "absolute", bottom: hasImg && post.caption ? 12 : (hasImg ? 11 : 12), right: 13 }}>
            <span style={{ fontSize: 9, color: "#2a2010", fontFamily: "monospace" }}>
              {timeAgo(post.created_at)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function VendorMallTag({ post }: { post: Post }) {
  const vendor = post.vendor;
  const mall   = post.mall;
  if (!vendor && !mall) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <MapPin size={9} style={{ color: "#3a2e18", flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: "#3a2e18", lineHeight: 1 }}>
        {[vendor?.display_name, mall?.name, mall?.city].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type FilterKey = "all" | "available" | "recent";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All finds"  },
  { key: "available", label: "Available"  },
  { key: "recent",    label: "Just in"    },
];

function FilterBar({ active, onChange }: { active: FilterKey; onChange: (k: FilterKey) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 1 }} className="hide-scrollbar">
      {FILTERS.map(f => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 20,
              fontSize: 11, fontWeight: isActive ? 600 : 400, letterSpacing: "0.15px",
              cursor: "pointer", transition: "all 0.18s ease",
              color:       isActive ? "#f5f0e8"                     : "#3a2e18",
              background:  isActive ? "rgba(200,180,126,0.13)"      : "rgba(13,31,13,0.4)",
              border:      isActive ? "1px solid rgba(200,180,126,0.22)" : "1px solid rgba(109,188,109,0.07)",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DiscoveryFeedPage() {
  const router  = useRouter();
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [filter,  setFilter]  = useState<FilterKey>("all");

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(false);
    getFeedPosts(80)
      .then(data  => { if (live) { setPosts(data); setLoading(false); } })
      .catch(()   => { if (live) { setError(true);  setLoading(false); } });
    return () => { live = false; };
  }, []);

  // Client-side filtering
  const filtered: Post[] = posts.filter(p => {
    if (filter === "available") return p.status === "available";
    if (filter === "recent") {
      const ageMs = Date.now() - new Date(p.created_at).getTime();
      return ageMs < 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#050f05", maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* Ambient grain/gradient layer */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        maxWidth: 430, margin: "0 auto",
        pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(200,180,126,0.035) 0%, transparent 58%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 68px, rgba(200,180,126,0.003) 68px, rgba(200,180,126,0.003) 69px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Sticky header ────────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(5,15,5,0.93)",
          backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
          borderBottom: "1px solid rgba(200,180,126,0.055)",
          padding: "0 15px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
            paddingBottom: 11,
          }}>
            {/* Logo + wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Image
                src="/logo.png" alt="Treehouse" width={23} height={23}
                style={{ filter: "drop-shadow(0 0 6px rgba(200,180,126,0.32))" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "#f5f0e8", letterSpacing: "0.2px", lineHeight: 1 }}>
                  Treehouse
                </span>
                <span style={{ fontSize: 7, color: "#3a2e18", textTransform: "uppercase", letterSpacing: "2.5px", lineHeight: 1 }}>
                  Local finds
                </span>
              </div>
            </div>

            {/* Post CTA */}
            <button
              onClick={() => router.push("/post")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 20,
                fontSize: 12, fontWeight: 600, letterSpacing: "0.15px",
                color: "#f5f0e8", cursor: "pointer",
                background: "linear-gradient(175deg, rgba(46,110,46,0.96), rgba(33,82,33,1))",
                border: "1px solid rgba(109,188,109,0.16)",
                boxShadow: "0 2px 12px rgba(5,15,5,0.4)",
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              Post a find
            </button>
          </div>

          {/* Filter bar */}
          <div style={{ paddingBottom: 10 }}>
            <FilterBar active={filter} onChange={setFilter} />
          </div>
        </header>

        {/* ── Feed ─────────────────────────────────────────────────────── */}
        <main style={{
          padding: "12px 13px",
          paddingBottom: "max(80px, env(safe-area-inset-bottom, 80px))",
        }}>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 0.07} />)}
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: "#2a2010", fontSize: 13 }}>
              Couldn't load finds. Check your connection and try again.
            </div>
          ) : filtered.length === 0 ? (
            <EmptyFeed filter={filter} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <AnimatePresence>
                {filtered.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            rgba(13,31,13,0.4) 25%,
            rgba(20,46,20,0.52) 50%,
            rgba(13,31,13,0.4) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
}
