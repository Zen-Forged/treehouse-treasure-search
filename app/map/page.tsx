// app/map/page.tsx
// R10 (session 107) Arc 2 — /map skeleton route.
//
// Chrome-only — TabPageMasthead + PostcardMallCard (all-kentucky scope) +
// SearchBar + paperWarm placeholder body. The full state machine
// (peek-then-commit pin interaction per D26, scope persistence per D23,
// MallSheet wiring on the postcard card) ships in Arc 3 alongside the
// Mapbox provider integration.
//
// Design record: docs/r10-location-map-design.md decisions D22-D27 +
// the /map page-body spec section. V5 mockup at
// docs/mockups/r10-location-map-v5.html.
//
// Why a skeleton ships before Arc 3:
//   1. BottomNav redesign (sub-task 2) needs a real /map route to point
//      at — adding a Map tab to a non-existent route would 404.
//   2. iPhone QA on the chrome layer (postcard card + search bar
//      composition + spacing under TabPageMasthead) is independent of
//      whether a real map is rendered. Locking the chrome here means Arc 3
//      only debates map-rendering choices, not layout.
//
// Per D27: SearchBar onSubmit routes to /?q=<query> — Map stays
// geographic-only, search lives on Home.

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import TabPageMasthead from "@/components/TabPageMasthead";
import PostcardMallCard from "@/components/PostcardMallCard";
import SearchBar from "@/components/SearchBar";
import BottomNav from "@/components/BottomNav";
import { v1, FONT_LORA } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default function MapPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v1.paperCream,
        maxWidth: 430,
        margin: "0 auto",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TabPageMasthead />

      <div style={{ padding: "0 16px" }}>
        <PostcardMallCard
          mall="all-kentucky"
          stampGlyph="map"
          // Arc 2 skeleton — MallSheet wiring lands in Arc 3 alongside the
          // scope state machine. No-op for now.
        />
      </div>

      {/* SearchBar — same primitive + placeholder as Home. Per D27, fires
          onSubmit (Enter) which redirects to Home with the query so search
          stays a Home concern; Map stays geographic. */}
      <div style={{ padding: "12px 22px 14px" }}>
        <SearchBar
          onChange={() => { /* noop — Map only redirects on submit */ }}
          onSubmit={(q) => {
            const trimmed = q.trim();
            router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
          }}
        />
      </div>

      {/* Placeholder map body — paperWarm with literary copy. Replaced in
          Arc 3 by the cartographic warm-cream Mapbox basemap (D25) +
          leaf-bubble pins + peek-callout state machine (D26). */}
      <main
        style={{
          flex: 1,
          margin: "0 16px",
          marginBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
          background: v1.paperWarm,
          border: `1px solid ${v1.inkHairline}`,
          borderRadius: 12,
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT_LORA,
            fontStyle:  "italic",
            fontSize:   16,
            color:      v1.inkMuted,
            lineHeight: 1.55,
            maxWidth:   280,
          }}
        >
          A cartographic view of every treehouse in Kentucky lands here in
          the next sprint — leaf pins on a warm-cream basemap, tap to peek a
          location, tap again to scout it.
        </div>
      </main>

      {/* BottomNav doesn't yet support active="map" — sub-task 2 lands the
          redesign. For now no tab is highlighted on this page. */}
      <BottomNav active={null} />
    </div>
  );
}
