// scripts/lint-spacing.ts
// Layer 1 (Arc 6.1.4) — spacing-scale lint helper.
//
// Walks every .tsx / .ts file under app/ and components/, scans inline
// styles + numeric props that consume spacing, and surfaces values that
// don't sit on the canonical scale.
//
// Locked decisions (session 143):
//   - Canonical scale: 2/4/8/12/16/24/32/48/64
//   - Warn-not-fail (always exits 0)
//   - Layer 2 component primitives drive adoption; this baseline counts
//     the calibration debt so future sessions can watch it shrink
//
// Allowed off-scale values: 0, 1 (hairline), 0.5 (sub-pixel border), -N
// negatives are checked against |N|.
//
// Usage:
//   npm run lint:spacing            # report mode (default)
//   npm run lint:spacing -- --json  # machine-readable output
//   npm run lint:spacing -- --quiet # totals only, no per-file detail

import { readFileSync, statSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";

const ROOT = resolve(process.cwd());
const SCAN_DIRS = ["app", "components"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".claude", "out"]);
const FILE_EXTS = [".tsx", ".ts"];

const CANONICAL = new Set([0, 2, 4, 8, 12, 16, 24, 32, 48, 64]);
const ALLOWED_OFF_SCALE = new Set([1]); // hairlines

// Spacing-affecting CSS properties (camelCase, as written in inline styles).
const SPACING_PROPS = [
  "padding", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "paddingInline", "paddingBlock", "paddingInlineStart", "paddingInlineEnd",
  "paddingBlockStart", "paddingBlockEnd",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft",
  "marginInline", "marginBlock",
  "gap", "rowGap", "columnGap",
  "top", "right", "bottom", "left",
  "inset", "insetInline", "insetBlock",
];

// Build a single regex matching `prop: <number>` in inline style objects.
// Conservative: only matches `(prop): (number)` (no string literals, no
// var() refs, no shorthand strings like "8px 16px"). Negatives included.
const SPACING_REGEX = new RegExp(
  `\\b(${SPACING_PROPS.join("|")})\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\b`,
  "g"
);

interface Violation {
  file: string;
  line: number;
  prop: string;
  value: number;
  snippet: string;
}

function walk(dir: string, out: string[] = []): string[] {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, out);
    } else if (FILE_EXTS.some(ext => fullPath.endsWith(ext))) {
      out.push(fullPath);
    }
  }
  return out;
}

function isOnScale(absValue: number): boolean {
  if (CANONICAL.has(absValue)) return true;
  if (ALLOWED_OFF_SCALE.has(absValue)) return true;
  return false;
}

function scanFile(file: string): Violation[] {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    SPACING_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = SPACING_REGEX.exec(line)) !== null) {
      const prop = match[1];
      const value = parseFloat(match[2]);
      const absValue = Math.abs(value);
      if (isOnScale(absValue)) continue;
      violations.push({
        file: relative(ROOT, file),
        line: i + 1,
        prop,
        value,
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const quiet = args.includes("--quiet");

  const files: string[] = [];
  for (const dir of SCAN_DIRS) {
    const fullPath = resolve(ROOT, dir);
    try {
      walk(fullPath, files);
    } catch {
      // dir doesn't exist; skip
    }
  }

  const allViolations: Violation[] = [];
  for (const file of files) {
    allViolations.push(...scanFile(file));
  }

  if (json) {
    console.log(JSON.stringify({
      scale: Array.from(CANONICAL).sort((a, b) => a - b),
      filesScanned: files.length,
      totalViolations: allViolations.length,
      violations: allViolations,
    }, null, 2));
    process.exit(0);
  }

  // Group violations by file for readable output.
  const byFile = new Map<string, Violation[]>();
  for (const v of allViolations) {
    if (!byFile.has(v.file)) byFile.set(v.file, []);
    byFile.get(v.file)!.push(v);
  }

  const sortedFiles = Array.from(byFile.entries()).sort(
    (a, b) => b[1].length - a[1].length
  );

  console.log(`\nLayer 1 spacing-scale lint (Arc 6.1.4 baseline)`);
  console.log(`Canonical scale: 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`);
  console.log(`Allowed off-scale: 0, 1 (hairline)\n`);

  if (!quiet) {
    for (const [file, vs] of sortedFiles) {
      console.log(`  ${file}  (${vs.length} ${vs.length === 1 ? "violation" : "violations"})`);
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

  console.log(`Files scanned:     ${files.length}`);
  console.log(`Files with debt:   ${byFile.size}`);
  console.log(`Total violations:  ${allViolations.length}`);
  console.log(`\n(Warn-not-fail per session 143 lock — exit 0 regardless.)\n`);

  process.exit(0);
}

main();
