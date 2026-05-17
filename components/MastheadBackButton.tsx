// components/MastheadBackButton.tsx
// Session 120 — masthead-left back button used by the (tabs) shared layout
// on every root tab EXCEPT Home. Profile entry stays at masthead-left on
// Home only (per David's call: "Profile icon only stays on the home page").
//
// Geometry matches <MastheadProfileButton> exactly so the masthead-left
// slot doesn't shift dimensions when you tab between Home and Saved/Map.
// Same iconBubble bg, same 44×44 circle, same 22px ArrowLeft at
// strokeWidth 1.6, same 0.18s transition.
//
// Behavior: prefers router.back() — matches iOS-native "go back" mental
// model. Falls back to a configurable path when there's no history (deep
// link / PWA shortcut launch directly into Saved or Map).
//
// Session 169 round 3 — Review Board Finding 3: bg v2.surface.warm +
// 1px v2.border.light → v1.iconBubble. Matches /find/[id]'s in-page
// IconBubble primitive exactly so back-button visual reads identically
// across every surface that uses this primitive.
//
// Session 178 F2 QA dial 2 — v1.iconBubble token value flipped from
// rgba(42,26,10,0.06) → #EFEBDF (solid). The `variant` prop retires
// in this same commit per feedback_dead_code_cleanup_as_byproduct
// ✅ Promoted — overlay variant existed only because the transparent
// default vanished against the HomeHero photo's darker areas (session
// 169 round 4 Review Board Finding 2). Solid #EFEBDF reads identically
// on cream chrome AND over the photo, eliminating the transparency-
// drift class that justified the variant. Single visual contract now.

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { v1 } from "@/lib/tokens";

interface MastheadBackButtonProps {
  /** Path to push when window.history is empty (deep links). Default "/". */
  fallback?: string;
  /**
   * When present, overrides the router.back() default. Same visual
   * contract — only the click handler changes. fallback is ignored when
   * onClick is provided. (Originally session 157 for the retired
   * MallMapDrawer close-on-tap path; the prop survives the drawer's
   * retirement as a generic override for any future consumer that
   * needs custom click behavior on the masthead-left slot.)
   */
  onClick?: () => void;
}

export default function MastheadBackButton({
  fallback = "/",
  onClick,
}: MastheadBackButtonProps = {}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      style={{
        width:           44,
        height:          44,
        borderRadius:    "50%",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      v1.iconBubble,
        border:          "none",
        cursor:          "pointer",
        padding:         0,
        WebkitTapHighlightColor: "transparent",
        transition:      "background 0.18s ease",
      }}
    >
      <ArrowLeft size={22} strokeWidth={1.6} style={{ color: v1.inkPrimary }} />
    </button>
  );
}
