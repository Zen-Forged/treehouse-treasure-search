// app/my-shelf/page.tsx
// My Shelf — cinematic vendor profile page. Auth-gated.
// Redirects to /login if no session.
//
// IDENTITY RESOLUTION (authoritative order):
//   1. ?vendor=[id] query param — admin override, loads any vendor by ID
//   2. getVendorByUserId(user.id) — Supabase source of truth for logged-in users
//   3. Admin fallback — if admin has no user_id-linked vendor, auto-loads the
//      default admin booth (ADMIN_DEFAULT_VENDOR_ID) so My Shelf is never empty
//   4. NoBooth state — shown only when none of the above resolves
//
// Admin can switch vendors via ?vendor=[id] (set by Shelves page) or the
// in-page vendor switcher pill in the app bar.
//
// AddFindTile passes ?vendor=[id] to /post so admin always posts to the
// correct booth, not their own user_id-linked vendor.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Share2, Check, ImagePlus, Pencil, Loader, LogOut, ChevronDown } from "lucide-react";
import { PiLeaf } from "react-icons/pi";
import {
  getVendorByUserId, getVendorById, getVendorsByMall, getVendorPosts, getAllMalls,
  uploadVendorHeroImage, updateVendorHeroImage,
} from "@/lib/posts";
import { getSession, signOut, isAdmin } from "@/lib/auth";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile, type Post, type Vendor, type Mall } from "@/types/treehouse";
import BottomNav from "@/components/BottomNav";
import type { User } from "@supabase/supabase-js";

const ADMIN_DEFAULT_VENDOR_ID = "5619b4bf-3d05-4843-8ee1-e8b747fc2d81";
const MALL_ID                 = "19a8ff7e-cb45-491f-9451-878e2dde5bf4";

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

function mapsUrl(query: string) { return `https://maps.apple.com/?q=${encodeURIComponent(query)}`; }

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

// ─── Admin vendor switcher ────────────────────────────────────────────────────

