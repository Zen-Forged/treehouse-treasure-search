// components/StickyMasthead.tsx
// Shared sticky masthead chrome — v1.1l (docs/design-system.md §v1.1l (a))
//
// The six consumers of this primitive (Home, Find Map, Find Detail normal,
// Find Detail 3B SoldLanding, My Shelf, Public Shelf) previously each held
// their own inline `position: sticky` + translucent-paperCream + always-on
// hairline implementation. v1.1l extracts the shared chrome and adds the
// scroll-linked bottom border — hairline fades in once content is scrolling
// under the masthead. At rest the border is transparent; threshold is
// window.scrollY > 4 so it reveals on the slightest scroll rather than only
// after a significant one.
//
// The scroll listener is attached to the global `window` by default (standard
// document-scroll page pattern), but can be overridden via the `scrollTarget`
// prop — this is required for Booth pages (`/my-shelf`, `/shelf/[slug]`)
// which use an internal overflow-auto scroll container rather than document
// scroll. Consumers pass a ref to the scrolling element.
//
// Composition is fully controlled by children — this primitive owns only the
// sticky wrapper, not the inner masthead content.

"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { v1 } from "@/lib/tokens";

interface StickyMastheadProps {
  children: ReactNode;
  /**
   * Optional scroll-target ref. When provided, the scroll listener attaches
   * to this element instead of window. Required for pages where the masthead
   * sits inside an overflow-auto scroll container (Booth pages).
   */
  scrollTarget?: RefObject<HTMLElement | null>;
  /**
   * Threshold in px at which the hairline becomes fully opaque. Default 4.
   */
  threshold?: number;
  /**
   * Additional style to merge onto the sticky wrapper. Use for grid/flex
   * layout of the inner content (most consumers pass their existing
   * `display: grid, gridTemplateColumns: ...` rules).
   */
  style?: React.CSSProperties;
}

export default function StickyMasthead({
  children,
  scrollTarget,
  threshold = 4,
  style,
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

    // Initial read — in case the page mounts already-scrolled (e.g. on return
    // nav with scroll-restore).
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
        ...style,
      }}
    >
      {children}
    </div>
  );
}
