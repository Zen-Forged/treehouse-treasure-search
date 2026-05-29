// lib/mallHours.ts
// Session 203 — Location hours Shape B Arc 3. Pure, timezone-aware "open now"
// computation. Design: docs/location-hours-design.md (D8/D10/D11).
//
// "Open now" is NEVER stored (D8) — this fn runs at display time against the
// current moment, in the mall's OWN timezone (D11: KY straddles Eastern +
// Central). Takes the hours_json + timezone + business_status we stored from
// Google Places (Arc 2) and returns a badge state + label.
//
// Google period convention (verified live, Arc 2):
//   periods[] = { open:{day,hour,minute}, close?:{...} }, day 0=Sun…6=Sat.
//   A single period with open day0 00:00 and NO close = open 24/7.
//   close.day may differ from open.day for across-midnight hours.
//
// Week math: everything is reduced to "minutes since Sunday 00:00" (0..10079).
// Intervals that wrap past Saturday-midnight get +WEEK on their end so the
// containment test is a simple range check (with a +WEEK shift to catch
// early-Sunday-inside-a-Saturday-night-interval).

import type { OpeningHours } from "./googlePlaces";

const WEEK = 7 * 1440; // 10080 minutes
const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CLOSING_SOON_MIN = 60;

export type MallHoursKind =
  | "open"
  | "closing_soon"
  | "open_24h"
  | "closed"
  | "closed_temporarily"
  | "closed_permanently"
  | "unknown";

export interface MallHoursState {
  kind: MallHoursKind;
  /** Human badge text, e.g. "Open now · closes 6 PM" / "Closed · opens Mon 9 AM". Empty for "unknown". */
  label: string;
  /** True for open / open_24h / closing_soon. */
  isOpen: boolean;
}

export interface MallHoursInput {
  hoursJson:
    | { regularOpeningHours?: OpeningHours | null; currentOpeningHours?: OpeningHours | null }
    | null
    | undefined;
  timezone: string | null | undefined;
  businessStatus: string | null | undefined;
}

const UNKNOWN: MallHoursState = { kind: "unknown", label: "", isOpen: false };

/** Day-of-week (0=Sun) + minutes-since-midnight, evaluated in the given IANA zone. */
function nowPartsInZone(now: Date, tz: string): { day: number; minutes: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const wd = parts.find((p) => p.type === "weekday")?.value;
    let hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "", 10);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const day = wd !== undefined ? dayMap[wd] : undefined;
    if (day === undefined || Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour === 24) hour = 0; // some impls render midnight as "24"
    return { day, minutes: hour * 60 + minute };
  } catch {
    return null; // invalid timezone
  }
}

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return minute === 0 ? `${h12} ${period}` : `${h12}:${String(minute).padStart(2, "0")} ${period}`;
}

function labelFromWeekMin(weekMin: number): string {
  const m = ((weekMin % WEEK) + WEEK) % WEEK;
  return formatTime(Math.floor((m % 1440) / 60), m % 60);
}

/**
 * Compute the open-now badge state for a mall at a given moment.
 * @param input - stored hours_json + timezone + business_status
 * @param now   - the moment to evaluate (inject for tests; default "now")
 */
export function computeMallHours(input: MallHoursInput, now: Date = new Date()): MallHoursState {
  const { hoursJson, timezone, businessStatus } = input;

  if (businessStatus === "CLOSED_PERMANENTLY")
    return { kind: "closed_permanently", label: "Permanently closed", isOpen: false };
  if (businessStatus === "CLOSED_TEMPORARILY")
    return { kind: "closed_temporarily", label: "Temporarily closed", isOpen: false };

  const hours = hoursJson?.regularOpeningHours ?? hoursJson?.currentOpeningHours ?? null;
  const periods = hours?.periods;
  if (!periods || periods.length === 0 || !timezone) return UNKNOWN;

  // Open 24/7: Google represents it as one period, open day0 00:00, no close.
  if (periods.length === 1 && periods[0].close == null) {
    return { kind: "open_24h", label: "Open 24 hours", isOpen: true };
  }

  const np = nowPartsInZone(now, timezone);
  if (!np) return UNKNOWN;
  const nowMin = np.day * 1440 + np.minutes;

  // Build [start, end) intervals in week-minutes; wrap end past week if needed.
  const intervals = periods
    .filter((p) => p.close)
    .map((p) => {
      const s = p.open.day * 1440 + p.open.hour * 60 + p.open.minute;
      let e = p.close!.day * 1440 + p.close!.hour * 60 + p.close!.minute;
      if (e <= s) e += WEEK; // across-midnight / week-wrap
      return { s, e };
    });

  // Open now? Test both nowMin and nowMin+WEEK (early-Sunday inside a Sat-night interval).
  for (const { s, e } of intervals) {
    const inNow = nowMin >= s && nowMin < e;
    const inWrap = nowMin + WEEK >= s && nowMin + WEEK < e;
    if (inNow || inWrap) {
      const minsToClose = inNow ? e - nowMin : e - (nowMin + WEEK);
      const closeLabel = labelFromWeekMin(e);
      const kind: MallHoursKind = minsToClose <= CLOSING_SOON_MIN ? "closing_soon" : "open";
      return { kind, label: `Open now · closes ${closeLabel}`, isOpen: true };
    }
  }

  // Closed — find the next opening start (smallest start >= now, considering wrap).
  let bestDelta = Infinity;
  let bestStart = -1;
  for (const { s } of intervals) {
    for (const cand of [s, s + WEEK]) {
      const delta = cand - nowMin;
      if (delta >= 0 && delta < bestDelta) {
        bestDelta = delta;
        bestStart = cand;
      }
    }
  }
  if (bestStart < 0) return { kind: "closed", label: "Closed", isOpen: false };

  const opensToday = bestStart < (np.day + 1) * 1440;
  const openDay = Math.floor((bestStart % WEEK) / 1440);
  const timeLabel = labelFromWeekMin(bestStart);
  const label = opensToday
    ? `Closed · opens ${timeLabel}`
    : `Closed · opens ${SHORT_DAY[openDay]} ${timeLabel}`;
  return { kind: "closed", label, isOpen: false };
}
