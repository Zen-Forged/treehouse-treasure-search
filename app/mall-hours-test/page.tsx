// app/mall-hours-test/page.tsx
// Session 203 — Location hours Shape B Arc 3 smoke route (testbed-first per
// feedback_testbed_first_for_ai_unknowns). Renders <MallHoursBadge> in every
// D10 state against a FIXED moment, so the visual (D13) can be dialed via
// iPhone QA without waiting on a particular time of day. Fixtures are crafted
// relative to the anchor's local parts so the states are deterministic.

"use client";

import * as React from "react";
import MallHoursBadge from "@/components/MallHoursBadge";
import { v1, v2, FONT_INTER, FONT_CORMORANT } from "@/lib/tokens";

// June → EDT (UTC-4). 18:30 UTC = 14:30 America/New_York.
const NOW = new Date(Date.UTC(2026, 5, 17, 18, 30));

function etParts(now: Date): { day: number; minutes: number } {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(p.find((x) => x.type === "hour")!.value, 10);
  if (hour === 24) hour = 0;
  return {
    day: map[p.find((x) => x.type === "weekday")!.value],
    minutes: hour * 60 + parseInt(p.find((x) => x.type === "minute")!.value, 10),
  };
}
const E = etParts(NOW);
const pt = (day: number, total: number) => ({
  day: ((day % 7) + 7) % 7,
  hour: Math.floor((((total % 1440) + 1440) % 1440) / 60),
  minute: (((total % 1440) + 1440) % 1440) % 60,
});
const reg = (...periods: { open: ReturnType<typeof pt>; close?: ReturnType<typeof pt> }[]) => ({
  regularOpeningHours: { periods },
});

const HREF = "https://www.google.com/maps/search/?api=1&query=Test+Mall";

const CASES: { name: string; props: React.ComponentProps<typeof MallHoursBadge> }[] = [
  { name: "Open (closes in 3h)", props: { hoursJson: reg({ open: pt(E.day, E.minutes - 120), close: pt(E.day, E.minutes + 180) }), timezone: "America/New_York", businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
  { name: "Closing soon (30m)", props: { hoursJson: reg({ open: pt(E.day, E.minutes - 120), close: pt(E.day, E.minutes + 30) }), timezone: "America/New_York", businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
  { name: "Closed (opens later today)", props: { hoursJson: reg({ open: pt(E.day, E.minutes + 120), close: pt(E.day, E.minutes + 300) }), timezone: "America/New_York", businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
  { name: "Closed (opens another day)", props: { hoursJson: reg({ open: pt(E.day + 2, 600), close: pt(E.day + 2, 1140) }), timezone: "America/New_York", businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
  { name: "Open 24 hours", props: { hoursJson: { regularOpeningHours: { periods: [{ open: { day: 0, hour: 0, minute: 0 } }] } }, timezone: "America/New_York", businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
  { name: "Temporarily closed", props: { hoursJson: null, timezone: "America/New_York", businessStatus: "CLOSED_TEMPORARILY", href: HREF, now: NOW } },
  { name: "Permanently closed", props: { hoursJson: null, timezone: "America/New_York", businessStatus: "CLOSED_PERMANENTLY", href: HREF, now: NOW } },
  { name: "Unknown (no data → null, falls back to deep-link)", props: { hoursJson: { regularOpeningHours: { periods: [] } }, timezone: null, businessStatus: "OPERATIONAL", href: HREF, now: NOW } },
];

export default function MallHoursTestPage() {
  return (
    <main style={{ minHeight: "100vh", background: v2.bg.main, padding: "32px 20px", fontFamily: FONT_INTER }}>
      <h1 style={{ fontFamily: FONT_CORMORANT, fontSize: 26, color: v2.text.primary, marginBottom: 4 }}>
        MallHoursBadge — states
      </h1>
      <p style={{ fontSize: 12, color: v2.text.muted, marginBottom: 24 }}>
        Fixed now = {NOW.toISOString()} (ET 14:30). Each badge is tappable → Google listing (D5).
      </p>

      {CASES.map(({ name, props }) => (
        <div
          key={name}
          style={{
            background: v2.surface.card,
            border: `1px solid ${v2.border.light}`,
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: v2.text.muted }}>
            {name}
          </span>
          <div style={{ minHeight: 18 }}>
            <MallHoursBadge {...props} />
            {/* unknown renders nothing — show the fallback note so the slot isn't blank */}
            {props.businessStatus === "OPERATIONAL" && props.timezone === null && (
              <a href={HREF} target="_blank" rel="noopener noreferrer"
                 style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT_INTER, fontSize: 11.5, fontWeight: 500, color: v2.text.secondary, textDecoration: "none" }}>
                Hours on Google <span aria-hidden style={{ opacity: 0.6 }}>&rsaquo;</span>
              </a>
            )}
          </div>
        </div>
      ))}

      <p style={{ fontSize: 11, color: v2.text.muted, marginTop: 20 }}>
        Dot: green = open · amber ({v1.amber}) = closing soon · grey = closed.
      </p>
    </main>
  );
}
