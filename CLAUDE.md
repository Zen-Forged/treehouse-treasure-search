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

## ✅ Session 89 (2026-04-29) — Design intentionality pass — 9 runtime commits + close

Two-arc session focused on **design intentionality** and "highlighting the right elements + making them noticeable" per David's opener. The animation arcs from session 88 stayed parked. This session was 100% directive design work + a single mid-session iPhone QA round.

**Arc 1 — David's directive bundle (5 items + 1 add-on, 5 runtime commits).** All confirmed at session start: (1) masthead taller + logo larger + back/share bubbles bumped for older-shopper readability, (2) Flag → Leaf icon + revert to Save/Saved/Unsave terminology, (3) /vendor-request gets StickyMasthead + retitle "Set up your..." → "Create your...", (4) Booths nav hidden from guest users, (5) notification badge stripped of stroke + bumped 16 → 20. David added (6) mid-conversation: /login icon currently loads /logo.png (favicon); swap to match the masthead CircleUser sign-in glyph. Five sequential commits, smallest→largest (12th firing of that rule):

| # | Commit | Files | Items |
|---|---|---|---|
| 1 | `5718bbd` | components/BottomNav.tsx | 4 + 5 + 2-label |
| 2 | `a1c48a5` | app/login/page.tsx | 6 + 1-back-button |
| 3 | `788a562` | app/vendor-request/page.tsx | 3 + 1-back-button |
| 4 | `5ec0390` | components/FlagGlyph.tsx + app/page.tsx | 2 part 1 |
| 5 | `9496ef9` | StickyMasthead + ~13 ecosystem back-button surfaces + BookmarkBoothBubble + 2 MastheadPaperAirplane + flagged/find aria-label spillover | 1 + 2 part 2 |

**Arc 2 — iPhone QA follow-up (4 runtime commits).** David walked the Vercel preview after the directive bundle landed. Surfaced 7 follow-ups; all addressed in 4 more commits in the same session (13th firing of smallest→largest):

| # | Commit | Item(s) | Files |
|---|---|---|---|
| 1 | `028fe17` | #1 leaf weight bump (PiLeaf → PiLeafBold) | 1 |
| 2 | `819d4b4` | #3 + #4 BoothHero bookmark top-right → bottom-left + 36/18 → 44/22 | 2 |
| 3 | `4afef95` | #6 + #7 ShelfCard polaroid + strip paddingLeft 0 → 22 | 1 |
| 4 | `6d42e79` | #2 + #5 + Save copy scrub: /flagged masthead sign-in/sign-out, useScroll → 3-col grid, 6 user-facing strings | 1 |

**Final state in production after the 9 runtime commits:**

