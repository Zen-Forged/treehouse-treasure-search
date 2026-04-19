// app/setup/page.tsx
// Vendor account setup — links authenticated user to pre-created vendor account.
// Rewritten session 23 against docs/design-system.md v1.1k.
//
// Changes from v0.2:
//  - Mode C centered-hero chrome throughout (no card, no surface wrapper)
//  - v1 palette (paperCream bg, v1 ink scale, inkHairline borders)
//  - IM Fell English for headlines + subheads; FONT_SYS for the mall name woven into subhead
//  - Paper-wash success bubble primitive (60px, inkPrimary glyph, no green tint)
//  - Error bubble retones the same primitive with redBg/redBorder (the alert glyph carries the warning)
//  - Filled green CTA only on "Go to my shelf" (commit action — vendor moves forward)
//  - Error actions retire filled green → IM Fell italic dotted-underline links
//  - Amber state chrome retired entirely
//
// Design-system doc notes that the vendor's first name from vendor_requests.name is NOT
// available at this point — lookup-vendor returns the linked Vendor (display_name = booth
// name, e.g. "ZenForged Finds"). Success headline is "Welcome to your shelf." without a
// name, and the mall name woven into the subhead carries the personalization.
//
// FLOW (preserved):
//   1. Land here from email link after admin approval
//   2. Must be signed in (redirects to /login?redirect=/setup)
//   3. POST /api/setup/lookup-vendor (with 401 retry+backoff per session 10 polish)
//   4. Save LocalVendorProfile to safeStorage
//   5. Success → show vendor info + "Go to my shelf" CTA + auto-redirect at 3s
//   6. Error → gentle copy + two text links

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader, ArrowRight, AlertCircle } from "lucide-react";
import { getUser } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { safeStorage } from "@/lib/safeStorage";
import { v1, FONT_IM_FELL, FONT_SYS } from "@/lib/tokens";
import type { Vendor } from "@/types/treehouse";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

type SetupState = "loading" | "linking" | "success" | "error";

interface SetupResult {
  vendor?: Vendor;
  errorMessage?: string;
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function SetupContent() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>("loading");
  const [result, setResult] = useState<SetupResult>({});

  useEffect(() => {
    setupVendorAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupVendorAccount = async () => {
    try {
      setState("loading");

      const user = await getUser();
      if (!user?.email) {
        router.push("/login?redirect=/setup");
        return;
      }

      setState("linking");

      // Session 10 /setup 401 race polish: retry once after 800ms on 401.
      const callLookupVendor = async (): Promise<Response> => {
        const first = await authFetch("/api/setup/lookup-vendor", {
          method: "POST",
          body: JSON.stringify({}),
        });
        if (first.status !== 401) return first;
        await new Promise(r => setTimeout(r, 800));
        return authFetch("/api/setup/lookup-vendor", {
          method: "POST",
          body: JSON.stringify({}),
        });
      };

      const res = await callLookupVendor();
      const json = await res.json();

      if (!res.ok || !json.ok || !json.vendor) {
        setResult({
          errorMessage:
            json.error ||
            "We don't see an approved request for this email. Double-check with David.",
        });
        setState("error");
        return;
      }

      const vendor = json.vendor as Vendor;

      const profile: LocalVendorProfile = {
        display_name: vendor.display_name,
        booth_number: vendor.booth_number || "",
        mall_id: vendor.mall_id,
        mall_name: vendor.mall?.name || "",
        mall_city: vendor.mall?.city || "",
        vendor_id: vendor.id,
        slug: vendor.slug,
        facebook_url: vendor.facebook_url || undefined,
        user_id: user.id,
      };
      safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(profile));

      setResult({ vendor });
      setState("success");

      // Auto-redirect to /my-shelf after 3 seconds (preserved from v0.2)
      setTimeout(() => {
        router.push("/my-shelf");
      }, 3000);

    } catch (error) {
      console.error("[setup] setupVendorAccount error:", error);
      setResult({
        errorMessage: "An unexpected error occurred. Please try again.",
      });
      setState("error");
    }
  };

  const handleRetry = () => setupVendorAccount();
  const handleGoToMyBooth = () => router.push("/my-shelf");
  const handleGoToLogin = () => router.push("/login");

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
      {/* Error state shows a back arrow; loading/success don't */}
      {state === "error" && (
        <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px" }}>
          <button
            onClick={handleGoToLogin}
            aria-label="Back to sign-in"
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
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={v1.inkPrimary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        </header>
      )}

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
        <AnimatePresence mode="wait">

          {/* Loading state (brief — auth check) */}
          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <PaperWashBubble>
                <Loader size={22} style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
              </PaperWashBubble>
              <h1 style={heroTitleStyle}>Just a moment&hellip;</h1>
              <p style={heroSubheadStyle}>Checking your sign-in.</p>
            </motion.div>
          )}

