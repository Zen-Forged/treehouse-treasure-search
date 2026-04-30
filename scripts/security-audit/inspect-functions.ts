// scripts/security-audit/inspect-functions.ts
//
// Read-only diagnostic for Supabase function_search_path_mutable advisor
// finding. Lists every user-defined function in the `public` schema and
// reports whether its search_path is pinned.
//
// Methodology — STATE only:
//   Calls audit_function_search_path() RPC (migration 017) which reads
//   pg_proc.proconfig directly. Same axis the Supabase Security Advisor uses.
//
// Pinning search_path mitigates schema-shadowing attacks where a privileged
// caller creates same-named objects in a schema earlier on the search_path
// to hijack what a function does. The default mitigation is `SET search_path
// = pg_catalog, public` on each function.
//
// Usage:
//   npx tsx scripts/security-audit/inspect-functions.ts            # prod
//   npx tsx scripts/security-audit/inspect-functions.ts staging    # staging
//
// Cadence (see docs/security-audit-runbook.md):
//   - On every Supabase Security Advisor email about function_search_path_mutable
//   - Before every beta/production milestone
//   - Quarterly thereafter

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

type Target = "prod" | "staging";

interface FunctionRow {
  function_name:        string;
  has_search_path:      boolean;
  search_path_value:    string | null;
  is_security_definer:  boolean;
}

// ─── Env loader ─────────────────────────────────────────────────────────────

function loadEnv(target: Target): Record<string, string> {
  const file = target === "staging" ? ".env.staging.local" : ".env.local";
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) {
    throw new Error(`Env file not found: ${path}`);
  }
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
  for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!out[k]) throw new Error(`Missing ${k} in ${file}`);
  }
  return out;
}

// ─── Probe ─────────────────────────────────────────────────────────────────

async function fetchFunctions(svc: SupabaseClient): Promise<FunctionRow[] | null> {
  const { data, error } = await svc.rpc("audit_function_search_path");
  if (error) {
    console.warn(`⚠️  audit_function_search_path() RPC unavailable: ${error.message}`);
    console.warn(`    → apply supabase/migrations/017_security_function_search_path.sql first.\n`);
    return null;
  }
  return data as FunctionRow[];
}

// ─── Main ──────────────────────────────────────────────────────────────────

(async () => {
  const target: Target = (process.argv[2] === "staging" ? "staging" : "prod");
  const env = loadEnv(target);

  console.log("============================================================");
  console.log(`Supabase function search_path audit — target: ${target}`);
  console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("============================================================\n");

  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = await fetchFunctions(svc);
  if (!rows) {
    process.exit(2);
  }

  if (rows.length === 0) {
    console.log("No user-defined functions in public schema. Nothing to audit.");
    return;
  }

  let flagged = 0;
  for (const r of rows) {
    const icon = r.has_search_path ? "✅" : "❌";
    if (!r.has_search_path) flagged++;
    const def = r.is_security_definer ? " [SECURITY DEFINER]" : "";
    console.log(`${icon} ${r.function_name}${def}`);
    if (r.has_search_path) {
      console.log(`   search_path:     ${r.search_path_value}`);
    } else {
      console.log(`   search_path:     <mutable — advisor will flag>`);
    }
    console.log("");
  }

  console.log("============================================================");
  console.log(`Summary — target: ${target}`);
  console.log(`  ✅ pinned:    ${rows.length - flagged}`);
  console.log(`  ❌ mutable:   ${flagged}  (advisor will flag function_search_path_mutable)`);
  console.log("============================================================");

  if (flagged > 0) {
    console.log("\n⚠️  Mutable functions detected. Add SET search_path = pg_catalog, public");
    console.log("    to each (CREATE OR REPLACE works) and re-run.");
    process.exit(1);
  }
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
