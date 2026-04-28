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

## ✅ Session 82 (2026-04-28) — Massive design-system consolidation: project-wide IM Fell → Lora replacement + form-label primitive sweep + BoothLockupCard extraction (10 runtime commits + V1/V2 typography mockups + multi-cycle iPhone QA via Vercel previews in-session)

The largest design-system change since the v1.x layer was named. Two arcs that compounded each other across **10 runtime commits** + V1/V2 typography mockups + 4 distinct iPhone QA cycles in-session. **Arc 1 (commits 1–8): typography overhaul** — started as a 3-item /vendor-request redirect bundle (booth # optional, Mall→Location, design pass), then escalated when David named IM Fell as failing app-wide. V1 mockup explored 3 label primitives within IM Fell; David picked Option C structural treatment but explicitly rejected IM Fell. V2 spanned 3 candidate replacement serifs (Lora / Newsreader / Georgia × stress-test strips on the surfaces IM Fell currently lived on). David picked Lora. Result: project-wide `FONT_IM_FELL → FONT_LORA` sweep across 29 files + IM Fell completely retired from the codebase + Option C label primitive (15px / 13px Lora upright ink-mid) swept across 5 form surfaces. **Arc 2 (commits 9–12): booth lockup unification** — David's iPhone QA after Arc 1 surfaced 4 issues with the booth lockup primitive across surfaces (inconsistent bg/border/numeral-size + empty-state row heights + bookmark filter count bug). Extracted shared `<BoothLockupCard>` component matching /find/[id] cartographic card as canonical. Applied to /shelves + /flagged (added booth bookmark to /flagged). Final descender clip fix bumped lineHeight 1.25→1.4 across the primitive AND find-page inline. ONE new memory captured.

**Beat 1 — Standup → David surfaces 3-item redirect bundle.** Recommended feed content seeding (24× bumped). David surfaced he had ALREADY completed seeding pre-session (15 posts across 2 mall locations and 3 vendors). The seeding pass surfaced 3 items: (1) some locations don't have designated booth numbers — booth # should be optional; (2) /vendor-request still says "Mall" not "Location" (missed in session 81's 13-file scrub); (3) /vendor-request needs a design pass — labels too small with too much spacing, photo dropzone feels disjointed, removed messaging missed. Sub-item 3a carried the system-level signal: *"We continue to run into this issue"* about typography readability.

**Beat 2 — Items 1+2 quick fixes (smallest→largest, 6th clean firing of the rule).** Booth # optional (`2af064d`) — client-side red-asterisk → `(optional)` badge + drop client validation + drop server-side `!booth_number?.trim()` validation in `/api/vendor-request/route.ts`. Server-side dedup query already handled null booth via `.is("booth_number", null)`, so no DB changes. Mall → Location on /vendor-request (`e924664`) — single label swap + validation error string. Both pushed for iPhone QA while V1 mockup was being built.

