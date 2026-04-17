// app/login/page.tsx
// Curator sign-in with two modes:
//   1. Email → 6-digit OTP code entry (primary, PWA-friendly)
//      Magic link in the same email still works as a fallback (Supabase sends both).
//   2. Admin PIN — for David, no email required, instant session
//
// BroadcastChannel syncs auth across tabs (magic link opens in new tab on mobile).
// useSearchParams wrapped in Suspense per Next.js 14 App Router requirement.
//
// Redirect flow:
//   /login?redirect=/setup  → passed to sendMagicLink as `next` param (for magic link round trip)
//                            → also read directly on verifyOtp success (for OTP code entry)
//   OTP path: user enters code → verifyOtp → router.replace(safeRedirect(redirect))
//   Link path: email round trip lands on /login?confirmed=1&next=/setup → post-auth polling

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Check, Loader, Shield } from "lucide-react";
import { sendMagicLink, getSession, onAuthChange } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const C = {
  bg:          "#f5f2eb",
  surface:     "#edeae1",
  border:      "rgba(26,24,16,0.09)",
  textPrimary: "#1c1a14",
  textMid:     "#4a4840",
  textMuted:   "#8a8476",
  textFaint:   "#b4ae9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.08)",
  greenBorder: "rgba(30,77,43,0.20)",
  input:       "rgba(255,255,255,0.80)",
  inputBorder: "rgba(26,24,16,0.14)",
  red:         "#8b2020",
  redBg:       "rgba(139,32,32,0.07)",
  redBorder:   "rgba(139,32,32,0.18)",
};

type Screen  = "enter-email" | "enter-code" | "confirming" | "pin-signing-in";
type TabMode = "email" | "pin";

