# Design System — Phase 2 Plan

> Owner: Design + Dev agents · Drafted: 2026-05-01 (session 95) · Status: DRAFT for David review
> Predecessor: [`docs/design-system-audit-phase1.md`](design-system-audit-phase1.md)
> Approval gate: David approves the Phase 2 sequence + first session scope before any code lands.

---

## Goals

1. Tokenize the v1.x design system so future visual changes can be made globally instead of surface-by-surface.
2. Extract recurring inline patterns (polaroid, empty state, form chrome) into reusable primitives.
3. Resolve the two pages still on legacy palettes (`app/post/edit/[id]`, `app/vendor/[slug]`).
4. Produce a visual showcase page so the system can be reviewed in one place.

## Non-goals

- **No redesign.** The v1.x visual identity stays. Any visual delta is a side-effect of consolidation (e.g. picking one of three CTA shadow opacities), not a new direction.
- **No reseller-layer changes.** `/scan`, `/discover`, `/refine`, `/decide`, `/intent`, `/finds`, `/enhance*`, `/share` stay on their dark inline tokens.
- **No admin-page redesign.** `/admin/page.tsx` Georgia-serif + `colors.*` v0.2 stays. Admin redesign is a separately scoped sprint per CLAUDE.md.
- **No motion changes.** Sheet entrance animation drift is known (session 76 carry); separately scoped as a motion-design revisit.

---

## Sequencing principles

- **Smallest → largest commit sequencing** (22+ firings, promoted-via-memory). Token changes ship first because they're zero-visual-delta refactors. Primitive extractions ship one-at-a-time after tokens land.
- **Mockup-first for visual-touching sessions** per Design Agent operating principle. Token-only sessions skip the mockup gate.
- **One primitive per session.** Don't bundle PolaroidTile + EmptyState + FormField in one drop. Each gets its own mockup, build spec, iPhone QA cycle.
- **iPhone QA on Vercel preview, mid-session** per [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md). Compresses 2-session ship-then-QA arc into one.
- **AI APIs do not refire on retake/redo** — when extracting form primitives, preserve postStore state across primitive renders (per session 94 hard constraint).

---

## Six-session plan

```
Session A — Token foundation + MASTHEAD_HEIGHT export    [S]    no mockup
Session B — <PolaroidTile> primitive                     [M]    mockup-first
Session C — <EmptyState> primitive                       [S]    mockup-first
Session D — Form chrome (FormField + FormButton)         [M]    mockup-first
Session E — v0.2 → v1.x palette migrations               [S-M]  mockup if visual shift
Session F — Cleanup pass + /design-system showcase       [S-M]  mockup for showcase only
```

Effort estimates assume one focused session per item. Total: 6 sessions to land the full hardening pass.

---

## Session A — Token foundation + masthead export

**Goal:** zero-visual-delta refactor. Add the missing tokens to `lib/tokens.ts`, export `MASTHEAD_HEIGHT`, and adopt at the empty-state + above-the-fold callsites that currently hardcode clearance.

**No mockup.** Pure code refactor.

### Scope

| Token | Value | Replaces |
|---|---|---|
| `v1.paperWarm` | `#faf2e0` | 6 inline occurrences across page bgs + polaroid mats |
| `v1.onGreen` | `#fff` | 28+ inline `#fff` on filled-CTA labels |
| `v1.greenDisabled` | `rgba(30,77,43,0.40)` | 5 inline disabled-CTA bgs |
| `v1.shadow.polaroid` | `0 6px 14px rgba(42,26,10,0.20), 0 1.5px 3px rgba(42,26,10,0.10)` | 8 verbatim duplicates |
| `v1.shadow.polaroidPin` | `0 6px 14px rgba(42,26,10,0.32), 0 0 0 0.5px rgba(42,26,10,0.16)` | BoothPage post-it pin |
| `v1.shadow.ctaGreen` | `0 2px 12px rgba(30,77,43,0.22)` | 3 close variants (0.18/0.22/0.25) |
| `v1.shadow.sheetRise` | `0 -8px 30px rgba(30,20,10,0.28)` | 2 close variants |
| `v1.shadow.cardSubtle` | `0 3px 12px rgba(42,26,10,0.10), 0 1px 3px rgba(42,26,10,0.06)` | /find/[id] shelf card |
| `v1.gap.{xs,sm,md,lg,xl}` | `6, 8, 12, 16, 22` | rhythm scale (Phase 2 only declares; adoption in later sessions) |
| `v1.radius.{input,button,pill,sheet}` | `14, 14, 999, 20` | input/button radius drift |
| `v1.icon.{xs,sm,md,nav,lg,xl}` | `14, 16, 18, 21, 22, 24` | icon size scale |
| `MASTHEAD_HEIGHT` (exported) | existing constant | 5 hardcoded paddingTop sites |

