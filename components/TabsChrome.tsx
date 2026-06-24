// components/TabsChrome.tsx
// Session 166 Arc 3.1.2 — orchestrator for the new (tabs)/ chrome stack
// per session 164 design record (docs/home-hero-design.md).
//
// Session 183 F2 Shape B — Base chrome (no URL deps) split out from
// URL-aware code. Renders OUTSIDE the layout's Suspense boundary so the
// floating chrome stack (HomeHero photo + cream-fade overlay + Profile
// overlay + MallPickerChip) paints synchronously on warm-nav from
// /find/[id] → /. URL-aware code now lives in:
//   - <SearchBarSlot> inside HomeHero (own Suspense boundary; URL hydration
//     contained to the bottom-anchored 16px SearchBar slot)
//   - <MallParamReceiver> sibling component (own Suspense boundary in
//     layout; runs ?mall= intake side-effect)
//
// David's session 182 iPhone QA finding 2 root cause: prior TabsChrome
// called useSearchParams at the orchestrator level. (tabs)/layout.tsx
// wrapped TabsChrome in <Suspense fallback={null}>. On warm-nav from
// /find/[id] (outside (tabs)/ route group) back to /, the layout re-
// mounted → TabsChrome suspended on URL hydration → null fallback paints
// → entire floating chrome stack invisible until URL hydrated. Screenshot
// surfaced: tiles painted (page body unaffected) but cream/empty space
// where chrome should be.
//
// Shape B addresses root cause by removing useSearchParams from the
// orchestrator entirely. pathname routing (usePathname does NOT force
// Suspense bailout), useSavedMallId (localStorage hook), and
// useActiveMalls (module-scope cache + hydration hook) all run
// synchronously on warm-nav with cached values.

"use client";

import { useRouter, usePathname } from "next/navigation";
import HomeHero from "@/components/HomeHero";
import MallPickerChip from "@/components/MallPickerChip";
import MastheadProfileButton from "@/components/MastheadProfileButton";
import MastheadBackButton from "@/components/MastheadBackButton";
import StickyMasthead from "@/components/StickyMasthead";
import { useSavedMallId } from "@/lib/useSavedMallId";
import { useActiveMalls } from "@/lib/cachedMalls";
import { track } from "@/lib/clientEvents";

// Session 166 Shape A — floating chrome affordances (Profile right /
// optional Back left when drawer open) overlay the hero photo as
// position:fixed at top of viewport. Restores access lost when Arc 3.1.3
// retired StickyMasthead from (tabs)/ chrome.
//
// Session 166 round-6 dial — viewport-y + horizontal-x match
// StickyMasthead exactly. See file-top of prior version for full lineage.
const OVERLAY_TOP    = "calc(max(14px, env(safe-area-inset-top, 14px)) + 14px)";
const OVERLAY_X      = 18;
const OVERLAY_Z      = 50;

export default function TabsChrome() {
  const pathname = usePathname();
  const router   = useRouter();

  const [mallId] = useSavedMallId();
  const malls    = useActiveMalls();

  const isHome   = pathname === "/";
  const showChip = isHome;

  // Derive picker chip's identity from malls + current mallId. Stale id
  // OR null → "All Kentucky locations" (canonical all-scope label).
  const selectedMall = mallId
    ? malls.find((m) => m.id === mallId) ?? null
    : null;
  const mallName = selectedMall ? selectedMall.name : "All Kentucky locations";

  // Session 178 F2 Arc 1.2 — /map renders its own chrome (StickyMasthead +
  // MallPickerChip + MapPageBody + MapCarousel) since the (tabs)/ HomeHero
  // pattern doesn't apply on the map page (no hero photo, standard masthead
  // per D9 + D10). TabsChrome early-returns null on /map.
  // Session 205 — /home hub chrome = the shared <StickyMasthead> (David QA
  // dial: "keep the treehouse logo the same size and position as the flagged
  // tab" + "remove LOCAL FINDS · REAL TREASURES"). Same wordmark (72px) as
  // /flagged, profile right, no back button (the hub is the entry/start_url
  // landing). Replaces the Arc-2 custom HubMasthead (retired).
  if (pathname === "/home") {
    return <StickyMasthead right={<MastheadProfileButton />} />;
  }

  if (pathname === "/map") return null;

  // Session 182 — Saved chrome restructure. Replace HomeHero (33vh
  // background-image identity beat) with the slim <StickyMasthead> pattern
  // /me + /map + /find/[id] + /shelf use. BOUNDED REVERSAL of session 175
  // Option α + session 121 R18 D-lock per feedback_surface_locked_design_
  // reversals ✅ Promoted. bg prop omitted — StickyMasthead defaults to
  // v2.bg.main (#E6DECF) which matches Saved's page bg (v2.bg.tabs, same
  // hex per session 166 dial 8 tier extraction).
  if (pathname === "/flagged") {
    return (
      <StickyMasthead
        left={<MastheadBackButton fallback="/" />}
        right={<MastheadProfileButton />}
      />
    );
  }

  return (
    <>
      <HomeHero
        // Session 183 — simplified prop. HomeHero internalizes SearchBar's
        // URL state via its own Suspense boundary; caller only signals
        // "show search slot" via showSearch flag.
        showSearch={isHome}
      />

      {/* Session 166 Shape A commit 1 — Profile chrome affordance restored
          as floating overlay at top-right of viewport. Arc 3.1.3 retired
          StickyMasthead from (tabs)/ which also retired the masthead-right
          Profile slot. Session 182 — Profile overlay is Home-only since
          Saved branch returns above with StickyMasthead.

          Session 198 C4 — wrapped in a centered max-width:430 container
          mirroring StickyMasthead's structure (line ~166 of
          StickyMasthead.tsx) so the Profile bubble anchors to the right
          of the 430px content column on desktop instead of the full
          viewport edge. Per David's session 198 QA: "the profile button
          on the home screen ... extends all the way to the right of the
          screen on desktop." pointerEvents:none on the wrapper so empty
          area to the left of the bubble passes taps through to the
          content underneath; pointerEvents:auto on the inner positioner
          so the bubble itself stays tappable. */}
      <div
        style={{
          position:      "fixed",
          top:           OVERLAY_TOP,
          left:          "50%",
          transform:     "translateX(-50%)",
          width:         "100%",
          maxWidth:      430,
          zIndex:        OVERLAY_Z,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position:      "absolute",
            top:           0,
            right:         OVERLAY_X,
            pointerEvents: "auto",
          }}
        >
          <MastheadProfileButton />
        </div>
      </div>

      {showChip && (
        <MallPickerChip
          mallName={mallName}
          onTap={() => {
            // Session 154 home_strip_tapped event preserved verbatim;
            // session 178 F2 Arc 3.1 — handler routes to /map per D1.
            track("home_strip_tapped", {
              mall_slug: selectedMall ? selectedMall.slug : "all-kentucky",
            });
            router.push("/map");
          }}
        />
      )}
    </>
  );
}
