// scripts/add-mall.ts
// Standard tool for adding a new mall row from a Google Maps "place" URL.
//
// Why this exists: prior to session 102 every new mall was a hand-edited
// paste into supabase/seeds/001_mall_locations.sql. As David expands beta
// to more locations the manual SQL path doesn't scale. Per the project
// script-first-over-SQL-dump rule (MASTER_PROMPT.md §Working Conventions)
// every recurring DB-side operation gets a committed script.
//
// Usage:
//   # Preview only — prints the resolved row + idempotent SQL, no writes:
//   npx tsx scripts/add-mall.ts "https://www.google.com/maps/place/..."
//
//   # Apply directly via service-role (writes to whichever Supabase project
//   # .env.local points at — usually prod):
//   npx tsx scripts/add-mall.ts "<url>" --apply
//
//   # With manual overrides (any combination):
//   npx tsx scripts/add-mall.ts "<url>" \
//     --category=flea_market \
//     --phone=+15025551234 \
//     --website=https://example.com \
//     --apply
//
//   # Force a different env file (staging, etc.):
//   npx tsx scripts/add-mall.ts "<url>" --apply --env-file=.env.staging.local
//
// What's parsed from the URL:
//   - name        ← the /place/<name>/ segment
//   - latitude    ← !3d<lat> data parameter
//   - longitude   ← !4d<lng> data parameter
//
// What's resolved by reverse-geocoding (OpenStreetMap Nominatim, free, no key):
//   - address (house_number + road)
//   - city (city | town | village | hamlet — Nominatim names rural locales differently)
//   - state (full name → 2-letter abbreviation)
//   - zip_code
//
// What's NOT resolvable from URL or geocoder (manual flag or NULL):
//   - phone, website
//
// What's inferred (overridable via --category=):
//   - category from name keywords (flea / peddler / antique / market)
//
// Status defaults to 'draft' via migration 009 — activate via /admin after the
// row lands (matches the existing R4c flow, no special-case here).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── env loader (matches scripts/inspect-banners.ts) ─────────────────────────

const DEFAULT_ENV_FILE = ".env.local";

function loadEnv(envFile: string): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), envFile),
    `/Users/davidbutler/Projects/treehouse-treasure-search/${envFile}`,
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[t.slice(0, i).trim()] = v;
    }
    return out;
  }
  throw new Error(`No env file found at: ${candidates.join(" or ")}`);
}

// ── arg parsing ─────────────────────────────────────────────────────────────

interface Args {
  url: string;
  apply: boolean;
  envFile: string;
  category?: string;
  phone?: string;
  website?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const url = argv.find((a) => !a.startsWith("--"));
  if (!url) {
    console.error("Usage: npx tsx scripts/add-mall.ts \"<google-maps-url>\" [--apply] [--category=...] [--phone=...] [--website=...]");
    process.exit(1);
  }
  const flag = (key: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(`--${key}=`));
    return hit ? hit.slice(`--${key}=`.length) : undefined;
  };
  return {
    url,
    apply: argv.includes("--apply"),
    envFile: flag("env-file") ?? DEFAULT_ENV_FILE,
    category: flag("category"),
    phone: flag("phone"),
    website: flag("website"),
  };
}

// ── URL parsing ─────────────────────────────────────────────────────────────

interface ParsedUrl {
  name: string;
  latitude: number;
  longitude: number;
}

function parseGoogleMapsUrl(url: string): ParsedUrl {
  // Name from /place/<encoded-name>/ — Google encodes spaces as +
  const nameMatch = url.match(/\/place\/([^/]+)\//);
  if (!nameMatch) {
    throw new Error("URL has no /place/<name>/ segment. Need a Google Maps 'place' URL, not a search URL.");
  }
  const name = decodeURIComponent(nameMatch[1].replace(/\+/g, " "));

  // Coordinates from !3d<lat>!4d<lng> in the data block — these are the
  // "place pin" coordinates, more precise than the @<lat>,<lng> camera focus.
  const coordMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (!coordMatch) {
    throw new Error("URL has no !3d<lat>!4d<lng> data block. Are you sure this is a Google Maps place URL?");
  }
  return {
    name,
    latitude: parseFloat(coordMatch[1]),
    longitude: parseFloat(coordMatch[2]),
  };
}

// ── slug generation (matches existing seed file output) ─────────────────────

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── category inference ──────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  "peddlers_mall",
  "antique_mall",
  "flea_market",
  "antique_store",
  "antique_market",
] as const;

function inferCategory(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("flea")) return "flea_market";
  if (n.includes("peddler")) return "peddlers_mall";
  if (n.includes("antique market")) return "antique_market";
  if (n.includes("antique mall")) return "antique_mall";
  if (n.includes("antique")) return "antique_store";
  return null;
}

// ── state name → 2-letter abbreviation ──────────────────────────────────────
// Geocoder returns full state names ("Kentucky"). Schema stores 2-letter codes.

const STATE_ABBREV: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

function abbreviateState(full: string): string {
  const code = STATE_ABBREV[full.toLowerCase()];
  if (!code) {
    throw new Error(`Unknown state name from geocoder: "${full}". Add it to STATE_ABBREV.`);
  }
  return code;
}

// ── reverse geocoding via Nominatim ─────────────────────────────────────────
// Nominatim usage policy: 1 request/sec, identifying User-Agent required.
// Single-mall script runs are well within courtesy bounds.

