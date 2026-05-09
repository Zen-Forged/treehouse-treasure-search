// components/ShareSheet.tsx
// ShareSheet — Frame C 3-channel grid with sub-screens for Email + QR.
// Bottom-sheet primitive preserved from session 41.
//
// Session 135 — original Frame C / 14-decision design record at
// docs/share-booth-redesign-design.md (booth path).
//
// Session 137 — entity-discriminated generalization. The sheet now serves
// 3 tiers of the engagement+share lattice (memory:
// project_layered_engagement_share_hierarchy):
//
//   entity.kind === "booth"   → Email + SMS + QR        (Q-011 email; existing path)
//   entity.kind === "mall"    → SMS + QR + Copy Link    (wired in commit 3)
//   entity.kind === "find"    → SMS + QR + Copy Link    (wired in commit 4)
//
// Email channel is intentionally Booth-only — the booth window email is the
// load-bearing curated experience (Q-011 4-client-audited template, sessions
// 51–53). Mall + Find use the lighter SMS + QR + Copy Link trio.
//
// Preserved verbatim from session 135 (booth path):
//   - Bottom-sheet chrome (backdrop + paperCream sheet + handle pill)
//   - /api/share-booth backend + Gmail/Outlook-audited HTML email template
//   - Q-008 vendor/admin/shopper auth modes (session 50)
//   - QR component + Treehouse logo overlay (react-qr-code + /icon.png)
//   - Screen state machine: "grid" | "email" | "qr"; React state, not router
//
// Reversal log (Q-007 session 41 → 135 → 137 retained):
//   - Email-as-primary-affordance → email is one of three equal channels (135)
//   - 160px always-visible QR → 200px QR demoted to a sub-screen (135)
//   - 3-tile preview strip → preview tiles retired entirely (135)
//   - `previewPosts` deprecated prop → dropped from signature (137; was
//     unused at render layer since 135, kept for callsite quiet)
//
// EMAIL_REGEX is inlined (matches /api/share-booth/route.ts +
// /api/vendor-request). DO NOT import a shared regex.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { PiEnvelopeSimple, PiChatCircleText, PiQrCode, PiLinkSimple, PiCheck, PiMapPin, PiLeaf } from "react-icons/pi";
import { authFetch } from "@/lib/authFetch";
import { track } from "@/lib/clientEvents";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { Mall, Post, Vendor } from "@/types/treehouse";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Same shape as the two server routes (/api/share-booth, /api/vendor-request).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Screen = "grid" | "email" | "qr";

