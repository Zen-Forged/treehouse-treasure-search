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
import { usePathname } from "next/navigation";
import QRCode from "react-qr-code";

const DESKTOP_BREAKPOINT_PX = 1024;

// Session 200 — routes exempt from the desktop frame chrome. /review-board
// is the internal design control room: it renders its own iframe-tile
// previews of every app surface, so wrapping it in the simulated-iPhone
// chrome nests an iframe inside a phone inside the page — confusing + wrong
// for a desktop-first review surface. David QA (v0.199.0): "I want
// /review-board to not include the wrapped iphone container look while on
// desktop." Prefix match so any /review-board/* sub-route is also exempt.
const FRAME_EXEMPT_PREFIXES = ["/review-board"];
const PHONE_WIDTH_PX = 360;   // ~430 PWA column compressed to fit photographed iPhone scale
const PHONE_HEIGHT_PX = 740;  // ~iPhone 14 Pro Max screen ratio adjusted for chrome
const PHONE_RADIUS_PX = 44;

// Session 199 QA dial round 2 (Arc 2.5) — David's Vercel preview QA on
// Arc 3.1 ship: "phone still needs to come center more, same with the
// text." Dial composition geometry: justifyContent space-between →
// center + gap 32 → 80. Brand chrome (~380 wide) + phone (360 wide)
// now form a center-anchored ~820px block with fixed 80px gap.
// Composition stays centered in viewport at any width; max-width 1100
// clamps the composition box on ultra-wide viewports.
const COMPOSITION_MAX_WIDTH_PX = 1100;
const COMPOSITION_SIDE_PADDING_PX = 64;
const COMPOSITION_GAP_PX = 80;

const EMBED_QUERY_KEY = "desktop-frame";
const EMBED_QUERY_VALUE = "embedded";

// Session 199 QA round 2 (Arc 3.2) — David: "Replace the Treehouse and
// lock symbol with the logo we use for the app." Canonical app
// wordmark at public/wordmark.png is the same asset rendered by
// <StickyMasthead> across the entire PWA. 320px width fits within
// brand chrome max-width 380 with breathing room; aspect ratio
// (~1875:1000) preserved via height: auto.
const WORDMARK_WIDTH_PX = 320;

// QR code encodes the app's canonical URL. Desktop visitor scans →
// opens the PWA on phone where canonical experience lives. The
// digital-to-physical bridge thesis applied at the marketing layer.
const QR_CODE_VALUE = "https://app.kentuckytreehouse.com/";
const QR_CODE_SIZE_PX = 120;
// Brown ink matching the wordmark's printed color — reads as part of
// the same printed brand element rather than a separate digital
// overlay. Approximate eyeball match of wordmark's warm brown.
const QR_CODE_INK = "#5a4a30";

type DesktopFrameProps = {
  children: React.ReactNode;
  /**
   * Override iframe src for smoke testing. When omitted, iframe loads
   * the current pathname + query with `desktop-frame=embedded` appended.
   */
  iframeSrcOverride?: string;
};

export default function DesktopFrame({ children, iframeSrcOverride }: DesktopFrameProps) {
  const pathname = usePathname();
  const isExempt = FRAME_EXEMPT_PREFIXES.some((p) => pathname?.startsWith(p));

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
  // 4. Exempt route (e.g. /review-board) → render children (Session 200)
  if (!mounted || isEmbedded || !isDesktop || isExempt) {
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
      {/* Session 199 Arc 3.2 — canonical app wordmark image at
          public/wordmark.png. Same asset rendered by <StickyMasthead>
          across the entire PWA. Replaces session 199 Arc 2.1's custom
          SVG leaf glyph + CSS-rendered "treehouse FINDS" text wordmark
          per David's QA: "Replace the Treehouse and lock symbol with
          the logo we use for the app." */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/wordmark.png"
        alt="Treehouse Finds"
        style={wordmarkImgStyle}
      />

      {/* Tagline — 3 stacked lines per D13, centered per QA */}
      <p style={taglineStyle}>
        Embrace the search.<br />
        Treasure the find.<br />
        Share the story.
      </p>

      {/* Gold ornament — small horizontal element below tagline */}
      <div style={ornamentStyle} aria-hidden="true" />

      {/* Subtext */}
      <p style={subtextStyle}>Find before you visit.</p>

      {/* Session 199 Arc 3.2 — QR code per David's QA. Encodes
          canonical app URL. Brown ink matches wordmark's printed
          color; transparent bg lets photo's cream texture show
          through for visual integration. Caption in Cormorant italic
          matches subtext voice. */}
      <div style={qrContainerStyle}>
        <div style={qrPaddingStyle}>
          <QRCode
            value={QR_CODE_VALUE}
            size={QR_CODE_SIZE_PX}
            fgColor={QR_CODE_INK}
            bgColor="transparent"
            level="M"
          />
        </div>
        <p style={qrCaptionStyle}>Scan to take it with you</p>
      </div>
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

// Session 199 Arc 3.1 — photo swap-in. Final hero photographed flatlay
// landed at public/desktop-hero.png (1672×941, optimized via pngquant
// 3.1MB → 780KB / 75% reduction). Decorations at all 4 corners (botanical
// TL, treehouse sketch TR, postcard BL, brass key + dried botanicals BR);
// empty cream center frames the brand chrome + phone composition.
// background-size: cover + position: center keeps decorations near
// viewport corners at any aspect ratio; cream center always centered.
// #e8ddc7 (v1.paperCream) fallback before photo loads.
const bgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundColor: "#e8ddc7",
  backgroundImage: "url(/desktop-hero.png)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
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
  justifyContent: "center",
  padding: `0 ${COMPOSITION_SIDE_PADDING_PX}px`,
  boxSizing: "border-box",
  zIndex: 1,
  gap: COMPOSITION_GAP_PX,
};

const brandChromeStyle: React.CSSProperties = {
  // Flex item inside composition wrapper — no absolute positioning
  // needed. Flex alignItems:center handles vertical centering. Session
  // 199 Arc 3.2 — textAlign center per David's QA "text can be
  // centered underneath" the wordmark; cascades to all child p/div.
  maxWidth: 380,
  flexShrink: 0,
  color: "#2a1a0a",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const wordmarkImgStyle: React.CSSProperties = {
  width: WORDMARK_WIDTH_PX,
  height: "auto",
  display: "block",
  marginBottom: 8,
};

const taglineStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 26,
  lineHeight: 1.35,
  margin: "24px 0 0",
  letterSpacing: "-0.005em",
};

const ornamentStyle: React.CSSProperties = {
  width: 70,
  height: 2,
  margin: "18px auto 14px",
  background: "linear-gradient(90deg, transparent, #B8945E 20%, #B8945E 80%, transparent)",
};

const subtextStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontStyle: "italic",
  fontSize: 15,
  color: "#5c4d3a",
  margin: 0,
};

const qrContainerStyle: React.CSSProperties = {
  marginTop: 32,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

// QR-code quiet zone — slightly lighter cream than photo bg so scanners
// have a clean surface but the QR still reads as integrated with the
// brand chrome rather than a hard-edged card.
const qrPaddingStyle: React.CSSProperties = {
  background: "rgba(255, 252, 245, 0.55)",
  padding: 10,
  borderRadius: 6,
  lineHeight: 0, // tight wrap around the QR svg
};

const qrCaptionStyle: React.CSSProperties = {
  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
  fontStyle: "italic",
  fontSize: 13,
  color: "#5c4d3a",
  margin: "10px 0 0",
  letterSpacing: "0.02em",
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
