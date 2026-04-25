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

## ✅ Session 64 (2026-04-25) — TreehouseOpener port shipped + reverted same session; Q-012 backlog entry created for full Design redesign

Single-track pivot session. Three runtime commits, all 🟢 build-clean, but **the net code-state outcome of the session is zero new features** — a foreign-runtime port shipped, didn't aesthetically land on iPhone QA, got reverted, and was parked as a queued session for a proper Design pass. The most durable outputs are (a) the institutional knowledge captured as a new feedback memory and (b) the Q-012 backlog entry that future-Claude can pick up cold.

The session ran in three beats:

1. **Standup pivot** — recommended move was feed content seeding (now 7× bumped from sessions 55, 60, 61, 62, 63, 64). Standup correctly surfaced two untracked files in working tree (`app/opener-preview/` + `components/TreehouseOpener.tsx`) — David had received an opener-animation intent doc from elsewhere. He redirected: "I don't think it's setup correctly." Standup-surfacing-untracked-state worked as designed.

2. **Diagnosis + port** (commit `c9043c8`) — files were React Native / Expo code (`react-native`, `react-native-reanimated`, `expo-linear-gradient`, `expo-blur`) in a Next.js web project. Wrong runtime; none of those deps installed. Proposed three paths (rebuild-as-web / delete / park). David picked rebuild. Asked four load-bearing decisions (D1 frequency, D2 skip affordance, D3 what's-behind-the-glass, D4 mobile/desktop) — all locked before code. Built `<TreehouseOpener>` as a framer-motion + CSS port preserving the original 4-phase beat structure (stillness 0.8s → frameIn 0.8s → sweep 0.9s → reveal 0.7s ≈ 3.2s total), wood-frame gradient, gold light sweep, glass blur via state-driven `backdrop-filter` + CSS transition (sidestepped a TS union-too-complex error from animating CSS custom properties through framer-motion's `initial`/`animate` props), `DefaultHomePreview` skeleton stand-in inside the inner window, `Embrace the search.` microcopy fade-during-sweep. Wired into [`app/page.tsx`](app/page.tsx) with localStorage flag `treehouse_opener_seen_v1`, `matchMedia('(max-width: 768px)')` mobile gate, tap-anywhere-to-skip. `/opener-preview` shipped as the dev route with replay button + remount-via-key pattern.

3. **iPhone QA + revert** (commits `1946ddd` + `83baeea`) — David tested on real iPhone: "first pass looked pretty terrible. I think we need a proper session to do this the right way." Reverted via `git revert` with a clean message preserving the design-intent recovery pointer. Then captured Q-012 in [`docs/queued-sessions.md:206`](docs/queued-sessions.md:206) — a parked 🟡 entry flagged as **"full redesign, not iteration"** with explicit framing that the wood-frame window metaphor is OFF the table for any future revisit, decisions D1–D4 are locked, and a pre-filled session opener so a future Claude can pick up cold. Static-frame mockup-first per the new feedback rule (see Memory updates).

**Commits this session (3 runtime + 1 close):**

| Commit | Message |
|---|---|
| `c9043c8` | feat(opener): port TreehouseOpener from RN to framer-motion web |
| `1946ddd` | revert: pull TreehouseOpener — first pass didn't land, defer to a proper Design session |
| `83baeea` | docs(queued-sessions): add Q-012 — Treehouse opener full Design redesign |
| (session close) | docs: session 64 close — opener port + revert + Q-012 backlog |

**What's broken (carry to session 65):**

- 🟡 **R3 admin Events stale-data mystery** — unchanged from sessions 60–63. Still well-characterized but root-cause-unknown. Cheapest probe (`/api/admin/events-raw` via bare `fetch()` bypassing `@supabase/supabase-js`) parked until symptom freshly reproduces.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried from sessions 59–63. Untouched.
- 🟡 **`filter_applied` count = 0** still unverified for FEED filter chips.
- 🟡 **Feed content seeding still pending** — bumped now from sessions 55, 60, 61, 62, 63, **64**. Remains the V1 unblocker. Seven sessions of polish layered on top — every surface a beta vendor or guest lands on this week looks better than at the start of the deferral chain. **Top recommended next session, no new reasons not to do it.**
- 🟡 **Tag-extraction analytics events** — carried unchanged from session 62. Worth doing once R3 stale-data resolves.
- 🟢 **Sign-in icon discoverability** — session-63 watch-item, unchanged.
- 🟡 **Q-012 — Treehouse opener** (NEW, parked). Full Design redesign needed. Captured in `docs/queued-sessions.md` with pre-filled session opener. Not in the immediate near term — feed content seeding takes priority.

