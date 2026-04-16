// app/vendor-request/page.tsx
// Vendor access request flow.
// Entry points: feed footer CTA + mall profile pages.
// Flow: form → submit → success screen.
// Collects: name, email, booth number (optional), mall (dropdown).

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { getAllMalls } from "@/lib/posts";
import { colors } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";
import { Suspense } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: 11,
  background: "rgba(255,255,255,0.65)",
  border: `1px solid rgba(26,24,16,0.14)`,
  color: colors.textPrimary,
  fontSize: 15,
  outline: "none",
  fontFamily: "system-ui, sans-serif",
  appearance: "none",
  WebkitAppearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  color: colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: "1.6px",
  marginBottom: 7,
};

function VendorRequestInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill mall if navigated from a mall page
  const prefilledMallId   = searchParams.get("mall_id")   ?? "";
  const prefilledMallName = searchParams.get("mall_name") ?? "";

  const [malls,    setMalls]    = useState<Mall[]>([]);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [booth,    setBooth]    = useState("");
  const [mallId,   setMallId]   = useState(prefilledMallId);
  const [mallName, setMallName] = useState(prefilledMallName);
  const [busy,     setBusy]     = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    getAllMalls().then(setMalls);
  }, []);

  function handleMallChange(id: string) {
    setMallId(id);
    const found = malls.find(m => m.id === id);
    setMallName(found ? `${found.name}, ${found.city}` : "");
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/vendor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         name.trim(),
          email:        email.trim(),
          booth_number: booth.trim() || null,
          mall_id:      mallId || null,
          mall_name:    mallName || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong. Please try again."); return; }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: "100dvh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", gap: 28 }}>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ width: 68, height: 68, borderRadius: "50%", background: colors.greenLight, border: `1.5px solid ${colors.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Check size={30} style={{ color: colors.green }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.32, ease: EASE }}
          style={{ textAlign: "center" }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2, margin: "0 0 14px", letterSpacing: "-0.4px" }}>
            You&apos;re on the list.
          </h1>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: colors.textMid, lineHeight: 1.8, margin: "0 0 10px" }}>
            We&apos;ll review your request and be in touch soon with next steps to get your booth on Treehouse.
          </p>
          <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.7, margin: 0 }}>
            Keep an eye on <strong style={{ color: colors.textMid }}>{email}</strong> — that&apos;s where we&apos;ll reach you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28, ease: EASE }}
          style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}
        >
          <button
            onClick={() => router.push("/")}
            style={{ width: "100%", padding: "14px", borderRadius: 13, fontSize: 14, fontWeight: 600, color: "#fff", background: colors.green, border: "none", cursor: "pointer", boxShadow: "0 2px 12px rgba(30,77,43,0.22)" }}
          >
            Explore the feed
          </button>
          <button
            onClick={() => router.back()}
            style={{ width: "100%", padding: "13px", borderRadius: 13, fontSize: 13, color: colors.textMuted, background: "transparent", border: `1px solid ${colors.border}`, cursor: "pointer" }}
          >
            Go back
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: colors.bg, maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "max(14px, env(safe-area-inset-top, 14px)) 16px 12px", background: `rgba(245,242,235,0.96)`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${colors.border}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: colors.surface, border: `1px solid ${colors.border}`, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <ArrowLeft size={14} style={{ color: colors.textMid }} />
        </button>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, color: colors.textPrimary, lineHeight: 1 }}>Join Treehouse</div>
          <div style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "1.8px", marginTop: 3 }}>Request booth access</div>
        </div>
      </header>

      <main style={{ flex: 1, padding: "28px 20px", paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))", display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          style={{ marginBottom: 28 }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.25, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
            Bring your booth to Treehouse.
          </h1>
          <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: colors.textMid, lineHeight: 1.78, margin: 0 }}>
            Let buyers discover your finds before they make the trip. Fill in your details and we&apos;ll be in touch.
          </p>
        </motion.div>

        {/* Form fields */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, delay: 0.08, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* Name */}
          <div>
            <label style={labelStyle}>Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="First and last name"
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          {/* Mall */}
          <div>
            <label style={labelStyle}>Your mall <span style={{ color: colors.textFaint, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <select
              value={mallId}
              onChange={e => handleMallChange(e.target.value)}
              style={{ ...inputStyle, color: mallId ? colors.textPrimary : colors.textFaint }}
            >
              <option value="">Select a mall…</option>
              {malls.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.city}, {m.state}</option>
              ))}
            </select>
          </div>

          {/* Booth number */}
          <div>
            <label style={labelStyle}>Booth number <span style={{ color: colors.textFaint, textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
            <input
              type="text"
              value={booth}
              onChange={e => setBooth(e.target.value)}
              placeholder="e.g. 369"
              style={inputStyle}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "11px 14px", borderRadius: 10, background: colors.redBg, border: `1px solid ${colors.redBorder}`, fontSize: 13, color: colors.red, lineHeight: 1.5 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              width: "100%", padding: "15px", borderRadius: 13, fontSize: 15, fontWeight: 600,
              color: "#fff", background: busy ? colors.greenBorder : colors.green,
              border: "none", cursor: busy ? "default" : "pointer",
              boxShadow: busy ? "none" : "0 2px 14px rgba(30,77,43,0.24)",
              transition: "background 0.18s, box-shadow 0.18s",
              marginTop: 4,
            }}
          >
            {busy ? "Sending…" : "Request access"}
          </button>

          <p style={{ fontSize: 11, color: colors.textFaint, textAlign: "center", lineHeight: 1.6, margin: 0 }}>
            We&apos;ll only use your email to follow up on this request.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function VendorRequestPage() {
  return (
    <Suspense>
      <VendorRequestInner />
    </Suspense>
  );
}