type EmailStatus =
  | { kind: "compose" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

/**
 * Session 137 — entity-discriminated input. Replaces the prior
 * vendor + mall + previewPosts trio. Each kind drives:
 *   - Slim header content (which entity's identity is shown)
 *   - Channel set (booth = Email/SMS/QR; mall + find = SMS/QR/CopyLink)
 *   - Channel handlers (entity-specific URLs, SMS body templates, analytics)
 *
 * "all-kentucky" mall scope is a string literal (not a synthetic Mall row)
 * because no Mall row has those identity facts; the renderer detects the
 * string and renders Kentucky-network-level header copy + uses the bare
 * `/` URL.
 */
export type ShareSheetEntity =
  | { kind: "booth"; vendor: Vendor; mall: Mall | null }
  | { kind: "mall";  mall: Mall | "all-kentucky" }
  | { kind: "find";  post: Post; vendor: Vendor; mall: Mall | null };

export interface ShareSheetProps {
  open:    boolean;
  onClose: () => void;
  entity:  ShareSheetEntity;
  /**
   * Session 50 (Q-008) — call-site declares whether this is a vendor/admin
   * share (authenticated POST, bearer token attached) or a shopper share
   * (anonymous POST, no bearer). Default "vendor" preserves behavior for any
   * caller that hasn't opted in (Q-009 admin surface, /my-shelf). Parents
   * that expose the sheet to unauthenticated or non-owner viewers must pass
   * "shopper" explicitly. Only consulted when entity.kind === "booth"
   * (Email channel uses authenticated POST to /api/share-booth).
   */
  mode?: "vendor" | "shopper";
}

/**
 * Session 137 — thin dispatcher. Each entity kind owns its own state
 * machine (different channels, different screen sets) so we extract per-
 * entity body components instead of branching deep inside one render.
 *
 * Find body lands in commit 4; until then it early-returns null.
 */
export default function ShareSheet({
  open,
  onClose,
  entity,
  mode = "vendor",
}: ShareSheetProps) {
  if (entity.kind === "find") {
    return <FindShareBody open={open} onClose={onClose} entity={entity} />;
  }
  if (entity.kind === "mall") {
    return <MallShareBody open={open} onClose={onClose} mall={entity.mall} />;
  }
  return <BoothShareBody open={open} onClose={onClose} entity={entity} mode={mode} />;
}

// ─── BoothShareBody ──────────────────────────────────────────────────────
// Session 135 booth path. Body is preserved verbatim from the pre-session-
// 137 ShareBoothSheet — only the function header changed (extracted from
// the main export into a dedicated body so each entity owns its own hook
// lifecycle).
type BoothEntity = Extract<ShareSheetEntity, { kind: "booth" }>;

function BoothShareBody({
  open,
  onClose,
  entity,
  mode,
}: {
  open:    boolean;
  onClose: () => void;
  entity:  BoothEntity;
  mode:    "vendor" | "shopper";
}) {
  const vendor = entity.vendor;
  const mall   = entity.mall;
  const [screen, setScreen]           = useState<Screen>("grid");
  const [email, setEmail]             = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({ kind: "compose" });
  const inputRef                      = useRef<HTMLInputElement | null>(null);

  const trimmed = email.trim();
  const valid   = useMemo(() => EMAIL_REGEX.test(trimmed), [trimmed]);

  // ── Lock body scroll while sheet is open (matches BoothPickerSheet) ──────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── Reset on open: every fresh open starts at the grid screen ───────────
  useEffect(() => {
    if (!open) return;
    setScreen("grid");
    setEmail("");
    setEmailStatus({ kind: "compose" });
  }, [open]);

  // ── Focus email input when transitioning to email screen ────────────────
  useEffect(() => {
    if (screen !== "email") return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [screen]);

  // ── Email submit (preserved verbatim from session 41 + Q-008) ───────────
  async function handleEmailSubmit() {
    if (!valid || emailStatus.kind === "sending") return;
    const recipientEmail = trimmed;
    setEmailStatus({ kind: "sending" });

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
        body:   JSON.stringify({ recipientEmail, activeVendorId: vendor.id }),
      });

      let payload: { ok?: boolean; error?: string } = {};
      try { payload = await res.json(); } catch { /* non-JSON body handled below */ }

      if (res.ok && payload.ok) {
        setEmailStatus({ kind: "sent", email: recipientEmail });
        return;
      }
      setEmailStatus({ kind: "error", message: errorCopyFor(res.status, payload.error) });
    } catch {
      setEmailStatus({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  function handleEmailShareAgain() {
    setEmail("");
    setEmailStatus({ kind: "compose" });
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && emailStatus.kind === "compose" && valid) {
      e.preventDefault();
      handleEmailSubmit();
    }
  }

  // ── Derived strings + URL ───────────────────────────────────────────────
  const boothName = vendor.display_name;
  const mallName  = mall?.name ?? vendor.mall?.name ?? "";
  const boothNo   = vendor.booth_number;

  // mall.address holds the full "street, city, state zip" string from the
  // seed/add-mall.ts pipeline. Fallback to derived string if null.
  const mallAddress = mall?.address ?? [mall?.city, mall?.state].filter(Boolean).join(", ");

  // Public booth URL — uses window.location.origin so it works in dev
  // (localhost) and production (app.kentuckytreehouse.com) without
  // hardcoding. Safe here because this is a "use client" component and
  // the sheet only mounts after hydration.
  const boothUrl = (typeof window !== "undefined" ? window.location.origin : "")
    + `/shelf/${vendor.slug}`;

  // ── Tile tap handlers ───────────────────────────────────────────────────
  const trackPayload = {
    vendor_slug: vendor.slug,
    mall_id:     mall?.id ?? vendor.mall?.id ?? null,
  };

  function handleEmailTap() {
    track("share_booth_channel_tapped", { ...trackPayload, channel: "email" });
    setScreen("email");
  }

  function handleSmsTap() {
    track("share_booth_channel_tapped", { ...trackPayload, channel: "sms" });
    // D9 — SMS body template. encodeURIComponent so any special chars in
    // boothName survive the URL trip without breaking the sms: scheme.
    const body = `Found this booth on Treehouse Finds: ${boothName} · ${boothUrl}`;
    track("share_booth_sms_initiated", trackPayload);
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    // Close after firing — iOS/Android handle the URL and the sheet close
    // matches the SMS hand-off mental model. If the user cancels in
    // Messages, they return to Treehouse Finds with the sheet closed
    // (intentional — they can re-open from the share affordance).
    onClose();
  }

  function handleQrTap() {
    track("share_booth_channel_tapped", { ...trackPayload, channel: "qr_code" });
    setScreen("qr");
  }

  function handleBack() {
    setScreen("grid");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={emailStatus.kind === "sending" ? undefined : onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(30,20,10,0.38)",
              zIndex: 100,
            }}
            aria-hidden="true"
          />

          {/* ── Sheet ──────────────────────────────────────────────────── */}
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
              left: 0, right: 0, bottom: 0,
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
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div
                aria-hidden="true"
                style={{ width: 44, height: 4, borderRadius: 999, background: v1.inkFaint }}
              />
            </div>

            {/* Top bar — × always; ← only on sub-screens. Fixed 36px slot
                so screen swaps don't cause vertical flicker (D11). */}
            <TopBar
              showBack={screen !== "grid"}
              onBack={handleBack}
              onClose={onClose}
              closeDisabled={emailStatus.kind === "sending"}
            />

            {/* Scrollable body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "6px 22px 22px",
              }}
            >
              {screen === "grid" && (
                <GridScreen
                  boothName={boothName}
                  boothNo={boothNo}
                  mallName={mallName}
                  mallAddress={mallAddress}
                  onEmailTap={handleEmailTap}
                  onSmsTap={handleSmsTap}
                  onQrTap={handleQrTap}
                />
              )}

              {screen === "email" && (
                <EmailScreen
                  boothName={boothName}
                  boothNo={boothNo}
                  mallName={mallName}
                  mallAddress={mallAddress}
                  email={email}
                  onEmailChange={setEmail}
                  inputRef={inputRef}
                  onKeyDown={handleEmailKeyDown}
                  status={emailStatus}
                  valid={valid}
                  onSubmit={handleEmailSubmit}
                  onShareAgain={handleEmailShareAgain}
                  onDone={onClose}
                />
              )}

              {screen === "qr" && (
                <QrScreen
                  boothName={boothName}
                  boothNo={boothNo}
                  mallName={mallName}
                  mallAddress={mallAddress}
                  boothUrl={boothUrl}
                  trackPayload={trackPayload}
                />
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Keyframes for the sending-state spinner. Plain <style>, not styled-jsx
          — this repo uses inline styles + Tailwind, not styled-jsx. */}
      <style>{`
        @keyframes sharebooth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
}

// ─── MallShareBody ───────────────────────────────────────────────────────
// Session 137 — mall share path. Channel set: SMS + QR + Copy Link (no
// Email — that channel stays Booth-only because the booth window email is
// the load-bearing curated experience, Q-011 4-client-audited template).
//
// "all-kentucky" mall scope is the literal string the renderer detects to
// surface Kentucky-network header copy with the bare `/` URL — used when
// the user is on Home/Explore with no specific mall picked (D5 of session
// 137 design). No synthetic Mall row is created.
//
// Sheet chrome (backdrop + sheet + handle + topbar + scrollable body) is
// inlined rather than extracted to a shared <SheetChrome> primitive — if
// commit 4 (find) duplicates the chrome a third time, factor it then.
type MallScreen = "grid" | "qr";

function MallShareBody({
  open,
  onClose,
  mall,
}: {
  open:    boolean;
  onClose: () => void;
  mall:    Mall | "all-kentucky";
}) {
  const [screen, setScreen] = useState<MallScreen>("grid");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setScreen("grid");
  }, [open]);

  // ── Mall data derivation ────────────────────────────────────────────────
  const isKentucky   = mall === "all-kentucky";
  const mallName     = isKentucky ? "Treehouse Finds Kentucky" : mall.name;
  const mallSubtitle = isKentucky
    ? "Kentucky's antique mall network"
    : [mall.city, mall.state].filter(Boolean).join(", ");
  const mallAddress  = isKentucky ? null : (mall.address ?? null);
  const origin       = typeof window !== "undefined" ? window.location.origin : "";
  const mallUrl      = isKentucky ? `${origin}/` : `${origin}/?mall=${mall.slug}`;
  const trackPayload = { mall_slug: isKentucky ? "all-kentucky" : mall.slug };

  // ── Channel handlers ────────────────────────────────────────────────────
  function handleSmsTap() {
    track("share_mall_channel_tapped", { ...trackPayload, channel: "sms" });
    const body = `Found this mall on Treehouse Finds: ${mallName} · ${mallUrl}`;
    track("share_mall_sms_initiated", trackPayload);
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    onClose();
  }

  function handleQrTap() {
    track("share_mall_channel_tapped", { ...trackPayload, channel: "qr_code" });
    setScreen("qr");
  }

  function handleCopyLinkTap() {
    track("share_mall_channel_tapped", { ...trackPayload, channel: "copy_link" });
  }

  function handleCopyLinkSuccess() {
    track("share_mall_copy_link_completed", trackPayload);
  }

  function handleBack() {
    setScreen("grid");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(30,20,10,0.38)", zIndex: 100 }}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share this mall"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              position: "fixed",
              left: 0, right: 0, bottom: 0,
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
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div aria-hidden="true" style={{ width: 44, height: 4, borderRadius: 999, background: v1.inkFaint }} />
            </div>

            <TopBar
              showBack={screen !== "grid"}
              onBack={handleBack}
              onClose={onClose}
              closeDisabled={false}
            />

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "6px 22px 22px",
              }}
            >
              {screen === "grid" && (
                <MallGridScreen
                  mallName={mallName}
                  mallSubtitle={mallSubtitle}
                  mallAddress={mallAddress}
                  mallUrl={mallUrl}
                  isKentucky={isKentucky}
                  onSmsTap={handleSmsTap}
                  onQrTap={handleQrTap}
                  onCopyLinkTap={handleCopyLinkTap}
                  onCopyLinkSuccess={handleCopyLinkSuccess}
                />
              )}

              {screen === "qr" && (
                <MallQrScreen
                  mallName={mallName}
                  mallSubtitle={mallSubtitle}
                  mallAddress={mallAddress}
                  mallUrl={mallUrl}
                  isKentucky={isKentucky}
                  trackPayload={trackPayload}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── MallSlimHeader ──────────────────────────────────────────────────────
// Frame C header for mall entity. Mall name (28px Lora) + city/state row
// + full address. Repeats verbatim across grid + qr screens (mirrors the
// session 135 booth slim header pattern). No booth pill — mall doesn't
// have a per-booth context. all-Kentucky variant subs the city/state row
// for "Kentucky's antique mall network" and hides the address line.
function MallSlimHeader({
  mallName,
  mallSubtitle,
  mallAddress,
}: {
  mallName:     string;
  mallSubtitle: string;
  mallAddress:  string | null;
}) {
  return (
    <div style={{ paddingTop: 12, flexShrink: 0 }}>
      <div
        style={{
          fontFamily: FONT_LORA,
          fontWeight: 500,
          fontSize: 28,
          color: v1.inkPrimary,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          padding: "0 8px",
        }}
      >
        {mallName}
      </div>

      {mallSubtitle && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, marginTop: 14 }}>
          <PiMapPin
            size={14}
            color={v1.inkMid}
            style={{ marginTop: 3, flexShrink: 0 }}
            aria-hidden="true"
          />
          <span
            style={{
              fontFamily: FONT_LORA,
              fontWeight: 500,
              fontSize: 16,
              color: v1.inkPrimary,
              lineHeight: 1.3,
            }}
          >
            {mallSubtitle}
          </span>
        </div>
      )}

      {mallAddress && (
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 12,
            color: v1.inkMid,
            textAlign: "center",
            lineHeight: 1.4,
            marginTop: 4,
            padding: "0 12px",
          }}
        >
          {mallAddress}
        </div>
      )}

      <div style={{ height: 1, background: v1.inkHairline, marginTop: 18 }} />
    </div>
  );
}

// ─── MallGridScreen ──────────────────────────────────────────────────────
// Frame C grid for mall entity — 3 tiles (SMS + QR + Copy Link) + footer
// disclaimer. "Share via" eyebrow above the grid (D5).
function MallGridScreen({
  mallName,
  mallSubtitle,
  mallAddress,
  mallUrl,
  isKentucky,
  onSmsTap,
  onQrTap,
  onCopyLinkTap,
  onCopyLinkSuccess,
}: {
  mallName:          string;
  mallSubtitle:      string;
  mallAddress:       string | null;
  mallUrl:           string;
  isKentucky:        boolean;
  onSmsTap:          () => void;
  onQrTap:           () => void;
  onCopyLinkTap:     () => void;
  onCopyLinkSuccess: () => void;
}) {
  return (
    <>
      <MallSlimHeader
        mallName={mallName}
        mallSubtitle={mallSubtitle}
        mallAddress={mallAddress}
      />

      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: v1.inkMuted,
          textAlign: "center",
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        Share via
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <ChannelTile icon={<PiChatCircleText size={22} color={v1.inkPrimary} />} label="SMS"      onClick={onSmsTap} />
        <ChannelTile icon={<PiQrCode        size={22} color={v1.inkPrimary} />} label="QR Code"  onClick={onQrTap} />
        <CopyLinkTile url={mallUrl} onTap={onCopyLinkTap} onCopySuccess={onCopyLinkSuccess} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${v1.inkHairline}`,
        }}
      >
        <PiLeaf
          size={14}
          color={v1.inkMuted}
          style={{ marginTop: 2, flexShrink: 0 }}
          aria-hidden="true"
        />
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 11,
            color: v1.inkMuted,
            lineHeight: 1.45,
            maxWidth: 260,
          }}
        >
          {isKentucky
            ? "Anyone with this link can browse Treehouse Finds."
            : "Anyone with this link can view this mall in Treehouse Finds."}
        </div>
      </div>
    </>
  );
}