function AdminVendorSwitcher({ vendors, activeId, onSelect }: {
  vendors: Vendor[];
  activeId: string;
  onSelect: (v: Vendor) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = vendors.find(v => v.id === activeId);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 8,
          background: C.greenLight, border: `1px solid ${C.greenBorder}`,
          cursor: "pointer", WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "1.6px" }}>
          {active?.display_name ?? "Switch booth"}
        </span>
        <ChevronDown size={10} style={{ color: C.green }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 200,
              background: "#fff", borderRadius: 12, border: `1px solid ${C.border}`,
              boxShadow: "0 8px 32px rgba(26,24,16,0.16)", minWidth: 200, overflow: "hidden",
            }}
          >
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => { onSelect(v); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 14px", textAlign: "left",
                  background: v.id === activeId ? C.greenLight : "none",
                  border: "none", borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 600, color: C.textPrimary, lineHeight: 1.2 }}>
                    {v.display_name}
                  </div>
                  {v.booth_number && (
                    <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
                      Booth {v.booth_number}
                    </div>
                  )}
                </div>
                {v.id === activeId && <Check size={12} style={{ color: C.green, flexShrink: 0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function VendorHero({ displayName, boothNumber, mallName, mallCity, heroImageUrl, heroKey, onShare, hasCopied, hasSlug, onHeroImageChange, heroUploading, heroError, vendorId, isAdminUser, onSignOut, allVendors, onVendorSwitch }: {
  displayName: string; boothNumber: string | null; mallName?: string; mallCity?: string;
  heroImageUrl?: string | null; heroKey: number;
  onShare: () => void; hasCopied: boolean; hasSlug: boolean;
  onHeroImageChange: (file: File) => void; heroUploading: boolean; heroError: string | null;
  vendorId: string | undefined; isAdminUser: boolean; onSignOut: () => void;
  allVendors: Vendor[]; onVendorSwitch: (v: Vendor) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ padding: "max(14px, env(safe-area-inset-top, 14px)) 10px 0" }}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onHeroImageChange(f); e.target.value = ""; }} />

      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingLeft: 4, paddingRight: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/logo.png" alt="Treehouse Finds" width={20} height={20} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: "0.4px" }}>
            Treehouse Finds
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdminUser && allVendors.length > 0 && vendorId && (
            <AdminVendorSwitcher vendors={allVendors} activeId={vendorId} onSelect={onVendorSwitch} />
          )}
          {hasSlug && (
            <AnimatePresence mode="wait">
              {hasCopied ? (
                <motion.div key="copied" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 18, background: C.greenLight, border: `1px solid ${C.greenBorder}` }}>
                  <Check size={11} style={{ color: C.green }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.green }}>Copied!</span>
                </motion.div>
              ) : (
                <motion.button key="share" onClick={onShare} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} transition={{ duration: 0.14 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 18, background: "none", border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <Share2 size={11} style={{ color: C.textMuted }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: C.textMuted }}>Share</span>
                </motion.button>
              )}
            </AnimatePresence>
          )}
          <button onClick={onSignOut}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: "none", border: `1px solid ${C.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            <LogOut size={12} style={{ color: C.textFaint }} />
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", minHeight: 200 }}>
        {heroImageUrl
          ? <img key={heroKey} src={heroImageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          : <div style={{ position: "absolute", inset: 0, background: vendorHueBg(displayName) }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(18,34,20,0.82) 0%, rgba(18,34,20,0.40) 55%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(18,34,20,0.72) 0%, transparent 100%)", zIndex: 1 }} />

        {vendorId && (
          <button onClick={() => fileInputRef.current?.click()} disabled={heroUploading}
            style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 34, height: 34, borderRadius: "50%", background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: heroUploading ? "default" : "pointer", WebkitTapHighlightColor: "transparent" }}>
            {heroUploading
              ? <Loader size={13} style={{ color: "rgba(255,255,255,0.80)", animation: "spin 0.9s linear infinite" }} />
              : <Pencil size={13} style={{ color: "rgba(255,255,255,0.88)" }} />
            }
          </button>
        )}

        <div style={{ position: "relative", zIndex: 2, padding: "100px 16px 18px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.52)", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>
            A curated shelf from
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "0 0 5px", textShadow: "0 2px 12px rgba(0,0,0,0.22)" }}>
            {displayName}
          </h1>
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

      {/* Upload error — shown below hero card */}
      {heroError && (
        <div style={{ margin: "8px 10px 0", padding: "10px 14px", borderRadius: 10, background: "rgba(139,32,32,0.08)", border: "1px solid rgba(139,32,32,0.18)", fontSize: 12, color: "#8b2020", lineHeight: 1.5 }}>
          ⚠️ Upload error: {heroError}
        </div>
      )}
    </div>
  );
}

// ─── Tab switcher ──────────────────────────────────────────────────────────────

function TabSwitcher({ tab, availableCount, foundCount, onChange }: { tab: "available" | "found"; availableCount: number; foundCount: number; onChange: (t: "available" | "found") => void }) {
  return (
    <div style={{ display: "flex", margin: "12px 10px 8px", background: C.surface, borderRadius: 22, padding: 3, gap: 2 }}>
      {(["available", "found"] as const).map(t => {
        const active = tab === t;
        const count  = t === "available" ? availableCount : foundCount;
        return (
          <button key={t} onClick={() => onChange(t)}
            style={{ flex: 1, padding: "8px 12px", borderRadius: 19, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "background 0.18s", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: active ? 700 : 400, color: active ? C.textPrimary : C.textMuted }}>
              {t === "available" ? "Available" : "Found"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? C.green : C.textFaint }}>({count})</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Tiles ────────────────────────────────────────────────────────────────────

function AvailableTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative" }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {post.image_url && !imgErr
          ? <img src={post.image_url} alt={post.title} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: C.surface }} />
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FoundTile({ post, index }: { post: Post; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden", position: "relative", opacity: 0.62 }}>
      <Link href={`/find/${post.id}`} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
        {post.image_url && !imgErr
          ? <img src={post.image_url} alt={post.title} onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(0.55) brightness(0.82)" }} />
          : <div style={{ width: "100%", height: "100%", background: C.surface }} />
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(20,18,12,0.72) 0%, transparent 100%)", padding: "18px 8px 8px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.90)", lineHeight: 1.25, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
            {post.title}
          </div>
        </div>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "3px 8px", borderRadius: 5, background: "rgba(28,26,20,0.54)", color: "rgba(245,242,235,0.93)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", whiteSpace: "nowrap" }}>
          Found
        </div>
      </Link>
    </motion.div>
  );
}

// AddFindTile — passes ?vendor=[id] to /post so admin always posts to the
// currently-viewed vendor booth, not their own user_id-linked vendor.
function AddFindTile({ index, vendorId }: { index: number; vendorId?: string }) {
  const router = useRouter();
  function handleAdd() {
    const dest = vendorId ? `/post?vendor=${vendorId}` : "/post";
    router.push(dest);
  }
  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, delay: Math.min(index * 0.035, 0.25), ease: [0.25, 0.1, 0.25, 1] }}
      style={{ width: "100%", aspectRatio: "1" }}>
      <button onClick={handleAdd}
        style={{ width: "100%", height: "100%", borderRadius: 10, background: C.emptyTile, border: "none", cursor: "pointer", padding: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, WebkitTapHighlightColor: "transparent" }}>
        <ImagePlus size={18} strokeWidth={1.4} style={{ color: "rgba(28,26,20,0.22)" }} />
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(28,26,20,0.28)", textTransform: "uppercase", letterSpacing: "1.2px", lineHeight: 1 }}>Add</span>
      </button>
    </motion.div>
  );
}

function ThreeColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: GAP, padding: `0 ${GAP}px` }}>
      {children}
    </div>
  );
}

function BoothFinderCard({ boothNumber, displayName, mallName, mallCity }: { boothNumber: string | null; displayName: string; mallName: string; mallCity?: string }) {
  const q = [mallName, mallCity].filter(Boolean).join(", ");
  return (
    <a href={mapsUrl(q)} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", alignItems: "stretch", margin: "20px 10px 0", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, background: "#fff", textDecoration: "none" }}>
      <div style={{ width: 100, flexShrink: 0, background: `linear-gradient(135deg, ${C.bannerFrom}, ${C.bannerTo})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MapPin size={22} style={{ color: "rgba(255,255,255,0.40)" }} />
      </div>
      <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
          <MapPin size={11} style={{ color: C.textMuted, flexShrink: 0 }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.textPrimary }}>Find this booth in person</span>
        </div>
        <p style={{ margin: "0 0 3px", fontFamily: "Georgia, serif", fontSize: 12, color: C.textMid }}>{displayName}{boothNumber ? ` · Booth ${boothNumber}` : ""}</p>
        <p style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 12, color: C.textMuted }}>{mallName}{mallCity ? `, ${mallCity}` : ""}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", paddingRight: 14 }}>
        <ChevronRight size={16} style={{ color: C.textFaint }} />
      </div>
    </a>
  );
}

