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

## ✅ Session 63 (2026-04-25) — Home page polish: editorial vendor CTA card + masthead profile-icon swap (3 runtime commits)

Mid-scope session, three runtime commits + this close, all 🟢 build-clean. Pivoted from the recommended feed-content-seeding move to home-page UX polish at David's redirect — vendor CTA at the bottom of the feed got a full editorial-banner redesign, and the masthead right-slot's text-heavy "Sign in / Sign out" affordance got a sized-down profile icon for guests + sans-serif text for signed-in users.

The session ran two design arcs back-to-back:

1. **Vendor CTA card — clean mockup-first arc** (commit `4d96f44`). David showed a rough sketch (icon-row card with chevron + button below) and asked for variants. Produced [`docs/mockups/vendor-cta-v1.html`](docs/mockups/vendor-cta-v1.html) with 3 phone-frame directions in feed-context: α (sketch literal), β (single-tap card, no separate button), γ (editorial banner with storefront watermark + integrated button + IM Fell display headline). David picked γ, requested copy update to "Share your booth on Treehouse Finds." and flagged the button font as "too ornate." Produced [`docs/mockups/vendor-cta-v2.html`](docs/mockups/vendor-cta-v2.html) with γ locked + two button-font A/B treatments (T1 sans semibold normal-case / T2 sans tracked uppercase). David picked T1. Built [`components/VendorCTACard.tsx`](components/VendorCTACard.tsx) and swapped at [`app/page.tsx:963-1002`](app/page.tsx:963), replacing the centered hairline + italic line + IM Fell pill button. The replacement renders outside the empty/has-finds conditional, so when a mall has no posts the card sits below `<EmptyFeed />` automatically — single placement, dual context, no extra wiring needed (David had flagged the empty-state placement as a likely good fit; turned out to be free).

2. **Masthead profile-icon micro-pivot** (commits `5c0dded` + `1c66531`). Smaller change, ran rougher than it should have. David's request: "replace the sign out text with a profile image icon … the icon helps add a bit of ui polish." I parsed this as "icon on the auth'd state" and shipped commit `5c0dded` with `CircleUser` 28px on the signed-in branch + `window.confirm("Sign out?")` guard + "Sign in" text preserved on the unauth'd branch. David clarified one message later — he wanted the *inverse*: icon on the **unauth'd** branch (Sign in → /login), text "Sign out" on the auth'd branch but in sans-serif, smaller and thinner icon, drop the confirm. Shipped commit `1c66531` correcting course: 22px CircleUser at 1.4 stroke for guests, sans 13px weight 500 "Sign out" text for signed-in users, no confirm. Final state matches David's intent on prod once the deploy lands.

**iPhone QA:** carried out by David post-deploy on `1c66531`. Both surfaces ship green-on-green at the home-feed bottom (editorial banner) and right-slot masthead (profile icon for guests / sans-serif text for signed-in).

**Commits this session (3 runtime + 1 close):**

| Commit | Message |
|---|---|
| `4d96f44` | feat(home): editorial vendor CTA card |
| `5c0dded` | feat(home): profile icon replaces sign-out text in masthead |
| `1c66531` | fix(home): swap masthead — icon on Sign in, sans Sign out text |
| (session close) | docs: session 63 close — home page polish (CTA card + masthead) |

