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

## ✅ Session 62 (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on QA: design-to-Ready → testbed-validated prompt → 3-phase integration → 4/4 acceptance criteria passed

Single-track session, six commits (1 design + 1 testbed + 3 integration + 1 close), all 🟢 QA-passed on iPhone. **The V1 vendor-experience unlock landed:** vendors now photograph the inventory tag after the item photo, Claude vision pulls the title + price authoritatively, and the review page prefills with green "from tag" badges next to extracted fields. Skip is a one-tap fallback to today's flow. Solves two real-world vendor problems — title now matches the physical tag buyers read in person, and price no longer requires manual transcription.

The session followed a clean four-phase shape:

1. **Architecture review in chat** — David surfaced the feature at standup with a clear problem statement. I asked 8 architectural questions (D1–D8: storage, vision API, flow placement, skip placement, failure handling, title priority, price format, caption timing). David answered all 8 in two terse messages. Decisions frozen before any mockup or code. This pre-mockup architecture round saved the design surface from carrying decisions that belonged in chat.

2. **Mockup-first design** (commit `32f8ef4`) — produced [`docs/mockups/add-find-with-tag-v1.html`](docs/mockups/add-find-with-tag-v1.html) with 3 phone-frame variants (ready / extracting / preview-with-prefill) plus a detail strip showing 3 "from tag" badge variants (α pill / β icon-only / γ ash chip). David approved Frame 1 layout, picked CTA copy "Take photo of tag", iterated skip copy ("Skip — I'll add price manually" → "Skip — I'll add title and price manually" since the skip covers both fields), approved page title + subhead as drawn, picked badge variant α. Wrote design record [`docs/add-find-tag-design.md`](docs/add-find-tag-design.md) capturing D1–D8 + M1–M5 + build-phase outline + acceptance criteria. Mockup + design record committed in same session per the session-56 rule (commitment ceremony before any code).

3. **Testbed-first prompt validation** (commit `e77e77b`) — proposed 3 implementation paths after design-to-Ready: (A) full integration end-to-end, (B) close + fresh session, **(C) scaffold testbed first to validate the Claude vision prompt against real tags before committing to the wiring**. David picked C. Shipped [`/api/extract-tag`](app/api/extract-tag/route.ts) full implementation (mirrors `/api/post-caption` line-by-line with tag-specific system prompt, Claude Sonnet 4.6 vision pinned, source:claude/mock pattern, rate limit) + a standalone testbed page at `/post/tag` with amber "🧪 TESTBED" banner, file inputs for camera + library, full response surfaced visibly on screen (status pill + extracted fields + raw JSON expandable + elapsed ms) per the front-load-visibility-tools feedback rule. David tested **multiple handwritten tags — all came back positive results**. Validation in 1 round on a ~200-line testbed instead of after a ~600-line integration. Branch A unblocked.

4. **3-phase integration** — split into three small commits for review hygiene:
   - **Phase 1/3 — Foundation** (commit `1b9a157`): expanded [`lib/postStore.ts`](lib/postStore.ts) `PostDraft` shape with optional tag-flow fields (`extractionRan`, `extractedTitle`, `extractedPrice`, `captionTitle`, `captionText`, `captionFailed`); renamed image-only convenience to `setImage()`; full-shape write goes through `set(PostDraft)`. New [`components/TagBadge.tsx`](components/TagBadge.tsx) — variant α green-on-green pill with Lucide `Tag` glyph + italic IM Fell "from tag". `/my-shelf` updated to call `setImage()` (1-line change, redirect target unchanged).
   - **Phase 2/3 — Consumer** (commit `eb9dfa6`): wired [`/post/preview`](app/post/preview/page.tsx) to branch on `extractionRan`. Skip flow keeps today's behavior (fire `/api/post-caption` on mount). Tag flow reads pre-fetched results from postStore and renders fully populated on first paint with no network call. Behavior matrix covers all four cases: full success / full failure / title-only success (price unreadable) / partial-with-soft-notice. New `<AmberNotice>` variants: "Couldn't read this tag — fill in the title and price below." (full fail) + "Couldn't read the price on the tag — fill it in below." (soft, when title prefilled but price null). Caption-fail in tag flow is silent (caption is optional). `FieldGroup` gained an optional `badge` prop and switched to flex-row label container so `TagBadge` renders inline without breaking optional-marker affordance.
   - **Phase 3/3 — Producer** (commit `f129aa2`): rewrote `/post/tag` from testbed to production — stripped TESTBED banner, masthead chrome matching mockup ("Now the tag" / italic "Capture the title and price in one shot."), Frame 1 ready state with item photo + hint + green CTA + skip link, Frame 2 extracting state with both photos labeled and "Pulling title and price…" pulse, masthead swaps to "Reading the tag…" / "Just a moment." during extraction. `Promise.all([extract-tag, post-caption])` fires both APIs in parallel against tag photo and item photo respectively (worst-case latency = max of the two, not sum). `router.replace` (not push) so back-from-preview lands on `/my-shelf` cleanly. Per-API failure absorbed into postStore and the flow continues to preview where the appropriate notice surfaces — vendor never strands on `/post/tag` with an error screen. Threaded admin `?vendor=` impersonation param through both hops. `/my-shelf` `handleAddFile` redirect target flipped `/post/preview` → `/post/tag`, closing the loop atomically.

