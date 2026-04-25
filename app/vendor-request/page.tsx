// app/vendor-request/page.tsx
// Vendor access request flow (Flow 3 front door).
// Session 32 (2026-04-20) — v1.2 onboarding refresh.
//
// v1.2 changes from v1.1k:
//  - Name field split into First name + Last name (side-by-side row)
//  - New optional "Booth name" field with helper copy ("Leave blank to use your name")
//  - Required booth photo — Model B commitment + verification gesture. Wide
//    shot of sign / name tag / booth-number anything. Rendered as paper-wash
//    dropzone that swaps to a 4:3 preview on select with a Replace button.
//  - Server responses now include { status } — "created" ships to success
//    screen; "already_pending" and "already_approved" each show their own
//    in-place warm state (no duplicate insert, no second email).
//  - "Already pending" state uses a clock glyph + "We already have you"
//    title + echo of email on file.
//  - "Already approved" state nudges the vendor to sign in directly and
//    echoes the email they should use.
//
// Preserved from v1.1k:
//  - Mode C chrome (back arrow paper bubble)
//  - v1 palette + IM Fell for editorial voice in-form (Sprint 5 typography
//    reassessment will revisit IM Fell usage in form labels)
//  - Filled green CTA only on the commit action
//  - Email echo line primitive on success screen
//
// MallSheet migration to the "Your mall" field still deferred to Sprint 5
// per design-system.md v1.1k (h). Native <select> retained here.

"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Mail, Clock, Camera, X } from "lucide-react";
import { getActiveMalls } from "@/lib/posts";
import { compressImage } from "@/lib/imageUpload";
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

const helperStyle: React.CSSProperties = {
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 12,
  color: v1.inkFaint,
  lineHeight: 1.5,
  marginTop: 6,
  marginLeft: 2,
};

const optionalStyle: React.CSSProperties = {
  fontStyle: "italic",
  color: v1.inkFaint,
  marginLeft: 3,
};

// ─── Helper — read a File as a data URL via FileReader ──────────────────────
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

// ─── Submit response shape from /api/vendor-request ──────────────────────────
type SubmitResult =
  | { ok: true; status: "created" | "already_pending" | "already_approved" }
  | { ok: false; error: string };

