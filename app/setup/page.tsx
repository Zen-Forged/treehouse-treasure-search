// app/setup/page.tsx
// Vendor account setup page — links authenticated user to pre-created vendor account.
//
// FLOW:
//   1. User lands here from email link after admin approval
//   2. Must be signed in (redirects to magic link if not)
//   3. POST /api/setup/lookup-vendor — server-side: finds pending vendor_request
//      by email, locates matching unlinked vendor row, sets user_id, returns vendor
//   4. Save vendor profile to localStorage for immediate use
//   5. Success: show vendor info card + redirect to My Booth
//   6. Error: graceful fallback with retry and navigation options

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { getUser } from "@/lib/auth";
import { authFetch } from "@/lib/authFetch";
import { safeStorage } from "@/lib/safeStorage";
import type { Vendor } from "@/types/treehouse";
import { LOCAL_VENDOR_KEY, type LocalVendorProfile } from "@/types/treehouse";

const C = {
  bg:          "#f0ede6",
  surface:     "#e8e4db",
  surfaceDeep: "#dedad0",
  border:      "rgba(26,26,24,0.1)",
  textPrimary: "#1a1a18",
  textMid:     "#4a4a42",
  textMuted:   "#8a8478",
  textFaint:   "#b0aa9e",
  green:       "#1e4d2b",
  greenLight:  "rgba(30,77,43,0.07)",
  greenBorder: "rgba(30,77,43,0.18)",
  amber:       "#7a5c1e",
  amberBg:     "rgba(122,92,30,0.08)",
  amberBorder: "rgba(122,92,30,0.22)",
};

type SetupState = "loading" | "linking" | "success" | "error";

