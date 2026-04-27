// app/shelves/page.tsx
// Booths — cross-mall vendor booth directory.
//
// Session 67 — opened from admin-only to all users. Three changes:
//   1. AddBoothInline removed (admins use the masthead Admin pill → /admin).
//   2. Filter chip row above the first mall section: All booths · Bookmarked (n).
//      Chip row hidden entirely when bookmarkedIds is empty (D9).
//   3. Each non-admin VendorCard hero gets a <BookmarkBoothBubble> (top-right,
//      28px frosted bubble). Admin tiles already carry Pencil + Trash bubbles
//      in the same corner; bookmark hidden on admin tiles to keep the chrome
//      uncluttered. Admin can still bookmark via the /shelf/[slug] masthead.
//
// v1.2 redesign (session 49) — migrated from v0.2 Georgia + legacy colors to
// v1.2 tokens (v1.*, FONT_IM_FELL, StickyMasthead). Layout: 2-column grid
// (Option B from booths-v1-2-options.html mockup).
//
// Session 45 (2026-04-22) — cross-mall fix + admin delete affordance.

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, X, Loader as LoaderIcon, AlertTriangle, Bookmark } from "lucide-react";
import { getAllVendors, getAllMalls } from "@/lib/posts";
import { getSession, isAdmin } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import { vendorHueBg, loadBookmarkCount, loadBookmarkedBoothIds, boothBookmarkKey } from "@/lib/utils";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { track } from "@/lib/clientEvents";
import AdminOnly from "@/components/AdminOnly";
import BookmarkBoothBubble from "@/components/BookmarkBoothBubble";
import BottomNav from "@/components/BottomNav";
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

// ─── Grid card ────────────────────────────────────────────────────────────────

