// app/login/page.tsx
// Curator sign-in — email → 6-digit OTP code entry.
// Rewritten session 23 against docs/design-system.md v1.1k.
//
// Changes from v0.2:
//  - Admin PIN tab retired → moved to dedicated /admin/login route (v1.1k (f))
//  - Rounded-pill tab switcher retired → /login is now curator-only, no tabs
//  - v1 palette throughout (paperCream bg, v1 ink scale, inkHairline borders)
//  - IM Fell English for title + subhead + fallback copy; FONT_SYS for fields/code
//  - Form input primitive (white translucent bg, 14px radius, inkHairline border)
//  - Filled green CTA only on "Email me a code" (commit action)
//  - Code input retires monospace → FONT_SYS at 28px, 0.4em letter-spacing
//  - "pin-signing-in" state retired (no longer this route's concern)
//  - "confirming" state retires v0.2 greenLight check bubble → paper-wash primitive
//  - Email echo retires v0.2 surface-card → hairline-bordered row primitive
//  - Resend row + paste-link retoned to IM Fell italic dotted-underline vocabulary
//  - Labels retire uppercase+tracked treatment → IM Fell italic 13px muted
//
// BroadcastChannel syncs auth across tabs (magic link opens in new tab on mobile).
// useSearchParams wrapped in Suspense per Next.js 14 App Router requirement.
//
// Redirect flow (unchanged from v0.2):
//   /login?redirect=/setup  → passed to sendMagicLink as `next` param
//                            → also read directly on verifyOtp success
//   OTP path: user enters code → verifyOtp → router.replace(safeRedirect(redirect))
//   Link path: email round trip lands on /login?confirmed=1&next=/setup → polling

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader, Clipboard, CircleUser } from "lucide-react";
import { sendMagicLink, getSession, signOut, onAuthChange, isAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { User } from "@supabase/supabase-js";

type Screen = "enter-email" | "enter-code" | "confirming";

const AUTH_CHANNEL = "treehouse_auth";
const RESEND_COOLDOWN_SEC = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeRedirect(next: string | null, fallback = "/my-shelf"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

// ─── v1.1k primitives (inlined) ──────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px 14px",
  borderRadius: 14,
  background: "rgba(255,253,248,0.70)",
  border: `1px solid ${v1.inkHairline}`,
  color: v1.inkPrimary,
  fontSize: 16,
  outline: "none",
  fontFamily: FONT_SYS,
  appearance: "none",
  WebkitAppearance: "none",
};

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: `1.5px solid ${v1.redBorder}`,
  padding: "13.5px 13.5px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_LORA,
  fontStyle: "italic",
  fontSize: 13,
  color: v1.inkMuted,
  lineHeight: 1.3,
  marginBottom: 7,
};

const ctaStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "15px",
  borderRadius: 14,
  fontFamily: FONT_SYS,
  fontSize: 15,
  fontWeight: 500,
  color: "#fff",
  background: disabled ? "rgba(30,77,43,0.40)" : v1.green,
  border: "none",
  cursor: disabled ? "default" : "pointer",
  boxShadow: disabled ? "none" : "0 2px 14px rgba(30,77,43,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
});

