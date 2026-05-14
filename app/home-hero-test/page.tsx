// app/home-hero-test/page.tsx
// Arc 1.3 smoke route for <HomeHero> primitive.
//
// Mounts HomeHero in isolation against stateful searchQuery so iPhone QA
// can validate the Frame C composition (33vh hero + embedded SearchBar
// at 52px from hero bottom + cream-fade overlay + baked-in wordmark
// from /public/home-hero.png) BEFORE the (tabs)/layout.tsx adoption
// lands in Arc 3.
//
// Design record: docs/home-hero-design.md.
//
// Per feedback_testbed_first_for_ai_unknowns ✅ Promoted (7th cumulative
// firing after postcard-test / search-bar-test / geolocation-test /
// vendors-test / ui-test / home-chrome-test). Primitive-isolation
// pattern: ship + validate the shape standalone, THEN wire consumers
// in the next arc. Reduces blast radius of design-record reversal
// cycles to a smoke route.
//
// Below the hero: a stateful echo of the debounced searchQuery + filler
// content so iPhone QA can scroll past the hero and verify D5 (hero
// scrolls away with feed; BottomNav-equivalent absent here since
// smoke route doesn't mount layout chrome).

"use client";

import * as React from "react";
import HomeHero from "@/components/HomeHero";
import { v2, FONT_INTER } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default function HomeHeroTestPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <main
      style={{
        minHeight:     "100vh",
        background:    v2.bg.main,
        paddingBottom: 80,
      }}
    >
      <HomeHero
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div
        style={{
          padding:      "24px 18px",
          fontFamily:   FONT_INTER,
          fontSize:     14,
          color:        v2.text.primary,
          maxWidth:     430,
          margin:       "0 auto",
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          /home-hero-test
        </h1>
        <p style={{ marginBottom: 16, color: v2.text.secondary, fontSize: 13, lineHeight: 1.6 }}>
          Smoke route for <code>&lt;HomeHero&gt;</code> primitive. Type in the search bar to verify debounced fan-out; scroll past the hero to verify it scrolls away cleanly with the page (D5).
        </p>

        <div
          style={{
            padding:      "12px 16px",
            background:   v2.surface.card,
            border:       `1px solid ${v2.border.light}`,
            borderRadius: 8,
            fontSize:     13,
            color:        v2.text.secondary,
            marginBottom: 32,
          }}
        >
          <strong>Debounced query:</strong>{" "}
          {searchQuery === "" ? <em>(empty)</em> : <code>{searchQuery}</code>}
        </div>

        <p style={{ fontSize: 13, color: v2.text.secondary, marginBottom: 12 }}>
          Filler content below — scroll past to confirm hero scrolls away with feed.
        </p>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              padding:      "16px",
              marginBottom: 8,
              background:   v2.surface.card,
              borderRadius: 8,
              border:       `1px solid ${v2.border.light}`,
              fontSize:     13,
              color:        v2.text.secondary,
            }}
          >
            Filler row {i + 1} — placeholder for tile grid that will mount
            below the mall picker chip post-Arc-3.
          </div>
        ))}
      </div>
    </main>
  );
}
