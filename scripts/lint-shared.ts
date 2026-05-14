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

export function collectFiles(): string[] {
  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    walk(resolve(ROOT, dir), files);
  }
  return files;
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
  violations: Violation[];
  scale?: (string | number)[];
}

export function renderReport(cfg: ReportConfig): void {
  const { title, subtitle, allowedDesc, flags, filesScanned, violations, scale } = cfg;

  if (flags.json) {
    console.log(JSON.stringify({
      title,
      scale: scale ?? null,
      filesScanned,
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
  console.log(`Files with debt:   ${byFile.size}`);
  console.log(`Total violations:  ${violations.length}`);
  console.log(`\n(Warn-not-fail — exit 0 regardless. Token-compliance baseline.)\n`);

  process.exit(0);
}