function ExploreBanner() {
  const router = useRouter();
  return (
    <div style={{ margin: "14px 10px 0", borderRadius: 16, background: `linear-gradient(110deg, ${C.bannerFrom} 0%, ${C.bannerTo} 100%)`, padding: "20px 18px" }}>
      <p style={{ margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.50)", letterSpacing: "2px", textTransform: "uppercase" }}>
        {"There's more to discover"}
      </p>
      <h2 style={{ margin: "0 0 6px", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Explore more shelves nearby</h2>
      <p style={{ margin: "0 0 16px", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(255,255,255,0.55)" }}>From local booths. Across Kentucky.</p>
      <button onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 24, background: "rgba(255,255,255,0.95)", border: "none", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700, color: C.bannerFrom, WebkitTapHighlightColor: "transparent" }}>
        Enter the Treehouse <ChevronRight size={14} style={{ color: C.bannerFrom }} />
      </button>
    </div>
  );
}

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

function NoBooth({ onSignOut }: { onSignOut: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px 0", textAlign: "center" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
        <PiLeaf size={22} style={{ color: C.textMuted }} />
      </div>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10, lineHeight: 1.3 }}>No booth set up yet</div>
      <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.75, maxWidth: 230, margin: "0 0 28px" }}>
        Post your first find to create your booth identity and see your shelf here.
      </p>
      <Link href="/post" style={{ display: "inline-block", padding: "12px 26px", borderRadius: 24, background: C.green, color: "rgba(255,255,255,0.96)", fontSize: 13, fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 12px rgba(30,77,43,0.25)", marginBottom: 20 }}>
        Post a find
      </Link>
      <button onClick={onSignOut} style={{ fontSize: 11, color: C.textFaint, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
        Sign out
      </button>
    </motion.div>
  );
}

// ─── Inner page (needs useSearchParams) ───────────────────────────────────────

function MyShelfInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [user,          setUser]          = useState<User | null>(null);
  const [authReady,     setAuthReady]     = useState(false);
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(null);
  const [vendorReady,   setVendorReady]   = useState(false);
  const [posts,         setPosts]         = useState<Post[]>([]);
  const [postsLoading,  setPostsLoading]  = useState(false);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [tab,           setTab]           = useState<"available" | "found">("available");
  const [heroImageUrl,  setHeroImageUrl]  = useState<string | null>(null);
  const [heroKey,       setHeroKey]       = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroError,     setHeroError]     = useState<string | null>(null);
  const [allVendors,    setAllVendors]    = useState<Vendor[]>([]);

  const userRef       = useRef<User | null>(null);
  const heroLockedRef = useRef(false);

  // ── Step 1: Auth gate ──
  useEffect(() => {
    getSession().then(s => {
      if (!s?.user) { router.replace("/login"); return; }
      setUser(s.user);
      userRef.current = s.user;
      setAuthReady(true);
    });
  }, []);

  // ── Step 2: Resolve vendor ──
  useEffect(() => {
    if (!authReady || !user) return;

    const authedUser  = user;
    const adminUser   = isAdmin(authedUser);
    const vendorParam = searchParams.get("vendor");

    async function resolve() {
      if (adminUser) {
        getVendorsByMall(MALL_ID).then(setAllVendors);
      }

      if (adminUser && vendorParam) {
        const v = await getVendorById(vendorParam);
        if (v) { loadVendor(v, authedUser.id); return; }
      }

      const v = await getVendorByUserId(authedUser.id);
      if (v) { loadVendor(v, authedUser.id); return; }

      if (adminUser) {
        const defaultV = await getVendorById(ADMIN_DEFAULT_VENDOR_ID);
        if (defaultV) { loadVendor(defaultV, authedUser.id); return; }
      }

      setVendorReady(true);
    }

    resolve();
  }, [authReady, user?.id]);

  function loadVendor(vendor: Vendor, userId: string) {
    setActiveVendor(vendor);
    if (vendor.hero_image_url && !heroLockedRef.current) {
      setHeroImageUrl(vendor.hero_image_url);
    }

    const cached: LocalVendorProfile = {
      display_name: vendor.display_name,
      booth_number: vendor.booth_number ?? "",
      mall_id:      vendor.mall_id,
      mall_name:    (vendor.mall as Mall | undefined)?.name ?? "",
      mall_city:    (vendor.mall as Mall | undefined)?.city ?? "",
      vendor_id:    vendor.id,
      slug:         vendor.slug,
      user_id:      userId,
    };
    try { localStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(cached)); } catch {}

    if (vendor.mall) {
      setMall(vendor.mall as Mall);
    } else {
      getAllMalls().then(malls => setMall(malls.find(m => m.id === vendor.mall_id) ?? null));
    }

    setVendorReady(true);
  }

  function handleVendorSwitch(vendor: Vendor) {
    setActiveVendor(null);
    setPosts([]);
    setHeroImageUrl(null);
    setVendorReady(false);
    setPostsLoading(true);

    const url = new URL(window.location.href);
    url.searchParams.set("vendor", vendor.id);
    window.history.replaceState({}, "", url.toString());

    loadVendor(vendor, userRef.current?.id ?? "");
  }

  // ── Step 3: Load posts ──
  useEffect(() => {
    if (!activeVendor) return;
    setPostsLoading(true);
    getVendorPosts(activeVendor.id, 200).then(data => {
      setPosts(data);
      setPostsLoading(false);
    });
  }, [activeVendor?.id]);

  // ── Hero image upload ──
  async function handleHeroImageChange(file: File) {
    if (!activeVendor?.id) return;
    setHeroUploading(true);
    setHeroError(null);
    heroLockedRef.current = true;
    try {
      const reader  = new FileReader();
      const dataUrl = await new Promise<string>((res, rej) => {
        reader.onload  = e => res(e.target?.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const compressed  = await compressImage(dataUrl);
      setHeroImageUrl(compressed);
      setHeroKey(k => k + 1);
      const uploadedUrl = await uploadVendorHeroImage(compressed, activeVendor.id);
      if (uploadedUrl) {
        const dbOk = await updateVendorHeroImage(activeVendor.id, uploadedUrl);
        if (dbOk) {
          setHeroImageUrl(uploadedUrl);
          setHeroKey(k => k + 1);
          setActiveVendor(v => v ? { ...v, hero_image_url: uploadedUrl } : v);
        } else {
          setHeroError("Image uploaded but failed to save to database.");
          setHeroImageUrl(activeVendor.hero_image_url ?? null);
          setHeroKey(k => k + 1);
        }
      } else {
        setHeroError("Image upload to storage failed. Check Supabase bucket permissions.");
        setHeroImageUrl(activeVendor.hero_image_url ?? null);
        setHeroKey(k => k + 1);
      }
    } catch (err) {
      setHeroError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      setHeroImageUrl(activeVendor.hero_image_url ?? null);
      setHeroKey(k => k + 1);
    } finally {
      setHeroUploading(false);
      setTimeout(() => { heroLockedRef.current = false; }, 3000);
    }
  }

  async function handleShare() {
    const slug = activeVendor?.slug;
    if (!slug) return;
    const url  = `${BASE_URL}/shelf/${slug}`;
    const name = activeVendor.display_name;
    if (navigator.share) { try { await navigator.share({ title: `${name} on Treehouse`, text: `Check out finds from ${name}.`, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  if (!authReady) return null;

  const available   = posts.filter(p => p.status === "available");
  const found       = posts.filter(p => p.status === "sold");
  const displayName = activeVendor?.display_name ?? "";
  const boothNumber = activeVendor?.booth_number  ?? null;
  const hasSlug     = !!activeVendor?.slug;
  const mallName    = mall?.name ?? (activeVendor?.mall as Mall | undefined)?.name ?? "America's Antique Mall";
  const mallCity    = mall?.city ?? (activeVendor?.mall as Mall | undefined)?.city ?? "Louisville, KY";
  const adminUser   = isAdmin(user);
  const loading     = !vendorReady || postsLoading;

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {activeVendor ? (
        <VendorHero
          displayName={displayName} boothNumber={boothNumber}
          mallName={mallName} mallCity={mallCity}
          heroImageUrl={heroImageUrl} heroKey={heroKey}
          onShare={handleShare} hasCopied={copied} hasSlug={hasSlug}
          onHeroImageChange={handleHeroImageChange} heroUploading={heroUploading}
          vendorId={activeVendor.id}
          isAdminUser={adminUser}
          onSignOut={handleSignOut}
          allVendors={allVendors}
          onVendorSwitch={handleVendorSwitch}
          heroError={heroError}
        />
      ) : (
        <header style={{ background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${C.border}`, padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Image src="/logo.png" alt="Treehouse Finds" width={24} height={24} />
            <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.green }}>Treehouse Finds</span>
          </div>
          <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: "none", border: `1px solid ${C.border}`, cursor: "pointer" }}>
            <LogOut size={12} style={{ color: C.textFaint }} />
          </button>
        </header>
      )}

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <SkeletonGrid />
        ) : !activeVendor ? (
          <NoBooth onSignOut={handleSignOut} />
        ) : (
          <>
            <TabSwitcher tab={tab} availableCount={available.length} foundCount={found.length} onChange={t => setTab(t)} />

            {tab === "available" && (
              <ThreeColGrid>
                {available.map((post, i) => <AvailableTile key={post.id} post={post} index={i} />)}
                <AddFindTile index={available.length} vendorId={activeVendor.id} />
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

            <BoothFinderCard boothNumber={boothNumber} displayName={displayName} mallName={mallName} mallCity={mallCity} />
            <ExploreBanner />
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

// ─── Page — Suspense for useSearchParams ──────────────────────────────────────

export default function MyShelfPage() {
  return (
    <Suspense>
      <MyShelfInner />
    </Suspense>
  );
}
