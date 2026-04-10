// app/my-shelf/page.tsx
// My Shelf — vendor's full shelf, scrollable.
// Available posts first (3-col grid), Found posts below (3-col grid, labeled separately).
// VendorBanner in header with vendor picker when multiple vendors exist at the mall.
// Found tiles link to find detail — vendor can view sold items and re-mark as available.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, ImagePlus, Plus, ChevronDown } from "lucide-react";
import { getVendorPosts, getVendorsByMall } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";

// ─── Design tokens ─────────────────────────────────────────────────────────────
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
  bannerFrom:  "#1e3d24",
  bannerTo:    "#2d5435",
};

const GAP       = 6;
const GRID_COLS = 3;

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.8px",
      color: C.textFaint, margin: `${GAP * 2}px ${GAP}px ${GAP}px`,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── Available tile ────────────────────────────────────────────────────────────

function AvailableTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative" }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {hasImg ? (
          <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              filter: "brightness(0.99) saturate(0.96)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.surface, display: "flex", alignItems: "flex-end", padding: "7px 9px" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: C.textMuted, lineHeight: 1.3,
              overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const }}>
              {post.title}
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}

// ─── Found tile — linked to detail, grayscale + centered badge ────────────────

function FoundTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!post.image_url && !imgErr;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative", opacity: 0.62 }}
    >
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {hasImg ? (
          <img src={post.image_url!} alt={post.title} onError={() => setImgErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              filter: "grayscale(0.55) brightness(0.82)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.surface, display: "flex", alignItems: "flex-end", padding: "7px 9px" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: C.textMuted, lineHeight: 1.3 }}>
              {post.title}
            </div>
          </div>
        )}
      </Link>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", pointerEvents: "none",
        fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px",
        padding: "3px 8px", borderRadius: 5,
        background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)",
        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
        whiteSpace: "nowrap",
      }}>
        Found
      </div>
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
      style={{ width: "100%", aspectRatio: "1" }}
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

// ─── 3-col grid wrapper ────────────────────────────────────────────────────────

function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
      gap: GAP,
      padding: `0 ${GAP}px`,
    }}>
      {children}
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div style={{ padding: GAP }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GAP }}>
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="skeleton-shimmer" style={{ borderRadius: 10, width: "100%", aspectRatio: "1" }} />
        ))}
      </div>
    </div>
  );
}

// ─── No profile ────────────────────────────────────────────────────────────────

function NoProfile() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px 0", textAlign: "center" }}>
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

// ─── Vendor picker ─────────────────────────────────────────────────────────────
// Shown only when the mall has more than one vendor.

