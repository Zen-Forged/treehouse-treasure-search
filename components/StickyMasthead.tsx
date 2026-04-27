// components/StickyMasthead.tsx
// Shared sticky masthead chrome — session 70 lock pass
// (docs/masthead-lock-design.md).
//
// Visual stability with affordances. Single `1fr auto 1fr` inner grid across
// every page that renders this component. The wordmark sits in the auto
// middle column and is always visually centered between two equal 1fr
// columns regardless of left/right slot content. Both side slots reserve
// `min-width: 80px` so an empty slot reserves the same column width as the
// heaviest case (multi-bubble on /shelf/[slug]) — the wordmark cannot drift.
//
// Usage:
//
//   <StickyMasthead />                          // empty left + right (root tabs)
//   <StickyMasthead left={<BackButton />} />    // detail/leaf pages
//   <StickyMasthead right={<SignOutLink />} />
//   <StickyMasthead
//     left={<BackButton />}
//     right={<><FlagBubble /><ShareBubble /></>}
//   />
//
// scrollTarget is preserved as a backwards-compat prop for any caller that
// still passes one. Session-70 D17 flattens the booth pages off internal
// overflow-auto containers, so once those callsites migrate, scrollTarget
// is effectively unused — but the prop survives so we don't have to choreograph
// API + caller changes in lockstep.

"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { v1, FONT_IM_FELL } from "@/lib/tokens";

interface StickyMastheadProps {
  /**
   * Left-slot content. Typically a back button on detail/leaf pages
   * (`/find/[id]`, `/shelf/[slug]`, `/post/preview`, `/post/edit/*`).
   * Empty on root tabs.
   */
  left?: ReactNode;
  /**
   * Center-slot content. Defaults to the "Treehouse Finds" wordmark in
   * IM Fell italic 22px on inkPrimary. Override only for surfaces that
   * carry a different center identity (rare — the masthead lock spec
   * keeps this single).
   */
  wordmark?: ReactNode;
  /**
   * Right-slot content. Variable: sign-in icon, sign-out text, Admin pill,
   * bookmark + share bubbles. Renders right-aligned within the locked
   * `min-width: 80px` column.
   */
  right?: ReactNode;
  /**
   * Optional scroll-target ref. When provided, the scroll-linked hairline
   * tracks this element instead of window. Session-70 D17 flattens the
   * booth-page internal scroll containers, so the prop is preserved for
   * backwards-compat but most callsites no longer need it.
   */
  scrollTarget?: RefObject<HTMLElement | null>;
  /**
   * Threshold in px at which the hairline becomes fully opaque. Default 4.
   */
  threshold?: number;
}

// IM Fell italic ascenders sit slightly above the line-box center, so a
// span vertically aligned to grid-row-center reads as dropping ~1px below
// the slot icons / pills around it. Lift the wordmark by 1px so the visual
// center matches the side-slot icon centers.
const WORDMARK_DEFAULT = (
  <span
    style={{
      fontFamily: FONT_IM_FELL,
      fontStyle: "italic",
      fontSize: 22,
      color: v1.green,
      letterSpacing: "-0.005em",
      lineHeight: 1,
      whiteSpace: "nowrap",
      display: "inline-block",
      transform: "translateY(-1px)",
    }}
  >
    Treehouse Finds
  </span>
);

export default function StickyMasthead({
  left,
  wordmark,
  right,
  scrollTarget,
  threshold = 4,
}: StickyMastheadProps) {
  const [scrolled, setScrolled] = useState(false);
  const lastState = useRef(false);

  useEffect(() => {
    const target: HTMLElement | Window =
      (scrollTarget?.current as HTMLElement | null) ?? window;

    function readScrollY(): number {
      if (target === window) return window.scrollY;
      return (target as HTMLElement).scrollTop;
    }

    function handleScroll() {
      const next = readScrollY() > threshold;
      if (next !== lastState.current) {
        lastState.current = next;
        setScrolled(next);
      }
    }

    handleScroll();

    (target as Window).addEventListener("scroll", handleScroll, { passive: true });
    return () => (target as Window).removeEventListener("scroll", handleScroll);
  }, [scrollTarget, threshold]);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(232,221,199,0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: `1px solid ${scrolled ? v1.inkHairline : "transparent"}`,
        transition: "border-color 0.2s ease",
        paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
        paddingBottom: 12,
        paddingLeft: 18,
        paddingRight: 18,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          minHeight: 40,
          gap: 8,
        }}
      >
        <div
          style={{
            justifySelf: "start",
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 80,
          }}
        >
          {left}
        </div>
        <div style={{ textAlign: "center" }}>
          {wordmark ?? WORDMARK_DEFAULT}
        </div>
        <div
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: 6,
            justifyContent: "flex-end",
            minWidth: 80,
          }}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
