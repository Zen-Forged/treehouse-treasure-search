// app/vendor-request/page.tsx
// Vendor access request flow (Flow 3 front door).
// Session 75 (2026-04-27) — Gemba-walk redesign per
//   docs/booth-request-redesign-design.md (D1-D7).
//
// Session 75 changes from v1.2:
//  - Title: "Request your digital booth" (was "Put your booth forward.")
//  - Intro paragraph removed entirely (D5)
//  - Mall + Booth number now hard-required (red `*` indicator) — were optional
//  - Mall + Booth # paired side-by-side in a single field-row (saves ~60pt)
//  - Booth name "(optional)" preserved; "Leave blank to use your name"
//    helper copy dropped
//  - Photo dropzone 4:3 → 3:2 aspect (saves ~70pt)
//  - Photo dropzone copy moved IM Fell → FONT_SYS for higher contrast on
//    paper-wash. Title: "Take a photo of your booth" (sans 14px 600).
//    Helper: "This will be the main image on your digital booth." (sans
//    12px ink-mid). The "confirm it's really yours" framing removed —
//    that role moves to the new owner-ack checkbox.
//  - New checkbox card above the CTA: "By submitting this request you are
//    confirming that you are the assigned owner of this booth." Gates submit.
//  - Server payload includes `owner_acknowledged: true`. Captured server-side
//    as a new column on vendor_requests via migration 013.
//
// v1.2 carry-forwards (unchanged):
//  - First name + Last name split, side-by-side
//  - Three DoneScreen variants (created / already_pending / already_approved)
//  - Mode C chrome (back-arrow paper bubble)
//  - Filled green CTA on commit
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

// Session 75 — required-field indicator. Small red `*` after the field name.
// Reset font-style because the parent label is italic IM Fell; we want the
// asterisk to read as a clean glyph, not a tilted serif star.
const requiredStyle: React.CSSProperties = {
  fontStyle: "normal",
  color: v1.red,
  marginLeft: 2,
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

  // Session 75 — owner-acknowledgement checkbox state. Required to submit.
  const [ownerAck, setOwnerAck] = useState(false);

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
    if (!mallId) { setError("Please select your location."); return; }
    if (!booth.trim()) { setError("Please enter your booth number."); return; }
    if (!proofDataUrl) {
      setError("Please add a photo of your booth.");
      return;
    }
    if (!ownerAck) {
      setError("Please confirm you are the assigned owner of this booth.");
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
          booth_number:         booth.trim(),
          booth_name:           boothName.trim() || null,
          mall_id:              mallId,
          mall_name:            mallName || null,
          proof_image_data_url: proofDataUrl,
          owner_acknowledged:   true,
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
        {/* Title — session 75 (D6). Tight 22px IM Fell, no subhead. */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          style={{
            fontFamily: FONT_IM_FELL,
            fontSize: 22,
            color: v1.inkPrimary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "10px 0 18px",
          }}
        >
          Request your digital booth
        </motion.h1>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.30, delay: 0.08, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* First / Last side-by-side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>
                First name<span style={requiredStyle}>*</span>
              </label>
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
              <label style={labelStyle}>
                Last name<span style={requiredStyle}>*</span>
              </label>
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
            <label style={labelStyle}>
              Email address<span style={requiredStyle}>*</span>
            </label>
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

          {/* Mall + Booth # side-by-side — both required (session 75 D5). */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>
                Location<span style={requiredStyle}>*</span>
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
                <option value="">Select&hellip;</option>
                {malls.map(m => (
                  <option key={m.id} value={m.id}>{m.name} &mdash; {m.city}, {m.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Booth #<span style={requiredStyle}>*</span>
              </label>
              <input
                type="text"
                value={booth}
                onChange={e => setBooth(e.target.value)}
                placeholder="e.g. 369"
                autoCapitalize="characters"
                style={inputStyle}
              />
            </div>
          </div>
          {malls.length === 0 && (
            <p style={helperStyle}>
              No malls are currently accepting new vendor requests. Check
              back soon.
            </p>
          )}

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
          </div>

          {/* Booth photo — session 75. 3:2 aspect (was 4:3); copy moved
              to FONT_SYS at higher contrast per D3 / D5. The "confirm
              it's really yours" framing is gone — that role lives on
              the new ownership-acknowledgement checkbox below. */}
          <div>
            <label style={labelStyle}>
              Booth photo<span style={requiredStyle}>*</span>
            </label>
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
                  aspectRatio: "3/2",
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
                  aspectRatio: "3/2",
                  border: `1.5px dashed ${v1.inkHairline}`,
                  borderRadius: 14,
                  background: "rgba(255,253,248,0.70)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 18,
                  textAlign: "center",
                  cursor: proofBusy ? "default" : "pointer",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Camera size={28} style={{ color: v1.inkMuted, opacity: 0.75 }} strokeWidth={1.5} />
                <div
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 14,
                    fontWeight: 600,
                    color: v1.inkPrimary,
                    lineHeight: 1.3,
                  }}
                >
                  {proofBusy ? "Reading photo\u2026" : "Take a photo of your booth"}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 12,
                    color: v1.inkMid,
                    lineHeight: 1.5,
                    maxWidth: 250,
                  }}
                >
                  This will be the main image on your digital booth.
                </div>
              </button>
            )}
          </div>

          {/* Owner-acknowledgement checkbox card — session 75 (D2).
              Required to submit. Captured server-side as
              `owner_acknowledged: true` on the vendor_requests row. */}
          <button
            type="button"
            onClick={() => setOwnerAck(v => !v)}
            aria-pressed={ownerAck}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "11px 12px",
              background: "rgba(255,253,248,0.55)",
              border: `1px solid ${v1.inkHairline}`,
              borderRadius: 10,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              textAlign: "left",
              width: "100%",
              marginTop: 4,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                flexShrink: 0,
                width: 18,
                height: 18,
                borderRadius: 4,
                background: ownerAck ? v1.green : "rgba(255,253,248,0.9)",
                border: `1.5px solid ${ownerAck ? v1.green : v1.inkMuted}`,
                marginTop: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {ownerAck ? "✓" : ""}
            </div>
            <span
              style={{
                fontFamily: FONT_SYS,
                fontSize: 12.5,
                color: v1.inkMid,
                lineHeight: 1.45,
              }}
            >
              By submitting this request you are confirming that you are the assigned owner of this booth.
            </span>
          </button>

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
              R4c — soft-block when no active malls exist (vendor has
              nothing selectable). Session 75 — also disabled until the
              owner-acknowledgement checkbox is checked. */}
          <button
            onClick={handleSubmit}
            disabled={busy || malls.length === 0 || !ownerAck}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 14,
              fontFamily: FONT_SYS,
              fontSize: 15,
              fontWeight: 500,
              color: "#fff",
              background: busy || malls.length === 0 || !ownerAck ? "rgba(30,77,43,0.40)" : v1.green,
              border: "none",
              cursor: busy || malls.length === 0 || !ownerAck ? "default" : "pointer",
              boxShadow: busy || malls.length === 0 || !ownerAck ? "none" : "0 2px 14px rgba(30,77,43,0.22)",
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
