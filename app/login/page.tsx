// app/login/page.tsx
// Login — email-first single-form entry. Shape A from session 115.
//
// Routing model (post-session-115; /login/email alias retired session 147
// after the D6-locked 30-day window):
//   /login          = this page. Email entry → 6-digit OTP code OR magic-link
//                     → routed via pickDest based on detectUserRole.
//   /welcome        = first-sign-in disambiguation (none-state landing).
//
// What lives here (consolidated from prior /login + /login/email):
//   • Email entry → magic-link send + 6-digit OTP entry (lib/auth.ts sendMagicLink)
//   • Code entry, paste-from-clipboard, resend cooldown (30s)
//   • Magic-link callback bridge — when ?confirmed=1 lands here from the email
//     round trip, polling waits for session and routes via pickDest
//   • Authed-state action cards — Profile bubble routes here when authed:
//       - "Manage my booth" → /my-shelf (renders only when hasVendorRow)
//       - "Admin tools" → /admin (renders only for admin)
//       - Shopper-only authed → auto-redirect to /me (sign-out lives there)
//       - None-state authed → auto-redirect to /welcome
//   • Sign-out italic dotted-link (only renders when authed-with-action-cards)
//   • Vendor signup discoverability via two-line italic footer
//
// What changed from the session-93 split (/login = triage, /login/email = form):
//   • Triage retired. One email field instead of two cards + form.
//   • Server detects who you are via detectUserRole post-magic-link.
//   • "I'm shopping" card retired — sync footer on /flagged keeps role=shopper
//     threading via pickDest.
//   • New "none" state lands on /welcome (replaces "/my-shelf fall-through"
//     that stranded users on "No booth assigned").
//
// Auth chrome relocation pattern is now 4 migrations deep
// (≤87 right → 90 BottomNav-tab → 109 masthead-left → 115 email-first form).

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
// ArrowLeft stays Lucide per MastheadBackButton primitive convention;
// Loader stays Lucide as canonical spinning-animation primitive (Phosphor
// PiSpinner has a different visual character). Mail/Clipboard/Store/
// KeyRound/HelpCircle migrate to Phosphor weight-pair vocabulary per
// session 145 BottomNav cohesion sweep + session 137 ShareSheet
// migrations.
import { ArrowLeft, Loader } from "lucide-react";
import { PiEnvelopeSimple, PiClipboard, PiStorefrontBold, PiKey, PiQuestion } from "react-icons/pi";
import { sendMagicLink, getSession, signOut, onAuthChange, isAdmin, detectUserRoleWithAutoClaim, tryAutoClaimVendorRows } from "@/lib/auth";
import { isReviewMode } from "@/lib/reviewMode";
import { supabase } from "@/lib/supabase";
import { v1, v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import FormField, { formInputStyle } from "@/components/FormField";
import BottomNav from "@/components/BottomNav";
import FormButton from "@/components/FormButton";
import type { User } from "@supabase/supabase-js";
import type { ReadonlyURLSearchParams } from "next/navigation";

type Screen = "enter-email" | "enter-code";
type RenderState = "loading" | "form" | "authed-cards" | "confirming";

const AUTH_CHANNEL = "treehouse_auth";
const RESEND_COOLDOWN_SEC = 30;

function safeRedirect(next: string | null, fallback = "/my-shelf"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

const inputErrorOverride: React.CSSProperties = {
  border: `1.5px solid ${v2.border.error}`,
  padding: "13.5px 13.5px",
};

// Async — see lib/auth.ts detectUserRole. New "none" branch routes to
// /welcome (Shape A) instead of stranding the user on /my-shelf "No booth
// assigned". Order: explicit redirect → role=shopper threading → detection.
async function pickDest(user: User | null, searchParams: ReadonlyURLSearchParams): Promise<string> {
  const explicit = searchParams.get("redirect") ?? searchParams.get("next");
  if (explicit) return safeRedirect(explicit);
  // R1 — shopper claim flow. Threaded through magic-link redirectTo by
  // /flagged sync footer or any caller that sets ?role=shopper. Saves a
  // tap by skipping /welcome for users who've already signaled shopper
  // intent. Returning shoppers are bounced to /me by /login/email/handle.
  if (searchParams.get("role") === "shopper") return "/login/email/handle";

  // Auto-claim variant — repairs the approved-but-unlinked vendor case
  // (vendors row inserted with user_id=NULL by admin approval; linked
  // here on first sign-in via /api/setup/lookup-vendor). Falls through
  // to "none" → /welcome only when there's nothing claimable.
  const role = await detectUserRoleWithAutoClaim(user);
  if (role === "admin")   return "/";
  if (role === "vendor")  return "/my-shelf";
  if (role === "shopper") return "/me";
  return "/welcome";
}

function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const confirmed        = searchParams.get("confirmed") === "1";
  const explicitRedirect = searchParams.get("redirect") ?? searchParams.get("next");

  const [renderState, setRenderState] = useState<RenderState>(
    confirmed ? "confirming" : "loading"
  );
  const [screen, setScreen] = useState<Screen>("enter-email");

  // Email-entry form state
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  // Authed-state cards (action surface for vendors + admins)
  const [authedUser,   setAuthedUser]   = useState<User | null>(null);
  const [hasVendorRow, setHasVendorRow] = useState(false);
  const [signingOut,   setSigningOut]   = useState(false);

  // Code-entry state
  const [code,         setCode]         = useState("");
  const [codeBusy,     setCodeBusy]     = useState(false);
  const [codeError,    setCodeError]    = useState<string | null>(null);
  const [resendIn,     setResendIn]     = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [canPaste,     setCanPaste]     = useState(false);
  const codeInputRef                   = useRef<HTMLInputElement>(null);

  // ── Initial mount: auth detect + magic-link callback bridge ────────────
  useEffect(() => {
    // Review Board (session 150) — render unauthed email-entry form
    // directly; skip Supabase session detection + onAuthChange sub +
    // BroadcastChannel. The audit surface shows the triage state real
    // first-time visitors land on.
    if (isReviewMode()) {
      setRenderState("form");
      return;
    }
    if (confirmed) {
      // Magic-link round-trip — Supabase verifies the link, the session
      // appears asynchronously. Poll up to 10s, then fall through to the
      // form so the user can re-enter their email if something went wrong.
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
          router.replace(await pickDest(session.user, searchParams));
        } else if (attempts > 20) {
          clearInterval(interval);
          setRenderState("form");
        }
      }, 500);
      return () => clearInterval(interval);
    }

    let cancelled = false;
    getSession().then(async session => {
      if (cancelled) return;
      const user = session?.user ?? null;
      if (!user) {
        setRenderState("form");
        return;
      }
      // An explicit ?redirect= param overrides everything — known
      // returning flow (approval email, deep-link, /my-shelf bounce).
      if (explicitRedirect) {
        router.replace(await pickDest(user, searchParams));
        return;
      }
      // Authed user — query both role tables in parallel and render the
      // appropriate surface. Shopper-only and none-state users redirect
      // away (their canonical sign-out / setup destinations); admin and
      // vendor users see action cards here.
      const [vendorRes, shopperRes] = await Promise.all([
        supabase.from("vendors").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("shoppers").select("id").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      let vendorRow    = !!vendorRes.data;
      const shopperRow = !!shopperRes.data;
      const adminUser  = isAdmin(user);

      // Auto-claim path — fires whenever no vendor row exists yet.
      // Approved vendors get inserted with user_id=NULL; this links the
      // unlinked row to the auth account on first sign-in via composite-
      // key match against vendor_requests. Idempotent, so safe even
      // though we gate on the negative branch — same gate avoids the
      // round trip for already-linked vendors. The !shopperRow guard
      // is dropped: a user who picked a handle as a shopper before
      // being approved as a vendor must still claim.
      if (!vendorRow && !adminUser) {
        const claimed = await tryAutoClaimVendorRows();
        if (cancelled) return;
        if (claimed) {
          const { data: refetched } = await supabase
            .from("vendors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          if (cancelled) return;
          vendorRow = !!refetched;
        }
      }

      if (adminUser || vendorRow) {
        setAuthedUser(user);
        setHasVendorRow(vendorRow);
        setRenderState("authed-cards");
        return;
      }
      if (shopperRow) {
        router.replace("/me");
        return;
      }
      // None state — first-time auth or abandoned setup. /welcome handles.
      router.replace("/welcome");
    });

    const unsub = onAuthChange(async user => {
      if (cancelled) return;
      if (!user) {
        setAuthedUser(null);
        setHasVendorRow(false);
        setRenderState("form");
        return;
      }
      // Cross-tab sign-in — defer routing to pickDest so a sign-in on
      // another tab triggers the canonical destination here too.
      if (explicitRedirect) {
        router.replace(await pickDest(user, searchParams));
      }
    });

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "signed_in") {
          getSession().then(async s => {
            if (s?.user) router.replace(await pickDest(s.user, searchParams));
          });
        }
      };
    } catch {}

    return () => {
      cancelled = true;
      unsub();
      try { bc?.close(); } catch {}
    };
  }, []);

  // ── Misc effects ───────────────────────────────────────────────────────
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (screen === "enter-code") {
      const t = setTimeout(() => codeInputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const supported = !!(navigator.clipboard && typeof navigator.clipboard.readText === "function");
    setCanPaste(supported);
  }, []);

  // ── Form handlers ──────────────────────────────────────────────────────
  async function handlePasteCode() {
    if (!navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/\d{6}/);
      if (!match) {
        setCodeError("No 6-digit code found on your clipboard.");
        return;
      }
      const digits = match[0];
      setCode(digits);
      setCodeError(null);
      setResendNotice(null);
      if (!codeBusy) handleVerify(digits);
    } catch {
      setCodeError("Couldn't read clipboard. Paste or type the code instead.");
    }
  }

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) { setError("Please enter a valid email address."); return; }
    setBusy(true); setError(null);

    // R1 (preserved) — when role=shopper, thread /login/email/handle as
    // the magic-link redirectTo so the email round-trip lands on the
    // handle picker. Explicit ?redirect= still wins.
    const explicit = searchParams.get("redirect") ?? undefined;
    const role     = searchParams.get("role");
    const redirect = explicit ?? (role === "shopper" ? "/login/email/handle" : undefined);
    const { error: err } = await sendMagicLink(trimmed, redirect);

    setBusy(false);
    if (err) { setError("Couldn't send the link. Try again in a moment."); return; }
    setSentTo(trimmed);
    setCode("");
    setCodeError(null);
    setResendNotice(null);
    setResendIn(RESEND_COOLDOWN_SEC);
    setScreen("enter-code");
  }

  async function handleVerify(submittedCode: string) {
    const token = submittedCode.trim();
    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setCodeError("Enter the 6-digit code from your email.");
      return;
    }
    setCodeBusy(true); setCodeError(null);

    const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
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

    try {
      const bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.postMessage({ type: "signed_in" });
      bc.close();
    } catch {}
    router.replace(await pickDest(verifyData?.user ?? null, searchParams));
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try { await signOut(); } catch {}
    setAuthedUser(null);
    setHasVendorRow(false);
    setSigningOut(false);
    setRenderState("form");
  }

  async function handleResend() {
    if (resendIn > 0 || !sentTo) return;
    setCodeError(null);
    setResendNotice(null);
    const explicit = searchParams.get("redirect") ?? undefined;
    const role     = searchParams.get("role");
    const redirect = explicit ?? (role === "shopper" ? "/login/email/handle" : undefined);
    const { error: err } = await sendMagicLink(sentTo, redirect);
    if (err) {
      setCodeError("Couldn't resend. Try again in a moment.");
      return;
    }
    setResendNotice("New link sent.");
    setResendIn(RESEND_COOLDOWN_SEC);
    setCode("");
    codeInputRef.current?.focus();
  }

  // ── Render: confirming bridge (?confirmed=1 polling) ───────────────────
  if (renderState === "confirming") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v2.bg.main,
          maxWidth: 430,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 28px",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(42,26,10,0.04)",
            border: `0.5px solid ${v2.border.light}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Loader size={22} style={{ color: v2.text.primary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
        </div>
        <h1
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize: 28,
            color: v2.text.primary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "0 0 8px",
          }}
        >
          Signing you in&hellip;
        </h1>
        <p
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            fontSize: 15,
            color: v2.text.muted,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Just a moment.
        </p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render: loading (auth state being queried) ─────────────────────────
  if (renderState === "loading") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v2.bg.main,
          maxWidth: 430,
          margin: "0 auto",
        }}
      />
    );
  }

  // ── Render: form (unauthed) OR authed-cards (vendor / admin) ───────────
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: v2.bg.main,
        maxWidth: 430,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Session 157 Review Board Login #1 — header gains flex space-between
          layout so the help affordance (Contact link) can sit at top-right
          when BottomNav now floats at the bottom of /login. David: "Nav bar
          needs to be added to this page. We'll need to move 'Need help?
          Contact us' link." Bottom help link retires (was line 880-917);
          help moves to a small PiQuestion icon in the masthead-right slot,
          out of BottomNav's way and visible from any /login state. */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => {
            if (screen === "enter-code") {
              setScreen("enter-email");
              setCode("");
              setCodeError(null);
            } else if (renderState === "authed-cards") {
              // Authed user arrived here via Profile bubble. Back exits
              // to Home rather than looping back to this same surface.
              router.push("/");
            } else {
              router.push("/");
            }
          }}
          aria-label="Back"
          style={{
            width: 44,
            height: 44,
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
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>

        {/* Help affordance — moved here from the bottom of the page in
            session 157 Review Board Login #1. Icon-only PiQuestion link
            (44×44 hit target, matching the back button geometry) so
            the slot doesn't shift dimensions when /login transitions
            between rendered states. */}
        <Link
          href="/contact"
          aria-label="Need help? Contact us"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: v1.iconBubble,
            border: "none",
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <PiQuestion size={22} style={{ color: v1.inkPrimary }} />
        </Link>
      </header>

      {/* Review Board Finding 5 (session 169) — content sat low because
          flex `justifyContent: "center"` was vertically-centering the
          form group between the back+help header (top) and BottomNav
          (bottom). David: "centered vertically but is accounting for
          the masthead height which is blank making it seem low."
          Switched to top-anchored via `justifyContent: "flex-start"` +
          explicit `paddingTop: 24` so the wordmark sits closer to the
          header. Form group reads as "anchored at the top of the page"
          (matches the post/tag + post/preview + vendor-flow top-
          anchored rhythm per feedback_admin_flow_one_screen_progression
          ✅ Promoted) instead of "floating in space below the masthead." */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          padding: "24px 24px 8px",
          minHeight: 0,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Image
            src="/wordmark.png"
            alt="Treehouse Finds"
            width={300}
            height={96}
            priority
            style={{
              display: "block",
              margin: "0 auto 14px",
              objectFit: "contain",
              height: 96,
              width: "auto",
              maxWidth: "80%",
            }}
          />
          <p
            style={{
              fontFamily: FONT_CORMORANT,
              fontStyle: "italic",
              // Review Board Finding 6 (session 169) — sub-text 16 → 18.
              // David: "Improve the readability of the text it feels small
              // and hard to read esp on 'enter your email..' text." Second
              // bump on this string (was 14 → 16 at session 153 Finding 11B).
              fontSize: 18,
              color: v2.text.muted,
              lineHeight: 1.55,
              margin: "0 auto",
              maxWidth: 290,
            }}
          >
            {renderState === "authed-cards"
              ? "Manage your booth, jump into admin tools, or sign out."
              : screen === "enter-code"
              ? "We sent a 6-digit code to your email."
              : "Enter your email to continue on Treehouse Finds."}
          </p>
        </div>

        <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
          <AnimatePresence mode="wait">

            {/* Authed cards — vendor + admin only. Shopper / none redirect away. */}
            {renderState === "authed-cards" && authedUser && (
              <motion.div
                key="authed-cards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {hasVendorRow && (
                  <ActionCard
                    href="/my-shelf"
                    title="Manage my booth"
                    subtitle="Edit your shelf, post new finds, mark items sold."
                    icon={<PiStorefrontBold size={20} />}
                  />
                )}
                {isAdmin(authedUser) && (
                  <ActionCard
                    href="/admin"
                    title="Admin tools"
                    subtitle="Locations, vendors, banners, and approvals."
                    icon={<PiKey size={20} />}
                  />
                )}
              </motion.div>
            )}

            {/* Email entry — unauthed only. */}
            {renderState === "form" && screen === "enter-email" && (
              <motion.div
                key="email-enter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <FormField label="Email" size="page">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    onKeyDown={e => e.key === "Enter" && !busy && handleSend()}
                    placeholder="you@example.com"
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                    style={{
                      ...formInputStyle("page"),
                      boxSizing: "border-box",
                      appearance: "none",
                      WebkitAppearance: "none",
                      ...(error ? inputErrorOverride : null),
                    }}
                  />
                </FormField>

                {error && <ErrorBanner message={error} />}

                <FormButton
                  onClick={handleSend}
                  disabled={busy || !email.trim()}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {busy ? (
                    <><Loader size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending&hellip;</>
                  ) : (
                    "Continue"
                  )}
                </FormButton>

                <p
                  style={{
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    // Review Board Finding 6 (session 169) — sub-text 12 → 14.
                    // David: "Improve the readability of the text... esp on...
                    // 'We'll email you..' text." 12px was too quiet for the
                    // 40-65 demographic per the session-46 small-type sweep
                    // rule; 14 matches the wordmark sub-text bump (16 → 18)
                    // paired in this commit.
                    fontSize: 14,
                    color: v2.text.muted,
                    textAlign: "center",
                    lineHeight: 1.5,
                    margin: "2px 0 0",
                  }}
                >
                  We&rsquo;ll email you a sign-in link &mdash; no password needed.
                </p>
              </motion.div>
            )}

            {/* Code entry — after handleSend. */}
            {renderState === "form" && screen === "enter-code" && (
              <motion.div
                key="email-code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 0",
                    borderTop: `0.5px solid ${v2.border.light}`,
                    borderBottom: `0.5px solid ${v2.border.light}`,
                    marginBottom: 4,
                  }}
                >
                  <PiEnvelopeSimple size={14} style={{ color: v2.text.muted, flexShrink: 0 }} />
                  <span style={{ fontFamily: FONT_INTER, fontSize: 14, color: v2.text.muted, flexShrink: 0 }}>
                    Sent to&nbsp;
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_INTER,
                      fontSize: 14,
                      color: v2.text.primary,
                      fontWeight: 500,
                      wordBreak: "break-all",
                      minWidth: 0,
                    }}
                  >
                    {sentTo}
                  </span>
                </div>

                <FormField label="6-digit code" size="page">
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    placeholder="______"
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(digits);
                      setCodeError(null);
                      setResendNotice(null);
                      if (digits.length === 6 && !codeBusy) handleVerify(digits);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !codeBusy && code.length === 6) handleVerify(code);
                    }}
                    autoFocus
                    disabled={codeBusy}
                    style={{
                      ...formInputStyle("page"),
                      boxSizing: "border-box",
                      appearance: "none",
                      WebkitAppearance: "none",
                      fontSize: 28,
                      padding: "18px 14px",
                      textAlign: "center",
                      letterSpacing: "0.4em",
                      fontFamily: FONT_INTER,
                      opacity: codeBusy ? 0.6 : 1,
                      ...(codeError ? inputErrorOverride : null),
                    }}
                  />
                </FormField>

                {canPaste && (
                  <button
                    onClick={handlePasteCode}
                    disabled={codeBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: codeBusy ? "default" : "pointer",
                      fontFamily: FONT_CORMORANT,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: v2.text.muted,
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v2.text.muted,
                      textUnderlineOffset: 3,
                      textAlign: "center",
                      opacity: codeBusy ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <PiClipboard size={13} style={{ color: v2.accent.green }} />
                    Paste code from clipboard
                  </button>
                )}

                {codeError && <ErrorBanner message={codeError} />}

                {resendNotice && !codeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 9,
                      background: "rgba(42,26,10,0.03)",
                      border: `0.5px solid ${v2.border.light}`,
                      fontFamily: FONT_INTER,
                      fontSize: 12,
                      color: v2.text.secondary,
                      textAlign: "center",
                    }}
                  >
                    {resendNotice}
                  </motion.div>
                )}

                {codeBusy && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      fontFamily: FONT_CORMORANT,
                      fontStyle: "italic",
                      fontSize: 13,
                      color: v2.text.muted,
                    }}
                  >
                    <Loader size={12} style={{ animation: "spin 0.9s linear infinite" }} />
                    Verifying&hellip;
                  </div>
                )}

                <p
                  style={{
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    fontSize: 13,
                    color: v2.text.muted,
                    textAlign: "center",
                    lineHeight: 1.65,
                    margin: "10px 0 0",
                  }}
                >
                  Or tap the link we emailed you &mdash; either works.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 12,
                    fontFamily: FONT_INTER,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: v2.text.muted }}>Didn&rsquo;t get it?</span>
                  <button
                    onClick={handleResend}
                    disabled={resendIn > 0 || codeBusy}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: resendIn > 0 || codeBusy ? "default" : "pointer",
                      fontSize: 13,
                      color: resendIn > 0 ? v2.text.muted : v2.text.primary,
                      textDecoration: resendIn > 0 ? "none" : "underline",
                      textDecorationStyle: "dotted",
                      textDecorationColor: v2.text.muted,
                      textUnderlineOffset: 3,
                    }}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend link"}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Session 157 Review Board Login #2 — David: "Remove 'New here?...'
            text as this is already part of the triage process."
            Session-153 minimal footer link retires. /welcome already
            handles new-vendor + new-shopper disambiguation post-first-
            sign-in, and the /login screen ahead routes new vendors
            through that triage anyway — the redundant discoverability
            footer earned its retirement.

            Reverses session 153 Review Board Finding 11B's minimal-
            footer-as-vestigial-CTA per feedback_surface_locked_design_reversals.
            Session 153 reasoning was "preserve discoverability without
            visual real estate cost"; David's call now: the triage
            process below already provides discoverability, so even the
            minimal footer is redundant chrome. */}
      </div>

      {/* Sign-out — bottom of authed-cards screen */}
      {renderState === "authed-cards" && (
        <div style={{ flexShrink: 0, padding: "0 28px 18px", textAlign: "center" }}>
          <FormButton
            variant="link"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{ opacity: signingOut ? 0.5 : 1 }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </FormButton>
        </div>
      )}

      {/* Session 157 Review Board Login #1 — bottom Help footer retires;
          contact affordance moved to masthead-right PiQuestion icon
          (line above). BottomNav takes the bottom slot. */}

      {/* BottomNav — added to /login per Review Board Login #1. active=
          "profile" matches the Profile tab (which routes guests TO /login
          and authed users TO /me), so the highlight reflects where the
          user is in the BottomNav semantic flow. Padding-bottom on the
          form body wrapper above (centered flex column with flex:1) means
          BottomNav floats over content without overlapping inputs at
          typical viewport heights. */}
      <BottomNav active="profile" flaggedCount={0} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Authed-state action card. v2 vocabulary (post-it surface → surface.card;
// inline rgba green wash → accent.greenSoft solid; Cormorant + Inter;
// paper hairline → v2.border.light). Same structural shape as session 115
// (post-it surface + icon bubble + title + italic subtitle + chevron) —
// entire card is the action, no inner CTA pill.
function ActionCard({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        padding: "14px 14px",
        background: v2.surface.card,
        borderRadius: 14,
        border: `1px solid ${v2.border.light}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: v2.accent.greenSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: v2.accent.green,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontSize: 16,
              color: v2.text.primary,
              // 1.3 per feedback_lora_lineheight_minimum_for_clamp (extended
              // to Cormorant since session 143 Arc 6.1.2). Card titles can
              // wrap to 2 lines on narrow phones; descender clearance
              // matters for any vendor with g/j/p/y in the action label.
              lineHeight: 1.3,
              margin: "0 0 2px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: FONT_CORMORANT,
              fontStyle: "italic",
              // Review Board Finding 11B (session 153) — sub-text 12 → 14
              // on ActionCard. Matches the wordmark sub-text bump for
              // legibility consistency across all sub-text on /login.
              fontSize: 14,
              color: v2.text.muted,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        </div>
        <span
          style={{
            color: v2.text.muted,
            flexShrink: 0,
            fontSize: 22,
            lineHeight: 1,
            fontFamily: FONT_CORMORANT,
          }}
        >
          ›
        </span>
      </div>
    </a>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "11px 14px",
        borderRadius: 10,
        background: v2.surface.error,
        border: `1px solid ${v2.border.error}`,
        fontFamily: FONT_INTER,
        fontSize: 13,
        color: v2.accent.red,
        lineHeight: 1.5,
      }}
    >
      {message}
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
