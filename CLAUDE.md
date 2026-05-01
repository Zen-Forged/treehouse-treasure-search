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

## ✅ Session 94 (2026-04-30) — Capture flow refinement shipped end-to-end + scheduled cleanup agent — 4 commits + close

David's session 93 closer recommended iPhone QA of Wave 1 follow-up + R1 design pass. He redirected at standup to a **capture-and-add-find UX refinement bundle** — vendors hitting the post flow had no masthead on /post/tag, no booth-chrome trim on /post/preview, no retake affordance, and a post-publish interstitial David wanted gone. 12 specific items bundled (Home 1a, masthead system-wide bump, /post/tag a-c, /post/preview d-k, post-publish redirect). Three mockup iterations + 1 text refinement + 4 implementation commits.

**Arc — V1 → V2 → V3 mockup-first → ship.** Three mockup rounds:

| Phase | Output | Key moves |
|---|---|---|
| Scoping | Read /post/tag + /post/preview + StickyMasthead + AddFindSheet, mapped 12 items to 5 surfaces, surfaced 8 clarifying questions with my-read on each | Per session-93 lesson "surface conflation issues before editing" — read all affected surfaces BEFORE drafting. David said "take my best read and build V1." |
| V1 mockup | [`docs/mockups/capture-flow-refinement-v1.html`](docs/mockups/capture-flow-refinement-v1.html) — 5 frames | Frame 1 (3 phones side-by-side comparing 65/75/90px wordmark + +18/+25/+40 height pairings), Frames 2+3 (capture flow). Decisions pane + 4 multiple-choice questions. David: Q1=C (90/+40 — heaviest, breaking his initial +25 cap), Q2=copy rewrite (instructional), Q3=no cap caption, Q4=labels below polaroid. **First firing of "surface coupled-requirement conflict in user spec"** — David's +25 height + bigger wordmark requirements diverged at the heavy end (90 wordmark forced +40 not +25). Made the trade explicit in 3 paired options instead of silently picking one constraint. |
| V2 mockup | [`docs/mockups/capture-flow-refinement-v2.html`](docs/mockups/capture-flow-refinement-v2.html) — 3 frames | Q1=C baked. Q2 copy: "Take a photo of the tag" + "We'll read the title and price right off the tag, so you don't have to type them in." Q4 confirmed. **NEW: retake affordance scoped in** (italic dotted-link below Find polaroid on /post/tag ready + /post/preview, AI APIs do NOT re-fire — David's hard constraint). 2 new picks: Q5=/post/preview subtitle, Q6=Tag retake. David: Q5="Make sure everything looks right before publishing.", Q6=defer Tag retake. **5th firing of [`feedback_v2_mockup_as_fill_refinement.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_v2_mockup_as_fill_refinement.md)** — V2 was fill-refinement within picked options. |
| V3 mockup | [`docs/mockups/capture-flow-refinement-v3.html`](docs/mockups/capture-flow-refinement-v3.html) — 3 frames + commit-ready | Vertical centering applied per David's late add ("vertically center title and images as possible — utilize the space appropriately"). Middle band = flex column with `justify-content: center`. Falls to top-anchored scroll on overflow gracefully. David approved with one tweak: shift /post/preview title down a bit more (D15), accepting a small scroll on the content-heavy page. "no mockup needed. write the build spec + ship." |

**Implementation (4 runtime commits, smallest→largest sequence per [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md)).** 22nd+ firing.

| Commit | Scope |
|---|---|
| `955eef1` | docs(post): design record + V1/V2/V3 mockups (D1-D15 frozen at [`docs/capture-flow-refinement-design.md`](docs/capture-flow-refinement-design.md)) |
| `3f7e92d` | feat(home): drop VendorCTACard from feed footer (1a — 13 lines deleted) |
| `5b78225` | feat(masthead): wordmark 50→90 + masthead +40 system-wide (~13 ecosystem pages affected) |
| `8db9a96` | feat(post): /post/tag + /post/preview refresh + Find retake (610 + / 589 −, AddFindSheet `title` prop added) |

**/post/tag changes (D3-D6, D13-D14):** Bespoke sticky chrome retired → `<StickyMasthead />`. Centered title + italic subtitle below masthead. New instructional ready-state copy. Find + Tag photos in polaroid wrappers, stacked vertically with lowercase italic Lora "find"/"tag" labels below. Find retake link below polaroid → opens `<AddFindSheet title="Replace photo" />` → file picker → `postStore.imageDataUrl` updates → no API refire. Vertical centering on middle band.

**/post/preview changes (D7-D15):** Title + Caption + Price moved ABOVE the photo. `<PostingAsBlock />` + `<PhotographPreview />` retired here (preserved for `/post/edit/[id]`). New inline `<PolaroidPreview />` replaces framed-photograph chrome. Booth-location post-it gone. Input bg `v1.inkWash → v1.postit` (#fbf3df, matches /login/email). Caption auto-grows via `useEffect` on `scrollHeight` (resets to "auto" first to allow shrink on delete). `overflow:hidden`, no internal scroll. Disabled publish unified `rgba(30,77,43,0.40) + #fff` (matches /vendor-request + /login/email; was inkWash + inkFaint snowflake). Post-publish "View my shelf / Add another find" interstitial dropped — `router.replace(myShelfHref)` directly. Find retake same shape as /post/tag. Vertical centering with extra title-block top padding (D15).

**AddFindSheet:** New optional `title` prop (default "Add a find"). Retake callers pass "Replace photo". `/my-shelf` (existing caller) unaffected — uses default.

**Build green** — only pre-existing img/Image warnings on unrelated files.

**No iPhone QA this session — 5 watch-items handed off to session 95:**
1. Masthead +40 system-wide on ~13 pages — heaviest brand anchor; ~40px above-the-fold lost on Home.
2. /post/tag adopt path: /my-shelf → take-photo → /post/tag → confirm copy + polaroid + retake. Tap Retake → "Replace photo" sheet → file pick → fields untouched.
3. /post/preview: title + caption + price above polaroid. Long-paste into Caption to verify auto-grow with no cuts. Disabled publish 40%-green-with-white. Publish → /my-shelf directly. Admin `?vendor=<id>` lands back on booth.
4. Polaroid carve-out deviation flagged in design record — if it reads off against the rest of the polaroid roster on iPhone, easy retire.
5. iOS Safari auto-grow textarea behavior — keyboard interaction quirk possible.

**Scheduled agent created:** `trig_017455nMVrTTZb6PxYnYcYZY` fires **Thu May 21 9:00 AM EDT** (3-week soak) → checks if `components/VendorCTACard.tsx` is still unused → opens cleanup PR `cleanup/drop-vendor-cta-card` if clean, reports reintroduction otherwise. Will not auto-merge. Manage at https://claude.ai/code/routines/trig_017455nMVrTTZb6PxYnYcYZY.

**Memory updates:** None this session.
- 5th firing of `feedback_v2_mockup_as_fill_refinement.md` — already promoted via memory.
- 22nd+ firing of `feedback_smallest_to_largest_commit_sequencing.md` — already promoted.
- "Surface coupled-requirement conflict in user spec" — first firing (Q1=C decision moment). Tech Rule queue candidate on second firing.
- "AI APIs skip on retake/redo unless explicitly stated" — first firing as a structural pattern (David's hard constraint). Tech Rule on second firing.
- "Drop done-stage interstitials when redirect target is sufficient" — first firing (D12). Tech Rule on second firing.

**Operational follow-ups (carry into session 95):**

- **🟡 NEW PRIMARY (session 94): iPhone QA of session 94 ship.** 5 watch-items above. Most leverage: confirm masthead +40 reads premium-not-bloated against the now-shorter feed; confirm capture flow end-to-end across the new layout + retake path.
- **🟢 NEW (session 94): Scheduled VendorCTACard cleanup agent fires May 21.** Auto-handles via routine. PR review (or report read) is the only HITL.
- **🟡 CARRY (session 92→93→94): iPhone QA of Wave 1 follow-up commits still un-walked.** Three session-92 design refinements (`8ec7884` contact email split, `4b515b2` mall hero relocation, `b6919b7` EditBoothSheet hero consolidation). Could bundle with session-94 QA pass.
- **🟢 CARRY (session 93): R1 (shopper accounts) routing slot pre-baked.** Login routing model anticipates 3rd "I'm shopping" card slot. Largest unblocked R-item.
- **🟢 CARRY (session 93): /admin/login + /setup callsites stay routing through triage.**
- 🟡 CARRY (session 92): `inspect-grants.ts` heuristic refinement (~20 min).
- 🟡 CARRY (session 92): Migration 010 + 011 staging gap.
- 🟢 CARRY (session 92): AI-route auth deferred.
- 🟡 CARRY (session 91): `vendor_request_approved` admin actor lacking `_by_admin` suffix.
- 🟡 CARRY (session 91): Q-014 Metabase scoping.
- 🟡 CARRY (session 91): Q-015 admin Vendors tab.
- 🟡 CARRY (session 91): feed pagination — Wave 1 explicit out-of-scope.
- 🟡 CARRY (session 89): BoothHero pencil-vs-bookmark symmetry question. UNTOUCHED.
- 🟡 CARRY (session 88): motion design revisit. UNTOUCHED.
- 🟡 CARRY (session 88): preview-cache role audit. UNTOUCHED.
- 🟡 CARRY (session 87): wordmark asset-weight optimization. UNTOUCHED — bumped 90px now too.
- 🟡 CARRY (session 87): docs/design-system.md wordmark spec stale (now also includes 90px height + +40 masthead from session 94).

**Roadmap movement:** No new R-items. Capture flow refresh moves the in-product UX an inch closer to launch-ready.

**Commits this session (4 runtime + close):**

| Commit | Message |
|---|---|
| `955eef1` | docs(post): capture flow refinement design record + V1/V2/V3 mockups |
| `3f7e92d` | feat(home): drop VendorCTACard from feed footer |
| `5b78225` | feat(masthead): bump wordmark 50→90px + masthead +40px system-wide |
| `8db9a96` | feat(post): capture flow refresh — /post/tag + /post/preview + retake |
| (session close) | docs: session 94 close — capture flow refinement shipped + cleanup agent scheduled |

---

## ✅ Session 93 (2026-04-30) — Login triage shipped end-to-end + iPhone QA passed — 1 commit + close (rotated to mini-block session 94 close)

> Full block rotated out at session 94 close. Net: 1 runtime commit splitting `/login` into a triage page (returning vendor + new vendor cards + "Just shopping?" guest disambiguation + Contact us footer) + `/login/email` for the OTP form (vertically centered, warm postit white inputs, sign-out italic dotted-link). Magic-link callback URL preserved at /login per path (a) decision — no `lib/auth.ts` or email-template changes. Two inbound `/login` callsites (`/vendor-request` "Sign in instead" + `/my-shelf` re-auth bounce) upgraded to `/login/email` directly to skip triage for known returning users. Two self-caught bugs fixed before push (React hook-ordering after early-return + URLSearchParams typing). iPhone QA passed end-to-end across 6+ routing paths. R1 (shopper accounts) routing slot pre-baked — when R1 ships, Screen 1 gains a 3rd "I'm shopping" card + Screen 2 title generalizes. Smallest→largest sequencing fired 20+. NEW first-firings: triage-first routing for ambiguous-state pages, inbound deep-link audit when splitting routes, forward-known-states + render-fresh-states routing primitive.

_(Session 93 detailed beat narrative removed at session 94 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings + the session 94 block above for the capture flow context that built on session 93's `/login`+`/login/email` split.)_

---

## ✅ Session 92 (2026-04-30) — Wave 1 follow-up + Wave 1.5 security closed end-to-end — 11 commits + close (rotated to mini-block session 93 close)

> Full block rotated out at session 93 close. Net: 11 runtime commits across two arcs. **Act 1 — Wave 1 design refinements (3 commits):** contact email split (`8ec7884` — caught `NEXT_PUBLIC_ADMIN_EMAIL` conflation between admin gating identity + public-facing contact email; hardcoded `info@kentuckytreehouse.com` at `/contact` + 3 `replyTo` sites in `lib/email.ts`), mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions (`4b515b2` — reused `<FeaturedBanner variant="eyebrow">` primitive, net -20 lines), EditBoothSheet hero consolidation (`b6919b7` — retired BoothHero on-photo Pencil + Trash + scrim, moved replace + remove controls into sheet's "Booth photo" section). **Act 2 — Wave 1.5 security continuation (8 commits):** `/api/vendor-hero` + `/api/post-image` auth+ownership tightened (`c811f97` + `58f73ac`), real multi-booth ownership bug fixed in `/api/my-posts/[id]` (`3f76871` — `.eq("user_id").maybeSingle()` errors when user owns >1 booth, latent 500 since session 57), orphan `/api/debug` deleted (`3cd5fab`), migration 017 (function search_path) + diagnostic (`ce48f29`), migration 018 (role-grant + auth.users exposure RPC) + diagnostic (`56d92b0`), runbook updates for OTP/password manual procedure (`c5b48bb`) + AI-route auth deferral (`d6480cb`). HITL: David completed migrations 016/017/018 paste in both projects + OTP→600s + password→8 dashboard toggles. **R1 (shopper accounts) FULLY UNBLOCKED** — every Wave 1.5 hard prereq is green. NEW first-firings: surface auth/identity conflation issues BEFORE editing (the NEXT_PUBLIC_ADMIN_EMAIL catch), multi-booth `maybeSingle()` ownership bug pattern, diagnostic-heuristic-must-cross-reference-RLS-state. Smallest→largest fired 20+ times across both arcs.

_(Session 92 detailed beat narrative removed at session 93 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings + the session 91 mini-block below for the Wave 1 + R5a context that Act 1 followed up on.)_

---

## ✅ Session 91 (2026-04-30) — Strategic reset + Wave 1 cleanup pass shipped end-to-end — 13 commits + close (rotated to mini-block session 92 close)

> Full block rotated out at session 92 close. Net: 13 runtime commits across 7 Wave 1 tasks shipped in one run after David's "true assessment of where we are" opener. Roadmap moved 3/15 → 8/15 — largest single-session jump to date. **R5a 30-day public-feed window** (`618df22`), **5 admin destructive-action audit event types** (`5d4afc8`), **R4a marked shipped via /shelves** with Q-015 captured for the alternative path (`425e111`), **R4b BoothHero remove-photo Trash bubble + DELETE /api/vendor-hero** (`4093033`), **vendor self-edit booth name** via EditBoothSheet vendor mode + `/api/vendor/profile` route (`b2fe8f9`), **R7 /contact page** Frame C minimal mailto rows + `/login` discovery link (`13f5678` mockup + `2978504` impl), **R11 mall hero images** with migration 016 + admin upload UI + Frame A photo-above-MallScopeHeader feed render (`677853c` mockup + `d3864ba` migration + `68c8e41` impl). **CRITICAL: at session 92 close, the R4b Trash bubble + on-photo Pencil affordances were RETIRED** when David asked to consolidate hero edit into EditBoothSheet — but the migration 016 column + admin upload route + the position-below-MallScopeHeader composition all carry forward (the position was flipped from "above" to "below" MallScopeHeader at session 92 close per David's redirect). The vendor self-edit Pencil at the booth title becomes the sole booth-edit entry point. Smallest→largest fired 16th–19th times.

_(Session 91 detailed beat narrative removed at session 92 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings + the session 92 block above for the EditBoothSheet hero consolidation that subsumed Wave 1 task 4's separate-bubble approach.)_

---

## ✅ Session 90 (2026-04-30) — Auth chrome relocation + masthead share primitive — 7 runtime commits + close (rotated to mini-block session 91 close)

> Full block rotated out at session 91 close. Net: 7 runtime commits across 2 directive arcs. **BottomNav restructured** with always-second-position **Profile** tab routing to /login (replaces masthead sign-in/sign-out chrome on Home + /flagged). Profile icon outline turns `v1.green` when authed (label stays muted; outline-only per directive). **Booths nav fully admin-gated** (vendors lose it too — discover via feed). **Admin tab uses `IoKey` from `react-icons/io5`** (Shield retired). **Sign-out moved to /login** as italic dotted-link below "First time? An account…" — `/login` no longer auto-redirects already-authed users on bare visits (only on explicit `?redirect=`). **/login icon visual** — bg circle dropped, CircleUser glyph 22→44 + stroke 1.4→1.2. **`MastheadShareButton` primitive** baked into StickyMasthead as default right slot; opt out via `right={null}` on Home/Booths/Saved. **/find/[id] strip shadow clearance** via padding adjustment. Smallest→largest fired 14th + 15th times.

_(Session 90 detailed beat narrative removed at session 91 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings. Session-90 design state — BottomNav 3-tab guest / 4-tab vendor / 5-tab admin, Profile-icon-green-when-authed, IoKey admin, masthead default share with `right={null}` opt-out, /login italic dotted-link sign-out — all carried into session 91 untouched.)_

---

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–93 still missing — operational backlog growing). Session 88 mini-block retired at session 93 close + Session 89 mini-block retired at session 94 close (tombstone bullets below stay as historical record). Visible window now sessions 90–93 mini + 94 full.

- **Session 93** (2026-04-30) — Login triage shipped end-to-end + iPhone QA passed: 1 runtime commit splitting `/login` into a triage page (returning vendor + new vendor cards + "Just shopping?" guest disambiguation + Contact us footer) + `/login/email` for the OTP form. Magic-link callback URL preserved at `/login` per path (a) decision — no `lib/auth.ts` or email-template changes. Two inbound `/login` callsites (`/vendor-request` "Sign in instead" + `/my-shelf` re-auth bounce) upgraded to `/login/email` directly to skip triage for known returning users. Two self-caught bugs fixed before push (React hook-ordering after early-return + URLSearchParams typing). iPhone QA passed end-to-end across 6+ routing paths. R1 (shopper accounts) routing slot pre-baked. NEW first-firings: triage-first routing for ambiguous-state pages, inbound deep-link audit when splitting routes, forward-known-states + render-fresh-states routing primitive.
- **Session 92** (2026-04-30) — Wave 1 follow-up + Wave 1.5 security closed end-to-end: 11 runtime commits across two arcs. Act 1 shipped 3 design refinements David surfaced during iPhone QA — contact email split (NEXT_PUBLIC_ADMIN_EMAIL conflation caught and avoided), mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions, EditBoothSheet hero consolidation that retired BoothHero on-photo Pencil + Trash + scrim. Act 2 closed Wave 1.5: tightened `/api/vendor-hero` + `/api/post-image` auth+ownership; fixed a real multi-booth ownership bug in `/api/my-posts/[id]` (latent 500 since session 57); deleted orphan `/api/debug`; shipped migration 017 (function search_path) + diagnostic; shipped migration 018 (role-grant + auth.users exposure RPC) + diagnostic; ran OTP/password dashboard toggles. R1 shopper accounts now FULLY UNBLOCKED — every Wave 1.5 hard prereq is green. NEW first-firings: surface auth/identity conflation issues BEFORE editing (NEXT_PUBLIC_ADMIN_EMAIL catch), multi-booth `maybeSingle()` ownership bug pattern, diagnostic-heuristic-must-cross-reference-RLS-state.
- **Session 91** (2026-04-30) — Strategic reset + Wave 1 cleanup pass shipped end-to-end: 13 runtime commits in one session run after David's "true assessment of where we are" opener, after 30+ prior sessions where roadmap stood at 3/15 R-items shipped. Roadmap moved 3/15 → 8/15 (largest single-session jump to date). **R5a 30-day public-feed window**, **5 admin destructive-action audit event types**, **R4a marked shipped via /shelves** with Q-015 captured for the alternative path, **R4b BoothHero remove-photo Trash bubble + DELETE /api/vendor-hero**, **vendor self-edit booth name** via EditBoothSheet vendor mode + `/api/vendor/profile` route, **R7 /contact page** Frame C minimal mailto rows + `/login` discovery link, **R11 mall hero images** with migration 016 + admin upload UI + Frame A photo-above-MallScopeHeader feed render. Smallest→largest fired 16th–19th times. **NOTE: at session 92 close, the R4b Trash bubble + on-photo Pencil affordances were RETIRED** — David asked to consolidate hero edit into EditBoothSheet, so the photograph reads clean and replace+remove live in the sheet at the title-Pencil entry point. Migration 016 column + admin upload route preserved; mall hero composition position flipped from "above" to "below" MallScopeHeader.
- **Session 90** (2026-04-30) — Auth chrome relocation + masthead share primitive: 7 runtime commits across two directive arcs. **BottomNav restructured** with always-second-position **Profile** tab routing to /login (replaces masthead sign-in/sign-out chrome on Home + /flagged). Profile icon outline turns `v1.green` when authed (label stays muted; outline-only). **Booths nav fully admin-gated** (vendors lose it too — discover via feed). **Admin tab uses `IoKey`** from `react-icons/io5`. **Sign-out moved to /login** as italic dotted-link below "First time?…" — `/login` no longer auto-redirects already-authed users on bare visits (only on explicit `?redirect=`). **/login icon visual** — bg circle dropped, CircleUser glyph 22→44 + stroke 1.4→1.2. **`MastheadShareButton` primitive** baked into StickyMasthead as default right slot; opt out via `right={null}` on Home/Booths/Saved primary tabs. **/find/[id] strip shadow clearance** via padding adjustment. Smallest→largest fired 14th + 15th times.
- **Session 89** (2026-04-29) — Design intentionality pass: 9 runtime commits across two arcs (5-commit directive bundle + 4-commit iPhone QA follow-up). Masthead bubble system bump (wordmark 40→50, ~13 ecosystem back-buttons 38→44, share airplanes 18→22). Flag → Leaf glyph system-wide (FlagGlyph internals → PiLeafBold/PiLeafFill from react-icons/pi). Save/Saved/Unsave terminology revert with internal identifiers preserved. Guest BottomNav simplified 3 tabs → 2 (then properly admin-gated session 90). Notification badge stripped of stroke + bumped 16→20. /vendor-request adopted StickyMasthead + retitled "Create your digital booth". /login icon /logo.png → CircleUser. /flagged 3-col grid + masthead lifted Home's sign-in/sign-out pattern. BoothHero bookmark top-right → bottom-left at 44/22. /find/[id] More-from-this-booth strip adopts polaroid (reverses session-83's "browse vs navigate" rule per cross-page consistency). Smallest→largest fired 12th + 13th times.
_(Session 87 + Session 88 tombstones rotated off at session 94 close — sessions 87–93 missing from `docs/session-archive.md`; backfill remains operational backlog.)_

---

## CURRENT ISSUE
> Last updated: 2026-04-30 (session 94 close — capture flow refinement shipped end-to-end. /post/tag adopts shared masthead + new instructional copy + Find/Tag polaroids + Find retake. /post/preview: Title/Caption/Price above polaroid, postit-cream input bg, auto-grow caption, no booth chrome, no post-publish interstitial. Home VendorCTACard dropped. Masthead +40 + wordmark 90 system-wide. 4 runtime commits + close. Cleanup agent scheduled May 21. iPhone QA pending.)

**Working tree:** clean (after close commit). **Build:** green. **Beta gate:** unblocked. **Net change this session:** 4 runtime commits + close. Capture flow end-to-end overhaul; masthead bumped system-wide. R1 hard prereqs all green from session 92; routing slot still pre-baked from session 93. No regressions in build. Roadmap unchanged at 8/15 (capture flow ≠ R-item).

### 🚧 Recommended next session — iPhone QA bundle: session 94 + Wave 1 follow-up + R1 design pass (~90–120 min)

Bundled walk to catch any drift from the +40 masthead system-wide change AND the capture flow rewrite AND the still-unwalked session-92 follow-ups. Then R1 (shopper accounts) design pass if QA clean.

**Why this shape:**
- The +40 masthead affects ~13 pages — has the highest blast radius of anything shipped recently. Quick walk closes risk.
- Capture flow rewrite is a critical user journey — verify end-to-end before declaring shipped.
- Wave 1 follow-up commits from session 92 still un-walked. Bundle into one QA pass to clear the backlog.
- R1 (shopper accounts) is the largest unblocked R-item; ~30% pre-baked into session 93's routing model. R1 unblocks R8 (onboarding) + R9 (push) + R14 (vendor enrichment) downstream.

**Plan (in order):**

1. **🖐️ HITL — iPhone QA walk (~25 min):**
   - **Masthead +40 system-wide** — glance at Home / /flagged / /find/[id] / /shelf/[slug] / /my-shelf / /shelves / /vendor-request / /contact / /post/tag / /post/preview for the heavier wordmark + ~40px chrome. Confirm reads premium-not-bloated against the now-shorter feed-area.
   - **/post/tag adopt path** — /my-shelf → take photo → land on /post/tag → confirm new instructional copy ("Take a photo of the tag" + "We'll read the title and price right off the tag…") + Find polaroid + lowercase italic "find" label + Retake link. Tap Retake → "Replace photo" sheet → file pick → confirm Title / Caption / Price untouched (no AI re-fire).
   - **/post/preview** — Title + Caption + Price above polaroid. Long-paste into Caption to verify auto-grow with no cuts. Disabled publish reads 40%-green-with-white. Hit Publish → land on /my-shelf directly (no interstitial). Admin `?vendor=<id>` impersonation lands back on booth.
   - **Polaroid carve-out** — flagged in design record; if it reads off against the rest of the polaroid roster on iPhone, easy to retire.
   - **Wave 1 follow-up watch-items** (carry from session 92 close): /contact mailto handoff, mall hero composition BELOW MallScopeHeader, /my-shelf BoothHero clean + EditBoothSheet hero photo section, /shelves admin EditBoothSheet hero controls.
2. **Address concrete issues from #1.** Likely 0–3 small commits.
3. **R1 design pass (~60–80 min, mockup-first).** Login routing model from session 93 already provides Screen 1 (triage cards) + Screen 2 (form). R1's job: (a) add 3rd "I'm shopping" card, (b) generalize Screen 2 title "Vendor Sign in" → "Sign in", (c) retire "Just shopping?" line, (d) generalize subtitle. Open Qs: sign-up flow vs magic-link only, saved-finds persistence (authed vs guest-localStorage carry-forward), Profile tab content for authed shoppers, localStorage bookmark invalidation on first auth. Mockup at `docs/mockups/r1-shopper-accounts-v1.html`.

After this session, **R8 (onboarding) + R9 (push) + R14 (vendor enrichment)** are the natural next sprints — gated on R1.

### Alternative next moves (top 4)

1. **Motion design revisit** (~60–90 min, mockup-first). Carry from session 88.
2. **`inspect-grants.ts` heuristic refinement** (~20 min). Cross-reference `audit_rls_state()` to suppress Supabase-default false positives.
3. **/find/[id] right-slot share unification with masthead default** (~15 min). Page-level Send-airplane share duplicates the masthead default.
4. **Wordmark asset-weight optimization** (~15 min). 455KB PNG, now rendered at 90px height, ripe for `next/image` or `pngquant`.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 95 opener (pre-filled — iPhone QA bundle + R1 design pass)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, docs/capture-flow-refinement-design.md, docs/roadmap-beta-plus.md (R1 row). Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: iPhone QA bundle across 3 surfaces (session 94 capture flow + masthead +40, session 92 Wave 1 follow-up, R1 design pass). (1) Walk +40 masthead system-wide on Home / /flagged / /find/[id] / /shelf/[slug] / /my-shelf / /shelves / /vendor-request / /contact / /post/tag / /post/preview. (2) Walk /post/tag adopt path + retake. (3) Walk /post/preview new layout + auto-grow caption + post-publish redirect. (4) Walk session-92 follow-ups (/contact mailto, mall hero composition, EditBoothSheet hero). (5) R1 mockup-first design pass.

PROBLEMS SESSION 94 ALREADY SOLVED — don't accidentally revive: (a) Home VendorCTACard dropped — do NOT reintroduce. The "Request Digital Booth" CTA lives on /login + /login/email. Cleanup agent fires May 21 to delete the unused component file. (b) Masthead wordmark is 90px / total +40 system-wide. Inner-grid minHeight 90. MASTHEAD_HEIGHT calc constant = +103. Do NOT downsize without a fresh decision pass. (c) /post/tag uses shared <StickyMasthead /> not bespoke chrome. Bespoke sticky block retired. (d) /post/tag ready-state copy is "Take a photo of the tag" + "We'll read the title and price right off the tag, so you don't have to type them in." Do NOT revert to "Now the tag" / "Capture the title and price in one shot." (e) /post/preview Title + Caption + Price are ABOVE the photo. <PostingAsBlock /> + booth post-it removed. <PhotographPreview /> retired here (still used by /post/edit/[id]). (f) Inline <PolaroidPreview /> is the photo treatment on /post/preview — polaroid #faf2e0 mat, 4px radius, dual warm shadow. Carve-out from session-83 "no polaroid on detail surfaces" rule, recorded in docs/capture-flow-refinement-design.md. (g) /post/preview input bg is v1.postit (#fbf3df), not v1.inkWash. (h) Caption auto-grows via useEffect on scrollHeight + reset-to-auto. overflow:hidden, no internal scroll. (i) Disabled publish button is rgba(30,77,43,0.40) + #fff (not inkWash + inkFaint). (j) Post-publish "done" interstitial GONE — router.replace(myShelfHref) on success. Admin ?vendor=<id> preserved through myShelfHref. (k) Find retake on /post/tag + /post/preview opens AddFindSheet (title="Replace photo") → file picker → updates postStore.imageDataUrl → NO /api/post-caption refire, NO /api/extract-tag refire. (l) Tag retake DEFERRED — bad extraction = manual field edit. (m) AddFindSheet now has optional title prop (default "Add a find"). /my-shelf still uses default — do NOT pass a title there.

PROBLEMS SESSION 93 ALREADY SOLVED — don't accidentally revive: (a) /login is the triage page (returning vendor / new vendor cards + "Just shopping?" line + Contact us footer). DO NOT put the OTP form there. (b) /login/email is the OTP form. (c) Magic-link callback URL stays at /login per path (a) decision. (d) /vendor-request "Sign in instead" + /my-shelf re-auth bounce route directly to /login/email. (e) Authed users hitting /login forward to /login/email.

PROBLEMS SESSION 92 ALREADY SOLVED — don't accidentally revive: (a) NEXT_PUBLIC_ADMIN_EMAIL is admin gating identity ONLY — public-facing contact email is hardcoded `info@kentuckytreehouse.com` at /contact + 3 replyTo sites in lib/email.ts. (b) Mall hero renders BELOW MallScopeHeader via <FeaturedBanner variant="eyebrow"> primitive. (c) BoothHero is clean — no on-photo Pencil + Trash + top scrim. (d) EditBoothSheet contract: handleSave calls onClose itself; onUpdated is pure-reconciliation. (e) /api/vendor-hero + /api/post-image require auth + ownership-or-admin. (f) /api/my-posts/[id] PATCH ownership uses combined .eq("user_id").eq("id", post.vendor_id).maybeSingle() (multi-booth-safe). (g) Migrations 016+017+018 applied; OTP expiry 600s + password min 8.

ALTERNATIVES IF DEFERRED: (1) Motion design revisit. (2) inspect-grants.ts heuristic refinement. (3) /find/[id] right-slot share unification. (4) Wordmark asset-weight optimization.

CARRY-FORWARDS FROM SESSIONS 78–94: Phase 3 scroll-restore CLOSED end-to-end. Wordmark `public/wordmark.png` 90px in StickyMasthead (session 94). Masthead total height +40 system-wide. ~13 ecosystem back-button surfaces 44px with ArrowLeft 22. /post/tag + /post/preview both adopt StickyMasthead (session 94). Polaroid pattern owns: /shelf/[slug] WindowTile + ShelfTile + Home masonry tile + /flagged FindTile + /find/[id] ShelfCard + /post/tag Find/Tag photos (session 94) + /post/preview review photo (session 94). PostingAsBlock retired from /post/preview, kept for /post/edit/[id]. PhotographPreview retired from /post/preview, kept for /post/edit/[id]. /login = triage cards (session 93). /login/email = OTP form (session 93). /contact has 3 mailto rows pointing at info@kentuckytreehouse.com. EditBoothSheet supports mode={"admin"|"vendor"} + "Booth photo" section. /api/vendor-hero + /api/post-image require auth + ownership-or-admin. /api/admin/malls/hero-image POST + DELETE admin-gated. RLS enabled on every public table. All public functions have search_path pinned (migration 017). Migrations 016+017+018 applied. OTP expiry 600s + password min 8. R5a getFeedPosts uses gte("created_at", cutoff = now − 30 days). /flagged is 3-col grid. /find/[id] hero photo + flag layoutIds stripped. preview-cache pattern (treehouse_find_preview:${id}) stays. BoothLockupCard owns /shelves + /flagged. IM Fell COMPLETELY RETIRED. AI routes (extract-tag, identify, post-caption, report-comps, story, suggest) deliberately unauthed per session-92 deferral. Tech Rules queue: 0 🟢, ~29 🟡 (sessions 89–94 single-firings stay outside queue per rule — including session 94's surface-coupled-conflict, AI-skip-on-retake, drop-done-interstitial).

SCHEDULED AGENT: trig_017455nMVrTTZb6PxYnYcYZY fires Thu May 21 9:00 AM EDT — checks if VendorCTACard still unused → opens cleanup PR if so, reports otherwise. Manage at https://claude.ai/code/routines/trig_017455nMVrTTZb6PxYnYcYZY.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **R3 admin-Events stale-data mystery** ✅ — **resolved session 73**. Root cause: Next.js HTTP-level data cache intercepting `@supabase/supabase-js`'s internal `fetch()` calls. Two-line fix in [`lib/adminAuth.ts`](lib/adminAuth.ts) (`global.fetch` wrapper). Diag strip + raw probe stay as durable visibility tooling per David's session-73 decision until admin tab retires post-Q-014. Verbose console.logs in `/api/admin/events/route.ts` are now duplicative; cleanup deferred.
- **`/find/[id]` `navigator.share()` instrumentation gap** ✅ — **resolved session 73**. `find_shared` event with `share_method` payload, intent-capture semantic.
- **Items 1 + 5 + 6 + 7 (Gemba polish quartet)** ✅ — **resolved session 74** in `30b9922`. Alphanumeric booth keyboard, FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped.
- **Item 4 (post-publish vendor-param preservation)** ✅ — **resolved session 74** in `d52b149`. Three router.push call sites in /post/preview preserve `?vendor=<id>` so admin lands on booth-of-origin.
- **Items 2 + 3 (booth name + mall edit)** ✅ — **resolved session 74** in `c5437df`. EditBoothSheet + PATCH `/api/admin/vendors` + Pencil bubble rewire on `/shelves`.
- **"Add a booth" affordance restored on /shelves** ✅ — **resolved session 74** in `c5437df`. AddBoothTile + AddBoothSheet (third oscillation, intentional this pass per [`docs/booth-management-design.md`](docs/booth-management-design.md)).
- **Item 1 (session 75) — admin login redirect** ✅ — **resolved session 75** in `60a7a11`. `pickDest(user)` helper routes admins to `/` by default; explicit `?redirect=/foo` still wins.
- **Item 6 (session 75) — BoothHero lightbox on tap** ✅ — **resolved session 75** in `eef1746`. Transparent overlay button at z-5 sandwiched between photo container and pencil/post-it. Mounts only when heroImageUrl present.
- **Item 7 (session 75) — booth-numeral font system** ✅ — **resolved session 75** across `d747b71` + `01a6b44`. `FONT_NUMERAL` (Times New Roman) replaces `FONT_IM_FELL` on Variant B booth lockup numerals + MallScopeHeader count chips. Project-wide rule frozen.
- **Items 2 + 3 + 4 + 5 (session 75) — /vendor-request redesign** ✅ — **resolved session 75** across `a427ee7` + `fbbba21`. One-screen layout, owner-ack checkbox, hard-required Mall+Booth#, FONT_SYS photo dropzone copy, intro paragraph dropped.
- **Item 1 (session 76) — masthead disappears on back-nav** ✅ — **resolved session 76** in `b5470da`. Loading + !post branches now render `StickyMasthead` with back button.
- **Items 3 + 4 (session 76) — green tokens** ✅ — **resolved session 76** in `d0c4ce3` + `fd1a874`. Treehouse Finds wordmark + "Booth" eyebrow + booth numeral all `v1.green` across every applicable surface.
- **Item 2 (session 76) — find-title centered + price below** ✅ — **resolved session 76** across `a2cf548` (record) + `fd1a874` (impl bundle). Frame B picked. Em-dash retired.
- **Item 5 (session 76, E1–E5+E7) — animation consistency** ✅ — **resolved session 76** across `ecb8ef8` + `3832fc1`. 5 motion tokens in [`lib/tokens.ts`](lib/tokens.ts); Booths VendorCard gains tap feedback; empty states unified across 4 primary tabs.
- **Migration 013_owner_acknowledged.sql** ✅ — **resolved session 77** (David ran HITL paste this session per session-77 beat 1).
- **Item 1 (session 76 attempt + session 77 4 attempts) — masthead disappears on PWA back-nav** ✅ — **resolved session 77** in `166ed59` after 5 attempts. Final fix: `position: fixed` + spacer (kills sticky-paint bug class). Earlier 4 attempts (`b5470da`, `361e1de`, `c968c1a`, `d429bbb`) addressed wrong layers — preserved in history as audit trail.
- **Track D phases 1–4** ✅ — **shipped session 77** across `c968c1a` (mockup bundled), `d3ddffb` (design record), `e601db5` (testbed). D1–D14 frozen. Three thumbnail surfaces in scope. **NEW: position:fixed + spacer is masthead's underlying primitive** — `MASTHEAD_HEIGHT` const in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) is single source of truth. **NEW: `/transition-test` is durable diagnostic infrastructure** — keep live for layoutId regressions.
- **Track D phase 5 — surface rollout** ✅ — **shipped session 78** across 11 runtime commits and 6 iPhone-QA cycles. Three surfaces originally live: feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. **Session 80 retired the /shelves source side** when the photo went away from /shelves rows; that surface is now a graceful-no-op morph rather than a shipped morph (destination layoutId on /shelf/[slug] BoothHero preserved; framer-motion gracefully no-ops when source is absent). Two surfaces still live: feed → /find/[id], /flagged → /find/[id]. Critical fix `c3b9541` introduced the **preview cache pattern** (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) that any future shared-element work will need to reuse. **NEW carry-forward: D11 + D12 design record values overridden by on-device feedback** — all entrance delays compressed to 0; post-it crossfade replaced with zoom-in 1.15→1; bubble timing matches photograph morph. Design record stays as historical reference; runtime values only in CLAUDE.md session 78 block. Operational backlog: amend the design record with a "Runtime Overrides" section + a "Source side retired on /shelves session 80" addendum.
- **Item 5 (session 80) — wordmark TNR upright ink-black 18px** ✅ — **resolved session 80** in `2efced5`. `StickyMasthead.tsx` `WORDMARK_DEFAULT` rewritten: `FONT_NUMERAL` (Times New Roman) + `fontSize: 18` + `color: v1.inkPrimary`, dropped italic + the -1px translateY lift. Visible on every screen that uses StickyMasthead.
- **Item 4 (session 80) — bookmark relocated masthead → BoothHero photo corner** ✅ — **resolved session 80** in `786de81`. Design record at [`docs/bookmark-relocation-design.md`](docs/bookmark-relocation-design.md) D1–D7. `BookmarkBoothBubble` gained `"hero"` size variant (36×36 frosted, 18px glyph). `BoothHero` gained optional `saved` + `onToggleBookmark` props; bubble renders as SIBLING of photograph motion.div at top:8 right:8, NO own layoutId. `/shelf/[slug]` masthead right slot collapses to share-airplane-only. **NEW carry-forward: needs iPhone QA against banner-aspect hero photo** (item 4 sized to match /find/[id] flag's 4:5 photo).
- **Item 2 (session 80) — Booths page Option C2 row pattern** ✅ — **resolved session 80** in `895129b`. Design record at [`docs/booths-row-pattern-design.md`](docs/booths-row-pattern-design.md) D1–D9. `VendorCard` rewritten as full-width row, photo retired, no bio, bookmark on far-left, lockup mirrors /flagged. **D8 admin chrome (Pencil + Trash inline before booth stack) was a single-firing implementation-time decision NOT in the V2 mockup** — needs admin walk-through to confirm. **NEW carry-forward: row density on real content needs iPhone QA.** Old grid was ~4 booths/scroll; row pattern is ~7-8/scroll. Long vendor names + alphanumeric booth IDs will stress-test ellipsis behavior.
- **Item 1 + Item 3 (session 80) — nav rename + curated text** ✅ — **resolved session 80** in `2e40732` + `cdac99d`. Trivial copy changes.
- **Two polish items (session 80)** ✅ — **resolved session 80** in `eb6f942`. /shelves MallScopeHeader gains the same fade-up entrance as Home + /flagged; /find/[id] cartographic mall subtitle marginTop 4 → 2.
- **Item 1 (session 81) — nav stroke 2.0** ✅ — **resolved session 81** in `333ea3b`. BottomNav 5 icons strokeWidth 1.7 → 2.0.
- **Item 3 (session 81) — photo-overlay bubble bg lighter** ✅ — **resolved session 81** in `79306a0`. `rgba(232,221,199,0.78)` → `rgba(245,242,235,0.85)` across 5 surfaces (BookmarkBoothBubble tile + hero, masonry tile flag, /flagged tile flag, /find/[id] frostedBg + bottom flag/edit). Session 80 BoothHero bookmark iPhone QA carry-forward is now resolved through this lighter bubble shipped at the same time.
- **Item 2 (session 81) — booth lockup A3 dashed-fill-lift card** ✅ — **resolved session 81** in `ae4593c` + `846b673` (BoothHero post-it eyebrow follow-on). A3 wrapper across `/shelves` rows + `/flagged` section headers: dashed green border + paper-cream 0.55 fill + soft drop shadow + numeral 26 → 22. BoothHero + `/find/[id]` post-it eyebrows swapped to small-caps FONT_SYS to match (commits `846b673` + `bd0011b`). Mockup files at [`docs/mockups/demo-prep-refinement-v1.html`](docs/mockups/demo-prep-refinement-v1.html) + [`docs/mockups/demo-prep-refinement-v2.html`](docs/mockups/demo-prep-refinement-v2.html) serve as the design record (no separate `.md` since this was tactical visual polish, not a new structural pattern).
- **Tweak 1 (session 81) — /flagged vendor/mall gap** ✅ — **resolved session 81** in `a0e2862`. marginTop 6 → 2 to match /find/[id] cartographic block.
- **Tweak 2 (session 81) — post-it warmer + cartographic card matched** ✅ — **resolved session 81** in `c6e5273` + `154145f`. v1.postit `#fffaea → #fbf3df`. Cartographic "Find this item at" card on /find/[id] inline `background: v1.postit` (not global `v1.inkWash` swap, which would have over-broadened to 18+ surfaces).
- **Tweak 3 (session 81) — /find/[id] post-it eyebrow** ✅ — **resolved session 81** in `bd0011b`. Italic IM Fell 14px → small-caps FONT_SYS 9px / 0.12em / weight 700 / uppercase to match BoothHero post-it.
- **Tweaks 4 + 5 (session 81) — "Mall" → "Location" copy scrub + "All Kentucky Locations" picker** ✅ — **resolved session 81** in `0fab4a0`. 13 files of user-facing strings updated; internal identifiers (`Mall` types, `malls` table, `mall_id` props, `mall_activated`/`mall_deactivated` event keys, `/api/admin/malls` routes, component names) deliberately preserved. **NEW carry-forward: "All Kentucky Locations" title fit risk on narrow phones** (26px IM Fell + chevron + side padding ~290–330px on a 390px-wide phone). If wraps awkwardly, options: drop to 22px, abbreviate "All Locations", or stack on two lines. Easy to revise.
- **Session 80 carry: Item 4 BoothHero bookmark needs iPhone QA against banner photo** ✅ — **resolved session 81 implicitly**. The session 81 bubble bg lightening (paper-warm 0.85) was shipped + David QA'd via Vercel preview without flagging the BoothHero corner bubble against banner-aspect photos — assumed acceptable.
- **Session 80 carry: Item 2 row density iPhone QA** — **partially addressed session 81**. A3 lockup wrapper added to rows; David QA'd the A3 card without flagging row-density issues. Real-content seeding still the load-bearing test.
- **Session 80 carry: Item 5 wordmark 18px against masthead bubbles** — **session 81 untouched.** No regressions reported during iPhone QA cycle. Likely acceptable.
- **Session 80 carry: Item 2 D8 admin chrome** — **session 81 untouched.** No admin walk-through this session; still a single-firing implementation-time decision worth admin verification.
- **NEW (session 81): "All Kentucky Locations" title fit on narrow phones** — see tweaks 4+5 entry above.
- **NEW (session 81): A3 lockup numeral 22 vs old 26 — visual rhythm on real content** — card-padding consumes the 4px lost. Real-content seeding will stress-test against varied alphanumeric booth IDs.
- **NEW (session 81): Post-it color #fbf3df subtle vs prior #fffaea** — RGB delta (-4, -7, -11). If still reads white in real-content QA, easy refinement to push warmer (e.g. `#f9eed5`).
- **NEW (session 81): Cartographic card bg matched via inline `v1.postit` not via global token swap** — single firing. If we accumulate more "this element is in the cartographic-card family" surfaces, extract a `v1.cartographicBg` semantic token. Not needed yet.
- **NEW (session 81): Q-005 admin claimed-booth deletion gap surfaced again** — beat 10 admin SQL HITL for Kentucky Treehouse + Ella's Finds test booths. Trash on `/shelves` is gated to orphan booths only (session 74 D8). Cleanup tool would resolve. Sprint 6+ candidate.
- **NEW (session 81): "User-facing copy scrub: skip DB/API/event/type identifiers"** — first firing. Tech Rule on second.
- **NEW (session 81): "Inline bg vs token swap when token affects too many surfaces"** — first firing.
- **NEW (session 81): "V2 mockup as fill-refinement within a picked option"** — first firing pattern shape; useful for "I picked option A, but with this concern" iterations.
- **NEW (session 81): "Mid-session iPhone QA on Vercel preview shortens redirect cycle"** — first firing as a structural pattern (vs ship-then-QA-next-session). Compresses 2-session arc into one. **2nd firing session 82** — promotion-ready.
- **Item 1 (session 82) — booth # optional** ✅ — **resolved session 82** in `2af064d`. Client-side red-asterisk → `(optional)` badge + drop client validation + drop server-side `!booth_number?.trim()` validation. Server dedup query already handled null booth.
- **Item 2 (session 82) — Mall → Location on /vendor-request** ✅ — **resolved session 82** in `e924664`. Single label swap + validation error string. The form was missed in session 81's 13-file scrub.
- **Item 3 (session 82) — /vendor-request typography pass + system-wide IM Fell retirement + Option C label primitive across 5 form surfaces** ✅ — **resolved session 82** across 4 commits (`08bf5c4` Lora infra + `b444c5e` project-wide font sweep + `6d26df6` /vendor-request page changes + `e446c11` form-label primitive sweep). New title "Set up your digital booth" + permission/value intro paragraph. **IM Fell completely retired from the codebase** — Lora is the project-wide literary serif via `next/font/google` + `FONT_LORA` token. Option C label primitive (Lora upright, 15px /vendor-request + 13px sheets, ink-mid) swept across BoothFormFields + AddBoothInline + admin/login + post/preview Field. Photo dropzone + ack-card unified to Lora (was FONT_SYS). Mockup files: [`docs/mockups/vendor-request-typography-v1.html`](docs/mockups/vendor-request-typography-v1.html) + [`docs/mockups/vendor-request-typography-v2.html`](docs/mockups/vendor-request-typography-v2.html).
- **/shelves bookmark filter count bug (session 82)** ✅ — **resolved session 82** in `dfed189`. Chip rendered `bookmarkedIds.size` (global localStorage set) instead of `bookmarkedInScopeCount` (already computed at line 523). One-line fix.
- **/shelves rows without booth # are shorter + text cut off (session 82)** ✅ — **resolved session 82** in `f187165`. New BoothLockupCard primitive uses `min-height: 60` to keep rows uniform regardless of booth-number presence. Empty-state hides BOOTH eyebrow entirely (per Q1 = c); name claims full row width.
- **BoothLockupCard shared primitive extraction + applied to /shelves + /flagged (session 82)** ✅ — **shipped session 82** in [`components/BoothLockupCard.tsx`](components/BoothLockupCard.tsx) + `f187165` (apply to /shelves) + `bf8ac24` (apply to /flagged + booth bookmark wiring). Visual: v1.postit bg, 1px hairline, 10px radius, 12/14 padding, no shadow. /find/[id] cartographic card stays inline (intentional per David — *"no change to this component card"*) but visually identical. **Session 81's A3 dashed-fill-lift card is RETIRED** in favor of this shared primitive.
- **/flagged section header booth bookmark added (session 82)** ✅ — **resolved session 82** in `bf8ac24`. BoothGroup type gained `vendorId` field. State + handler mirror /shelves (boothBookmarkKey + R3 v1.1 booth_bookmarked / booth_unbookmarked events). Synced on mount + focus.
- **Descender clip on Lora vendor names (session 82)** ✅ — **resolved session 82** in `a045058`. lineHeight 1.25 → 1.4 across BoothLockupCard primitive AND /find/[id] inline (had the same bug, just hadn't been caught in QA because David's seed data lacked descender-heavy vendor names).
- **NEW (session 82): IM Fell inline comments are documentation rot.** ~20 references across 15 files ("italic IM Fell vocabulary," "matches IM Fell italic," etc.). Functional sweep was clean; comments lag. Opportunistic cleanup over future sessions.
- **NEW (session 82): Form-label sweep skipped non-`<label>`-tag form chrome** on AddFindSheet, post/preview body, setup page. Section headers in italic Lora may want similar Option C treatment if they fire as recurring readability concerns. Defer.
- **NEW (session 82): BoothLockupCard primitive could extend to /shelf/[slug] BoothHero** if David ever wants the post-it to match the card primitive. Currently intentionally NOT matched.
- **NEW (session 82): "Bug surfaced in extracted primitive AND inline copy of same primitive — fix both in same commit"** — first firing (descender clip in BoothLockupCard + /find/[id] inline simultaneously). Single firing.
- **NEW (session 82): "Per-context sizing on a swept primitive"** — first firing (Option C label at 15px on full pages, 13px on sheets — label sized relative to its input). Single firing.
- **NEW (session 82): "User-facing copy scrub: skip DB/API/event/type identifiers"** — **2nd firing.** Promotion-ready.
- **NEW (session 82): "V2 mockup as fill-refinement within a picked option"** — **2nd firing** (V1 = 3 label primitives within IM Fell / V2 = 3 fonts within picked Option C). Promotion-ready on a 3rd firing.
- **NEW (session 82): "We continue to run into this issue" / "Every time I see X" signals system-level concern** — first firing as a memory ([`feedback_recurring_phrase_signals_system.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_recurring_phrase_signals_system.md)). Pattern fired 2× in session 82 (typography + booth lockup). Memory captures the rule.
- **Postcard PoC reverted (session 83)** ✅ — explored postcard/paper visual language as session opener. V1 mockup (3 additive frames: texture / +frame / +stamp) → David picked Frame A → 3 implementation iterations on Home — David's verdict after iPhone QA: *"the background is subtly distracting as it almost feels like there is dust on the screen due to the texture."* Full revert (`c3d5528`) returned to session 82 close baseline. Mockup retained as exploration record. paper.png in /public retained (David-uploaded; cleanup candidate).
- **Polaroid evolved tile pattern (session 83)** ✅ — **shipped end-to-end across 4 surfaces.** Home MasonryTile (`55d9c77` + `2df6a78`) + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile (`6152511`). Warm cream paper `#faf2e0`, 4px radius, dimensional dual-shadow (`0 6px 14px 0.20` far + `0 1.5px 3px 0.10` close), 7px photo mat top/sides. Three near-identical wrappers — did NOT extract shared `<FindTile>` primitive (premature abstraction). If a fourth surface adopts polaroid OR all need to evolve in lockstep, refactor candidate.
- **Tile title+price centering treatment (session 83)** ✅ — `b8c8e67` David iPhone QA redirect. Title+price center-aligned horizontally, vertically grouped via flex column + justify-center + items-center within metadata block. Price `FONT_SYS 12 → FONT_LORA 14` matching title size — same-size-different-color pattern lifted from /find/[id] hero (Lora 32px both, only color differs between `inkPrimary` and `priceInk`). marginTop 3 → 4 for tighter "locked together" rhythm. Applied to FindTile + WindowTile + ShelfTile.
- **Tile metadata block height-locking (session 83)** ✅ — `e19e9fe` David iPhone QA redirect on /flagged. `minHeight: 76` → `height: 76` (locked) + bottom padding 11 → 4 to fit 2-line title + price worst case exactly (39.2 + 4 + 19.6 + 13 padding = 76). Heterogeneous title content (1-line vs 2-line) no longer breaks row consistency. Applied to FindTile + WindowTile + ShelfTile.
- **/find/[id] strip centering + "shelf" → "booth" rename (session 83)** ✅ — `b804ee6`. Centering format applied to ShelfCard metadata block (textAlign center, lineHeight 1.4, width 100%, flex column + justify-center + items-center, height locked at 56, bottom padding 11→4). **Did NOT** apply polaroid wrapper styling — kept inkWash + hairline + 6px radius + subtle shadow per "polaroid skips navigate/detail surfaces" rule. Section eyebrow rendered text "More from this shelf…" → "More from this booth…".
- **Tile title descender clearance (session 83)** ✅ — title lineHeight 1.2 → 1.4 across FindTile + WindowTile + ShelfTile + ShelfCard. **2nd firing of session 82's vendor-name fix** — Lora descenders extend ~5px below baseline; at 14px text + 1.2 lineHeight + overflow:hidden + WebkitLineClamp:2, descenders ('g', 'y', 'p') clipped on line 2.
- **NEW (session 83): paper.png in /public** — 2.7MB unused asset David uploaded for postcard PoC. Cleanup candidate; left in place per "don't presume to delete user-uploaded assets" instinct.
- **NEW (session 83): 3 inline "More from this shelf" code comments** in [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (lines 14, 31, 1224) — documentation rot. Same pattern as session 82's IM Fell comments. Opportunistic cleanup.
- **NEW (session 83): Three near-identical polaroid wrappers across FindTile + WindowTile + ShelfTile + ShelfCard** — shared `<FindTile>` primitive extraction trigger if a fourth surface adopts polaroid OR all need to evolve in lockstep. Don't extract until that trigger fires.
- **NEW (session 83): "Browse vs navigate/detail rule for material chrome"** — first firing as a system rule. Polaroid (heavy material chrome) belongs on browse/collect surfaces (Home, /flagged, /shelf/[slug] grid). Light card chrome stays on navigate/detail surfaces (/find/[id] strip). BoothPage post-it hero counts as "anchor" not "tile" — no polaroid there. Tech Rule candidate on second firing.
- **NEW (session 83): "Match a primary-page typographic pattern when extending visual identity to tiles"** — first firing. Lifted /find/[id]'s hero title+price treatment (Lora 32px both, same weight, marginTop 2, only color differs) to 14px tiles (same family, same weight, marginTop 4, only color differs). Brand-anchoring at scale. Tech Rule candidate.
- **NEW (session 83): "Lock fixed-height + reduce padding to fit worst case for row consistency"** — first firing for heterogeneous-content tiles (1-line vs 2-line titles). Tech Rule candidate.
- **NEW (session 83): "Lora needs lineHeight 1.4 minimum when overflow:hidden + ≤14px text + line-clamp"** — **2nd firing** (session 82 vendor names + session 83 tile titles). Promotion-ready as concrete typography rule.
- **NEW (session 83): "Revert to clean baseline before pivoting directions"** — captured as new memory ([`feedback_revert_to_clean_baseline_before_pivot.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_revert_to_clean_baseline_before_pivot.md)). Don't carry abandoned changes into a pivot.
- **Phase 3 scroll-restore on /flagged + /shelf/[slug] (guest path)** ✅ — **resolved session 85** in commits `6339f0f` + `c723792`.
- **Admin back button on /my-shelf?vendor=<id>** ✅ — **resolved session 85** in `5e64b7a`.
- **/my-shelf admin scroll-restore** ✅ — **resolved session 86** in `0c53fb3` (refuse-to-write-0 fix) + `e311dce` (cleanup). Bug: Next.js App Router scroll-to-top fired real scroll events on outbound navigation; the scroll listener wrote 0 to storage, clobbering the user's good scroll position. Fix: write-side filter (`if (rounded <= 0) return`). Confirmed via iPhone QA. **Phase 3 scroll-restore now closed end-to-end across all 3 surfaces.** Session 85's structural patches (BFCache pageshow handler, popstate, useSearchParams reactivity, dual-write storage, retry-scrollTo loop) stay in place as harmless defensive code; aggressive revert is a follow-up under extended QA.
- **Safari Web Inspector via USB cable** ✅ — **resolved session 86**. Setup procedure validated end-to-end; David has it operational; first iOS-Safari bug closed using this path. Memory file [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) captures setup + outcome + 2 setup-time snags hit (admin auth state per-device, iPhone-not-appearing-in-Develop-menu) as carry-forward troubleshooting.
- 🟡 **CARRY (session 85→86): /find/[id] peer-nav flag glyph + horizontal carousel scroll loss** — out-of-scope from Phase 3. Navigating /find/[id-A] → "More from this booth" → /find/[id-B] → back loses (a) the flag glyph on /find/[id-A] and (b) horizontal scroll position in the More-from-this-booth row. Probably bookmark-state hydration race + DOM-level horizontal scroll preservation. ~30 min standalone session. Now Inspector-debuggable the same way /my-shelf was.
- **NEW (session 86): "Hypothesis + diagnostic + fix in same commit cycle when confidence ≥80%"** — first firing as a structural pattern. Inspector showed bursts of 5-8 zero-writes per cycle → 90% confident on Next.js scroll-to-top → shipped diagnostic AND fix in `0c53fb3` rather than waiting for another verify-then-fix round. Compresses 2 cycles into 1. Tech Rule candidate on second firing.
- **NEW (session 86): "Refuse-to-write-0 pattern (write-side filter on meaningless restore values)"** — first firing as a project-specific scroll-restore primitive. If any future scroll/persistence primitive needs the same defense, the canonical fix shape is: filter at the write site, not the read site. 0 is a meaningless restore target since empty storage already restores to 0 by default. Captured in code comments.
- **VALIDATION (session 86): "Cap speculative patching at 3 rounds + escalate to device-level visibility"** — 2nd firing with FULL validation. Session 85 spent 6 rounds without device visibility = no closure; session 86 used Inspector + 1 fix commit + 1 cleanup = bug closed in ~30min. Top-of-list Tech Rule promotion candidate. **Promotion-ready.**
- **VALIDATION (session 86): "Match the visibility tool to the bug's layer"** — promoted via 3rd firing of `feedback_visibility_tools_first.md`. The Storage-panel-revealed-zero-writes is the canonical case study. **Promotion-ready.**
- **VALIDATION (session 86): `feedback_kill_bug_class_after_3_patches.md`** — 2nd clean firing. Rule predicted "structural fix < accumulated patches"; fix was 1 line of logic which retired -85 lines of session-85 speculation. **Promotion-ready.**
- **NEW: Frame C compact-photo alternative parked** (session 75) — [`docs/mockups/request-booth-redesign-v1.html`](docs/mockups/request-booth-redesign-v1.html) Frame C ready as a second pass if iPhone QA reveals 3:2 dropzone still feels overwhelming. CSS-only change.
- **NEW: Project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL"** (session 75) — captured in [`docs/booth-numeral-font-design.md`](docs/booth-numeral-font-design.md) carry-forwards. Promote to design-system.md on next consolidation.
- **NEW: BoothHero lightbox z-index sandwich pattern** (session 75) — transparent overlay at z-5 between photo container and pencil/post-it. Reusable when adding tap targets to affordance-rich surfaces. Single firing.
- **NEW: Long-form helper copy on paper-wash → FONT_SYS, not IM Fell italic** (session 75) — photo dropzone copy was the trigger. Single firing. Tech Rule on second firing.
- **NEW: Narrow-named tokens audited for generalization** (session 75) — `FONT_POSTIT_NUMERAL` discovery. Single firing.
- **NEW: Item 6 (session 76) — FB Marketplace shared-element transitions** carried into session 77. Mockup + framer-motion `layoutId` testbed + rollout across 4 thumbnail surfaces. Per `feedback_testbed_first_for_ai_unknowns.md`, build `/transition-test` testbed page first to validate cross-route shared-element transitions before touching real surfaces. Size M-L; likely its own session.
- **NEW: E6 (session 76) — scroll-restore safety deferred** — extract `useScrollReveal` from [`app/page.tsx`](app/page.tsx) into `hooks/useScrollReveal.ts`; generalize sessionStorage-key + ref machinery so Booths / Find Map / /flagged adopt skip-entrance-on-restore. ~30–60 min in its own session.
- **NEW: Frame C parked on find-title centering** (session 76) — [`docs/mockups/find-detail-title-center-v1.html`](docs/mockups/find-detail-title-center-v1.html) Frame C (22px italic subtitle) ready as CSS-only pivot if 32px twin reads heavy on real vendor content during seeding.
- **NEW: Sheet/modal entrance animation consistency NOT touched** (session 76) — DeleteBoothSheet, AddBoothSheet, EditBoothSheet, MallSheet, AddFindSheet, ShareBoothSheet etc. carry their own entrance animations. Inventory deferred to a separate consistency pass on overlay primitives.
- **NEW: `app/finds/page.tsx` (dark reseller layer "My Picks") deviates from motion tokens** (session 76) — out-of-scope by design (different theme, different layer). Future cleanup if dark layer ever migrates.
- **NEW: Home MasonryTile bespoke easing intentionally diverges** (session 76) — `cubic-bezier(0.22,1,0.36,1)` for transform + 0.38/0.44s split durations preserved as intentional polish on hero feed grid. Token values centralize but the runtime is forked.
- **NEW: Detail-page render branches must render base chrome in every state** (session 76) — first firing (find/[id] bug). Single firing; Tech Rule on second firing.
- **NEW: Default to stacked over inline for title + secondary value patterns** (session 76) — first firing (find-title em-dash retirement). Single firing.
- **NEW: Audit invariants against sibling pages of the same shape after 3+ recent sessions** (session 76) — first firing (find/[id] masthead invariant existed in /shelf/[slug] but not here despite 3 recent layout sessions). Single firing.
- **Feed content seeding** ✅ — **resolved pre-session 82** (David completed seeding before session 82 standup). 15 posts across 2 mall locations and 3 vendors. The 24× bumped item finally came off the queue. Real-content QA loop now possible.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion sharper-shape** ✅ — **resolved session 88 arc 2** in `8635487`. All 11 🟢 candidates promoted per `feedback_tech_rule_promotion_destination.md`: 5 new memory files for operating-style rules + 2 prose entries in `docs/DECISION_GATE.md` for production-safety rules + 4 marked ✅ Promoted-via-memory. Queue rebalanced to 0 🟢, 26 🟡 after 4 new firings (TR-ah/ai/aj + new total-strip memory).
- **Wordmark iPhone QA on Vercel preview** ✅ — **partially resolved session 88 arc 1** in `28d60ca`. Wordmark height 30 → 40px filling masthead's 40px inner grid; David's iPhone QA on Home approved. Full surface walk across /find/[id] + /shelf/[slug] + /my-shelf still untested but the height question is closed.
- **Wordmark asset-weight optimization** (session 87 carry, ~15 min). [`public/wordmark.png`](public/wordmark.png) is 455KB; cache-friendly but optimization candidate via `next/image` or `pngquant`/`squoosh`. Not urgent.
- **design-system.md wordmark spec stale** (session 87 carry, ~5 min). Likely references session-80 TNR-upright-18px-ink-black; add a one-line note on the new wordmark-as-image approach + the 40px height bumped at session 88.
- **NEW PRIMARY (session 88): motion design revisit in a focused full session.** David: "Lets just pull out all the animations for now and we'll revisit this in a full session. It still feels off." Ecosystem layer (Home + /flagged + /find/[id]) is now fully static motion-wise after `b3e47df`. The right next move is a fresh design pass with mockups (per `feedback_total_strip_after_iterative_refinement_fails.md`), structural alternatives spanning real options (no morph / minimal motion / full Track D revival), iPhone QA against real seeded content, ship one option. Size M-L, ~60–90 min.
- **NEW (session 88): iPhone QA verification of `01ff797` pushState monkey-patch on /find/[id] scroll restore.** David's last QA on the scroll arc was BEFORE the pushState fix landed. The "tap same find from Home twice" flow needs a fresh iPhone walk to confirm the staleness fix actually closes the bug. ~5 min if clean, ~15 min if more diagnosis.
- **NEW (session 88): preview-cache role audit.** `treehouse_find_preview:${id}` sessionStorage usage is reduced now that the `motion.div layoutId` photo morph is gone. Possibly removable, possibly still useful for sync first-paint of the photograph. ~15 min audit + decide.
- **NEW (session 88): full surface walk on the static state.** David's iPhone QA's after the total strip were partial (Home + /flagged + the back-nav case). A clean cold-start walk across all primary screens (Home, /flagged, /find/[id], /shelf/[slug], /my-shelf, /shelves, /vendor-request) on the static state would close the loop and provide the baseline for the motion-design revisit session. ~10 min.
- **iPhone QA verification of session-89 ship** (session 89 carry) — partially resolved session 90: David surfaced 7 issues from the prior preview ship + 4 follow-up items, all closed in 7 commits. Full multi-surface device walk still untested across the new state.
- **BoothHero pencil-vs-bookmark symmetry question** (session 89 carry) — UNTOUCHED session 90. Still awaiting clarification.
- **Sign-in/sign-out masthead primitive extraction candidate** ✅ — **RETIRED session 90**. Auth chrome moved off masthead onto BottomNav (Profile tab) + /login (sign-out italic link); the would-be 2-surface primitive (Home + /flagged) is dissolved. No further firings of this candidate.
- **/flagged tile density risk at 3-col on 390px-wide phone** (session 89 carry) — David didn't flag during session 90 either; presumably acceptable. Stays as a watch-item against real-content seeding.
- **Phosphor icon weight calibration** (session 89 carry) — single firing as of session 89; session 90 did not extend (IoKey replaces Shield in BottomNav but is from `react-icons/io5`, not Phosphor — different package; weight calibration there is a separate single-firing observation).
- **"Cross-page consistency overrides earlier 'browse vs navigate' rule"** (session 89 carry) — single firing, no further firings session 90.
- **iPhone QA verification of session-90 ship** (session 90 carry) — closed session 91/92 (no regressions surfaced across two intervening sessions of David QA).
- **IoKey weight on top of Lucide-stroked tab row** (session 90 carry) — UNTOUCHED session 91. Pending iPhone QA.
- **/find/[id] right-slot share redundant with masthead default** (session 90 carry) — UNTOUCHED session 91. Single firing; alternative next move slot.
- **Default-when-empty masthead pattern primitive-extraction candidate** (session 90 carry) — single firing as of session 90.
- **Sign-out hidden behind Profile tab tap discoverability** (session 90 carry) — UNTOUCHED session 91. Beta-feedback watch-item.
- **Decoupled icon vs label color in BottomNav** (session 90 carry) — single firing as of session 90.
- **`right={null}` "stay quiet" idiom on primary tabs** (session 90 carry) — single firing as of session 90.
- **Auto-redirect-suppression for already-authed users on `/login`** (session 90 carry) — single firing as of session 90.
- **🖐️ HITL migration 016 (R11 mall hero column)** ✅ — **resolved session 92** (David completed paste in both projects).
- **iPhone QA verification of Wave 1 ship** ✅ — **resolved session 92** (David ran the walk + reported "QA walk passed" with 3 design-level redirects, NOT bugs — those redirects became commits `8ec7884`, `4b515b2`, `b6919b7` this session).
- **Wave 1.5 security continuation** ✅ — **resolved session 92** end-to-end: `/api/vendor-hero` + `/api/post-image` auth+ownership tightened, multi-booth ownership bug fixed in `/api/my-posts/[id]`, orphan `/api/debug` deleted, function search_path locked (migration 017 + diagnostic), role-grant drift diagnostic shipped (migration 018 + diagnostic), OTP/password manual procedure documented + dashboard toggles applied, AI-route auth deferred per option (c). All 6 sub-tasks closed. R1 hard prereqs all green.
- **NEW (session 91, carry to session 93): `vendor_request_approved` admin actor lacking `_by_admin` suffix.** Naming inconsistency preserved per copy-scrub rule. Cosmetic; defer to Q-014 Metabase scoping.
- **NEW (session 91): 9 new event types added** (plus `vendor_hero_removed` extended in 92 with `by_admin` flag). R3 events table volume worth mentioning at Q-014 Metabase scoping.
- **NEW (session 91, carry to session 93): feed pagination still deferred.** Revisit when feed crosses ~100 posts.
- **NEW (session 91, carry to session 93): Q-015 admin Vendors tab captured but not pulled.** Single-pane-of-glass argument lives in `docs/queued-sessions.md` §Q-015.
- **NEW (session 91): Honest sprint-brief reassessment when off-roadmap items get flagged then dropped.** Single firing. Tech Rule on second.
- **NEW (session 91): Discovery-during-execution → reframe + capture.** R4a discovery during Task 3. Single firing.
- **NEW (session 91): Mockup token-source verification.** `#f5f2eb` vs `v1.paperCream = #e8ddc7` mockup misuse. Tech Rule candidate; second firing on next mismatch.
- **NEW (session 91): Migration + impl can ship in adjacent commits when the column reads as optional in TS.** Pattern only works when TS layer pre-declared the field.
- **NEW PRIMARY (session 92): iPhone QA of the 3 Wave 1 follow-up commits.** Contact email split (`/contact` mailto + `lib/email.ts` replyTo), mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions, EditBoothSheet hero consolidation (BoothHero clean + Booth photo section in sheet, both vendor + admin modes). David hasn't device-walked the refinements yet.
- **NEW (session 92): `inspect-grants.ts` heuristic refinement.** Diagnostic flagged 7 yellows on prod / 6 on staging — all confirmed false positives via separate `inspect-rls.ts` cross-reference (Supabase ships every public table with full DML grants to anon + authenticated by default; RLS does the actual gating). Diagnostic should cross-reference `audit_rls_state()` and only flag write-grants when RLS is ALSO disabled. ~20 min in next session.
- **NEW (session 92): Migration 010 + 011 staging gap.** `events` table missing on staging — known carry from session 58. Apply when staging needs to mirror prod for analytics testing.
- **NEW (session 92): AI-route auth deferred** (option c). 6 routes (`extract-tag`, `identify`, `post-caption`, `report-comps`, `story`, `suggest`) deliberately unauthed because adding `requireAuth` would break the reseller-intel layer (`/scan`, `/decide`) which is `localStorage`-only by design. Runbook captures revisit triggers (general beta traffic OR cost spikes) + Upstash Redis as the upgrade path.
- **NEW (session 92): Surface auth/identity conflation issues BEFORE editing.** First firing — caught the `NEXT_PUBLIC_ADMIN_EMAIL` conflation (admin gating identity vs. public-facing contact email). If David had said yes to the first plan, he'd have lost admin access. Tech Rule on second firing.
- **NEW (session 92): Multi-booth `maybeSingle()` ownership bug pattern.** `.eq("user_id", x).maybeSingle()` errors when user owns >1 booth. Real bug found in `/api/my-posts/[id]` PATCH; fixed via composite filter. Tech Rule on second firing — anywhere ownership probes hit `vendors` table by `user_id`.
- **NEW (session 92): Diagnostic heuristic must cross-reference RLS state.** First firing — `inspect-grants.ts` flagged Supabase-default architecture as 🟡 noise. Future security diagnostics that operate on grant/policy/role layers need cross-axis awareness. Tech Rule candidate; refinement is the next-session item.
- **NEW (session 92): Reuse existing primitive when dimensions match request.** First firing — mall hero went from bespoke 26-line block to 1-line `<FeaturedBanner variant="eyebrow">` reuse. Pattern: when a request asks for "X dimensions," check if an existing primitive already provides them before re-implementing. Tech Rule on second firing.
- **NEW PRIMARY (session 93): iPhone QA of Wave 1 follow-up commits still owed.** David QA'd /login triage flow this session but session-92 follow-up surfaces (contact mailto, mall hero composition, EditBoothSheet hero section, /shelves admin EditBoothSheet hero controls) remain un-walked. Watch-items per session 92 close still apply.
- **NEW (session 93): R1 (shopper accounts) routing slot pre-baked.** Login routing model anticipates the R1 shape: `/login` triage page has 2 cards today; R1 adds a 3rd "I'm shopping" card. `/login/email` Screen 2 title "Vendor Sign in" generalizes to "Sign in" when R1 ships. The "Just shopping?" guest disambiguation line on /login retires (replaced by 3rd card). Subtitle generalizes. All 4 changes contained to `app/login/page.tsx` + `app/login/email/page.tsx`.
- **NEW (session 93): /admin/login + /setup `handleGoToLogin` callsites left routing through triage.** Bare `/login` calls — go through triage cards. If user testing reveals friction (extra tap to reach the form for what feels like a known returning user), single-line update each to point at `/login/email` directly.
- **NEW (session 93): Triage-first routing for ambiguous-state pages.** First firing — `/login` had to handle 4 user states (returning vendor / new vendor / authed / magic-link callback) which a single form could not disambiguate. Pattern: when a page must serve genuinely-different user states, surface the disambiguation in routing rather than letting one component conditionally render. Tech Rule on second firing.
- **NEW (session 93): Inbound deep-link audit when splitting a route.** First firing — when changing route topology (one route → two routes), grep all inbound references and decide per-callsite whether to update or rely on forwarding. /vendor-request "Sign in instead" + /my-shelf re-auth bounce got per-callsite upgrades. Tech Rule on second firing.
- **NEW (session 93): Forward-known-states + render-fresh-states routing primitive.** First firing — `/login` triage state machine: if `?confirmed=1` → render polling, if explicit redirect → forward, if authed → forward, else → render triage cards. Pattern: render only states that need fresh interaction; forward known states to their canonical destination. Tech Rule on second firing.
- **`/shelf/[slug]` 404 NotFound icon still a `<Heart>`** — session 61 swap intentionally left this one alone (semantically unrelated to "save"). Flip to a different icon if a separate visual sweep happens.
- **Tag-extraction analytics events** ✅ — **resolved session 73**. `tag_extracted` (with `has_price` + `has_title`) + `tag_skipped` shipped.
- **Sign-in icon discoverability** (session 63 watch-item) — first-time guests see a 22px CircleUser glyph in the masthead right slot. Worth checking during beta-feedback.
- **Q-012 — Treehouse opener animation** (session 64, parked) — full Design redesign needed. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-012.
- **Existing `/api/*` routes are unwrapped re Sentry** (session 65) — ~25 routes silently swallow errors at the framework level. Acceptable for now; auto-fixed by Q-013.
- **Q-013 candidate — Next.js 15 upgrade** (session 65, parked) — would auto-fix the Sentry wrap-route requirement and unlock Cache Components.
- **Sentry MCP not yet wired to Claude Code** (session 65 follow-up) — one-time fix: add a `.mcp.json` block.
- **`/mall/[slug]` lensless on v0.2 dark theme** (session 66) — known deviation; lens applies cleanly when mall page does its v1.x ecosystem migration.
- **Treehouse Lens constant is provisional** (session 66) — `contrast(1.08) saturate(1.05) sepia(0.05)`; real vendor content this week may reveal it needs tuning.
- **Booth-bookmark analytics events** ✅ — **resolved session 73**. `booth_bookmarked` + `booth_unbookmarked` with `{vendor_slug}` payload.
- **Spec deviation: admin /shelves tiles don't carry the bookmark bubble** (session 67) — Pencil + Trash already in top-right; admin can bookmark via `/shelf/[slug]` masthead. Reconsider only if admins want it.
- **Mall-filter analytics events on Booths + Find Map** ✅ — **resolved session 73**. `filter_applied` fires on all three primary tabs with `page` field for per-tab attribution.
- **`/find/[id]` cartographic visual asymmetry** ✅ — **resolved session 70 + 71** via cartographic collapse.
- **`/find/[id]` → `/mall/[slug]` link bridging warm-→-dark cliff** ✅ — **resolved session 71** via collapse.
- **Card-height variance on find tiles** ✅ — **resolved session 71** via caption `minHeight`.
- **BoothHero post-it `minHeight: 96`** (carry from session 69) — eyebrow now single-line "Booth"; post-it may look slightly tall. If iPhone QA flags it, the parameter at [`components/BoothPage.tsx:216`](components/BoothPage.tsx) can come down (~76 likely tighter).
- **D4b session-46 reversal needs real-photo validation** (carry from session 69) — IM Fell 14px on ~170px-wide booth-detail/find-detail tiles tested against synthetic seed photos; real vendor content during the seeding walk is the actual judgment moment.
- **Design-record price-color token deviation** (carry from session 69) — design record specified `v1.inkMid`; implementation kept `v1.priceInk` (established semantic token).
- **`v1.pillBg` / `v1.pillBorder` / `v1.pillInk` tokens** ✅ — **resolved session 70**.
- **All-malls scope mall-subtitle is a weak separator on `/flagged`** (session 70) — captured in Record 1 design record as known-limitation. Likely fix: mall-grouped section breaks with small all-caps mall eyebrow.
- **Booth-page scroll flatten (D17) regression watch** (session 70) — highest-risk decision in Record 3. Watch on iPhone QA.
- **`/post/preview` masthead unification — title-below-masthead pending iPhone QA** (session 70) — page may lose the "reviewing" feel against vendors stepping through Add Find. (Note: session 74 touched /post/preview for item 4 but didn't change title placement.)
- **Booths grid lockup numeral size deviates from spec** (session 70) — design record specified 26px; Booths grid implements at 20px to preserve tile proportions. Design-record L3 amended.
- **Item 3 — animation consistency review across pages** ✅ — **resolved session 76** in `ecb8ef8` + `3832fc1`. 5 motion tokens centralized in lib/tokens.ts; Booths VendorCard tap parity shipped; empty states unified. E6 (scroll-restore safety) deferred separately.
- **Item 5 follow-up: B + A parked** (session 71) — `object-position: center top` (B) + slot-ratio flip 4/5 → 1/1 (A) stay parked unless real-content seeding reveals residual photo-cropping issues. Mockup at [`docs/mockups/image-standardization-v1.html`](docs/mockups/image-standardization-v1.html) ready as second pass.
- **Item 6 — shareable filtered-mall link** (session 71) — needs product + URL-param scoping + share UX + mockup pass.
- **Sub-agent claim verification gap** (session 71) — single firing; Tech Rule candidate on second firing.
- **Screenshot-before-scoping discipline for visual fixes** (session 71) — single firing; Tech Rule candidate on second firing.
- **Multi-affordance retirement → single-surface promotion** (session 72) — single firing in admin context, single firing in shopper context — Tech Rule candidate on a third firing.
- **Spec deviation: admin /shelves masthead right slot is now empty** (session 72) — empty-on-purpose is a valid state.
- **Q-014 — Metabase analytics surface + retire admin Events tab** (David surfaced session 73) — strategic next step on the analytics arc. Captured in [`docs/queued-sessions.md`](docs/queued-sessions.md) §Q-014.
- **Diag strip + raw probe stay as durable visibility tooling** (session 73 decision) — retire automatically when Q-014 lands and admin tab retires.
- **Other supabase-js call sites might have the same latent bug** (session 73) — audit candidates: any inline `createClient` outside `getServiceClient()`. Quick grep: `grep -rn "createClient" lib/ app/`. Not urgent.
- **NEW: Hero photo asymmetry between Add and Edit sheets** (session 74) — Add sheet has hero photo upload; Edit sheet doesn't (per D5, /my-shelf?vendor=<id> is canonical hero-edit surface). Easy expand if asked.
- **NEW: AddBoothInline retained on /admin Vendors tab** (session 74) — duplicate Add UI exists (AddBoothSheet on /shelves + AddBoothInline on /admin). Field shapes match; future cleanup may unify if drift surfaces.
- **NEW: /vendor/[slug] no longer reachable from /shelves Pencil** (session 74) — intentional per D1. Reachable from `/shelf/[slug]` and direct nav. Add a "View profile" eyebrow on EditBoothSheet if surfaced.
- **NEW: Slug-collision shares the BOOTH_CONFLICT path** (session 74) — generic error message says "booth number" but actual cause might be slug uniqueness. Add slug-specific path if surfaced.
- **NEW: Third oscillation of AddBoothInline-on-/shelves** (session 74) — captured in [`docs/booth-management-design.md`](docs/booth-management-design.md) Carry-forward so future sessions don't reflexively retire.
- **NEW: `showPlaceholders` prop infrastructure dormant in BoothPage** (session 74) — unreachable after item 6 dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup pass to reap; deferred.
- **Archive-drift backfill** — tombstones for sessions 54 + 55 + 57–73 missing from `docs/session-archive.md`. Pure docs-housekeeping. Worth a single ~15min ops pass at some point.
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill (sessions 54 + 55 + 57–85 missing), strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, reap dormant showPlaceholders prop infrastructure in BoothPage.tsx, **session 80: tidy V1 mockup files** ([booths-tile-redesign-v1.html](docs/mockups/booths-tile-redesign-v1.html) + [wordmark-redesign-v1.html](docs/mockups/wordmark-redesign-v1.html), superseded by V2), **session 80: amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with "Source side retired on /shelves" addendum**, **NEW (session 81): Q-014 Metabase planning** — decide whether to rename `mall_activated`/`mall_deactivated` event keys to `location_*` (backwards-compat migration, not flag-day), **NEW (session 81): consider `v1.cartographicBg` semantic token extraction** if more cartographic-card surfaces accumulate, **NEW (session 86): aggressive cleanup of /my-shelf scroll-restore code** — session 85's structural patches (BFCache pageshow handler, popstate, useSearchParams reactivity, dual-write storage, retry-scrollTo loop) may all be vestigial now that root cause is fixed at the write site; revert to /flagged-style minimum viable code, ship, run iPhone QA across the 3 Phase 3 surfaces, retain simpler version if clean. ~20 min standalone. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
- **Error monitoring (R12)** ✅ — **shipped session 65** end-to-end. Sentry SDK + Vercel-Sentry integration + source-map upload + PII scrubbing + email alerts. Dashboard: https://zen-forged.sentry.io/issues/?project=4511286908878848.
- **Beta feedback mechanism** — absorbed into R7 (contact us) as a sub-task.

### 🟡 Q-007 Window Sprint expansion (post-MVP)

All captured in `docs/queued-sessions.md`:
- **Q-008** ✅ — Open share to unauthenticated shoppers. **Shipped session 50; QA walk PASSED session 51.**
- **Q-009** ✅ — Admin can share any booth (ownership bypass). **Shipped session 45.**
- **Q-010** ✅ — Window email CTA URL fix (`/vendor/` → `/shelf/`). Shipped session 41.
- **Q-011** ✅ — Window email redesign. Shipped session 52 over four iterations; v4 on-device QA walk **PASSED 4/4 clients session 53**. Loop fully closed.
- **Q-006** 🟡 — Deep-link CTA. Parked on Sprint 6+ Universal Links.

### 🟡 Session 35 non-gating follow-up

- **Q-002** ✅ — Picker affordance placement revision. Shipped session 57.

### 🟡 Sprint 5 + design follow-ons

- **`/admin` v0.2 → v1.2 redesign pass** (session 37) — Posts tab, Banners tab, tab switcher, header, approval toast, diagnosis panel. Size L. Needs design scoping first (mockup-first per session-28 rule). ~2–3 sessions.
- **KI-005** — Pre-approval sign-in signaling gap. Batch with guest-user UX.
- **Typography reassessment** (session-32 deferral — IM Fell readability).
- **Post-approval booth-name edit surface** (session-32 deferral). **Note: session 74 partially addressed this for admin** via the new EditBoothSheet, which any admin can use to edit any booth's name. Vendor-self-edit is still parked (vendors can't edit their own booth name yet; only admins can).
- `<MallSheet>` migration to `/vendor-request` (still deferred per v1.1k (h)).
- Nav Shelf decision + BottomNav full chrome rework.
- Guest-user UX parked items: login page now reads "Vendor Sign in" (session-49); `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence still parked.
- **PWA pull-to-refresh** — confirmed missing in session 41 Q-007 walk. Sprint 5 polish.

### 🟢 Sprint 6+ (parked)

**Primary roadmap now lives in [`docs/roadmap-beta-plus.md`](docs/roadmap-beta-plus.md)** (session 55 capture — 15 epic-level items R1–R15 including guest profiles, Stripe subscriptions, analytics, admin tooling, feed caps, legal, onboarding, push/SMS, map nav, mall heros, error monitoring, mall-operator accounts, vendor profile enrichment, **app store launch**). Roadmap doc also carries the 8-cluster grouping + 3-horizon shipping plan.

**Still Sprint 6+ only (not in roadmap-beta-plus.md):**

QR-code approval, admin-cleanup tool (session 45 materially reduces the need; session 74 closes the booth-name + mall-edit gap; the 80% case is now covered by /shelves), mall vendor CTA, **Option B `vendor_memberships` migration**, **Direction A (link-share via native share sheet)** and **Direction C (PNG export / story-ready image)** share variants. Post-MVP: 3A sold landing state, Find Map saved-but-sold tile signal.

### 🟢 Cleanup (not urgent)

- Deprecated functions in `lib/posts.ts` including session-35 `getVendorByUserId` shim.
- Cloudflare nameservers dormant (no cost).
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` (obsolete since T4a).
- `docs/design-system-v1.2-draft.md` (tombstone).
- `docs/mockups/add-find-sheet-v1-2.html`, `review-page-v1-2.html`, `edit-listing-v1-2.html` — partial retirement pending post-beta.
- `docs/mockups/email-v1-2.html` — updated session 39 rename sweep; keep as reference.
- `docs/mockups/share-booth-email-v1.html` through `v4.html` — design-history reference for Q-011 arc.
- `docs/mockups/my-shelf-multi-booth-v1.html` — Frames 2 + 3 updated session 57 (Q-002).
- `docs/multi-booth-build-spec.md` — archived reference.
- `docs/share-booth-build-spec.md` — Q-011 addendums stacked. Post-QA, candidate for consolidation.
- `components/ShelfGrid.tsx` (parked; zero callers).
- `/post` redirect shim — can delete post-beta.
- `.env.prod-dump.local` (session-54 one-shot artifact, gitignored, safe to delete anytime).
- Orphaned `dbutler80020@gmail.com` staging auth user (non-admin, non-blocking).
- **NEW: showPlaceholders prop infrastructure in BoothPage.tsx** (session 74) — unreachable after `/my-shelf` dropped the only `showPlaceholders={true}` callsite. ~10 min cleanup.

---

## INVESTOR UPDATE SYSTEM

- Google Drive folder: `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- Cadence: end of each sprint (weekly once beta launches)
- Trigger: say "generate investor update" at session close
- Process doc: Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle. Session 82 closed the largest design-system consolidation pass since the v1.x layer was named. Session 83 closed the polaroid evolved tile direction end-to-end. Session 84 was the first pure-security session since R12 Sentry. Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces. Session 86 closed the third — /my-shelf admin scroll-restore — in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected. Session 87 reconciled the Tech Rule queue (17 → 33 candidates) and shipped the brand asset overhaul. Session 88 closed the Tech Rule promotion batch end-to-end + bumped the wordmark height + ran a 9-commit animation/scroll-restore arc that ended in David's "pull out all the animations" call. Session 89 was a design intentionality pass — 9 runtime commits across two arcs. Session 90 was the auth-chrome relocation pass — 7 runtime commits relocating auth chrome off masthead onto BottomNav Profile tab + /login. Session 91 was the strategic-reset + Wave 1 cleanup pass — 13 runtime commits, roadmap moved 3/15 → 8/15 (largest single-session jump to date). Session 92 was the Wave 1 follow-up + Wave 1.5 security continuation — 11 runtime commits across two arcs. Act 1 shipped 3 design refinements David surfaced during iPhone QA (contact email split with NEXT_PUBLIC_ADMIN_EMAIL conflation caught, mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions, EditBoothSheet hero consolidation that retired the on-photo Pencil + Trash + scrim). Act 2 closed Wave 1.5: tightened auth+ownership on vendor-hero + post-image routes; fixed a real multi-booth ownership bug in /api/my-posts (latent 500 since session 57); shipped migrations 017+018 + diagnostics for function search_path + role-grant drift + auth.users exposure; ran OTP/password dashboard toggles. R1 shopper accounts FULLY UNBLOCKED. Session 93 was the login triage cleanup — 1 runtime commit splitting `/login` into a triage page + `/login/email` for the OTP form, iPhone QA passed end-to-end, R1's routing slot pre-baked. **Session 94 was the capture-and-add-find UX refinement — 4 runtime commits across three mockup iterations: Home VendorCTACard dropped, masthead +40 + wordmark 90 system-wide (heaviest brand anchor to date), /post/tag adopts shared StickyMasthead with new instructional copy + Find/Tag polaroids + Find retake (no AI re-fire), /post/preview gets Title/Caption/Price moved above the polaroid photo + auto-grow caption + postit-cream input bg + post-publish interstitial dropped (router.replace direct to /my-shelf). Cleanup agent scheduled May 21 to delete the now-unused VendorCTACard.tsx if soak-period clean.** Smallest→largest commit sequencing now **22+ firings** total, promoted-via-memory at session 88. **Next natural investor-update trigger point** is after R1 (shopper accounts) lands — turns "secure + audited + Wave-1-cleanup-complete + login-triage-shipped + capture-flow-refined + shopper-accounts-live" into the investor-ready surface area. From 3/15 → 8/15 + Wave 1.5 closure + login triage + capture flow refresh is already a credible chapter — David could ship an investor update on this milestone alone if he wants the cadence.
