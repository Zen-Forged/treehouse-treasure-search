// app/saved-v2-test/page.tsx
//
// v2 Arc 1.2 — Smoke route for the Saved page v2 primitives in isolation.
// Validates SavedMallCardV2 + AccordionBoothSection + SavedFindRow +
// StarFavoriteBubble + FoundCheckCircle + SavedEmptyState against mocked
// data BEFORE wiring production /flagged consumers in Arc 1.4.
//
// Pattern: testbed-first per feedback_testbed_first_for_ai_unknowns
// (cumulative 5+ firings — postcard-test, search-bar-test, geolocation-test,
// vendors-test, now saved-v2-test). Mostly kept as live-debugging surface
// post-ship; retirement-not-urgent.
//
// Mock data shape mirrors the production data contract:
//   - 2 malls (Middletown with distance 2.9 MI; Lexington without distance
//     to test pill-hidden-when-null behavior per session-139 Q2 (a))
//   - 2 booths per mall; D2 (a) defaults all expanded
//   - 3 finds in expanded booth + 0 finds in collapsed-on-tap state
//   - 1 find pre-marked ✓ Found to demo filled-circle visual
//
// Local React state for found-marks + saves — Arc 1.3 wires the real
// localStorage hooks. ★ Favorite Mall retired on Saved per session-139
// Q1 (a) reversal of session-138 Q6 (a); ★ moves to Home + Map's
// RichPostcardMallCard in v2 Arc 5. Empty-state preview toggle at top.
"use client";

import { useState } from "react";
import Link from "next/link";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import SavedMallCardV2 from "@/components/v2/SavedMallCardV2";
import AccordionBoothSection from "@/components/v2/AccordionBoothSection";
import SavedFindRow from "@/components/v2/SavedFindRow";
import SavedEmptyState from "@/components/v2/SavedEmptyState";

// ─────────────────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────────────────

interface MockFind {
  id: string;
  title: string;
  priceCents: number;
  imageGradient: string;
}

interface MockBooth {
  number: string;
  name: string;
  vendorSlug: string;
  finds: MockFind[];
}

interface MockMall {
  id: string;
  name: string;
  address: string;
  distanceMi: number | null;
  booths: MockBooth[];
}

