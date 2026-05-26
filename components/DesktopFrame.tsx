// components/DesktopFrame.tsx
//
// Session 199 — Desktop frame chrome wrapping the live PWA at ≥1024px
// viewport. Renders the PWA inside a stylized iPhone bezel on a branded
// flatlay background; brand chrome (wordmark + tagline) renders left of
// the phone. At <1024px viewport, this component is a pass-through
// (children render normally).
//
// Architecture decision (D3 + D11 in docs/desktop-frame-design.md):
// - The "live PWA inside frame" requirement means the PWA must work
//   pixel-perfect on desktop (clicks, scrolls, sticky chrome, scroll-
//   restore all functional)
// - The PWA was designed for mobile-viewport-as-scroll-container
//   (StickyMasthead position:fixed, window-scroll listeners). Rendering
//   PWA as direct children inside an absolute-positioned phone-stage
//   would break all those primitives
// - Solution: iframe with the live app URL inside the phone-stage. The
//   iframe has its own document scope; PWA works as designed inside.
//   Parent page just renders the chrome around the iframe.
//
// Embedded-mode detection: when DesktopFrame mounts inside the iframe,
// the URL query carries ?desktop-frame=embedded, so DesktopFrame
// recognizes it's running inside the iframe and renders children
// directly (no chrome). Otherwise infinite recursion.
//
// Placeholder bg: Arc 2 ships with CSS-rendered paper-texture gradient
// approximating the photographed flatlay. Arc 3.1 swaps the placeholder
// for the final Midjourney-generated photo as a single CSS change.
//
// Auth gate (D4) NOT yet wired — initial implementation renders chrome
// to ALL desktop viewers regardless of auth state. Visitor-only gate
// lands as Arc 3.2 follow-up to avoid hydration-flash complexity.

"use client";

import * as React from "react";

const DESKTOP_BREAKPOINT_PX = 1024;
const PHONE_WIDTH_PX = 360;   // ~430 PWA column compressed to fit photographed iPhone scale
const PHONE_HEIGHT_PX = 740;  // ~iPhone 14 Pro Max screen ratio adjusted for chrome
const PHONE_RADIUS_PX = 44;

// Session 199 QA dial — composition wrapper max-width keeps brand
// chrome + phone centered at a fixed gap (~160px) regardless of
// viewport width. Below 1200px the composition fills viewport with
// 64px side padding; above 1200px it stays clamped + centered, with
// the photographed flatlay decorations at viewport corners filling
// any extra width.
const COMPOSITION_MAX_WIDTH_PX = 1200;
const COMPOSITION_SIDE_PADDING_PX = 64;

const EMBED_QUERY_KEY = "desktop-frame";
const EMBED_QUERY_VALUE = "embedded";

type DesktopFrameProps = {
  children: React.ReactNode;
  /**
   * Override iframe src for smoke testing. When omitted, iframe loads
   * the current pathname + query with `desktop-frame=embedded` appended.
   */
  iframeSrcOverride?: string;
};

