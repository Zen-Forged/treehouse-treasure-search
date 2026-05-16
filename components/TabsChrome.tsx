// components/TabsChrome.tsx
// Session 167 chrome-unification — TabsChrome rewired per design record
// docs/chrome-unification-design.md.
//
// Per-surface chrome:
//   - Home   (/):         HomeHero (sticky-collapsing 33vh photographic strip)
//                         + sibling sticky logo (treehouse_transparent.png centered
//                         at hero center at rest, sticky-pins at masthead vcenter
//                         on scroll)
//                         + MallPickerChip (sticky overlay; "trims" bottom of
//                         hero by occluding bottom 30px of strip)
//                         + MallMapDrawer (page-drawer picker)
//   - Saved  (/flagged):  StickyMasthead (universal masthead strip aesthetic,
//                         no scroll-collapse, no chip, fadeTarget v2.bg.tabs
//                         for cream-fade continuity into (tabs)/-surface bg)
//
// Floating overlays (Q1 + Q2 locks — session 166 dial 9 geometry preserved):
//   - Profile (top-right): universal across Home + Saved
//   - Back    (top-left):  Home only, when MallMapDrawer is open
//
// Removed this session per design record D14:
//   - Embedded SearchBar in HomeHero — hero is now photo-only. R16 search
//     query plumbing (`?q=` URL param + MallMatchChip in drawer) preserved
//     intact at this layer for follow-on re-introduction of search input.

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HomeHero from "@/components/HomeHero";
import StickyMasthead from "@/components/StickyMasthead";
import MallPickerChip from "@/components/MallPickerChip";
import MallMapDrawer from "@/components/MallMapDrawer";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton from "@/components/MastheadBackButton";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useMapDrawer } from "@/lib/useMapDrawer";
import { getActiveMalls } from "@/lib/posts";
import { track } from "@/lib/clientEvents";
import { v2 } from "@/lib/tokens";
import {
  LOGO_WIDTH_DEFAULT_PX,
  MASTHEAD_CONTENT_HEIGHT_PX,
  WORDMARK_URL,
} from "@/lib/chromeTokens";
import type { Mall } from "@/types/treehouse";

// Floating overlay positioning — session 166 dial 9 geometry preserved
// post chrome-unification (Q1 + Q2 locks). Profile/Back at top-right/top-
// left of viewport at the safe-area-aware y that mirrors StickyMasthead's
// internal button vcenter on detail/auth surfaces.
const OVERLAY_TOP    = "calc(max(14px, env(safe-area-inset-top, 14px)) + 14px)";
const OVERLAY_X      = 18;
const OVERLAY_Z      = 50;

// Sibling sticky logo for Home per design record D13. The logo lives at the
// TabsChrome level (NOT inside HomeHero) so CSS sticky can pin it at the
// viewport top regardless of HomeHero's scroll/collapse state.
//
// Sticky journey:
//   At rest (scrollY=0): logo center at viewport y = 33vh/2 (centered in
//     full hero photo). Logo height ≈ 73px (LOGO_WIDTH_DEFAULT_PX 150 ×
//     815/399 aspect ratio of treehouse_transparent.png).
//   On scroll: logo top edge sticky-pins at viewport y = safe-area + 14
//     (matches Profile + Back overlay top-edge for cross-surface alignment).
//     Logo center at viewport y = safe-area + 50 (= LOGO_TOP_OFFSET_PX).
//
// LOGO_NATURAL_OFFSET (marginTop) pulls the logo's natural document position
// from "right after HomeHero (= 33vh)" up into hero center:
//   marginTop = -(33vh - (33vh/2 - LOGO_HEIGHT/2)) = -(33vh/2 + LOGO_HEIGHT/2)
//
// If LOGO_WIDTH_DEFAULT_PX changes, recompute LOGO_HEIGHT_PX_HALF from the
// 815/399 aspect ratio.
const LOGO_HEIGHT_PX_HALF = 36.5;  // half of 150 × (815/399) = 73.6 / 2
const LOGO_NATURAL_OFFSET = `calc(-33vh / 2 - ${LOGO_HEIGHT_PX_HALF}px)`;
const LOGO_STICKY_TOP     = "calc(max(14px, env(safe-area-inset-top, 14px)) + 14px)";
const LOGO_Z              = 42;  // above CHIP_Z (38), below OVERLAY_Z (50)

