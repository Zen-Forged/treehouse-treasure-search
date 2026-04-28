// app/shelves/page.tsx
// Booths — cross-mall vendor booth directory.
//
// Session 80 — Option C2 row pattern (docs/booths-row-pattern-design.md).
// Photo retired from the directory; each booth is now a single full-width
// row with bookmark on the far left, vendor name in the middle, "BOOTH N"
// stack on the right. Track D phase 5 source layoutId retired (no photo
// means no source motion.div); destination layoutId on /shelf/[slug]
// BoothHero is preserved and graceful-no-ops the morph when no source.
// Bookmark icon is rendered inline (no bubble) since the row card itself
// is the affordance container.
//
// Session 67 — opened from admin-only to all users. Filter chip row above
// the first mall section: All booths · Bookmarked (n). Chip row hidden
// entirely when bookmarkedIds is empty (D9). Bookmark hidden on admin
// rows to keep chrome uncluttered (session 67 D10 + session 80 D8); admin
// reaches bookmark via /shelf/[slug] BoothHero (item 4 of session 80).
//
// Session 45 (2026-04-22) — cross-mall fix + admin delete affordance.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, X, Loader as LoaderIcon, AlertTriangle, Bookmark } from "lucide-react";
import { getAllVendors, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import {
  v1,
  FONT_LORA,
  FONT_SYS,
  MOTION_EASE_OUT,
  MOTION_CARD_DURATION,
  MOTION_STAGGER,
  MOTION_STAGGER_MAX,
  MOTION_EMPTY_DURATION,
} from "@/lib/tokens";
import { loadBookmarkCount, loadBookmarkedBoothIds, boothBookmarkKey } from "@/lib/utils";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { track } from "@/lib/clientEvents";
import AdminOnly from "@/components/AdminOnly";
import AddBoothSheet from "@/components/AddBoothSheet";
import AddBoothTile from "@/components/AddBoothTile";
import BoothLockupCard from "@/components/BoothLockupCard";
import BottomNav from "@/components/BottomNav";
import EditBoothSheet from "@/components/EditBoothSheet";
import MallSheet from "@/components/MallSheet";
import MallScopeHeader, { type MallScopeGeoLine } from "@/components/MallScopeHeader";
import StickyMasthead from "@/components/StickyMasthead";
import type { Vendor, Mall, MallStatus } from "@/types/treehouse";
import type { User } from "@supabase/supabase-js";

// R4c — small inline pill to surface mall status in the admin-only
// cross-mall booth browser. Active malls stay unadorned (the default);
// only `draft` and `coming_soon` render the pill.
const MALL_STATUS_LABEL: Record<MallStatus, string> = {
  active: "Active",
  coming_soon: "Coming soon",
  draft: "Draft",
};

function MallStatusPill({ status }: { status: MallStatus }) {
  if (status === "active") return null;
  const isSoon = status === "coming_soon";
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.9px",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 999,
        background: isSoon ? v1.amberBg : "rgba(42,26,10,0.05)",
        color: isSoon ? v1.amber : v1.inkMuted,
        border: `1px solid ${isSoon ? v1.amberBorder : v1.inkHairline}`,
        whiteSpace: "nowrap",
      }}
    >
      {MALL_STATUS_LABEL[status]}
    </span>
  );
}

// ─── Booth row (session 80 — Option C2) ──────────────────────────────────────
//
// Single full-width row per booth. Bookmark on the far left (shopper) /
// blank spacer (admin per session 67 D10), vendor name in the middle,
// admin Pencil + Trash inline before the booth stack, "BOOTH N" stack on
// the right. See docs/booths-row-pattern-design.md.

