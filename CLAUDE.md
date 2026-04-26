## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Run `/session-close` — replaces the old `thc` alias with the full close protocol (tombstoning, memory updates, commit + push, PR creation).

---

## DOCUMENT MAP

This file is the **live whiteboard** — only the current session's starting point. Everything else is elsewhere:

| Need | Read |
|---|---|
| Architecture, schema, routes, API table, lib + component catalog, auth pattern, DNS state, known gotchas, debugging commands | `CONTEXT.md` |
| Operating constitution: brand rules, tech rules, risk register, decision gate, agent roster | `docs/DECISION_GATE.md` |
| Session structure, HITL indicator standard, Docs agent + Design agent operating principles, blocker protocol | `MASTER_PROMPT.md` |
| Historical session close summaries (sessions 1–30, growing) | `docs/session-archive.md` |
| Canonical design system v1.1l + v1.2 build spec | `docs/design-system.md` + `docs/design-system-v1.2-build-spec.md` + `docs/mockups/` |
| Canonical vendor onboarding (3 flows) | `docs/onboarding-journey.md` |
| Supabase OTP email templates (HITL paste target) | `docs/supabase-otp-email-templates.md` |
| In-mall SQL triage recipes | `docs/admin-runbook.md` |
| Active bugs + deferred items + resolved history | `docs/known-issues.md` |
| Pre-beta QA walk runbook (T4d) | `docs/pre-beta-qa-walk.md` |
| Window share QA walk runbook (Q-007 session 41) | `docs/share-booth-qa-walk.md` |
| Queued sessions (scoped work sequenced behind something else) + operational backlog | `docs/queued-sessions.md` |
| Roadmap (Beta+) — epic-level captured items not yet scoped | `docs/roadmap-beta-plus.md` |
| Tech Rule candidates queue (firing counts + promotion status) | `docs/tech-rules-queue.md` |

---

## TERMINAL COMMAND FORMATTING CONVENTION
> When Claude surfaces multiple terminal commands to run in sequence, each goes in its own fenced block. This lets David copy one at a time and verify each before running the next.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

