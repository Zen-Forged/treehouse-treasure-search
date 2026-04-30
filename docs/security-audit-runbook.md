# Security audit runbook

> **Purpose:** every Supabase Security Advisor email, every beta milestone, and every quarter — run the audit. The artifacts in this repo make that a 5-minute job, not a re-scoped investigation. Built session 84 (2026-04-29) after a `rls_disabled_in_public` advisor email.
>
> **Owner:** the project owner runs the diagnostics; Claude proposes migrations + verifies.

---

## When to run an audit

| Trigger | Scope | Expected duration |
|---|---|---|
| Supabase Security Advisor email arrives | Whatever the email flagged + the matching diagnostic | 5–15 min |
| Before each beta or production milestone | Full sweep: RLS + storage + keys | 10 min |
| Quarterly | Full sweep + functions + grants (when those land) | 15 min |
| After adding a new public-schema table or Storage bucket | RLS + storage | 5 min |
| After a Supabase dashboard policy/RLS toggle | RLS only | 2 min |

**Don't audit reactively only.** Drift is silent — a dashboard toggle, a teammate's manual SQL, a new table created without RLS — none of these surface in a way you'd notice until an exposure email lands. Quarterly sweeps catch them before they accumulate.

---

## What's covered today

| Diagnostic | Covers | Implementation |
|---|---|---|
| [`scripts/security-audit/inspect-rls.ts`](../scripts/security-audit/inspect-rls.ts) | Per-table RLS state + behavioral access pattern | State-aware via `audit_rls_state()` RPC (migration 015); falls back to behavioral-only if RPC absent |
| [`scripts/security-audit/inspect-functions.ts`](../scripts/security-audit/inspect-functions.ts) | Per-function search_path setting in `public` schema (Advisor's `function_search_path_mutable`) | State-aware via `audit_function_search_path()` RPC (migration 017) |
| [`scripts/security-audit/inspect-grants.ts`](../scripts/security-audit/inspect-grants.ts) | Role-grant drift on `public` + `auth.users` exposure baseline | State-aware via `audit_role_grants()` RPC (migration 018) — reads `information_schema.role_table_grants` |
| [`scripts/security-audit/inspect-storage-acls.ts`](../scripts/security-audit/inspect-storage-acls.ts) | Storage bucket public/private state + recent file sample | `supabase.storage.listBuckets()` + per-bucket listing |
| [`scripts/security-audit/inspect-keys.ts`](../scripts/security-audit/inspect-keys.ts) | `.env*` gitignore state + service-role key leaks + hardcoded anon key in source | `git check-ignore` + `git grep -F` against env values |

**Each diagnostic is a single command.** Both projects (prod + staging) are targeted via the same script with a CLI arg.

```bash
# Prod
npx tsx scripts/security-audit/inspect-rls.ts
npx tsx scripts/security-audit/inspect-storage-acls.ts

# Staging
npx tsx scripts/security-audit/inspect-rls.ts staging
npx tsx scripts/security-audit/inspect-storage-acls.ts staging

# Repo-wide (only one form — works on the working tree)
npx tsx scripts/security-audit/inspect-keys.ts
```

---

## What's NOT covered yet (gaps to close)

| Category | Status | Note |
|---|---|---|
| Function `search_path` mutability | ✅ Covered (session 92) | `audit_function_search_path()` RPC (migration 017) + `inspect-functions.ts`. Migration 017 also locks `is_treehouse_admin()` and `set_updated_at()`. |
| Role-grant drift | ✅ Covered (session 92) | `audit_role_grants()` RPC (migration 018) + `inspect-grants.ts`. Flags anon writes on public + any anon/authenticated grant on auth.users. |
| `auth.users` exposure check | ✅ Covered (session 92) | Same diagnostic — anon/authenticated grants on auth.users surface as 🔴 findings. |
| OTP / password policy | 🟡 Manual procedure (session 92) — see [§ OTP & password policy (manual)](#otp--password-policy-manual) below. Auth Advisor findings (`auth_otp_long_expiry`, `auth_password_no_minimum_length`) are dashboard-only; no PostgREST surface for `auth.config`. |
| API route auth audit | ⏳ Pending | Every `/api/admin/*` route must call `requireAdmin`; every `/api/*` mutating route must auth. Walk the routes. |
| Image-upload size guard | 🟡 Partial | Server route enforces 12 MB limit; not all upload surfaces audited. CLAUDE.md carry-forward. |

These are flagged in the runbook so future sessions can pick them up without re-discovering the gaps.

---

## Standard procedure — Supabase Security Advisor email arrives

The email subject is one of:
- `Security vulnerabilities detected in your Supabase projects`
- A specific finding code: `rls_disabled_in_public`, `function_search_path_mutable`, `security_definer_view`, `auth_otp_long_expiry`, etc.

**Step-by-step:**

1. **Identify the finding code + project.** Email lists both. Note them.

2. **Run the matching diagnostic against the affected project.**
   - `rls_disabled_in_public` → `inspect-rls.ts`
   - `function_search_path_mutable` → `inspect-functions.ts` (when built)
   - Storage bucket finding → `inspect-storage-acls.ts`
   - Auth config → manual dashboard check (not yet automated)

3. **Read the diagnostic output.** It will surface:
   - Which specific table/bucket/function is failing
   - The current state vs. expected state
   - The reasonable fix shape

4. **Draft the migration.** Per [`MASTER_PROMPT.md` § Data/schema fixes](../MASTER_PROMPT.md), every Supabase-side fix lands as a committed migration in `supabase/migrations/`, NOT a chat-only SQL paste. Use the `NNN_security_*.sql` naming pattern. Reference the diagnostic finding in the migration's header comment.

5. **Apply staging first.** Re-run the diagnostic against staging. Confirm finding clears.

6. **Apply prod.** Re-run the diagnostic against prod. Confirm finding clears.

7. **Confirm the advisor warning has cleared** in the dashboard (Database → Advisors → Security). The advisor re-scans every few minutes, so the indicator updates within 5–15 minutes of the migration applying.

8. **Commit the diagnostic + migration.** Even if the diagnostic existed already, the migration always commits. The diagnostic stays in the repo; the next time this class of bug surfaces, the investigation is a single `npx tsx` command.

**Time to close:** for a known finding-class, ~5 minutes end-to-end (1 diagnostic run + 1 migration paste + 1 verify run + 1 commit). The first time a class is encountered, expect 30–60 min for the diagnostic + migration to be built — but the investment compounds across every future occurrence.

---

## OTP & password policy (manual)

The two `auth_*` Advisor findings — `auth_otp_long_expiry` and
`auth_password_no_minimum_length` — live in `auth.config`, which Supabase
exposes via the Auth section of the dashboard, not through PostgREST. There
is no SQL migration that closes them; the fix is two dashboard toggles.

Walk this every time the Advisor surfaces an `auth_*` finding, plus once
per pre-milestone sweep:

1. **OTP / email-link expiry** — Authentication → Providers → Email
   - Confirm "Mailer OTP Expiration" ≤ **3600 seconds** (1 hour).
   - Recommended: **600** (10 minutes). Magic-link OTPs are confirmed
     immediately by the user; a 10-minute window is plenty and minimises
     the steal-and-replay window.
   - Save → re-check Database → Advisors → Security; the
     `auth_otp_long_expiry` row should clear within 5 minutes.

2. **Password minimum length** — Authentication → Providers → Email
   - Confirm "Minimum password length" ≥ **8**.
   - Recommended: **8** (Supabase's default; matches NIST guidance).
   - Note: Treehouse Finds is currently magic-link-only — there is no
     password-based sign-in surface — but the policy still has to be set
     to a sane value because the Advisor checks the config regardless of
     whether passwords are in use.
   - Save → re-check Advisors.

**Both projects.** Apply both toggles to staging AND prod every time. The
projects diverge silently if treated separately.

After applying, the Database → Advisors → Security pane re-scans every
~5 minutes; both findings should clear.

---

## Standard procedure — pre-milestone full sweep

Run all three diagnostics against both projects. Expected output: zero findings.

```bash
npx tsx scripts/security-audit/inspect-keys.ts && \
npx tsx scripts/security-audit/inspect-rls.ts && \
npx tsx scripts/security-audit/inspect-rls.ts staging && \
npx tsx scripts/security-audit/inspect-functions.ts && \
npx tsx scripts/security-audit/inspect-functions.ts staging && \
npx tsx scripts/security-audit/inspect-grants.ts && \
npx tsx scripts/security-audit/inspect-grants.ts staging && \
npx tsx scripts/security-audit/inspect-storage-acls.ts && \
npx tsx scripts/security-audit/inspect-storage-acls.ts staging
```

Then walk the [OTP & password policy (manual)](#otp--password-policy-manual)
checklist for both projects.

If any finding surfaces, follow the "Supabase Security Advisor email arrives" procedure above. Don't ship to milestone with open security findings.

---

## Operating principles (from session 84)

These shaped the audit design and should hold for future expansions:

1. **Script-first, not SQL-paste-first.** Every Supabase investigation produces a committed diagnostic. The migration is the second artifact; never the only one. ([MASTER_PROMPT.md § Data/schema fixes](../MASTER_PROMPT.md))

2. **State + behavior, not state alone.** A diagnostic that only reads `pg_class.relrowsecurity` would miss a table where RLS is on but a permissive policy makes it effectively public. A diagnostic that only tests behavior would miss a table where RLS is off but no one has tried to exploit it yet. The two axes catch different drift modes.

3. **Coverage drift is itself a finding.** If a new table or bucket exists in the database that's not in the diagnostic's expectation list, that's a 🟡 warning, not a silent skip. Coverage that drifts away from reality is worse than coverage that's missing — it gives false confidence.

4. **Match the advisor's check, not the diagnostic's convenience.** Supabase Advisor checks `pg_class.relrowsecurity` directly. We could write a diagnostic that "feels" comprehensive without reading that bit, but if the advisor still flags us we haven't actually closed the loop. The RPC is what makes the diagnostic state-aware in the same axis the advisor uses.

5. **Idempotent migrations only.** Every security migration is safe to re-run. The dashboard SQL editor accepts a paste once; if a deploy is interrupted or partially applied, re-running the same file should land the rest cleanly. `IF EXISTS` / `IF NOT EXISTS` / `CREATE OR REPLACE` everywhere applicable.

6. **Both projects always.** prod and staging diverge silently if treated separately. Every Supabase-side fix runs against both. The diagnostic CLI arg makes this a one-line mechanical step.

---

## Migration history (security-related)

| Migration | Purpose | Applied prod | Applied staging |
|---|---|---|---|
| `002_enable_rls.sql` | Initial RLS on `malls`, `vendors`, `posts` | ✅ Pre-session 54 | ✅ Pre-session 54 |
| `003_cleanup_old_rls_policies.sql` | Remove stale permissive policies left over from earlier setup | ✅ Pre-session 54 | ✅ Pre-session 54 |
| `008_site_settings_rls_fix.sql` | Disabled RLS on `site_settings` + added safety-net public-read policy (session 48) | ✅ Session 48 | ✅ Session 48 |
| `010_events.sql` | Created `events` table with RLS off (session 58) | ✅ Session 58 | ❓ Unknown — staging may pre-date events |
| `011_events_anon_revoke.sql` | REVOKE SELECT on `events` from anon + authenticated (session 58) | ✅ Session 58 | ❓ Unknown |
| **`014_security_advisor_rls.sql`** | Enable RLS on `site_settings` + `events` to clear `rls_disabled_in_public` (session 84) | ✅ Session 84 | ⏳ Pending |
| **`015_security_audit_helpers.sql`** | Add `audit_rls_state()` RPC for state-aware diagnostics (session 84) | ⏳ Pending | ⏳ Pending |
| **`017_security_function_search_path.sql`** | Pin `is_treehouse_admin()` + `set_updated_at()` search_path; add `audit_function_search_path()` RPC (session 92) | ⏳ Pending | ⏳ Pending |
| **`018_security_grants_audit.sql`** | Add `audit_role_grants()` RPC for grant-drift diagnostic (session 92) | ⏳ Pending | ⏳ Pending |

Update this table whenever a new security migration ships.

---

## When this runbook gets out of date

Update it. The runbook is the security-audit equivalent of `CONTEXT.md` — it has to stay live to be useful. Specifically:

- A new diagnostic gets built → add a row to "What's covered today"
- A diagnostic gets retired or merged → remove the row
- A new finding-class is added to Supabase Advisor → check whether we cover it; if not, add to "What's NOT covered yet"
- A migration applies → update the migration history table
- A new Supabase product changes the threat model (Realtime opening up RLS, Edge Functions changing the auth surface, etc.) → revisit the runbook end-to-end

The runbook lives at `docs/security-audit-runbook.md`. Future Claude sessions doing security work read it first. Future security-aware humans (vendors, ops, future contributors) read it second.
