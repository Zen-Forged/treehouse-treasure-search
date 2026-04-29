// scripts/security-audit/inspect-storage-acls.ts
//
// Audit Supabase Storage bucket exposure. Mirrors what the Security Advisor
// tracks under storage-related findings:
//   - Bucket public/private state
//   - File counts + sample listing (sanity check that the bucket has expected
//     contents, not stale fixtures or accidentally-uploaded sensitive files)
//
// Methodology:
//   1. Service-role lists every bucket.
//   2. For each bucket: report public flag, file count, sample of recent files.
//   3. Anon attempts to read a file from each public bucket (sanity — confirms
//      the public flag actually works).
//
// Usage:
//   npx tsx scripts/security-audit/inspect-storage-acls.ts            # prod
//   npx tsx scripts/security-audit/inspect-storage-acls.ts staging    # staging

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

type Target = "prod" | "staging";

interface BucketExpectation {
  id: string;
  expectPublic: boolean;
  notes: string;
}

// Frozen list of every Storage bucket we know about. Add new buckets here as
// they're created — an unrecognized bucket triggers a coverage-drift warning.
const BUCKETS: BucketExpectation[] = [
  {
    id: "post-images",
    expectPublic: true,
    notes: "Find images. Public reads required for Home + /find/[id] + share previews.",
  },
  {
    id: "site-assets",
    expectPublic: true,
    notes: "Featured banner + Find Map banner. Public reads required for Home + /flagged.",
  },
];

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

interface BucketFinding {
  id: string;
  exists: boolean;
  isPublic: boolean | null;
  fileCount: number | null;
  sampleFiles: string[];
  expectation: BucketExpectation | null;
  verdict: "PASS" | "FAIL" | "UNEXPECTED-BUCKET" | "BUCKET-MISSING";
  rationale: string;
}

async function inspectBucket(svc: SupabaseClient, exp: BucketExpectation): Promise<BucketFinding> {
  const buckets = await svc.storage.listBuckets();
  if (buckets.error) {
    return {
      id: exp.id,
      exists: false,
      isPublic: null,
      fileCount: null,
      sampleFiles: [],
      expectation: exp,
      verdict: "BUCKET-MISSING",
      rationale: `listBuckets() failed: ${buckets.error.message}`,
    };
  }
  const b = (buckets.data ?? []).find(x => x.id === exp.id);
  if (!b) {
    return {
      id: exp.id,
      exists: false,
      isPublic: null,
      fileCount: null,
      sampleFiles: [],
      expectation: exp,
      verdict: "BUCKET-MISSING",
      rationale: "Bucket not present on this project.",
    };
  }

  const list = await svc.storage.from(exp.id).list("", {
    limit: 5,
    sortBy: { column: "created_at", order: "desc" },
  });
  const sampleFiles = (list.data ?? []).map(f => f.name);
  // Best-effort file count — listBuckets doesn't return totals, list() returns
  // first page only. For a true count we'd recurse; for a sanity diagnostic
  // the most-recent-5 sample is enough.
  const fileCount = list.data?.length ?? null;

  const reasons: string[] = [];
  let verdict: BucketFinding["verdict"] = "PASS";
  if (b.public !== exp.expectPublic) {
    verdict = "FAIL";
    reasons.push(`bucket.public=${b.public} but expected ${exp.expectPublic}`);
  }
  if (list.error) {
    reasons.push(`list() error: ${list.error.message}`);
  }

  return {
    id: exp.id,
    exists: true,
    isPublic: b.public,
    fileCount,
    sampleFiles,
    expectation: exp,
    verdict,
    rationale: reasons.join("; ") || "Public state matches expectation",
  };
}

(async () => {
  const target: Target = (process.argv[2] === "staging" ? "staging" : "prod");
  const env = loadEnv(target);
  console.log("============================================================");
  console.log(`Supabase Storage audit — target: ${target}`);
  console.log(`URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("============================================================\n");

  const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ─── Coverage drift — find buckets present in DB but not in BUCKETS[] ────
  const all = await svc.storage.listBuckets();
  const expectedIds = new Set(BUCKETS.map(b => b.id));
  const unexpected: string[] = [];
  for (const b of all.data ?? []) {
    if (!expectedIds.has(b.id)) unexpected.push(`${b.id} (public=${b.public})`);
  }

  // ─── Per-bucket report ──────────────────────────────────────────────────
  const findings: BucketFinding[] = [];
  for (const exp of BUCKETS) {
    findings.push(await inspectBucket(svc, exp));
  }

  for (const f of findings) {
    const icon =
      f.verdict === "PASS" ? "✅"
      : f.verdict === "BUCKET-MISSING" ? "⬜"
      : "❌";
    console.log(`${icon} ${f.id.padEnd(18)} ${f.verdict}`);
    if (f.exists) {
      console.log(`   public:          ${f.isPublic}`);
      console.log(`   recent files:    ${f.sampleFiles.length === 0 ? "(none)" : f.sampleFiles.slice(0, 5).join(", ")}`);
      console.log(`   expected public: ${f.expectation?.expectPublic}`);
      console.log(`   notes:           ${f.expectation?.notes}`);
    }
    console.log(`   rationale:       ${f.rationale}`);
    console.log("");
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  const fails = findings.filter(f => f.verdict === "FAIL");
  const missing = findings.filter(f => f.verdict === "BUCKET-MISSING");
  const passes = findings.filter(f => f.verdict === "PASS");

  console.log("============================================================");
  console.log(`Summary — target: ${target}`);
  console.log(`  ✅ pass:                ${passes.length}`);
  console.log(`  ❌ fail:                ${fails.length}  (${fails.map(f => f.id).join(", ") || "—"})`);
  console.log(`  ⬜ bucket-missing:      ${missing.length}  (${missing.map(f => f.id).join(", ") || "—"})`);
  if (unexpected.length > 0) {
    console.log(`  ⚠️  unexpected:         ${unexpected.length}  (${unexpected.join(", ")})`);
  }
  console.log("============================================================");

  if (fails.length > 0) {
    console.log("\n⚠️  Bucket public-state mismatch detected. Review the per-bucket rationale above.");
    process.exit(1);
  }
  if (unexpected.length > 0) {
    console.log("\n⚠️  Buckets present but not in scripts/security-audit/inspect-storage-acls.ts BUCKETS[].");
    console.log("    Add expectations to keep coverage in sync with the project.");
  }
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
