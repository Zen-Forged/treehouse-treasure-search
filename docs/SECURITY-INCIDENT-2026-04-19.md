# 🔴 Active Security Incident — Supabase service_role key exposed in public git history

> Status: **NOT RESOLVED.** Rotation deferred to next session (will be session 29 or a dedicated "session 28.5" before v1.2 code sprint).
> Surfaced: session 28 (2026-04-19) during project-root cruft audit.
> Severity: High — public repo, valid-for-10-years JWT, full RLS-bypass capability.

---

## What happened

During session 28's structural cleanup pass, an audit of project-root files surfaced that `check-vendor-requests.js` contains a **plaintext Supabase `service_role` key** hardcoded as a JavaScript string constant. The file is **not** in `.gitignore` and has been committed to git history.

**Confirmed exposure:** `git log --all --oneline -- check-vendor-requests.js` returned commit `3492f8d` ("fix: replace Set spread with constructor+add to avoid downlevelIteration error"). The file was committed early in the project's life.

**Repo visibility:** PUBLIC (`Zen-Forged/treehouse-treasure-search` on GitHub). This means the exposed key has been scrape-visible to any bot or person for the full lifetime of the commit.

**The exposed key:**
- Format: legacy JWT (HS256-signed)
- Decoded payload: `{"iss":"supabase","ref":"zogxkarpwlaqmamfzceb","role":"service_role","iat":1775428159,"exp":2091004159}`
- Expiry: year 2036 (~10 years from now)
- Capability: bypasses ALL Row-Level Security on every table and Storage bucket in the Supabase project

**Verified (Case B):** The exposed key in `check-vendor-requests.js` is **identical** to the key currently in `.env.local` and Vercel's `SUPABASE_SERVICE_ROLE_KEY` env var. This means production is running on the same key that's exposed — so rotation can't be "install new, then kill old"; it has to be "trigger new issuance, install new, then revoke old."

---

## Why tonight's rotation attempt was called

We (David + Claude, session 28) got partway through the rotation and stopped. The reasons:

1. **Supabase's dashboard UI is in a transitional state** between two key systems (legacy HS256 JWT keys and new asymmetric ECC-signed + `sb_secret_*` API keys). The paths and button labels don't match older troubleshooting docs exactly.
2. **Claude (me) gave three different plans in the span of an hour** as the UI revealed more complexity. That thrashing is exactly the wrong energy during a production-affecting security rotation.
3. **The "Rotate Keys" flow the docs describe appears to have already happened** at some prior point for this project — the ECC key is already the "Current Key" and the legacy HS256 is already "Previously Used." That suggests the normal rotate-then-revoke path may not cleanly re-issue the static `service_role` API key JWT.
4. **Clicking the wrong button (e.g. "Revoke Key" on the HS256 row before having a new service_role token in hand) would break production immediately**, and fixing it at 8:30 PM with tired operators is worse than 9 AM with fresh ones.

**The key is still compromised, but the compromise is 28 sessions old.** One more night of exposure is a small delta on top of that. Stopping was the correct call.

---

## What was accomplished session 28 on the security front

- **Nothing on Supabase side.** No keys were rotated, revoked, or migrated. Production is running on the same token it started the night on.
- **Incident documented** (this file).
- **Plan for next session written** (below).
- **`check-vendor-requests.js` was NOT deleted** from the working tree — intentionally kept in place so the morning session has the same starting conditions and nothing is mid-state.
- **`.gitignore` was NOT modified** — same reason.
- **Session 28's unrelated cleanup work IS safe and was committed** (three approved v1.2 mockups, build spec, slim CLAUDE.md split, new session-archive.md, two new Tech Rules in DECISION_GATE, Design agent operating principle in MASTER_PROMPT).

---

## Plan for next session — rotation morning

**Prerequisites (do BEFORE opening the Claude session):**
1. Read Supabase's signing keys doc end-to-end: https://supabase.com/docs/guides/auth/signing-keys
2. Read their rotation troubleshooting article: https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets-1Jq6yd
3. Read their new API keys doc (the `sb_publishable_*` / `sb_secret_*` format): https://supabase.com/docs/guides/api/api-keys
4. Have the Supabase dashboard open in one tab: https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb
5. Have Vercel env vars open in another tab: https://vercel.com/david-6613s-projects/treehouse-treasure-search/settings/environment-variables
6. Have `.env.local` open in editor, positioned at the `SUPABASE_SERVICE_ROLE_KEY=` line
7. Do the rotation with a clear 15+ minute window, no other interruptions

**The two realistic rotation paths (pick one after reading docs):**

### Path A — Migrate to new Secret API keys (`sb_secret_*` format)

