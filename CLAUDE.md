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

## ✅ Session 30 (2026-04-20) — v1.2 post-flow trilogy shipped

The three approved mockups from session 28 are now real: `/post` retires to a redirect shim, `/post/preview` rewrote to the v1.2 "Review your find" page with the photo truth rule, and a brand-new `/find/[id]/edit` route delivers autosave + status toggle + photo replacement + quiet remove-from-shelf. All eleven items in `docs/design-system-v1.2-build-spec.md` are on disk and verified. Final `npm run build` was green after one TypeScript over-narrowing fix on `/post/preview`.

**Beta readiness note:** with v1.2 done, the post-flow trilogy is no longer on the critical path. Sprint 4 tail (T4b/T4c/T4d) is now the longest-parked pre-beta item — next session should pick it up.

---

## CURRENT ISSUE
> Last updated: 2026-04-20 (session 30 — v1.2 post-flow trilogy shipped: Review page rewrite + new Edit page + AddFindSheet + four new primitives + new PATCH API route + Find Detail owner-edit bubble)

**Status:** ✅ All 11 build-spec items shipped and verified on disk. Build green after one TS fix. Ready to commit + deploy + on-device QA.

### What shipped this session (30)

**New components (4):**
- `components/AmberNotice.tsx` — formalizes the graceful-collapse-failure amber pattern (session-27 pattern promoted to primitive)
- `components/PostingAsBlock.tsx` — vendor attribution row (pin + IM Fell 16px name + system-ui 13px booth/mall/city, 0.5px hairline border-bottom, flex-wrap)
- `components/PhotographPreview.tsx` — the photo truth rule. 4:5 frame, 6px radius, paperCream letterbox, `object-fit: contain`, post-it bottom-right at +6deg, optional `topLeftAction` slot for Edit's Replace-photo pill, `sold` prop that dims the image only (post-it unaffected)
- `components/AddFindSheet.tsx` — bottom sheet modeled on `<MallSheet>`, Frame-3 stripped variant from the mockup: two rows (Camera / ImagePlus glyph + IM Fell 18px label), transform-free centering, stateless (parent owns file inputs)

**New API route:**
- `app/api/my-posts/[id]/route.ts` — `PATCH` endpoint used by Edit for autosave + status toggle + photo-url update. `requireAuth` + ownership check (vendor.user_id match, admin bypass). Whitelists title / caption / price_asking / status / image_url. 20/60s rate limit. 🖐️ Required `mkdir -p` before the write (bracket-path route directory).

**New page route:**
- `app/find/[id]/edit/page.tsx` — "Edit your find" page. Mode C masthead, `<PhotographPreview>` + Replace-photo pill, `<PostingAsBlock>`, four fields (Title / Caption / Price / Status). Autosave: 800ms debounce per text field, immediate write on status toggle + photo replace. Saved check glyph appears next to field label for 2s on success. Amber notice with Retry link appears above field on failure. Quiet "Remove from shelf" red italic dotted-underline text link at bottom with inline confirmation. 🖐️ Required `mkdir -p` before the write.

**Full rewrites:**
- `app/post/page.tsx` → ~25-line redirect shim pointing at `/my-shelf?openAdd=1`, preserves `?vendor=id` admin impersonation. Legacy `/post` link inbound paths keep working.
- `app/post/preview/page.tsx` → v1.2 Review page. Mode C masthead, IM Fell 24px "Review your find" + italic subhead "Here's how shoppers will see it." Consumes all three primitives above. Retires the Edit/Done pill pattern (fields always editable), retires the inline `C` palette, retires Georgia entirely from this surface. "Publish" CTA (per spec §4). Success screen uses paper-wash check bubble + three stacked actions.