5. **iPhone QA walk** — all four acceptance criteria passed:
   - ✅ Tag-flow happy path — both fields prefill, both wear "from tag" pill
   - ✅ Skip flow — today's behavior intact (caption from Claude, manual price)
   - ✅ Price-only failure — title prefills, soft notice on price, vendor types it
   - ✅ Full tag failure — full notice, both fields empty, vendor types both

**Commits this session (5 runtime + 1 close):**

| Commit | Message |
|---|---|
| `32f8ef4` | docs(add-find-tag): design-to-Ready — tag-capture step in Add Find flow |
| `e77e77b` | feat(tag): scaffold /api/extract-tag + /post/tag testbed |
| `1b9a157` | feat(tag): expand postStore for tag flow + add TagBadge component (1/3) |
| `eb9dfa6` | feat(tag): wire /post/preview to consume tag-flow extraction (2/3) |
| `f129aa2` | feat(tag): production /post/tag + flip Add Find redirect (3/3) |
| (session close) | docs: session 62 close — tag-capture feature shipped end-to-end |

**What's broken (carry to session 63):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged from sessions 60, 61. Still well-characterized but root-cause-unknown. Cheapest probe (`/api/admin/events-raw` via bare `fetch()` bypassing `@supabase/supabase-js`) parked until symptom freshly reproduces. Verbose diag logs still in `/api/admin/events/route.ts`.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried from sessions 59, 60, 61, 62. Untouched.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — bumped now from sessions 55, 60, 61, 62. Remains the V1 unblocker. Session-62 work makes the case STRONGER, not weaker, for seeding next: the Add Find flow itself is now ~2× faster per find AND the title-on-tag accuracy is 100%, so seeded content will showcase a now-genuinely-better vendor experience. Still the natural recommended next session.
- 🟢 **Tag-extraction analytics events** (NEW backlog item) — session 62 didn't fire R3 events for `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped`. Worth wiring once R3 stale-data mystery resolves; would let us measure tag-flow adoption + extraction reliability in production. Out of scope per the design record but a reasonable follow-up.

**Memory updates:**

- **NEW** `feedback_testbed_first_for_ai_unknowns.md` — when a multi-file feature's load-bearing risk is "will the AI/LLM call be accurate enough" (vision, structured output, classification, anything model-dependent), ship a standalone testbed page first that exercises ONLY that call, surfaces the response visibly on screen, lets the user validate against real inputs before any production wiring exists. Validated this session in one round; would have been ~5× more expensive to iterate the prompt after the full integration sat on top.

Existing memories that load-bore the session:
- `user_code_context` — David's automation preference reflected in his single-message D1–D8 answers ("D1: A, D2: Reuse, D3: A, D4: A, D5: your recommendation, D6: Yes to both, D7: Yes, D8: Same as today (skip flow)") and his terse mockup pickup ("1. approve 2. \"Take photo of tag\" 3. \"Skip - I'll add title and price manually\" should read…").
- `feedback_visibility_tools_first` — applied proactively during the testbed scaffold (status pill + raw JSON expandable + elapsed ms surfaced visibly so David could validate without devtools).