**Not this** (chained separate commands in one block that invite blind paste):

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
```

Exception: a single chained command with `&&` stays in one block — that's one atomic action by design.

---

## ✅ Session 70 (2026-04-26) — Finds Map redesign + Find Detail cartographic refinement + Masthead lock + booth lockup revision shipped end-to-end (six runtime commits)

Largest session-by-commit-count in recent memory. Pivot at standup — David redirected from feed content seeding (12× bumped) to "refinement and UI/UX consistency": (1) Finds Map needs a redesign — booth-info-in-one-container from session 69 didn't translate, X-marks-the-spot may need to be reconsidered altogether; (2) masthead shifts position across pages, lock it. Both items mocked-first, decisions batched with recommendations, three design records frozen + committed BEFORE implementation per the session-56 rule (now firing for the **FIFTH time** — `3432338` carries all three records together), then the implementation arc landed across three more commits. iPhone QA mid-session surfaced four polish items + a fourth design pass on the booth lockup; round-2 polish shipped as `48aa93a` + `ce5eb0c` (the booth lockup as Variant B + Treatment C across three surfaces). **Six runtime/docs commits in one session** — unusual scale but each was design-locked before code touched the keyboard. ZERO new memories; patterns that fired (`feedback_ask_which_state_first.md` 7th firing, same-session-design-record-commit rule 5th firing, `feedback_visibility_tools_first.md`) all reinforced existing memory.

The session ran in seven beats:

1. **Standup → David redirect (Item 1 + Item 2).** Recommended feed content seeding (now 12×); David: *"Redirect. A few things for this session. 1. The Finds map design and layout needs to be reviewed and redesigned... Also the x marks the spot concept may need to be reconsidered altogether. 2. The mast header shifts around on various pages... We need to lock it in so it never adjusts in location across pages."* Two items, both layout/visual work, both warrant mockup-first per design system rules.

2. **Disambiguation + scope-question round.** Two clarifying questions before drafting prose — per `feedback_ask_which_state_first.md` (now firing 7× — fully default opening): (Q1) is the cartographic vocabulary itself up for retirement, or just the booth-info container; (Q2) strict masthead identity vs visual stability with affordances. David picked **(c) both pages reviewed together** (Finds map disambiguation) + Q1 deferred to my call + Q2 = visual stability. I called Q1 = **Hybrid** — keep cartographic on `/find/[id]` (2-anchor pin+X reads naturally), retire on `/flagged` (multi-stop spine fights flexibility + the page is fundamentally a list). Spawned Explore agent up front to inventory `/flagged`, `/find/[id]`, and Masthead callsites — confirmed 7 callsites + booth-page internal scroll containers + custom `/post/preview` sticky div as the three composing causes of masthead drift.

3. **Decision batch (D1–D18, 18 across 3 records).** Surfaced full decision set with recommendation + rationale per decision before mocking. Record 1 (`/flagged` redesign): D1–D7. Record 2 (`/find/[id]` cartographic refinement): D8–D11. Record 3 (Masthead lock): D12–D18. David approved en bloc.

4. **Three mockups + three design records (`3432338`).** Mockups: [`docs/mockups/finds-map-redesign-v1.html`](docs/mockups/finds-map-redesign-v1.html) (cartographic spine retirement + sectioned-list with card headers + all-malls subtitle frame), [`docs/mockups/find-detail-cartographic-refinement-v1.html`](docs/mockups/find-detail-cartographic-refinement-v1.html) (mall block lifted to parallel inkWash card matching session-69 booth card), [`docs/mockups/masthead-lock-v1.html`](docs/mockups/masthead-lock-v1.html) (BEFORE/AFTER stack with green centerline ruler showing wordmark X-position holds across 6 pages). Design records: [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md), [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md), [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md). iPhone review surfaced one redirect: all-malls scope mall-subtitle on `/flagged` is a weak separator (booths from different malls read as one sequence without close attention to the filter eyebrow). David: *"I'm okay with it for now but will need to flag it"* — captured as Record 1 known limitation + carry note. iPhone review also surfaced D12 add: `/find/[id]` post-it eyebrow `"Booth\nLocation"` → `"Booth"` collapse (mirrors session-69 BoothHero treatment). All committed together as `3432338`.

5. **Three implementation commits (`d6b5a75` → `198560f` → `cc322e9`).** Sequenced smallest → largest so iPhone-QA-flagged regressions have clean rollback boundaries:
   - **Record 2 — `d6b5a75` (find-detail mall card + post-it eyebrow, +82/−43).** Mall block on `/find/[id]` lifted from plain content stack to parallel inkWash card with small-caps `MALL` eyebrow + IM Fell 18px name + dotted-link address (`e.stopPropagation()` on the address tap so the map link still works inside the wrapping card link). Whole card tappable → `/mall/[slug]` when `mallSlug` exists. Find-photo post-it eyebrow collapses two-line `"Booth\nLocation"` → single-line `"Booth"` (D12 — mirrors session-69 D10 BoothHero treatment). `mallSlug` extracted from `post.mall?.slug` (already SELECTed in `getPost`; no fetcher change). Build green: `/find/[id]` 7.86 kB (+70 bytes from 7.79 kB).
   - **Record 1 — `198560f` (finds-map redesign, +164/−262 = -98 net lines).** `/flagged` cartographic spine fully retired: `XGlyph` rendering + hairline tick + closer "circle + tagline" footer + 26px spine column wrapper + `BoothPill` component + inline "Booth + pill" label row all deleted. New `BoothSection` component renders each booth as a flat content section with inkWash card header carrying session-69 Option B vocabulary. Mall name surfaces as small subtitle below vendor name in the section header card ONLY when MallScopeHeader scope = "All malls" (D5). `groupByBooth` extended to attach `mallName` / `mallCity` / `mallState` from `post.mall` (data already selected by `getPostsByIds`). `lib/tokens.ts`: `v1.pillBg` / `v1.pillBorder` / `v1.pillInk` removed as orphan tokens (last call site retired here; closes session-69 carry note). Saved-label copy "saved finds" → "flagged finds" (consistency with session 69 terminology sweep). Build green: `/flagged` 6.07 kB (-170 bytes from 6.24 kB).
   - **Record 3 — `cc322e9` (masthead lock + scroll flatten, +259/−370 = -111 net lines, 8 files).** `StickyMasthead` rewrite: new `left` / `wordmark` / `right` slot API; component now owns the inner `1fr auto 1fr` grid + safe-area padding + 12/14px paddings + `min-width: 80px` lock on both side slots. Wordmark sits in `auto` middle column; the 80px reservation on side slots locks wordmark X-coordinate regardless of slot content. **D17** (booth-page scroll flatten): `/my-shelf` + `/shelf/[slug]` dropped their inner `overflow-auto` scroll containers, `scrollContainerRef` + `scrollTarget` prop passes removed, `paddingBottom` moved from inner div to outer page wrapper. Both pages now scroll against document scroll like every other page. **D18** (`/post/preview` unification): custom sticky div retired in favor of `StickyMasthead`; stacked "Review your find" 24px IM Fell title + italic subhead moved from inside the sticky chrome to a content block below at `padding: 16px 22px 10px`. Inner `overflow-auto` scroll container also flattened. All 7 page callsites migrated to the slot API. Build green; net **-111 lines** despite the new card wrappers.

6. **Push approval gate + push (`dabe3d4..cc322e9`, 4 commits).** Asked David before pushing the masthead lock since D17 is the highest-risk decision in the batch (booth-page scroll flatten could regress mall picker sheet anchoring, BoothHero parallax, scroll-to-top behaviors). David approved: *"push all 4."* Pushed `dabe3d4..cc322e9` to `origin/main`; Vercel auto-deployed.

7. **iPhone QA round 2 (`48aa93a` + `ce5eb0c`).** David walked the deploy, surfaced four items: (1a) remove logo from Home masthead left slot, (1b) wordmark still drops a pixel on Home, (2) Booths + Find Map should show the mall address (consistency with Home — important for Find Map specifically since the address isn't reachable from there today), (3) merge count into the eyebrow ("4 flagged finds at [Mall]") and retire the third "x saved finds" italic line, (4) booth-name lockup still isn't landing — proposed direction: vendor name LEFT, "Booth" small-font label above + booth number larger below on the RIGHT (needs mockup).
   - **`48aa93a` fix(masthead+scope-header), 4 files +58/−25.** Logo `<Image>` + `next/image` import removed from Home (left slot reverts to empty; locked column still reserves 80px). `StickyMasthead` wordmark gains `display: inline-block` + `transform: translateY(-1px)` to lift the IM Fell italic above-the-line-box-center ascenders into visual parity with side-slot icon centers. Both `/flagged` + `/shelves` `scopeGeoLine` swap from `kind: "italic"` count text to `kind: "address"` (with Apple Maps href) when filtered to a specific mall, italic "Kentucky & Southern Indiana" when all-malls — same pattern as Home. Eyebrow text on both pages now embeds the count: *"N flagged finds at"* / *"N flagged finds across"* / *"N booths at"* / *"N booths across"* with singular/plural handling. The third italic count line is retired; count is in the eyebrow, location is the geoLine.
   - **`ce5eb0c` feat(booth-lockup), 5 files +1156/−97.** Mockup [`docs/mockups/booth-lockup-revision-v1.html`](docs/mockups/booth-lockup-revision-v1.html) shipped with three Variants × stress-test (long vendor + 4-digit booth) × Find Detail visit-link sub-treatments. David picked **Variant B** (small-caps `BOOTH` label + IM Fell 26px numeral, right-aligned) + **Treatment C** (visit-link inline below vendor name on Find Detail). Design record [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md) frozen with 9 decisions (L1–L9) including per-surface numeral scaling — Find Map + Find Detail at 26px (vendor 18px), Booths grid at 20px (vendor stays at 14px to preserve tile-tile parity with photo + bio below; same lockup STRUCTURE, sized to surface). Implemented across all three surfaces: `/shelves` VendorCard, `/flagged` BoothSection card header, `/find/[id]` cartographic booth card. Find Detail also gains the inline "Visit the booth →" link 3px below the vendor name on the left column (whole card stays tappable as primary affordance; inline link is for first-time discoverability). **Design record + mockup committed in the same commit as implementation** — same-session-design-record-commit rule firing for the 5th time (origin 56 → 67 → 68 → 69 → 70 = beyond fully durable institutional practice).

**Final state in production (as of `ce5eb0c`):**

- `/flagged` cartographic spine retired entirely — XGlyph at each stop, hairline tick connecting stops, 26px spine column, closer circle + "Embrace the Search. Treasure the Find." tagline footer, BoothPill component all deleted as dead code. Page is now a flat sectioned list; each booth section has an inkWash card header with the new Variant B lockup
- `/find/[id]` cartographic block now has TWO parallel inkWash cards (mall + booth) anchored by the unchanged spine (PinGlyph + hairline tick + XGlyph). Mall card: small-caps `MALL` eyebrow + IM Fell 18px mall name + dotted-link address. Booth card: Variant B lockup with vendor name + visit-link on left, "Booth" small-caps + IM Fell 26px numeral on right. Whole booth card → `/shelf/[vendorSlug]`; whole mall card → `/mall/[slug]`. Find-photo post-it eyebrow now reads single-line "Booth"
- Booths grid VendorCard uses Variant B lockup at vendor 14px IM Fell + 20px IM Fell numeral (sized to tile)
- Masthead is locked: single `1fr auto 1fr` grid across all 7 callsites, both side slots reserve `min-width: 80px`, wordmark sits in `auto` middle column with `translateY(-1px)` correcting the IM Fell italic ascender drop. Right-slot variants supported: empty / sign-in icon / sign-out text / Admin pill / multi-bubble groups
- Booth pages (`/my-shelf`, `/shelf/[slug]`) flattened off internal `overflow-auto` scroll containers — masthead behaves identically across all pages
- `/post/preview` masthead unified: custom sticky div replaced with `StickyMasthead`; "Review your find" title + subhead moved from inside sticky chrome to content block below
- MallScopeHeader on all three primary tabs (Home / Booths / Find Map) shows the mall address with Apple Maps href when filtered to a specific mall; italic "Kentucky & Southern Indiana" when all-malls. Eyebrow embeds the count
- Logo retired from Home masthead left slot
- `lib/tokens.ts` cleaned: `v1.pillBg` / `v1.pillBorder` / `v1.pillInk` deleted as orphans
- No DB / RLS / API / migration changes — pure presentational

**Commits this session (6 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `3432338` | docs(finds-map+find-detail+masthead): design-to-Ready — three records |
| `d6b5a75` | feat(find-detail): mall block parallel card + post-it eyebrow collapse |
| `198560f` | feat(finds-map): cartographic retirement + sectioned list with card headers |
| `cc322e9` | feat(masthead): locked grid + slot API + booth-page scroll flatten |
| `48aa93a` | fix(masthead+scope-header): logo + pixel-drop + count-in-eyebrow + address |
| `ce5eb0c` | feat(booth-lockup): Variant B vendor+booth lockup across 3 surfaces |
| (session close) | docs: session 70 close — three records + masthead lock + scope header refresh + booth lockup shipped |

**What's broken / carried (delta from session 69 close):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–69, **70**. Now **13× bumped**. Two more session 70 layout-redesign passes closed on top of session 69's polish. Real content remains the actual unblocker. **Top recommended next session.** New judgment moments to fold into the seeding walk: (a) does the Variant B lockup at 14/20px hold on Booths grid against real vendor avatars + content, (b) does the new sectioned-list `/flagged` design feel grounded without the cartographic spine when populated with multiple real booths, (c) does the masthead wordmark hold position rock-solid across all primary tabs on iPhone, (d) booth-page scroll flatten — anything off about BoothHero parallax or mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`?
- 🟢 **`/find/[id]` cartographic visual asymmetry RESOLVED** (was session-69 carry note) — fixed by Record 2 (`d6b5a75`). Mall block now in parallel inkWash card matching the booth card.
- 🟢 **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` orphan tokens RESOLVED** (was session-69 carry note) — deleted from `lib/tokens.ts` in `198560f` after the last call site (BoothPill on `/flagged`) retired.
- 🟡 **NEW: All-malls scope mall-subtitle is a weak separator on `/flagged`** — David's iPhone QA: booths from different malls read as one sequence without close attention to the filter eyebrow. Captured in Record 1 design record as known-limitation + future-iteration carry-forward. Likely fix when revisited: mall-grouped section breaks with small all-caps mall eyebrow before the booth list resumes (parallel to how Booths page handled mall grouping in session 68 before it collapsed grouping when filtered).
- 🟡 **NEW: Booth-page scroll flatten regression watch** — D17 was the highest-risk change in Record 3. Watch for: BoothHero parallax behaviors, mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`, any "scroll to top" behaviors that previously observed the inner scroll container directly. Cheap fix if anything regresses: revert the flatten on a per-page basis with a `scrollContainerRef` reintroduction.
- 🟡 **NEW: `/post/preview` masthead unification — title-below-masthead pending iPhone QA** — title + subhead moved from inside sticky chrome to content block below. Page may lose the "reviewing" feel. If David flags it, options: (a) restore stacked title inside masthead (custom sticky again), (b) bring title into a sticky band BELOW masthead, (c) keep as-is.
- 🟡 **NEW: Booths grid lockup numeral size scaling deviates from spec** — design record specified 26px IM Fell numeral; Booths grid implements at 20px to preserve the existing 14px vendor name + bio + photo proportions on a ~170px-wide tile. Design-record L3 amended to capture this. If real photos surface a problem, can either bump Booths grid to 18/26 (which changes tile heights) OR scale the other surfaces down (which weakens the right-side numeral anchor).
- 🟡 **BoothHero post-it `minHeight: 96`** — unchanged from session 69 (separate page; out of scope this session).
- 🟡 **D4b session-46 reversal needs real-photo validation** — unchanged from session 69 (still pending seeding walk).
- 🟡 **Design-record price-color token deviation** — unchanged from session 69.
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — unchanged.
- 🟡 **`filter_applied` count = 0** — unchanged.
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **Booth-bookmark analytics events** — unchanged.
- 🟡 **Spec deviation — admin /shelves tiles don't carry the bookmark bubble** — unchanged.
- 🟡 **Mall-filter analytics events not wired on Booths + Find Map** — unchanged.
- 🟢 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged.
- 🟡 **`/mall/[slug]` lensless on v0.2 dark theme** — unchanged (now compounded by being the natural fourth carry-through surface for MallScopeHeader + caption treatment + Variant B lockup).
- 🟡 **Treehouse Lens constant is provisional** — unchanged.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the framing phase, **seventh firing across recent sessions** (was 6× pre-session-70). The two scoping questions (Q1 cartographic-vocabulary-fate + Q2 strict-vs-stable masthead) before drafting prose saved an entire round of "implement-then-redirect." Pattern is fully default — future sessions should not flag firings individually anymore.
- `feedback_visibility_tools_first.md` (session 60) — applied at the framing phase: spawned an Explore agent up front to inventory `/flagged`, `/find/[id]`, AND Masthead callsites. Findings revealed the 7 Masthead callsites + booth-page internal scroll containers + custom `/post/preview` sticky div as the three composing causes of masthead drift — informed the D-batch with concrete file references rather than guesses.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 7 commits (6 runtime/docs + 1 close) ✅. Seven sessions running at perfect compliance.
- `feedback_state_controls_above_hero_chrome.md` (session 68) — directly load-bearing for Record 1 (Find Map redesign). Cartographic spine + closer footer were "page-title chrome"; MallScopeHeader is the state control. Retiring the chrome in favor of the state control as the page identifier was the rule applied.

