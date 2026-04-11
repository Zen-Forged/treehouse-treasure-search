// app/my-shelf/page.tsx
// My Shelf — cinematic vendor profile page.
// Contained hero card, Available/Found tab switcher, price-labelled tiles,
// booth finder card (opens Maps), explore CTA, vendor picker at bottom.
// Hero image: tap pencil icon → pick from library → compress → upload → optimistic update.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, ChevronDown, Share2, Check, ImagePlus, Pencil, Loader, Plus } from "lucide-react";
import { PiLeaf } from "react-icons/pi";
import {
  getVendorPosts, getVendorsByMall, getAllMalls,
  uploadVendorHeroImage, updateVendorHeroImage,
} from "@/lib/posts";
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
  header:      "rgba(245,242,235,0.96)",
  emptyTile:   "#dedad2",
  bannerFrom:  "#1e3d24",
  bannerTo:    "#2d5435",
};

const GAP       = 6;
const GRID_COLS = 3;
const BASE_URL  = "https://treehouse-treasure-search.vercel.app";

function mapsUrl(query: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
}

function vendorHueBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const hues = [142, 168, 195, 220, 25, 340];
  return `hsl(${hues[h % hues.length]}, 22%, 78%)`;
}

function compressImage(dataUrl: string, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => {
      const scale  = Math.min(1, maxWidth / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function VendorHero({
  displayName, boothNumber, tagline, mallName, mallCity,
  heroImageUrl, onShare, hasCopied, hasSlug,
  onHeroImageChange, heroUploading, vendorId,
}: {
  displayName:       string;
  boothNumber:       string | null;
  tagline?:          string | null;
  mallName?:         string;
  mallCity?:         string;
  heroImageUrl?:     string | null;
  onShare:           () => void;
  hasCopied:         boolean;
  hasSlug:           boolean;
  onHeroImageChange: (file: File) => void;
  heroUploading:     boolean;
  vendorId:          string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onHeroImageChange(file);
    e.target.value = "";
  }

  return (
    <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logo.png" alt="Treehouse Finds" width={20} height={20} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: "0.4px" }}>
            Treehouse Finds
          </span>
        </div>
        {hasSlug && (
          <AnimatePresence mode="wait">
            {hasCopied ? (
              <motion.div key="copied" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 18, background: C.greenLight, border: `1px solid ${C.greenBorder}` }}>
                <Check size={11} style={{ color: C.green }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>Copied!</span>
              </motion.div>
            ) : (
              <motion.button key="share" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                onClick={onShare}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 18, background: "none", border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                <Share2 size={11} style={{ color: C.textMuted }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted }}>Share</span>
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Contained hero card */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
        {/* Base layer: image or pastel */}
        {heroImageUrl ? (
          <img src={heroImageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
        )}

        {/* Gradient: dark left → transparent right — sits above image, below text */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%)",
          zIndex: 1,
        }} />
        {/* Bottom fade to anchor text readability */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
          background: "linear-gradient(to top, rgba(18,34,20,0.72) 0%, transparent 100%)",
          zIndex: 1,
        }} />

        {/* Edit button — top right, above gradients */}
        {vendorId && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={heroUploading}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 10,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: heroUploading ? "default" : "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {heroUploading
              ? <Loader size={13} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />
              : <Pencil size={13} style={{ color: "rgba(255,255,255,0.88)" }} />
            }
          </button>
        )}

        {/* Text content — above all gradients */}
        <div style={{ position: "relative", zIndex: 2, padding: "100px 16px 18px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.52)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>
            A curated shelf from
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 5px", textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            {displayName}
          </h1>
          {tagline && (
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 10, color: "rgba(255,255,255,0.58)", textTransform: "uppercase", letterSpacing: "1.8px", margin: "0 0 10px" }}>
              {tagline}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            {boothNumber && (
              <div style={{ padding: "4px 11px", borderRadius: 18, background: C.green, fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "1px", textTransform: "uppercase" }}>
                Booth {boothNumber}
              </div>
            )}
            {mallName && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <MapPin size={9} style={{ color: "rgba(255,255,255,0.52)", flexShrink: 0 }} />
                <span style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "rgba(255,255,255,0.62)" }}>
                  {mallName}{mallCity ? ` · ${mallCity}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab switcher ──────────────────────────────────────────────────────────────

function TabSwitcher({ tab, availableCount, foundCount, onChange }: {
  tab: "available" | "found"; availableCount: number; foundCount: number; onChange: (t: "available" | "found") => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "12px 10px 8px", background: C.surface, borderRadius: 22, padding: 3, gap: 2 }}>
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

// ─── Available tile — no price shown ──────────────────────────────────────────

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
        {/* Title only — no price */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Found tile ────────────────────────────────────────────────────────────────

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
  boothNumber: string | null; displayName: string; mallName: string; mallCity?: string; mallImageUrl?: string | null;
}) {
  const mapsQuery = [mallName, mallCity].filter(Boolean).join(", ");
  return (
    <a href={mapsUrl(mapsQuery)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "stretch", margin: "20px 10px 0", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", textDecoration: "none" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <MapPin size={11} style={{ color: C.textMuted, flexShrink: 0 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Find this booth in person</span>
        </div>
        <p style={{ margin: "0 0 3px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMid, lineHeight: 1.4 }}>
          {displayName}{boothNumber ? ` · Booth ${boothNumber}` : ""}
        </p>
        <p style={{ margin: "0 0 8px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>
          {mallName}{mallCity ? `, ${mallCity}` : ""}
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: C.greenLight, border: `1px solid ${C.greenBorder}`, alignSelf: "flex-start" }}>
          <PiLeaf size={10} style={{ color: C.green }} />
          <span style={{ fontSize: 9, fontWeight: 600, color: C.green, textTransform: "uppercase", letterSpacing: "1.2px" }}>Real places. Real finds.</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingRight: 14, flexShrink: 0 }}>
        <ChevronRight size={16} style={{ color: C.textFaint }} />
      </div>
    </a>
  );
}

// ─── Explore CTA banner ────────────────────────────────────────────────────────

function ExploreBanner() {
  const router = useRouter();
  return (
    <div style={{ margin: "14px 10px 0", borderRadius: 16, background: `linear-gradient(110deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`, padding: "20px 18px" }}>
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
      <p style={{ margin: "12px 0 0", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.28)", letterSpacing: "2px", textTransform: "uppercase" }}>
        Antiques · Vintage · Stories · All in one place
      </p>
    </div>
  );
}

// ─── Vendor picker + "Add a booth" option ──────────────────────────────────────

function VendorPicker({ vendors, activeId, onChange }: {
  vendors: Vendor[]; activeId: string; onChange: (v: Vendor) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = vendors.find(v => v.id === activeId) ?? vendors[0];
  // Always render — even with 1 vendor, we show the "Add a booth" option
  if (vendors.length === 0) return null;

  return (
    <div style={{ margin: "20px 10px 0" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: C.textFaint, textTransform: "uppercase", letterSpacing: "1.8px", margin: "0 0 8px 2px" }}>
        Booth selection
      </p>
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpen(o => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>
              {active?.display_name ?? "Select a booth"}
            </div>
            {active?.booth_number && (
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Booth {active.booth_number}</div>
            )}
          </div>
          <ChevronDown size={13} style={{ color: C.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s", flexShrink: 0 }} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.16 }}
              style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.18)", border: `1px solid ${C.border}` }}>
              {vendors.map((v, i) => (
                <button key={v.id} onClick={() => { onChange(v); setOpen(false); }}
                  style={{ width: "100%", padding: "11px 14px", background: v.id === activeId ? C.greenLight : "none", border: "none", borderBottom: `1px solid ${C.border}`, cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent" }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary }}>{v.display_name}</div>
                  {v.booth_number && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Booth {v.booth_number}</div>}
                </button>
              ))}
              {/* Add a booth — routes to /post setup flow */}
              <button
                onClick={() => { setOpen(false); router.push("/post"); }}
                style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plus size={10} style={{ color: C.green }} />
                </div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 500, color: C.green }}>Add a booth</div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
  const [profile,       setProfile]       = useState<LocalVendorProfile | null>(null);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(null);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [tab,           setTab]           = useState<"available" | "found">("available");
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);

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
      const match = vs.find(v => v.id === profile.vendor_id) ?? vs[0] ?? null;
      setActiveVendor(match);
      if (match?.hero_image_url) setHeroImageUrl(match.hero_image_url);
    });
    getAllMalls().then(malls => setMall(malls.find(m => m.id === profile.mall_id) ?? null));
  }, [profile?.mall_id, profile?.vendor_id]);

  useEffect(() => {
    if (!activeVendor) { if (profile && !profile.vendor_id) setLoading(false); return; }
    setLoading(true);
    setHeroImageUrl(activeVendor.hero_image_url ?? null);
    getVendorPosts(activeVendor.id, 200).then(data => { setPosts(data); setLoading(false); });
  }, [activeVendor?.id]);

  async function handleHeroImageChange(file: File) {
    if (!activeVendor?.id) return;
    setHeroUploading(true);
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload  = e => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressed  = await compressImage(dataUrl);
      setHeroImageUrl(compressed); // optimistic
      const uploadedUrl = await uploadVendorHeroImage(compressed, activeVendor.id);
      if (uploadedUrl) {
        setHeroImageUrl(uploadedUrl);
        await updateVendorHeroImage(activeVendor.id, uploadedUrl);
        setActiveVendor(v => v ? { ...v, hero_image_url: uploadedUrl } : v);
        setVendors(vs => vs.map(v => v.id === activeVendor.id ? { ...v, hero_image_url: uploadedUrl } : v));
      } else {
        setHeroImageUrl(activeVendor.hero_image_url ?? null);
      }
    } catch {
      setHeroImageUrl(activeVendor.hero_image_url ?? null);
    } finally {
      setHeroUploading(false);
    }
  }

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
  const mallName       = mall?.name ?? "America's Antique Mall";
  const mallCity       = mall?.city ?? "Louisville, KY";
  const mallImageUrl   = (mall as any)?.image_url ?? null;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {hasProfile ? (
        <VendorHero
          displayName={displayName} boothNumber={boothNumber} tagline={null}
          mallName={mallName} mallCity={mallCity} heroImageUrl={heroImageUrl}
          onShare={handleShare} hasCopied={copied} hasSlug={hasSlug}
          onHeroImageChange={handleHeroImageChange} heroUploading={heroUploading}
          vendorId={activeVendor?.id ?? profile?.vendor_id}
        />
      ) : (
        <header style={{ background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/logo.png" alt="Treehouse Finds" width={24} height={24} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.green }}>Treehouse Finds</span>
        </header>
      )}

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
                <AddFindTile index={available.length} />
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

            {/* Vendor picker — always shown when vendors exist */}
            {vendors.length > 0 && activeVendor && (
              <VendorPicker
                vendors={vendors}
                activeId={activeVendor.id}
                onChange={v => { setActiveVendor(v); setPosts([]); setLoading(true); }}
              />
            )}

            <div style={{ height: 12 }} />
          </>
        )}
      </div>

      <BottomNav active="my-shelf" />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .hidden { display: none; }
      `}</style>
    </div>
  );
}
