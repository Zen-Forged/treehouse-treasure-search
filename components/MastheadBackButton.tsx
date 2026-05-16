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
// 1px v2.border.light → v1.iconBubble (rgba(42,26,10,0.06)) + no border.
// Matches /find/[id]'s in-page IconBubble primitive exactly so back-
// button visual reads identically across every surface that uses this
// primitive. Sub-pattern of the "single primitive becomes the single
// source of truth" promotion — `lib/MastheadBackButton.tsx` now mirrors
// the /find IconBubble visual contract. Companion inline back-button
// sweep on 14 v2 user-facing surfaces in the same commit.

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { v1, v2 } from "@/lib/tokens";

interface MastheadBackButtonProps {
  /** Path to push when window.history is empty (deep links). Default "/". */
  fallback?: string;
  /**
   * Session 157 — when present, overrides the router.back() default.
   * Used by the (tabs) layout to close the map drawer (state lives in
   * useMapDrawer context) instead of navigating browser history when the
   * drawer is open on Home. Same visual contract — only the click handler
   * changes. fallback is ignored when onClick is provided.
   */
  onClick?: () => void;
  /**
   * Session 169 round 4 — visual variant for context-aware contrast.
   * Default = "default" (v1.iconBubble rgba(42,26,10,0.06)). Reads well
   * inside masthead chrome where the bubble lives on a known cream bg
   * (v2.bg.main OR v2.surface.warm — both have decent contrast against
   * the rgba dark tint).
   * "overlay" = solid v2.surface.warm bg + 1px v2.border.light border.
   * Used when the bubble floats over varied/dark backgrounds (TabsChrome
   * floating overlays over HomeHero photo). Pre-Round-3 visual; restored
   * here as overlay-only contract since Round-3 unification flipped the
   * default to v1.iconBubble for masthead-slot consistency.
   */
  variant?: "default" | "overlay";
}

export default function MastheadBackButton({
  fallback = "/",
  onClick,
  variant = "default",
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
        background:      variant === "overlay" ? v2.surface.warm : v1.iconBubble,
        border:          variant === "overlay" ? `1px solid ${v2.border.light}` : "none",
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
