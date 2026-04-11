// app/my-shelf/page.tsx
// My Shelf — redesigned to match cinematic vendor profile mockup.
// Hero card with full-bleed vendor identity, Available/Found tab switcher,
// price-labelled tiles, ghost "Left for you to find" tiles, booth finder card,
// and "Explore more shelves" CTA banner.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, ChevronDown, Share2, Check, Plus, ImagePlus } from "lucide-react";
import { PiLeaf } from "react-icons/pi";
import { getVendorPosts, getVendorsByMall, getAllMalls } from "@/lib/posts";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
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
const BASE_URL  = "https://treehouse-treasure-search.vercel.app";

// Deterministic pastel from vendor name — used as hero bg when no image
function vendorHueBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const hues = [142, 168, 195, 220, 25, 340];
  const hue  = hues[h % hues.length];
  return `hsl(${hue}, 22%, 78%)`;
}

// ─── Hero card ─────────────────────────────────────────────────────────────────

function VendorHero({
  displayName, boothNumber, tagline, mallName, mallCity,
  availableCount, totalCount, heroImageUrl, onShare, hasCopied, hasSlug,
}: {
  displayName:    string;
  boothNumber:    string | null;
  tagline?:       string | null;
  mallName?:      string;
  mallCity?:      string;
  availableCount: number;
  totalCount:     number;
  heroImageUrl?:  string | null;
  onShare:        () => void;
  hasCopied:      boolean;
  hasSlug:        boolean;
}) {
  const spotsLeft = Math.max(0, 9 - availableCount);

  return (
    <div style={{ position: "relative", width: "100%", minHeight: 220, overflow: "hidden", borderRadius: "0 0 20px 20px" }}>
      {/* Background */}
      {heroImageUrl ? (
        <img src={heroImageUrl} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
      )}

      {/* Gradient overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(0,0,0,0.08) 0%, rgba(20,40,25,0.72) 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(20,38,22,0.88) 0%, transparent 100%)" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logo.png" alt="Treehouse" width={20} height={20} style={{ opacity: 0.92 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "1.8px", textTransform: "uppercase" }}>
            Treehouse
          </span>
        </div>

        {hasSlug && (
          <AnimatePresence mode="wait">
            {hasCopied ? (
              <motion.div key="copied" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.30)" }}>
                <Check size={11} style={{ color: "rgba(255,255,255,0.9)" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>Copied!</span>
              </motion.div>
            ) : (
              <motion.button key="share" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                onClick={onShare}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                <Share2 size={12} style={{ color: "rgba(255,255,255,0.82)" }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.82)" }}>Share</span>
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* On-shelf badge when no share button */}
      {!hasSlug && totalCount > 0 && (
        <div style={{ position: "absolute", top: "max(16px, env(safe-area-inset-top, 16px))", right: 16, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 72, height: 72, background: C.green, borderRadius: "50%", boxShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1, textAlign: "center" }}>
            {availableCount} of {Math.max(availableCount, 9)}
          </span>
          <span style={{ fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.72)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>on shelf</span>
          {spotsLeft > 0 && <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{spotsLeft} left</span>}
        </div>
      )}

      {/* Bottom content */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 16px 20px", marginTop: 80 }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 6px" }}>
          A curated shelf from
        </p>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 6px", textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
          {displayName}
        </h1>
        {tagline && (
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: "rgba(255,255,255,0.60)", textTransform: "uppercase", letterSpacing: "2px", margin: "0 0 12px" }}>
            {tagline}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {boothNumber && (
            <div style={{ padding: "5px 12px", borderRadius: 20, background: C.green, fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "1.2px", textTransform: "uppercase" }}>
              Booth {boothNumber}
            </div>
          )}
          {mallName && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={10} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0 }} />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                {mallName}{mallCity ? ` · ${mallCity}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* On-shelf badge when share button is in top bar */}
        {hasSlug && totalCount > 0 && (
          <div style={{ position: "absolute", top: 0, right: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 68, height: 68, background: C.green, borderRadius: "50%", boxShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.1, textAlign: "center" }}>
              {availableCount} of {Math.max(availableCount, 9)}
            </span>
            <span style={{ fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.72)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 2 }}>on shelf</span>
            {spotsLeft > 0 && <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>{spotsLeft} left</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab switcher ──────────────────────────────────────────────────────────────

function TabSwitcher({ tab, availableCount, foundCount, onChange }: {
  tab:            "available" | "found";
  availableCount: number;
  foundCount:     number;
  onChange:       (t: "available" | "found") => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "14px 16px 10px", background: C.surface, borderRadius: 22, padding: 3, gap: 2 }}>
      {(["available", "found"] as const).map(t => {
        const active = tab === t;
        const count  = t === "available" ? availableCount : foundCount;
        return (
          <button key={t} onClick={() => onChange(t)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 19, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "background 0.18s, box-shadow 0.18s", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: active ? 700 : 400, color: active ? C.textPrimary : C.textMuted, transition: "color 0.18s" }}>
              {t === "available" ? "Available" : "Found"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.green : C.textFaint }}>({count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Available tile ─────────────────────────────────────────────────────────────

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
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.surface }} />
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
          {post.price_asking != null && (
            <div style={{ fontFamily: "Georgia, serif", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.80)", marginTop: 2 }}>
              ${post.price_asking}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Found tile ─────────────────────────────────────────────────────────────────

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
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(0.55) brightness(0.82)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.surface }} />
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.90)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 5, background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", whiteSpace: "nowrap" }}>
          Found
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Ghost tile ────────────────────────────────────────────────────────────────

function GhostTile({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.35), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, border: `1.5px dashed ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}
    >
      <PiLeaf size={18} style={{ color: "rgba(28,26,20,0.18)" }} />
      <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 10, color: C.textFaint, textAlign: "center", lineHeight: 1.4, padding: "0 8px" }}>
        Left for you<br />to find
      </span>
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
        style={{ width: "100%", height: "100%", borderRadius: 10, background: C.emptyTile, border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, WebkitTapHighlightColor: "transparent" }}>
        <ImagePlus size={18} strokeWidth={1.4} style={{ color: "rgba(28,26,20,0.22)" }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(28,26,20,0.28)", textTransform: "uppercase", letterSpacing: "1.2px", lineHeight: 1 }}>Add</span>
      </button>
    </motion.div>
  );
}

