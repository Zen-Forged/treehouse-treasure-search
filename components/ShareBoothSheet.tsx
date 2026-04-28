// components/ShareBoothSheet.tsx
// ShareBoothSheet — bottom-sheet compose UI for the Window email share feature.
// Session 40 (2026-04-21), per docs/share-booth-build-spec.md §3.
// Mockup: docs/mockups/share-booth-email-v1.html is the email output.
// No dedicated sheet mockup — chrome mirrors <BoothPickerSheet> per spec.
//
// Four states (build-spec §3):
//   - compose: email input + RFC-valid-gated CTA. Entry state.
//   - sending: CTA shows spinner, disabled. authFetch in flight.
//   - sent:    paper-wash success bubble + echoed email + "Share with
//              someone else" loop-back link (clears input, returns to compose).
//   - error:   inline error message above the CTA, CTA re-enabled.
//              Different copy per server status (429 / 403 / 409 / 502 / network).
//
// Chrome mirrors BoothPickerSheet exactly:
//   - Backdrop rgba(30,20,10,0.38), fade 220ms
//   - Sheet paperCream bg, 20px top radius, y-slide 340ms
//   - Transform-free centering (left:0, right:0, margin:0 auto)
//     — never combine a centering transform with Framer y animation on the
//       same element (session-21A rule, docs/DECISION_GATE.md Tech Rules).
//   - Handle 44×4 pill, inkFaint
//   - Body scroll locked while open
//   - 22px horizontal padding throughout
//
// EMAIL_REGEX is inlined (matches /api/share-booth/route.ts + /api/vendor-request).
// DO NOT import a shared regex — the two server routes inline it; this stays
// consistent with that convention.
//
// Post.image_url is `string | null` (types/treehouse.ts). PreviewTile renders a
// paperCream-wash fallback when the URL is null instead of a broken <img>.
//
// Sending-state spinner uses a plain <style> tag — styled-jsx is not part of
// this repo's setup and adding it for one keyframe would be overkill.
//
// Session 40 build-gate fix:
//   ComposeBody's `inputRef` prop is typed `React.Ref<HTMLInputElement>` —
//   the broader union type that accepts both `RefObject<HTMLInputElement>`
//   and `RefObject<HTMLInputElement | null>`. TypeScript's `LegacyRef` check
//   on the <input ref={}> prop expects a non-null-generic ref, and React 19's
//   `useRef<T | null>(null)` returns `RefObject<T | null>` by default.
//   Using `React.Ref<T>` at the prop boundary lets us keep the nullable
//   useRef declaration (correct for DOM refs) while satisfying the <input>
//   ref slot. Same pattern applies to any future ref-forwarding component.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { authFetch } from "@/lib/authFetch";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { Mall, Post, Vendor } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Same shape as the two server routes (/api/share-booth, /api/vendor-request).
// Keep the literal in sync if either changes.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SheetState =
  | { kind: "compose" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export interface ShareBoothSheetProps {
  open:          boolean;
  onClose:       () => void;
  vendor:        Vendor;
  mall:          Mall | null;
  /** Pre-loaded from /my-shelf parent to avoid a double-fetch. Used for the
   *  preview strip inside the sheet (first 3 thumbnails). */
  previewPosts:  Post[];
  /**
   * Session 50 (Q-008) — call-site declares whether this is a vendor/admin
   * share (authenticated POST, bearer token attached) or a shopper share
   * (anonymous POST, no bearer). Vendor mode keeps the existing behavior
   * exactly; shopper mode sends through the anon branch of /api/share-booth
   * which has a tighter rate limit and no ownership check.
   *
   * Default "vendor" preserves behavior for any caller that hasn't opted in
   * (Q-009 admin surface, /my-shelf). Parents that expose the sheet to
   * unauthenticated or non-owner viewers must pass "shopper" explicitly.
   */
  mode?:         "vendor" | "shopper";
}

export default function ShareBoothSheet({
  open,
  onClose,
  vendor,
  mall,
  previewPosts,
  mode = "vendor",
}: ShareBoothSheetProps) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<SheetState>({ kind: "compose" });
  const inputRef            = useRef<HTMLInputElement | null>(null);

  const trimmed = email.trim();
  const valid   = useMemo(() => EMAIL_REGEX.test(trimmed), [trimmed]);

  // ── Lock body scroll while sheet is open (matches BoothPickerSheet) ──────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── Reset on open (fresh compose each time the user taps the airplane) ──
  useEffect(() => {
    if (!open) return;
    setEmail("");
    setStatus({ kind: "compose" });
    // Focus input on next tick so the slide-in animation has started.
    const t = window.setTimeout(() => inputRef.current?.focus(), 280);
    return () => window.clearTimeout(t);
  }, [open]);

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!valid || status.kind === "sending") return;
    const recipientEmail = trimmed;
    setStatus({ kind: "sending" });

    try {
      // Session 50 (Q-008) — shopper mode uses plain fetch so the server
      // lands on the anonymous branch even if the viewer happens to be
      // signed in as a non-owner. authFetch would attach their bearer
      // token, and the server would 403 with "You don't own this booth."
      // on the auth branch. Vendor/admin mode keeps authFetch so the
      // bearer token drives ownership + admin-bypass logic.
      const doFetch = mode === "shopper"
        ? (url: string, init: RequestInit) => fetch(url, {
            ...init,
            headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
          })
        : authFetch;
      const res = await doFetch("/api/share-booth", {
        method: "POST",
        body:   JSON.stringify({
          recipientEmail,
          activeVendorId: vendor.id,
        }),
      });

      let payload: { ok?: boolean; error?: string } = {};
      try { payload = await res.json(); } catch { /* non-JSON body is handled below */ }

      if (res.ok && payload.ok) {
        setStatus({ kind: "sent", email: recipientEmail });
        return;
      }

      // Per-status copy per build-spec §3. We distinguish the two 429 modes
      // by the error string the server returns rather than the status code
      // alone — the IP rate limiter and the per-recipient dedup both use 429
      // but carry different messages.
      setStatus({ kind: "error", message: errorCopyFor(res.status, payload.error) });
    } catch {
      setStatus({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  function handleShareAgain() {
    setEmail("");
    setStatus({ kind: "compose" });
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  // Enter submits only when compose state + valid.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && status.kind === "compose" && valid) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Derived vendor + mall strings (null-safe for MVP).
  const boothName = vendor.display_name;
  const mallName  = mall?.name ?? (vendor.mall?.name ?? "");
  const boothNo   = vendor.booth_number;
  const subtitle  = [mallName, boothNo ? `Booth ${boothNo}` : null].filter(Boolean).join(" · ");

  // Public booth URL for QR code — uses window.location.origin so it works
  // in dev (localhost) and production (app.kentuckytreehouse.com) without
  // hardcoding. Safe here because this is a "use client" component and the
  // sheet only mounts after hydration.
  const boothUrl = (typeof window !== "undefined" ? window.location.origin : "") + `/shelf/${vendor.slug}`;

  // Preview: first 3 available posts (build-spec doesn't require a specific
  // count, but 3 fits the sheet aesthetic and gives the recipient-email
  // compose surface a light "here's what will go out" cue).
  const previewSlice = previewPosts.slice(0, 3);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ───────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={status.kind === "sending" ? undefined : onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(30,20,10,0.38)",
              zIndex: 100,
            }}
            aria-hidden="true"
          />

          {/* ── Sheet container ───────────────────────────────────────── */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share this booth"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              margin: "0 auto",
              width: "100%",
              maxWidth: 430,
              maxHeight: "92vh",
              background: v1.paperCream,
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 30px rgba(30,20,10,0.28)",
              zIndex: 101,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 12,
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 999,
                  background: v1.inkFaint,
                }}
                aria-hidden="true"
              />
            </div>

            {/* Scrollable body — all four states render inside the same frame
                so the backdrop + handle + radius stay stable as state flips. */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "10px 22px 22px",
              }}
            >
              {status.kind === "sent" ? (
                <SentState
                  email={status.email}
                  boothName={boothName}
                  onShareAgain={handleShareAgain}
                  onDone={onClose}
                />
              ) : (
                <ComposeBody
                  boothName={boothName}
                  subtitle={subtitle}
                  boothUrl={boothUrl}
                  previewPosts={previewSlice}
                  email={email}
                  onEmailChange={setEmail}
                  inputRef={inputRef}
                  onKeyDown={handleKeyDown}
                  valid={valid}
                  sending={status.kind === "sending"}
                  errorMessage={status.kind === "error" ? status.message : null}
                  onSubmit={handleSubmit}
                  onCancel={onClose}
                />
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Keyframes for the sending-state spinner. Plain <style>, not styled-
          jsx — this repo uses inline styles + Tailwind, not styled-jsx. */}
      <style>{`
        @keyframes sharebooth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}

// ─── ComposeBody ───────────────────────────────────────────────────────────
// Covers compose, sending, and error. The `sending` and `error` states are
// subtle modifications of compose: spinner in the CTA, inline error copy
// above the CTA. Keeping them in one component means the preview + input
// stay mounted across state flips so the user's typed email survives errors.
//
// `inputRef` is typed React.Ref<HTMLInputElement> (NOT
// React.RefObject<HTMLInputElement | null>) so it satisfies the <input>
// element's LegacyRef slot. React 19's useRef<T | null>(null) returns a
// RefObject<T | null>, which TypeScript rejects when forwarded directly
// to an HTML element's ref. React.Ref<T> is the union type that accepts
// both RefObject<T> and RefObject<T | null> and matches the HTML element
// ref contract.
function ComposeBody({
  boothName,
  subtitle,
  boothUrl,
  previewPosts,
  email,
  onEmailChange,
  inputRef,
  onKeyDown,
  valid,
  sending,
  errorMessage,
  onSubmit,
  onCancel,
}: {
  boothName:     string;
  subtitle:      string;
  boothUrl:      string;
  previewPosts:  Post[];
  email:         string;
  onEmailChange: (v: string) => void;
  inputRef:      React.Ref<HTMLInputElement>;
  onKeyDown:     (e: React.KeyboardEvent<HTMLInputElement>) => void;
  valid:         boolean;
  sending:       boolean;
  errorMessage:  string | null;
  onSubmit:      () => void;
  onCancel:      () => void;
}) {
  return (
    <>
      {/* Eyebrow + title — matches BoothPickerSheet's centered IM Fell heading */}
      <div style={{ padding: "0 0 2px", flexShrink: 0, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 13,
            color: v1.inkMuted,
            lineHeight: 1.2,
            marginBottom: 2,
          }}
        >
          Invite someone in to
        </div>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 21,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {boothName}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT_SYS,
              fontSize: 12,
              color: v1.inkMuted,
              lineHeight: 1.4,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Hairline divider */}
      <div style={{ padding: "14px 0 16px", flexShrink: 0 }}>
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </div>

      {/* QR code — Treehouse logo centered over the code (Option B). The logo
          sits on a postit-wash cutout; QR error-correction (level M, default)
          tolerates up to ~15% module loss so a ~22px logo at 148px total is
          well within the recoverable range. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
        <div style={{ padding: 12, background: v1.postit, borderRadius: 10, border: `1px solid ${v1.inkHairline}`, position: "relative", display: "inline-block" }}>
          <QRCode
            value={boothUrl}
            size={160}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
          {/* Logo overlay — postit background + halo clears surrounding modules */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 32,
            height: 32,
            background: "#ffffff",
            borderRadius: 6,
            boxShadow: "0 0 0 4px #ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" width={22} height={22} style={{ display: "block" }} />
          </div>
        </div>
        <div style={{ fontFamily: FONT_LORA, fontStyle: "italic", fontSize: 12, color: v1.inkMuted, marginTop: 8, textAlign: "center" }}>
          Scan to visit this booth
        </div>
      </div>

      {/* Hairline divider before email section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ width: "100%", height: 1, background: v1.inkHairline }} />
      </div>

      {/* Preview strip — 3 thumbnails of current available finds. Skipped
          entirely when previewPosts is empty (parent already hides the
          share entry in that case, but the component renders defensively). */}
      {previewPosts.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {previewPosts.map(post => (
            <PreviewTile key={post.id} imageUrl={post.image_url} title={post.title} />
          ))}
        </div>
      )}

      {/* Email input — v1.2 form input primitive (inkWash bg on paperCream,
          ink-primary text, system-ui). Matches /vendor-request + /setup. */}
      <label
        htmlFor="share-booth-email"
        style={{
          display: "block",
          fontFamily: FONT_SYS,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: v1.inkMuted,
          marginBottom: 6,
        }}
      >
        Recipient email
      </label>
      <input
        ref={inputRef}
        id="share-booth-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={email}
        disabled={sending}
        onChange={e => onEmailChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="friend@example.com"
        aria-invalid={!!errorMessage}
        style={{
          display: "block",
          width: "100%",
          padding: "12px 14px",
          fontFamily: FONT_SYS,
          fontSize: 16,          // 16px prevents iOS zoom-on-focus
          color: v1.inkPrimary,
          background: v1.inkWash,
          border: `1px solid ${errorMessage ? v1.redBorder : v1.inkHairline}`,
          borderRadius: 8,
          outline: "none",
          WebkitAppearance: "none",
          opacity: sending ? 0.6 : 1,
        }}
      />

      {/* Inline error copy — above the CTA so it reads in flow rather than
          as an afterthought. Only renders in the error state. */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            padding: "9px 12px",
            borderRadius: 6,
            background: v1.redBg,
            border: `1px solid ${v1.redBorder}`,
            fontFamily: FONT_SYS,
            fontSize: 12,
            color: v1.red,
            lineHeight: 1.5,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* CTA — filled green pill (v1.1k commit-action rule). Disabled
          until RFC-valid + not sending. Shows inline spinner in sending. */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!valid || sending}
        aria-busy={sending}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          marginTop: 16,
          padding: "14px 16px",
          border: "none",
          borderRadius: 999,
          background: v1.green,
          color: "#f5ecd8",
          fontFamily: FONT_LORA,
          fontSize: 16,
          letterSpacing: "-0.005em",
          cursor: (!valid || sending) ? "default" : "pointer",
          opacity: (!valid || sending) ? 0.55 : 1,
          transition: "opacity 0.15s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {sending ? (
          <>
            <Spinner />
            <span>Sending…</span>
          </>
        ) : (
          <>
            <PaperAirplaneIcon size={16} color="#f5ecd8" />
            <span>Send the invite</span>
          </>
        )}
      </button>

      {/* Cancel — ghost text link. Matches BoothPickerSheet's "Add another
          booth" dashed affordance as a secondary action, minus the dashed
          border (this one is a close, not a navigate). */}
      <button
        type="button"
        onClick={onCancel}
        disabled={sending}
        style={{
          display: "block",
          width: "100%",
          marginTop: 10,
          padding: "10px 12px",
          background: "transparent",
          border: "none",
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          cursor: sending ? "default" : "pointer",
          opacity: sending ? 0.55 : 1,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Not now
      </button>
    </>
  );
}

// ─── SentState ─────────────────────────────────────────────────────────────
// Paper-wash success bubble + echoed email + "Share with someone else"
// loop-back + "Done" close. Matches the v1.1k paper-wash success pattern
// used by /vendor-request done-screen (subtle inkWash bubble, centered).
function SentState({
  email,
  boothName,
  onShareAgain,
  onDone,
}: {
  email:        string;
  boothName:    string;
  onShareAgain: () => void;
  onDone:       () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "28px 8px 8px",
      }}
    >
      {/* Check bubble */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(30,77,43,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
        }}
        aria-hidden="true"
      >
        <CheckGlyph />
      </div>

      <div
        style={{
          fontFamily: FONT_LORA,
          fontSize: 23,
          color: v1.inkPrimary,
          letterSpacing: "-0.005em",
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        Window on its way
      </div>

      <p
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 14,
          color: v1.inkMid,
          lineHeight: 1.6,
          margin: "0 0 16px",
          maxWidth: 320,
        }}
      >
        A Window into {boothName} is heading to
      </p>

      {/* Email echo — system-ui, inkWash pill-ish background so it reads as
          "here is the exact string that was sent" rather than body prose. */}
      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 14,
          color: v1.inkPrimary,
          background: v1.inkWash,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: 8,
          padding: "8px 14px",
          marginBottom: 22,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email}
      </div>

      {/* Share again — dashed ghost button loops back to compose */}
      <button
        type="button"
        onClick={onShareAgain}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
          padding: "12px 14px",
          border: `1px dashed ${v1.inkFaint}`,
          borderRadius: 10,
          background: "transparent",
          color: v1.inkMid,
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 14,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>＋</span>
        Share with someone else
      </button>

      {/* Done — text link close */}
      <button
        type="button"
        onClick={onDone}
        style={{
          display: "block",
          width: "100%",
          marginTop: 10,
          padding: "10px 12px",
          background: "transparent",
          border: "none",
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 13,
          color: v1.inkMuted,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Done
      </button>
    </div>
  );
}

// ─── PreviewTile ───────────────────────────────────────────────────────────
// 4:5 aspect preview. Null-image fallback renders a muted wash so the grid
// stays structurally complete even if a post is missing an image_url (which
// shouldn't happen in practice — available posts always have images — but
// types/treehouse.ts declares the column nullable, and we honor the type).
function PreviewTile({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "4 / 5",
        overflow: "hidden",
        borderRadius: 6,
        background: "rgba(42,26,10,0.08)",
      }}
      aria-hidden="true"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, rgba(42,26,10,0.06) 0%, rgba(42,26,10,0.12) 100%)",
            color: v1.inkFaint,
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 11,
          }}
        >
          no photo
        </div>
      )}
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────
function PaperAirplaneIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  // Minimal paper-airplane glyph — outlined, not filled, to match the
  // editorial Treehouse aesthetic. Uses currentColor by default so callers
  // can paint it via CSS color.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={v1.green}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        border: "2px solid rgba(245,236,216,0.35)",
        borderTopColor: "#f5ecd8",
        animation: "sharebooth-spin 0.7s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

// ─── Error copy ────────────────────────────────────────────────────────────
// Per build-spec §3, distinguish the server's status codes. The server uses
// 429 for BOTH IP rate-limit AND per-recipient dedup — we distinguish those
// two on the error string the server returns rather than the status alone.
function errorCopyFor(status: number, serverError?: string): string {
  // 403 — ownership check failed. Shouldn't happen in practice because the
  // sheet only opens for a vendor's own booth, but copy is defensive.
  if (status === 403) {
    return "You can only share booths you own.";
  }

  // 409 — empty-window guard. Shouldn't happen (icon is hidden when empty),
  // but defense in depth.
  if (status === 409) {
    return "This booth has no finds to share yet. Add something to the Window first.";
  }

  // 429 — two sub-cases. The server returns a specific string on dedup
  // ("Already sent to that address a moment ago — give it a minute.") vs.
  // the IP rate limit ("Too many sends — try again in a few minutes.").
  // Prefer the server's copy when present; fall back to a generic.
  if (status === 429) {
    if (serverError) return serverError;
    return "Too many sends — try again in a few minutes.";
  }

  // 400 — bad email or bad vendor id. Shouldn't hit with client validation,
  // but surfacing the server's copy here helps during debugging and
  // accidental direct POSTs.
  if (status === 400) {
    return serverError ?? "Please check the email and try again.";
  }

  // 502 — Resend failure, server-side send failed.
  if (status === 502) {
    return "Couldn't send right now — please try again in a minute.";
  }

  // 500 — unexpected server error (ownership lookup failed, mall missing).
  if (status === 500) {
    return serverError ?? "Something went wrong on our end. Please try again.";
  }

  // Catch-all for any unhandled status.
  return serverError ?? "Couldn't send right now. Please try again.";
}