### Files touched

- `lib/tokens.ts` — add new token bundles
- `components/StickyMasthead.tsx` — add `export` keyword to `MASTHEAD_HEIGHT`
- `app/page.tsx` — replace `paddingTop: 72` with `MASTHEAD_HEIGHT`-derived value, replace `#faf2e0` page bg with `v1.paperWarm`
- `app/flagged/page.tsx` — replace `padding: "60px 32px 0"` empty-state clearance with `MASTHEAD_HEIGHT`-derived; replace `paddingTop: 20` skeleton clearance (broken since session 94)
- `app/shelves/page.tsx` — replace `padding: "80px 32px 0"` clearance
- `app/find/[id]/page.tsx`, `app/post/tag/page.tsx`, `app/post/preview/page.tsx` — adopt `v1.paperWarm` in page bg

### Commit sequence (smallest → largest)

1. `chore(tokens): export MASTHEAD_HEIGHT from StickyMasthead` — 1 line
2. `feat(tokens): add v1.paperWarm color token` — adopt in 6 page bgs
3. `feat(tokens): add v1 shadow scale (polaroid, ctaGreen, sheetRise, cardSubtle, polaroidPin)` — declare; **no callsite changes yet** (callsite migrations in Sessions B–D where the primitives ship)
4. `feat(tokens): add v1.gap + v1.radius + v1.icon + v1.onGreen + v1.greenDisabled scales` — declare; no callsite migrations
5. `refactor(layout): adopt MASTHEAD_HEIGHT at empty-state + skeleton clearance sites` — 5 page edits

### Verification gate

- `npm run build` clean
- iPhone QA pass: walk Home / /flagged / /shelves / /shelf/[slug] / /my-shelf / /post/tag / /post/preview cold-start. Confirm:
  - Empty states still clear masthead (no overlap on slow load)
  - /flagged skeleton no longer overlaps masthead (was hardcoded 20px, broken since session 94)
  - Page bgs read identically to current (paperWarm token = current `#faf2e0`)

### Risks

- **Low.** Token additions don't change runtime behavior; MASTHEAD_HEIGHT adoption is a refactor with no semantic change. Build catches typos.

### What this session does NOT do

- Doesn't migrate any inline shadow stacks to token references (deferred to the session that ships the matching primitive — when polaroid lands as `<PolaroidTile>` in Session B, polaroid shadow inline → token at the same time, not before).

---

## Session B — `<PolaroidTile>` primitive

**Goal:** extract the polaroid wrapper duplicated across 6 callsites into a shared primitive.

**Mockup-first.** Surface the structural variants for David to lock in before code.

### Mockup gate

Mockup at `docs/mockups/polaroid-tile-primitive-v1.html`. Three frames in a phone-frame review surface:

- **Frame 1 — Inside-mat variant** (Home masonry, /post/preview): polaroid wrapper, photo, 8px bottom mat carrying timestamp / caption.
- **Frame 2 — Outside-mat variant** (/flagged FindTile, /shelf/[slug] WindowTile + ShelfTile): polaroid wrapper with `0` bottom padding, caption block lives outside the frame in a separate row below.
- **Frame 3 — Special variants:** dim (sold) + inset shadow (/post/tag).

Decisions pane to surface:

