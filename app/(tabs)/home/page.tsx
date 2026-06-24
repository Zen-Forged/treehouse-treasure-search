// app/(tabs)/home/page.tsx
// Home Hub — Arc 1 scaffold (docs/home-hub-design.md).
//
// Arc 1 is route + nav scaffold only: a centered-wordmark masthead + a
// deliberate placeholder body so tapping the new Home tab lands somewhere
// intentional, not broken. The real composition lands next:
//   Arc 2 — <HeroCard> + <AdvantageGrid> + <NearbyLocationCard>/rail +
//           <VendorCtaCard> + <HubMasthead>, built in isolation on a
//           /home-hub-test smoke route.
//   Arc 3 — wire getActiveMalls + mall stats + useUserLocation distance,
//           assemble the page.
//   Arc 4 — dials (hero weight, hub bg token, Coming-Soon label) + iPhone QA.
//
// TabsChrome early-returns null on /home (components/TabsChrome.tsx) so the
// (tabs)/ HomeHero stack doesn't render — the hub owns its chrome, same as
// /map. BottomNav + the layout's outer wrapper (bg/maxWidth) still apply.

"use client";

import { v2, FONT_CORMORANT, FONT_INTER } from "@/lib/tokens";

export default function HomeHubPage() {
  return (
    <div
      style={{
        display:       "flex",
        flexDirection: "column",
        flex:          1,
        minHeight:     "100vh",
        // Reserve space above the floating BottomNav (matches the feed page).
        paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
      }}
    >
      {/* HubMasthead placeholder — Arc 2 formalizes this as <HubMasthead>
          (centered wordmark + sub-brand + profile bubble). */}
      <header
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          paddingTop:     "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom:  10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/wordmark.png" alt="Treehouse Finds" style={{ height: 40, width: "auto" }} />
        <div
          style={{
            fontFamily:    FONT_INTER,
            fontSize:      9.5,
            fontWeight:    700,
            letterSpacing: "0.22em",
            color:         v2.text.secondary,
            marginTop:     5,
          }}
        >
          LOCAL FINDS · REAL TREASURES
        </div>
      </header>

      {/* Deliberate placeholder body */}
      <div
        style={{
          flex:           1,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          textAlign:      "center",
          padding:        "0 32px",
          gap:            10,
        }}
      >
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle:  "italic",
            fontWeight: 600,
            fontSize:   27,
            lineHeight: 1.15,
            color:      v2.text.primary,
          }}
        >
          Your hub is coming together.
        </div>
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize:   13,
            lineHeight: 1.5,
            color:      v2.text.muted,
            maxWidth:   290,
          }}
        >
          The hero, the Treehouse Advantage, nearby locations, and the vendor
          invite land here next.
        </div>
      </div>
    </div>
  );
}
