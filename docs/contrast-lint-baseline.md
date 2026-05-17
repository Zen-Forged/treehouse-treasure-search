# Contrast lint baseline — session 174

> **Shipped:** session 174 Arc 4 — REC-3 enforcement pick (David picked "Lint script" cost shape over "Token split" at session-174 opener).
>
> **Companion to:** [`docs/contrast-audit.md`](contrast-audit.md) (session 171 + 173 + 174 fix bundle) · [`scripts/lint-contrast.ts`](../scripts/lint-contrast.ts) · `npm run lint:contrast`
>
> **Purpose:** Structural backstop against the contrast bug class returning via new callsites of `v2.text.muted` or `v1.inkMuted` used as prose color, per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted ("JSDoc-only enforcement is insufficient — the bug class returns when next callsite slips in").

---

## Baseline (session 174 close)

**99 total violations across 35 files** out of 135 in-scope files (25 excluded per `EXCLUDED_PREFIXES`).

The fix bundle shipped 12 commits across Arcs 1+2+3 retiring ~50 audit-flagged in-scope sites; the 99 remaining detections are mostly OUT-OF-SCOPE per the audit's stated bounds (≤14px text + 15-16px italic). The baseline number is signal-bearing not actionable — the goal is regression detection, not zero-violation drift.

### Top-debt files

| Rank | File | Count | Disposition |
|---|---|---|---|
| 1 | `app/login/page.tsx` | 8 | Out-of-scope per audit boundary (≥15px non-italic muted callsites; deferred per audit "Assumed legible; dial-on-demand if iPhone QA flags") |
| 2 | `app/review-board/StyleGuideComponents.tsx` | 7 | Internal admin control-room surface; not user-facing |
| 3 | `app/vendor-request/page.tsx` | 7 | Out-of-scope per audit boundary (form chrome at ≥15px) |
| 4 | `components/AddBoothSheet.tsx` | 6 | Out-of-scope (admin sheet helper text) |
| 5 | `components/EditBoothSheet.tsx` | 6 | Out-of-scope (admin sheet helper text) |
| 6 | `components/AddBoothInline.tsx` | 5 | Out-of-scope (admin sheet helper text) |
| 7 | `components/MallScopeHeader.tsx` | 5 | Out-of-scope (chrome above audit's stroke-loss threshold) |
| 8 | `app/post/tag/page.tsx` | 4 | Post-flow v1 cleanup boundary — deferred to Arc 10 per audit |
| 9 | `app/review-board/page.tsx` | 4 | Internal admin control-room surface |
| 10 | `app/find/[id]/page.tsx` | (~3) | Out-of-scope per audit boundary (v1-layer post-Arc-3.4 ship) |

(11 additional files with 1-3 violations each — see `npm run lint:contrast` for full list.)

---

## Heuristic limitations (acceptable for baseline lint)

### What the lint catches

- `color: v2.text.muted` (inline-style consumer)
- `color: v1.inkMuted` (inline-style consumer; session 168 collapsed to same hex)
- `color={v2.text.muted}` / `color={v1.inkMuted}` (TSX prop consumer)

### What the lint deliberately allows (audit recommendation #1 preservation list)

- **Comment lines** (`//` or `*` prefix) — documentation, not runtime
- **HTML/CSS placeholder context** (line contains `placeholder` substring) — browser convention preserved per audit
- **Decorative icons ≥22px** — same line contains an icon library JSX (`<Pi*` / `<Lucide*` / `<Md*` / `<Io*` / `<Bi*` / `<Fa*` / `<Hi*` / `<Ri*` / `<Tb*`) AND `size={N}` where N ≥ 22 (per session 45 precedent, decorative icons at large sizes tolerate lower contrast)

### Known false-positives (still in baseline)

1. **Multi-line inline-style blocks where the color line is standalone** — `<PiLeaf style={{ color: v2.text.muted, ... }} />` is correctly allowed (single line); but `<div style={{\n  color: v2.text.muted,\n  ...}}>` followed by an icon child would flag the color line as if it were prose because the icon context isn't on the same line. Acceptable for a baseline lint; reviewer reads the flagged line + classifies.

2. **`border` / `borderColor` / `borderTopColor` etc. NOT flagged** — the regex bounds to bare `color:` (the property name). 1px structural borders preserve muted per audit.

3. **Conditional ternary inside `color:` value** (e.g., `color: active ? v2.text.primary : v2.text.muted`) is correctly flagged when the muted branch is present.

---

## Decay tracking

The baseline number SHOULD trend down over time as:

- Out-of-scope sites get reclassified via future audit passes (iPhone QA surfaces new fail-class candidates → audit pass enumerates → fix bundle retires)
- Admin surfaces (Review Board / AddBoothSheet / EditBoothSheet / AddBoothInline) get a separate admin-flow contrast pass if/when the admin surfaces enter beta-shopper visibility scope
- Post-flow v1 cleanup boundary (Arc 10) ships, retiring `app/post/tag/page.tsx` + the deferred `app/post/preview/page.tsx` textDecorationColor sites

The baseline should NOT trend up. Any session-close where `npm run lint:contrast` reports a higher count than the prior session's baseline indicates a regression — investigate the new file:line additions.

| Session | Baseline | Delta | Notes |
|---|---|---|---|
| 174 | 99 | (init) | Initial baseline post fix-bundle ship (12 commits Arcs 1+2+3). |

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

David picked Shape A (lint script) over Shape B (token split — retire `v2.text.muted` + introduce `v2.ink.placeholder` + `v2.ink.divider` + `v2.ink.icon`) at session 174 opener for these reasons:

- **Existing 144 callsites compile unchanged.** No callsite-sweep at session-168 scale.
- **Smallest blast radius today.** Tooling investment ships in one focused session; token split would require ~150 inline edits.
- **Structural backstop holds.** Per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted — lint script IS the structural enforcement, not a patch.
- **Token split remains as future Tier B headroom** if a 3rd unique pain trigger surfaces post-baseline.

The token split is NOT off the table — it's deferred until iPhone QA + new-callsite-additions over the next ~5-10 sessions surface whether the lint catches new debt fast enough or whether the namespace ambiguity itself causes confusion.

---

_Generated at session 174 close. Baseline reproducible via `npm run lint:contrast -- --json` at commit a752247 (Arc 3.5 close)._
