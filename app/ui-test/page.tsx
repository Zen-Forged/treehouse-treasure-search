// app/ui-test/page.tsx
// Layer 2 primitive testbed — smoke route for components/ui/* primitives.
// Mirrors /postcard-test (session 107) + /search-bar-test (session 102) +
// /geolocation-test (session 118) + /vendors-test (session 125) precedent:
// each primitive mounts in isolation against canonical fixture data so the
// primitive's contract is testable without dragging in consumer wiring.
//
// Adoption strategy: each <BottomSheet>, <SlimHeader>, <ChannelGrid> etc.
// gets its own <section> with toggleable props. The page itself is not a
// production surface and can carry slightly looser canonical-scale
// adherence in its own chrome.

"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SlimHeader } from "@/components/ui/SlimHeader";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";

export default function UiTestPage() {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [closeDisabled, setCloseDisabled] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: v2.bg.main,
        padding: 24,
        fontFamily: FONT_INTER,
        color: v2.text.primary,
      }}
    >
      <h1
        style={{
          fontFamily: FONT_CORMORANT,
          fontSize: 28,
          fontWeight: 500,
          lineHeight: 1.3,
          marginBottom: 8,
          color: v2.text.primary,
        }}
      >
        Layer 2 primitive testbed
      </h1>
      <p
        style={{
          fontSize: 14,
          color: v2.text.secondary,
          marginBottom: 24,
          lineHeight: 1.4,
          maxWidth: 540,
        }}
      >
        Smoke route for <code>components/ui/*</code> primitives. Mount each
        primitive in isolation, toggle its props, verify the contract before
        wiring real consumers. Not a production surface.
      </p>

      {/* ─── <BottomSheet> ───────────────────────────────────────────── */}
      <section
        style={{
          padding: 16,
          background: v2.surface.card,
          border: `1px solid ${v2.border.light}`,
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.3,
            marginBottom: 4,
            color: v2.text.primary,
          }}
        >
          {"<BottomSheet>"}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: v2.text.secondary,
            marginBottom: 16,
            lineHeight: 1.4,
          }}
        >
          Modal scrim + sheet container + handle pill + TopBar. Body scroll
          locks while open. Backdrop click closes unless closeDisabled.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: v2.text.secondary }}>
            <input
              type="checkbox"
              checked={showBack}
              onChange={e => setShowBack(e.target.checked)}
            />
            showBack
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, color: v2.text.secondary }}>
            <input
              type="checkbox"
              checked={closeDisabled}
              onChange={e => setCloseDisabled(e.target.checked)}
            />
            closeDisabled <span style={{ color: v2.text.muted }}>(locks close button + backdrop click)</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setBottomSheetOpen(true)}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 999,
            background: v2.accent.green,
            color: v2.surface.card,
            fontFamily: FONT_INTER,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Open BottomSheet
        </button>
      </section>

      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        ariaLabel="BottomSheet primitive testbed"
        showBack={showBack}
        onBack={() => alert("Back tapped — real consumer would advance state machine here")}
        closeDisabled={closeDisabled}
      >
        <div style={{ paddingTop: 16, paddingBottom: 16, textAlign: "center" }}>
          <h3
            style={{
              fontFamily: FONT_CORMORANT,
              fontSize: 28,
              fontWeight: 500,
              lineHeight: 1.3,
              color: v2.text.primary,
              marginBottom: 8,
            }}
          >
            Hello from BottomSheet
          </h3>
          <p
            style={{
              fontFamily: FONT_INTER,
              fontSize: 13,
              color: v2.text.secondary,
              lineHeight: 1.5,
            }}
          >
            Backdrop click closes me. Body scroll is locked. Try toggling
            showBack / closeDisabled before opening to verify both states.
          </p>
        </div>
      </BottomSheet>

      {/* ─── <SlimHeader> ────────────────────────────────────────────── */}
      <section
        style={{
          padding: 16,
          background: v2.surface.card,
          border: `1px solid ${v2.border.light}`,
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize: 20,
            fontWeight: 500,
            lineHeight: 1.3,
            marginBottom: 4,
            color: v2.text.primary,
          }}
        >
          {"<SlimHeader>"}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: v2.text.secondary,
            marginBottom: 16,
            lineHeight: 1.4,
          }}
        >
          Entity-discriminated context block — 3 variants from the same
          primitive via optional <code>boothPill</code> /{" "}
          <code>contextLabel</code> / <code>addressLine</code> /{" "}
          <code>titleClamp</code> props.
        </p>

        {/* Booth variant */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: v2.text.muted,
              marginBottom: 4,
            }}
          >
            Booth variant
          </div>
          <SlimHeader
            title="Ella's Finds"
            boothPill="A12"
            contextLabel="America's Antique Mall"
            addressLine="3551 South Park Ave, Louisville, KY 40217"
          />
        </div>

        {/* Mall variant */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: v2.text.muted,
              marginBottom: 4,
            }}
          >
            Mall variant
          </div>
          <SlimHeader
            title="America's Antique Mall"
            contextLabel="Louisville, KY"
            addressLine="3551 South Park Ave, Louisville, KY 40217"
          />
        </div>

        {/* All-Kentucky mall scope */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: v2.text.muted,
              marginBottom: 4,
            }}
          >
            All-Kentucky scope (no address)
          </div>
          <SlimHeader
            title="Treehouse Finds Kentucky"
            contextLabel="Kentucky's antique mall network"
          />
        </div>

        {/* Find variant — title clamped to 2 lines (verify descender clearance
            on a long title with descenders in line 2). */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: v2.text.muted,
              marginBottom: 4,
            }}
          >
            Find variant (titleClamp=2 — descender clearance check on
            <code> g j p y</code>)
          </div>
          <SlimHeader
            title="Vintage brass paperweight with engraved geographic typography"
            titleClamp={2}
            boothPill="B07"
            contextLabel="Penny's Postcards"
            addressLine="America's Antique Mall, Louisville"
          />
        </div>
      </section>
    </main>
  );
}
