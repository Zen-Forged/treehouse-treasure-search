// components/admin/VendorsTab.tsx
// Arc 4 of login refactor — admin Vendors tab. Frame B accordion (D7) over
// every vendors row with chip-filter scope + status sub-filters. Owns its
// own fetch + state lifecycle.
//
// Status: Arc 2.1 (read-only scaffold) — fetches GET /api/admin/vendors,
// renders collapsed rows + chip filters + counts. Accordion expand,
// status pills' visual treatment for collision (D10), and action wiring
// land in Arc 2.2–2.4. AddBoothSheet trigger lands in Arc 3.2.
//
// Mounted today only on /vendors-test smoke route per
// feedback_testbed_first_for_ai_unknowns.md. Integration into
// app/admin/page.tsx happens in Arc 3.1; smoke route retires post-Arc-3.

"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";

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
    isCollision:     boolean;
  } | null;
};

type Counts = {
  total:     number;
  linked:    number;
  unlinked:  number;
  collision: number;
};

type Scope = "problematic" | "all";
type StatusKey = "collision" | "unlinked";

// ─── Visual tokens — locked at design record D3 + D10 ───────────────────────
//
// Distinct from v1.{green,red,amber} because design record D3 specifies
// warmer/softer values calibrated for the Vendors-tab status pills. Locked
// per the V1 mockup at docs/mockups/admin-vendors-tab-v1.html — match 1:1.

const PILL = {
  linked:    { bg: "#e7ecdf", fg: "#4a6b3a", bd: "rgba(74,107,58,0.30)" },
  unlinked:  { bg: "#f4ead4", fg: "#b6843a", bd: "rgba(182,132,58,0.30)" },
  collision: { bg: "#f1dad2", fg: "#a8442e", bd: "rgba(168,68,46,0.30)" },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

function isProblematic(v: VendorRow): boolean {
  // D2 — user_id IS NULL OR display_name diff vs approved request.
  // diagnosis only populates for unlinked rows so isCollision implies
  // user_id IS NULL; therefore problematic == unlinked.
  return v.user_id === null;
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
    if (statusFilter.has("collision") && v.diagnosis?.isCollision) return true;
    if (statusFilter.has("unlinked")  && v.user_id === null)        return true;
    return false;
  });
}

function rowStatus(v: VendorRow): "linked" | "unlinked" | "collision" {
  if (v.diagnosis?.isCollision) return "collision";
  if (v.user_id === null)       return "unlinked";
  return "linked";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VendorsTab() {
  const [vendors,  setVendors]  = useState<VendorRow[]>([]);
  const [counts,   setCounts]   = useState<Counts | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // D2 default — problematic-only on tab open.
  const [scope,        setScope]        = useState<Scope>("problematic");
  const [statusFilter, setStatusFilter] = useState<Set<StatusKey>>(new Set());

  // D7 — accordion: only one row expanded at a time. null = all collapsed.
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/admin/vendors");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error ?? "Failed to load vendors.");
          return;
        }
        setVendors(json.vendors ?? []);
        setCounts(json.counts ?? null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
          count={counts?.unlinked ?? 0}
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
          label="Collision"
          count={counts?.collision ?? 0}
          on={statusFilter.has("collision")}
          onClick={() => toggleStatus("collision")}
          tone="collision"
        />
        <Chip
          label="Unlinked"
          count={counts?.unlinked ?? 0}
          on={statusFilter.has("unlinked")}
          onClick={() => toggleStatus("unlinked")}
          tone="unlinked"
        />
      </div>

      {/* + Add booth dashed-pill CTA — D6/D9. Visual-only in Arc 2.1; wired in Arc 3.2 */}
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px 0 14px" }}>
        <button
          type="button"
          disabled
          style={addBoothPlaceholderStyle}
          title="Wired in Arc 3.2"
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
            />
          ))}
        </div>
      )}
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
  tone?:    "collision" | "unlinked";
}) {
  // Default chip = green-on-paperCream when on, paperWarm-on-inkPrimary when off.
  // Tone variant = colored chip when on (matches status pill color so the
  // chip reads as "filtering by THIS status").
  const onBg =
    tone === "collision" ? PILL.collision.fg :
    tone === "unlinked"  ? PILL.unlinked.fg  :
    v1.green;
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
}: {
  vendor:   VendorRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status   = rowStatus(vendor);
  const pill     = PILL[status];
  const isWarn   = status === "collision";
  const mallName = vendor.mall?.name ?? "—";
  const boothNo  = vendor.booth_number ?? "—";

  // D10 — collision row bg shifts on expand; non-collision rows pick up
  // a faint paperWarm tint when expanded so the open accordion reads
  // distinct from collapsed siblings.
  const rowBg =
    isWarn && expanded ? "rgba(168,68,46,0.08)" :
    isWarn             ? "rgba(168,68,46,0.04)" :
    expanded           ? v1.paperWarm           :
                         "transparent";

  // D4 — Force-unlink only when user_id != null. Relink only when
  // unlinked AND a matching pending/approved request exists. Edit and
  // Delete render on every row.
  const showForceUnlink = vendor.user_id !== null;
  const showRelink      = vendor.user_id === null && vendor.diagnosis?.matchingRequest !== null;

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
        {/* Leaf accent — red on collision, transparent otherwise (D10) */}
        <div
          style={{
            width: 6,
            flexShrink: 0,
            marginRight: 12,
            background: isWarn ? PILL.collision.fg : "transparent",
            borderRadius: 3,
          }}
        />
        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "Lora, Georgia, serif",
              fontSize: 14,
              fontWeight: 500,
              color: isWarn ? PILL.collision.fg : v1.inkPrimary,
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
          <VendorRowDetail vendor={vendor} isWarn={isWarn} />
          <ActionRow
            showRelink={showRelink}
            showForceUnlink={showForceUnlink}
          />
        </div>
      )}
    </div>
  );
}

// ─── Detail metadata grid (D7) ──────────────────────────────────────────────

function VendorRowDetail({ vendor, isWarn }: { vendor: VendorRow; isWarn: boolean }) {
  const dn   = vendor.display_name;
  const noteName = vendor.diagnosis?.matchingRequest?.name ?? null;
  const userIdLabel = vendor.user_id ?? "— (unlinked)";

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
      <Val mode={isWarn ? "warn" : "default"}>
        {dn}
        {isWarn && noteName && (
          <span
            style={{
              color: v1.inkMuted,
              fontSize: 10,
              fontStyle: "italic",
              fontFamily: "Lora, Georgia, serif",
              marginLeft: 6,
            }}
          >
            (approved request: &ldquo;{noteName}&rdquo;)
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
// Visual placeholders this commit (Arc 2.2). Handlers wire in:
//   Arc 2.3 → Edit · Force-unlink · Delete (3 modals)
//   Arc 2.4 → Relink (RelinkSheet)

function ActionRow({
  showRelink,
  showForceUnlink,
}: {
  showRelink:      boolean;
  showForceUnlink: boolean;
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
      {showRelink && <ActionButton tone="primary" disabled>Relink to request</ActionButton>}
      <ActionButton disabled>Edit</ActionButton>
      {showForceUnlink && <ActionButton disabled>Force-unlink</ActionButton>}
      <ActionButton tone="danger" disabled>Delete</ActionButton>
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

const addBoothPlaceholderStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Lora, Georgia, serif",
  background: "transparent",
  color: v1.green,
  border: `1px dashed ${v1.green}`,
  cursor: "not-allowed",
  opacity: 0.45,
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
