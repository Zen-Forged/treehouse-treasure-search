// components/admin/RequestsTab.tsx
// Session 136 — Requests tab redesign Arc 2 commit 5 (extraction).
//
// Pure refactor: extracts the inline implementation that lived at
// app/admin/page.tsx:678–826 verbatim. No behavior change, no styling
// drift, no token migration (still uses `colors` from @/lib/tokens —
// migration to v1 tokens can land later if/when the design record D7
// modal vocabulary lands and warrants a sweep).
//
// Subsequent Arc 2 commits build on this foundation:
//   commit 6 → chip filter strip with counts + ?status= wiring
//   commit 7 → per-row Review → CTA + <ReviewRequestModal> placeholder
//
// Diagnosis state stays in the parent (app/admin/page.tsx) because the
// `diagnoseRequest` helper is also called from a toast action handler at
// admin/page.tsx:~1114 — moving it would expand scope beyond pure refactor.
// Parent passes diagnosis state slices + a `renderDiagnosisPanel` render
// prop so this component doesn't import DiagnosisPanel directly.

"use client";

import { useMemo, useState } from "react";
import { RefreshCw, UserCheck, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import type { VendorRequest, DiagnosisReport } from "@/types/treehouse";

// Chip filter values per D3 (single-select, default "pending"). Mirrors the
// API's ?status= contract from D14 — the server param exists but the UI
// fetches `?status=all` and filters client-side so all four count badges
// stay live without re-fetching on every chip change.
type StatusFilter = "pending" | "approved" | "denied" | "all";

export interface RequestsTabProps {
  requests:          VendorRequest[];
  requestsLoading:   boolean;
  requestBusy:       Set<string>;
  diagnosisBusy:     Set<string>;
  diagnosisReports:  Record<string, DiagnosisReport>;
  diagnosisErrors:   Record<string, string>;
  onApprove:         (request: VendorRequest) => void;
  onDiagnose:        (requestId: string) => void;
  onDismissDiagnosis: (requestId: string) => void;
  onRefresh:         () => void;
  /**
   * Renders the diagnosis panel for a given report. Threaded as a render
   * prop because <DiagnosisPanel> stays in app/admin/page.tsx (also used
   * by the toast action handler at line ~1114; moving it expands scope
   * beyond pure refactor).
   */
  renderDiagnosisPanel: (report: DiagnosisReport) => ReactNode;
}

export default function RequestsTab(props: RequestsTabProps) {
  const {
    requests,
    requestsLoading,
    requestBusy,
    diagnosisBusy,
    diagnosisReports,
    diagnosisErrors,
    onApprove,
    onDiagnose,
    onDismissDiagnosis,
    onRefresh,
    renderDiagnosisPanel,
  } = props;

  // D3 — single-select filter, default "pending" closes the pre-design bug
  // where approved rows lingered in the default view at 0.6 opacity.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const counts = useMemo(() => {
    let pending  = 0;
    let approved = 0;
    let denied   = 0;
    for (const r of requests) {
      if      (r.status === "pending")  pending++;
      else if (r.status === "approved") approved++;
      else if (r.status === "denied")   denied++;
    }
    return { pending, approved, denied, total: requests.length };
  }, [requests]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  // Empty-state copy adapts to filter — distinguishes "no requests at all"
  // from "no requests match this chip" so the admin doesn't think the
  // fetch broke when they click Denied on a fresh deployment.
  const emptyCopy =
    requests.length === 0
      ? "No vendor requests yet."
      : `No ${statusFilter === "all" ? "" : statusFilter + " "}requests.`;

  return (
    <div style={{ margin: "24px 20px 0" }}>

      {/* AddBoothInline retired Arc 4 Arc 3.2 (D6/D9) — pre-seed surface
          moved to the new Vendors tab's "+ Add booth" dashed-pill, which
          wraps the same AddBoothSheet primitive directly. Requests tab
          now focuses on its core job: reviewing vendor self-registrations. */}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: colors.textFaint, textTransform: "uppercase", letterSpacing: "2px" }}>
          Vendor requests
        </div>
        <button onClick={onRefresh} disabled={requestsLoading}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: colors.textMuted }}>
          <RefreshCw size={11} style={{ opacity: requestsLoading ? 0.4 : 1 }} /> Refresh
        </button>
      </div>

      {/* D3 — chip filter strip. Single-select; default Pending. Counts
          always render regardless of which chip is on. Mirrors VendorsTab
          chip primitive shape. */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", overflowX: "auto", marginBottom: 14, paddingBottom: 2 }}>
        <FilterChip
          label="Pending"
          count={counts.pending}
          on={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
        />
        <FilterChip
          label="Approved"
          count={counts.approved}
          on={statusFilter === "approved"}
          onClick={() => setStatusFilter("approved")}
        />
        <FilterChip
          label="Denied"
          count={counts.denied}
          on={statusFilter === "denied"}
          onClick={() => setStatusFilter("denied")}
        />
        <FilterChip
          label="All"
          count={counts.total}
          on={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
      </div>

      {requestsLoading ? (
        <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center" }}>Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: colors.textFaint, padding: "20px 0", textAlign: "center", fontStyle: "italic", fontFamily: "Georgia, serif" }}>{emptyCopy}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(request => {
            const isPending = request.status === "pending";
            const isBusy = requestBusy.has(request.id);
            const isDiagnosing = diagnosisBusy.has(request.id);
            const report = diagnosisReports[request.id];
            const diagErr = diagnosisErrors[request.id];
            return (
              <div key={request.id}
                style={{
                  background: isPending ? colors.surface : colors.bg,
                  border: `1px solid ${isPending ? colors.border : colors.textFaint}`,
                  borderRadius: 12, padding: "16px 18px",
                  opacity: isPending ? 1 : 0.6
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  {request.proof_image_url && (
                    <a
                      href={request.proof_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flexShrink: 0, display: "block" }}
                      aria-label="Open booth photo in new tab"
                    >
                      <img
                        src={request.proof_image_url}
                        alt="Booth proof"
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          objectFit: "cover",
                          border: `1px solid ${colors.border}`,
                          display: "block",
                        }}
                      />
                    </a>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                      {request.booth_name || request.name}
                    </div>
                    {request.booth_name && (
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2, fontStyle: "italic" }}>
                        {request.first_name && request.last_name ? `${request.first_name} ${request.last_name}` : request.name}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: colors.textMid, marginBottom: 2 }}>
                      {request.email}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>
                      {request.booth_number ? `Booth ${request.booth_number}` : "No booth specified"} • {request.mall_name || "No location specified"}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textFaint, fontFamily: "monospace", marginTop: 4 }}>
                      {new Date(request.created_at).toLocaleDateString()} • {request.status}
                    </div>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => onApprove(request)}
                      disabled={isBusy}
                      style={{
                        padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: colors.green, color: "#fff", border: "none", cursor: "pointer",
                        opacity: isBusy ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6,
                        minHeight: 44, flexShrink: 0, whiteSpace: "nowrap"
                      }}>
                      <UserCheck size={14} /> {isBusy ? "…" : "Approve"}
                    </button>
                  )}
                </div>

                {/* Diagnose control — always available for every request */}
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {!report && !diagErr && (
                    <button
                      onClick={() => onDiagnose(request.id)}
                      disabled={isDiagnosing}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: colors.textMid, padding: 0,
                        opacity: isDiagnosing ? 0.5 : 1,
                      }}>
                      <Stethoscope size={12} />
                      {isDiagnosing ? "Diagnosing…" : "Diagnose"}
                    </button>
                  )}
                  {(report || diagErr) && (
                    <button
                      onClick={() => onDismissDiagnosis(request.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 11, color: colors.textFaint, padding: 0,
                      }}>
                      Hide diagnosis
                    </button>
                  )}
                </div>

                {/* Inline diagnosis panel */}
                {diagErr && (
                  <div style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: 8,
                    background: colors.redBg, border: `1px solid ${colors.redBorder}`,
                    fontSize: 11, color: colors.red, lineHeight: 1.5,
                  }}>
                    {diagErr}
                  </div>
                )}
                {report && renderDiagnosisPanel(report)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

/**
 * Filter chip primitive — mirrors VendorsTab's <Chip> token shape but uses
 * `colors` tokens (admin-page-local theme) instead of v1 since RequestsTab
 * still uses `colors` throughout. Single-select context: `on` highlights
 * green; off renders quiet paper-warm.
 */
function FilterChip({
  label,
  count,
  on,
  onClick,
}: {
  label:   string;
  count:   number;
  on:      boolean;
  onClick: () => void;
}) {
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
        background: on ? colors.green : colors.surface,
        color:      on ? "#fff"        : colors.textMid,
        border: `1px solid ${on ? colors.green : colors.border}`,
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
          opacity: on ? 0.85 : 0.6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
    </button>
  );
}