**Memory updates:**

- **NEW** `feedback_still_frame_before_animation_port.md` — when porting visual/animation code from a foreign runtime (RN, AI-generated, external designer's source), draft a static peak-frame mockup in the target runtime BEFORE building the full component. Visual direction is killed cheaper at the static-mockup stage than at the working-code stage. Captured because the session-64 port shipped a faithful translation that ticked every spec checkbox but didn't aesthetically land — a single peak-frame mockup ("here's the wood-frame window centered on cream paper at the moment of the light sweep") would have killed the wood-frame metaphor in 5 seconds without any code. Animation-specific cousin of `feedback_testbed_first_for_ai_unknowns.md` — same shape, different specifics.

Existing memories that load-bore the session:
- `feedback_treehouse_no_coauthored_footer.md` (session 63) — applied to all three runtime commits this session ✅. Pattern held; no drift.
- `feedback_ask_which_state_first.md` (session 63) — applied when I asked D1–D4 before drafting the opener. Worked exactly as the rule predicted: David answered the four questions in two short messages, decisions locked before code. The cost-of-asking was tiny; the cost-of-guessing would have been guaranteed (wood-frame window without confirming "icon for sign-in or sign-out?"-style ambiguities up front).

**Live discoveries:**

- **The standup-surfaces-untracked-state pattern is load-bearing.** Session 64's pivot was only possible because the standup explicitly noted the untracked files. If the standup had skipped that and gone straight to "feed content seeding?" the opener mess would have shipped or sat unresolved longer. Worth preserving as a session-open default — surface working-tree state, even if the recommended move doesn't depend on it.
- **`backdrop-filter` animation via framer-motion's `initial`/`animate` props with CSS custom properties** triggers a TS "union type too complex" error in framer-motion v12.38 + TypeScript strict mode. Workaround: use plain React state for the value + apply via the CSS `transition` property on `style`. The browser handles the interpolation natively. Cleaner types, equivalent visual result. Worth knowing the next time someone wants to animate `backdrop-filter`, `filter`, or other complex CSS properties through framer-motion's declarative props.
- **Faithful translation of an intent doc ≠ good final result.** The session-64 port preserved every spec from the RN doc (timings, easings, color tokens, microcopy, beat structure) and still didn't land. Spec-completeness is a Dev metric. Aesthetic landing is a Design metric. They don't substitute for each other. The new feedback memory captures this as a generalizable rule.
- **Revert + queued-sessions-entry is the right close-out for a "didn't land" feature.** Cleaner than leaving the code in place hoping to iterate later, and cleaner than deleting silently. The git history preserves the implementation for design-intent recovery; the queued-sessions entry preserves the locked-in decisions (D1–D4) so a future session doesn't re-derive them. Three commits (port + revert + backlog) is the canonical shape.

**Operational follow-ups:** No new entries beyond the carry list above. Archive-drift unchanged: sessions 54 + 55 + 57–63 missing from `docs/session-archive.md` (pure docs-housekeeping; no signal lost).

**Tech Rule candidates:** Existing TR-l + TR-m + TR-n + TR-p still 🟢 promotion-ready / 🟡 fire-count-low (unchanged). The new feedback rule (still-frame mockup before animation port) MAY become TR-q in the future if it fires again — but session 64 is the inaugural firing; need a second instance before formalizing as a TR. Captured in memory for now.

**Notable artifacts shipped + reverted this session:**
- `c9043c8` (reverted by `1946ddd`) — `components/TreehouseOpener.tsx` framer-motion port + `app/opener-preview/page.tsx` dev route + `app/page.tsx` localStorage gating wiring. Preserved in git history for design-intent recovery only; not the direction.
- `docs/queued-sessions.md:206` — Q-012 entry for full Design redesign session, with pre-filled session opener and explicit "wood-frame window metaphor is OFF the table" framing.

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

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–63 still missing — operational backlog growing).

