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

## 🟡 Session 60 (2026-04-25) — R3 stuck-instance theory disproved; intermittent admin-Events stale-data mystery documented and parked

Single-track session focused on the R3 finishing pass per session 59's recommended next move. **First branch resolved cleanly** — confirmed Refresh button fires GETs (29+ in QA window), data IS captured (15 POSTs to `/api/events` between 12:57:21–12:58:41 UTC), `/api/share-booth` was never called (David opened the share sheet but never sent), and the masthead-share-icon doesn't double-fire `find_shared`. **Second branch hit a wall**: with all that working, David's admin Events page STILL froze at `firstOccurred=12:49 UTC` for 25+ minutes despite the DB having events through 13:13:39 UTC (verified via `scripts/inspect-events.ts`). Triggered a fresh deploy (commit `d3f2d6b`) to test session 59's "stuck Fluid Compute instance" theory — **theory disproved**: the fresh deployment's first GETs immediately returned the same stale snapshot. Confirmed Vercel's `urlPrefix=https://zogxkarpwlaqmamfzceb`, `keyPrefix=sb_secret_Bh`, `keyLen=41` all match local exactly. David elected option 2 (document + close) over option 1 (raw-PostgREST-fetch probe via new endpoint).

**Commits this session (1 runtime + 1 close):**

| Commit | Message |
|---|---|
| `d3f2d6b` | chore(r3): add uptimeSec to /api/admin/events diag — test stale-instance theory |
| (session close) | docs: session 60 close — R3 stuck-instance theory disproved, mystery documented |

**What's broken (carry to session 61):**

- 🟡 **R3 admin Events page intermittently freezes ~25 min behind DB.** Reproducible THIS session, irreproducible across many prior sessions. Confirmed: same Supabase project, same service-role key (prefix + length), same query, fresh deploy, fresh function instance — yet the route's `.order("occurred_at", desc).limit(50)` returns the SAME 50 rows ending at 12:49 UTC across every Refresh, while local script via the same URL+key sees rows through 13:13 UTC. **Cheap diagnostics exhausted.** The next viable probe: write a tiny `/api/admin/events-raw` that uses raw `fetch()` to PostgREST, bypassing `@supabase/supabase-js`. ~10 min including deploy. Currently parked — re-engage when symptom freshly reproduces.
- 🟡 **`/find/[id]` `navigator.share()` instrumentation gap** — carried from session 59, not addressed. Decide whether to fire `track("find_shared", {post_id})` at intent-capture time (before the iOS native share sheet opens) OR document the gap in the R3 design record. Quick decision when next picked up.
- 🟡 **`filter_applied` count = 0** still unverified for the FEED filter chips. Session 60 confirmed admin Events tab filter chips do NOT (and should not) fire `filter_applied` — that event is for shopper-facing filter behavior at [app/page.tsx:749](app/page.tsx:749). Single-test HITL: open `/`, tap a category filter chip, watch Vercel logs for the POST.

**Memory updates:** None new. Existing `feedback_visibility_tools_first.md` carried the session — debug toast + diag logs + diagnostic script let us answer "is the Refresh tap firing?" and "is the URL/key correct?" within minutes each, but ultimately could not isolate the supabase-js-vs-PostgREST behavior gap. Visibility tooling = necessary, not sufficient.

**Live discoveries:**

