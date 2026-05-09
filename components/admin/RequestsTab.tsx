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
import { RefreshCw, Stethoscope, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { colors } from "@/lib/tokens";
import type { VendorRequest, DiagnosisReport } from "@/types/treehouse";
import ReviewRequestModal from "@/components/admin/ReviewRequestModal";

// Chip filter values per D3 (single-select, default "pending"). Mirrors the
// API's ?status= contract from D14 — the server param exists but the UI
// fetches `?status=all` and filters client-side so all four count badges
// stay live without re-fetching on every chip change.
type StatusFilter = "pending" | "approved" | "denied" | "all";

export interface RequestsTabProps {
  requests:          VendorRequest[];
  requestsLoading:   boolean;
  diagnosisBusy:     Set<string>;
  diagnosisReports:  Record<string, DiagnosisReport>;
  diagnosisErrors:   Record<string, string>;
  // Modal closes immediately on submit; the parent's approve/deny handlers
  // own their own busy + toast + refetch lifecycle. RequestsTab no longer
  // tracks per-row busy state directly (the inline Approve button retired
  // in Arc 3 commit 10 was the only consumer).
  onApprove:         (request: VendorRequest) => Promise<void> | void;
  onDeny:            (request: VendorRequest, denialReason: string) => Promise<void> | void;
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
    diagnosisBusy,
    diagnosisReports,
    diagnosisErrors,
    onApprove,
    onDeny,
    onDiagnose,
    onDismissDiagnosis,
    onRefresh,
    renderDiagnosisPanel,
  } = props;

  // D3 — single-select filter, default "pending" closes the pre-design bug
  // where approved rows lingered in the default view at 0.6 opacity.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  // Modal state — request currently under review (null = closed). Arc 2
  // commit 7 placeholder; Arc 3 commits 8+9 fill in the decide + readonly
  // mode bodies.
  const [reviewing, setReviewing] = useState<VendorRequest | null>(null);

  // Mode is determined by the row's status when admin opens the modal.
  // Pending rows → decide; approved/denied rows → readonly (Arc 3 commit 9
  // implements the readonly tap target on non-pending rows).
  const reviewMode: "decide" | "readonly" =
    reviewing?.status === "pending" ? "decide" : "readonly";

  // Arc 3 commit 8 wires the modal's onSubmit through to the parent's
  // approve/deny action handlers. Each handler manages its own toast +
  // refetch lifecycle (parent already does that for approve; the new
  // denyVendorRequest mirrors the shape). Modal closes immediately on
  // submit; the row drops from the pending list once fetchVendorRequests
  // returns.
  async function handleReviewSubmit(
    action: "approve" | "deny",
    denialReason?: string,
  ) {
    if (!reviewing) return;
    const target = reviewing;
    setReviewing(null);
    if (action === "approve") {
      await onApprove(target);
    } else {
      await onDeny(target, denialReason ?? "");
    }
  }

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
            const isPending  = request.status === "pending";
            const isDenied   = request.status === "denied";
            const isApproved = request.status === "approved";
            const isDiagnosing = diagnosisBusy.has(request.id);
            const report = diagnosisReports[request.id];
            const diagErr = diagnosisErrors[request.id];
            return (
              <div
                key={request.id}
                // D10 — non-pending rows are whole-row tappable to open the
                // readonly review modal. Inner anchors + buttons stop
                // propagation so they keep their own tap behavior. Pending
                // rows use the explicit Review → CTA per D1.
                onClick={isPending ? undefined : () => setReviewing(request)}
                role={isPending ? undefined : "button"}
                tabIndex={isPending ? undefined : 0}
                onKeyDown={
                  isPending
                    ? undefined
                    : (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setReviewing(request);
                        }
                      }
                }
                style={{
                  // D9 — non-pending rows get explicit visual treatment per
                  // status (status pill in right slot, name in ink-mid),
                  // not a blanket opacity 0.6 dim. Pending rows pop the
                  // surface bg as the active-work color.
                  background: isPending ? colors.surface : colors.bg,
                  border: `1px solid ${isPending ? colors.border : colors.textFaint}`,
                  borderRadius: 12, padding: "16px 18px",
                  cursor: isPending ? "default" : "pointer",
                }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  {request.proof_image_url && (
                    <a
                      href={request.proof_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
                          // D9 — denied/approved photo thumbs dim to 0.7 so
                          // the row reads as "settled" at a glance.
                          opacity: isPending ? 1 : 0.7,
                        }}
                      />
                    </a>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        // D9 — non-pending vendor names render in ink-mid
                        // so the active-work pending rows visually lead.
                        color: isPending ? colors.textPrimary : colors.textMid,
                        marginBottom: 4,
                      }}
                    >
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

                  {/* D1 — Review → CTA on pending rows. Inline Approve
                      fallback retired in Arc 3 commit 10 — Approve now
                      flows through the modal Submit button only. */}
                  {isPending && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setReviewing(request); }}
                      style={{
                        flexShrink: 0,
                        padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                        background: colors.surface, color: colors.textPrimary,
                        border: `1px solid ${colors.border}`, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        minHeight: 44, whiteSpace: "nowrap"
                      }}>
                      Review <ChevronRight size={14} />
                    </button>
                  )}

                  {/* D9 — non-pending status pill replaces the Review CTA
                      in the right slot. Approved = green, Denied = amber.
                      Whole-row tap (above) opens the readonly modal. */}
                  {!isPending && (
                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "1.4px",
                        textTransform: "uppercase",
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: isApproved ? "#e7ecdf" : isDenied ? "#f4ead4" : colors.surface,
                        color:      isApproved ? "#4a6b3a" : isDenied ? "#b6843a" : colors.textMid,
                        border: `1px solid ${isApproved ? "#4a6b3a" : isDenied ? "#b6843a" : colors.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {request.status}
                    </div>
                  )}
                </div>

                {/* Diagnose control — always available for every request.
                    onClick stops propagation so non-pending rows don't fire
                    the whole-row tap → readonly modal handler (D10). */}
                <div
                  style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!report && !diagErr && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDiagnose(request.id); }}
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
                      onClick={(e) => { e.stopPropagation(); onDismissDiagnosis(request.id); }}
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

      {/* Review modal — Arc 2 commit 7 placeholder mount. Arc 3 commit 8
          (decide-mode body) + commit 9 (readonly-mode body) replace the
          stub copy with the full D7 layout. */}
      {reviewing && (
        <ReviewRequestModal
          request={reviewing}
          open={true}
          mode={reviewMode}
          onSubmit={handleReviewSubmit}
          onDismiss={() => setReviewing(null)}
        />
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
