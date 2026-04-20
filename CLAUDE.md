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
| Historical session close summaries (sessions 1–30, growing) | `docs/session-archive.md` |
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

## ✅ Session 31E (2026-04-20) — v1.2 on-device polish pass shipped

On-device QA of the session-30 v1.2 trilogy surfaced four polish items on the Edit + Find Detail owner surfaces. All four shipped in a single commit. Build green, committed, pushed, verified on device.

**What changed:**
1. **Edit page — post-it retired.** Redundant metadata on a management surface. `<PhotographPreview boothNumber={null}>` triggers the primitive's existing no-op branch. Zero primitive changes.
2. **Edit page — `<PostingAsBlock>` retired.** Vendor identity is implicit once the post exists; publishing was the identity moment, editing is not. `/post/preview` still renders `<PostingAsBlock>` because that surface IS the identity moment.
3. **Edit page — caption textarea auto-grows.** New `captionRef` + effect that resets height to `auto` then clamps `scrollHeight` between 78px (prior static minimum, unchanged first paint for short captions) and 260px (hard cap — pasted essays scroll internally). Manual resize stays off.
4. **Find Detail — Owner Manage block retired entirely.** All three affordances (Edit / Mark as Found a Home / Delete) were duplicates of controls on `/find/[id]/edit`. The pencil bubble on the photograph top-right is now the sole owner-path entry to the management surface. Dead code cleanup: `Tag` + `Trash2` icon imports, `updatePostStatus` + `deletePost` function imports, `AnimatePresence` motion import, `actionBusy` + `showDelete` state, `handleToggleSold` + `handleDelete` handlers.

**Cleaner surface boundary now:** Find Detail is the **reading surface**; Edit is the **management surface**. No duplicate affordances across the two routes. Documented in both file header comments so future sessions don't re-introduce them.

### Session 31E close HITL
1. ✅ Both files written via `filesystem:write_file` (full rewrites; see Tech Rule candidate below) and verified on disk
2. ✅ `npm run build` green
3. ✅ Committed + pushed
4. ✅ On-device QA walked end-to-end and passed

### Session 31E Tech Rule candidate (add to 31D promotion batch)

**Box-drawing anchors → always full rewrite, not surgical edit.** Session 23 added a Tech Rule saying "anchor on unique code content, not on rule lines with box-drawing." Session 31E proved that rule insufficient in practice: even when trying to avoid box-drawing in the anchor, the tool landed on adjacent lines that STILL contained box-drawing in their rendered match context, and failed. Additionally, the `}\n\n` sequence is non-unique in files with multiple top-level functions (e.g. `SoldLanding` then `FindDetailPage`), so even non-box-drawing anchors matched the wrong occurrence and silently broke module-top-level structure. Total cost of the session-31E detour: ~30 minutes to do surgical edits, ~3 minutes to write two full files.

**Proposed upgrade:** *"When a file contains any box-drawing characters (─, ═, ═══, ║, etc.) anywhere — including rule lines in existing comments that won't be touched by the edit — OR when a proposed `filesystem:edit_file` batch has more than 2 anchors, skip directly to `filesystem:write_file` with the full corrected content. The full-rewrite cost is bounded (one tool call per file, fully in context already from session-open reads); the surgical-edit cost is unbounded when anchors fail mid-batch and leave the file in a partial state."*

Pairs with the box-drawing rule from session 23 as a hierarchy: session 23 = "don't anchor on box-drawing"; session 31E = "if the file contains box-drawing at all, just rewrite it." Fired across sessions 16, 19A, 21A, 22A, 23, now 31E — six occurrences is enough evidence.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 31E — v1.2 polish pass shipped: Edit page cleanup + Find Detail Manage block retirement)

**Status:** ✅ v1.2 polish complete and verified on device. Beta-readiness now gated by Sprint 4 tail (not a blocker for on-device testing, but the last pre-beta tech work).

### Session 32 candidate queue

**Recommended warm-ups (from session 31 original queue, still pending):**
- **31C — Promote "secrets scan before commit" Tech Rule** into `docs/DECISION_GATE.md` per session-29 SECURITY-INCIDENT postmortem. ~5 min.
- **31D — Promote four Tech Rule candidates** into `docs/DECISION_GATE.md`. ~15 min.
  - Session-30 #1: File-creation verify immediate, not deferred (read-after-write for every NEW file).
  - Session-30 #2: `mkdir -p` flagged upfront for bracket-path routes (process discipline, no new rule).
  - Session-30 #3: Stage-machine narrowing cast as committed pattern.
  - **Session-31E #4 (new):** Box-drawing anchors → always full rewrite. See detail in session-31E close above.
- **31B — Anthropic model audit + billing safeguards.** ~30 min. Swap `/api/suggest` from Opus 4.6 → 4.7, enable Anthropic console auto-reload, add pre-beta credit floor checklist item.

**Main work candidate — Sprint 4 tail batch (31A):**
- 🟡 T4c copy polish — `/api/setup/lookup-vendor` error + `/vendor-request` success screen. ~30 min.
- 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow. ~4 hrs. **Recommend dedicating a full session to T4b.**
- 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs. **Runs after T4b ships.**
- 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.

**Recommended batch shape for session 32:** 31C + 31D as 20-min opener (cheap doc housekeeping, four Tech Rules formalized in one pass) → T4c + 31B + test data cleanup as ~60-min sub-batch → leave T4b + T4d for dedicated session 33.

**Other pending (Sprint 5 + Sprint 6):**
- **31F — `<MallSheet>` migration to `/vendor-request`** (last remaining consumer, deferred since v1.1k).
- **31G — Nav Shelf decision + BottomNav rework** (Sprint 5).
- **31H — Guest-user UX batch** (Sprint 5).

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

_None._ All KIs closed. Design debt empty. v1.2 post-flow trilogy shipped session 30. v1.2 polish pass shipped session 31E. Last tech work before beta-ready is Sprint 4 tail (open, not a blocker for on-device testing).

### 🟡 Remaining pre-beta tech work

- **Sprint 4 tail batch** — now the longest-parked pre-beta item.
  - 🟡 T4c copy polish — `/api/setup/lookup-vendor` error + `/vendor-request` success screen. ~30 min.
  - 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow. ~4 hrs.
  - 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.
- **Anthropic model audit + billing safeguards** (session-28G/28H). ~30 min combined.
- **Tech Rule promotions** (31C + 31D). ~20 min combined, four rules.

### 🟡 Sprint 5 + design follow-ons

- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
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
- `docs/design-system-v1.2-draft.md` (tombstone; retire now that v1.2 shipped)
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — can retire now that v1.2 polish is in ✅
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- Historical mockup HTML files in `docs/mockups/` (retire as versions ship)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence
