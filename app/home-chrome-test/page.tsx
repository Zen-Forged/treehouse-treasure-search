// app/home-chrome-test/page.tsx
// Session 154 — Arc 1.4 smoke route for <MallStrip> + <MallMapDrawer>
// primitives. Mounts both in isolation against fixture data so iPhone QA
// can validate the structural shape (40px strip pinned below masthead +
// click-to-expand bottom drawer at ~60vh + map control pill + MallSheet
// picker) BEFORE the production consumer wiring lands in Arc 2.
//
// Design record: docs/home-chrome-restructure-design.md.
//
// Per feedback_testbed_first_for_ai_unknowns (✅ Promoted, 6th cumulative
// firing after postcard-test / search-bar-test / geolocation-test /
// vendors-test / ui-test). Primitive-isolation pattern: ship + validate
// the shape standalone, THEN wire consumers in the next arc. Reduces
// blast radius of design-record reversal cycles to a smoke route.
//
// Scope picker at top toggles between FIXTURE_MALL and "all-kentucky" so
// both strip states + both pill states (Clear / List view) are testable
// in one place. The fake masthead block above the strip simulates the
// production layering so the strip's position:fixed top:MASTHEAD_HEIGHT
// reads against the right vertical offset.

"use client";

import * as React from "react";
import { track } from "@/lib/clientEvents";
import MallStrip, { type MallStripScope } from "@/components/MallStrip";
import MallMapDrawer from "@/components/MallMapDrawer";
import StickyMasthead from "@/components/StickyMasthead";
import { v2, FONT_INTER } from "@/lib/tokens";
import { FIXTURE_MALL, FIXTURE_MALLS } from "@/lib/fixtures";

export const dynamic = "force-dynamic";

type ScopeKey = "all-kentucky" | "fixture-mall";

export default function HomeChromeTestPage() {
  const [scopeKey, setScopeKey] = React.useState<ScopeKey>("fixture-mall");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const stripScope: MallStripScope =
    scopeKey === "all-kentucky"
      ? "all-kentucky"
      : { id: FIXTURE_MALL.id, slug: FIXTURE_MALL.slug, name: FIXTURE_MALL.name };

  const selectedMallId = scopeKey === "all-kentucky" ? null : FIXTURE_MALL.id;

  return (
    <main
      style={{
        minHeight:     "100vh",
        background:    v2.bg.main,
        // padding-top reserves masthead (85px from safe-area + 14px paddingTop
        // = 99px total) + strip (40px) = 139px of fixed chrome.
        paddingTop:    "calc(max(14px, env(safe-area-inset-top, 14px)) + 85px + 40px)",
        paddingBottom: 120,
      }}
    >
      <StickyMasthead />
      <MallStrip
        mall={stripScope}
        isOpen={drawerOpen}
        onTap={() => {
          // Fire the canonical analytics event per design record D12 so the
          // smoke route exercises the full track() path before production
          // consumer wires the same shape. Fires on every tap (open + close)
          // — D-Reversal-2 iteration 2 made strip's tap a toggle since the
          // drawer's close button retired.
          track("home_strip_tapped", {
            mall_slug: scopeKey === "all-kentucky" ? "all-kentucky" : FIXTURE_MALL.slug,
          });
          setDrawerOpen((prev) => !prev);
        }}
      />

      {/* Test controls — not part of the production chrome. Lets QA flip
          scope state to validate strip + pill behavior in both shapes. */}
      <div
        style={{
          padding:      "24px 16px",
          fontFamily:   FONT_INTER,
          fontSize:     14,
          color:        v2.text.primary,
          maxWidth:     430,
          margin:       "0 auto",
        }}
      >
        <h1
          style={{
            fontSize:     16,
            fontWeight:   600,
            marginBottom: 8,
          }}
        >
          /home-chrome-test
        </h1>
        <p style={{ marginBottom: 16, color: v2.text.secondary, fontSize: 13, lineHeight: 1.6 }}>
          Smoke route for Arc 1 primitives. Tap strip → drawer opens. Pin tap → callout. Callout tap → drawer closes + scope commits.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => setScopeKey("fixture-mall")}
            style={{
              padding:      "8px 14px",
              borderRadius: 10,
              border:       `1px solid ${v2.border.light}`,
              background:   scopeKey === "fixture-mall" ? v2.accent.green : v2.surface.card,
              color:        scopeKey === "fixture-mall" ? "#f5ecd8" : v2.text.primary,
              fontFamily:   FONT_INTER,
              fontSize:     13,
              fontWeight:   500,
              cursor:       "pointer",
            }}
          >
            Mall scope
          </button>
          <button
            type="button"
            onClick={() => setScopeKey("all-kentucky")}
            style={{
              padding:      "8px 14px",
              borderRadius: 10,
              border:       `1px solid ${v2.border.light}`,
              background:   scopeKey === "all-kentucky" ? v2.accent.green : v2.surface.card,
              color:        scopeKey === "all-kentucky" ? "#f5ecd8" : v2.text.primary,
              fontFamily:   FONT_INTER,
              fontSize:     13,
              fontWeight:   500,
              cursor:       "pointer",
            }}
          >
            All-Kentucky scope
          </button>
        </div>

        <div style={{ fontSize: 12, color: v2.text.muted, lineHeight: 1.7 }}>
          <p><strong>Strip state:</strong> {scopeKey === "fixture-mall" ? FIXTURE_MALL.name : "All Kentucky locations"}</p>
          <p><strong>Drawer state:</strong> {drawerOpen ? "open" : "closed"}</p>
          <p><strong>Selected mall ID:</strong> {selectedMallId ?? "null (all-Kentucky)"}</p>
          <p><strong>Expected pill:</strong> {scopeKey === "all-kentucky" ? '"List view" (opens MallSheet picker)' : '"Clear" (sets scope=null, drawer stays open)'}</p>
        </div>

        {/* Filler content to validate strip stays pinned during scroll —
            the canonical "context loss on scroll" test from D-Reversal-1. */}
        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 13, color: v2.text.secondary, marginBottom: 12 }}>
            Filler content below — scroll to verify strip stays pinned at top.
          </p>
          {Array.from({ length: 30 }).map((_, i) => (
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
              Filler row {i + 1} — scroll past to confirm the strip persists.
            </div>
          ))}
        </div>
      </div>

      <MallMapDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        malls={FIXTURE_MALLS}
        selectedMallId={selectedMallId}
        onMallPick={(id) => {
          // Production consumer would setMallId(id) via useSavedMallId hook +
          // fire filter_applied analytics + scroll-to-top. Smoke route just
          // mirrors the scope locally so the strip updates visibly.
          if (id === FIXTURE_MALL.id) {
            setScopeKey("fixture-mall");
          } else {
            // FIXTURE_MALL_2 picked — for smoke purposes, treat as scope set
            // (we only have one named "active" state in this test page).
            setScopeKey("fixture-mall");
          }
          setDrawerOpen(false);
        }}
        onClear={() => {
          setScopeKey("all-kentucky");
          // Drawer stays open per D2 contract.
        }}
      />
    </main>
  );
}
