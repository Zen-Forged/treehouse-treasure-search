// components/admin/VendorsTab.tsx
// Arc 4 of login refactor — admin Vendors tab. Frame B accordion (D7) over
// every vendors row with chip-filter scope + status sub-filters. Owns its
// own fetch + state lifecycle.
//
// Mounted on /admin (6th tab, session 126 Arc 3.1) and /vendors-test
// smoke route. Session 130 retired the `isCollision` predicate +
// "Collision" chip + leaf-accent visual (was D3/D10) — DB enforces
// (mall_id, booth_number) uniqueness on `vendors`, so true collisions
// can't exist there; the predicate was detecting booth_name drift,
// which is informational rather than a problem state.

"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";
import { getAllMalls } from "@/lib/posts";
import type { Mall, Vendor } from "@/types/treehouse";
import EditBoothSheet from "@/components/EditBoothSheet";
import ForceUnlinkConfirm from "@/components/admin/ForceUnlinkConfirm";
import ForceDeleteConfirm from "@/components/admin/ForceDeleteConfirm";
import RelinkSheet from "@/components/admin/RelinkSheet";
import InviteVendorSheet from "@/components/admin/InviteVendorSheet";
import AddBoothSheet from "@/components/AddBoothSheet";

// ─── Types ───────────────────────────────────────────────────────────────────

type VendorMall = {
  id:      string;
  name:    string;
  slug:    string;
  city:    string | null;
  state:   string | null;
  address: string | null;
  status:  string | null;
};

type DiagnosisRequest = {
  id:         string;
  name:       string;
  booth_name: string | null;
  email:      string;
  status:     "pending" | "approved" | "denied";
  created_at: string;
};

export type VendorRow = {
  id:                string;
  display_name:      string;
  slug:              string;
  booth_number:      string | null;
  mall_id:           string;
  user_id:           string | null;
  hero_image_url:    string | null;
  created_at:        string;
  mall:              VendorMall | null;
  posts_count:       number;
  linked_user_email: string | null;
  diagnosis: {
    matchingRequest: DiagnosisRequest | null;
    authUserExists:  boolean;
  } | null;
};

type Counts = {
  total:       number;
  linked:      number;
  unlinked:    number;
  problematic: number;
};

type Scope = "problematic" | "all";
type StatusKey = "unlinked";

// ─── Visual tokens — locked at design record D3 ────────────────────────────
//
// Distinct from v1.{green,red,amber} because design record D3 specifies
// warmer/softer values calibrated for the Vendors-tab status pills. Locked
// per the V1 mockup at docs/mockups/admin-vendors-tab-v1.html.
//
// Session 130 — `collision` token retained but no longer drives a status
// pill (predicate retired). Now used as the destructive/error tone for
// delete-confirm modals + error toasts.

