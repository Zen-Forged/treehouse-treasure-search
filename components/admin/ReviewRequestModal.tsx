// components/admin/ReviewRequestModal.tsx
// Session 136 — Requests tab redesign Arc 3 commit 8 (decide-mode body).
//
// Full D7 layout (header + 130px proof image + meta grid + decision panel
// + reason textarea + email preview + action row). Decide-mode is the
// pending-row review path; readonly-mode (D10) lands in Arc 3 commit 9.
//
// D4 — decision panel state: initially neither selected. Picking Approve
// dims the textarea (still visible but greyed). Picking Deny enables the
// textarea + makes it required (Submit blocked until non-whitespace).
// Submit also disabled while submitting (parent handles its own busy
// state, but local lock prevents double-submit before the modal closes).
//
// D5 — reason textarea is free-text, stored in vendor_requests.denial_reason
// at the API layer (Arc 1 commit 4). Internal-only — the locked deny email
// in lib/email.ts (D6) never exposes the reason text.
//
// D8 — dismiss behavior: backdrop tap, Cancel button, Esc key all
// dismiss. No drag-down sheet (modal vocabulary, not sheet). No draft
// persistence — closing loses textarea content.

"use client";

import { useEffect, useMemo, useState } from "react";
import { v1 } from "@/lib/tokens";
import type { VendorRequest } from "@/types/treehouse";

export interface ReviewRequestModalProps {
  request:   VendorRequest;
  open:      boolean;
  mode:      "decide" | "readonly";
  onSubmit:  (action: "approve" | "deny", denialReason?: string) => Promise<void>;
  onDismiss: () => void;
}

type Decision = "approve" | "deny" | null;

