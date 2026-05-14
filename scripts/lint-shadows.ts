// scripts/lint-shadows.ts
// Shadow-token compliance lint (session 162 audit extension).
//
// Walks app/ + components/, scans for inline boxShadow string literals that
// should resolve via v1.shadow.* tokens or a future v2.shadow.* tier.
//
// Detection:
//   - Inline boxShadow: "..." string literals
//
// Allowed by definition (regex doesn't match):
//   - Bare token refs: `boxShadow: v1.shadow.polaroid` (no quote → no match)
//   - Inline strings containing var(...): `boxShadow: "var(--th-shadow)"`
//
// Known shadow tokens (lib/tokens.ts v1.shadow.*):
//   - polaroid / polaroidPin (heavy)
//   - ctaGreen / ctaGreenCompact (filled CTA)
//   - sheetRise (modal/sheet)
//   - cardSubtle (light card lift)
//   - postcard (postcard mall card)
//   - callout (PinCallout)
//
// Session 162 audit observation: v1.shadow.* is the only shadow tier today;
// extracting a v2.shadow.* tier is captured as a Tier B recommendation in
// the audit doc (e.g., session 159's BottomNav inline polaroid shadow was
// flagged as 2nd-consumer extraction trigger).
//
// Usage:
//   npm run lint:shadows
//   npm run lint:shadows -- --json
//   npm run lint:shadows -- --quiet

import {
  collectFilesWithStats,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

// boxShadow: "literal-string" → flag UNLESS the value references var(
const BOXSHADOW_REGEX = /\bboxShadow\s*:\s*["'`]([^"'`]+)["'`]/g;

function scanFile(file: string): Violation[] {
  const text = readFile(file);
  const lines = text.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    BOXSHADOW_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = BOXSHADOW_REGEX.exec(line)) !== null) {
      const literal = match[1];
      if (literal.includes("var(")) continue;
      // Truncate displayed value to keep report readable.
      const display = literal.length > 60 ? literal.slice(0, 57) + "…" : literal;
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "boxShadow",
        value: `"${display}"`,
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
    title: "Shadow-token lint (session 162 audit baseline)",
    subtitle: "Detection: inline boxShadow string literals",
    allowedDesc: "Allowed: bare v1.shadow.* token refs, strings containing var(...)",
    flags,
    filesScanned: scanned.length,
    filesExcluded: excludedCount,
    violations: allViolations,
  });
}

main();