**Live discoveries:**

- **Same-session design-record commit rule firing for the FIFTH time = beyond institutional, beyond fully durable, fully default.** Origin session 56 (single instance) → 67 (second firing) → 68 (third firing) → 69 (fourth firing) → 70 (fifth firing — FOUR design records committed in one session, three together as `3432338` before implementation + one bundled with implementation as `ce5eb0c`). The rule is now simply the rule. Future sessions should not flag the firing.
- **"Ask which state first" firing for the SEVENTH time = also beyond noting individually.** Future sessions just frame decisions before drafting prose, no memory-firing flag required.
- **Sequencing implementation commits smallest → largest is a real pattern.** Doing Record 2 (`d6b5a75`) first as the smallest surface change built confidence; Record 1 (`198560f`) was contained to one file; Record 3 (`cc322e9`) was the most invasive (8 files + booth-page scroll flatten + `/post/preview` unification). If anything had broken on iPhone QA, the rollback boundary would be one of the three commits, not "revert the entire session." Worth promoting to a Tech Rule candidate: "Sequence implementation commits smallest → largest in multi-record sessions for clean rollback boundaries."
- **The IM Fell italic wordmark drops a pixel because the ascenders sit slightly above the line-box center.** When the line box is centered at `align-items: center` against icons (which have symmetric vertical content), the visible text reads as below center because the ink weight of the italic letters concentrates around the cap line, not the line-box center. Single-line CSS fix: `transform: translateY(-1px)` on the wordmark span. Worth capturing as design-system note. Could become a Tech Rule on second firing: "When centering text against icons in a flex/grid row, lift the text 1px to compensate for italic ascender bias."
- **Per-surface numeral scaling on the Variant B lockup is a real implementation pattern.** The lockup spec says "numeral 1.4× the vendor name." On Find Map + Find Detail (vendor 18px), that's 26px. On Booths grid (vendor stays at 14px to preserve photo + bio proportions on a tighter tile), that's 20px. Same lockup STRUCTURE, surface-aware sizing. Worth treating as a design-system principle: "Lockup typography ratios over absolute sizes when applied across surfaces of different scale."
- **The mockup's stress-test frame paid off.** The booth lockup mockup included a "long vendor name + 4-digit booth" frame — without that, neither David nor I would have caught that vendor names need single-line ellipsis truncation to preserve the right-side numeral block. Re-confirms the value of stress frames in mockups (cf. session 68's "all-malls scope" stress frame for the MallScopeHeader).

**Operational follow-ups:** Archive-drift accounting now includes session 69 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** No new candidates promoted. Two patterns surfaced this session worth tracking:
- **"Sequence implementation commits smallest → largest in multi-record sessions for clean rollback boundaries"** — single firing this session. Tech Rule on second firing.
- **"When centering text against icons in a flex/grid row, lift the text 1px to compensate for italic ascender bias"** — single firing this session. Tech Rule on second firing.

Both prior session-69 candidates (parallel-structure card consistency; `feedback_state_controls_above_hero_chrome.md`) carry forward. Session 68's "filter as intent → empty-state needs inline clear-filter link" also unchanged.

**Notable artifacts shipped this session:**
- [`docs/finds-map-redesign-design.md`](docs/finds-map-redesign-design.md) — design record (D1–D7) with cartographic retirement + sectioned list + known-limitation carry note.
- [`docs/find-detail-cartographic-refinement-design.md`](docs/find-detail-cartographic-refinement-design.md) — design record (D8–D12) with parallel mall card + post-it eyebrow collapse.
- [`docs/masthead-lock-design.md`](docs/masthead-lock-design.md) — design record (D13–D19) with locked-grid slot API + booth-page scroll flatten + `/post/preview` unification.
- [`docs/booth-lockup-revision-design.md`](docs/booth-lockup-revision-design.md) — design record (L1–L9) with Variant B lockup + per-surface numeral scaling captured.
- [`docs/mockups/finds-map-redesign-v1.html`](docs/mockups/finds-map-redesign-v1.html), [`docs/mockups/find-detail-cartographic-refinement-v1.html`](docs/mockups/find-detail-cartographic-refinement-v1.html), [`docs/mockups/masthead-lock-v1.html`](docs/mockups/masthead-lock-v1.html), [`docs/mockups/booth-lockup-revision-v1.html`](docs/mockups/booth-lockup-revision-v1.html) — four mockups; the masthead-lock mockup carries a green centerline ruler primitive worth reusing for any future "lock this thing in place" reviews.