// ─── Inner component ─────────────────────────────────────────────────────────
function VendorRequestInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const prefilledMallId   = searchParams.get("mall_id")   ?? "";
  const prefilledMallName = searchParams.get("mall_name") ?? "";

  const [malls, setMalls] = useState<Mall[]>([]);

  // Form state — v1.2 shape
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [booth,     setBooth]     = useState("");
  const [boothName, setBoothName] = useState("");
  const [mallId,    setMallId]    = useState(prefilledMallId);
  const [mallName,  setMallName]  = useState(prefilledMallName);

  // Photo state
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofBusy,    setProofBusy]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI state
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState<null | "created" | "already_pending" | "already_approved">(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // R4c — only malls in 'active' status are eligible for new vendor
    // requests. Pending-request queue against not-yet-live malls creates
    // admin backlog with nothing actionable. See D6 in
    // docs/r4c-mall-active-design.md.
    getActiveMalls().then(setMalls);
  }, []);

  function handleMallChange(id: string) {
    setMallId(id);
    const found = malls.find(m => m.id === id);
    setMallName(found ? `${found.name}, ${found.city}` : "");
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";  // reset so same file can be reselected
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 12_000_000) {
      setError("Photo is too large. Please choose one smaller than 12MB.");
      return;
    }
    setProofBusy(true);
    setError("");
    try {
      const raw        = await readFileAsDataURL(file);
      const compressed = await compressImage(raw);
      setProofDataUrl(compressed);
    } catch {
      setError("Couldn't read that photo. Try a different one.");
    } finally {
      setProofBusy(false);
    }
  }

  function handlePhotoClear() {
    setProofDataUrl(null);
  }

  async function handleSubmit() {
    setError("");
    if (!firstName.trim()) { setError("Please enter your first name."); return; }
    if (!lastName.trim())  { setError("Please enter your last name.");  return; }
    if (!email.trim())     { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!proofDataUrl) {
      setError("Please add a photo of your booth.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/vendor-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name:           firstName.trim(),
          last_name:            lastName.trim(),
          email:                email.trim(),
          booth_number:         booth.trim() || null,
          booth_name:           boothName.trim() || null,
          mall_id:              mallId || null,
          mall_name:            mallName || null,
          proof_image_data_url: proofDataUrl,
        }),
      });
      const json = (await res.json()) as SubmitResult | { error: string };

      if (!res.ok || ("ok" in json && !json.ok) || ("error" in json && json.error)) {
        const errMsg = ("error" in json && json.error) || "Something went wrong. Please try again.";
        setError(errMsg);
        return;
      }
      if ("status" in json) {
        setDone(json.status);
      } else {
        setDone("created");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Success / already-pending / already-approved screens ─────────────────
  if (done) {
    return (
      <DoneScreen
        state={done}
        email={email}
        onReset={() => setDone(null)}
        onGoHome={() => router.push("/")}
        onGoSignIn={() => router.push("/login")}
      />
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
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
          <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
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
            Put your booth forward.
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
            We&rsquo;re Treehouse Finds &mdash; a quiet place for vintage &amp; antique finds in Kentucky. Share a few details and a photo of your booth, and we&rsquo;ll be in touch when your shelf is ready.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, delay: 0.08, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 18 }}
        >
          {/* First / Last side-by-side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Sarah"
                style={inputStyle}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label style={labelStyle}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Morrison"
                style={inputStyle}
                autoComplete="family-name"
              />
            </div>
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
            <select
              value={mallId}
              onChange={e => handleMallChange(e.target.value)}
              disabled={malls.length === 0}
              style={{
                ...selectStyle,
                color: mallId ? v1.inkPrimary : v1.inkFaint,
                opacity: malls.length === 0 ? 0.55 : 1,
                cursor: malls.length === 0 ? "default" : "pointer",
              }}
            >
              <option value="">Select a mall&hellip;</option>
              {malls.map(m => (
                <option key={m.id} value={m.id}>{m.name} &mdash; {m.city}, {m.state}</option>
              ))}
            </select>
            {malls.length === 0 && (
              <p style={helperStyle}>
                No malls are currently accepting new vendor requests. Check
                back soon.
              </p>
            )}
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

          <div>
            <label style={labelStyle}>
              Booth name <span style={optionalStyle}>(optional)</span>
            </label>
            <input
              type="text"
              value={boothName}
              onChange={e => setBoothName(e.target.value)}
              placeholder="e.g. The Velvet Cabinet"
              style={inputStyle}
            />
            <p style={helperStyle}>Leave blank to use your name.</p>
          </div>

          {/* Booth photo — Model B */}
          <div>
            <label style={labelStyle}>A photo of your booth</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            {proofDataUrl ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4/3",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#1a1a18",
                  border: `1px solid ${v1.inkHairline}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={proofDataUrl}
                  alt="Booth preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={proofBusy}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    padding: "6px 12px",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff9e8",
                    border: "none",
                    borderRadius: 16,
                    fontFamily: FONT_SYS,
                    fontSize: 12,
                    cursor: proofBusy ? "default" : "pointer",
                    opacity: proofBusy ? 0.6 : 1,
                  }}
                >
                  Replace
                </button>
                <button
                  onClick={handlePhotoClear}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff9e8",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={proofBusy}
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  border: `1.5px dashed ${v1.inkHairline}`,
                  borderRadius: 14,
                  background: "rgba(255,253,248,0.70)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: 20,
                  textAlign: "center",
                  cursor: proofBusy ? "default" : "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Camera size={34} style={{ color: v1.inkMuted, opacity: 0.75 }} strokeWidth={1.4} />
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontSize: 17,
                    color: v1.inkMid,
                    letterSpacing: "-0.005em",
                    lineHeight: 1.25,
                  }}
                >
                  {proofBusy ? "Reading photo\u2026" : "Show us your booth"}
                </div>
                <div
                  style={{
                    fontFamily: FONT_IM_FELL,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: v1.inkFaint,
                    lineHeight: 1.5,
                    maxWidth: 260,
                  }}
                >
                  A wide shot of your sign, name tag, or anything with your booth number visible. Helps us make sure the shelf is really yours.
                </div>
              </button>
            )}
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

          {/* Filled green CTA — commit action.
              R4c — soft-block when no active malls exist: shopper has
              nothing selectable, so disable submit (with no error). */}
          <button
            onClick={handleSubmit}
            disabled={busy || malls.length === 0}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: busy || malls.length === 0 ? "rgba(30,77,43,0.40)" : v1.green,
              border: "none",
              cursor: busy || malls.length === 0 ? "default" : "pointer",
              boxShadow: busy || malls.length === 0 ? "none" : "0 2px 14px rgba(30,77,43,0.22)",
              transition: "background 0.18s, box-shadow 0.18s",
              marginTop: 4,
            }}
          >
            {busy ? "Sending\u2026" : "Request access"}
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
            We&rsquo;ll only use your email to follow up on this request.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

// ─── Done screens — three variants ───────────────────────────────────────────
// `created` is the happy path success screen (carried over from v1.1k).
// `already_pending` and `already_approved` render warm in-place states
// instead of firing a duplicate insert.

function DoneScreen({
  state,
  email,
  onReset,
  onGoHome,
  onGoSignIn,
}: {
  state: "created" | "already_pending" | "already_approved";
  email: string;
  onReset:    () => void;
  onGoHome:   () => void;
  onGoSignIn: () => void;
}) {
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
      <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px" }}>
        <button
          onClick={onReset}
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
          <ArrowLeft size={18} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>
      </header>

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
        {/* Glyph: check for created, clock for pending/approved */}
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
          {state === "created" ? (
            <Check size={26} style={{ color: v1.inkPrimary }} strokeWidth={1.6} />
          ) : (
            <Clock size={26} style={{ color: v1.inkPrimary }} strokeWidth={1.6} />
          )}
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
          {state === "created"
            ? "You\u2019re on the list."
            : state === "already_pending"
              ? "We already have you."
              : "You\u2019re already in."}
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
          {state === "created" && (
            <>We&rsquo;ll review your request and be in touch soon with next steps to get your booth on Treehouse Finds.</>
          )}
          {state === "already_pending" && (
            <>Your request is in the queue. We&rsquo;ll be in touch when your shelf is ready to fill.</>
          )}
          {state === "already_approved" && (
            <>Your booth is already approved. Open Treehouse Finds and sign in with this email to start filling your shelf.</>
          )}
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
            {state === "created" ? "Sent to\u00a0" : "On file for\u00a0"}
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
          {state === "already_approved" ? (
            <>
              <a
                onClick={onGoSignIn}
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
                Sign in to your booth &rarr;
              </a>
              <a
                onClick={onGoHome}
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
                Explore the feed
              </a>
            </>
          ) : (
            <>
              <a
                onClick={onGoHome}
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
                Explore the feed &rarr;
              </a>
              <a
                onClick={onReset}
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
            </>
          )}
        </motion.div>

        {state === "already_pending" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58, duration: 0.32 }}
            style={{
              fontFamily: FONT_IM_FELL,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              lineHeight: 1.65,
              maxWidth: 320,
              margin: "28px auto 0",
            }}
          >
            Sent to the wrong address, or need to update something? Reply to the receipt email we sent you and we&rsquo;ll fix it.
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ─── Exported default with Suspense boundary ─────────────────────────────────
export default function VendorRequestPage() {
  return (
    <Suspense>
      <VendorRequestInner />
    </Suspense>
  );
}
