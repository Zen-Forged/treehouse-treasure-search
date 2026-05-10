// components/v2/AccordionBoothSection.tsx
//
// v2 Arc 1.2 — Per-booth accordion section. Saved-only primitive per Q4 (a)
// — premature abstraction risk = 0; extract to shared <GroupedListSection>
// only on second-confirmed-consumer trigger (likely Trips/Lists product
// surface or per-mall Find filtering).
//
// Layout per design record:
//   Header row (clickable to toggle):
//     [PiStorefront 22] [BOOTH N small-caps] [• dot] [italic Cormorant name] [chevron up/down]
//   Body (when expanded):
//     find rows (children) below header
//
// Default expanded state per D2 (a) — all accordions expanded by default.
// Local React state for expanded; no localStorage persistence (D2 default
// makes persistence moot until iPhone QA reveals users want per-booth memory,
// which is a Tier B item per design record).
//
// Cormorant booth name lineHeight 1.3 (vs 1.2 in design record — same
// descender-clearance reasoning as SavedFindRow per
// feedback_lora_lineheight_minimum_for_clamp).
"use client";

import { useState } from "react";
import { FONT_CORMORANT, FONT_INTER, v2 } from "@/lib/tokens";

interface AccordionBoothSectionProps {
  /** Null for orphan booths (vendor with no booth_number assigned).
   *  When null, BOOTH N eyebrow + diamond separator both retire; booth
   *  name claims the row alone. */
  boothNumber: string | null;
  boothName: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function AccordionBoothSection({
  boothNumber,
  boothName,
  defaultExpanded = true,
  children,
}: AccordionBoothSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const sectionId = `booth-section-${boothNumber ?? `orphan-${boothName}`}`;

  return (
    <div
      style={{
        borderTop: `1px solid ${v2.border.light}`,
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-controls={sectionId}
        style={{
          width: "100%",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: v2.surface.card,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={v2.accent.green}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
          aria-hidden
        >
          <path d="M3 9l1-5h16l1 5" />
          <path d="M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9" />
          <path d="M9 21v-6h6v6" />
        </svg>
        {boothNumber && (
          <>
            <span
              style={{
                fontFamily: FONT_INTER,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: v2.accent.green,
                flexShrink: 0,
              }}
            >
              Booth {boothNumber}
            </span>
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                background: v2.text.muted,
                transform: "rotate(45deg)",
                flexShrink: 0,
              }}
            />
          </>
        )}
        <span
          style={{
            fontFamily: FONT_CORMORANT,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 17,
            color: v2.text.primary,
            lineHeight: 1.3,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {boothName}
        </span>
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={v2.accent.green}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: "transform 200ms ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div
          id={sectionId}
          style={{ background: v2.surface.card }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
