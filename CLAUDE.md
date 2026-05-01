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

## ✅ Session 95 (2026-05-01) — Design system audit + Phase 2 A+B + bug fixes + masthead polish — 13 runtime commits + close

David's session 94 closer recommended iPhone QA bundle + R1 design pass. He redirected at standup to a **design-system audit and hardening pass — preserve the visual identity, make UI more consistent + scalable**. Three major arcs across the session.

**Arc 1 — Phase 1 audit + Phase 2 plan (2 docs).** Read [`lib/tokens.ts`](lib/tokens.ts) + [`docs/design-system.md`](docs/design-system.md), dispatched 4 parallel Explore agents (typography/color · spacing/layout · component reuse · borders/radius/shadows/icons), synthesized into [`docs/design-system-audit-phase1.md`](docs/design-system-audit-phase1.md). Top 5 findings: (1) `MASTHEAD_HEIGHT` not exported, (2) polaroid wrapper duplicated 5+ surfaces, (3) zero v1.x spacing/shadow tokens, (4) `Buttons.tsx` has zero v1.x callers, (5) empty states drift 4 ways. Wrote 6-session Phase 2 plan at [`docs/design-system-phase2-plan.md`](docs/design-system-phase2-plan.md). David approved sequence; "Session A" first.

**Arc 2 — Phase 2 Session A: Token foundation (2 commits).** Pure additive, zero visual delta:

| Commit | Scope |
|---|---|
| `8081b2b` | chore(tokens): export `MASTHEAD_HEIGHT` from StickyMasthead |
| `6182219` | feat(tokens): add `v1` color, shadow, gap, radius, icon scales |

