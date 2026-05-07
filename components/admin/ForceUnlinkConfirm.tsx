// components/admin/ForceUnlinkConfirm.tsx
// Arc 4 D13 — confirmation modal for clearing vendors.user_id without
// deleting the row. Reversible action — single tap, no type-to-confirm.
// Mounted from VendorsTab when admin taps "Force-unlink" on an expanded
// row whose user_id != null.
//
// Submits PATCH /api/admin/vendors { vendorId, action: "force-unlink" }.

"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";

interface ForceUnlinkConfirmProps {
  vendorId:          string;
  displayName:       string;
  linked_user_email: string | null;
  onClose:    () => void;
  onUnlinked: () => void;
}

export default function ForceUnlinkConfirm({
  vendorId,
  displayName,
  linked_user_email,
  onClose,
  onUnlinked,
}: ForceUnlinkConfirmProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/admin/vendors", {
        method: "PATCH",
        body: JSON.stringify({ vendorId, action: "force-unlink" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? `Unlink failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      onUnlinked();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div style={backdropStyle} onClick={submitting ? undefined : onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 18,
            fontWeight: 500,
            color: AMBER,
            marginBottom: 12,
          }}
        >
          Unlink {displayName}?
        </div>

        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 13,
            lineHeight: 1.55,
            color: v1.inkPrimary,
          }}
        >
          {linked_user_email ? (
            <>
              <strong>{linked_user_email}</strong> will lose /my-shelf access.
            </>
          ) : (
            <>The linked user will lose /my-shelf access.</>
          )}
          <br />
          The booth row stays in place — re-link a different user via Relink, or delete the booth entirely.
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(168,68,46,0.06)",
              border: "1px solid rgba(168,68,46,0.30)",
              color: "#a8442e",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            style={cancelBtnStyle}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            style={{
              ...primaryBtnStyle,
              background: AMBER,
              borderColor: AMBER,
              opacity: submitting ? 0.55 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Unlinking…" : "Unlink"}
          </button>
        </div>
      </div>
    </div>
  );
}

const AMBER = "#b6843a"; // matches D3 unlinked pill

const backdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  background: v1.paperCream,
  borderRadius: 14,
  padding: "20px 20px 18px",
  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
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
  color: v1.onGreen,
  border: "1px solid",
};
