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

## ✅ Session 66 (2026-04-26) — Exec-facing functionality overview doc + Treehouse Lens port to vendor surfaces

Two-track session, both shipped end-to-end on prod, both approved on iPhone walk by session close. Two runtime/docs commits + one close commit, all 🟢 build-clean. **First session in the arc to ship a polished externally-shareable artifact (Word doc) alongside repo-source markdown — distinct from internal docs that have been the norm so far.** Track 2 closed a known parity gap between the reseller layer (rich photo treatment) and the ecosystem layer (raw photos) without touching the upload path or AI flows.

The session ran in three beats:

1. **Pivot from feed content seeding to an exec-facing functionality doc.** Recommended move at standup was feed content seeding (8× bumped through session 65). David asked instead for "a document that shows all of the current functionality within the app — high level document for executives." Per `feedback_ask_which_state_first.md`, surfaced 3 framing decisions (D1 audience / D2 scope / D3 format) before drafting. David picked: D1(d) hybrid generalist, D2(a) ecosystem only, D3(b) short tour ~3-4 pages. On format, David said "open to suggestions" — recommended Word doc primary + markdown source committed (slides as optional follow-up). Reason: dense narrative content grouped by user role; doc prints to PDF cleanly, reads on iPhone, universally openable across audiences. **Shipped:** [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) committed in `0a4d763` + polished Word doc at `~/Desktop/treehouse-finds-functionality-overview.docx` generated via the docx skill (75 paragraphs, 1 audience table, US Letter, forest-green Heading 1 styling tying back to the in-app `#1e4d2b` accent, warm-cream metadata callout block). The markdown source becomes durable repo memory; future "rebuild the functionality doc" requests pull from it without re-scoping content.

2. **Scope + ship the Treehouse Lens port to vendor-photo surfaces.** Originally a "treehouse lens filter exists on the reseller side which is not in production — let's incorporate this into the image capture/add find section for vendors" prompt. **Pivoted scope on discovery** from "AddFindSheet capture-time filter" to "every find-photo render surface" because Explore agent revealed the reseller-side lens is **non-destructive preview-only** (canvas op outputs filtered display, but unfiltered original goes to the AI). That mental model carries over cleanly to the ecosystem. Surfaced D1/D2/D3 again: D1(b) non-destructive (CSS at render time vs canvas baked into upload), D2(a) silent auto (no vendor toggle), D3(a) one fixed value. David locked all three recommendations + the three sub-decisions (CSS-filter approximation over SVG `feColorMatrix` exact port; `/post/preview` shows lensed too; lightbox shows lensed). **Shipped (`2367676`):** new [`lib/treehouseLens.ts`](lib/treehouseLens.ts) primitive exporting `TREEHOUSE_LENS_FILTER = "contrast(1.08) saturate(1.05) sepia(0.05)"` + `treehouseLensStyle` object — a CSS approximation of the reseller canvas op (red +6% / blue −8% / contrast +8%). Wired to 8 surfaces in one commit:
   - `/` Discovery feed masonry tiles ([`app/page.tsx`](app/page.tsx))
   - `/find/[id]` full-bleed photo + ShelfCard ([`app/find/[id]/page.tsx`](app/find/[id]/page.tsx)) — sold treatment composes on top via `${LENS} grayscale(...) brightness(...)`
   - `/find/[id]` PhotoLightbox ([`components/PhotoLightbox.tsx`](components/PhotoLightbox.tsx)) — applied to the same `<img>` that already carries the pinch-zoom transform; CSS filter + transform compose without iOS Safari fighting either
   - `/flagged` Find Map saved-find tiles ([`app/flagged/page.tsx`](app/flagged/page.tsx))
   - `/my-shelf`, `/shelf/[slug]`, `/vendor/[slug]` booth tiles ([`components/BoothPage.tsx`](components/BoothPage.tsx) WindowTile + ShelfTile)
   - `/post/preview` ([`app/post/preview/page.tsx`](app/post/preview/page.tsx)) — both the loading-state thumbnail AND the `<PhotographPreview>` component (the latter cascades to `/find/[id]/edit` for free)
   - Hero banners (vendor/mall/admin) and booth-proof photos deliberately untouched — chrome and verification, not finds.

