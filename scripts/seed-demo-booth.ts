// scripts/seed-demo-booth.ts
// Session 206 #6 — create the admin's demo booth tied to david@zenforged.com.
//
// The demo booth is a real vendor row owned by the admin (user_id = admin's
// auth user). The admin reaches it via the Booth nav tab (/my-shelf filters by
// user_id) and seeds it with sample finds for demos — but it carries
// hidden_from_feed = TRUE (migration 027) so it never appears in the public
// Explore feed / search / per-mall stats for other users.
//
// Idempotent: if the admin already owns a vendor row, this flips
// hidden_from_feed = TRUE on it (and leaves everything else alone) rather than
// creating a duplicate.
//
// Usage:
//   # Preview only — resolves the admin user + target mall, prints the row,
//   # writes nothing:
//   npx tsx scripts/seed-demo-booth.ts
//
//   # Apply via service-role to whichever project .env.local points at:
//   npx tsx scripts/seed-demo-booth.ts --apply
//
//   # Pick the mall (defaults to the first ACTIVE mall) + override identity:
//   npx tsx scripts/seed-demo-booth.ts --apply \
//     --mall-slug=americas-antique-mall \
//     --name="Treehouse Demo Booth" --booth=DEMO
//
//   # Target staging / a specific admin email:
//   npx tsx scripts/seed-demo-booth.ts --apply --env-file=.env.staging.local \
//     --email=david@zenforged.com
//
// Prereq: migration 027 (vendors.hidden_from_feed) must already be applied to
// the target project, else the insert/update on that column errors.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

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

function flag(key: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${key}=`));
  return hit ? hit.slice(`--${key}=`.length) : undefined;
}

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const argv    = process.argv.slice(2);
  const apply   = argv.includes("--apply");
  const envFile = flag("env-file") ?? DEFAULT_ENV_FILE;
  const display = flag("name")     ?? "Treehouse Demo Booth";
  const booth   = flag("booth")    ?? "DEMO";
  const mallSlug = flag("mall-slug");

  const env = loadEnv(envFile);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail  = flag("email") ?? env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!supabaseUrl || !serviceKey) {
    throw new Error(`Env file ${envFile} is missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.`);
  }
  if (!adminEmail) {
    throw new Error(`No admin email — set NEXT_PUBLIC_ADMIN_EMAIL or pass --email=...`);
  }

  console.log(`=== seed-demo-booth (${apply ? "APPLY" : "PREVIEW"}) → ${supabaseUrl} (env: ${envFile}) ===\n`);
  const svc = createClient(supabaseUrl, serviceKey);

  // 1. Resolve the admin auth user by email.
  const { data: usersPage, error: usersErr } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersErr) throw new Error(`listUsers failed: ${usersErr.message}`);
  const adminUser = usersPage.users.find(
    (u) => (u.email ?? "").toLowerCase() === adminEmail.toLowerCase(),
  );
  if (!adminUser) {
    throw new Error(`No auth user found with email ${adminEmail}. Sign in once via /login to create the auth user, then re-run.`);
  }
  console.log(`Admin user:  ${adminEmail}  (${adminUser.id})`);

  // 2. Already own a vendor row? → flip hidden_from_feed, don't duplicate.
  const { data: existing, error: existErr } = await svc
    .from("vendors")
    .select("id, display_name, booth_number, slug, mall_id, hidden_from_feed")
    .eq("user_id", adminUser.id);
  if (existErr) throw new Error(`vendors lookup failed: ${existErr.message}`);

  if (existing && existing.length > 0) {
    const v = existing[0];
    console.log(`\nAdmin already owns a booth: "${v.display_name}" (booth ${v.booth_number ?? "—"}, slug ${v.slug}, hidden_from_feed=${v.hidden_from_feed}).`);
    if (v.hidden_from_feed) {
      console.log("Already hidden_from_feed=TRUE — nothing to do.");
      return;
    }
    console.log("→ Will set hidden_from_feed = TRUE on this existing booth.");
    if (!apply) { console.log("\n(preview — pass --apply to write)"); return; }
    const { error } = await svc.from("vendors").update({ hidden_from_feed: true }).eq("id", v.id);
    if (error) throw new Error(`update failed: ${error.message}`);
    console.log("✅ Flipped hidden_from_feed = TRUE.");
    return;
  }

  // 3. Resolve target mall (explicit slug, else first ACTIVE mall).
  let mallQuery = svc.from("malls").select("id, name, slug, status");
  mallQuery = mallSlug ? mallQuery.eq("slug", mallSlug) : mallQuery.eq("status", "active").limit(1);
  const { data: malls, error: mallErr } = await mallQuery;
  if (mallErr) throw new Error(`malls lookup failed: ${mallErr.message}`);
  const mall = malls?.[0];
  if (!mall) {
    throw new Error(mallSlug ? `No mall with slug "${mallSlug}".` : `No active mall found — pass --mall-slug=...`);
  }
  console.log(`Target mall: ${mall.name}  (${mall.slug})`);

  // 4. Build the demo vendor row.
  const slug = makeSlug(display);
  const row = {
    user_id:          adminUser.id,
    mall_id:          mall.id,
    display_name:     display,
    booth_number:     booth,
    slug,
    hidden_from_feed: true,
  };
  console.log("\nDemo booth row:");
  console.log(JSON.stringify(row, null, 2));

  if (!apply) { console.log("\n(preview — pass --apply to write)"); return; }

  const { data, error } = await svc
    .from("vendors")
    .insert(row)
    .select("id, display_name, booth_number, slug, mall_id, hidden_from_feed")
    .single();
  if (error) throw new Error(`insert failed: ${error.message}`);
  console.log("\n✅ Created demo booth:");
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nNext: sign in as ${adminEmail} → tap the Booth nav tab → add sample finds. They stay out of the public feed (hidden_from_feed=TRUE).`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
