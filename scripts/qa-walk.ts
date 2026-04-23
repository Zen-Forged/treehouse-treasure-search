// scripts/qa-walk.ts
// T4d pre-beta QA walk helper — read-only Supabase queries + guarded cleanup.
// Runs against the service-role client so RLS does not mask empty returns.
//
// Usage:
//   npx tsx scripts/qa-walk.ts baseline
//   npx tsx scripts/qa-walk.ts check <boothNumber>
//   npx tsx scripts/qa-walk.ts check-email <email>
//   npx tsx scripts/qa-walk.ts cleanup <booth1> <booth2> ...           (dry run — default)
//   npx tsx scripts/qa-walk.ts cleanup <booth1> <booth2> ... --confirm (actually deletes)
//   npx tsx scripts/qa-walk.ts cleanup <booth1> ... --force-claimed    (bypass user_id safety gate)
//   npx tsx scripts/qa-walk.ts cleanup <booth1> ... --delete-auth=<email>,<email> (also delete auth users)
//
// Safety: --delete-auth refuses to delete NEXT_PUBLIC_ADMIN_EMAIL even if listed.
//
// Env source: reads the parent repo's .env.local directly so this works
// correctly when invoked from a git worktree (worktrees do not carry
// gitignored env files from the parent checkout).

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
    `No .env.local found. Tried:\n  ${ENV_PATH_CANDIDATES.join("\n  ")}`,
  );
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

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

async function baseline() {
  header("Pending vendor_requests");
  {
    const { data, error } = await supabase
      .from("vendor_requests")
      .select(
        "id, email, first_name, last_name, booth_name, booth_number, mall_id, status, created_at",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    table(data ?? []);
  }

  header("Unclaimed vendors (user_id IS NULL)");
  {
    const { data, error } = await supabase
      .from("vendors")
      .select(
        "id, display_name, booth_number, mall_id, user_id, slug, created_at",
      )
      .is("user_id", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    table(data ?? []);
  }

  header("David/Butler test variants — vendor_requests");
  {
    const { data, error } = await supabase
      .from("vendor_requests")
      .select(
        "id, email, first_name, last_name, booth_name, status, created_at",
      )
      .or(
        "email.ilike.%david%butler%,first_name.ilike.david,last_name.ilike.butler",
      );
    if (error) throw error;
    table(data ?? []);
  }

  header("David/Butler + ZenForged test variants — vendors");
  {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, display_name, booth_number, user_id, mall_id, created_at")
      .or("display_name.ilike.%david%butler%,display_name.ilike.%zenforged%");
    if (error) throw error;
    table(data ?? []);
  }

  header("Walk booth number collision check (999, 888, 777, 778)");
  {
    const { data, error } = await supabase
      .from("vendors")
      .select("id, display_name, booth_number, user_id, mall_id")
      .in("booth_number", ["999", "888", "777", "778"]);
    if (error) throw error;
    table(data ?? []);
  }
  {
    const { data, error } = await supabase
      .from("vendor_requests")
      .select("id, email, booth_name, booth_number, status")
      .in("booth_number", ["999", "888", "777", "778"]);
    if (error) throw error;
    table(data ?? []);
  }
}

async function check(boothNumber: string) {
  header(`Vendors at booth_number = ${boothNumber}`);
  const { data: vendors, error: vErr } = await supabase
    .from("vendors")
    .select("id, display_name, slug, booth_number, user_id, mall_id, created_at")
    .eq("booth_number", boothNumber);
  if (vErr) throw vErr;
  table(vendors ?? []);

  header(`vendor_requests at booth_number = ${boothNumber}`);
  const { data: reqs, error: rErr } = await supabase
    .from("vendor_requests")
    .select(
      "id, email, first_name, last_name, booth_name, status, created_at",
    )
    .eq("booth_number", boothNumber);
  if (rErr) throw rErr;
  table(reqs ?? []);

  if (vendors && vendors.length > 0) {
    const vendorIds = vendors.map((v) => v.id);
    header(`posts under these vendor(s)`);
    const { data: posts, error: pErr } = await supabase
      .from("posts")
      .select("id, title, vendor_id, status, created_at")
      .in("vendor_id", vendorIds);
    if (pErr) throw pErr;
    table(posts ?? []);
  }
}

async function checkEmail(email: string) {
  header(`vendor_requests for email = ${email}`);
  const { data: reqs, error: rErr } = await supabase
    .from("vendor_requests")
    .select(
      "id, email, first_name, last_name, booth_name, booth_number, mall_id, status, created_at",
    )
    .eq("email", email);
  if (rErr) throw rErr;
  table(reqs ?? []);

  header(`auth.users rows for email = ${email}`);
  const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
  if (uErr) throw uErr;
  const matched = (users?.users ?? []).filter(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  table(
    matched.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
    })),
  );

  const userIds = matched.map((u) => u.id);
  if (userIds.length) {
    header(`vendors linked to this user`);
    const { data: vs, error: vErr } = await supabase
      .from("vendors")
      .select("id, display_name, slug, booth_number, user_id, mall_id")
      .in("user_id", userIds);
    if (vErr) throw vErr;
    table(vs ?? []);
  }
}

