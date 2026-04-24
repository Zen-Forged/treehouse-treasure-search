// scripts/seed-staging.ts
// Ladder B Task 8 — idempotent fixture seed for the staging Supabase project.
// Mirrors scripts/qa-walk.ts shape: service-role client + console tables.
//
// Usage:
//   npx tsx scripts/seed-staging.ts status
//   npx tsx scripts/seed-staging.ts seed
//   npx tsx scripts/seed-staging.ts wipe
//   npx tsx scripts/seed-staging.ts seed --env-file=.env.staging.local
//
// Safety rails:
//   - Defaults to .env.staging.local (NOT .env.local). Pass --env-file to override.
//   - Refuses to run against any env file whose path does not contain "staging"
//     unless --i-know-this-is-not-staging is passed explicitly.
//   - Prints the target URL before any mutation so mis-pointing is visible.
//
// Fixture plan (booth numbers in 900-series to avoid collision with
// qa-walk.ts walk-booth range 777/778/888/999 and any real vendor bookings):
//   - Admin auth user: NEXT_PUBLIC_ADMIN_EMAIL (magic-link sign-in only; no password)
//   - Vendor A: "Staging Test Vendor Alpha" @ booth 901, first mall by name
//   - Vendor B: "Staging Test Vendor Beta"  @ booth 902, second mall by name
//   - Posts: 3 per vendor (6 total), mix of available + sold
//   - site_settings: featured_find_image_url + find_map_banner_image_url (placeholder URLs)
//
// Idempotency: all upserts keyed on natural keys (vendors.slug, posts.title
// within vendor). Running `seed` twice produces the same state as running it once.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DEFAULT_ENV_FILE = ".env.staging.local";

function parseArgs(): { cmd: string; envFile: string; bypassSafety: boolean } {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? "";
  const envFileArg = args.find((a) => a.startsWith("--env-file="));
  const envFile = envFileArg ? envFileArg.slice("--env-file=".length) : DEFAULT_ENV_FILE;
  const bypassSafety = args.includes("--i-know-this-is-not-staging");
  return { cmd, envFile, bypassSafety };
}

function loadEnv(envFile: string): Record<string, string> {
  const candidates = [
    resolve(process.cwd(), envFile),
    resolve("/Users/davidbutler/Projects/treehouse-treasure-search", envFile),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    const raw = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  }
  throw new Error(
    `No env file found. Tried:\n  ${candidates.join("\n  ")}\n\nPass --env-file=<path> or create ${envFile}.`,
  );
}

const { cmd, envFile, bypassSafety } = parseArgs();

if (!envFile.includes("staging") && !bypassSafety) {
  console.error(
    `\n⛔  Refusing to run against env file without "staging" in the path: ${envFile}`,
  );
  console.error(
    `    If you really mean to target another project, pass --i-know-this-is-not-staging.\n`,
  );
  process.exit(1);
}

const env = loadEnv(envFile);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = env.NEXT_PUBLIC_ADMIN_EMAIL;

if (!url || !serviceKey) {
  throw new Error(
    `Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envFile}`,
  );
}
if (!adminEmail) {
  throw new Error(`Missing NEXT_PUBLIC_ADMIN_EMAIL in ${envFile}`);
}

console.log(`\n━━━ seed-staging ━━━`);
console.log(`env file:   ${envFile}`);
console.log(`target URL: ${url}`);
console.log(`admin:      ${adminEmail}`);
console.log(`command:    ${cmd || "(none)"}\n`);

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function header(title: string) {
  console.log(`\n━━━ ${title} ━━━`);
}

function table(rows: Record<string, unknown>[]): void {
  if (!rows.length) {
    console.log("  (no rows)");
    return;
  }
  console.table(rows);
}

// ── Fixture definitions ──────────────────────────────────────────────────────

const STAGING_PREFIX = "Staging Test Vendor";

interface VendorFixture {
  slug:         string;
  display_name: string;
  booth_number: string;
  bio:          string;
  mall_slug:    string; // resolved to mall_id at seed time
}

interface PostFixture {
  vendor_slug: string; // resolved to vendor_id at seed time
  title:       string;
  caption:     string;
  price:       number | null;
  status:      "available" | "sold";
}