export default function TabsChrome() {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [mallId, setMallId] = useSavedMallId();
  const { drawerOpen, closeDrawer, toggleDrawer } = useMapDrawer();
  const [malls, setMalls] = useState<Mall[]>([]);

  useEffect(() => {
    getActiveMalls().then(setMalls);
  }, []);

  // Auto-scroll-on-drawer-open per session 166 dial 3 — when chip is tapped
  // at scrollY=0, scroll the page to the sticky-engagement threshold so
  // hero collapses + chip pins in one shot rather than rendering drawer over
  // mid-flight scroll state.
  //
  // Session 167 — recalc for new MASTHEAD_HEIGHT (was safe-area+84 plus
  // SearchBar 60 = safe-area+144; now safe-area+116, no SearchBar).
  useEffect(() => {
    if (!drawerOpen) return;
    if (typeof window === "undefined") return;

    const safeAreaTopRaw = getComputedStyle(document.documentElement)
      .getPropertyValue("--th-safe-area-inset-top")
      .trim();
    const safeAreaTop    = parseFloat(safeAreaTopRaw) || 0;
    const mastheadHeight = Math.max(14, safeAreaTop) + MASTHEAD_CONTENT_HEIGHT_PX;
    const heroFlowPx     = window.innerHeight * 0.33;
    const engagementY    = heroFlowPx - mastheadHeight;

    if (window.scrollY < engagementY) {
      window.scrollTo({ top: engagementY, behavior: "smooth" });
    }
  }, [drawerOpen]);

  const isHome  = pathname === "/";
  const isSaved = pathname === "/flagged";
  const q       = searchParams.get("q") ?? "";

  // Receive shared mall scope from URL — session 109 behavior preserved.
  useEffect(() => {
    if (malls.length === 0) return;
    const slugParam = searchParams.get("mall");
    if (!slugParam) return;
    const target = malls.find((m) => m.slug === slugParam);
    if (!target) return;
    if (target.id !== mallId) {
      setMallId(target.id);
      track("filter_applied", {
        filter_type:  "mall",
        filter_value: target.slug,
        page:         pathname,
        source:       "shared_url",
      });
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mall");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [malls, searchParams, pathname]);

  const selectedMall = mallId
    ? malls.find((m) => m.id === mallId) ?? null
    : null;
  const mallName = selectedMall ? selectedMall.name : "All Kentucky locations";

  return (
    <>
      {/* HOME chrome — sticky-collapsing photo hero + sibling sticky logo */}
      {isHome && (
        <>
          <HomeHero />
          <img
            src={WORDMARK_URL}
            alt="Treehouse Finds"
            style={{
              display:       "block",
              width:         LOGO_WIDTH_DEFAULT_PX,
              height:        "auto",
              marginLeft:    "auto",
              marginRight:   "auto",
              marginTop:     LOGO_NATURAL_OFFSET,
              marginBottom:  0,
              position:      "sticky",
              top:           LOGO_STICKY_TOP,
              zIndex:        LOGO_Z,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* SAVED chrome — universal masthead strip from rest (no scroll
          transition). fadeTarget = v2.bg.tabs so masthead's bottom fade
          lands on (tabs)/-surface bg cleanly. */}
      {isSaved && <StickyMasthead fadeTarget={v2.bg.tabs} />}

      {/* Floating Back overlay — Home + drawer-open only. Q2 lock. */}
      {drawerOpen && (
        <div
          style={{
            position: "fixed",
            top:      OVERLAY_TOP,
            left:     OVERLAY_X,
            zIndex:   OVERLAY_Z,
          }}
        >
          <MastheadBackButton onClick={closeDrawer} />
        </div>
      )}

      {/* Floating Profile overlay — universal Home + Saved. Q1 lock. */}
      <div
        style={{
          position: "fixed",
          top:      OVERLAY_TOP,
          right:    OVERLAY_X,
          zIndex:   OVERLAY_Z,
        }}
      >
        <MastheadProfileButton />
      </div>

      {/* Chip + drawer — Home only. Chip overlays masthead bottom 30px
          per chrome-unification design D5. */}
      {isHome && (
        <MallPickerChip
          mallName={mallName}
          onTap={() => {
            track("home_strip_tapped", {
              mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
            });
            toggleDrawer();
          }}
        />
      )}

      {isHome && <MallMapDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        malls={malls}
        selectedMallId={mallId}
        query={q}
        onMallPick={(id) => {
          setMallId(id);
          closeDrawer();
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         pathname,
            source:       "map_pin",
          });
        }}
        onClear={() => {
          setMallId(null);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: "all",
            page:         pathname,
            source:       "map_reset",
          });
        }}
        onMallSearchPick={(id) => {
          setMallId(id);
          closeDrawer();
          router.replace("/", { scroll: false });
          const picked = malls.find((m) => m.id === id);
          track("filter_applied", {
            filter_type:  "mall",
            filter_value: picked?.slug ?? id,
            page:         pathname,
            source:       "search_mall_match",
          });
        }}
      />}
    </>
  );
}