async function cleanup(
  boothNumbers: string[],
  confirm: boolean,
  forceClaimed: boolean,
  deleteAuthEmails: string[],
) {
  if (boothNumbers.length === 0) {
    console.error("cleanup: pass at least one booth number");
    process.exit(1);
  }

  header(`Cleanup target booths: ${boothNumbers.join(", ")}`);
  console.log(confirm ? "MODE: --confirm (will DELETE)" : "MODE: dry-run");
  if (forceClaimed) console.log("FLAG: --force-claimed (safety gate bypassed)");

  const { data: vendors, error: vErr } = await supabase
    .from("vendors")
    .select("id, display_name, booth_number, user_id")
    .in("booth_number", boothNumbers);
  if (vErr) throw vErr;

  const claimed = (vendors ?? []).filter((v) => v.user_id !== null);
  if (claimed.length > 0 && !forceClaimed) {
    console.log(
      `\n⚠️  ${claimed.length} vendor row(s) are CLAIMED (user_id != null).`,
    );
    console.table(claimed);
    console.log(
      "Refusing to auto-delete claimed vendors. Pass --force-claimed to bypass.",
    );
    return;
  }
  if (claimed.length > 0 && forceClaimed) {
    console.log(
      `\n⚠️  ${claimed.length} CLAIMED vendor row(s) will be deleted (--force-claimed):`,
    );
    console.table(claimed);
  }

  const vendorIds = (vendors ?? []).map((v) => v.id);

  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("id, title, vendor_id")
    .in("vendor_id", vendorIds.length ? vendorIds : ["__none__"]);
  if (pErr) throw pErr;

  const { data: reqs, error: rErr } = await supabase
    .from("vendor_requests")
    .select("id, email, booth_number, status")
    .in("booth_number", boothNumbers);
  if (rErr) throw rErr;

  const adminEmail = (env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").toLowerCase();
  const authTargets: { id: string; email: string }[] = [];
  if (deleteAuthEmails.length > 0) {
    const { data: users, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr) throw uErr;
    for (const emailRaw of deleteAuthEmails) {
      const email = emailRaw.trim().toLowerCase();
      if (!email) continue;
      if (email === adminEmail) {
        console.log(`⛔  Refusing to delete admin email ${email} — ignored.`);
        continue;
      }
      const match = (users?.users ?? []).find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (!match) {
        console.log(`  (auth user ${email} not found — skipping)`);
        continue;
      }
      authTargets.push({ id: match.id, email: match.email ?? email });
    }
  }

  console.log("\nWill delete:");
  console.log(`  posts: ${posts?.length ?? 0}`);
  console.log(`  vendors: ${vendors?.length ?? 0}`);
  console.log(`  vendor_requests: ${reqs?.length ?? 0}`);
  console.log(`  auth.users: ${authTargets.length}`);

  if (posts && posts.length) table(posts);
  if (vendors && vendors.length) table(vendors);
  if (reqs && reqs.length) table(reqs);
  if (authTargets.length) table(authTargets);

  if (!confirm) {
    console.log("\nDry run complete. Re-run with --confirm to execute.");
    return;
  }

  if (posts && posts.length) {
    const { error } = await supabase
      .from("posts")
      .delete()
      .in(
        "id",
        posts.map((p) => p.id),
      );
    if (error) throw error;
    console.log(`✓ Deleted ${posts.length} post(s)`);
  }
  if (vendors && vendors.length) {
    const { error } = await supabase
      .from("vendors")
      .delete()
      .in(
        "id",
        vendors.map((v) => v.id),
      );
    if (error) throw error;
    console.log(`✓ Deleted ${vendors.length} vendor row(s)`);
  }
  if (reqs && reqs.length) {
    const { error } = await supabase
      .from("vendor_requests")
      .delete()
      .in(
        "id",
        reqs.map((r) => r.id),
      );
    if (error) throw error;
    console.log(`✓ Deleted ${reqs.length} vendor_request(s)`);
  }
  for (const target of authTargets) {
    const { error } = await supabase.auth.admin.deleteUser(target.id);
    if (error) {
      console.log(`✗ Failed to delete auth user ${target.email}: ${error.message}`);
    } else {
      console.log(`✓ Deleted auth user ${target.email}`);
    }
  }

  console.log("\nCleanup complete.");
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "baseline":
      await baseline();
      break;
    case "check":
      if (!rest[0]) {
        console.error("check: pass a booth number");
        process.exit(1);
      }
      await check(rest[0]);
      break;
    case "check-email":
      if (!rest[0]) {
        console.error("check-email: pass an email");
        process.exit(1);
      }
      await checkEmail(rest[0]);
      break;
    case "cleanup": {
      const confirm = rest.includes("--confirm");
      const forceClaimed = rest.includes("--force-claimed");
      const deleteAuthArg = rest.find((x) => x.startsWith("--delete-auth="));
      const deleteAuthEmails = deleteAuthArg
        ? deleteAuthArg.slice("--delete-auth=".length).split(",")
        : [];
      const booths = rest.filter(
        (x) =>
          x !== "--confirm" &&
          x !== "--force-claimed" &&
          !x.startsWith("--delete-auth="),
      );
      await cleanup(booths, confirm, forceClaimed, deleteAuthEmails);
      break;
    }
    default:
      console.error(
        "Usage: npx tsx scripts/qa-walk.ts <baseline | check <booth> | cleanup <booth...> [--confirm]>",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
