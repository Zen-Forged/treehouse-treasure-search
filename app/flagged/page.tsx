// app/flagged/page.tsx
// Flagged finds — all items the user has bookmarked locally.
// Grouped by booth number with section headers.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, Eye } from "lucide-react";
import { getPostsByIds } from "@/lib/posts";
import BottomNav from "@/components/BottomNav";
import type { Post } from "@/types/treehouse";

const BOOKMARK_PREFIX = "treehouse_bookmark_";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.10)",
  borderLight: "rgba(26,26,24,0.06)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  header:      "rgba(240,237,230,0.94)",
};

// Read all flagged post IDs from localStorage
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

// Group posts by booth — returns ordered array of [boothLabel, posts[]]
function groupByBooth(posts: Post[]): Array<{ label: string; vendorName: string; posts: Post[] }> {
  const map = new Map<string, { label: string; vendorName: string; posts: Post[] }>();

  for (const post of posts) {
    const booth = post.vendor?.booth_number ?? null;
    const vendorName = post.vendor?.display_name ?? "Unknown Vendor";
    // Key by vendor id so two vendors with same booth# don't merge
    const key = post.vendor?.id ?? "__no_vendor__";

    if (!map.has(key)) {
      map.set(key, {
        label: booth ?? "No booth listed",
        vendorName,
        posts: [],
      });
    }
    map.get(key)!.posts.push(post);
  }

  // Sort groups: booths with numbers first (alphabetical), then "No booth listed"
  return Array.from(map.values()).sort((a, b) => {
    const aNum = a.label === "No booth listed";
    const bNum = b.label === "No booth listed";
    if (aNum && !bNum) return 1;
    if (!aNum && bNum) return -1;
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyFlagged() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "80px 32px 0",
        textAlign: "center",
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        background: C.surface,
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Flag size={20} style={{ color: C.textMuted }} />
      </div>
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 19, fontWeight: 600,
        color: C.textPrimary,
        marginBottom: 10,
        lineHeight: 1.3,
      }}>
        No flagged finds yet
      </div>
      <p style={{
        fontSize: 13, color: C.textMuted,
        lineHeight: 1.7, maxWidth: 220, margin: 0,
      }}>
        Flag pieces you want to revisit and they'll show up here.
      </p>
    </motion.div>
  );
}

// ─── Flagged item row ─────────────────────────────────────────────────────────

function FlaggedRow({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.25) }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 14px",
          background: C.surface,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 5px rgba(26,26,24,0.05)",
          opacity: isSold ? 0.68 : 1,
          transition: "opacity 0.2s",
        }}>

          {/* Thumbnail */}
          <div style={{
            width: 62, height: 62,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: C.surfaceDeep,
            border: `1px solid ${C.borderLight}`,
          }}>
            {hasImg ? (
              <img
                src={post.image_url!}
                alt={post.title}
                onError={() => setImgErr(true)}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", display: "block",
                  filter: isSold ? "grayscale(0.5) brightness(0.88)" : "brightness(0.97) saturate(0.92)",
                }}
              />
            ) : (
              <div style={{
                width: "100%", height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Flag size={16} style={{ color: C.textFaint }} />
              </div>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 14, fontWeight: 600,
              color: C.textPrimary,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}>
              {post.title}
            </div>
            {isSold && (
              <div style={{
                marginTop: 5,
                fontSize: 9, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "1.3px",
                color: C.textMuted,
              }}>
                Unavailable
              </div>
            )}
          </div>

          {/* Eye icon */}
          <div style={{ flexShrink: 0, paddingRight: 2, display: "flex", alignItems: "center" }}>
            <Eye size={15} style={{ color: C.textFaint }} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Booth section ────────────────────────────────────────────────────────────

function BoothSection({
  label,
  vendorName,
  posts,
  startIndex,
}: {
  label: string;
  vendorName: string;
  posts: Post[];
  startIndex: number;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginBottom: 10,
        paddingLeft: 2,
      }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: 600,
          color: C.green,
          letterSpacing: "0.5px",
          background: "rgba(30,77,43,0.08)",
          border: "1px solid rgba(30,77,43,0.16)",
          borderRadius: 6,
          padding: "2px 8px",
          flexShrink: 0,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 12,
          color: C.textMuted,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {vendorName}
        </div>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {posts.map((post, i) => (
          <FlaggedRow key={post.id} post={post} index={startIndex + i} />
        ))}
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
    if (ids.length === 0) {
      setLoading(false);
      return;
    }
    getPostsByIds(ids).then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  const groups = groupByBooth(posts);

  // Running index so stagger animation doesn't reset per group
  let rowIndex = 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
    }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.header,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 16px",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom: 12,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: C.greenLight,
            border: `1px solid rgba(30,77,43,0.14)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Flag size={13} style={{ color: C.green, fill: C.green }} />
          </div>
          <div>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 16, fontWeight: 600,
              color: C.textPrimary, lineHeight: 1.1,
            }}>
              Flagged
            </div>
            {!loading && posts.length > 0 && (
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                {posts.length} {posts.length === 1 ? "find" : "finds"} · {groups.length} {groups.length === 1 ? "booth" : "booths"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── List ── */}
      <main style={{
        padding: "16px 14px",
        paddingBottom: "max(100px, calc(env(safe-area-inset-bottom, 0px) + 90px))",
      }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[72, 62, 68].map((h, i) => (
              <div key={i} className="skeleton-shimmer" style={{ height: h, borderRadius: 14 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyFlagged />
        ) : (
          <AnimatePresence>
            {groups.map(group => {
              const start = rowIndex;
              rowIndex += group.posts.length;
              return (
                <BoothSection
                  key={group.label + group.vendorName}
                  label={group.label}
                  vendorName={group.vendorName}
                  posts={group.posts}
                  startIndex={start}
                />
              );
            })}
          </AnimatePresence>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={posts.length} />
    </div>
  );
}
