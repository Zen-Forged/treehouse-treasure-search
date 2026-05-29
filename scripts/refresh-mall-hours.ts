// scripts/refresh-mall-hours.ts
// Session 203 — Location hours Shape B Arc 2. Local manual-trigger of the same
// hours refresh the weekly cron runs (D2), for the FIRST populate so Arc 3-4
// have real data to display without waiting for the deploy + Monday schedule.
// Shares fetchPlaceHours + toHoursUpdate with the cron route (lib/googlePlaces.ts)
// so the column mapping can't drift between the two.
//
// Usage:
//   # Dry run — fetches + prints what it'd write, writes nothing:
//   npx tsx scripts/refresh-mall-hours.ts
//
//   # Apply — writes hours_json / timezone / business_status / fetched_at:
//   npx tsx scripts/refresh-mall-hours.ts --apply
//
//   # Different env file:
//   npx tsx scripts/refresh-mall-hours.ts --apply --env-file=.env.staging.local
//
// Prerequisite: migration 025 applied + place_ids backfilled
// (scripts/backfill-mall-place-ids.ts) + GOOGLE_PLACES_API_KEY in the env file.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { fetchPlaceHours, toHoursUpdate } from "../lib/googlePlaces";

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MallRow {
  id: string;
  name: string;
  place_id: string | null;
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes("--apply");
  const envFileFlag = argv.find((a) => a.startsWith("--env-file="));
  const envFile = envFileFlag ? envFileFlag.slice("--env-file=".length) : DEFAULT_ENV_FILE;

  const env = loadEnv(envFile);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(`Env file ${envFile} is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.`);
  }
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error(`Env file ${envFile} is missing GOOGLE_PLACES_API_KEY.`);
  }
  // lib/googlePlaces.ts reads process.env; bridge the manual env-file load.
  process.env.GOOGLE_PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY;

  console.log("\n=== refresh-mall-hours ===");
  console.log(`Target:  ${supabaseUrl} (env: ${envFile})`);
  console.log(`Mode:    ${apply ? "APPLY (writes hours)" : "DRY RUN (no writes)"}\n`);

  const svc = createClient(supabaseUrl, serviceKey);
  const { data: malls, error } = await svc
    .from("malls")
    .select("id, name, place_id")
    .eq("status", "active")
    .not("place_id", "is", null);
  if (error) throw new Error(`Mall fetch failed: ${error.message}`);
  if (!malls || malls.length === 0) {
    console.log("No active malls with a place_id. Run backfill-mall-place-ids.ts first.");
    return;
  }

  console.log(`Refreshing ${malls.length} mall(s)…\n`);
  const nowIso = new Date().toISOString();
  let updated = 0;
  const failures: { name: string; error: string }[] = [];

  for (const m of malls as MallRow[]) {
    try {
      const result = await fetchPlaceHours(m.place_id as string);
      const days = result.regularOpeningHours?.weekdayDescriptions?.length ?? 0;
      console.log(`✅ ${m.name}`);
      console.log(`     → status: ${result.businessStatus ?? "(none)"} · tz: ${result.timeZone ?? "(none)"} · ${days} day rows`);
      if (days === 0) {
        console.log(`     ⚠️  no published hours → badge will fall back to deep-link (D9)`);
      }
      if (apply) {
        const { error: upErr } = await svc
          .from("malls")
          .update(toHoursUpdate(result, nowIso))
          .eq("id", m.id);
        if (upErr) failures.push({ name: m.name, error: upErr.message });
        else updated++;
      } else {
        updated++;
      }
    } catch (e) {
      console.log(`⚠️  ERROR  ${m.name}: ${(e as Error).message}`);
      failures.push({ name: m.name, error: (e as Error).message });
    }
    await sleep(200);
  }

  console.log(`\n=== Summary ===`);
  console.log(`${apply ? "Wrote" : "Would write"}: ${updated}`);
  console.log(`Failed: ${failures.length}`);
  for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
  if (!apply && updated > 0) console.log(`\nDry run only. Re-run with --apply to write.`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
