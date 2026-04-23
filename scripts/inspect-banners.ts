// scripts/inspect-banners.ts
// Session 48 — diagnostic for "banner uploads not persisting" symptom.
// Reads site_settings via service-role and anon, lists site-assets bucket
// contents, and verifies the bucket is public.
//
// Usage: npx tsx scripts/inspect-banners.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const ENV_PATH_CANDIDATES = [
  resolve(process.cwd(), ".env.local"),
  "/Users/davidbutler/Projects/treehouse-treasure-search/.env.local",
];

function loadEnv(): Record<string, string> {
  for (const path of ENV_PATH_CANDIDATES) {
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
  throw new Error(`No .env.local found. Tried:\n  ${ENV_PATH_CANDIDATES.join("\n  ")}`);
}

const env = loadEnv();
const svc  = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

(async () => {
  console.log("=== site_settings (service-role) ===");
  const svcRows = await svc.from("site_settings").select("*");
  console.log(JSON.stringify(svcRows, null, 2));

  console.log("\n=== site_settings (anon — what loadCurrent + Home/FindMap see) ===");
  const anonRows = await anon.from("site_settings").select("*");
  console.log(JSON.stringify(anonRows, null, 2));

  console.log("\n=== bucket: site-assets ===");
  const buckets = await svc.storage.listBuckets();
  const b = buckets.data?.find(x => x.id === "site-assets");
  console.log(b ?? "(bucket not found)");

  console.log("\n=== site-assets root listing ===");
  const root = await svc.storage.from("site-assets").list("", {
    limit: 20,
    sortBy: { column: "created_at", order: "desc" },
  });
  console.log(JSON.stringify(root.data, null, 2));
  if (root.error) console.log("ERR:", root.error);

  for (const sub of ["featured_find_image_url", "find_map_banner_image_url"]) {
    console.log(`\n=== site-assets/${sub}/ listing ===`);
    const r = await svc.storage.from("site-assets").list(sub, {
      limit: 20,
      sortBy: { column: "created_at", order: "desc" },
    });
    console.log(JSON.stringify(r.data, null, 2));
    if (r.error) console.log("ERR:", r.error);
  }
})();
