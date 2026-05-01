// app/admin/login/page.tsx
// Admin PIN sign-in — dedicated route (docs/design-system.md v1.1k (g)).
//
// Written session 25 from the v1.1k spec. Session 23's CLAUDE.md documented
// this file as shipped but the actual filesystem write never landed — same
// orphan-pattern as session 13's lib/imageUpload.ts. The /admin unauth-gate
// redirect (session 23, surgical edit on app/admin/page.tsx) already points
// here. This file closes the gap.
//
// Scope (from v1.1k commitment):
//  - Dedicated PIN entry route — NOT a tab on /login anymore (tab retired v1.1k (f))
//  - Three states: PIN entry · signing-in bridge · inline error
//  - Composition: Mode C chrome + paper-wash logo bubble with Shield glyph +
//    "Admin Sign in" title + password input + filled green CTA with inline
//    Shield + signing-in bridge identical to /login's confirming state
//  - /admin itself deliberately out of scope — its unauth-gate redirect
//    (/login → /admin/login) was the only touch. Full consolidation is T4b.
//
// Auth flow (unchanged from the pre-v1.1k tab version):
//   1. User enters PIN → POST /api/auth/admin-pin { pin }
//   2. Server verifies PIN → generates magic link via service role →
//      returns { otp, email }
//   3. Client calls supabase.auth.verifyOtp({ email, token: otp, type: "email" })
//   4. On success → router.replace("/admin")
//
// v1.1k primitives used (matches /login exactly so the two sign-in flows
// read as siblings):
//   - paperCream bg + Mode C chrome
//   - paper-wash 44px logo bubble (shared primitive with /login, differentiated
//     only by glyph: leaf logo on /login, Shield on /admin/login)
//   - Form input primitive (white translucent 14px radius + inkHairline)
//   - Filled green CTA (commit action rule — v1.1k (c))
//   - Paper-wash 60px bubble + spinner for signing-in bridge
//   - IM Fell English title + italic subhead; FONT_SYS for the PIN input
//     itself (precise data voice)

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import FormField, { formInputStyle } from "@/components/FormField";
import FormButton from "@/components/FormButton";

type Screen = "enter-pin" | "signing-in";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// PIN input is a large-font numeric entry — preserves +4px vertical
// padding over the canonical 14×14 to give the 22px digits more
// breathing room (matches /login/email OTP code input pattern).
const pinInputOverride: React.CSSProperties = {
  padding: "18px 14px",
  fontSize: 22,
  fontFamily: FONT_SYS,
  textAlign: "center",
  letterSpacing: "0.4em",
};

const pinInputErrorOverride: React.CSSProperties = {
  border: `1.5px solid ${v1.redBorder}`,
  padding: "17.5px 13.5px",
};

// ─── Inner component ──────────────────────────────────────────────────────────

function AdminLoginInner() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("enter-pin");
  const [pin,    setPin]    = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSubmit() {
    if (!pin.trim() || busy) return;
    setBusy(true);
    setError(null);

    try {
      // 1. POST PIN to server → server verifies + returns OTP
      const res = await fetch("/api/auth/admin-pin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pin: pin.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Couldn't sign in. Try again.");
        setBusy(false);
        setPin("");
        return;
      }

      const { otp, email } = json;
      if (!otp || !email) {
        setError("Server didn't return a token. Try again.");
        setBusy(false);
        setPin("");
        return;
      }

      // 2. Show signing-in bridge while verifyOtp completes
      setScreen("signing-in");

      // 3. Exchange OTP for a session
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type:  "email",
      });

      if (verifyErr) {
        console.error("[admin-login] verifyOtp error:", verifyErr.message);
        setError("Couldn't complete sign-in. Try again in a moment.");
        setScreen("enter-pin");
        setBusy(false);
        setPin("");
        return;
      }

      // 4. Land on /admin
      router.replace("/admin");
    } catch (err) {
      console.error("[admin-login] unexpected error:", err);
      setError("Something went wrong. Try again.");
      setScreen("enter-pin");
      setBusy(false);
      setPin("");
    }
  }

  // ── Signing-in bridge (identical treatment to /login's confirming state) ──
  if (screen === "signing-in") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(42,26,10,0.04)",
            border: `0.5px solid ${v1.inkHairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Loader
            size={22}
            style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }}
            strokeWidth={1.8}
          />
        </div>
        <h1
          style={{
            fontFamily: FONT_LORA,
            fontSize: 28,
            color: v1.inkPrimary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "0 0 8px",
          }}
        >
          Signing you in&hellip;
        </h1>
        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMuted,
            lineHeight: 1.55,
            margin: "0 auto",
            maxWidth: 300,
          }}
        >
          Just a moment.
        </p>
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // ── PIN entry screen ──────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Mode C header — back arrow only */}
      <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px" }}>
        <button
          onClick={() => router.push("/")}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: v1.iconBubble,
            border: "none",
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "64px 28px 80px",
        }}
      >
        {/* Paper-wash logo bubble with Shield glyph (differentiates from
            curator's leaf logo on /login — audience cue). */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(42,26,10,0.04)",
            border: `0.5px solid ${v1.inkHairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Shield
            size={20}
            strokeWidth={1.6}
            style={{
              color: v1.green,
              fill: "rgba(30,77,43,0.15)",
            }}
          />
        </div>

        <h1
          style={{
            fontFamily: FONT_LORA,
            fontSize: 28,
            color: v1.inkPrimary,
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "0 0 8px",
          }}
        >
          Admin Sign in
        </h1>
        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMuted,
            textAlign: "center",
            lineHeight: 1.55,
            margin: "0 auto 28px",
            maxWidth: 300,
          }}
        >
          Enter your PIN to continue.
        </p>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div style={{ textAlign: "center" }}>
              <FormField label="PIN" size="page">
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !busy && pin.trim()) {
                      handleSubmit();
                    }
                  }}
                  disabled={busy}
                  style={{
                    ...formInputStyle("page"),
                    boxSizing: "border-box",
                    appearance: "none",
                    WebkitAppearance: "none",
                    ...pinInputOverride,
                    opacity: busy ? 0.6 : 1,
                    ...(error ? pinInputErrorOverride : null),
                  }}
                />
              </FormField>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: "11px 14px",
                    borderRadius: 10,
                    background: v1.redBg,
                    border: `1px solid ${v1.redBorder}`,
                    fontFamily: FONT_SYS,
                    fontSize: 13,
                    color: v1.red,
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <FormButton
              onClick={handleSubmit}
              disabled={busy || !pin.trim()}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {busy ? (
                <>
                  <Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} />
                  Signing in&hellip;
                </>
              ) : (
                <>
                  <Shield size={14} strokeWidth={1.8} />
                  Sign in as Admin
                </>
              )}
            </FormButton>

            <p
              style={{
                fontFamily: FONT_SYS,
                fontSize: 12,
                color: v1.inkFaint,
                textAlign: "center",
                lineHeight: 1.6,
                margin: "4px 0 0",
              }}
            >
              Admin access only. Curators{" "}
              <a
                onClick={() => router.push("/login")}
                style={{
                  fontFamily: FONT_LORA,
                  fontStyle: "italic",
                  color: v1.inkMuted,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  cursor: "pointer",
                }}
              >
                sign in here
              </a>
              .
            </p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Page — Suspense wrapper (defensive, no searchParams used today but keeps
// shape consistent with /login so a future redirect param can be added without
// restructuring) ─────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginInner />
    </Suspense>
  );
}
