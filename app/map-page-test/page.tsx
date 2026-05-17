// app/map-page-test/page.tsx
// Session 178 F2 Arc 1.1 — Map page extraction smoke-test page.
//
// Mounts <MapPageBody> in isolation against real Mapbox tiles + 3 mock malls
// so the Frame A bordered window geometry can be tap-tested on Vercel preview
// before consumer wiring lands in Arc 1.2 (real /map page).
//
// Pattern mirrors /postcard-test (R10 session 107), /search-bar-test (R16
// session 102), /geolocation-test (R17 session 118), /vendors-test (Arc 4
// session 125) — primitive-isolated validation first per
// `feedback_testbed_first_for_ai_unknowns` ✅ Promoted (now generalized
// beyond AI-unknowns to ANY primitive-in-isolation validation, per session
// 125 NEW observation).
//
// Validates:
//   - Frame A bordered window (1px v2.border.medium + 14px radius + drop shadow)
//   - 14px page padding around the window (top/left/right)
//   - MapControlPill anchored top-right INSIDE the window (D14)
//   - TreehouseMap fitBounds across 3 mock malls
//   - Pin tap → console.log + render PinCallout above pin
//   - Empty map tap → console.log + clear peek
//   - Callout commit → console.log
//   - Reset → console.log + bump resetKey + clear peek
//
// Mounts only MapPageBody — MapCarousel is page-level sibling per D15
// (Arc 1.2 ships the full /map page composition with MallStrip + MapCarousel).
//
// Delete or repurpose once Arc 2 + Arc 3 wire the production /map route.

"use client";

import * as React from "react";
import MapPageBody from "@/components/MapPageBody";
import { v2, FONT_SYS } from "@/lib/tokens";
import type { Mall } from "@/types/treehouse";

// 3 mock malls spread across KY so fitBounds has a visible bounding box.
// Real coords from production add-mall.ts seeds.
const MOCK_MALLS: Mall[] = [
  {
    id:               "mock-aam",
    slug:             "americas-antique-mall",
    name:             "America's Antique Mall",
    city:             "Louisville",
    state:            "KY",
    address:          "13029 Shelbyville Rd",
    latitude:         38.2249,
    longitude:        -85.5710,
    status:           "active",
    activated_at:     new Date().toISOString(),
    hero_image_url:   null,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
  {
    id:               "mock-kth",
    slug:             "kentucky-treehouse",
    name:             "Kentucky Treehouse",
    city:             "Frankfort",
    state:            "KY",
    address:          "100 Capital Plaza Dr",
    latitude:         38.2009,
    longitude:        -84.8733,
    status:           "active",
    activated_at:     new Date().toISOString(),
    hero_image_url:   null,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
  {
    id:               "mock-caf",
    slug:             "copper-awning-flea-market",
    name:             "Copper Awning Flea Market",
    city:             "Lexington",
    state:            "KY",
    address:          "200 Mill St",
    latitude:         38.0406,
    longitude:        -84.5037,
    status:           "active",
    activated_at:     new Date().toISOString(),
    hero_image_url:   null,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  },
];

export default function MapPageTestPage() {
  const [selectedMallId, setSelectedMallId] = React.useState<string | null>(null);
  const [peekedMallId,   setPeekedMallId]   = React.useState<string | null>(null);
  const [resetKey,       setResetKey]       = React.useState(0);

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     v2.bg.tabs,
        display:        "flex",
        flexDirection:  "column",
        maxWidth:       430,
        margin:         "0 auto",
      }}
    >
      {/* Stand-in for masthead + MallStrip so the bordered window has
          visual context for placement evaluation. Real chrome lands at
          Arc 1.2 in the production /map route. */}
      <div
        style={{
          padding:    "16px 18px",
          fontFamily: FONT_SYS,
          fontSize:   13,
          color:      v2.text.secondary,
          borderBottom: `1px solid ${v2.border.light}`,
        }}
      >
        /map-page-test &mdash; scope:{" "}
        <strong style={{ color: v2.text.primary }}>
          {selectedMallId
            ? MOCK_MALLS.find((m) => m.id === selectedMallId)?.name ?? selectedMallId
            : "all-kentucky"}
        </strong>
        {peekedMallId && (
          <>
            {" "}&middot; peeked:{" "}
            <strong style={{ color: v2.text.primary }}>
              {MOCK_MALLS.find((m) => m.id === peekedMallId)?.name ?? peekedMallId}
            </strong>
          </>
        )}
      </div>

      <MapPageBody
        malls={MOCK_MALLS}
        selectedMallId={selectedMallId}
        peekedMallId={peekedMallId}
        resetKey={resetKey}
        onPinTap={(id) => {
          // eslint-disable-next-line no-console
          console.log("[map-page-test] onPinTap", id);
          setPeekedMallId(id);
        }}
        onMapTap={() => {
          // eslint-disable-next-line no-console
          console.log("[map-page-test] onMapTap");
          setPeekedMallId(null);
        }}
        onCommit={(id) => {
          // eslint-disable-next-line no-console
          console.log("[map-page-test] onCommit", id);
          setSelectedMallId(id);
          setPeekedMallId(null);
        }}
        onReset={() => {
          // eslint-disable-next-line no-console
          console.log("[map-page-test] onReset");
          setSelectedMallId(null);
          setPeekedMallId(null);
          setResetKey((n) => n + 1);
        }}
      />

      {/* Bottom safe-area filler stands in for the page-level MapCarousel
          (D15) so the bordered window has a visual bottom edge to meet
          during Arc 1.1 isolation testing. Real carousel lands at Arc 1.2. */}
      <div
        style={{
          height:        134,
          background:    v2.bg.main,
          borderTop:     `1px solid ${v2.border.medium}`,
          boxShadow:     "0 -2px 6px rgba(42,26,10,0.06)",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          fontFamily:    FONT_SYS,
          fontSize:      12,
          color:         v2.text.muted,
        }}
      >
        MapCarousel stand-in (real carousel lands at Arc 1.2)
      </div>
    </div>
  );
}