New tokens added to [`lib/tokens.ts`](lib/tokens.ts): `v1.paperWarm` (#faf2e0 polaroid mat), `v1.onGreen`, `v1.greenDisabled`, `v1.shadow.{polaroid, polaroidPin, ctaGreen, sheetRise, cardSubtle}`, `v1.gap.{xs/sm/md/lg/xl}`, `v1.radius.{input, button, pill, sheet}`, `v1.icon.{xs/sm/md/nav/lg/xl}`. **Course-correct during execution:** Phase 1 audit's §B-1 ("MASTHEAD_HEIGHT must be adopted at clearance sites") was overstated — those `paddingTop: 60/72/80` values are inside `<main>` content areas; the masthead spacer in StickyMasthead already handles clearance. Export still ships as SSOT for future use; clearance-site adoption deferred.

**Arc 3 — Phase 2 Session B: `<PolaroidTile>` primitive (8 commits + 1 hotfix).** Mockup-first per Design Agent rule:

| Commit | Scope |
|---|---|
| `5a00cd5` | docs(polaroid): design record + V1 mockup |
| `ce22b8c` | feat(components): add `<PolaroidTile>` primitive + build spec |
| `3b9c72d` | refactor(post-preview): adopt PolaroidTile (-30 net) |
| `b03dda3` | refactor(post-tag): Find + Tag photos adopt (-19 net) |
| `1badb66` | refactor(booth-page): WindowTile + ShelfTile adopt (-52 net) |
| `495eb64` | refactor(flagged): FindTile adopts (-55 net) |
| `d692bba` | refactor(home): MasonryTile adopts (-96 net) |
| `2525c78` | docs(polaroid): /find/[id] ShelfCard as Phase 2.x carry-forward |
| `7054b2d` | fix(polaroid-tile): `width: 100%` on wrapper |

[V1 mockup](docs/mockups/polaroid-tile-primitive-v1.html) — David picked all my reads on D1-D7 directly; no V2 needed. Net ~250 lines deleted from the codebase. `<PolaroidTile>` primitive (~190 lines) replaces inline polaroid wrapper code across 6 callsites. Decisions frozen at [`docs/polaroid-tile-design.md`](docs/polaroid-tile-design.md); implementation contract at [`docs/polaroid-tile-build-spec.md`](docs/polaroid-tile-build-spec.md). 4 unused `TREEHOUSE_LENS_FILTER` imports stripped at callsites (primitive owns lens application).

**Two audit accuracy gaps surfaced during execution:**
1. **Inner photo radius variation (3-way split)** — Phase 1 audit assumed all surfaces used `v1.imageRadius=6`. Reality: Home=6, /post/preview+/post/tag=4, /flagged+/shelf=square (no radius). Added `photoRadius?: number` (default 0) prop mid-session.
2. **7th polaroid surface missed** — `/find/[id]` "More from this booth" ShelfCard at line 135 uses polaroid styling but has unique sold-state handling (photo-only opacity dim + per-image grayscale filter). Out of scope for Session B; logged as Phase 2.x carry-forward.

**Hotfix during iPhone QA:** /post/tag Find polaroid collapsed to a tiny square — primitive wrapper missing `width: "100%"`. Other surfaces had block-level parents that auto-stretched; /post/tag's flex-column-with-`alignItems: center` parent shrank the polaroid to content width (0). Fixed in `7054b2d`. **First firing of "Primitives that fill their parent should set `width: 100%` explicitly — block-level parents auto-stretch but flex-center parents shrink."**

**Bug fix — /login/email back-button infinite redirect (1 commit):**

| Commit | Scope |
|---|---|
| `8a8b977` | fix(login-email): back arrow exits to Home when authed user lands here |

**Cross-session cross-purpose bug from sessions 90+93.** Authed user taps Profile → /login auto-forwards (session 93) → /login/email → back arrow pushes to /login (session 93) → /login auto-forwards back → infinite loop. Only escape was sending another OTP code or signing out. Fix: back arrow checks `authedUser` state; pushes to `"/"` when authed (BottomNav Profile-tap-while-signed-in scenario), pushes to `"/login"` otherwise (triage entry). **First firing of "Cross-route redirect cycles emerge when auto-forwards stack across separately-shipped sessions."**

**Polish — wordmark -20% (1 commit):**

| Commit | Scope |
|---|---|
| `ec3b548` | feat(masthead): wordmark 90 → 72 (-20%) |

David approved the smaller wordmark mid-session. Inner-grid `minHeight: 90` + `MASTHEAD_HEIGHT` calc (103) unchanged this commit — wordmark centers within the 90px grid with ~9px breathing room above/below. If chrome reads too tall, follow-up drops `minHeight 90 → 72` + calc `103 → 85` to make the whole masthead shrink proportionally.

**Build green —** all 13 commits passed `npm run build`.

**iPhone QA mid-session** caught (a) /post/tag polaroid collapse, (b) /login/email back-button loop, (c) wordmark size approval. ~5th firing of [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md) — already promoted-via-memory. Saved a 2-session ship-then-QA cycle.

**Memory updates:** None this session.
- ~24th firing of [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) — already promoted-via-memory.
- ~5th firing of [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md) — already promoted-via-memory.
- "Verify primitive contract via grep before declaring scope" — first firing as a pattern (caught 7th polaroid surface only after grepping post-migration). Tech Rule on second.
- "Primitives that fill their parent should set `width: 100%` explicitly" — first firing.
- "Cross-route redirect cycles emerge when auto-forwards stack across separately-shipped sessions" — first firing.

**Operational follow-ups (carry into session 96):**

- **🟡 NEW PRIMARY (session 95): iPhone QA of Session A + B end-to-end.** Walk all 6 polaroid surfaces (Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/tag Find + Tag, /post/preview PolaroidPreview) confirming zero visual delta vs. pre-Session-B baseline. Plus auth flow (Profile tab while authed → /login/email → back → Home).
- **🟢 NEW (session 95): Phase 2 Session C ready — `<EmptyState>` primitive.** Per Phase 2 plan. 4 inline empty states drift on title size (15/20/24px), paddingTop (40/60/72/80), centering. Mockup-first. Smallest extraction in the queue.
- **🟢 NEW (session 95): /find/[id] ShelfCard polaroid migration deferred** as Phase 2.x. Needs `photoOpacity` + custom `imageFilter` props (or equivalent variant API) for sold-state handling.
- **🟢 NEW (session 95): If wordmark feels lost in 90px chrome on iPhone QA**, follow-up drops `minHeight 90 → 72` + calc `103 → 85` to shrink the whole masthead proportionally.
- **🟡 CARRY (session 94→95): iPhone QA of Wave 1 follow-up commits still un-walked.** Three session-92 design refinements (`8ec7884` contact email split, `4b515b2` mall hero relocation, `b6919b7` EditBoothSheet hero consolidation).
- **🟢 CARRY (session 94→95): Scheduled VendorCTACard cleanup agent fires May 21.** Auto-handles via routine.
- **🟢 CARRY (session 93→95): R1 (shopper accounts) routing slot pre-baked.** Largest unblocked R-item.
- **🟢 CARRY (session 93→95): /admin/login + /setup callsites stay routing through triage.**
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
- 🟡 CARRY (session 87): wordmark asset-weight optimization. UNTOUCHED — wordmark now 72px so render-weight slightly reduced; PNG file still 455KB.
- 🟡 CARRY (session 87): docs/design-system.md wordmark spec stale (now 72px height system-wide).

**Roadmap movement:** No new R-items. Design-system hardening pass moves the foundation an inch closer to scalable evolution; not a roadmap item itself.

**Commits this session (13 runtime + close):**

| Commit | Message |
|---|---|
| `8081b2b` | chore(tokens): export MASTHEAD_HEIGHT from StickyMasthead |
| `6182219` | feat(tokens): add v1 color, shadow, gap, radius, icon scales |
| `5a00cd5` | docs(polaroid): polaroid-tile primitive design record + V1 mockup |
| `ce22b8c` | feat(components): add <PolaroidTile> primitive + build spec |
| `3b9c72d` | refactor(post-preview): adopt <PolaroidTile> primitive |
| `b03dda3` | refactor(post-tag): adopt <PolaroidTile> for Find + Tag photos |
| `1badb66` | refactor(booth-page): WindowTile + ShelfTile adopt <PolaroidTile> |
| `495eb64` | refactor(flagged): FindTile adopts <PolaroidTile> |
| `d692bba` | refactor(home): MasonryTile adopts <PolaroidTile> |
| `2525c78` | docs(polaroid): note /find/[id] ShelfCard as Phase 2.x carry-forward |
| `7054b2d` | fix(polaroid-tile): width: 100% on wrapper |
| `8a8b977` | fix(login-email): back arrow exits to Home when authed user lands here |
| `ec3b548` | feat(masthead): wordmark 90 → 72 (-20%) |
| (session close) | docs: session 95 close — design system audit + Phase 2 A+B + bug fixes |

---

## ✅ Session 94 (2026-04-30) — Capture flow refinement shipped end-to-end + scheduled cleanup agent — 4 commits + close (rotated to mini-block session 95 close)

> Full block rotated out at session 95 close. Net: 4 runtime commits across V1→V2→V3 mockup iteration. **/post/tag** adopted `<StickyMasthead />` (bespoke chrome retired) + new instructional copy ("Take a photo of the tag" + "We'll read the title and price right off the tag, so you don't have to type them in.") + Find/Tag photos in polaroid wrappers stacked vertically with lowercase italic Lora "find"/"tag" labels below + Find retake link below polaroid (opens `<AddFindSheet title="Replace photo" />` → file picker → updates `postStore.imageDataUrl` with NO AI re-fire — David's hard constraint). **/post/preview** retired `<PostingAsBlock />` + `<PhotographPreview />` for inline `<PolaroidPreview />`; Title + Caption + Price moved ABOVE the photo; input bg `v1.inkWash → v1.postit`; Caption auto-grows via `useEffect` on `scrollHeight` (no internal scroll); disabled-publish unified to `rgba(30,77,43,0.40)` + white; post-publish "View my shelf / Add another find" interstitial dropped (`router.replace(myShelfHref)` direct, admin `?vendor=` preserved). **Home** dropped VendorCTACard from feed footer. **Masthead system-wide** wordmark 50→90px + total +40px (~13 ecosystem pages affected — note: session 95 reduced wordmark back to 72px). **AddFindSheet** gained optional `title` prop (default "Add a find"); retake callers pass "Replace photo". **Cleanup agent** scheduled `trig_017455nMVrTTZb6PxYnYcYZY` for May 21 (3-week soak) → checks `components/VendorCTACard.tsx` is still unused → opens cleanup PR if clean. NEW first-firings: surface coupled-requirement conflict in user spec (Q1=C decision moment), AI APIs skip on retake/redo unless explicitly stated, drop done-stage interstitials when redirect target is sufficient. Smallest→largest sequencing 22+ firings. 5th firing of [`feedback_v2_mockup_as_fill_refinement.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_v2_mockup_as_fill_refinement.md).

_(Session 94 detailed beat narrative removed at session 95 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings + the session 95 block above for the design-system hardening that built on session 94's masthead system-wide bump.)_

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

## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–94 still missing — operational backlog growing). Session 89 mini-block retired at session 94 close + Session 90 mini-block retired at session 95 close (tombstone bullets below stay as historical record). Visible window now sessions 91–94 mini + 95 full.

- **Session 94** (2026-04-30) — Capture flow refinement shipped end-to-end + scheduled cleanup agent: 4 runtime commits across V1→V2→V3 mockup iteration. /post/tag adopted shared `<StickyMasthead />` (bespoke chrome retired) + new instructional copy + Find/Tag photos in polaroid wrappers stacked with lowercase italic Lora "find"/"tag" labels + Find retake link (opens AddFindSheet → updates `postStore.imageDataUrl` with no AI re-fire — David's hard constraint). /post/preview retired `<PostingAsBlock />` + `<PhotographPreview />` for inline `<PolaroidPreview />`; Title + Caption + Price moved ABOVE the photo; input bg `v1.inkWash → v1.postit`; Caption auto-grows via `useEffect` on `scrollHeight`; disabled-publish unified to `rgba(30,77,43,0.40) + #fff`; post-publish "View my shelf / Add another find" interstitial dropped (`router.replace(myShelfHref)` direct). Home dropped VendorCTACard from feed footer. Masthead system-wide wordmark 50→90px + total +40px (~13 ecosystem pages — note: session 95 reduced wordmark back to 72px). AddFindSheet gained optional `title` prop (default "Add a find"; retake callers pass "Replace photo"). Cleanup agent `trig_017455nMVrTTZb6PxYnYcYZY` scheduled for May 21 to delete unused VendorCTACard.tsx if soak clean. NEW first-firings: surface coupled-requirement conflict in user spec, AI APIs skip on retake/redo unless explicitly stated, drop done-stage interstitials when redirect target is sufficient. Smallest→largest 22+ firings; 5th firing of feedback_v2_mockup_as_fill_refinement.md.
- **Session 93** (2026-04-30) — Login triage shipped end-to-end + iPhone QA passed: 1 runtime commit splitting `/login` into a triage page (returning vendor + new vendor cards + "Just shopping?" guest disambiguation + Contact us footer) + `/login/email` for the OTP form. Magic-link callback URL preserved at `/login` per path (a) decision — no `lib/auth.ts` or email-template changes. Two inbound `/login` callsites (`/vendor-request` "Sign in instead" + `/my-shelf` re-auth bounce) upgraded to `/login/email` directly to skip triage for known returning users. Two self-caught bugs fixed before push (React hook-ordering after early-return + URLSearchParams typing). iPhone QA passed end-to-end across 6+ routing paths. R1 (shopper accounts) routing slot pre-baked. NEW first-firings: triage-first routing for ambiguous-state pages, inbound deep-link audit when splitting routes, forward-known-states + render-fresh-states routing primitive.
- **Session 92** (2026-04-30) — Wave 1 follow-up + Wave 1.5 security closed end-to-end: 11 runtime commits across two arcs. Act 1 shipped 3 design refinements David surfaced during iPhone QA — contact email split (NEXT_PUBLIC_ADMIN_EMAIL conflation caught and avoided), mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions, EditBoothSheet hero consolidation that retired BoothHero on-photo Pencil + Trash + scrim. Act 2 closed Wave 1.5: tightened `/api/vendor-hero` + `/api/post-image` auth+ownership; fixed a real multi-booth ownership bug in `/api/my-posts/[id]` (latent 500 since session 57); deleted orphan `/api/debug`; shipped migration 017 (function search_path) + diagnostic; shipped migration 018 (role-grant + auth.users exposure RPC) + diagnostic; ran OTP/password dashboard toggles. R1 shopper accounts now FULLY UNBLOCKED — every Wave 1.5 hard prereq is green. NEW first-firings: surface auth/identity conflation issues BEFORE editing (NEXT_PUBLIC_ADMIN_EMAIL catch), multi-booth `maybeSingle()` ownership bug pattern, diagnostic-heuristic-must-cross-reference-RLS-state.
- **Session 91** (2026-04-30) — Strategic reset + Wave 1 cleanup pass shipped end-to-end: 13 runtime commits in one session run after David's "true assessment of where we are" opener, after 30+ prior sessions where roadmap stood at 3/15 R-items shipped. Roadmap moved 3/15 → 8/15 (largest single-session jump to date). **R5a 30-day public-feed window**, **5 admin destructive-action audit event types**, **R4a marked shipped via /shelves** with Q-015 captured for the alternative path, **R4b BoothHero remove-photo Trash bubble + DELETE /api/vendor-hero**, **vendor self-edit booth name** via EditBoothSheet vendor mode + `/api/vendor/profile` route, **R7 /contact page** Frame C minimal mailto rows + `/login` discovery link, **R11 mall hero images** with migration 016 + admin upload UI + Frame A photo-above-MallScopeHeader feed render. Smallest→largest fired 16th–19th times. **NOTE: at session 92 close, the R4b Trash bubble + on-photo Pencil affordances were RETIRED** — David asked to consolidate hero edit into EditBoothSheet, so the photograph reads clean and replace+remove live in the sheet at the title-Pencil entry point. Migration 016 column + admin upload route preserved; mall hero composition position flipped from "above" to "below" MallScopeHeader.
- **Session 90** (2026-04-30) — Auth chrome relocation + masthead share primitive: 7 runtime commits across two directive arcs. **BottomNav restructured** with always-second-position **Profile** tab routing to /login (replaces masthead sign-in/sign-out chrome on Home + /flagged). Profile icon outline turns `v1.green` when authed (label stays muted; outline-only). **Booths nav fully admin-gated** (vendors lose it too — discover via feed). **Admin tab uses `IoKey`** from `react-icons/io5`. **Sign-out moved to /login** as italic dotted-link below "First time?…" — `/login` no longer auto-redirects already-authed users on bare visits (only on explicit `?redirect=`). **/login icon visual** — bg circle dropped, CircleUser glyph 22→44 + stroke 1.4→1.2. **`MastheadShareButton` primitive** baked into StickyMasthead as default right slot; opt out via `right={null}` on Home/Booths/Saved primary tabs. **/find/[id] strip shadow clearance** via padding adjustment. Smallest→largest fired 14th + 15th times.
_(Session 89 tombstone rotated off at session 95 close — sessions 87–94 missing from `docs/session-archive.md`; backfill remains operational backlog.)_

---

## CURRENT ISSUE
> Last updated: 2026-05-01 (session 95 close — design system audit + Phase 2 A+B + bug fixes + masthead polish. Phase 1 audit + 6-session Phase 2 plan written. Session A: 2-commit token foundation, zero visual delta. Session B: 8-commit + 1 hotfix `<PolaroidTile>` extraction across 6 callsites, ~250 net lines deleted. Bug fixes: /post/tag polaroid collapse (width:100%) + /login/email back-button infinite redirect (authed-user check). Wordmark 90 → 72 (-20%). 13 runtime commits + close.)

**Working tree:** clean (after close commit). **Build:** green. **Beta gate:** unblocked. **Net change this session:** 13 runtime commits + close. Phase 1 audit + Phase 2 plan as durable docs; PolaroidTile primitive shipped across 6 callsites with zero visual delta; cross-session login redirect bug closed; wordmark trimmed. R1 hard prereqs still all green from session 92; routing slot still pre-baked from session 93. Roadmap unchanged at 8/15 (design-system hardening ≠ R-item).

### 🚧 Recommended next session — iPhone QA bundle + Phase 2 Session C if clean (~75–120 min)

Walk session-95 ship to confirm zero visual delta on the polaroid surfaces + verify the auth-flow back-button fix. Bundle in still-unwalked session-94 + session-92 follow-ups. Then Phase 2 Session C (`<EmptyState>` primitive) if QA clean.

**Why this shape:**
- 6 polaroid surfaces migrated end-to-end — biggest visual primitive after the masthead. Drift would read immediately on iPhone.
- Auth-flow back-button fix needs device verification (cross-session bug from sessions 90+93).
- Session-94 capture flow + masthead +40 + wordmark size still need device confirmation.
- Phase 2 Session C is the smallest extraction in the queue (4 inline empty states drift on title size + paddingTop + centering); good momentum-builder if QA clean.

**Plan (in order):**

1. **🖐️ HITL — iPhone QA walk (~25–35 min):**
   - **Polaroid surfaces (Session B):** Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/tag Find + Tag, /post/preview PolaroidPreview. Compare against pre-Session-B baseline (commit `6182219` or earlier). Confirm zero visual delta on background, padding, radius, shadow stack, photo inner radius (3-way split: 6 / 4 / 0), inset shadow on /post/tag, lens filter on/off per surface, dim opacity for sold, highlighted halo on Home last-viewed.
   - **Auth flow:** Sign in via Profile → Home (✓). Tap Profile again → /login/email → tap back arrow → should land on Home (the bug fix). Sign out → tap Profile → /login triage → tap "Sign in" → /login/email → tap back → /login (unchanged guest behavior).
   - **Wordmark size:** Confirm wordmark 72px reads premium-not-floating in the 90px masthead grid. If the chrome feels too tall around it, log for follow-up commit (drop minHeight 90 → 72 + calc 103 → 85).
   - **Session 94 carry-forwards still unwalked:** Masthead +40 / wordmark on ~13 pages, /post/tag retake, /post/preview auto-grow caption + redirect.
   - **Wave 1 follow-up watch-items** (carry from session 92): /contact mailto, mall hero composition BELOW MallScopeHeader, /my-shelf BoothHero clean + EditBoothSheet hero photo section.
2. **Address concrete issues from #1.** Likely 0–3 small commits.
3. **Phase 2 Session C — `<EmptyState>` primitive (~45–75 min, mockup-first).** 4 inline empty states drift on title size (15/20/24px), paddingTop (40/60/72/80), centering. Mockup at `docs/mockups/empty-state-primitive-v1.html`. 5 decisions per Phase 2 plan. Migrate Home + /flagged + /shelves + /shelf/[slug] empty branches.

### Alternative next moves (top 4)

1. **R1 (shopper accounts) design pass** (~60–80 min, mockup-first). Largest unblocked R-item; routing slot pre-baked at session 93. Carry from session 94→95 alternative.
2. **Phase 2 Session D — Form chrome (FormField + FormButton + retire Buttons.tsx)** (~M, mockup-first). Form labels + inputs + buttons drift across 8 surfaces.
3. **/find/[id] ShelfCard polaroid migration** (~30 min). Phase 2.x carry — needs `photoOpacity` + custom `imageFilter` props on PolaroidTile for sold-state handling.
4. **Motion design revisit** (~60–90 min, mockup-first). Carry from session 88.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 96 opener (pre-filled — iPhone QA bundle + Phase 2 Session C)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, docs/design-system-phase2-plan.md (Session C row), docs/polaroid-tile-design.md, docs/polaroid-tile-build-spec.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: iPhone QA bundle (Session 95 PolaroidTile migration + auth-flow back-button fix + wordmark size + Session 94 + Session 92 carry-forwards), then Phase 2 Session C <EmptyState> primitive if clean. (1) Walk all 6 polaroid surfaces (Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/tag Find + Tag, /post/preview PolaroidPreview) confirming zero visual delta. (2) Walk auth flow: Profile while authed → /login/email → back → Home (verify the redirect-loop fix). (3) Walk session-94 + session-92 watch-items still unwalked. (4) Phase 2 Session C mockup → primitive → migrate 4 callsites.

PROBLEMS SESSION 95 ALREADY SOLVED — don't accidentally revive: (a) v1.x tokens at lib/tokens.ts now include shadow scale (polaroid, polaroidPin, ctaGreen, sheetRise, cardSubtle), gap scale (xs/sm/md/lg/xl = 6/8/12/16/22), radius scale (input/button/pill/sheet = 14/14/999/20), icon scale (xs/sm/md/nav/lg/xl = 14/16/18/21/22/24), v1.paperWarm (#faf2e0), v1.onGreen (#fff), v1.greenDisabled (rgba(30,77,43,0.40)). Adoption is per-session as primitives ship — Session A only DECLARES the tokens. (b) MASTHEAD_HEIGHT exported from components/StickyMasthead.tsx as SSOT — DO NOT remove the export. (c) <PolaroidTile> primitive at components/PolaroidTile.tsx is the canonical polaroid wrapper. 6 callsites use it: app/page.tsx MasonryTile, app/flagged/page.tsx FindTile, components/BoothPage.tsx WindowTile + ShelfTile, app/post/preview/page.tsx, app/post/tag/page.tsx (Find + Tag photos). DO NOT inline polaroid wrappers anywhere new — extend the primitive instead. (d) PolaroidTile API has photoRadius prop (default 0) for the 3-way split: Home=v1.imageRadius (6), /post/preview+/post/tag=4, /flagged+/shelf=0. (e) PolaroidTile wrapper has width: 100% — DO NOT remove (caused /post/tag flex-center collapse bug). (f) /post/tag PolLabel ("find" / "tag") is a CALLER-WRAPPED SIBLING outside the polaroid wrapper, NOT in the below slot. (g) /find/[id] "More from this booth" ShelfCard at line 135 is a 7th polaroid surface — KNOWN unmigrated, Phase 2.x carry-forward (needs photoOpacity + custom imageFilter props for sold-state). (h) /login/email back-arrow handler checks authedUser state: pushes to "/" when authed (escapes the BottomNav-Profile-tap → /login auto-forward → /login/email loop), pushes to "/login" otherwise. DO NOT revert to unconditional router.push("/login"). (i) Wordmark height 72px in StickyMasthead (session 95 reduced from session-94's 90px). Inner-grid minHeight 90 + MASTHEAD_HEIGHT calc 103 unchanged. If chrome feels too tall, drop to minHeight 72 + calc 85.

PROBLEMS SESSION 94 ALREADY SOLVED — don't accidentally revive: (a) Home VendorCTACard dropped — do NOT reintroduce. Cleanup agent fires May 21. (b) /post/tag uses shared <StickyMasthead /> not bespoke chrome. (c) /post/tag ready-state copy: "Take a photo of the tag" + "We'll read the title and price right off the tag, so you don't have to type them in." (d) /post/preview Title + Caption + Price are ABOVE the photo. <PostingAsBlock /> + booth post-it removed. <PhotographPreview /> retired here (still used by /post/edit/[id]). (e) /post/preview input bg is v1.postit. (f) Caption auto-grows via useEffect on scrollHeight + reset-to-auto. (g) Disabled publish is rgba(30,77,43,0.40) + #fff (now also tokenized as v1.greenDisabled + v1.onGreen — adoption deferred to Session D). (h) Post-publish "done" interstitial GONE — router.replace(myShelfHref) on success. (i) Find retake on /post/tag + /post/preview opens AddFindSheet (title="Replace photo") → file picker → updates postStore.imageDataUrl → NO /api/post-caption refire, NO /api/extract-tag refire. (j) Tag retake DEFERRED. (k) AddFindSheet has optional title prop (default "Add a find"). /my-shelf still uses default.

PROBLEMS SESSION 93 ALREADY SOLVED — don't accidentally revive: (a) /login is the triage page (returning vendor / new vendor cards + "Just shopping?" line + Contact us footer). (b) /login/email is the OTP form. (c) Magic-link callback URL stays at /login per path (a) decision. (d) /vendor-request "Sign in instead" + /my-shelf re-auth bounce route directly to /login/email. (e) Authed users hitting /login forward to /login/email.

PROBLEMS SESSION 92 ALREADY SOLVED — don't accidentally revive: (a) NEXT_PUBLIC_ADMIN_EMAIL is admin gating identity ONLY — public-facing contact email is hardcoded `info@kentuckytreehouse.com` at /contact + 3 replyTo sites in lib/email.ts. (b) Mall hero renders BELOW MallScopeHeader via <FeaturedBanner variant="eyebrow"> primitive. (c) BoothHero is clean — no on-photo Pencil + Trash + top scrim. (d) EditBoothSheet contract: handleSave calls onClose itself; onUpdated is pure-reconciliation. (e) /api/vendor-hero + /api/post-image require auth + ownership-or-admin. (f) /api/my-posts/[id] PATCH ownership uses combined .eq("user_id").eq("id", post.vendor_id).maybeSingle() (multi-booth-safe). (g) Migrations 016+017+018 applied; OTP expiry 600s + password min 8.

ALTERNATIVES IF DEFERRED: (1) R1 shopper accounts design pass. (2) Phase 2 Session D — form chrome. (3) /find/[id] ShelfCard polaroid migration. (4) Motion design revisit.

CARRY-FORWARDS FROM SESSIONS 78–95: Phase 3 scroll-restore CLOSED end-to-end. Wordmark `public/wordmark.png` 72px in StickyMasthead (session 95, was 90 session 94). Masthead inner-grid minHeight 90 + MASTHEAD_HEIGHT calc constant 103 (now exported). ~13 ecosystem back-button surfaces 44px with ArrowLeft 22. /post/tag + /post/preview both adopt StickyMasthead. <PolaroidTile> primitive at components/PolaroidTile.tsx owns: Home masonry, /flagged FindTile, /shelf/[slug] WindowTile + ShelfTile, /post/tag Find + Tag, /post/preview PolaroidPreview (session 95). Phase 2.x carry: /find/[id] ShelfCard polaroid not yet migrated. PostingAsBlock + PhotographPreview retired from /post/preview, kept for /post/edit/[id]. /login = triage cards. /login/email = OTP form (back-arrow checks authedUser state to escape redirect loop). /contact has 3 mailto rows pointing at info@kentuckytreehouse.com. EditBoothSheet supports mode={"admin"|"vendor"} + "Booth photo" section. /api/vendor-hero + /api/post-image require auth + ownership-or-admin. /api/admin/malls/hero-image POST + DELETE admin-gated. RLS enabled on every public table. All public functions have search_path pinned (migration 017). Migrations 016+017+018 applied. OTP expiry 600s + password min 8. R5a getFeedPosts uses gte("created_at", cutoff = now − 30 days). /flagged is 3-col grid. /find/[id] hero photo + flag layoutIds stripped. preview-cache pattern (treehouse_find_preview:${id}) stays. BoothLockupCard owns /shelves + /flagged. IM Fell COMPLETELY RETIRED. AI routes (extract-tag, identify, post-caption, report-comps, story, suggest) deliberately unauthed per session-92 deferral. Tech Rules queue: 0 🟢, ~32 🟡 (sessions 89–95 single-firings stay outside queue per rule — including session 95's verify-primitive-contract-via-grep, primitives-need-width-100, cross-route-redirect-cycles).

SCHEDULED AGENT: trig_017455nMVrTTZb6PxYnYcYZY fires Thu May 21 9:00 AM EDT — checks if VendorCTACard still unused → opens cleanup PR if so, reports otherwise. Manage at https://claude.ai/code/routines/trig_017455nMVrTTZb6PxYnYcYZY.

PHASE 2 PLAN STATE: Session A (tokens) + Session B (PolaroidTile) DONE. Session C (EmptyState) ready, smallest extraction next. Session D (FormField + FormButton) gated on canonical input-bg pick (postit vs inkWash). Session E (post/edit + vendor/[slug] palette migrations) low-risk. Session F (cleanups + /design-system showcase) end-of-phase. See docs/design-system-phase2-plan.md for full sequence + risks.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle. Session 82 closed the largest design-system consolidation pass since the v1.x layer was named. Session 83 closed the polaroid evolved tile direction end-to-end. Session 84 was the first pure-security session since R12 Sentry. Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces. Session 86 closed the third — /my-shelf admin scroll-restore — in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected. Session 87 reconciled the Tech Rule queue (17 → 33 candidates) and shipped the brand asset overhaul. Session 88 closed the Tech Rule promotion batch end-to-end + bumped the wordmark height + ran a 9-commit animation/scroll-restore arc that ended in David's "pull out all the animations" call. Session 89 was a design intentionality pass — 9 runtime commits across two arcs. Session 90 was the auth-chrome relocation pass — 7 runtime commits relocating auth chrome off masthead onto BottomNav Profile tab + /login. Session 91 was the strategic-reset + Wave 1 cleanup pass — 13 runtime commits, roadmap moved 3/15 → 8/15 (largest single-session jump to date). Session 92 was the Wave 1 follow-up + Wave 1.5 security continuation — 11 runtime commits across two arcs. Act 1 shipped 3 design refinements David surfaced during iPhone QA (contact email split with NEXT_PUBLIC_ADMIN_EMAIL conflation caught, mall hero relocation BELOW MallScopeHeader at FeaturedBanner dimensions, EditBoothSheet hero consolidation that retired the on-photo Pencil + Trash + scrim). Act 2 closed Wave 1.5: tightened auth+ownership on vendor-hero + post-image routes; fixed a real multi-booth ownership bug in /api/my-posts (latent 500 since session 57); shipped migrations 017+018 + diagnostics for function search_path + role-grant drift + auth.users exposure; ran OTP/password dashboard toggles. R1 shopper accounts FULLY UNBLOCKED. Session 93 was the login triage cleanup — 1 runtime commit splitting `/login` into a triage page + `/login/email` for the OTP form, iPhone QA passed end-to-end, R1's routing slot pre-baked. Session 94 was the capture-and-add-find UX refinement — 4 runtime commits across three mockup iterations: Home VendorCTACard dropped, masthead +40 + wordmark 90 system-wide (heaviest brand anchor to date), /post/tag adopts shared StickyMasthead with new instructional copy + Find/Tag polaroids + Find retake (no AI re-fire), /post/preview gets Title/Caption/Price moved above the polaroid photo + auto-grow caption + postit-cream input bg + post-publish interstitial dropped. Cleanup agent scheduled May 21. **Session 95 was the design system audit + hardening pass — 13 runtime commits + close. Three arcs: (1) Phase 1 audit + 6-session Phase 2 plan as durable docs; (2) Phase 2 Session A token foundation (export `MASTHEAD_HEIGHT` + add v1 color/shadow/gap/radius/icon scales — pure additive zero visual delta); (3) Phase 2 Session B `<PolaroidTile>` primitive extraction across 6 callsites + 1 hotfix (~250 net lines deleted). Plus a cross-session bug fix (sessions 90+93 stacked auto-forwards trapped authed users in /login → /login/email infinite redirect — back-arrow now checks authedUser state) and a wordmark trim (90 → 72, -20%).** Smallest→largest commit sequencing now **24+ firings** total, promoted-via-memory at session 88. Mid-session iPhone QA on Vercel preview ~5 firings, also promoted-via-memory. **Next natural investor-update trigger point** is still after R1 (shopper accounts) lands — turns "secure + audited + Wave-1-cleanup-complete + login-triage-shipped + capture-flow-refined + design-system-hardened + shopper-accounts-live" into the investor-ready surface area. The PolaroidTile extraction is the kind of foundation move that matters more for future velocity than as an investor narrative beat — but it does mean Phase 2 sessions C–F can ship faster with cleaner diffs.
