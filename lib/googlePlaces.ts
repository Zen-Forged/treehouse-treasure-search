// lib/googlePlaces.ts
// Server-only Google Places API (New) client for the mall hours refresh.
// Session 203 — Location hours Shape B Arc 2. Design: docs/location-hours-design.md.
//
// The field mask is the cost lever (D1): we request exactly the opening-hours
// + timezone + businessStatus fields and nothing atmosphere-tier (photos /
// reviews), keeping the call on the Place Details (Enterprise) SKU and never
// jumping to a pricier tier. Verified shapes against a live call session 203:
//   regularOpeningHours.periods[] = { open:{day,hour,minute}, close?:{...} }
//     day: 0=Sunday … 6=Saturday (matches JS Date.getDay()); a period with an
//     open at day0 00:00 and NO close = open 24/7; close.day may differ from
//     open.day for across-midnight hours.
//   timeZone = { id: "America/New_York" }  (IANA — KY straddles Eastern/Central)
//   businessStatus = "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY"
//   utcOffsetMinutes = -240
//
// Never expose GOOGLE_PLACES_API_KEY to the client — this module is imported
// only by the cron route + the local populate script.

const PLACES_DETAILS_FIELD_MASK = [
  "id",
  "regularOpeningHours",
  "currentOpeningHours",
  "businessStatus",
  "timeZone",
  "utcOffsetMinutes",
].join(",");

export interface OpeningHoursPoint {
  day: number; // 0=Sunday … 6=Saturday
  hour: number;
  minute: number;
}
export interface OpeningHoursPeriod {
  open: OpeningHoursPoint;
  close?: OpeningHoursPoint; // absent = open 24h from `open`
}
export interface OpeningHours {
  periods?: OpeningHoursPeriod[];
  weekdayDescriptions?: string[];
}
export interface PlaceHoursResult {
  regularOpeningHours: OpeningHours | null;
  currentOpeningHours: OpeningHours | null; // date-specific overrides (holidays)
  businessStatus: string | null;
  timeZone: string | null; // IANA, extracted from { id }
  utcOffsetMinutes: number | null;
}

/** The shape written to malls.* by both the cron route and the local script. */
export interface MallHoursUpdate {
  hours_json: {
    regularOpeningHours: OpeningHours | null;
    currentOpeningHours: OpeningHours | null;
  };
  hours_timezone: string | null;
  business_status: string | null;
  hours_fetched_at: string;
}

/**
 * Fetch opening hours for a place_id via Place Details (New).
 * Throws on HTTP error or missing key. Server-only.
 */
export async function fetchPlaceHours(placeId: string): Promise<PlaceHoursResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not set");

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": PLACES_DETAILS_FIELD_MASK,
      },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Place Details HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const d = (await res.json()) as {
    regularOpeningHours?: OpeningHours;
    currentOpeningHours?: OpeningHours;
    businessStatus?: string;
    timeZone?: { id?: string };
    utcOffsetMinutes?: number;
  };

  return {
    regularOpeningHours: d.regularOpeningHours ?? null,
    currentOpeningHours: d.currentOpeningHours ?? null,
    businessStatus: d.businessStatus ?? null,
    timeZone: d.timeZone?.id ?? null,
    utcOffsetMinutes: typeof d.utcOffsetMinutes === "number" ? d.utcOffsetMinutes : null,
  };
}

/** Map a fetch result to the malls column update. Caller supplies the timestamp. */
export function toHoursUpdate(r: PlaceHoursResult, nowIso: string): MallHoursUpdate {
  return {
    hours_json: {
      regularOpeningHours: r.regularOpeningHours,
      currentOpeningHours: r.currentOpeningHours,
    },
    hours_timezone: r.timeZone,
    business_status: r.businessStatus,
    hours_fetched_at: nowIso,
  };
}
