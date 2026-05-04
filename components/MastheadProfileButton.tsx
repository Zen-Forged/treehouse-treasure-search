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
// Geometry matches BackButton on /find/[id] + /shelf/[slug] (44×44 bubble,
// rgba(42,26,10,0.06) background, icon centered) per David's session-109
// ask: "The icon size should be the same dimension and location as the
// back button."
//
// Glyph: Lucide CircleUser — the same icon used by the BottomNav Profile
// tab in sessions 90→108 (preserved for visual continuity across the
// relocation).
//
// Routes to /login (not /login/email) so triage cards still gate the
// authed-state branch from the unauthed sign-in branch.

"use client";

import { useRouter } from "next/navigation";
import { CircleUser } from "lucide-react";
import { v1 } from "@/lib/tokens";

export default function MastheadProfileButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/login")}
      aria-label="Open profile"
      style={{
        width:           44,
        height:          44,
        borderRadius:    "50%",
        background:      "rgba(42,26,10,0.06)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <CircleUser size={22} strokeWidth={1.8} style={{ color: v1.inkPrimary }} />
    </button>
  );
}
