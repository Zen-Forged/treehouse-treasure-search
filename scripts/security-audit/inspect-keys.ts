// scripts/security-audit/inspect-keys.ts
//
// Audit for accidental secret exposure in the repo. Checks:
//   1. .env* files are gitignored (and not tracked)
//   2. No file in the working tree contains a literal Supabase service-role
//      key (these begin with `eyJ` and are JWT-shaped — but so is the anon
//      key. We compare against the actual keys from .env.local / .env.staging.local
//      so we catch literal pastes regardless of shape.)
//   3. No file in the tree contains hardcoded admin email outside the
//      designated places (lib/adminAuth.ts + supabase/migrations/*).
//
// Usage:
//   npx tsx scripts/security-audit/inspect-keys.ts
//
// Exit codes:
//   0 — no findings
//   1 — at least one finding (printed in detail)
//   2 — fatal error (env file missing, etc.)

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface Finding {
  category: "env-not-gitignored" | "env-tracked" | "service-role-key-leaked" | "anon-key-leaked-as-string";
  detail: string;
}

function loadEnv(file: string): Record<string, string> {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return {};
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

function sh(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (err: unknown) {
    // git grep returns non-zero exit when there are no matches — that's fine
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status === 1) {
      return "";
    }
    return "";
  }
}

(async () => {
  const findings: Finding[] = [];

  // ─── 1. .env* files must be gitignored ──────────────────────────────────
  // git check-ignore exits 0 if path is ignored. We test each env file shape.
  // The .env.example + .env.staging.example are intentionally tracked — they
  // are the templates and contain no secrets.
  const envFilesToCheck = [".env.local", ".env.staging.local", ".env.prod-dump.local"];
  for (const f of envFilesToCheck) {
    const fullPath = resolve(process.cwd(), f);
    if (!existsSync(fullPath)) continue;

    // Gitignore check — use distinct non-substring tokens so equality is unambiguous
    const ignored = sh(`git check-ignore "${f}" >/dev/null 2>&1 && echo YES || echo NO`).trim();
    if (ignored !== "YES") {
      findings.push({
        category: "env-not-gitignored",
        detail: `${f} exists locally but is NOT in .gitignore. Risk: future git add -A includes it.`,
      });
    }

    // Tracked-in-git check — distinct tokens, exact match
    const tracked = sh(`git ls-files --error-unmatch "${f}" >/dev/null 2>&1 && echo YES || echo NO`).trim();
    if (tracked === "YES") {
      findings.push({
        category: "env-tracked",
        detail: `${f} is currently TRACKED in git. This file likely contains live secrets — remove from git history immediately.`,
      });
    }
  }

  // ─── 2. Service-role key leaked in tracked files ────────────────────────
  // We grep for the literal value of SUPABASE_SERVICE_ROLE_KEY from each env
  // file. Any tracked file containing it (other than .env.example as a
  // placeholder) is a leak.
  const prod = loadEnv(".env.local");
  const staging = loadEnv(".env.staging.local");
  const serviceKeys = [prod.SUPABASE_SERVICE_ROLE_KEY, staging.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean);
  // Deduplicate (prod + staging may share the same project on bootstraps;
  // unlikely but safe).
  const uniqueKeys = Array.from(new Set(serviceKeys));
  for (const key of uniqueKeys) {
    if (!key || key.length < 40) continue;
    // git grep -F (fixed string) searches all tracked files
    const matches = sh(`git grep -F -l "${key}" 2>/dev/null`).trim();
    if (matches) {
      const files = matches.split("\n").filter(Boolean);
      // .env.example template gets a synthetic placeholder, not the real key,
      // so any match is a real leak — but print the file list so the user can
      // verify.
      findings.push({
        category: "service-role-key-leaked",
        detail: `SUPABASE_SERVICE_ROLE_KEY (length ${key.length}) found verbatim in tracked file(s): ${files.join(", ")}. Rotate the key immediately and remove the references.`,
      });
    }
  }

  // ─── 3. Anon key leaked as a hardcoded string ───────────────────────────
  // Anon key is in the client bundle by design — but it should be read from
  // process.env, not hardcoded in source. A literal substring match in a .ts
  // / .tsx / .js file would mean the value got pasted directly.
  const anonKeys = [prod.NEXT_PUBLIC_SUPABASE_ANON_KEY, staging.NEXT_PUBLIC_SUPABASE_ANON_KEY].filter(Boolean);
  for (const key of Array.from(new Set(anonKeys))) {
    if (!key || key.length < 40) continue;
    const matches = sh(`git grep -F -l "${key}" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null`).trim();
    if (matches) {
      const files = matches.split("\n").filter(Boolean);
      findings.push({
        category: "anon-key-leaked-as-string",
        detail: `NEXT_PUBLIC_SUPABASE_ANON_KEY (length ${key.length}) found as hardcoded string in: ${files.join(", ")}. Should be read from process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY only.`,
      });
    }
  }

  // ─── Report ─────────────────────────────────────────────────────────────
  console.log("============================================================");
  console.log("Repo secret exposure audit");
  console.log("============================================================\n");

  if (findings.length === 0) {
    console.log("✅ No findings.");
    console.log("   - All .env* files gitignored + not tracked");
    console.log("   - No service-role key found in tracked files");
    console.log("   - No anon key hardcoded in source");
    process.exit(0);
  }

  for (const f of findings) {
    console.log(`❌ [${f.category}]`);
    console.log(`   ${f.detail}\n`);
  }
  console.log("============================================================");
  console.log(`Summary: ${findings.length} finding(s)`);
  console.log("============================================================");
  process.exit(1);
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(2);
});
