# Contrast lint baseline — session 174

> **Shipped:** session 174 Arc 4 (initial REC-3 lint script + baseline 99) + Arc 5 (Shape β system-wide sweep + lint extensions + baseline 0).
>
> **Companion to:** [`docs/contrast-audit.md`](contrast-audit.md) (session 171 + 173 + 174 fix bundle) · [`scripts/lint-contrast.ts`](../scripts/lint-contrast.ts) · `npm run lint:contrast`
>
> **Purpose:** Structural backstop against the contrast bug class returning via new callsites of `v2.text.muted` / `v1.inkMuted` / `v1.inkFaint` used as prose color, per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted ("JSDoc-only enforcement is insufficient — lint script IS the structural backstop").

---

## Baseline at session 174 close

**0 total violations across 135 in-scope files** (25 excluded per `EXCLUDED_PREFIXES`).

The Shape β system-wide sweep retired v2.text.muted as a prose color across all 36 audit-flagged + drift-detected files. Combined with the lint-extension catching v1.inkFaint + Lucide bare-JSX icons, the baseline lands at zero.

### Sweep coverage (Arc 5.1 — 5.4)

| Arc | Files | Sites | Surface category |
|---|---|---|---|
| 5.1 | 8 | ~40 | Vendor-flow (vendor-request + post/tag + setup + 5 booth sheets/inline/tile/picker) |
| 5.2 | 7 | ~25 | Auth + shopper (login + welcome + admin/login + find/[id] + (tabs)/page + my-shelf + contact) |
| 5.3 | 12 | ~22 | Shared chrome (MallScopeHeader + MallSheet + BoothPage + BoothLockupCard + 8 chrome primitives) |
| 5.4 | 9 | ~27 | Admin + Review Board (4 admin/* + 5 review-board/*) |
| **Total** | **36** | **~114** | All in-scope text-color callsites |

---

## What the lint catches (post Arc 5.5 extension)

### Detection regex (3 source tokens × 2 syntaxes)

```regex
\bcolor\s*:\s*v[12]\.(?:text\.muted|inkMuted|inkFaint)\b
\bcolor=\{v[12]\.(?:text\.muted|inkMuted|inkFaint)\}
```

Catches:
- **Inline-style:** `color: v2.text.muted` (any whitespace tolerance via `\s*`)
- **Inline-style:** `color: v1.inkMuted` (session 168 collapsed to same hex as v2.text.muted)
- **Inline-style:** `color: v1.inkFaint` (also #A39686 post-collapse — same readability failure mode)
- **TSX prop:** `color={v2.text.muted}` (any of the 3 source tokens via `\}` terminator)

### Allowlist (per-line heuristic)

- **Comment lines** (`//` or `*` prefix) — documentation, not runtime
- **HTML/CSS placeholder context** (line contains `placeholder` substring) — browser convention preserved per audit recommendation #1
- **Decorative icons ≥22px** — two-tier detection:
  - Prefix-name libraries: `<Pi*` / `<Lucide*` / `<Md*` / `<Io*` / `<Bi*` / `<Fa*` / `<Hi*` / `<Ri*` / `<Tb*` (Phosphor/Lucide-namespaced/Material/Ionicons/BoxIcons/FontAwesome/Heroicons/Remix/Tabler)
  - **Bare PascalCase JSX** (`<[A-Z][a-zA-Z]+`) — covers Lucide bare imports like `<Heart>`, `<MapPin>`, `<ArrowLeft>`
  - Both gated by `size={N}` where N ≥ 22 (per session 45 precedent + audit exclusion)

### Known limitations (acceptable for baseline lint)

1. **Multi-line inline-style blocks where the color line is standalone** — same-line context heuristics can't see the parent JSX element. Acceptable for warn-not-fail lint; reviewer reads the flagged line + classifies.

2. **`border` / `borderColor` / `borderTopColor` etc. NOT flagged** — regex bounds to bare `color:` (the property name).

3. **Conditional ternary inside `color:` value** (e.g., `color: active ? v2.text.primary : v2.text.muted`) is correctly flagged when the muted branch is present.

4. **Bare-JSX heuristic accepts non-icon components with `size={N≥22}` as decorative-equivalent** — false-positive allow if a non-icon component happens to use a `size` prop ≥ 22. Rare in practice; sufficient for warn-not-fail.

---

## Decay tracking

The baseline number SHOULD stay at or near 0 going forward. Any session-close where `npm run lint:contrast` reports a non-zero count indicates a regression — investigate the new file:line additions.

| Session | Baseline | Delta | Notes |
|---|---|---|---|
| 174 (Arc 4 init) | 99 | (init) | Initial baseline post Arc 1-4 fix-bundle ship (13 commits). Audit-scope-bounded retirement; 99 surviving sites included audit drift + ≥15px non-italic muted preserved per audit boundary. |
| 174 (Arc 5 close) | **0** | **−99** | David's iPhone QA on Arc 4 baseline surfaced "still seeing areas where it's difficult to read" → Shape β system-wide sweep applied audit recommendation #1 LITERALLY across all 36 files + extended lint to catch v1.inkFaint + Lucide bare-JSX icons. |

(Future sessions: append rows on lint:contrast run during close protocol.)

---

## Usage

```bash
npm run lint:contrast            # report mode (default — top files + samples)
npm run lint:contrast -- --json  # machine-readable output (CI integration)
npm run lint:contrast -- --quiet # totals only, no per-file detail
```

Per session 143 lock, the script exits 0 regardless (warn-not-fail — calibration debt baseline, not CI gate). To make it fail-on-regression, wrap in a baseline comparator (`scripts/lint-baseline-check.ts` — future op).

---

## Why "lint script" over "token split" (REC-3 cost-shape pick reasoning)

David picked Shape A (lint script) over Shape B (token split — retire `v2.text.muted` + introduce `v2.ink.placeholder` + `v2.ink.divider` + `v2.ink.icon`) at session 174 opener. After Shape β system-wide sweep, the namespace ambiguity case for token split is weaker — the project now has:

- **Zero v2.text.muted text-color callsites** (Shape β sweep retired all)
- **Surviving v2.text.muted uses are exclusively non-prose** — icon props ≥22px decorative + HTML placeholder template-literal + border/divider/conditional ternary branches
- **Lint script enforces** that no NEW callsite re-introduces v2.text.muted as a prose color

Token split could still ship as a future Tier B refinement (semantically clean retire of v2.text.muted in favor of `v2.ink.icon` + `v2.ink.divider` + `v2.ink.placeholder` for the surviving non-prose uses), but the urgency is gone — the contrast bug class is structurally closed.

---

_Generated at session 174 close. Baseline reproducible via `npm run lint:contrast -- --json` at HEAD post-Arc-5.5._