**What's broken (carry to session 64):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged from sessions 60–62. Still well-characterized but root-cause-unknown. Cheapest probe (`/api/admin/events-raw` via bare `fetch()` bypassing `@supabase/supabase-js`) parked until symptom freshly reproduces. Verbose diag logs still in `/api/admin/events/route.ts`.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried from sessions 59–62. Untouched.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — bumped now from sessions 55, 60, 61, 62, **63**. Remains the V1 unblocker. The case keeps strengthening: home feed itself is now visibly more polished (editorial CTA + cleaner sans masthead), Add Find walk is ~2× faster (tag-capture from session 62), find-detail is polished (lightbox + back-button standardization from session 61). Seeded content showcases a genuinely-better experience end-to-end. **Top recommended next session.**
- 🟡 **Tag-extraction analytics events** — carried unchanged from session 62. `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events not yet wired to R3 pipeline. Worth doing once R3 stale-data resolves.
- 🟢 **Sign-in icon discoverability** (NEW watch-item) — first-time guests now see a profile glyph instead of "Sign in" text in the masthead right slot. The reasoning is sound (ui polish + universal "tap to access account" affordance), but it's worth checking during beta-feedback whether new users actually find the icon. If it's a problem, the cheap fix is a tooltip / first-visit nudge, not a revert.

**Memory updates:**

- **NEW** `feedback_treehouse_no_coauthored_footer.md` — Treehouse repo commits do NOT include `Co-Authored-By: Claude...` footer; matches 45+ prior commits and is reaffirmed in `/session-close` notes. The Claude Code default prompt template includes the footer; this repo overrides that default. Captured because all three runtime commits this session shipped with the footer (minor drift; don't repeat).
- **NEW** `feedback_ask_which_state_first.md` — when a UI request targets a multi-state element (auth'd/unauth'd, owner/viewer, loading/loaded/error), the load-bearing question is "which state(s) are changing," not "what should the change look like." Surface that ambiguity before drafting prose proposals or shipping. Captured from this session's masthead micro-pivot (commit `5c0dded` shipped + reverted by `1c66531` — would have been one commit if I'd asked "icon on Sign in or Sign out?" first).

Existing memories that load-bore the session:
- `user_code_context` — David's automation preference reflected in single-character variant picks ("Y", "T1", "B", "A") and tight redirect messages ("change it to icon to sign in. Should be a little smaller as well…").

**Live discoveries:**

- **The four-phase mockup-first arc compresses cleanly to two phases for tighter UI swaps.** Session 62 ran chat-architecture → mockup → testbed → integration. Session 63's vendor CTA ran just mockup → integration (no architecture round needed since the swap was self-contained, no testbed needed since there's no AI/LLM call). The mockup-then-implement shape worked end-to-end in ~30 min including build + commit.
- **Single-placement-dual-context is a real productivity win** when the existing render conditional already covers both contexts. The vendor CTA renders outside the empty/has-finds branch, so the editorial banner appears below `<EmptyFeed />` for free when a mall has no posts. Worth checking in any future "this should also appear in X" requests — sometimes X is already free.
- **Asking the load-bearing question is cheaper than guessing.** Session 63's masthead micro-pivot cost a revision commit because I drafted a prose proposal (icon on auth'd state + tap-behavior options A/B/C) on an ambiguous request. The five-character question "icon on Sign in or Sign out?" would have saved the round-trip. Captured as a feedback memory; should generalize to any multi-state UI request.
- **Mockup-first design records can compress when the change is small.** No `docs/vendor-cta-design.md` was written this session even though commits included two mockups. The mockup HTML decisions panes themselves were enough commitment surface for a one-component swap; a separate design record would have been bureaucratic overhead. The session-56 rule (commit design records in same session) still holds — but the threshold for what counts as a design record is feature-by-feature scope, not "any UI session."

**Operational follow-ups:** No new entries beyond the carry list above. Archive-drift unchanged: sessions 54 + 55 + (now also) 57–62 missing from `docs/session-archive.md` — pure docs-housekeeping, no signal lost.

**Tech Rule candidates:** Existing TR-l + TR-m + TR-n + TR-p still 🟢 promotion-ready / 🟡 fire-count-low (unchanged). No new TR candidates fired this session.

**Notable design artifacts shipped this session:**
- [`docs/mockups/vendor-cta-v1.html`](docs/mockups/vendor-cta-v1.html) — 3-direction picker (α sketch / β single-tap / γ editorial banner) in feed-context phone frames. The "α/β/γ pick" pattern is reusable for any future variant-direction decision.
- [`docs/mockups/vendor-cta-v2.html`](docs/mockups/vendor-cta-v2.html) — γ locked + two button-font A/B (T1 sans semibold / T2 sans tracked uppercase) + zoomed buttons-only comparison strip at bottom. The detail-strip pattern (zoomed comparison of the differing element below the phone frames) is reusable when the variant choice hinges on a small visual element.
- [`components/VendorCTACard.tsx`](components/VendorCTACard.tsx) — first editorial-banner card primitive in the codebase. Reusable shape for future "small editorial moment in feed" placements (e.g. mall-operator CTA, beta-feedback CTA, app-store install nudge if PWA mode allows).

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–62 still missing — operational backlog growing).

- **Session 62** (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on iPhone QA. Six commits across four phases: chat-architecture (D1–D8 frozen) → mockup + design record (`32f8ef4`) → testbed-first prompt validation (`e77e77b`, handwritten tags 100% pass first try) → 3-phase integration (`1b9a157` foundation + `eb9dfa6` consumer + `f129aa2` producer). Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review prefills with green "from tag" pills; skip is one-tap fallback. 4/4 acceptance criteria passed. TR-p added (testbed-first for AI/LLM unknowns, fire count 1).
- **Session 61** (2026-04-25) — Six-commit UX polish pass shipped end-to-end on iPhone QA. Admin hero image delete (`9a26485`), Find Detail full-screen photo lightbox with pinch-zoom (`e694adc`), feed relative timestamps below tile (`b565221`), feed adjustments + heart→pushpin (`f73c6e3`), pushpin → flag-on-pole save glyph across 4 callsites (`4a99512`), Find Map flag size + ecosystem back-button standardization at 38/18/1.6 (`8211a31`). Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within session. New `<PhotoLightbox>` + `<FlagGlyph>` primitives. TR-n added (multi-element-glyph strokeWidth-0 trap, fire count 1).
- **Session 60** (2026-04-25) — R3 stuck-Fluid-Compute-instance theory disproved (fresh deploy `d3f2d6b` immediately served the same 25-min-stale snapshot). Confirmed Vercel + local share identical Supabase URL + service-role key + length, but admin Events route still returns stale rows where local script via the same key sees fresh ones. Cheap diagnostics exhausted; mystery parked. TR-l promoted 🟡 → 🟢 promotion-ready.
- **Session 59** (2026-04-25) — Two-track. (1) Doc architecture refactor — CLAUDE.md cut 41,739 → 21,652 chars (-48% per auto-load), new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template. (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom. On-device Refresh-button verification deferred to session 60.
- **Session 58** (2026-04-25) — R3 (Analytics event capture) design-to-Ready + implementation in one session. Events table on prod via migration 010, anon SELECT revoked via migration 011, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters. Visibility tooling (debug toast + diagnostic script + verbose logs) shipped as institutional QA infrastructure. Commits `ba888b3` → `f1e1fd5` (7 commits + close). Two display-layer bugs deferred to session 59.

---

## CURRENT ISSUE
> Last updated: 2026-04-25 (session 63 close — home-page polish shipped: editorial vendor CTA card + masthead profile-icon swap; feed content seeding still pending)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, **63**. **Top priority** — the actual V1 unblocker. **The case keeps strengthening session over session.** After session 63, the home page itself now reads as visibly more polished (editorial banner CTA at the bottom of feed + cleaner sans-serif masthead with profile-icon for guests). Combined with session 62 (tag-capture in Add Find, ~2× faster + 100% tag-title accuracy), session 61 (lightbox + flag glyph + relative timestamps), and session 57 (Q-002 picker revision) — every surface a beta vendor or guest would land on this week looks better than it did when feed content seeding was first deferred 8 sessions ago. Seeded content showcases a genuinely-better experience end-to-end.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps, find-detail with lightbox, my-shelf, public shelf, new editorial vendor CTA at feed bottom).
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster (Sentry breadcrumbs vs. cobbled-together log substring searches).
3. **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 64 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped, the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 63 layered on home-page polish: editorial vendor CTA card replaces the centered-pill footer; masthead right slot is now sans-serif "Sign out" text for auth'd users + a 22px CircleUser icon (1.4 stroke) for guests linking to /login. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom). Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery from session 60 still parked — root cause unknown after exhausting cheap diagnostics. Pick R3 back up only if symptom freshly reproduces; cheapest next probe is `/api/admin/events-raw` via bare fetch() to bypass supabase-js (~10 min including deploy). Verbose diag logs in `/api/admin/events/route.ts` stay in place until R3 closes. Tag-extraction analytics events (`tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped`) intentionally NOT wired session 62 or 63 — natural follow-up after R3 stable. Sign-in icon discoverability is a session-63 watch-item; check during beta whether new users find the masthead profile glyph.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–63. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–63. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), and the home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead). Seeded content will showcase a genuinely better experience end-to-end.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n (multi-element-glyph strokeWidth=0 trap, fire count 1). Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 63 added no new TR candidates. Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (NEW session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–62 missing from `docs/session-archive.md` (54–55 since session 54, 57–62 accumulating since their respective closes). Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. **Session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts, no extra wiring needed); masthead right slot inverts — guests now see a 22px CircleUser icon (1.4 stroke) → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. Two design arcs in one session — clean mockup-first arc on the CTA (v1 direction picker α/β/γ → v2 button-font A/B → ship), and a small masthead micro-pivot that captured a new feedback memory (ask which state changes before proposing prose variants). Home page is now visibly more polished end-to-end: feed render (lightbox + timestamps + flag glyph from session 61) + Add Find flow (tag-capture from session 62) + footer CTA + masthead chrome (session 63). Feed content seeding remains pending, now bumped 6× — but the case is also stronger 6× now since every surface a beta vendor or guest would land on this week looks better than at the start of the deferral chain.** Next natural investor-update trigger point remains after feed content seeding + R3 stabilizes — the update would report R4c + R3 + tag-capture (the V1 vendor unlock) + the session-61/63 polish passes all shipped, plus the session-62 testbed-first pattern as durable institutional approach for future AI/LLM-dependent features.
