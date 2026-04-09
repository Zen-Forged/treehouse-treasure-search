// app/my-shelf/page.tsx
// "My Shelf" — vendor's curated shelf view. Max 7 items in alternating layout.
// Row 1: 2/3 wide + 1/3 narrow
// Row 2: three equal thirds
// Row 3: 1/3 narrow + 2/3 wide
// Slots 8 + 9 are always "Add Find" tiles, woven into the grid.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Share2, Store, ImagePlus } from "lucide-react";
import { getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.10)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.20)",
  header:      "rgba(240,237,230,0.95)",
  emptyTile:   "#d8d4cc",
};

const GAP = 4; // px between tiles

// ─── Image tile ───────────────────────────────────────────────────────────────

function ShelfTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.28), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", height: "100%", borderRadius: 9, overflow: "hidden", position: "relative" }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {hasImg ? (
            <img
              src={post.image_url!}
              alt={post.title}
              onError={() => setImgErr(true)}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover", display: "block",
                filter: isSold ? "grayscale(0.55) brightness(0.82)" : "brightness(0.97) saturate(0.94)",
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: C.surface,
              display: "flex", alignItems: "flex-end",
              padding: "8px 10px",
            }}>
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 600,
                color: C.textMuted, lineHeight: 1.3,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
              }}>
                {post.title}
              </div>
            </div>
          )}

          {isSold && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(240,237,230,0.15)",
            }}>
              <div style={{
                fontSize: 8, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "1.4px", color: "rgba(240,237,230,0.9)",
                background: "rgba(26,26,24,0.48)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                padding: "3px 9px", borderRadius: 4,
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

// ─── Add Find tile ────────────────────────────────────────────────────────────

function AddFindTile({ index }: { index: number }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.28), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", height: "100%" }}
    >
      <button
        onClick={() => router.push("/post")}
        style={{
          width: "100%", height: "100%",
          borderRadius: 9,
          background: C.emptyTile,
          border: "none", cursor: "pointer", padding: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 6,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ImagePlus size={20} strokeWidth={1.5} style={{ color: "rgba(26,26,24,0.28)" }} />
        <span style={{
          fontSize: 9, fontWeight: 600,
          color: "rgba(26,26,24,0.35)",
          textTransform: "uppercase", letterSpacing: "1.2px", lineHeight: 1,
        }}>
          Add Find
        </span>
      </button>
    </motion.div>
  );
}

// ─── Renders a slot — either a real post or Add Find ─────────────────────────

function Slot({ slot, index }: { slot: Post | null; index: number }) {
  if (slot) return <ShelfTile post={slot} index={index} />;
  return <AddFindTile index={index} />;
}

// ─── The 3-row alternating grid ───────────────────────────────────────────────
// Layout:
//   Row 1 — [0] 2fr  |  [1] 1fr
//   Row 2 — [2] 1fr  |  [3] 1fr  |  [4] 1fr
//   Row 3 — [5] 1fr  |  [6] 2fr
// Slots [7] and [8] don't render — only 7 image positions.

function ShelfGrid({ slots }: { slots: (Post | null)[] }) {
  // Pad to at least 7
  const s = [...slots, ...Array(Math.max(0, 7 - slots.length)).fill(null)].slice(0, 7);

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: GAP,
    flex: 1,
    minHeight: 0,
  };

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: GAP,
      padding: `0 ${GAP}px`,
      minHeight: 0,
    }}>
      {/* Row 1 — 2fr + 1fr */}
      <div style={rowStyle}>
        <div style={{ flex: 2, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[0]} index={0} />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[1]} index={1} />
        </div>
      </div>

      {/* Row 2 — 1fr + 1fr + 1fr */}
      <div style={rowStyle}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[2]} index={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[3]} index={3} />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[4]} index={4} />
        </div>
      </div>

      {/* Row 3 — 1fr + 2fr */}
      <div style={rowStyle}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[5]} index={5} />
        </div>
        <div style={{ flex: 2, minWidth: 0, minHeight: 0 }}>
          <Slot slot={s[6]} index={6} />
        </div>
      </div>
    </div>
  );
}

