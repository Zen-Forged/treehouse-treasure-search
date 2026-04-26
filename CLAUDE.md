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

## ✅ Session 65 (2026-04-26) — R12 Sentry exception capture shipped end-to-end on prod

Single-track Horizon-1 roadmap session. Three runtime commits, all 🟢 build-clean, all live on prod by session close. Sentry now captures both client-side and server-side exceptions from kentuckytreehouse.com with source maps, PII scrubbing, ad-blocker bypass, and email alerts firing. **R12 — the first item from `docs/roadmap-beta-plus.md` Horizon-1 cluster G (Instrumentation) since R3 in session 58 — is shipped.**

The session ran in five beats:

1. **Standup pivot from feed content seeding to R12.** Recommended move was feed content seeding (still pending — bumped 7× across sessions 55, 60, 61, 62, 63, 64). David picked R12 from the alternatives list ("Alt 2: R12 Error monitoring (Sentry) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster"). Per `feedback_ask_which_state_first.md`, surfaced 3 load-bearing decisions before drafting the sprint brief: D1 tool (Sentry vs Vercel-native vs both) → Sentry; D2 alert channel (email vs email+iPhone push vs Slack/SMS) → email + iPhone push; D3 scope (exception only vs +structured logs vs +Replay) → exception only. Decisions locked in two short messages, sprint brief written immediately after.

2. **Wizard install + tightening + Vercel integration** (commit `81a52c4`). Ran `npx @sentry/wizard@latest -i nextjs --saas`, picked "Yes" to ad-blocker tunnel route (`/monitoring`), opted out of editor MCP configs (David accidentally selected "none" — Sentry MCP for Claude Code is a one-time follow-up if we want it). Wizard created `instrumentation.ts` + `instrumentation-client.ts` + `sentry.server.config.ts` + `sentry.edge.config.ts` + `app/global-error.tsx` + `app/sentry-example-page/` + `app/api/sentry-example-api/`, wrapped `next.config.js` with `withSentryConfig`. Tightened all three Sentry configs immediately: `sendDefaultPii: false`, removed Replay integration + zeroed sample rates, added shared [`lib/sentry-scrub.ts`](lib/sentry-scrub.ts) `beforeSend` hook stripping user emails/usernames/IPs + cookies + auth headers as defense-in-depth, `tracesSampleRate: 1.0`. Cleaned up the awkward double `module.exports` the wizard left in `next.config.js`. Hit one type mismatch (`beforeSend` uses `ErrorEvent`, not `Event` — transactions go through `beforeSendTransaction` separately); fixed in same commit. **Sentry-Vercel Marketplace integration auto-pushed 8 env vars to Vercel** (`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NEXT_PUBLIC_SENTRY_DSN`, plus 4 unconsumed extras for log-drain features) — zero manual paste, auto-rotates.

3. **Smoke-test → Next.js 14 wrap-route fix** (commit `265430f`). First smoke-test caught `SentryExampleFrontendError` in 17s end-to-end (button click → dashboard) but NOT the API-route error despite the example page calling `/api/sentry-example-api` and the API throwing. Investigated three hypotheses: (A) filter-view issue → ruled out by refresh; (B) `experimental.instrumentationHook` not set → ruled out by reading `@sentry/nextjs` source confirming `withSentryConfig` auto-injects it on Next.js 14.x; (C) Next.js 14 framework swallows route-handler throws before Sentry's auto-capture sees them → CONFIRMED. Sentry's `Sentry.captureRequestError` callback (the `onRequestError` hook in `instrumentation.ts`) is a Next.js 15 feature; on 14.2 it's a no-op. Fix: manually wrap route handlers with `Sentry.wrapRouteHandlerWithSentry`. Applied to the example API route + redeployed. Second smoke-test: both `SentryExampleFrontendError` (3 events) AND `SentryExampleAPIError` (2 events, transaction `GET /api/sentry-example-api`) appeared in the dashboard with proper trace correlation. **Bonus discovery:** Sentry's "Seer Autofix" AI feature surfaced "The explicit frontend error is likely thrown after a failed API call (500 status) to /api/sentry-example-api" automatically — the kind of correlation that would have shortened session-60's R3 investigation by hours.

