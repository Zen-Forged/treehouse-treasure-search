// scripts/lint-contrast.ts
// Contrast token-compliance lint (session 174 — Arc 4 REC-3 enforcement).
//
// Flags v2.text.muted + v1.inkMuted used as a TEXT color, where the
// session 173-174 fix bundle established AA-failing contrast at all
// in-scope sizes (2.16-2.82:1 across the 4 in-scope backgrounds).
//
// Per audit systemic recommendation #1, v2.text.muted is preserved
// for non-prose roles:
//   - Decorative icons ≥22px (per session 45 precedent; stroke at
//     large sizes tolerates lower contrast)
//   - Native HTML input placeholders (browser UX convention)
//   - 1px dividers / hairline borders (structural, not readable text)
//
// Detection (single-line):
//   - Inline-style:  `color: v2.text.muted` / `color: v1.inkMuted`
//   - TSX prop:      `color={v2.text.muted}` / `color={v1.inkMuted}`
//
// Allowlist (per-line heuristic):
//   - Line starts with `//` or `*` → comment, skip
//   - Same line contains `placeholder` (HTML attr or CSS selector) → skip
//   - Same line contains an icon component (Pi*/Lucide*/Md*/Io*/Bi*/Fa*/Hi*/Ri*/Tb*)
//     AND a size={N} where N >= 22 → decorative icon per audit exclusion
//
// Known limitations (acceptable for baseline lint):
//   - Multi-line inline-style blocks where the color line is standalone
//     can't detect surrounding icon context — may false-positive on
//     icon usage where the JSX opener and `style={{}}` block are split
//     across lines. Treat as candidates for review; the audit's bug
//     class is bounded enough that the lint is signal-bearing even
//     with this limitation.
//   - border/borderColor/borderTopColor patterns NOT flagged — the
//     regex bounds to `color:` not `border*Color:`.
//
// Per session 143 lock, all token-compliance linters exit 0 regardless
// (warn-not-fail — calibration debt baseline, not CI gate).
//
// Usage:
//   npm run lint:contrast            # report mode (default)
//   npm run lint:contrast -- --json  # machine-readable output
//   npm run lint:contrast -- --quiet # totals only, no per-file detail

import {
  collectFilesWithStats,
  readFile,
  relativeToRoot,
  getCliFlags,
  renderReport,
  Violation,
} from "./lint-shared";

// Inline-style: `color: v2.text.muted` or `color: v1.inkMuted` or `color: v1.inkFaint`
// Word-bound suffix prevents `text.mutedAccent` etc. false matches.
// Arc 5.5 (session 174 Shape β follow-on) — added v1.inkFaint detection:
// session 168 collapsed v1.inkFaint → same hex (#A39686) as v2.text.muted,
// so it carries the identical readability failure mode but wasn't in the
// original regex. 17 text-color v1.inkFaint sites surfaced post-extension.
const STYLE_REGEX = /\bcolor\s*:\s*v[12]\.(?:text\.muted|inkMuted|inkFaint)\b/g;

// TSX prop: `color={v2.text.muted}` etc.
const PROP_REGEX = /\bcolor=\{v[12]\.(?:text\.muted|inkMuted|inkFaint)\}/g;

// Icon JSX detection — two patterns:
//   1. Prefix-name libraries (Phosphor `Pi*`, Material `Md*`, Ionicons `Io*`,
//      BoxIcons `Bi*`, FontAwesome `Fa*`, Heroicons `Hi*`, Remix `Ri*`,
//      Tabler `Tb*`) plus the explicit `Lucide*` prefix when consumers use it.
//   2. Bare-name libraries (Lucide is imported with bare names like Heart,
//      MapPin, ArrowLeft, etc.) — any PascalCase JSX opener counts as a
//      potential icon when paired with size≥22 in the same line.
// Both patterns are guarded by the SIZE_REGEX size threshold; a non-icon
// component using `size={N}` would only false-allow if N≥22, which is rare.
const ICON_LIB_REGEX = /<(Pi|Lucide|Md|Io|Bi|Fa|Hi|Ri|Tb)[A-Z]/;
const BARE_JSX_REGEX = /<[A-Z][a-zA-Z]+\s/;

// size={N} or size={N.M} — decorative icon ≥22px is preserved per audit
const SIZE_REGEX = /size=\{(\d+(?:\.\d+)?)\}/;

function isAllowedLine(line: string): boolean {
  const trimmed = line.trim();

  // Comments
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) return true;

  // HTML/CSS placeholder context (preserves browser convention)
  if (/\bplaceholder\b/.test(line)) return true;

  // Decorative ≥22px icon (state-conveying icons <22px still flag).
  // Two-tier detection — prefix-name libraries OR bare PascalCase JSX
  // (covers Lucide which doesn't ship a `Lucide*` prefix).
  const hasIconJsx = ICON_LIB_REGEX.test(line) || BARE_JSX_REGEX.test(line);
  if (hasIconJsx) {
    const sizeMatch = line.match(SIZE_REGEX);
    if (sizeMatch && parseFloat(sizeMatch[1]) >= 22) {
      return true;
    }
  }

  return false;
}

function scanFile(file: string): Violation[] {
  const text = readFile(file);
  const lines = text.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isAllowedLine(line)) continue;

    STYLE_REGEX.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = STYLE_REGEX.exec(line)) !== null) {
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "color (inline-style)",
        value: m[0],
        snippet: line.trim(),
      });
    }

    PROP_REGEX.lastIndex = 0;
    while ((m = PROP_REGEX.exec(line)) !== null) {
      violations.push({
        file: relativeToRoot(file),
        line: i + 1,
        prop: "color (TSX prop)",
        value: m[0],
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
    title: "Contrast-token lint (session 174 — Arc 4 REC-3 enforcement)",
    subtitle: "Detection: v2.text.muted / v1.inkMuted used as prose color (`color:` or `color={...}`)",
    allowedDesc: "Allowed: comments, placeholder context, decorative ≥22px icons (Pi*/Lucide*/Md*/Io*/Bi*/Fa*/Hi*/Ri*/Tb* with size>=22)",
    flags,
    filesScanned: scanned.length,
    filesExcluded: excludedCount,
    violations: allViolations,
  });
}

main();