export default function ReviewRequestModal({
  request,
  open,
  mode,
  onSubmit,
  onDismiss,
}: ReviewRequestModalProps) {
  const [decision, setDecision]     = useState<Decision>(null);
  const [reason,   setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset state on open transitions so a stale flag/decision/reason from
  // the previous request doesn't leak into the next.
  useEffect(() => {
    if (open) {
      setDecision(null);
      setReason("");
      setSubmitting(false);
    }
  }, [open]);

  // Esc key dismisses (D8). Only registers while open to avoid global
  // listener leakage.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onDismiss]);

  const headerName = request.booth_name || request.name;
  const meta = [
    request.booth_number ? `Booth ${request.booth_number}` : "No booth",
    request.mall_name || "No location",
  ].join(" · ");

  const submittedDate = useMemo(() => {
    try {
      return new Date(request.created_at).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch {
      return "—";
    }
  }, [request.created_at]);

  const personName = useMemo(() => {
    const first = request.first_name?.trim() ?? "";
    const last  = request.last_name?.trim() ?? "";
    if (first && last) return `${first} ${last}`;
    return request.name;
  }, [request.first_name, request.last_name, request.name]);

  const reasonTrimmed = reason.trim();
  const submitDisabled =
    submitting ||
    decision === null ||
    (decision === "deny" && reasonTrimmed.length === 0);

  async function handleSubmit() {
    if (submitDisabled || !decision) return;
    setSubmitting(true);
    try {
      await onSubmit(
        decision,
        decision === "deny" ? reasonTrimmed : undefined,
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // Readonly mode (D10) lands in Arc 3 commit 9. Until that ships the modal
  // renders only in decide-mode — RequestsTab gates the open state to
  // pending rows, so this branch is unreachable today but defensive.
  if (mode === "readonly") {
    return (
      <Backdrop onDismiss={onDismiss}>
        <div style={{ fontSize: 12, color: v1.inkMid, textAlign: "center", padding: "8px 0", fontStyle: "italic", lineHeight: 1.5 }}>
          Read-only review (denied/approved rows) — Arc 3 commit 9.
        </div>
        <ActionRow>
          <CancelButton onClick={onDismiss} disabled={false} label="Close" />
        </ActionRow>
      </Backdrop>
    );
  }

  return (
    <Backdrop onDismiss={onDismiss}>
      {/* 1. Header — vendor name centered Lora 16/600 + meta line Lora 13 */}
      <div
        id="review-request-title"
        style={{ fontSize: 16, fontWeight: 600, color: v1.inkPrimary, textAlign: "center", marginBottom: 4, fontFamily: "Lora, Georgia, serif" }}
      >
        {headerName}
      </div>
      <div style={{ fontSize: 13, color: v1.inkMid, textAlign: "center", marginBottom: 14, fontFamily: "Lora, Georgia, serif" }}>
        {meta}
      </div>

      {/* 2. Proof image — 130px tall, full-width inside modal padding,
          6px radius, hairline border. Skipped silently if absent (rare;
          /vendor-request requires the photo). Tappable for new-tab open
          as accessibility hatch (lightbox is Tier B headroom). */}
      {request.proof_image_url && (
        <a
          href={request.proof_image_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open booth photo in new tab"
          style={{
            display: "block",
            marginBottom: 14,
            borderRadius: 6,
            overflow: "hidden",
            border: `1px solid ${v1.inkHairline}`,
          }}
        >
          <img
            src={request.proof_image_url}
            alt="Booth proof"
            style={{
              display: "block",
              width: "100%",
              height: 130,
              objectFit: "cover",
            }}
          />
        </a>
      )}

      {/* 3. Meta grid — 80px label / 1fr value, sans 9px uppercase keys,
          Lora 12px values. */}
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 6, columnGap: 12, marginBottom: 16 }}>
        <MetaKey>Email</MetaKey>
        <MetaValue>{request.email}</MetaValue>

        <MetaKey>Booth</MetaKey>
        <MetaValue>
          {request.booth_number ? `${request.booth_number}` : "—"}
        </MetaValue>

        <MetaKey>Submitted</MetaKey>
        <MetaValue>{submittedDate}</MetaValue>

        {personName !== headerName && (
          <>
            <MetaKey>Person</MetaKey>
            <MetaValue>{personName}</MetaValue>
          </>
        )}
      </div>

      {/* 4. Decision panel — D4 toggle (initially neither selected). */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <DecisionToggle
          label="Approve"
          on={decision === "approve"}
          tone="approve"
          onClick={() => setDecision("approve")}
          disabled={submitting}
        />
        <DecisionToggle
          label="Deny"
          on={decision === "deny"}
          tone="deny"
          onClick={() => setDecision("deny")}
          disabled={submitting}
        />
      </div>

      {/* 5. Reason textarea — D5. Always visible per D4 ("admin can read
          the email preview before choosing the action"). Dimmed when
          Approve picked; required when Deny picked. */}
      <div style={{ marginBottom: 12 }}>
        <label
          htmlFor="deny-reason"
          style={{
            display: "block",
            fontSize: 9,
            color: v1.inkMid,
            textTransform: "uppercase",
            letterSpacing: "1.6px",
            marginBottom: 6,
            fontWeight: 600,
            opacity: decision === "approve" ? 0.5 : 1,
          }}
        >
          Reason — internal only
          {decision === "deny" && <span style={{ color: v1.green, marginLeft: 4 }}>*</span>}
        </label>
        <textarea
          id="deny-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={decision === "approve" || submitting}
          placeholder={decision === "deny" ? "Why is this request being denied? (vendor never sees this)" : "Pick Deny to fill in a reason."}
          style={{
            display: "block",
            width: "100%",
            minHeight: 62,
            padding: "8px 10px",
            border: `1px solid ${v1.inkHairline}`,
            borderRadius: 8,
            background: decision === "approve" ? "rgba(0,0,0,0.03)" : v1.paperWarm,
            fontFamily: "Lora, Georgia, serif",
            fontSize: 13,
            color: v1.inkPrimary,
            resize: "vertical",
            opacity: decision === "approve" ? 0.5 : 1,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 6. Email preview — post-it card, always visible (D7). Shows the
          locked Deny copy from D6. Reads as "this is what the vendor will
          see if you Submit Deny." Approve picked → eyebrow flips so admin
          knows the deny copy doesn't apply. */}
      <div
        style={{
          background: v1.postit,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 16,
          opacity: decision === "approve" ? 0.55 : 1,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: v1.inkMid,
            textTransform: "uppercase",
            letterSpacing: "1.6px",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          {decision === "approve"
            ? "Approve sends the standard sign-in email"
            : "Vendor will receive"}
        </div>
        {decision !== "approve" ? (
          <div style={{ fontSize: 12, color: v1.inkPrimary, lineHeight: 1.55, fontFamily: "Lora, Georgia, serif" }}>
            <div style={{ marginBottom: 6 }}>Hi {request.first_name?.trim() || "there"},</div>
            <div style={{ marginBottom: 6 }}>
              We weren't able to approve your Treehouse Finds booth request at this time.
            </div>
            <div style={{ marginBottom: 6 }}>
              If you'd like to discuss, please reach out to dbutler80020@gmail.com.
            </div>
            <div style={{ fontStyle: "italic", color: v1.inkMid }}>— Treehouse Finds</div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: v1.inkMid, lineHeight: 1.55, fontStyle: "italic" }}>
            "Your Treehouse Finds booth is ready" — same email vendor receives on the
            existing approval flow.
          </div>
        )}
      </div>

      {/* 7. Action row — Cancel + Submit; Submit fills width-1 per D7. */}
      <ActionRow>
        <CancelButton onClick={onDismiss} disabled={submitting} label="Cancel" />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitDisabled}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: `1px solid ${decision === "deny" ? "#a8442e" : v1.green}`,
            background: submitDisabled ? "rgba(0,0,0,0.06)" : (decision === "deny" ? "#a8442e" : v1.green),
            color: submitDisabled ? v1.inkMid : "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "Lora, Georgia, serif",
            cursor: submitDisabled ? "default" : "pointer",
            transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
          }}
        >
          {submitting
            ? "…"
            : decision === "deny"
              ? "Submit deny"
              : decision === "approve"
                ? "Submit approve"
                : "Submit"}
        </button>
      </ActionRow>
    </Backdrop>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Backdrop({
  children,
  onDismiss,
}: {
  children:  React.ReactNode;
  onDismiss: () => void;
}) {
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
        {children}
      </div>
    </div>
  );
}

function MetaKey({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        color: v1.inkMid,
        textTransform: "uppercase",
        letterSpacing: "1.6px",
        fontWeight: 600,
        paddingTop: 2,
      }}
    >
      {children}
    </div>
  );
}

function MetaValue({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: v1.inkPrimary,
        fontFamily: "Lora, Georgia, serif",
        wordBreak: "break-word",
        lineHeight: 1.4,
      }}
    >
      {children}
    </div>
  );
}

function DecisionToggle({
  label,
  on,
  tone,
  onClick,
  disabled,
}: {
  label:    string;
  on:       boolean;
  tone:     "approve" | "deny";
  onClick:  () => void;
  disabled: boolean;
}) {
  const onBg = tone === "approve" ? v1.green : "#a8442e";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "9px 12px",
        borderRadius: 8,
        border: `1px solid ${on ? onBg : v1.inkHairline}`,
        background: on ? onBg : v1.paperWarm,
        color: on ? "#fff" : v1.inkPrimary,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "Lora, Georgia, serif",
        cursor: disabled ? "default" : "pointer",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8 }}>{children}</div>;
}

function CancelButton({
  onClick,
  disabled,
  label,
}: {
  onClick:  () => void;
  disabled: boolean;
  label:    string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 10,
        border: `1px solid ${v1.inkHairline}`,
        background: "transparent",
        color: v1.inkMid,
        fontSize: 13,
        fontFamily: "Lora, Georgia, serif",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