const VENDOR_FIXTURES: VendorFixture[] = [
  {
    slug:         "staging-test-vendor-alpha",
    display_name: `${STAGING_PREFIX} Alpha`,
    booth_number: "901",
    bio:          "Seeded for staging — mid-century glassware and small ceramics.",
    mall_slug:    "winchester-peddlers-mall",
  },
  {
    slug:         "staging-test-vendor-beta",
    display_name: `${STAGING_PREFIX} Beta`,
    booth_number: "902",
    bio:          "Seeded for staging — vintage tools and farmhouse primitives.",
    mall_slug:    "richmond-peddlers-mall",
  },
];

const POST_FIXTURES: PostFixture[] = [
  { vendor_slug: "staging-test-vendor-alpha", title: "Milk glass vase",            caption: "Hazel-Atlas, 9\" tall, no chips.",                         price: 24,  status: "available" },
  { vendor_slug: "staging-test-vendor-alpha", title: "Depression-era candy dish",  caption: "Pink glass, footed, light wear on rim.",                   price: 18,  status: "available" },
  { vendor_slug: "staging-test-vendor-alpha", title: "McCoy pottery planter",      caption: "Green matte, small, excellent condition.",                 price: 32,  status: "sold"      },
  { vendor_slug: "staging-test-vendor-beta",  title: "Cast iron skillet, No. 8",   caption: "Unmarked, fully restored, cooks like a dream.",            price: 45,  status: "available" },
  { vendor_slug: "staging-test-vendor-beta",  title: "Hand-forged drawknife",      caption: "20\" blade, tight grip, sharpened ready to use.",          price: 60,  status: "available" },
  { vendor_slug: "staging-test-vendor-beta",  title: "Wooden egg crate",           caption: "Original blue paint, stenciled dairy, dovetail joints.",   price: null, status: "available" },
];

const SITE_SETTINGS_FIXTURES: { key: string; url: string | null }[] = [
  { key: "featured_find_image_url",   url: null },
  { key: "find_map_banner_image_url", url: null },
];

// ── Operations ───────────────────────────────────────────────────────────────

async function ensureAdminUser(): Promise<string> {
  const { data: list, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const existing = (list?.users ?? []).find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase(),
  );
  if (existing) {
    console.log(`  admin auth user: exists (id ${existing.id})`);
    return existing.id;
  }
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: adminEmail,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  if (!created?.user?.id) throw new Error("createUser returned no user");
  console.log(`  admin auth user: created (id ${created.user.id})`);
  return created.user.id;
}

async function resolveMallIds(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("malls")
    .select("id, slug")
    .in(
      "slug",
      VENDOR_FIXTURES.map((v) => v.mall_slug),
    );
  if (error) throw error;
  const missing = VENDOR_FIXTURES.map((v) => v.mall_slug).filter(
    (slug) => !(data ?? []).find((m) => m.slug === slug),
  );
  if (missing.length) {
    throw new Error(
      `Malls not found: ${missing.join(", ")}. Run the mall seed (supabase/seeds/001_mall_locations.sql) first.`,
    );
  }
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.slug] = row.id;
  return map;
}

async function status() {
  header("malls count");
  {
    const { count, error } = await supabase
      .from("malls")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    console.log(`  ${count ?? 0} malls`);
  }

  header("staging test vendors");
  {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, display_name, slug, booth_number, mall_id")
      .like("display_name", `${STAGING_PREFIX}%`);
    if (error) throw error;
    table(data ?? []);
  }

  header("posts under staging vendors");
  {
    const { data: vs } = await supabase
      .from("vendors")
      .select("id")
      .like("display_name", `${STAGING_PREFIX}%`);
    const ids = (vs ?? []).map((v) => v.id);
    if (!ids.length) {
      console.log("  (no vendors — nothing to check)");
    } else {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, price_asking, status, vendor_id")
        .in("vendor_id", ids);
      if (error) throw error;
      table(data ?? []);
    }
  }

  header("site_settings rows");
  {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value, updated_at");
    if (error) throw error;
    table(data ?? []);
  }

  header("auth users");
  {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    table(
      (data?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
      })),
    );
  }
}