- **Session 63** (2026-04-25) — Home page polish: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the discovery-feed footer (commit `4d96f44`); also auto-fronts the empty-state when a mall has no posts (single placement, dual context). Masthead profile-icon micro-pivot took two passes (`5c0dded` → reversed by `1c66531`) — final state: 22px CircleUser at 1.4 stroke for guests → /login, sans-serif "Sign out" text for signed-in users. Two new feedback memories captured: no Co-Authored-By footer + ask-which-state-first.
- **Session 62** (2026-04-25) — Tag-capture step in Add Find flow shipped end-to-end on iPhone QA. Six commits across four phases: chat-architecture (D1–D8 frozen) → mockup + design record (`32f8ef4`) → testbed-first prompt validation (`e77e77b`, handwritten tags 100% pass first try) → 3-phase integration (`1b9a157` foundation + `eb9dfa6` consumer + `f129aa2` producer). Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review prefills with green "from tag" pills; skip is one-tap fallback. 4/4 acceptance criteria passed. TR-p added (testbed-first for AI/LLM unknowns, fire count 1).
- **Session 61** (2026-04-25) — Six-commit UX polish pass shipped end-to-end on iPhone QA. Admin hero image delete (`9a26485`), Find Detail full-screen photo lightbox with pinch-zoom (`e694adc`), feed relative timestamps below tile (`b565221`), feed adjustments + heart→pushpin (`f73c6e3`), pushpin → flag-on-pole save glyph across 4 callsites (`4a99512`), Find Map flag size + ecosystem back-button standardization at 38/18/1.6 (`8211a31`). Two mockup-first design arcs (timestamp placement + save glyph) iterated cleanly within session. New `<PhotoLightbox>` + `<FlagGlyph>` primitives. TR-n added (multi-element-glyph strokeWidth-0 trap, fire count 1).
- **Session 60** (2026-04-25) — R3 stuck-Fluid-Compute-instance theory disproved (fresh deploy `d3f2d6b` immediately served the same 25-min-stale snapshot). Confirmed Vercel + local share identical Supabase URL + service-role key + length, but admin Events route still returns stale rows where local script via the same key sees fresh ones. Cheap diagnostics exhausted; mystery parked. TR-l promoted 🟡 → 🟢 promotion-ready.
- **Session 59** (2026-04-25) — Two-track. (1) Doc architecture refactor — CLAUDE.md cut 41,739 → 21,652 chars (-48% per auto-load), new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template. (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom. On-device Refresh-button verification deferred to session 60.

---

## CURRENT ISSUE
> Last updated: 2026-04-25 (session 64 close — TreehouseOpener port shipped + reverted same session, parked as Q-012 for full Design redesign; feed content seeding still pending — now 7× bumped)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

Bumped from sessions 55, 60, 61, 62, 63, **64**. **Top priority** — the actual V1 unblocker. Session 64 made no net change to the home page (opener shipped + reverted), so the polish argument from session 63 still holds verbatim: every surface a beta vendor or guest lands on this week is more polished than at the start of the deferral chain (session 61 lightbox + flag glyph + timestamps · session 62 tag-capture ~2× faster + 100% title accuracy · session 63 editorial CTA + sans masthead). Seven sessions of layered polish; zero new reasons not to seed content.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + tags. With the tag-capture flow, the vendor takes 2 photos per post (item + tag) and the title + price prefill from the tag — much faster than today.
- 🟢 AUTO — Walk the Add Find → /post/tag → /post/preview flow for each, confirm tag prefill works on real-world content, confirm each lands on the right shelf and renders cleanly in the feed.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render with timestamps, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom).
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster (Sentry breadcrumbs vs. cobbled-together log substring searches).
3. **Q-012 — Treehouse opener full Design redesign** (~1 Design session + ~1 build session) — captured this session in [`docs/queued-sessions.md:206`](docs/queued-sessions.md:206). Pre-filled session opener. **Not** for the immediate near term; feed content seeding takes priority.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 65 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. With session 62's tag-capture flow shipped, the Add Find walk is now: take item photo → take tag photo → preview lands prefilled → publish. Session 63 layered on home-page polish: editorial vendor CTA card replaces the centered-pill footer; masthead right slot is now sans-serif "Sign out" text for auth'd users + a 22px CircleUser icon (1.4 stroke) for guests linking to /login. Session 64 was a pivot session (TreehouseOpener RN-port shipped + reverted same session — see Q-012 in docs/queued-sessions.md for the parked Design redesign); no net code-state change to the home page. Walk the Add Find flow on iPhone for ~10–15 real posts, source photos + tags, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces (feed render, find-detail with lightbox, my-shelf, public shelf, editorial vendor CTA at feed bottom). Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events stale-data mystery from session 60 still parked. Tag-extraction analytics events still deferred. Sign-in icon discoverability is a watch-item from session 63 — check during beta-feedback. Q-012 (Treehouse opener) is parked but ready to schedule once feed content seeding resolves the V1 gate.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched sessions 60–64. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–64. 10–15 real posts across 2–3 vendors. **Top-of-stack** as recommended next session. Sessions 61 + 62 + 63 each strengthen the case — feed render is polished (timestamps, flag glyph, lightbox), find-detail is polished (back-button consistency), Add Find walk is ~2× faster per find (tag-capture auto-fills title + price), and the home-feed footer + masthead are visibly more polished (editorial vendor CTA + sans masthead). Session 64 was a pivot pass that made no net change to the home page (opener shipped + reverted), so the case from session 63 holds verbatim. Seeded content will showcase a genuinely better experience end-to-end.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 16 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Session 61 added TR-n (multi-element-glyph strokeWidth=0 trap, fire count 1). Session 62 added **TR-p** (testbed-first for AI/LLM call unknowns, fire count 1) — also captured as `feedback_testbed_first_for_ai_unknowns.md` memory. Session 63 + 64 added no new TR candidates (session 64 captured `feedback_still_frame_before_animation_port.md` — animation-specific cousin of TR-p; could become TR-q on second firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon (or to FlagGlyph for vocabulary consistency) if/when a separate visual sweep happens.
- **Tag-extraction analytics events** — session 62 deferred wiring `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` events. Worth adding once R3 stale-data mystery resolves so we can measure tag-flow adoption + extraction reliability in production.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests now see a 22px CircleUser glyph in the masthead right slot instead of "Sign in" text. Reasoning is sound (universal "tap to access account" affordance), but worth checking during beta-feedback whether new users find it. Cheap fix if it's a problem: tooltip / first-visit nudge, not a revert.
- **Q-012 — Treehouse opener animation** (NEW session 64, parked) — full Design redesign needed. First-pass framer-motion port (commit `c9043c8`) was reverted (`1946ddd`) the same session because the wood-frame + skeleton-preview combo didn't aesthetically land on iPhone QA. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012 with locked decisions D1–D4 and pre-filled session opener. Wood-frame metaphor is OFF the table for any future revisit; needs fresh visual direction, mockup-first.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–63 missing from `docs/session-archive.md`. Pure docs-housekeeping; no signal lost since git log + commit messages + CLAUDE.md tombstones preserve the actual state. Worth a single ~15min ops pass at some point to backfill the archive in one shot.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; session 60 disproved the stuck-Fluid-Compute-instance hypothesis, confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown; session 61 shipped a six-commit UX polish pass — admin hero-image delete, full-screen photo lightbox with pinch-zoom on Find Detail, relative timestamps below feed tiles, save-glyph swap (heart → rectangular flag on pole) across all 4 save callsites, and ecosystem back-button standardization; session 62 shipped the V1 vendor-experience unlock — tag-capture step in Add Find flow, end-to-end on QA. Vendors now photograph the inventory tag after the item photo; Claude Sonnet 4.6 vision pulls title + price authoritatively; review page prefills with green "from tag" pills; skip is a one-tap fallback to today's flow. Six commits across four phases: chat-architecture (D1–D8) → mockup-first design (`docs/add-find-tag-design.md`) → testbed-first prompt validation (handwritten tags 100% pass on first try) → 3-phase integration. All four acceptance criteria 🟢 passed on iPhone QA. session 63 layered home-page polish on top — three commits shipped end-to-end: editorial vendor CTA card replaces the centered hairline + IM Fell pill button at the bottom of the discovery feed (also auto-fronts the empty-state when a mall has no posts); masthead right slot inverts — guests now see a 22px CircleUser icon → /login, signed-in users see sans-serif "Sign out" text instead of IM Fell italic. **Session 64 was a pivot pass that net-zeroed: the home-page TreehouseOpener animation (originally arrived as broken React Native code in the working tree) was rebuilt as a framer-motion + CSS web component (commit `c9043c8`), wired into `/` with first-visit-only mobile-only gating + tap-to-skip — but on iPhone QA "the first pass looked pretty terrible," so reverted (`1946ddd`) and parked as Q-012 in `docs/queued-sessions.md` for a full Design redesign session (wood-frame window metaphor explicitly off the table). New durable institutional output: `feedback_still_frame_before_animation_port.md` — when porting visual/animation code from a foreign runtime, draft a static peak-frame mockup in the target runtime BEFORE building the full component. Animation-specific cousin of the testbed-first rule from session 62. Feed content seeding remains pending, now 7× bumped — case from session 63 holds verbatim since session 64 made no net change to the home page; every surface a beta vendor or guest would land on this week looks better than at the start of the deferral chain.** Next natural investor-update trigger point remains after feed content seeding + R3 stabilizes — the update would report R4c + R3 + tag-capture (the V1 vendor unlock) + the session-61/63 polish passes all shipped, plus the session-62 testbed-first + session-64 still-frame-before-port patterns as durable institutional approaches.