function VendorPicker({ vendors, activeId, onChange }: {
  vendors: Vendor[];
  activeId: string;
  onChange: (v: Vendor) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = vendors.find(v => v.id === activeId) ?? vendors[0];

  if (vendors.length <= 1) return null;

  return (
    <div style={{ position: "relative", marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px 6px 12px", borderRadius: 20,
          background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)",
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
          {active.display_name}{active.booth_number ? ` · ${active.booth_number}` : ""}
        </span>
        <ChevronDown size={11} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
              background: "#fff", borderRadius: 12, overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 5px rgba(0,0,0,0.10)",
              border: `1px solid ${C.border}`, minWidth: 200, maxWidth: 280,
            }}
          >
            {vendors.map((v, i) => (
              <button
                key={v.id}
                onClick={() => { onChange(v); setOpen(false); }}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: v.id === activeId ? C.greenLight : "none",
                  border: "none", borderBottom: i < vendors.length - 1 ? `1px solid ${C.border}` : "none",
                  cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.2 }}>
                  {v.display_name}
                </div>
                {v.booth_number && (
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
                    Booth {v.booth_number}
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyShelfPage() {
  const router = useRouter();

  const [profile,      setProfile]      = useState<LocalVendorProfile | null>(null);
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [vendors,      setVendors]      = useState<Vendor[]>([]);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (!raw) { setLoading(false); return; }
      const p = JSON.parse(raw) as LocalVendorProfile;
      setProfile(p);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!profile?.mall_id) return;
    getVendorsByMall(profile.mall_id).then(vs => {
      setVendors(vs);
      const own = vs.find(v => v.id === profile.vendor_id) ?? vs[0] ?? null;
      setActiveVendor(own);
    });
  }, [profile?.mall_id, profile?.vendor_id]);

  useEffect(() => {
    if (!activeVendor) {
      if (profile && !profile.vendor_id) setLoading(false);
      return;
    }
    setLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => {
      setPosts(data);
      setLoading(false);
    });
  }, [activeVendor?.id]);

  const available      = posts.filter(p => p.status === "available");
  const found          = posts.filter(p => p.status === "sold");
  const availableCount = available.length;
  const foundCount     = found.length;
  const hasProfile     = !!profile;
  const displayName    = activeVendor?.display_name ?? profile?.display_name ?? "";
  const boothNumber    = activeVendor?.booth_number  ?? profile?.booth_number  ?? null;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <header style={{
        flexShrink: 0,
        background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 16px",
      }}>
        <div style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))", paddingBottom: 12 }}>

          {/* Top row: logo + wordmark left / Post a find right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
                My Shelf
              </span>
            </div>
            <button
              onClick={() => router.push("/post")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 20,
                fontSize: 11, fontWeight: 600, color: "#fff",
                cursor: "pointer", background: C.green, border: "none",
                letterSpacing: "0.1px", boxShadow: "0 1px 6px rgba(30,77,43,0.28)",
              }}
            >
              <Plus size={11} strokeWidth={2.5} />
              Post a find
            </button>
          </div>

          {/* VendorBanner */}
          {hasProfile && (
            <div style={{
              borderRadius: 12, overflow: "visible", position: "relative",
              background: `linear-gradient(105deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
            }}>
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.04, borderRadius: 12,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat", backgroundSize: "200px 200px",
              }} />
              <div style={{
                position: "relative", zIndex: 1,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 14px", gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700,
                    color: "rgba(255,255,255,0.96)", letterSpacing: "-0.2px", lineHeight: 1.2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {displayName}
                  </div>
                  {vendors.length > 1 && activeVendor && (
                    <VendorPicker
                      vendors={vendors}
                      activeId={activeVendor.id}
                      onChange={v => { setActiveVendor(v); setPosts([]); setLoading(true); }}
                    />
                  )}
                </div>
                {boothNumber && (
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <div style={{ fontSize: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.8px", color: "rgba(255,255,255,0.50)", lineHeight: 1 }}>
                      Booth
                    </div>
                    <div style={{
                      fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)",
                      letterSpacing: "0.4px", lineHeight: 1,
                      background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)",
                      borderRadius: 7, padding: "4px 10px 5px",
                    }}>
                      {boothNumber}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Count line */}
          {!loading && hasProfile && posts.length > 0 && (
            <div style={{ marginTop: 7 }}>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: C.textFaint }}>
                {availableCount} available · {foundCount} found
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Content — scrollable ── */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : !hasProfile ? (
          <NoProfile />
        ) : (
          <>
            {available.length > 0 && (
              <>
                <SectionLabel>Available</SectionLabel>
                <ThreeColGrid>
                  {available.map((post, i) => <AvailableTile key={post.id} post={post} index={i} />)}
                  <AddFindTile index={available.length} />
                </ThreeColGrid>
              </>
            )}

            {posts.length === 0 && (
              <>
                <SectionLabel>Available</SectionLabel>
                <ThreeColGrid>
                  <AddFindTile index={0} />
                </ThreeColGrid>
              </>
            )}

            {found.length > 0 && (
              <>
                <SectionLabel>Found</SectionLabel>
                <ThreeColGrid>
                  {found.map((post, i) => <FoundTile key={post.id} post={post} index={i} />)}
                </ThreeColGrid>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav active="my-shelf" />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
