// app/setup/page.tsx
// Vendor account setup — links authenticated user to pre-created vendor account(s).
//
// Session 35 (2026-04-20) — multi-booth rework.
//
// Changes from session-23 (v1.1k):
//   - Response shape: reads `data.vendors` array, not `data.vendor`. Handles
//     single-booth and multi-booth approval scenarios.
//   - Sets `treehouse_active_vendor_id` (via setActiveBoothId) to vendors[0].id
//     before the 3s redirect so /my-shelf and /post/preview land on the
//     correct booth immediately.
//   - Keeps LOCAL_VENDOR_KEY write for vendors[0] so legacy unauth paths on
//     /post/preview still function. Retire once all callers audited.
//   - Copy adapts to count: "Your booth at X is ready" for 1, "Your booths
//     at X are ready" for N>1, with a quiet FONT_INTER list of each booth.
//
// Preserved from session-23:
//   - Mode C centered-hero chrome
//   - Paper-wash success bubble, filled green "Go to my shelf" CTA
//   - 401 retry+backoff (session-10 polish for Supabase token replication lag)
//   - Error bubble red-retoned primitive + dotted-underline text-link recovery

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { getUser } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { safeStorage } from "@/lib/safeStorage";
import { setActiveBoothId } from "@/lib/activeBooth";
import { isReviewMode } from "@/lib/reviewMode";
import { FIXTURE_VENDORS } from "@/lib/fixtures";
import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";
import FormButton from "@/components/FormButton";
import type { Vendor, Mall } from "@/types/treehouse";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

type SetupState = "loading" | "linking" | "success" | "error";

interface SetupResult {
  vendors?: Vendor[];
  errorMessage?: string;
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function SetupContent() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>("loading");
  const [result, setResult] = useState<SetupResult>({});