const MALLS: MockMall[] = [
  {
    id: "middletown",
    name: "Middletown Peddler's Mall",
    address: "12405 Shelbyville Rd, Louisville, KY 40243",
    distanceMi: 2.9,
    booths: [
      {
        number: "214",
        name: "Yesterday's Memories",
        vendorSlug: "yesterdays-memories",
        finds: [
          {
            id: "copper-kettle",
            title: "Copper Kettle",
            priceCents: 2800,
            imageGradient:
              "linear-gradient(135deg, #c9a96e 0%, #8a6a3e 100%)",
          },
          {
            id: "brass-vase",
            title: "Brass Vase",
            priceCents: 3500,
            imageGradient:
              "linear-gradient(135deg, #b89968 0%, #7a5a3a 100%)",
          },
          {
            id: "vintage-camera",
            title: "Vintage Camera",
            priceCents: 2200,
            imageGradient:
              "linear-gradient(135deg, #5a4838 0%, #2c2218 100%)",
          },
        ],
      },
      {
        number: "317",
        name: "Timeless Treasures",
        vendorSlug: "timeless-treasures",
        finds: [
          {
            id: "landscape-painting",
            title: "Landscape Painting",
            priceCents: 4200,
            imageGradient:
              "linear-gradient(135deg, #8a9a72 0%, #4a5a3a 100%)",
          },
          {
            id: "violin",
            title: "Violin",
            priceCents: 6500,
            imageGradient:
              "linear-gradient(135deg, #6a4530 0%, #3a2818 100%)",
          },
          {
            id: "ceramic-bowl",
            title: "Ceramic Bowl",
            priceCents: 1800,
            imageGradient:
              "linear-gradient(135deg, #e0d5c0 0%, #a89880 100%)",
          },
        ],
      },
    ],
  },
  {
    id: "lexington",
    name: "Lexington Antique Mall",
    address: "1733 Russell Cave Rd, Lexington, KY 40505",
    distanceMi: null, // smoke test for distance-unavailable fallback
    booths: [
      {
        number: "42",
        name: "Heirloom & Co.",
        vendorSlug: "heirloom-and-co",
        finds: [
          {
            id: "oak-chair",
            title: "Oak Side Chair",
            priceCents: 8500,
            imageGradient:
              "linear-gradient(135deg, #8a6a4a 0%, #4a3a2a 100%)",
          },
          {
            id: "porcelain-figurine",
            title: "Porcelain Figurine",
            priceCents: 4400,
            imageGradient:
              "linear-gradient(135deg, #f0e8d8 0%, #c0b8a0 100%)",
          },
        ],
      },
      {
        number: "108",
        name: "Bluegrass Curiosities & More",
        vendorSlug: "bluegrass-curiosities",
        finds: [
          {
            id: "pocket-watch",
            title: "Pocket Watch on Chain",
            priceCents: 12000,
            imageGradient:
              "linear-gradient(135deg, #d4a86c 0%, #8a6438 100%)",
          },
          {
            id: "wool-blanket",
            title: "Hand-woven Wool Blanket",
            priceCents: 9000,
            imageGradient:
              "linear-gradient(135deg, #a86848 0%, #683828 100%)",
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function SavedV2TestPage() {
  // Pre-mark "Brass Vase" as ✓ Found to demo filled-circle visual
  const [foundIds, setFoundIds] = useState<Set<string>>(
    () => new Set(["brass-vase"]),
  );
  // All finds start as saved (this IS the Saved page)
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () =>
      new Set(
        MALLS.flatMap((m) => m.booths.flatMap((b) => b.finds.map((f) => f.id))),
      ),
  );
  const [showEmptyState, setShowEmptyState] = useState(false);

  function toggleFound(id: string) {
    setFoundIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Sort by distance-asc; null distance ranks below (session-139 reversal —
  // favorited-first axis retired alongside ★ retire on Saved per Q1 (a))
  const sortedMalls = [...MALLS].sort((a, b) => {
    if (a.distanceMi !== null && b.distanceMi !== null)
      return a.distanceMi - b.distanceMi;
    if (a.distanceMi !== null) return -1;
    if (b.distanceMi !== null) return 1;
    return 0;
  });

  // Filter booths/finds to only those still saved
  const visibleMalls = sortedMalls
    .map((mall) => ({
      ...mall,
      booths: mall.booths
        .map((booth) => ({
          ...booth,
          finds: booth.finds.filter((f) => savedIds.has(f.id)),
        }))
        .filter((booth) => booth.finds.length > 0),
    }))
    .filter((mall) => mall.booths.length > 0);

  const totalSavedCount = savedIds.size;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: v2.bg.main,
        fontFamily: FONT_INTER,
      }}
    >
      {/* Smoke-route header (not part of production Saved chrome) */}
      <header
        style={{
          padding: "16px 20px",
          background: v2.bg.soft,
          borderBottom: `1px solid ${v2.border.light}`,
        }}
      >
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: v2.accent.green,
            marginBottom: 4,
          }}
        >
          v2 Arc 1.2 · Smoke Route
        </div>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontSize: 22,
            fontWeight: 600,
            color: v2.text.primary,
            marginBottom: 6,
          }}
        >
          Saved v2 Primitives — Isolation Test
        </div>
        <div
          style={{
            fontFamily: FONT_INTER,
            fontSize: 12,
            color: v2.text.secondary,
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          Mocked data + local React state. Saves count: {totalSavedCount}.
          Toggle ✓ on Brass Vase to test ✓ Found state. Tap accordion
          headers to test expand/collapse. Tap leaf bubble to remove a
          find from saves. Lexington has no distance — pill should hide.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowEmptyState((v) => !v)}
            style={{
              fontFamily: FONT_INTER,
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
              background: showEmptyState ? v2.accent.green : v2.surface.warm,
              color: showEmptyState ? "#fff" : v2.text.primary,
              border: `1px solid ${showEmptyState ? v2.accent.green : v2.border.light}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {showEmptyState ? "Show Mall Cards" : "Preview Empty State"}
          </button>
          <button
            type="button"
            onClick={() =>
              setSavedIds(
                new Set(
                  MALLS.flatMap((m) =>
                    m.booths.flatMap((b) => b.finds.map((f) => f.id)),
                  ),
                ),
              )
            }
            style={{
              fontFamily: FONT_INTER,
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
              background: v2.surface.warm,
              color: v2.text.primary,
              border: `1px solid ${v2.border.light}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Restore All Saves
          </button>
          <Link
            href="/"
            style={{
              fontFamily: FONT_INTER,
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 12px",
              background: v2.surface.warm,
              color: v2.text.primary,
              border: `1px solid ${v2.border.light}`,
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main style={{ padding: "16px 16px 64px" }}>
        {showEmptyState || visibleMalls.length === 0 ? (
          <SavedEmptyState exploreHref="/" />
        ) : (
          visibleMalls.map((mall) => {
            const findsInThisMall = mall.booths.reduce(
              (sum, b) => sum + b.finds.length,
              0,
            );
            return (
              <SavedMallCardV2
                key={mall.id}
                mallName={mall.name}
                mallAddress={mall.address}
                distanceMi={mall.distanceMi}
                findsCount={findsInThisMall}
                onGetDirections={() => {
                  // smoke route — no-op; production wires to lib/mapsDeepLink
                  // eslint-disable-next-line no-console
                  console.log("[smoke] Get Directions", mall.name);
                }}
              >
                {mall.booths.map((booth) => (
                  <AccordionBoothSection
                    key={booth.number}
                    boothNumber={booth.number}
                    boothName={booth.name}
                    defaultExpanded
                  >
                    {booth.finds.map((find) => (
                      <SavedFindRow
                        key={find.id}
                        postId={find.id}
                        imageGradient={find.imageGradient}
                        title={find.title}
                        priceCents={find.priceCents}
                        isFound={foundIds.has(find.id)}
                        isSaved={savedIds.has(find.id)}
                        onToggleFound={() => toggleFound(find.id)}
                        onToggleSaved={() => toggleSaved(find.id)}
                        onTapDetail={() => {
                          // smoke route — no-op; production navigates to /find/[id]
                          // eslint-disable-next-line no-console
                          console.log("[smoke] Tap detail", find.title);
                        }}
                      />
                    ))}
                  </AccordionBoothSection>
                ))}
              </SavedMallCardV2>
            );
          })
        )}
      </main>
    </div>
  );
}