4. **Email alerts confirmed + iPhone push retreat.** Default Sentry email alert rule firing on every new issue confirmed by David. Tried the iPhone-app path next — I had asserted "Sentry has an official iPhone app, install it" without verifying. David came back with "I don't see the Sentry app, there are a lot of Sentry-labeled apps." Retracted, pivoted to email-VIP path (iOS Mail VIP or Gmail label-based push) which uses guaranteed-working iOS-native primitives. David picked email-only, no push. Lesson captured as new feedback memory `feedback_verify_third_party_software_exists.md` (see Memory updates).

5. **Cleanup + CONTEXT.md breadcrumb** (commit `0ecd6b8`). Deleted `app/sentry-example-page/` + `app/api/sentry-example-api/` (smoke-test served its purpose; not a permanent surface). Added Sentry to [`CONTEXT.md`](CONTEXT.md) §2 Tech Stack with dashboard URL, §3 Env Vars with the integration-managed Sentry block, and §13 Next.js 14 gotchas with the `wrapRouteHandlerWithSentry` pattern future sessions will need for any new `/api/*` route until Next.js 15 upgrade lands.

**Final state in production (as of `0ecd6b8`):**
- Client-side exception capture (browser global handlers + React top-level error boundary via `app/global-error.tsx`)
- Server-side capture via wrap-route pattern (Next.js 14.2 workaround)
- Edge runtime capture
- Source-map upload from Vercel build (release `81a52c40eccf` tag attached, distributed traces with IDs visible in dashboard)
- PII scrubbing: `sendDefaultPii: false` + `lib/sentry-scrub.ts` `beforeSend` (verified on prod — Users column is 0 across both example issues, confirming no IP-derived user IDs leak)
- Tunnel route `/monitoring` bypassing ad-blockers
- 100% trace sampling (beta-appropriate; reconsider at scale)
- Email alert rule firing on every new issue → David's inbox
- Vercel-Sentry Marketplace integration auto-syncing + auto-rotating credentials

**Commits this session (3 runtime + 1 close):**

| Commit | Message |
|---|---|
| `81a52c4` | feat(sentry): R12 exception capture — Next.js wizard + tightened config |
| `265430f` | fix(sentry): wrap example API route with wrapRouteHandlerWithSentry |
| `0ecd6b8` | chore(sentry): remove wizard example pages + add CONTEXT.md breadcrumb |
| (session close) | docs: session 65 close — R12 Sentry exception capture shipped end-to-end |

**What's broken (carry to session 66):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged from sessions 60–64. Now newly investigable via Sentry breadcrumbs + distributed traces if it freshly reproduces (R12's most immediate compounding benefit).
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried unchanged.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — bumped now from sessions 55, 60, 61, 62, 63, 64, **65**. The V1 unblocker. Eight sessions of polish + observability layered on top — every surface a beta vendor or guest lands on this week is better-instrumented (Sentry now catches errors silently) and better-polished than at the start of the deferral chain. **Top recommended next session.**
- 🟡 **Tag-extraction analytics events** — carried unchanged.
- 🟢 **Sign-in icon discoverability** — session-63 watch-item, unchanged.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **NEW: Existing `/api/*` routes are unwrapped re Sentry** — session-65 limitation. New routes need `Sentry.wrapRouteHandlerWithSentry` per the `CONTEXT.md` §13 gotcha. Existing routes (~25 total under `app/api/`) silently swallow throws at the Next.js 14 framework level. Acceptable for now since most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- 🟡 **NEW: Q-013 candidate — Next.js 15 upgrade** — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate the manual-wrap pattern across `/api/*`, and unlock newer Sentry SDK features. Not urgent — Sentry works fine on 14.2 with the workaround. Backlog item for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive (e.g. Cache Components per Vercel knowledge update).

**Memory updates:**

- **NEW** `feedback_verify_third_party_software_exists.md` — when prescribing that the user install an app, run a CLI, or use a named feature, verify the named thing exists at the named location BEFORE asserting it. Don't send the user on a hunt for software whose existence I haven't checked. If uncertain, WebSearch first OR pivot to a guaranteed-working alternative. Captured because session 65 sent David hunting for a "Sentry iPhone app" whose existence/maintenance status was uncertain. Generalizes the computer-use MCP "Look before you assert" rule beyond computer-use.

