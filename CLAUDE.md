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

## 🔴 TOP PRIORITY NEXT SESSION — SECURITY INCIDENT
> See `docs/SECURITY-INCIDENT-2026-04-19.md` for full context and execution plan.

**Supabase `service_role` key is exposed in PUBLIC git history.** File `check-vendor-requests.js` at project root contains a hardcoded plaintext service_role JWT (valid through 2036, full RLS-bypass capability). Committed in `3492f8d`. Repo is public. Key is identical to the current production `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel. Rotation was attempted session 28 and deferred — Supabase's dashboard UI is in a transitional state and the rotation path wasn't clean enough to execute safely while tired.

**Next session opens with rotation as the top priority, before any other work including the v1.2 code sprint.** Estimated 45–90 min. Full plan in `docs/SECURITY-INCIDENT-2026-04-19.md`.

**Do NOT between now and next session:** commit-and-push work that would re-surface the file in diffs (the file itself is unchanged, so standard commits are fine); run `node check-vendor-requests.js`; share screen with Supabase API Keys page visible.

---

## CURRENT ISSUE
> Last updated: 2026-04-19 (session 28 — v1.2 design approval + structural cleanup; three mockups approved, build spec on disk, CLAUDE.md split out of its historical bloat, agent-system cruft audited; security incident surfaced and deferred to next session; no production code)

**Status:** ✅✅ Session 28 did two things on the work side, then surfaced a third issue that stopped the session early. On the work side: first, it produced three approved mockups for the v1.2 post-flow trilogy (Add Find sheet on `/my-shelf`, refreshed Review page, new Edit Listing page) and a build spec as the dev-handoff doc for session 29's code sprint. Second, it surfaced and fixed two meta-problems with how the system has been operating:

**Meta-fix 1 — mockup-first becomes default.** The Design agent had been producing dense 14-paragraph commitment blocks in `docs/design-system.md` and asking David to audit them. David named the problem mid-session: that format requires executive-level design-system fluency to review, and revisions are expensive because every paragraph cross-references every other. The reversed pattern — mockup FIRST, plain-English decisions via `ask_user_input_v0`, build spec written AFTER approval as dev-handoff — landed three UI surfaces in one session with zero spec-doc reopens. Tech Rule promoted.

**Meta-fix 2 — structural cleanup.** At ~599 lines CLAUDE.md had become three documents mashed together (live whiteboard + session archive + reference material duplicating CONTEXT.md). Historical archives moved to `docs/session-archive.md`; reference material deleted because it already existed in CONTEXT.md; this file now holds only the current whiteboard. Known-Gaps reconciliation rule (proposed session 26) promoted to DECISION_GATE. Project-root agent-system cruft from a prior experiment (15 files + one botched brace-expansion directory) audited and staged for removal (not yet deleted).

**The third thing — a 🔴 security incident — surfaced during the cruft audit and ended the session early.** `check-vendor-requests.js` at project root contains a plaintext Supabase service_role key and was confirmed committed in git history (commit `3492f8d`). Repo is public. The exposed key is identical to the current production key. David and Claude started the rotation in Supabase and stopped partway through when the dashboard UI turned out to be in an awkward transitional state and Claude had given three different rotation plans inside of an hour — both signals that pushing through at 8:30 PM was higher-risk than waiting for morning. The incident is documented in `docs/SECURITY-INCIDENT-2026-04-19.md` with a full rotation plan for next session. **Production is still running on the same compromised key it was running on all session — no active rotation state, nothing mid-change.** The exposure is 28 sessions old; one more night is an acceptable delta against the risk of breaking production with a rushed fix.

**Next session (29) opens with the rotation, NOT the v1.2 code sprint.** Rotation is the top priority. Once resolved, v1.2 code sprint proceeds against `docs/design-system-v1.2-build-spec.md`. Est. rotation 45–90 min + v1.2 sprint 3–4 hours.

### What shipped this session (28)

**No production code changes.** Design work + structural doc work.

**New mockups (all approved):**
- `docs/mockups/add-find-sheet-v1-2.html` — Frame 3 (stripped) variant
- `docs/mockups/review-page-v1-2.html` — "Publish" CTA, Title/Caption/Price order, full-photo-no-crop truth rule
- `docs/mockups/edit-listing-v1-2.html` — Available/Sold toggle, Replace-photo pill, Remove-from-shelf quiet link

**New build spec (dev-handoff — David doesn't read):**
- `docs/design-system-v1.2-build-spec.md` — 10 build tasks, component contracts, `PATCH /api/my-posts/[id]` route, build-order recommendation

**Retired:**
- `docs/design-system-v1.2-draft.md` — gutted to tombstone pointer (superseded mid-session by mockup-first pivot)

**Structural cleanup:**
- `docs/session-archive.md` — NEW; sessions 1–27 moved here
- CLAUDE.md (this file) — shrunk from ~599 lines to ~200 by removing duplicative reference material and historical archives
- `docs/DECISION_GATE.md` — added "Design: mockup-first as default" Tech Rule + "Known-Gaps reconciliation" Tech Rule (promoted from session-26 proposal) + 2 Risk Register rows
- `MASTER_PROMPT.md` — Design agent "Core operating principle (session 28)" block committing the mockup-first flow

**Audit findings (staged for removal, not yet removed):**
- 15 project-root files from a prior Python-based "agent system" experiment (see Session 28 — separate HITL below)
- `{app/{scan,decide,saved,item},components,lib,hooks,types}` — empty directory tree from a botched brace-expansion
- `tsconfig.tsbuildinfo` — build output that should be gitignored

### Session 28 close HITL

1. ✅ Three mockups authored + approved via `ask_user_input_v0`
2. ✅ `docs/design-system-v1.2-build-spec.md` authored
3. ✅ `docs/design-system-v1.2-draft.md` retired to pointer
4. ✅ `docs/DECISION_GATE.md` updated — mockup-first Tech Rule + Known-Gaps reconciliation Tech Rule + Risk Register rows
5. ✅ `MASTER_PROMPT.md` updated — Design agent core operating principle
6. ✅ `docs/session-archive.md` created with sessions 1–27
7. ✅ CLAUDE.md shrunk to whiteboard-only
8. ✅ `docs/SECURITY-INCIDENT-2026-04-19.md` created with full rotation handoff
9. ✅ All new files verified on disk via `filesystem:read_text_file`
10. 🟢 **TODO at commit:** `thc` (session 28 close)
11. 🔴 **TOP OF NEXT SESSION:** run the rotation plan in `docs/SECURITY-INCIDENT-2026-04-19.md` before any other work
12. 🟢 **Whenever convenient (post-rotation):** project-root cruft cleanup — see command below

### Project-root cruft cleanup (defer until after rotation)

15 files + empty directory tree + one build-output artifact from a prior Python-based agent-system experiment. Session 28 did not delete them to avoid widening the commit. Single-command cleanup David can run whenever convenient (AFTER the security rotation is complete):

```bash
rm -rf '{app' AGENT_ACTIVATION_GUIDE.md AGENT_QUICK_REFERENCE.md AGENT_SYSTEM_COORDINATOR.py AGENT_SYSTEM_UPDATES.md HOW_TO_USE_AGENT_SYSTEM.md NOTION_AGENT_SYSTEM_UPDATE.md PRODUCTION_DEPLOYMENT_AGENT.py SMART_AGENT_ORCHESTRATION.py STATE_PERSISTENCE_AGENT.py TERMINAL_GUIDE.txt WORKFLOW_INTEGRATION.md agent_dashboard.html agent_workflow.py quick_test.py test_agent_system.py
```

Then add `*.tsbuildinfo` to `.gitignore` and `rm tsconfig.tsbuildinfo`. If any of those files are ever referenced in a future session search and come up missing, git log remembers them.

### Session 29 candidate queue

- **29-SEC — 🔴 Supabase service_role rotation** per `docs/SECURITY-INCIDENT-2026-04-19.md`. **MANDATORY opener.** 45–90 min. All other work defers until this is resolved.
- **29A — v1.2 code sprint** against `docs/design-system-v1.2-build-spec.md`. **Main work after rotation.** ~3–4 hours. Build order in spec.
- **29B — Anthropic model audit + billing safeguards** (session-28G/28H follow-ons). ~30 min. Could fold into the rotation session if David has energy, or defer.
- **29C — Sprint 4 tail batch** (T4c copy polish + T4b admin consolidation + T4d pre-beta QA). Longest-parked pre-beta item; defer unless David explicitly routes here.
- **29D — Nav Shelf decision + BottomNav rework.** Follow new mockup-first rule; four existing mockups in `docs/mockups/nav-shelf-exploration.html`.
- **29E — Guest-user UX batch** + **post-beta candidates.** All parked pending 29A.
- **29-CRUFT — Project-root cleanup** (see command above). ~2 min. Do whenever convenient after rotation.

**Recommended for session 29:** 29-SEC (mandatory, 45–90 min) → 29A (3–4 hours) if energy remains, otherwise stop after rotation and pick up 29A session 30. If session splits at rotation completion, 29-SEC alone is a legitimate session.

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
- **🔴 Security: `check-vendor-requests.js` service role key exposure** — see `docs/SECURITY-INCIDENT-2026-04-19.md`. TOP PRIORITY next session.

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
