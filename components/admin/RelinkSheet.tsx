// components/admin/RelinkSheet.tsx
// Arc 4 D14 — production-clean replacement for SQL-paste relink. Bottom
// sheet over a list of matching vendor_request rows; admin taps one, then
// confirms. On submit, the vendors row gets:
//   - user_id from the request's auth user (derived via auth.users email
//     lookup server-side)
//   - display_name + slug synced from the request name
//   - if the request was 'pending', auto-approves it as a side effect
//
// Mounted from VendorsTab when admin taps "Relink to request" on an
// expanded row whose user_id IS NULL and a matchingRequest exists.
//
// Implementation: GET /api/admin/vendor-requests returns the 50 most
// recent requests; we filter client-side to (mall_id, booth_number)
// match + status ∈ {pending, approved}. At current scale (~50 total
// requests) this is one round trip with zero server change. If scale
// climbs past 50 active requests per mall+booth, extend the GET
// endpoint with mall_id + booth_number query params.

"use client";

import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";

interface VendorRequest {
  id:           string;
  name:         string | null;
  first_name:   string | null;
  last_name:    string | null;
  booth_name:   string | null;
  email:        string;
  mall_id:      string | null;
  booth_number: string | null;
  status:       "pending" | "approved" | "denied";
  created_at:   string;
}

interface RelinkSheetProps {
  vendorId:           string;
  vendorMallId:       string;
  vendorBoothNumber:  string | null;
  vendorDisplayName:  string;
  onClose:    () => void;
  onRelinked: (newDisplayName: string) => void;
}

export default function RelinkSheet({
  vendorId,
  vendorMallId,
  vendorBoothNumber,
  vendorDisplayName,
  onClose,
  onRelinked,
}: RelinkSheetProps) {
  const [allRequests, setAllRequests] = useState<VendorRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // body-overflow lock + slide-in animation flag
  const [shown,       setShown]       = useState(false);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // requestAnimationFrame so the initial transform animates in
    requestAnimationFrame(() => setShown(true));
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Fetch vendor_requests on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch("/api/admin/vendor-requests");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error ?? "Failed to load vendor requests.");
          return;
        }
        setAllRequests(json.requests ?? []);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Filter to (mall, booth) + status pending/approved ──
  const matching = useMemo(() => {
    return allRequests.filter((r) => {
      if (r.mall_id !== vendorMallId) return false;
      const rb = r.booth_number ?? null;
      const vb = vendorBoothNumber ?? null;
      if (rb !== vb) return false;
      return r.status === "pending" || r.status === "approved";
    });
  }, [allRequests, vendorMallId, vendorBoothNumber]);

  const selected = matching.find((r) => r.id === selectedId) ?? null;

  // Display-name resolution mirrors approve-flow priority:
  // booth_name → first + last → legacy name.
  const resolvedNewName = (() => {
    if (!selected) return "";
    const bn = selected.booth_name?.trim() ?? "";
    if (bn) return bn;
    const fn = selected.first_name?.trim() ?? "";
    const ln = selected.last_name?.trim() ?? "";
    if (fn && ln) return `${fn} ${ln}`;
    return selected.name?.trim() ?? "";
  })();

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await authFetch("/api/admin/vendors", {
        method: "PATCH",
        body: JSON.stringify({
          vendorId,
          action: "relink",
          vendorRequestId: selected.id,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json?.error ?? `Relink failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      onRelinked(resolvedNewName);
    } catch (e) {
      setSubmitError((e as Error).message);
      setSubmitting(false);
    }
  }

  function handleBackdropClick() {
    if (submitting) return;
    onClose();
  }

  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div
        style={{
          ...sheetStyle,
          transform: shown ? "translateY(0)" : "translateY(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grabber */}
        <div style={grabberStyle} />

        {/* Header */}
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "Lora, Georgia, serif",
                fontSize: 17,
                fontWeight: 500,
                color: v1.inkPrimary,
                lineHeight: 1.3,
              }}
            >
              Relink {vendorDisplayName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: v1.inkMuted,
                marginTop: 3,
              }}
            >
              Booth {vendorBoothNumber ?? "—"} · pending or approved requests at this booth
            </div>
          </div>
          <button
            type="button"
            onClick={submitting ? undefined : onClose}
            style={closeBtnStyle}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body — scrolls */}
        <div style={bodyScrollStyle}>
          {loading && (
            <div style={messageStyle}>Loading vendor requests…</div>
          )}
          {!loading && error && (
            <div style={{ ...messageStyle, color: RED }}>{error}</div>
          )}
          {!loading && !error && matching.length === 0 && (
            <div style={messageStyle}>
              No matching vendor request found at this booth. Use Edit instead, or check the Requests tab.
            </div>
          )}
          {!loading && !error && matching.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matching.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  selected={r.id === selectedId}
                  vendorDisplayName={vendorDisplayName}
                  onTap={() => setSelectedId(r.id === selectedId ? null : r.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — confirm bar */}
        {selected && (
          <div style={footerStyle}>
            {submitError && (
              <div
                style={{
                  marginBottom: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(168,68,46,0.06)",
                  border: `1px solid ${RED_BD}`,
                  color: RED,
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {submitError}
              </div>
            )}
            <div
              style={{
                fontFamily: "Lora, Georgia, serif",
                fontSize: 12,
                lineHeight: 1.5,
                color: v1.inkMid,
                marginBottom: 12,
              }}
            >
              Vendor row will update to <strong>{resolvedNewName}</strong>. Slug regenerates;
              user_id is set from this request&rsquo;s auth user (or stays unlinked if the
              user hasn&rsquo;t signed in yet — auto-claim handles that case).
              {selected.status === "pending" && (
                <> Pending request will auto-approve.</>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSelectedId(null)}
                style={cancelBtnStyle}
              >
                Pick another
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                style={{
                  ...primaryBtnStyle,
                  opacity: submitting ? 0.55 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Relinking…" : "Relink"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Request option card ───────────────────────────────────────────────────

function RequestCard({
  request,
  selected,
  vendorDisplayName,
  onTap,
}: {
  request:           VendorRequest;
  selected:          boolean;
  vendorDisplayName: string;
  onTap:             () => void;
}) {
  const requestDisplayName =
    request.booth_name?.trim() ||
    [request.first_name, request.last_name].filter(Boolean).join(" ").trim() ||
    request.name?.trim() ||
    "(no name)";

  const isDiff = requestDisplayName !== vendorDisplayName;

  const statusPill =
    request.status === "approved"
      ? { bg: "#e7ecdf", fg: "#4a6b3a", bd: "rgba(74,107,58,0.30)" }
      : { bg: "#fffaea", fg: "#7a6420", bd: "rgba(180,150,40,0.40)" };

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 10,
        background: selected ? v1.paperWarm : "transparent",
        border: `1px solid ${selected ? v1.green : v1.inkHairline}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: "inherit",
        transition: "background 100ms ease, border-color 100ms ease",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 15,
            fontWeight: 500,
            color: v1.inkPrimary,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {requestDisplayName}
          {isDiff && (
            <span
              style={{
                color: v1.inkMuted,
                fontSize: 11,
                fontStyle: "italic",
                marginLeft: 6,
              }}
            >
              (vendor row says &ldquo;{vendorDisplayName}&rdquo;)
            </span>
          )}
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
          {request.email} · {formatShortDate(request.created_at)}
        </div>
      </div>
      <span
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 9px",
          borderRadius: 999,
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          background: statusPill.bg,
          color: statusPill.fg,
          border: `1px solid ${statusPill.bd}`,
        }}
      >
        {request.status}
      </span>
    </button>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const month = d.toLocaleString("en-US", { month: "short" });
    const day   = d.getDate();
    return `${month} ${day}`;
  } catch {
    return iso;
  }
}