// ─── No profile state ─────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 32px",
        textAlign: "center",
      }}
    >
      <div style={{
        width: 54, height: 54, borderRadius: "50%",
        background: C.surface, border: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Store size={22} style={{ color: C.textMuted }} />
      </div>
      <div style={{
        fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 600,
        color: C.textPrimary, marginBottom: 10, lineHeight: 1.3,
      }}>
        No booth set up yet
      </div>
      <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, maxWidth: 230, margin: "0 0 28px" }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{
        display: "inline-block", padding: "11px 24px", borderRadius: 10,
        background: C.green, color: "rgba(255,255,255,0.95)",
        fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.1px",
      }}>
        Post a find
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyShelfPage() {
  const [profile, setProfile] = useState<LocalVendorProfile | null>(null);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (!raw) { setLoading(false); return; }
      const p = JSON.parse(raw) as LocalVendorProfile;
      setProfile(p);
      if (p.vendor_id) {
        getVendorPosts(p.vendor_id, 7).then(data => {
          const available = data.filter(x => x.status === "available");
          const sold      = data.filter(x => x.status === "sold");
          setPosts([...available, ...sold].slice(0, 7));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  // Build 7 slots — pad empties with null
  const slots: (Post | null)[] = [
    ...posts,
    ...Array(Math.max(0, 7 - posts.length)).fill(null),
  ];

  const availableCount = posts.filter(p => p.status === "available").length;
  const hasProfile = !!profile;

  return (
    <div style={{
      height: "100dvh",           // fill exactly one screen
      background: C.bg,
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",         // nothing scrolls — everything fits
    }}>

      {/* ── Header ── */}
      <header style={{
        flexShrink: 0,
        background: C.header,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 16px",
      }}>
        <div style={{
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          paddingBottom: 11,
        }}>
          <div style={{
            fontSize: 8, color: C.textFaint,
            textTransform: "uppercase", letterSpacing: "2.2px", marginBottom: 4,
          }}>
            My Shelf
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>

            {/* Left — mall + vendor name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {profile?.mall_name && (
                <div style={{
                  fontSize: 9, color: C.textMuted, marginBottom: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {profile.mall_name}
                </div>
              )}
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700,
                color: C.textPrimary, lineHeight: 1.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {profile?.display_name ?? "Your Booth"}
              </div>
            </div>

            {/* Right — Booth label above, number box below */}
            {profile?.booth_number && (
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <div style={{
                  fontSize: 8, color: C.textFaint,
                  textTransform: "uppercase", letterSpacing: "1.8px",
                }}>
                  Booth
                </div>
                <div style={{
                  fontFamily: "monospace", fontSize: 17, fontWeight: 700,
                  color: C.green, lineHeight: 1,
                  padding: "4px 11px 5px",
                  border: `1.5px solid ${C.greenBorder}`,
                  borderRadius: 8, background: C.greenLight,
                  letterSpacing: "0.5px",
                }}>
                  {profile.booth_number}
                </div>
              </div>
            )}
          </div>

          {/* Count line — only when loaded and has posts */}
          {!loading && hasProfile && posts.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginTop: 8,
            }}>
              <div style={{ fontSize: 9, color: C.textMuted, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                {availableCount} available · {posts.length - availableCount} sold
              </div>
              <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.6px" }}>
                {posts.length} / 7
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Grid area ── */}
      {loading ? (
        // Skeleton — 3 rows same proportions
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: GAP, padding: `${GAP}px ${GAP}px`, minHeight: 0 }}>
          {[
            [2, 1],
            [1, 1, 1],
            [1, 2],
          ].map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: GAP, flex: 1 }}>
              {row.map((fr, ci) => (
                <div
                  key={ci}
                  className="skeleton-shimmer"
                  style={{ flex: fr, borderRadius: 9, minWidth: 0 }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : !hasProfile ? (
        <NoProfile />
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, paddingTop: GAP }}>
          <ShelfGrid slots={slots} />

          {/* Shelf rule */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: `6px ${GAP + 2}px 4px`,
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <div style={{ fontSize: 7, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", flexShrink: 0 }}>
              {profile?.mall_name ?? "The Shelf"}
            </div>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>
        </div>
      )}

      {/* ── Share my shelf ── */}
      <div style={{
        flexShrink: 0,
        padding: `8px 14px`,
        paddingBottom: `max(calc(env(safe-area-inset-bottom, 0px) + 74px), 82px)`,
        background: C.header,
        borderTop: `1px solid ${C.border}`,
      }}>
        <button
          disabled
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            padding: "13px 20px", borderRadius: 13,
            background: C.green, border: "none",
            cursor: "not-allowed", opacity: 0.72,
          }}
        >
          <Share2 size={14} style={{ color: "rgba(255,255,255,0.85)" }} />
          <span style={{
            fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600,
            color: "rgba(255,255,255,0.92)", letterSpacing: "0.1px",
          }}>
            Share my shelf
          </span>
        </button>
        <div style={{
          textAlign: "center", marginTop: 5,
          fontSize: 8, color: C.textFaint,
          textTransform: "uppercase", letterSpacing: "1.6px",
        }}>
          Coming soon
        </div>
      </div>

      <BottomNav active="my-shelf" />

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