async function seed() {
  header("1. admin auth user");
  const adminUserId = await ensureAdminUser();

  header("2. resolve mall ids");
  const mallIds = await resolveMallIds();
  table(
    Object.entries(mallIds).map(([slug, id]) => ({ slug, id })),
  );

  header("3. upsert vendors");
  for (const fixture of VENDOR_FIXTURES) {
    const mall_id = mallIds[fixture.mall_slug];
    const { data: existing } = await supabase
      .from("vendors")
      .select("id")
      .eq("slug", fixture.slug)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("vendors")
        .update({
          display_name: fixture.display_name,
          booth_number: fixture.booth_number,
          bio:          fixture.bio,
          mall_id,
          user_id:      adminUserId,
        })
        .eq("id", existing.id);
      if (error) throw error;
      console.log(`  updated vendor ${fixture.slug} (id ${existing.id})`);
    } else {
      const { data, error } = await supabase
        .from("vendors")
        .insert({
          slug:         fixture.slug,
          display_name: fixture.display_name,
          booth_number: fixture.booth_number,
          bio:          fixture.bio,
          mall_id,
          user_id:      adminUserId,
        })
        .select("id")
        .single();
      if (error) throw error;
      console.log(`  inserted vendor ${fixture.slug} (id ${data.id})`);
    }
  }

  header("4. resolve vendor ids by slug");
  const { data: vendorRows, error: vErr } = await supabase
    .from("vendors")
    .select("id, slug, mall_id")
    .in(
      "slug",
      VENDOR_FIXTURES.map((v) => v.slug),
    );
  if (vErr) throw vErr;
  const vendorIdBySlug: Record<string, { id: string; mall_id: string }> = {};
  for (const row of vendorRows ?? []) {
    vendorIdBySlug[row.slug] = { id: row.id, mall_id: row.mall_id };
  }

  header("5. upsert posts");
  for (const fixture of POST_FIXTURES) {
    const vendor = vendorIdBySlug[fixture.vendor_slug];
    if (!vendor) {
      console.log(`  ! vendor ${fixture.vendor_slug} missing — skipping post "${fixture.title}"`);
      continue;
    }
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("vendor_id", vendor.id)
      .eq("title", fixture.title)
      .maybeSingle();

    const payload = {
      vendor_id:    vendor.id,
      mall_id:      vendor.mall_id,
      title:        fixture.title,
      caption:      fixture.caption,
      price_asking: fixture.price,
      status:       fixture.status,
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
      console.log(`  updated post "${fixture.title}" (id ${existing.id})`);
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      console.log(`  inserted post "${fixture.title}" (id ${data.id})`);
    }
  }

  header("6. site_settings");
  for (const fixture of SITE_SETTINGS_FIXTURES) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({
        key:   fixture.key,
        value: { url: fixture.url },
      });
    if (error) throw error;
    console.log(`  upserted site_settings.${fixture.key}`);
  }

  console.log("\n✓ Seed complete. Run `status` to verify.");
}

async function wipe() {
  header("wipe: posts under staging vendors");
  const { data: vs } = await supabase
    .from("vendors")
    .select("id")
    .like("display_name", `${STAGING_PREFIX}%`);
  const vendorIds = (vs ?? []).map((v) => v.id);

  if (vendorIds.length) {
    const { data: posts, error: pSelErr } = await supabase
      .from("posts")
      .select("id")
      .in("vendor_id", vendorIds);
    if (pSelErr) throw pSelErr;
    if (posts?.length) {
      const { error } = await supabase
        .from("posts")
        .delete()
        .in(
          "id",
          posts.map((p) => p.id),
        );
      if (error) throw error;
      console.log(`  deleted ${posts.length} post(s)`);
    } else {
      console.log("  (no posts to delete)");
    }
  }

  header("wipe: vendors");
  if (vendorIds.length) {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .in("id", vendorIds);
    if (error) throw error;
    console.log(`  deleted ${vendorIds.length} vendor(s)`);
  } else {
    console.log("  (no vendors to delete)");
  }

  console.log("\n  (site_settings rows and admin auth user are NOT wiped — they're shared fixtures)");
  console.log("\n✓ Wipe complete.");
}

async function main() {
  switch (cmd) {
    case "status":
      await status();
      break;
    case "seed":
      await seed();
      break;
    case "wipe":
      await wipe();
      break;
    default:
      console.error(
        "Usage: npx tsx scripts/seed-staging.ts <status | seed | wipe> [--env-file=<path>]",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