          {/* Linking state */}
          {state === "linking" && (
            <motion.div
              key="linking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <PaperWashBubble>
                <Loader size={22} style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
              </PaperWashBubble>
              <h1 style={heroTitleStyle}>Setting things up&hellip;</h1>
              <p style={heroSubheadStyle}>Linking your booth to your account.</p>
            </motion.div>
          )}

          {/* Success state */}
          {state === "success" && result.vendor && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <PaperWashBubble>
                  <Check size={26} style={{ color: v1.inkPrimary }} strokeWidth={1.6} />
                </PaperWashBubble>
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
                Welcome to your shelf.
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
                  margin: "0 auto 8px",
                }}
              >
                Your booth at{" "}
                <span
                  style={{
                    color: v1.inkPrimary,
                    fontStyle: "normal",
                  }}
                >
                  {result.vendor.mall?.name ?? "your mall"}
                </span>{" "}
                is ready. The shelf is waiting to be filled.
              </motion.p>

              {/* Booth detail line — quiet, FONT_SYS */}
              {result.vendor.booth_number && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.38, duration: 0.32 }}
                  style={{
                    fontFamily: FONT_SYS,
                    fontSize: 13,
                    color: v1.inkMuted,
                    margin: "0 0 24px",
                  }}
                >
                  {result.vendor.display_name} &nbsp;·&nbsp; Booth {result.vendor.booth_number}
                </motion.p>
              )}

              {/* Auto-redirect notice */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48, duration: 0.32 }}
                style={{
                  fontFamily: FONT_SYS,
                  fontSize: 12,
                  color: v1.inkFaint,
                  margin: "0 0 18px",
                }}
              >
                Redirecting to your shelf in 3 seconds&hellip;
              </motion.p>

              {/* Filled green CTA — commit action (vendor moves forward) */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56, duration: 0.32, ease: EASE }}
                onClick={handleGoToMyBooth}
                style={{
                  padding: "14px 22px",
                  borderRadius: 14,
                  fontFamily: FONT_SYS,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#fff",
                  background: v1.green,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 14px rgba(30,77,43,0.22)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Go to my shelf
                <ArrowRight size={15} strokeWidth={1.8} />
              </motion.button>
            </motion.div>
          )}

          {/* Error state */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {/* Error bubble — same primitive, red-retoned */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: v1.redBg,
                  border: `0.5px solid ${v1.redBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 22,
                }}
              >
                <AlertCircle size={26} style={{ color: v1.red }} strokeWidth={1.6} />
              </motion.div>

              <h1 style={{ ...heroTitleStyle, fontSize: 28 }}>
                Something didn&apos;t line up.
              </h1>

              <p
                style={{
                  fontFamily: FONT_IM_FELL,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: v1.inkMid,
                  lineHeight: 1.65,
                  maxWidth: 320,
                  margin: "0 auto 32px",
                }}
              >
                {result.errorMessage ||
                  "We don't see an approved request for this email. Double-check with David."}
              </p>

              {/* Error actions — text links only */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  alignItems: "center",
                }}
              >
                <a
                  onClick={handleRetry}
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
                  Try again
                </a>
                <a
                  onClick={handleGoToLogin}
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
                  Back to sign-in
                </a>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function PaperWashBubble({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

const heroTitleStyle: React.CSSProperties = {
  fontFamily: FONT_IM_FELL,
  fontSize: 28,
  color: v1.inkPrimary,
  textAlign: "center",
  lineHeight: 1.2,
  letterSpacing: "-0.005em",
  margin: "0 0 8px",
};

const heroSubheadStyle: React.CSSProperties = {
  fontFamily: FONT_IM_FELL,
  fontStyle: "italic",
  fontSize: 15,
  color: v1.inkMuted,
  textAlign: "center",
  lineHeight: 1.55,
  margin: "0 auto",
  maxWidth: 300,
};

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100dvh",
            background: v1.paperCream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader size={22} style={{ color: v1.inkPrimary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