**Modified (surgical):**
- `lib/tokens.ts` — extended v1 with `inkWash` (form-input bg) + `amber` / `amberBg` / `amberBorder` (notice family).
- `app/my-shelf/page.tsx` — wires `<AddFindSheet>`, hidden camera + gallery file inputs, `?openAdd=1` on-mount handler that strips the param after opening, `handleAddFile` that reads → compresses → stashes in `postStore` → routes to `/post/preview` (preserves `?vendor=id`). Passes `onAddClick` through to `WindowView` and `ShelfView`.
- `components/BoothPage.tsx` — `<AddFindTile>` and `<ShelfAddFindTile>` now accept optional `onAddClick` prop. When passed, tile renders as `<button onClick>`; without it, falls back to the v1.1 `<Link href="/post">` for `/shelf/[slug]` (public booth page has no add context). `<WindowView>` and `<ShelfView>` forward `onAddClick` through.
- `app/find/[id]/page.tsx` — owner-viewer swap: when `isMyPost` is true, the top-right Save (Heart) bubble on the photograph swaps for a Pencil (Edit) bubble that routes to `/find/[id]/edit`. Share bubble unchanged. Also fixed the Manage block's "Edit this find" link to route to `/find/[id]/edit` (was `/post/edit/[id]` which doesn't exist).

**Tokens added (v1.2):**
- `v1.inkWash` = `rgba(255,253,248,0.70)` — warm off-white form-input bg
- `v1.amber` = `#7a5c1e`
- `v1.amberBg` = `rgba(122,92,30,0.08)`
- `v1.amberBorder` = `rgba(122,92,30,0.22)`

### Session 30 close HITL

1. ✅ All 11 build-spec items on disk, verified via `filesystem:list_directory` + `filesystem:read_text_file head=3` for each new file
2. ✅ `npm run build` green (after fixing TS over-narrowing on the stage machine — see below)
3. 🟢 **TODO at commit:** `git add -A && git commit -m "feat: v1.2 post-flow trilogy — Review + Edit + AddFindSheet" && git push` then `thc`
4. 🟢 **TODO on device:** walk the new flows end-to-end:
   - `/my-shelf` → tap AddFindTile → sheet opens → tap "Take a photo" → camera → photo picked → `/post/preview` loads with identity correct and photo truth rule honored (no crop)
   - Fill Title → tap "Publish" → success screen → "View my shelf"
   - Tap your own find → edit pencil bubble visible top-right → tap → `/find/[id]/edit` loads with fields prefilled
   - Change title → 800ms → Saved check flashes. Change status to Sold → photo dims + confirmation line appears. Tap Replace photo → pick gallery → confirmation bar appears → Save → new photo swaps in. Tap Remove from shelf → confirmation → Yes, remove → lands on `/my-shelf`
   - Old `/post` URL still works: navigate to `/post?vendor=[id]` → redirects to `/my-shelf?vendor=[id]&openAdd=1` → sheet auto-opens
5. 🟢 **TODO post-QA:** if anything needs polish, queue for a v1.2-polish mini-sprint. Otherwise, session 31 picks up Sprint 4 tail batch as the last pre-beta tech work.

### Notes that came out of the session — worth logging

**Two `mkdir -p` HITLs fired during the sprint.** Both new routes lived behind bracket paths (`app/api/my-posts/[id]` and `app/find/[id]/edit`) and needed the parent directory created in Terminal before `filesystem:write_file` could land the route. Existing Tech Rule covers this — but specs that introduce new `/[param]` routes should list the `mkdir` step as an upfront HITL in the session opener so it doesn't surface mid-build.

**A new orphan-pattern flavor fired** and was caught via file-creation-verify. Early in the session, several `filesystem:write_file` calls for NEW files returned "Successfully wrote" but the writes landed in an MCP tool-container sandbox that mirrored the Mac path instead of reaching the real Mac filesystem. The pattern stayed invisible until the post-sprint verify pass ran `filesystem:list_directory` and noticed the four new primitives + Review rewrite weren't on disk. They were then rewritten and verified. Root cause unclear — possibly tied to the pre-`mkdir` MCP state — but the existing session-25 verify rule caught it. **Candidate Tech Rule upgrade (30C-prime):** require an immediate `filesystem:read_text_file head=3` after every `filesystem:write_file` for a NEW file (not an overwrite), to catch the silent-sandbox-write class before dependent work gets built on top of it. Details below.

**TypeScript over-narrowing bit the Review page.** The `Stage` union narrowing after three early returns made a runtime-reachable `stage === "publishing"` comparison look unreachable at compile time. Fix was a one-line `(stage as Stage)` cast plus an `isPublishing` boolean used everywhere downstream. Left with an explanatory comment block at the cast site. Worth internalizing for future stage-machine patterns in this codebase — early-return narrowing in render functions is common enough that it may warrant a committed pattern doc.