| D# | Question | My read |
|---|---|---|
| D1 | API shape: `bottomMat: "inside" \| "outside"` boolean toggle, or `bottomMat: number` allowing arbitrary values? | `"inside" \| "outside"` — only 2 patterns observed. Tighter API; rename to a clearer pair if needed. |
| D2 | Photo aspect ratio default | `4/5` per current usage. Surface as prop; allow `3/2` for the rare horizontal cases. |
| D3 | Should `<PolaroidTile>` own the photograph chrome (border, radius), or accept an `<img>` slot from the parent? | Own the chrome. Parent passes `src` + `alt` + `objectFit`. Internal photograph radius = `v1.imageRadius`. |
| D4 | Bookmark / unsave overlay slot | `children` slot positioned absolutely top-right. Caller renders the affordance (BookmarkBoothBubble or inline). |
| D5 | Treehouse Lens filter | Apply via prop `lens: boolean` (default `true`). /post/tag + /post/preview opt-out (review surfaces show raw photo). |
| D6 | "Last viewed" highlight (Home masonry session-78 layoutId state) | Pass-through prop `highlighted?: boolean` flips the polaroid border to `1.5px solid v1.green`. |

3–4 multiple-choice questions for David. **Build spec (`docs/polaroid-tile-build-spec.md`) written ONLY after mockup approval.**

### Scope

**New file:** `components/PolaroidTile.tsx`.

**Migrate inline implementations to the primitive:**
- `app/page.tsx` — MasonryTile (inside-mat)
- `app/flagged/page.tsx` — FindTile (outside-mat)
- `components/BoothPage.tsx` — WindowTile + ShelfTile (outside-mat, ×2)
- `app/post/preview/page.tsx` — PolaroidPreview (inside-mat)
- `app/post/tag/page.tsx` — both Find polaroid + Tag polaroid (inset shadow variant)

### Commit sequence

1. `docs(polaroid): polaroid-tile primitive design record + V1 mockup`
2. `feat(components): add <PolaroidTile> primitive`
3. `refactor(home): masonry tile adopts <PolaroidTile>` — single-surface verification
4. `refactor(flagged): FindTile adopts <PolaroidTile>`
5. `refactor(booth): WindowTile + ShelfTile adopt <PolaroidTile>`
6. `refactor(post): /post/tag + /post/preview adopt <PolaroidTile>`

### Verification gate

- `npm run build` clean after each commit
- iPhone QA on Vercel preview after each migration commit (per mid-session iPhone QA rule)
- Polaroid pattern reads identically across all 6 surfaces — no per-surface drift visible to user

### Risks

- **Medium.** Polaroid is the second-most-visible chrome element after the masthead. Any drift in shadow / mat / radius will read immediately. Mitigation: extract token `v1.shadow.polaroid` from Session A; the primitive reads from the token; adoption is verbatim per surface.
- Treehouse Lens filter must stay applied per session-66 commitment — verify on the dim/sold case + the post/preview review case.

---

## Session C — `<EmptyState>` primitive

**Goal:** unify the 4 inline empty states (Home, /flagged, /shelves, /shelf/[slug]).

**Mockup-first.** Smaller mockup pass — David's main decisions are voice + clearance.

### Mockup gate

Mockup at `docs/mockups/empty-state-primitive-v1.html`. Two frames:

- **Frame 1 — All four current empty states side-by-side** as a *before* baseline.
- **Frame 2 — Unified primitive** rendered with the canonical settings: `paddingTop: MASTHEAD_HEIGHT + 32`, FONT_LORA 22px title, FONT_LORA italic 14px subtitle, `justifyContent: center`, `alignItems: center`, max-width 280 on subtitle.

Decisions pane:

| D# | Question | My read |
|---|---|---|
| D1 | Title font size — converge on which? Currently 15/20/24 across surfaces. | `22` — splits the difference, FONT_LORA reads as journal voice not display. |
| D2 | Subtitle copy — does every empty state need one? | Yes when guidance is needed (Home + /flagged), no when context is obvious (/shelves admin sees the message in context). Make subtitle optional. |
| D3 | Voice unification — current copies don't share a voice ("The shelves are quiet" vs "No finds saved yet" vs "No booths yet" vs "Nothing on the shelf yet"). Should I unify, or preserve per-surface voice? | **Preserve per-surface voice.** The voices are deliberately scenic. The primitive enforces structure, not copy. |
| D4 | CTA slot — Home wants no CTA; /flagged wants "Show all malls" link sometimes; /shelves admin wants AddBoothTile. | Pass-through `cta?: ReactNode` slot. |
| D5 | Skeleton vs empty-state distinction | `<EmptyState>` is for `data === []` zero-row. Skeleton is for `data === undefined` loading. Different primitives. |

