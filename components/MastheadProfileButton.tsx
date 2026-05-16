// components/MastheadProfileButton.tsx
// Profile entry point — masthead left slot on root tab pages (Home / Map /
// Saved) per session 109 refinement.
//
// History — auth chrome has migrated three times:
//   - sessions ≤87:   sign-in/out text link in masthead right slot
//   - session 90:     relocated to BottomNav as a Profile tab (4-tab nav)
//   - session 109:    relocated again to masthead LEFT slot, BottomNav
//                     reduces to 3 tabs (Home / Map / Saved). The masthead
//                     left slot was previously empty on root tabs because
//                     there's no back-navigation target; placing Profile
//                     there mirrors the back-button geometry of detail
//                     pages and gives every page a consistent left affordance.
//
// Geometry MUST match the back button on /find/[id] + /shelf/[slug] exactly
// per David's session-109 ask: "The icon size should be the same dimension
// and location as the back button." Session-110 iPhone QA caught visual
// drift — earlier draft used inline `rgba(42,26,10,0.06)` (correct value
// but uncentralised) + strokeWidth 1.8 (vs back button's 1.6). Matching
// implementation exactly to the IconBubble pattern from app/find/[id]/page.tsx:
//
//   - 44×44 circle, padding 0, border none
//   - background: v1.iconBubble (the canonical token)
//   - transition: background 0.18s ease (matches IconBubble)
//   - color: v1.inkPrimary on the glyph
//   - icon size 22, strokeWidth 1.6 (matches ArrowLeft)
//
// Glyph: Lucide CircleUser — the same icon used by the BottomNav Profile
// tab in sessions 90→108 (preserved for visual continuity across the
// relocation).
//
// Routes to /login (not /login/email) so triage cards still gate the
// authed-state branch from the unauthed sign-in branch.
//
// R1 (session 111) — extended with optional `authedInitials` prop per
// design record D5 + D16. When present, the bubble swaps to v1.green
// fill with 2-char initials in v1.onGreen + routes to /me instead of
// /login. Geometry preserved exactly (44×44, same border-radius, same
// transition). Auth-state pickup itself is wired in R1 Arc 3 — Arc 2
// only ships the prop contract + visual treatment.
//
// Session 160 — David iPhone QA Finding 2 partial reversal of session 159
// Q3: admin reaches /admin DIRECTLY via the Profile button instead of
// bouncing through /me. Routing matrix:
//   - guest                  → /login   (CircleUser glyph)
//   - authed admin           → /admin   (CircleUser glyph OR initials if
//                                        admin also has shoppers row)
//   - authed vendor/shopper  → /me      (initials when shoppers row exists,
//                                        CircleUser glyph otherwise)
// Session 159 Q3 routed all-authed users to /me; admin reached /admin via
// a second tap in /me's role-aware links. David's call after iPhone QA:
// admins ARE the admin destination's primary occupant — direct routing
// preserves session 114's "rightmost = role-specialty when present" rule
// in spirit, just demotes admin's role-specialty from a BottomNav tab
// slot to the Profile-button destination instead.
//
// Initials rendering UNCHANGED — initials still render only when shoppers
// row exists (admin who claimed a handle still shows initials + green bg
// + tap routes /admin; admin without shoppers row shows CircleUser glyph
// + tap routes /admin). Geometry pulses on auth state are preserved
// per session 159's existing protection.

"use client";

import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";
import { v1, v2, FONT_SYS } from "@/lib/tokens";
import { useShopperAuth } from "@/lib/useShopperAuth";
import { useUserRole } from "@/lib/useUserRole";

interface MastheadProfileButtonProps {
  /**
   * R1 — when present, renders 2-char initials in v1.green circle and
   * routes to /me instead of /login. Caller is responsible for passing
   * the correct casing (uppercase) and length (2 chars).
   *
   * Session 159 — when ABSENT, MastheadProfileButton self-derives auth
   * state via useShopperAuth (David Q3 — Profile universal across all
   * pages without requiring each masthead consumer to thread auth
   * through). Behavior:
   *   - authed shopper → render initials, route to /me
   *   - authed non-shopper (vendor/admin without shoppers row) → render
   *     CircleUser glyph, route to /me (so /me's role-aware links pick
   *     up the next destination — /my-shelf for vendors, /admin for
   *     admins). Initials only render when a shoppers row exists.
   *   - guest → render CircleUser glyph, route to /login
   *
   * Explicit prop still wins when supplied — useful for Review Board
   * fixture renders where the auth hook should be bypassed.
   */
  authedInitials?: string;
  /**
   * Session 169 round 4 — visual variant for context-aware contrast.
   * Default = "default" (v1.iconBubble rgba(42,26,10,0.06)) when guest;
   * v1.green when initials. Reads well inside masthead chrome where
   * the bubble sits on a known cream bg.
   * "overlay" = solid v2.surface.warm + 1px v2.border.light when guest;
   * v1.green still wins for initials state. Used when the bubble
   * floats over varied/dark backgrounds (TabsChrome floating overlay
   * over HomeHero photo). Mirrors MastheadBackButton variant contract.
   * Review Board Finding 2 (session 169 round 4) — David: "No background
   * showing for profile icon on explore or saved page." v1.iconBubble
   * (rgba dark over dark hero photo) was invisible; overlay variant
   * restores solid bg for visibility against varied bg.
   */
  variant?: "default" | "overlay";
}

export default function MastheadProfileButton({
  authedInitials,
  variant = "default",
}: MastheadProfileButtonProps = {}) {
  const router       = useRouter();
  const auth         = useShopperAuth();
  const roleState    = useUserRole();
  // Explicit prop wins (Review Board fixture support); otherwise derive
  // from useShopperAuth. Initials only render when a shoppers row exists;
  // a signed-in vendor/admin with no shoppers row sees the glyph variant
  // but still routes to the role-appropriate destination via the branch
  // below.
  const effectiveInitials = authedInitials ?? auth.shopper?.initials ?? null;
  const isAuthed   = !!authedInitials || auth.isAuthed;
  // Session 160 — admin destination wins for authed admins; non-admin
  // authed users route /me unchanged; guests route /login unchanged.
  // roleState.isLoading races during initial mount; falling back to /me
  // for the brief loading window is safe because /me itself role-routes
  // forward (admins reach /admin via the in-page link). Final URL after
  // role resolves is /admin.
  const isAdmin    = roleState.role === "admin";
  const destination =
    !isAuthed    ? "/login"
    : isAdmin    ? "/admin"
    :              "/me";
  const ariaLabel  =
    !isAuthed    ? "Open profile"
    : isAdmin    ? "Open admin"
    :              "Open my account";

  return (
    <button
      type="button"
      onClick={() => router.push(destination)}
      aria-label={ariaLabel}
      style={{
        width:           44,
        height:          44,
        borderRadius:    "50%",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        // Session 159 — bg only swaps to v1.green when initials render
        // (authed shopper). Authed-without-shoppers-row + guest both show
        // the v1.iconBubble bubble with CircleUser glyph — geometry
        // unchanged across states so the masthead slot doesn't pulse on
        // auth-state hydration.
        // Session 169 round 3 — bg v2.surface.warm → v1.iconBubble per
        // Review Board Finding 4: "Update the profile icon bg to match
        // that of the back button bg on /find page and ensure consistency."
        // Matches MastheadBackButton + /find/[id] IconBubble exactly so
        // every masthead-slot bubble (back OR profile) reads identically.
        // Session 169 round 4 — variant="overlay" path uses solid
        // v2.surface.warm + border for visibility against varied bg
        // (TabsChrome floating over HomeHero hero photo).
        background:      effectiveInitials
          ? v1.green
          : variant === "overlay" ? v2.surface.warm : v1.iconBubble,
        border:          variant === "overlay" && !effectiveInitials
          ? `1px solid ${v2.border.light}`
          : "none",
        cursor:          "pointer",
        padding:         0,
        WebkitTapHighlightColor: "transparent",
        transition:      "background 0.18s ease",
      }}
    >
      {effectiveInitials ? (
        <span
          style={{
            fontFamily:    FONT_SYS,
            fontWeight:    600,
            fontSize:      15,
            letterSpacing: "0.02em",
            color:         v1.onGreen,
            lineHeight:    1,
          }}
        >
          {effectiveInitials}
        </span>
      ) : (
        <CircleUser size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
      )}
    </button>
  );
}
