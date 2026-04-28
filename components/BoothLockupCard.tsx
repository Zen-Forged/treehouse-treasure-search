// components/BoothLockupCard.tsx
//
// Session 82 — shared booth-lockup card primitive.
//
// Single-row card with a unified visual identity used on /shelves rows and
// /flagged section headers. /find/[id] cartographic card is the canonical
// reference (see app/find/[id]/page.tsx ~L1091); this component matches its
// visual treatment so the same booth lockup reads identically across the
// three surfaces it appears on.
//
// Three layout slots:
//   - bookmark column (optional 22px column, only when `bookmark` provided)
//   - info stack (vendor name + optional location subtitle)
//   - admin chrome (optional, e.g. /shelves Pencil + Trash)
//   - booth lockup (eyebrow + numeral, hidden when boothNumber is missing —
//     name claims the freed space; row min-height keeps height uniform)
//
// Visual primitives (matched to /find/[id] cartographic card):
//   - bg: v1.postit (#fbf3df warm cream)
//   - border: 1px solid v1.inkHairline
//   - radius: 10
//   - padding: 12px 14px
//   - vendor name: FONT_LORA 18px inkPrimary -0.005em ellipsis
//   - location subtitle: FONT_SYS 11.5px inkMuted (dotted-underline link if mapLink)
//   - BOOTH eyebrow: FONT_SYS 9px / 700 / v1.green / 0.12em / uppercase
//   - numeral: FONT_NUMERAL 26px / 500 / v1.green / -0.01em
//
// This component renders the card BODY only — surfaces wrap it with their own
// motion + Link/onClick + outer layout chrome.

"use client";

import { Bookmark } from "lucide-react";
import { v1, FONT_LORA, FONT_SYS, FONT_NUMERAL } from "@/lib/tokens";

export interface BoothLockupCardProps {
  vendorName:    string;
  boothNumber?:  string | null;
  /** Optional location subtitle. Only renders if at least `name` is provided. */
  mall?: {
    name?:  string | null;
    city?:  string | null;
    state?: string | null;
  } | null;
  /** When provided, location subtitle becomes a dotted-underline link to maps. */
  mapLink?: string | null;
  /**
   * Bookmark column. When undefined, the column collapses entirely and the
   * info stack starts from the card's left padding. Used as the "informational"
   * variant on /find/[id] would be (currently inline there — pass undefined to
   * match that look).
   */
  bookmark?: { saved: boolean; onToggle: () => void } | null;
  /** Admin chrome slot — Pencil + Trash on /shelves rows. Sits before the lockup. */
  adminChrome?: React.ReactNode;
}

// Card sizing — chosen so a row WITH booth lockup and a row WITHOUT it
// render at the same height. Numeral 26px + eyebrow 9px + 4px gap + 12+12
// vertical padding ≈ 60-62px content. Min-height 60 holds empty rows steady.
const CARD_MIN_HEIGHT = 60;

export default function BoothLockupCard({
  vendorName,
  boothNumber,
  mall,
  mapLink,
  bookmark,
  adminChrome,
}: BoothLockupCardProps) {
  const hasBookmark = !!bookmark;
  const hasBoothLockup = !!boothNumber;
  const locationText = mall?.name
    ? `${mall.name}${mall.city ? ` · ${mall.city}${mall.state ? `, ${mall.state}` : ""}` : ""}`
    : null;

  return (
    <div
      style={{
        background: v1.postit,
        border: `1px solid ${v1.inkHairline}`,
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: CARD_MIN_HEIGHT,
      }}
    >
      {hasBookmark && (
        <div
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              bookmark!.onToggle();
            }}
            aria-label={bookmark!.saved ? "Remove booth bookmark" : "Bookmark this booth"}
            style={{
              width: 22,
              height: 22,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Bookmark
              size={18}
              strokeWidth={1.8}
              style={{
                color: bookmark!.saved ? v1.green : v1.inkPrimary,
                fill:  bookmark!.saved ? v1.green : "none",
              }}
            />
          </button>
        </div>
      )}

      {/* Info stack — vendor name + optional location subtitle. */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: FONT_LORA,
            fontSize: 18,
            color: v1.inkPrimary,
            lineHeight: 1.25,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {vendorName}
        </div>
        {locationText && (
          mapLink ? (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                fontFamily: FONT_SYS,
                fontSize: 11.5,
                color: v1.inkMuted,
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: v1.inkFaint,
                textUnderlineOffset: 3,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {locationText}
            </a>
          ) : (
            <div
              style={{
                fontFamily: FONT_SYS,
                fontSize: 11.5,
                color: v1.inkMuted,
                marginTop: 2,
                lineHeight: 1.4,
              }}
            >
              {locationText}
            </div>
          )
        )}
      </div>

      {/* Admin chrome — Pencil + Trash on /shelves admin rows. Sits before
          the lockup so the lockup remains right-anchored. */}
      {adminChrome && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {adminChrome}
        </div>
      )}

      {/* Booth lockup — eyebrow + numeral. Hidden when no boothNumber so the
          name claims the freed space; row keeps full height via minHeight. */}
      {hasBoothLockup && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SYS,
              fontSize: 9,
              fontWeight: 700,
              color: v1.green,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            Booth
          </div>
          <div
            style={{
              fontFamily: FONT_NUMERAL,
              fontSize: 26,
              fontWeight: 500,
              color: v1.green,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {boothNumber}
          </div>
        </div>
      )}
    </div>
  );
}