export default function DesktopFrame({ children, iframeSrcOverride }: DesktopFrameProps) {
  const [mounted, setMounted]   = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [isEmbedded, setIsEmbedded] = React.useState(false);
  const [iframeSrc, setIframeSrc] = React.useState<string>("/");

  React.useEffect(() => {
    setMounted(true);

    // Detect embedded-mode (we're inside the chrome's iframe)
    const params = new URLSearchParams(window.location.search);
    if (params.get(EMBED_QUERY_KEY) === EMBED_QUERY_VALUE) {
      setIsEmbedded(true);
      // Session 199 QA — add body class so globals.css scrollbar-
      // hiding rules apply. Hides the iframe's internal scrollbar so
      // it doesn't visually distract from the photographed iPhone
      // bezel. Brief paint may show scrollbars before hydration
      // completes; structural server-side fix is Tier B.
      document.body.classList.add("desktop-frame-embedded");
      return; // No chrome inside iframe; no resize listener needed
    }

    // Compute iframe src once on mount (matches current path)
    if (iframeSrcOverride) {
      setIframeSrc(iframeSrcOverride);
    } else {
      const search = new URLSearchParams(window.location.search);
      search.set(EMBED_QUERY_KEY, EMBED_QUERY_VALUE);
      setIframeSrc(`${window.location.pathname}?${search.toString()}`);
    }

    // Viewport detection — keep desktop chrome reactive to resize
    const check = () => setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT_PX);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [iframeSrcOverride]);

  // Pass-through cases:
  // 1. SSR / pre-hydration → render children (mobile-default; brief flash on desktop)
  // 2. Inside iframe → render children (no chrome, no recursion)
  // 3. Mobile viewport → render children
  if (!mounted || isEmbedded || !isDesktop) {
    return <>{children}</>;
  }

  // Desktop chrome wrapping iframe
  return (
    <div style={rootStyle}>
      <div style={bgStyle} aria-hidden="true" />
      {/* Session 199 QA — composition wrapper centers brand + phone
          with max-width clamping so the layout stays balanced at any
          viewport width. Below 1200px composition fills viewport with
          64px side padding; above 1200px composition stays at 1200
          max-width centered, photographed flatlay decorations at
          viewport corners fill any extra width. */}
      <div style={compositionStyle}>
        <BrandChrome />
        <div style={phoneStageStyle}>
          <div style={phoneBezelStyle}>
            <div style={phoneScreenStyle}>
              <iframe
                src={iframeSrc}
                style={iframeStyle}
                title="Treehouse Finds app preview"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  <BrandChrome> — wordmark + tagline + ornament + subtext
//  Positioned absolute left-of-phone per D12 + D13 + reference image
// ─────────────────────────────────────────────────────────────────────

function BrandChrome() {
  return (
    <div style={brandChromeStyle}>
      {/* Small leaf glyph above wordmark — matches Treehouse leaf brand mark */}
      <svg
        width="56"
        height="64"
        viewBox="0 0 56 64"
        fill="#1F4A31"
        style={{ marginBottom: 20, display: "block" }}
        aria-hidden="true"
      >
        <path d="M28 4 C32 14, 44 18, 44 28 C44 34, 38 38, 36 38 L36 60 L20 60 L20 38 C18 38, 12 34, 12 28 C12 18, 24 14, 28 4 Z" />
      </svg>

      {/* Wordmark — 2-line lockup per D12 */}
      <h1 style={wordmarkStyle}>
        treehouse
        <span style={wordmarkSubStyle}>FINDS</span>
      </h1>

      {/* Tagline — 3 stacked lines per D13 */}
      <p style={taglineStyle}>
        Embrace the search.<br />
        Treasure the find.<br />
        Share the story.
      </p>

      {/* Gold ornament — small horizontal element below tagline */}
      <div style={ornamentStyle} aria-hidden="true" />

      {/* Subtext */}
      <p style={subtextStyle}>Find before you visit.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Styles — inline for now; promote to CSS module if 2nd consumer
//  surfaces
// ─────────────────────────────────────────────────────────────────────

const rootStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  overflow: "hidden",
  fontFamily: "var(--font-inter), system-ui, sans-serif",
};

// Placeholder bg — CSS-rendered approximation of warm-cream paper texture
// per D8. Arc 3.1 swaps backgroundImage url for final Midjourney photo.
const bgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: `
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255, 248, 228, 0.55) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 85% 75%, rgba(220, 200, 160, 0.45) 0%, transparent 65%),
    linear-gradient(135deg, #f5ecd6 0%, #e8d8b8 50%, #ddc89e 100%)
  `,
  zIndex: 0,
};

// Session 199 QA — composition wrapper containing brand chrome + phone
// stage. Centered with max-width clamping; flexbox space-between keeps
// the gap consistent at any viewport. Photographed flatlay decorations
// at viewport corners (via bgStyle full-cover) frame the composition
// on wide screens.
const compositionStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "50%",
  transform: "translateX(-50%)",
  width: "100%",
  maxWidth: COMPOSITION_MAX_WIDTH_PX,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `0 ${COMPOSITION_SIDE_PADDING_PX}px`,
  boxSizing: "border-box",
  zIndex: 1,
  gap: 32,
};

const brandChromeStyle: React.CSSProperties = {
  // Flex item inside composition wrapper — no absolute positioning
  // needed. Flex alignItems:center handles vertical centering.
  maxWidth: 380,
  flexShrink: 0,
  color: "#2a1a0a",
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: 64,
  lineHeight: 0.95,
  margin: 0,
  letterSpacing: "-0.01em",
};

const wordmarkSubStyle: React.CSSProperties = {
  display: "block",
  fontSize: 18,
  letterSpacing: "0.32em",
  fontWeight: 500,
  marginTop: 8,
  paddingTop: 12,
  borderTop: "1.5px solid currentColor",
  width: "fit-content",
};

const taglineStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 28,
  lineHeight: 1.35,
  margin: "32px 0 0",
  letterSpacing: "-0.005em",
};

const ornamentStyle: React.CSSProperties = {
  width: 70,
  height: 2,
  margin: "18px 0 14px",
  background: "linear-gradient(90deg, transparent, #B8945E 20%, #B8945E 80%, transparent)",
};

const subtextStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontStyle: "italic",
  fontSize: 16,
  color: "#5c4d3a",
  margin: 0,
};

const phoneStageStyle: React.CSSProperties = {
  // Flex item inside composition wrapper — no absolute positioning.
  flexShrink: 0,
};

// Phone bezel — dark titanium-ish frame per D9 (matches photographed
// iPhone in final composition). Placeholder version is CSS-rendered;
// when final photo lands at Arc 3.1, the phone is part of the photo
// and this bezel layer collapses to just the screen container.
const phoneBezelStyle: React.CSSProperties = {
  width: PHONE_WIDTH_PX,
  height: PHONE_HEIGHT_PX,
  background: "linear-gradient(160deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)",
  borderRadius: PHONE_RADIUS_PX,
  padding: 10,
  boxShadow: `
    0 30px 60px rgba(42, 26, 10, 0.35),
    0 12px 24px rgba(42, 26, 10, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.15)
  `,
  position: "relative",
};

const phoneScreenStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "#E6DECF",
  borderRadius: PHONE_RADIUS_PX - 10,
  overflow: "hidden",
  position: "relative",
};

const iframeStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  display: "block",
  background: "#E6DECF",
};
