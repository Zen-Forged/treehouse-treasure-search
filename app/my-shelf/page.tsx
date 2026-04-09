// app/my-shelf/page.tsx
// My Shelf — vendor's curated shelf view.
// 3×3 uniform grid (9 slots). Empty slots are greyed with an Add Find affordance.

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
  greenSolid:  "rgba(30,77,43,0.92)",
  header:      "rgba(240,237,230,0.95)",
  emptyTile:   "#d8d4cc",
};

const GAP       = 5;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const TOTAL     = GRID_COLS * GRID_ROWS; // 9

// ─── Image tile ────────────────────────────────────────────────────────────────

function ShelfTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
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
            <div style={{ width: "100%", height: "100%", background: C.surface, display: "flex", alignItems: "flex-end", padding: "6px 8px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: C.textMuted, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>
                {post.title}
              </div>
            </div>
          )}
          {isSold && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(240,237,230,0.15)" }}>
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.4px", color: "rgba(240,237,230,0.9)", background: "rgba(26,26,24,0.48)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 4 }}>
                Unavailable
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Empty / Add Find tile ─────────────────────────────────────────────────────

function AddFindTile({ index }: { index: number }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
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
          alignItems: "center", justifyContent: "center", gap: 5,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <ImagePlus size={18} strokeWidth={1.5} style={{ color: "rgba(26,26,24,0.25)" }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(26,26,24,0.30)", textTransform: "uppercase", letterSpacing: "1px", lineHeight: 1 }}>
          Add
        </span>
      </button>
    </motion.div>
  );
}

// ─── 3×3 uniform grid ─────────────────────────────────────────────────────────

function ShelfGrid({ posts }: { posts: Post[] }) {
  const slots: (Post | null)[] = [
    ...posts.slice(0, TOTAL),
    ...Array(Math.max(0, TOTAL - posts.length)).fill(null),
  ];

  return (
    <div style={{
      flex: 1,
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
      gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
      gap: GAP,
      padding: `${GAP}px`,
      minHeight: 0,
    }}>
      {slots.map((post, i) =>
        post ? (
          <ShelfTile key={post.id} post={post} index={i} />
        ) : (
          <AddFindTile key={`empty-${i}`} index={i} />
        )
      )}
    </div>
  );
}

// ─── Skeleton grid ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div style={{
      flex: 1,
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
      gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
      gap: GAP,
      padding: `${GAP}px`,
      minHeight: 0,
    }}>
      {Array(TOTAL).fill(null).map((_, i) => (
        <div key={i} className="skeleton-shimmer" style={{ borderRadius: 9, width: "100%", height: "100%" }} />
      ))}
    </div>
  );
}

// ─── No profile state ──────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}
    >
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Store size={22} style={{ color: C.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 600, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        No booth set up yet
      </div>
      <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.7, maxWidth: 230, margin: "0 0 28px" }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{ display: "inline-block", padding: "11px 24px", borderRadius: 10, background: C.green, color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.1px" }}>
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
        getVendorPosts(p.vendor_id, TOTAL).then(data => {
          // Available first, then sold — fill up to 9
          const available = data.filter(x => x.status === "available");
          const sold      = data.filter(x => x.status === "sold");
          setPosts([...available, ...sold].slice(0, TOTAL));
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } catch { setLoading(false); }
  }, []);

  const availableCount = posts.filter(p => p.status === "available").length;
  const hasProfile     = !!profile;

  return (
    <div style={{ height: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, background: C.header, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}`, padding: "0 16px" }}>
        <div style={{ paddingTop: "max(14px, env(safe-area-inset-top, 14px))", paddingBottom: 11 }}>

          {/* Page label */}
          <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", marginBottom: 5 }}>
            My Shelf
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            {/* Left — vendor name dominant */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {profile?.mall_name && (
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.mall_name}
                </div>
              )}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.display_name ?? "Your Booth"}
              </div>
            </div>

            {/* Right — Booth pill */}
            {profile?.booth_number && (
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.6px" }}>
                  Booth
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.green, lineHeight: 1, padding: "3px 9px 4px", border: `1.5px solid ${C.greenBorder}`, borderRadius: 6, background: C.greenLight, letterSpacing: "0.5px" }}>
                  {profile.booth_number}
                </div>
              </div>
            )}
          </div>

          {/* Count line */}
          {!loading && hasProfile && posts.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontStyle: "italic", fontFamily: "Georgia, serif" }}>
                {availableCount} available · {posts.length - availableCount} sold
              </div>
              <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.4px" }}>
                {posts.length} / {TOTAL}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Grid area ── */}
      {loading ? (
        <SkeletonGrid />
      ) : !hasProfile ? (
        <NoProfile />
      ) : (
        <ShelfGrid posts={posts} />
      )}

      {/* ── Shelf watermark ── */}
      {hasProfile && !loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: `4px ${GAP + 4}px 4px`, flexShrink: 0 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2px", flexShrink: 0 }}>
            {profile?.mall_name ?? "The Shelf"}
          </div>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
      )}

      {/* ── Share my shelf CTA ── */}
      <div style={{
        flexShrink: 0,
        padding: "8px 14px",
        paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 74px), 82px)",
        background: C.header,
        borderTop: `1px solid ${C.border}`,
      }}>
        <button
          disabled
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            padding: "13px 20px",
            borderRadius: 13,
            background: C.greenSolid,
            border: "none",
            cursor: "not-allowed",
            opacity: 0.72,
          }}
        >
          <Share2 size={14} style={{ color: "rgba(255,255,255,0.85)" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.92)", letterSpacing: "0.1px" }}>
            Share my shelf
          </span>
        </button>
      </div>

      <BottomNav active="my-shelf" />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(220,216,208,0.7) 25%, rgba(200,196,188,0.9) 50%, rgba(220,216,208,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
