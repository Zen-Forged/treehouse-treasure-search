// app/shelves/page.tsx
// Shelves — all vendor booths at America's Antique Mall.
// Public: browse vendor cards, tap to go to vendor profile.
// Admin: each card has an edit button; tapping the card loads that booth in My Shelf.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ChevronRight, Pencil } from "lucide-react";
import { getVendorsByMall, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import type { Vendor, Mall } from "@/types/treehouse";
import type { User } from "@supabase/supabase-js";

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
  bannerFrom:  "#1e3d24",
  bannerTo:    "#2d5435",
};

const MALL_ID = "19a8ff7e-cb45-491f-9451-878e2dde5bf4";

function vendorHueBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const hues = [142, 168, 195, 220, 25, 340];
  return `hsl(${hues[h % hues.length]}, 18%, 82%)`;
}

// ─── Vendor card ───────────────────────────────────────────────────────────────

function VendorCard({ vendor, index, adminUser }: { vendor: Vendor; index: number; adminUser: boolean }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const heroUrl = (vendor as any).hero_image_url as string | null | undefined;
  const hasHero = !!heroUrl && !imgErr;

  // Admin: tap card → load this booth in My Shelf
  // Public: tap card → vendor profile page
  function handleCardTap() {
    if (adminUser) {
      router.push(`/my-shelf?vendor=${vendor.id}`);
    } else {
      router.push(`/vendor/${vendor.slug}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div
        onClick={handleCardTap}
        style={{
          borderRadius: 16, overflow: "hidden",
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: "0 2px 10px rgba(26,24,16,0.06)",
          position: "relative", cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Hero / color band */}
        <div style={{ height: 90, position: "relative", overflow: "hidden" }}>
          {hasHero ? (
            <img src={heroUrl!} alt="" onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: vendorHueBg(vendor.display_name) }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,12,0.55) 0%, transparent 60%)" }} />

          {/* Booth pill */}
          {vendor.booth_number && (
            <div style={{
              position: "absolute", bottom: 10, left: 12, zIndex: 2,
              padding: "3px 9px", borderRadius: 14,
              background: "rgba(20,18,12,0.54)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "0.3px" }}>
                Booth {vendor.booth_number}
              </span>
            </div>
          )}

          {/* Admin: edit button → vendor profile page (for future admin edit page) */}
          {adminUser && (
            <Link
              href={`/vendor/${vendor.slug}`}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute", top: 10, right: 10, zIndex: 10,
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <Pencil size={11} style={{ color: "rgba(255,255,255,0.88)" }} />
            </Link>
          )}
        </div>

        {/* Info row */}
        <div style={{ padding: "11px 14px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: C.textPrimary,
              lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: 2,
            }}>
              {vendor.display_name}
            </div>
            {vendor.bio && (
              <div style={{
                fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: C.textMuted,
                lineHeight: 1.45, overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const,
              }}>
                {vendor.bio}
              </div>
            )}
            {adminUser && (
              <div style={{ fontSize: 9, color: C.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.4px", marginTop: 3 }}>
                Tap to manage shelf
              </div>
            )}
          </div>
          <ChevronRight size={15} style={{ color: C.textFaint, flexShrink: 0 }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div className="skeleton-shimmer" style={{ height: 90 }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton-shimmer" style={{ height: 14, width: "60%", borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 11, width: "40%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ShelvesPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [mall,    setMall]    = useState<Mall | null>(null);
  const [loading, setLoading] = useState(true);
  const [user,    setUser]    = useState<User | null>(null);

  useEffect(() => {
    Promise.all([
      getSession(),
      getVendorsByMall(MALL_ID),
      getAllMalls(),
    ]).then(([session, vendorList, malls]) => {
      setUser(session?.user ?? null);
      setVendors(vendorList);
      setMall(malls.find(m => m.id === MALL_ID) ?? null);
      setLoading(false);
    });
  }, []);

  const adminUser = isAdmin(user);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${C.border}`, padding: "0 18px",
      }}>
        <div style={{ paddingTop: "max(18px, env(safe-area-inset-top, 18px))", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
                Shelves
              </span>
            </div>
            {adminUser && (
              <Link href="/admin"
                style={{ fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "1.6px", padding: "4px 9px", borderRadius: 8, background: C.greenLight, border: `1px solid ${C.greenBorder}`, textDecoration: "none" }}>
                Admin
              </Link>
            )}
          </div>

          {mall && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <MapPin size={10} style={{ color: C.textMuted }} />
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted }}>
                {mall.name} · {mall.city}
              </span>
            </div>
          )}

          {!loading && vendors.length > 0 && (
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: C.textFaint, marginTop: 2 }}>
              {vendors.length} {vendors.length === 1 ? "booth" : "booths"} active
              {adminUser && <span style={{ color: C.green, marginLeft: 6 }}>· Admin mode</span>}
            </div>
          )}
        </div>
      </header>

      {/* ── Vendor list ── */}
      <main style={{ padding: "16px 15px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : vendors.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>
              No booths yet
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
              Shelves will appear here once vendors start posting their finds.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} adminUser={adminUser} />
            ))}
          </div>
        )}
      </main>

      <BottomNav active="shelves" />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
