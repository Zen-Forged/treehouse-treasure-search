// components/ShareSheet.tsx
// ShareSheet — Frame C 3-channel grid with sub-screens for Email + QR.
// Layer 2 primitive adoption + v1 → v2 migration shipped session 149.
//
// Sheet chrome (backdrop + paper sheet + handle pill + TopBar) lives in
// <BottomSheet> at components/ui/BottomSheet.tsx.
// Entity context block (title + booth pill + mall row + address) lives
// in <SlimHeader> at components/ui/SlimHeader.tsx.
// 3-column share-channel tile grid (Email/SMS/QR/Copy) lives in
// <ChannelGrid> at components/ui/ChannelGrid.tsx (copy state encapsulated).
//
// Session 135 — original Frame C / 14-decision design record at
// docs/share-booth-redesign-design.md (booth path).
//
// Session 137 — entity-discriminated generalization. The sheet now serves
// 3 tiers of the engagement+share lattice (memory:
// project_layered_engagement_share_hierarchy):
//
//   entity.kind === "booth"   → Email + SMS + QR        (Q-011 email; existing path)
//   entity.kind === "mall"    → SMS + QR + Copy Link
//   entity.kind === "find"    → SMS + QR + Copy Link
//
// Email channel is intentionally Booth-only — the booth window email is the
// load-bearing curated experience (Q-011 4-client-audited template, sessions
// 51–53). Mall + Find use the lighter SMS + QR + Copy Link trio.
//
// Preserved verbatim across the Layer 2 adoption:
//   - /api/share-booth backend + Gmail/Outlook-audited HTML email template
//   - Q-008 vendor/admin/shopper auth modes (session 50)
//   - QR component + Treehouse logo overlay (react-qr-code + /icon.png)
//   - Screen state machine: "grid" | "email" | "qr"; React state, not router
//   - Mount-time analytics fires on each QrScreen variant
//
// Reversal log (Q-007 session 41 → 135 → 137 retained):
//   - Email-as-primary-affordance → email is one of three equal channels (135)
//   - 160px always-visible QR → 200px QR demoted to a sub-screen (135)
//   - 3-tile preview strip → preview tiles retired entirely (135)
//   - `previewPosts` deprecated prop → dropped from signature (137)
//
// EMAIL_REGEX is inlined (matches /api/share-booth/route.ts +
// /api/vendor-request). DO NOT import a shared regex.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { PiEnvelopeSimple, PiChatCircleText, PiQrCode, PiLeaf } from "react-icons/pi";
import { authFetch } from "@/lib/authFetch";
import { track } from "@/lib/clientEvents";
import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SlimHeader } from "@/components/ui/SlimHeader";
import { ChannelGrid, type ChannelGridTile } from "@/components/ui/ChannelGrid";
import type { Mall, Post, Vendor } from "@/types/treehouse";

// Same shape as the two server routes (/api/share-booth, /api/vendor-request).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Screen = "grid" | "email" | "qr";

type EmailStatus =
  | { kind: "compose" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

/**
 * Session 137 — entity-discriminated input. Each kind drives:
 *   - Slim header content (which entity's identity is shown)
 *   - Channel set (booth = Email/SMS/QR; mall + find = SMS/QR/CopyLink)
 *   - Channel handlers (entity-specific URLs, SMS body templates, analytics)
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
   * (anonymous POST). Only consulted when entity.kind === "booth".
   */
  mode?: "vendor" | "shopper";
}

