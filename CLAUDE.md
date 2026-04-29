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

## ✅ Session 88 (2026-04-29) — Wordmark height bump + Tech Rule promotion batch (11 🟢 → 0 + 4 new 🟡) + multi-iteration animation/scroll-restore arc that ended in full motion strip on the ecosystem layer

Three arcs in one session, **11 runtime commits + close**, including David's "lets just pull out all the animations" call after iterative refinement plateaued.

**Arc 1 — Wordmark height bump (`28d60ca`).** Single-token tweak: `WORDMARK_DEFAULT.height` 30px → 40px in [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) so the wordmark fills the masthead's 40px inner grid (was leaving 5px breathing room top + bottom; David's iPhone QA call: "I want it to take up the full height of the mast header"). Auto-width grew ~56px → ~75px from the 1500:800 aspect ratio. Vercel-preview iPhone QA approved. Build clean.

**Arc 2 — Tech Rule promotion batch (`8635487`).** Closed the session-87 carry-forward via the new triage rule from `feedback_tech_rule_promotion_destination.md`. All 11 🟢 candidates resolved:

| Bucket | Count | Examples |
|---|---|---|
| New `feedback_*.md` memory files (operating-style) | 5 | TR-r cap-speculative-patching, TR-s smallest→largest sequencing (bumped to 11× by close), TR-v mid-session iPhone QA, TR-y user-facing copy scrub, TR-z V2-mockup-as-fill-refinement |
| Prose entries in [`docs/DECISION_GATE.md`](docs/DECISION_GATE.md) `## The Tech Rules` (production-safety) | 2 | TR-w Lora lineHeight 1.4 minimum, TR-l Vercel-runtime PostgREST divergence |
| ✅ Promoted-via-memory (memory file already auto-loads) | 4 | TR-m, TR-t, TR-u, TR-x |

Queue went 33 active / 11 🟢 → 22 active / 0 🟢. Clean slate for the next promotion batch. TR-s firing count bumped to 10× pre-promotion; bumped again to 11× at this close (Arc 2's 1-commit + Arc 3's 3-commit triple fix both ran smallest→largest).