const PILL = {
  linked:    { bg: "#e7ecdf", fg: "#4a6b3a", bd: "rgba(74,107,58,0.30)" },
  unlinked:  { bg: "#f4ead4", fg: "#b6843a", bd: "rgba(182,132,58,0.30)" },
  collision: { bg: "#f1dad2", fg: "#a8442e", bd: "rgba(168,68,46,0.30)" },
  // Pending: user_id=null but vendor_request matches by name + booth — relink
  // succeeded, awaiting user's first sign-in. Cool muted ink so it reads as
  // "in flight, no admin action required" — distinct signal from amber's
  // "needs attention." Calibrated against PILL.linked/unlinked/collision.
  pending:   { bg: "#e8e5dc", fg: "#6e6a5e", bd: "rgba(110,106,94,0.30)" },
  // Disconnected: user_id=null + vendor_request matches by name + booth +
  // auth.users entry exists for the request email. Admin force-unlinked an
  // active vendor; auto-claim will re-attach on next sign-in (per session-127
  // Path A decision — force-unlink is a soft reset, not a hard sever).
  // Intentional amber-token reuse from PILL.unlinked (Path A + Option 1):
  // the "needs to know auto-relink is incoming" semantic still belongs in
  // amber's "be aware" register; the pill copy carries the disambiguation.
  disconnected: { bg: "#f4ead4", fg: "#b6843a", bd: "rgba(182,132,58,0.30)" },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function isProblematic(v: VendorRow): boolean {
  // D2 (refined post-Arc-2.4 QA, 2026-05-08) — "problematic" means needs
  // admin action. user_id=null is necessary but not sufficient: a successfully-
  // relinked row whose request.email has no auth user yet stays user_id=null
  // (session-123 auto-claim attaches on first sign-in) — that's expected
  // pending state, not problematic. Two classes of user_id=null surface
  // here after session 130's collision retire:
  //   1. Orphan (no matching request) → problematic (admin must Invite)
  //   2. Pending/Disconnected (matching request) → NOT problematic
  //      (auto-claim attaches on first/next sign-in via still-approved
  //      vendor_request)
  // Server-side `counts.problematic` mirrors this predicate.
  if (v.user_id !== null) return false;
  if (v.diagnosis?.matchingRequest === null) return true;
  return false;
}

function applyFilters(
  vendors: VendorRow[],
  scope: Scope,
  statusFilter: Set<StatusKey>,
): VendorRow[] {
  // Scope first.
  let rows = scope === "problematic" ? vendors.filter(isProblematic) : vendors;

  // Then status sub-filters (multi-select union).
  if (statusFilter.size === 0) return rows;
  return rows.filter((v) => {
    if (statusFilter.has("unlinked") && v.user_id === null) return true;
    return false;
  });
}

type RowStatus = "linked" | "unlinked" | "pending" | "disconnected";

function rowStatus(v: VendorRow): RowStatus {
  if (v.user_id !== null)       return "linked";
  // user_id IS NULL — three sub-cases:
  //   • orphan (no matching request) → "unlinked"
  //   • matching request + no auth user → "pending" (post-relink wait)
  //   • matching request + auth user exists → "disconnected" (Path A:
  //     admin force-unlinked an active vendor; auto-claim re-attaches on
  //     next sign-in via still-approved vendor_request)
  if (v.diagnosis?.matchingRequest !== null && v.diagnosis !== null) {
    return v.diagnosis.authUserExists ? "disconnected" : "pending";
  }
  return "unlinked";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VendorsTab() {
  const [vendors,  setVendors]  = useState<VendorRow[]>([]);
  const [counts,   setCounts]   = useState<Counts | null>(null);
  const [malls,    setMalls]    = useState<Mall[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // D2 default — problematic-only on tab open.
  const [scope,        setScope]        = useState<Scope>("problematic");
  const [statusFilter, setStatusFilter] = useState<Set<StatusKey>>(new Set());

  // D7 — accordion: only one row expanded at a time. null = all collapsed.
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Arc 2.3 — action modals (one open at a time).
  const [editingVendor,    setEditingVendor]   = useState<VendorRow | null>(null);
  const [unlinkingVendor,  setUnlinkingVendor] = useState<VendorRow | null>(null);
  const [deletingVendor,   setDeletingVendor]  = useState<VendorRow | null>(null);
  const [relinkingVendor,  setRelinkingVendor] = useState<VendorRow | null>(null);
  const [invitingVendor,   setInvitingVendor]  = useState<VendorRow | null>(null);
  const [addBoothOpen,     setAddBoothOpen]    = useState(false);

  // Arc 2.3 — toast (success/error). Auto-dismiss 4s success, 6s error.
  const [toast, setToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const ms = toast.kind === "error" ? 6000 : 4000;
    const t = setTimeout(() => setToast(null), ms);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Fetch helpers ──
  // D19 — re-fetch on tab activation, after every successful mutation, and
  // on filter chip toggle. fetchVendors is idempotent.
  async function fetchVendors() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/admin/vendors");
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Failed to load vendors.");
        return;
      }
      setVendors(json.vendors ?? []);
      setCounts(json.counts ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch malls + vendors in parallel on mount. Malls feeds the
      // EditBoothSheet relocation select.
      const [_, mallsRows] = await Promise.all([
        fetchVendors(),
        getAllMalls(),
      ]);
      if (cancelled) return;
      setMalls(mallsRows);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = applyFilters(vendors, scope, statusFilter);

  // Chip toggles
  function toggleStatus(key: StatusKey) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Empty-state copy (D16) ──
  let emptyCopy: string | null = null;
  if (!loading && filtered.length === 0) {
    if (scope === "all" && vendors.length === 0) emptyCopy = "No vendors yet.";
    else if (scope === "problematic" && statusFilter.size === 0)
      emptyCopy = "No vendor rows need attention. ✓";
    else emptyCopy = "No rows match the current filter.";
  }

  return (
    <div style={{ padding: "0 16px 80px" }}>

      {/* Filter strip (D11) — Problematic/All exclusive scope, Collision/Unlinked multi-select */}
      <div style={chipStripStyle}>
        <Chip
          label="Problematic"
          count={counts?.problematic ?? 0}
          on={scope === "problematic"}
          onClick={() => setScope("problematic")}
        />
        <Chip
          label="All"
          count={counts?.total ?? 0}
          on={scope === "all"}
          onClick={() => setScope("all")}
        />
        <div style={scopeDividerStyle} />
        <Chip
          label="Unlinked"
          count={counts?.unlinked ?? 0}
          on={statusFilter.has("unlinked")}
          onClick={() => toggleStatus("unlinked")}
          tone="unlinked"
        />
      </div>

      {/* + Add booth dashed-pill CTA — D6/D9. Wired Arc 3.2 to existing
          AddBoothSheet primitive (same one /shelves used pre-Arc-4). */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px 0 14px" }}>
        <button
          type="button"
          onClick={() => setAddBoothOpen(true)}
          style={addBoothPillStyle}
        >
          + Add booth
        </button>
      </div>

      {/* Body */}
      {loading && (
        <div style={messageStyle}>Loading vendors…</div>
      )}
      {!loading && error && (
        <div style={{ ...messageStyle, color: PILL.collision.fg }}>{error}</div>
      )}
      {!loading && !error && emptyCopy && (
        <div style={messageStyle}>{emptyCopy}</div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div>
          {filtered.map((v) => (
            <VendorRowAccordion
              key={v.id}
              vendor={v}
              expanded={expandedRowId === v.id}
              onToggle={() => setExpandedRowId(expandedRowId === v.id ? null : v.id)}
              onEdit={()        => setEditingVendor(v)}
              onForceUnlink={() => setUnlinkingVendor(v)}
              onDelete={()      => setDeletingVendor(v)}
              onRelink={()      => setRelinkingVendor(v)}
              onInvite={()      => setInvitingVendor(v)}
            />
          ))}
        </div>
      )}

      {/* Modals — only one active at a time. Each closes via its onClose
          handler; success handlers close + refetch + toast. */}
      {editingVendor && (
        <EditBoothSheet
          vendor={vendorRowToVendor(editingVendor)}
          malls={malls}
          mode="admin"
          onClose={() => setEditingVendor(null)}
          onUpdated={() => {
            setEditingVendor(null);
            setExpandedRowId(null);
            setToast({ kind: "success", text: "Booth updated." });
            void fetchVendors();
          }}
        />
      )}

      {unlinkingVendor && (
        <ForceUnlinkConfirm
          vendorId={unlinkingVendor.id}
          displayName={unlinkingVendor.display_name}
          linked_user_email={unlinkingVendor.linked_user_email}
          onClose={() => setUnlinkingVendor(null)}
          onUnlinked={() => {
            const name = unlinkingVendor.display_name;
            setUnlinkingVendor(null);
            setExpandedRowId(null);
            setToast({ kind: "success", text: `Unlinked ${name}.` });
            void fetchVendors();
          }}
        />
      )}

      {deletingVendor && (
        <ForceDeleteConfirm
          vendorId={deletingVendor.id}
          displayName={deletingVendor.display_name}
          postsCount={deletingVendor.posts_count}
          linked_user_email={deletingVendor.linked_user_email}
          onClose={() => setDeletingVendor(null)}
          onDeleted={() => {
            const name = deletingVendor.display_name;
            setDeletingVendor(null);
            setExpandedRowId(null);
            setToast({ kind: "success", text: `Deleted ${name}.` });
            void fetchVendors();
          }}
        />
      )}

      {relinkingVendor && (
        <RelinkSheet
          vendorId={relinkingVendor.id}
          vendorMallId={relinkingVendor.mall_id}
          vendorBoothNumber={relinkingVendor.booth_number}
          vendorDisplayName={relinkingVendor.display_name}
          onClose={() => setRelinkingVendor(null)}
          onRelinked={(newDisplayName, userIdResolved) => {
            setRelinkingVendor(null);
            setExpandedRowId(null);
            setToast({
              kind: "success",
              text: userIdResolved
                ? `Relinked to ${newDisplayName}.`
                : `Relinked to ${newDisplayName}. Awaiting first sign-in.`,
            });
            void fetchVendors();
          }}
        />
      )}

      {addBoothOpen && (
        <AddBoothSheet
          malls={malls}
          onClose={() => setAddBoothOpen(false)}
          onCreated={(vendor, note) => {
            setAddBoothOpen(false);
            setExpandedRowId(null);
            setToast({
              kind: "success",
              text: note ?? `Added ${vendor.display_name}.`,
            });
            void fetchVendors();
          }}
        />
      )}

      {invitingVendor && (
        <InviteVendorSheet
          vendorId={invitingVendor.id}
          displayName={invitingVendor.display_name}
          mallName={invitingVendor.mall?.name ?? null}
          boothNumber={invitingVendor.booth_number}
          onClose={() => setInvitingVendor(null)}
          onInvited={(email, emailSent) => {
            setInvitingVendor(null);
            setExpandedRowId(null);
            setToast({
              kind: emailSent ? "success" : "error",
              text: emailSent
                ? `Invite sent to ${email}.`
                : `Invite saved, but email failed to send. Check Resend logs.`,
            });
            void fetchVendors();
          }}
        />
      )}

      {toast && <Toast kind={toast.kind} text={toast.text} />}
    </div>
  );
}

// ─── VendorRow → Vendor adapter for EditBoothSheet ──────────────────────────
//
// EditBoothSheet expects the full Vendor type. VendorRow has a superset for
// admin-display purposes (posts_count, linked_user_email, diagnosis) but
// is missing the rarely-read fields (bio, avatar_url, facebook_url,
// updated_at). Construct a Vendor-shaped object from what we have; default
// the missing fields. EditBoothSheet only reads display_name + booth_number
// + mall_id + hero_image_url for the form, so the defaults are harmless.

function vendorRowToVendor(v: VendorRow): Vendor {
  // Drop the partial mall join — EditBoothSheet pulls full Mall rows from
  // the malls prop using mall_id, so the joined field on the vendor isn't
  // load-bearing for the form. Adding the missing Mall fields (created_at,
  // updated_at, activated_at) for the joined object would be ceremony.
  return {
    id:             v.id,
    created_at:     v.created_at,
    updated_at:     v.created_at,
    user_id:        v.user_id,
    mall_id:        v.mall_id,
    display_name:   v.display_name,
    booth_number:   v.booth_number,
    bio:            null,
    avatar_url:     null,
    slug:           v.slug,
    facebook_url:   null,
    hero_image_url: v.hero_image_url,
  };
}

// ─── Toast ──────────────────────────────────────────────────────────────────
//
// Simple bottom-anchored toast within the smoke-route layout. When the
// component mounts inside the /admin tab (Arc 3.1), this can be replaced
// with the existing /admin toast pattern; for now the component owns its
// own visual.

function Toast({ kind, text }: { kind: "success" | "error"; text: string }) {
  const isError = kind === "error";
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        maxWidth: "calc(100vw - 32px)",
        padding: "10px 16px",
        borderRadius: 999,
        background: isError ? PILL.collision.bg : PILL.linked.bg,
        color:      isError ? PILL.collision.fg : PILL.linked.fg,
        border: `1px solid ${isError ? PILL.collision.bd : PILL.linked.bd}`,
        fontSize: 13,
        fontWeight: 500,
        fontFamily: "Lora, Georgia, serif",
        zIndex: 200,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      {text}
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Chip({
  label,
  count,
  on,
  onClick,
  tone,
}: {
  label:    string;
  count:    number;
  on:       boolean;
  onClick:  () => void;
  tone?:    "unlinked";
}) {
  // Default chip = green-on-paperCream when on, paperWarm-on-inkPrimary when off.
  // Tone variant = colored chip when on (matches status pill color so the
  // chip reads as "filtering by THIS status").
  const onBg =
    tone === "unlinked" ? PILL.unlinked.fg : v1.green;
  const onFg = v1.paperCream;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: on ? onBg : v1.paperWarm,
        color:      on ? onFg : v1.inkMid,
        border: `1px solid ${on ? onBg : v1.inkHairline}`,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          opacity: on ? 0.8 : 0.6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
    </button>
  );
}

function VendorRowAccordion({
  vendor,
  expanded,
  onToggle,
  onEdit,
  onForceUnlink,
  onDelete,
  onRelink,
  onInvite,
}: {
  vendor:        VendorRow;
  expanded:      boolean;
  onToggle:      () => void;
  onEdit:        () => void;
  onForceUnlink: () => void;
  onDelete:      () => void;
  onRelink:      () => void;
  onInvite:      () => void;
}) {
  const status   = rowStatus(vendor);
  const pill     = PILL[status];
  const mallName = vendor.mall?.name ?? "—";
  const boothNo  = vendor.booth_number ?? "—";

  // Expanded rows pick up a faint paperWarm tint so an open accordion
  // reads distinct from collapsed siblings.
  const rowBg = expanded ? v1.paperWarm : "transparent";

  // D4 — Force-unlink only when user_id != null. Relink only when
  // unlinked AND a matching pending/approved request exists. Invite
  // only when unlinked AND no matching request (orphan-unlinked).
  // Edit and Delete render on every row.
  const showForceUnlink = vendor.user_id !== null;
  const showRelink      = vendor.user_id === null && vendor.diagnosis?.matchingRequest !== null;
  const showInvite      = vendor.user_id === null && vendor.diagnosis?.matchingRequest === null;

  return (
    <div
      style={{
        borderBottom: `1px solid ${v1.inkHairline}`,
        background: rowBg,
        transition: "background 120ms ease",
      }}
    >
      {/* Always-visible head — tap target for expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          padding: "12px 0",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        {/* Left padding gap — replaces the session-124 D10 leaf accent
            retired alongside isCollision in session 130. */}
        <div style={{ width: 6, flexShrink: 0, marginRight: 12 }} />
        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "Lora, Georgia, serif",
              fontSize: 14,
              fontWeight: 500,
              color: v1.inkPrimary,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vendor.display_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: v1.inkMuted,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Booth {boothNo} · {mallName} · {vendor.posts_count} {vendor.posts_count === 1 ? "post" : "posts"}
          </div>
        </div>
        {/* Status pill + chevron */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, paddingLeft: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: pill.bg,
              color: pill.fg,
              border: `1px solid ${pill.bd}`,
              whiteSpace: "nowrap",
            }}
          >
            {status}
          </span>
          <span
            style={{
              color: v1.inkFaint,
              fontSize: 18,
              lineHeight: 1,
              fontFamily: "Lora, Georgia, serif",
              display: "inline-block",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          >
            ›
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 0 14px 18px" }}>
          <VendorRowDetail vendor={vendor} status={status} />
          <ActionRow
            showRelink={showRelink}
            showForceUnlink={showForceUnlink}
            showInvite={showInvite}
            onEdit={onEdit}
            onForceUnlink={onForceUnlink}
            onDelete={onDelete}
            onRelink={onRelink}
            onInvite={onInvite}
          />
        </div>
      )}
    </div>
  );
}

// ─── Detail metadata grid (D7) ──────────────────────────────────────────────

function VendorRowDetail({
  vendor,
  status,
}: {
  vendor: VendorRow;
  status: RowStatus;
}) {
  const dn   = vendor.display_name;
  const noteName = vendor.diagnosis?.matchingRequest?.name ?? null;
  // Session 130 — surface booth_name from the request alongside the
  // person name as informational context. Empty-string treated as null
  // since the form's optional field may store "" instead of NULL.
  const noteBoothName =
    vendor.diagnosis?.matchingRequest?.booth_name?.trim() || null;
  const userIdLabel =
    vendor.user_id ?? (
      status === "pending"      ? "— (awaiting first sign-in)" :
      status === "disconnected" ? "— (will auto-relink on next sign-in)" :
                                  "— (unlinked)"
    );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px 1fr",
        rowGap: 6,
        columnGap: 12,
        padding: "8px 12px 12px 0",
        marginRight: 12,
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      <Key>display_name</Key>
      <Val mode="default">
        {dn}
        {noteName && (
          <span
            style={{
              color: v1.inkMuted,
              fontSize: 10,
              fontStyle: "italic",
              fontFamily: "Lora, Georgia, serif",
              marginLeft: 6,
            }}
          >
            {noteBoothName
              ? <>(approved request booth: &ldquo;{noteBoothName}&rdquo; — {noteName})</>
              : <>(approved request: &ldquo;{noteName}&rdquo;)</>}
          </span>
        )}
      </Val>

      <Key>slug</Key>
      <Val mode="mono">{vendor.slug}</Val>

      <Key>user_id</Key>
      <Val mode="mono">{userIdLabel}</Val>

      <Key>email</Key>
      <Val mode="mono">{vendor.linked_user_email ?? "—"}</Val>

      <Key>posts</Key>
      <Val>{vendor.posts_count}</Val>

      <Key>created</Key>
      <Val mode="mono">{formatDate(vendor.created_at)}</Val>

      {/* Jump links — review/test affordance. Public booth = what shoppers see;
          admin view = vendor's editable shelf without sign-in dance.
          target=_blank so admin doesn't lose place in the Vendors tab. */}
      <Key>open</Key>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          fontSize: 12,
          fontFamily: "Lora, Georgia, serif",
          flexWrap: "wrap",
        }}
      >
        <a
          href={`/shelf/${vendor.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: v1.green, textDecoration: "none" }}
        >
          ↗ public booth
        </a>
        <span style={{ color: v1.inkFaint }}>·</span>
        <a
          href={`/my-shelf?vendor=${vendor.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: v1.green, textDecoration: "none" }}
        >
          ↗ admin view
        </a>
      </div>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: v1.inkMuted,
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        textAlign: "left",
      }}
    >
      {children}
    </div>
  );
}