// ─── MallQrScreen ────────────────────────────────────────────────────────
// Slim header repeat + section divider + 200px QR + caption. Fires
// share_mall_qr_viewed once on mount (mirrors booth's QrScreen).
function MallQrScreen({
  mallName,
  mallSubtitle,
  mallAddress,
  mallUrl,
  isKentucky,
  trackPayload,
}: {
  mallName:     string;
  mallSubtitle: string;
  mallAddress:  string | null;
  mallUrl:      string;
  isKentucky:   boolean;
  trackPayload: { mall_slug: string };
}) {
  useEffect(() => {
    track("share_mall_qr_viewed", trackPayload);
    // Empty deps + mount-only fire is intentional — re-mount on each
    // grid → qr navigation is the right signal for another view count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <MallSlimHeader
        mallName={mallName}
        mallSubtitle={mallSubtitle}
        mallAddress={mallAddress}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
        <div
          style={{
            padding: 12,
            background: v1.postit,
            borderRadius: 10,
            border: `1px solid ${v1.inkHairline}`,
            position: "relative",
            display: "inline-block",
          }}
        >
          <QRCode
            value={mallUrl}
            size={200}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 44,
              background: "#ffffff",
              borderRadius: "50%",
              boxShadow: "0 0 0 4px #ffffff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={44} height={44} style={{ display: "block" }} />
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 12,
            color: v1.inkMuted,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          {isKentucky ? "Scan to browse Treehouse Finds" : "Scan to visit this mall"}
        </div>
      </div>
    </>
  );
}

// ─── CopyLinkTile ────────────────────────────────────────────────────────
// Channel tile that owns its own clipboard + visual feedback state. Tap →
// (1) onTap fires immediately so parent can record the channel_tapped
// analytics regardless of clipboard outcome; (2) clipboard.writeText
// runs; (3) on success, onCopySuccess fires + the icon swaps to a
// checkmark for 1600ms + label changes to "Copied" + sheet stays open
// (D4 of session 137 — matches MastheadShareButton's existing 1600ms
// feedback pattern). Clipboard failure surfaces nothing visually for
// now; the share_*_copy_link_completed event is the success-only signal.
function CopyLinkTile({
  url,
  onTap,
  onCopySuccess,
}: {
  url:           string;
  onTap:         () => void;
  onCopySuccess: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef          = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleClick() {
    onTap();
    try {
      await navigator.clipboard.writeText(url);
      onCopySuccess();
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked / unavailable — surface nothing for now. Future
      // dial: fall back to selecting the URL text or showing an inline
      // failure state if clipboard reliability surfaces as a real issue.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: "rgba(255,255,255,0.4)",
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 10,
        padding: "16px 6px 12px",
        textAlign: "center",
        boxShadow: "0 1px 2px rgba(44,36,28,0.05)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        {copied
          ? <PiCheck       size={22} color={v1.green} />
          : <PiLinkSimple  size={22} color={v1.inkPrimary} />}
      </span>
      <span
        style={{
          fontFamily: FONT_LORA,
          fontWeight: 600,
          fontSize: 13,
          color: copied ? v1.green : v1.inkPrimary,
        }}
      >
        {copied ? "Copied" : "Copy Link"}
      </span>
    </button>
  );
}

// ─── FindShareBody ───────────────────────────────────────────────────────
// Session 137 — find share path. Channel set: SMS + QR + Copy Link
// (matches mall path shape; Email stays Booth-only). Replaces the
// /find/[id] OS-native navigator.share() with the in-app sheet so the
// share moment carries Treehouse identity (slim header repeats the
// "this find is at this place" context across screens).
//
// Sheet chrome inlined here too — third duplication of the chrome
// across the file. If the project pattern needs another share entity
// after find, factor a shared <SheetChrome> primitive at that point.
type FindEntity = Extract<ShareSheetEntity, { kind: "find" }>;
type FindScreen = "grid" | "qr";

function FindShareBody({
  open,
  onClose,
  entity,
}: {
  open:    boolean;
  onClose: () => void;
  entity:  FindEntity;
}) {
  const [screen, setScreen] = useState<FindScreen>("grid");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setScreen("grid");
  }, [open]);

  // ── Find data derivation (D3 of session 137 design) ────────────────────
  const post       = entity.post;
  const vendor     = entity.vendor;
  const mall       = entity.mall;
  const findTitle  = post.title ?? "Untitled find";
  const vendorName = vendor.display_name;
  const boothNo    = vendor.booth_number ?? null;
  const mallName   = mall?.name ?? null;
  const mallCity   = mall?.city ?? null;
  // Mall + city composed as one short context string for the slim header
  // bottom row; mirrors how /find/[id] cartographic eyebrow surfaces this
  // pair (mall name above, city beneath it after session 134's swap).
  const mallContext = [mallName, mallCity].filter(Boolean).join(", ");
  const origin     = typeof window !== "undefined" ? window.location.origin : "";
  const findUrl    = `${origin}/find/${post.id}`;
  const trackPayload = { post_id: post.id, vendor_slug: vendor.slug };

  // ── Channel handlers ────────────────────────────────────────────────────
  function handleSmsTap() {
    track("share_find_channel_tapped", { ...trackPayload, channel: "sms" });
    const body = `Found this on Treehouse Finds: ${findTitle} · ${findUrl}`;
    track("share_find_sms_initiated", trackPayload);
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    onClose();
  }

  function handleQrTap() {
    track("share_find_channel_tapped", { ...trackPayload, channel: "qr_code" });
    setScreen("qr");
  }

  function handleCopyLinkTap() {
    track("share_find_channel_tapped", { ...trackPayload, channel: "copy_link" });
  }

  function handleCopyLinkSuccess() {
    track("share_find_copy_link_completed", trackPayload);
  }

  function handleBack() {
    setScreen("grid");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(30,20,10,0.38)", zIndex: 100 }}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share this find"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: EASE }}
            style={{
              position: "fixed",
              left: 0, right: 0, bottom: 0,
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
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div aria-hidden="true" style={{ width: 44, height: 4, borderRadius: 999, background: v1.inkFaint }} />
            </div>

            <TopBar
              showBack={screen !== "grid"}
              onBack={handleBack}
              onClose={onClose}
              closeDisabled={false}
            />

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                WebkitOverflowScrolling: "touch",
                padding: "6px 22px 22px",
              }}
            >
              {screen === "grid" && (
                <FindGridScreen
                  findTitle={findTitle}
                  boothNo={boothNo}
                  vendorName={vendorName}
                  mallContext={mallContext}
                  findUrl={findUrl}
                  onSmsTap={handleSmsTap}
                  onQrTap={handleQrTap}
                  onCopyLinkTap={handleCopyLinkTap}
                  onCopyLinkSuccess={handleCopyLinkSuccess}
                />
              )}

              {screen === "qr" && (
                <FindQrScreen
                  findTitle={findTitle}
                  boothNo={boothNo}
                  vendorName={vendorName}
                  mallContext={mallContext}
                  findUrl={findUrl}
                  trackPayload={trackPayload}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── FindSlimHeader ──────────────────────────────────────────────────────
// Frame C header for find entity (D3 of session 137 design):
//   [Find Title 28px Lora, 2-line clamp, lineHeight 1.3+]
//   [BOOTH N pill] (centered, omitted when booth_number is null)
//   [PiMapPin] [Vendor name] (centered, Lora 16)
//   [Mall name, City]        (centered, sys 12)
//
// Stack mirrors the session 135 booth slim header (4 rows max) so the
// visual rhythm reads consistently across entity tiers. Title clamp uses
// lineHeight 1.4 per feedback_lora_lineheight_minimum_for_clamp to keep
// descenders inside the line-box.
function FindSlimHeader({
  findTitle,
  boothNo,
  vendorName,
  mallContext,
}: {
  findTitle:   string;
  boothNo:     string | null;
  vendorName:  string;
  mallContext: string;
}) {
  return (
    <div style={{ paddingTop: 12, flexShrink: 0 }}>
      <div
        style={{
          fontFamily: FONT_LORA,
          fontWeight: 500,
          fontSize: 28,
          color: v1.inkPrimary,
          textAlign: "center",
          lineHeight: 1.15,
          letterSpacing: "-0.015em",
          padding: "0 8px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {findTitle}
      </div>

      {boothNo && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              padding: "7px 22px",
              border: `1px solid ${v1.inkHairline}`,
              borderRadius: 8,
              background: "rgba(255,255,255,0.4)",
              fontFamily: FONT_SYS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: v1.inkMid,
              textTransform: "uppercase",
            }}
          >
            BOOTH {boothNo}
          </div>
        </div>
      )}

      {vendorName && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, marginTop: 14 }}>
          <PiMapPin
            size={14}
            color={v1.inkMid}
            style={{ marginTop: 3, flexShrink: 0 }}
            aria-hidden="true"
          />
          <span
            style={{
              fontFamily: FONT_LORA,
              fontWeight: 500,
              fontSize: 16,
              color: v1.inkPrimary,
              lineHeight: 1.3,
            }}
          >
            {vendorName}
          </span>
        </div>
      )}

      {mallContext && (
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 12,
            color: v1.inkMid,
            textAlign: "center",
            lineHeight: 1.4,
            marginTop: 4,
            padding: "0 12px",
          }}
        >
          {mallContext}
        </div>
      )}

      <div style={{ height: 1, background: v1.inkHairline, marginTop: 18 }} />
    </div>
  );
}

