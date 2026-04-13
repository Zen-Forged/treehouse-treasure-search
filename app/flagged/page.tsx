// app/flagged/page.tsx
// My Finds — all items the user has saved locally.
// No auth required — available to all user types.
// Grouped by vendor/booth, sorted by booth number for in-store navigation.
// Within each group: available items first, Found a home (sold) items last.
// Stale bookmark IDs (posts deleted from Supabase) are auto-cleaned from localStorage.

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { getPostsByIds } from "@/lib/posts";
import { colors } from "@/lib/tokens";
import { BOOKMARK_PREFIX, loadFollowedIds, loadBookmarkCount } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

// ─── Bookmark helpers (local — raw localStorage per RULES) ────────────────────

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

function removeBookmark(postId: string) {
  try { localStorage.removeItem(`${BOOKMARK_PREFIX}${postId}`); } catch {}
}

function pruneStaleBookmarks(savedIds: string[], returnedIds: string[]) {
  const returnedSet = new Set(returnedIds);
  for (const id of savedIds) {
    if (!returnedSet.has(id)) removeBookmark(id);
  }
}

// ─── Grouping + sorting ────────────────────────────────────────────────────────

function groupByBooth(posts: Post[]): Array<{ label: string; vendorName: string; posts: Post[]; allFound: boolean }> {
  const map = new Map<string, { label: string; vendorName: string; posts: Post[] }>();

  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? post.location_label ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const key        = post.vendor?.id ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { label: booth ?? "No booth listed", vendorName, posts: [] });
    map.get(key)!.posts.push(post);
  }

  return Array.from(map.values())
    .map(group => {
      const sorted = [
        ...group.posts.filter(p => p.status !== "sold"),
        ...group.posts.filter(p => p.status === "sold"),
      ];
      const allFound = sorted.every(p => p.status === "sold");
      return { ...group, posts: sorted, allFound };
    })
    .sort((a, b) => {
      if (!a.allFound && b.allFound) return -1;
      if (a.allFound && !b.allFound) return 1;
      const aNo = a.label === "No booth listed";
      const bNo = b.label === "No booth listed";
      if (aNo && !bNo) return 1;
      if (!aNo && bNo) return -1;
      const cmp = a.label.localeCompare(b.label, undefined, { numeric: true });
      return cmp !== 0 ? cmp : a.vendorName.localeCompare(b.vendorName);
    });
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyFinds() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", background: colors.surface, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Heart size={22} strokeWidth={1.6} style={{ color: colors.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        Nothing saved yet
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
        Tap the heart on any find to save it here, grouped by booth for your trip.
      </p>
    </motion.div>
  );
}

// ─── Find row ─────────────────────────────────────────────────────────────────

function FindRow({ post, index, onUnsave }: { post: Post; index: number; onUnsave: (id: string) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  function handleUnsave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    removeBookmark(post.id);
    onUnsave(post.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.25) }}
    >
      <Link href={`/find/${post.id}`} style={{ textDecoration: "none", display: "block" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "13px 14px",
          background: colors.surface, borderRadius: 14,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 10px rgba(26,24,16,0.06), 0 1px 3px rgba(26,24,16,0.04)",
          opacity: isSold ? 0.65 : 1, transition: "opacity 0.2s",
        }}>
          <div style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: colors.surfaceDeep, border: `1px solid ${colors.borderLight}` }}>
            {hasImg ? (
              <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.99) saturate(0.95)" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={18} strokeWidth={1.6} style={{ color: colors.textFaint }} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: colors.textPrimary,
              lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              marginBottom: 4,
            }}>
              {post.title}
            </div>
            {post.price_asking != null && !isSold && (
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: colors.textMid, letterSpacing: "-0.2px" }}>
                ${post.price_asking.toLocaleString()}
              </div>
            )}
            {isSold && (
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.2px", color: colors.textMuted }}>
                Found a home
              </div>
            )}
          </div>

          <button onClick={handleUnsave} aria-label="Remove from My Finds"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: colors.greenSolid, border: "none", cursor: "pointer",
              boxShadow: "0 1px 5px rgba(0,0,0,0.18)",
              WebkitTapHighlightColor: "transparent",
            }}>
            <Heart size={14} strokeWidth={2.0} style={{ color: "rgba(255,255,255,0.95)", fill: "rgba(255,255,255,0.95)" }} />
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Vendor banner ─────────────────────────────────────────────────────────────

