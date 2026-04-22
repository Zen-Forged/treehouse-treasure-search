// app/shelves/page.tsx
// Booths — cross-mall vendor booth directory.
//
// Session 45 (2026-04-22) — cross-mall fix + admin delete affordance.
//
// PRIOR BUG: this page called getVendorsByMall(DEFAULT_MALL_ID) hardcoded to
// America's Antique Mall. Any booth seeded via session-44 <AddBoothInline>
// at a non-AAM mall appeared optimistically on create (state prepend) but
// vanished on refetch. /shelves is meant to be the cross-mall booth
// directory per CONTEXT.md §5, so the fix is to use the new getAllVendors.
//
// ADMIN DELETE: admin-only trash bubble in the hero band opens an inline
// typed-confirm sheet. Admin types the booth name exactly to enable the
// red "Delete booth" button. DELETE /api/admin/vendors handles the
// cascade (posts + storage + vendor row). Claimed booths (user_id !== null)
// are rejected server-side with 409; the error message surfaces in-sheet.
//
// Chrome mismatch still flagged: this page is v0.2 Georgia + legacy colors,
// but AddBoothInline is v1.1k paperCream + IM Fell. Same intentional mismatch
// session 44 introduced. Folds into Sprint 5+ /shelves v1.2 redesign.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, ChevronRight, Pencil, Trash2, X, Loader as LoaderIcon, AlertTriangle } from "lucide-react";
import { getAllVendors, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { colors } from "@/lib/tokens";
import { vendorHueBg, loadBookmarkCount } from "@/lib/utils";
import AdminOnly from "@/components/AdminOnly";
import AddBoothInline from "@/components/AddBoothInline";
import BottomNav from "@/components/BottomNav";
import type { Vendor, Mall } from "@/types/treehouse";
import type { User } from "@supabase/supabase-js";

// ─── Vendor card ───────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  index,
  user,
  onRequestDelete,
}: {
  vendor: Vendor;
  index: number;
  user: User | null;
  onRequestDelete: (vendor: Vendor) => void;
}) {
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

  function handleDeleteTap(e: React.MouseEvent) {
    e.stopPropagation();
    onRequestDelete(vendor);
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
            {/* Delete bubble — sits LEFT of the edit bubble (right: 46 keeps
                clearance for the 28px pencil bubble at right: 10). Only
                shows "Delete" affordance for booths without a linked vendor;
                claimed booths are rejected server-side anyway, but surfacing
                the affordance here would be misleading. */}
            {!vendor.user_id && (
              <button
                onClick={handleDeleteTap}
                aria-label={`Delete ${vendor.display_name}`}
                style={{ position: "absolute", top: 10, right: 46, zIndex: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(20,18,12,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
              >
                <Trash2 size={11} style={{ color: "rgba(255,255,255,0.88)" }} />
              </button>
            )}

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
            {vendor.bio ? (
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: colors.textMuted, lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" as const }}>
                {vendor.bio}
              </div>
            ) : vendor.mall?.name ? (
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: colors.textMuted, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {vendor.mall.name}
              </div>
            ) : null}
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

// ─── Delete confirm sheet ──────────────────────────────────────────────────────

function DeleteBoothSheet({
  vendor,
  onClose,
  onDeleted,
}: {
  vendor: Vendor;
  onClose: () => void;
  onDeleted: (vendorId: string) => void;
}) {
  const [typedName,   setTypedName]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const canDelete = typedName.trim() === vendor.display_name.trim() && !submitting;

  async function handleDelete() {
    if (!canDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/admin/vendors", {
        method: "DELETE",
        body: JSON.stringify({ vendorId: vendor.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      onDeleted(vendor.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  // Lock body scroll while sheet is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={submitting ? undefined : onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(20,18,12,0.52)", zIndex: 200, cursor: submitting ? "default" : "pointer" }}
      />

      {/* Sheet (non-animated wrapper for transform-free centering per session-9 KI-002 rule) */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: "100%",
            maxWidth: 430,
            background: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: "20px 22px calc(24px + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -10px 40px rgba(20,18,12,0.25)",
            pointerEvents: "auto",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {/* Handle */}
          <div style={{ width: 44, height: 4, borderRadius: 4, background: "rgba(20,18,12,0.22)", margin: "0 auto 18px" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(139,32,32,0.10)",
              border: "1px solid rgba(139,32,32,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <AlertTriangle size={16} style={{ color: "#8b2020" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3 }}>
                Delete this booth?
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted, lineHeight: 1.55, marginTop: 4 }}>
                Removes the booth, every find posted to it, and all photos. This cannot be undone.
              </div>
            </div>
            <button
              onClick={submitting ? undefined : onClose}
              aria-label="Close"
              disabled={submitting}
              style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(20,18,12,0.04)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: submitting ? "default" : "pointer", flexShrink: 0,
              }}
            >
              <X size={14} style={{ color: colors.textMuted }} />
            </button>
          </div>

          {/* Booth identity block */}
          <div style={{
            padding: "12px 14px",
            background: "rgba(20,18,12,0.03)",
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3 }}>
              {vendor.display_name}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 12, color: colors.textMuted, lineHeight: 1.5, marginTop: 3 }}>
              {vendor.mall?.name ?? "Unknown mall"}
              {vendor.booth_number ? ` · Booth ${vendor.booth_number}` : ""}
            </div>
          </div>

          {/* Typed-confirm */}
          <div style={{ marginBottom: 12 }}>
            <label style={{
              display: "block",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 12,
              color: colors.textMuted,
              lineHeight: 1.4,
              marginBottom: 6,
            }}>
              Type <span style={{ fontStyle: "normal", fontWeight: 700, color: colors.textPrimary }}>{vendor.display_name}</span> to confirm.
            </label>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder={vendor.display_name}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={submitting}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "11px 12px",
                borderRadius: 10,
                background: "rgba(20,18,12,0.02)",
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
                fontSize: 14,
                fontFamily: "system-ui, -apple-system, sans-serif",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 9,
              background: "rgba(139,32,32,0.07)",
              border: "1px solid rgba(139,32,32,0.18)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontSize: 12,
              color: "#8b2020",
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={submitting ? undefined : onClose}
              disabled={submitting}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: colors.textPrimary,
                background: "rgba(20,18,12,0.04)",
                border: `1px solid ${colors.border}`,
                cursor: submitting ? "default" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 10,
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#fff",
                background: canDelete ? "#8b2020" : "rgba(139,32,32,0.35)",
                border: "none",
                cursor: canDelete ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                boxShadow: canDelete ? "0 2px 10px rgba(139,32,32,0.20)" : "none",
              }}
            >
              {submitting ? (
                <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Deleting…</>
              ) : (
                "Delete booth"
              )}
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
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

// ─── Subtitle helper ───────────────────────────────────────────────────────────
// Five-case graceful variant per session-45 scoping:
//   0 booths         → return null (empty state handles the story)
//   1 booth, 1 mall  → "1 booth at {mallName}"
//   N booths, 1 mall → "{N} booths at {mallName}"
//   1 booth, M malls → "1 booth across {M} locations" (degenerate but fine)
//   N booths, M≥2    → "{N} booths across {M} locations"
// Uses "locations" not "malls" — matches the <MallSheet> voice + treats
// malls as places (cartographic pin semantic).

function subtitleFor(vendors: Vendor[]): { text: string; mallName: string | null } | null {
  if (vendors.length === 0) return null;

  const mallNames = new Set<string>();
  let singleMallName: string | null = null;
  for (const v of vendors) {
    const name = v.mall?.name;
    if (name) {
      mallNames.add(name);
      singleMallName = name; // last-write-wins, only used when Set.size === 1
    }
  }

  const boothCount = vendors.length;
  const boothWord  = boothCount === 1 ? "booth" : "booths";

  if (mallNames.size <= 1 && singleMallName) {
    return { text: `${boothCount} ${boothWord} at ${singleMallName}`, mallName: singleMallName };
  }
  return { text: `${boothCount} ${boothWord} across ${mallNames.size} locations`, mallName: null };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoothsPage() {
  const [vendors,       setVendors]       = useState<Vendor[]>([]);
  const [malls,         setMalls]         = useState<Mall[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState<User | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [addBoothOpen,  setAddBoothOpen]  = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<Vendor | null>(null);

  useEffect(() => {
    setBookmarkCount(loadBookmarkCount());
    Promise.all([
      getSession(),
      getAllVendors(),
      getAllMalls(),
    ]).then(([session, vendorList, mallList]) => {
      setUser(session?.user ?? null);
      setVendors(vendorList);
      setMalls(mallList);
      setLoading(false);
    });
  }, []);

  const subtitle = subtitleFor(vendors);

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

          {/* Cross-mall subtitle — data-driven. See subtitleFor() above. */}
          {!loading && subtitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <MapPin size={10} style={{ color: colors.textMuted }} />
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: colors.textMuted }}>
                {subtitle.text}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── Vendor list ── */}
      <main style={{ padding: "16px 15px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>

        {/* Session 44 — Add Booth primitive, admin-only.
            Partial reversal of session-37 T4b. The mall-walk workflow wants
            the Add-Booth entry point where the booth directory is, not buried
            in /admin Vendors tab. Same <AddBoothInline> primitive renders on
            both surfaces so there's no pattern duplication.

            Session 45 — onCreated's optimistic prepend still correct, but
            the shape is now "cross-mall list" rather than "single-mall list"
            so the prepend puts the new booth on top regardless of where
            it'd normally sort by (mall_id, booth_number). On next refetch
            it'll settle into its natural sort position. Acceptable: admin
            is likely to immediately tap the new booth to publish a find,
            not refresh the directory. */}
        <AdminOnly user={user}>
          <AddBoothInline
            malls={malls}
            open={addBoothOpen}
            onToggle={() => setAddBoothOpen(v => !v)}
            onClose={() => setAddBoothOpen(false)}
            onCreated={(vendor) => {
              // Hydrate the mall join on the freshly-created vendor so the
              // card's fallback subtitle (mall name) renders without waiting
              // for a refetch. createVendor() returns the bare row — no join.
              const hydrated: Vendor = {
                ...vendor,
                mall: malls.find(m => m.id === vendor.mall_id),
              };
              setVendors(prev => [hydrated, ...prev]);
              setAddBoothOpen(false);
            }}
          />
        </AdminOnly>

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
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                index={i}
                user={user}
                onRequestDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      {/* Delete confirm sheet — admin-only, typed-name gate. */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteBoothSheet
            key={deleteTarget.id}
            vendor={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={(vendorId) => {
              setVendors(prev => prev.filter(v => v.id !== vendorId));
              setDeleteTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(225,220,210,0.7) 25%, rgba(208,202,190,0.9) 50%, rgba(225,220,210,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