// ─── 3-col grid ────────────────────────────────────────────────────────────────

function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GAP, padding: `0 ${GAP}px` }}>
      {children}
    </div>
  );
}

// ─── Booth finder card ─────────────────────────────────────────────────────────

function BoothFinderCard({ boothNumber, displayName, mallName, mallCity, mallImageUrl }: {
  boothNumber:   string | null;
  displayName:   string;
  mallName:      string;
  mallCity?:     string;
  mallImageUrl?: string | null;
}) {
  return (
    <div style={{ margin: "24px 10px 0", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", display: "flex", alignItems: "stretch" }}>
      <div style={{ width: 100, flexShrink: 0, background: C.surfaceDeep, overflow: "hidden" }}>
        {mallImageUrl ? (
          <img src={mallImageUrl} alt={mallName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${C.bannerFrom}, ${C.bannerTo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={22} style={{ color: "rgba(255,255,255,0.40)" }} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <MapPin size={11} style={{ color: C.textMuted, flexShrink: 0 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
            Find this booth in person
          </span>
        </div>
        <p style={{ margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMid, lineHeight: 1.4 }}>
          {displayName}{boothNumber ? ` · Booth ${boothNumber}` : ""}
        </p>
        <p style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>
          {mallName}{mallCity ? `, ${mallCity}` : ""}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: C.greenLight, border: `1px solid ${C.greenBorder}`, alignSelf: "flex-start" }}>
          <PiLeaf size={10} style={{ color: C.green }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: "uppercase", letterSpacing: "1.2px" }}>
            Real places. Real finds.
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingRight: 14, flexShrink: 0 }}>
        <ChevronRight size={16} style={{ color: C.textFaint }} />
      </div>
    </div>
  );
}

// ─── Explore CTA banner ────────────────────────────────────────────────────────

function ExploreBanner() {
  const router = useRouter();
  return (
    <div style={{ margin: "16px 10px 0", borderRadius: 16, overflow: "hidden", background: `linear-gradient(110deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`, padding: "20px 18px", position: "relative" }}>
      <p style={{ margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.50)", letterSpacing: "2px", textTransform: "uppercase" }}>
        There&apos;s more to discover
      </p>
      <h2 style={{ margin: "0 0 6px", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
        Explore more shelves nearby
      </h2>
      <p style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
        From local booths. Across Kentucky.
      </p>
      <button onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 24, background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.bannerFrom, WebkitTapHighlightColor: "transparent" }}>
        Enter the Treehouse
        <ChevronRight size={14} style={{ color: C.bannerFrom }} />
      </button>
      <p style={{ margin: "12px 0 0", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.30)", letterSpacing: "2px", textTransform: "uppercase" }}>
        Antiques · Vintage · Stories · All in one place
      </p>
    </div>
  );
}

// ─── Vendor picker ─────────────────────────────────────────────────────────────

function VendorPicker({ vendors, activeId, onChange }: {
  vendors:  Vendor[];
  activeId: string;
  onChange: (v: Vendor) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = vendors.find(v => v.id === activeId) ?? vendors[0];
  if (vendors.length <= 1) return null;

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 12, fontWeight: 600, color: C.textPrimary, whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
          {active.display_name}{active.booth_number ? ` · Booth ${active.booth_number}` : ""}
        </span>
        <ChevronDown size={11} style={{ color: C.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }}
            style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", border: `1px solid ${C.border}`, minWidth: 200, maxWidth: 280 }}>
            {vendors.map((v, i) => (
              <button key={v.id} onClick={() => { onChange(v); setOpen(false); }}
                style={{ width: "100%", padding: "11px 14px", background: v.id === activeId ? C.greenLight : "none", border: "none", borderBottom: i < vendors.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{v.display_name}</div>
                {v.booth_number && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Booth {v.booth_number}</div>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div style={{ padding: `${GAP}px` }}>
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
        <PiLeaf size={22} style={{ color: C.textMuted }} />
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
  const router = useRouter();

  const [profile,      setProfile]      = useState<LocalVendorProfile | null>(null);
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [vendors,      setVendors]      = useState<Vendor[]>([]);
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null);
  const [mall,         setMall]         = useState<Mall | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [tab,          setTab]          = useState<"available" | "found">("available");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_VENDOR_KEY);
      if (!raw) { setLoading(false); return; }
      setProfile(JSON.parse(raw) as LocalVendorProfile);
    } catch { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!profile?.mall_id) return;
    getVendorsByMall(profile.mall_id).then(vs => {
      setVendors(vs);
      setActiveVendor(vs.find(v => v.id === profile.vendor_id) ?? vs[0] ?? null);
    });
    getAllMalls().then(malls => setMall(malls.find(m => m.id === profile.mall_id) ?? null));
  }, [profile?.mall_id, profile?.vendor_id]);

  useEffect(() => {
    if (!activeVendor) { if (profile && !profile.vendor_id) setLoading(false); return; }
    setLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => { setPosts(data); setLoading(false); });
  }, [activeVendor?.id]);

  async function handleShare() {
    const slug = activeVendor?.slug ?? profile?.slug;
    if (!slug) return;
    const url  = `${BASE_URL}/vendor/${slug}`;
    const name = activeVendor?.display_name ?? profile?.display_name ?? "my shelf";
    if (navigator.share) {
      try { await navigator.share({ title: `${name} on Treehouse`, text: `Check out finds from ${name}.`, url }); return; } catch {}
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  }

  const available      = posts.filter(p => p.status === "available");
  const found          = posts.filter(p => p.status === "sold");
  const availableCount = available.length;
  const foundCount     = found.length;
  const hasProfile     = !!profile;
  const displayName    = activeVendor?.display_name ?? profile?.display_name ?? "";
  const boothNumber    = activeVendor?.booth_number  ?? profile?.booth_number  ?? null;
  const hasSlug        = !!(activeVendor?.slug ?? profile?.slug);
  const mallName       = mall?.name  ?? "America's Antique Mall";
  const mallCity       = mall?.city  ?? "Louisville, KY";
  const mallImageUrl   = (mall as any)?.image_url ?? null;

  // Fill remaining grid cells with ghost tiles (max 2), then add tile
  const GHOST_COUNT = Math.max(0, Math.ceil((available.length + 1) / GRID_COLS) * GRID_COLS - available.length - 1);

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Hero or minimal header */}
      {hasProfile ? (
        <VendorHero
          displayName={displayName} boothNumber={boothNumber} tagline={null}
          mallName={mallName} mallCity={mallCity}
          availableCount={availableCount} totalCount={posts.length}
          heroImageUrl={null} onShare={handleShare} hasCopied={copied} hasSlug={hasSlug}
        />
      ) : (
        <header style={{ background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px" }}>My Shelf</span>
        </header>
      )}

      {/* Post a find + vendor picker row */}
      {hasProfile && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 0", gap: 8 }}>
          {vendors.length > 1 && activeVendor ? (
            <VendorPicker vendors={vendors} activeId={activeVendor.id} onChange={v => { setActiveVendor(v); setPosts([]); setLoading(true); }} />
          ) : <div />}
          <button onClick={() => router.push("/post")}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 20, fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer", background: C.green, border: "none", letterSpacing: "0.1px", boxShadow: "0 1px 6px rgba(30,77,43,0.28)", WebkitTapHighlightColor: "transparent", flexShrink: 0 }}>
            <Plus size={11} strokeWidth={2.5} />
            Post a find
          </button>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : !hasProfile ? (
          <NoProfile />
        ) : (
          <>
            <TabSwitcher tab={tab} availableCount={availableCount} foundCount={foundCount} onChange={t => setTab(t)} />

            {tab === "available" && (
              <ThreeColGrid>
                {available.map((post, i) => <AvailableTile key={post.id} post={post} index={i} />)}
                {Array(Math.min(GHOST_COUNT, 2)).fill(null).map((_, i) => <GhostTile key={`ghost-${i}`} index={available.length + i} />)}
                <AddFindTile index={available.length + Math.min(GHOST_COUNT, 2)} />
              </ThreeColGrid>
            )}

            {tab === "found" && (
              found.length > 0 ? (
                <ThreeColGrid>
                  {found.map((post, i) => <FoundTile key={post.id} post={post} index={i} />)}
                </ThreeColGrid>
              ) : (
                <div style={{ padding: "48px 32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <PiLeaf size={28} style={{ color: C.textFaint }} />
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.7, margin: 0 }}>
                    Nothing found yet —<br />your shelf is wide open.
                  </p>
                </div>
              )
            )}

            <BoothFinderCard boothNumber={boothNumber} displayName={displayName} mallName={mallName} mallCity={mallCity} mallImageUrl={mallImageUrl} />
            <ExploreBanner />
            <div style={{ height: 8 }} />
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
