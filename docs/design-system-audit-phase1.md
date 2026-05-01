# Design System Audit — Phase 1 (Read-Only Findings)

> Owner: Design + Dev agents · Date: 2026-05-01 (session 95)
> Scope: v1.x ecosystem layer only. Reseller intel layer (`/scan`, `/discover`, `/refine`, `/decide`, `/intent`, `/finds`, `/enhance*`, `/share`) is intentionally separate and excluded. Admin (`/admin`, `/admin/login`) is intentionally still on v0.2 and excluded from "drift" findings except where called out.
> Phase 1 deliverable: written audit only. No code changes. Phase 2 (extraction + tokenization) gated on review.

---

## Executive summary

**The system is mostly holding up.** v1.x palette + photograph chrome + polaroid pattern + masthead + bookmark/share bubbles + booth-numeral font rule are all coherent across surfaces. The drift is localized.

**Top 5 highest-leverage findings** (ordered by impact ÷ effort):

1. **`MASTHEAD_HEIGHT` is locked inside `StickyMasthead.tsx` (not exported).** Empty states + above-the-fold content on Home / /flagged / /shelves / /my-shelf each guess at clearance with `paddingTop: 60`, `72`, `80`, etc. Session 94's masthead bump (+40 system-wide) made this guess wrong on most surfaces. **Cheapest, highest-leverage fix in the audit.** [§B-1]

2. **Polaroid wrapper duplicated inline across 5+ surfaces** (Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/preview, /post/tag). Session 83 carry already flagged 4-surface trigger; we're now at 5–6. Bottom-padding diverges (`8px` on Home + /post/preview vs `0px` on /flagged + /shelf — caption inside vs outside). Extract `<PolaroidTile>` with `bottomMat: "inside" | "outside"` variant. [§F-1]

3. **No spacing or shadow tokens in v1.x.** v0.2 has `spacing` + `radius` tokens; v1.x has only `imageRadius` and `bannerRadius`. Every gap, padding, and shadow stack is inlined. Polaroid shadow `0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)` is duplicated in 8 places — a single typo silently desynchronizes the system. [§D, §E]

4. **`components/Buttons.tsx` exists but has zero v1.x callers.** It's Tailwind-based; v1.x uses inline styles. The four CTA shapes that DO recur (filled-green commit · disabled-green · italic dotted-link · 44px icon-bubble) are inlined 12+ times across forms. Either retire `Buttons.tsx` or rebuild it as inline-style v1.x primitives. [§G-3]

5. **Empty states drift.** Home ("The shelves are quiet."), /flagged ("No finds saved yet"), /shelves ("No booths yet"), /shelf/[slug] ("Nothing on the shelf yet…") all roll their own. Title sizes 15/20/24px; paddingTop 40/60/72/80px; only /shelves uses explicit `justifyContent: center`. Extract `<EmptyState>` primitive. [§I]

---

## What I'm calling "drift" vs. "intentional separation"

- **In scope (drift):** the v1.x ecosystem — Home, /flagged, /shelves, /my-shelf, /shelf/[slug], /find/[id], /post/tag, /post/preview, /vendor-request, /contact, /login, /login/email, /admin/login, /setup, /mall/[slug] (lensless variant), all v1.x components.
- **Out of scope (intentional v0.2):** `/admin/page.tsx` is by design still v0.2 — `Georgia, serif` + `colors.*` tokens there are NOT drift. Documented as an admin-redesign deferral in CLAUDE.md.
- **Out of scope (intentional dark theme):** `/scan`, `/discover`, `/refine`, `/decide`, `/intent`, `/finds`, `/enhance*`, `/share` — reseller intel layer with `#050f05` palette + own inline tokens.
- **Out of scope (testbeds):** `/transition-test`, `/flow-test` are diagnostic infrastructure.

The two pages that DO need to be in scope but currently use legacy tokens:
- `app/post/edit/[id]/page.tsx` — imports `colors` (v0.2). Defines a local palette `C`. The post-flow trilogy migrated to v1.2; this surface lagged. [§A-2]
- `app/vendor/[slug]/page.tsx` — defines its own inline palette with hardcoded `#f0ede6` / `#e8e4db` / `#1a1a18`, doesn't import any tokens. v0.2-era residue. [§A-2]

---

## A. Color tokens

### A-1 · v1 palette is correctly applied where it's applied

