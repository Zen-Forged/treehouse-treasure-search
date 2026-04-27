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

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
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
  const stickyRef = useRef<HTMLDivElement>(null);

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

  // iOS PWA standalone-mode masthead-disappears workaround (session 77).
  //
  // In iOS PWA standalone mode (apple-mobile-web-app-capable), back-nav from
  // a sibling page restores the previous page with position:sticky elements
  // rendered at zero computed height. The DOM is correct; the layout engine
  // simply hasn't laid the sticky element out. Touch / scroll forces a
  // recompute and the masthead reappears.
  //
  // Browser Safari bfcache hits the same paint bug, but `pageshow` with
  // `event.persisted` is a reliable signal. PWA standalone mode does NOT
  // reliably set `persisted` and may not fire `pageshow` at all on back-nav
  // — so we have to be more aggressive:
  //
  //   1. Force reflow on every mount via useLayoutEffect (covers cold mount
  //      after PWA cold-start as well).
  //   2. Force reflow on every `pageshow` event (regardless of persisted).
  //   3. Force reflow on every `visibilitychange` → visible (covers PWA
  //      app-switcher return).
  //   4. The reflow trigger directly mutates the masthead's `top` style by
  //      a fractional px and resets it the next frame. This is the most
  //      reliable iOS layout-recompute trigger; `window.scrollBy` no-ops
  //      when the page isn't scrollable, and `offsetHeight` reads alone
  //      don't always wake iOS.
  useLayoutEffect(() => {
    function nudge() {
      const el = stickyRef.current;
      if (!el) return;
      el.style.top = "0.01px";
      requestAnimationFrame(() => {
        if (!stickyRef.current) return;
        stickyRef.current.style.top = "0px";
      });
    }

    nudge();

    function onPageShow() { nudge(); }
    function onVisibility() {
      if (document.visibilityState === "visible") nudge();
    }

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={stickyRef}
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
