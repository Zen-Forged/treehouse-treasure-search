// app/my-shelf/page.tsx
// My Shelf — vendor's curated shelf. 3×3 uniform grid (9 slots).

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Share2, Store, ImagePlus, Plus } from "lucide-react";
import { getVendorPosts } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";

// ─── Design tokens — warmer parchment palette ──────────────────────────────────
const C = {
  bg:          "#f5f2eb",
  surface:     "#edeae1",
  surfaceDeep: "#e4e0d6",
  border:      "rgba(26,24,16,0.09)",
  textPrimary: "#1c1a14",
  textMid:     "#4a4840",
  textMuted:   "#8a8476",
  textFaint:   "#b4ae9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.20)",
  greenSolid:  "rgba(30,77,43,0.90)",
  header:      "rgba(245,242,235,0.96)",
  emptyTile:   "#dedad2",
};

const GAP       = 6;
const GRID_COLS = 3;
const GRID_ROWS = 3;
const TOTAL     = GRID_COLS * GRID_ROWS;

// ─── Image tile ────────────────────────────────────────────────────────────────

function ShelfTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;
  const isSold = post.status === "sold";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden", position: "relative" }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {hasImg ? (
            <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                filter: isSold ? "grayscale(0.55) brightness(0.82)" : "brightness(0.99) saturate(0.96)" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: C.surface, display: "flex", alignItems: "flex-end", padding: "7px 9px" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: C.textMuted, lineHeight: 1.3,
                overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>
                {post.title}
              </div>
            </div>
          )}
          {isSold && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,242,235,0.12)" }}>
              <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.4px",
                color: "rgba(245,242,235,0.92)", background: "rgba(28,26,20,0.50)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 4 }}>
                Unavailable
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Add Find tile ─────────────────────────────────────────────────────────────

function AddFindTile({ index }: { index: number }) {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", height: "100%" }}
    >
      <button onClick={() => router.push("/post")}
        style={{ width: "100%", height: "100%", borderRadius: 10, background: C.emptyTile, border: "none", cursor: "pointer", padding: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
          WebkitTapHighlightColor: "transparent" }}>
        <ImagePlus size={18} strokeWidth={1.4} style={{ color: "rgba(28,26,20,0.22)" }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(28,26,20,0.28)", textTransform: "uppercase", letterSpacing: "1.2px", lineHeight: 1 }}>
          Add
        </span>
      </button>
    </motion.div>
  );
}

// ─── 3×3 Grid ─────────────────────────────────────────────────────────────────

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
        post
          ? <ShelfTile key={post.id}        post={post} index={i} />
          : <AddFindTile key={`empty-${i}`} index={i} />
      )}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div style={{
      flex: 1,
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
      gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
      gap: GAP, padding: `${GAP}px`, minHeight: 0,
    }}>
      {Array(TOTAL).fill(null).map((_, i) => (
        <div key={i} className="skeleton-shimmer" style={{ borderRadius: 10, width: "100%", height: "100%" }} />
      ))}
    </div>
  );
}

// ─── No profile ────────────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <Store size={22} style={{ color: C.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>
        No booth set up yet
      </div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.75, maxWidth: 230, margin: "0 0 28px" }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 24, background: C.green, color: "rgba(255,255,255,0.96)", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.1px", boxShadow: "0 2px 12px rgba(30,77,43,0.25)" }}>
        Post a find
      </Link>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyShelfPage() {
  const router  = useRouter();
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
      <header style={{ flexShrink: 0, background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, padding: "0 18px" }}>
        <div style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))", paddingBottom: 13 }}>

          {/* Page label row — label left, Post a Find button right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "2.2px", fontWeight: 500 }}>
              My Shelf
            </div>
            {/* Post a find button — enabled for testing, will be gated later */}
            <button
              onClick={() => router.push("/post")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                background: C.green,
                border: "none",
                letterSpacing: "0.1px",
                boxShadow: "0 1px 6px rgba(30,77,43,0.28)",
              }}
            >
              <Plus size={11} strokeWidth={2.5} />
              Post a find
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            {/* Vendor identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700, color: C.textPrimary, lineHeight: 1.1, letterSpacing: "-0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.display_name ?? "Your Booth"}
              </div>
            </div>

            {/* Booth pill */}
            {profile?.booth_number && (
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 500 }}>
                  Booth
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.green, lineHeight: 1, padding: "4px 10px 5px", border: `1.5px solid ${C.greenBorder}`, borderRadius: 7, background: C.greenLight, letterSpacing: "0.4px" }}>
                  {profile.booth_number}
                </div>
              </div>
            )}
          </div>

          {/* Count line */}
          {!loading && hasProfile && posts.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: C.textMuted }}>
                {availableCount} available · {posts.length - availableCount} sold
              </div>
              <div style={{ fontSize: 10, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 500 }}>
                {posts.length} / {TOTAL}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Grid ── */}
      {loading ? <SkeletonGrid /> : !hasProfile ? <NoProfile /> : <ShelfGrid posts={posts} />}

      {/* ── Hairline divider only — no mall text watermark ── */}
      {hasProfile && !loading && (
        <div style={{ height: 1, background: C.border, margin: `5px ${GAP + 6}px`, flexShrink: 0 }} />
      )}

      {/* ── Share my shelf ── */}
      <div style={{ flexShrink: 0, padding: "10px 16px", paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) + 76px), 86px)", background: C.header, borderTop: `1px solid ${C.border}` }}>
        <button disabled style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          padding: "14px 20px", borderRadius: 14,
          background: C.greenSolid, border: "none", cursor: "not-allowed", opacity: 0.70,
          boxShadow: "0 2px 12px rgba(30,77,43,0.18)",
        }}>
          <Share2 size={15} style={{ color: "rgba(255,255,255,0.85)" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.94)", letterSpacing: "-0.1px" }}>
            Share my shelf
          </span>
        </button>
      </div>

      <BottomNav active="my-shelf" />

      <style>{`
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