Photograph chrome, ink scale, post-it (#fbf3df since session 81), green saved-state, red destructive, hairline borders — universally use `v1.*` tokens on the v1.x ecosystem surfaces. No drift here.

### A-2 · v0.2/v1.x mixing on pages that should be v1.x

| File | Issue |
|---|---|
| `app/post/edit/[id]/page.tsx:26` | `import { colors } from "@/lib/tokens"` — should import `v1`. Defines local palette `C` mixing `colors.*` + raw hex (`#f0ede6` bg, `rgba(255,255,255,0.7)` input, `rgba(26,26,24,0.14)` input border) at lines 51–69. Post-flow trilogy migration debt. |
| `app/vendor/[slug]/page.tsx:14–25` | Defines palette `C` with hardcoded hex (`#f0ede6` bg, `#e8e4db` surface, `#1a1a18` text, `#1e4d2b` green). Does not import `colors` or `v1`. Pre-token-system residue. |

### A-3 · Hardcoded hex codes that should be tokens

| Value | Should be | Where |
|---|---|---|
| `#1e4d2b` | `v1.green` | `app/find/[id]/page.tsx:820` (conditional `copied ? "#1e4d2b" : v1.green` — both branches green), `:964` (`isSaved ? "#1e4d2b" : v1.inkPrimary` — should be `v1.green` for the saved branch) |
| `#faf2e0` | unnamed paper-cream variant | Used as page bg on `app/page.tsx:285`, `app/flagged/page.tsx:192`, `app/find/[id]/page.tsx:135`, `app/post/tag/page.tsx:130`, `app/post/preview/page.tsx:834`. Also the polaroid wrapper bg across 5+ surfaces. **6 occurrences across 6 files = real token candidate.** Propose `v1.paperWarm` or `v1.polaroidMat`. |
| `#fff` | needs a token | Used as text color on filled green CTAs in 28+ places. Propose `v1.onGreen` or `v1.invertText`. |
| `rgba(30,77,43,0.40)` | needs a token | Disabled-state filled-green button background. 5+ occurrences (`/post/preview:779`, `/login/email:237`, `/vendor-request`, etc.). Propose `v1.greenDisabled`. |
| `rgba(30,77,43,0.25)` / `rgba(30,77,43,0.22)` / `rgba(30,77,43,0.18)` | needs a token | Three different green CTA shadow opacities across surfaces. Pick one — likely 0.22 or 0.25. Propose `v1.shadowGreenCTA`. |
| `rgba(245,242,235,0.85)` + `0.5px solid rgba(42,26,10,0.12)` | needs a token | Frosted bubble bg (Home masonry heart bubble, /flagged FindTile fallback, BookmarkBoothBubble underlying treatment). Already centralized in `BookmarkBoothBubble` per session 81 but the inline bare buttons on Home + /flagged duplicate the recipe. |

### A-4 · Color/semantic mismatches

- `app/find/[id]/page.tsx:964` — `color: isSaved ? "#1e4d2b" : v1.inkPrimary` — when saved, should be `v1.green`. (Current values are equal numerically but semantic intent is the green state token.)

---

## B. Layout + spacing

### B-1 · `MASTHEAD_HEIGHT` is not exported (CRITICAL)

`components/StickyMasthead.tsx:102` declares `MASTHEAD_HEIGHT = "calc(max(14px, env(safe-area-inset-top, 14px)) + 103px)"` but does **not** export it. Pages cannot import the canonical value, so each page hardcodes its own clearance:

| Page | Clearance value | File:Line |
|---|---|---|
| Home empty state | `paddingTop: 72` | `app/page.tsx:119` |
| Home hero section | `paddingTop: 60` | `app/page.tsx:803` |
| /flagged empty state | `padding: "60px 32px 0"` | `app/flagged/page.tsx:427` |
| /shelves empty state | `padding: "80px 32px 0"` | `app/shelves/page.tsx:561` |
| /flagged skeleton loader | `paddingTop: 20` | `app/flagged/page.tsx:721` (almost certainly broken — would overlap masthead at +40 height) |

**Fix shape (Phase 2):** add `export` to the const, import on every empty-state + above-the-fold callsite. Single line of code. Eliminates the next-masthead-bump migration entirely.

### B-2 · Page horizontal padding — two canonical values, one outlier

- **`22px`** (content pages) — Home, /flagged, /post/preview content, /shelf/[slug] grid wrapper.
- **`28px`** (form pages) — /login, /login/email, /vendor-request, /contact, /admin/login.
- **`44px`** (divider rows on Home + /flagged) — outlier for the section-divider rows specifically (`app/page.tsx:785`, `app/flagged/page.tsx:707`).
- **`32px`** (shelves empty + flagged empty) — outlier; should likely be 22px to match content pages.
- **`20px`** (admin) — intentional v0.2 still, ignore.

Recommend: token `v1.pagePad: 22`, `v1.formPad: 28`, retain divider 44 as a section-rule treatment if intentional.

### B-3 · Vertical rhythm has no canonical step

Margins and gaps are scattered across `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28` with no clear cadence. Form labels use `marginBottom: 6` or `marginLeft: 5` (BoothFormFields); form-field gap is `12` in some places, `14` in others (`app/login/email/page.tsx:301` vs `:367`).

Recommend: declare an 8-px or 4-px rhythm token scale (`gap.xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 32`) and audit drift in Phase 2.

### B-4 · Tile gaps are clean (no action)

Tile grid gaps are uniformly `10px` (Home masonry, /flagged grid, AddBoothTile). Matches v0.2 `tileGap: 10`. No drift.

### B-5 · Empty states (4-way drift)

Per-page empty-state implementations:

| Page | paddingTop | textAlign | justifyContent | Title font-size |
|---|---|---|---|---|
| Home | 72 | center | (implicit, via flex column) | 20px FONT_LORA |
| /flagged | 60 | center | (implicit) | 24px FONT_LORA |
| /shelves | 80 | center | **explicit center** ✓ | 20px FONT_LORA |
| /shelf/[slug] | 48 (pad) | center | n/a | 15px FONT_LORA italic only — no title at all |

Different paddingTop, different title scale, only one with explicit centering. Single most extractable primitive in the audit. [See §F-2]

### B-6 · Bottom-nav clearance is hardcoded

Home + /flagged use `paddingBottom: "max(110px, calc(env(safe-area-inset-bottom, 0px) + 100px))"`. Other pages (e.g. /shelves) appear to lack equivalent treatment. BottomNav itself is `height: 28` + `paddingBottom: env(safe-area-inset-bottom) + 10`, so 110 is a generous defensive value but undocumented.

Recommend: `BOTTOM_NAV_CLEARANCE` constant exported from `components/BottomNav.tsx`, used everywhere a page renders BottomNav.

---

## C. Typography

### C-1 · Font tokens hold up

`FONT_LORA`, `FONT_SYS`, `FONT_NUMERAL` are correctly applied across the v1.x ecosystem. IM Fell is functionally retired (no `FONT_IM_FELL` import remains in active v1.x surfaces). 

### C-2 · Font-size scale (suggested canonical)

Frequency histogram across v1.x surfaces:

```
Highly recurring (canonical):   9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 26, 32
Lower-frequency (acceptable):   24
One-offs (worth verification):  17, 19, 21, 30
```

Recommend: declare `v1.text.{xs,sm,md,lg,xl,...}` ramp covering the canonical set. Audit `17`, `19`, `21`, `30` in Phase 2 — likely 1-line typos for `18`, `20`, `22`, `32`.

### C-3 · Font-weight

Three tiers in use: `500` (medium UI), `600` (subhead), `700` (display). Clean — no arbitrary values like `550` detected. No action.

### C-4 · Eyebrow + section-header drift

| Pattern | Examples | Drift |
|---|---|---|
| Section eyebrow (italic) | "Finds from across" (Home), "saved finds across" (/flagged), "A curated booth from" (/my-shelf), "More from this booth…" (/find/[id]) | FONT_LORA italic 14–16px, mostly inkMid/inkMuted. Mostly consistent. |
| Pill eyebrow (uppercase) | "BOOTH" pill on BoothLockupCard | FONT_SYS 9px uppercase 0.12em — used via the primitive, so no drift. |
| Cartographic eyebrow | "Find this item at" (/find/[id]), small all-caps post-it eyebrow on BoothHero | FONT_SYS 9–11px small-caps, ink-muted. Per session 81 sweep. |

Three distinct eyebrow registers (editorial · pill · cartographic) is intentional per design system. Recommend declaring them as named text-style constants (`EYEBROW_EDITORIAL`, `EYEBROW_PILL`, `EYEBROW_CARTOGRAPHIC`) so future surfaces don't reinvent them.

### C-5 · Documentation rot — "IM Fell" comments

~20 inline comments across ~15 files still reference IM Fell despite Lora replacing it (`feat(post)` and earlier waves). Examples flagged at session 82 + 83. Cosmetic; opportunistic cleanup.

---

## D. Borders + radius

### D-1 · `v1.imageRadius: 6` and `v1.bannerRadius: 16` are clean

Photograph radius (6) universally applied via the token. Banner radius (16) restricted correctly to BoothHero + FeaturedBanner. **No drift.**

### D-2 · Polaroid radius `4` is hardcoded across 5+ surfaces

The polaroid wrapper (`borderRadius: 4`) appears inline at:
- `app/page.tsx:287` (Home masonry)
- `app/flagged/page.tsx:195` (FindTile)
- `components/BoothPage.tsx:640` (WindowTile), `:996` (ShelfTile)
- `app/post/preview/page.tsx:480–481` (PolaroidPreview)
- `app/post/tag/page.tsx:132` (Find + Tag photos)

If extracted as `<PolaroidTile>` primitive (see §F-1), the 4-radius lives in one place.

### D-3 · Button + input radius is undocumented

Range observed: `8`, `9`, `10`, `12`, `14`. No clear pattern. The v0.2 token system has `radius.sm:8 / md:12 / lg:16 / xl:20` but v1.x has only `imageRadius:6` + `bannerRadius:16`. Form inputs land mostly at `14` (per v1.1k commitment) but `app/shelves/page.tsx:293` uses `10`, admin uses 14, BoothFormFields varies.

Recommend: token scale `v1.radius.{input:14, button:14, pill:999, sheet:20}`.

### D-4 · Border treatment — clean

`1px solid v1.inkHairline` is the dominant pattern (40+ occurrences). Variants are intentional:
- `0.5px` for de-emphasized fine hairlines (bubbles, /find/[id] shelf card) — intentional
- `1.5px solid v1.inkPrimary` for focused inputs — per spec
- `1.5px solid v1.redBorder` for error states — per spec
- `1px dashed v1.inkFaint` for placeholder tiles (AddFindTile, PlaceholderTile) — per spec
- `1px dashed rgba(122,92,30,0.45)` on /flagged amber notice — per AmberNotice primitive

No bypass-the-token findings here. **No action.**

### D-5 · Hairline divider primitive missing

12+ inline `borderTop: 1px solid v1.inkHairline` and `borderBottom: 1px solid v1.inkHairline` patterns across `BoothFormFields`, `PostingAsBlock`, /find/[id] cartographic block, /contact section rows, sheet headers. `<DiamondDivider>` exists in `BoothPage.tsx` (renders plain hairline post-v1.1j) but is only used 2x in BoothPage internals.

Recommend: `<HairlineDivider padding={N} />` primitive.

---

## E. Shadows

### E-1 · Zero shadow tokens — every shadow inlined

`lib/tokens.ts` has no shadow scale. Every `boxShadow` is an inline string. Total distinct stacks observed in v1.x ecosystem: ~12.

### E-2 · Polaroid shadow duplicated 8x verbatim

```
boxShadow: "0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)"
```

Across `app/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx` (×2), `app/post/preview/page.tsx`, `app/post/tag/page.tsx` (×2), and the BoothPage post-it pin variant. **Highest tokenization payoff in the audit.** Propose `v1.shadow.polaroid` + `v1.shadow.polaroidPin` (the pin variant uses 0.32/0.16 alpha).

### E-3 · CTA shadow drift (3 distinct stacks for "filled green button shadow")

| Stack | Where |
|---|---|
| `0 2px 12px rgba(30,77,43,0.25)` | `/post/preview:780`, `/post/tag:553` (publish + capture) |
| `0 2px 14px rgba(30,77,43,0.22)` | `/login/email:238` |
| `0 2px 10px rgba(30,77,43,0.18)` | AddBoothInline, AddBoothSheet |

Three buttons that fundamentally do the same job at the same visual scale, with three different shadows. Pick one (`0 2px 12px rgba(30,77,43,0.22)` would be a fair median) → `v1.shadow.ctaGreen`.

### E-4 · Other distinct stacks worth tokenizing

- **Sheet rise scrim** — `0 -10px 40px rgba(20,14,6,0.25)` (shelves), `0 -8px 30px rgba(30,20,10,0.28)` (smaller). Two close variants for a single conceptual treatment. Pick one → `v1.shadow.sheetRise`.
- **Subtle card** — `0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)` (/find/[id] shelf card). Light counterpart to polaroid. → `v1.shadow.cardSubtle`.
- **Toast** — `0 10px 32px rgba(26,26,24,0.18)` (admin) — admin-only, leave inline.

### E-5 · Reseller-layer shadows correctly separated

`/decide` dial halo, `/discover` CTA mega-shadow — out of scope, leave alone.

---

## F. Components ripe for extraction

### F-1 · `<PolaroidTile>` — HIGHEST priority

Duplicated inline across 5+ surfaces. Identical wrapper styling (background `#faf2e0`, padding `7px 7px {0|8}px`, radius `4`, polaroid shadow). Diverges only on bottom-mat (8px when caption is inside, 0 when caption sits below outside the frame).

**Proposed shape:**

```tsx
<PolaroidTile
  src={url}
  alt={title}
  aspectRatio="4/5"        // default
  bottomMat="inside" | "outside"   // controls 8px vs 0 bottom padding
  dim={isSold}            // adds 0.55 opacity for sold
  insetShadow={false}     // /post/tag uses inset vignette only
>
  {/* slot for overlay buttons (bookmark, unsave) */}
</PolaroidTile>
```

Adoption surfaces: Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/preview, /post/tag (×2). **6 callsites.** Eliminates ~250 lines of inline polaroid styling.

### F-2 · `<EmptyState>` — second priority

4 inline implementations on Home, /flagged, /shelves, /shelf/[slug] with drift in title size, padding, centering. (See §B-5.)

**Proposed shape:**

```tsx
<EmptyState
  title="No finds saved yet"
  subtitle="Tap the leaf on any find to save it here."
  cta={<Link>...</Link>}      // optional
/>
```

Single canonical paddingTop derived from `MASTHEAD_HEIGHT`. Single titleSize/subtitleSize. Explicit `justifyContent: center`.

### F-3 · `<FormField>` (label + input + error) — third priority

Form labels inconsistent across `/vendor-request`, `/login/email`, `/post/preview`, `/contact`, `/admin/login`, `EditBoothSheet`, `AddBoothSheet`, `BoothFormFields`, `AddBoothInline`. Drift dimensions:
- Label font-size: `13` on /login/email + /post/preview, `15` on /vendor-request (canonical per session 82).
- Label font-style: italic on /login/email (session 82 said upright).
- Input bg: `v1.postit` on /login/email + /post/preview (post-session-94 carry); `rgba(255,253,248,0.70)` (`v1.inkWash`) on /vendor-request.
- Padding: 14px on most, 16x16x14 on /login/email password input.

Decide on the canonical and extract `<FormField>` to enforce.

### F-4 · `<FormButton>` — fourth priority

`components/Buttons.tsx` exists with PrimaryButton/SecondaryButton/DangerButton (Tailwind). **Zero v1.x callers.** Meanwhile, 12+ inline filled-green-CTA buttons across the form pages. `Buttons.tsx` is functionally orphaned.

Two paths:
- (a) Retire `Buttons.tsx`, build `<FormButton variant="primary|secondary|ghost|dotted-link">` as inline-style v1.x primitive.
- (b) Migrate `Buttons.tsx` to inline-style v1.x and adopt across forms.

Either way, the four canonical button shapes that recur are: filled-green commit, disabled-green, italic dotted-link, and 44px icon-bubble (often via `iconBubble` token bg).

### F-5 · Masthead share button — small unification opportunity

`MastheadShareButton` is the canonical right-slot default since session 90. Confirmed inlined at:
- `app/my-shelf/page.tsx:158–206` — inline `<button>` with airplane SVG (predates the primitive)
- `app/shelf/[slug]/page.tsx:104–121` — inline `MastheadPaperAirplane` function (predates the primitive)

Both can flip to `<MastheadShareButton />` (or the page can just omit the right prop and let the default in). **Low-risk 2-line change per page.**

### F-6 · `<HairlineDivider>` — minor

12+ inline border-top/border-bottom hairlines. See §D-5.

### F-7 · `<BookmarkBoothBubble>` extension — minor

Inline frosted-bubble buttons on Home masonry (heart) + /flagged FindTile (heart) duplicate the bubble recipe centralized in `BookmarkBoothBubble`. Either extend the primitive to accept any inner glyph (heart vs leaf vs whatever), or extract a `<FrostedBubble>` shell with the bubble passed as a child.

### F-8 · `VendorCTACard.tsx` — confirmed unused

Confirmed zero callers grep. Already on the May 21 cleanup-agent schedule per session 94. No action.

### F-9 · Sheet entrance animations — known drift, defer

Per session 76 carry: AddFindSheet, AddBoothSheet, EditBoothSheet, MallSheet, ShareBoothSheet, BoothPickerSheet, PhotoLightbox each have their own entrance. Visual chrome (paper bg, 20px top-radius, hairline, drag handle) is consistent; only animation timing varies. Not a Phase 2 priority unless the user prioritizes overlay polish — flag, defer.

---

## G. Icons + chrome details

### G-1 · Icon library mix

- `lucide-react` — primary (~50 icons in v1.x)
- `react-icons/pi` — PiLeafBold/Fill (FlagGlyph since session 89)
- `react-icons/io5` — IoKey (BottomNav admin tab since session 90)

Cross-library mix is intentional but creates the BottomNav weight imbalance flagged at session 90 carry: 4 Lucide outline icons (strokeWidth 2.0) + 1 IoKey filled glyph reads as the admin tab being heavier. Not a token issue — a glyph-source issue. Defer.

### G-2 · Icon size scale

Distinct sizes used in v1.x: `10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 24, 26`. Most occurrences cluster at `14`, `18`, `21`, `22`. Recommend canonical scale `icon.{xs:14, sm:16, md:18, nav:21, lg:22, xl:24}`.

### G-3 · `Buttons.tsx` zero v1.x callers

See §F-4.

---

## H. Page semantics + chrome

### H-1 · `<main>` vs `<div>` inconsistency

Some pages wrap in `<main>` (`app/flagged/page.tsx:719`), most use `<div>`. No project-wide convention. Minor a11y drift; standardize in Phase 2.

### H-2 · `monospace` font-family hardcoded in 3 places

- `app/post/edit/[id]/page.tsx` (spinner indicator)
- `app/mall/[slug]/page.tsx:51` (price display) and `:144` (count display)

If monospace is intentional for tabular numbers, declare `FONT_MONO` token. If it's residue, retire.

---

## Summary table — Phase 2 priorities

| # | Finding | Effort | Impact | Phase 2 candidate |
|---|---|---|---|---|
| 1 | Export `MASTHEAD_HEIGHT` + adopt on all empty/hero clearance sites | XS (1 line + N imports) | High | **YES — start here** |
| 2 | Extract `<PolaroidTile>` primitive | M | High | **YES** |
| 3 | Extract `<EmptyState>` primitive | S | Medium-High | **YES** |
| 4 | Tokenize shadow scale (polaroid, ctaGreen, sheetRise, cardSubtle) | S | High | **YES** |
| 5 | Extract `<FormField>` + decide canonical input bg/label register | M | Medium-High | YES |
| 6 | Decide `Buttons.tsx` fate (retire or rebuild as `<FormButton>`) | S–M | Medium-High | YES |
| 7 | Migrate `app/post/edit/[id]/page.tsx` v0.2 → v1.x palette | S | Medium | YES |
| 8 | Migrate `app/vendor/[slug]/page.tsx` to import tokens | S | Medium | YES |
| 9 | Tokenize spacing scale (`v1.gap.*`) + audit drift | M | Medium | YES |
| 10 | Tokenize radius scale (`v1.radius.{input,pill,sheet}`) | XS | Low-Medium | YES |
| 11 | Extract `<HairlineDivider>` | XS | Low | Optional |
| 12 | Unify masthead share button (2 callsites → primitive) | XS | Low | YES (cheap) |
| 13 | Phase out `BoothFormFields.tsx` form-field gap drift (14 vs 12) | XS | Low | After #5 |
| 14 | Audit font-size outliers (17, 19, 21, 30) | XS | Low | Combine with #9 |
| 15 | Standardize `<main>` page-shell semantic | XS | Low | Optional |

**Recommended Phase 2 sequence:** 1 → 4 (tokens) → 2, 3, 5, 6 (primitives) → 7, 8 (migrations) → 9, 10 (further tokens) → cheap cleanups.

---

## Visual showcase page — gated on Phase 2

The user requested a component-showcase page. Defer until at least the top 4 primitives are extracted (PolaroidTile, EmptyState, FormField, FormButton) so the showcase reflects shipped primitives rather than aspirational ones. Propose path: `/design-system` (admin-gated or behind `?show=true` flag), styled like /transition-test — phone-frame mock cards listing each primitive with its variants.

---

## What was NOT changed in this audit

- Zero code edits.
- No tokens added to `lib/tokens.ts`.
- No components extracted.
- No mockups produced (Phase 1 is text-only audit, not redesign).

Phase 2 will scope each extraction as a discrete, testable change with mockup-first per Design Agent operating principle.
