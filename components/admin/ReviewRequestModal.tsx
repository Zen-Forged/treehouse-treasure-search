// components/admin/ReviewRequestModal.tsx
// Session 136 — Requests tab redesign Arc 2 commit 7 (placeholder).
//
// Mounted by <RequestsTab> when admin taps Review → on a request row.
// Prop contract from D15 is finalized this commit; full D7 layout
// (header + 130px proof + meta grid + decision panel + reason textarea
// + email preview + action row) lands in Arc 3 commit 8 (decide-mode)
// and commit 9 (readonly-mode for denied/approved rows).
//
// During transition (Arc 2 → Arc 3): the placeholder renders a stub body
// + Approve/Deny/Cancel buttons that call onSubmit + console.log so the
// flow is observable. The existing inline Approve button on per-row
// (RequestsTab) stays wired as fallback per the design record's Arc 2
// commit 7 note ("Approve still works via existing inline button (kept
// as fallback during transition)") — retired in Arc 3 commit 10 once
// the full decide-mode flow is wired through.

"use client";

import { useEffect, useState } from "react";
import { v1 } from "@/lib/tokens";
import type { VendorRequest } from "@/types/treehouse";

export interface ReviewRequestModalProps {
  request:   VendorRequest;
  open:      boolean;
  mode:      "decide" | "readonly";
  onSubmit:  (action: "approve" | "deny", denialReason?: string) => Promise<void>;
  onDismiss: () => void;
}

export default function ReviewRequestModal({
  request,
  open,
  mode,
  onSubmit,
  onDismiss,
}: ReviewRequestModalProps) {
  const [submitting, setSubmitting] = useState(false);

  // Reset submitting flag on open transitions so a stale flag from the
  // previous request doesn't leak into the next.
  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  // Esc key dismisses (D8). Only registers while open to avoid global
  // listener leakage across other modals.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onDismiss]);

  if (!open) return null;

  async function handleAction(action: "approve" | "deny") {
    if (submitting) return;
    setSubmitting(true);
    // Arc 2 commit 7 placeholder — Arc 3 commit 8 wires real onSubmit
    // with denial_reason from the textarea. For now, console.log the
    // intent so the flow is observable mid-transition.
    console.log("[ReviewRequestModal] placeholder onSubmit:", action, "request:", request.id);
    try {
      await onSubmit(action, action === "deny" ? "placeholder-deny-reason" : undefined);
    } finally {
      setSubmitting(false);
    }
  }

  const headerName = request.booth_name || request.name;
  const meta       = [
    request.booth_number ? `Booth ${request.booth_number}` : "No booth",
    request.mall_name || "No location",
  ].join(" · ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-request-title"
      onClick={onDismiss}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,16,10,0.45)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: v1.paperCream,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: 14,
          width: "100%",
          maxWidth: 320,
          maxHeight: "80vh",
          overflowY: "auto",
          padding: "20px 20px 18px",
          fontFamily: "Lora, Georgia, serif",
        }}
      >
        <div
          id="review-request-title"
          style={{ fontSize: 16, fontWeight: 600, color: v1.inkPrimary, textAlign: "center", marginBottom: 4 }}
        >
          {headerName}
        </div>
        <div style={{ fontSize: 13, color: v1.inkMid, textAlign: "center", marginBottom: 14 }}>
          {meta}
        </div>

        <div style={{ fontSize: 12, color: v1.inkMid, textAlign: "center", padding: "16px 0", fontStyle: "italic", lineHeight: 1.5 }}>
          Review modal placeholder — Arc 3 commit 8 lands the full decide-mode
          flow (proof image, decision panel, reason textarea, email preview).
          {mode === "readonly" && " (readonly mode — Arc 3 commit 9)"}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onDismiss}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${v1.inkHairline}`,
              background: "transparent",
              color: v1.inkMid,
              fontSize: 13,
              fontFamily: "Lora, Georgia, serif",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          {mode === "decide" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("approve")}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${v1.green}`,
                  background: v1.green,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Lora, Georgia, serif",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => handleAction("deny")}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${v1.inkHairline}`,
                  background: v1.paperWarm,
                  color: v1.inkPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Lora, Georgia, serif",
                  cursor: submitting ? "default" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                Deny
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