function VendorCard({
  vendor,
  index,
  user,
  saved,
  onToggleBookmark,
  onRequestDelete,
  onRequestEdit,
}: {
  vendor: Vendor;
  index: number;
  user: User | null;
  saved: boolean;
  onToggleBookmark: (vendorId: string) => void;
  onRequestDelete: (vendor: Vendor) => void;
  onRequestEdit:   (vendor: Vendor) => void;
}) {
  const router = useRouter();
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

  function handleEditTap(e: React.MouseEvent) {
    e.stopPropagation();
    onRequestEdit(vendor);
  }

  function handleBookmarkTap(e: React.MouseEvent) {
    e.stopPropagation();
    onToggleBookmark(vendor.id);
  }

  // Session 82 — admin chrome (Pencil + Trash) slot, only renders for admins.
  // Trash only when !user_id (booth isn't claimed yet — matches admin behavior).
  const adminChrome = adminUser ? (
    <>
      <button
        type="button"
        onClick={handleEditTap}
        aria-label={`Edit ${vendor.display_name}`}
        style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "rgba(42,26,10,0.04)",
          border: `1px solid ${v1.inkHairline}`,
          padding: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Pencil size={12} strokeWidth={1.7} style={{ color: v1.inkMid }} />
      </button>
      {!vendor.user_id && (
        <button
          type="button"
          onClick={handleDeleteTap}
          aria-label={`Delete ${vendor.display_name}`}
          style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(139,32,32,0.06)",
            border: `1px solid ${v1.redBorder}`,
            padding: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <Trash2 size={12} strokeWidth={1.7} style={{ color: v1.red }} />
        </button>
      )}
    </>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION_CARD_DURATION,
        delay: Math.min(index * MOTION_STAGGER, MOTION_STAGGER_MAX),
        ease: MOTION_EASE_OUT,
      }}
      whileTap={{ scale: 0.99 }}
      onClick={handleCardTap}
      style={{ cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
    >
      <BoothLockupCard
        vendorName={vendor.display_name}
        boothNumber={vendor.booth_number ?? null}
        bookmark={!adminUser ? { saved, onToggle: () => onToggleBookmark(vendor.id) } : null}
        adminChrome={adminChrome}
      />
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
  const [typedName,  setTypedName]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const canDelete = typedName.trim() === vendor.display_name.trim() && !submitting;

  async function handleDelete() {
    if (!canDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      const res  = await authFetch("/api/admin/vendors", { method: "DELETE", body: JSON.stringify({ vendorId: vendor.id }) });
      const json = await res.json();
      if (!res.ok || !json.ok) { setError(json.error ?? `HTTP ${res.status}`); setSubmitting(false); return; }
      onDeleted(vendor.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const sheetBg  = v1.paperCream;
  const borderC  = v1.inkHairline;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={submitting ? undefined : onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(20,14,6,0.52)", zIndex: 200, cursor: submitting ? "default" : "pointer" }}
      />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 201, display: "flex", alignItems: "flex-end", justifyContent: "center", pointerEvents: "none" }}>
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ duration: MOTION_EMPTY_DURATION, ease: MOTION_EASE_OUT }}
          style={{ width: "100%", maxWidth: 430, background: sheetBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 22px calc(24px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -10px 40px rgba(20,14,6,0.25)", pointerEvents: "auto", maxHeight: "85vh", overflowY: "auto" }}
        >
          <div style={{ width: 44, height: 4, borderRadius: 4, background: "rgba(42,26,10,0.22)", margin: "0 auto 18px" }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: v1.redBg, border: `1px solid ${v1.redBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={16} style={{ color: v1.red }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_LORA, fontSize: 17, color: v1.inkPrimary, lineHeight: 1.3 }}>
                Delete this booth?
              </div>
              <div style={{ fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 13, color: v1.inkMuted, lineHeight: 1.55, marginTop: 4 }}>
                Removes the booth, every find posted to it, and all photos. This cannot be undone.
              </div>
            </div>
            <button onClick={submitting ? undefined : onClose} aria-label="Close" disabled={submitting}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(42,26,10,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: submitting ? "default" : "pointer", flexShrink: 0 }}>
              <X size={14} style={{ color: v1.inkMuted }} />
            </button>
          </div>

          <div style={{ padding: "12px 14px", background: "rgba(42,26,10,0.03)", borderRadius: 10, border: `1px solid ${borderC}`, marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_LORA, fontSize: 15, color: v1.inkPrimary, lineHeight: 1.3 }}>{vendor.display_name}</div>
            <div style={{ fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 12, color: v1.inkMuted, lineHeight: 1.5, marginTop: 3 }}>
              {vendor.mall?.name ?? "Unknown location"}{vendor.booth_number ? ` · Booth ${vendor.booth_number}` : ""}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 12, color: v1.inkMuted, lineHeight: 1.4, marginBottom: 6 }}>
              Type <span style={{ fontStyle: "normal", fontWeight: 700, color: v1.inkPrimary }}>{vendor.display_name}</span> to confirm.
            </label>
            <input
              type="text" value={typedName} onChange={e => setTypedName(e.target.value)}
              placeholder={vendor.display_name} autoComplete="off" autoCorrect="off"
              autoCapitalize="off" spellCheck={false} disabled={submitting}
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 10, background: v1.inkWash, border: `1px solid ${borderC}`, color: v1.inkPrimary, fontSize: 14, fontFamily: "system-ui, -apple-system, sans-serif", outline: "none", appearance: "none", WebkitAppearance: "none" }}
            />
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 9, background: v1.redBg, border: `1px solid ${v1.redBorder}`, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 12, color: v1.red, lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submitting ? undefined : onClose} disabled={submitting}
              style={{ flex: 1, padding: "12px", borderRadius: 10, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 500, color: v1.inkPrimary, background: "rgba(42,26,10,0.04)", border: `1px solid ${borderC}`, cursor: submitting ? "default" : "pointer" }}>
              Cancel
            </button>
            <button onClick={handleDelete} disabled={!canDelete}
              style={{ flex: 1, padding: "12px", borderRadius: 10, fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13, fontWeight: 500, color: "#fff", background: canDelete ? v1.red : "rgba(139,32,32,0.35)", border: "none", cursor: canDelete ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: canDelete ? "0 2px 10px rgba(139,32,32,0.20)" : "none" }}>
              {submitting ? <><LoaderIcon size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Deleting…</> : "Delete booth"}
            </button>
          </div>
        </motion.div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
}

// ─── Row skeleton (session 80) ──────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      style={{
        background: v1.inkWash,
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div className="skeleton-shimmer" style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0 }} />
      <div className="skeleton-shimmer" style={{ flex: 1, height: 16, borderRadius: 5 }} />
      <div className="skeleton-shimmer" style={{ width: 40, height: 26, borderRadius: 5, flexShrink: 0 }} />
    </div>
  );
}

// ─── Mall grouping helper ──────────────────────────────────────────────────────
// Groups vendors by mall, preserving the order of first appearance. Vendors
// without a mall fall into a final "Other" bucket.

function groupByMall(vendors: Vendor[]): { mallId: string | null; mallName: string; vendors: Vendor[] }[] {
  const map = new Map<string, { mallId: string | null; mallName: string; vendors: Vendor[] }>();
  for (const vendor of vendors) {
    const key  = vendor.mall_id ?? "__none__";
    const name = vendor.mall?.name ?? "Other";
    if (!map.has(key)) {
      map.set(key, { mallId: vendor.mall_id ?? null, mallName: name, vendors: [] });
    }
    map.get(key)!.vendors.push(vendor);
  }
  return Array.from(map.values());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BoothsPage() {
  const [vendors,        setVendors]        = useState<Vendor[]>([]);
  const [malls,          setMalls]          = useState<Mall[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [user,           setUser]           = useState<User | null>(null);
  const [bookmarkCount,  setBookmarkCount]  = useState(0);
  const [bookmarkedIds,  setBookmarkedIds]  = useState<Set<string>>(new Set());
  const [filter,         setFilter]         = useState<"all" | "bookmarked">("all");
  const [deleteTarget,   setDeleteTarget]   = useState<Vendor | null>(null);
  const [editTarget,     setEditTarget]     = useState<Vendor | null>(null);
  const [addSheetOpen,   setAddSheetOpen]   = useState(false);
  const [savedMallId,    setSavedMallId]    = useSavedMallId();
  const [mallSheetOpen,  setMallSheetOpen]  = useState(false);

  useEffect(() => {
    setBookmarkCount(loadBookmarkCount());
    setBookmarkedIds(loadBookmarkedBoothIds());
    Promise.all([getSession(), getAllVendors(), getAllMalls()]).then(([session, vendorList, mallList]) => {
      setUser(session?.user ?? null);
      setVendors(vendorList);
      setMalls(mallList);
      setLoading(false);
    });
  }, []);

  // Toggle a booth bookmark in localStorage and the in-memory set.
  function handleToggleBookmark(vendorId: string) {
    const vendorSlug = vendors.find(v => v.id === vendorId)?.slug ?? null;
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      const wasBookmarked = next.has(vendorId);
      if (wasBookmarked) {
        next.delete(vendorId);
        try { localStorage.removeItem(boothBookmarkKey(vendorId)); } catch {}
      } else {
        next.add(vendorId);
        try { localStorage.setItem(boothBookmarkKey(vendorId), "1"); } catch {}
      }
      // R3 v1.1 — emit booth_bookmarked / booth_unbookmarked.
      track(wasBookmarked ? "booth_unbookmarked" : "booth_bookmarked", {
        vendor_slug: vendorSlug,
      });
      return next;
    });
  }

  // Mall filter (cross-tab persisted via useSavedMallId) is the outer scope.
  // Bookmark filter (this-page-only) composes inside it via intersection.
  const mallScopedVendors = savedMallId
    ? vendors.filter(v => v.mall_id === savedMallId)
    : vendors;

  // D9 — when no bookmarks exist (within the active mall scope), the chip row
  // hides AND any active filter collapses back to "all" so the user doesn't
  // end up looking at an empty grid behind a hidden filter chip.
  const bookmarkedInScopeCount = mallScopedVendors.filter(v => bookmarkedIds.has(v.id)).length;
  const effectiveFilter  = bookmarkedInScopeCount === 0 ? "all" : filter;
  const visibleVendors   = effectiveFilter === "bookmarked"
    ? mallScopedVendors.filter(v => bookmarkedIds.has(v.id))
    : mallScopedVendors;
  const showFilterChips  = bookmarkedInScopeCount > 0;

  // Per-mall vendor counts for the MallSheet picker. Counts every vendor
  // (independent of the bookmark filter), so picking a mall from the sheet
  // shows you "how many booths" at each location.
  const vendorCountsByMall: Record<string, number> = {};
  for (const v of vendors) {
    if (v.mall_id) vendorCountsByMall[v.mall_id] = (vendorCountsByMall[v.mall_id] ?? 0) + 1;
  }

  // The picker only shows active malls (matches Home). Non-active mall content
  // is still loaded for admin section-header pills, but a non-active mall
  // wouldn't be a useful filter target.
  const mallsForPicker = malls.filter(m => m.status === "active");
  const selectedMall = malls.find(m => m.id === savedMallId) ?? null;

  // Session 70 round 2 — count merges into eyebrow per David's QA feedback;
  // geoLine becomes the address (filtered) or italic Kentucky (all-malls)
  // matching Home's pattern so the address is reachable from any primary tab.
  const boothCount = mallScopedVendors.length;
  const boothNoun = boothCount === 1 ? "booth" : "booths";
  const scopeEyebrowAll = `${boothNoun} across`;
  const scopeEyebrowOne = `${boothNoun} at`;

  const scopeGeoLine: MallScopeGeoLine =
    savedMallId && selectedMall
      ? (() => {
          const address = selectedMall.address ?? null;
          const cityLine = selectedMall.city
            ? `${selectedMall.city}${selectedMall.state ? `, ${selectedMall.state}` : ""}`
            : null;
          const text = address ?? cityLine ?? "";
          if (!text) return null;
          const href = `https://maps.apple.com/?q=${encodeURIComponent(
            address ?? `${selectedMall.name} ${selectedMall.city ?? ""} ${selectedMall.state ?? ""}`
          )}`;
          return { kind: "address" as const, text, href };
        })()
      : { kind: "italic" as const, text: "Kentucky & Southern Indiana" };

  function handleMallSelect(nextMallId: string | null) {
    setSavedMallId(nextMallId);
    setMallSheetOpen(false);
    // R3 v1.1 — filter_applied event. Mirrors Home; `page` field distinguishes
    // adoption per primary tab.
    const mallSlug = nextMallId
      ? (malls.find(m => m.id === nextMallId)?.slug ?? null)
      : null;
    track("filter_applied", {
      filter_type:  "mall",
      filter_value: mallSlug ?? "all",
      page:         "/shelves",
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: v1.paperCream, maxWidth: 430, margin: "0 auto", position: "relative" }}>

      {/* Session 72 — admin entry retired from masthead; admin now reaches
          /admin via the dedicated Admin tab in BottomNav. */}
      <StickyMasthead />

      {/* Mall scope header — eyebrow + tappable mall name + chevron + italic
          count line. Single source of truth for "what mall am I looking at?"
          across Home / Booths / Find Map. Replaces the prior local subtitle.
          Session 80 — gains the same fade-up entrance animation that Home and
          /flagged carry on their MallScopeHeader so the three primary tabs
          have matching first-paint behavior. */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.04, ease: MOTION_EASE_OUT }}
        >
          <MallScopeHeader
            eyebrowAll={scopeEyebrowAll}
            eyebrowOne={scopeEyebrowOne}
            count={boothCount}
            mallName={selectedMall?.name ?? null}
            geoLine={scopeGeoLine}
            onTap={() => setMallSheetOpen(true)}
          />
        </motion.div>
      )}

      {/* Filter chip row — All booths · Bookmarked (n). Hidden entirely when
          bookmarkedIds is empty (D9). Sits below the subtitle, above the main
          grid, scrolls with content. */}
      {showFilterChips && (
        <div style={{ display: "flex", gap: 8, padding: "10px 14px 0" }}>
          <button
            type="button"
            onClick={() => setFilter("all")}
            style={{
              fontFamily: FONT_SYS, fontSize: 11, fontWeight: 500,
              padding: "5px 11px", borderRadius: 999,
              background: effectiveFilter === "all" ? v1.green : "rgba(42,26,10,0.04)",
              border: `1px solid ${effectiveFilter === "all" ? v1.green : v1.inkHairline}`,
              color: effectiveFilter === "all" ? "#fff" : v1.inkMid,
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          >
            All booths
          </button>
          <button
            type="button"
            onClick={() => setFilter("bookmarked")}
            style={{
              fontFamily: FONT_SYS, fontSize: 11, fontWeight: 500,
              padding: "5px 11px 5px 9px", borderRadius: 999,
              background: effectiveFilter === "bookmarked" ? v1.green : "rgba(42,26,10,0.04)",
              border: `1px solid ${effectiveFilter === "bookmarked" ? v1.green : v1.inkHairline}`,
              color: effectiveFilter === "bookmarked" ? "#fff" : v1.inkMid,
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <Bookmark size={10} strokeWidth={2} />
            Bookmarked
            <span style={{
              fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
              fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 999,
              background: effectiveFilter === "bookmarked" ? "rgba(255,255,255,0.18)" : "rgba(42,26,10,0.10)",
              color:      effectiveFilter === "bookmarked" ? "#fff" : v1.inkMid,
            }}>
              {bookmarkedInScopeCount}
            </span>
          </button>
        </div>
      )}

      <main style={{ padding: "14px 14px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : visibleVendors.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_LORA, fontSize: 20, color: v1.inkPrimary, lineHeight: 1.3, marginBottom: 10 }}>
              No booths yet
            </div>
            <p style={{ fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 14, color: v1.inkMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
              Booths will appear here once vendors start posting their finds.
            </p>
          </motion.div>
        ) : (
          <>
            {savedMallId ? (
              // Mall picked, render flat row list (no per-mall section headers).
              // The MallScopeHeader above already names the mall. Session 80 —
              // grid retired in favor of single-column row pattern.
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visibleVendors.map((vendor, i) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    index={i}
                    user={user}
                    saved={bookmarkedIds.has(vendor.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onRequestDelete={setDeleteTarget}
                    onRequestEdit={setEditTarget}
                  />
                ))}
              </div>
            ) : (
              // All malls — preserve grouped-by-mall layout with section headers.
              groupByMall(visibleVendors).map((group, groupIdx) => {
                // R4c — for admins, surface mall lifecycle status alongside the
                // group header so the non-active mall's group reads honestly as
                // a staging area, not a live listing.
                const groupMall = group.mallId ? malls.find(m => m.id === group.mallId) : undefined;
                return (
                <div key={group.mallName}>
                  {/* Section header — IM Fell name + hairline rule + booth count */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: groupIdx === 0 ? 0 : 20, paddingBottom: 10 }}>
                    <span style={{ fontFamily: FONT_LORA, fontSize: 15, color: v1.inkPrimary, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                      {group.mallName}
                    </span>
                    <AdminOnly user={user}>
                      {groupMall?.status && groupMall.status !== "active" && (
                        <MallStatusPill status={groupMall.status} />
                      )}
                    </AdminOnly>
                    <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
                    <span style={{ fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 11, color: v1.inkMuted, whiteSpace: "nowrap" }}>
                      {group.vendors.length} {group.vendors.length === 1 ? "booth" : "booths"}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {group.vendors.map((vendor, i) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        index={i}
                        user={user}
                        saved={bookmarkedIds.has(vendor.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onRequestDelete={setDeleteTarget}
                        onRequestEdit={setEditTarget}
                      />
                    ))}
                  </div>
                </div>
                );
              })
            )}
          </>
        )}

        {/* Admin-only "Add a booth" affordance — sits below all mall sections.
            Session 80 — converted to a full-width dashed row matching the
            new row pattern (docs/booths-row-pattern-design.md D9). */}
        {!loading && (
          <AdminOnly user={user}>
            <div style={{ marginTop: 16 }}>
              <AddBoothTile onTap={() => setAddSheetOpen(true)} />
            </div>
          </AdminOnly>
        )}
      </main>

      <MallSheet
        open={mallSheetOpen}
        onClose={() => setMallSheetOpen(false)}
        malls={mallsForPicker}
        activeMallId={savedMallId}
        onSelect={handleMallSelect}
        findCounts={vendorCountsByMall}
        countUnit={{ singular: "booth", plural: "booths" }}
      />

      <BottomNav active="shelves" flaggedCount={bookmarkCount} />

      <AnimatePresence>
        {deleteTarget && (
          <DeleteBoothSheet
            key={`delete-${deleteTarget.id}`}
            vendor={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={(vendorId) => {
              setVendors(prev => prev.filter(v => v.id !== vendorId));
              setDeleteTarget(null);
            }}
          />
        )}
        {editTarget && (
          <EditBoothSheet
            key={`edit-${editTarget.id}`}
            vendor={editTarget}
            malls={malls}
            onClose={() => setEditTarget(null)}
            onUpdated={(updated) => {
              setVendors(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
              setEditTarget(null);
            }}
          />
        )}
        {addSheetOpen && (
          <AddBoothSheet
            key="add-booth"
            malls={malls}
            initialMallId={savedMallId}
            onClose={() => setAddSheetOpen(false)}
            onCreated={(created) => {
              // Hydrate mall side-table on the new vendor so groupByMall
              // buckets it correctly without a refetch.
              const mall = malls.find(m => m.id === created.mall_id) ?? null;
              const hydrated: Vendor = mall ? { ...created, mall } : created;
              setVendors(prev => [...prev, hydrated]);
              setAddSheetOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(208,200,182,0.7) 25%, rgba(192,184,166,0.9) 50%, rgba(208,200,182,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
