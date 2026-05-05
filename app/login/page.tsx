// app/login/page.tsx
// Login triage — Screen 1 of the two-screen split shipped session 93.
//
// Routing model:
//   /login          = this page. Triage cards (returning vendor vs new vendor)
//                     + magic-link callback bridge (?confirmed=1).
//   /login/email    = the OTP form (extracted to its own route this session).
//
// Why split: a single /login that asked for an email regardless of state was
// invisible to people who had never created an account. The magic-link path
// would still authenticate them (Supabase creates an auth.users row on verify),
// but they'd land on /my-shelf with no booth attached and no way back. The
// triage layer surfaces "create a vendor account" as a peer of "sign in" so
// the right path is reachable without typing.
//
// What lives here:
//   • Triage cards (Frame 2 of login-triage-v2 mockup — wordmark only +
//     subtitle, two cards, "Just shopping?" disambiguation line for non-vendors,
//     "Need help? Contact us" footer)
//   • Magic-link callback bridge — when ?confirmed=1 lands here from the email
//     round trip, we render the polling UI in place of the cards (path a from
//     the session 93 scoping decision: callback URL stays at /login, no changes
//     to lib/auth.ts or email templates needed)
//   • Auto-forwarding for "already known" states:
//       - Authed users hitting /login → /login/email (form + sign-out below).
//         Matches the session-90 sign-out flow; preserves the intent of
//         BottomNav Profile-tap-when-authed surfacing the sign-out affordance.
//       - Guests hitting /login with ?redirect= or ?next= (approval-email
//         link, /my-shelf re-auth bounce) → /login/email?redirect=... so the
//         picker doesn't get in the way of a known returning user.
//
// What R1 (shopper accounts) will change here when it ships:
//   • Subtitle generalizes (not vendor-specific copy).
//   • A third "I'm shopping" card joins the existing two.
//   • The "Just shopping?" guest line retires (replaced by the third card).
//   • Screen 2's "Vendor Sign in" title generalizes to "Sign in".
// All of that is contained to this file + /login/email/page.tsx — the routing
// shape doesn't have to change.

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader, CircleUser, Store, HelpCircle, Bookmark } from "lucide-react";
import { getSession, onAuthChange, isAdmin } from "@/lib/auth";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";
import type { User } from "@supabase/supabase-js";
import type { ReadonlyURLSearchParams } from "next/navigation";

const AUTH_CHANNEL = "treehouse_auth";

type RenderState = "loading" | "triage" | "confirming";

function safeRedirect(next: string | null, fallback = "/my-shelf"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}

function pickDest(user: User | null, searchParams: ReadonlyURLSearchParams): string {
  const explicit = searchParams.get("redirect") ?? searchParams.get("next");
  if (explicit) return safeRedirect(explicit);
  // R1 — shopper claim flow. The magic-link round-trip carries the
  // /login/email/handle target via `next`; this `role` branch covers the
  // edge case where /login is reached directly with role=shopper.
  if (searchParams.get("role") === "shopper") return "/login/email/handle";
  return user && isAdmin(user) ? "/" : "/my-shelf";
}

function LoginTriageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const confirmed         = searchParams.get("confirmed") === "1";
  const explicitRedirect  = searchParams.get("redirect") ?? searchParams.get("next");

  // Render state machine. Initial value depends on URL params; the effect
  // resolves the rest.
  //   "confirming" — magic-link round-trip polling (only when ?confirmed=1)
  //   "loading"    — auth state hasn't been queried yet, hold a blank surface
  //                  to avoid flashing triage cards at an authed user mid-redirect
  //   "triage"     — render the cards
  const [renderState, setRenderState] = useState<RenderState>(
    confirmed ? "confirming" : "loading"
  );

  useEffect(() => {
    // Magic-link callback path. Existing /login behavior preserved here so
    // lib/auth.ts (emailRedirectTo = /login?confirmed=1&next=...) doesn't
    // need to change.
    if (confirmed) {
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
          router.replace(pickDest(session.user, searchParams));
        } else if (attempts > 20) {
          clearInterval(interval);
          // Fall through to triage rather than throwing an error page —
          // user can re-tap "Sign in" and re-enter their email.
          setRenderState("triage");
        }
      }, 500);
      return () => clearInterval(interval);
    }

    // For all other states we forward to /login/email when appropriate so
    // the triage cards only show to genuinely-fresh visitors. Two cases:
    //   1) An explicit ?redirect= or ?next= param means a known returning
    //      flow (approval email, deep-link, /my-shelf bounce). Skip the
    //      picker — go straight to the form, preserving the redirect.
    //   2) An already-authed user landing here directly (BottomNav Profile
    //      tap when signed in). Per Q2(a) on the session-93 mockup, skip
    //      triage, go to the form so they can sign out below it.
    if (explicitRedirect) {
      router.replace(`/login/email?redirect=${encodeURIComponent(explicitRedirect)}`);
      return;
    }

    let cancelled = false;
    getSession().then(s => {
      if (cancelled) return;
      if (s?.user) router.replace("/login/email");
      else setRenderState("triage");
    });

    const unsub = onAuthChange(user => {
      if (user) router.replace("/login/email");
    });

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(AUTH_CHANNEL);
      bc.onmessage = (e) => {
        if (e.data?.type === "signed_in") {
          getSession().then(s => { if (s?.user) router.replace(pickDest(s.user, searchParams)); });
        }
      };
    } catch {}

    return () => {
      cancelled = true;
      unsub();
      try { bc?.close(); } catch {}
    };
  }, []);

  if (renderState === "confirming") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
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
            border: `0.5px solid ${v1.inkHairline}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Loader size={22} style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
        </div>
        <h1
          style={{
            fontFamily: FONT_LORA,
            fontSize: 28,
            color: v1.inkPrimary,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            margin: "0 0 8px",
          }}
        >
          Signing you in&hellip;
        </h1>
        <p
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 15,
            color: v1.inkMuted,
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

  if (renderState === "loading") {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v1.paperCream,
          maxWidth: 430,
          margin: "0 auto",
        }}
      />
    );
  }

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
      <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px", flexShrink: 0 }}>
        <button
          onClick={() => router.push("/")}
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
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 24px 8px",
          minHeight: 0,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 14,
              color: v1.inkMuted,
              lineHeight: 1.55,
              margin: "0 auto",
              maxWidth: 290,
            }}
          >
            Manage your booth or sync your finds across devices.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TriageCard
            href="/login/email"
            title="I already have an account"
            subtitle="Sign in to access and manage your digital booth."
            icon={<CircleUser size={20} strokeWidth={1.6} />}
            cta="Sign in"
            ctaVariant="filled"
          />
          <TriageCard
            href="/vendor-request"
            title="I'm new to Treehouse Finds"
            subtitle="Create your vendor account and set up your digital booth."
            icon={<Store size={20} strokeWidth={1.6} />}
            cta="Create Vendor Account"
            ctaVariant="outline"
          />
          {/* R1 — shopper claim entry point. role=shopper threads through
              /login/email so the post-OTP redirect routes to the handle
              picker instead of /my-shelf. Returning shoppers (handle
              already exists) are bounced to /me by the handle page. */}
          <TriageCard
            href="/login/email?role=shopper"
            title="I'm shopping"
            subtitle="Sync your saved finds across devices."
            icon={<Bookmark size={20} strokeWidth={1.6} />}
            cta="Sign in as a shopper"
            ctaVariant="outline"
          />
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "22px 0 26px", textAlign: "center" }}>
        <Link
          href="/contact"
          style={{
            fontFamily: FONT_LORA,
            fontSize: 13,
            color: v1.inkPrimary,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <HelpCircle size={16} strokeWidth={1.6} style={{ color: v1.inkMuted }} />
          <span
            style={{
              textDecoration: "underline",
              textDecorationStyle: "dotted",
              textDecorationColor: v1.inkFaint,
              textUnderlineOffset: 3,
            }}
          >
            Need help? Contact us
          </span>
        </Link>
      </div>
    </div>
  );
}

function TriageCard({
  href,
  title,
  subtitle,
  icon,
  cta,
  ctaVariant,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  cta: string;
  ctaVariant: "filled" | "outline";
}) {
  const ctaStyle: React.CSSProperties = ctaVariant === "filled"
    ? {
        color: "#fff",
        background: v1.green,
        boxShadow: "0 2px 12px rgba(30,77,43,0.20)",
        border: "none",
      }
    : {
        color: v1.inkPrimary,
        background: "transparent",
        border: `1px solid ${v1.inkHairline}`,
        boxShadow: "none",
      };

  return (
    <Link
      href={href}
      style={{
        display: "block",
        textDecoration: "none",
        padding: "16px 16px 14px",
        background: v1.postit,
        borderRadius: 14,
        border: `1px solid ${v1.inkHairline}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(30,77,43,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: v1.green,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontSize: 16,
              color: v1.inkPrimary,
              lineHeight: 1.25,
              margin: "0 0 3px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 12,
              color: v1.inkMuted,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </div>
        </div>
        <span style={{ color: v1.inkFaint, flexShrink: 0, fontSize: 22, lineHeight: 1, fontFamily: FONT_LORA }}>
          ›
        </span>
      </div>
      <div
        style={{
          marginTop: 12,
          width: "100%",
          padding: 12,
          borderRadius: 12,
          fontFamily: FONT_SYS,
          fontSize: 14,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          ...ctaStyle,
        }}
      >
        {cta}
      </div>
    </Link>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginTriageInner />
    </Suspense>
  );
}
