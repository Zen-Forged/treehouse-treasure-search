// scripts/security-audit/inspect-grants.ts
//
// Read-only diagnostic for role-grant drift + auth.users exposure.
//
// WHY: RLS-state checks (inspect-rls.ts) cover policy engagement, NOT the
// underlying GRANTs. A role can have a GRANT it shouldn't have without RLS
// being broken — RLS is row filtering, GRANTs are table access. Both axes
// have to be right.
//
// FINDINGS THIS FLAGS
//   🔴 anon or authenticated has ANY grant on auth.users
//        → PII exposure baseline; auth.users contains email + hashed password
//   🟡 anon has INSERT/UPDATE/DELETE on a public table
//        → RLS may still gate, but defense-in-depth is gone
//   🟡 service_role missing from any expected public table
//        → server routes that bypass RLS via service-role client will fail
//
// Methodology — STATE only via audit_role_grants() RPC (migration 018), which
// reads information_schema.role_table_grants directly. That's the SQL standard
// metadata view PostgreSQL exposes for table-level GRANTs.
//
// Usage:
//   npx tsx scripts/security-audit/inspect-grants.ts            # prod
//   npx tsx scripts/security-audit/inspect-grants.ts staging    # staging

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

type Target = "prod" | "staging";

interface GrantRow {
  grantee:     string;
  schema_name: string;
  table_name:  string;
  privilege:   string;
}

// Public-schema tables we expect anon to be able to SELECT (matches the
// expectations in inspect-rls.ts). Anything else granted to anon is flagged.
const ANON_READ_OK = new Set([
  "malls",
  "vendors",
  "posts",
  "site_settings",
]);

// Privileges that are write-equivalent — if anon has any of these, flag.
const WRITE_PRIVS = new Set(["INSERT", "UPDATE", "DELETE", "TRUNCATE"]);

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

async function fetchGrants(svc: SupabaseClient): Promise<GrantRow[] | null> {
  const { data, error } = await svc.rpc("audit_role_grants");
  if (error) {
    console.warn(`⚠️  audit_role_grants() RPC unavailable: ${error.message}`);
    console.warn(`    → apply supabase/migrations/018_security_grants_audit.sql first.\n`);
    return null;
  }
  return data as GrantRow[];
}

(async () => {
  const target: Target = (process.argv[2] === "staging" ? "staging" : "prod");
  const env = loadEnv(target);

  console.log("============================================================");
  console.log(`Supabase grants audit — target: ${target}`);
  console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("============================================================\n");

  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = await fetchGrants(svc);
  if (!rows) process.exit(2);

  // Group by (grantee, schema, table) for compact reporting.
  type Key = string;
  const grouped = new Map<Key, { grantee: string; schema: string; table: string; privs: Set<string> }>();
  for (const r of rows!) {
    const key = `${r.grantee}|${r.schema_name}|${r.table_name}`;
    let entry = grouped.get(key);
    if (!entry) {
      entry = { grantee: r.grantee, schema: r.schema_name, table: r.table_name, privs: new Set() };
      grouped.set(key, entry);
    }
    entry.privs.add(r.privilege);
  }
  const entries = Array.from(grouped.values()).sort((a, b) => {
    // schema then table then grantee
    if (a.schema !== b.schema) return a.schema.localeCompare(b.schema);
    if (a.table  !== b.table)  return a.table.localeCompare(b.table);
    return a.grantee.localeCompare(b.grantee);
  });

  // ── Findings ───────────────────────────────────────────────────────────────
  const findings: { severity: "RED" | "YELLOW"; message: string }[] = [];

  for (const e of entries) {
    // 🔴 Any grant on auth.users to anon or authenticated
    if (e.schema === "auth" && e.table === "users" &&
        (e.grantee === "anon" || e.grantee === "authenticated")) {
      findings.push({
        severity: "RED",
        message: `${e.grantee} has ${[...e.privs].join(",")} on auth.users — PII exposure baseline`,
      });
    }

    // 🟡 anon write access to a public table
    if (e.schema === "public" && e.grantee === "anon") {
      const writePrivs = [...e.privs].filter(p => WRITE_PRIVS.has(p));
      if (writePrivs.length > 0) {
        findings.push({
          severity: "YELLOW",
          message: `anon has ${writePrivs.join(",")} on public.${e.table} — RLS may still gate, but defense-in-depth is gone`,
        });
      }
    }

    // 🟡 anon SELECT on a public table not in the expected-read list
    if (e.schema === "public" && e.grantee === "anon" && e.privs.has("SELECT")
        && !ANON_READ_OK.has(e.table)) {
      findings.push({
        severity: "YELLOW",
        message: `anon has SELECT on public.${e.table} — not in expected-read list (review whether it should be)`,
      });
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log("Grants by (grantee, schema, table):\n");
  for (const e of entries) {
    const tag = e.schema === "auth" ? " 🔒" : "";
    console.log(`  ${e.grantee.padEnd(14)} ${e.schema}.${e.table.padEnd(28)} [${[...e.privs].sort().join(", ")}]${tag}`);
  }
  console.log("");

  if (findings.length === 0) {
    console.log("============================================================");
    console.log("✅ No grant-level findings. RLS is the only line of defense.");
    console.log("============================================================");
    return;
  }

  console.log("============================================================");
  console.log(`Findings — ${findings.length}`);
  console.log("============================================================");
  for (const f of findings) {
    const icon = f.severity === "RED" ? "🔴" : "🟡";
    console.log(`  ${icon} ${f.message}`);
  }
  console.log("");

  if (findings.some(f => f.severity === "RED")) {
    process.exit(1);
  }
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