function VendorBanner({ label, vendorName, allFound }: { label: string; vendorName: string; allFound: boolean }) {
  const displayBooth = label === "No booth listed" ? null : label;
  return (
    <div style={{
      width: "100%", borderRadius: 14, overflow: "hidden", marginBottom: 10, position: "relative",
      background: allFound
        ? "linear-gradient(105deg, #3a3830 0%, #4a4840 100%)"
        : `linear-gradient(105deg, ${colors.bannerFrom} 0%, ${colors.bannerTo} 100%)`,
      boxShadow: "0 2px 14px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
      opacity: allFound ? 0.72 : 1, transition: "opacity 0.2s",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "200px 200px" }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.96)", letterSpacing: "-0.2px", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {vendorName}
          </div>
          {allFound && (
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.6px", color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1 }}>
              All found a home
            </div>
          )}
        </div>
        {displayBooth && (
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <div style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.8px", color: "rgba(255,255,255,0.50)", lineHeight: 1 }}>Booth</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "0.4px", lineHeight: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 7, padding: "4px 10px 5px" }}>
              {displayBooth}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Booth section ─────────────────────────────────────────────────────────────

function BoothSection({ label, vendorName, posts, allFound, startIndex, onUnsave }: {
  label: string; vendorName: string; posts: Post[]; allFound: boolean; startIndex: number; onUnsave: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <VendorBanner label={label} vendorName={vendorName} allFound={allFound} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts.map((post, i) => (
          <FindRow key={post.id} post={post} index={startIndex + i} onUnsave={onUnsave} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyFindsPage() {
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  function syncCount() {
    setBookmarkCount(loadBookmarkCount());
  }

  async function loadPosts() {
    const ids = loadFlaggedIds();
    if (ids.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const data = await getPostsByIds(ids);
    if (data.length < ids.length) {
      const returnedIds = data.map(p => p.id);
      pruneStaleBookmarks(ids, returnedIds);
      setBookmarkCount(loadBookmarkCount());
    }
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => {
    syncCount();
    loadPosts();
  }, []);

  useEffect(() => {
    function onFocus() { syncCount(); loadPosts(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  function handleUnsave(postId: string) {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setBookmarkCount(prev => Math.max(0, prev - 1));
  }

  const groups    = groupByBooth(posts);
  const available = posts.filter(p => p.status !== "sold").length;
  let rowIndex    = 0;

  const subtitle = () => {
    if (loading) return "";
    if (posts.length === 0 && bookmarkCount === 0) return "Nothing saved yet";
    if (posts.length === 0 && bookmarkCount > 0) return "Syncing your finds…";
    if (available > 0) return `${available} ${available === 1 ? "find" : "finds"} still available · ${groups.length} ${groups.length === 1 ? "booth" : "booths"}`;
    return `${posts.length} ${posts.length === 1 ? "find" : "finds"} · all found a home`;
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: colors.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${colors.border}`, padding: "0 18px",
      }}>
        <div style={{ paddingTop: "max(18px, env(safe-area-inset-top, 18px))", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
              My Finds
            </span>
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted, lineHeight: 1.4 }}>
            {subtitle()}
          </div>
        </div>
      </header>

      {/* ── List ── */}
      <main style={{ padding: "20px 16px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[78, 64, 72].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 16 }} />
            ))}
          </div>
        ) : posts.length === 0 ? <EmptyFinds /> : (
          <AnimatePresence initial={false}>
            {groups.map(group => {
              const start = rowIndex;
              rowIndex += group.posts.length;
              return (
                <BoothSection
                  key={group.label + group.vendorName}
                  label={group.label} vendorName={group.vendorName}
                  posts={group.posts} allFound={group.allFound}
                  startIndex={start} onUnsave={handleUnsave}
                />
              );
            })}
          </AnimatePresence>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