function Val({
  children,
  mode = "default",
}: {
  children: React.ReactNode;
  mode?:    "default" | "mono" | "warn";
}) {
  const isWarn = mode === "warn";
  const isMono = mode === "mono";
  return (
    <div
      style={{
        color: isWarn ? PILL.collision.fg : v1.inkPrimary,
        fontFamily: isMono
          ? "ui-monospace, SFMono-Regular, Menlo, monospace"
          : "Lora, Georgia, serif",
        fontSize: isMono ? 11 : 13,
        wordBreak: "break-all",
      }}
    >
      {children}
    </div>
  );
}

// ─── Action button row (D7) ─────────────────────────────────────────────────
//
// Action handlers wired across Arc 2.3 (Edit · Force-unlink · Delete) +
// Arc 2.4 (Relink) + Arc 4 follow-up (Invite). Mutually exclusive on the
// link path: Relink shows when matchingRequest exists, Invite shows when
// it doesn't — never both.

function ActionRow({
  showRelink,
  showForceUnlink,
  showInvite,
  onEdit,
  onForceUnlink,
  onDelete,
  onRelink,
  onInvite,
}: {
  showRelink:      boolean;
  showForceUnlink: boolean;
  showInvite:      boolean;
  onEdit:          () => void;
  onForceUnlink:   () => void;
  onDelete:        () => void;
  onRelink:        () => void;
  onInvite:        () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
        paddingRight: 12,
      }}
    >
      {showRelink && <ActionButton tone="primary" onClick={onRelink}>Relink to request</ActionButton>}
      {showInvite && <ActionButton tone="primary" onClick={onInvite}>Invite vendor</ActionButton>}
      <ActionButton onClick={onEdit}>Edit</ActionButton>
      {showForceUnlink && <ActionButton onClick={onForceUnlink}>Force-unlink</ActionButton>}
      <ActionButton tone="danger" onClick={onDelete}>Delete</ActionButton>
    </div>
  );
}

