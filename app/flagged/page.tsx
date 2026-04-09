// app/flagged/page.tsx
// Visit List — all items the user has bookmarked locally.
// Grouped by booth. URL stays /flagged; label is "Your Visit List" throughout.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Share2, ChevronRight } from "lucide-react";
import { getPostsByIds } from "@/lib/posts";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

const BOOKMARK_PREFIX = "treehouse_bookmark_";

// ─── Design tokens — warmer parchment palette ──────────────────────────────────
const C = {
  bg:          "#f5f2eb",
  surface:     "#edeae1",
  surfaceDeep: "#e4e0d6",
  border:      "rgba(26,24,16,0.09)",
  borderLight: "rgba(26,24,16,0.05)",
  textPrimary: "#1c1a14",
  textMid:     "#4a4840",
  textMuted:   "#8a8476",
  textFaint:   "#b4ae9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenSolid:  "rgba(30,77,43,0.90)",
  greenBorder: "rgba(30,77,43,0.20)",
  header:      "rgba(245,242,235,0.96)",
};

function loadFlaggedIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(BOOKMARK_PREFIX) && localStorage.getItem(key) === "1") {
        ids.push(key.slice(BOOKMARK_PREFIX.length));
      }
    }
  } catch {}
  return ids;
}

function groupByBooth(posts: Post[]): Array<{ label: string; vendorName: string; posts: Post[] }> {
  const map = new Map<string, { label: string; vendorName: string; posts: Post[] }>();
  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const key        = post.vendor?.id ?? "__no_vendor__";
    if (!map.has(key)) map.set(key, { label: booth ?? "No booth listed", vendorName, posts: [] });
    map.get(key)!.posts.push(post);
  }
  return Array.from(map.values()).sort((a, b) => {
    const aF = a.label === "No booth listed", bF = b.label === "No booth listed";
    if (aF && !bF) return 1; if (!aF && bF) return -1;
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyVisitList() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Bookmark size={20} style={{ color: C.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        Your visit list is empty
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
        Save finds you want to see in person and they'll appear here, grouped by booth.
      </p>
    </motion.div>
  );
}

// ─── Visit List item row ───────────────────────────────────────────────────────

function VisitRow({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.25) }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 14px",
          background: C.surface,
          borderRadius: 16,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 10px rgba(26,24,16,0.06), 0 1px 3px rgba(26,24,16,0.04)",
          opacity: isSold ? 0.65 : 1,
          transition: "opacity 0.2s",
        }}>
          {/* Thumbnail */}
          <div style={{ width: 64, height: 64, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: C.surfaceDeep, border: `1px solid ${C.borderLight}` }}>
            {hasImg ? (
              <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.99) saturate(0.95)" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bookmark size={16} style={{ color: C.textFaint }} />
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 14,
              fontWeight: 600,
              color: C.textPrimary,
              lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              marginBottom: 4,
            }}>
              {post.title}
            </div>
            {post.price_asking != null && !isSold && (
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.textMid, letterSpacing: "-0.2px" }}>
                ${post.price_asking.toLocaleString()}
              </div>
            )}
            {isSold && (
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.2px", color: C.textMuted }}>
                Unavailable
              </div>
            )}
          </div>

          {/* Chevron */}
          <ChevronRight size={16} style={{ color: C.textFaint, flexShrink: 0 }} />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Booth section ─────────────────────────────────────────────────────────────

function BoothSection({ label, vendorName, posts, startIndex }: { label: string; vendorName: string; posts: Post[]; startIndex: number }) {
  const displayLabel = label === "No booth listed" ? label : `Booth ${label}`;
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingLeft: 2 }}>
        <div style={{
          fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.green,
          letterSpacing: "0.5px", background: C.greenLight,
          border: `1px solid ${C.greenBorder}`, borderRadius: 7,
          padding: "3px 9px", flexShrink: 0,
        }}>
          {displayLabel}
        </div>
        <div style={{
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: 13, color: C.textMuted,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {vendorName}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {posts.map((post, i) => <VisitRow key={post.id} post={post} index={startIndex + i} />)}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlaggedPage() {
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = loadFlaggedIds();
    if (ids.length === 0) { setLoading(false); return; }
    getPostsByIds(ids).then(data => { setPosts(data); setLoading(false); });
  }, []);

  const groups = groupByBooth(posts);
  let rowIndex = 0;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.header,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 18px",
      }}>
        <div style={{ paddingTop: "max(18px, env(safe-area-inset-top, 18px))", paddingBottom: 14 }}>
          {/* Page title — larger, Georgia, editorial weight */}
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, lineHeight: 1.15, letterSpacing: "-0.3px" }}>
            Your Visit List
          </div>
          {/* Subtitle — italic Georgia, human and warm */}
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted, marginTop: 4, lineHeight: 1.4 }}>
            {!loading && posts.length > 0
              ? `${posts.length} ${posts.length === 1 ? "find" : "finds"} waiting for you`
              : !loading && posts.length === 0
              ? "Nothing saved yet"
              : ""}
          </div>
        </div>
      </header>

      {/* ── List ── */}
      <main style={{ padding: "20px 16px 0", paddingBottom: "max(150px, calc(env(safe-area-inset-bottom, 0px) + 140px))" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[78, 64, 72].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 16 }} />
            ))}
          </div>
        ) : posts.length === 0 ? <EmptyVisitList /> : (
          <AnimatePresence>
            {groups.map(group => {
              const start = rowIndex;
              rowIndex += group.posts.length;
              return (
                <BoothSection key={group.label + group.vendorName}
                  label={group.label} vendorName={group.vendorName}
                  posts={group.posts} startIndex={start} />
              );
            })}
          </AnimatePresence>
        )}
      </main>

      {/* ── Share your Shelf CTA — fixed above BottomNav ── */}
      <div style={{
        position: "fixed",
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, zIndex: 90,
        background: C.header,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${C.border}`,
        padding: "12px 18px",
        paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 74px), 82px)",
      }}>
        <button disabled style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          padding: "15px 20px",
          borderRadius: 14,
          background: C.greenSolid,
          border: "none", cursor: "not-allowed", opacity: 0.70,
          boxShadow: "0 2px 12px rgba(30,77,43,0.20)",
        }}>
          <Share2 size={15} style={{ color: "rgba(255,255,255,0.85)" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.1px" }}>
            Share your Shelf
          </span>
        </button>
      </div>

      <BottomNav active="flagged" flaggedCount={posts.length} />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
