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

import { useLayoutEffect, useRef, useState } from "react";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import { PiLeaf } from "react-icons/pi";

// Session 144 iPhone QA: long mall names ("Copper Awning Flea Market") wrapped
// to 2 lines at fontSize 25 on iPhone widths. Mirrors PostcardMallCard's
// session-116 measure-and-shrink pattern: render at MAX, step down 1px until
// the single-line layout fits, ellipsis at MIN as last-resort.
const NAME_FONT_MAX = 25;
const NAME_FONT_MIN = 17;

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

  // Measure-and-shrink: drive fontSize down from MAX to MIN until the title
  // fits on one line. Recomputes when mallName changes or hasDistance toggles
  // (pill presence affects available column width).
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [nameFontSize, setNameFontSize] = useState(NAME_FONT_MAX);
  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    let size = NAME_FONT_MAX;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > NAME_FONT_MIN) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setNameFontSize(size);
  }, [mallName, hasDistance]);

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
      {/* head-δ — CSS grid: name + DistancePill on row 1; address spans row 2.
          Session 144 iPhone QA: alignItems "center" → "start" so the
          DistancePill anchors to the top of row 1 (= top of head-δ content
          box, 16px below container top) instead of vertically centering
          against the title cell. Pill renders with consistent
          16px-above / 20px-right padding regardless of title height — David's
          "fixed in the corner of the component with equal padding above and
          to the right" call. */}
      <div
        style={{
          padding: "16px 20px 12px",
          display: "grid",
          gridTemplateColumns: hasDistance ? "1fr auto" : "1fr",
          columnGap: hasDistance ? 12 : 0,
          rowGap: 2,
          alignItems: "start",
        }}
      >
        <h2
          ref={nameRef}
          style={{
            gridColumn: 1,
            gridRow: 1,
            fontFamily: FONT_CORMORANT,
            fontWeight: 600,
            fontSize: nameFontSize,
            lineHeight: 1.1,
            color: v2.text.primary,
            margin: 0,
            // Single-line clamp drives the measure-and-shrink loop above.
            // Ellipsis applies only when even NAME_FONT_MIN can't fit
            // (extremely long names; rare in practice).
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {mallName}
        </h2>
        {hasDistance && (
          <span
            style={{
              gridColumn: 2,
              gridRow: 1,
              // QA-derived soft mint-green per session-139 iPhone QA round 2;
              // ~1 unit off v2.accent.greenSoft #E8EEE6 — David specified hex.
              background: "#e8ede6",
              color: v2.accent.green,
              fontFamily: FONT_INTER,
              fontSize: 10,
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
            letterSpacing: "0.02em",
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
            // Session 141 — promoted to v2.accent.greenMid token when
            // LocationActions Take Trip joined as second button consumer.
            // Was an inline literal (#3e694f) at session 139.
            background: v2.accent.greenMid,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: 10,
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
            fontSize: 16,
            // QA-derived warm-grey-brown per session-139 iPhone QA round 2 —
            // deeper than round 1's #a1917f. David specified hex.
            color: "#857769",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <PiLeaf size={16} aria-hidden />
          {findsCount} {findsCount === 1 ? "find" : "finds"} waiting to be found
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
