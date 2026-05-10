// components/v2/SavedMallCardV2.tsx
//
// v2 Arc 1.2 (+ session-139 Arc 1.2.5 dial pass) — Saved page mall card.
// Replaces session-121 inline <SavedMallCard> on /flagged (wired in Arc 1.4).
//
// Layout (Frame δ + session-139 reversal of session-138 Q6 (a)):
//   head-δ — CSS grid 1fr/auto columns × auto/auto rows
//     row 1: mall name (Cormorant 24/600)         | DistancePill (when distance)
//     row 2: mall address (Inter 11.5)            | ────── spans both ──────
//   action row: thinner full-width green GET DIRECTIONS button + ↗
//   finds-waiting row: italic Cormorant 15/500 + 🍃 + dashed flankers
//   accordion sections (children)
//
// Reversals from session-138 design record (surfaced in commit body):
//   - ★ Favorite Mall retired on Saved page; lives on Home + Map's
//     RichPostcardMallCard in v2 Arc 5 per session-139 Q1 (a). isFavorite
//     + onToggleFavorite props removed.
//   - DistancePill moved to head-δ top-right (was: standalone eyebrow row
//     above GET DIRECTIONS).
//   - Distance format X.X MI AWAY → X MI (rounded integer, no decimal,
//     no AWAY suffix) per session-139 notes 3 + 5.
//   - DistancePill hidden entirely when no distance (was:
//     "DISTANCE UNAVAILABLE" fallback chrome) per session-139 Q2 (a).
//   - Pill bg #FBF6EA + green text + no outline per session-139 notes 6 + 11.
//   - Sort axis loses favorited-first; mall cards now sort distance-asc
//     (smoke route + Arc 1.4 production wiring).
"use client";

import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";

interface SavedMallCardV2Props {
  mallName: string;
  mallAddress: string;
  distanceMi: number | null;
  findsCount: number;
  onGetDirections: () => void;
  children: React.ReactNode; // accordion sections
}

function formatDistanceLabel(distanceMi: number | null): string | null {
  if (distanceMi === null) return null;
  return `${Math.round(distanceMi)} MI`;
}

export default function SavedMallCardV2({
  mallName,
  mallAddress,
  distanceMi,
  findsCount,
  onGetDirections,
  children,
}: SavedMallCardV2Props) {
  const distanceLabel = formatDistanceLabel(distanceMi);
  const hasDistance = distanceLabel !== null;

  return (
    <article
      style={{
        background: v2.surface.card,
        borderRadius: 14,
        border: `1px solid ${v2.border.light}`,
        boxShadow: "0 1px 2px rgba(43,33,26,0.04)",
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      {/* head-δ — CSS grid: name + DistancePill on row 1; address spans row 2 */}
      <div
        style={{
          padding: "16px 20px 12px",
          display: "grid",
          gridTemplateColumns: hasDistance ? "1fr auto" : "1fr",
          columnGap: hasDistance ? 12 : 0,
          rowGap: 2,
          alignItems: "center",
        }}
      >
        <h2
          style={{
            gridColumn: 1,
            gridRow: 1,
            fontFamily: FONT_CORMORANT,
            fontWeight: 600,
            fontSize: 24,
            lineHeight: 1.1,
            color: v2.text.primary,
            margin: 0,
          }}
        >
          {mallName}
        </h2>
        {hasDistance && (
          <span
            style={{
              gridColumn: 2,
              gridRow: 1,
              background: v2.surface.warm,
              color: v2.accent.green,
              fontFamily: FONT_INTER,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: 14,
              whiteSpace: "nowrap",
            }}
          >
            {distanceLabel}
          </span>
        )}
        <div
          style={{
            gridColumn: "1 / -1",
            gridRow: 2,
            fontFamily: FONT_INTER,
            fontSize: 11.5,
            color: v2.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {mallAddress}
        </div>
      </div>

      {/* GET DIRECTIONS thinner full-width green CTA */}
      <div style={{ padding: "0 20px 12px" }}>
        <button
          type="button"
          onClick={onGetDirections}
          style={{
            width: "100%",
            background: v2.accent.green,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: 8,
            fontFamily: FONT_INTER,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          Get Directions
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </div>

      {/* "X finds waiting to be discovered" with leaf glyph + dashed flankers */}
      <div
        style={{
          padding: "0 20px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span
          aria-hidden
          style={{
            flex: 1,
            height: 0,
            borderBottom: `1px dashed ${v2.border.medium}`,
            maxWidth: 80,
          }}
        />
        <span
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 15,
            // QA-derived warm-grey-brown per session-139 Q4 — between
            // v2.brown #6A513E (too dark) and v2.brownSoft #B8A996 (too light).
            color: "#a1917f",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <svg
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2c1.7 5 .67 16-8.2 18zM2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
          {findsCount} {findsCount === 1 ? "find" : "finds"} waiting to be discovered
        </span>
        <span
          aria-hidden
          style={{
            flex: 1,
            height: 0,
            borderBottom: `1px dashed ${v2.border.medium}`,
            maxWidth: 80,
          }}
        />
      </div>

      {/* Accordion sections (children) */}
      {children}
    </article>
  );
}
