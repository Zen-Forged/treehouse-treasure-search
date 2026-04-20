// app/shelves/page.tsx
// Booths — all vendor booths.

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
import { colors } from "@/lib/tokens";
import { vendorHueBg, loadBookmarkCount } from "@/lib/utils";
import AdminOnly from "@/components/AdminOnly";
import BottomNav from "@/components/BottomNav";
import type { Vendor, Mall } from "@/types/treehouse";
import type { User } from "@supabase/supabase-js";

const DEFAULT_MALL_ID = "19a8ff7e-cb45-491f-9451-878e2dde5bf4";

// ─── Vendor card ───────────────────────────────────────────────────────────────

function VendorCard({ vendor, index, user }: { vendor: Vendor; index: number; user: User | null }) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const heroUrl = (vendor as any).hero_image_url as string | null | undefined;
  const hasHero = !!heroUrl && !imgErr;
  const adminUser = isAdmin(user);

  function handleCardTap() {
    if (adminUser) {
      router.push(`/my-shelf?vendor=${vendor.id}`);
    } else {
      router.push(`/shelf/${vendor.slug}`);
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
        style={{ borderRadius: 16, overflow: "hidden", background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 2px 10px rgba(26,24,16,0.06)", position: "relative", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
      >
        {/* Hero band */}
        <div style={{ height: 90, position: "relative", overflow: "hidden" }}>
          {hasHero
            ? <img src={heroUrl!} alt="" onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: vendorHueBg(vendor.display_name) }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,18,12,0.55) 0%, transparent 60%)" }} />

          {vendor.booth_number && (
            <div style={{ position: "absolute", bottom: 10, left: 12, zIndex: 2, padding: "3px 9px", borderRadius: 14, background: "rgba(20,18,12,0.54)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "0.3px" }}>
                Booth {vendor.booth_number}
              </span>
            </div>
          )}

          <AdminOnly user={user}>
            <Link
              href={`/vendor/${vendor.slug}`}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: 10, right: 10, zIndex: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              <Pencil size={11} style={{ color: "rgba(255,255,255,0.88)" }} />
            </Link>
          </AdminOnly>
        </div>

        {/* Info row */}
        <div style={{ padding: "11px 14px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
              {vendor.display_name}
            </div>
            {vendor.bio && (
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: colors.textMuted, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>
                {vendor.bio}
              </div>
            )}
            <AdminOnly user={user}>
              <div style={{ fontSize: 9, color: colors.green, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.4px", marginTop: 3 }}>
                Manage
              </div>
            </AdminOnly>
          </div>
          <ChevronRight size={15} style={{ color: colors.textFaint, flexShrink: 0 }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${colors.border}` }}>
      <div className="skeleton-shimmer" style={{ height: 90 }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="skeleton-shimmer" style={{ height: 14, width: "60%", borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ height: 11, width: "40%", borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoothsPage() {
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState<User | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    setBookmarkCount(loadBookmarkCount());
    Promise.all([
      getSession(),
      getVendorsByMall(DEFAULT_MALL_ID),
      getAllMalls(),
    ]).then(([session, vendorList, mallList]) => {
      setUser(session?.user ?? null);
      setVendors(vendorList);
      setMall(mallList.find(m => m.id === DEFAULT_MALL_ID) ?? null);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: colors.header, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: `1px solid ${colors.border}`, padding: "0 18px" }}>
        <div style={{ paddingTop: "max(18px, env(safe-area-inset-top, 18px))", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/logo.png" alt="Treehouse" width={24} height={24} />
              <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.3px", lineHeight: 1 }}>
                Booths
              </span>
            </div>

            <AdminOnly user={user}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href="/admin"
                  style={{ fontSize: 9, fontWeight: 700, color: colors.green, textTransform: "uppercase", letterSpacing: "1.6px", padding: "4px 9px", borderRadius: 8, background: colors.greenLight, border: `1px solid ${colors.greenBorder}`, textDecoration: "none" }}>
                  Admin
                </Link>
              </div>
            </AdminOnly>
          </div>

          {mall && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <MapPin size={10} style={{ color: colors.textMuted }} />
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted }}>
                {mall.name} · {mall.city}
              </span>
            </div>
          )}

          {!loading && vendors.length > 0 && (
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: colors.textFaint, marginTop: 2 }}>
              {vendors.length} {vendors.length === 1 ? "booth" : "booths"} active
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
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>
              No booths yet
            </div>
            <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
              Booths will appear here once vendors start posting their finds.
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} user={user} />
            ))}
          </div>
        )}
      </main>

      {/* T4b (session 37) — Add Booth capability retired from /shelves and
          folded into /admin Vendors tab. This page is now strictly a browse
          surface. Admins retain the pencil affordance + Admin badge for
          navigating to their own shelf management. */}

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