- **Vercel logs MCP runtime-log substring matches the FULL log entry text, not just the message column.** Querying for `query=keyPrefix=sb_secret_Bh` returns every request whose diag line contains that exact substring — even though the table view only shows the first console.log of each request. This is the workaround for the session-59 "table view collapses multi-line diags" limitation: probe specific variable values via substring instead of trying to read the full content.
- **The admin Events page's `useEffect` at [app/admin/page.tsx:217](app/admin/page.tsx:217) re-fires on `[user, activeTab, eventFilter]` changes** — meaning a single tab-open + 2 filter-chip taps + 2 Refresh taps produces 5 GETs, not 5. Easy to misread as "Refresh is broken / firing too many times" when it's the legitimate filter-change-effect cascade.
- **`/my-shelf` masthead share opens `ShareBoothSheet` (email-based) — actual `/api/share-booth` POST only fires when the user enters a recipient and taps Send.** Tapping the airplane icon and dismissing the sheet records nothing. This is correct (we don't track share-intent without an actual sent email) but caused ~5 min of "where are my shares?" confusion before the logs made it obvious.
- **Stuck Fluid Compute instance is NOT the cause of session-59's intermittent stale-data symptom.** A brand-new instance, deployed seconds before David's retest, immediately served data with `firstOccurred` 25 min behind real DB state. Whatever this is, it's NOT instance aging. Session 59's "fresh deploys appeared to clear it" was almost certainly coincidence with the symptom going dormant on its own.

**Operational follow-ups:** R3 mystery added to [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog as a separate, scoped item from the original "R3 finishing pass." Verbose diag logs in `/api/admin/events/route.ts` STAY — strip-time deferred until R3 actually closes. Recommended next session is feed content seeding (~30–60 min) — the long-deferred V1-unblocking work; come back to R3 only if/when the symptom freshly reproduces.

**Tech Rule candidates:** TR-l (Vercel-runtime-vs-local PostgREST quirks) fired a 2nd time this session — promoted 🟡 → 🟢 **promotion-ready** in [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md). New shape isn't `.eq()`-vs-`.or()` like session 58; it's "even with identical config (URL + key + code + query), deployed routes can serve stale snapshots that local scripts don't see — suspect Vercel-runtime-side state before query syntax." Two promotion-ready candidates now: TR-l + TR-m.

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–54 moved to archive during the session-59 doc refactor + this close.

- **Session 59** (2026-04-25) — Two-track. (1) Doc architecture refactor — CLAUDE.md cut 41,739 → 21,652 chars (-48% per auto-load), new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template. (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom. On-device Refresh-button verification deferred to session 60.
- **Session 58** (2026-04-25) — R3 (Analytics event capture) design-to-Ready + implementation in one session. Events table on prod via migration 010, anon SELECT revoked via migration 011, 175+ events captured across 8 v1 event types, admin Events tab functional for most filters. Visibility tooling (debug toast + diagnostic script + verbose logs) shipped as institutional QA infrastructure. Commits `ba888b3` → `f1e1fd5` (7 commits + close). Two display-layer bugs deferred to session 59.
- **Session 57** (2026-04-24) — R4c shipped end-to-end on prod (commit `ff87047`, on-device QA PASSED 4/4), first-ever Tech Rule promotion batch (3 rules into MASTER_PROMPT.md, commit `6f77065`), Q-002 picker revision (commit `080689a`), `.eslintrc.json` to green the long-red Lint job (commit `d73323f`). CI green across all 3 jobs for the first time. R4c graduated 🟢 → ✅ — first roadmap item shipped end-to-end.
- **Session 56** (2026-04-24) — R4c design-to-Ready, one commit `daca2a5`. Zero runtime code. Shipped [`docs/r4c-mall-active-design.md`](docs/r4c-mall-active-design.md) (all 6 decisions D1–D6 frozen), mockup [`docs/mockups/r4c-admin-v1.html`](docs/mockups/r4c-admin-v1.html), roadmap entry rewritten; R4c graduated 🟡 → 🟢, first roadmap item to do so.
- **Session 55** (2026-04-24) — Roadmap capture + prioritization, three commits `2b9712f` + `40206f9` + `8dca4cc`. Zero runtime code. Shipped [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md) (15 items R1–R15, 8 clusters A–H, 3 shipping horizons). Absorbed 12 parked items from CLAUDE.md into roadmap cross-ref table.

---


## CURRENT ISSUE
> Last updated: 2026-04-25 (session 60 close — R3 stuck-instance theory disproved; intermittent stale-data mystery documented and parked)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Gate to V1:** feed content seeding + Booths-view verification on staging + one quiet week → first beta vendor invite per [`docs/beta-plan.md`](docs/beta-plan.md). R3 is NOT a V1 gate.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

R3 finishing pass exhausted its cheap diagnostics this session — the next viable probe (raw `fetch()` to PostgREST bypassing supabase-js) is parked until the symptom freshly reproduces. Meanwhile, feed content seeding has been "next" since session 55 and is the actual V1 unblocker.

**Shape:**
- 🖐️ HITL (~30–60 min) — Source 10–15 real posts across 2–3 vendors. Photos + titles + reasonable prices. Could be from David's existing booth content or test SKUs.
- 🟢 AUTO — Walk the Add Find sheet for each, confirm appearance in feed + on the right shelf.
- 🟢 AUTO — Run a partial T4d walk on the seeded surfaces (feed render, find-detail, my-shelf, public shelf).
- 🟢 AUTO — Once content lands, the V1 beta-invite gate is the "one quiet week" of monitoring rather than a code/content gap.

### Alternative next moves (top 3)

1. **R3 raw-PostgREST probe** (~10 min including deploy) — only worth doing if the stale-data symptom is freshly reproducing on David's phone. Write `/api/admin/events-raw` using bare `fetch()` against PostgREST, compare response to the supabase-js path. If the raw path is fresh → bug is in `@supabase/supabase-js`. If the raw path is also stale → bug is in the Supabase ↔ Vercel network path. Either way it's a publishable signal for support.
2. **R12 Error monitoring (Sentry)** (~1 session) — Horizon 1 roadmap item. Would have made the R3 stale-data investigation faster (Sentry breadcrumbs vs. cobbled-together log substring searches).
3. **R15 technical-path decision** (~30–60 min, no-code Design) — Capacitor wrapper vs. Expo rebuild vs. full native. Single load-bearing scoping decision on the whole roadmap.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 61 opener (pre-filled — feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. The long-deferred V1 unblocker — 10–15 real posts across 2–3 vendors so the app has actual content for beta invites. Walk the Add Find sheet on iPhone, source photos + titles + prices, verify each lands on the right shelf and renders cleanly in the feed. Run a partial T4d walk on the seeded surfaces. Once content lands, V1 beta-invite gate becomes "one quiet week" of monitoring rather than a code/content gap. Note: R3 admin Events page intermittent stale-data mystery from session 60 is parked — root cause unknown after exhausting cheap diagnostics (same DB, key, code, query, fresh deploy all eliminated as variables). Pick R3 back up only if symptom freshly reproduces; cheapest next probe is `/api/admin/events-raw` via bare fetch() to bypass supabase-js (~10 min including deploy). Verbose diag logs in `/api/admin/events/route.ts` stay in place until R3 closes.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** — intermittent. Session 60 ruled out URL/key/code/query/fresh-deploy/instance-aging as causes. Next probe (only if freshly reproducing): raw `fetch()` to PostgREST via new `/api/admin/events-raw` endpoint (~10 min). Verbose diag logs stay in `/api/admin/events/route.ts` until this closes.
- **`/find/[id]` `navigator.share()` instrumentation gap** — session 59 surface, untouched session 60. Decide whether to fire `find_shared` event at intent-capture or document the gap in R3 design record.
- **Feed content seeding** — rolled forward from sessions 55–60. 10–15 real posts across 2–3 vendors. **Now top-of-stack** as recommended next session.
- **Hero image upload size guard** — verify coverage across upload surfaces.
- **Tech Rule promotion batch** — 14 candidates queued; **TR-l + TR-m both 🟢 promotion-ready** (TR-l promoted 🟡 → 🟢 session 60). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (R3 design-record retro, Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, R3 raw-PostgREST probe (parked), strip verbose diag logs from `/api/admin/events/route.ts` post-R3-close. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; session 54 shipped staging environment end-to-end; session 55 captured the beta-plus roadmap (`docs/roadmap-beta-plus.md`); session 56 promoted R4c (Mall active/inactive) 🟡 → 🟢; session 57 shipped R4c end-to-end on prod (first roadmap item ✅) + first Tech Rule promotion batch + CI green; session 58 shipped R3 (Analytics event capture) design-to-Ready → implementation in one session — events table on prod, 175+ events captured, admin Events tab functional, debug toast + diagnostic script + verbose logs as institutional QA infrastructure; session 59 ran two tracks — (1) doc architecture refactor cut CLAUDE.md from 41,739 → 21,652 chars (-48%) per auto-load, new `docs/tech-rules-queue.md` register, expanded `docs/queued-sessions.md` operational backlog, tightened session-block template; (2) R3 finishing pass added deep diag instrumentation to `/api/admin/events` (commits `74905f7` + `6359a78`) but did not isolate the admin-page-doesn't-reflect-Vercel-data symptom; **session 60 disproved the stuck-Fluid-Compute-instance hypothesis (fresh deploy `d3f2d6b` + `dpl_GaUX...` immediately served the same stale snapshot), confirmed Vercel + local use identical URL + service-role key + length, and parked the R3 mystery as well-characterized but root-cause-unknown — David elected document-and-close over deeper diagnostic. R3 functionally works (data is captured) but display-layer is intermittent.** Next natural investor-update trigger point remains after R3 stabilizes + feed content seeding lands — the update would then report two roadmap items fully shipped (R4c + R3) plus the doc-architecture overhead reduction.
