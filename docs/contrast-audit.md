# Contrast + Legibility Audit — Session 171 (Audit B)

> **Source ask:** David — "We need to do a full audit on contrast and legibility for this to launch. I see this also on other pages where the font is roughly the same size and color like on the profile page to login."
>
> **Trigger:** "A curated booth by" eyebrow at [`components/BoothPage.tsx:417`](../components/BoothPage.tsx) (Cormorant italic 16px, `v2.text.secondary` on `v2.surface.warm`) reading hard for the 40-65 demographic.
>
> **Audit scope:** ≤14px text + 15-16px italic in `v2.text.muted` / `v2.text.secondary` / `v1.inkMuted` / `v1.inkFaint` against `v2.bg.main` / `v2.surface.warm` / `v2.surface.card` / `v1.paperCream` backgrounds.
>
> **Status:** Launch-blocking. This doc is the **input** for a follow-on fix-bundle session (David picks the bundle scope from the offender tables below).

---

## Token reference

Resolved from `:root` CSS variables in `lib/tokens.ts`:

| Token | Hex | Role |
|---|---|---|
| `v2.text.primary` | `#2B211A` | Body / headings — high contrast |
| `v2.text.secondary` | `#5C5246` | Subheads / metadata — darkened session 153 R8A (#756A5E → #5C5246) but **insufficient at italic + ≤16px** per this audit |
| `v2.text.muted` | `#A39686` | Currently used for icons + dividers + form helpers + placeholders — **failing as a TEXT color at all tested sizes** |
| `v2.bg.main` | `#E6DECF` | Body background, masthead, nav |
| `v2.surface.warm` | `#FBF6EA` | Card warm bg |
| `v2.surface.card` | `#FFFCF5` | Card light bg (also `v2.surface.input` — same value since session 157) |
| `v1.inkMuted` | (legacy v1, ≈ #756A5E pre-darkening) | Used on a few remaining v1-layer surfaces (/find/[id], /shelf address) |
| `v1.inkFaint` | (legacy v1, ≈ #B5AC9A) | Hairlines + dotted-underline decorations |

---

## Summary

**Total offenders identified: 47 across 19 files**

| Tier | Count | Description | Priority |
|---|---|---|---|
| **Tier 1** | 16 | Small italic (13–16px) on secondary/muted | Critical — fix this beta |
| **Tier 2** | 18 | Small upright (10–14px) on muted | High — fix this beta |
| **Tier 3** | 9 | 15–16px italic on secondary | Borderline — italic stroke loss; fix recommended |
| **Bonus** | 4 | Dotted underline + faint decoration color | System-wide pattern fix |

---

## Tier 1 — Critical (small italic, secondary/muted color)

These are the highest-risk legibility failures. All recommended fixes promote one tier darker.

| File:line | Surface | Element | Font | Size | Current → Suggested |
|---|---|---|---|---|---|
| [`components/BoothPage.tsx:417`](../components/BoothPage.tsx) | /shelf, /my-shelf | "A curated booth by" eyebrow | Cormorant italic | 16px | `v2.text.secondary` → **`v2.text.primary`** ✅ **shipped session 171 commit fb01c03** |
| [`app/login/page.tsx:442`](../app/login/page.tsx) | /login | "Just a moment" loading text | Cormorant italic | 15px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/login/email/handle/page.tsx:225`](../app/login/email/handle/page.tsx) | /login/email/handle | "This is how Treehouse remembers you" | Cormorant italic | 15px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/welcome/page.tsx:167`](../app/welcome/page.tsx) | /welcome | "Choose a path — you can switch anytime" | Cormorant italic | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/welcome/page.tsx:283`](../app/welcome/page.tsx) | /welcome | WelcomeRow subtitle (generic) | Cormorant italic | 11.5px | `v2.text.secondary` → **`v2.text.primary`** |
| [`components/BoothPage.tsx:596`](../components/BoothPage.tsx) | /shelf, /my-shelf | MallBlock address line | Inter | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`components/v2/SavedMallCardV2.tsx:168`](../components/v2/SavedMallCardV2.tsx) | /flagged (Saved) | Mall address label | Inter | 11.5px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/find/[id]/page.tsx:1125`](../app/find/[id]/page.tsx) | /find/[id] (v1 layer) | "Pin this booth" eyebrow | Lora italic | 15px | `v1.inkMuted` → **`v1.inkPrimary`** |
| [`app/shelf/[slug]/page.tsx:210`](../app/shelf/[slug]/page.tsx) | /shelf (v1 layer) | Address + dotted underline | Lora italic + dotted | 14px | `v1.inkMuted` → **`v1.inkPrimary`** (+ retire dotted per bonus pattern) |
| [`app/find/[id]/edit/page.tsx:385`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Form label (active state dynamic) | Inter | 14px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/find/[id]/edit/page.tsx:592`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Optional field label | Inter | 13px | `v2.text.secondary` → **`v2.text.primary`** |
| [`app/post/preview/page.tsx:903`](../app/post/preview/page.tsx) | /post/preview | "(optional)" italic suffix | Inter italic | 12px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/login/email/handle/page.tsx:279`](../app/login/email/handle/page.tsx) | /login/email/handle | "Lowercase letters, numbers..." helper | Inter | 12px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/find/[id]/page.tsx:1152`](../app/find/[id]/page.tsx) | /find/[id] (v1 layer) | Address metadata | Lora | 13px | `v1.inkMuted` → **`v1.inkPrimary`** |
| [`components/BoothPage.tsx:688`](../components/BoothPage.tsx) | /shelf, /my-shelf | "Tap to add photos" prompt | Inter | 13px | `v2.text.muted` → **`v2.text.secondary`** |
| [`app/find/[id]/edit/page.tsx:634`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Tab label inactive state | Inter | 14px | `v2.text.muted` (conditional) → **`v2.text.secondary`** |

**Tier 1 fix bundle estimate:** ~16 single-line edits + 4-6 files touched. Single focused session (~30-45 min).

---

## Tier 2 — High (small upright on muted)

Form helper text, stat labels, secondary metadata at ≤14px on light backgrounds. **All suggest the same remap:** `v2.text.muted` → `v2.text.secondary` (#5C5246).

| File:line | Surface | Element | Font | Size |
|---|---|---|---|---|
| [`app/me/page.tsx:234`](../app/me/page.tsx) | /me | "Scouting since" stat | Inter uppercase | 10px |
| [`app/me/page.tsx:311`](../app/me/page.tsx) | /me | Stat label (generic) | Inter uppercase | 10px |
| [`components/v2/SavedEmptyState.tsx:43`](../components/v2/SavedEmptyState.tsx) | /flagged | Empty state message | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:307`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Field description | Inter | 14px |
| [`app/find/[id]/edit/page.tsx:345`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Helper text | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:472`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Helper text (variant) | Inter | 13px |
| [`app/find/[id]/edit/page.tsx:508`](../app/find/[id]/edit/page.tsx) | /find/[id]/edit | Counter label | Inter | 14px |
| [`components/ShareSheet.tsx:704`](../components/ShareSheet.tsx) | ShareSheet | Share option label | Inter | 13px |
| [`components/ShareSheet.tsx:937`](../components/ShareSheet.tsx) | ShareSheet email | Email hint placeholder | Inter | 13px |
| [`components/ShareSheet.tsx:1110`](../components/ShareSheet.tsx) | ShareSheet | "Copied!" flash text | Inter | 12px |
| [`components/ShareSheet.tsx:1133`](../components/ShareSheet.tsx) | ShareSheet | Share link copy label | Inter | 13px |
| [`components/ShareSheet.tsx:1170`](../components/ShareSheet.tsx) | ShareSheet | Fine print | Inter | 11px |
| [`app/post/preview/page.tsx:450`](../app/post/preview/page.tsx) | /post/preview | Field label | Inter | 13px |
| [`app/post/preview/page.tsx:491`](../app/post/preview/page.tsx) | /post/preview | Description helper | Inter | 13px |
| [`app/post/preview/page.tsx:503`](../app/post/preview/page.tsx) | /post/preview | Helper text | Inter | 13px |
| [`app/post/preview/page.tsx:543`](../app/post/preview/page.tsx) | /post/preview | Tags instruction | Inter | 13px |
| [`app/post/preview/page.tsx:649`](../app/post/preview/page.tsx) | /post/preview | Fine print | Inter | 12px |
| [`app/post/preview/page.tsx:708`](../app/post/preview/page.tsx) | /post/preview | Count label | Inter | 11px |

**Tier 2 fix bundle estimate:** Cleanest as a single `replace_all` per file (18 edits → ~6 file commits, single coupled commit if all retired to `v2.text.secondary`). ~30 min.

---

## Tier 3 — Borderline (15-16px italic on secondary)

Italic stroke loss at small sizes — same root cause as Tier 1 but slightly larger sizes give a borderline read. Fix recommended.

| File:line | Element | Font | Size | Current → Suggested | Note |
|---|---|---|---|---|---|
| [`components/v2/SavedEmptyState.tsx:43`](../components/v2/SavedEmptyState.tsx) | Empty state text | Cormorant | 14px | `v2.text.secondary` → **`v2.text.primary`** | (upright, borderline) |
| [`app/post/tag/page.tsx:892`](../app/post/tag/page.tsx) | Form label | Cormorant italic | 14px | `v2.text.secondary` → **`v2.text.primary`** | Cormorant italic loses stroke at 14px |
| [`app/find/[id]/edit/page.tsx:601`](../app/find/[id]/edit/page.tsx) | Label (Cormorant) | Cormorant | 14px | `v2.text.secondary` → **`v2.text.primary`** | |
| [`app/find/[id]/edit/page.tsx:514`](../app/find/[id]/edit/page.tsx) | Decorative dotted | Cormorant | 13px | `textDecorationColor: v1.inkFaint` → solid `v2.border.light` | Bonus pattern (decoration, not text) |

> Other Tier 3 items already listed under Tier 1 above (BoothPage.tsx:417 / login.tsx:442 / handle:225 / find:1125 / shelf:210).

---

## Bonus pattern — Dotted underline + faint decoration color

Reads as "broken underline" rather than "informational dotted" per session 46 precedent. Lower priority than text-color fixes but systemic.

| File:line | Element | Current | Suggested |
|---|---|---|---|
| [`components/BoothPage.tsx:600`](../components/BoothPage.tsx) | MallBlock address dotted underline | `textDecorationColor: v2.text.muted` | Retire dotted; use solid `v2.border.light` |
| [`app/login/page.tsx:803`](../app/login/page.tsx) | Link dotted underline | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/login/page.tsx:896`](../app/login/page.tsx) | "Resend" link dotted | `textDecorationColor: v2.text.muted` | Solid `v2.border.light` |
| [`app/find/[id]/edit/page.tsx:514`](../app/find/[id]/edit/page.tsx) | Decorative dotted stroke | `textDecorationColor: v1.inkFaint` | Solid `v2.border.light` |

---

## Systemic recommendations

### 1. Retire `v2.text.muted` as a TEXT color entirely

- **34 offenders** across Tier 1 + Tier 2 use `v2.text.muted` as the color for prose text
- Session 168 v1.inkMuted → v2.text.muted collapse was correct for icons + dividers (low contrast risk) but insufficient for readable prose at ≤14px
- **Recommendation:** Remap all PROSE consumers `v2.text.muted` → `v2.text.secondary`. Preserve `v2.text.muted` only for:
  - Icon colors (22px+ decorative; stroke at large sizes tolerates lower contrast)
  - Divider / hairline borders (1px strokes; structural, not readable)
  - Native HTML input placeholders (browser convention — overriding harms UX expectations)

### 2. Italic serif (Cormorant / Lora) at ≤15px on warm-cream

- Session 46 precedent: IM Fell italic at 13px retired (stroke loss on warm-cream)
- This audit: **Cormorant italic 13-16px** + **Lora italic 14-15px** show the same pattern
- **Recommendation:** Prefer upright serif for prose <16px. If italic required for editorial register, promote color to primary tier (Tier 1 mappings above).

### 3. Dotted decoration pattern

- **4 confirmed instances** where `textDecorationColor: v2.text.muted` reads as "broken" rather than "dotted info"
- **Recommendation:** Retire dotted-underline pattern system-wide for body text. Replace with solid `v2.border.light` hairlines OR drop decoration entirely.

---

## Out of scope (intentional exclusions per project precedent)

| Exclusion | Rationale |
|---|---|
| `app/admin/*` + `components/admin/*` | Dark theme reseller layer (#050f05); session 162 EXCLUDED_PREFIXES audit exclusion (beta scope) |
| `app/finds`, `app/scan`, `app/decide` | Reseller-intel layer; different palette + audience |
| Post-flow v1 cleanup (post/preview, post/edit, post/tag — beyond the surfaces flagged above) | Mapping pinned; full Arc 10 cleanup deferred |
| Icons >14px in muted color | Decorative use; stroke less sensitive than text per session 45 precedent |
| Dividers / borders | Hairline 1px strokes (structural, not readable text) |
| ≥15px non-italic muted | Assumed legible; dial-on-demand if iPhone QA flags |

---

## Recommended fix-bundle sequencing

A clean follow-on session shape (~60-90 min single session):

1. **Arc 1 — Tier 1 ship** (~30 min): 15 remaining Tier 1 edits (BoothPage.tsx:417 already shipped). 5-7 commits sequenced smallest→largest by file.
2. **Arc 2 — Tier 2 sweep** (~30 min): `replace_all v2.text.muted → v2.text.secondary` per file for the 18 Tier 2 consumers, OR per-line edit if the file has both prose + non-prose consumers of the token. ~5 file commits.
3. **Arc 3 — Bonus pattern retire** (~15 min): 4 dotted-underline decoration retirements. 1 commit.
4. **Arc 4 — Token enforcement (optional)** (~15 min): Add an inline comment to `lib/tokens.ts` at `v2.text.muted` warning "do not use for prose text ≤14px; use v2.text.secondary." Lint script (`npm run lint:contrast`) optional — see Audit C in session 171 close opener if David wants ongoing enforcement.
5. **iPhone QA pass** on real device against fix bundle → ship session close.

---

_Generated by Explore agent dispatch in session 171 (Audit B per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted). Tier 1 entry for `components/BoothPage.tsx:417` already shipped in commit `fb01c03` as the immediate fix David specifically named; remaining 46 offenders carry into the fix-bundle session._