interface GeocodeResult {
  address: string;       // "<house_number> <road>" — joined
  city: string;
  state: string;         // 2-letter abbreviation
  zip_code: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "treehouse-finds-add-mall/1.0 (https://app.kentuckytreehouse.com)",
    },
  });
  if (!res.ok) {
    throw new Error(`Nominatim reverse-geocode HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    address?: {
      house_number?: string;
      road?: string;
      city?: string;
      town?: string;
      village?: string;
      hamlet?: string;
      county?: string;
      state?: string;
      postcode?: string;
    };
  };
  const a = data.address ?? {};
  const houseNumber = a.house_number ?? "";
  const road = a.road ?? "";
  const address = [houseNumber, road].filter(Boolean).join(" ").trim();
  // Nominatim names rural locales as town / village / hamlet — fall through
  // to whichever is present. county is a last-resort fallback.
  const city = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.county ?? "";
  const state = a.state ? abbreviateState(a.state) : "";
  const zip_code = a.postcode ?? "";

  if (!address || !city || !state || !zip_code) {
    console.warn("⚠️  Geocoder returned incomplete address. You may need to fill in:");
    if (!address) console.warn("   - address (house_number + road)");
    if (!city) console.warn("   - city");
    if (!state) console.warn("   - state");
    if (!zip_code) console.warn("   - zip_code");
    console.warn("   Edit the SQL preview before pasting, or pass --apply=false and update via /admin later.");
  }

  return { address, city, state, zip_code };
}

// ── SQL generation (matches supabase/seeds/001_mall_locations.sql) ──────────

interface MallRow {
  name: string;
  address: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  phone: string | null;
  website: string | null;
  google_maps_url: string;
  latitude: number;
  longitude: number;
  category: string;
  slug: string;
}

function sqlEscape(v: string): string {
  return `'${v.replace(/'/g, "''")}'`;
}

function valueOrNull(v: string | null): string {
  return v === null || v === "" ? "NULL" : sqlEscape(v);
}

function buildSql(row: MallRow): string {
  return `INSERT INTO malls (name, address, city, state, zip_code, phone, website, google_maps_url, latitude, longitude, category, slug)
VALUES (
  ${sqlEscape(row.name)},
  ${valueOrNull(row.address)},
  ${sqlEscape(row.city)},
  ${sqlEscape(row.state)},
  ${valueOrNull(row.zip_code)},
  ${valueOrNull(row.phone)},
  ${valueOrNull(row.website)},
  ${sqlEscape(row.google_maps_url)},
  ${row.latitude},
  ${row.longitude},
  ${sqlEscape(row.category)},
  ${sqlEscape(row.slug)}
)
ON CONFLICT (slug) DO UPDATE SET
  address         = EXCLUDED.address,
  city            = EXCLUDED.city,
  state           = EXCLUDED.state,
  zip_code        = EXCLUDED.zip_code,
  phone           = EXCLUDED.phone,
  website         = EXCLUDED.website,
  google_maps_url = EXCLUDED.google_maps_url,
  latitude        = EXCLUDED.latitude,
  longitude       = EXCLUDED.longitude,
  category        = EXCLUDED.category;`;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  console.log("\n=== add-mall ===");
  console.log(`URL: ${args.url}\n`);

  // 1. Parse URL
  const parsed = parseGoogleMapsUrl(args.url);
  console.log(`Parsed name:   ${parsed.name}`);
  console.log(`Parsed coords: ${parsed.latitude}, ${parsed.longitude}\n`);

  // 2. Reverse-geocode
  console.log("Reverse-geocoding via Nominatim…");
  const geo = await reverseGeocode(parsed.latitude, parsed.longitude);
  console.log(`  address:  ${geo.address || "(empty)"}`);
  console.log(`  city:     ${geo.city || "(empty)"}`);
  console.log(`  state:    ${geo.state || "(empty)"}`);
  console.log(`  zip_code: ${geo.zip_code || "(empty)"}\n`);

  // 3. Category — flag overrides inference
  let category = args.category ?? inferCategory(parsed.name);
  if (!category) {
    console.error(`❌ Could not infer category from name "${parsed.name}". Re-run with --category=<one of: ${VALID_CATEGORIES.join(", ")}>.`);
    process.exit(1);
  }
  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    console.error(`❌ Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}.`);
    process.exit(1);
  }
  console.log(`Category: ${category}${args.category ? " (from --category flag)" : " (inferred from name)"}`);

  // 4. Build the row
  const row: MallRow = {
    name:            parsed.name,
    address:         geo.address || null,
    city:            geo.city,
    state:           geo.state,
    zip_code:        geo.zip_code || null,
    phone:           args.phone ?? null,
    website:         args.website ?? null,
    google_maps_url: args.url,
    latitude:        parsed.latitude,
    longitude:       parsed.longitude,
    category,
    slug:            makeSlug(parsed.name),
  };
  console.log(`Slug:     ${row.slug}\n`);

  // 5. Print preview
  console.log("=== Resolved row ===");
  console.log(JSON.stringify(row, null, 2));
  console.log();

  // 6. Print SQL or apply
  const sql = buildSql(row);
  if (!args.apply) {
    console.log("=== SQL preview (paste into Supabase SQL editor) ===\n");
    console.log(sql);
    console.log("\nTip: re-run with --apply to write directly via service-role.");
    return;
  }

  // --apply path
  const env = loadEnv(args.envFile);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(`Env file ${args.envFile} is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.`);
  }
  console.log(`=== Applying via service-role to ${supabaseUrl} (env: ${args.envFile}) ===\n`);

  const svc = createClient(supabaseUrl, serviceKey);
  const { data, error } = await svc
    .from("malls")
    .upsert(row, { onConflict: "slug" })
    .select("id, name, slug, status, city, state, category")
    .single();

  if (error) {
    console.error("❌ Upsert failed:", error.message);
    process.exit(1);
  }
  console.log("✅ Wrote row:");
  console.log(JSON.stringify(data, null, 2));
  console.log("\nNext: activate via /admin Locations tab when ready (status defaults to 'draft').");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