**Beat 3 — V1 typography mockup ([`vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html)).** Three frames spanning structural axes per `feedback_mockup_options_span_structural_axes.md` (now 3rd firing — promotion-ready): A (sans small-caps eyebrow 10px), B (sans sentence case 13px), C (IM Fell upright 15px). Each frame carried the "permission/value" intro paragraph and matched the photo dropzone copy + ack-card copy to the chosen label family. Two scoping questions in the bottom pane.

**Beat 4 — David picks: project-wide scope, permission/value intro, leans Option C BUT NOT IM Fell.** The load-bearing moment of the session. David: *"I think the best way I can say it is that IM Fell is failing us on this app. Every time I see it I feel like it's just hard to read. I like the character but there has to be a different font that reads better on a screen. I lean towards C but not with IM Fell."* Per `feedback_recurring_phrase_signals_system.md` (NEW memory captured this session), the recurring-issue phrasing escalated scope from "/vendor-request label fix" to "system-wide font replacement." Surfaced 3 candidate replacement serifs to mockup.

**Beat 5 — V2 typography mockup ([`vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html)).** Three frames: Lora (modern editorial, strong italic, Google Fonts), Newsreader (editorial w/ optical sizes), Georgia (web-safe, screen-optimized). Each phone showed full /vendor-request rendered with the candidate font. Below the phones, three **stress-test strips** showed each font on the OTHER surfaces IM Fell currently lived on (page header at 26px, find-tile caption at 14.5px italic — David's named readability sore — post-it lockup at 18px italic + 26px TNR numeral). New title + intro copy locked across all frames: *"Set up your digital booth"* / *"A simple, shareable window into your physical space — waiting to be found in person."* Plus a reference strip showing IM Fell at the same sizes for comparison.

**Beat 6 — David picks: Lora, 22px/400 (no bump to 24/500), italic ack-card copy stays.**

**Beat 7 — Project-wide font sweep + /vendor-request page changes + form label primitive sweep (4 commits, smallest→largest).**

| Commit | Scope |
|---|---|
| `08bf5c4` | Lora infra. `next/font/google` import + `const lora = Lora({weight:[400,500,600],style:[normal,italic]})` + `--font-lora` CSS variable + `FONT_LORA` token in `lib/tokens.ts`. NO consumer changes — IM Fell still works. |
| `b444c5e` | Project-wide `FONT_IM_FELL → FONT_LORA` sed sweep across 29 consumer files + delete `FONT_IM_FELL` export from tokens + delete `imFell` entry from fonts object + delete `IM_Fell_English` next/font/google import + delete `imFell.variable` from html className. Atomic. **IM Fell completely retired from the codebase** (inline comments still reference it historically — documentation rot, not functional). |
| `6d26df6` | /vendor-request page: title "Request your" → "Set up your digital booth" + permission/value intro paragraph reinstated (Lora italic 15.5px ink-mid) + Option C label primitive (Lora upright 15px ink-mid) + photo dropzone primary `FONT_SYS 14px 600` → `FONT_LORA 16px 500` + dropzone helper `FONT_SYS 12px ink-mid` → `FONT_LORA italic 13px ink-muted` + ack-card copy `FONT_SYS 12.5px ink-mid` → `FONT_LORA italic 13.5px ink-muted`. Photo dropzone bolt-on smell resolved — copy now joins the page family. |
| `e446c11` | Option C label primitive sweep across **5 form surfaces**: BoothFormFields (covers AddBoothSheet + EditBoothSheet) + AddBoothInline (admin) + admin/login PIN + post/preview Field component. Per-context sizing: 15px on full pages (where input is 16px), 13px on sheets (where input is 14px). Italic→upright + ink-muted→ink-mid is the structural change everywhere; size scales with input. |

iPhone QA cycle 1 — David: *"Looks really good."*

**Beat 8 — David's iPhone QA bundle on booth lockup + a system observation.** Surfaced 4 issues:
1. /shelves rows without booth # are SHORTER + text gets cut off.
2. D19 vs I17 appear different sizes (perceptual).
3. Bookmark count "5" shows even when filtered to 4 booths (math doesn't math based on filtered scope).
4. Booth lockup card looks different across /shelves vs /find/[id] vs /flagged — *"This is what I'm talking about with consistency, we have the same Booth Component but they all look a bit different. If I had to pick a look, which I must, I would pick the one without the dotted lines on the find page and keep that consistent."*

The system observation in #4 was the **second firing of the recurring-issue phrasing in the same session** — this time about visual primitive drift across surfaces.

**Beat 9 — Scoping confirmation (3 questions before extracting primitive).**
- **Q1 — Empty-booth-number rendering**: David picked (c) hide BOOTH eyebrow entirely, name claims full row width, row keeps full height via `min-height`.
- **Q2 — /shelf/[slug] BoothHero post-it**: stays as-is (different visual primitive on purpose — post-it = "this is the booth you're looking at" / card = "this is a booth you might go look at").
- **Bonus — /find/[id] cartographic card booth bookmark**: NO. David: *"Adding the bookmark a booth on that component isn't necessary as it's really just a confirmation to the customer of where the booth is."* Plus David added: *"Other than that they should all carry the same visual identity though with the background color, font color, font type, font weight, font size, and icon sizes just for added clarity."*

**Beat 10 — BoothLockupCard primitive extraction + sweep (3 commits, smallest→largest).**

| Commit | Scope |
|---|---|
| `dfed189` | Bookmark filter count fix on /shelves chip. `bookmarkedIds.size` (global localStorage set) → `bookmarkedInScopeCount` (already computed at line 523, just wasn't used at chip render site). One-line fix. |
| `f187165` | Created [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) shared primitive. Visual: `bg: v1.postit`, 1px hairline border, 10px radius, 12/14 padding, no shadow, FONT_LORA 18px vendor name, optional location subtitle (FONT_SYS 11.5px ink-muted with optional dotted-underline mapLink), BOOTH eyebrow + 26px TNR numeral lockup. Bookmark slot + admin chrome slot are optional (collapse cleanly when omitted). `min-height: 60` keeps row height uniform regardless of booth-number presence. Applied to /shelves rows: replaced inline dashed sub-card + paperCream wash bg + 22px numeral with the new primitive. |
| `bf8ac24` | Applied to /flagged section header. Added booth bookmark wiring (mirrors /shelves: `boothBookmarkKey` from `lib/utils` + R3 v1.1 `booth_bookmarked` / `booth_unbookmarked` events). Added `vendorId` to `BoothGroup` type + grouping. State synced on mount + focus event. |

iPhone QA cycle 2 — David surfaces one final issue.

**Beat 11 — Final descender clip fix (`a045058`).** David: *"The ligatures are still being cutoff at the bottom of the card component."* (Looking at "Bennett & Hall Designs" — 'g' descender clipped.) Cause: `lineHeight: 1.25` on 18px Lora yields a 22.5px line-box; Lora descenders extend ~5px below baseline → ~22-23px → barely clipped at the inner div's `overflow: hidden` boundary (required for `text-overflow: ellipsis`). Fix: lineHeight 1.25 → 1.4 (25.2px line-box, ~3px clearance). Applied to BoothLockupCard primitive AND /find/[id] inline (`app/find/[id]/page.tsx`) since /find/[id] has the same pattern and would have shown the bug whenever a vendor name with descenders rendered there — just hadn't been caught in QA because David's seed data lacked descender-heavy vendor names.

**Beat 12 — David: "looks good! phew" → /session-close.**

**Final state in production (as of `a045058`):**

- 10 runtime commits + V1 + V2 typography mockups + close. Working tree clean. Build green.
- **IM Fell completely retired from the codebase.** Lora is the project-wide literary serif via `next/font/google` + `FONT_LORA` token. Inline comments still reference IM Fell historically — documentation rot, not functional.
- **Form labels use Option C primitive** (Lora upright, 15px on /vendor-request + 13px on sheets, ink-mid). The italic-13-muted treatment that was the recurring readability sore is gone everywhere (5 form surfaces swept).
- **BoothLockupCard shared primitive** owns /shelves + /flagged. /find/[id] cartographic card stays inline (intentional per David — *"no change to this component card"*) but visually identical (same v1.postit bg, same numeral size, same vendor name treatment).
- **Vendor name lineHeight is 1.4** across all 3 surfaces — descenders clear cleanly.
- **Bookmark filter on /shelves** uses scoped count (4/4 not 4/5).
- **/flagged section header has bookmark icon** (booth bookmark, not find bookmark). Added boothBookmarkKey state + handler mirroring /shelves.
- **/vendor-request title** is "Set up your digital booth" + new permission/value intro paragraph + booth # optional + Mall → Location.
- **Feed content seeding completed pre-session** (15 posts / 2 locations / 3 vendors). Real-content QA loop now possible.

**Commits this session (10 runtime + 2 mockups + close):**

| Commit | Message |
|---|---|
| `e924664` | feat(copy): scrub remaining 'Mall' → 'Location' on /vendor-request form |
| `2af064d` | feat(vendor-request): make booth # optional |
| `7d2275f` | docs(mockup): /vendor-request typography v1 — 3 label options × permission/value intro |
| `f1c183e` | docs(mockup): /vendor-request typography v2 — Lora / Newsreader / Georgia × stress-test strips |
| `08bf5c4` | feat(typography): add Lora font + FONT_LORA token (infra only, no consumers) |
| `b444c5e` | feat(typography): sweep FONT_IM_FELL → FONT_LORA project-wide (29 consumers + tokens + layout) |
| `6d26df6` | feat(vendor-request): Option C typography pass + new title 'Set up your digital booth' + intro |
| `e446c11` | feat(forms): sweep Option C label primitive across BoothFormFields + AddBoothInline + admin/login + post/preview |
| `dfed189` | fix(shelves): bookmark filter count uses scoped count, not global |
| `f187165` | feat(booth-lockup): shared BoothLockupCard primitive + apply to /shelves |
| `bf8ac24` | feat(booth-lockup): apply BoothLockupCard to /flagged section header + add booth bookmark |
| `a045058` | fix(booth-lockup): vendor name lineHeight 1.25 → 1.4 for descender clearance |
| (session close) | docs: session 82 close — design-system consolidation (10 runtime + V1/V2 mockups) |

**What's broken / carried (delta from session 81):**

- 🟢 All 10 commits validated end-to-end via Vercel preview iPhone QA in-session — David: *"Looks really good!" + "looks good"* — no carry-forward QA gap.
- 🟢 Feed content seeding LANDED (pre-session). The 24× bumped item finally came off the queue.
- 🟡 IM Fell completely retired but inline COMMENTS across the codebase still reference it historically (~20 references in 15 files: "italic IM Fell vocabulary," "matches IM Fell italic," etc.). Documentation rot, not functional. Opportunistic cleanup over future sessions.
- 🟡 BoothLockupCard primitive owns /shelves + /flagged; /find/[id] cartographic card stays inline. If a future change to the lockup needs to land everywhere, find page must be updated separately. Acceptable trade — no abstractions beyond what task requires.
- 🟡 Form-label sweep skipped pages without explicit `<label>` tags (AddFindSheet, post/preview body, setup page). Those pages have section-header-style copy in italic Lora that may want similar Option C treatment if they fire as recurring readability concerns. Defer.
- 🟡 "All Kentucky Locations" title fit on narrow phones (carry from session 81) — untouched this session.
- 🟡 A3 dashed-fill-lift lockup card from session 81 is **retired** in favor of BoothLockupCard. Session 81's V1+V2 mockups documenting A3 are now historical reference; mockups stay in repo as audit trail.
- 🟡 Session 81 carry "v1.cartographicBg semantic token extraction" — would now also include BoothLockupCard surfaces. Stronger justification after session 82 but still single-firing in terms of the rule.
- 🟡 Session 79 /my-shelf back-nav scroll anchor (David's session 79 primary user ask) still untouched — re-attemptable in a focused future session WITHOUT morph changes.
- 🟡 Q-005 admin claimed-booth deletion gap still open.
- 🟡 Q-014 Metabase analytics still queued.
- 🟡 All session 78–81 carry-forwards still hold unless explicitly resolved above.

**Memory updates:** ONE new memory.

- [`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md) — when David uses *"we continue to run into this issue"* / *"every time I see X"* about a UI/UX concern, that's a SYSTEM-level signal not a per-screen issue. Surface system-scoping questions before drafting per-screen fixes. Pairs with `feedback_ask_which_state_first.md` on a parallel axis (multi-surface vs multi-state).

**Existing memories that load-bore the session:**

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 10 runtime commits ✅.
- `feedback_mockup_options_span_structural_axes.md` (sessions 80 + 81 + 82) — **3rd clean firing.** V1 typography mockup spanned 3 label primitives (structural axes); V2 spanned 3 candidate fonts (also structural axes within the picked Option C). **Strongly promotion-ready** as Tech Rule.
- `feedback_ask_which_state_first.md` — fired multiple times this session: scoping the booth-optional question, scoping the label sweep, scoping the empty-booth-number rendering, scoping the booth-lockup unification.
- `feedback_visual_reference_enumerate_candidates.md` (session 81) — kept disciplined this session by always confirming scope before mocking or sweeping.
- "Smallest→largest commit sequencing" — **6th clean firing.** Now structurally part of every David-redirect-bundle session. **Promotion-ready and overdue** as Tech Rule.
- "Mid-session iPhone QA on Vercel preview shortens redirect cycle" — **2nd clean firing.** David QA'd at 4 explicit checkpoints during this session (after items 1+2, after font sweep, after form label sweep, after booth lockup primitive). Each cycle compressed what would have been a 2–3 session arc into one. **Promotion-ready** on a 3rd firing.

**Live discoveries (single firings, Tech Rule candidates):**

- **"V2 mockup as fill-refinement within a picked option"** — **2nd clean firing.** Sessions 81 (V1 = 3 lockup containers / V2 = A3 fill variants within picked option A) + 82 (V1 = 3 label primitives / V2 = 3 fonts within picked Option C). Promotion-ready on a 3rd firing.
- **"User-facing copy scrub: skip DB/API/event/type identifiers unless explicitly asked"** — **2nd clean firing.** Sessions 81 + 82 (vendor-request scrub similarly preserved internal column references + admin notification line in api/route.ts). Promotion-ready.
- **"Bug surfaced in extracted primitive AND inline copy of same primitive — fix both in same commit"** — first firing (descender clip in BoothLockupCard + /find/[id] inline simultaneously). Single firing.
- **"Per-context sizing on a swept primitive"** — first firing (Option C label primitive at 15px on full pages, 13px on sheets — label sized relative to its input, not flat across surfaces). Single firing.
- **"Front-load structural escalation when user names a system-level concern"** — first firing as a memory (the new `feedback_recurring_phrase_signals_system.md`). Pattern fired twice in the same session (typography + booth lockup) so the memory is well-supported.

**Operational follow-ups:**
- **NEW: ~20 inline comments referencing "IM Fell" historically** across 15 files. Opportunistic cleanup over future sessions. Examples: "italic IM Fell vocabulary," "matches IM Fell italic," "Variant B IM Fell numeral," etc.
- **NEW: Form-label sweep skipped non-`<label>` form chrome** on AddFindSheet, post/preview body, setup page. Defer until those pages surface as recurring readability concerns (Option C is already exercised on adjacent pages).
- **NEW: BoothLockupCard primitive could extend to /shelf/[slug] BoothHero context** if David ever decides the post-it should match the card primitive. Currently intentionally NOT matched per session 82 Q2.
- **Promote Tech Rule batch (overdue)** — smallest→largest sequencing (6 firings), mockup-options-structural-axes (3 firings), mid-session-iPhone-QA (2 firings), V2-as-fill-refinement (2 firings), user-facing-copy-scrub-skip-internals (2 firings). All promotion-ready. ~30 min ops pass.
- All session 81 + 80 + 79 + 78 carry-forwards still hold unless explicitly resolved above.
- Existing operational backlog still holds: archive-drift backfill (sessions 54 + 55 + 57–81 missing tombstones), `marketplace-transitions-design.md` D11/D12 + "source side retired on /shelves" amendments, debug-toast cleanup, OTP template paste, verbose diag logs in `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant `showPlaceholders` prop infrastructure in BoothPage.tsx, tidy session 81's V1/V2 mockup files (now superseded by session 82 design-system pass).

**Notable artifacts shipped this session:**
- [`docs/mockups/vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html) — V1 mockup (3 label primitives × permission/value intro).
- [`docs/mockups/vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html) — V2 mockup (3 candidate replacement serifs × stress-test strips).
- [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) — NEW shared primitive.
- [`lib/tokens.ts`](lib/tokens.ts) — `FONT_IM_FELL` removed, `FONT_LORA` added.
- [`app/layout.tsx`](app/layout.tsx) — IM Fell font load removed, Lora added via `next/font/google`.
- [`app/vendor-request/page.tsx`](app/vendor-request/page.tsx) — title + intro + Option C label primitive + unified Lora dropzone/ack.
- [`app/shelves/page.tsx`](app/shelves/page.tsx) + [`app/flagged/page.tsx`](app/flagged/page.tsx) — booth lockup unified via BoothLockupCard.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — vendor name lineHeight bumped (descender fix only — visual treatment unchanged).
- [`components/BoothFormFields.tsx`](components/BoothFormFields.tsx), [`components/AddBoothInline.tsx`](components/AddBoothInline.tsx), [`app/admin/login/page.tsx`](app/admin/login/page.tsx), [`app/post/preview/page.tsx`](app/post/preview/page.tsx) — Option C form label primitive sweep.
- 25+ additional `.tsx` files touched in the `FONT_IM_FELL → FONT_LORA` sweep across `app/` + `components/` (visual change automatically propagated everywhere via the token swap).

---

## ✅ Session 81 (2026-04-28) — Demo-prep refinement bundle (9 runtime commits) + V1/V2 mockups + end-to-end iPhone QA (rotated to tombstone session 82 close)

> Full block rotated out at session 82 close. Net: 9 runtime commits — nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory: `feedback_visual_reference_enumerate_candidates.md`. Smallest→largest commit sequencing 5th clean firing — fully load-bearing. **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic). Session 81's "Mall → Location" copy scrub on /vendor-request was also fixed at session 82 close (the form was missed in the 13-file scrub).**

_(Session 81 detailed beat narrative removed at session 82 close — see the V1/V2 mockup files for load-bearing decisions.)_

---

## ✅ Session 80 (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net: 7 runtime commits — nav rename, "curated booth" eyebrow, wordmark TNR upright ink-black 18px, bookmark relocated to BoothHero photo corner, Booths Option C2 row pattern (photo retired, rows replace grid), MallScopeHeader entrance animation, /find/[id] vendor/mall gap tightened. Two design records committed: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md). Track D phase 5 source layoutId retired on /shelves alongside the photo (graceful-no-op morph carries forward). ONE new memory: `feedback_mockup_options_span_structural_axes.md`. Smallest→largest commit sequencing 4th clean firing. See tombstone below + the two design records for load-bearing decisions.

_(Session 80 detailed beat narrative removed at session 81 close — see the design records + tombstone below for load-bearing decisions.)_

- [`components/BottomNav.tsx`](components/BottomNav.tsx) — "Find Map" → "Flagged" (item 1).

---

## ⚠️ Session 79 (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (rotated to tombstone session 81 close)

> Full block rotated out at session 81 close. Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78 Track D pattern; cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store fought React batching + framer projection + Next.js Link timing; David elected full revert. ONE memory: `feedback_extend_existing_primitive_via_testbed.md`. `feedback_kill_bug_class_after_3_patches.md` 2nd firing. Phase 3 scroll-restore code preserved in git history (`71a0555` + `51067b7`) for re-attempt WITHOUT morph changes. See tombstone below for full lessons.

_(Session 79 detailed beat narrative removed at session 81 close — see tombstone below + the memory file for load-bearing decisions.)_
---

## ✅ Session 78 (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles (rotated to tombstone session 80 close)

> Full block rotated out at session 80 close. See tombstone below + the design records this session produced (`docs/marketplace-transitions-design.md`, the `feedback_preview_cache_for_shared_element_transitions.md` memory) for the load-bearing decisions. Session 80 retired the source-side `layoutId` for /shelves → /shelf/[slug] when the photo went away from /shelves; that surface is now a graceful-no-op rather than a shipped morph.

_(Session 78 detailed beat narrative removed at session 80 close — see `docs/marketplace-transitions-design.md` and the memory file for load-bearing decisions.)_

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–81 still missing — operational backlog growing). Session 76 fell off the bottom of last-5 visible tombstones at session 82 close.

- **Session 81** (2026-04-28) — Demo-prep refinement bundle (9 runtime commits + V1/V2 mockups, end-to-end iPhone QA via Vercel previews in-session). Items: nav stroke 2.0; photo-overlay bubble bg paper-warm 0.85 across 5 surfaces; A3 dashed-fill-lift booth lockup card across /shelves + /flagged; BoothHero + /find/[id] post-it eyebrows small-caps FONT_SYS; v1.postit warmer #fbf3df; /flagged vendor/mall gap matched to /find/[id]; "Mall" → "Location" copy scrub across 13 files (incl. picker "All Kentucky Locations"); cartographic "Find this item at" card bg matched to post-it. ONE new memory (`feedback_visual_reference_enumerate_candidates.md`). Smallest→largest commit sequencing 5th clean firing — fully load-bearing across the David-redirect-bundle workflow. Two test booths deleted from production via Supabase dashboard SQL (HITL). **NOTE: at session 82 close, the A3 dashed-fill-lift booth lockup card was retired in favor of the BoothLockupCard shared primitive (no dashed border, v1.postit bg, inline lockup matching /find/[id] cartographic).** Session 81's "Mall → Location" scrub on /vendor-request was also fixed at session 82 close (form was missed in the 13-file scrub).
- **Session 80** (2026-04-28) — David 5-item redirect bundle + 2 polish items shipped end-to-end (7 runtime commits). Items: nav rename Find Map → Flagged; "curated shelf" → "curated booth" eyebrow; wordmark TNR upright ink-black 18px on every screen; bookmark relocated from `/shelf/[slug]` masthead → BoothHero photo corner (verbal model: "flag a find / bookmark a booth, both on the corner of the entity you're saving"); Booths Option C2 row pattern (photo retired from `/shelves` directory; bookmark on far-left of row; `/shelves` becomes navigation-led not browse-led); MallScopeHeader entrance animation parity across primary tabs; `/find/[id]` vendor/mall gap tightened. Two design records committed in same session per the rule: [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7 + [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. ONE new memory (`feedback_mockup_options_span_structural_axes.md`). Smallest→largest commit sequencing 4th clean firing (now load-bearing). Track D phase 5 source layoutId retired on `/shelves` alongside the photo (graceful-no-op morph carries forward); two surfaces still live (feed → /find/[id], /flagged → /find/[id]). `BookmarkBoothBubble` gained "hero" size variant (36×36 frosted, 18px glyph). Three new single-firings: D8 admin chrome inline-icons, mockup-options-structural-axes, wordmark brand-mark-vs-body-copy audit pattern.
- **Session 79** (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert). Net-zero session — production state identical to session 78 close (`4bcefeb`); only artifact is the revert commit `a9dc1bd`. Attempted to extend session 78's Track D shared-element pattern to /find/[id] More-from-shelf strip + BoothPage WindowTile/ShelfTile + add scroll-restore on /flagged + /my-shelf + /shelf/[slug]. Cross-page `layoutId` namespace collisions surfaced; conditional layoutId via reactive store (`useSyncExternalStore`) + `flushSync` + rAF defer fought React batching + framer projection + Next.js Link timing through 4 iPhone-QA cycles. David elected Option A: full revert. ONE new memory (`feedback_extend_existing_primitive_via_testbed.md`). Lessons: framer-motion `layoutId` is a global namespace; conditional layoutId via reactive store may not be reliably solvable without on-device debugging; testbed should be used for surface-extension work, not just initial primitive validation. Phase 3 scroll-restore code preserved in git history (commits `71a0555` + `51067b7`) for re-attempt in a future focused session WITHOUT morph changes. `feedback_kill_bug_class_after_3_patches.md` second firing — should have fired at R4 instead of R5.
- **Session 78** (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles. 11 runtime commits + close. FB Marketplace shared-element transition is now live across three production surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Critical fix `c3b9541` introduced the **preview-cache pattern**: source surfaces write `image_url` to sessionStorage on tap so destination renders motion node synchronously before async data fetches resolve; module-scope cache (`cachedFeedPosts`) handles the back direction. ONE new memory (`feedback_preview_cache_for_shared_element_transitions.md`). Smallest→largest commit sequencing finally cleanly executed (sessions 70 + 77 firings precede). FIVE new single-firing Tech Rule candidates (preview-cache pattern, sibling-not-child layoutIds, `layout="position"` stabilization, `<motion.div role="button">`, iPhone QA can override design-record motion specs). D11 + D12 design record values overridden by on-device feedback. David: "looks good." **NOTE: at session 80 close, /shelves source-side `layoutId` was retired when the photo went away from /shelves rows — that surface is now a graceful-no-op morph rather than a shipped morph.**
- **Session 77** (2026-04-27) — Track D phases 1–4 + masthead bug 5-attempt arc. Six runtime/docs commits + close. Two parallel arcs that merged at close. **Track D (`d3ddffb` design-to-Ready + `e601db5` testbed + bundled mockup in `c968c1a`):** D1–D14 frozen for FB Marketplace shared-element transitions; design record committed; `/transition-test` testbed validated cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>`. Phase 5 rollout queued for session 78. **Masthead bug 5-attempt arc (`361e1de` + `c968c1a` + `d429bbb` + `166ed59` ✅):** sessions 76 + 77 attempts 1–4 all patched the wrong layer (React tree, browser bfcache, iOS PWA event listeners). Attempt 5 replaced `position: sticky` with `position: fixed` + spacer, eliminating the iOS PWA sticky-paint bug class entirely. Less code, structurally correct. ONE new memory (`feedback_kill_bug_class_after_3_patches.md`). "Smallest→largest commit sequencing" — second firing (then session 78 first clean execution). "PWA standalone vs browser Safari is a different render path" — first firing.
---

## CURRENT ISSUE
> Last updated: 2026-04-28 (session 82 close — Massive design-system consolidation: project-wide IM Fell → Lora replacement (29 files swept) + Option C form-label primitive across 5 form surfaces + BoothLockupCard shared primitive extracted (applied to /shelves + /flagged) + descender clip fix on Lora vendor names. 10 runtime commits + V1/V2 typography mockups + 4 in-session iPhone QA cycles. ONE new memory: `feedback_recurring_phrase_signals_system.md`. Smallest→largest commit sequencing 6th clean firing — overdue Tech Rule promotion. Feed content seeding LANDED pre-session (15 posts / 2 locations / 3 vendors).)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change:** 10 runtime commits + close, every shipped item validated via Vercel preview iPhone QA in-session. **IM Fell completely retired from the codebase** in favor of Lora (`next/font/google` + `FONT_LORA` token). **Form labels** use Option C primitive (Lora upright, 15px on /vendor-request + 13px on sheets, ink-mid). **BoothLockupCard shared primitive** owns /shelves + /flagged; /find/[id] cartographic card stays inline (intentional) but visually identical (same v1.postit bg, same numeral size, same vendor name treatment). Vendor name lineHeight is 1.4 across all 3 surfaces — descenders clear cleanly. **Bookmark filter** on /shelves uses scoped count. **/flagged section header** has bookmark icon (booth bookmark, not find bookmark). **/vendor-request title** is "Set up your digital booth" + new permission/value intro paragraph + booth # optional + Mall → Location. Feed content seeding completed pre-session. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) remains an open carry-forward, re-attemptable in a focused future session WITHOUT morph changes.

### 🚧 Recommended next session — Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged (~30–60 min)

David's session 79 primary user ask, now the longest-standing user-facing carry-forward. Phase 3 was reverted in session 79 because it was bundled with morph (layoutId) changes that fought React batching + framer projection + Next.js Link timing. The scroll-restore code itself was preserved in git history (commits `71a0555` + `51067b7`). The session 79 lesson: re-attempt with **STRICT scope** — only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. **NO motion.div / layoutId changes** under any circumstances.

**Why now (over the alternatives):**
- Session 79's 12-commit revert means David asked for this scroll behavior, didn't get it, and it's been carrying since. Now is the session to settle it.
- Real seeded content (15 posts) makes the scroll behavior actually exercisable in QA — the bug class needs scrollable content to show.
- Session 82's design-system consolidation means the visual primitives (BoothLockupCard, Option C labels, Lora) are now stable. Adding scroll-restore is purely behavior, no visual coupling.
- All of session 78's Track D infrastructure (preview-cache pattern, layoutId pattern) STAYS untouched — Phase 3 is a separate axis.

**Verify before starting:** `/transition-test` testbed still works on production (layoutId regression canary). Read commits `71a0555` + `51067b7` in git history first to understand what Phase 3 actually was.

### Alternative next moves (top 3)

1. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — now strongly justified post-seeding. Decision point: rename `mall_activated`/`mall_deactivated` event keys to `location_*` as part of Q-014 (backwards-compat migration), or leave as historical analytics keys.
2. **Tech Rule promotion batch (overdue).** Smallest→largest commit sequencing now has **6 clean firings** — clearly load-bearing. `feedback_mockup_options_span_structural_axes.md` has 3 firings. `feedback_recurring_phrase_signals_system.md` is the new memory but pattern fired 2× in session 82 alone. Plus 2nd firings on V2-as-fill-refinement, mid-session iPhone QA, user-facing-copy-scrub-skip-internals. ~30 min ops pass to land the batch in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
3. **Operational cleanup pass.** ~20 inline comments referencing IM Fell historically + V1 mockup file tidying + session 80 design-record amendments. Pure docs hygiene — low-stress, high-leverage cumulative debt reduction.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 83 opener (pre-filled — Phase 3 scroll-restore re-attempt)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged. Session 79's primary user ask, reverted in session 79 because morph (layoutId) changes were bundled with scroll-restore — the scroll-restore code itself worked but the morph integration fought React + framer + Next.js Link timing through 4 iPhone-QA cycles. Reference commits `71a0555` + `51067b7` in git history for the scroll-restore code that worked. STRICT SCOPE: only module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore. NO motion.div / layoutId changes. NO Track D extension. The Track D infrastructure (preview-cache pattern, layoutId on feed→/find/[id] + /flagged→/find/[id], BoothLockupCard primitive) all stays untouched. Just scroll behavior. Real seeded content (15 posts) makes this exercisable in iPhone QA — the bug class only shows with scrollable content. ALTERNATIVES IF SCROLL-RESTORE DEFERRED: (1) Q-014 Metabase analytics surface — strongly justified post-seeding; decide whether to rename mall_activated/mall_deactivated event keys to location_* as part of Q-014 (backwards-compat migration). (2) Tech Rule promotion batch — smallest→largest sequencing (6 firings + overdue), structural-mockup-axes (3 firings), V2-as-fill-refinement (2 firings), mid-session-iPhone-QA (2 firings), user-facing-copy-scrub-skip-internals (2 firings) all promotion-ready. ~30 min ops pass. (3) Operational cleanup pass — ~20 inline IM Fell comments, V1 mockup tidying, session 80 design-record amendments. CARRY-FORWARDS FROM SESSIONS 78–82: preview cache pattern (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) is reusable for any future shared-element work; framer-motion layoutId is a global namespace; testbed `/transition-test` should be USED for surface-extension work; D11+D12 design record values were overridden by on-device feedback in session 78; session 80 retired Track D phase 5 source layoutId on /shelves; BookmarkBoothBubble has 3 size variants; wordmark on every masthead is TNR upright ink-black 18px (FONT_NUMERAL); /shelves is row pattern not grid; bookmark on BoothHero photo corner not in masthead. **NEW from session 82: IM Fell COMPLETELY RETIRED — Lora is project-wide literary serif via `FONT_LORA` token (next/font/google). Form labels use Option C primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid). BoothLockupCard shared primitive ([`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx)) owns /shelves + /flagged with v1.postit bg + inline lockup; /find/[id] cartographic card stays inline but visually identical. Vendor name lineHeight is 1.4 (descender clearance). /vendor-request title is "Set up your digital booth" with permission/value intro paragraph; booth # optional; Mall → Location everywhere user-facing. Inline IM Fell comments are documentation rot — opportunistic cleanup over future sessions.** /transition-test stays live as the layoutId regression canary.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until admin tab retires post-Q-014. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method` payload, intent-capture semantic.
- **Items 1 + 5 + 6 + 7 (Gemba polish quartet)** ✅ — **resolved session 74** in `30b9922`. Alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped.
- **Item 4 (post-publish vendor-param preservation)** ✅ — **resolved session 74** in `d52b149`. Three router.push call sites in /post/preview preserve `?vendor=<id>` so admin lands on booth-of-origin.
- **Items 2 + 3 (booth name + mall edit)** ✅ — **resolved session 74** in `c5437df`. EditBoothSheet + PATCH `/api/admin/vendors` + Pencil bubble rewire on `/shelves`.
- **"Add a booth" affordance restored on /shelves** ✅ — **resolved session 74** in `c5437df`. AddBoothTile + AddBoothSheet (third oscillation, intentional this pass per [`docs/booth-management-design.md`](docs/booth-management-design.md)).
- **Item 1 (session 75) — admin login redirect** ✅ — **resolved session 75** in `60a7a11`. `pickDest(user)` helper routes admins to `/` by default; explicit `?redirect=/foo` still wins.
- **Item 6 (session 75) — BoothHero lightbox on tap** ✅ — **resolved session 75** in `eef1746`. Transparent overlay button at z-5 sandwiched between photo container and pencil/post-it. Mounts only when heroImageUrl present.
- **Item 7 (session 75) — booth-numeral font system** ✅ — **resolved session 75** across `d747b71` + `01a6b44`. `FONT_NUMERAL` (Times New Roman) replaces `FONT_IM_FELL` on Variant B booth lockup numerals + MallScopeHeader count chips. Project-wide rule frozen.
- **Items 2 + 3 + 4 + 5 (session 75) — /vendor-request redesign** ✅ — **resolved session 75** across `a427ee7` + `fbbba21`. One-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped.
- **Item 1 (session 76) — masthead disappears on back-nav** ✅ — **resolved session 76** in `b5470da`. Loading + !post branches now render `StickyMasthead` with back button.
- **Items 3 + 4 (session 76) — green tokens** ✅ — **resolved session 76** in `d0c4ce3` + `fd1a874`. Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` across every applicable surface.
- **Item 2 (session 76) — find-title centered + price below** ✅ — **resolved session 76** across `a2cf548` (record) + `fd1a874` (impl bundle). Frame B picked. Em-dash retired.
- **Item 5 (session 76, E1–E5+E7) — animation consistency** ✅ — **resolved session 76** across `ecb8ef8` + `3832fc1`. 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts); Booths VendorCard gains tap feedback; empty states unified across 4 primary tabs.
- **Migration 013_owner_acknowledged.sql** ✅ — **resolved session 77** (David ran HITL paste this session per session-77 beat 1).
- **Item 1 (session 76 attempt + session 77 4 attempts) — masthead disappears on PWA back-nav** ✅ — **resolved session 77** in `166ed59` after 5 attempts. Final fix: `position: fixed` + spacer (kills sticky-paint bug class). Earlier 4 attempts (`b5470da`, `361e1de`, `c968c1a`, `d429bbb`) addressed wrong layers — preserved in history as audit trail.
- **Track D phases 1–4** ✅ — **shipped session 77** across `c968c1a` (mockup bundled), `d3ddffb` (design record), `e601db5` (testbed). D1–D14 frozen. Three thumbnail surfaces in scope. **NEW: position:fixed + spacer is masthead's underlying primitive** — `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) is single source of truth. **NEW: `/transition-test` is durable diagnostic infrastructure** — keep live for layoutId regressions.
- **Track D phase 5 — surface rollout** ✅ — **shipped session 78** across 11 runtime commits and 6 iPhone-QA cycles. Three surfaces originally live: feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. **Session 80 retired the /shelves source side** when the photo went away from /shelves rows; that surface is now a graceful-no-op morph rather than a shipped morph (destination layoutId on /shelf/[slug] BoothHero preserved; framer-motion gracefully no-ops when source is absent). Two surfaces still live: feed → /find/[id], /flagged → /find/[id]. Critical fix `c3b9541` introduced the **preview cache pattern** (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) that any future shared-element work will need to reuse. **NEW carry-forward: D11 + D12 design record values overridden by on-device feedback** — all entrance delays compressed to 0; post-it crossfade replaced with zoom-in 1.15→1; bubble timing matches photograph morph. Design record stays as historical reference; runtime values only in CLAUDE.md session 78 block. Operational backlog: amend the design record with a "Runtime Overrides" section + a "Source side retired on /shelves session 80" addendum.
- **Item 5 (session 80) — wordmark TNR upright ink-black 18px** ✅ — **resolved session 80** in `2efced5`. `StickyMasthead.tsx` `WORDMARK_DEFAULT` rewritten: `FONT_NUMERAL` (Times New Roman) + `fontSize: 18` + `color: v1.inkPrimary`, dropped italic + the -1px translateY lift. Visible on every screen that uses StickyMasthead.
- **Item 4 (session 80) — bookmark relocated masthead → BoothHero photo corner** ✅ — **resolved session 80** in `786de81`. Design record at [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7. `BookmarkBoothBubble` gained `"hero"` size variant (36×36 frosted, 18px glyph). `BoothHero` gained optional `saved` + `onToggleBookmark` props; bubble renders as SIBLING of photograph motion.div at top:8 right:8, NO own layoutId. `/shelf/[slug]` masthead right slot collapses to share-airplane-only. **NEW carry-forward: needs iPhone QA against banner-aspect hero photo** (item 4 sized to match /find/[id] flag's 4:5 photo).
- **Item 2 (session 80) — Booths page Option C2 row pattern** ✅ — **resolved session 80** in `895129b`. Design record at [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. `VendorCard` rewritten as full-width row, photo retired, no bio, bookmark on far-left, lockup mirrors /flagged. **D8 admin chrome (Pencil + Trash inline before booth stack) was a single-firing implementation-time decision NOT in the V2 mockup** — needs admin walk-through to confirm. **NEW carry-forward: row density on real content needs iPhone QA.** Old grid was ~4 booths/scroll; row pattern is ~7-8/scroll. Long vendor names + alphanumeric booth IDs will stress-test ellipsis behavior.
- **Item 1 + Item 3 (session 80) — nav rename + curated text** ✅ — **resolved session 80** in `2e40732` + `cdac99d`. Trivial copy changes.
- **Two polish items (session 80)** ✅ — **resolved session 80** in `eb6f942`. /shelves MallScopeHeader gains the same fade-up entrance as Home + /flagged; /find/[id] cartographic mall subtitle marginTop 4 → 2.
- **Item 1 (session 81) — nav stroke 2.0** ✅ — **resolved session 81** in `333ea3b`. BottomNav 5 icons strokeWidth 1.7 → 2.0.
- **Item 3 (session 81) — photo-overlay bubble bg lighter** ✅ — **resolved session 81** in `79306a0`. `rgba(232,221,199,0.78)` → `rgba(245,242,235,0.85)` across 5 surfaces (BookmarkBoothBubble tile + hero, masonry tile flag, /flagged tile flag, /find/[id] frostedBg + bottom flag/edit). Session 80 BoothHero bookmark iPhone QA carry-forward is now resolved through this lighter bubble shipped at the same time.
- **Item 2 (session 81) — booth lockup A3 dashed-fill-lift card** ✅ — **resolved session 81** in `ae4593c` + `846b673` (BoothHero post-it eyebrow follow-on). A3 wrapper across `/shelves` rows + `/flagged` section headers: dashed green border + paper-cream 0.55 fill + soft drop shadow + numeral 26 → 22. BoothHero + `/find/[id]` post-it eyebrows swapped to small-caps FONT_SYS to match (commits `846b673` + `bd0011b`). Mockup files at [`docs/mockups/demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html) + [`docs/mockups/demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html) serve as the design record (no separate `.md` since this was tactical visual polish, not a new structural pattern).
- **Tweak 1 (session 81) — /flagged vendor/mall gap** ✅ — **resolved session 81** in `a0e2862`. marginTop 6 → 2 to match /find/[id] cartographic block.
- **Tweak 2 (session 81) — post-it warmer + cartographic card matched** ✅ — **resolved session 81** in `c6e5273` + `154145f`. v1.postit `#fffaea → #fbf3df`. Cartographic "Find this item at" card on /find/[id] inline `background: v1.postit` (not global `v1.inkWash` swap, which would have over-broadened to 18+ surfaces).
- **Tweak 3 (session 81) — /find/[id] post-it eyebrow** ✅ — **resolved session 81** in `bd0011b`. Italic IM Fell 14px → small-caps FONT_SYS 9px / 0.12em / weight 700 / uppercase to match BoothHero post-it.
- **Tweaks 4 + 5 (session 81) — "Mall" → "Location" copy scrub + "All Kentucky Locations" picker** ✅ — **resolved session 81** in `0fab4a0`. 13 files of user-facing strings updated; internal identifiers (`Mall` types, `malls` table, `mall_id` props, `mall_activated`/`mall_deactivated` event keys, `/api/admin/malls` routes, component names) deliberately preserved. **NEW carry-forward: "All Kentucky Locations" title fit risk on narrow phones** (26px IM Fell + chevron + side padding ~290–330px on a 390px-wide phone). If wraps awkwardly, options: drop to 22px, abbreviate "All Locations", or stack on two lines. Easy to revise.
- **Session 80 carry: Item 4 BoothHero bookmark needs iPhone QA against banner photo** ✅ — **resolved session 81 implicitly**. The session 81 bubble bg lightening (paper-warm 0.85) was shipped + David QA'd via Vercel preview without flagging the BoothHero corner bubble against banner-aspect photos — assumed acceptable.
- **Session 80 carry: Item 2 row density iPhone QA** — **partially addressed session 81**. A3 lockup wrapper added to rows; David QA'd the A3 card without flagging row-density issues. Real-content seeding still the load-bearing test.
- **Session 80 carry: Item 5 wordmark 18px against masthead bubbles** — **session 81 untouched.** No regressions reported during iPhone QA cycle. Likely acceptable.
- **Session 80 carry: Item 2 D8 admin chrome** — **session 81 untouched.** No admin walk-through this session; still a single-firing implementation-time decision worth admin verification.
- **NEW (session 81): "All Kentucky Locations" title fit on narrow phones** — see tweaks 4+5 entry above.
- **NEW (session 81): A3 lockup numeral 22 vs old 26 — visual rhythm on real content** — card-padding consumes the 4px lost. Real-content seeding will stress-test against varied alphanumeric booth IDs.
- **NEW (session 81): Post-it color #fbf3df subtle vs prior #fffaea** — RGB delta (-4, -7, -11). If still reads white in real-content QA, easy refinement to push warmer (e.g. `#f9eed5`).
- **NEW (session 81): Cartographic card bg matched via inline `v1.postit` not via global token swap** — single firing. If we accumulate more "this element is in the cartographic-card family" surfaces, extract a `v1.cartographicBg` semantic token. Not needed yet.
- **NEW (session 81): Q-005 admin claimed-booth deletion gap surfaced again** — beat 10 admin SQL HITL for Kentucky Treehouse + Ella's Finds test booths. Trash on `/shelves` is gated to orphan booths only (session 74 D8). Cleanup tool would resolve. Sprint 6+ candidate.
- **NEW (session 81): "User-facing copy scrub: skip DB/API/event/type identifiers"** — first firing. Tech Rule on second.
- **NEW (session 81): "Inline bg vs token swap when token affects too many surfaces"** — first firing.
- **NEW (session 81): "V2 mockup as fill-refinement within a picked option"** — first firing pattern shape; useful for "I picked option A, but with this concern" iterations.
- **NEW (session 81): "Mid-session iPhone QA on Vercel preview shortens redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). Compresses 2-session arc into one. **2nd firing session 82** — promotion-ready.
- **Item 1 (session 82) — booth # optional** ✅ — **resolved session 82** in `2af064d`. Client-side red-asterisk → `(optional)` badge + drop client validation + drop server-side `!booth_number?.trim()` validation. Server dedup query already handled null booth.
- **Item 2 (session 82) — Mall → Location on /vendor-request** ✅ — **resolved session 82** in `e924664`. Single label swap + validation error string. The form was missed in session 81's 13-file scrub.
- **Item 3 (session 82) — /vendor-request typography pass + system-wide IM Fell retirement + Option C label primitive across 5 form surfaces** ✅ — **resolved session 82** across 4 commits (`08bf5c4` Lora infra + `b444c5e` project-wide font sweep + `6d26df6` /vendor-request page changes + `e446c11` form-label primitive sweep). New title "Set up your digital booth" + permission/value intro paragraph. **IM Fell completely retired from the codebase** — Lora is the project-wide literary serif via `next/font/google` + `FONT_LORA` token. Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across BoothFormFields + AddBoothInline + admin/login + post/preview Field. Photo dropzone + ack-card unified to Lora (was FONT_SYS). Mockup files: [`docs/mockups/vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html) + [`docs/mockups/vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html).
- **/shelves bookmark filter count bug (session 82)** ✅ — **resolved session 82** in `dfed189`. Chip rendered `bookmarkedIds.size` (global localStorage set) instead of `bookmarkedInScopeCount` (already computed at line 523). One-line fix.
- **/shelves rows without booth # are shorter + text cut off (session 82)** ✅ — **resolved session 82** in `f187165`. New BoothLockupCard primitive uses `min-height: 60` to keep rows uniform regardless of booth-number presence. Empty-state hides BOOTH eyebrow entirely (per Q1 = c); name claims full row width.
- **BoothLockupCard shared primitive extraction + applied to /shelves + /flagged (session 82)** ✅ — **shipped session 82** in [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) + `f187165` (apply to /shelves) + `bf8ac24` (apply to /flagged + booth bookmark wiring). Visual: v1.postit bg, 1px hairline, 10px radius, 12/14 padding, no shadow. /find/[id] cartographic card stays inline (intentional per David — *"no change to this component card"*) but visually identical. **Session 81's A3 dashed-fill-lift card is RETIRED** in favor of this shared primitive.
- **/flagged section header booth bookmark added (session 82)** ✅ — **resolved session 82** in `bf8ac24`. BoothGroup type gained `vendorId` field. State + handler mirror /shelves (boothBookmarkKey + R3 v1.1 booth_bookmarked / booth_unbookmarked events). Synced on mount + focus.
- **Descender clip on Lora vendor names (session 82)** ✅ — **resolved session 82** in `a045058`. lineHeight 1.25 → 1.4 across BoothLockupCard primitive AND /find/[id] inline (had the same bug, just hadn't been caught in QA because David's seed data lacked descender-heavy vendor names).
- **NEW (session 82): IM Fell inline comments are documentation rot.** ~20 references across 15 files ("italic IM Fell vocabulary," "matches IM Fell italic," etc.). Functional sweep was clean; comments lag. Opportunistic cleanup over future sessions.
- **NEW (session 82): Form-label sweep skipped non-`<label>`-tag form chrome** on AddFindSheet, post/preview body, setup page. Section headers in italic Lora may want similar Option C treatment if they fire as recurring readability concerns. Defer.
- **NEW (session 82): BoothLockupCard primitive could extend to /shelf/[slug] BoothHero** if David ever wants the post-it to match the card primitive. Currently intentionally NOT matched.
- **NEW (session 82): "Bug surfaced in extracted primitive AND inline copy of same primitive — fix both in same commit"** — first firing (descender clip in BoothLockupCard + /find/[id] inline simultaneously). Single firing.
- **NEW (session 82): "Per-context sizing on a swept primitive"** — first firing (Option C label at 15px on full pages, 13px on sheets — label sized relative to its input). Single firing.
- **NEW (session 82): "User-facing copy scrub: skip DB/API/event/type identifiers"** — **2nd firing.** Promotion-ready.
- **NEW (session 82): "V2 mockup as fill-refinement within a picked option"** — **2nd firing** (V1 = 3 label primitives within IM Fell / V2 = 3 fonts within picked Option C). Promotion-ready on a 3rd firing.
- **NEW (session 82): "We continue to run into this issue" / "Every time I see X" signals system-level concern** — first firing as a memory ([`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md)). Pattern fired 2× in session 82 (typography + booth lockup). Memory captures the rule.
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **NEW: Item 6 (session 76) — FB Marketplace shared-element transitions** carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces. Per `feedback_testbed_first_for_ai_unknowns.md`, build `/transition-test` testbed page first to validate cross-route shared-element transitions before touching real surfaces. Size M-L; likely its own session.
- **NEW: E6 (session 76) — scroll-restore safety deferred** — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min in its own session.
- **NEW: Frame C parked on find-title centering** (session 76) — [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) Frame C (22px italic subtitle) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- **NEW: Sheet/modal entrance animation consistency NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- **NEW: Home MasonryTile bespoke easing intentionally diverges** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations preserved as intentional polish on hero feed grid. Token values centralize but the runtime is forked.
- **NEW: Detail-page render branches must render base chrome in every state** (session 76) — first firing (find/[id] bug). Single firing; Tech Rule on second firing.
- **NEW: Default to stacked over inline for title + secondary value patterns** (session 76) — first firing (find-title em-dash retirement). Single firing.
- **NEW: Audit invariants against sibling pages of the same shape after 3+ recent sessions** (session 76) — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here despite 3 recent layout sessions). Single firing.
- **Feed content seeding** ✅ — **resolved pre-session 82** (David completed seeding before session 82 standup). 15 posts across 2 mall locations and 3 vendors. The 24× bumped item finally came off the queue. Real-content QA loop now possible.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch — overdue** — 30+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready**, **"smallest→largest commit sequencing" 🟢 promotion-ready and overdue** (sessions 70 1st + 77 2nd misfire + 78 1st clean + 80 2nd clean + 81 3rd clean + 82 6th clean — fully load-bearing across every David-redirect-bundle session), **`feedback_mockup_options_span_structural_axes.md` 🟢 promotion-ready** (sessions 80 + 81 + 82 — 3 firings), **"Mid-session iPhone QA on Vercel preview shortens redirect cycle" 🟢 promotion-ready** (sessions 81 + 82 — 2 firings, third firing on next mid-session-QA session lands it). **Session 82** surfaced THREE new single-firings: (1) "Bug surfaced in extracted primitive AND inline copy — fix both in same commit"; (2) "Per-context sizing on a swept primitive"; (3) the new memory `feedback_recurring_phrase_signals_system.md` capturing "we continue to run into this" / "every time I see X" → system-level concern signal. Plus 2nd firings of: "User-facing copy scrub: skip DB/API/event/type identifiers" and "V2 mockup as fill-refinement within a picked option" (both promotion-ready). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon if a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title`) + `tag_skipped` shipped.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests see a 22px CircleUser glyph in the masthead right slot. Worth checking during beta-feedback.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012.
- **Existing `/api/*` routes are unwrapped re Sentry** (session 65) — ~25 routes silently swallow errors at the framework level. Acceptable for now; auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (session 65, parked) — would auto-fix the Sentry wrap-route requirement and unlock Cache Components.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — one-time fix: add a `.mcp.json` block.
- **`/mall/[slug]` lensless on v0.2 dark theme** (session 66) — known deviation; lens applies cleanly when mall page does its v1.x ecosystem migration.
- **Treehouse Lens constant is provisional** (session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)`; real vendor content this week may reveal it needs tuning.
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — Pencil + Trash already in top-right; admin can bookmark via `/shelf/[slug]` masthead. Reconsider only if admins want it.
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` fires on all three primary tabs with `page` field for per-tab attribution.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70 + 71** via cartographic collapse.
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via collapse.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight`.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — eyebrow now single-line "Booth"; post-it may look slightly tall. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos; real vendor content during the seeding walk is the actual judgment moment.
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid`; implementation kept `v1.priceInk` (established semantic token).
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70**.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (session 70) — captured in Record 1 design record as known-limitation. Likely fix: mall-grouped section breaks with small all-caps mall eyebrow.
- **Booth-page scroll flatten (D17) regression watch** (session 70) — highest-risk decision in Record 3. Watch on iPhone QA.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (session 70) — page may lose the "reviewing" feel against vendors stepping through Add Find. (Note: session 74 touched /post/preview for item 4 but didn't change title placement.)
- **Booths grid lockup numeral size deviates from spec** (session 70) — design record specified 26px; Booths grid implements at 20px to preserve tile proportions. Design-record L3 amended.
- **Item 3 — animation consistency review across pages** ✅ — **resolved session 76** in `ecb8ef8` + `3832fc1`. 5 motion tokens centralized in lib/tokens.ts; Booths VendorCard tap parity shipped; empty states unified. E6 (scroll-restore safety) deferred separately.
- **Item 5 follow-up: B + A parked** (session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready as second pass.
- **Item 6 — shareable filtered-mall link** (session 71) — needs product + URL-param scoping + share UX + mockup pass.
- **Sub-agent claim verification gap** (session 71) — single firing; Tech Rule candidate on second firing.
- **Screenshot-before-scoping discipline for visual fixes** (session 71) — single firing; Tech Rule candidate on second firing.
- **Multi-affordance retirement → single-surface promotion** (session 72) — single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (session 72) — empty-on-purpose is a valid state.
- **Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014.
- **Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — retire automatically when Q-014 lands and admin tab retires.
- **Other supabase-js call sites might have the same latent bug** (session 73) — audit candidates: any inline `createClient` outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent.
- **NEW: Hero photo asymmetry between Add and Edit sheets** (session 74) — Add sheet has hero photo upload; Edit sheet doesn't (per D5, /my-shelf?vendor=<id> is canonical hero-edit surface). Easy expand if asked.
- **NEW: AddBoothInline retained on /admin Vendors tab** (session 74) — duplicate Add UI exists (AddBoothSheet on /shelves + AddBoothInline on /admin). Field shapes match; future cleanup may unify if drift surfaces.
- **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** (session 74) — intentional per D1. Reachable from `/shelf/[slug]` and direct nav. Add a "View profile" eyebrow on EditBoothSheet if surfaced.
- **NEW: Slug-collision shares the BOOTH_CONFLICT path** (session 74) — generic error message says "booth number" but actual cause might be slug uniqueness. Add slug-specific path if surfaced.
- **NEW: Third oscillation of AddBoothInline-on-/shelves** (session 74) — captured in [`docs/booth-management-design.md`](docs/booth-management-design.md) Carry-forward so future sessions don't reflexively retire.
- **NEW: `showPlaceholders` prop infrastructure dormant in BoothPage** (session 74) — unreachable after item 6 dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup pass to reap; deferred.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–73 missing from `docs/session-archive.md`. Pure docs-housekeeping. Worth a single ~15min ops pass at some point.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54 + 55 + 57–80 missing), strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant showPlaceholders prop infrastructure in BoothPage.tsx, **session 80: tidy V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html), superseded by V2), **session 80: amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with "Source side retired on /shelves" addendum**, **NEW (session 81): Q-014 Metabase planning** — decide whether to rename `mall_activated`/`mall_deactivated` event keys to `location_*` (backwards-compat migration, not flag-day), **NEW (session 81): consider `v1.cartographicBg` semantic token extraction** if more cartographic-card surfaces accumulate. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK + Vercel-Sentry integration + source-map upload + PII scrubbing + email alerts. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations; v4 on-device QA walk **PASSED 4/4 clients session 53**. Loop fully closed.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). **Note: session 74 partially addressed this for admin** via the new EditBoothSheet, which any admin can use to edit any booth's name. Vendor-self-edit is still parked (vendors can't edit their own booth name yet; only admins can).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Sprint 5 polish.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need; session 74 closes the booth-name + mall-edit gap; the 80% case is now covered by /shelves), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` through `v4.html` — design-history reference for Q-011 arc.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002).
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — Q-011 addendums stacked. Post-QA, candidate for consolidation.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot artifact, gitignored, safe to delete anytime).
- Orphaned `dbutler80020@gmail.com` staging auth user (non-admin, non-blocking).
- **NEW: showPlaceholders prop infrastructure in BoothPage.tsx** (session 74) — unreachable after `/my-shelf` dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end — three production surfaces, preview-cache pattern as new reusable infrastructure. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle (9 runtime commits, V1 + V2 mockups). **Session 82 closed the largest design-system consolidation pass since the v1.x layer was named (10 runtime commits + V1/V2 typography mockups, 4 in-session iPhone QA cycles):** project-wide IM Fell → Lora replacement (29 files swept, IM Fell completely retired from the codebase via `next/font/google` + `FONT_LORA` token); Option C form-label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across 5 form surfaces; BoothLockupCard shared primitive extracted ([`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx)) and applied to /shelves rows + /flagged section header (replaces session 81's A3 dashed lockup card); /vendor-request gets new title "Set up your digital booth" + permission/value intro paragraph + booth # optional + Mall → Location; /flagged section header gains booth bookmark icon; /shelves bookmark filter count fixed to use scoped count; vendor name lineHeight bumped 1.25 → 1.4 across all 3 surfaces for descender clearance. ONE new memory: **"we continue to run into this" / "every time I see X" → system-level concern signal**. Smallest→largest commit sequencing fired clean for the 6th time — overdue Tech Rule promotion. **Feed content seeding LANDED pre-session 82** (15 posts / 2 locations / 3 vendors); the 24× bumped item finally came off the queue. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) is now the longest-standing user-facing carry-forward and is the recommended next session, with strict scope: scroll-key + module-cache only, NO motion.div / layoutId changes. **Next natural investor-update trigger point** is after the next 1–2 sessions land scroll-restore + Q-014 Metabase analytics — that turns "data flowing" into "investor-ready dashboards."
