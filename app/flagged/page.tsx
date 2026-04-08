// app/flagged/page.tsx
// Flagged finds — all items the user has bookmarked locally.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flag } from "lucide-react";
import { getPostsByIds } from "@/lib/posts";
import { safeStorage } from "@/lib/safeStorage";
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
              marginBottom: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}>
              {post.title}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {post.vendor?.booth_number && (
                <div style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  fontFamily: "monospace",
                  fontSize: 10, fontWeight: 500,
                  color: C.textMid,
                  letterSpacing: "0.3px",
                  flexShrink: 0,
                }}>
                  {post.vendor.booth_number}
                </div>
              )}
              {isSold && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "1.3px",
                  color: C.textMuted,
                }}>
                  Unavailable
                </span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <div style={{ color: C.textFaint, fontSize: 18, flexShrink: 0, paddingRight: 2 }}>›</div>
        </div>
      </Link>
    </motion.div>
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
                {posts.length} {posts.length === 1 ? "find" : "finds"}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── List ── */}
      <main style={{
        padding: "14px 14px",
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {posts.map((post, i) => (
                <FlaggedRow key={post.id} post={post} index={i} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      <BottomNav active="flagged" flaggedCount={posts.length} />
    </div>
  );
}