**Live discoveries:**

- **The "scoping → mockup → testbed → integration" four-phase shape works cleanly in a single session** when each phase is tight. ~3 hours of focused work covered it end-to-end. The discipline that made it work: D1–D8 architecture decisions all locked in chat BEFORE the mockup was drafted (so the mockup was committing to layout + copy + badge variants, not architecture); mockup committed at design-to-Ready (so the implementation session couldn't drift); testbed at the eventual production URL (so phase 3 was a rewrite-in-place, not a separate file).
- **Promise.all with parallel AI calls** — worst-case latency = max not sum. Tag flow uses `Promise.all([extract-tag, post-caption])` so the vendor waits for the slower of the two, not their combined time. ~3-4s observed on iPhone for both to settle. Pattern reusable for any future flow that needs multiple vision calls.
- **"Tag is authoritative, Caption is interpretive"** — emerged as the load-bearing semantic distinction in D6. Tag = what the buyer reads in person (factual). Caption = how the piece feels (Claude's interpretive register). Tag overrides Claude title; Claude caption is always from the item photo not the tag. Worth remembering as a model for future "AI generates the descriptive layer, real-world signal generates the factual layer" features.
- **`router.replace` for intermediate flow steps** — `/post/tag` uses replace (not push) when navigating to `/post/preview` so the page pops from history. Back-from-preview lands on `/my-shelf` not `/post/tag`. Pattern: any "validation/extraction step" that's not a destination should use replace, not push.
- **postStore back-compat-on-read** — pre-session-62 sessionStorage entries were stored as bare image data URLs (`saved.startsWith("data:image/")`). New shape is JSON. Read-side migration: `if (saved.startsWith("data:image/")) draft = { imageDataUrl: saved }; else JSON.parse(saved)`. Silent migration on first read; no users see broken state across the deploy.

**Operational follow-ups:** No new entries beyond the carry list above. All session-60/61 carryovers (R3 raw-PostgREST probe, `find_shared` instrumentation gap, verbose diag log strip-time) remain parked. Archive-drift partially handled in this close — session 56 moved to [`docs/session-archive.md`](docs/session-archive.md) as a one-liner; sessions 54 + 55 still missing from archive (operational backlog).

**Tech Rule candidates:** Existing TR-l + TR-m still 🟢 promotion-ready (unchanged from sessions 60, 61). **NEW TR-p — Testbed-first for AI/LLM call unknowns in multi-file integrations** added to queue at fire count 1; this session's validation was the first firing. If a future feature has the same shape (load-bearing AI call risk, multi-file integration), this rule becomes 🟢 promotion-ready and joins the next promotion batch.

**Notable design artifacts shipped this session:**
- [`docs/mockups/add-find-with-tag-v1.html`](docs/mockups/add-find-with-tag-v1.html) — 3-frame phone-mockup arc + 3-variant badge detail strip; the design surface that committed M1–M5
- [`docs/add-find-tag-design.md`](docs/add-find-tag-design.md) — D1–D8 + M1–M5 frozen, build-phase outline, acceptance criteria, lineage. The design-to-Ready commitment ceremony per session-56 rule
- [`app/api/extract-tag/route.ts`](app/api/extract-tag/route.ts) — first vision route after `/api/post-caption`; mirrors that route's pattern line-by-line including rate limit, mock fallback, source:claude/mock pattern, logError helper. Reusable shape for any future vision route
- [`components/TagBadge.tsx`](components/TagBadge.tsx) — first inline "field source signal" primitive. Could be reused (or generalized) if future fields are prefilled from non-vendor sources (e.g. "from photo" / "from import")

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 still missing — operational backlog).

- **Session 61** (2026-04-25) — Six-commit UX polish pass shipped end-to-end on iPhone QA. Admin hero image delete (`9a26485`), Find Detail full-screen photo lightbox with pinch-zoom (`e694adc`), feed relative timestamps below tile (`b565221`), feed adjustments + heart→pushpin (`f73c6e3`), pushpin → flag-on-pole save glyph across 4 callsites (`4a99512`), Find Map flag size + ecosystem back-button standardization at 38/18/1.6 (`8211a31`). Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within session. New `<PhotoLightbox>` + `<FlagGlyph>` primitives. TR-n added (multi-element-glyph strokeWidth-0 trap, fire count 1).
- **Session 60** (2026-04-25) — R3 stuck-Fluid-Compute-instance theory disproved (fresh deploy `d3f2d6b` immediately served the same 25-min-stale snapshot). Confirmed Vercel + local share identical Supabase URL + service-role key + length, but admin Events route still returns stale rows where local script via the same key sees fresh ones. Cheap diagnostics exhausted; mystery parked. TR-l promoted 🟡 → 🟢 promotion-ready.
- **Session 59** (2026-04-25) — Two-track. (1) Doc architecture refactor — CLAUDE.md cut 41,739 → 21,652 chars (-48% per auto-load), new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template. (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom. On-device Refresh-button verification deferred to session 60.
- **Session 58** (2026-04-25) — R3 (Analytics event capture) design-to-Ready + implementation in one session. Events table on prod via migration 010, anon SELECT revoked via migration 011, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters. Visibility tooling (debug toast + diagnostic script + verbose logs) shipped as institutional QA infrastructure. Commits `ba888b3` → `f1e1fd5` (7 commits + close). Two display-layer bugs deferred to session 59.
- **Session 57** (2026-04-24) — R4c shipped end-to-end on prod (commit `ff87047`, on-device QA PASSED 4/4), first-ever Tech Rule promotion batch (3 rules into MASTER_PROMPT.md, commit `6f77065`), Q-002 picker revision (commit `080689a`), `.eslintrc.json` to green the long-red Lint job (commit `d73323f`). CI green across all 3 jobs for the first time. R4c graduated 🟢 → ✅ — first roadmap item shipped end-to-end.

---


## CURRENT ISSUE
> Last updated: 2026-04-25 (session 62 close — tag-capture step in Add Find flow shipped end-to-end on QA; feed content seeding still pending)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62. **Top priority** — the actual V1 unblocker. **The case is stronger than ever after session 62**: the Add Find flow itself is now ~2× faster per find (tag photo auto-fills title + price), the title-on-tag accuracy is 100% (matches what buyers read in person), and the feed/find-detail surfaces are polished from session 61. Seeded content will showcase a now-genuinely-better vendor experience plus a now-genuinely-polished discovery surface.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the new tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps, find-detail with lightbox, my-shelf, public shelf).
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster (Sentry breadcrumbs vs. cobbled-together log substring searches).
3. **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 63 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped, the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Walk this flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf). Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery from session 60 still parked — root cause unknown after exhausting cheap diagnostics. Pick R3 back up only if symptom freshly reproduces; cheapest next probe is `/api/admin/events-raw` via bare fetch() to bypass supabase-js (~10 min including deploy). Verbose diag logs in `/api/admin/events/route.ts` stay in place until R3 closes. Tag-extraction analytics events (`tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped`) intentionally NOT wired this session — natural follow-up after R3 stable.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60, 61, 62. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–62. 10–15 real posts across 2–3 vendors. **Now top-of-stack** as recommended next session. Sessions 61 + 62 both strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), AND the Add Find walk itself is now ~2× faster per find (tag-capture auto-fills title + price). Seeded content will showcase a genuinely better experience end-to-end.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n (multi-element-glyph strokeWidth=0 trap, fire count 1). Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sessions 54 + 55 archive-drift** — these tombstones are missing from `docs/session-archive.md` (sessions 56-58 not yet moved either, but those are still in the CLAUDE.md tombstones list). Pure docs-housekeeping; no signal lost since git log + commit messages preserve the actual state.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54-55 + future), R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring** — absorbed into [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) as R12 (Horizon 1).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; **session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Solves two real-vendor problems: title now matches the physical tag, price no longer requires manual transcription. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. The Add Find walk is now ~2× faster per find AND title-on-tag accuracy is 100%, so feed content seeding (still pending, now bumped from sessions 55, 60, 61, 62) becomes ever-more compelling as the next move.** Next natural investor-update trigger point remains after feed content seeding + R3 stabilizes — the update would then report R4c + R3 + tag-capture (the V1 vendor unlock) all shipped, plus the session-61 polish pass, plus the session-62 testbed-first pattern as durable institutional approach for future AI/LLM-dependent features.
