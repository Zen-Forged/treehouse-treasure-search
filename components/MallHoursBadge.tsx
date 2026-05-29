// components/MallHoursBadge.tsx
// Session 203 — Location hours Shape B Arc 3. The "Open now · closes 6 PM"
// badge. Design: docs/location-hours-design.md (D4/D5/D10/D13).
//
// Computes open/closed at DISPLAY time (D8) via lib/mallHours.ts against the
// mall's own timezone (D11). Tappable → the Google listing (D5), replacing the
// Shape A standalone link. Returns null for the "unknown" state (no hours
// data) so the caller can fall back to the Shape A deep-link (D9).
//
// Treatment (D13, dialed on /mall-hours-test): status dot + Inter 11.5px text,
// no pill — matches the quiet aesthetic of the link it replaces. Dot carries
// the color signal: green open, amber closing-soon, grey closed.

"use client";

import * as React from "react";
import { computeMallHours, type MallHoursKind } from "@/lib/mallHours";
import { v1, v2, FONT_INTER } from "@/lib/tokens";
import type { OpeningHours } from "@/lib/googlePlaces";

const DOT_COLOR: Record<MallHoursKind, string> = {
  open: v2.accent.green,
  open_24h: v2.accent.green,
  closing_soon: v1.amber,
  closed: v2.text.muted,
  closed_temporarily: v2.text.muted,
  closed_permanently: v2.text.muted,
  unknown: v2.text.muted,
};

export interface MallHoursBadgeProps {
  hoursJson?:
    | { regularOpeningHours?: OpeningHours | null; currentOpeningHours?: OpeningHours | null }
    | null;
  timezone?: string | null;
  businessStatus?: string | null;
  /** Google listing URL — the badge is tappable → full hours (D5). */
  href: string;
  /** Inject a fixed moment for the smoke route; defaults to live "now". */
  now?: Date;
}

export default function MallHoursBadge({
  hoursJson,
  timezone,
  businessStatus,
  href,
  now,
}: MallHoursBadgeProps) {
  const state = computeMallHours({ hoursJson, timezone, businessStatus }, now ?? new Date());
  // D9 — no hours data; caller renders the Shape A "Hours on Google" link instead.
  if (state.kind === "unknown") return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT_INTER,
        fontSize: 11.5,
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: v2.text.secondary,
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: DOT_COLOR[state.kind],
          flexShrink: 0,
        }}
      />
      {state.label}
      <span aria-hidden style={{ opacity: 0.6 }}>
        &rsaquo;
      </span>
    </a>
  );
}