3. **One deviation from the brief surfaced honestly.** `/mall/[slug]` was on the apply-to list but skipped this commit — that surface is still on v0.2 dark theme (`background: "#050f05"`) with an intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter. Replacing with the brightening lens against dark card chrome would create a stark visual mismatch. The lens applies cleanly when mall page does its v1.x ecosystem migration (already on the Sprint 5 follow-on list). Surfaced this in the post-implementation summary + commit message rather than slipping it in silently. David's iPhone walk verdict: "looks good right now. We may need to adjust later as more items in the real environment get captured but for now we're good." Shipped as-is; tuning becomes a one-line change to [`lib/treehouseLens.ts`](lib/treehouseLens.ts) when real seeded content reveals where the constant wants to land.

**Final state in production (as of `2367676`):**
- 8 ecosystem find-photo render surfaces apply the lens at CSS render time
- Original photo stored unchanged in Supabase Storage (non-destructive — no upload path touched)
- AI tag-extract + post-caption flows untouched (still see unfiltered originals — no accuracy regression)
- Sold treatments compose on top of the lens base (find detail grayscale, ShelfCard grayscale, PhotographPreview grayscale all keep working)
- Single source of truth at `lib/treehouseLens.ts` — tune in one place, every surface picks it up on next deploy
- Mall page (`/mall/[slug]`) intentionally lensless pending v1.x migration

**Commits this session (2 runtime + 1 close):**

| Commit | Message |
|---|---|
| `0a4d763` | docs: add app-functionality-overview — exec-facing tour of shipped capability |
| `2367676` | feat(lens): port Treehouse Lens to vendor-side render surfaces |
| (session close) | docs: session 66 close — exec functionality doc + Treehouse Lens port |

**What's broken / carried (unchanged from session 65 unless noted):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — unchanged.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — bumped from sessions 55, 60-65, **66**. Now 9× bumped. The case strengthens further this session: the lens explicitly needs real-world content to evaluate ("we may need to adjust later as more items in the real environment get captured" — David's verdict). The lens constant is calibrated against the synthetic seed data we have today; tuning it confidently requires seeing 10+ real vendor photos through it. **Top recommended next session.**
- 🟡 **Tag-extraction analytics events** — unchanged.
- 🟢 **Sign-in icon discoverability** — unchanged watch-item from session 63.
- 🟡 **Q-012 — Treehouse opener** — parked, unchanged.
- 🟡 **Existing `/api/*` routes unwrapped re Sentry** — unchanged from session 65.
- 🟡 **Q-013 candidate — Next.js 15 upgrade** — unchanged backlog.
- 🟡 **NEW: `/mall/[slug]` lensless on v0.2 dark theme** — known deviation from session 66's brief. Apply lens during the mall page's v1.x ecosystem migration (already on Sprint 5 follow-on list).
- 🟡 **NEW: Lens constant is provisional** — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos. Real vendor content this week may reveal it needs tuning. Adjustment shape captured in session 66's iPhone walk checklist (4 common dial directions). Single-line edit when needed.

**Memory updates:** None this session. The two patterns that were close to memory-worthy:

- **"Port a primitive from a non-prod layer to a prod layer"** as a workflow shape (discover → decide destructive vs non-destructive → decide silent vs UI-driven → decide preserve-as-is vs adapt). Too situation-specific to be a useful generalized rule on first firing; if a similar port arc happens again I'll formalize.
- **"Word doc primary + markdown source"** as the format default for shareable exec docs. Already implicit in the existing `mockup-first-as-default-not-exception` pattern from session 28; not enough new content to justify a separate memory file.

