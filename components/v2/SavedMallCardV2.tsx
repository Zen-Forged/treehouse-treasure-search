// components/v2/SavedMallCardV2.tsx
//
// v2 Arc 1.2 — Saved page mall card per Frame δ structural lock. Replaces
// session-121 inline <SavedMallCard> on /flagged (wired in Arc 1.4).
//
// Layout (Frame δ, post-pick refined):
//   head-δ — CSS grid 1fr/42px columns × auto/auto rows
//     row 1: mall name (Cormorant 28/600)         | ★ bubble (42×42)
//     row 2: mall address (Inter 13)              | ────── spans both ──────
//   distance eyebrow row (centered pill above CTA): "X.X MI AWAY"
//   action row: full-width green GET DIRECTIONS button + ↗
//   finds-waiting row: italic Cormorant 13 + 🍃 + dashed flankers
//   accordion sections (children)
//
// Open questions resolved per design record:
//   - Distance fallback: if distanceMi === null, render "DISTANCE UNAVAILABLE"
//     with shorter letter-spacing to fit the same pill chrome. Tap-to-prompt
//     is a Tier B item; for Arc 1.2 + 1.4 we render the static fallback.
"use client";

import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import StarFavoriteBubble from "./StarFavoriteBubble";

interface SavedMallCardV2Props {
  mallName: string;
  mallAddress: string;
  distanceMi: number | null;
  findsCount: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onGetDirections: () => void;
  children: React.ReactNode; // accordion sections
}

function formatDistanceLabel(distanceMi: number | null): string {
  if (distanceMi === null) return "DISTANCE UNAVAILABLE";
  if (distanceMi < 0.1) return "< 0.1 MI AWAY";
  if (distanceMi < 10) return `${distanceMi.toFixed(1)} MI AWAY`;
  return `${Math.round(distanceMi)} MI AWAY`;
}

export default function SavedMallCardV2({
  mallName,
  mallAddress,
  distanceMi,
  findsCount,
  isFavorite,
  onToggleFavorite,
  onGetDirections,
  children,
}: SavedMallCardV2Props) {
  const distanceLabel = formatDistanceLabel(distanceMi);
  const hasDistance = distanceMi !== null;

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
      {/* head-δ — CSS grid: name + ★ on row 1; address spans row 2 */}
      <div
        style={{
          padding: "18px 20px 14px",
          display: "grid",
          gridTemplateColumns: "1fr 42px",
          columnGap: 14,
          rowGap: 6,
          alignItems: "center",
        }}
      >
        <h2
          style={{
            gridColumn: 1,
            gridRow: 1,
            fontFamily: FONT_CORMORANT,
            fontWeight: 600,
            fontSize: 28,
            lineHeight: 1.1,
            color: v2.text.primary,
            margin: 0,
          }}
        >
          {mallName}
        </h2>
        <div style={{ gridColumn: 2, gridRow: 1, justifySelf: "end" }}>
          <StarFavoriteBubble
            isFavorite={isFavorite}
            onToggle={onToggleFavorite}
          />
        </div>
        <div
          style={{
            gridColumn: "1 / span 2",
            gridRow: 2,
            fontFamily: FONT_INTER,
            fontSize: 13,
            color: v2.text.secondary,
            lineHeight: 1.4,
          }}
        >
          {mallAddress}
        </div>
      </div>

      {/* Distance eyebrow centered above GET DIRECTIONS */}
      <div
        style={{
          padding: "0 20px 8px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            background: v2.surface.warm,
            border: `1px solid ${v2.border.light}`,
            borderRadius: 14,
            padding: "4px 12px",
            fontFamily: FONT_INTER,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: hasDistance ? "0.14em" : "0.10em",
            textTransform: "uppercase",
            color: v2.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          {distanceLabel}
        </span>
      </div>

      {/* GET DIRECTIONS full-width green CTA */}
      <div style={{ padding: "0 20px 12px" }}>
        <button
          type="button"
          onClick={onGetDirections}
          style={{
            width: "100%",
            background: v2.accent.green,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "14px 16px",
            fontFamily: FONT_INTER,
            fontSize: 13,
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
            width={14}
            height={14}
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
            fontSize: 13,
            color: v2.text.secondary,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <svg
            width={13}
            height={13}
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
