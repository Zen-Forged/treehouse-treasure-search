# Type Scale — Status

**Last updated:** 2026-05-14 (session 162 — Shape C arc 1, canonical type scale added to Layer 1)
**Scope:** project-wide type-size rhythm scale (font-size only — weights, line-heights, families remain per-token via FONT_* + inline)
**Sibling docs:** [`docs/spacing-scale-status.md`](spacing-scale-status.md) · [`docs/ui-tokenization-audit-2026-05.md`](ui-tokenization-audit-2026-05.md)

---

## Why this exists

The session 162 tokenization audit (Shape A) surfaced 939 fontSize inline numerics across 93 files as the largest single category of token-compliance debt. Unlike spacing (canonical scale shipped session 144) or radius (canonical scale shipped session 144), the project had NO canonical type scale — every fontSize was a per-page judgment call. 28 distinct numeric values were in use; 56% concentrated in the 11/12/13/14px cluster but with drift down to 10.5 / 11.5 / 12.5 / 13.5 fractionals and outliers at 7 / 17 / 19 / 21 / 23 / 40.

Shape C arc 1 (session 162) added a 9-step canonical scale to Layer 1, density-tuned to existing usage so future consumer migration is 1:1 at ~78% of inline call sites.

---

## Canonical scale — locked session 162

`9 / 11 / 13 / 14 / 16 / 18 / 22 / 26 / 32`

Density at the lower end matches the dominant usage cluster (11–14px = 56% of all inline fontSize today). Display tier (22, 26, 32) covers booth numerals, find-detail price, hero titles.

| Token | px | Role |
|---|---:|---|
| `type.size.xxs`   | 9  | rare; tiny metadata, captions |
| `type.size.xs`    | 11 | small-caps eyebrows, secondary metadata labels |
| `type.size.sm`    | 13 | default tile labels, dense form copy |
| `type.size.base`  | 14 | canonical body text |
| `type.size.md`    | 16 | Lora paragraph, dense headers |
| `type.size.lg`    | 18 | booth/find names, prominent labels |
| `type.size.xl`    | 22 | booth numerals, post-it stamps |
| `type.size.2xl`   | 26 | find-detail price |
| `type.size.3xl`   | 32 | hero title |

**Allowed off-scale values:** none. Anything outside the scale is calibration drift; consumers should round to the nearest step.

---

## Naming convention rationale

Semantic naming (`xxs / xs / sm / base / md / lg / xl / 2xl / 3xl`) chosen over numeric (`t9 / t11 / ...`) for two reasons:

1. **Scale-value flips don't rename consumers.** If `--th-type-base` changes from 14px → 15px in `:root`, every consumer using `type.size.base` follows automatically. Numeric naming would require renaming `t14 → t15` everywhere.
2. **Matches Layer 1 radius pattern** (`radius.sm / md / lg / xl / pill`). Project canonical convention.

Trade-off: less self-documenting at call site. The style guide (Shape C arc 2) renders each token against real copy at its role to close the documentation gap.

---

## Token resolution flow

```
TS import: type.size.base
   ↓
"var(--th-type-base)"   (string literal in tokens.ts)
   ↓
:root CSS var:           --th-type-base: 14px
   ↓
Browser-resolved:        font-size: 14px
```

Single source of truth: `app/globals.css :root` block. Updating a value requires one edit; the (future) ~535 consumer call sites continue to read `type.size.xs` / `type.size.base` / etc. unchanged.

---

## Lint baseline (session 162, post-Shape-C-arc-1)

`npm run lint:fonts -- --quiet` (after reseller-intel exclusion):

- Files scanned: 128 (26 excluded by allowlist)
- Files with debt: 68
- Total violations: 633 (fontSize numerics + inline fontFamily literals combined)

Of the 633: 535 are inline fontSize numerics (the migration target). 98 are inline fontFamily literals (separate concern — those should switch to `FONT_*` token refs).

### Top fontSize-debt files (pre-migration)

| File | Approx fontSize debt | Notes |
|---|---:|---|
| `app/admin/page.tsx` | 100 | v0.2 admin tier, never migrated |
| `app/mall/[slug]/page.tsx` | ~25 | v1 surface, dense inline numerics |
| `app/vendor/[slug]/page.tsx` | ~20 | v1 surface |
| `app/find/[id]/page.tsx` | ~20 | v2-migrated but inline drift |
| `components/admin/ReviewRequestModal.tsx` | ~20 | admin modal cluster |
| `app/post/edit/[id]/page.tsx` | ~20 | post flow |

---

## Adoption is opt-in (no consumer changes ship at session 162)

The scale exists; the lint script warns; no inline numeric was migrated in this commit. Migration is sequenced across Shape C arcs 2–4:

- **Arc 2 (style guide)** — `/style-guide` route renders the scale against real copy so consumers + reviewers can see each step in context before adopting.
- **Arc 3 (admin migration)** — `app/admin/page.tsx` migrates v0.2 → v1/v2 + adopts type scale (largest single in-scope cluster, ~100 fontSize numerics).
- **Arc 4+** — incremental migration as Layer 2 component primitives ship; primitives use the scale by default so adoption is automatic at the primitive layer.

---

## Update paths

**To add a new step:**
1. Add the CSS var to `:root` in `app/globals.css`
2. Add the token to `type.size` in `lib/tokens.ts`
3. Document the role above in this file's canonical-scale table
4. If the new step covers existing inline numerics, note the migration target in the audit doc

**To flip an existing value** (e.g., bump `base` from 14 → 15):
1. Edit `--th-type-base` in `:root` (ONE edit)
2. Consumers using `type.size.base` follow automatically
3. Run `npm run lint:fonts` to ensure no new drift surfaced from the flip

**To retire the scale entirely** (hypothetical): remove `type` export from tokens.ts + remove vars from :root. Lint:fonts will start re-flagging every consumer; migration history preserved in `:root` comment block.

---

## Related references

- [`lib/tokens.ts`](../lib/tokens.ts) — canonical token source
- [`app/globals.css`](../app/globals.css) — `:root` CSS variable definitions
- [`docs/ui-tokenization-audit-2026-05.md`](ui-tokenization-audit-2026-05.md) — session 162 audit synthesis
- [`scripts/lint-fonts.ts`](../scripts/lint-fonts.ts) + [`scripts/lint-shared.ts`](../scripts/lint-shared.ts) — lint pattern
- CLAUDE.md session 162 block — Shape A audit + Shape C arc 1 ship narrative
