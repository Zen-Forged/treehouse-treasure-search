// components/MallScopeHeader.tsx
// Three-callsite mall-scope header: Home / Booths / Find Map.
//
// Visual idiom: italic eyebrow ("Finds from", "Booths at", "Saves at") +
// tappable bold name (mall or "Kentucky") + chevron-down. Optional geo line
// below — either an addressed map link (Home) or italic context text
// (Booths: "N booths"; Find Map: "N saved finds").
//
// Tapping the name opens MallSheet via the parent's `onTap` callback.
// Persistence + sheet state live in the parent.

"use client";

import { ChevronDown } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS, FONT_NUMERAL } from "@/lib/tokens";

export type MallScopeGeoLine =
  | { kind: "address"; text: string; href?: string | null }
  | { kind: "italic";  text: string }
  | null;

export interface MallScopeHeaderProps {
  // "Finds from across" / "booths across" / "flagged finds across" when null
  eyebrowAll: string;
  // "Finds from" / "booths at" / "flagged finds at" when one mall picked
  eyebrowOne: string;
  // Optional count rendered inline before the eyebrow at a larger size
  // (session 71 — number deserves typographic emphasis vs the prose)
  count?: number;
  // null = "All malls" — renders as "Kentucky"; else the mall name
  mallName: string | null;
  // Optional content line below the name
  geoLine?: MallScopeGeoLine;
  onTap: () => void;
}

export default function MallScopeHeader({
  eyebrowAll,
  eyebrowOne,
  count,
  mallName,
  geoLine,
  onTap,
}: MallScopeHeaderProps) {
  const isAll = mallName === null;
  const eyebrow = isAll ? eyebrowAll : eyebrowOne;
  const title   = isAll ? "All Kentucky Locations" : mallName!;

  return (
    <div style={{ padding: "8px 22px 6px" }}>
      {/* Eyebrow — with optional larger count prefix (session 71) */}
      <div
        style={{
          fontFamily: FONT_LORA,
          fontStyle: "italic",
          fontSize: 15,
          color: v1.inkMuted,
          lineHeight: 1.4,
          marginBottom: 4,
        }}
      >
        {count !== undefined ? (
          <>
            <span
              style={{
                fontFamily: FONT_NUMERAL,
                fontStyle: "normal",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: v1.inkPrimary,
              }}
            >
              {count}
            </span>{" "}
            {eyebrow}
          </>
        ) : (
          eyebrow
        )}
      </div>

      {/* Tappable name + chevron */}
      <button
        onClick={onTap}
        aria-label="Choose a location"
        style={{
          display: "inline-flex",
          alignItems: "baseline",
          gap: 8,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: FONT_LORA,
            fontSize: 26,
            color: v1.inkPrimary,
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          style={{
            color: v1.inkMuted,
            transform: "translateY(-2px)",
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </button>

      {/* Optional geo line */}
      {geoLine && geoLine.kind === "address" ? (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width={13} height={16} viewBox="0 0 18 22" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path
              d="M9 1.2c-3.98 0-7.2 3.12-7.2 6.98 0 5.22 7.2 12.62 7.2 12.62s7.2-7.4 7.2-12.62C16.2 4.32 12.98 1.2 9 1.2z"
              stroke={v1.inkMuted}
              strokeWidth="1.3"
              fill="none"
            />
            <circle cx="9" cy="8.3" r="2" fill={v1.inkMuted} />
          </svg>
          {geoLine.href ? (
            <a
              href={geoLine.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: FONT_SYS,
                fontSize: 14,
                color: v1.inkMuted,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 3,
                lineHeight: 1.5,
              }}
            >
              {geoLine.text}
            </a>
          ) : (
            <span
              style={{
                fontFamily: FONT_SYS,
                fontSize: 14,
                color: v1.inkMuted,
                lineHeight: 1.5,
              }}
            >
              {geoLine.text}
            </span>
          )}
        </div>
      ) : geoLine && geoLine.kind === "italic" ? (
        <div
          style={{
            marginTop: 4,
            fontFamily: FONT_LORA,
            fontStyle: "italic",
            fontSize: 13.5,
            color: v1.inkMuted,
            lineHeight: 1.5,
          }}
        >
          {geoLine.text}
        </div>
      ) : null}
    </div>
  );
}