### Scope

**New file:** `components/EmptyState.tsx`.

**Migrate:**
- `app/page.tsx` — `EmptyFeed()` inline component
- `app/flagged/page.tsx` — `EmptyState()` inline component (rename callsite)
- `app/shelves/page.tsx` — empty branch at line 561
- `app/shelf/[slug]/page.tsx` — empty branch at line 476
- `app/my-shelf/page.tsx` — verify empty branch (audit didn't fully scan; may already use BoothPage's internal empty primitive)

### Commit sequence

1. `docs(empty-state): empty-state primitive design record + V1 mockup`
2. `feat(components): add <EmptyState> primitive`
3. `refactor(home,flagged,shelves,shelf): adopt <EmptyState> across 4 surfaces`

### Verification gate

- `npm run build` clean
- iPhone QA: simulate empty state on each surface (clear local data / use a fresh test account / temp set the data fetch to return `[]`). Confirm centering, clearance, voice retention.

### Risks

- **Low-medium.** Voice retention is the load-bearing decision (D3). If user testing surfaces drift across the 4 surfaces, easy revert to inline.

---

## Session D — Form chrome (FormField + FormButton + Buttons.tsx fate)

**Goal:** unify form labels + inputs + buttons. Kill `components/Buttons.tsx` or rebuild it.

**Mockup-first.** Multiple decisions that affect every form surface.

### Mockup gate

Mockup at `docs/mockups/form-chrome-primitive-v1.html`. Three frames:

- **Frame 1 — Current state across /vendor-request, /login/email, /post/preview, /contact** as a baseline diff.
- **Frame 2 — Unified `<FormField>`** with the canonical label register, input bg, padding.
- **Frame 3 — Button variants:** filled-green commit · disabled-green · italic dotted-link · 44px icon-bubble.

Decisions pane:

