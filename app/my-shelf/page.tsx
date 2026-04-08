// app/my-shelf/page.tsx
// "My Shelf" — vendor's curated 3×3 grid view. Max 9 items.
// Designed to be shared/screenshotted. Identity-first, image-driven.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Share2, Store } from "lucide-react";
import { getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.10)",
  borderMid:   "rgba(26,26,24,0.16)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.20)",
  header:      "rgba(240,237,230,0.95)",
};

// ─── Tile ─────────────────────────────────────────────────────────────────────

function ShelfTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.045, 0.35),
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          position: "relative",
          aspectRatio: "1 / 1",
          borderRadius: 10,
          overflow: "hidden",
          background: C.surfaceDeep,
          border: `1px solid ${C.border}`,
        }}>
          {hasImg ? (
            <img
              src={post.image_url!}
              alt={post.title}
              onError={() => setImgErr(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: isSold
                  ? "grayscale(0.55) brightness(0.82)"
                  : "brightness(0.97) saturate(0.94)",
                transition: "filter 0.2s",
              }}
            />
          ) : (
            // No-image placeholder — title text only
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "flex-end",
              padding: "8px 9px",
              background: C.surface,
            }}>
              <div style={{
                fontFamily: "Georgia, serif",
                fontSize: 10,
                fontWeight: 600,
                color: C.textMuted,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
              }}>
                {post.title}
              </div>
            </div>
          )}

          {/* Sold overlay */}
          {isSold && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(240,237,230,0.18)",
            }}>
              <div style={{
                fontSize: 7,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.4px",
                color: "rgba(240,237,230,0.9)",
                background: "rgba(26,26,24,0.48)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                padding: "3px 8px",
                borderRadius: 4,
              }}>
                Sold
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Empty tile (placeholder in grid) ─────────────────────────────────────────

function EmptyTile() {
  return (
    <div style={{
      aspectRatio: "1 / 1",
      borderRadius: 10,
      background: "transparent",
      border: `1.5px dashed ${C.border}`,
    }} />
  );
}