const AUTH_CHANNEL = "treehouse_auth";
const RESEND_COOLDOWN_SEC = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Only follow same-origin relative paths. Rejects:
 *   - Missing / empty values
 *   - Absolute URLs (https://evil.com)
 *   - Protocol-relative URLs (//evil.com)
 *   - Anything not starting with `/`
 */
function safeRedirect(next: string | null, fallback = "/my-shelf"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

// ─── Inner component ──────────────────────────────────────────────────────────

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [tab,    setTab]    = useState<TabMode>("email");
  const [screen, setScreen] = useState<Screen>("enter-email");
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  // OTP state
  const [code,         setCode]         = useState("");
  const [codeBusy,     setCodeBusy]     = useState(false);
  const [codeError,    setCodeError]    = useState<string | null>(null);
  const [resendIn,     setResendIn]     = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const codeInputRef                    = useRef<HTMLInputElement>(null);

  // PIN state
  const [pin,      setPin]      = useState("");
  const [pinBusy,  setPinBusy]  = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // ── Confirmed redirect from magic link (fallback path) ──
  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    const postAuthDest = safeRedirect(searchParams.get("next"));

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
          router.replace(postAuthDest);
        } else if (attempts > 20) {
          clearInterval(interval);
          setScreen("enter-email");
          setError("Couldn't confirm sign-in. Please try again.");
        }
      }, 500);
      return () => clearInterval(interval);
    }

    // Already logged in — honor redirect if present, otherwise /my-shelf
    getSession().then(s => { if (s?.user) router.replace(postAuthDest); });

    // Supabase auth state change (same-tab magic link flow)
    const unsub = onAuthChange(user => {
      if (user) router.replace(postAuthDest);
    });

    // BroadcastChannel — detect auth from another tab
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "signed_in") {
          getSession().then(s => { if (s?.user) router.replace(postAuthDest); });
        }
      };
    } catch {}

    return () => {
      unsub();
      try { bc?.close(); } catch {}
    };
  }, []);

  // ── Resend cooldown timer ──
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ── Focus the code input whenever we enter the code screen ──
  useEffect(() => {
    if (screen === "enter-code") {
      // tiny delay so the animation finishes and iOS doesn't swallow the focus
      const t = setTimeout(() => codeInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [screen]);

  // ── Magic link + OTP code send ──
  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true); setError(null);

    // Forward the incoming ?redirect= param through the magic-link round trip.
    // The same sendMagicLink call also triggers Supabase to email a 6-digit code.
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

  // ── OTP verify ──
  async function handleVerify(submittedCode: string) {
    const token = submittedCode.trim();
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setCodeError("Enter the 6-digit code from your email.");
      return;
    }
    setCodeBusy(true); setCodeError(null);

    const { error: verifyErr } = await supabase.auth.verifyOtp({
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

    // Signed in — preserve the ?redirect= that brought us here.
    const postAuthDest = safeRedirect(searchParams.get("redirect"));
    try {
      const bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.postMessage({ type: "signed_in" });
      bc.close();
    } catch {}
    router.replace(postAuthDest);
  }

  // ── Resend code ──
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

  // ── Admin PIN sign-in ──
  async function handlePin() {
    if (!pin.trim()) return;
    setPinBusy(true); setPinError(null);
    try {
      const res  = await fetch("/api/auth/admin-pin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error ?? "Sign-in failed.");
        setPinBusy(false);
        return;
      }

      setScreen("pin-signing-in");
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.otp,
        type:  "email",
      });
      if (verifyErr) {
        setScreen("enter-email");
        setTab("pin");
        setPinError("Sign-in failed: " + verifyErr.message);
        setPinBusy(false);
        return;
      }

      router.replace("/my-shelf");
    } catch {
      setPinError("Network error. Try again.");
      setPinBusy(false);
      setScreen("enter-email");
      setTab("pin");
    }
  }

  // ── Signing-in overlay (PIN flow) ──
  if (screen === "pin-signing-in") {
    return (
      <FullScreenCentered>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={24} style={{ color: C.green }} />
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
          Signing you in…
        </h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, margin: 0 }}>
          Just a moment.
        </p>
      </FullScreenCentered>
    );
  }

  // ── Confirming (returned from magic link fallback path) ──
  if (screen === "confirming") {
    return (
      <FullScreenCentered>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={24} style={{ color: C.green }} />
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
          Signing you in&hellip;
        </h1>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, margin: 0 }}>
          Just a moment.
        </p>
      </FullScreenCentered>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Nav */}
      <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px" }}>
        <button onClick={() => {
            if (screen === "enter-code") {
              // Back from code screen → back to email entry (not out of /login)
              setScreen("enter-email");
              setCode("");
              setCodeError(null);
            } else {
              router.push("/");
            }
          }}
          style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, border: `1px solid ${C.border}`, cursor: "pointer" }}>
          <ArrowLeft size={15} style={{ color: C.textMid }} />
        </button>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>

        {/* Logo + title */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <Image src="/logo.png" alt="Treehouse" width={28} height={28} />
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.textPrimary, textAlign: "center", lineHeight: 1.2, margin: "0 0 6px" }}>
            Curator Sign in
          </h1>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.6, margin: 0, maxWidth: 260 }}>
            {tab === "pin"
              ? "Admin access — enter your PIN."
              : screen === "enter-code"
                ? "We sent a 6-digit code to your email."
                : "We'll email you a 6-digit code. No password needed."}
          </p>
        </div>

        {/* Tab switcher — hidden once user is on the code entry screen */}
        {screen !== "enter-code" && (
          <div style={{ display: "flex", background: C.surface, borderRadius: 22, padding: 3, gap: 2, marginBottom: 24, width: "100%", maxWidth: 320 }}>
            {(["email", "pin"] as TabMode[]).map(t => {
              const active = tab === t;
              return (
                <button key={t} onClick={() => { setTab(t); setError(null); setPinError(null); }}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 19, border: "none", cursor: "pointer", background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 4px rgba(0,0,0,0.10)" : "none", transition: "background 0.18s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  {t === "email"
                    ? <Mail size={12} style={{ color: active ? C.green : C.textMuted }} />
                    : <Shield size={12} style={{ color: active ? C.green : C.textMuted }} />
                  }
                  <span style={{ fontFamily: "Georgia, serif", fontSize: 13, fontWeight: active ? 700 : 400, color: active ? C.textPrimary : C.textMuted }}>
                    {t === "email" ? "Email code" : "Admin PIN"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div style={{ width: "100%", maxWidth: 320 }}>
          <AnimatePresence mode="wait">

            {/* ── Email tab — enter email ── */}
            {tab === "email" && screen === "enter-email" && (
              <motion.div key="email-enter"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 7 }}>Email address</div>
                  <input type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && !busy && handleSend()}
                    placeholder="you@example.com" autoFocus autoCapitalize="none" autoCorrect="off"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 11, background: C.input, border: `1px solid ${error ? C.redBorder : C.inputBorder}`, color: C.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {error && <ErrorBanner message={error} />}
                <button onClick={handleSend} disabled={busy || !email.trim()}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", color: "#fff", background: busy || !email.trim() ? "rgba(30,77,43,0.40)" : C.green, border: "none", cursor: busy || !email.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {busy ? <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</> : <><Mail size={14} /> Email me a code</>}
                </button>
                <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", lineHeight: 1.6, margin: "4px 0 0" }}>
                  First time? An account is created automatically.
                </p>
              </motion.div>
            )}

            {/* ── Email tab — enter 6-digit code ── */}
            {tab === "email" && screen === "enter-code" && (
              <motion.div key="email-code"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Email echo */}
                <div style={{ padding: "10px 14px", borderRadius: 11, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={13} style={{ color: C.textMuted, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12, color: C.textMid, wordBreak: "break-all", lineHeight: 1.5 }}>
                    <span style={{ color: C.textMuted }}>Sent to </span>
                    <span style={{ fontWeight: 600, color: C.textPrimary }}>{sentTo}</span>
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 7 }}>6-digit code</div>
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={e => {
                      // strip anything that's not a digit, cap at 6
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(digits);
                      setCodeError(null);
                      setResendNotice(null);
                      // auto-submit on 6th digit
                      if (digits.length === 6 && !codeBusy) {
                        handleVerify(digits);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !codeBusy && code.length === 6) {
                        handleVerify(code);
                      }
                    }}
                    placeholder="••••••"
                    autoFocus
                    disabled={codeBusy}
                    style={{ width: "100%", padding: "14px 14px", borderRadius: 11, background: C.input, border: `1px solid ${codeError ? C.redBorder : C.inputBorder}`, color: C.textPrimary, fontSize: 24, outline: "none", boxSizing: "border-box", letterSpacing: "0.5em", textAlign: "center", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", opacity: codeBusy ? 0.6 : 1 }}
                  />
                </div>

                {codeError && <ErrorBanner message={codeError} />}
                {resendNotice && !codeError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: "9px 12px", borderRadius: 9, background: C.greenLight, border: `1px solid ${C.greenBorder}`, fontSize: 12, color: C.green }}>
                    {resendNotice}
                  </motion.div>
                )}

                {codeBusy && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, color: C.textMuted, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                    <Loader size={12} style={{ animation: "spin 0.9s linear infinite" }} />
                    Verifying…
                  </div>
                )}

                {/* Fallback line — Option B */}
                <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 11, color: C.textFaint, textAlign: "center", lineHeight: 1.65, margin: "4px 0 0" }}>
                  Or tap the link we emailed you — either works.
                </p>

                {/* Resend row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Didn&apos;t get it?</span>
                  <button
                    onClick={handleResend}
                    disabled={resendIn > 0 || codeBusy}
                    style={{ fontSize: 11, color: resendIn > 0 ? C.textFaint : C.green, background: "none", border: "none", cursor: resendIn > 0 || codeBusy ? "default" : "pointer", textDecoration: resendIn > 0 ? "none" : "underline", fontWeight: 600, padding: 0 }}>
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Admin PIN tab ── */}
            {tab === "pin" && (
              <motion.div key="pin"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                <div style={{ padding: "12px 14px", borderRadius: 11, background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <Shield size={13} style={{ color: C.green, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: C.green, lineHeight: 1.5 }}>
                    Admin-only access. Enter your PIN to sign in instantly.
                  </p>
                </div>

                <div>
                  <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 7 }}>Admin PIN</div>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={e => { setPin(e.target.value); setPinError(null); }}
                    onKeyDown={e => e.key === "Enter" && !pinBusy && handlePin()}
                    placeholder="••••••"
                    autoFocus
                    autoComplete="current-password"
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 11, background: C.input, border: `1px solid ${pinError ? C.redBorder : C.inputBorder}`, color: C.textPrimary, fontSize: 20, outline: "none", boxSizing: "border-box", letterSpacing: "0.4em", textAlign: "center" }}
                  />
                </div>

                {pinError && <ErrorBanner message={pinError} />}

                <button onClick={handlePin} disabled={pinBusy || !pin.trim()}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", color: "#fff", background: pinBusy || !pin.trim() ? "rgba(30,77,43,0.40)" : C.green, border: "none", cursor: pinBusy || !pin.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {pinBusy
                    ? <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Signing in…</>
                    : <><Shield size={14} /> Sign in as Admin</>
                  }
                </button>
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

// ─── UI helpers ───────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "9px 12px", borderRadius: 9, background: C.redBg, border: `1px solid ${C.redBorder}`, fontSize: 12, color: C.red }}>
      {message}
    </motion.div>
  );
}

function FullScreenCentered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
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