The session ran in five beats:

1. **Standup → David redirect.** Recommended feed content seeding (now 11×); David: "redirect. This session will be used for refinement and UI/UX consistency" with the three-item scope above. Stated direction also included a lock-in for item 2: anchor on the Booths VendorCard treatment ("white-ish bg + dark-brown serif text, easy to read without losing character") and mockups before implementation.

2. **Decisions framing — D1–D9 batched with recommendations.** Per the now-durable `feedback_ask_which_state_first.md` (sixth firing — pattern is so consistent that surfacing decisions-with-rationale before prose is now the default opening, not a notable practice), surfaced 9 decisions across the three items with my recommendation + rationale per decision before drafting prose. Spawned an Explore agent up front (per `feedback_visibility_tools_first.md`) to inventory the three problem spaces — finding fewer "Save" strings than expected (3 user-visible UI hits + Mall ScopeHeader eyebrows from session 68), but a clearer caption inconsistency (Booths anchor in IM Fell on inkWash card vs. Find Map mixed-fonts no-bg vs. session-46 sans on booth-detail vs. Find Detail rail) and a real four-place fragmentation of booth identity (BoothTitleBlock has eyebrow+name no number; post-it has "Booth Location" eyebrow + numeral no name; Booths grid has dark photo pill at bottom-left + name in card body separately; Find Detail has number-pill + name + visit-link inline). David locked in two messages: D1 internal naming unchanged ✅; D2 three flips confirmed ✅; D3 redirect on phrasing — `"Flagged finds across" / "Flagged finds at [Mall Name]"` not my proposed `"Flags across"`; D3 empty-state and filtered-callout copy locked at David's specifications; D4b mock both options; D5 confirmed; D6 Home feed timestamp stays as-is **but italicized** (David's added preference); D7 all three booth-label surfaces in scope; D8 just Option B; D9 booth + number written. One short follow-up clarification round for D6 + D7 phrasing.

3. **Mockup → design record commit (`ab0a641`).** Wrote [`docs/mockups/caption-and-booth-label-v1.html`](docs/mockups/caption-and-booth-label-v1.html) — 12 phone frames across 2 sections: (1) caption consistency anchor + Find Map before/after + booth-detail before/after + Home feed italic + (2) booth label Option B applied to Booths grid + BoothHero post-it + Find Detail cartographic block. **iPhone review surfaced one redirect:** the BoothHero post-it should NOT pull the vendor name into the post-it as my mockup proposed — the post-it is the only page with this treatment and the vendor name is established by page context. Just collapse the eyebrow text two-line "Booth / Location" → single-line "Booth"; visual style otherwise unchanged. Updated mockup's "After" frame + Section 2 lede + footer judgment item to reflect the revised treatment. Wrote [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md) — frozen D1–D12 decisions (with the post-it minimal-revision baked in as D10), file-level scope, surface × treatment matrix, out-of-scope list, 8 acceptance criteria. **Committed mockup + design record together as `ab0a641` per the session-56 same-session rule** — fourth firing.

4. **Item 1 terminology sweep (`935c065`, +10/−10 across 4 files).** Mostly mechanical string flips:
   - Home feed `aria-label`: `"Save"` / `"Remove from saved"` → `"Flag"` / `"Remove flag"` ([`app/page.tsx:325`](app/page.tsx))
   - Find Detail flag button `ariaLabel`: same flip ([`app/find/[id]/page.tsx:886`](app/find/[id]/page.tsx)) — was an Explore-agent miss; caught by my final grep
   - Find Map flag button `aria-label`: `"Remove from saved"` → `"Remove flag"` ([`app/flagged/page.tsx:253`](app/flagged/page.tsx))
   - Find Map empty-state heading: `"Nothing saved yet"` → `"No finds flagged yet"`
   - Find Map empty-state body: `"Tap the heart on any find to save it here. Your trip comes together as you go."` → `"Tap the flag on any find to add it to your find map."` (the trailing voice line dropped per David's locked single-sentence form; "tap the heart" had been doubly stale since session 61's glyph swap)
   - Find Map `<MallScopeHeader>` eyebrows (session 68): `"Saves across"` / `"Saves at"` → `"Flagged finds across"` / `"Flagged finds at"`
   - Find Map filtered empty-state: `"No saved finds at"` → `"No flagged finds at"`; `"Saves at other malls are hidden..."` → `"Flagged finds at other malls are hidden..."`
   - `/post/preview` success: `"Saved to shelf."` → `"Posted to your shelf."` (this string is about a vendor publishing a post, not find-flagging; flipping to "flagged" would have been wrong)
   Internal naming (storage keys `treehouse_flag_*`, event names `post_saved` / `post_unsaved`, hook name `useSavedMallId`, DB columns) intentionally unchanged per D1 — renaming would break existing user state and analytics history continuity.

