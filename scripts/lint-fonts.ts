// scripts/lint-fonts.ts
// Font-token compliance lint (session 162 audit extension).
//
// Walks app/ + components/, scans for two violation categories:
//   1. Inline fontFamily literals: `fontFamily: "Georgia, serif"` (should
//      use `fontFamily: FONT_LORA` / `FONT_INTER` / `FONT_CORMORANT` /
//      `FONT_NUMERAL` / `FONT_SCRIPT` from lib/tokens.ts).
//   2. Inline fontSize numerics: `fontSize: 14` (should resolve via a
//      canonical type scale — no such scale exists yet, so the audit
//      surfaces every numeric as a calibration baseline. The session-162
//      audit recommends adopting a canonical type scale during Shape C).
//
// Allowed by definition (regex doesn't match):
//   - Bare identifier refs: `fontFamily: FONT_LORA` (no quote → no match)
//   - String literals containing `var(`: `fontFamily: "var(--font-lora)"`
//     (explicitly excluded — tokenized via CSS var)
//   - fontSize via token ref: `fontSize: v1.icon.lg` (no number → no match)
//
// Known noise:
//   - fontSize: 0 (rare; counts as off-scale)
//
// Usage:
//   npm run lint:fonts            # report mode
//   npm run lint:fonts -- --json
//   npm run lint:fonts -- --quiet

import {
  collectFiles,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

// fontFamily: "literal-string-value" → flag UNLESS the value contains var(
const FONTFAMILY_REGEX = /\bfontFamily\s*:\s*["'`]([^"'`]+)["'`]/g;

// fontSize: <number> → always flag (no canonical scale yet)
const FONTSIZE_REGEX = /\bfontSize\s*:\s*(-?\d+(?:\.\d+)?)\b/g;

function scanFile(file: string): Violation[] {
  const text = readFile(file);
  const lines = text.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    FONTFAMILY_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = FONTFAMILY_REGEX.exec(line)) !== null) {
      const literal = match[1];
      // Allow if the literal references a CSS variable.
      if (literal.includes("var(")) continue;
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "fontFamily",
        value: `"${literal}"`,
        snippet: line.trim(),
      });
    }

    FONTSIZE_REGEX.lastIndex = 0;
    while ((match = FONTSIZE_REGEX.exec(line)) !== null) {
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "fontSize",
        value: match[1],
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

function main() {
  const flags = getCliFlags();
  const files = collectFiles();

  const allViolations: Violation[] = [];
  for (const file of files) {
    allViolations.push(...scanFile(file));
  }

  renderReport({
    title: "Font-token lint (session 162 audit baseline)",
    subtitle: "Detection: inline fontFamily string literals + inline fontSize numerics",
    allowedDesc: "Allowed: bare FONT_* identifier refs (lib/tokens.ts), strings containing var(...)",
    flags,
    filesScanned: files.length,
    violations: allViolations,
  });
}

main();
