// scripts/security-audit/inspect-rls.ts
//
// Read-only diagnostic for Supabase RLS exposure across all known public-schema
// tables. Mirrors what the Supabase Security Advisor checks:
//   "rls_disabled_in_public — anyone with the project URL can read, edit, and
//    delete data in this table because Row-Level Security is not enabled."
//
// Methodology — TWO axes:
//   STATE   — call the audit_rls_state() RPC (migration 015) to read
//             pg_class.relrowsecurity + per-table policy count. This is the
//             ground truth the Supabase Security Advisor uses.
//   BEHAVIOR — anon SELECT / INSERT against each table to verify the access
//             pattern matches expectations.
//
// Why both: state alone tells you "is RLS on?" but not "is it actually
// blocking the right things." Behavior alone tells you "can anon do X?" but
// not "is the protection at the RLS layer or somewhere else." Together they
// catch every common drift mode (RLS toggled off in dashboard, policy dropped,
// new table added without coverage, GRANT-level revoke replaced by RLS, etc.)
//
// INSERT — not DELETE — is the right write probe. A DELETE filtered to a
// sentinel id matches zero rows; PostgREST returns success-with-empty-data
// regardless of RLS (RLS doesn't fire when the WHERE matches nothing). INSERT
// is unambiguous: RLS-blocked → "violates row-level security policy"; RLS-off
// → request is processed and either succeeds or fails on schema/FK validation.
//
// Usage:
//   npx tsx scripts/security-audit/inspect-rls.ts            # prod (.env.local)
//   npx tsx scripts/security-audit/inspect-rls.ts staging    # staging (.env.staging.local)
//
// Cadence (see docs/security-audit-runbook.md):
//   - On every Supabase Security Advisor email
//   - Before every beta/production milestone
//   - Quarterly thereafter

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── Config ─────────────────────────────────────────────────────────────────

type Target = "prod" | "staging";

interface TableExpectation {
  table: string;
  expectAnonRead: boolean;     // should anon be able to SELECT?
  expectAnonWrite: false;      // anon should NEVER be able to write
  notes: string;
}

// Frozen list of every public-schema table we know about. Keep in sync with
// supabase/migrations/* — if a new table lands, add it here.
const TABLES: TableExpectation[] = [
  {
    table: "malls",
    expectAnonRead: true,
    expectAnonWrite: false,
    notes: "RLS on. Public read; admin-only write via is_treehouse_admin().",
  },
  {
    table: "vendors",
    expectAnonRead: true,
    expectAnonWrite: false,
    notes: "RLS on. Public read; owner-or-admin write.",
  },
  {
    table: "posts",
    expectAnonRead: true,
    expectAnonWrite: false,
    notes: "RLS on. Public read; vendor-owner-or-admin write via vendors.user_id chain.",
  },
  {
    table: "vendor_requests",
    expectAnonRead: false,
    expectAnonWrite: false,
    notes: "RLS on. Service-role-only (USING false WITH CHECK false).",
  },
  {
    table: "site_settings",
    expectAnonRead: true,
    expectAnonWrite: false,
    notes: "RLS on (migration 014). Public read via site_settings_public_read policy; writes via service-role API only.",
  },
  {
    table: "events",
    expectAnonRead: false,
    expectAnonWrite: false,
    notes: "RLS on (migration 014, no policies → default-deny). GRANT-level REVOKE (migration 011) blocks anon at an even earlier layer. Writes via service-role API only.",
  },
];

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
  for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!out[k]) throw new Error(`Missing ${k} in ${file}`);
  }
  return out;
}

// ─── Probes ─────────────────────────────────────────────────────────────────

interface RlsState {
  rlsEnabled: boolean;
  policyCount: number;
}

interface Finding {
  table: string;
  exists: boolean;
  state: RlsState | null;          // null if audit_rls_state() RPC unavailable
  anonRead: { ok: boolean; rowCount: number | null; error: string | null };
  anonInsert: { blocked: boolean; rlsBlocked: boolean; error: string | null };
  service: { rowCount: number | null; error: string | null };
  expectation: TableExpectation;
  verdict: "PASS" | "FAIL" | "FLAGGED-BY-ADVISOR" | "TABLE-MISSING";
  rationale: string;
}

const SENTINEL_UUID = "00000000-0000-0000-0000-000000000000";

