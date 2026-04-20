## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`.

---

## DOCUMENT MAP

This file is the **live whiteboard** — only the current session's starting point. Everything else is elsewhere:

| Need | Read |
|---|---|
| Architecture, schema, routes, API table, lib + component catalog, auth pattern, DNS state, known gotchas, debugging commands | `CONTEXT.md` |
| Operating constitution: brand rules, tech rules, risk register, decision gate, agent roster | `docs/DECISION_GATE.md` |
| Session structure, HITL indicator standard, Docs agent + Design agent operating principles, blocker protocol | `MASTER_PROMPT.md` |
| Historical session close summaries (sessions 1–27, growing) | `docs/session-archive.md` |
| Canonical design system v1.1l + v1.2 build spec | `docs/design-system.md` + `docs/design-system-v1.2-build-spec.md` + `docs/mockups/` |
| Canonical vendor onboarding (3 flows) | `docs/onboarding-journey.md` |
| In-mall SQL triage recipes | `docs/admin-runbook.md` |
| Active bugs + deferred items + resolved history | `docs/known-issues.md` |

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

## ✅ Session 29 (2026-04-20) — Security rotation complete

The session-28 🔴 SECURITY INCIDENT is fully resolved. Session 29 morning executed the full rotation plan: migrated to Supabase's new `sb_publishable_*` / `sb_secret_*` API key system, disabled both legacy JWT keys, purged `check-vendor-requests.js` from git history via `git filter-repo`, force-pushed rewritten history to GitHub, cleaned up a stowaway `claude/*` branch + worktree, ran a secrets audit (0 real matches), and closed 29-CRUFT (deleted 16 project-root agent-system cruft files). See `docs/SECURITY-INCIDENT-2026-04-19.md` — now marked RESOLVED with full postmortem.

No production code changes. Auth + data access paths are unchanged — `lib/adminAuth.ts:getServiceClient()` and the browser client both continue to work transparently with the new key format per Supabase SDK backward-compatibility guarantees.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 29 — security rotation + 29-CRUFT cleanup; full Supabase API key migration + git history purge + project-root cruft removal; no production code changes)

**Status:** ✅✅✅ Session 29 was a focused 60-minute security session. Three wins, in order:

**Win 1 — Supabase API key rotation (29-SEC).** Full migration from legacy HS256 JWT keys to Supabase's new `sb_publishable_*` + `sb_secret_*` API keys. Zero production code changes required — the Supabase SDK handles the new key format transparently per official docs. Server now runs on `sb_secret_Bhtc7...`; client now runs on `sb_publishable_tK5EpAqb...` (the named `treehouse_search_prod_client` key). Both legacy JWT keys disabled at Supabase's edge; the exposed service_role JWT from `check-vendor-requests.js` now returns HTTP 401 to any caller (confirmed via direct curl).

**Win 2 — Git history purge.** `git filter-repo` scrubbed `check-vendor-requests.js` from all 340 commits on all branches. Force-pushed rewritten history to GitHub. Verified clean via `git log --all --oneline -- check-vendor-requests.js` returning empty, and supplementally via `grep -c "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"` returning `0`. Zero Supabase-shaped JWTs anywhere in history. Also cleaned up a dormant `claude/nervous-raman` branch + worktree (leftover from early Claude Code session, confirmed ancestor of main, zero content loss from deletion).

**Win 3 — Project-root cruft cleanup (29-CRUFT).** Deleted 15 agent-system experiment files + the `{app` botched-brace-expansion directory + `.session_state.json` + `tsconfig.tsbuildinfo` + empty `ai-text-demo/` scaffold. 16 files committed (`e2510ba`), ~4,856 lines removed. Working tree and `ls` output are now tidy; future sessions don't waste tokens wondering about `AGENT_SYSTEM_COORDINATOR.py`.

The incident doc at `docs/SECURITY-INCIDENT-2026-04-19.md` is fully converted from 🔴 NOT RESOLVED to ✅ RESOLVED with complete postmortem (what worked, what adjusted mid-session, friction points worth naming, and three backlog follow-ons including a proposed "secrets scan" Tech Rule).

**Next session (30) opens with v1.2 code sprint** against `docs/design-system-v1.2-build-spec.md`. That's the main deferred work from session 28 — three approved mockups, build spec ready. Est. 3–4 hours. No other blockers.

### What shipped this session (29)

**No production code changes.** Security + infrastructure work only.

**Commits on `main` (in order):**
- `05eaeff` — `security: rotate Supabase keys, delete compromised debug script` (pre-history-purge)
- `b5aa1c6` — post-filter-repo HEAD after history rewrite (same content, new hashes throughout)
- `e2510ba` — `chore: remove project-root cruft from prior agent-system experiment`

**Files modified:**
- `.gitignore` — added `check-*.js` and `scripts/debug/` patterns to block future debug-script leaks
- `check-vendor-requests.js` — DELETED from working tree AND from git history (all 340 commits)
- 16 agent-system cruft files — deleted (see `e2510ba` commit message for full list)
- `docs/SECURITY-INCIDENT-2026-04-19.md` — rewritten from 🔴 active-incident handoff to ✅ resolved postmortem; original text preserved as archive block
- `CLAUDE.md` (this file) — session 29 close

