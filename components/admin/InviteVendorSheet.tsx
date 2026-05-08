// components/admin/InviteVendorSheet.tsx
// Arc 4 follow-up — invite a vendor to claim a pre-seeded orphan booth.
//
// Surfaces in <VendorsTab> when vendor.user_id IS NULL AND there is no
// matching vendor_request (orphan-unlinked). Mirrors ForceUnlinkConfirm's
// centered-modal shape with form inputs.
//
// Submits POST /api/admin/vendor-invite { vendorId, email, firstName?, lastName? }.
// Server synthesizes an approved vendor_requests row + fires the existing
// approval email; auto-claim attaches user_id when vendor signs in.

"use client";

import { useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { v1 } from "@/lib/tokens";

interface InviteVendorSheetProps {
  vendorId:    string;
  displayName: string;
  mallName:    string | null;
  boothNumber: string | null;
  onClose:   () => void;
  /** Fires after the email send + request synth both succeed. The boolean
   *  flags whether the email actually went out (Resend can fail; the
   *  vendor_request still saves). Parent uses it to vary toast copy. */
  onInvited: (email: string, emailSent: boolean) => void;
}

export default function InviteVendorSheet({
  vendorId,
  displayName,
  mallName,
  boothNumber,
  onClose,
  onInvited,
}: InviteVendorSheetProps) {
  const [email,      setEmail]      = useState("");
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement | null>(null);

  // Lock body overflow + auto-focus email field on mount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => emailRef.current?.focus(), 50);
    return () => { document.body.style.overflow = prev; };
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit  = emailValid && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authFetch("/api/admin/vendor-invite", {
        method: "POST",
        body: JSON.stringify({
          vendorId,
          email:     email.trim(),
          firstName: firstName.trim() || undefined,
          lastName:  lastName.trim()  || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? `Invite failed (${res.status}).`);
        setSubmitting(false);
        return;
      }
      onInvited(email.trim(), Boolean(json?.emailSent));
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  // Where the booth lives — inline subtitle so admin can confirm before
  // sending. Falls back gracefully if mall join failed.
  const locator =
    [mallName, boothNumber ? `Booth ${boothNumber}` : null]
      .filter(Boolean)
      .join(" · ") || "—";

  return (
    <div style={backdropStyle} onClick={submitting ? undefined : onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 18,
            fontWeight: 500,
            color: v1.green,
            marginBottom: 6,
          }}
        >
          Invite vendor
        </div>
        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 12,
            color: v1.inkMuted,
            marginBottom: 14,
            fontStyle: "italic",
          }}
        >
          {displayName} · {locator}
        </div>

        <div
          style={{
            fontFamily: "Lora, Georgia, serif",
            fontSize: 13,
            lineHeight: 1.55,
            color: v1.inkPrimary,
            marginBottom: 14,
          }}
        >
          They&rsquo;ll receive an email asking them to sign in with this address.
          On their first sign-in, the booth claims to their account automatically.
        </div>

        <Field label="Email *">
          <input
            ref={emailRef}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor@example.com"
            disabled={submitting}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="First name">
              <input
                type="text"
                autoComplete="off"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                style={inputStyle}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Last name">
              <input
                type="text"
                autoComplete="off"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitting}
                style={inputStyle}
              />
            </Field>
          </div>
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
            disabled={!canSubmit}
            onClick={submit}
            style={{
              ...primaryBtnStyle,
              background:  canSubmit ? v1.green : v1.inkFaint,
              borderColor: canSubmit ? v1.green : v1.inkFaint,
              opacity: submitting ? 0.55 : 1,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontFamily: "Lora, Georgia, serif",
          fontSize: 13,
          color: v1.inkMid,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </label>
  );
}

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
  maxWidth: 380,
  background: v1.paperCream,
  borderRadius: 14,
  padding: "20px 20px 18px",
  boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${v1.inkHairline}`,
  background: "#fff",
  fontFamily: "Lora, Georgia, serif",
  fontSize: 14,
  color: v1.inkPrimary,
  outline: "none",
  boxSizing: "border-box",
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
