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
// Session 156 — David iPhone QA: "remove the thin line under the masthead
// on scroll. No longer needed with this setup as the masthead and the
// location selector read as one component." The hairline-on-scroll signal
// breaks the masthead + strip continuous-chrome reading from session 155.
// Retire the borderBottom plus the entire supporting state machine (scrolled
// state, useEffect scroll listener, threshold prop, scrollTarget prop) per
// feedback_dead_code_cleanup_as_byproduct — when the consumer of state is
// retired, retire the state in the same commit.

"use client";

import { type ReactNode } from "react";
import { v2 } from "@/lib/tokens";

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
   * Session 137 — defaults to null when omitted. Previously (session 90)
   * defaulted to <MastheadShareButton /> as a "share this page" sign-up
   * acquisition affordance, but the 3-tier engagement+share lattice
   * (memory: project_layered_engagement_share_hierarchy) replaces the
   * generic page-share with entity-specific Share Mall / Share Booth /
   * Share Find via <ShareSheet>. Pages that want a share affordance
   * pass an explicit `right={...}` opening the appropriate ShareSheet
   * for their entity. Pages with no share entity (e.g. /vendor-request,
   * /me, /contact) pass `right={null}` to be explicit.
   */
  right?: ReactNode;
}

// Session 95 — wordmark height 90 → 72 (-20%) per David's call. Session 94
// bumped to 90 for "heavier brand anchor"; iPhone QA found it heavier than
// intended. Session 154 — inner-grid minHeight 90 → 72 + MASTHEAD_HEIGHT
// calc 103 → 85 per David's session-154 chrome-reduction ask (closes the
// session-95 pre-specified canonical dial). Wordmark centers within the
// 72px grid with minimal breathing room above + below.
// Width auto-sizes from the 1500×800 aspect ratio (~135px at 72px height).
const WORDMARK_DEFAULT = (
  <img
    src="/wordmark.png"
    alt="Treehouse Finds"
    style={{
      height: 72,
      width: "auto",
      display: "block",
    }}
  />
);

// Total masthead height = paddingTop + inner grid minHeight + paddingBottom.
// paddingTop is max(14px, safe-area-inset-top); the rest is fixed. Session 94:
// inner grid 50 → 90, so calc 63 → 103. Session 154: inner grid 90 → 72, so
// calc 103 → 85. Session 157: calc 85 → 84 — session 156 reasoned that
// retiring the hairline borderBottom didn't change visible height because
// "the border was 1px transparent at rest." Wrong: a transparent 1px border
// still occupies 1px of layout space. With the border gone, the visible
// masthead bottom edge sits 1px ABOVE where the spacer + strip top expect
// (= paddingTop + 72 + 12 = paddingTop + 84). Pre-session-156 the 85 was
// correct (paddingTop + 72 + 12 + 1px border). Now 84 closes the seam.
//
// Session 168 round 7 — David iPhone QA: "on /my-shelf the hero image
// still is not sitting under the masthead." paddingBottom 12 → 0
// removed the cream breathing-room slab.
//
// Session 168 round 8 — David: "it looks like the height of the
// masthead changed so now there is no padding between the hero image
// and logo." Overshot at 0; wordmark and BoothHero photo were touching
// with no breathing room. Dialed to 8 — the canonical `space.s8`
// inline-default value per lib/tokens.ts comments ("inline default
// (most form padding, list-item spacing)"). Gives a clear visual
// separation between the wordmark and the next-section content
// without reading as a cream slab. Calc updates 72 → 80 to keep
// spacer in sync with the new masthead-paint height (paddingTop +
// 72 + 8).
//
// Exported as the canonical SSOT for any future surface that needs to compute
// layout against the masthead footprint (fixed overlays, scroll-snap targets,
// etc.). The spacer inside this component already reserves the height for
// content rendered after <StickyMasthead /> in the React tree.
export const MASTHEAD_HEIGHT = "calc(max(14px, env(safe-area-inset-top, 14px)) + 80px)";

export default function StickyMasthead({
  left,
  wordmark,
  right,
}: StickyMastheadProps) {
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
          // Session 140 — chrome migrates to v2.bg.main (#F7F3EB).
          // Was hardcoded #f2ecd8 since session 132 frosted-glass retire.
          background: v2.bg.main,
          paddingTop: "max(14px, env(safe-area-inset-top, 14px))",
          // Session 168 round 7 → 8 — David iPhone QA convergence:
          // 12 (too gappy) → 0 (too tight) → 8 (canonical space.s8).
          // See lengthy comment block above the MASTHEAD_HEIGHT export.
          // Spacer calc in MASTHEAD_HEIGHT mirrors paddingBottom — both
          // must move together.
          paddingBottom: 8,
          paddingLeft: 18,
          paddingRight: 18,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            minHeight: 72,
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
            {right ?? null}
          </div>
        </div>
      </div>
    </>
  );
}