// ─── FindGridScreen ──────────────────────────────────────────────────────
function FindGridScreen({
  findTitle,
  boothNo,
  vendorName,
  mallContext,
  findUrl,
  onSmsTap,
  onQrTap,
  onCopyLinkTap,
  onCopyLinkSuccess,
}: {
  findTitle:         string;
  boothNo:           string | null;
  vendorName:        string;
  mallContext:       string;
  findUrl:           string;
  onSmsTap:          () => void;
  onQrTap:           () => void;
  onCopyLinkTap:     () => void;
  onCopyLinkSuccess: () => void;
}) {
  return (
    <>
      <FindSlimHeader
        findTitle={findTitle}
        boothNo={boothNo}
        vendorName={vendorName}
        mallContext={mallContext}
      />

      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: v1.inkMuted,
          textAlign: "center",
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        Share via
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <ChannelTile icon={<PiChatCircleText size={22} color={v1.inkPrimary} />} label="SMS"      onClick={onSmsTap} />
        <ChannelTile icon={<PiQrCode        size={22} color={v1.inkPrimary} />} label="QR Code"  onClick={onQrTap} />
        <CopyLinkTile url={findUrl} onTap={onCopyLinkTap} onCopySuccess={onCopyLinkSuccess} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${v1.inkHairline}`,
        }}
      >
        <PiLeaf
          size={14}
          color={v1.inkMuted}
          style={{ marginTop: 2, flexShrink: 0 }}
          aria-hidden="true"
        />
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 11,
            color: v1.inkMuted,
            lineHeight: 1.45,
            maxWidth: 260,
          }}
        >
          Anyone with this link can view this find in Treehouse Finds.
        </div>
      </div>
    </>
  );
}

// ─── FindQrScreen ────────────────────────────────────────────────────────
function FindQrScreen({
  findTitle,
  boothNo,
  vendorName,
  mallContext,
  findUrl,
  trackPayload,
}: {
  findTitle:    string;
  boothNo:      string | null;
  vendorName:   string;
  mallContext:  string;
  findUrl:      string;
  trackPayload: { post_id: string; vendor_slug: string };
}) {
  useEffect(() => {
    track("share_find_qr_viewed", trackPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <FindSlimHeader
        findTitle={findTitle}
        boothNo={boothNo}
        vendorName={vendorName}
        mallContext={mallContext}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
        <div
          style={{
            padding: 12,
            background: v1.postit,
            borderRadius: 10,
            border: `1px solid ${v1.inkHairline}`,
            position: "relative",
            display: "inline-block",
          }}
        >
          <QRCode
            value={findUrl}
            size={200}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 44,
              background: "#ffffff",
              borderRadius: "50%",
              boxShadow: "0 0 0 4px #ffffff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={44} height={44} style={{ display: "block" }} />
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 12,
            color: v1.inkMuted,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          Scan to view this find
        </div>
      </div>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────
// Fixed-height row with back arrow on the left (only when showBack=true) and
// close × on the right (always). Per D11, both buttons sit in the same slot
// so the slot height is fixed at 36px and screen swaps don't flicker.
function TopBar({
  showBack,
  onBack,
  onClose,
  closeDisabled,
}: {
  showBack:      boolean;
  onBack:        () => void;
  onClose:       () => void;
  closeDisabled: boolean;
}) {
  const button: React.CSSProperties = {
    width: 36, height: 36,
    borderRadius: "50%",
    border: `1px solid ${v1.inkHairline}`,
    background: "rgba(255,255,255,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: v1.inkMid,
    padding: 0,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 22px", height: 36, flexShrink: 0 }}>
      {showBack ? (
        <button type="button" onClick={onBack} aria-label="Back" style={button}>
          <ArrowLeftGlyph />
        </button>
      ) : (
        <div style={{ width: 36, height: 36 }} aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close"
        style={{ ...button, opacity: closeDisabled ? 0.5 : 1, cursor: closeDisabled ? "default" : "pointer" }}
      >
        <CloseGlyph />
      </button>
    </div>
  );
}

// ─── SlimHeader ───────────────────────────────────────────────────────────
// Frame C header — booth name medium + booth pill + mall row + full address.
// Repeats verbatim across all three screens (D8 + D10) so context is
// preserved as the user navigates.
function SlimHeader({
  boothName,
  boothNo,
  mallName,
  mallAddress,
}: {
  boothName:   string;
  boothNo:     string | null;
  mallName:    string;
  mallAddress: string;
}) {
  return (
    <div style={{ paddingTop: 12, flexShrink: 0 }}>
      <div
        style={{
          fontFamily: FONT_LORA,
          fontWeight: 500,
          fontSize: 28,
          color: v1.inkPrimary,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          padding: "0 8px",
        }}
      >
        {boothName}
      </div>

      {boothNo && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div
            style={{
              padding: "7px 22px",
              border: `1px solid ${v1.inkHairline}`,
              borderRadius: 8,
              background: "rgba(255,255,255,0.4)",
              fontFamily: FONT_SYS,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: v1.inkMid,
              textTransform: "uppercase",
            }}
          >
            BOOTH {boothNo}
          </div>
        </div>
      )}

      {mallName && (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 6, marginTop: 14 }}>
            <PiMapPin
              size={14}
              color={v1.inkMid}
              style={{ marginTop: 3, flexShrink: 0 }}
              aria-hidden="true"
            />
            <span
              style={{
                fontFamily: FONT_LORA,
                fontWeight: 500,
                fontSize: 16,
                color: v1.inkPrimary,
                lineHeight: 1.3,
              }}
            >
              {mallName}
            </span>
          </div>

          {mallAddress && (
            <div
              style={{
                fontFamily: FONT_SYS,
                fontSize: 12,
                color: v1.inkMid,
                textAlign: "center",
                lineHeight: 1.4,
                marginTop: 4,
                padding: "0 12px",
              }}
            >
              {mallAddress}
            </div>
          )}
        </>
      )}

      {/* Section divider */}
      <div style={{ height: 1, background: v1.inkHairline, marginTop: 18 }} />
    </div>
  );
}

// ─── GridScreen ───────────────────────────────────────────────────────────
// Frame C grid — 3 square tiles (Email + SMS + QR) + footer disclaimer.
// "Share via" eyebrow above the grid (D5). No sub-labels (Frame C drops
// them — icons + label carry the channel meaning).
function GridScreen({
  boothName,
  boothNo,
  mallName,
  mallAddress,
  onEmailTap,
  onSmsTap,
  onQrTap,
}: {
  boothName:   string;
  boothNo:     string | null;
  mallName:    string;
  mallAddress: string;
  onEmailTap:  () => void;
  onSmsTap:    () => void;
  onQrTap:     () => void;
}) {
  return (
    <>
      <SlimHeader
        boothName={boothName}
        boothNo={boothNo}
        mallName={mallName}
        mallAddress={mallAddress}
      />

      <div
        style={{
          fontFamily: FONT_SYS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: v1.inkMuted,
          textAlign: "center",
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        Share via
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <ChannelTile icon={<PiEnvelopeSimple size={22} color={v1.inkPrimary} />} label="Email" onClick={onEmailTap} />
        <ChannelTile icon={<PiChatCircleText size={22} color={v1.inkPrimary} />} label="SMS"   onClick={onSmsTap} />
        <ChannelTile icon={<PiQrCode size={22} color={v1.inkPrimary} />}        label="QR Code" onClick={onQrTap} />
      </div>

      {/* Footer disclaimer (D12) — grid screen only */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${v1.inkHairline}`,
        }}
      >
        <PiLeaf
          size={14}
          color={v1.inkMuted}
          style={{ marginTop: 2, flexShrink: 0 }}
          aria-hidden="true"
        />
        <div
          style={{
            fontFamily: FONT_SYS,
            fontSize: 11,
            color: v1.inkMuted,
            lineHeight: 1.45,
            maxWidth: 260,
          }}
        >
          Anyone with this link can view this booth in Treehouse Finds.
        </div>
      </div>
    </>
  );
}

