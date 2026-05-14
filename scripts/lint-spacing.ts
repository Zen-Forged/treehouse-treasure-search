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
// Shape C arc 1 (session 162):
//   - Ported to consume scripts/lint-shared.ts so the per-surface
//     allowlist (reseller-intel layer + smoke routes + parked code) is
//     inherited across all 5 token-compliance linters uniformly. Detection
//     logic + canonical scale unchanged.
//
// Usage:
//   npm run lint:spacing            # report mode (default)
//   npm run lint:spacing -- --json  # machine-readable output
//   npm run lint:spacing -- --quiet # totals only, no per-file detail

import {
  collectFilesWithStats,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

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

function isOnScale(absValue: number): boolean {
  if (CANONICAL.has(absValue)) return true;
  if (ALLOWED_OFF_SCALE.has(absValue)) return true;
  return false;
}

function scanFile(file: string): Violation[] {
  const text = readFile(file);
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
        file: relativeToRoot(file),
        line: i + 1,
        prop,
        value: String(value),
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

function main() {
  const flags = getCliFlags();
  const { scanned, excludedCount } = collectFilesWithStats();

  const allViolations: Violation[] = [];
  for (const file of scanned) {
    allViolations.push(...scanFile(file));
  }

  renderReport({
    title: "Layer 1 spacing-scale lint (Arc 6.1.4 baseline)",
    subtitle: "Canonical scale: 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64",
    allowedDesc: "Allowed off-scale: 0, 1 (hairline)",
    flags,
    filesScanned: scanned.length,
    filesExcluded: excludedCount,
    violations: allViolations,
    scale: Array.from(CANONICAL).sort((a, b) => a - b),
  });
}

main();
