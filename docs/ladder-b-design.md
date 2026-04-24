# Ladder B — Staging + CI + Beta Plan design record

> **What this is:** the decision record for Ladder B (session 53 + 54), per [MASTER_PROMPT.md](../MASTER_PROMPT.md) Design Agent "mockup-first, not spec-first" convention — except that for infra work the "mockup" is this design record, written before any infra lands. It captures the four decisions David approved at session 53 open so future sessions don't re-derive them.
>
> **What this is not:** a build spec. Code artifacts are in `.github/workflows/ci.yml`, `package.json`, [docs/beta-plan.md](beta-plan.md), and (session 54) `scripts/seed-staging.ts` + `.env.staging.example`.

**Status:** session 53 shipped Tasks 1–4. Session 54 shipped Tasks 5–9 + Task 10 partial (Booths-view admin-access verification deferred behind Supabase's 1-per-hour email cap).

---

## Context

Before Ladder B:
- `main` auto-deploys to production (app.kentuckytreehouse.com)
- No staging environment — every commit to `main` is live for the founder
- Single Supabase project serves both "founder testing" and "real vendor data"
- CI runs only on reseller-pipeline-touching files (`.github/workflows/comp-eval.yml`)
- No package scripts beyond `dev`/`build`/`start`/`lint`
- No written rollout plan for beta vendors

After Ladder B (session 54 close):
- `staging` branch auto-deploys to a staging URL backed by a dedicated Supabase project
- General CI runs on every PR + push to `main`/`staging` (typecheck + lint + build)
- Package scripts surface the qa-walk + test utilities
- `docs/beta-plan.md` defines rollout cadence + rollback criteria + feedback loop
- V0 → V1 → V2 → V3 vendor invite plan is documented, not improvised

---

## Decisions (session 53)

### D1 — Staging branch topology → (a) classic promotion ladder

```
feature-branch  →  PR into staging  →  merge  →  auto-deploy staging URL
                                     │
                                     └─ QA on device
                                     │
                                     ▼
              staging  →  PR into main  →  merge  →  auto-deploy production
```

**Options considered:**
- (a) `staging` branch exists, feature branches PR into staging, staging PRs into main. **← chosen**
- (b) `main` = staging, `production` = production. Rejected — inverts git conventions + every tool that defaults to `main` (gh, Vercel dashboard, docs) would need a mental conversion.
- (c) No persistent staging branch; rely on Vercel's per-PR preview URLs. Rejected — preview URLs are ephemeral (one per branch, churn with every force-push), and there's no canonical "here's what ships next" URL to send to a beta vendor for trial.

**Why (a):**
- Matches David's mental model as captured in CLAUDE.md.
- Gives a single stable staging URL that can be demo-linked to a V1 vendor for a dry-run without touching prod data.
- Vercel supports this natively via Git Branch → Environment mapping — no custom wiring.
- Cost over (c) is ~5 min of Vercel config once; cost of switching later is higher than eating the 5 min now.

### D2 — Staging Supabase → (b) fresh project, replay migrations

**Options considered:**
- (a) `pg_dump` of prod schema + seed data, replay into staging.
- (b) Fresh Supabase project, run existing migrations forward, seed via a script. **← chosen**

**Why (b):**
- Prod is clean-slate after session 42 / session 46 (no vendor data worth preserving).
- Exercising the migrations-from-scratch path IS a beta-readiness test — if a migration fails replaying against a fresh database, that's exactly the kind of issue a first-vendor incident would surface in prod. Better to catch it in staging.
- True isolation: no possibility of a staging query accidentally hitting prod keys (different URL + different anon key + different service role key from day one).
- Admin identity re-provisioned from `NEXT_PUBLIC_ADMIN_EMAIL` in staging env — same email, different Supabase auth user id. Admin flows get tested end-to-end on fresh users.

**Trade-off accepted:** staging won't reproduce any "real" data edge cases (e.g. an odd booth number assignment from a specific vendor). That's what V1 beta testing with real vendors is for, not staging.

### D3 — CI scope → (a) minimum

**Options considered:**
- (a) Typecheck + lint + build on every PR + push. **← chosen**
- (b) + qa-walk smoke + E2E browser tests (Playwright or similar).

**Why (a):**
- Catches the class of regressions that have actually bitten us in the past (downlevelIteration, missing imports, route-collection errors at build time).
- No CI budget for E2E — we don't have a test suite and writing one during Ladder B is scope creep.
- Session 46 confirmed the existing qa-walk.ts script is a local-first utility, not a CI-first one (it requires service role keys and mutates data; safer as a local+HITL tool).
- (b) is a post-beta move: if a regression in session 56+ motivates E2E, we add it then.

**Existing coverage preserved:** `comp-eval.yml` still runs path-gated for the reseller pipeline. The new `ci.yml` is additive — two typechecks on comp-pipeline PRs is cheap insurance.

### D4 — Beta plan scope → (a) thin

**Options considered:**
- (a) One page, 3 sections: rollout cadence + rollback criteria + feedback loop. **← chosen**
- (b) Thick: vendor vetting, support protocols, incident playbooks, known-gotcha responses.

**Why (a):**
- Beta is 1→5 vendors. A 10-page ops manual for 5 people is operator theater.
- The first time the thin plan is insufficient — which will be a specific moment, not a drift — we upgrade it. Until then, more words create more surface area for drift.
- The thin plan's most important section is rollback criteria (what halts invites). That fits on a screen.

---

## Session 53 task list — SHIPPED

| # | Label | Task | Deliverable |
|---|-------|------|-------------|
| 1 | 🟢 AUTO | General CI workflow | `.github/workflows/ci.yml` |
| 2 | 🟢 AUTO | Package scripts | `package.json` (typecheck, qa-walk, inspect-banners, test:filters, test:query-builder, test:comps) |
| 3 | 🟢 AUTO | Thin beta plan | [docs/beta-plan.md](beta-plan.md) |
| 4 | 🟢 AUTO | This design record | `docs/ladder-b-design.md` |

All four landed in one session-53 commit. No dashboards touched.

---

## Session 54 task list — SHIPPED

| # | Label | Status | Notes |
|---|-------|--------|-------|
| 5 | 🖐️ HITL | ✅ DONE | Staging Supabase project `treehouse-treasure-search-staging` provisioned, project ID `thaauohvxfrryejmyisv`. Security settings `ON / ON / OFF` (Data API on, auto-expose on, auto-RLS off) for prod parity. New-style keys named `treehouse_search_staging_client` (publishable) + `treehouse_search_staging_server` (secret). |
| 6 | 🖐️ HITL | ✅ DONE | Six env vars scoped to Preview + branch=`staging`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_EMAIL`. Existing prod entries narrowed from "All Environments" to Production-only so scopes don't overlap. `NEXT_PUBLIC_ADMIN_EMAIL=david@zenforged.com` (matches `is_treehouse_admin()` RLS hardcode; business-email consistency choice). |
| 7 | 🟢 AUTO | ✅ DONE | Migrations live at `supabase/migrations/` (NOT `migrations/` — design record was slightly off). Discovery: no `001_initial_schema.sql` existed; prod base tables were created by hand in Supabase dashboard on day one and never captured. Captured via `pg_dump --schema-only --schema=public --no-owner --no-privileges` against prod → sanitized + committed as `supabase/migrations/001_initial_schema.sql`. Applied clean to staging via `psql` with zero errors. Migrations 002–008 remain as historical evolution record; fresh-env bootstrap needs only 001. Malls also seeded via `supabase/seeds/001_mall_locations.sql` (29 malls). |
| 8 | 🟢 AUTO | ✅ DONE | `scripts/seed-staging.ts` (466 lines) — `status` / `seed` / `wipe` subcommands, idempotent natural-key upserts, safety-rail refuses any env file without `staging` in path. Creates admin auth user, 2 test vendors at booths 901/902, 6 posts (available + sold mix), 2 `site_settings` rows. Surfaced as `npm run seed-staging`. |
| 9 | 🟢 AUTO | ✅ DONE | `.env.staging.example` committed; `.env.staging.local` created locally (gitignored via new `.env.*.local` pattern). Admin email flipped to `david@zenforged.com` mid-session for consistency with Vercel. |
| 10 | 🖐️ HITL | ⏳ PARTIAL | Staging URL loads on iPhone, feed renders with 5 posts (sold-status planter correctly filtered), post detail opens, magic-link sign-in round-trips cleanly after Supabase Auth URL Configuration was set. **Deferred:** Booths-view admin-access verification — rate-limited by Supabase's 1-per-hour email cap. Non-gating: infra is live; only the final admin-auth check remains. |

**Actual session 54 duration:** ~3 hours wall-clock. Longer than the estimated 60 min primarily due to the 001_initial_schema gap discovery + Vercel env-var narrowing flow (the `NEXT_PUBLIC_SUPABASE_URL`-already-All-Environments overlap required edit-existing-then-add pattern for every key). Actual code/infra work was closer to the estimate.

---

## Session 54 retrospective — operational learnings worth carrying forward

Three operational gaps surfaced this session that the original Ladder B design didn't anticipate. Each is now a first-firing Tech Rule candidate in `CLAUDE.md` KNOWN GAPS:

1. **Repo must carry an `001_initial_schema.sql` before claiming any migration-from-scratch capability.** D2(b) was designed to surface this and did — prod's base schema existed only in the Supabase dashboard, never in git. If prod had ever needed disaster-recovery before session 54, "call Supabase support and pray" would have been the actual plan. Now `001_initial_schema.sql` is the canonical bootstrap.
2. **Branch-scoped env-var checklists must enumerate every `NEXT_PUBLIC_*` the app reads.** Task 6's original spec missed `NEXT_PUBLIC_ADMIN_EMAIL` + `NEXT_PUBLIC_SITE_URL`. Symptom: client code fell back to hardcoded defaults (`david@zenforged.com` in `DevAuthPanel.tsx`, no site URL in email links), and the Booths view admin gate triggered unexpectedly. Cost: one redeploy.
3. **New Supabase project HITL checklist must include Authentication → URL Configuration before first magic-link test.** Fresh Supabase projects default Site URL to `http://localhost:3000`; first magic-link email thus 404s with "site can't be reached." Task 5's spec should have included this step explicitly.

**If these three patterns fire again in a future session**, they promote from Tech Rule candidates to durable rules in `MASTER_PROMPT.md`.

---

## Out of scope (both sessions)

Deliberately not in Ladder B:

| Item | Why deferred | Picked up when |
|------|--------------|----------------|
| Sentry / error monitoring | Sprint 3 carryover; not blocking beta | First rollback-criterion fires and we realize we don't have logs |
| E2E tests (Playwright etc.) | D3(a) rejects CI scope expansion | After a regression that typecheck+build+lint wouldn't have caught |
| Supabase MCP wiring | Separate session — adds Supabase-as-tool to Claude Code | After staging lands cleanly |
| Tally.so feedback form | [beta-plan.md](beta-plan.md) §Feedback loop defers until N≥3 | When direct-to-David channel starts to fragment |
| Vercel Preview Deployment Protection | Session 54 is about basic staging, not access control | If a staging URL gets leaked / crawled |
| Rolling releases / canary for prod | Prod has N=1 user today, canary is operator theater | N≥10 |
| Automated migration replay in CI | Schema drift hasn't bitten us yet | After a migration-forward failure in staging |

---

## Reading order for a future Claude session

If you're opening Ladder B cold, read in this order:
1. **This doc** — why each decision was made
2. [beta-plan.md](beta-plan.md) — what beta success looks like in operational terms
3. **`.github/workflows/ci.yml`** + **`package.json`** scripts block — what shipped session 53
4. (After session 54) **`.env.staging.example`** + **`scripts/seed-staging.ts`** — what shipped session 54

If a decision in this doc turns out wrong after session 54 smoke test, amend this doc in the same PR that changes the affected artifact. Don't let the design record drift from the code.

---

## Non-goals

This doc is **not** the source of truth for:
- Which specific vendors get V1/V2/V3 invites (lives in David's head / a Linear issue, not here)
- Supabase project IDs / staging URL (lives in `.env.staging.local` + Vercel dashboard, gitignored)
- CI job duration tracking (lives in GitHub Actions UI)
- Ongoing feedback log (lives in `docs/known-issues.md`)

---
> Maintained alongside Ladder B infra. If the infra changes, this doc changes.