// ─── ChannelTile ──────────────────────────────────────────────────────────
function ChannelTile({
  icon,
  label,
  onClick,
}: {
  icon:    React.ReactNode;
  label:   string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.4)",
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 10,
        padding: "16px 6px 12px",
        textAlign: "center",
        boxShadow: "0 1px 2px rgba(44,36,28,0.05)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
        {icon}
      </span>
      <span
        style={{
          fontFamily: FONT_LORA,
          fontWeight: 600,
          fontSize: 13,
          color: v1.inkPrimary,
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─── EmailScreen ──────────────────────────────────────────────────────────
// Slim header repeat (D8) + section divider + (compose form OR sent state).
// All four states (compose / sending / sent / error) preserved verbatim from
// session 41 + Q-008 + Q-011 — backend unchanged, UX moves behind a tile tap.
function EmailScreen({
  boothName,
  boothNo,
  mallName,
  mallAddress,
  email,
  onEmailChange,
  inputRef,
  onKeyDown,
  status,
  valid,
  onSubmit,
  onShareAgain,
  onDone,
}: {
  boothName:     string;
  boothNo:       string | null;
  mallName:      string;
  mallAddress:   string;
  email:         string;
  onEmailChange: (v: string) => void;
  inputRef:      React.Ref<HTMLInputElement>;
  onKeyDown:     (e: React.KeyboardEvent<HTMLInputElement>) => void;
  status:        EmailStatus;
  valid:         boolean;
  onSubmit:      () => void;
  onShareAgain:  () => void;
  onDone:        () => void;
}) {
  const sending      = status.kind === "sending";
  const errorMessage = status.kind === "error" ? status.message : null;

  if (status.kind === "sent") {
    return (
      <>
        <SlimHeader
          boothName={boothName}
          boothNo={boothNo}
          mallName={mallName}
          mallAddress={mallAddress}
        />
        <SentBody
          email={status.email}
          boothName={boothName}
          onShareAgain={onShareAgain}
          onDone={onDone}
        />
      </>
    );
  }

  return (
    <>
      <SlimHeader
        boothName={boothName}
        boothNo={boothNo}
        mallName={mallName}
        mallAddress={mallAddress}
      />

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
          marginTop: 18,
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
    </>
  );
}

// ─── SentBody ─────────────────────────────────────────────────────────────
// Paper-wash success bubble + echoed email + "Share with someone else"
// loop-back + "Done" close. Preserved verbatim from session 41.
function SentBody({
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
        paddingTop: 20,
      }}
    >
      <div
        style={{
          width: 56, height: 56,
          borderRadius: "50%",
          background: "rgba(30,77,43,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
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

// ─── QrScreen ─────────────────────────────────────────────────────────────
// Slim header repeat (D10) + section divider + 200px QR code with Treehouse
// logo overlay + caption. Fires share_booth_qr_viewed once on mount per D13.
function QrScreen({
  boothName,
  boothNo,
  mallName,
  mallAddress,
  boothUrl,
  trackPayload,
}: {
  boothName:    string;
  boothNo:      string | null;
  mallName:     string;
  mallAddress:  string;
  boothUrl:     string;
  trackPayload: { vendor_slug: string; mall_id: string | null };
}) {
  // Fire share_booth_qr_viewed once per QR-screen mount (D13). Mounting is
  // the right signal — the user has expressed intent to surface the QR.
  useEffect(() => {
    track("share_booth_qr_viewed", trackPayload);
    // Empty deps + mount-only fire is intentional. The QR is re-mounted
    // when the user navigates back to grid + taps QR again, which is
    // exactly when we want to count another view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SlimHeader
        boothName={boothName}
        boothNo={boothNo}
        mallName={mallName}
        mallAddress={mallAddress}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
        <div
          style={{
            padding: 12,
            background: v1.postit,
            borderRadius: 10,
            border: `1px solid ${v1.inkHairline}`,
            position: "relative",
            display: "inline-block",
          }}
        >
          <QRCode
            value={boothUrl}
            size={200}
            level="H"
            fgColor="#000000"
            bgColor="#ffffff"
          />
          {/* Logo overlay — circular icon + halo clears surrounding modules. */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 44,
              background: "#ffffff",
              borderRadius: "50%",
              boxShadow: "0 0 0 4px #ffffff",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="" width={44} height={44} style={{ display: "block" }} />
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 12,
            color: v1.inkMuted,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          Scan to visit this booth
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────
function ArrowLeftGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function PaperAirplaneIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.5 21l-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={v1.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

// ─── Error copy ───────────────────────────────────────────────────────────
// Per session-41 build-spec §3 — preserved verbatim.
function errorCopyFor(status: number, serverError?: string): string {
  if (status === 403) return "You can only share booths you own.";
  if (status === 409) return "This booth has no finds to share yet. Add something to the Window first.";
  if (status === 429) return serverError ?? "Too many sends — try again in a few minutes.";
  if (status === 400) return serverError ?? "Please check the email and try again.";
  if (status === 502) return "Couldn't send right now — please try again in a minute.";
  if (status === 500) return serverError ?? "Something went wrong on our end. Please try again.";
  return serverError ?? "Couldn't send right now. Please try again.";
}
