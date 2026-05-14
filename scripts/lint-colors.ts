// scripts/lint-colors.ts
// Color-token compliance lint (session 162 audit extension).
//
// Walks app/ + components/, scans for inline hex + rgba color literals that
// should resolve via design tokens instead (v1.*, v2.*, v0.2 `colors.*`).
//
// Detection:
//   - Hex literals: #RGB / #RRGGBB / #RRGGBBAA
//   - rgba/rgb literals: rgba(...) / rgb(...)
//
// Allowed by definition (regex doesn't match):
//   - Bare token references: `color: v1.green` / `color: v2.accent.red`
//   - Tailwind class names: `className="text-red-500"`
//   - CSS keywords: transparent / inherit / currentColor
//   - CSS-var refs without surrounding hex: `var(--th-...)`
//
// Known noise (counted but acceptable for baseline):
//   - Hex in comments (e.g., `// #2a1a0a baseline ink`)
//   - Hex inside string literals that aren't styles (e.g., regex patterns)
//
// Usage:
//   npm run lint:colors            # report mode (default)
//   npm run lint:colors -- --json  # machine-readable output
//   npm run lint:colors -- --quiet # totals only, no per-file detail

import {
  collectFilesWithStats,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

// Hex: longest-first alternation so 8-char matches before 6-char before 3-char,
// avoiding `\b` ambiguity when the engine could otherwise terminate early.
const HEX_REGEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
const RGBA_REGEX = /\brgba?\s*\([^)]+\)/g;

function scanFile(file: string): Violation[] {
  const text = readFile(file);
  const lines = text.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    HEX_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HEX_REGEX.exec(line)) !== null) {
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "(hex)",
        value: match[0],
        snippet: line.trim(),
      });
    }

    RGBA_REGEX.lastIndex = 0;
    while ((match = RGBA_REGEX.exec(line)) !== null) {
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "(rgba)",
        value: match[0],
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
    title: "Color-token lint (session 162 audit baseline)",
    subtitle: "Detection: inline #RGB / #RRGGBB / #RRGGBBAA + rgba(...) / rgb(...)",
    allowedDesc: "Allowed: bare token refs (v1.* / v2.* / colors.*), Tailwind classes, CSS keywords",
    flags,
    filesScanned: scanned.length,
    filesExcluded: excludedCount,
    violations: allViolations,
  });
}

main();