5. **Implementation across 5 files in one commit (`3f1b4e5`, +367/−368).**
   - **[`app/page.tsx`](app/page.tsx)** — D6/D8: Home feed timestamp gains `fontStyle: "italic"`. No other change.
   - **[`app/flagged/page.tsx`](app/flagged/page.tsx)** — Find Map FindTile gets Booths card treatment. Photo + caption now wrap in an `inkWash` card with `border` + `boxShadow` moved from photo div to card wrapper. Title flips IM Fell italic 13px → IM Fell 14px regular non-italic on `inkPrimary`. Price stays sans (was 13px → now 12px). 9/10/11 padding.
   - **[`components/BoothPage.tsx`](components/BoothPage.tsx)** — three changes in one file: (a) `BoothHero` post-it eyebrow text `"Booth\nLocation"` → `"Booth"` (single line, visual style otherwise unchanged); (b) `WindowTile` photo + caption wrap in inkWash card with same Booths treatment; (c) `ShelfTile` same treatment. (b) + (c) reverse session 46's deliberate sans-14px calibration for small-tile legibility — David's iPhone review of the mockup judged IM Fell at 14px on a ~170px-wide tile readable. If real photos surface a problem during the seeding walk, easy per-callsite revert without disturbing the anchor.
   - **[`app/shelves/page.tsx`](app/shelves/page.tsx)** — `VendorCard`: dark `Booth NN` photo-overlay pill at bottom-left retired. Card body now leads with small-caps `BOOTH 42` eyebrow (FONT_SYS 9.5px / 700 / 0.10em letter-spacing / `inkMuted`) above the vendor name. Three pieces ("Booth" + number + name) read as one coherent label.
   - **[`app/find/[id]/page.tsx`](app/find/[id]/page.tsx)** — two changes: (a) `ShelfCard` (related-finds rail) gets the same Booths card treatment with isSold opacity preserved on the photo div alone so the title remains crisp when sold; (b) cartographic vendor block restructured: green `Pill` numeric badge retired entirely, vendor block now an `inkWash` card with stacked layout (small-caps `BOOTH 42` eyebrow above IM Fell 18px vendor name with `Visit the booth →` inline at row's right edge); whole card becomes the tap target when `vendorSlug` exists (better mobile UX than the prior small inline link); `Pill` component deleted as dead code (zero callsites remained).

   Build green: `/find/[id]` 7.79 kB (from 7.81 kB), `/flagged` 6.24 kB (was 6.21 kB after Item 1's shorter copy strings, +30 bytes for the card wrapper), `/shelves` 6.34 kB unchanged.

**Final state in production (as of `3f1b4e5`):**
- All user-visible "Save"/"Saved"/"saving" UI strings on find surfaces flipped to "Flag"/"Flagged" terminology, except Reseller Intel layer (`/share` "My Picks") + post-edit autosave indicator + `/shelf/[slug]` 404 Heart icon (parked watch-item) + booth-bookmark surfaces (different verbal axis)
- Five tile-caption surfaces unified to the Booths VendorCard treatment: warm `inkWash` card + IM Fell 14px regular non-italic title + sans 12px price + `9/10/11` padding. Surfaces: Booths VendorCard (anchor), Find Map FindTile, BoothPage WindowTile, BoothPage ShelfTile, Find Detail rail ShelfCard. Reverses session 46 sans-14px calibration on the booth-detail/find-detail tiles
- Home feed timestamp italicized (sans 10px stays, no card frame)
- Booths grid VendorCard: dark `Booth NN` photo pill retired; small-caps `BOOTH 42` eyebrow added above vendor name in card body
- BoothHero post-it: eyebrow text collapsed two-line "Booth / Location" → single-line "Booth"; width + visual style otherwise unchanged
- Find Detail cartographic block: green `Pill` retired; vendor block now an inkWash card with stacked `BOOTH NN` small-caps eyebrow + IM Fell 18px vendor name + `Visit the booth →` inline link; whole card tappable when vendorSlug exists
- `Pill` component deleted from `/find/[id]/page.tsx` as dead code (zero callsites; closes the v0.2 → v1.0+ visual evolution where Pill graduated from pure-numeric badge to retired)
- No DB / RLS / API / migration changes — pure presentational

**Commits this session (3 runtime/docs + 1 close):**

| Commit | Message |
|---|---|
| `935c065` | refactor(copy): "Save"/"Saved" → "Flag"/"Flagged" terminology sweep across find surfaces |
| `ab0a641` | docs(captions+booth-label): design-to-Ready — caption consistency + booth label unification |
| `3f1b4e5` | feat(captions+booth-label): unified card treatment + Option B booth identity |
| (session close) | docs: session 69 close — caption + booth label unification + flag terminology sweep shipped |

**What's broken / carried (unchanged from session 68 unless noted):**

- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60–68, **69**. Now **12× bumped**. Refinement session closed two more polish gaps (terminology consistency + caption typography unification). Real content remains the actual unblocker. **Top recommended next session.**
- 🟡 **NEW: `/find/[id]` cartographic visual asymmetry** — mall block above is plain text with PinGlyph rail; vendor block below is now an inkWash card. The mockup didn't include the mall-block context (showed only the booth portion in isolation), so David approved the booth-block treatment without seeing the asymmetry. Pending iPhone QA. Cheap fix either way: (a) un-card the vendor block back to plain text, or (b) bring the mall block into a parallel card.
- 🟡 **NEW: BoothHero post-it `minHeight: 96`** — was sized for two-line "Booth / Location" eyebrow; now eyebrow is single-line "Booth". Post-it may look slightly tall against the collapsed eyebrow. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- 🟡 **NEW: D4b session-46 reversal needs real-photo validation** — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos in the mockup; real vendor content during the seeding walk is the actual judgment moment. Per-callsite revert if cramped without disturbing the Booths anchor.
- 🟡 **NEW: Design-record price-color token deviation** — design record specified `v1.inkMid` (#4a3520) for prices in unified card treatment; implementation kept `v1.priceInk` (#6a4a30) since that's the established semantic token across the existing surfaces. Minor visual difference (warmer brown vs. darker brown). Worth either: (a) updating the design record to reflect actual implementation, or (b) flipping to `v1.inkMid` if the visual difference matters. Skip unless flagged.
- 🟡 **NEW: `v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens may be orphaned** — Pill component deletion may have left these unreferenced in [`lib/tokens.ts:122–125`](lib/tokens.ts). Quick `grep` pass during cleanup; if unreferenced anywhere, delete from tokens.ts. Out of scope this session (token cleanup is unrelated cleanup per project rule).
- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — unchanged.
- 🟡 **`filter_applied` count = 0** — still unverified for FEED filter chips. Now also applies to mall-filter pickers on Booths + Find Map (analytics not wired there per session 68 carry).
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟡 **Booth-bookmark analytics events** — unchanged from session 67.
- 🟡 **Spec deviation — admin /shelves tiles don't carry the bookmark bubble** — unchanged from session 67.
- 🟡 **Mall-filter analytics events not wired on Booths + Find Map** — unchanged from session 68.
- 🟢 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged from session 65.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged backlog.
- 🟡 **`/mall/[slug]` lensless on v0.2 dark theme** — unchanged from session 66. Still also needs MallScopeHeader carry-through (session 68 deviation compounding).
- 🟡 **Treehouse Lens constant is provisional** — unchanged from session 66.

**Memory updates:** ZERO new memories.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied at the framing phase to surface D1–D9 in a single batch with recommendations + rationale before drafting prose. **Sixth firing across recent sessions.** Pattern is fully durable; future sessions should treat decisions-block-with-recommendations-before-prose as the default opening for any multi-state UI work, no longer a notable practice.
- `feedback_visibility_tools_first.md` (session 60) — applied at the framing phase: spawned an Explore agent up front to inventory the three problem spaces. Findings revealed fewer "Save" strings than expected but materially clarified the booth-label fragmentation across four surfaces.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all 4 commits ✅. Six sessions running at perfect compliance.
- `feedback_state_controls_above_hero_chrome.md` (session 68) — not directly applied this session but referenced as ambient context when interpreting the D6 Home feed timestamp scope question.

**Live discoveries:**

- **Same-session design-record commit rule firing for the FOURTH time — beyond fully durable.** Origin session 56 (single instance), session 67 (second firing — pattern is real), session 68 (third firing — fully durable institutional practice), session 69 (fourth firing — beyond pattern, default close shape full stop). Future sessions should drop "could become" / "fully durable" qualifiers — the rule is now simply the rule.
- **"Ask which state first" memory firing for the SIXTH time — beyond fully durable.** Decisions block with my recommendation + rationale per decision is now the default opening for any multi-state UI work. Cost of the framing pass is now lower than the cost of a wrong implementation pass — the firing isn't worth highlighting individually anymore.
- **Cardless option for cartographic block was the explicit alternative.** During implementation I noticed the cartographic block lives inside a 2-column grid with PinGlyph + XGlyph on the left and content on the right — the design record's card treatment creates a slight visual asymmetry with the mall block above (plain text, no card). The mockup didn't show the mall block context, so David approved the booth-block treatment in isolation. Shipped as designed; if iPhone QA flags the asymmetry, the cardless variant is the cheap fallback. Worth promoting to a Tech Rule candidate: "When wrapping one part of a parallel structure in a card, decide for the whole structure or none of it."
- **Pill component deletion closes a visual evolution loop.** The `Pill` primitive at `/find/[id]/page.tsx` had been the booth-number marker on the cartographic block since v1.1. Session 69's Option B retires it everywhere on the page and the function definition becomes dead code; deleted cleanly. The v0.2 → v1.0+ visual evolution where Pill graduated from pure-numeric badge to retired component is now fully closed. `v1.pillBg` / `pillBorder` / `pillInk` tokens may be orphaned in `lib/tokens.ts` (worth a future grep pass).
- **Same-content across mockup frames remains the right pattern.** All 12 frames in `caption-and-booth-label-v1.html` used "Treehouse Antiques" / "Booth 42" / `$48` / "Vintage brass scale" as the consistent mock content. Made the typographic + structural shifts the visual story rather than confusing per-frame content variation. Re-confirms session 68's mockup convention.
- **Implementation-vs-design-record drift on price color token.** The design record specified `v1.inkMid` for prices in the unified card treatment; implementation kept `v1.priceInk` (the established semantic token across all existing surfaces) since switching would have introduced quiet color-token churn beyond the typography unification intent. Minor visual difference; worth either updating the design record to reflect actual implementation or doing a separate per-token-color review pass. The pattern: when a design record specifies a non-established token, weigh the unification intent against the established-token semantic before flipping.

**Operational follow-ups:** Archive-drift accounting now includes session 68 (rotated off the visible tombstone list). No new entries beyond the carry list.

**Tech Rule candidates:** No new candidates promoted. One pattern emerging:
- **"When wrapping one part of a parallel structure in a card, decide for the whole structure or none of it"** — single firing this session (cartographic block: vendor block carded, mall block plain). Tech Rule on second firing.

Both prior session-68 candidates (state controls > page-title chrome; filter as intent → empty-state needs inline clear-filter link) carry forward unchanged.

**Notable artifacts shipped this session:**
- [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md) — design record with 12 frozen decisions, file-level scope, surface × treatment matrix, 8 acceptance criteria. Future "extend caption treatment to a sixth surface" or "extend Option B to a fourth booth-label surface" requests pull from this without re-scoping.
- [`docs/mockups/caption-and-booth-label-v1.html`](docs/mockups/caption-and-booth-label-v1.html) — 12 phone frames across 2 sections; same mock content across frames; before/after pairs for Find Map + booth-detail tiles + Booths grid + BoothHero post-it + Find Detail cartographic block.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–69 still missing — operational backlog growing).

- **Session 69** (2026-04-26) — Caption consistency + booth label unification + flag terminology sweep shipped end-to-end. Three runtime/docs commits + close (`935c065` terminology / `ab0a641` design-to-Ready / `3f1b4e5` implementation). 12 frozen decisions (D1–D12) at [`docs/caption-and-booth-label-design.md`](docs/caption-and-booth-label-design.md). Five tile-caption surfaces unified to Booths VendorCard treatment (warm `inkWash` card + IM Fell 14px regular non-italic title + sans 12px price + 9/10/11 padding). Booth label Option B (small-caps `BOOTH NN` eyebrow above vendor name) shipped on Booths grid + Find Detail; BoothHero post-it eyebrow collapsed two-line "Booth / Location" → single-line "Booth". User-visible "Save"/"Saved" UI strings flipped to "Flag"/"Flagged" terminology (5 hits across 4 files); internal naming intentionally unchanged. Pill component deleted from `/find/[id]`. Home feed timestamp italicized. Same-session design-record commit rule 4th firing.
- **Session 68** (2026-04-26) — Cross-tab mall filter persistence shipped end-to-end on prod across Home / Booths / Find Map. Three runtime/docs commits + close (`991ac5f` design-to-Ready / `0af526b` implementation / `7357b9f` iPhone-QA polish). 10 frozen decisions (D1–D10) at [`docs/mall-filter-persistence-design.md`](docs/mall-filter-persistence-design.md). New [`components/MallScopeHeader.tsx`](components/MallScopeHeader.tsx) primitive (eyebrow + tappable bold name + chevron + optional geo line) + [`lib/useSavedMallId.ts`](lib/useSavedMallId.ts) hook (mount-time read; App Router unmount/remount IS the cross-tab sync) + `<MallSheet>` `countUnit` prop. Shared localStorage key `treehouse_saved_mall_id` (zero migration). iPhone QA verdict: "Such a huge improvement on the experience." Same-session design-record commit rule firing for the THIRD time = fully durable institutional practice (origin 56 → 67 → 68). New `feedback_state_controls_above_hero_chrome.md` memory.
- **Session 67** (2026-04-26) — Booths page (`/shelves`) opened to all users + booth-bookmark feature shipped end-to-end. Three runtime/docs commits + close (`dccc34c` design-to-Ready / `fe6c33f` runtime / `47fb1b4` font + subtitle polish). Twelve frozen decisions at [`docs/booths-public-design.md`](docs/booths-public-design.md). New [`components/BookmarkBoothBubble.tsx`](components/BookmarkBoothBubble.tsx) primitive (Lucide `Bookmark`, 28px tile / 38px masthead variants), new booth-bookmark helpers in [`lib/utils.ts`](lib/utils.ts) parallel to find-save flag pattern with disjoint localStorage prefix. Verbal split established: "flag a find / bookmark a booth." Same-session design-record commit rule firing for the SECOND time confirmed it as a real pattern, not a one-off (third firing this session = fully durable).
- **Session 66** (2026-04-26) — Two-track session, both shipped end-to-end on prod. Track 1: first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (`0a4d763`) + polished Word doc export to Desktop via the docx skill. Track 2: Treehouse Lens ported from reseller-layer canvas op to ecosystem CSS render-time filter at [`lib/treehouseLens.ts`](lib/treehouseLens.ts) (`2367676`) — 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox, Find Map, Booth tiles, /post/preview). Mall page intentionally skipped (v0.2 dark theme conflicts with brightening lens). Sold treatments compose on top via `${LENS} grayscale(...)`. iPhone walk approved with caveat lens may need tuning against real content.
- **Session 65** (2026-04-26) — R12 Sentry exception capture shipped end-to-end on prod. Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb). Client-side + server-side error capture live, source maps + PII scrubbing on, email alerts firing. Vercel-Sentry Marketplace integration auto-syncs 8 env vars. New `feedback_verify_third_party_software_exists.md` memory.

---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 70 close — three layout/visual records shipped end-to-end + iPhone QA round-2 polish + Variant B booth lockup; six runtime commits on prod; feed content seeding still pending — now 13× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session (six runtime commits, largest in recent memory):** Records 1–3 designed and shipped + iPhone QA round-2 polish + a fourth Variant B booth-lockup design pass triggered mid-session. (1) **`/flagged` cartographic spine fully retired** — XGlyph at each stop, hairline tick, closer "circle + tagline" footer all deleted. Replaced with flat sectioned-list grouped by booth; each section has a tappable inkWash card header carrying small-caps `BOOTH NN` eyebrow + IM Fell vendor name (Option B from session 69). Mall name surfaces as small subtitle in card header ONLY when MallScopeHeader scope = "All malls" (D5). Known limitation flagged: all-malls subtitle is a weak separator when scanning quickly — captured as future-iteration carry. (2) **`/find/[id]` mall block lifted to parallel inkWash card** matching session-69 booth card; resolves session-69 visual asymmetry. Cartographic spine (PinGlyph + hairline tick + XGlyph) preserved. Find-photo post-it eyebrow collapses two-line "Booth\nLocation" → single-line "Booth" (mirrors session-69 BoothHero treatment). (3) **Masthead locked** — `StickyMasthead` rewritten with `left` / `wordmark` / `right` slot API; component now owns the inner `1fr auto 1fr` grid + safe-area padding + `min-width: 80px` on both side slots. Wordmark X-coordinate locked across all 7 page callsites. **D17 booth-page scroll flatten** — `/my-shelf` + `/shelf/[slug]` dropped their inner `overflow-auto` containers; both pages now scroll against document scroll like every other page. **D18 `/post/preview` unification** — custom sticky div retired; "Review your find" title moved from inside masthead chrome to content block below. (4) **Round-2 polish from David's iPhone QA**: Home logo retired (left slot empty), wordmark `translateY(-1px)` correcting IM Fell italic ascender bias, address geoLine surfaced on Booths + Find Map (parallel to Home), count merged into eyebrow with third italic line retired ("4 flagged finds at [Mall]" / "47 booths at [Mall]"). (5) **Variant B booth lockup** shipped across three surfaces — vendor name LEFT, "Booth" small-caps + IM Fell numeral RIGHT (Booths grid 14/20px sized to tile, Find Map + Find Detail 18/26px, Find Detail also gains inline visit-link below vendor name per Treatment C). `lib/tokens.ts` cleaned: `v1.pillBg` / `v1.pillBorder` / `v1.pillInk` deleted as orphans after the last call site retired. ZERO new memories — `feedback_ask_which_state_first.md` 7th firing + same-session-design-record-commit rule 5th firing both reinforced existing memory rather than minted new. **Gate to V1:** feed content seeding + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). Polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-identity + masthead-lock + booth-lockup all closed. R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, **70**. **Top priority** — the actual V1 unblocker, now **13× bumped**. Session 70 was the largest layout-redesign session in recent memory (six runtime commits across three design records + an iPhone-QA-driven fourth pass). All three primary tabs (Home / Booths / Find Map) now carry consistent chrome: locked masthead + MallScopeHeader with address + count-in-eyebrow. The `/find/[id]` cartographic block now reads as two parallel cards anchored by the spine, no longer asymmetric. The Booths grid + Find Map sections + Find Detail booth card all carry the new Variant B vendor + booth lockup. **Thirteen sessions of polish + observability + brand + navigation + persistence + terminology + caption-typography + cartographic-redesign + masthead-lock + booth-lockup**; zero new reasons not to seed content. **NEW judgment moments to fold into the seeding walk:** (a) does the Variant B lockup hold on the Booths grid (14/20px) against real vendor avatars + content, (b) does the new sectioned-list `/flagged` design feel grounded with multiple real booths, (c) does the masthead wordmark hold position rock-solid across all primary tabs (Home → Booths → Find Map → My Booth), (d) booth-page scroll flatten — anything off about BoothHero parallax or mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`, (e) `/post/preview` title-below-masthead — does the page lose its "reviewing" identity or does the cleaner masthead help, (f) does IM Fell 14px on booth-detail tiles read against real photos (session-69 D4b reversal), (g) is the all-malls scope mall-subtitle weak separator concrete enough to fix vs accept as known limitation (David said "okay for now" — gather evidence on the seeding walk).

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed. **NEW after session 70:** confirm `/post/preview` title-below-masthead reads right; if "reviewing" identity feels lost, restore stacked title in masthead.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with italic timestamps + lens, find-detail with lightbox + lens + new parallel mall+booth cards + Variant B lockup + inline visit-link, my-shelf, public shelf with new IM Fell tile captions + flattened-scroll behavior, editorial vendor CTA at feed bottom, **Booths page with new Variant B lockup + bookmark bubble + filter chips**, booth detail with single-line "Booth" post-it + new tile captions + masthead bookmark, **AND the new sectioned-list /flagged with Variant B card headers + count-in-eyebrow + address geoLine**, **AND the cross-tab mall picker with new "[N] flagged finds at" eyebrow on Find Map**). Watch Sentry dashboard during the walk. **Masthead lock check:** wordmark X-position should hold rock-solid across primary tabs. **Booth-page scroll flatten check:** any regressions in BoothHero parallax, mall picker sheet anchoring, scroll-to-top behaviors? **Lens calibration check:** judge against real photos. **Variant B lockup check:** real vendors + real booth numbers stress-test the per-surface numeral scaling.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **`/mall/[slug]` v1.x ecosystem migration** — session 66 deviation, now compounded by sessions 68 + 69 + 70. The mall-profile grid is still on v0.2 dark theme. With session 68 establishing `<MallScopeHeader>`, session 69 establishing the unified caption treatment, AND session 70 establishing the locked masthead + Variant B lockup + parallel mall-card pattern on `/find/[id]`, the mall-profile page (which IS a mall) is the natural carry-through surface for ALL of these. Size M-L (~1–2 sessions); needs design scoping first per `mockup-first` rule.
2. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing. Sentry traces + Seer Autofix panel are now first-look diagnostics before manual log-grepping.
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured session 64 in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012. Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 71 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Session 70 was a six-commit layout-redesign sweep: (1) /flagged cartographic spine retired, replaced with flat sectioned-list grouped by booth (each section header is an inkWash card with Variant B lockup); (2) /find/[id] mall block lifted to parallel inkWash card matching the booth card (resolves session-69 visual asymmetry); spine + post-it preserved with eyebrow collapsed to single-line "Booth"; (3) StickyMasthead rewritten with locked-grid slot API (1fr auto 1fr, both side slots min-width 80px, wordmark X locked across 7 callsites); booth-page scroll flattened (D17) — /my-shelf + /shelf/[slug] now scroll against document scroll like every other page; /post/preview unified to StickyMasthead with title moved to content block below; (4) round-2 iPhone QA polish — Home logo retired, wordmark translateY(-1px) for IM Fell ascender bias, address geoLine on Booths + Find Map (parallel to Home), count merged into eyebrow ("[N] flagged finds at [Mall]"), third italic count line retired; (5) Variant B booth lockup shipped across three surfaces — vendor LEFT + "Booth" small-caps eyebrow + IM Fell numeral RIGHT (Find Detail also gains inline "Visit the booth →" below vendor name per Treatment C). Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces — keep the Sentry dashboard open during the walk. JUDGMENT MOMENTS: (a) Variant B lockup at 14/20px on Booths grid against real vendor content; (b) sectioned-list /flagged design with multiple real booths; (c) masthead wordmark X-position rock-solid across all primary tabs; (d) booth-page scroll flatten regression check (BoothHero parallax, mall picker sheet, scroll-to-top); (e) /post/preview title-below-masthead — does "reviewing" identity hold or feel lost; (f) IM Fell 14px tile-title against real photos (session-69 D4b reversal); (g) all-malls scope mall-subtitle weak-separator — gather concrete evidence vs accept as known limitation. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked. Tag-extraction + booth-bookmark + mall-filter analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration (now compounded by being the natural carry-through for MallScopeHeader + caption-treatment + locked-masthead + Variant B lockup + parallel mall-card pattern). Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. R3 is investigable via Sentry breadcrumbs + distributed traces (session 65) — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–69. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–69. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 + 65 + 66 + 67 + 68 + 69 each strengthen the case — feed render is polished (italic timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency, new cartographic card, IM Fell rail captions), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead), every error during the seeding walk surfaces in Sentry instead of disappearing, every photo renders through the Treehouse Lens for unified brand treatment, shoppers can navigate booths cross-mall + bookmark them for return, the mall picked on any one tab follows the user across all three primary tabs, terminology is consistent ("flag a find / bookmark a booth"), AND tile captions read in one unified voice across discovery surfaces. Session 64 was a pivot pass with no net change. Sessions 66 + 69 added calibration imperatives — the lens constant + the IM Fell tile captions both need real-world-photo judgment. Sessions 67 + 68 + 69 closed the cross-mall navigation + cross-tab anchoring + terminology + caption-typography gaps. Seeded content will showcase a genuinely better experience end-to-end.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md` — could become TR-q on second firing), session 65 (`feedback_verify_third_party_software_exists.md` — could become TR-r on second firing + "platform-managed env > manual paste" candidate), session 68 (`feedback_state_controls_above_hero_chrome.md` — could become TR-s on second firing), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it" — could become TR-t on second firing; **note this rule was load-bearing for Record 2 in session 70 — David's iPhone QA on the parallel-mall-card resolution effectively confirmed the principle, edging it toward second-firing**). **Session 70 surfaced two new candidates:** (a) "Sequence implementation commits smallest → largest in multi-record sessions for clean rollback boundaries" — single firing this session; could become TR-u on second firing. (b) "When centering text against icons in a flex/grid row, lift the text 1px to compensate for italic ascender bias" — single firing this session (the masthead wordmark `translateY(-1px)` fix); could become TR-v on second firing. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
- **Booth-bookmark analytics events** (session 67) — `booth_bookmarked` / `booth_unbookmarked` deliberately deferred. Same defer-until-R3-resolves rationale as the tag-extraction events. Worth adding when R3 resolves so we can measure adoption of the new feature in production. Hot path: `handleToggleBookmark` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + `handleToggleBoothBookmark` in [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx).
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — production admin tiles already render Pencil + Trash bubbles in the top-right, and adding a fourth bubble overflows the corner. Admin can still bookmark via the `/shelf/[slug]` masthead like everyone else. Documented in commit `fe6c33f` summary + the design record. Reconsider only if admins explicitly want booth bookmarks on the management surface (unlikely; admin uses public booth detail like everyone else for personal bookmarks).
- **Mall-filter analytics events on Booths + Find Map** (NEW session 68) — Home fires `filter_applied` on mall pick (existing); Booths + Find Map don't yet. Worth adding when R3 resolves so we can compare per-tab pick rates (does the filter get used more on Home or on Booths? does Find Map's "filter narrows saves" pattern see real adoption?). Hot path: `handleMallSelect` in [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx). Also rolls up the prior `filter_applied` count = 0 carry note — when this lands, verify the count is actually being captured across all three callsites.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70** via Record 2 (`d6b5a75`). Mall block now in parallel inkWash card matching the booth card.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — was sized for two-line "Booth / Location" eyebrow; now eyebrow is single-line "Booth" per session-69 D10. Post-it may look slightly tall against the collapsed eyebrow. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos in the mockup; real vendor content during the seeding walk is the actual judgment moment. Per-callsite revert if cramped without disturbing the Booths anchor. Hot path: `WindowTile` + `ShelfTile` in [`components/BoothPage.tsx`](components/BoothPage.tsx) + `ShelfCard` in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx).
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid` (#4a3520) for prices in unified card treatment; implementation kept `v1.priceInk` (#6a4a30) since that's the established semantic token across the existing surfaces. Skip unless flagged.
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70** via Record 1 (`198560f`). Tokens removed from `lib/tokens.ts` after the last call site (BoothPill on `/flagged`) was retired.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (NEW session 70) — David's iPhone QA: booths from different malls read as one sequence without close attention to the filter eyebrow. Captured in Record 1 design record as known-limitation + future-iteration carry-forward. Likely fix when revisited: mall-grouped section breaks with small all-caps mall eyebrow before the booth list resumes.
- **Booth-page scroll flatten (D17) regression watch** (NEW session 70) — highest-risk decision in Record 3. Watch on iPhone QA: BoothHero parallax behaviors, mall picker sheet anchoring on `/my-shelf` + `/shelf/[slug]`, any "scroll to top" behaviors that previously observed the inner scroll container directly. Cheap fix if anything regresses: revert the flatten on a per-page basis with a `scrollContainerRef` reintroduction.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (NEW session 70) — title + subhead moved from inside sticky chrome to content block below per D18. Page may lose the "reviewing" feel against vendors stepping through Add Find. If David flags it: (a) restore stacked title inside masthead (custom sticky again), (b) bring title into a sticky band BELOW masthead, (c) keep as-is.
- **Booths grid lockup numeral size deviates from spec** (NEW session 70) — design record specified 26px IM Fell numeral; Booths grid implements at 20px to preserve existing 14px vendor name + bio + photo proportions on a ~170px-wide tile. Design-record L3 amended to capture this. If real photos surface a problem, can either bump Booths grid to 18/26 (changes tile heights) OR scale other surfaces down (weakens the right-side numeral anchor).
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–69 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54-55 + future), R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK installed via wizard + tightened, Vercel-Sentry Marketplace integration active, source-map upload from Vercel build, PII scrubbing on, email alerts firing, smoke-tested both client + server capture on prod (frontend + wrapped API route). Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848. Carries an unwrapped-`/api/*`-routes follow-up gap (above) and Q-013 candidate.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations (`5c21b90` → `efbf222` → `1abcba2` → `d9279e9`); v4 on-device QA walk **PASSED 4/4 clients session 53** (Gmail web, iOS Gmail, iOS Mail, Apple Mail). Loop fully closed. Final state (v4): shell masthead retired, opener line flowing into IM Fell 34px vendor name, banner + 2-cell info bar as one unified rounded frame, full-width "Explore the booth" green button directly under info bar, naked tile grid, footer. Subject + preheader + opener share the phrase "A personal invite to explore {vendor}". Word "Window" retired from user-facing copy.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57 (`Masthead` center reverted to brand lockup; `<BoothTitleBlock>` gained optional `onPickerOpen` that wraps the 32px booth name in a tap target with inline `▾` when `showPicker`; mockup Frames 2 + 3 revised in same commit).

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions. (**Session 49 note:** `/shelves` chrome mismatch is now resolved — v1.2 migration shipped. `/admin` remains on v0.2.)
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49 change); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Not a bug (browser default-gesture override in standalone PWA mode) — Sprint 5 polish, needs a `pulltorefreshjs`-class library or custom gesture handler tied to scroll position. Workaround is navigate-away-and-back.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan added in same session. Items absorbed from this list: "Claim this booth" → R1; "ToS/privacy" → R6; "native app eval" → R9; "vendor directory" → R10; `/welcome` guest landing → R8; "feed pagination + search" → partial overlap with R5a; **"Universal Links (gating Q-006)" → R15**. Also absorbed from pre-beta polish list: Error monitoring → R12; Beta feedback mechanism → R7.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need — `/shelves` now covers the 80% case), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

