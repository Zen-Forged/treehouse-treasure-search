// scripts/test-mall-hours.ts
// Session 203 — Arc 3 unit checks for lib/mallHours.ts. Runnable standalone
// (matches scripts/test-filters.ts style — no test runner needed):
//   npx tsx scripts/test-mall-hours.ts
//
// Deterministic without guessing calendar weekdays: we anchor at a fixed UTC
// instant whose LOCAL time-of-day we control via the known June offset (EDT
// = UTC-4, CDT = UTC-5), derive the local day index the same way the fn does,
// then craft opening periods RELATIVE to that derived now. So assertions hold
// regardless of which weekday the anchor falls on.

import { computeMallHours, type MallHoursInput } from "../lib/mallHours";

// June → EDT (UTC-4). 18:30 UTC = 14:30 America/New_York.
const ANCHOR = new Date(Date.UTC(2026, 5, 17, 18, 30));

function localParts(now: Date, tz: string): { day: number; minutes: number } {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const wd = p.find((x) => x.type === "weekday")!.value;
  let hour = parseInt(p.find((x) => x.type === "hour")!.value, 10);
  const minute = parseInt(p.find((x) => x.type === "minute")!.value, 10);
  if (hour === 24) hour = 0;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: map[wd], minutes: hour * 60 + minute };
}

const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pt = (day: number, totalMin: number) => ({
  day: ((day % 7) + 7) % 7,
  hour: Math.floor((((totalMin % 1440) + 1440) % 1440) / 60),
  minute: (((totalMin % 1440) + 1440) % 1440) % 60,
});
function hours(...periods: { open: ReturnType<typeof pt>; close?: ReturnType<typeof pt> }[]): MallHoursInput {
  return {
    hoursJson: { regularOpeningHours: { periods } },
    timezone: "America/New_York",
    businessStatus: "OPERATIONAL",
  };
}

let pass = 0, fail = 0;
function check(name: string, got: string, want: string) {
  if (got === want) { pass++; console.log(`✅ ${name} → "${got}"`); }
  else { fail++; console.log(`❌ ${name}\n     got:  "${got}"\n     want: "${want}"`); }
}

const E = localParts(ANCHOR, "America/New_York"); // ET 14:30
const C = localParts(ANCHOR, "America/Chicago");  // CT 13:30

// A — open, closes in 3h (ET)
check("A open/closes",
  computeMallHours(hours({ open: pt(E.day, E.minutes - 120), close: pt(E.day, E.minutes + 180) }), ANCHOR).label,
  `Open now · closes ${fmt(E.minutes + 180)}`);

// B — closing soon (closes in 30m)
{
  const s = computeMallHours(hours({ open: pt(E.day, E.minutes - 120), close: pt(E.day, E.minutes + 30) }), ANCHOR);
  check("B closing_soon kind", s.kind, "closing_soon");
}

// C — closed, opens later today (in 2h), no day prefix
check("C closed/opens-today",
  computeMallHours(hours({ open: pt(E.day, E.minutes + 120), close: pt(E.day, E.minutes + 300) }), ANCHOR).label,
  `Closed · opens ${fmt(E.minutes + 120)}`);

// D — closed, opens another day (2 days out at 10:00) → day prefix
check("D closed/opens-other-day",
  computeMallHours(hours({ open: pt(E.day + 2, 600), close: pt(E.day + 2, 1140) }), ANCHOR).label,
  `Closed · opens ${SHORT[(E.day + 2) % 7]} 10 AM`);

// E — 24h (single open, no close)
check("E 24h",
  computeMallHours({ hoursJson: { regularOpeningHours: { periods: [{ open: { day: 0, hour: 0, minute: 0 } }] } }, timezone: "America/New_York", businessStatus: "OPERATIONAL" }, ANCHOR).label,
  "Open 24 hours");

// F — businessStatus closed states
check("F1 perm-closed",
  computeMallHours({ hoursJson: null, timezone: "America/New_York", businessStatus: "CLOSED_PERMANENTLY" }, ANCHOR).label, "Permanently closed");
check("F2 temp-closed",
  computeMallHours({ hoursJson: null, timezone: "America/New_York", businessStatus: "CLOSED_TEMPORARILY" }, ANCHOR).label, "Temporarily closed");

// G — unknown (no periods, no tz)
check("G unknown kind",
  computeMallHours({ hoursJson: { regularOpeningHours: { periods: [] } }, timezone: null, businessStatus: "OPERATIONAL" }, ANCHOR).kind, "unknown");

// H — across-midnight: open today (30m ago), closes tomorrow 02:00 → open, closes 2 AM
check("H across-midnight open",
  computeMallHours(hours({ open: pt(E.day, E.minutes - 30), close: pt(E.day + 1, 120) }), ANCHOR).label,
  "Open now · closes 2 AM");

// I — week-wrap closed: only a Sat(6) 22:00 → Sun(0) 02:00 period; now mid-day → closed, opens Sat 10 PM
check("I week-wrap closed",
  computeMallHours(hours({ open: pt(6, 1320), close: pt(0, 120) }), ANCHOR).label,
  `Closed · opens ${E.day === 6 ? "10 PM" : "Sat 10 PM"}`);

// J — Central timezone: open-now still resolves against CT parts
{
  const s = computeMallHours({
    hoursJson: { regularOpeningHours: { periods: [{ open: pt(C.day, C.minutes - 60), close: pt(C.day, C.minutes + 120) }] } },
    timezone: "America/Chicago", businessStatus: "OPERATIONAL",
  }, ANCHOR);
  check("J central open kind", s.kind, "open");
}

function fmt(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440;
  const hr = Math.floor(m / 60), min = m % 60;
  const period = hr < 12 ? "AM" : "PM";
  let h12 = hr % 12; if (h12 === 0) h12 = 12;
  return min === 0 ? `${h12} ${period}` : `${h12}:${String(min).padStart(2, "0")} ${period}`;
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
