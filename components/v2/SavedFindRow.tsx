// components/v2/SavedFindRow.tsx
//
// v2 Arc 1.2 — Find row primitive for the v2 row pattern (replaces session-83
// PolaroidTile on /flagged; first consumer of the new shared primitive that
// will likely abstract to <v2/Row> in Arc 2 on second-consumer trigger per
// Q4 (a) — premature abstraction risk = 0).
//
// Layout per design record Frame δ:
//   [22px ✓ Found] [64px photo thumb] [name + price stack] [36px ♥ leaf]
//
// Find row meta is name + price ONLY — booth meta dropped per David's call
// (accordion header names the booth, redundant per Frame δ refinement).
//
// Tap behavior: row body navigates to onTapDetail. ✓ Found check + ♥ leaf
// bubble stop propagation so they don't trigger row navigation.
//
// Cormorant lineHeight 1.3 on find name (vs design-record's 1.2) per
// feedback_lora_lineheight_minimum_for_clamp — Cormorant has stronger
// descenders than Lora; bumping by 0.1 keeps clamp safe.
"use client";

import { PiLeafBold, PiLeafFill } from "react-icons/pi";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";
import FoundCheckCircle from "./FoundCheckCircle";

interface SavedFindRowProps {
  postId: string;
  imageUrl?: string;
  imageGradient?: string; // CSS gradient fallback for smoke route mocks
  title: string;
  /** Asking price in dollars (matches Post.price_asking shape; null hides). */
  price: number | null;
  isFound: boolean;
  isSaved: boolean;
  /** Sold-state dim — whole row drops to 0.55 opacity. Matches PolaroidTile
   *  dim contract verbatim; preserves the session-83 sold-find visual when
   *  /flagged migrates to v2 row primitive. */
  dim?: boolean;
  onToggleFound: () => void;
  onToggleSaved: () => void;
  onTapDetail: () => void;
}

export default function SavedFindRow({
  imageUrl,
  imageGradient,
  title,
  price,
  isFound,
  isSaved,
  dim = false,
  onToggleFound,
  onToggleSaved,
  onTapDetail,
}: SavedFindRowProps) {
  const showPrice = typeof price === "number" && price > 0;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTapDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTapDetail();
        }
      }}
      style={{
        padding: "12px 20px",
        display: "grid",
        gridTemplateColumns: "24px 64px 1fr 36px",
        gap: 12,
        alignItems: "center",
        borderTop: `1px solid ${v2.border.light}`,
        background: v2.surface.card,
        cursor: "pointer",
        opacity: dim ? 0.55 : 1,
      }}
    >
      <FoundCheckCircle isFound={isFound} onToggle={onToggleFound} />

      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 6,
          background: imageUrl
            ? `${v2.surface.warm} url("${imageUrl}") center/cover no-repeat`
            : imageGradient ?? v2.surface.warm,
          border: `1px solid ${v2.border.light}`,
          flexShrink: 0,
        }}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_CORMORANT,
            fontWeight: 600,
            fontSize: 17,
            color: v2.text.primary,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        {showPrice && (
          <div
            style={{
              fontFamily: FONT_INTER,
              fontSize: 14,
              fontWeight: 400,
              color: v2.accent.green,
            }}
          >
            ${Math.round(price as number)}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSaved();
        }}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Remove from saved" : "Save"}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: v2.surface.warm,
          border: `1px solid ${v2.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: v2.accent.green,
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        {isSaved ? (
          <PiLeafFill size={18} aria-hidden />
        ) : (
          <PiLeafBold size={18} aria-hidden />
        )}
      </button>
    </div>
  );
}
