// app/welcome/page.tsx
// Welcome — first-sign-in disambiguation card. Shape A from session 115.
//
// Shown when an authed user has neither a vendors row nor a shoppers row
// (detectUserRole returns "none"). Two paths:
//   "I have a booth"   → /vendor-request (auth email pre-filled — see Arc 3)
//   "Just exploring"   → /login/email/handle (creates shoppers row → /me)
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
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Store, HelpCircle } from "lucide-react";
import { getSession, detectUserRoleWithAutoClaim } from "@/lib/auth";
import { v1, FONT_LORA, FONT_SYS } from "@/lib/tokens";

type RenderState = "loading" | "ready";

function WelcomeInner() {
  const router = useRouter();
  const [renderState, setRenderState] = useState<RenderState>("loading");

  useEffect(() => {
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
      const role = await detectUserRoleWithAutoClaim(session.user);
      if (cancelled) return;
      if (role === "admin")   { router.replace("/");          return; }
      if (role === "vendor")  { router.replace("/my-shelf");  return; }
      if (role === "shopper") { router.replace("/me");        return; }
      setRenderState("ready");
    });
    return () => { cancelled = true; };
  }, []);

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
            WebkitTapHighlightColor: "transparent",
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
        <div
          style={{
            background: v1.postit,
            borderRadius: 14,
            border: `1px solid ${v1.inkHairline}`,
            padding: "24px 18px 18px",
          }}
        >
          <p
            style={{
              fontFamily: FONT_SYS,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: v1.green,
              textAlign: "center",
              margin: "0 0 6px",
            }}
          >
            Welcome
          </p>
          <h1
            style={{
              fontFamily: FONT_LORA,
              fontSize: 22,
              color: v1.inkPrimary,
              margin: "0 0 8px",
              textAlign: "center",
              lineHeight: 1.25,
              letterSpacing: "-0.005em",
            }}
          >
            Start your search
          </h1>
          <p
            style={{
              fontFamily: FONT_LORA,
              fontStyle: "italic",
              fontSize: 13,
              color: v1.inkMuted,
              textAlign: "center",
              lineHeight: 1.5,
              margin: "0 auto 18px",
              maxWidth: 280,
            }}
          >
            Choose a path &mdash; you can switch anytime.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <WelcomeRow
              title="I have a booth"
              subtitle="Share what's on your shelves."
              icon={<Store size={16} strokeWidth={1.7} />}
              onClick={() => router.push("/vendor-request")}
            />
            <WelcomeRow
              title="Just exploring"
              subtitle="Save your finds and come back to them."
              icon={<Bookmark size={16} strokeWidth={1.7} />}
              onClick={() => router.push("/login/email/handle")}
            />
          </div>
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

function WelcomeRow({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title:    string;
  subtitle: string;
  icon:     React.ReactNode;
  onClick:  () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.45)",
        borderRadius: 10,
        border: `1px solid ${v1.inkHairline}`,
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        textAlign: "left",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "rgba(30,77,43,0.08)",
          color: v1.green,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 14,
            color: v1.inkPrimary,
            lineHeight: 1.25,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 11.5,
            color: v1.inkMuted,
            lineHeight: 1.4,
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      </div>
      <span
        style={{
          color: v1.inkFaint,
          fontSize: 22,
          lineHeight: 1,
          fontFamily: FONT_LORA,
          flexShrink: 0,
        }}
      >
        ›
      </span>
    </button>
  );
}

export default function WelcomePage() {
  return <WelcomeInner />;
}
