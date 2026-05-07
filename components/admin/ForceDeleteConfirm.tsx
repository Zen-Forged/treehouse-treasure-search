// components/admin/ForceDeleteConfirm.tsx
// Arc 4 D12 — confirmation modal for force-deleting a booth (claimed or
// not) with full posts cascade. Type-to-confirm input gates the destructive
// button. Mounted from VendorsTab when admin taps "Delete" on an expanded
// row.
//
// Submits DELETE /api/admin/vendors?force=1 with body { vendorId }.
// The ?force=1 flag bypasses the user_id != null safety gate so this
// modal is the canonical "I know this is destructive; proceed" surface.

"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";

interface ForceDeleteConfirmProps {
  vendorId:          string;
  displayName:       string;
  postsCount:        number;
  linked_user_email: string | null;
  onClose:   () => void;
  onDeleted: () => void;
}

export default function ForceDeleteConfirm({
  vendorId,
  displayName,
  postsCount,
  linked_user_email,
  onClose,
  onDeleted,
}: ForceDeleteConfirmProps) {
  const [typed,      setTyped]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const canSubmit = !submitting && typed.trim() === displayName.trim();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch(`/api/admin/vendors?force=1`, {
        method: "DELETE",
        body: JSON.stringify({ vendorId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? `Delete failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  const postsCopy =
    postsCount === 0 ? "No posts attached." :
    postsCount === 1 ? "1 post will be deleted." :
                       `${postsCount} posts will be deleted.`;

  return (
    <div style={backdropStyle} onClick={submitting ? undefined : onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 18,
            fontWeight: 500,
            color: RED,
            marginBottom: 10,
          }}
        >
          Delete {displayName}?
        </div>

        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 13,
            lineHeight: 1.55,
            color: v1.inkPrimary,
          }}
        >
          {postsCopy}
          {linked_user_email && (
            <>
              {" "}<strong>{linked_user_email}</strong> will lose /my-shelf access.
            </>
          )}
          <br />
          This cannot be undone.
        </div>

        <div style={{ marginTop: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              color: v1.inkMuted,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              marginBottom: 4,
            }}
          >
            Type &ldquo;{displayName}&rdquo; to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={submitting}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 14,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              borderRadius: 8,
              border: `1px solid ${v1.inkHairline}`,
              background: v1.inkWash,
              color: v1.inkPrimary,
              outline: "none",
              WebkitAppearance: "none",
            }}
          />
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(168,68,46,0.06)",
              border: `1px solid ${RED_BD}`,
              color: RED,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
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
            disabled={!canSubmit}
            onClick={submit}
            style={{
              ...dangerBtnStyle,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {submitting
              ? "Deleting…"
              : postsCount > 0
                ? `Delete ${postsCount} ${postsCount === 1 ? "post" : "posts"} + booth`
                : "Delete booth"}
          </button>
        </div>
      </div>
    </div>
  );
}

const RED    = "#a8442e"; // matches D3 collision pill
const RED_BD = "rgba(168,68,46,0.30)";

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

const dangerBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: "Lora, Georgia, serif",
  background: RED,
  color: v1.onGreen,
  border: `1px solid ${RED}`,
};
