# Spacing Scale + Layer 1 Token Foundation — Status

**Last updated:** 2026-05-11 (session 144 — Arc 6.1.4 Layer 1 ship)
**Scope:** project-wide rhythm scale + token-foundation backing
**Successor planning:** Layer 2 component primitives (deferred post-v2-close per session 143)

---

## Why this exists

Session 143's "calibration pain" articulation surfaced a recurring drift:
the same visual decision (e.g., card padding) gets coded as `padding: 14`
on one page and `padding: 16` on the next page even though they should
match. Eyeballing values per page accumulates inconsistency that compounds
with project age.

Three-layer foundation framing scoped at session 143 close:

- **Layer 1 — token foundation (this arc, Arc 6.1.4)**: CSS variables
  in `:root` + canonical `space` / `radius` scales backing every TS token
  export. Single `:root` edit propagates project-wide.
- **Layer 2 — component primitives** (deferred): `<Heading>`, `<Body>`,
  `<Button>`, `<Card>`, `<Stack>`, `<Row>`, etc. Pages compose primitives
  instead of hand-spacing each surface. Closes the calibration-pain class
  entirely (padding lives inside primitives, not on each page).
- **Layer 3 — Tailwind utility** (skipped): overkill for project size.

Layer 1 + Layer 2 cover ~90% of the calibration pain.

---

## Canonical scales

### Spacing — locked session 143

`2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`

Denser rhythm than typical 4/8/16 scales — calibrated to existing project
visual rhythm rather than a generic Material/Tailwind ramp.

| Step | px | Use |
|------|----|-----|
| `s2`  | 2  | hairline gap (icon descender clearance) |
| `s4`  | 4  | inline tight (icon→label, badge inner) |
| `s8`  | 8  | inline default (form padding, list-item) |
| `s12` | 12 | card padding tight, row gap medium |
| `s16` | 16 | card padding default, page padding inline |
| `s24` | 24 | section gap, hero margin |
| `s32` | 32 | page section break |
| `s48` | 48 | major gap (footer, hero offset) |
| `s64` | 64 | full-page rhythm (rare) |

Allowed off-scale values: `0`, `1` (hairline borders).

### Radius — Arc 6.1.4

`sm: 8 · md: 12 · lg: 16 · xl: 20 · pill: 999`

Preserves the existing v0.2 keys/values (which had zero active consumers
per Arc 1.1 audit), now backed with `var()` refs and elevated as the
project-wide canonical radius scale.

---

## How tokens resolve at runtime

```
Consumer call site                lib/tokens.ts            app/globals.css :root
─────────────────────────────────  ───────────────────────  ────────────────────────
borderRadius: v1.imageRadius   →   "var(--th-v1-image-     →   --th-v1-image-radius:
                                    radius)"                   6px;
```

Every TS token export resolves to a CSS custom property. Update a value
in `:root`, the change propagates to every consumer at render time —
no consumer-side rewrites needed.

Numeric tokens (radii, gaps) carry `px` units in their `:root` value so
inline-style consumers stay drop-in: `borderRadius: v1.imageRadius`
renders as `border-radius: var(--th-v1-image-radius)` which the browser
resolves to `6px`.

Audit verified safe at Arc 1.2 (zero arithmetic, zero template-string
interpolation, zero JSX `size=` usage of token numerics in 80+ consumer
files). Full Next.js build green across all 23 routes.

### Layered namespace (preserved through v2 Arc 10 cleanup)

- `--th-v1-*` — journal vocabulary (Find Detail / Find Map / Booth / v1.2 post flow)
- `--th-v2-*` — field-guide migration (Saved/Home/Find/shelf shipped 138–142, auth-bridge 143)
- `--th-c-*`  — legacy v0.2 ecosystem (admin + parked surfaces)

---

## Lint baseline (Arc 1.3)

```
npm run lint:spacing
```

Walks every `.tsx`/`.ts` file under `app/` and `components/`, surfaces
inline-style spacing properties whose numeric values don't sit on the
canonical scale. Warn-not-fail per session 143's lock — always exits 0.

### Baseline at session 144 ship

| Metric | Count |
|---|---|
| Files scanned | 141 |
| Files with debt | 74 |
| Total violations | 415 |

### Top offenders (calibration-debt by file)

| File | Violations | Notes |
|------|-----------:|-------|
| `app/admin/page.tsx` | 56 | 2,386-line monolith; Tier B headroom for refactor |
| `components/ShareSheet.tsx` | 33 | Session 137 ship; bespoke timing values |
| `app/find/[id]/page.tsx` | 22 | Largest shopper-facing surface |
| `app/decide/page.tsx` | 19 | Reseller layer (different aesthetic — may justify exceptions) |
| `app/mall/[slug]/page.tsx` | 15 | v0.2 layer; pre-v2 |
| `app/vendor/[slug]/page.tsx` | 14 | v0.2 layer; pre-v2 |

Layer 2 component primitives (deferred post-v2-close) drive adoption.
Each primitive that absorbs a per-page spacing call retires its
violations from the baseline.

---

## How to use the new scales in new code

### Canonical `space` / `radius` (preferred for new surfaces)

```tsx
import { space, radius } from "@/lib/tokens";

<div style={{
  padding: space.s16,        // 16px
  gap: space.s8,             // 8px
  borderRadius: radius.md,   // 12px
}} />
```

### v1 / v2 semantic tokens (for surfaces in those layers)

```tsx
import { v2 } from "@/lib/tokens";

<div style={{
  background: v2.bg.main,           // #F7F3EB
  color: v2.text.primary,           // #2B211A
  border: `1px solid ${v2.border.light}`,
  padding: space.s16,               // canonical scale even within v2 surfaces
}} />
```

### Pure CSS files (Tailwind plugins, globals)

```css
.my-class {
  padding: var(--th-space-16);
  border-radius: var(--th-radius-md);
  background: var(--th-v2-bg-main);
}
```

---

## Update paths going forward

**Update a token value across the project:**
edit the corresponding CSS variable in [app/globals.css](../app/globals.css)
`:root` block. Every consumer picks up the change at next render.

**Add a new token to a layer:**
1. Add the var to `:root` in `app/globals.css`
2. Add the export to the appropriate const object in [lib/tokens.ts](../lib/tokens.ts)
3. Document in this file if it's a new canonical scale entry

**Watch the calibration baseline shrink:**
run `npm run lint:spacing` periodically. The expected trajectory is
slow shrinkage as Layer 2 primitives replace inline-style spacing on
large surfaces (admin, ShareSheet, /find/[id]).

---

## Related references

- **Locked plan**: [CLAUDE.md](../CLAUDE.md) session 143 close — 4 locked decisions for Layer 1
- **Migration roadmap**: [docs/v2-visual-migration.md](v2-visual-migration.md)
- **Promotion-strength operating mode**: [memory/feedback_design_record_as_execution_spec.md](../../.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_design_record_as_execution_spec.md) — Arc 6.1.4 itself executes against session-143's frozen scoping
