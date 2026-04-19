// app/vendor-request/page.tsx
// Vendor access request flow (Flow 3 front door).
// Rewritten session 23 against docs/design-system.md v1.1k.
//
// Changes from v0.2:
//  - Mode C chrome (back arrow paper bubble; no masthead wordmark, no eyebrow pair)
//  - v1 palette throughout (paperCream bg, v1 ink scale, inkHairline borders)
//  - IM Fell English for intro + success editorial voice; FONT_SYS for form fields
//  - Form input primitive (white translucent bg, 14px radius, inkHairline border)
//  - Filled green CTA only on "Request access" (commit action)
//  - Success screen retires v0.2 greenLight check bubble → paper-wash primitive
//  - Success actions retire filled green button → IM Fell italic dotted-underline links
//  - Email echo line primitive (hairlines above/below, no surface card)
//  - Labels retire uppercase+tracked treatment → IM Fell italic 13px muted sentence case
//
// MallSheet migration to the "Your mall" field deferred to Sprint 5 per v1.1k (h).
// Native <select> is used here with v1.1k form-input styling.
//
// Preserved from v0.2: form submission logic, validation rules, POST body shape,
// mall prefill from URL params, routing on success.

"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { getAllMalls } from "@/lib/posts";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// ─── Primitives (v1.1k) ───────────────────────────────────────────────────────

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  paddingRight: 40,
  backgroundImage:
    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b5538' stroke-width='2' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  backgroundSize: "12px 12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 13,
  color: v1.inkMuted,
  lineHeight: 1.3,
  marginBottom: 7,
};

const optionalStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: v1.inkFaint,
  marginLeft: 3,
};

function VendorRequestInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

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
        {/* Mode C header */}
        <header
          style={{
            padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px",
          }}
        >
          <button
            onClick={() => { setDone(false); }}
            aria-label="Back"
            style={{
              width: 38,
              height: 38,
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
            <ArrowLeft size={15} style={{ color: v1.inkPrimary }} />
          </button>
        </header>

        {/* Centered hero column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 28px 80px",
            textAlign: "center",
          }}
        >
          {/* Paper-wash success bubble */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
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
            <Check size={26} style={{ color: v1.inkPrimary }} strokeWidth={1.6} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.32, ease: EASE }}
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 30,
              color: v1.inkPrimary,
              lineHeight: 1.2,
              letterSpacing: "-0.005em",
              margin: "0 0 14px",
            }}
          >
            You&apos;re on the list.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.32, ease: EASE }}
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 16,
              color: v1.inkMid,
              lineHeight: 1.65,
              maxWidth: 320,
              margin: "0 auto 24px",
            }}
          >
            We&apos;ll review your request and be in touch soon with next steps to get your booth on Treehouse.
          </motion.p>

          {/* Email echo line primitive */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.32 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 0",
              borderTop: `0.5px solid ${v1.inkHairline}`,
              borderBottom: `0.5px solid ${v1.inkHairline}`,
              width: "100%",
              maxWidth: 320,
              marginBottom: 0,
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
              {email}
            </span>
          </motion.div>

          {/* End-of-path text links (no filled CTA) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.32, ease: EASE }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <a
              onClick={() => router.push("/")}
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 16,
                color: v1.inkPrimary,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 4,
                cursor: "pointer",
              }}
            >
              Explore the feed →
            </a>
            <a
              onClick={() => setDone(false)}
              style={{
                fontFamily: FONT_IM_FELL,
                fontStyle: "italic",
                fontSize: 15,
                color: v1.inkMuted,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 4,
                cursor: "pointer",
              }}
            >
              Go back
            </a>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
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
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            width: 38,
            height: 38,
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
          <ArrowLeft size={15} style={{ color: v1.inkPrimary }} />
        </button>
      </header>

      <main
        style={{
          flex: 1,
          padding: "8px 28px 40px",
          paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          style={{ margin: "16px 0 28px" }}
        >
          <h1
            style={{
              fontFamily: FONT_IM_FELL,
              fontSize: 28,
              color: v1.inkPrimary,
              lineHeight: 1.2,
              letterSpacing: "-0.005em",
              margin: "0 0 12px",
            }}
          >
            Bring your booth to Treehouse.
          </h1>
          <p
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 16,
              color: v1.inkMuted,
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            Let buyers discover your finds before they make the trip. Fill in your details and we&apos;ll be in touch.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, delay: 0.08, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
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

          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={error && !email.trim() ? inputErrorStyle : inputStyle}
              autoComplete="email"
            />
          </div>

          <div>
            <label style={labelStyle}>
              Your mall <span style={optionalStyle}>(optional)</span>
            </label>
            {/* MallSheet migration deferred to Sprint 5 per docs/design-system.md v1.1k (h) */}
            <select
              value={mallId}
              onChange={e => handleMallChange(e.target.value)}
              style={{
                ...selectStyle,
                color: mallId ? v1.inkPrimary : v1.inkFaint,
              }}
            >
              <option value="">Select a mall…</option>
              {malls.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.city}, {m.state}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Booth number <span style={optionalStyle}>(optional)</span>
            </label>
            <input
              type="text"
              value={booth}
              onChange={e => setBooth(e.target.value)}
              placeholder="e.g. 369"
              style={inputStyle}
            />
          </div>

          {/* Error banner */}
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
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filled green CTA — commit action */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: busy ? "rgba(30,77,43,0.40)" : v1.green,
              border: "none",
              cursor: busy ? "default" : "pointer",
              boxShadow: busy ? "none" : "0 2px 14px rgba(30,77,43,0.22)",
              transition: "background 0.18s, box-shadow 0.18s",
              marginTop: 4,
            }}
          >
            {busy ? "Sending…" : "Request access"}
          </button>

          <p
            style={{
              fontFamily: FONT_SYS,
              fontSize: 12,
              color: v1.inkFaint,
              textAlign: "center",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
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