Existing memories that load-bore the session:
- `feedback_ask_which_state_first.md` (session 63) — applied twice this session: D1/D2/D3 for the doc shape, then D1/D2/D3 + sub-decisions for the lens scope. Both lock-ins took two short messages each. Pattern is durably useful.
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all three commits ✅. Three sessions running at perfect compliance.
- `feedback_visibility_tools_first.md` (session 60) — applied at the lens-scope phase: spawned an Explore agent to map the implementation rather than guessing from memory. The Explore findings revealed the non-destructive shape that load-beared D1(b).

**Live discoveries:**

- **Word doc + repo markdown is a one-shot pattern.** The docx skill takes ~30s to invoke and produces a polished file at the requested Desktop path. Combined with the markdown source committed to the repo, future sessions can re-export without re-scoping. Same shape would apply to slides (pptx skill) on demand. Worth knowing when an exec/investor/partner-facing doc is asked for.
- **CSS filter at render time is dramatically cheaper than canvas at upload time.** The lens implementation took ~1hr because the source primitive was a 23-line canvas function with no dependencies and the CSS approximation is a single string constant. The work was 90% applying the constant to N render sites + composing with existing sold filters. Generalizable: when a "filter" or "treatment" gets proposed, ask "render-time CSS or upload-time bake?" first — the cost difference is enormous.
- **The reseller layer is a useful staging ground for ecosystem features.** The lens lived in the reseller layer (not in prod) for a long time before this port. The pattern: ship a feature on a non-prod layer first as a working primitive, then port to the prod layer as a deliberate decision. May come up again — the reseller layer has other primitives (mock identification, comp pipeline, decision dial) that could plausibly migrate.
- **iOS Safari pinch-zoom + CSS filter compose cleanly on the same `<img>`.** Was the highest-risk part of the lens port (PhotoLightbox uses `transform: translate + scale` and CSS filter on the same element); David's iPhone walk confirmed no jank or render stuttering. Useful precedent for future filter+gesture interactions.

**Operational follow-ups:** No new entries beyond the carry list. Archive-drift unchanged (sessions 54 + 55 + 57-65 missing from `docs/session-archive.md` — pure docs-housekeeping, signal preserved in CLAUDE.md tombstones + commit messages). Sentry MCP not yet wired (session 65 follow-up).

**Tech Rule candidates:** No new candidates this session. Existing TR-l + TR-m + TR-n + TR-p still 🟢 promotion-ready / 🟡 fire-count-low (unchanged). Session 65's `feedback_verify_third_party_software_exists.md` still at fire count 1 — would need a second instance before formalizing as TR-r. The "render-time CSS over upload-time bake" pattern from this session's live discoveries is similar in shape to TR-p (testbed-first) and is captured as a live discovery rather than a separate rule for now.

**Notable artifacts shipped this session:**
- [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) — first repo-source exec-facing artifact. Future "rebuild the functionality doc" pulls from this without re-scoping.
- [`lib/treehouseLens.ts`](lib/treehouseLens.ts) — single-source-of-truth CSS filter primitive. First lib/-level render-time filter primitive in the codebase; reusable shape if other treatments land later (e.g. "vintage variant," "mall-specific lens").
- `~/Desktop/treehouse-finds-functionality-overview.docx` — the polished Word doc. Lives outside the repo by design (export artifact, not source). Re-generates on request via the docx skill.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–65 still missing — operational backlog growing).

