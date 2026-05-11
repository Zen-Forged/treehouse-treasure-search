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

"use client";

import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";
import { v1, v2, FONT_SYS } from "@/lib/tokens";

interface MastheadProfileButtonProps {
  /**
   * R1 — when present, renders 2-char initials in v1.green circle and
   * routes to /me instead of /login. Caller is responsible for passing
   * the correct casing (uppercase) and length (2 chars). When absent,
   * renders the guest CircleUser glyph + routes to /login (default).
   */
  authedInitials?: string;
}

export default function MastheadProfileButton({
  authedInitials,
}: MastheadProfileButtonProps = {}) {
  const router  = useRouter();
  const isAuthed = !!authedInitials;

  return (
    <button
      type="button"
      onClick={() => router.push(isAuthed ? "/me" : "/login")}
      aria-label={isAuthed ? "Open my account" : "Open profile"}
      style={{
        width:           44,
        height:          44,
        borderRadius:    "50%",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      isAuthed ? v1.green : v2.surface.warm,
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        WebkitTapHighlightColor: "transparent",
        transition:      "background 0.18s ease",
      }}
    >
      {isAuthed ? (
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
          {authedInitials}
        </span>
      ) : (
        <CircleUser size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
      )}
    </button>
  );
}
