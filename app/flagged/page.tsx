// app/flagged/page.tsx
// My Finds — saved items grouped by booth, displayed as a trip itinerary timeline.
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

export const dynamic = "force-dynamic";

// ─── Bookmark helpers (raw localStorage per RULES) ───────────────────────────

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

// ─── Grouping + sorting ───────────────────────────────────────────────────────

type BoothGroup = {
  label: string;
  vendorName: string;
  vendorSlug?: string;
  posts: Post[];
  allFound: boolean;
};

function groupByBooth(posts: Post[]): BoothGroup[] {
  const map = new Map<string, { label: string; vendorName: string; vendorSlug?: string; posts: Post[] }>();

  for (const post of posts) {
    const booth      = post.vendor?.booth_number ?? post.location_label ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    const vendorSlug = post.vendor?.slug;
    const key        = post.vendor?.id ?? `__orphan__${post.id}`;
    if (!map.has(key)) map.set(key, { label: booth ?? "No booth listed", vendorName, vendorSlug, posts: [] });
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

// ─── Stop label ───────────────────────────────────────────────────────────────

function stopLabel(index: number, total: number): string {
  if (total === 1) return "Your only stop";
  if (index === 0) return "First stop";
  if (index === total - 1) return "Last stop";
  return "Next stop";
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFinds() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: colors.surface, border: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22,
      }}>
        <Heart size={22} strokeWidth={1.6} style={{ color: colors.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        No stops planned yet
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
        Tap the heart on any find to add it to your trip, grouped by booth.
      </p>
    </motion.div>
  );
}

// ─── Find card ────────────────────────────────────────────────────────────────

function FindCard({ post, index, onUnsave }: { post: Post; index: number; onUnsave: (id: string) => void }) {
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
          padding: "12px 14px",
          background: colors.surface,
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
          boxShadow: "0 2px 10px rgba(26,24,16,0.06), 0 1px 3px rgba(26,24,16,0.04)",
          opacity: isSold ? 0.62 : 1,
        }}>
          {/* Thumbnail */}
          <div style={{
            width: 62, height: 62, borderRadius: 10, overflow: "hidden",
            flexShrink: 0, background: colors.surfaceDeep,
            border: `1px solid ${colors.border}`,
          }}>
            {hasImg ? (
              <img
                src={post.image_url!}
                alt={post.title}
                onError={() => setImgErr(true)}
                style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  filter: isSold ? "grayscale(0.6) brightness(0.86)" : "none",
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={18} strokeWidth={1.6} style={{ color: colors.textFaint }} />
              </div>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
              color: colors.textPrimary, lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
              marginBottom: 5,
            }}>
              {post.title}
            </div>
            {isSold ? (
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.2px", color: colors.textMuted }}>
                Found a home
              </div>
            ) : post.price_asking != null ? (
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: colors.textMid, letterSpacing: "-0.2px" }}>
                ${post.price_asking.toLocaleString()}
              </div>
            ) : null}
          </div>

          {/* Unsave button */}
          <button
            onClick={handleUnsave}
            aria-label="Remove from My Finds"
            style={{
              flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: colors.greenSolid, border: "none", cursor: "pointer",
              boxShadow: "0 1px 5px rgba(0,0,0,0.18)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Heart size={14} strokeWidth={2.0} style={{ color: "rgba(255,255,255,0.95)", fill: "rgba(255,255,255,0.95)" }} />
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Timeline stop ────────────────────────────────────────────────────────────

function TimelineStop({
  group, stopIndex, totalStops, postStartIndex, isLast, onUnsave,
}: {
  group: BoothGroup;
  stopIndex: number;
  totalStops: number;
  postStartIndex: number;
  isLast: boolean;
  onUnsave: (id: string) => void;
}) {
  const displayBooth = group.label === "No booth listed" ? null : group.label;
  const label = group.allFound ? "All found a home" : stopLabel(stopIndex, totalStops);
  const dotColor = group.allFound ? colors.textFaint : colors.green;
  const lineColor = "rgba(30,77,43,0.18)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
      transition={{ duration: 0.32, delay: Math.min(stopIndex * 0.06, 0.3) }}
      style={{ display: "flex", gap: 0, marginBottom: isLast ? 0 : 0 }}
    >
      {/* ── Timeline spine ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
        {/* Dot */}
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: dotColor,
          border: `2px solid ${group.allFound ? colors.surfaceDeep : colors.green}`,
          boxShadow: group.allFound ? "none" : `0 0 0 3px rgba(30,77,43,0.12)`,
          marginTop: 4, flexShrink: 0, zIndex: 1,
        }} />
        {/* Line down */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 24,
            background: lineColor,
            marginTop: 4,
          }} />
        )}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 10, paddingBottom: isLast ? 0 : 32 }}>
        {/* Stop header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {/* Booth pill */}
          {displayBooth ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: group.allFound
                ? "linear-gradient(105deg, #3a3830 0%, #4a4840 100%)"
                : `linear-gradient(105deg, ${colors.bannerFrom} 0%, ${colors.bannerTo} 100%)`,
              borderRadius: 20, padding: "5px 13px",
              opacity: group.allFound ? 0.6 : 1,
            }}>
              <span style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.6px", color: "rgba(255,255,255,0.55)", lineHeight: 1 }}>
                Booth
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.96)", letterSpacing: "0.3px", lineHeight: 1 }}>
                {displayBooth}
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: colors.textMuted, fontStyle: "italic" }}>
              No booth listed
            </div>
          )}

          {/* Connector line */}
          <div style={{ flex: 1, height: 1, background: lineColor }} />
        </div>

        {/* Vendor name + stop label */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2, marginBottom: 3 }}>
            {group.vendorName}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: colors.textMuted, lineHeight: 1 }}>
            {group.posts.length} {group.posts.length === 1 ? "saved find" : "saved finds"} · {label}
          </div>
        </div>

        {/* Find cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {group.posts.map((post, i) => (
            <FindCard key={post.id} post={post} index={postStartIndex + i} onUnsave={onUnsave} />
          ))}
        </div>

        {/* View Booth button */}
        {group.vendorSlug && (
          <Link href={`/shelf/${group.vendorSlug}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              width: "100%", padding: "11px 0",
              background: colors.greenLight,
              border: `1px solid ${colors.greenBorder}`,
              borderRadius: 12, textAlign: "center",
              fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600,
              color: colors.green, letterSpacing: "-0.1px",
            }}>
              View Booth
            </div>
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ─── End of path ──────────────────────────────────────────────────────────────

function EndOfPath() {
  return (
    <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
      <div style={{ width: 32, flexShrink: 0, display: "flex", justifyContent: "center" }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          border: `2px solid ${colors.textFaint}`,
          background: colors.bg,
        }} />
      </div>
      <div style={{ paddingLeft: 10 }}>
        <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textFaint }}>
          End of path
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyFindsPage() {
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  function syncCount() { setBookmarkCount(loadBookmarkCount()); }

  async function loadPosts() {
    const ids = loadFlaggedIds();
    if (ids.length === 0) { setPosts([]); setLoading(false); return; }
    const data = await getPostsByIds(ids);
    if (data.length < ids.length) {
      pruneStaleBookmarks(ids, data.map(p => p.id));
      setBookmarkCount(loadBookmarkCount());
    }
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { syncCount(); loadPosts(); }, []);

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
  // Only count active (non-allFound) groups as real stops
  const activeStops = groups.filter(g => !g.allFound).length;

  const subtitle = () => {
    if (loading) return "";
    if (posts.length === 0 && bookmarkCount === 0) return "No stops planned";
    if (posts.length === 0 && bookmarkCount > 0) return "Syncing your finds…";
    if (available > 0) return `${activeStops} ${activeStops === 1 ? "stop" : "stops"} to visit · ${posts[0]?.vendor?.mall?.name ?? "Vendor Mall"}`;
    return `${posts.length} ${posts.length === 1 ? "find" : "finds"} · all found a home`;
  };

  let postIndex = 0;

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: colors.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${colors.border}`,
        padding: "0 18px",
      }}>
        <div style={{ paddingTop: "max(18px, env(safe-area-inset-top, 18px))", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
              Find Map
            </span>
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted, lineHeight: 1.4 }}>
            {subtitle()}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ padding: "24px 16px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[78, 64, 72].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 16 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyFinds />
        ) : (
          <AnimatePresence initial={false}>
            {groups.map((group, i) => {
              const start = postIndex;
              postIndex += group.posts.length;
              return (
                <TimelineStop
                  key={group.label + group.vendorName}
                  group={group}
                  stopIndex={i}
                  totalStops={groups.length}
                  postStartIndex={start}
                  isLast={i === groups.length - 1}
                  onUnsave={handleUnsave}
                />
              );
            })}
            <EndOfPath key="end-of-path" />
          </AnimatePresence>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer {
          background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%);
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
}
