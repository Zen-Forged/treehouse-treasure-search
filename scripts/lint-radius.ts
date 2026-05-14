// scripts/lint-radius.ts
// Radius-token compliance lint (session 162 audit extension).
//
// Walks app/ + components/, scans inline borderRadius numerics + checks
// against the canonical Layer 1 radius scale (locked Arc 6.1.4 session 144):
//   - radius.sm  → 8px
//   - radius.md  → 12px
//   - radius.lg  → 16px
//   - radius.xl  → 20px
//   - radius.pill → 999px
//
// Allowed off-scale: 0 (no radius), 1 (hairline edge cases).
//
// Detection:
//   - Inline borderRadius: <number>  (mirrors lint-spacing's regex shape)
//
// Allowed by definition (regex doesn't match):
//   - Bare token refs: `borderRadius: radius.lg` / `v1.imageRadius`
//   - CSS-var string refs: `borderRadius: "var(--th-v1-image-radius)"`
//   - Tailwind `rounded-*` classes
//
// Known v1 legacy values that may surface in violations (consumers should
// migrate to bare-identifier `v1.*` token refs):
//   - 6  (v1.imageRadius — find detail photo)
//   - 14 (v1.radius.input / v1.radius.button)
//
// Usage:
//   npm run lint:radius
//   npm run lint:radius -- --json
//   npm run lint:radius -- --quiet

import {
  collectFilesWithStats,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

const RADIUS_REGEX = /\bborderRadius\s*:\s*(-?\d+(?:\.\d+)?)\b/g;

const CANONICAL = new Set([0, 8, 12, 16, 20, 999]);
const ALLOWED_OFF_SCALE = new Set([1]); // hairlines

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
    RADIUS_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = RADIUS_REGEX.exec(line)) !== null) {
      const value = parseFloat(match[1]);
      const absValue = Math.abs(value);
      if (isOnScale(absValue)) continue;
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "borderRadius",
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
    title: "Radius-token lint (session 162 audit baseline)",
    subtitle: "Canonical scale: 8 / 12 / 16 / 20 / 999 (radius.sm/md/lg/xl/pill)",
    allowedDesc: "Allowed off-scale: 0, 1 (hairlines)",
    flags,
    filesScanned: scanned.length,
    filesExcluded: excludedCount,
    violations: allViolations,
    scale: Array.from(CANONICAL).sort((a, b) => a - b),
  });
}

main();
