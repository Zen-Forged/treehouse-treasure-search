// app/login/email/handle/page.tsx
// R1 Arc 3 Commit B — handle-pick screen, second screen of the shopper
// claim flow per design record D7 (docs/r1-shopper-accounts-design.md).
//
// Reached two ways:
//   (1) magic-link round-trip: /login?confirmed=1&next=/login/email/handle
//       polls auth, then router.replace here.
//   (2) in-app code path: /login/email's pickDest sees role=shopper and
//       routes here after signInWithOtp succeeds.
//
// On mount:
//   - No session → redirect to /login (a guest can't claim).
//   - Session + shopper row already exists → redirect to /me (idempotent
//     re-entry; the user already claimed on a prior visit).
//   - Session + no shopper row → render the form.
//
// The handle input is auto-suggested from the email local-part per D8:
// strip non-alpha-numeric, collapse hyphens, trim. Falls back to
// scout-{4chars} if the local-part is too short or empty after cleaning.
//
// On submit, gathers localStorage saves + booth bookmarks via the
// existing helpers (lib/utils.ts) and POSTs to /api/shopper-claim along
// with the chosen handle. The endpoint runs the silent migration per
// D13 — no confirmation banner; just route to /me on success.

"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter }     from "next/navigation";
import { ArrowLeft }     from "lucide-react";

import { getSession }                       from "@/lib/auth";
import { authFetch }                        from "@/lib/authFetch";
import { supabase }                         from "@/lib/supabase";
import { loadFollowedIds, loadBookmarkedBoothIds } from "@/lib/utils";
import { v2, FONT_CORMORANT, FONT_INTER }    from "@/lib/tokens";
import FormField, { formInputStyle }        from "@/components/FormField";
import FormButton                           from "@/components/FormButton";

const HANDLE_RE = /^[a-z0-9-]{3,32}$/;

function suggestHandleFromEmail(email: string): string {
  const local = (email.split("@")[0] ?? "").toLowerCase();
  const cleaned = local
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (cleaned.length >= 3) return cleaned.slice(0, 32);
  const r = Math.random().toString(36).slice(2, 6);
  return `scout-${r}`;
}

type Screen = "checking" | "form";

function HandlePickInner() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("checking");
  const [handle, setHandle] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getSession();
      if (!session?.user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      // Idempotent re-entry: if the shopper row already exists, treat
      // this visit as a redirect to the destination.
      const { data: existing } = await supabase
        .from("shoppers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        router.replace("/me");
        return;
      }

      setHandle(suggestHandleFromEmail(session.user.email ?? ""));
      setScreen("form");
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function handleSubmit() {
    if (busy) return;
    const h = handle.trim().toLowerCase();
    if (!HANDLE_RE.test(h)) {
      setError("3–32 chars, lowercase letters, numbers, and hyphens only.");
      return;
    }
    setBusy(true);
    setError(null);

    const savedPostIds        = Array.from(loadFollowedIds());
    const bookmarkedVendorIds = Array.from(loadBookmarkedBoothIds());

    try {
      const res = await authFetch("/api/shopper-claim", {
        method: "POST",
        body: JSON.stringify({ handle: h, savedPostIds, bookmarkedVendorIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === "HANDLE_TAKEN") {
          setError("That handle is taken — please pick another.");
        } else {
          setError(data?.error ?? "Something went wrong. Try again.");
        }
        setBusy(false);
        return;
      }
      router.replace("/me");
    } catch (e) {
      console.error("[handle-pick] submit:", e);
      setError("Couldn't reach the server. Try again in a moment.");
      setBusy(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (screen === "checking") {
    // Hold a blank surface to avoid flashing the form against an authed
    // user mid-redirect to /me.
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: v2.bg.main,
          maxWidth:   430,
          margin:     "0 auto",
        }}
      />
    );
  }

  return (
    <div
      style={{
        minHeight:    "100dvh",
        background:   v2.bg.main,
        maxWidth:     430,
        margin:       "0 auto",
        display:      "flex",
        flexDirection:"column",
      }}
    >
      <header
        style={{
          padding:    "max(18px, env(safe-area-inset-top, 18px)) 16px 14px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Back"
          style={{
            width:        44,
            height:       44,
            borderRadius: "50%",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            background:   v2.surface.warm,
            border:       `1px solid ${v2.border.light}`,
            cursor:       "pointer",
            padding:      0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v2.text.primary }} />
        </button>
      </header>

      <div
        style={{
          flex:           1,
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "center",
          alignItems:     "center",
          padding:        "0 28px 8px",
          minHeight:      0,
        }}
      >
        <h1
          style={{
            fontFamily:    FONT_CORMORANT,
            fontSize:      28,
            color:         v2.text.primary,
            textAlign:     "center",
            // lineHeight 1.3 per feedback_lora_lineheight_minimum_for_clamp
            // (extended to Cormorant since session 143 Arc 6.1.2) — descender
            // clearance for any future longer handle prompts.
            lineHeight:    1.3,
            letterSpacing: "-0.005em",
            margin:        "0 0 8px",
          }}
        >
          Pick your handle
        </h1>
        <p
          style={{
            fontFamily:  FONT_CORMORANT,
            fontStyle:   "italic",
            fontSize:    15,
            color:       v2.text.muted,
            textAlign:   "center",
            lineHeight:  1.55,
            margin:      "0 auto 28px",
            maxWidth:    300,
          }}
        >
          This is how Treehouse remembers you across devices.
        </p>

        <div style={{ width: "100%", maxWidth: 340 }}>
          <FormField label="Handle" size="page" htmlFor="r1-handle">
            <input
              id="r1-handle"
              type="text"
              value={handle}
              onChange={e => { setHandle(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && !busy && handleSubmit()}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              maxLength={32}
              placeholder="treehouse-scout"
              style={formInputStyle("page")}
            />
          </FormField>

          {error && (
            <p
              role="alert"
              style={{
                fontFamily: FONT_CORMORANT,
                fontStyle:  "italic",
                fontSize:   13,
                color:      v2.accent.red,
                lineHeight: 1.5,
                margin:     "-4px 0 12px",
              }}
            >
              {error}
            </p>
          )}

          <FormButton
            onClick={handleSubmit}
            disabled={busy || !handle.trim()}
          >
            {busy ? "Saving…" : "Save and continue"}
          </FormButton>

          <p
            style={{
              fontFamily:    FONT_INTER,
              fontSize:      12,
              // v1.inkFaint maps to v2.text.muted — v2 namespace has no
              // faint-tier; muted is the lightest text color in v2.
              color:         v2.text.muted,
              textAlign:     "center",
              lineHeight:    1.5,
              margin:        "16px auto 0",
              maxWidth:      300,
            }}
          >
            Lowercase letters, numbers, and hyphens · 3–32 characters
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HandlePickPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight:  "100dvh",
            background: v2.bg.main,
            maxWidth:   430,
            margin:     "0 auto",
          }}
        />
      }
    >
      <HandlePickInner />
    </Suspense>
  );
}
