# ✅ Resolved Security Incident — Supabase service_role key exposed in public git history

> Status: **RESOLVED** 2026-04-20 (session 29 morning).
> Surfaced: session 28 (2026-04-19) during project-root cruft audit.
> Resolved: session 29 (2026-04-20) — full rotation + history purge completed in one focused ~60 min session.
> Severity: High at time of exposure — public repo, valid-for-10-years JWT, full RLS-bypass capability. Neutralized at all layers.

---

## Resolution summary

Session 29 opened with rotation as the mandatory top priority per session 28's handoff. Completed full migration to Supabase's new API key system (`sb_publishable_*` + `sb_secret_*`) instead of rotating the legacy HS256 JWT secret. The migration resolved session 28's hesitation cleanly: the new key system is exactly the path Supabase's docs recommend for exactly this scenario (*"If you are still using the JWT-based `service_role` key, replace the `service_role` key with a new secret key instead"*).

Key moves, in order:

1. **New secret key issued.** Confirmed Supabase had auto-created a `default` `sb_secret_*` key when the project migrated to the new key system. No creation needed — used existing.
2. **`SUPABASE_SERVICE_ROLE_KEY` swapped on both local (`.env.local`) and Vercel.** Redeployed. Verified end-to-end via live `/admin` sign-in — Requests tab populated, confirming `requireAdmin` → `getServiceClient` → service-role query path works with the new key.
3. **Discovered Supabase UI nuance:** the legacy-keys-disable switch is all-or-nothing (both `anon` and `service_role` disable together), not per-key. This required expanding scope to also rotate the anon key before flipping the switch.
4. **Anon key migration.** Replaced legacy anon JWT with the named `treehouse_search_prod_client` publishable key (`sb_publishable_*`) that was already created in Supabase but unused. Swapped on local + Vercel, redeployed, verified all five public read paths (home feed, find detail, vendor shelf, find map, admin).
5. **Legacy keys disabled.** Clicked "Disable JWT-based API keys" in Supabase. Verified the exposed service_role JWT now returns HTTP 401 via direct curl against `/rest/v1/malls` with the leaked token as `apikey`. Production simultaneously verified still healthy.
6. **Working-tree cleanup.** Deleted `check-vendor-requests.js`. Added `check-*.js` + `scripts/debug/` patterns to `.gitignore`. Committed + pushed as `05eaeff`.
7. **Git history purge.** Backed up repo. Ran `git filter-repo --path check-vendor-requests.js --invert-paths --force`. Filter-repo stripped the origin remote as a safety feature — re-added it and force-pushed rewritten history to GitHub. Commit `3492f8d` no longer exists; every commit from that point forward has a new hash. Verified with `git log --all --oneline -- check-vendor-requests.js` returning empty.
8. **Stowaway branch cleanup.** Discovered `claude/nervous-raman` branch (leftover from early Claude Code session) was pushed alongside main during force-push. Verified it was an ancestor of main (pure duplicate, no unique content). Deleted worktree at `.claude/worktrees/nervous-raman`, deleted branch locally, deleted branch on GitHub.
9. **Secrets audit.** Ran `git log --all -p | grep -iE "(eyJhbGci|sk-ant-|sk_live|sk_test|whsec_|re_[A-Za-z0-9]{20,}|apify_api_|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SERPAPI_KEY)"`. Output contained only false positives (env var names in docs, this incident doc's own prose, the commit message from the rotation commit itself). Supplemental check `git log --all -p | grep -c "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"` returned `0` — zero Supabase-shaped JWTs anywhere in history.

## Current state (post-resolution)

- **Production server:** runs on `sb_secret_Bhtc7...` (new secret API key).
- **Production client:** runs on `sb_publishable_tK5EpAqb...` (named `treehouse_search_prod_client`).
- **Legacy JWT keys:** both disabled at Supabase's edge. Compromised service_role JWT returns HTTP 401 from Supabase for any caller (confirmed via direct curl).
- **Working tree:** no hardcoded keys anywhere. `.gitignore` blocks `check-*.js` and `scripts/debug/`.
- **Git history:** `check-vendor-requests.js` scrubbed from all 340 commits, all branches. Public repo clean.
- **GitHub:** main branch force-pushed with rewritten history. `claude/*` stowaway branch deleted.

## Timeline

- **~20 min read docs** — Fetched `/docs/guides/api/api-keys` and related Supabase docs end-to-end to resolve session 28's uncertainty about whether the SDK handles `sb_secret_*` transparently for `SUPABASE_SERVICE_ROLE_KEY`-shaped usage. Answer was unambiguous in official docs: *"You can initialize any version of the Supabase Client libraries with the new values without any additional changes, and we don't expect any backward compatibility issues."* Zero code changes needed.
- **~10 min** — Service role key swap + Vercel env update + redeploy + verify.
- **~10 min** — Scope expansion when the both-at-once disable UI surfaced. Anon key migration + Vercel env update + redeploy + verify public read paths.
- **~3 min** — Legacy key disable + verify the exposed key returns 401.
- **~10 min** — Working tree cleanup + commit + push.
- **~10 min** — History purge + stowaway branch cleanup.
- **~3 min** — Secrets audit.
- **~60 min total** — within the estimate range (45–90 min) in session 28's handoff.

## Postmortem — what worked, what to keep

**What worked:**

- **Session 28's decision to defer was correct.** At 8:30 PM on session 28 the plan hedged between two paths and the Supabase UI was unfamiliar. Morning session 29 had clarity on both. One night of additional exposure against a 28-session-old leak was the right trade.
- **Docs-first approach.** Opened session 29 by fetching and reading the three Supabase docs (signing keys, rotation troubleshooting, new API keys) end-to-end before touching anything. This resolved session 28's specific uncertainty (does the SDK handle `sb_secret_*` for service role) in the first 15 minutes and made every subsequent click confident.
- **Stepwise verification.** Five-step verification sweep after the anon key swap caught nothing (everything passed), but the discipline of naming what to check protected against the obvious failure mode of breaking the shopper-facing feed while in rotation mode.
- **Backup before destructive ops.** Full repo backup before `git filter-repo` was 10 seconds of insurance against the most irreversible operation of the session. Not needed, but the habit should stay.
- **Verification via the actual exposure vector.** Curl test using the *exposed JWT from git history* (not the new key) as the confirmation that disable worked. This is the correct check — tests the attacker's exact capability.

**What the plan adjusted mid-session:**

- Session 28's Path A sketch assumed service-role could rotate independently. Reality: Supabase's Legacy-keys-disable UI is both-or-neither. Scope expanded to full migration (anon + service). Took ~10 extra minutes but ended in cleaner state (no lingering legacy keys at all).
- Session 28's plan treated the secrets audit as the final step. Reality: history rewrite surfaced a stowaway `claude/*` branch that needed separate handling first. Added the branch/worktree cleanup step.

**Small friction points worth naming (not problems, just observations for next time):**

- First edit to `.env.local` left an orphan JWT line above the new `SUPABASE_SERVICE_ROLE_KEY=` assignment — the old value wasn't fully replaced. Caught on the re-read verify step. If we'd committed before reading, the orphaned dead-JWT line would've been fine functionally but would've diluted the cleanup.
- On the publishable key prefix request, full value was pasted instead of prefix. Publishable keys are public-by-design so it was safe, but naming it reinforced muscle memory for the secret-key case.
- Force-pushing all branches (`--all`) pushed the dormant `claude/nervous-raman` branch to GitHub. Not a problem, just surfaced the stowaway one step earlier. Next time filter-repo is run, either explicitly limit the force-push to `main` only, or run branch cleanup *before* the filter-repo so there's only one branch in play.

## Follow-ons added to backlog

- **Tech rule:** Secrets scan before every commit / at sprint boundaries. Canonical grep pattern:
  ```bash
  git log --all -p | grep -iE "(eyJhbGci|sk-ant-|sk_live|sk_test|whsec_|re_[A-Za-z0-9]{20,}|apify_api_|ANTHROPIC_API_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SERPAPI_KEY)"
  ```
  Add to `docs/DECISION_GATE.md` Tech Rules. Run at each sprint boundary (cheap). Verify `0` matches for `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"` as a targeted JWT-header check.
- **Pattern to avoid:** any file at project root that ends in `.js` and is not a Next.js config. New files matching this shape get human review before commit.
- **Mental model to carry:** Supabase's `sb_publishable_*` + `sb_secret_*` keys are now the default posture. Future sessions working with Supabase should not reflexively reach for the legacy JWT keys. If `lib/supabase.ts` or `lib/adminAuth.ts` ever see an `eyJhbGci...` value appear in an env var during dev, that's a regression signal, not a normal state.

## Archive of the original handoff text (session 28 → 29)

Original incident write-up below, preserved as a time capsule. Session 28's planning was ~80% right; the main correction was that Supabase's new API key system is the officially-recommended path (not merely "one option"), and the SDK handles the new key format transparently (resolving session 28's load-bearing uncertainty).

---

## [ORIGINAL SESSION-28 HANDOFF BELOW — preserved for reference]

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