interface SetupResult {
  vendor?: Vendor;
  errorMessage?: string;
}

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

      // Check if user is authenticated
      const user = await getUser();
      if (!user?.email) {
        // Redirect to login with return URL
        router.push("/login?redirect=/setup");
        return;
      }

      setState("linking");

      // Session 10 — /setup 401 race polish:
      // Supabase's auth server takes ~500ms to make a just-issued OTP token
      // validatable from other servers. requireAuth() can 401 during that
      // replication window even though the token is valid client-side.
      // Retry once after 800ms on a 401 before surfacing the error state.
      // If the retry also 401s, we fall through to the existing error UI.
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

      // Server-side lookup + link in one call
      const res = await callLookupVendor();
      const json = await res.json();

      if (!res.ok || !json.ok || !json.vendor) {
        setResult({
          errorMessage: json.error || "Failed to set up vendor account."
        });
        setState("error");
        return;
      }

      const vendor = json.vendor as Vendor;

      // Save vendor profile to localStorage for immediate app use
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

      // Auto-redirect to My Booth after 3 seconds
      setTimeout(() => {
        router.push("/my-shelf");
      }, 3000);

    } catch (error) {
      console.error("[setup] setupVendorAccount error:", error);
      setResult({
        errorMessage: "An unexpected error occurred. Please try again."
      });
      setState("error");
    }
  };

  const handleRetry = () => {
    setupVendorAccount();
  };

  const handleGoToMyBooth = () => {
    router.push("/my-shelf");
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: C.bg,
      color: C.textPrimary,
    }}>
      <div style={{
        maxWidth: "500px",
        margin: "0 auto",
        padding: "80px 24px 40px",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "600",
            color: C.textPrimary,
            marginBottom: "12px",
            letterSpacing: "-0.01em",
          }}>
            Setting up your booth
          </h1>
          <p style={{
            fontSize: "16px",
            color: C.textMuted,
            lineHeight: "1.5",
          }}>
            We're connecting your account to your vendor profile
          </p>
        </div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: C.surface,
            borderRadius: "16px",
            padding: "32px",
            border: `1px solid ${C.border}`,
            marginBottom: "32px",
          }}
        >
          <AnimatePresence mode="wait">
            {state === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <Loader
                  size={48}
                  color={C.green}
                  style={{
                    marginBottom: "16px",
                    animation: "spin 1s linear infinite"
                  }}
                />
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  color: C.textPrimary,
                }}>
                  Finding your vendor account...
                </h2>
                <p style={{
                  color: C.textMuted,
                  fontSize: "15px",
                  lineHeight: "1.4"
                }}>
                  Please wait while we locate your booth information
                </p>
              </motion.div>
            )}

            {state === "linking" && (
              <motion.div
                key="linking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <Loader
                  size={48}
                  color={C.green}
                  style={{
                    marginBottom: "16px",
                    animation: "spin 1s linear infinite"
                  }}
                />
                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  color: C.textPrimary,
                }}>
                  Linking your account...
                </h2>
                <p style={{
                  color: C.textMuted,
                  fontSize: "15px",
                  lineHeight: "1.4"
                }}>
                  Almost done! Setting up your vendor permissions
                </p>
              </motion.div>
            )}

            {state === "success" && result.vendor && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  style={{
                    backgroundColor: C.greenLight,
                    borderRadius: "50%",
                    width: "64px",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    border: `2px solid ${C.greenBorder}`,
                  }}
                >
                  <Check size={32} color={C.green} />
                </motion.div>

                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  color: C.textPrimary,
                }}>
                  Welcome to Treehouse!
                </h2>

                <p style={{
                  color: C.textMuted,
                  fontSize: "15px",
                  marginBottom: "24px",
                  lineHeight: "1.4"
                }}>
                  Your vendor account is ready. Here's your booth info:
                </p>

                {/* Vendor Info Card */}
                <div style={{
                  backgroundColor: C.bg,
                  borderRadius: "12px",
                  padding: "20px",
                  textAlign: "left",
                  marginBottom: "24px",
                  border: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: C.textPrimary,
                    marginBottom: "8px",
                  }}>
                    {result.vendor.display_name}
                  </div>

                  {result.vendor.booth_number && (
                    <div style={{
                      fontSize: "14px",
                      color: C.textMid,
                      marginBottom: "4px",
                    }}>
                      Booth #{result.vendor.booth_number}
                    </div>
                  )}

                  <div style={{
                    fontSize: "14px",
                    color: C.textMuted,
                  }}>
                    {result.vendor.mall?.name}
                    {result.vendor.mall?.city && `, ${result.vendor.mall.city}`}
                  </div>
                </div>

                <p style={{
                  fontSize: "14px",
                  color: C.textMuted,
                  marginBottom: "20px",
                }}>
                  Redirecting to your booth in 3 seconds...
                </p>

                <button
                  onClick={handleGoToMyBooth}
                  style={{
                    backgroundColor: C.green,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Go to My Booth
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  style={{
                    backgroundColor: C.amberBg,
                    borderRadius: "50%",
                    width: "64px",
                    height: "64px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    border: `2px solid ${C.amberBorder}`,
                  }}
                >
                  <AlertCircle size={32} color={C.amber} />
                </motion.div>

                <h2 style={{
                  fontSize: "20px",
                  fontWeight: "500",
                  marginBottom: "8px",
                  color: C.textPrimary,
                }}>
                  Setup incomplete
                </h2>

                <p style={{
                  color: C.textMuted,
                  fontSize: "15px",
                  marginBottom: "20px",
                  lineHeight: "1.4"
                }}>
                  {result.errorMessage || "Something went wrong during setup."}
                </p>

                <div style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}>
                  <button
                    onClick={handleRetry}
                    style={{
                      backgroundColor: C.green,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <RefreshCw size={14} />
                    Try Again
                  </button>

                  <button
                    onClick={handleGoHome}
                    style={{
                      backgroundColor: "transparent",
                      color: C.textMid,
                      border: `1px solid ${C.border}`,
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                    }}
                  >
                    Go Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer help text */}
        {state !== "success" && (
          <div style={{
            textAlign: "center",
            fontSize: "14px",
            color: C.textFaint,
            lineHeight: "1.4",
          }}>
            Need help? Contact your mall admin or email support for assistance.
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        backgroundColor: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Loader size={32} color={C.green} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
