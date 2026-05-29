// scripts/backfill-mall-place-ids.ts
// Session 203 — Location hours Shape B Arc 1. One-time resolution of each
// active mall's Google Places `place_id`, written to malls.place_id (added in
// migration 025). The weekly hours-refresh cron (Arc 2) then calls Place
// Details by place_id; this script is what gives it the IDs to call.
//
// Why a separate one-time script (not folded into add-mall.ts yet): add-mall
// predates the hours feature and uses free OpenStreetMap geocoding, no Google
// key. Folding place_id resolution into add-mall at add-time is Tier B
// (docs/location-hours-design.md §5). For the existing ~29 malls, this
// backfill is the bridge.
//
// Source: Places API (New) Text Search — POST places:searchText. We request
// only places.id + displayName + formattedAddress (cheap tier, and a one-time
// ~29-call run is comfortably inside the free monthly cap regardless). The
// displayName/formattedAddress are logged so the operator can eyeball that the
// right business matched before trusting the place_id — a name+address search
// can mis-resolve, so this is operator-in-the-loop by design.
//
// Usage:
//   # Dry run — resolves + prints the match table, writes nothing:
//   npx tsx scripts/backfill-mall-place-ids.ts
//
//   # Apply — writes resolved place_ids via service-role:
//   npx tsx scripts/backfill-mall-place-ids.ts --apply
//
//   # Re-resolve malls that already have a place_id too (default: only NULLs):
//   npx tsx scripts/backfill-mall-place-ids.ts --all --apply
//
//   # Different env file (staging, etc.):
//   npx tsx scripts/backfill-mall-place-ids.ts --apply --env-file=.env.staging.local
//
// Prerequisite: migration 025 applied to the target project, and
// GOOGLE_PLACES_API_KEY present in the env file.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ── env loader (matches scripts/add-mall.ts) ────────────────────────────────

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

// ── arg parsing ──────────────────────────────────────────────────────────────

interface Args {
  apply: boolean;
  all: boolean;
  envFile: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const flag = (key: string): string | undefined => {
    const hit = argv.find((a) => a.startsWith(`--${key}=`));
    return hit ? hit.slice(`--${key}=`.length) : undefined;
  };
  return {
    apply: argv.includes("--apply"),
    all: argv.includes("--all"),
    envFile: flag("env-file") ?? DEFAULT_ENV_FILE,
  };
}

// ── Places Text Search (New) ─────────────────────────────────────────────────

interface MallRow {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  place_id: string | null;
}

interface TextSearchMatch {
  placeId: string;
  matchedName: string;
  matchedAddress: string;
}

async function resolvePlaceId(apiKey: string, mall: MallRow): Promise<TextSearchMatch | null> {
  const textQuery = [mall.name, mall.address, mall.city, mall.state]
    .filter(Boolean)
    .join(", ");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // Cheap field mask — id + just enough to eyeball the match.
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({ textQuery }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Text Search HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
    }>;
  };

  const top = data.places?.[0];
  if (!top?.id) return null;
  return {
    placeId: top.id,
    matchedName: top.displayName?.text ?? "(no name)",
    matchedAddress: top.formattedAddress ?? "(no address)",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const env = loadEnv(args.envFile);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const placesKey = env.GOOGLE_PLACES_API_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(`Env file ${args.envFile} is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.`);
  }
  if (!placesKey) {
    throw new Error(`Env file ${args.envFile} is missing GOOGLE_PLACES_API_KEY (Arc 0 Step 8).`);
  }

  console.log("\n=== backfill-mall-place-ids ===");
  console.log(`Target:  ${supabaseUrl} (env: ${args.envFile})`);
  console.log(`Mode:    ${args.apply ? "APPLY (writes place_id)" : "DRY RUN (no writes)"}`);
  console.log(`Scope:   active malls${args.all ? "" : " missing place_id"}\n`);

  const svc = createClient(supabaseUrl, serviceKey);

  let query = svc
    .from("malls")
    .select("id, name, address, city, state, zip_code, place_id")
    .eq("status", "active");
  if (!args.all) query = query.is("place_id", null);

  const { data: malls, error } = await query;
  if (error) throw new Error(`Mall fetch failed: ${error.message}`);
  if (!malls || malls.length === 0) {
    console.log("No malls to resolve. (All active malls already have place_id — re-run with --all to refresh.)");
    return;
  }

  console.log(`Resolving ${malls.length} mall(s)…\n`);

  let resolved = 0;
  let missed = 0;

  for (const mall of malls as MallRow[]) {
    try {
      const match = await resolvePlaceId(placesKey, mall);
      if (!match) {
        console.log(`❌ NO MATCH  ${mall.name}`);
        missed++;
        await sleep(200);
        continue;
      }
      console.log(`✅ ${mall.name}`);
      console.log(`     → matched: ${match.matchedName} — ${match.matchedAddress}`);
      console.log(`     → place_id: ${match.placeId}`);

      if (args.apply) {
        const { error: upErr } = await svc
          .from("malls")
          .update({ place_id: match.placeId })
          .eq("id", mall.id);
        if (upErr) {
          console.log(`     ⚠️  write failed: ${upErr.message}`);
        } else {
          resolved++;
        }
      } else {
        resolved++;
      }
    } catch (err) {
      console.log(`⚠️  ERROR  ${mall.name}: ${(err as Error).message}`);
      missed++;
    }
    // Courtesy spacing; Places allows high QPS but a one-time run needn't rush.
    await sleep(200);
  }

  console.log(`\n=== Summary ===`);
  console.log(`${args.apply ? "Wrote" : "Would write"}: ${resolved}`);
  console.log(`Missed (no match / error): ${missed}`);
  if (missed > 0) {
    console.log(`\nMissed malls keep place_id = NULL → the open-now badge falls back`);
    console.log(`to the Shape A "Hours on Google" deep-link (D9). Re-run after fixing`);
    console.log(`name/address, or resolve those manually via the Google Maps listing.`);
  }
  if (!args.apply && resolved > 0) {
    console.log(`\nDry run only. Eyeball the matches above, then re-run with --apply.`);
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