// ─── No profile state ──────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
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
        width: 54, height: 54, borderRadius: "50%",
        background: C.surface,
        border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Store size={22} style={{ color: C.textMuted }} />
      </div>
      <div style={{
        fontFamily: "Georgia, serif",
        fontSize: 19, fontWeight: 600,
        color: C.textPrimary,
        marginBottom: 10,
        lineHeight: 1.3,
      }}>
        No booth set up yet
      </div>
      <p style={{
        fontSize: 13, color: C.textMuted,
        lineHeight: 1.7, maxWidth: 230, margin: "0 0 28px",
      }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{
        display: "inline-block",
        padding: "11px 24px",
        borderRadius: 10,
        background: C.green,
        color: "rgba(255,255,255,0.95)",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        letterSpacing: "0.1px",
      }}>
        Post a find
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyShelfPage() {
  const [profile,  setProfile]  = useState<LocalVendorProfile | null>(null);
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (!raw) { setLoading(false); return; }
      const p = JSON.parse(raw) as LocalVendorProfile;
      setProfile(p);

      if (p.vendor_id) {
        getVendorPosts(p.vendor_id, 9).then(data => {
          // Available first, sold second — max 9
          const available = data.filter(x => x.status === "available");
          const sold      = data.filter(x => x.status === "sold");
          setPosts([...available, ...sold].slice(0, 9));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  // Build a 9-slot grid — fill empties with null
  const slots: (Post | null)[] = [
    ...posts,
    ...Array(Math.max(0, 9 - posts.length)).fill(null),
  ];

  const availableCount = posts.filter(p => p.status === "available").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: C.header,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 18px",
      }}>
        <div style={{
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom: 13,
        }}>
          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", marginBottom: 5 }}>
            My Shelf
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}>
            {/* Left — vendor identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {profile?.mall_name && (
                <div style={{
                  fontSize: 10,
                  color: C.textMuted,
                  marginBottom: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {profile.mall_name}
                </div>
              )}
              <div style={{
                fontFamily: "Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: C.textPrimary,
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {profile?.display_name ?? "Your Booth"}
              </div>
            </div>

            {/* Right — booth number box */}
            {profile?.booth_number && (
              <div style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 2,
              }}>
                <div style={{
                  fontFamily: "monospace",
                  fontSize: 18,
                  fontWeight: 700,
                  color: C.green,
                  lineHeight: 1,
                  padding: "5px 12px 6px",
                  border: `1.5px solid ${C.greenBorder}`,
                  borderRadius: 8,
                  background: C.greenLight,
                  letterSpacing: "0.5px",
                }}>
                  {profile.booth_number}
                </div>
                <div style={{
                  fontSize: 8,
                  color: C.textFaint,
                  textTransform: "uppercase",
                  letterSpacing: "1.8px",
                }}>
                  Booth
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main style={{ flex: 1, padding: "18px 14px 0" }}>

        {loading ? (
          // Skeleton grid
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Array(9).fill(null).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ aspectRatio: "1 / 1", borderRadius: 10 }}
              />
            ))}
          </div>

        ) : !profile ? (
          <NoProfile />

        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", paddingTop: 60 }}
          >
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, color: C.textPrimary, marginBottom: 10 }}>
              Your shelf is empty.
            </div>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, marginBottom: 28 }}>
              Post your first find to start filling it in.
            </p>
            <Link href="/post" style={{
              display: "inline-block",
              padding: "11px 24px",
              borderRadius: 10,
              background: C.green,
              color: "rgba(255,255,255,0.95)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}>
              Post a find
            </Link>
          </motion.div>

        ) : (
          <>
            {/* Item count line */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <div style={{
                fontSize: 10,
                color: C.textMuted,
                fontStyle: "italic",
                fontFamily: "Georgia, serif",
              }}>
                {availableCount} available · {posts.length - availableCount} sold
              </div>
              <div style={{
                fontSize: 9,
                color: C.textFaint,
                textTransform: "uppercase",
                letterSpacing: "1.8px",
              }}>
                {posts.length} / 9
              </div>
            </div>

            {/* 3 × 3 grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}>
              {slots.map((post, i) =>
                post
                  ? <ShelfTile key={post.id} post={post} index={i} />
                  : <EmptyTile key={`empty-${i}`} />
              )}
            </div>

            {/* Shelf label under grid */}
            <div style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <div style={{
                fontSize: 8,
                color: C.textFaint,
                textTransform: "uppercase",
                letterSpacing: "2.4px",
                flexShrink: 0,
              }}>
                {profile.mall_name ?? "The Shelf"}
              </div>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
          </>
        )}
      </main>

      {/* ── Share my shelf CTA ── */}
      {!loading && posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          style={{
            padding: "20px 14px",
            paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button
            disabled
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              padding: "14px 20px",
              borderRadius: 14,
              background: C.green,
              border: "none",
              cursor: "not-allowed",
              opacity: 0.72,
            }}
          >
            <Share2 size={15} style={{ color: "rgba(255,255,255,0.85)" }} />
            <span style={{
              fontFamily: "Georgia, serif",
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,255,255,0.92)",
              letterSpacing: "0.1px",
            }}>
              Share my shelf
            </span>
          </button>
          <div style={{
            textAlign: "center",
            marginTop: 7,
            fontSize: 9,
            color: C.textFaint,
            textTransform: "uppercase",
            letterSpacing: "1.6px",
          }}>
            Coming soon
          </div>
        </motion.div>
      )}

      <div style={{ paddingBottom: "max(100px, calc(env(safe-area-inset-bottom, 0px) + 90px))" }} />
      <BottomNav active={null} />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg,
            rgba(220,216,208,0.7) 25%,
            rgba(200,196,188,0.9) 50%,
            rgba(220,216,208,0.7) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
        }
      `}</style>
    </div>
  );
}