function ActionButton({
  children,
  tone,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  tone?:    "primary" | "danger";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const base = {
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: "Lora, Georgia, serif",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "opacity 120ms ease",
  } as const;

  if (tone === "primary") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
          ...base,
          background: v1.green,
          color: v1.onGreen,
          border: `1px solid ${v1.green}`,
        }}
      >
        {children}
      </button>
    );
  }
  if (tone === "danger") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
          ...base,
          background: "transparent",
          color: PILL.collision.fg,
          border: `1px solid ${PILL.collision.bd}`,
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...base,
        background: "transparent",
        color: v1.inkMid,
        border: `1px solid ${v1.inkHairline}`,
      }}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string): string {
  // "2026-05-07T11:42:00Z" → "May 7 · 11:42 EDT"
  // Match V1 mockup. Fall back to raw ISO on parse failure.
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const month = d.toLocaleString("en-US", { month: "short" });
    const day   = d.getDate();
    const hh    = d.getHours().toString().padStart(2, "0");
    const mm    = d.getMinutes().toString().padStart(2, "0");
    const tz    = d.toLocaleString("en-US", { timeZoneName: "short" }).split(" ").pop() ?? "";
    return `${month} ${day} · ${hh}:${mm} ${tz}`;
  } catch {
    return iso;
  }
}

// ─── Inline styles ──────────────────────────────────────────────────────────

const chipStripStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  alignItems: "center",
  paddingTop: 14,
  overflowX: "auto",
};

const scopeDividerStyle: React.CSSProperties = {
  width: 1,
  height: 18,
  background: v1.inkHairline,
  flexShrink: 0,
  margin: "0 4px",
};

const addBoothPillStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Lora, Georgia, serif",
  background: "transparent",
  color: v1.green,
  border: `1px dashed ${v1.green}`,
  cursor: "pointer",
};

const messageStyle: React.CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: v1.inkMuted,
  fontFamily: "Lora, Georgia, serif",
  fontStyle: "italic",
  fontSize: 14,
  lineHeight: 1.5,
};