**Session 45 note on Direction A:** the BoothHero URL link-share bubble that was retired this session was essentially Direction A. If/when a URL-share capability is reintroduced (e.g. native share sheet with OG preview), it should land as a deliberate Design pass, not a quiet restoration of the retired bubble. The masthead airplane is the sole share affordance on Booth pages; a future URL-share primitive is a separate glyph/location decision.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` — design-history reference for Q-011 arc.
- `docs/mockups/share-booth-email-v2.html` — design-history reference (session 51 Variant B; superseded twice in session 52).
- `docs/mockups/share-booth-email-v3.html` — design-history reference (session 52 info bar pivot; superseded by v4).
- `docs/mockups/share-booth-email-v4.html` — design-history reference (session 52 v4 simplification; QA PASSED 4/4 clients session 53). Q-011 arc closed.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002). Keep as design-history reference for multi-booth.
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — now carries v2 + v3 + v4 addendums stacked. Post-QA (passed session 53), candidate for consolidation (the three addendums are easier to read merged than stacked). ~15 min docs-only pass.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot `pg_dump` pipeline artifact, gitignored, safe to delete anytime; contains prod + staging DB URIs with passwords).
- Orphaned `dbutler80020@gmail.com` staging auth user (created by the first seed-staging run before David chose `david@zenforged.com` as staging admin; non-admin, non-blocking; leave or clean up manually via Supabase dashboard).

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep (full breakdown in `docs/session-archive.md` once backfilled). **Session 70 was the largest layout-redesign sweep in recent memory — six runtime/docs commits on prod by close**, addressing the two David-flagged refinements (Finds map redesign + cartographic reconsideration; masthead lock across pages) that compounded into four design records: (1) `docs/finds-map-redesign-design.md` — `/flagged` cartographic spine retired in favor of flat sectioned-list with inkWash card headers; (2) `docs/find-detail-cartographic-refinement-design.md` — mall block lifted to parallel inkWash card matching the booth card on `/find/[id]`, post-it eyebrow collapsed; (3) `docs/masthead-lock-design.md` — `StickyMasthead` rewritten with locked-grid slot API; booth pages flattened off internal scroll; `/post/preview` unified; (4) `docs/booth-lockup-revision-design.md` — Variant B vendor + booth lockup shipped across three surfaces (added mid-session after iPhone QA flagged the Option B treatment from session 69 still wasn't landing). Six commits: `3432338` design-to-Ready (3 records together) / `d6b5a75` find-detail mall card + post-it / `198560f` finds-map cartographic retirement / `cc322e9` masthead lock + scroll flatten / `48aa93a` round-2 polish (logo retired, wordmark 1px lift, address geoLine on Booths + Find Map, count-in-eyebrow) / `ce5eb0c` Variant B booth lockup. **Same-session design-record commit rule firing for the FIFTH time = beyond institutional, beyond fully durable, fully default** (origin 56 → 67 → 68 → 69 → 70). **`feedback_ask_which_state_first.md` firing for the SEVENTH time = also beyond noting individually.** Two new Tech Rule candidates surfaced (smallest→largest commit sequencing for rollback boundaries; italic-ascender 1px lift). One session-69 carry note resolved (`/find/[id]` cartographic asymmetry); one session-69 orphan-token cleanup landed (`v1.pillBg` / `pillBorder` / `pillInk` deleted). New session-70 carry items: all-malls scope mall-subtitle weak-separator (David: "okay for now but flag it"), booth-page scroll flatten regression watch, `/post/preview` title-below-masthead pending iPhone QA, Booths grid lockup numeral size deviation from spec. Feed content seeding still pending, now **13× bumped** — every primary tab now carries consistent locked-masthead + MallScopeHeader-with-address + count-in-eyebrow chrome, the cartographic identity preserved where it earns its place (`/find/[id]`) and retired where it didn't (`/flagged`), and Variant B vendor + booth lockup shipped across all three surfaces. Next natural investor-update trigger point remains after feed content seeding lands — the update would now report R4c + R3 + tag-capture + R12 + the lens port + Booths public + booth bookmarks + cross-tab mall filter + terminology consistency + caption unification + cartographic redesign + masthead lock + Variant B booth lockup as eleven shipped capability items.