const RED    = "#a8442e";
const RED_BD = "rgba(168,68,46,0.30)";

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 100,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const sheetStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  maxHeight: "90vh",
  background: v1.paperCream,
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  boxShadow: "0 -8px 36px rgba(0,0,0,0.30)",
  display: "flex",
  flexDirection: "column",
  transition: "transform 200ms ease",
  paddingBottom: "env(safe-area-inset-bottom, 8px)",
};

const grabberStyle: React.CSSProperties = {
  width: 36,
  height: 4,
  borderRadius: 2,
  background: v1.inkHairline,
  margin: "10px auto 6px",
  flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "8px 16px 12px",
  borderBottom: `1px solid ${v1.inkHairline}`,
  flexShrink: 0,
};

const closeBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "transparent",
  color: v1.inkMid,
  border: "none",
  cursor: "pointer",
  fontSize: 22,
  lineHeight: 1,
  flexShrink: 0,
};

const bodyScrollStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "14px 16px",
  WebkitOverflowScrolling: "touch",
};

const footerStyle: React.CSSProperties = {
  padding: "12px 16px 16px",
  borderTop: `1px solid ${v1.inkHairline}`,
  flexShrink: 0,
  background: v1.paperCream,
};

const messageStyle: React.CSSProperties = {
  padding: "32px 8px",
  textAlign: "center",
  color: v1.inkMuted,
  fontFamily: "Lora, Georgia, serif",
  fontStyle: "italic",
  fontSize: 13,
  lineHeight: 1.5,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Lora, Georgia, serif",
  background: "transparent",
  color: v1.inkMid,
  border: `1px solid ${v1.inkHairline}`,
  cursor: "pointer",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Lora, Georgia, serif",
  background: v1.green,
  color: v1.onGreen,
  border: `1px solid ${v1.green}`,
};
