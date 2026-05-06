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

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { v1 } from "@/lib/tokens";

interface MastheadBackButtonProps {
  /** Path to push when window.history is empty (deep links). Default "/". */
  fallback?: string;
}

export default function MastheadBackButton({
  fallback = "/",
}: MastheadBackButtonProps = {}) {
  const router = useRouter();

  const handleClick = () => {
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