Existing memories that load-bore the session:
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all three runtime commits ✅. No drift.
- `feedback_ask_which_state_first.md` (session 63) — applied at standup before drafting the sprint brief (D1/D2/D3 surfaced + locked in two messages). Same effectiveness as session 64's D1–D4 round.
- `feedback_testbed_first_for_ai_unknowns.md` (session 62) — the Sentry smoke-test arc was testbed-first applied to a non-AI integration: ship the wizard's example page → click button → confirm dashboard receives → only THEN declare R12 done. Same shape; same value.

**Live discoveries:**

- **Vercel Marketplace integrations sync env vars across all project envs in seconds.** The Sentry-Vercel integration ran in <60s end-to-end (Sentry side install → click "Complete on Vercel" → 8 vars appear in Vercel with correct production/preview/development scopes). Zero manual paste, auto-rotation handled. Same shape applies to other Marketplace integrations (databases, auth providers, CMS). When the user is wiring a new external service to Vercel, default to the Marketplace integration path before manual env-var paste — it's lower-maintenance long-term.

- **Sentry's wizard generates a "starting point," not a "done state."** Wizard defaults shipped `sendDefaultPii: true` (would leak vendor emails on every error), `replayIntegration` enabled with 10% session sampling (D3 explicitly out-of-scope, plus PII concerns), `enableLogs: true` (deferred). All three needed an audit-and-tighten pass before the first commit. Generalizable: any third-party install wizard creates a config you should audit for security/scope/cost before letting it ship. Compounds with `feedback_visibility_tools_first.md` (audit before trusting any auto-generated infrastructure).

- **Next.js 14 vs 15 has a real Sentry-feature gap.** `onRequestError` (the cleanest server-side capture path) is a Next.js 15 feature — on 14.x, the equivalent is manual route-handler wrapping with `wrapRouteHandlerWithSentry`. This is the kind of subtle version-specific gap that a "smoke test against the real platform" catches but a "read the docs and ship" path doesn't. Reinforces TR-p / `feedback_testbed_first_for_ai_unknowns.md` — testbed-first applies to platform-version assumptions too, not just AI/LLM call accuracy.

- **Sentry's "Seer Autofix" AI surfaces correlations across distributed traces automatically.** The example smoke-test produced two errors (frontend + backend); Seer immediately wrote "The explicit frontend error is likely thrown after a failed API call (500 status) to /api/sentry-example-api." This is the kind of correlation that would have shortened session-60's R3 investigation. Worth knowing: when a future bug fires post-Sentry, check the Sentry trace view + Seer panel BEFORE diving into Vercel logs.

**Operational follow-ups:** No new entries beyond the carry list above + Q-013 candidate. Archive-drift unchanged (sessions 54 + 55 + 57–64 missing from `docs/session-archive.md` — pure docs-housekeeping; no signal lost). Sentry MCP for Claude Code not yet wired — David picked "none" during the wizard's editor selection; one-time follow-up to add a `.mcp.json` block if we want Sentry queryable from inside future sessions (would have shortened session-60 R3 investigation similarly).

**Tech Rule candidates:** Existing TR-l + TR-m + TR-n + TR-p still 🟢 promotion-ready / 🟡 fire-count-low (unchanged). The new `feedback_verify_third_party_software_exists.md` may become TR-r in the future if it fires again — but session 65 is the inaugural firing; need a second instance before formalizing as a TR. Captured in memory for now. The "Vercel Marketplace integration > manual env paste" pattern is similar in shape to TR-l / TR-m and `feedback_visibility_tools_first.md` — could become a TR after another firing; currently captured as a live discovery rather than a separate rule.

