// app/shelves/page.tsx
// Booths — all vendor booths at America's Antique Mall.
// Public: browse booth cards, tap to go to vendor shelf (read-only).
// Admin: tap card → manage that booth in My Shelf.
//        "Add Booth" button → inline sheet with display_name, booth_number, mall selection.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Pencil, Plus, X, Check, Loader } from "lucide-react";
import { getVendorsByMall, getAllMalls, createVendor, slugify } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { colors } from "@/lib/tokens";
import { vendorHueBg, loadBookmarkCount } from "@/lib/utils";
import AdminOnly from "@/components/AdminOnly";
import BottomNav from "@/components/BottomNav";
import type { Vendor, Mall } from "@/types/treehouse";
import type { User } from "@supabase/supabase-js";

const DEFAULT_MALL_ID = "19a8ff7e-cb45-491f-9451-878e2dde5bf4";

// ─── Add Booth Sheet ──────────────────────────────────────────────────────────

function AddBoothSheet({
  malls, onClose, onCreated,
}: {
  malls: Mall[];
  onClose: () => void;
  onCreated: (vendor: Vendor) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [mallId,      setMallId]      = useState(DEFAULT_MALL_ID);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [done,        setDone]        = useState(false);

  async function handleSubmit() {
    if (!displayName.trim()) { setError("Booth name is required."); return; }
    if (!mallId) { setError("Please select a mall."); return; }
    setSubmitting(true);
    setError(null);
    const slug = slugify(displayName.trim());
    const { data, error: createErr } = await createVendor({
      mall_id:      mallId,
      display_name: displayName.trim(),
      booth_number: boothNumber.trim() || undefined,
      slug,
    });
    if (createErr || !data) {
      setError(createErr ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }
    setDone(true);
    setTimeout(() => { onCreated(data); onClose(); }, 800);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    borderRadius: 12, border: `1px solid ${colors.border}`,
    background: colors.surface, fontSize: 14,
    fontFamily: "Georgia, serif", color: colors.textPrimary,
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 9, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "1.8px",
    color: colors.textMuted, marginBottom: 6,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(28,26,20,0.42)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 430, zIndex: 300,
          background: colors.bg, borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(28,26,20,0.18)",
          maxHeight: "85dvh", display: "flex", flexDirection: "column",
        }}
      >
        {/* Handle */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border }} />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>
              Add a Booth
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: colors.surface, border: `1px solid ${colors.border}`, cursor: "pointer" }}>
              <X size={14} style={{ color: colors.textMuted }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={labelStyle}>Booth Name *</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. ZenForged Finds" style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Booth Number</label>
              <input value={boothNumber} onChange={e => setBoothNumber(e.target.value)} placeholder="e.g. 369" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mall *</label>
              <div style={{ position: "relative" }}>
                <select value={mallId} onChange={e => setMallId(e.target.value)} style={{ ...inputStyle, appearance: "none", WebkitAppearance: "none", paddingRight: 36, cursor: "pointer" }}>
                  <option value="">Select a mall…</option>
                  {malls.map(m => <option key={m.id} value={m.id}>{m.name}{m.city ? ` · ${m.city}` : ""}</option>)}
                </select>
                <ChevronRight size={13} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", color: colors.textMuted, pointerEvents: "none" }} />
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 12, color: colors.red, background: colors.redBg, borderRadius: 10, padding: "10px 14px" }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || done}
              style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: colors.green, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", cursor: submitting || done ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: submitting ? 0.8 : 1, transition: "background 0.2s" }}>
              {done ? <><Check size={16} /> Booth added</> : submitting ? <><Loader size={16} style={{ animation: "spin 0.9s linear infinite" }} /> Adding…</> : "Add Booth"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

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

          {/* Admin-only pencil — view vendor profile */}
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
            {/* Admin hint — only shown in admin mode */}
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
  const [malls,         setMalls]         = useState<Mall[]>([]);
  const [mall,          setMall]          = useState<Mall | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState<User | null>(null);
  const [showAddSheet,  setShowAddSheet]  = useState(false);
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
      setMalls(mallList);
      setMall(mallList.find(m => m.id === DEFAULT_MALL_ID) ?? null);
      setLoading(false);
    });
  }, []);

  function handleBoothCreated(vendor: Vendor) {
    setVendors(prev => [...prev, vendor].sort((a, b) => {
      if (!a.booth_number && !b.booth_number) return 0;
      if (!a.booth_number) return 1;
      if (!b.booth_number) return -1;
      return a.booth_number.localeCompare(b.booth_number, undefined, { numeric: true });
    }));
  }

  const adminUser = isAdmin(user);

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

            {/* Admin controls grouped together */}
            <AdminOnly user={user}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setShowAddSheet(true)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 10, background: colors.green, border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <Plus size={13} style={{ color: "#fff" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.2px" }}>Add Booth</span>
                </button>
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
            <AdminOnly user={user}>
              <button onClick={() => setShowAddSheet(true)}
                style={{ marginTop: 24, padding: "12px 24px", borderRadius: 24, background: colors.green, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "Georgia, serif", cursor: "pointer" }}>
                Add the first booth
              </button>
            </AdminOnly>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} user={user} />
            ))}
          </div>
        )}
      </main>

      {/* ── Add Booth Sheet ── */}
      <AnimatePresence>
        {showAddSheet && (
          <AddBoothSheet malls={malls} onClose={() => setShowAddSheet(false)} onCreated={handleBoothCreated} />
        )}
      </AnimatePresence>

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
