// app/login/email/page.tsx
// Vendor sign-in form — email → 6-digit OTP code entry.
// Session 93 — extracted from the previous /login page when login triage shipped.
//
// /login is now a triage page (returning vendor vs. new vendor cards). The OTP
// form moved here so the triage layer reads cleanly. Inbound deep-links to
// /login with ?redirect=/x now land on triage; triage forwards them to
// /login/email?redirect=/x to skip the picker (already-known returning user).
//
// What's preserved from the previous /login:
//   - Email entry → magic-link send + 6-digit OTP path (lib/auth.ts sendMagicLink)
//   - Code entry, paste-from-clipboard, resend cooldown (30s)
//   - BroadcastChannel cross-tab auth sync
//   - Sign-out italic dotted-link (only renders when authed)
//   - Mode-C masthead (back arrow only)
//
// What's intentionally NOT here:
//   - The ?confirmed=1 magic-link callback bridge — that stays at /login (path a
//     decision: callback URL unchanged, triage page detects ?confirmed=1 and
//     renders the confirming bridge in place of the triage cards). No changes
//     to lib/auth.ts or email templates needed.
//   - The "Need help? Contact us" link — moved to triage (/login) only.
//   - Auto-redirect for already-authed users — handled at /login (the entry).
//
// V2 styling vs. previous /login:
//   - Vertical centering (flex column with center-justified body)
//   - Warm postit white (v1.postit, #fbf3df) on the form input + bottom callout
//   - Bottom "New to Treehouse Finds? / Create a vendor account" callout card
//     (replaces the retired "First time?…" line as the primary discovery hook;
//     the helper line below the CTA stays as a quieter reassurance)

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader, Clipboard, CircleUser, Store, KeyRound } from "lucide-react";
import { sendMagicLink, getSession, signOut, onAuthChange, isAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import FormField, { formInputStyle } from "@/components/FormField";
import FormButton from "@/components/FormButton";
import type { User } from "@supabase/supabase-js";

type Screen = "enter-email" | "enter-code";

const AUTH_CHANNEL = "treehouse_auth";
const RESEND_COOLDOWN_SEC = 30;

function safeRedirect(next: string | null, fallback = "/my-shelf"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

const inputErrorOverride: React.CSSProperties = {
  border: `1.5px solid ${v1.redBorder}`,
  padding: "13.5px 13.5px",
};

function LoginEmailInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [screen, setScreen] = useState<Screen>("enter-email");
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const [authedUser, setAuthedUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [code,          setCode]          = useState("");
  const [codeBusy,      setCodeBusy]      = useState(false);
  const [codeError,     setCodeError]     = useState<string | null>(null);
  const [resendIn,      setResendIn]      = useState(0);
  const [resendNotice,  setResendNotice]  = useState<string | null>(null);
  const [canPaste,      setCanPaste]      = useState(false);
  const codeInputRef                     = useRef<HTMLInputElement>(null);

  function pickDest(user: User | null): string {
    const explicit = searchParams.get("redirect") ?? searchParams.get("next");
    if (explicit) return safeRedirect(explicit);
    // R1 — shopper claim flow. After in-app OTP code success, route to
    // the handle picker instead of /my-shelf when role=shopper. The
    // handle page idempotently bounces returning shoppers to /me.
    if (searchParams.get("role") === "shopper") return "/login/email/handle";
    return user && isAdmin(user) ? "/" : "/my-shelf";
  }

  useEffect(() => {
    const explicitRedirect = searchParams.get("redirect") ?? searchParams.get("next");
    getSession().then(s => {
      if (!s?.user) return;
      if (explicitRedirect) router.replace(pickDest(s.user));
      else setAuthedUser(s.user);
    });

    const unsub = onAuthChange(user => {
      if (user) {
        if (explicitRedirect) router.replace(pickDest(user));
        else setAuthedUser(user);
      } else {
        setAuthedUser(null);
      }
    });

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

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (screen === "enter-code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const supported = !!(navigator.clipboard && typeof navigator.clipboard.readText === "function");
    setCanPaste(supported);
  }, []);

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

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true); setError(null);

    // R1 — when role=shopper, thread /login/email/handle as the magic-link
    // redirectTo so the email round-trip lands on the handle picker. An
    // explicit ?redirect= param wins (e.g. /vendor-request "Sign in" ask).
    const explicit = searchParams.get("redirect") ?? undefined;
    const role     = searchParams.get("role");
    const redirect = explicit ?? (role === "shopper" ? "/login/email/handle" : undefined);
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

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOut(); } catch {}
    setAuthedUser(null);
    setSigningOut(false);
  }

  async function handleResend() {
    if (resendIn > 0 || !sentTo) return;
    setCodeError(null);
    setResendNotice(null);
    // R1 — preserve role=shopper threading on resend so the magic-link
    // round-trip still lands on /login/email/handle.
    const explicit = searchParams.get("redirect") ?? undefined;
    const role     = searchParams.get("role");
    const redirect = explicit ?? (role === "shopper" ? "/login/email/handle" : undefined);
    const { error: err } = await sendMagicLink(sentTo, redirect);
    if (err) {
      setCodeError("Couldn't resend. Try again in a moment.");
      return;
    }
    setResendNotice("New code sent.");
    setResendIn(RESEND_COOLDOWN_SEC);
    setCode("");
    codeInputRef.current?.focus();
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
      <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px", flexShrink: 0 }}>
        <button
          onClick={() => {
            if (screen === "enter-code") {
              setScreen("enter-email");
              setCode("");
              setCodeError(null);
            } else if (authedUser) {
              // Authed user arrived here via /login auto-forward (BottomNav
              // Profile tap surfaces the sign-out screen). Back should exit
              // to Home — pushing to /login would auto-forward straight back
              // here and trap the user in a loop.
              router.push("/");
            } else {
              router.push("/login");
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
          justifyContent: "center",
          alignItems: "center",
          padding: "0 28px 8px",
          minHeight: 0,
        }}
      >
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
          {authedUser && screen === "enter-email"
            ? "You're signed in"
            : "Vendor Sign in"}
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
          {authedUser && screen === "enter-email"
            ? "Manage your booth, jump into admin tools, or sign out."
            : screen === "enter-code"
            ? "We sent a 6-digit code to your email."
            : "Enter the email connected to your booth. We'll email you a 6-digit code."}
        </p>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <AnimatePresence mode="wait">

            {/* R10 (session 107) — authed-state action cards. When the user
                lands on /login/email already signed in (BottomNav Profile tap
                forwards through /login → here), surface inline links to
                /my-shelf + /admin (admin only) instead of the email form. The
                BottomNav redesign drops My Booth + Admin tabs and redistributes
                their entry points to this Profile destination. */}
            {screen === "enter-email" && authedUser && (
              <motion.div
                key="authed-cards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <ActionCard
                  href="/my-shelf"
                  title="Manage my booth"
                  subtitle="Edit your shelf, post new finds, mark items sold."
                  icon={<Store size={20} strokeWidth={1.6} />}
                />
                {isAdmin(authedUser) && (
                  <ActionCard
                    href="/admin"
                    title="Admin tools"
                    subtitle="Locations, vendors, banners, and approvals."
                    icon={<KeyRound size={20} strokeWidth={1.6} />}
                  />
                )}
              </motion.div>
            )}

            {screen === "enter-email" && !authedUser && (
              <motion.div
                key="email-enter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <FormField label="Email address" size="page">
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
                    style={{
                      ...formInputStyle("page"),
                      boxSizing: "border-box",
                      appearance: "none",
                      WebkitAppearance: "none",
                      ...(error ? inputErrorOverride : null),
                    }}
                  />
                </FormField>

                {error && <ErrorBanner message={error} />}

                <FormButton
                  onClick={handleSend}
                  disabled={busy || !email.trim()}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {busy ? (
                    <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</>
                  ) : (
                    <><Mail size={14} strokeWidth={1.8} /> Email me a code</>
                  )}
                </FormButton>

                <p
                  style={{
                    fontFamily: FONT_LORA,
                    fontStyle: "italic",
                    fontSize: 12,
                    color: v1.inkFaint,
                    textAlign: "center",
                    lineHeight: 1.6,
                    margin: "6px 0 0",
                  }}
                >
                  First time? An account is created automatically.
                </p>
              </motion.div>
            )}

            {screen === "enter-code" && (
              <motion.div
                key="email-code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
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

                <FormField label="6-digit code" size="page">
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    placeholder="______"
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
                      ...formInputStyle("page"),
                      boxSizing: "border-box",
                      appearance: "none",
                      WebkitAppearance: "none",
                      fontSize: 28,
                      padding: "18px 14px",
                      textAlign: "center",
                      letterSpacing: "0.4em",
                      fontFamily: FONT_SYS,
                      opacity: codeBusy ? 0.6 : 1,
                      ...(codeError ? inputErrorOverride : null),
                    }}
                  />
                </FormField>

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

        {/* "New to Treehouse Finds?" card hides for authed users — they don't
            need a vendor-account-creation prompt when they're already signed
            in. */}
        {screen === "enter-email" && !authedUser && (
          <a
            href="/vendor-request"
            style={{
              marginTop: 22,
              padding: "14px 14px",
              background: v1.postit,
              borderRadius: 12,
              border: `1px solid ${v1.inkHairline}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              textDecoration: "none",
              width: "100%",
              maxWidth: 340,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                color: v1.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
                <path d="M3 21V8l9-5 9 5v13" />
                <path d="M9 21V12h6v9" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONT_LORA, fontSize: 14, color: v1.inkMuted, lineHeight: 1.3 }}>
                New to Treehouse Finds?
              </div>
              <div
                style={{
                  fontFamily: FONT_LORA,
                  fontSize: 14,
                  color: v1.inkPrimary,
                  textDecoration: "underline",
                  textDecorationStyle: "dotted",
                  textDecorationColor: v1.inkFaint,
                  textUnderlineOffset: 3,
                  lineHeight: 1.3,
                }}
              >
                Create a vendor account
              </div>
            </div>
            <span style={{ color: v1.inkFaint, flexShrink: 0, fontFamily: FONT_LORA, fontSize: 22 }}>›</span>
          </a>
        )}
      </div>

      {authedUser && screen === "enter-email" && (
        <div style={{ flexShrink: 0, padding: "0 28px 26px", textAlign: "center" }}>
          <FormButton
            variant="link"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ opacity: signingOut ? 0.5 : 1 }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </FormButton>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// R10 (session 107) — authed-state action card on /login/email. Shape mirrors
// the /login triage cards (post-it surface, paper hairline, 14px radius, icon
// bubble + title + italic subtitle + chevron) but without an inner CTA pill
// since the entire card is the action.
function ActionCard({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        padding: "14px 14px",
        background: v1.postit,
        borderRadius: 14,
        border: `1px solid ${v1.inkHairline}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(30,77,43,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: v1.green,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontSize: 16,
              color: v1.inkPrimary,
              lineHeight: 1.25,
              margin: "0 0 2px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 12,
              color: v1.inkMuted,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        </div>
        <span
          style={{
            color: v1.inkFaint,
            flexShrink: 0,
            fontSize: 22,
            lineHeight: 1,
            fontFamily: FONT_LORA,
          }}
        >
          ›
        </span>
      </div>
    </a>
  );
}

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

export default function LoginEmailPage() {
  return (
    <Suspense>
      <LoginEmailInner />
    </Suspense>
  );
}