  useEffect(() => {
    // Review Board (session 150) — render success state with fixture
    // vendor; skip auth + /api/setup/lookup-vendor + auto-redirect.
    if (isReviewMode()) {
      setResult({ vendors: [FIXTURE_VENDORS[0]] });
      setState("success");
      return;
    }
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

      // Session 35: new response shape is { ok, vendors: Vendor[], alreadyLinked? }
      const vendors = (json?.vendors ?? []) as Vendor[];
      if (!res.ok || !json.ok || vendors.length === 0) {
        setResult({
          errorMessage:
            json.error ||
            "We don't see an approved request for this email. Double-check with David.",
        });
        setState("error");
        return;
      }

      // Session 35: set the active booth ID to the oldest-approved vendor
      // (vendors[0] by the getVendorsByUserId created_at ASC contract) so
      // /my-shelf and /post/preview render against that booth by default.
      // Multi-booth vendors switch via the BoothPickerSheet.
      setActiveBoothId(vendors[0].id);

      // Keep LOCAL_VENDOR_KEY populated for the first vendor so legacy
      // unauth fallback paths (/post/preview localStorage branch) keep
      // working through the transition. Retire once every caller is
      // migrated to the active-booth resolver.
      const primary = vendors[0];
      const profile: LocalVendorProfile = {
        display_name: primary.display_name,
        booth_number: primary.booth_number || "",
        mall_id:      primary.mall_id,
        mall_name:    (primary.mall as Mall | undefined)?.name ?? "",
        mall_city:    (primary.mall as Mall | undefined)?.city ?? "",
        vendor_id:    primary.id,
        slug:         primary.slug,
        facebook_url: primary.facebook_url || undefined,
        user_id:      user.id,
      };
      safeStorage.setItem(LOCAL_VENDOR_KEY, JSON.stringify(profile));

      setResult({ vendors });
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

  // Success-state copy helpers — compose name/count-aware phrasing for the
  // subhead without branching the JSX in two places.
  const renderSuccessSubhead = (vendors: Vendor[]) => {
    if (vendors.length === 1) {
      const v = vendors[0];
      const mallName = v.mall?.name ?? "your location";
      return (
        <>
          Your booth at{" "}
          <span style={{ color: v2.text.primary, fontStyle: "normal" }}>
            {mallName}
          </span>{" "}
          is ready. The shelf is waiting to be filled.
        </>
      );
    }
    return (
      <>
        We linked <span style={{ color: v2.text.primary, fontStyle: "normal" }}>
          {vendors.length} booths
        </span>{" "}
        to your account. Switch between them on your shelf.
      </>
    );
  };

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
      {/* Error state shows a back arrow; loading/success don't */}
      {state === "error" && (
        <header style={{ padding: "max(18px, env(safe-area-inset-top, 18px)) 16px 14px" }}>
          <button
            onClick={handleGoToLogin}
            aria-label="Back to sign-in"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: v2.surface.warm,
              border: `1px solid ${v2.border.light}`,
              cursor: "pointer",
              padding: 0,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v2.text.primary }} />
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
                <Loader size={22} style={{ color: v2.text.primary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
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
                <Loader size={22} style={{ color: v2.text.primary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
              </PaperWashBubble>
              <h1 style={heroTitleStyle}>Setting things up&hellip;</h1>
              <p style={heroSubheadStyle}>Linking your booth to your account.</p>
            </motion.div>
          )}

          {/* Success state */}
          {state === "success" && result.vendors && result.vendors.length > 0 && (
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
                  <Check size={26} style={{ color: v2.text.primary }} strokeWidth={1.6} />
                </PaperWashBubble>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.32, ease: EASE }}
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontSize: 30,
                  color: v2.text.primary,
                  lineHeight: 1.2,
                  letterSpacing: "-0.005em",
                  margin: "0 0 14px",
                }}
              >
                {result.vendors.length === 1 ? "Welcome to your shelf." : "Welcome to your shelves."}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.32, ease: EASE }}
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: v2.text.secondary,
                  lineHeight: 1.65,
                  maxWidth: 320,
                  margin: "0 auto 8px",
                }}
              >
                {renderSuccessSubhead(result.vendors)}
              </motion.p>

              {/* Booth detail line — quiet, FONT_INTER.
                  Single-booth: "Display Name · Booth N"
                  Multi-booth: "Display1 · N1 · Display2 · N2" joined with middots */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.32 }}
                style={{
                  fontFamily: FONT_INTER,
                  fontSize: 13,
                  color: v2.text.muted,
                  margin: "0 0 24px",
                  maxWidth: 320,
                  lineHeight: 1.55,
                }}
              >
                {result.vendors.map((v, i) => (
                  <span key={v.id}>
                    {i > 0 && " · "}
                    {v.display_name}
                    {v.booth_number ? ` — Booth ${v.booth_number}` : ""}
                  </span>
                ))}
              </motion.p>

              {/* Auto-redirect notice */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48, duration: 0.32 }}
                style={{
                  fontFamily: FONT_INTER,
                  fontSize: 12,
                  color: v2.text.muted,
                  margin: "0 0 18px",
                }}
              >
                Redirecting to your shelf in 3 seconds&hellip;
              </motion.p>

              {/* Filled green CTA — commit action (vendor moves forward) */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56, duration: 0.32, ease: EASE }}
                style={{ display: "inline-block" }}
              >
                <FormButton
                  onClick={handleGoToMyBooth}
                  style={{
                    width: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Go to my shelf
                  <ArrowRight size={15} strokeWidth={1.8} />
                </FormButton>
              </motion.div>
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
                  background: v2.surface.error,
                  border: `0.5px solid ${v2.border.error}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 22,
                }}
              >
                <AlertCircle size={26} style={{ color: v2.accent.red }} strokeWidth={1.6} />
              </motion.div>

              <h1 style={{ ...heroTitleStyle, fontSize: 28 }}>
                Something didn&apos;t line up.
              </h1>

              <p
                style={{
                  fontFamily: FONT_CORMORANT,
                  fontStyle: "italic",
                  fontSize: 16,
                  color: v2.text.secondary,
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
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    fontSize: 16,
                    color: v2.text.primary,
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: v2.text.muted,
                    textUnderlineOffset: 4,
                    cursor: "pointer",
                  }}
                >
                  Try again
                </a>
                <a
                  onClick={handleGoToLogin}
                  style={{
                    fontFamily: FONT_CORMORANT,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: v2.text.muted,
                    textDecoration: "underline",
                    textDecorationStyle: "dotted",
                    textDecorationColor: v2.text.muted,
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
        // rgba(42,26,10,0.04) translucent paper-wash retires to solid v2
        // surface per session-132 frosted-glass/translucent-retire pattern
        // (extended at session 143 Arc 6.1.1 to WelcomeRow translucent
        // surfaces). v2.surface.warm preserves the subtle warmth against
        // body bg without translucent stacking.
        background: v2.surface.warm,
        border: `0.5px solid ${v2.border.light}`,
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
  fontFamily: FONT_CORMORANT,
  fontSize: 28,
  color: v2.text.primary,
  textAlign: "center",
  lineHeight: 1.2,
  letterSpacing: "-0.005em",
  margin: "0 0 8px",
};

const heroSubheadStyle: React.CSSProperties = {
  fontFamily: FONT_CORMORANT,
  fontStyle: "italic",
  fontSize: 15,
  color: v2.text.muted,
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
            background: v2.bg.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loader size={22} style={{ color: v2.text.primary, animation: "spin 0.9s linear infinite" }} strokeWidth={1.8} />
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