### Session 31 candidate queue

- **31A — Sprint 4 tail batch (longest-parked pre-beta item).** Now at the front of the queue since v1.2 shipped.
  - 🟡 T4c copy polish — `/api/setup/lookup-vendor` error + `/vendor-request` success screen. ~30 min.
  - 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow. ~4 hrs.
  - 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.
- **31B — Anthropic model audit + billing safeguards (session-28 carryover).** ~30 min. Swap `/api/suggest` from Opus 4.6 → 4.7, enable Anthropic console auto-reload, add pre-beta credit floor checklist item.
- **31C — Promote "secrets scan" Tech Rule** into `docs/DECISION_GATE.md` per session-29 SECURITY-INCIDENT postmortem. ~5 min.
- **31D — Promote three session-30 close-ritual Tech Rule candidates** into `docs/DECISION_GATE.md` if deemed worth formalizing. ~10 min. See list below.
- **31E — v1.2 on-device polish pass** (only if QA surfaces something worth revisiting before beta).
- **31F — `<MallSheet>` migration to `/vendor-request`** (last remaining consumer, deferred since v1.1k).
- **31G — Nav Shelf decision + BottomNav rework** (Sprint 5).
- **31H — Guest-user UX batch** (Sprint 5).

**Recommended for session 31:** 31C + 31D as 15-min openers (cheap doc housekeeping) → 31A as main work.

### Session 30 Tech Rule candidates (for 31D promotion)

Three close-ritual hardening moves surfaced during this session:

1. **File-creation verify — immediate, not deferred.** The session-25 rule says "verify new files at session close." The session-30 flavor showed that by session close, 400+ lines of dependent work may already be built on top of a silently-missed write. Upgrade the rule: *"After every `filesystem:write_file` for a NEW file (not an overwrite of an existing file), follow immediately with `filesystem:read_text_file head=3` on the same path before any further work. If the read fails or returns stale content, stop and re-write before proceeding."* Cost: one extra tool call per new file.

2. **`mkdir -p` flagged upfront for bracket-path routes.** Specs that declare new `/[param]` routes should surface the `mkdir` HITL in the session opener block rather than letting it surface mid-build as a 🚧 BLOCKED. Mechanical — no new rule needed — but a process discipline worth logging.

3. **Stage-machine narrowing cast as committed pattern.** React render functions with Stage-union early returns reliably over-narrow TypeScript's view of the remaining state variable. The one-line `const isX = (state as TState) === "x";` pattern solves it cleanly without suppressing real unreachability checks. Document once so future stage-machine work doesn't rediscover it.

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

_None._ All KIs closed. Design debt empty. v1.2 post-flow trilogy shipped session 30. Last tech work before beta-ready is Sprint 4 tail (open, not a blocker).

### 🟡 Remaining pre-beta tech work

- **Sprint 4 tail batch** — now the longest-parked pre-beta item.
  - 🟡 T4c copy polish — `/api/setup/lookup-vendor` error + `/vendor-request` success screen. ~30 min.
  - 🟡 T4b admin surface consolidation — `/admin/login` disposition, `/shelves` AddBoothSheet retirement, admin BottomNav cleanup, possibly new Add-Vendor sub-flow. ~4 hrs.
  - 🟡 T4d pre-beta QA pass — walk all three flows end-to-end against clean DB. ~1–2 hrs.
  - 🟢 Session-13 test data cleanup — 5+ "David Butler" variants via admin-runbook Recipe 4. ~5 min.
- **Anthropic model audit + billing safeguards** (session-28G/28H). ~30 min combined. Swap `/api/suggest` to Opus 4.7; enable Anthropic console auto-reload; add pre-beta credit floor checklist item.

### 🟡 Sprint 5 + design follow-ons

- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)). v1.2 shipped `<AddFindSheet>` but `/vendor-request` is the last consumer still on the old inline chrome.
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
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — can retire once on-device QA confirms the build holds
- `components/ShelfGrid.tsx` (parked retention comments; zero callers)
- Historical mockup HTML files in `docs/mockups/` (retire once on-device QA confirms versions hold)
- `/post` redirect shim — can delete entirely post-beta once inbound references are audited

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence
