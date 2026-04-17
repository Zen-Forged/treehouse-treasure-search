// app/login/page.tsx
// Curator sign-in with two modes:
//   1. Magic link (email OTP) — for vendors
//   2. Admin PIN  — for David, no email required, instant session
//
// BroadcastChannel syncs auth across tabs (magic link opens in new tab on mobile).
// useSearchParams wrapped in Suspense per Next.js 14 App Router requirement.
//
// Redirect flow:
//   /login?redirect=/setup  → passed to sendMagicLink as `next` param
//   email round trip lands on /login?confirmed=1&next=/setup
//   post-auth polling reads `next` and forwards (validated as safe relative path)

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
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

type Screen  = "enter-email" | "check-email" | "confirming" | "pin-signing-in";
type TabMode = "email" | "pin";

const AUTH_CHANNEL = "treehouse_auth";

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

  // PIN state
  const [pin,      setPin]      = useState("");
  const [pinBusy,  setPinBusy]  = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // ── Confirmed redirect from magic link ──
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

  // ── Magic link send ──
  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true); setError(null);

    // Forward the incoming ?redirect= param through the magic-link round trip.
    const redirect = searchParams.get("redirect") ?? undefined;
    const { error: err } = await sendMagicLink(trimmed, redirect);

    setBusy(false);
    if (err) { setError("Couldn't send the link. Try again in a moment."); return; }
    setSentTo(trimmed);
    setScreen("check-email");
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

      // Verify the OTP server-generated for the admin email.
      // type: "email" works with the email_otp returned by generateLink.
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

  // ── Confirming (returned from magic link) ──
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
        <button onClick={() => router.push("/")}
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
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 1.6, margin: 0, maxWidth: 240 }}>
            {tab === "email" ? "We'll send you a sign-in link. No password needed." : "Admin access — enter your PIN."}
          </p>
        </div>

        {/* Tab switcher */}
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
                  {t === "email" ? "Email link" : "Admin PIN"}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ width: "100%", maxWidth: 320 }}>
          <AnimatePresence mode="wait">

            {/* ── Email tab ── */}
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
                  {busy ? <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</> : <><Mail size={14} /> Send sign-in link</>}
                </button>
                <p style={{ fontSize: 11, color: C.textFaint, textAlign: "center", lineHeight: 1.6, margin: "4px 0 0" }}>
                  First time? An account is created automatically.
                </p>
              </motion.div>
            )}

            {/* ── Check email ── */}
            {tab === "email" && screen === "check-email" && (
              <motion.div key="email-check"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mail size={20} style={{ color: C.green }} />
                </div>
                <div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 6 }}>Check your email</div>
                  <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: C.textMuted, margin: "0 0 2px" }}>Link sent to</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0, wordBreak: "break-all" }}>{sentTo}</p>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, width: "100%", boxSizing: "border-box" }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.textMid, lineHeight: 1.65 }}>
                    Tap the link — it opens in a new tab and signs you in. You can then return here or close this tab.
                  </p>
                </div>
                <button onClick={() => { setScreen("enter-email"); setEmail(""); setError(null); }}
                  style={{ fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Wrong email? Try again
                </button>
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