function VendorCard({
  vendor,
  index,
  user,
  saved,
  onToggleBookmark,
  onRequestDelete,
}: {
  vendor: Vendor;
  index: number;
  user: User | null;
  saved: boolean;
  onToggleBookmark: (vendorId: string) => void;
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
        style={{
          borderRadius: 12,
          overflow: "hidden",
          background: v1.inkWash,
          border: `1px solid ${v1.inkHairline}`,
          boxShadow: "0 1px 6px rgba(42,26,10,0.06)",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Square hero */}
        <div style={{ aspectRatio: "1 / 1", position: "relative", overflow: "hidden" }}>
          {hasHero
            ? <img src={heroUrl!} alt="" onError={() => setImgErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: vendorHueBg(vendor.display_name) }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,14,6,0.52) 0%, transparent 55%)" }} />

          {/* Session 69 — Booth NN photo-overlay pill retired. The booth number
              now lives as a small-caps eyebrow above the vendor name in the card
              body (Option B), unifying the three pieces ("Booth" + number + name)
              into one coherent label per docs/caption-and-booth-label-design.md. */}

          {/* Session 67 — bookmark bubble for non-admins. Admin tiles already
              carry Pencil + Trash in the top-right; bookmark hidden there to
              avoid 4-bubble pile-up. Admin can bookmark via /shelf/[slug]. */}
          {!adminUser && (
            <div style={{ position: "absolute", top: 6, right: 6, zIndex: 3 }}>
              <BookmarkBoothBubble
                saved={saved}
                size="tile"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(vendor.id);
                }}
              />
            </div>
          )}

          <AdminOnly user={user}>
            {!vendor.user_id && (
              <button
                onClick={handleDeleteTap}
                aria-label={`Delete ${vendor.display_name}`}
                style={{ position: "absolute", top: 7, right: 38, zIndex: 10, width: 26, height: 26, borderRadius: "50%", background: "rgba(20,14,6,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
              >
                <Trash2 size={10} style={{ color: "rgba(255,255,255,0.88)" }} />
              </button>
            )}
            <Link
              href={`/vendor/${vendor.slug}`}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: 7, right: 8, zIndex: 10, width: 26, height: 26, borderRadius: "50%", background: "rgba(20,14,6,0.52)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              <Pencil size={10} style={{ color: "rgba(255,255,255,0.88)" }} />
            </Link>
          </AdminOnly>
        </div>

        {/* Info — Session 70 round 2 Variant B lockup: vendor name on left,
            "Booth" small-caps + IM Fell numeral stacked on right. Tile width
            is tighter than Find Map / Find Detail so the numeral scales to
            20px (vs the spec's 26px on those surfaces); vendor stays at 14px
            for tile-tile parity with bio below. Lockup structure identical. */}
        <div style={{ padding: "9px 10px 11px" }}>
          <div style={{ display: "grid", gridTemplateColumns: vendor.booth_number ? "1fr auto" : "1fr", columnGap: 10, alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_IM_FELL, fontSize: 14, color: v1.inkPrimary, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {vendor.display_name}
              </div>
              {/* Session 67 — mall name removed from tile subtitle (already
                  grouped under a mall section header on /shelves). Bio still
                  renders when set; otherwise subtitle line is omitted. */}
              {vendor.bio && (
                <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 10, color: v1.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                  {vendor.bio}
                </div>
              )}
            </div>
            {vendor.booth_number && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1 }}>
                <div style={{ fontFamily: FONT_SYS, fontSize: 9, fontWeight: 700, color: v1.inkMuted, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>
                  Booth
                </div>
                <div style={{ fontFamily: FONT_IM_FELL, fontSize: 20, color: v1.inkPrimary, lineHeight: 1, letterSpacing: "-0.01em" }}>
                  {vendor.booth_number}
                </div>
              </div>
            )}
          </div>
          {/* Session 72 — "Manage" eyebrow retired. Pencil + Trash bubbles
              top-right of the tile already signal the admin's edit/delete
              affordance; the green eyebrow was redundant and noisy. */}
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
          transition={{ duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ width: "100%", maxWidth: 430, background: sheetBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "20px 22px calc(24px + env(safe-area-inset-bottom, 0px))", boxShadow: "0 -10px 40px rgba(20,14,6,0.25)", pointerEvents: "auto", maxHeight: "85vh", overflowY: "auto" }}
        >
          <div style={{ width: 44, height: 4, borderRadius: 4, background: "rgba(42,26,10,0.22)", margin: "0 auto 18px" }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: v1.redBg, border: `1px solid ${v1.redBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={16} style={{ color: v1.red }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_IM_FELL, fontSize: 17, color: v1.inkPrimary, lineHeight: 1.3 }}>
                Delete this booth?
              </div>
              <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 13, color: v1.inkMuted, lineHeight: 1.55, marginTop: 4 }}>
                Removes the booth, every find posted to it, and all photos. This cannot be undone.
              </div>
            </div>
            <button onClick={submitting ? undefined : onClose} aria-label="Close" disabled={submitting}
              style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(42,26,10,0.04)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: submitting ? "default" : "pointer", flexShrink: 0 }}>
              <X size={14} style={{ color: v1.inkMuted }} />
            </button>
          </div>

          <div style={{ padding: "12px 14px", background: "rgba(42,26,10,0.03)", borderRadius: 10, border: `1px solid ${borderC}`, marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_IM_FELL, fontSize: 15, color: v1.inkPrimary, lineHeight: 1.3 }}>{vendor.display_name}</div>
            <div style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 12, color: v1.inkMuted, lineHeight: 1.5, marginTop: 3 }}>
              {vendor.mall?.name ?? "Unknown mall"}{vendor.booth_number ? ` · Booth ${vendor.booth_number}` : ""}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 12, color: v1.inkMuted, lineHeight: 1.4, marginBottom: 6 }}>
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

// ─── Grid skeleton ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${v1.inkHairline}` }}>
      <div className="skeleton-shimmer" style={{ aspectRatio: "1 / 1" }} />
      <div style={{ padding: "9px 10px 11px", display: "flex", flexDirection: "column", gap: 5 }}>
        <div className="skeleton-shimmer" style={{ height: 12, width: "70%", borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ height: 10, width: "50%", borderRadius: 5 }} />
      </div>
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
          across Home / Booths / Find Map. Replaces the prior local subtitle. */}
      {!loading && (
        <MallScopeHeader
          eyebrowAll={scopeEyebrowAll}
          eyebrowOne={scopeEyebrowOne}
          count={boothCount}
          mallName={selectedMall?.name ?? null}
          geoLine={scopeGeoLine}
          onTap={() => setMallSheetOpen(true)}
        />
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
              {bookmarkedIds.size}
            </span>
          </button>
        </div>
      )}

      <main style={{ padding: "14px 14px 0", paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))" }}>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : visibleVendors.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 32px 0", textAlign: "center" }}>
            <div style={{ fontFamily: FONT_IM_FELL, fontSize: 20, color: v1.inkPrimary, lineHeight: 1.3, marginBottom: 10 }}>
              No booths yet
            </div>
            <p style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 14, color: v1.inkMuted, lineHeight: 1.75, maxWidth: 230, margin: 0 }}>
              Booths will appear here once vendors start posting their finds.
            </p>
          </motion.div>
        ) : (
          <>
            {savedMallId ? (
              // D4 — mall picked, render flat grid (no per-mall section headers).
              // The MallScopeHeader above already names the mall.
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {visibleVendors.map((vendor, i) => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    index={i}
                    user={user}
                    saved={bookmarkedIds.has(vendor.id)}
                    onToggleBookmark={handleToggleBookmark}
                    onRequestDelete={setDeleteTarget}
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
                    <span style={{ fontFamily: FONT_IM_FELL, fontSize: 15, color: v1.inkPrimary, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                      {group.mallName}
                    </span>
                    <AdminOnly user={user}>
                      {groupMall?.status && groupMall.status !== "active" && (
                        <MallStatusPill status={groupMall.status} />
                      )}
                    </AdminOnly>
                    <div style={{ flex: 1, height: 1, background: v1.inkHairline }} />
                    <span style={{ fontFamily: FONT_IM_FELL, fontStyle: "italic", fontSize: 11, color: v1.inkMuted, whiteSpace: "nowrap" }}>
                      {group.vendors.length} {group.vendors.length === 1 ? "booth" : "booths"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {group.vendors.map((vendor, i) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        index={i}
                        user={user}
                        saved={bookmarkedIds.has(vendor.id)}
                        onToggleBookmark={handleToggleBookmark}
                        onRequestDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </div>
                );
              })
            )}
          </>
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
        .skeleton-shimmer { background: linear-gradient(90deg, rgba(208,200,182,0.7) 25%, rgba(192,184,166,0.9) 50%, rgba(208,200,182,0.7) 75%); background-size: 800px 100%; animation: shimmer 1.6s infinite linear; }
      `}</style>
    </div>
  );
}
