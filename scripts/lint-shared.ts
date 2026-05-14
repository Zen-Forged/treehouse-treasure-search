// scripts/lint-shared.ts
// Shared helpers for token-compliance linters.
//
// Mirrors the structural shape locked at Arc 6.1.4 (session 144) by
// scripts/lint-spacing.ts and generalizes it for the color/font/shadow/
// radius lint extensions added during the session-162 tokenization audit.
//
// Each consumer linter:
//   - Imports { walk, collectFiles, readFile, relativeToRoot, Violation,
//     getCliFlags, renderReport } from this module
//   - Declares its own detection regex(es) + canonical-set (optional)
//   - Emits Violations + calls renderReport
//
// All token-compliance linters exit 0 regardless (warn-not-fail) per
// session 143 lock — calibration debt baseline, not CI gate.

import { readFileSync, statSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";

const ROOT = resolve(process.cwd());
const SCAN_DIRS = ["app", "components"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".claude", "out"]);
const FILE_EXTS = [".tsx", ".ts"];

// Per-surface allowlist (added Shape C arc 1, session 162).
//
// These surfaces are intentionally off the v1/v2 token graph and are
// excluded from token-compliance lint scope so baselines remain signal-
// bearing rather than dominated by deliberate carve-outs.
//
// Path-prefix match: an entry like "app/decide" excludes both the file
// "app/decide" itself and any descendant under "app/decide/...". File-path
// entries like "components/OpportunityMeter.tsx" match exactly.
//
// Categories:
//   - Reseller-intel layer (dark #050f05 theme; tokens.ts file-top lock
//     keeps these on inline values by design)
//   - Smoke / test routes (development-only surfaces, not user-facing)
//   - Dev tooling overlays (DevAuthPanel)
//   - Parked code (session 152 within-session retirement; revive contract
//     in file-top comments)
//
// Drops the session-162 baseline by ~700+ violations (~27% noise). Audit
// docs and lint baselines updated downstream.
export const EXCLUDED_PREFIXES = [
  // Reseller-intel surfaces — dark theme, intentionally off v1/v2 system
  "app/decide",
  "app/discover",
  "app/intent",
  "app/share",
  "app/enhance",
  "app/enhance-text",
  "app/refine",
  "app/scan",
  "app/finds",                                  // covers /finds + /finds/[id]
  "components/OpportunityMeter.tsx",
  "components/DecisionDial.tsx",
  "components/AnalysisSheet.tsx",

  // Smoke / test routes (development surfaces, not user-facing)
  "app/postcard-test",
  "app/search-bar-test",
  "app/geolocation-test",
  "app/vendors-test",
  "app/home-chrome-test",
  "app/saved-v2-test",
  "app/transition-test",
  "app/ui-test",

  // Dev tooling
  "components/DevAuthPanel.tsx",

  // Parked code (session 152 within-session retirement; revive contract
  // documented in each file's top comment)
  "components/ShelfImageTemplate.tsx",
  "components/ShelfImageShareScreen.tsx",
];

export interface Violation {
  file: string;
  line: number;
  prop: string;
  value: string;
  snippet: string;
}

export interface LintFlags {
  json: boolean;
  quiet: boolean;
}

export function getCliFlags(): LintFlags {
  const args = process.argv.slice(2);
  return {
    json: args.includes("--json"),
    quiet: args.includes("--quiet"),
  };
}

export function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walk(fullPath, out);
    } else if (FILE_EXTS.some(ext => fullPath.endsWith(ext))) {
      out.push(fullPath);
    }
  }
  return out;
}

function isExcluded(relPath: string): boolean {
  // Normalize path separators for cross-platform safety (Windows vs POSIX).
  const norm = relPath.replace(/\\/g, "/");
  for (const prefix of EXCLUDED_PREFIXES) {
    if (norm === prefix) return true;
    if (norm.startsWith(prefix + "/")) return true;
  }
  return false;
}

export interface FileCollection {
  scanned: string[];     // absolute paths actually scanned
  excludedCount: number; // count of files in scan dirs that matched allowlist
}

export function collectFilesWithStats(): FileCollection {
  const all: string[] = [];
  for (const dir of SCAN_DIRS) {
    walk(resolve(ROOT, dir), all);
  }
  const scanned: string[] = [];
  let excludedCount = 0;
  for (const file of all) {
    if (isExcluded(relativeToRoot(file))) {
      excludedCount += 1;
    } else {
      scanned.push(file);
    }
  }
  return { scanned, excludedCount };
}

// Convenience: most linters only need the scanned files list.
export function collectFiles(): string[] {
  return collectFilesWithStats().scanned;
}

export function readFile(file: string): string {
  return readFileSync(file, "utf8");
}

export function relativeToRoot(file: string): string {
  return relative(ROOT, file);
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  allowedDesc?: string;
  flags: LintFlags;
  filesScanned: number;
  filesExcluded?: number; // optional — only shown if > 0
  violations: Violation[];
  scale?: (string | number)[];
}

export function renderReport(cfg: ReportConfig): void {
  const { title, subtitle, allowedDesc, flags, filesScanned, filesExcluded, violations, scale } = cfg;

  if (flags.json) {
    console.log(JSON.stringify({
      title,
      scale: scale ?? null,
      filesScanned,
      filesExcluded: filesExcluded ?? 0,
      totalViolations: violations.length,
      violations,
    }, null, 2));
    process.exit(0);
  }

  const byFile = new Map<string, Violation[]>();
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  const sortedFiles = Array.from(byFile.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  console.log(`\n${title}`);
  if (subtitle) console.log(subtitle);
  if (allowedDesc) console.log(allowedDesc);
  console.log("");

  if (!flags.quiet) {
    for (const [file, vs] of sortedFiles) {
      const label = vs.length === 1 ? "violation" : "violations";
      console.log(`  ${file}  (${vs.length} ${label})`);
      const sample = vs.slice(0, 3);
      for (const v of sample) {
        console.log(`    L${v.line}  ${v.prop}: ${v.value}`);
      }
      if (vs.length > 3) {
        console.log(`    … and ${vs.length - 3} more`);
      }
      console.log("");
    }
  }

  console.log(`Files scanned:     ${filesScanned}`);
  if (filesExcluded && filesExcluded > 0) {
    console.log(`Files excluded:    ${filesExcluded}  (off-system allowlist)`);
  }
  console.log(`Files with debt:   ${byFile.size}`);
  console.log(`Total violations:  ${violations.length}`);
  console.log(`\n(Warn-not-fail — exit 0 regardless. Token-compliance baseline.)\n`);

  process.exit(0);
}