**Notable artifacts shipped this session:**
- [`lib/sentry-scrub.ts`](lib/sentry-scrub.ts) — shared `beforeSend` PII scrubber. First lib/-level Sentry primitive in the codebase; reusable shape for future capture-side modifications (rate-limiting events, suppressing known-noisy errors, scrubbing newly-discovered sensitive keys).
- [`app/global-error.tsx`](app/global-error.tsx) — App Router top-level error boundary. First of its kind in the codebase; future renderer-level errors at the root layout now get captured cleanly.
- `instrumentation.ts` + `instrumentation-client.ts` + `sentry.{server,edge}.config.ts` — runtime init plumbing. Generates the Sentry SDK lifecycle on each runtime; not really "components" per se but worth knowing they exist when a future session needs to add custom initialization.
- [`CONTEXT.md`](CONTEXT.md) updates — three places: §2 Tech Stack (Sentry row + dashboard URL), §3 Env Vars (Sentry block flagged "auto-managed by integration — do not set manually"), §13 Next.js 14 gotchas (`wrapRouteHandlerWithSentry` pattern with code snippet for any new `/api/*` route). Future sessions reading CONTEXT.md cold will know what exists, where to look in production, and how to extend it without re-deriving the gotcha.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–64 still missing — operational backlog growing).