- **Session 65** (2026-04-26) — R12 Sentry exception capture shipped end-to-end on prod. Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb). Client-side + server-side error capture live, source maps + PII scrubbing on, email alerts firing. Vercel-Sentry Marketplace integration auto-syncs 8 env vars. New `feedback_verify_third_party_software_exists.md` memory.
- **Session 64** (2026-04-25) — Pivot session, net code-state zero. TreehouseOpener RN→web port shipped (`c9043c8`) + reverted same session (`1946ddd`) after iPhone QA didn't aesthetically land; parked as Q-012 in `docs/queued-sessions.md` for full Design redesign (wood-frame metaphor explicitly off the table). New `feedback_still_frame_before_animation_port.md` memory (animation-specific cousin of testbed-first rule).
- **Session 63** (2026-04-25) — Home page polish: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the discovery-feed footer (commit `4d96f44`); also auto-fronts the empty-state when a mall has no posts (single placement, dual context). Masthead profile-icon micro-pivot took two passes (`5c0dded` → reversed by `1c66531`) — final state: 22px CircleUser at 1.4 stroke for guests → /login, sans-serif "Sign out" text for signed-in users. Two new feedback memories captured: no Co-Authored-By footer + ask-which-state-first.
- **Session 62** (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on iPhone QA. Six commits across four phases: chat-architecture (D1–D8 frozen) → mockup + design record (`32f8ef4`) → testbed-first prompt validation (`e77e77b`, handwritten tags 100% pass first try) → 3-phase integration (`1b9a157` foundation + `eb9dfa6` consumer + `f129aa2` producer). Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review prefills with green "from tag" pills; skip is one-tap fallback. 4/4 acceptance criteria passed. TR-p added (testbed-first for AI/LLM unknowns, fire count 1).
- **Session 61** (2026-04-25) — Six-commit UX polish pass shipped end-to-end on iPhone QA. Admin hero image delete (`9a26485`), Find Detail full-screen photo lightbox with pinch-zoom (`e694adc`), feed relative timestamps below tile (`b565221`), feed adjustments + heart→pushpin (`f73c6e3`), pushpin → flag-on-pole save glyph across 4 callsites (`4a99512`), Find Map flag size + ecosystem back-button standardization at 38/18/1.6 (`8211a31`). Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within session. New `<PhotoLightbox>` + `<FlagGlyph>` primitives. TR-n added (multi-element-glyph strokeWidth-0 trap, fire count 1).

---

## CURRENT ISSUE
> Last updated: 2026-04-26 (session 66 close — exec-facing functionality overview doc + Treehouse Lens shipped end-to-end on prod; feed content seeding still pending — now 9× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NEW this session:** every vendor-posted photo now renders through the Treehouse Lens (CSS filter at render time), giving the ecosystem layer a unified warm/contrast brand treatment that mirrors the long-isolated reseller-layer canvas op. Plus first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) for sharing the product story externally without re-scoping. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, 64, 65, **66**. **Top priority** — the actual V1 unblocker, **and now compounding with the lens**. Session 66 shipped the Treehouse Lens against synthetic seed data; the constant (`contrast(1.08) saturate(1.05) sepia(0.05)`) is calibrated against today's content but tuning it confidently requires seeing 10+ real vendor photos through it. Every other argument from sessions 61–65 holds verbatim: surface polish (lightbox, flag glyph, timestamps, editorial CTA, sans masthead) + observability (Sentry catching errors silently) + tag-capture speed (~2× faster Add Find). Nine sessions of polish + observability + brand treatment; zero new reasons not to seed content.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps + lens, find-detail with lightbox + lens, my-shelf, public shelf, editorial vendor CTA at feed bottom). Watch Sentry dashboard during the walk — if any new issues appear, that's a real V1 bug we want to know about before beta. **Lens calibration check:** judge the constant against the real photos. If too strong/too subtle, adjust [`lib/treehouseLens.ts`](lib/treehouseLens.ts) once and redeploy.
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support. Sentry traces + Seer Autofix panel are now first-look diagnostics before manual log-grepping.
2. **`/mall/[slug]` v1.x ecosystem migration + lens-apply** — session 66 deviation. The mall-profile grid is still on v0.2 dark theme (`background: "#050f05"`) with a darkening photo filter that fights the brightening lens. Worth doing as part of a coordinated visual migration of the page to v1.x ecosystem styling — would unblock applying the lens cleanly and make the mall page a brand-aligned shopper surface. Size M (~1 session); needs design scoping first per `mockup-first` rule.
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured session 64 in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012. Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 67 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 65 shipped R12 (Sentry exception capture live at zen-forged.sentry.io/issues/?project=4511286908878848). Session 66 shipped the Treehouse Lens — every vendor-posted photo across the ecosystem renders through a CSS filter (contrast +8%, saturation +5%, warm sepia tint) defined at lib/treehouseLens.ts. The lens constant is calibrated against synthetic seed data; this session is the natural time to judge it against real content. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom) — keep the Sentry dashboard open during the walk and treat any new issue as a V1 bug worth investigating. If the lens constant looks too strong/too subtle against real content, adjust lib/treehouseLens.ts once and redeploy. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery still parked (now investigable via Sentry traces if it fires). Tag-extraction analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63. /mall/[slug] is intentionally lensless on v0.2 dark theme pending its v1.x migration. Existing /api/* routes are not yet wrapped with Sentry.wrapRouteHandlerWithSentry (Next.js 14 limitation). Q-012 (Treehouse opener) and Q-013 candidate (Next.js 15 upgrade) parked.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes. R3 is investigable via Sentry breadcrumbs + distributed traces (session 65) — when it freshly fires, check the Sentry trace view + Seer Autofix panel BEFORE manual log-grepping.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–66. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–66. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 + 65 + 66 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead), every error during the seeding walk surfaces in Sentry instead of disappearing, AND every photo now renders through the Treehouse Lens for unified brand treatment. Session 64 was a pivot pass with no net change. Session 66 added a calibration imperative — the lens constant needs real-world photos to judge confidently. Seeded content will showcase a genuinely better experience end-to-end with observability + brand treatment behind it.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n. Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 64 captured `feedback_still_frame_before_animation_port.md` (animation-specific cousin of TR-p; could become TR-q on second firing). Session 65 captured `feedback_verify_third_party_software_exists.md` (could become TR-r on second firing) and a "platform-managed env > manual paste" pattern as a live discovery (TR candidate after another firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table; needs fresh visual direction, mockup-first.
- **Existing `/api/*` routes are unwrapped re Sentry** (NEW session 65) — Next.js 14.2 framework swallows route-handler throws before Sentry's auto-capture sees them. New routes need `Sentry.wrapRouteHandlerWithSentry` per [`CONTEXT.md`](CONTEXT.md) §13. Existing ~25 routes silently swallow errors at the framework level. Acceptable for now — most are Supabase passthroughs whose errors surface as generic 500s in Vercel logs anyway. Worth a separate retroactive-wrap pass if a real bug surfaces, OR auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (NEW session 65, parked) — would auto-fix the wrap-route requirement (`onRequestError` becomes native), eliminate manual wrapping across `/api/*`, and unlock Cache Components per Vercel knowledge update. Not urgent; Sentry works fine on 14.2 with the workaround. Backlog candidate for `docs/queued-sessions.md` if/when other Next.js 15 features become attractive.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — David accidentally selected "none" during the Sentry wizard's editor-config step. One-time fix: add a `.mcp.json` block to make Sentry queryable from inside future Claude Code sessions (would have shortened R3 investigation similarly to what Sentry's Seer Autofix already does).
- **`/mall/[slug]` lensless on v0.2 dark theme** (NEW session 66) — known deviation from session 66's Treehouse Lens brief. Mall page is still on v0.2 dark theme (`background: "#050f05"`) with intentional `brightness(0.82) saturate(0.76) sepia(0.05)` darkening filter that fights the brightening lens. Replacing without coordinated redesign would degrade the page; the lens applies cleanly when mall page does its v1.x ecosystem migration (already on Sprint 5 follow-on list). Captured in commit `2367676` summary. Worth promoting if the page becomes more visible during beta.
- **Treehouse Lens constant is provisional** (NEW session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)` was approved on iPhone walk against the synthetic seed photos available today. Real vendor content this week may reveal it needs tuning. Single-line edit at [`lib/treehouseLens.ts:6`](lib/treehouseLens.ts:6); cascades to every find-photo render surface on next deploy. Common adjustments captured in session 66's iPhone walk checklist (drop sepia → less warm; bump sepia → more warm; drop contrast → less punchy; bump contrast → more punchy).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts); masthead right slot inverts — guests now see a 22px CircleUser icon → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. Session 64 was a pivot pass that net-zeroed: the home-page TreehouseOpener animation (originally arrived as broken React Native code in the working tree) was rebuilt as a framer-motion + CSS web component (commit `c9043c8`), wired into `/` with first-visit-only mobile-only gating + tap-to-skip — but on iPhone QA "the first pass looked pretty terrible," so reverted (`1946ddd`) and parked as Q-012 for a full Design redesign session. New `feedback_still_frame_before_animation_port.md` — animation-specific cousin of the testbed-first rule from session 62. **Session 65 shipped R12 (Error monitoring / Sentry) end-to-end on prod — the FIRST Horizon-1 cluster-G item since R3 in session 58, and the first beta-grade observability infrastructure on the codebase.** Three commits (`81a52c4` wizard install + tightened config / `265430f` Next.js-14 wrap-route fix discovered via smoke-test / `0ecd6b8` cleanup + CONTEXT.md breadcrumb), all live on prod. Sentry now captures both client-side errors (browser handlers + App Router top-level error boundary) and server-side errors (manual wrap pattern for Next.js 14.x routes). Source maps upload from Vercel build, PII scrubbing on, tunnel route bypasses ad-blockers, email alerts firing on every new issue. Vercel-Sentry Marketplace integration auto-syncs + auto-rotates 8 env vars. Dashboard at https://zen-forged.sentry.io/issues/?project=4511286908878848. New durable institutional output: `feedback_verify_third_party_software_exists.md`. **Session 66 ran two parallel tracks, both shipped end-to-end on prod by close.** Track 1 created the first repo-source exec-facing artifact at [`docs/app-functionality-overview.md`](docs/app-functionality-overview.md) (commit `0a4d763`) + a polished Word doc export at `~/Desktop/treehouse-finds-functionality-overview.docx` for sharing with investors/partners/internal review without re-scoping. Track 2 ported the Treehouse Lens — a non-destructive CSS render-time photo filter mirroring the long-isolated reseller-layer canvas op (red +6%, blue −8%, contrast +8%) — to every vendor-photo render surface in the ecosystem (commit `2367676`). New [`lib/treehouseLens.ts`](lib/treehouseLens.ts) is single source of truth (`contrast(1.08) saturate(1.05) sepia(0.05)`); 8 surfaces wired in one commit (Discovery feed, Find Detail full-bleed + ShelfCard, PhotoLightbox with pinch-zoom, Find Map, Booth tiles via BoothPage, /post/preview via PhotographPreview + loading state); sold treatments compose on top via `${LENS} grayscale(...) brightness(...)` so existing sold-state UX still works. Mall page deliberately skipped pending its own v1.x migration (intentional v0.2 dark-theme darkening filter conflicts with brightening lens). David's iPhone walk: "looks good right now. We may need to adjust later as more items in the real environment get captured but for now we're good." Constant tunes via single-line edit in lib if calibration shifts. Feed content seeding still pending, now **9× bumped** — case strengthens further: every surface a beta vendor or guest lands on this week is now polished + observable + brand-treated. Next natural investor-update trigger point remains after feed content seeding lands — the update would report R4c + R3 + tag-capture + R12 + the lens port as the five shipped capability items, plus the durable institutional outputs (testbed-first / still-frame-before-port / verify-third-party-software-exists / ask-which-state-first patterns + the new exec-facing doc artifact).
