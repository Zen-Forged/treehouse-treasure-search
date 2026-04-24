# Ladder B — Staging + CI + Beta Plan design record

> **What this is:** the decision record for Ladder B (session 53 + 54), per [MASTER_PROMPT.md](../MASTER_PROMPT.md) Design Agent "mockup-first, not spec-first" convention — except that for infra work the "mockup" is this design record, written before any infra lands. It captures the four decisions David approved at session 53 open so future sessions don't re-derive them.
>
> **What this is not:** a build spec. Code artifacts are in `.github/workflows/ci.yml`, `package.json`, [docs/beta-plan.md](beta-plan.md), and (session 54) `scripts/seed-staging.ts` + `.env.staging.example`.

**Status:** session 53 shipped Tasks 1–4. Session 54 opens with Task 5.

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

## Session 54 task list — QUEUED

| # | Label | Task | Notes |
|---|-------|------|-------|
| 5 | 🖐️ HITL | Create staging Supabase project | David in Supabase dashboard. Name: `treehouse-treasure-search-staging`. Region: match prod (us-east-1 or whichever). Copy URL + anon key + service role key into a running scratchpad for Task 6. |
| 6 | 🖐️ HITL | Wire staging env to `staging` branch in Vercel | David in Vercel dashboard → Project → Settings → Environment Variables. Scope `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (to the staging URL), and `RESEND_API_KEY` (can reuse prod — Resend sends work the same) to the `Preview` environment with branch filter `staging`. Admin + other vars remain unchanged across envs. |
| 7 | 🟢 AUTO | Replay migrations against staging | Run the migrations in `migrations/` in order against the staging Supabase project via the SQL editor or via a `scripts/run-migrations.ts` helper. Flag any drift. |
| 8 | 🟢 AUTO | Write `scripts/seed-staging.ts` | Reusable fixture seed. Creates 1–2 test vendors, 1 admin user (matches `NEXT_PUBLIC_ADMIN_EMAIL`), 5–10 posts, 1 featured banner. Mirrors `scripts/qa-walk.ts` shape — Supabase service role client + console-table output. Safe to re-run (idempotent via upsert or cleanup-first). |
| 9 | 🟢 AUTO | Write `.env.staging.example` | Mirrors `.env.example` with staging-specific commentary. Not committed to `.env.staging` (gitignored). |
| 10 | 🖐️ HITL | Smoke-test the staging deploy | David: push an inconsequential commit to the `staging` branch, confirm Vercel deploys it to the staging URL, open it on device, confirm the Home feed renders (should be empty-state), run `npm run qa-walk -- baseline` pointed at staging (requires updating qa-walk.ts to accept an env flag OR copying `.env.staging.local` to `.env.local` temporarily). |

**Estimated session 54 duration:** ~60 min if dashboards cooperate. Supabase project creation is 3 min. Vercel env wiring is 15–20 min. Migration replay is the most variable — depends on how many migrations exist and whether any have env-specific assumptions.

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