// ─── Inner component ──────────────────────────────────────────────────────────

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [screen, setScreen] = useState<Screen>("enter-email");
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  // Session 90 — sign-out affordance for users already logged in. The
  // BottomNav Sign In tab routes here in every state; authed users see
  // the standard form plus a "sign out" italic link below the first-time
  // helper. Auto-redirect now only fires when a `redirect`/`next` query
  // param is present (approval email, deep-link, etc.) — bare /login
  // visits stay put so the sign-out is reachable.
  const [authedUser, setAuthedUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // OTP state
  const [code,          setCode]          = useState("");
  const [codeBusy,      setCodeBusy]      = useState(false);
  const [codeError,     setCodeError]     = useState<string | null>(null);
  const [resendIn,      setResendIn]      = useState(0);
  const [resendNotice,  setResendNotice]  = useState<string | null>(null);
  const [canPaste,      setCanPaste]      = useState(false);
  const codeInputRef                     = useRef<HTMLInputElement>(null);

  // Post-auth destination — admins land on "/" by default (their /my-shelf
  // resolves to a "no booth" empty state when no impersonation param is
  // present, which is misleading as a first screen). Explicit `redirect`
  // / `next` query params still win for both roles.
  function pickDest(user: User | null): string {
    const explicit = searchParams.get("redirect") ?? searchParams.get("next");
    if (explicit) return safeRedirect(explicit);
    return user && isAdmin(user) ? "/" : "/my-shelf";
  }

  // ── Confirmed redirect from magic link (fallback path) ──
  //
  // Redirect param naming note: two parallel paths in the codebase converge here.
  //   • `next`     — used by lib/auth.ts sendMagicLink's emailRedirectTo
  //                    (/login?confirmed=1&next=/setup)
  //   • `redirect` — used by lib/email.ts approval email CTA
  //                    (/login?redirect=/setup — tapped BEFORE session exists)
  // Both honored here; `redirect` preferred. KI-003 fix — session 9.
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");

    if (confirmed === "1") {
      setScreen("confirming");
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const session = await getSession();
        if (session?.user) {
          clearInterval(interval);
          try {
            const bc = new BroadcastChannel(AUTH_CHANNEL);
            bc.postMessage({ type: "signed_in", userId: session.user.id });
            bc.close();
          } catch {}
          router.replace(pickDest(session.user));
        } else if (attempts > 20) {
          clearInterval(interval);
          setScreen("enter-email");
          setError("Couldn't confirm sign-in. Please try again.");
        }
      }, 500);
      return () => clearInterval(interval);
    }

    // Session 90 — only auto-redirect already-signed-in users when an
    // explicit destination was passed (approval-email tap, deep-link).
    // A bare /login visit (BottomNav tap) hydrates the user into local
    // state so the sign-out affordance can render below the form.
    const explicitRedirect = searchParams.get("redirect") ?? searchParams.get("next");
    getSession().then(s => {
      if (!s?.user) return;
      if (explicitRedirect) router.replace(pickDest(s.user));
      else setAuthedUser(s.user);
    });

    // Supabase auth state change. Only redirect when an explicit destination
    // is set; otherwise hydrate local state so the sign-out affordance
    // tracks the live session.
    const unsub = onAuthChange(user => {
      if (user) {
        if (explicitRedirect) router.replace(pickDest(user));
        else setAuthedUser(user);
      } else {
        setAuthedUser(null);
      }
    });

    // BroadcastChannel — detect auth from another tab
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "signed_in") {
          getSession().then(s => { if (s?.user) router.replace(pickDest(s.user)); });
        }
      };
    } catch {}

    return () => {
      unsub();
      try { bc?.close(); } catch {}
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Focus code input on screen enter
  useEffect(() => {
    if (screen === "enter-code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [screen]);

  // Clipboard API availability
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const supported = !!(navigator.clipboard && typeof navigator.clipboard.readText === "function");
    setCanPaste(supported);
  }, []);

  // Paste from clipboard
  async function handlePasteCode() {
    if (!navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\d{6}/);
      if (!match) {
        setCodeError("No 6-digit code found on your clipboard.");
        return;
      }
      const digits = match[0];
      setCode(digits);
      setCodeError(null);
      setResendNotice(null);
      if (!codeBusy) {
        handleVerify(digits);
      }
    } catch {
      setCodeError("Couldn't read clipboard. Paste or type the code instead.");
    }
  }

  // Magic link + OTP code send
  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true); setError(null);

    const redirect = searchParams.get("redirect") ?? undefined;
    const { error: err } = await sendMagicLink(trimmed, redirect);

    setBusy(false);
    if (err) { setError("Couldn't send the code. Try again in a moment."); return; }
    setSentTo(trimmed);
    setCode("");
    setCodeError(null);
    setResendNotice(null);
    setResendIn(RESEND_COOLDOWN_SEC);
    setScreen("enter-code");
  }

  // OTP verify
  async function handleVerify(submittedCode: string) {
    const token = submittedCode.trim();
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setCodeError("Enter the 6-digit code from your email.");
      return;
    }
    setCodeBusy(true); setCodeError(null);

    const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
      email: sentTo,
      token,
      type: "email",
    });

    if (verifyErr) {
      const msg = verifyErr.message?.toLowerCase() ?? "";
      if (msg.includes("expired")) {
        setCodeError("That code has expired. Tap \"Resend code\" for a new one.");
      } else if (msg.includes("invalid") || msg.includes("token")) {
        setCodeError("That code doesn't match. Double-check your email.");
      } else {
        setCodeError(verifyErr.message || "Sign-in failed. Try again.");
      }
      setCodeBusy(false);
      setCode("");
      codeInputRef.current?.focus();
      return;
    }

    try {
      const bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.postMessage({ type: "signed_in" });
      bc.close();
    } catch {}
    router.replace(pickDest(verifyData?.user ?? null));
  }

  // Sign out — moved off the masthead onto this page (session 90). Visible
  // only when `authedUser` is hydrated; clears Supabase session + local
  // state so the form returns to its standard guest shape.
  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOut(); } catch {}
    setAuthedUser(null);
    setSigningOut(false);
  }

  // Resend code
  async function handleResend() {
    if (resendIn > 0 || !sentTo) return;
    setCodeError(null);
    setResendNotice(null);
    const { error: err } = await sendMagicLink(sentTo, searchParams.get("redirect") ?? undefined);
    if (err) {
      setCodeError("Couldn't resend. Try again in a moment.");
      return;
    }
    setResendNotice("New code sent.");
    setResendIn(RESEND_COOLDOWN_SEC);
    setCode("");
    codeInputRef.current?.focus();
  }

  // ── Confirming bridge (from magic-link fallback round trip) ─────────────
  if (screen === "confirming") {
    return (
      <ModeCCentered>
        <PaperWashBubble>
          <Loader size={22} style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
        </PaperWashBubble>
        <h1 style={heroTitleStyle}>Signing you in&hellip;</h1>
        <p style={heroSubheadStyle}>Just a moment.</p>
      </ModeCCentered>
    );
  }

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
          onClick={() => {
            if (screen === "enter-code") {
              setScreen("enter-email");
              setCode("");
              setCodeError(null);
            } else {
              router.push("/");
            }
          }}
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
          padding: screen === "enter-code" ? "40px 28px 80px" : "64px 28px 80px",
        }}
      >
        {/* Session 90 — background circle dropped, glyph itself sized up to
            ~44 to fill the visual footprint the bubble used to occupy. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <CircleUser size={44} strokeWidth={1.2} style={{ color: v1.inkPrimary }} />
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
          Vendor Sign in
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
          {screen === "enter-code"
            ? "We sent a 6-digit code to your email."
            : "We'll email you a 6-digit code. No password needed."}
        </p>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <AnimatePresence mode="wait">

            {/* Enter email */}
            {screen === "enter-email" && (
              <motion.div
                key="email-enter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && !busy && handleSend()}
                    placeholder="you@example.com"
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    style={error ? inputErrorStyle : inputStyle}
                  />
                </div>

                {error && <ErrorBanner message={error} />}

                <button
                  onClick={handleSend}
                  disabled={busy || !email.trim()}
                  style={ctaStyle(busy || !email.trim())}
                >
                  {busy ? (
                    <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</>
                  ) : (
                    <><Mail size={14} strokeWidth={1.8} /> Email me a code</>
                  )}
                </button>

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
                  First time? An account is created automatically.
                </p>

                {/* R7 (Wave 1 Task 6, session 91) — Contact us link.
                    Discoverability anchor for the new /contact page. Same
                    Lora italic dotted-underline vocabulary as Sign out below
                    so they read as a pair. */}
                <a
                  href="/contact"
                  style={{
                    fontFamily: FONT_LORA,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: v1.inkMuted,
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: v1.inkFaint,
                    textUnderlineOffset: 3,
                    textAlign: "center",
                    margin: "10px auto 0",
                    display: "block",
                  }}
                >
                  Need help? Contact us
                </a>

                {/* Session 90 — sign-out affordance for users already signed
                    in. Lives below the first-time helper per the directive
                    ("display 'sign out' in italics under the last
                    sentence"). Lora italic matches the page's other
                    secondary-vocabulary links. */}
                {authedUser && (
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: signingOut ? "default" : "pointer",
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: v1.inkMuted,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      textAlign: "center",
                      margin: "8px auto 0",
                      display: "block",
                      opacity: signingOut ? 0.5 : 1,
                    }}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                )}
              </motion.div>
            )}

            {/* Enter 6-digit code */}
            {screen === "enter-code" && (
              <motion.div
                key="email-code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Email echo line primitive */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 0",
                    borderTop: `0.5px solid ${v1.inkHairline}`,
                    borderBottom: `0.5px solid ${v1.inkHairline}`,
                    marginBottom: 4,
                  }}
                >
                  <Mail size={14} style={{ color: v1.inkMuted, flexShrink: 0 }} strokeWidth={1.6} />
                  <span style={{ fontFamily: FONT_SYS, fontSize: 14, color: v1.inkMuted, flexShrink: 0 }}>
                    Sent to&nbsp;
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_SYS,
                      fontSize: 14,
                      color: v1.inkPrimary,
                      fontWeight: 500,
                      wordBreak: "break-all",
                      minWidth: 0,
                    }}
                  >
                    {sentTo}
                  </span>
                </div>

                <div>
                  <label style={labelStyle}>6-digit code</label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(digits);
                      setCodeError(null);
                      setResendNotice(null);
                      if (digits.length === 6 && !codeBusy) {
                        handleVerify(digits);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !codeBusy && code.length === 6) {
                        handleVerify(code);
                      }
                    }}
                    autoFocus
                    disabled={codeBusy}
                    style={{
                      ...(codeError ? inputErrorStyle : inputStyle),
                      fontSize: 28,
                      padding: "18px 14px",
                      textAlign: "center",
                      letterSpacing: "0.4em",
                      fontFamily: FONT_SYS,
                      opacity: codeBusy ? 0.6 : 1,
                    }}
                  />
                </div>

                {/* Paste-from-clipboard — retoned text link */}
                {canPaste && (
                  <button
                    onClick={handlePasteCode}
                    disabled={codeBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: codeBusy ? "default" : "pointer",
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: v1.inkMuted,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                      textAlign: "center",
                      opacity: codeBusy ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <Clipboard size={13} style={{ color: v1.green }} strokeWidth={1.8} />
                    Paste code from clipboard
                  </button>
                )}

                {codeError && <ErrorBanner message={codeError} />}

                {resendNotice && !codeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 9,
                      background: "rgba(42,26,10,0.03)",
                      border: `0.5px solid ${v1.inkHairline}`,
                      fontFamily: FONT_SYS,
                      fontSize: 12,
                      color: v1.inkMid,
                      textAlign: "center",
                    }}
                  >
                    {resendNotice}
                  </motion.div>
                )}

                {codeBusy && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      fontFamily: FONT_LORA,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: v1.inkMuted,
                    }}
                  >
                    <Loader size={12} style={{ animation: "spin 0.9s linear infinite" }} />
                    Verifying…
                  </div>
                )}

                {/* Fallback line */}
                <p
                  style={{
                    fontFamily: FONT_LORA,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: v1.inkFaint,
                    textAlign: "center",
                    lineHeight: 1.65,
                    margin: "10px 0 0",
                  }}
                >
                  Or tap the link we emailed you &mdash; either works.
                </p>

                {/* Resend row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 12,
                    fontFamily: FONT_SYS,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: v1.inkMuted }}>Didn&apos;t get it?</span>
                  <button
                    onClick={handleResend}
                    disabled={resendIn > 0 || codeBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: resendIn > 0 || codeBusy ? "default" : "pointer",
                      fontSize: 13,
                      color: resendIn > 0 ? v1.inkFaint : v1.inkPrimary,
                      textDecoration: resendIn > 0 ? "none" : "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v1.inkFaint,
                      textUnderlineOffset: 3,
                    }}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Shared primitives (Mode C + error banner + hero center) ─────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "11px 14px",
        borderRadius: 10,
        background: v1.redBg,
        border: `1px solid ${v1.redBorder}`,
        fontFamily: FONT_SYS,
        fontSize: 13,
        color: v1.red,
        lineHeight: 1.5,
      }}
    >
      {message}
    </motion.div>
  );
}

function PaperWashBubble({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

const heroTitleStyle: React.CSSProperties = {
  fontFamily: FONT_LORA,
  fontSize: 28,
  color: v1.inkPrimary,
  textAlign: "center",
  lineHeight: 1.2,
  letterSpacing: "-0.005em",
  margin: "0 0 8px",
};

const heroSubheadStyle: React.CSSProperties = {
  fontFamily: FONT_LORA,
  fontStyle: "italic",
  fontSize: 15,
  color: v1.inkMuted,
  textAlign: "center",
  lineHeight: 1.55,
  margin: "0 auto",
  maxWidth: 300,
};

function ModeCCentered({ children }: { children: React.ReactNode }) {
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
        gap: 0,
        textAlign: "center",
        padding: "0 28px",
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      {children}
    </div>
  );
}

// ─── Page — Suspense for useSearchParams ──────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