| D# | Question | My read |
|---|---|---|
| D1 | Input background: `v1.postit` (#fbf3df, used on /login/email + /post/preview) or `v1.inkWash` (rgba(255,253,248,0.70), used on /vendor-request)? | **postit (#fbf3df).** Postit reads as a warm, paper-honest surface; inkWash reads as a translucent panel cut out of paperCream. Postit is more on-brand. |
| D2 | Label register: italic 13 (current /login/email), upright 13 (current /post/preview), upright 15 (canonical per session 82). | **upright 15 FONT_LORA inkMid.** Session 82 already committed this as Option C for full pages; sheets stay 13. |
| D3 | Input padding: 14×14 (most), 16×16×14 (/login/email password). | `14×14` canonical. Password input loses the +2 padding — the visual difference was incidental, not committed. |
| D4 | `Buttons.tsx` (Tailwind, zero callers) — retire or rebuild? | **Retire.** The four canonical button shapes are inline-style; rebuilding `Buttons.tsx` as inline-style is the cleaner story than maintaining two paths. New `<FormButton>` lives at `components/FormButton.tsx`. |
| D5 | Disabled CTA shadow: `none` or kept at `0 2px 12px rgba(...,0.10)`? | **`none`.** Disabled state shouldn't lift. Currently varies per surface. |

### Scope

**New files:** `components/FormField.tsx`, `components/FormButton.tsx`.
**Removed:** `components/Buttons.tsx` (zero callers; verified Phase 1).

**Migrate (form pages):**
- `app/vendor-request/page.tsx` — labels + inputs + submit CTA + sign-in-instead link
- `app/login/page.tsx` — Sign-in card affordances
- `app/login/email/page.tsx` — email input + OTP code input + Email me a code CTA + Resend link + Sign-out link
- `app/contact/page.tsx` — inline mailto rows (mostly already styled; check label register)
- `app/post/preview/page.tsx` — Title / Caption / Price fields + Publish CTA
- `app/admin/login/page.tsx` — admin PIN input + Sign in CTA
- `app/setup/page.tsx` — confirmation screen CTAs
- `components/EditBoothSheet.tsx`, `components/AddBoothSheet.tsx`, `components/BoothFormFields.tsx`, `components/AddBoothInline.tsx` — booth form fields (sheet variant: `size="compact"` keeps 13px label per session 82 sheet rule)

### Commit sequence

1. `docs(form-chrome): form-chrome primitive design record + V1 mockup`
2. `feat(components): add <FormField> + <FormButton>`
3. `refactor(login): /login/email adopts FormField + FormButton`
4. `refactor(vendor-request): /vendor-request adopts FormField + FormButton`
5. `refactor(post): /post/preview adopts FormField + FormButton`
6. `refactor(contact,setup,admin-login): smaller forms adopt`
7. `refactor(booth-sheets): EditBoothSheet + AddBoothSheet + BoothFormFields + AddBoothInline adopt FormField (compact)`
8. `chore(components): retire Buttons.tsx (zero callers)`

### Verification gate

- `npm run build` clean
- iPhone QA: walk every form. Confirm:
  - Labels read as upright Lora 15 (page) / 13 (sheet)
  - Inputs read warmer (postit bg)
  - Filled green CTAs match across all surfaces (single shadow stack)
  - Disabled CTAs are flat (no shadow)
  - Italic dotted-link "Resend" / "Sign in instead" / "Sign out" patterns match

### Risks

- **Medium-high.** This touches every form surface in the app — including the activation funnel. Smallest→largest sequencing means bugs are caught early on /login/email before the booth-sheet migration runs.
- iOS Safari postit-bg + autofill yellow chrome interaction — verify on device. (Known: iOS Safari overrides input bg with autofill yellow on remembered fields; not a regression caused by this change but worth a sanity check.)

---

## Session E — v0.2 → v1.x palette migrations

**Goal:** retire the two pages still on legacy palettes.

**Mockup gate: conditional.** If migration is just token-renaming with no visual delta, skip the mockup. If the palette shift produces a visible change (likely on `/vendor/[slug]`), mockup-first.

### Scope

**`app/post/edit/[id]/page.tsx`** (post-flow trilogy migration debt):
- Drop `import { colors }`.
- Replace local palette `C` with v1 token references.
- Replace hardcoded `#f0ede6` page bg with `v1.paperCream`.
- Replace `rgba(255,255,255,0.7)` input bg with `v1.postit` (matching session 94 /post/preview decision).
- Adopt `<FormField>` + `<FormButton>` from Session D if available.

**`app/vendor/[slug]/page.tsx`** (pre-token-system residue):
- Replace local palette object with token imports.
- Map: `bg #f0ede6` → `v1.paperCream`; `surface #e8e4db` → `v1.paperWarm` or new token if needed; `textPrimary #1a1a18` → `v1.inkPrimary`; `textMid #4a4a42` → `v1.inkMid`; `textMuted #8a8478` → `v1.inkMuted`; `green #1e4d2b` → `v1.green`.
- Visual delta: `paperCream` is `#e8ddc7` (warmer), the old `#f0ede6` was cooler. **This is the surface most likely to need a mockup pass** because the delta is real.

### Commit sequence

1. `refactor(post-edit): /post/edit/[id] migrates to v1 palette` — one commit, scope contained
2. (if mockup needed) `docs(vendor-profile): /vendor/[slug] palette migration design record + V1 mockup`
3. `refactor(vendor): /vendor/[slug] migrates to v1 palette`

### Verification gate

- `npm run build` clean
- iPhone QA on `/post/edit/[id]` (admin impersonation flow) — confirm capture flow refresh from session 94 holds up.
- iPhone QA on `/vendor/[slug]` — confirm typography + palette read coherently.

### Risks

- **Low** for `/post/edit/[id]` — one tight surface, post-flow already uses v1 elsewhere.
- **Medium** for `/vendor/[slug]` — visual delta is real; mockup gate catches this.

---

## Session F — Cleanups + `/design-system` showcase page

**Goal:** opportunistic cleanups + ship the showcase page so the system can be reviewed in one place.

**Mockup gate: showcase page only.** Cleanups skip the mockup gate.

### Cleanup scope

| Item | Effort | Source |
|---|---|---|
| `MastheadShareButton` unification at `/my-shelf` + `/shelf/[slug]` | XS | Phase 1 §F-5 |
| Extract `<HairlineDivider>` primitive + adopt at 12+ inline border-top/bottom sites | S | Phase 1 §F-6 |
| Decide `monospace` font fate — declare `FONT_MONO` token or retire 3 occurrences | XS | Phase 1 §H-2 |
| Audit font-size outliers (17, 19, 21, 30) — fix typos or justify | XS | Phase 1 §C-2 |
| Strip "IM Fell" inline comments (~20 across ~15 files) | XS | Phase 1 §C-5 |
| Standardize `<main>` page-shell semantic across non-form pages | XS | Phase 1 §H-1 |
| `BookmarkBoothBubble` extension or `<FrostedBubble>` shell extraction | S | Phase 1 §F-7 |

### Showcase page

**New route:** `/design-system` — admin-gated (or `?show=true` flag) so it isn't public.

Mockup at `docs/mockups/design-system-showcase-v1.html`. Sections:

1. **Tokens** — color swatches, font samples, shadow stacks, radius scale, icon scale, gap scale.
2. **Primitives** — PolaroidTile (all 4 variants), EmptyState, FormField, FormButton, HairlineDivider, BookmarkBoothBubble, MastheadShareButton.
3. **Composite chrome** — StickyMasthead with all slot configurations, BoothLockupCard, FeaturedBanner (eyebrow + overlay variants), MallScopeHeader.
4. **Voice samples** — eyebrow registers (editorial / pill / cartographic), section heads, body copy.

Decisions pane (smaller this time):

| D# | Question | My read |
|---|---|---|
| D1 | Showcase route gating | Admin-gated. Authed-shopper users (post-R1) shouldn't see it. |
| D2 | Live primitives or static screenshots? | Live primitives — the page IS the source of truth. If a primitive drifts, the showcase shows it. |
| D3 | Variants surfaced at top level or behind tabs? | Top level. Scroll-walkable single page is faster to audit than tabs. |

### Commit sequence

1. `chore(masthead): /my-shelf + /shelf/[slug] adopt MastheadShareButton primitive`
2. `feat(components): add <HairlineDivider> + adopt across N callsites`
3. `chore(typography): retire IM Fell comment rot`
4. `chore(typography): align font-size outliers (17→18, 19→20, 21→22, 30→32 if typos)`
5. `chore(components): standardize <main> page-shell semantic`
6. (optional) `feat(components): extend BookmarkBoothBubble for inline frosted-heart sites`
7. `docs(showcase): design-system showcase mockup + decision record`
8. `feat(routes): add /design-system showcase page`

### Verification gate

- `npm run build` clean
- iPhone QA: load `/design-system` on device. Confirm every primitive renders.
- Confirm no regressions on the surfaces touched by cleanup commits.

### Risks

- **Low.** Cleanups are surgical. Showcase page is purely additive.

---

## Open questions for David

| Q | Question | Why it matters |
|---|---|---|
| Q1 | Approve the 6-session sequence as written? | Sets the rhythm for the next month. |
| Q2 | Approve Session A first-up scope (no mockup, token + export only)? | Token foundation is the prerequisite for B–E; ships safest. |
| Q3 | For Session D form chrome: pre-commit input bg `v1.postit` over `v1.inkWash`? | Currently fights across surfaces; Phase 2 has to pick one. |
| Q4 | Showcase page (Session F) — admin-gated or behind a flag? | Affects discoverability for future Claude sessions. |
| Q5 | Should Session E mockup-gate `/vendor/[slug]` migration up front, or audit first then decide? | Trade between caution + velocity. |
| Q6 | Anything in the audit you'd rather defer further or pull forward? | Reorder before commitment. |

---

## What gets deferred to Phase 3+

- Sheet animation drift (session 76 carry — separate motion design revisit)
- Admin page redesign (`/admin/page.tsx` v0.2 → v1.x — separate sprint)
- BottomNav IoKey weight imbalance (session 90 carry — needs a glyph-source decision, not a token)
- Dark reseller layer tokenization (different theme; not part of "the system")

---

## Estimated total effort

| Session | Effort | Mockup | Risk |
|---|---|---|---|
| A — tokens + masthead export | S | none | Low |
| B — PolaroidTile | M | yes | Medium |
| C — EmptyState | S | yes | Low-medium |
| D — FormField + FormButton | M | yes | Medium-high |
| E — palette migrations | S–M | conditional | Low-medium |
| F — cleanups + showcase | S–M | showcase only | Low |

**Total: 6 sessions** spanning roughly 2–3 weeks at current cadence. Each ships independently — work can pause mid-Phase if priorities shift.