**Infrastructure changes (no files):**
- Supabase: legacy JWT keys disabled at edge
- `.env.local`: both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` swapped to new key format; orphan `treehouse_search_prod_client=` line removed
- Vercel: both env vars updated across Production + Preview + Development; redeployed twice (once for service key, once for anon key)
- GitHub: `main` force-pushed with rewritten history; stowaway `claude/nervous-raman` branch deleted

### Session 29 close HITL

1. ✅ Supabase new secret key verified live in production (admin Requests tab populated via `requireAdmin` → `getServiceClient` → service-role query path)
2. ✅ Supabase new publishable key verified across all five public read paths (home feed, find detail, vendor shelf, find map, admin)
3. ✅ Exposed legacy JWT confirmed dead via direct curl returning HTTP 401
4. ✅ `check-vendor-requests.js` removed from working tree + git history + all branches
5. ✅ `.gitignore` patterns added (`check-*.js`, `scripts/debug/`)
6. ✅ `claude/nervous-raman` branch + worktree cleaned up
7. ✅ Secrets audit returned 0 real matches
8. ✅ Project-root cruft (16 files) deleted and committed
9. ✅ `docs/SECURITY-INCIDENT-2026-04-19.md` marked RESOLVED with postmortem
10. ✅ Pre-filter-repo backup at `/Users/davidbutler/Projects/treehouse-treasure-search-backup-pre-filter-repo` — can be removed with `rm -rf`; no longer needed
11. 🟢 **TODO at commit:** `thc` (session 29 close)
12. 🟢 **Deferred to session 30:** promote the "secrets scan before commit / at sprint boundaries" Tech Rule into `docs/DECISION_GATE.md` (documented in the SECURITY-INCIDENT postmortem; not yet in DECISION_GATE)

### Session 30 candidate queue

- **30A — v1.2 code sprint** against `docs/design-system-v1.2-build-spec.md`. **MAIN WORK.** ~3–4 hours. Build order in spec. Delivers: `/post` retires to redirect shim; `/post/preview` rewrites as "Review your find" with photo truth rule; new `/find/[id]/edit` with autosave + Available/Sold toggle + Replace-photo + Remove-from-shelf. New primitives `<AddFindSheet>`, `<PhotographPreview>`, `<PostingAsBlock>`, `<AmberNotice>`. New API route `PATCH /api/my-posts/[id]`.
- **30B — Anthropic model audit + billing safeguards** (session-28G/28H follow-ons). ~30 min. Swap `/api/suggest` to Opus 4.7; enable Anthropic console auto-reload; add pre-beta credit floor checklist item. Good opener for session 30 if David wants a light warm-up before 30A.
- **30C — Promote "secrets scan" Tech Rule** into `docs/DECISION_GATE.md` per the SECURITY-INCIDENT postmortem. ~5 min. Canonical grep pattern already documented in the incident doc's follow-ons section.
- **30D — Sprint 4 tail batch** (T4c copy polish + T4b admin consolidation + T4d pre-beta QA). Longest-parked pre-beta item; defer unless David explicitly routes here.
- **30E — Nav Shelf decision + BottomNav rework.** Follow mockup-first rule; four existing mockups in `docs/mockups/nav-shelf-exploration.html`.
- **30F — Guest-user UX batch** + **post-beta candidates.** All parked pending 30A.

**Recommended for session 30:** 30B (30 min) as warm-up → 30A (3–4 hours) as main work. 30C is a 5-min drive-by that can fold into either. If session splits earlier, 30A alone is the priority.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

_None._ All KIs closed. Design debt empty. Last tech work before beta-ready is Sprint 4 tail (open, not a blocker) + v1.2 code sprint (spec approved, queued session 29).

### 🟡 Remaining pre-beta tech work

- **v1.2 post-flow trilogy code sprint** — spec approved session 28; queued session 29. ~3–4 hours. Delivers: `/post` retires to redirect shim; `/post/preview` rewrites as "Review your find" with photo truth rule; new `/find/[id]/edit` with autosave + Available/Sold toggle + Replace-photo + Remove-from-shelf. New primitives `<AddFindSheet>`, `<PhotographPreview>`, `<PostingAsBlock>`, `<AmberNotice>`. New API route `PATCH /api/my-posts/[id]`.
- **Sprint 4 tail batch** — longest-parked pre-beta item.
  - 🟡 T4c copy polish — `/api/setup/lookup-vendor` error + `/vendor-request` success screen. ~30 min.
  - 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow. ~4 hrs.
  - 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.
- **Anthropic model audit + billing safeguards** (session-28G/28H). ~30 min combined. Swap `/api/suggest` to Opus 4.7; enable Anthropic console auto-reload; add pre-beta credit floor checklist item.

### 🟡 Sprint 5 + design follow-ons

- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)). v1.2 already wires the Add-flow sheet; `/vendor-request` is the last remaining consumer.
- Nav Shelf decision + BottomNav full chrome rework (4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- Guest-user UX parked items: "Sign in" → "Curator Sign In" rename, `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB).

### 🟡 Sprint 3 leftovers pending beta invites

- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage across upload surfaces
- Feed content seeding (10–15 real posts)
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)

"Claim this booth," QR-code approval, Universal Links, native app eval, admin-cleanup tool, feed pagination + search, ToS/privacy, mall vendor CTA, vendor directory. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal, Find Map crop visibility on post-publish surfaces.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` (loud `console.warn`, no callers)
- Cloudflare nameservers dormant (no cost)
- `/shelves` AddBoothSheet (orphan after T4b)
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a)
- `docs/design-system-v1.2-draft.md` (tombstone; retire after session 29 completes)
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- Historical mockup HTML files in `docs/mockups/` (retire once on-device QA confirms versions hold)

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence
