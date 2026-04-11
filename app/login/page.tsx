// app/login/page.tsx
// Magic link login — sends OTP email, confirms session, routes to /my-shelf.
// Handles the redirect back from the email link (?confirmed=1).
//
// UX fix: BroadcastChannel lets an already-open tab detect when the magic link
// is clicked in a new tab (common on mobile email clients) and auto-navigate
// to /my-shelf without requiring the user to manually switch back.
//
// useSearchParams wrapped in Suspense per Next.js 14 App Router requirement.

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Check, Loader } from "lucide-react";
import { sendMagicLink, getSession, onAuthChange } from "@/lib/auth";

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

type Screen = "enter-email" | "check-email" | "confirming";

const AUTH_CHANNEL = "treehouse_auth";

// ─── Inner component — uses useSearchParams so must be inside Suspense ────────

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState<Screen>("enter-email");
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    const confirmed = searchParams.get("confirmed");

    if (confirmed === "1") {
      // This tab received the magic link redirect — confirm session and redirect
      setScreen("confirming");
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const session = await getSession();
        if (session?.user) {
          clearInterval(interval);
          // Broadcast to other open tabs that auth completed
          try {
            const bc = new BroadcastChannel(AUTH_CHANNEL);
            bc.postMessage({ type: "signed_in", userId: session.user.id });
            bc.close();
          } catch {}
          router.replace("/my-shelf");
        } else if (attempts > 20) {
          clearInterval(interval);
          setScreen("enter-email");
          setError("Couldn't confirm sign-in. Please try again.");
        }
      }, 500);
      return () => clearInterval(interval);
    }

    // Already logged in — skip to My Shelf
    getSession().then(s => { if (s?.user) router.replace("/my-shelf"); });

    // Listen for auth state changes via Supabase (handles same-tab magic link)
    const unsub = onAuthChange(user => {
      if (user) router.replace("/my-shelf");
    });

    // Listen for auth from another tab via BroadcastChannel
    // (magic link clicked in email app opens new tab, this tab should react)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "signed_in") {
          // Another tab completed auth — reload our session and navigate
          getSession().then(s => {
            if (s?.user) router.replace("/my-shelf");
          });
        }
      };
    } catch {}

    return () => {
      unsub();
      try { bc?.close(); } catch {}
    };
  }, []);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true);
    setError(null);
    const { error: err } = await sendMagicLink(trimmed);
    setBusy(false);
    if (err) { setError("Couldn't send the link. Try again in a moment."); return; }
    setSentTo(trimmed);
    setScreen("check-email");
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

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
        <AnimatePresence mode="wait">

          {/* ── Enter email ── */}
          {screen === "enter-email" && (
            <motion.div key="enter"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>

              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Image src="/logo.png" alt="Treehouse" width={28} height={28} />
              </div>

              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.textPrimary, textAlign: "center", lineHeight: 1.2, margin: "0 0 8px" }}>
                Curator Sign in
              </h1>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, textAlign: "center", lineHeight: 1.7, margin: "0 0 32px", maxWidth: 260 }}>
                Enter your email and we&apos;ll send a sign-in link. No password needed.
              </p>

              <div style={{ width: "100%", marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: 7 }}>
                  Email address
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null); }}
                  onKeyDown={e => e.key === "Enter" && !busy && handleSend()}
                  placeholder="you@example.com"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 11, background: C.input, border: `1px solid ${error ? C.redBorder : C.inputBorder}`, color: C.textPrimary, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.18s" }}
                />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, background: C.redBg, border: `1px solid ${C.redBorder}`, fontSize: 12, color: C.red, marginBottom: 12 }}>
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleSend}
                disabled={busy || !email.trim()}
                style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: "Georgia, serif", color: "#fff", background: busy || !email.trim() ? "rgba(30,77,43,0.40)" : C.green, border: "none", cursor: busy || !email.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.18s" }}>
                {busy
                  ? <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</>
                  : <><Mail size={14} /> Send sign-in link</>
                }
              </button>

              <p style={{ marginTop: 20, fontSize: 11, color: C.textFaint, textAlign: "center", lineHeight: 1.6, maxWidth: 240 }}>
                First time? An account is created automatically on your first sign-in.
              </p>
            </motion.div>
          )}

          {/* ── Check email ── */}
          {screen === "check-email" && (
            <motion.div key="check"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Mail size={24} style={{ color: C.green }} />
              </div>

              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: C.textPrimary, lineHeight: 1.2, margin: "0 0 10px" }}>
                Check your email
              </h1>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, lineHeight: 1.75, margin: "0 0 4px" }}>
                We sent a sign-in link to
              </p>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, margin: "0 0 28px", wordBreak: "break-all" }}>
                {sentTo}
              </p>

              <div style={{ padding: "14px 16px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, marginBottom: 28, width: "100%", boxSizing: "border-box" }}>
                <p style={{ margin: 0, fontSize: 12, color: C.textMid, lineHeight: 1.65 }}>
                  Tap the link in the email — it will open in a new tab and sign you in automatically. You can then return to this tab or close it.
                </p>
              </div>

              <button
                onClick={() => { setScreen("enter-email"); setEmail(""); setError(null); }}
                style={{ fontSize: 12, color: C.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(138,132,118,0.4)" }}>
                Wrong email? Try again
              </button>
            </motion.div>
          )}

          {/* ── Confirming (returned from magic link click) ── */}
          {screen === "confirming" && (
            <motion.div key="confirming"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.greenLight, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={24} style={{ color: C.green }} />
              </div>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                Signing you in&hellip;
              </h1>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: C.textMuted, margin: 0 }}>
                Just a moment.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Page — wraps inner in Suspense for useSearchParams ───────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