async function fetchRlsStateMap(svc: SupabaseClient): Promise<Map<string, RlsState> | null> {
  const { data, error } = await svc.rpc("audit_rls_state");
  if (error) {
    console.warn(`⚠️  audit_rls_state() RPC unavailable: ${error.message}`);
    console.warn(`    → apply supabase/migrations/015_security_audit_helpers.sql to enable state-aware verdicts.`);
    console.warn(`    → falling back to behavioral-only checks (cannot detect RLS toggle).\n`);
    return null;
  }
  const map = new Map<string, RlsState>();
  for (const row of data as Array<{ table_name: string; rls_enabled: boolean; policy_count: number }>) {
    map.set(row.table_name, { rlsEnabled: row.rls_enabled, policyCount: Number(row.policy_count) });
  }
  return map;
}

async function probe(
  anon: SupabaseClient,
  svc: SupabaseClient,
  exp: TableExpectation,
  stateMap: Map<string, RlsState> | null,
): Promise<Finding> {
  // 1. Service-role probe — establishes ground truth + table existence
  const svcRes = await svc.from(exp.table).select("*", { count: "exact", head: true });
  const serviceRowCount = svcRes.count ?? null;
  const serviceError = svcRes.error?.message ?? null;
  const exists = stateMap?.has(exp.table) ?? (!serviceError || !/Could not find the table/i.test(serviceError));
  const state = stateMap?.get(exp.table) ?? null;

  // 2. Anon SELECT — count rows
  const anonRes = await anon.from(exp.table).select("*", { count: "exact", head: true });
  const anonRead = {
    ok: !anonRes.error,
    rowCount: anonRes.count ?? null,
    error: anonRes.error?.message ?? null,
  };

  // 3. Anon INSERT — attempt with a row that will fail validation if it gets
  //    past auth. RLS-blocked → "violates row-level security policy".
  //    Anything else (schema cache miss, NOT NULL violation, etc.) means RLS
  //    didn't engage — protection is happening at a different layer or not at all.
  const insertRes = await anon.from(exp.table).insert({ id: SENTINEL_UUID } as Record<string, unknown>).select();
  const insertError = insertRes.error?.message ?? null;
  const rlsBlocked = !!insertError && /violates row-level security policy/i.test(insertError);
  const insertBlocked = !!insertError;

  // ─── Verdict ─────────────────────────────────────────────────────────────
  let verdict: Finding["verdict"] = "PASS";
  const reasons: string[] = [];

  if (!exists) {
    return {
      table: exp.table,
      exists: false,
      state: null,
      anonRead,
      anonInsert: { blocked: insertBlocked, rlsBlocked, error: insertError },
      service: { rowCount: serviceRowCount, error: serviceError },
      expectation: exp,
      verdict: "TABLE-MISSING",
      rationale: `service-role probe reports table missing on this project: ${serviceError ?? "not in audit_rls_state()"}`,
    };
  }

  // STATE check — pg_class.relrowsecurity is what the advisor uses
  if (state && !state.rlsEnabled) {
    verdict = "FAIL";
    reasons.push("pg_class.relrowsecurity is FALSE — advisor will flag this table");
  }

  // Anon read expectation
  if (exp.expectAnonRead && !anonRead.ok) {
    verdict = "FAIL";
    reasons.push(`anon SELECT failed but should succeed: ${anonRead.error}`);
  }
  if (!exp.expectAnonRead && anonRead.ok && (anonRead.rowCount ?? 0) > 0) {
    verdict = "FAIL";
    reasons.push(`anon SELECT returned ${anonRead.rowCount} rows but table should be admin-only`);
  }

  // Anon write must always be blocked
  if (!insertBlocked) {
    verdict = "FAIL";
    reasons.push("anon INSERT was NOT blocked");
  }

  return {
    table: exp.table,
    exists: true,
    state,
    anonRead,
    anonInsert: { blocked: insertBlocked, rlsBlocked, error: insertError },
    service: { rowCount: serviceRowCount, error: serviceError },
    expectation: exp,
    verdict,
    rationale: reasons.join("; ") || "All checks pass",
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  const target: Target = (process.argv[2] === "staging" ? "staging" : "prod");
  const env = loadEnv(target);

  console.log("============================================================");
  console.log(`Supabase RLS audit — target: ${target}`);
  console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("============================================================\n");

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // STATE — pg_class.relrowsecurity for every public table (via RPC from migration 015).
  // Falls back to null if the RPC isn't deployed yet; in that case the script
  // reverts to behavioral-only checks.
  const stateMap = await fetchRlsStateMap(svc);

  // Detect tables present in the database but NOT in our expectation list.
  // A new table added without a corresponding line in TABLES is itself a risk
  // — it means coverage is drifting from the audit definition.
  const expectedTableNames = new Set(TABLES.map(t => t.table));
  const unexpectedTables: string[] = [];
  if (stateMap) {
    for (const [name] of stateMap) {
      if (!expectedTableNames.has(name)) unexpectedTables.push(name);
    }
  }

  const findings: Finding[] = [];
  for (const exp of TABLES) {
    const f = await probe(anon, svc, exp, stateMap);
    findings.push(f);
  }

  // ─── Per-table report ───────────────────────────────────────────────────
  for (const f of findings) {
    const icon =
      f.verdict === "PASS" ? "✅"
      : f.verdict === "FLAGGED-BY-ADVISOR" ? "🟡"
      : f.verdict === "TABLE-MISSING" ? "⬜"
      : "❌";
    console.log(`${icon} ${f.table.padEnd(20)} ${f.verdict}`);
    if (f.exists) {
      const rls = f.anonInsert.rlsBlocked ? " (RLS)" : f.anonInsert.blocked ? " (non-RLS)" : "";
      if (f.state) {
        console.log(`   rls_enabled:     ${f.state.rlsEnabled}  policies=${f.state.policyCount}`);
      }
      console.log(`   anon SELECT:     ok=${f.anonRead.ok}  rows=${f.anonRead.rowCount ?? "n/a"}${f.anonRead.error ? `  error="${f.anonRead.error}"` : ""}`);
      console.log(`   anon INSERT:     blocked=${f.anonInsert.blocked}${rls}${f.anonInsert.error ? `  error="${f.anonInsert.error}"` : ""}`);
      console.log(`   service rows:    ${f.service.rowCount ?? "n/a"}${f.service.error ? `  error="${f.service.error}"` : ""}`);
      console.log(`   notes:           ${f.expectation.notes}`);
    } else {
      console.log(`   service rows:    n/a  error="${f.service.error}"`);
      console.log(`   notes:           Table not present on this project (migration not applied?).`);
    }
    console.log(`   rationale:       ${f.rationale}`);
    console.log("");
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  const fails = findings.filter(f => f.verdict === "FAIL");
  const flagged = findings.filter(f => f.verdict === "FLAGGED-BY-ADVISOR");
  const passes = findings.filter(f => f.verdict === "PASS");
  const missing = findings.filter(f => f.verdict === "TABLE-MISSING");

  console.log("============================================================");
  console.log(`Summary — target: ${target}`);
  console.log(`  ✅ pass:                ${passes.length}`);
  console.log(`  🟡 flagged-by-advisor:  ${flagged.length}  (${flagged.map(f => f.table).join(", ") || "—"})`);
  console.log(`  ❌ fail:                ${fails.length}  (${fails.map(f => f.table).join(", ") || "—"})`);
  console.log(`  ⬜ table-missing:       ${missing.length}  (${missing.map(f => f.table).join(", ") || "—"})`);
  if (unexpectedTables.length > 0) {
    console.log(`  ⚠️  unexpected:         ${unexpectedTables.length}  (${unexpectedTables.join(", ")})`);
  }
  console.log("============================================================");

  if (fails.length > 0) {
    console.log("\n⚠️  Failures detected. Review the per-table rationale above before pushing changes.");
    process.exit(1);
  }
  if (flagged.length > 0) {
    console.log("\n🟡 Advisor will continue flagging the listed tables until RLS is enabled with explicit policies. Apply migration 014_security_advisor_rls.sql to silence.");
  }
  if (missing.length > 0) {
    console.log("\n⬜ Some tables don't exist on this project. If staging is intentionally behind prod, that's expected. Otherwise apply the missing migrations.");
  }
  if (unexpectedTables.length > 0) {
    console.log("\n⚠️  Tables present in the database but not in scripts/security-audit/inspect-rls.ts TABLES[] — coverage drift.");
    console.log("    Add expectations for these tables to keep the audit definition in sync with the schema.");
  }
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
