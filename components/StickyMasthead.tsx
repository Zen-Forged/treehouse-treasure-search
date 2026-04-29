// components/StickyMasthead.tsx
// Shared masthead chrome — session 70 lock pass + session 77 PWA fix
// (docs/masthead-lock-design.md).
//
// Visual stability with affordances. Single `1fr auto 1fr` inner grid across
// every page that renders this component. The wordmark sits in the auto
// middle column and is always visually centered between two equal 1fr
// columns regardless of left/right slot content. Both side slots reserve
// `min-width: 80px` so an empty slot reserves the same column width as the
// heaviest case (multi-bubble on /shelf/[slug]) — the wordmark cannot drift.
//
// Session 77 — `position: fixed` + layout spacer.
// Originally `position: sticky`. iOS PWA standalone mode has a known paint
// bug where bfcache restoration leaves position:sticky elements at zero
// computed height until a touch/scroll event forces a layout recompute.
// Three earlier fix attempts (loading branch chrome, pageshow handler,
// useLayoutEffect nudge) didn't trigger reliably in iOS PWA — events
// either don't fire or fire too late. position:fixed bypasses the bug
// class entirely: fixed elements use viewport coords and are always
// painted regardless of bfcache state. The component name is preserved
// (StickyMasthead) for caller stability — the visual contract is
// identical, only the underlying CSS primitive changed.
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
// still passes one. With fixed positioning the prop only affects the
// hairline-on-scroll signal, not the masthead's own positioning.

"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { v1 } from "@/lib/tokens";
import MastheadShareButton from "./MastheadShareButton";

interface StickyMastheadProps {
  /**
   * Left-slot content. Typically a back button on detail/leaf pages
   * (`/find/[id]`, `/shelf/[slug]`, `/post/preview`, `/post/edit/*`).
   * Empty on root tabs.
   */
  left?: ReactNode;
  /**
   * Center-slot content. Defaults to the Treehouse Finds wordmark logo
   * (`/wordmark.png`, transparent-bg). Override only for surfaces that
   * carry a different center identity (rare — the masthead lock spec
   * keeps this single).
   */
  wordmark?: ReactNode;
  /**
   * Right-slot content. Variable: bookmark, custom share bubbles, etc.
   * Renders right-aligned within the locked `min-width: 80px` column.
   *
   * Session 90 — when omitted, defaults to <MastheadShareButton /> so every
   * page in the app carries a share-this-page affordance for sign-up
   * acquisition. Pass `right={null}` to render an empty slot. Pages with
   * context-specific share treatments (/find/[id], /shelf/[slug],
   * /my-shelf) pass their own `right` and opt out of the default.
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

// Session 89 — wordmark fills the 50px inner-grid row (was 40px session 88,
// 30px session 87). Bumped to give the app more breathing room and improve
// readability for older shoppers. Asset cropped tighter (1500×800, less
// padding) so the visual logo grows more than the height delta suggests.
// Width auto-sizes from the 1500×800 aspect ratio (~94px at 50px height).
// Transparent-bg so it composites cleanly over the masthead's paper-warm
// rgba(232,221,199,0.96) background. Display:block removes the inline-image
// baseline gap.
const WORDMARK_DEFAULT = (
  <img
    src="/wordmark.png"
    alt="Treehouse Finds"
    style={{
      height: 50,
      width: "auto",
      display: "block",
    }}
  />
);

// Total masthead height = paddingTop + inner grid minHeight + paddingBottom
// + bottom border. paddingTop is max(14px, safe-area-inset-top); the rest
// is fixed. Session 89: inner grid 40 → 50, so calc 53 → 63. Spacer matches.
const MASTHEAD_HEIGHT = "calc(max(14px, env(safe-area-inset-top, 14px)) + 63px)";

export default function StickyMasthead({
  left,
  wordmark,
  right,
  scrollTarget,
  threshold = 4,
}: StickyMastheadProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const target: HTMLElement | Window =
      (scrollTarget?.current as HTMLElement | null) ?? window;

    function readScrollY(): number {
      if (target === window) return window.scrollY;
      return (target as HTMLElement).scrollTop;
    }

    let lastState = false;
    function handleScroll() {
      const next = readScrollY() > threshold;
      if (next !== lastState) {
        lastState = next;
        setScrolled(next);
      }
    }

    handleScroll();

    (target as Window).addEventListener("scroll", handleScroll, { passive: true });
    return () => (target as Window).removeEventListener("scroll", handleScroll);
  }, [scrollTarget, threshold]);

  return (
    <>
      {/* Layout spacer — reserves the same vertical space the sticky masthead
          used to take, so content below is positioned identically. */}
      <div
        aria-hidden="true"
        style={{
          height: MASTHEAD_HEIGHT,
          flexShrink: 0,
        }}
      />

      {/* Fixed-position masthead — pinned to viewport top. Centered + capped at
          maxWidth: 430 to match the page wrapper's content column.
          Background extends only to the maxWidth column on iPhone (since
          screen width is 390-430px). */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
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
            minHeight: 50,
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
            {right === undefined ? <MastheadShareButton /> : right}
          </div>
        </div>
      </div>
    </>
  );
}
