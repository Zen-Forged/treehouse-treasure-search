// app/welcome/page.tsx
// Welcome — first-sign-in disambiguation card. Shape A from session 115.
//
// Session 143 — v2 visual migration Arc 6.1: typography (FONT_LORA →
// FONT_CORMORANT + FONT_SYS → FONT_INTER) + palette (v1.* → v2.*) + page
// bg → v2.bg.main + WelcomeRow translucent surfaces → solid v2 surfaces.
// Card structure + flow preserved verbatim from session 115 Shape A.
//
// Shown when an authed user has neither a vendors row nor a shoppers row
// (detectUserRole returns "none"). Two paths:
//   "I have a booth"   → /vendor-request (auth email pre-filled — see Arc 3)
//   "Just exploring"   → /me (useShopperAuth silent auto-claim creates the
//                        shoppers row + migrates localStorage saves+bookmarks
//                        per session 184 handle retirement)
//
// Subsequent sign-ins skip this page via detectUserRole since one of the
// two rows will exist by then. A "none" user who taps back / dismisses
// without picking will land on /welcome again the next time they sign in
// or hit a routing point — which is intentional. They need to pick a
// path eventually for the app to be useful to them.
//
// Auth posture:
//   - !authed                           → redirect to /login
//   - authed + admin                    → redirect to /
//   - authed + vendor                   → redirect to /my-shelf
//   - authed + shopper                  → redirect to /me
//   - authed + none (no rows)           → render the welcome card

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PiStorefrontBold, PiBookmarkSimpleBold, PiQuestion } from "react-icons/pi";
import { getSession, detectUserRoleWithAutoClaim } from "@/lib/auth";
import { isReviewMode } from "@/lib/reviewMode";
import ActionCard from "@/components/ActionCard";
import { v1, v2, FONT_CORMORANT } from "@/lib/tokens";

type RenderState = "loading" | "ready";

function WelcomeInner() {
  const router = useRouter();
  const [renderState, setRenderState] = useState<RenderState>("loading");

  useEffect(() => {
    // Review Board (session 150) — render the disambiguation card screen
    // without auth detection or role-based redirect.
    if (isReviewMode()) {
      setRenderState("ready");
      return;
    }
    let cancelled = false;
    getSession().then(async session => {
      if (cancelled) return;
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      // Auto-claim variant — defensive against direct nav to /welcome
      // by an approved-but-unlinked vendor (e.g. a session restored from
      // PWA cold-start before they ever hit /login). Same self-heal.
      //
      // Session 195 — also handle "pending_vendor": a vendor whose
      // /vendor-request is still pending admin approval should land on
      // the existing DoneScreen "already_pending" state, not see
      // /welcome's "Just exploring vs Set up booth" disambiguation
      // (which invited a duplicate vendor-request submission).
      const role = await detectUserRoleWithAutoClaim(session.user);
      if (cancelled) return;
      if (role === "admin")          { router.replace("/");                          return; }
      if (role === "vendor")         { router.replace("/my-shelf");                  return; }
      if (role === "pending_vendor") { router.replace("/vendor-request?state=pending"); return; }
      if (role === "shopper")        { router.replace("/me");                        return; }
      setRenderState("ready");
    });
    return () => { cancelled = true; };
  }, []);

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
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
        </button>

        {/* Help affordance — mirrors /login's header (session 157): icon-only
            PiQuestion link in a 44×44 bubble matching the back button
            geometry. Replaces the session-115 footer "Need help? Contact us"
            link so /welcome's header reads identically to /login's. */}
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
            textDecoration: "none",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <PiQuestion size={22} style={{ color: v1.inkPrimary }} />
        </Link>
      </header>

      {/* Top-anchored brand lockup + path cards — matches /login exactly
          (session 200, David: redesign /welcome to "feel more integrated
          and substantial ... first point of entry for a vendor"). Replaces
          session-115's small vertically-centered card-in-card. The wordmark
          carries the brand "welcome"; the two paths are shared <ActionCard>s
          (same component /login's authed cards use). */}
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
              fontSize: 20,
              fontWeight: 500,
              color: v2.text.secondary,
              lineHeight: 1.55,
              margin: "0 auto",
              maxWidth: 290,
            }}
          >
            Choose a path &mdash; you can switch anytime.
          </p>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 360,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <ActionCard
            title="I have a booth"
            subtitle="Share what's on your shelves."
            icon={<PiStorefrontBold size={20} />}
            onClick={() => router.push("/vendor-request")}
          />
          <ActionCard
            title="Just exploring"
            subtitle="Save your finds and come back to them."
            icon={<PiBookmarkSimpleBold size={20} />}
            onClick={() => router.push("/me")}
          />
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return <WelcomeInner />;
}