- **Session 64** (2026-04-25) — Pivot session, net code-state zero. TreehouseOpener RN→web port shipped (`c9043c8`) + reverted same session (`1946ddd`) after iPhone QA didn't aesthetically land; parked as Q-012 in `docs/queued-sessions.md` for full Design redesign (wood-frame metaphor explicitly off the table). New `feedback_still_frame_before_animation_port.md` memory (animation-specific cousin of testbed-first rule).
- **Session 63** (2026-04-25) — Home page polish: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the discovery-feed footer (commit `4d96f44`); also auto-fronts the empty-state when a mall has no posts (single placement, dual context). Masthead profile-icon micro-pivot took two passes (`5c0dded` → reversed by `1c66531`) — final state: 22px CircleUser at 1.4 stroke for guests → /login, sans-serif "Sign out" text for signed-in users. Two new feedback memories captured: no Co-Authored-By footer + ask-which-state-first.
- **Session 62** (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on iPhone QA. Six commits across four phases: chat-architecture (D1–D8 frozen) → mockup + design record (`32f8ef4`) → testbed-first prompt validation (`e77e77b`, handwritten tags 100% pass first try) → 3-phase integration (`1b9a157` foundation + `eb9dfa6` consumer + `f129aa2` producer). Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review prefills with green "from tag" pills; skip is one-tap fallback. 4/4 acceptance criteria passed. TR-p added (testbed-first for AI/LLM unknowns, fire count 1).
- **Session 61** (2026-04-25) — Six-commit UX polish pass shipped end-to-end on iPhone QA. Admin hero image delete (`9a26485`), Find Detail full-screen photo lightbox with pinch-zoom (`e694adc`), feed relative timestamps below tile (`b565221`), feed adjustments + heart→pushpin (`f73c6e3`), pushpin → flag-on-pole save glyph across 4 callsites (`4a99512`), Find Map flag size + ecosystem back-button standardization at 38/18/1.6 (`8211a31`). Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within session. New `<PhotoLightbox>` + `<FlagGlyph>` primitives. TR-n added (multi-element-glyph strokeWidth-0 trap, fire count 1).
- **Session 60** (2026-04-25) — R3 stuck-Fluid-Compute-instance theory disproved (fresh deploy `d3f2d6b` immediately served the same 25-min-stale snapshot). Confirmed Vercel + local share identical Supabase URL + service-role key + length, but admin Events route still returns stale rows where local script via the same key sees fresh ones. Cheap diagnostics exhausted; mystery parked. TR-l promoted 🟡 → 🟢 promotion-ready.

---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 65 close — R12 Sentry exception capture shipped end-to-end on prod; feed content seeding still pending — now 8× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session:** Sentry now catches client + server exceptions silently in production — the next mystery has observability behind it. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, 64, **65**. **Top priority** — the actual V1 unblocker. Session 65 shipped R12 (Sentry) but did nothing to the home page; the polish-and-instrumentation argument from sessions 61–64 holds verbatim, and now compounds: every surface a beta vendor or guest lands on this week is both more polished AND more observable than at the start of the deferral chain (session 61 lightbox + flag glyph + timestamps · session 62 tag-capture ~2× faster + 100% title accuracy · session 63 editorial CTA + sans masthead · session 65 silent error capture means the first beta bug surfaces in Sentry instead of disappearing). Eight sessions of layered polish + observability; zero new reasons not to seed content.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom). Watch Sentry dashboard during the walk — if any new issues appear, that's a real V1 bug we want to know about before beta.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support. **Bonus this session:** if R3 freshly fires post-Sentry, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
2. **Q-013 candidate — Next.js 15 upgrade** (~1–2 sessions) — would auto-fix the wrap-route requirement (`onRequestError` becomes native, no more manual `wrapRouteHandlerWithSentry` per route). Also unlocks newer features like Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Worth doing if other Next.js 15 features become attractive.
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured session 64 in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012. Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 66 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped, the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 63 layered on home-page polish (editorial vendor CTA + sans-serif masthead). Session 64 was a pivot session (TreehouseOpener RN-port shipped + reverted; see Q-012). Session 65 shipped R12 — Sentry exception capture is now live on prod (zen-forged.sentry.io/issues/?project=4511286908878848), so any error during the seeding walk surfaces in the Sentry dashboard instead of disappearing. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom) — keep the Sentry dashboard open during the walk and treat any new issue as a V1 bug worth investigating. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked (now investigable via Sentry traces if it fires). Tag-extraction analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation; new routes need it per CONTEXT.md §13). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. **NEW session 65:** R3 is now newly investigable via Sentry breadcrumbs + distributed traces — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–65. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–65. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 + 65 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead), AND every error during the seeding walk now surfaces in Sentry instead of disappearing. Session 64 was a pivot pass with no net change. Seeded content will showcase a genuinely better experience end-to-end with observability behind it.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n. Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 64 captured `feedback_still_frame_before_animation_port.md` (animation-specific cousin of TR-p; could become TR-q on second firing). Session 65 captured `feedback_verify_third_party_software_exists.md` (could become TR-r on second firing) and a "platform-managed env > manual paste" pattern as a live discovery (TR candidate after another firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–64 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts); masthead right slot inverts — guests now see a 22px CircleUser icon → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. Session 64 was a pivot pass that net-zeroed: the home-page TreehouseOpener animation (originally arrived as broken React Native code in the working tree) was rebuilt as a framer-motion + CSS web component (commit `c9043c8`), wired into `/` with first-visit-only mobile-only gating + tap-to-skip — but on iPhone QA "the first pass looked pretty terrible," so reverted (`1946ddd`) and parked as Q-012 for a full Design redesign session. New `feedback_still_frame_before_animation_port.md` — animation-specific cousin of the testbed-first rule from session 62. **Session 65 shipped R12 (Error monitoring / Sentry) end-to-end on prod — the FIRST Horizon-1 cluster-G item since R3 in session 58, and the first beta-grade observability infrastructure on the codebase.** Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb), all live on prod. Sentry now captures both client-side errors (browser handlers + App Router top-level error boundary) and server-side errors (manual wrap pattern for Next.js 14.x routes). Source maps upload from Vercel build, PII scrubbing on (`sendDefaultPii: false` + `lib/sentry-scrub.ts` `beforeSend` strips emails/IPs/cookies), tunnel route `/monitoring` bypasses ad-blockers, email alerts firing on every new issue. Vercel-Sentry Marketplace integration auto-syncs + auto-rotates 8 env vars (zero manual paste, recommended pattern for any future external-service wiring). Dashboard at https://zen-forged.sentry.io/issues/?project=4511286908878848. New durable institutional output: `feedback_verify_third_party_software_exists.md` (don't assert "install the X app" without verifying X exists — generalizes the computer-use "Look before you assert" rule). Two follow-up gaps captured: existing `/api/*` routes are unwrapped (Next.js 14 limitation; new routes need explicit wrap) + Q-013 candidate Next.js 15 upgrade would auto-fix it. Feed content seeding still pending, now 8× bumped — case strengthens further: every surface a beta vendor or guest lands on this week is now both more polished AND more observable than at the start of the deferral chain. Next natural investor-update trigger point remains after feed content seeding lands — the update would report R4c + R3 + tag-capture + R12 as the four shipped roadmap items, plus the session-62 testbed-first + session-64 still-frame-before-port + session-65 verify-third-party-software-exists patterns as durable institutional approaches.