/**
 * Session 137 — thin dispatcher. Each entity kind owns its own state
 * machine (different channels, different screen sets) so we extract per-
 * entity body components instead of branching deep inside one render.
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
// Booth-tier share path. Email + SMS + QR channels. Email screen owns the
// 4-state machine (compose / sending / sent / error) preserved verbatim
// from session 41 + Q-008 + Q-011.
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

  // Reset on open: every fresh open starts at the grid screen.
  // Body scroll lock is owned by <BottomSheet>.
  useEffect(() => {
    if (!open) return;
    setScreen("grid");
    setEmail("");
    setEmailStatus({ kind: "compose" });
  }, [open]);

  // Focus email input when transitioning to email screen.
  useEffect(() => {
    if (screen !== "email") return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [screen]);

  // Email submit (preserved verbatim from session 41 + Q-008).
  async function handleEmailSubmit() {
    if (!valid || emailStatus.kind === "sending") return;
    const recipientEmail = trimmed;
    setEmailStatus({ kind: "sending" });

    try {
      // Session 50 (Q-008) — shopper mode uses plain fetch so the server
      // lands on the anonymous branch even if the viewer happens to be
      // signed in as a non-owner. authFetch would attach their bearer
      // token, and the server would 403 with "You don't own this booth."
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

  // Derived strings + URL
  const boothName = vendor.display_name;
  const mallName  = mall?.name ?? vendor.mall?.name ?? "";
  const boothNo   = vendor.booth_number;
  const mallAddress = mall?.address ?? [mall?.city, mall?.state].filter(Boolean).join(", ");
  const boothUrl = (typeof window !== "undefined" ? window.location.origin : "")
    + `/shelf/${vendor.slug}`;

  // Tile tap handlers
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
    const body = `Found this booth on Treehouse Finds: ${boothName} · ${boothUrl}`;
    track("share_booth_sms_initiated", trackPayload);
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
    // Close after firing — iOS/Android handle the URL and the sheet close
    // matches the SMS hand-off mental model.
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
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Share this booth"
      showBack={screen !== "grid"}
      onBack={handleBack}
      closeDisabled={emailStatus.kind === "sending"}
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
    </BottomSheet>
  );
}

// ─── MallShareBody ───────────────────────────────────────────────────────
// Mall-tier share path. Channel set: SMS + QR + Copy Link.
//
// "all-kentucky" mall scope is the literal string the renderer detects to
// surface Kentucky-network header copy with the bare `/` URL — used when
// the user is on Home/Explore with no specific mall picked (D5 of session
// 137 design). No synthetic Mall row is created.
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

  // Reset on open. Body scroll lock is owned by <BottomSheet>.
  useEffect(() => {
    if (!open) return;
    setScreen("grid");
  }, [open]);

  // Mall data derivation
  const isKentucky   = mall === "all-kentucky";
  const mallName     = isKentucky ? "Treehouse Finds Kentucky" : mall.name;
  const mallSubtitle = isKentucky
    ? "Kentucky's antique mall network"
    : [mall.city, mall.state].filter(Boolean).join(", ");
  const mallAddress  = isKentucky ? null : (mall.address ?? null);
  const origin       = typeof window !== "undefined" ? window.location.origin : "";
  const mallUrl      = isKentucky ? `${origin}/` : `${origin}/?mall=${mall.slug}`;
  const trackPayload = { mall_slug: isKentucky ? "all-kentucky" : mall.slug };

  // Channel handlers
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
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Share this mall"
      showBack={screen !== "grid"}
      onBack={handleBack}
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
    </BottomSheet>
  );
}

// ─── FindShareBody ───────────────────────────────────────────────────────
// Find-tier share path. Channel set: SMS + QR + Copy Link. Replaces the
// /find/[id] OS-native navigator.share() with the in-app sheet so the
// share moment carries Treehouse identity.
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

  // Reset on open. Body scroll lock is owned by <BottomSheet>.
  useEffect(() => {
    if (!open) return;
    setScreen("grid");
  }, [open]);

  // Find data derivation (D3 of session 137 design)
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

  // Channel handlers
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
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Share this find"
      showBack={screen !== "grid"}
      onBack={handleBack}
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
    </BottomSheet>
  );
}

// ─── GridScreen (Booth) ──────────────────────────────────────────────────
// Frame C grid for booth entity — 3 tiles (Email + SMS + QR) + footer
// disclaimer. "Share via" eyebrow above the grid (D5).
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
  const tiles: ChannelGridTile[] = [
    { kind: "channel", icon: <PiEnvelopeSimple size={22} color={v2.text.primary} />, label: "Email",   onClick: onEmailTap },
    { kind: "channel", icon: <PiChatCircleText size={22} color={v2.text.primary} />, label: "SMS",     onClick: onSmsTap },
    { kind: "channel", icon: <PiQrCode         size={22} color={v2.text.primary} />, label: "QR Code", onClick: onQrTap },
  ];

  return (
    <>
      <SlimHeader
        title={boothName}
        boothPill={boothNo ?? undefined}
        contextLabel={mallName || undefined}
        addressLine={mallAddress || undefined}
      />
      <ShareViaEyebrow />
      <ChannelGrid tiles={tiles} />
      <FooterDisclaimer copy="Anyone with this link can view this booth in Treehouse Finds." />
    </>
  );
}

// ─── MallGridScreen ──────────────────────────────────────────────────────
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
  const tiles: ChannelGridTile[] = [
    { kind: "channel", icon: <PiChatCircleText size={22} color={v2.text.primary} />, label: "SMS",     onClick: onSmsTap },
    { kind: "channel", icon: <PiQrCode         size={22} color={v2.text.primary} />, label: "QR Code", onClick: onQrTap },
    { kind: "copy",    url: mallUrl, onTap: onCopyLinkTap, onCopySuccess: onCopyLinkSuccess },
  ];

  return (
    <>
      <SlimHeader
        title={mallName}
        contextLabel={mallSubtitle || undefined}
        addressLine={mallAddress ?? undefined}
      />
      <ShareViaEyebrow />
      <ChannelGrid tiles={tiles} />
      <FooterDisclaimer
        copy={isKentucky
          ? "Anyone with this link can browse Treehouse Finds."
          : "Anyone with this link can view this mall in Treehouse Finds."}
      />
    </>
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
  const tiles: ChannelGridTile[] = [
    { kind: "channel", icon: <PiChatCircleText size={22} color={v2.text.primary} />, label: "SMS",     onClick: onSmsTap },
    { kind: "channel", icon: <PiQrCode         size={22} color={v2.text.primary} />, label: "QR Code", onClick: onQrTap },
    { kind: "copy",    url: findUrl, onTap: onCopyLinkTap, onCopySuccess: onCopyLinkSuccess },
  ];

  return (
    <>
      <SlimHeader
        title={findTitle}
        titleClamp={2}
        boothPill={boothNo ?? undefined}
        contextLabel={vendorName || undefined}
        addressLine={mallContext || undefined}
      />
      <ShareViaEyebrow />
      <ChannelGrid tiles={tiles} />
      <FooterDisclaimer copy="Anyone with this link can view this find in Treehouse Finds." />
    </>
  );
}

// ─── EmailScreen ──────────────────────────────────────────────────────────
// Slim header repeat (D8) + section divider + (compose form OR sent state).
// All four states (compose / sending / sent / error) preserved verbatim from
// session 41 + Q-008 + Q-011 — backend unchanged.
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
          title={boothName}
          boothPill={boothNo ?? undefined}
          contextLabel={mallName || undefined}
          addressLine={mallAddress || undefined}
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
        title={boothName}
        boothPill={boothNo ?? undefined}
        contextLabel={mallName || undefined}
        addressLine={mallAddress || undefined}
      />

      {/* Email input — v2 form-field shape: surface.card bg on bg.main paper,
          text.primary text, Inter system font. Matches the project's other
          v2-migrated form fields (post-session-146 ErrorBanner palette). */}
      <label
        htmlFor="share-booth-email"
        style={{
          display: "block",
          fontFamily: FONT_INTER,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: v2.text.muted,
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
          fontFamily: FONT_INTER,
          fontSize: 16,          // 16px prevents iOS zoom-on-focus
          color: v2.text.primary,
          background: v2.surface.card,
          border: `1px solid ${errorMessage ? v2.border.error : v2.border.light}`,
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
            background: v2.surface.error,
            border: `1px solid ${v2.border.error}`,
            fontFamily: FONT_INTER,
            fontSize: 12,
            color: v2.accent.red,
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
          background: v2.accent.green,
          color: v2.surface.card,
          fontFamily: FONT_CORMORANT,
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
            <PaperAirplaneIcon size={16} color={v2.surface.card} />
            <span>Send the invite</span>
          </>
        )}
      </button>

      {/* Spinner keyframes — scoped to EmailScreen since it's the only
          consumer. CSS keyframe registration is global once parsed; the
          inline <style> tag rendering is no-op on re-mount. */}
      <style>{`
        @keyframes sharebooth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ─── SentBody ─────────────────────────────────────────────────────────────
// Cream success bubble + echoed email + "Share with someone else" loop-back +
// "Done" close. Preserved structurally from session 41.
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
          background: v2.accent.greenSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18,
        }}
        aria-hidden="true"
      >
        <CheckGlyph />
      </div>

      <div
        style={{
          fontFamily: FONT_CORMORANT,
          fontSize: 23,
          color: v2.text.primary,
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        Window on its way
      </div>

      <p
        style={{
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 14,
          color: v2.text.secondary,
          lineHeight: 1.6,
          margin: "0 0 16px",
          maxWidth: 320,
        }}
      >
        A Window into {boothName} is heading to
      </p>

      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 14,
          color: v2.text.primary,
          background: v2.surface.card,
          border: `1px solid ${v2.border.light}`,
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
          border: `1px dashed ${v2.border.medium}`,
          borderRadius: 10,
          background: "transparent",
          color: v2.text.secondary,
          fontFamily: FONT_CORMORANT,
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
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 13,
          color: v2.text.muted,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        Done
      </button>
    </div>
  );
}

// ─── QrScreen (Booth) ─────────────────────────────────────────────────────
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
        title={boothName}
        boothPill={boothNo ?? undefined}
        contextLabel={mallName || undefined}
        addressLine={mallAddress || undefined}
      />
      <QrDisplay url={boothUrl} caption="Scan to visit this booth" />
    </>
  );
}

// ─── MallQrScreen ────────────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <SlimHeader
        title={mallName}
        contextLabel={mallSubtitle || undefined}
        addressLine={mallAddress ?? undefined}
      />
      <QrDisplay url={mallUrl} caption={isKentucky ? "Scan to browse Treehouse Finds" : "Scan to visit this mall"} />
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
      <SlimHeader
        title={findTitle}
        titleClamp={2}
        boothPill={boothNo ?? undefined}
        contextLabel={vendorName || undefined}
        addressLine={mallContext || undefined}
      />
      <QrDisplay url={findUrl} caption="Scan to view this find" />
    </>
  );
}

// ─── QrDisplay (shared internal) ─────────────────────────────────────────
// QR wrapper card + 200px QRCode + centered logo halo + italic caption.
// Used verbatim by the 3 QrScreen variants. Internal helper, not a Layer 2
// primitive — if a 4th QR-bearing surface emerges (e.g., onboarding flow),
// promote then.
function QrDisplay({ url, caption }: { url: string; caption: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 22 }}>
      <div
        style={{
          padding: 12,
          background: v2.surface.card,
          borderRadius: 10,
          border: `1px solid ${v2.border.light}`,
          position: "relative",
          display: "inline-block",
        }}
      >
        <QRCode
          value={url}
          size={200}
          level="H"
          fgColor="#000000"
          bgColor="#ffffff"
        />
        {/* Logo overlay — circular icon + halo clears surrounding modules.
            Halo bg #ffffff PRESERVED as brand-presentational utility (NOT
            chrome) per session 146 precedent. */}
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
          fontFamily: FONT_CORMORANT,
          fontStyle: "italic",
          fontSize: 12,
          color: v2.text.muted,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        {caption}
      </div>
    </div>
  );
}

// ─── ShareViaEyebrow (shared internal) ───────────────────────────────────
// Small-caps "SHARE VIA" eyebrow above the ChannelGrid. Used by all 3
// GridScreen variants.
function ShareViaEyebrow() {
  return (
    <div
      style={{
        fontFamily: FONT_INTER,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: v2.text.muted,
        textAlign: "center",
        marginTop: 16,
        marginBottom: 12,
      }}
    >
      Share via
    </div>
  );
}

// ─── FooterDisclaimer (shared internal) ──────────────────────────────────
// "Anyone with this link..." disclaimer at the bottom of each GridScreen.
// Used by all 3 GridScreen variants with entity-specific copy.
function FooterDisclaimer({ copy }: { copy: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8,
        marginTop: 18,
        paddingTop: 14,
        borderTop: `1px solid ${v2.border.light}`,
      }}
    >
      <PiLeaf
        size={14}
        color={v2.text.muted}
        style={{ marginTop: 2, flexShrink: 0 }}
        aria-hidden="true"
      />
      <div
        style={{
          fontFamily: FONT_INTER,
          fontSize: 11,
          color: v2.text.muted,
          lineHeight: 1.45,
          maxWidth: 260,
        }}
      >
        {copy}
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────
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
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={v2.accent.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        borderTopColor: v2.surface.card,
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