**Arc 3 — /find/[id] scroll restore + entrance animation strip (UNPLANNED, mid-session pivot from David's iPhone QA on the wordmark).** This was the bulk of the session. **9 runtime commits across two compounding bug classes I treated independently before David called the total strip.** Beats:

1. **Scroll restore initial attempt (`c4771b2`).** Per-id sessionStorage keys for page vertical + carousel horizontal scroll on /find/[id]. Pattern lifted from /flagged. iPhone QA: peer find didn't start at top, back-nav didn't restore correctly. Diagnosed: same-route param navigation (`/find/A` → `/find/B`) doesn't reliably scroll-to-top on Next.js App Router; auto-clamp scroll events during the render-commit window clobber the saved value via the still-attached scroll listener.
2. **Surgical fix (`c4105bc`).** Capture-phase `onClickCapture` snapshot on the strip-thumb wrapper saves the user's true scroll synchronously before navigation; module-scope `findScrollWriteBlocked` flag locks the listener during transition; explicit `scrollTo(0,0)` on fresh forward nav. iPhone QA: still broken on the "back to home, tap same find again" case.
3. **Skip-entrance gate v1 (`0d84806`).** Parallel arc — added skipEntrance state on Home + /flagged with sessionStorage-flag gate. iPhone QA: animations still firing on every visit (because the source wasn't entrance fades — see Arc 3 beat 5).
4. **Scroll fix v2 (`222ba96`).** Back-nav detection via popstate listener; restore only on browser back/forward, otherwise scrollTo(0,0). iPhone QA: still broken on the "tap same find from Home twice" case — popstate flag goes stale because /find/[id]'s effect doesn't re-run when the user navigates AWAY from /find/A → Home (no /find/[id] mount to consume the flag), so a subsequent forward Link tap reads the still-true flag and incorrectly restores.
5. **Nuke C v1 (`ccd9ca2`).** David's call to strip all entrance motion.divs while keeping `layoutId` shared-element morphs. ~150 lines net deletion across Home + /flagged + /find/[id]. iPhone QA: animations STILL appear to fire. **Diagnosed two distinct sources I'd missed:** (a) Home masonry tile reflow as images load — `<img onLoad>` updating tile heights — pure DOM layout shift, no animation involved (TR-aj); (b) framer-motion `layoutId` cross-page morph from Home tile photographs to /flagged tile photographs because both pages render the same `find-${id}` layoutId — Track D shared-element wiring side-effect (TR-ai).
6. **Three-commit triple fix (`01ff797` → `04d5886` → `0449d5a`).** Smallest→largest sequencing: C (pushState monkey-patch on /find/[id] for accurate nav-type detection — TR-ah) → B1 (strip layoutIds from /flagged FindTile to kill the cross-page morph) → A1 (lock Home masonry tiles to fixed 4:5 aspect, drop imgHeight + onLoad to kill image-load reflow). All three architecturally correct. iPhone QA: David: "looks exactly the same" / "this is slowly getting worse." Structural fixes weren't enough.
7. **Total motion strip (`b3e47df`).** David: "Lets just pull out all the animations for now and we'll revisit this in a full session. It still feels off." Stripped the last surviving motion: Home tile photo + flag layoutId, /find/[id] hero photo + flag layoutId, AnimatePresence wrapper, framer-motion imports on Home + /find/[id]. Net -21 lines. The Track D shared-element morph kept through Nuke C was finally retired. **Ecosystem layer (Home, /flagged, /find/[id]) is now fully static motion-wise.** The framer-motion package stays installed; other layers (`/decide`, `/post/edit/[id]`) still use it for unrelated modal primitives.

**The Arc 3 lesson — captured as new memory.** [`feedback_total_strip_after_iterative_refinement_fails.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_total_strip_after_iterative_refinement_fails.md). After 3+ iteration cycles where David reports "still feels off" / "looks exactly the same" / "getting worse" on the same visual concern, surface "remove the entire feature class" as a positive design call before another sublayer attempt. The total strip in 1 commit (`b3e47df`) was the right answer and could have been the FIRST answer offered after iteration 2 instead of iteration 6. Pairs with `feedback_cap_speculative_patching_at_3_rounds.md` (TR-r): TR-r tells you when to stop patching at the same layer; this rule says "remove the entire layer" is a valid escalation, not just "swap primitives."

**Final state in production (after `b3e47df` + close):**

- ✅ Wordmark wider on every screen using `StickyMasthead` (~12 surfaces). 40px filling masthead inner grid.
- ✅ Tech Rule queue: 0 🟢, 26 🟡 (4 new candidates added at close — TR-ah popstate-vs-pushState, TR-ai cross-page layoutId, TR-aj image-load-reflow-looks-like-animation; plus the new total-strip memory captured outside the queue).
- ✅ /find/[id] scroll restore: forward nav (Link tap from Home, /flagged, peer "More from this booth" thumb) → always `scrollTo(0,0)`. Browser back/forward → restore from saved sessionStorage if present. Capture-phase save + write-block flag still in place to defend against transition-time scroll clobber.
- ✅ Home masonry: fixed 4:5 aspect ratio, no image-load reflow. Trade-off: tiles no longer match real photo aspects, but vendor portrait phone photos sit close to 4:5 so cropping is minimal.
- ✅ /flagged: layoutId stripped from FindTile so Home → /flagged doesn't cross-page morph. Trade-off: /flagged tile → /find/[id] photo morph also retired.
- ✅ Home + /flagged + /find/[id] motion: fully static. The only motion left in the ecosystem layer is interactive feedback (tap-flash overlay, scale on `:active`) and CSS transitions on shadow/border state changes.
- 🟡 NEW PRIMARY CARRY: motion design revisit in a focused future session. David: "we'll revisit this in a full session." Animation-as-feature has been removed but not redesigned; the right shape is a fresh design pass with mockups, not patch-iteration on the stripped state.
- 🟡 NEW CARRY: verify the `01ff797` pushState monkey-patch on real iPhone. David's last QA was on the popstate-only flag; the staleness fix shipped after.
- 🟡 NEW CARRY: preview-cache (`treehouse_find_preview:${id}` sessionStorage) is now reduced infrastructure — its load-bearing role for the layoutId source-rect is gone, but it still helps with sync first-paint of the photograph. Audit candidate.
- 🟡 CARRY (from session 87): wordmark surface walk on /find/[id] + /shelf/[slug] + /my-shelf — partially answered (40px feels right per session-88 QA on Home), full surface walk still untested.
- 🟡 CARRY (from session 87): asset weight on `public/wordmark.png` (455KB) — optimization candidate.
- 🟡 CARRY (from session 87): `docs/design-system.md` wordmark spec stale — doc-only follow-up.

**Commits this session (11 runtime + close):**

| Commit | Message |
|---|---|
| `28d60ca` | feat(masthead): wordmark fills 40px inner grid (was 30px) |
| `8635487` | docs(tech-rules): session 88 promotion batch — 11 🟢 candidates resolved |
| `c4771b2` | feat(find): peer-nav scroll-restore on /find/[id] (page vertical + carousel horizontal) |
| `c4105bc` | fix(find): peer-nav scroll save + fresh-nav scroll-to-top |
| `0d84806` | feat(home,flagged): skip entrance animation on revisit (E6 follow-up) |
| `222ba96` | fix(find): scroll restore only on browser back/forward, not Link tap |
| `ccd9ca2` | feat(motion): Nuke C — strip all entrance animations, keep layoutId morphs |
| `01ff797` | fix(find): pushState monkey-patch for nav-type detection (replaces stale popstate flag) |
| `04d5886` | fix(flagged): strip layoutIds from FindTile to kill cross-page morph (B1) |
| `0449d5a` | fix(home): masonry tiles to fixed 4:5 aspect — kill image-load reflow (A1) |
| `b3e47df` | feat(motion): full strip — kill the last shared-element morph |
| (session close) | docs: session 88 close — wordmark + Tech Rule promotion + multi-iteration motion strip arc |

**Memory updates:**

- NEW memory: [`feedback_total_strip_after_iterative_refinement_fails.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_total_strip_after_iterative_refinement_fails.md). Pattern: after 3+ "still feels off" iterations on a visual concern, surface total-strip as a positive design call. Single firing this session (the animation arc); Tech Rule candidate on second firing.
- UPDATED memory: [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) firing count 10× → 11× (session 88's 3-commit triple fix C → B1 → A1).
- 5 NEW memories landed in Arc 2 (Tech Rule promotion batch): `feedback_cap_speculative_patching_at_3_rounds.md`, `feedback_smallest_to_largest_commit_sequencing.md`, `feedback_mid_session_iphone_qa_on_vercel_preview.md`, `feedback_user_facing_copy_scrub_skip_db_identifiers.md`, `feedback_v2_mockup_as_fill_refinement.md`.

**Existing memories that load-bore the session:**

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 11 runtime commits ✅.
- `feedback_recurring_phrase_signals_system.md` — should have fired earlier in Arc 3. David's "still feels off" was a 3+ time recurrence by the time I considered total-strip. The new total-strip memory above is the more specific cousin.
- `feedback_visibility_tools_first.md` — did NOT fire. Should have. After /find/[id] scroll round 2 failed iPhone QA, I should have proposed visibility tooling instead of more code attempts. Lesson reinforced.
- `feedback_kill_bug_class_after_3_patches.md` — fired in spirit but I missed the meta-application: instead of swapping CSS primitives within the animation system, the structural answer was to remove the whole feature.

**Live discoveries (single firings, Tech Rule candidates):**

- **TR-ah:** Same-route param navigation in App Router doesn't fire popstate; popstate-only flag goes stale. Fix: monkey-patch pushState/replaceState. Captured as queue candidate.
- **TR-ai:** Cross-page layoutId match causes surprise morph. framer-motion treats layoutId as global, not page-scoped. Captured as queue candidate.
- **TR-aj:** Image-load layout reflow looks like animation. Diagnostic question to ask before chasing animation fixes: "Is this CSS/framer animation, or DOM layout shift?" Captured as queue candidate.
- **TR-r 3rd firing:** Cap speculative patching at 3 rounds — fired during BOTH the scroll arc AND the animation arc this session. Promotion-confirmed via memory.
- **TR-t 3rd firing:** Structural fix < accumulated patches — `b3e47df` total strip net -21 lines, retiring the entire feature class.

**Operational follow-ups:**

- **NEW PRIMARY: motion design revisit session.** David: "we'll revisit this in a full session." Mockup-first per `docs/DECISION_GATE.md`, structural alternatives spanning real options (no morph / minimal morph / full Track D scope), iPhone QA against real seeded content, ship one option.
- **NEW: iPhone QA verification of the pushState monkey-patch.** David's last iPhone QA was before `01ff797`. The "tap same find from Home twice" flow needs verification on iPhone now that the staleness fix shipped. ~5 min.
- **NEW: preview-cache role audit.** `treehouse_find_preview:${id}` sessionStorage usage is reduced now that the motion.div photo morph is gone. Possibly removable, possibly still useful for sync first-paint. ~15 min audit.
- All session 78–87 carry-forwards still hold unless explicitly resolved above.
- Audit gap follow-ups (security continuation from session 84) — function search_path, role grants, auth.users exposure, OTP/password policy, per-route /api/* auth — still unbuilt.
- Archive-drift backfill: tombstones for sessions 54+55+57–87 still missing from `docs/session-archive.md`. Operational backlog growing.

**Notable artifacts shipped this session:**

- [`components/StickyMasthead.tsx`](components/StickyMasthead.tsx) — wordmark height 30 → 40.
- [`docs/DECISION_GATE.md`](docs/DECISION_GATE.md) — TR-w + TR-l prose entries added.
- [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md) — 11 🟢 promoted, 4 new 🟡 (TR-ah/ai/aj + total-strip note), queue rebalanced.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — pushState monkey-patch + capture-phase save + scroll restore branch on nav-type + layoutId stripped from photograph + flag.
- [`app/flagged/page.tsx`](app/flagged/page.tsx) — entrance motion stripped, BoothSection AnimatePresence retired, FindTile layoutIds stripped, dead motion / MOTION_SHARED_ELEMENT_* imports purged.
- [`app/page.tsx`](app/page.tsx) — entrance motion stripped, EmptyFeed/SkeletonMasonry to plain divs, masonry tiles locked to 4:5 aspect, MasonryTile layoutIds stripped, AnimatePresence around MasonryGrid retired, dead imports purged.
- 5 NEW memory files (Arc 2 batch) + 1 NEW memory file (close): see Memory updates above.

---

## ✅ Session 87 (2026-04-29) — Tech Rule queue update reconciled (17 → 33 candidates registered, 11 🟢 promotion-ready) + brand asset install end-to-end (full Treehouse Finds favicon + PWA icon set replacing Vercel default-N + masthead wordmark swap from TNR text to logo PNG, system-wide) — 3 runtime commits + close (rotated to mini-block session 88 close)

> Full block rotated out at session 88 close. Net: 3 runtime commits — Tech Rule queue went from 17 → 33 candidates registered (11 🟢 promotion-ready, 22 🟡 first-firing) closing the carry-forward from session 86; brand asset overhaul installed full PWA + favicon icon set replacing Vercel default-N + swapped masthead wordmark from session-80 TNR text to a transparent-PNG logo `public/wordmark.png` at 30px height across every screen using `StickyMasthead`. Mid-arc honest-assessment redirect when David asked "what does continuing do for us?" — traced through the mechanics of the proposed prose-promotion phase and found 4 of 11 candidates already had memory files (duplication), 5 of 11 were operating-style (wrong home for DECISION_GATE.md), only 2 of 11 were genuine production-safety material. Captured as new memory `feedback_tech_rule_promotion_destination.md` (operating-style → memory file; production-safety → DECISION_GATE.md; already-memorialized → ✅ Promoted-via-memory). The honest recommendation became a sharper ~20-min next session shape that landed at session 88 close. Smallest→largest commit sequencing's 10th clean firing (favicon-set first as low-visibility metadata; wordmark swap second as visible system-wide change). **NOTE: at session 88 close, the wordmark height was bumped 30 → 40 per David's iPhone QA call ("take up the full height of the mast header"); the wordmark now fills the masthead's 40px inner grid.**

_(Session 87 detailed beat narrative removed at session 88 close — see [`feedback_tech_rule_promotion_destination.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_tech_rule_promotion_destination.md) for the canonical promotion-destination rule + [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md) for the canonical queue state.)_


## ✅ Session 86 (2026-04-29) — /my-shelf admin scroll-restore CLOSED in 1 fix commit after Safari Web Inspector via USB connected; Phase 3 fully shipped across all 3 surfaces; 5-session carry-forward retired (3 runtime commits + close, net -63 lines, rotated to mini-block session 87 close)

> Full block rotated out at session 87 close. Net: 3 runtime commits — Inspector connected via USB → Storage panel showed `treehouse_my_shelf_scroll = 0` (writes landing with wrong value) → 1 diagnostic commit (`788e5b5`, log stack trace on zero-writes) + 1 fix commit (`0c53fb3`, refuse-to-write-0 in `writeScrollY`) + 1 cleanup (`e311dce`, retire diagnostic infrastructure for net -85 lines). Bug was Next.js App Router scroll-to-top firing real scroll events on outbound navigation; the scroll listener wrote 0 to storage, clobbering the user's good scroll position. **Phase 3 scroll-restore now fully shipped across all 3 surfaces** (/flagged + /shelf/[slug] guest + /my-shelf admin). Full validation of session-85 meta-rule "cap speculative patching at 3 rounds + escalate to device-level visibility" — Inspector connected → root cause visible in Storage panel within seconds → fix shipped in ~30 min total. Memory file [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) extended with session-86 outcome + 2 setup-time snags. Two new single-firings: hypothesis-fix-same-commit-cycle (when confidence ≥80% from device visibility, ship diagnostic + fix together) + refuse-to-write-0 pattern (write-side filter on meaningless restore values). Three promotion-ready validations: TR-r cap-speculative-patching (2nd firing, full closure), TR-t structural-fix-less-code (2nd clean firing — 1 line of fix retired -85 lines of session-85 speculation), TR-m visibility-tools-first (3rd firing, 3 distinct bug classes).

_(Session 86 detailed beat narrative removed at session 87 close — see [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) for the canonical procedure + outcome, [`feedback_visibility_tools_first.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visibility_tools_first.md) for the meta-rule, [`feedback_kill_bug_class_after_3_patches.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_kill_bug_class_after_3_patches.md) for the structural-fix rule, and [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md) TR-r/TR-t/TR-af/TR-ag for the canonical Tech Rule entries.)_

<!-- Session 86 detailed narrative removed at session 87 close. The arcs (Inspector setup → Storage panel reveal → diagnostic + fix + cleanup commit cycle) are preserved in commit history `788e5b5` → `0c53fb3` → `e311dce` and in the memory files referenced above. -->

---

## ✅ Session 85 (2026-04-29) — Phase 3 scroll-restore re-attempt: 2-of-3 surfaces shipped end-to-end; /my-shelf admin path deferred to session 86 with Safari Web Inspector primitive (10 runtime commits + close, rotated to tombstone session 86 close)

> Full block rotated out at session 86 close. Net: 10 runtime commits — Phase 3 scroll-restore primitive applied to 3 surfaces; /flagged + /shelf/[slug] guest path shipped clean and confirmed via iPhone QA; /my-shelf admin path remained broken after 6 rounds of speculative patches across BFCache, router cache, dual-write storage, popstate, and useSearchParams reactivity. NEW memory `reference_ios_safari_web_inspector.md` capturing the new institutional debugging primitive — Web Inspector via USB cable. Three single-firings: "Match the visibility tool to the bug's layer" (2nd firing of feedback_visibility_tools_first.md), "Cap speculative patching at 3 rounds + escalate to device-level visibility", "Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling". Smallest→largest commit sequencing's 9th clean firing on the initial 3-commit run. **NOTE: at session 86 close, /my-shelf scroll-restore CLOSED in 1 fix commit after Inspector connected — full validation of the meta-rule. Session 85's structural patches stay in place as harmless defensive code.**

_(Session 85 detailed beat narrative removed at session 86 close — see [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md) + [`feedback_visibility_tools_first.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_visibility_tools_first.md) for the canonical procedure + outcome. The 6 rounds of speculative patches are preserved in git history — `2e9bae1` round 1 through `1c5e37a` round 7 — as audit trail of what doesn't work without device-level visibility.)_

---

## ✅ Session 84 (2026-04-29) — Security audit infrastructure shipped + `rls_disabled_in_public` exposure closed end-to-end across both Supabase projects (rotated to tombstone session 85 close)

> Full block rotated out at session 85 close. Net: 3 runtime commits — closed `rls_disabled_in_public` Security Advisor finding on `site_settings` + `events` for both Supabase projects via migration 014 (RLS on with policies); built reusable security audit infrastructure: 3 diagnostic scripts under [`scripts/security-audit/`](scripts/security-audit/) + `audit_rls_state()` SECURITY DEFINER RPC (migration 015) + [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) defining cadence + procedure + known gaps. Smallest→largest commit sequencing's 8th clean firing. David confirmed Security Advisor "Security" tab clean post-paste. **NOTE: at session 85 close, audit gap follow-ups (function search_path, role grants, auth.users exposure, OTP/password policy, per-route auth audit) still parked in [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md). Staging missing `events` table + Storage buckets — infrastructure divergence, not security.**

_(Session 84 detailed beat narrative removed at session 85 close — see [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) + the audit scripts for load-bearing decisions.)_

---


## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–87 still missing — operational backlog growing). Session 82 one-liner rotated off the visible tombstones list at session 88 close; session 83 mini-block rotated off the visible session-block area at session 88 close (consolidated into one-liner here). Visible window now sessions 84–88.

- **Session 87** (2026-04-29) — Tech Rule queue update reconciled (17 → 33 candidates registered, 11 🟢 promotion-ready) + brand asset overhaul end-to-end: full Treehouse Finds favicon + PWA icon set replacing Vercel default-N, masthead wordmark swap from session-80 TNR text to transparent-PNG logo system-wide. NEW memory `feedback_tech_rule_promotion_destination.md` (promotion-destination triage rule). Mid-arc honest-assessment redirect when David asked "what does continuing do for us?" — sharpened the next session shape from 11-rule prose-promote into 5 memory files + 2 DECISION_GATE.md prose entries + 4 ✅ Promoted-via-memory. Smallest→largest 10th clean firing. 3 runtime commits + close. **NOTE: at session 88 close, wordmark height bumped 30 → 40 per David's iPhone QA call (fills the masthead's 40px inner grid); the Tech Rule promotion shape executed end-to-end (queue: 0 🟢, 26 🟡 after 4 new firings).**
- **Session 86** (2026-04-29) — /my-shelf admin scroll-restore CLOSED in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected — Phase 3 scroll-restore now fully shipped end-to-end across all 3 surfaces (/flagged + /shelf/[slug] guest + /my-shelf admin), the 5-session carry-forward retired. Bug was Next.js App Router scroll-to-top firing real scroll events on outbound navigation; the scroll listener wrote 0 to storage, clobbering the user's good scroll position. Fix: write-side filter (`if (rounded <= 0) return`). 3 runtime commits + close, net -63 lines after diagnostic retirement. Full validation of session-85 meta-rule "cap speculative patching at 3 rounds + escalate to device-level visibility" — Inspector connected → root cause visible in Storage panel within seconds → fix shipped in ~30 min total. Two new single-firings: hypothesis-fix-same-commit-cycle + refuse-to-write-0 pattern. Three promotion-ready validations: TR-r cap-speculative-patching (2nd firing, full closure), TR-t structural-fix-less-code (2nd clean firing), TR-m visibility-tools-first (3rd firing across 3 distinct bug classes). **NOTE: at session 88 close, scroll-restore primitive extended to /find/[id] with pushState monkey-patch for nav-type detection (commit `01ff797`); Phase 3 + this iteration give the project a comprehensive scroll-restore vocabulary.**
- **Session 85** (2026-04-29) — Phase 3 scroll-restore re-attempt: /flagged + /shelf/[slug] guest path shipped clean and confirmed via iPhone QA; /my-shelf admin path remained broken after 6 rounds of speculative patches (timing → BFCache → router cache → dual-write storage → popstate → useSearchParams reactivity), deferred to session 86 with Safari Web Inspector via USB cable as new institutional debugging primitive (memory file [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md)). 10 runtime commits + close. Smallest→largest commit sequencing's 9th clean firing on the initial 3-commit run. Three new single-firings: "Match the visibility tool to the bug's layer" (2nd firing of feedback_visibility_tools_first.md), "Cap speculative patching at 3 rounds + escalate to device-level visibility", "Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling". **NOTE: at session 86 close, /my-shelf scroll-restore CLOSED in 1 fix commit + 1 cleanup after Inspector connected — full validation of the meta-rule. The 6 rounds of speculation are preserved in git history (`2e9bae1` through `1c5e37a`) as audit trail.**
- **Session 84** (2026-04-29) — First pure-security session since R12 Sentry (session 65). Triggered by Supabase Security Advisor `rls_disabled_in_public` email on `site_settings` + `events`. Closed exposure end-to-end across both Supabase projects via migration 014 (RLS on with policies matching existing access intent: site_settings public-read SELECT, events default-deny + service-role-only). Built reusable security audit infrastructure: 3 diagnostic scripts under [`scripts/security-audit/`](scripts/security-audit/) (inspect-rls + inspect-storage-acls + inspect-keys) + `audit_rls_state()` SECURITY DEFINER RPC (migration 015) + [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) defining cadence + procedure + known gaps (function search_path, role grants, auth.users exposure, OTP/password policy, per-route auth audit — all unbuilt, parked). 3 runtime commits, smallest→largest 8th clean firing — promotion-ready and overdue. David confirmed Security Advisor "Security" tab clean post-paste. **NOTE: at session 85 close, audit gap follow-ups still parked in the runbook; staging missing `events` table + Storage buckets — infrastructure divergence, not security.**
- **Session 83** (2026-04-28) — Postcard PoC explored + reverted (texture read as dust); pivoted to Polaroid evolved tile pattern shipped end-to-end across 4 surfaces (Home MasonryTile + /flagged FindTile + /shelf/[slug] WindowTile + ShelfTile): warm cream `#faf2e0` paper, 4px radius, 7px photo mat, dimensional dual-shadow; tile title+price as same-size centered Lora 14px group (matches /find/[id] hero pattern at scale); /find/[id] More-from-shelf strip got centering treatment WITHOUT polaroid wrapper per "browse vs navigate" rule + section eyebrow renamed "shelf" → "booth"; tile descender clearance lineHeight 1.4 (2nd firing of session 82's vendor-name fix). 10 runtime commits + 2 V1 mockups + 6+ in-session iPhone QA cycles. ONE new memory (`feedback_revert_to_clean_baseline_before_pivot.md`). Smallest→largest commit sequencing 7th clean firing. Three new single-firings: browse-vs-navigate-material-chrome rule + match-primary-page-typographic-pattern + lock-fixed-height-for-row-consistency. **NOTE: at session 84 close, paper.png remains in /public (2.7MB cleanup candidate); 3 inline "More from this shelf" comments on /find/[id] stay as documentation-rot cleanup; three near-identical polaroid wrappers across FindTile/WindowTile/ShelfTile/ShelfCard pending shared-primitive extraction trigger.**
_(Session 82 one-liner rotated off the visible tombstones list at session 88 close — was the IM Fell → Lora consolidation + BoothLockupCard primitive extraction + form-label sweep, 10 runtime commits, see commit history. Net visible window now sessions 83–87 in the tombstones list.)_
---

## CURRENT ISSUE
> Last updated: 2026-04-29 (session 88 close — Wordmark height bumped 30 → 40px filling masthead inner grid + Tech Rule promotion batch closed (11 🟢 → 0 + 4 new 🟡 candidates from session-88 firings) + multi-iteration animation/scroll arc that ended in **full motion strip on the ecosystem layer**. Home + /flagged + /find/[id] are now fully static motion-wise per David's "we'll revisit in a full session" call. Two compounding bug classes diagnosed during the arc: (a) image-load layout reflow on Home masonry tiles looks like animation (TR-aj) — fixed by locking tiles to 4:5 aspect; (b) framer-motion layoutId on multiple non-destination pages causes surprise cross-page morph (TR-ai) — eventually retired across the board with the total strip. Plus a popstate flag staleness bug fixed via pushState monkey-patch (TR-ah). NEW memory `feedback_total_strip_after_iterative_refinement_fails.md` capturing the meta-rule that the right answer after 3+ "still feels off" iterations is total-strip, not more sublayer refinement.)

**Working tree:** clean (after close commit). **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change this session:** 11 runtime commits + close. Wordmark wider on every masthead surface; Tech Rule queue stripped of 🟢s and now carries 26 🟡 first-firing candidates (4 new from this session); ecosystem layer motion is fully retired pending a future design session. New primary carry: **motion design needs a focused full session** (mockup-first per `docs/DECISION_GATE.md`, structural alternatives spanning real options, iPhone QA against real seeded content). Plus a verification-only follow-up: David's last iPhone QA on /find/[id] scroll restore was BEFORE the `01ff797` pushState monkey-patch landed; the "tap same find from Home twice" case needs an iPhone walk on the current state.

### 🚧 Recommended next session — Motion design revisit (~60–90 min)

The biggest follow-up. David explicitly said "we'll revisit this in a full session" after the total strip.

**Why now (over the alternatives):**
- The ecosystem layer is fully static. David has a clean baseline to react against.
- Multiple structural decisions need fresh thinking (NOT iteration on the stripped state): should the photo morph come back? Should section headers fade in or appear instantly? What about masonry layout — keep fixed 4:5 or move to real-aspect with stable layout via stored dimensions?
- Per `feedback_total_strip_after_iterative_refinement_fails.md`, the right way to revisit a totally-stripped feature is via a fresh design pass, not patch-iteration on the stripped state.

**Plan (in order):**

1. **🖐️ HITL — quick walk on the current state (~5 min).** David walks Home + /flagged + /find/[id] forward and back on iPhone. Confirms what feels right vs what's missed about the static state.
2. **Mockup pass (mockup-first per DECISION_GATE.md).** Three structural options:
   - **Option α — stay static** (current state — no animations beyond interactive feedback)
   - **Option β — minimal motion** (masthead-only entrance fade on cold-start; no per-tile or per-section motion)
   - **Option γ — full Track D revival** (photo + flag morph from Home tile → /find/[id] hero; ONLY for that direction — no /flagged morph, no entrance fades on sections)
3. **iPhone QA on each frame.** David picks one. Build spec written after approval. Ship.
4. **Side-quest: also tackle the masonry-layout question** (fixed 4:5 vs real-aspect-with-stored-dimensions). Likely a separate decision but bundle if time.

### Alternative next moves (top 4)

1. **iPhone QA verification of `01ff797` pushState monkey-patch** (~5 min). David's last QA on /find/[id] scroll was on the popstate-only flag. The "tap same find from Home twice" case — does it now correctly start at top? If yes, scroll restore arc is closed. If no, more diagnosis. ~5–15 min standalone.
2. **Audit gap follow-ups (security continuation from session 84)** — function `search_path` mutability, role-grant drift, `auth.users` exposure, OTP/password policy, per-route `/api/*` auth audit. ~30–60 min standalone or ~2 hrs bundled. Strongly justified now that real vendor data is flowing.
3. **Wordmark asset-weight optimization** (~15 min). 455KB transparent PNG. Optimize via `next/image` (preferred) or shrink with `pngquant`/`squoosh`. Trivial.
4. **Preview-cache audit** (~15 min). `treehouse_find_preview:${id}` sessionStorage usage is reduced now that the layoutId photo morph is gone. Possibly removable, possibly still useful for sync first-paint of the photograph. Audit + decide.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 89 opener (pre-filled — Motion design revisit)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Motion design revisit (~60–90 min). After session 88's total motion strip on the ecosystem layer (Home + /flagged + /find/[id]), the right next move is a fresh design pass — not patch-iteration on the stripped state, per feedback_total_strip_after_iterative_refinement_fails.md. (1) ~5 min iPhone QA walk on the current static state. (2) Mockup three structural options — α stay-static, β minimal-motion (masthead-only cold-start fade), γ full Track D revival (Home tile → /find/[id] photo+flag morph only, no /flagged or section motion). (3) iPhone QA each frame, pick one, build spec, ship. (4) Side-quest: masonry-layout question (fixed 4:5 vs real-aspect with stored image dimensions).

PROBLEMS THIS SESSION ALREADY SOLVED — don't accidentally revive: (a) cross-page layoutId match (TR-ai) caused surprise Home → /flagged photo morph — solution was to remove layoutId from /flagged; (b) image-load layout reflow on Home masonry (TR-aj) looked like animation — solution was fixed 4:5 aspect; (c) popstate-only flag goes stale on App Router same-route param navigation (TR-ah) — pushState monkey-patch is the canonical fix.

ALTERNATIVES IF DEFERRED: (1) iPhone QA verification of the pushState fix on /find/[id] scroll restore (~5–15 min). (2) Audit gap follow-ups (security continuation from session 84). (3) Wordmark asset-weight optimization (455KB PNG). (4) Preview-cache audit (treehouse_find_preview:id usage now reduced).

CARRY-FORWARDS FROM SESSIONS 78–88: Phase 3 scroll-restore CLOSED end-to-end (sessions 85+86 — /flagged + /shelf/[slug] guest + /my-shelf admin). /find/[id] scroll restore now branches on lastNavWasPopstate via pushState monkey-patch (forward Link tap = always top, browser back/forward = restore from saved). Capture-phase save in ShelfSection thumb wrapper defends against transition-time scroll clobber. Wordmark `public/wordmark.png` 40px filling the 40px masthead inner grid (auto-width ~75px from 1500:800). Home masonry locked to 4:5 aspect — no image-load reflow. /flagged FindTile layoutIds stripped — no cross-page morph. /find/[id] hero photo + flag layoutIds stripped — no Home → /find/[id] morph (Track D shared-element morph fully retired on the ecosystem layer). The framer-motion package stays installed but only `/decide` and `/post/edit/[id]` still use it for unrelated modal primitives. preview-cache pattern (treehouse_find_preview:${id}) stays as sync-first-paint helper but its load-bearing role is reduced. RLS enabled on every public table (migrations 014+015). BoothLockupCard shared primitive owns /shelves + /flagged. Polaroid evolved tile pattern owns /shelf/[slug] WindowTile + ShelfTile (Home tile uses similar polaroid framing). IM Fell COMPLETELY RETIRED (FONT_LORA token). Tech Rules queue: 0 🟢, 26 🟡 (4 new from session 88: TR-ah popstate-vs-pushState, TR-ai cross-page layoutId, TR-aj image-load-reflow + new memory `feedback_total_strip_after_iterative_refinement_fails.md`).
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle. Session 82 closed the largest design-system consolidation pass since the v1.x layer was named. Session 83 closed the polaroid evolved tile direction end-to-end. Session 84 was the first pure-security session since R12 Sentry. Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces. Session 86 closed the third — /my-shelf admin scroll-restore — in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected. Session 87 reconciled the Tech Rule queue (17 → 33 candidates) and shipped the brand asset overhaul (full PWA + favicon icon set + masthead wordmark swap to logo PNG). **Session 88 closed the Tech Rule promotion batch end-to-end (11 🟢 → 0, queue rebalanced) + bumped the wordmark height to fill the masthead inner grid + ran a 9-commit animation/scroll-restore arc that ended in David's call to "pull out all the animations and revisit in a full session" — ecosystem layer (Home + /flagged + /find/[id]) is now fully static motion-wise. The /find/[id] scroll-restore primitive landed correctly via pushState monkey-patch (TR-ah) but the entrance-animation question is parked for a focused future design session.** Smallest→largest commit sequencing now **11 firings** load-bearing across every David-redirect-bundle workflow, promoted-via-memory at session 88. **Next natural investor-update trigger point** is after the motion-design revisit session lands (a clean visual story to tell: "static baseline + intentional motion designed in the open via mockup-first pass") + Q-014 Metabase analytics + the security audit gap follow-ups — turns "data flowing + secure + scroll-restore-complete + brand-consistent + motion-as-feature deliberately designed" into the investor-ready surface area.