Likely the cleaner path. Summary based on docs read session 28:
- Supabase has already migrated this project to the new JWT signing keys system (ECC P-256 is current)
- The "new" `sb_secret_*` API keys are managed independently of signing key rotation
- Supabase SDK handles both old and new key formats transparently — **should require no code changes in our app**
- On the API Keys page (`Settings → API Keys → Publishable and secret API keys` tab), generate a new `sb_secret_...` key
- Install that value in `.env.local` + Vercel as `SUPABASE_SERVICE_ROLE_KEY` (the env var name stays the same even though the key format is new)
- Redeploy Vercel, verify production works
- **Then** go to the legacy `Legacy anon, service_role API keys` tab and click "Disable JWT-based API keys" — this invalidates the old HS256 service_role token, killing the exposed one

Uncertainty: I am NOT 100% certain the Supabase SDK handles `sb_secret_*` transparently for `SUPABASE_SERVICE_ROLE_KEY`-shaped usage in our code. Verify by reading https://supabase.com/docs/guides/api/api-keys#secret-api-keys before executing. If the SDK requires a different env var name or code change, Path A becomes more involved.

### Path B — Revoke the legacy HS256 signing key (nuclear)

The path we were attempting tonight. Re-frame:
- On JWT Signing Keys page, the "Previously Used" row (Legacy HS256) is what needs to go
- Revoking it invalidates EVERY JWT signed by it, which includes the exposed key AND the current production key (because they're identical)
- Before revoking, we need to force Supabase to issue a NEW `service_role` JWT signed by the current ECC key
- The mechanism for that "force a new service_role issuance" was unclear from the UI session 28 — might require the "Create Standby Key" → "Rotate Keys" sequence, or might require Path A's migration

**Recommended path: Path A.** Reason: it separates the "get a new key" step from the "kill the old key" step, so production has a clean install-verify-then-revoke sequence with zero downtime. Path B requires breaking production first and then racing to install a new key, which is much riskier.

### Regardless of path — the post-rotation steps are the same

Once a new working key is installed and verified:

1. **Delete `check-vendor-requests.js` from the working tree:**
   ```bash
   rm check-vendor-requests.js
   ```

2. **Add patterns to `.gitignore`:**
   ```
   # Local debug scripts (never commit — may contain secrets)
   check-*.js
   scripts/debug/
   ```

3. **Purge from git history** (public repo, so this matters):
   ```bash
   brew install git-filter-repo    # if not already installed
   git filter-repo --path check-vendor-requests.js --invert-paths --force
   git remote add origin git@github.com:Zen-Forged/treehouse-treasure-search.git  # filter-repo strips remote
   git push origin --force --all
   git push origin --force --tags
   ```

4. **Secrets audit across git history:**
   ```bash
   git log --all -p | grep -iE "(eyJhbGci|sk_live|sk_test|whsec_|re_[a-z0-9]{20,}|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SERPAPI_KEY)" | head -40
   ```
   Any hits beyond this one exposure get their own rotation treatment.

5. **Add a new Tech Rule to `docs/DECISION_GATE.md`:** "Secrets scan before every commit / at sprint boundaries." Wording TBD when the incident is resolved.

---

## Session context for the Claude picking this up

When you open next session, hand Claude this message in addition to the normal CURRENT ISSUE block:

> "Before anything else: read `docs/SECURITY-INCIDENT-2026-04-19.md`. The Supabase service_role key rotation was deferred from session 28 and is the top priority for this session. Follow the plan in that doc. Do NOT start the v1.2 code sprint until rotation + file deletion + history purge are complete."

Then the rotation runs as its own focused mini-session. Estimated time: 45–90 minutes depending on which path, with most of that being read-docs-carefully and verify-each-step time.

Once resolved, update this file's status line to `RESOLVED`, append a postmortem, and THEN proceed to v1.2 code sprint.

---

## Important: what NOT to do between now and next session

- **Do not commit the exposed key again.** `check-vendor-requests.js` is in the working tree but also in `git status` as "tracked, no changes" — so a `git add -A` won't re-stage anything new. Fine to commit other work.
- **Do not run any script that uses the key.** Specifically, don't `node check-vendor-requests.js`. It still works, but every use is a chance for someone to see the key in your terminal scrollback if you're screensharing.
- **Do not share your screen with Supabase's API Keys page visible** — the "Reveal" button exposes the same compromised key to anyone watching.
- **Do not delete `check-vendor-requests.js` tonight.** Leaving it in place keeps the morning starting state predictable. It will be deleted as part of the rotation workflow.

---
> File created session 28 (2026-04-19) at ~8:45 PM as a handoff to the next session.
> Contact point if you're reading this and you're not David or a Claude instance:
> reach David Butler at david@zenforged.com.