- ✅ **Masthead bubble system bump.** Wordmark 40 → 50px (auto-width ~94px from new tighter-cropped 1500×800 PNG), inner grid 40 → 50px, MASTHEAD_HEIGHT calc 53 → 63px (~10px taller). ~13 ecosystem back-button surfaces bumped 38→44 with ArrowLeft 18→22. Share-airplane bubbles bumped 38→44 with Send/MastheadPaperAirplane 18→22 on /find/[id] + /shelf/[slug] + /my-shelf. BookmarkBoothBubble masthead variant 38→44, hero variant 36→44, glyphs 18→22.
- ✅ **Flag → Leaf icon system-wide.** FlagGlyph.tsx now renders PiLeafBold (unsaved) or PiLeafFill (saved) from react-icons/pi. Internal identifier (component name `FlagGlyph`) preserved per user-facing-copy-scrub rule. Bold variant chosen to match Lucide Home strokeWidth 2.0 in the BottomNav row (iPhone QA #1).
- ✅ **Save/Saved/Unsave copy revert** across user-facing surfaces. BottomNav findsTab.label "Flagged" → "Saved". /flagged page strings: "No finds flagged yet" → "No finds saved yet"; "Tap the flag... add to your find map" → "Tap the leaf... save it here"; "X flagged finds" → "X saved finds"; scopeEyebrow `flagged ${findNoun} across` → `saved ${findNoun} across`; mall-filter empty/helper strings updated. aria-labels on Home + /flagged + /find/[id] all updated. **Internal identifiers preserved**: `/flagged` route, `treehouse_flagged_*` storage keys, `find_flagged`/`post_saved` event keys, `loadFlaggedIds`/`cachedFlaggedPosts` functions, `find_map_banner_image_url` DB key, BottomNav `active="flagged"` route key.
- ✅ **Guest BottomNav simplified** 3 tabs (Home + Booths + Saved) → 2 tabs (Home + Saved). Booths discovery still happens via feed → /shelf/[slug] for guests; admins/vendors retain Booths in 4-tab nav.
- ✅ **Notification badge** stripped of paper-warm 1.5px stroke + bumped 16→20px (font 9→11). Top/right offset -4 → -6 for clearer visual separation now that the badge is bigger.
- ✅ **/vendor-request** adopted StickyMasthead in form + DoneScreen states. Title "Set up your digital booth" → "Create your digital booth" (active framing).
- ✅ **/login icon** /logo.png → CircleUser glyph (matches the masthead's sign-in CTA on Home).
- ✅ **/flagged masthead** lifted Home's sign-in/sign-out pattern: `<CircleUser>` Link → /login when guest, "Sign out" text button when authed. Auth state via `getSession()` + `onAuthChange` mirrors the canonical Home pattern.
- ✅ **/flagged useScroll branch retired.** Single grid render; columns 1fr 1fr → repeat(3, 1fr) so finds visually pair with /my-shelf WindowView (3-col is canonical booth-page tile density).
- ✅ **BoothHero bookmark relocation.** Position top:8 right:8 → bottom:12 left:12 — diagonally opposite the booth post-it (bottom-right, +6deg) for visual balance. Only renders for shoppers on /shelf/[slug] (vendor can't bookmark own booth, so /my-shelf doesn't render this bubble).
- ✅ **/find/[id] More-from-this-booth strip** adopts the polaroid treatment that the rest of the find-tile family already uses: warm cream paper bg (#faf2e0), 4px radius, dual dimensional shadow, 7px photo mat top+sides, photo aspect 3/4 → 4/5. **Reverses session-83's "browse vs navigate / no polaroid on detail surfaces" rule** — David's call: cross-page consistency wins; the strip IS a browse surface, just embedded inside a detail page. Strip paddingLeft 0 → 22 so first card aligns with section header above (per-item marginLeft compensation dropped).

**Memory updates:**

- UPDATED: [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) firing count 11× → 13× (session 89 had two clean sequences: directive 5-commit + iPhone QA 4-commit, each ordered smallest→largest).
- UPDATED: [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md) firing count 3× → 4× (session 89 directive ship + mid-session iPhone QA + 4-commit follow-up = canonical example, would have been a 2-session arc without in-session QA).

**Existing memories that load-bore the session:**

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 9 runtime commits ✅.
- `feedback_user_facing_copy_scrub_skip_db_identifiers.md` — fired loadbearingly during the Save/Saved/Unsave sweep; internal identifiers preserved (route, storage keys, event keys, types, function names). 4th firing.
- `feedback_total_strip_after_iterative_refinement_fails.md` — DID NOT fire (no iteration arcs this session — all directive items shipped clean).

**Live discoveries / Tech Rule candidates:**

- **Phosphor icon weight calibration.** PiLeafBold ≈ Lucide strokeWidth 2.0 visual weight on a 21px icon. Codebase-specific note captured in FlagGlyph code comment. Single firing.
- **Sign-in/sign-out masthead pattern duplicated** across Home + /flagged. 2-surface trigger for primitive extraction. Operational backlog candidate; a 3rd surface adopting the pattern would force extraction.
- **Cross-page consistency overrides earlier "browse vs navigate" rule.** David reversed session-83's call to skip polaroid on /find/[id] strip. Takeaway: design rules emerging from a single design pass can be overridden by later cross-page consistency calls without ceremony — don't enforce them as inviolable. Single firing.
- **AspectRatio "3/4" was the lone outlier** on /find/[id] strip. Retired in favor of 4/5 (matches WindowTile/MasonryTile/FindTile/ShelfTile family). Single firing.

**Operational follow-ups:**

- **🟡 NEW PRIMARY: iPhone QA verification on Vercel preview.** All session-89 changes need a fresh on-device walk now that all 9 commits have landed. Shape: (1) wordmark 50px against the new tighter-cropped PNG across Home + /flagged + /find/[id] + /shelf/[slug] + /my-shelf + /vendor-request + /login; (2) guest BottomNav at 2 tabs (sign out + private window); (3) notification badge larger + no stroke; (4) leaf-icon Bold-weight saved vs unsaved on Home tile; (5) /vendor-request masthead — back button reaches home from form + DoneScreen; (6) BoothHero bookmark bottom-left on /shelf/[slug]; (7) /flagged 3-col grid density on real-content seeded posts (the 36×36 leaf bubble in tile corner may crowd at ~110px tile width); (8) /find/[id] More-from-this-booth strip — polaroid + new left padding alignment.
- **🟡 NEW: BoothHero pencil-vs-bookmark symmetry question.** David said "the saved icon and bookmark icon on the my-shelf page" but the BoothHero bookmark only renders on /shelf/[slug] (shopper view); /my-shelf shows only the pencil at top-left (vendor can't bookmark own booth). Awaiting clarification if pencil should ALSO move to bottom-left for symmetry.
- **🟡 NEW: Sign-in/sign-out masthead primitive extraction candidate.** Now duplicated on Home + /flagged. Borderline 2-surface trigger. If a 3rd surface adopts (likely /shelves), the extraction is the right next step.
- **🟡 NEW: /flagged tile density risk at 3-col on 390px-wide phone.** Each tile ~110px wide after page padding + gaps. WindowTile on /my-shelf runs the same dimensions and reads fine, but /flagged tiles carry a 36×36 save bubble in the corner that may crowd. If iPhone QA flags it: shrink bubble to 28×28 (1-line change) or drop /flagged grid back to 2-col (1-line change).
- 🟡 CARRY (from session 88): **motion design revisit in a focused future session** — David: "we'll revisit this in a full session." Ecosystem layer (Home + /flagged + /find/[id]) is fully static motion-wise. Mockup-first per `docs/DECISION_GATE.md`, structural alternatives spanning real options (no morph / minimal motion / full Track D revival), iPhone QA against real seeded content, ship one option.
- 🟡 CARRY (from session 88): iPhone QA verification of `01ff797` pushState monkey-patch on /find/[id] scroll restore — David's last QA was BEFORE the staleness fix shipped.
- 🟡 CARRY (from session 88): preview-cache role audit — `treehouse_find_preview:${id}` sessionStorage usage is reduced now that the layoutId photo morph is gone.
- 🟡 CARRY (from session 87): wordmark asset-weight optimization — public/wordmark.png is 455KB, optimization candidate.
- 🟡 CARRY (from session 87): docs/design-system.md wordmark spec stale.

**Commits this session (9 runtime + close):**

| Commit | Message |
|---|---|
| `5718bbd` | feat(nav): hide Booths from guest BottomNav + 'Saved' label + larger notification badge |
| `a1c48a5` | fix(login): swap favicon for CircleUser sign-in glyph + bump back-button |
| `788a562` | feat(vendor-request): add masthead + retitle 'Create your digital booth' |
| `5ec0390` | feat(save): swap FlagGlyph internals to PiLeaf + 'Save'/'Unsave' aria-label on Home |
| `9496ef9` | feat(masthead): bump wordmark + back/share bubbles for older-shopper readability |
| `028fe17` | fix(save): bump leaf glyph weight PiLeaf → PiLeafBold to match Home icon |
| `819d4b4` | feat(booth-hero): bookmark bubble bottom-left + size 36/18 → 44/22 |
| `4afef95` | feat(find-strip): polaroid treatment on ShelfCard + 22px left padding |
| `6d42e79` | feat(saved): masthead sign-in/sign-out + 3-col grid + Save copy scrub |
| (session close) | docs: session 89 close — design intentionality pass + iPhone QA round |

---

## ✅ Session 88 (2026-04-29) — Wordmark height bump + Tech Rule promotion batch (11 🟢 → 0) + multi-iteration motion strip arc — 11 runtime commits + close (rotated to mini-block session 89 close)

> Full block rotated out at session 89 close. Net: 11 runtime commits across 3 arcs. **Arc 1**: wordmark height 30 → 40px filling the 40px masthead inner grid. **Arc 2**: Tech Rule promotion batch closed via the new triage rule (`feedback_tech_rule_promotion_destination.md`) — 11 🟢 candidates resolved as 5 new operating-style memory files + 2 production-safety entries in DECISION_GATE.md + 4 marked ✅ Promoted-via-memory. Queue: 33 active / 11 🟢 → 22 active / 0 🟢. **Arc 3 (UNPLANNED, multi-iteration)**: /find/[id] scroll restore + entrance animation strip — 9 runtime commits across two compounding bug classes. Beats: scroll-restore v1 (`c4771b2`) → surgical fix v2 (`c4105bc`) → skip-entrance gate v1 (`0d84806`) → scroll-restore v2 with popstate (`222ba96`) → Nuke C entrance-motion strip preserving layoutIds (`ccd9ca2`) → David: "animations still firing" → diagnosed two missed sources (image-load reflow on Home masonry [TR-aj] + cross-page layoutId match [TR-ai]) → triple-fix C → B1 → A1 (`01ff797` pushState monkey-patch + `04d5886` /flagged layoutId strip + `0449d5a` Home masonry 4:5 lock) → David: "looks exactly the same" / "this is slowly getting worse" → **total motion strip on the ecosystem layer** (`b3e47df`) per David's call: "Lets just pull out all the animations for now and we'll revisit this in a full session." Ecosystem layer (Home + /flagged + /find/[id]) is now fully static motion-wise. NEW memory `feedback_total_strip_after_iterative_refinement_fails.md` captures the meta-rule: after 3+ "still feels off" iterations on a visual concern, surface "remove the entire feature class" as a positive design call. The total strip in 1 commit could have been the FIRST answer offered after iteration 2 instead of iteration 6.

_(Session 88 detailed beat narrative removed at session 89 close — see [`feedback_total_strip_after_iterative_refinement_fails.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_total_strip_after_iterative_refinement_fails.md) for the canonical meta-rule + [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) for sequencing firings + [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md) for TR-ah/ai/aj queue entries. Ecosystem layer fully static motion-wise; framer-motion still installed for /decide + /post/edit/[id] modal primitives.)_

---

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

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–88 still missing — operational backlog growing). Session 83 one-liner rotated off the visible tombstones list at session 89 close; session 87 mini-block rotated off the visible session-block area at session 89 close (its one-liner has been here since session 88 close). Visible window now sessions 84–88.

- **Session 88** (2026-04-29) — Wordmark height bump 30 → 40px filling the 40px masthead inner grid + Tech Rule promotion batch closed (11 🟢 → 0 + 4 new 🟡 candidates from this session's firings) + multi-iteration motion/scroll-restore arc (9 commits) that ended with David's "pull out all the animations and revisit in a full session" call — full motion strip on the ecosystem layer. NEW memory `feedback_total_strip_after_iterative_refinement_fails.md` (after 3+ "still feels off" iterations on a visual concern, surface "remove the entire feature class" as a positive design call). Two compounding bug classes diagnosed during the arc: image-load layout reflow on Home masonry (TR-aj) + cross-page layoutId match (TR-ai); plus a popstate flag staleness bug fixed via pushState monkey-patch (TR-ah). 11 runtime commits + close. **NOTE: at session 89 close, wordmark height bumped 40 → 50 to match the new masthead bubble system bump (older-shopper readability); FlagGlyph internals swapped to PiLeaf (Bold weight); Save/Saved/Unsave terminology reverted; ecosystem layer remains fully static motion-wise pending the parked motion design revisit session.**
- **Session 87** (2026-04-29) — Tech Rule queue update reconciled (17 → 33 candidates registered, 11 🟢 promotion-ready) + brand asset overhaul end-to-end: full Treehouse Finds favicon + PWA icon set replacing Vercel default-N, masthead wordmark swap from session-80 TNR text to transparent-PNG logo system-wide. NEW memory `feedback_tech_rule_promotion_destination.md` (promotion-destination triage rule). Mid-arc honest-assessment redirect when David asked "what does continuing do for us?" — sharpened the next session shape from 11-rule prose-promote into 5 memory files + 2 DECISION_GATE.md prose entries + 4 ✅ Promoted-via-memory. Smallest→largest 10th clean firing. 3 runtime commits + close. **NOTE: at session 88 close, wordmark height bumped 30 → 40 (filled the 40px masthead inner grid); at session 89 close, the wordmark image height bumped again 40 → 50 as part of the masthead bubble system bump.**
- **Session 86** (2026-04-29) — /my-shelf admin scroll-restore CLOSED in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected — Phase 3 scroll-restore now fully shipped end-to-end across all 3 surfaces (/flagged + /shelf/[slug] guest + /my-shelf admin), the 5-session carry-forward retired. Bug was Next.js App Router scroll-to-top firing real scroll events on outbound navigation; the scroll listener wrote 0 to storage, clobbering the user's good scroll position. Fix: write-side filter (`if (rounded <= 0) return`). 3 runtime commits + close, net -63 lines after diagnostic retirement. Full validation of session-85 meta-rule "cap speculative patching at 3 rounds + escalate to device-level visibility" — Inspector connected → root cause visible in Storage panel within seconds → fix shipped in ~30 min total. Two new single-firings: hypothesis-fix-same-commit-cycle + refuse-to-write-0 pattern. Three promotion-ready validations: TR-r cap-speculative-patching (2nd firing, full closure), TR-t structural-fix-less-code (2nd clean firing), TR-m visibility-tools-first (3rd firing across 3 distinct bug classes). **NOTE: at session 88 close, scroll-restore primitive extended to /find/[id] with pushState monkey-patch for nav-type detection (commit `01ff797`); Phase 3 + this iteration give the project a comprehensive scroll-restore vocabulary.**
- **Session 85** (2026-04-29) — Phase 3 scroll-restore re-attempt: /flagged + /shelf/[slug] guest path shipped clean and confirmed via iPhone QA; /my-shelf admin path remained broken after 6 rounds of speculative patches (timing → BFCache → router cache → dual-write storage → popstate → useSearchParams reactivity), deferred to session 86 with Safari Web Inspector via USB cable as new institutional debugging primitive (memory file [`reference_ios_safari_web_inspector.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/reference_ios_safari_web_inspector.md)). 10 runtime commits + close. Smallest→largest commit sequencing's 9th clean firing on the initial 3-commit run. Three new single-firings: "Match the visibility tool to the bug's layer" (2nd firing of feedback_visibility_tools_first.md), "Cap speculative patching at 3 rounds + escalate to device-level visibility", "Storage-layer bugs on iOS PWA are below the on-screen-diagnostic ceiling". **NOTE: at session 86 close, /my-shelf scroll-restore CLOSED in 1 fix commit + 1 cleanup after Inspector connected — full validation of the meta-rule. The 6 rounds of speculation are preserved in git history (`2e9bae1` through `1c5e37a`) as audit trail.**
- **Session 84** (2026-04-29) — First pure-security session since R12 Sentry (session 65). Triggered by Supabase Security Advisor `rls_disabled_in_public` email on `site_settings` + `events`. Closed exposure end-to-end across both Supabase projects via migration 014 (RLS on with policies matching existing access intent: site_settings public-read SELECT, events default-deny + service-role-only). Built reusable security audit infrastructure: 3 diagnostic scripts under [`scripts/security-audit/`](scripts/security-audit/) (inspect-rls + inspect-storage-acls + inspect-keys) + `audit_rls_state()` SECURITY DEFINER RPC (migration 015) + [`docs/security-audit-runbook.md`](docs/security-audit-runbook.md) defining cadence + procedure + known gaps (function search_path, role grants, auth.users exposure, OTP/password policy, per-route auth audit — all unbuilt, parked). 3 runtime commits, smallest→largest 8th clean firing — promotion-ready and overdue. David confirmed Security Advisor "Security" tab clean post-paste. **NOTE: at session 85 close, audit gap follow-ups still parked in the runbook; staging missing `events` table + Storage buckets — infrastructure divergence, not security.**
_(Session 83 one-liner rotated off the visible tombstones list at session 89 close — was Postcard PoC explored + reverted, then Polaroid evolved tile pattern shipped end-to-end across 4 surfaces, 10 runtime commits. Note: at session 89 close, the polaroid pattern was extended to /find/[id]'s "More from this booth" strip — David reversed session-83's "browse vs navigate / no polaroid on detail surfaces" call when iPhone QA #6 surfaced it as the lone outlier in the find-tile family. Net visible window now sessions 84–88 in the tombstones list.)_
---

## CURRENT ISSUE
> Last updated: 2026-04-29 (session 89 close — Design intentionality pass: 9 runtime commits across two arcs (5-commit directive bundle + 4-commit iPhone QA follow-up). **Masthead bubble system bump** (wordmark 40→50, ~13 ecosystem back buttons 38→44, share airplanes + masthead bookmark variants 18→22). **Flag → Leaf glyph** system-wide (FlagGlyph internals → PiLeafBold/PiLeafFill from react-icons/pi; component name preserved, internal identifiers preserved). **Save/Saved/Unsave terminology revert** (BottomNav "Flagged" → "Saved", aria-labels + 6 user-facing strings on /flagged). **Guest BottomNav simplified** 3 tabs → 2 (Booths hidden from guests). **Notification badge** stripped of stroke + bumped 16→20. **/vendor-request** adopted StickyMasthead + retitled "Create your digital booth". **/login** favicon → CircleUser. **/flagged useScroll branch retired** + 2-col → 3-col grid + Home's sign-in/sign-out pattern lifted to masthead right slot. **BoothHero bookmark** top-right → bottom-left + 36/18 → 44/22 (only renders for shoppers on /shelf/[slug]). **/find/[id] More-from-this-booth strip** adopts polaroid (reverses session-83's "browse vs navigate / no polaroid" rule per David's cross-page consistency call) + paddingLeft 0→22. Smallest→largest fired 12th + 13th times.)

**Working tree:** clean (after close commit). **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **Net change this session:** 9 runtime commits + close. Masthead system is bigger and more legible (older-shopper readability brief satisfied); save vocabulary unified to leaf+Save/Saved/Unsave; /flagged is now 3-col grid (matches /my-shelf WindowView). New primary carry: **iPhone QA verification on Vercel preview** — all 9 commits landed but post-Arc-2 multi-surface walk hasn't happened yet. Plus the still-pending **motion design revisit** session that David parked from session 88.

### 🚧 Recommended next session — iPhone QA verification + motion design revisit (~60–90 min)

Two-part shape. The QA verification is short (~10 min) and unblocks confidence in the session-89 ship; the motion design revisit is the larger ongoing carry from session 88.

**Why this shape (over the alternatives):**
- Session-89 changes touch nearly every primary surface (masthead system, save vocabulary, /flagged layout, /vendor-request, /login, /find/[id] strip, BoothHero). David QA'd Arc 1 mid-session but the Arc 2 4-commit follow-up is unverified on iPhone.
- The motion design revisit is the largest unresolved carry — David explicitly parked it after session 88's total-strip call.
- Bundling QA verification first means any concrete issues surfaced get fixed before motion design overlay work begins; cleaner baseline for the design pass.

**Plan (in order):**

1. **🖐️ HITL — iPhone QA walk (~10 min).** Walk Home + /flagged (3-col, masthead sign-in/sign-out) + /find/[id] (More-from-this-booth polaroid + padding) + /shelf/[slug] (BoothHero bookmark bottom-left) + /my-shelf + /vendor-request + /login. Specific watch-items: wordmark 50px against the new tighter PNG; guest BottomNav at 2 tabs in private window; notification badge larger + no stroke; leaf icon Bold-weight saved vs unsaved state; /flagged tile density at 3-col on real-content (the 36×36 leaf bubble may crowd at ~110px tile width).
2. **Address concrete issues from #1.** Fix any visual regressions or things that read off. Likely 0–3 small commits.
3. **Motion design revisit (mockup-first per DECISION_GATE.md).** Three structural options — α stay-static, β minimal-motion (masthead-only cold-start fade), γ full Track D revival (Home tile → /find/[id] photo+flag morph only). iPhone QA each frame, pick one, build spec, ship.
4. **Side-quest: BoothHero pencil-vs-bookmark symmetry** — David's "saved icon and bookmark icon on my-shelf" framing in the iPhone QA round; the bookmark bubble only renders on /shelf/[slug] (not /my-shelf). Confirm whether David also wants the pencil bubble moved to bottom-left for symmetry on /my-shelf.

### Alternative next moves (top 4)

1. **Audit gap follow-ups (security continuation from session 84)** — function `search_path` mutability, role-grant drift, `auth.users` exposure, OTP/password policy, per-route `/api/*` auth audit. ~30–60 min standalone or ~2 hrs bundled. Strongly justified now that real vendor data is flowing.
2. **Sign-in/sign-out masthead primitive extraction** (~30 min). Now duplicated on Home + /flagged. Borderline 2-surface trigger; if a 3rd surface is about to adopt, extract first.
3. **Wordmark asset-weight optimization** (~15 min). 455KB transparent PNG; trivial via `next/image` (preferred) or `pngquant`/`squoosh`.
4. **Preview-cache audit** (~15 min). `treehouse_find_preview:${id}` sessionStorage usage is reduced now that the layoutId photo morph is gone — audit + decide whether to keep or retire.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 90 opener (pre-filled — iPhone QA verification + motion design revisit)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: iPhone QA verification of session-89 ship + motion design revisit (~60–90 min). Session 89 shipped 9 commits across masthead bubble system bump + Flag→Leaf glyph + Save/Saved/Unsave copy + guest BottomNav simplified + /vendor-request masthead + /login icon + /flagged grid + BoothHero bookmark relocation + /find/[id] strip polaroid. Arc 2 (iPhone QA follow-up) shipped 4 more commits but the post-Arc-2 device walk hasn't happened. (1) iPhone QA walk across all primary surfaces. (2) Address concrete issues. (3) Motion design revisit per session-88 carry — mockup three structural options (α stay-static / β minimal-motion / γ full Track D revival), iPhone QA, pick, ship.

PROBLEMS SESSION 89 ALREADY SOLVED — don't accidentally revive: (a) /flagged useScroll branch was visually broken at "carousel touches screen edge" — retired in favor of always-grid, do NOT reintroduce horizontal scroll; (b) FlagGlyph weight was too thin against Lucide Home 2.0 strokeWidth — PiLeafBold is the canonical match; (c) BoothHero bookmark at top-right competed with photograph focal point — bottom-left is the canonical position; (d) "Set up your" → "Create your" framing landed on /vendor-request, do NOT rename back; (e) guest BottomNav at 2 tabs is intentional (Booths is admin/vendor-only).

ALTERNATIVES IF DEFERRED: (1) Audit gap follow-ups (security continuation from session 84). (2) Sign-in/sign-out masthead primitive extraction. (3) Wordmark asset-weight optimization (455KB PNG). (4) Preview-cache audit.

CARRY-FORWARDS FROM SESSIONS 78–89: Phase 3 scroll-restore CLOSED end-to-end (sessions 85+86 — /flagged + /shelf/[slug] guest + /my-shelf admin). /find/[id] scroll restore branches on lastNavWasPopstate via pushState monkey-patch (forward Link tap = always top, browser back/forward = restore from saved). Wordmark `public/wordmark.png` 50px (was 40 at session 88, 30 at session 87). ~13 ecosystem back-button surfaces 44px with ArrowLeft 22. Share airplanes 22px on /find/[id] + /shelf/[slug] + /my-shelf. Notification badge 20px no-stroke. BoothHero bookmark bottom-left at 44/22. /flagged is 3-col grid (no horizontal scroll). FlagGlyph renders PiLeafBold/PiLeafFill (Phosphor leaf icon, react-icons/pi). Save/Saved/Unsave is the canonical user-facing terminology (internal identifiers — /flagged route, treehouse_flagged_* storage keys, find_flagged event keys, FlagGlyph component, loadFlaggedIds — preserved). /vendor-request title "Create your digital booth", uses StickyMasthead. Guest BottomNav 2 tabs (Home + Saved). Sign-in/sign-out masthead pattern duplicated Home + /flagged (primitive extraction candidate). Home masonry locked to 4:5 aspect. /flagged FindTile layoutIds stripped. /find/[id] hero photo + flag layoutIds stripped (Track D shared-element morph fully retired on ecosystem layer). framer-motion still installed for /decide + /post/edit/[id]. preview-cache pattern (treehouse_find_preview:${id}) stays as sync-first-paint helper. RLS enabled on every public table (migrations 014+015). BoothLockupCard owns /shelves + /flagged. Polaroid evolved tile pattern owns /shelf/[slug] WindowTile + ShelfTile + Home masonry tile + /flagged FindTile + /find/[id] ShelfCard (added at session 89). IM Fell COMPLETELY RETIRED (FONT_LORA token). Tech Rules queue: 0 🟢, 26 🟡 (4 new from session 88: TR-ah/ai/aj + total-strip memory; session 89 added single-firings on Phosphor weight calibration, masthead-pattern primitive trigger, cross-page-consistency-overrides-earlier-rule, but all single-firings stay outside the queue per rule).
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
- **NEW PRIMARY (session 89): iPhone QA verification of session-89 ship.** All 9 commits landed but post-Arc-2 multi-surface walk hasn't happened yet. Touch-points: wordmark 50px against the new tighter PNG, ~13 ecosystem back-button surfaces at 44/22, share airplanes at 22, BoothHero bookmark bottom-left on /shelf/[slug], guest BottomNav at 2 tabs, notification badge 20/no-stroke, leaf icon Bold-weight saved vs unsaved, /vendor-request masthead, /flagged 3-col density, /find/[id] More-from-this-booth polaroid + padding. ~10 min standalone.
- **NEW (session 89): BoothHero pencil-vs-bookmark symmetry question.** David said "the saved icon and bookmark icon on the my-shelf page" but the BoothHero bookmark only renders on /shelf/[slug] (shopper view); /my-shelf shows only the pencil at top-left (vendor can't bookmark own booth). Awaiting clarification if pencil should ALSO move to bottom-left for symmetry, or if the canonical behavior is "owner sees pencil top-left + no bookmark / shopper sees bookmark bottom-left + no pencil." Single firing.
- **NEW (session 89): Sign-in/sign-out masthead primitive extraction candidate.** Now duplicated on Home + /flagged. 2-surface trigger for primitive extraction. If a 3rd surface is about to adopt (likely /shelves), the extraction is the right next step. ~30 min if pulled.
- **NEW (session 89): /flagged tile density risk at 3-col on 390px-wide phone.** Each tile ~110px wide after page padding + gaps. WindowTile on /my-shelf runs the same dimensions and reads fine, but /flagged tiles carry a 36×36 save bubble in the corner that may crowd. If iPhone QA flags it: shrink bubble to 28×28 (1-line change) or drop /flagged grid back to 2-col (1-line change).
- **NEW (session 89): Phosphor icon weight calibration.** PiLeafBold ≈ Lucide strokeWidth 2.0 visual weight on a 21px icon. Codebase-specific note captured in FlagGlyph code comment. Single firing — if a 2nd Phosphor icon needs Lucide-weight matching, the calibration becomes a system rule.
- **NEW (session 89): "Cross-page consistency overrides earlier 'browse vs navigate' rule."** David reversed session-83's call to skip polaroid on /find/[id] strip. Takeaway: design rules emerging from a single design pass can be overridden by later cross-page consistency calls without ceremony. Single firing.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle. Session 82 closed the largest design-system consolidation pass since the v1.x layer was named. Session 83 closed the polaroid evolved tile direction end-to-end. Session 84 was the first pure-security session since R12 Sentry. Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces. Session 86 closed the third — /my-shelf admin scroll-restore — in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected. Session 87 reconciled the Tech Rule queue (17 → 33 candidates) and shipped the brand asset overhaul (full PWA + favicon icon set + masthead wordmark swap to logo PNG). Session 88 closed the Tech Rule promotion batch end-to-end (11 🟢 → 0, queue rebalanced) + bumped the wordmark height to fill the masthead inner grid + ran a 9-commit animation/scroll-restore arc that ended in David's "pull out all the animations" call — ecosystem layer fully static motion-wise. **Session 89 was a design intentionality pass — 9 runtime commits across two arcs (5-commit directive bundle + 4-commit iPhone QA follow-up). The masthead bubble system bumped (older-shopper readability), Flag → Leaf glyph swept system-wide via FlagGlyph internals (PiLeafBold/PiLeafFill), Save/Saved/Unsave terminology reverted across user-facing surfaces while internal identifiers preserved, guest BottomNav simplified 3→2 tabs, /vendor-request adopted StickyMasthead + retitled "Create your digital booth", /flagged useScroll branch retired in favor of always-3-col grid + masthead lifted Home's sign-in/sign-out pattern, BoothHero bookmark moved to bottom-left, and /find/[id] More-from-this-booth strip adopted polaroid (David reversed session-83's "browse vs navigate" rule per cross-page consistency).** Smallest→largest commit sequencing now **13 firings** load-bearing across every David-redirect-bundle workflow, promoted-via-memory at session 88. **Next natural investor-update trigger point** is after the motion-design revisit session lands (a clean visual story to tell: "static baseline + intentional motion designed in the open via mockup-first pass") + Q-014 Metabase analytics + the security audit gap follow-ups — turns "data flowing + secure + scroll-restore-complete + brand-consistent + design-system-coherent + motion-as-feature deliberately designed" into the investor-ready surface area.
