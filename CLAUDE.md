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

## ⚠️ Session 79 (2026-04-28) — Track D extension attempt: 12 commits shipped + reverted (Option A full revert)

Session 79 attempted to extend session 78's Track D shared-element transition pattern to three additional surfaces — `/find/[id]`'s "More from this shelf" strip (Phase 1), BoothPage `WindowTile`/`ShelfTile` on `/my-shelf` + `/shelf/[slug]` (Phase 2), and back-nav scroll-restore on `/flagged` + `/my-shelf` + `/shelf/[slug]` (Phase 3a + 3b). After four rounds of iPhone-QA cycles surfaced compounding issues that I couldn't diagnose remotely, David elected the clean revert path. **Production state is now identical to session 78 close (`4bcefeb`); the only artifact in main from session 79 is the revert commit `a9dc1bd` itself.**

The session's value is in what it taught about the limits of framer-motion's `layoutId` API as used in Treehouse's ecosystem. Captured below in case future sessions revisit.

**Beat 1 — Phase 1 + 2 + 3 baseline rollout (4 commits, smallest→largest sequencing).** Per the now-promotion-ready Tech Rule, sequenced as:

| Commit | Scope |
|---|---|
| `058f840` | feat(transitions): /find/[id] More-from-shelf shared-element morph (ShelfCard layoutId + preview cache) |
| `27f0fc4` | feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph |
| `71a0555` | feat(transitions): /flagged scroll-restore on back-nav from /find/[id] |
| `51067b7` | feat(transitions): /my-shelf + /shelf/[slug] scroll-restore + post cache |

**Beat 2 — R1 (b5d6925): drop entrance animations on the new surfaces.** First iPhone test: David reported "very disjointed and the tiles keep animating, not just the selected image." Diagnosed as `<motion.div initial={{opacity:0,scale:0.97}} animate={...}>` per-tile entrance fade re-firing on every page mount — same fix pattern as session 78 home feed (`skipTileEntrance=true`). Dropped on 5 BoothPage tile types + the `/find/[id]` More-from-shelf section wrapper.

**Beat 3 — David's screenshot revealed the deeper bug: scattered tiles mid-flight on home back-nav.** This was NOT entrance animations — it was **cross-page layoutId namespace collision**. Phase 1's ShelfCards on `/find/[X]` carried layoutIds `find-Y`, `find-Z`, etc. (other vendor posts). When user navigated back to home, those layoutIds matched home tiles' layoutIds, and framer-motion connected EVERY tile across pages, animating each from its `/find` More-from-shelf rect to its home masonry rect.

**Beat 4 — Reverts of Phase 1 + Phase 2 + R1 (commits `5084787` + `83fe01e` + `7db02c4`).** Cleanly removed the cross-page collisions. Production back to "session 78 + Phase 3 scroll restore." David tested and confirmed the scattered-tiles bug was gone — but reported a NEW issue: tiles still animating in on every page load on home, /shelf, /find. **This was a session-78 latent bug, not introduced by my changes:** when scroll position differs between home unmount (at `Y_saved`) and remount (at `0` before scroll-restore fires in a useEffect), framer-motion's `useLayoutEffect`-time rect measurement sees a `Y_saved`-pixel difference and animates every layoutId tile from "above current" to "current." Not visible at session 78 close because David was tapping near top of scroll.

**Beat 5 — R2 (`a7dfd14`): conditional layoutId via module-scope `lastTappedPostId`.** Created `lib/morphTracker.ts` with `getLastTappedPostId()`/`setLastTappedPostId()`. Tile render uses `layoutId={isMorphTile ? \`find-${id}\` : undefined}`. Only the tapped tile carries layoutId; framer can't connect what isn't there. Also dropped entrance animations on BoothPage tiles for the same reason as R1 (correct fix, just not enough). Plus scheduled clear after 500ms on source page mount.

**Beat 6 — David: "first click no morph; second click works."** Diagnosed as React batching: setting a module-scope variable doesn't trigger React to re-render. The source tile rendered without layoutId before the tap, the tap set the variable, navigation began, but React never re-rendered the tile in time. On the second click the tile retained its layoutId from the prior back-morph render — that's why it worked.

**Beat 7 — R3 (`09d6fef`): refactor morphTracker to `useSyncExternalStore`.** Reactive store: setting now emits to subscribers, every tile re-renders with new value. Also made `layout="position"` conditional alongside `layoutId` (without the gate, framer-motion's per-mount layout tracking animated flag bubbles whenever the page chrome shifted during data load). David reported flags now stable but forward morph still missing on first click.

**Beat 8 — R4 (`7421a43`): wrap `setLastTappedPostId` in `flushSync`.** Forces React to commit the state update synchronously inside the click handler before Link's navigation fires. **Still didn't fix it.** This was the moment to call the question per `feedback_kill_bug_class_after_3_patches.md` — three deploy-and-verify cycles had failed at progressively deeper layers (module variable → reactive store → synchronous flush). I patched once more anyway.

**Beat 9 — R5 (`7870a39`): defer navigation by one `requestAnimationFrame`.** Hypothesis: framer-motion's projection system measures rects after a browser paint, and Next.js Link's navigation is fast enough to unmount the source before that paint completes. preventDefault Link's default + flushSync the state update + `requestAnimationFrame(() => router.push(...))`. **Still missed.** This is the wall I couldn't get past on remote-only iPhone debugging.

**Beat 10 — Option A: full revert to session 78 close (`a9dc1bd`).** David picked the offered revert. Single commit using `git rm lib/morphTracker.ts && git checkout 4bcefeb -- .`. Six files restored, one file deleted. Working tree exactly matches `4bcefeb`. Vercel redeploys to that state.

**Final state in production (as of `a9dc1bd`):**

- Identical to session 78 close. Every shipped surface behaves exactly as it did when David approved session 78.
- 12 commits in the session, but the net diff vs. `4bcefeb` is zero. One revert commit landed; everything else is in the audit trail.
- `/my-shelf` back-nav scroll anchor (the session's primary user ask) remains unfilled.

**Commits this session (12 runtime + 1 close):**

| Commit | Message |
|---|---|
| `058f840` | feat(transitions): /find/[id] More-from-shelf shared-element morph (Phase 1) |
| `27f0fc4` | feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph (Phase 2) |
| `71a0555` | feat(transitions): /flagged scroll-restore on back-nav (Phase 3a) |
| `51067b7` | feat(transitions): /my-shelf + /shelf/[slug] scroll-restore + post cache (Phase 3b) |
| `b5d6925` | fix(transitions): drop tile entrance animations across new surfaces (R1) |
| `7db02c4` | Revert "fix(transitions): drop tile entrance animations across new surfaces (R1)" |
| `83fe01e` | Revert "feat(transitions): BoothPage WindowTile + ShelfTile shared-element morph" |
| `5084787` | Revert "feat(transitions): /find/[id] More-from-shelf shared-element morph" |
| `a7dfd14` | fix(transitions): conditional layoutId + drop BoothPage tile entrance (R2) |
| `09d6fef` | fix(transitions): reactive morph tracker + conditional layout prop (R3) |
| `7421a43` | fix(transitions): flushSync the morph tracker update before navigation (R4) |
| `7870a39` | fix(transitions): defer navigation by one frame so framer captures source rect (R5) |
| `a9dc1bd` ✅ | revert: roll all session 79 changes back to session 78 close (Option A) |

**What this session taught (for the future session that picks this up):**

- **`layoutId` is a global namespace.** ANY pair of `<motion.div>` elements anywhere in the app that share the same `layoutId` will be connected by framer-motion across mount/unmount transitions. Adding new surfaces that share `find-${post.id}` with existing surfaces (home, /flagged) creates cross-page collisions that produce scattered-tile animations on lateral and back-nav. **The session 78 Track D pattern doesn't extend by simply adding more `motion.div`s with `find-${id}`.**

- **Conditional `layoutId` via reactive store CAN solve the namespace collision** but introduces a render-timing fight against React batching + framer-motion's `useLayoutEffect`/projection system + Next.js App Router's Link navigation. R3 + R4 + R5 (reactive store + flushSync + rAF defer) all attempted to make the source tile commit its layoutId to the DOM before unmount. None reliably worked on iPhone in production. There may be a fix possible but it requires on-device debugging I couldn't do remotely.

- **Scroll position mismatch across mount/unmount IS a session-78 latent bug**. Home tiles slide on every back-nav from `/find/[id]` because framer measures rects relative to viewport and viewport-relative position differs when scroll restore fires in a useEffect (after framer's `useLayoutEffect`-time measurement). David was tapping near top of scroll at session 78 close so the difference was small enough to read as "instant snap." With deeper testing this session he started noticing it as "thumbnails animating in." Not introduced by session 79; surfaced by session 79.

- **The scroll-restore work (Phase 3a + 3b) was independent of the morph work and shipped cleanly on its own.** It would have landed the user's primary ask (`/my-shelf` back-nav anchor) without any of the iPhone-QA pain. **Worth re-applying in a focused future session WITHOUT any morph changes.** Module-scope cache + sessionStorage scroll keys are well-tested patterns from session 78's home feed.

- **Use the `/transition-test` testbed for surface extensions, not just initial primitive validation.** Session 77 built `/transition-test` and `feedback_testbed_first_for_ai_unknowns.md` codified the lesson for AI/LLM unknowns. The testbed pattern applies equally to extending an EXISTING shipped primitive to new surfaces — extension introduces NEW cross-surface interactions that haven't been tested. If I'd built a multi-tile-page testbed (two pages with shared `find-${id}` tiles, navigate between them) before touching `/find/[id]/page.tsx`, I would have hit the cross-page collision in the testbed and pivoted before any production code changed.

**Memory updates:** ONE new memory.

- `feedback_extend_existing_primitive_via_testbed.md` — when extending a shipped visual primitive to new surfaces (not just first-time validation), use the existing testbed FIRST to model the cross-surface interaction. Extension introduces new namespace collisions, new timing interactions, new lateral-nav paths that weren't covered by the original primitive's validation. Session 77's `/transition-test` would have caught session 79's cross-page layoutId collision in minutes. Going straight to production cost 12 commits + revert.

Existing memories that should have load-bore the session but didn't fire when they should have:

- `feedback_kill_bug_class_after_3_patches.md` (session 77) — should have fired at R3, definitely by R4. R3 → R4 → R5 was three deploy-and-verify cycles patching the same bug class (source tile not committing layoutId in time). Instead of structural revert at R4, I patched once more at R5. **Lesson re-firing for second time.** Now load-bearing across two sessions; should be promotion-ready as a Tech Rule.

- `feedback_visibility_tools_first.md` (session 78 carry) — should have fired around R3. With repeated remote-iPhone-debug cycles failing, the right move was to build a diagnostic primitive (e.g., a debug overlay that logs layoutId registration timestamps relative to navigation events) before iterating further fix attempts. Did not.

- `feedback_testbed_first_for_ai_unknowns.md` (session 65) — should have fired at session 79 OPENING. Track D extension to new surfaces is exactly the kind of "is the integration shape correct" question the testbed was built for. Did not fire because the rule was framed for AI/LLM unknowns specifically; the new memory below generalizes it.

- `feedback_treehouse_no_coauthored_footer.md` — applied to all 13 commits in this session ✓.

**Live discoveries (single firings, Tech Rule candidates):**

- **framer-motion `layoutId` is a global namespace; cross-page connections fire for ANY pair of motion.divs sharing the same id.** First firing.
- **Conditional `layoutId` via reactive store fights React batching + framer projection + Next.js Link timing.** First firing (and possibly an unfixable interaction without on-device debugging).
- **Scroll position mismatch between unmount and remount triggers layoutId animations on every tile.** First firing (latent in session 78, surfaced in session 79).
- **After 3 deploy-and-verify cycles fail on remote-only iPhone debugging, offer a clean revert path explicitly rather than iterating further.** First firing (variant of `feedback_kill_bug_class_after_3_patches.md` — adds the "remote debug" qualifier).

**Operational follow-ups:**
- No new operational backlog from session 79 (the revert closed all in-flight items).
- Session 78 carry-forwards still all hold (preview cache pattern, `<motion.div role="button">` for nested buttons, `layout="position"` + explicit dimensions, sibling-not-child layoutIds, D11+D12 runtime overrides).
- **NEW: scroll-restore work for /my-shelf + /shelf/[slug] + /flagged** — re-attempt in a focused session WITHOUT morph changes. The Phase 3a + 3b code is in git history (commits `71a0555` + `51067b7`); could be cherry-picked or re-implemented from the pattern.

**Tech Rule candidates (this session):**

- "framer-motion layoutId is global namespace" — first firing. Diagnostic rule.
- "Conditional layoutId is fundamentally fragile" — first firing.
- "Use existing testbed for surface extensions, not just initial primitive validation" — first firing. NEW memory.
- "After 3 remote-debug cycles, offer revert path" — first firing. Variant of existing kill-bug-class rule.
- **`feedback_kill_bug_class_after_3_patches.md`** — second firing. Should have fired at R4; didn't until R5 close. Promote on next firing.

---

## ✅ Session 78 (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles (11 runtime commits)

Session 78 rolled the FB Marketplace shared-element transition out to all three planned real surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]) per the session-77 design record. Initial 4-commit baseline rollout snapped immediately on first iPhone test — six iterative cycles with David's frame-by-frame video QA progressively converged on a polished result. The biggest structural lesson: **cross-route framer-motion `layoutId` requires synchronous render at both ends**, and the testbed (which had no async data) couldn't surface that. Real surfaces fetch data → destination's motion node mounts after framer-motion has lost the source rect → the morph silently snaps. Fix: a per-post **preview cache** in sessionStorage written on tile tap + a module-scope feed cache for back-direction. After the cache landed, the rest of the session was UX iteration on the bubble + post-it + entrance timing.

**Beat 1 — Initial 4-commit baseline rollout (smallest→largest commit sequencing, finally executed cleanly).** Per the now-promotion-ready Tech Rule:

| Commit | Scope |
|---|---|
| `41cefc3` | feat(motion): app-shell `<MotionConfig reducedMotion="user">` via FindSessionProvider + 3 new motion tokens (`MOTION_SHARED_ELEMENT_EASE`, `_FORWARD`, `_BACK`) |
| `45f01d0` | feat(transitions): feed → /find/[id] shared-element photograph |
| `ffbda41` | feat(transitions): /shelves → /shelf/[slug] shared-element hero (BoothHero gains optional `layoutId` prop) |
| `7626c79` | feat(transitions): /flagged → /find/[id] shared-element photograph (matches surface 1 layoutId) |

**Beat 2 — R1 cycle: "It just snaps with a quick flicker of the loading screen."** David's iPhone test of the baseline rolled back the success picture from session 77's testbed validation. The photograph snapped to detail size with a "Loading…" flash; tiles still re-staggered on every back-nav. **Two-part diagnostic + fix:**

- **Why the morph snapped.** Destination `/find/[id]` only mounted its `<motion.button layoutId>` AFTER `getPost()` resolved (~100-300ms later). By that time framer-motion had released the source tile's rect during the Next.js route change. Same problem in reverse: `/`'s MasonryGrid only mounted after `getFeedPosts()` resolved.
- **Two fixes** (`6a7d527` + `c3b9541`):
  1. Source surfaces (feed tile + /flagged tile) write `image_url` to sessionStorage on tap (`treehouse_find_preview:${id}`). `/find/[id]` reads it synchronously in a useState initializer and renders the photograph hero — including the `<motion.button layoutId>` — on the very first commit, before getPost() resolves. Bubbles + post-it stay gated on `post` since they need data the cache doesn't carry (vendor, isMyPost, isSaved, boothNumber).
  2. `/`'s feed posts cached in a **module-scope variable** (`cachedFeedPosts`) that survives `/find/[id]` navigation. App Router unmounts the page; module scope persists for the SPA session. On back-nav we hydrate state from cache and skip the loading branch — destination motion.div for the back morph mounts immediately.

This was the load-bearing fix of the entire session. Forward + back animations both worked after this commit. Captured as new memory `feedback_preview_cache_for_shared_element_transitions.md`.

**Beat 3 — R2 cycle: David approved transitions, requested 3 polish items.** With the morph working, David noticed three patterns that disagreed with the design record:

- **Share airplane → masthead.** Per /my-shelf + /shelf/[slug] pattern, top-right airplane consistently shares the current entity (find here, booth there). `<IconBubble>` with green Send icon in the masthead's right slot, gated on `post`.
- **Flag travels with the photo.** Originally flag was a sibling of the photo motion.div; David wanted it to morph along. Moved INSIDE the motion.div as a transformed child. (This turned out to be wrong — see R3.)
- **Title / caption / divider / cartographic delays → 0.** D12's staggered 280/340/400ms read as "two transitions, not one." Compressed to delay 0 + same duration as photograph morph. D11 post-it crossfade duration also matched photograph (was 16ms+200ms late-arrival). **D11 + D12 in `docs/marketplace-transitions-design.md` are now overridden by on-device feedback; design record stays as historical reference.**

Photograph motion node converted from `<motion.button>` to `<motion.div role="button">` so the flag could live as a real `<button>` child without nested-button HTML. Commit `63e9a28`.

**Beat 4 — R3 cycle: "All tiles still transition in on load. Flag shows really large. Post-it should zoom (small to large)."** Three more on-device findings:

- **Drop the home feed entrance fade entirely** (was `hasVisitedBefore || isRestoringScroll` gate; now always-skipped). The shared-element morph is the only motion on this page; tiles render at full opacity from frame 1 on every visit. `FEED_VISITED_KEY` constant retired as unused.
- **Flag shows really large during morph.** Root cause: as a transformed CHILD of the photograph motion node, the flag was scaled by the parent's transform (so it appeared at parent_scale × native_size). At the morph endpoint its visual size matched the destination, but during transit it grew dramatically. Promoted flag to its OWN `<motion.div layoutId={`flag-${id}`}>` so it morphs as a peer of the photograph at constant ~36-38px, decoupled from the photograph's scale animation.
- **Post-it: zoom-in instead of fade.** Initial scale 0.6 → animate scale 1, opacity 0 → 1, rotate held at 6deg as an animated value (mixing static `transform: rotate` with framer's animated `scale` would clobber the rotate via combined matrix). Commit `dfab71d`.

**Beat 5 — R4 cycle: "Flag disappears mid-flight. Post-it zoom direction is reversed."** David's frame-by-frame video showed the flag visible at start of back transition, then GONE for several frames, then appearing at the destination tile slot. Diagnosis: flag with own `layoutId` as a CHILD of the photograph's `layoutId` motion.div fails — framer-motion can't reliably co-animate a layoutId inside a parent that's itself being layoutId-transformed. **Promoted flag to a SIBLING of the photograph motion.div**, on the same fixed-aspect outer wrapper. Both layoutIds animate independently; flag stays visible throughout. Same fix on all three surfaces. Post-it scale reversed from 0.6→1 (small→large) to 1.4→1 (large→small) per David's "stamp settling" spec. Commit `ad5de9f`.

**Beat 6 — R5 cycle: "Flag is still missing on several frames. Post-it too dramatic."** Even as a sibling, the flag dropped a frame or two mid-flight. Suspected cause: framer-motion's auto-detect of layoutId animation was confused because the flag's source and destination rects were identical in size (only position changes). **Two-part stabilization** on all three surfaces:

- Explicit `width: 36 / height: 36` on the motion.div style so framer-motion measures a fixed rect at both ends without waiting for child layout.
- `layout="position"` so framer-motion only animates position (no auto-detected size animation that could no-op out).

Inner button restyled to `width/height: 100%`. Post-it initial scale dialed from 1.4 → 1.15 ("just being pushed in, not slammed on"). Commit `f28d7ae`.

**Beat 7 — R6 cycle: "Make flag size consistent across home and find."** Final polish: dimensions were already 36×36 on every surface; what differed was the position offset (8/8 on tiles vs 12/12 on /find detail). The 4px offset read as a subtle size mismatch and made the layoutId path interpolate both screen position AND relative-corner offset. Unified all three surfaces to `top:8 right:8` so the layoutId animation becomes pure corner-tracking — bubble in identical relative-corner position on every surface. Commit `b95bec0`.

**Final state in production (as of `b95bec0`):**

- **Three surfaces shipping shared-element transitions:** feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. Forward + back both work, reduced-motion fallback via `<MotionConfig reducedMotion="user">`.
- **Two-key motion architecture per surface:** `find-${id}` for the photograph, `flag-${id}` for the flag bubble. Both as siblings, both with explicit dimensions, flag uses `layout="position"`.
- **Preview cache pattern:** sessionStorage `treehouse_find_preview:${id}` for forward direction, module-scope `cachedFeedPosts` for back direction. Critical primitive — ANY future shared-element work needs the same pattern.
- **Photo block + bubbles + post-it on `/find/[id]` restructured:** photograph hero escapes the loading gate so motion.button mounts on first commit. Bubbles + post-it gated on `post`. Loading text only shows when no preview AND post not yet loaded.
- **D11 + D12 design record values overridden** by on-device feedback. All entrance delays = 0 (concurrent with photograph morph). Post-it zoom 1.15 → 1 + opacity, easing matches photograph. Bubbles fade via D11 timing dropped — replaced with same primitive as photograph entrance.
- **Tile entrance fade dropped on home feed.** Full-opacity render on every visit.
- **Flag bubble locked at 36×36 / top:8 right:8 on all three surfaces.** Identical button dimensions, identical relative-corner offset.

**Commits this session (11 runtime + 1 close):**

| Commit | Message |
|---|---|
| `41cefc3` | feat(motion): app-shell `<MotionConfig>` + shared-element tokens |
| `45f01d0` | feat(transitions): feed → /find/[id] shared-element photograph |
| `ffbda41` | feat(transitions): /shelves → /shelf/[slug] shared-element hero |
| `7626c79` | feat(transitions): /flagged → /find/[id] shared-element photograph |
| `6a7d527` | feat(feed): skip tile entrance fade after first visit |
| `c3b9541` | fix(transitions): preview cache + early hero mount so layoutId catches the source rect ✅ |
| `63e9a28` | feat(transitions): masthead share, flag travels with photo, unified entrance |
| `dfab71d` | feat(transitions): no entrance fade, flag morphs as peer, post-it zooms in |
| `ad5de9f` | fix(transitions): flag as sibling not child + post-it zooms in from large |
| `f28d7ae` | fix(transitions): explicit flag rect + layout=position; subtler post-it zoom |
| `b95bec0` | fix(transitions): unify flag bubble offset across home + /find (8/8 everywhere) ✅ |
| (session close) | docs: session 78 close — Track D phase 5 shipped end-to-end |

**What's broken / carried (delta from session 77):**

- 🟢 **Track D phase 5** ✅ — three surfaces shipped end-to-end, validated on iPhone over 6 iteration cycles. David: "looks good." First production-deployed shared-element transitions in the project.
- 🟡 **`/shelves` → `/shelf/[slug]` may still need preview-cache treatment.** David validated home → /find but didn't test the booth surface. /shelf/[slug] has its own data-fetch (getVendorBySlug) so the BoothHero motion.div likely mounts after vendor data loads — same root issue we hit on /find/[id] before the preview cache. Needs validation. Likely fix: cache `hero_image_url` to sessionStorage on `/shelves` tile tap, read synchronously on `/shelf/[slug]` mount, render BoothHero with cached URL before vendor fetch resolves. **Session 79 follow-up if it surfaces.**
- 🟡 **D11 + D12 design record values overridden by on-device feedback.** [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) carries the original spec values (D11: post-it crossfade 200-360ms; D12: title 280ms / caption 340ms / cartographic 400ms staggered). Real implementation has all of these at delay 0 + duration matching photograph morph. Worth a documentation amendment or a "see CLAUDE.md session 78 for the runtime values" note in the design record. Operational backlog item.
- 🟡 **Preview cache pattern is now reusable infrastructure.** `treehouse_find_preview:${id}` keys + module-scope `cachedFeedPosts` survive route changes. Any future shared-element work (e.g., booth tile → /shelf/[slug] if needed; feed tile → /post if a "view in editor" pattern lands) should use the same primitive. Documented in new memory `feedback_preview_cache_for_shared_element_transitions.md`.
- 🟡 **`<motion.div role="button">` instead of `<motion.button>`** is the chosen pattern when a transformed motion element needs `<button>` children. Avoids nested-button HTML. Single firing, but likely to recur as more layoutId UI lands.
- 🟡 **Module-scope cache is the pattern for cross-route persistence** in App Router. State variables die on unmount; module-scope variables persist for the SPA session. Single firing — first time we've used this pattern in the project.
- 🟡 **`layout="position"` + explicit `width/height`** is the stabilization pattern when only position changes between layoutId source/destination. Single firing.
- 🟡 **layoutId children inside layoutId parents drop frames mid-flight.** Captured as a single firing diagnostic note. The fix is always "promote to sibling."
- 🟡 **The `/transition-test` testbed validated the basic mechanism but couldn't surface the async-data + chrome integration issues.** This means: testbeds prevent some classes of failure but not all. David's `feedback_testbed_first_for_ai_unknowns.md` memory holds — the testbed was still net-positive — but the next layer of validation was iPhone-with-real-data. Pattern to re-state: testbed validates the engine; real-surface QA validates the fully integrated system.
- 🟡 All session 70–77 carry items unchanged unless explicitly resolved above.

**Memory updates:** ONE new memory.

- `feedback_preview_cache_for_shared_element_transitions.md` — Source surfaces should preview-cache critical layoutId data (image_url, etc.) to sessionStorage on user tap so the destination can render its motion node synchronously on first commit. Without this, async data fetches mean the destination's motion element only mounts AFTER framer-motion has released the source rect, and the cross-route morph silently snaps. Module-scope caches handle the back direction (state dies on App Router unmount; module scope survives). Validated by the entire 11-commit Track D phase 5 arc of session 78.

Existing memories that load-bore the session:
- `feedback_treehouse_no_coauthored_footer.md` — applied to all 11 runtime commits ✅.
- `feedback_testbed_first_for_ai_unknowns.md` — relevant in retrospect: the session-77 testbed validated cross-route layoutId WORKS, but didn't surface the async-data failure mode. Memory holds; next-layer validation pattern noted in carry-forwards.
- `feedback_kill_bug_class_after_3_patches.md` — partial firing in beat 5: after R3 + R4 didn't fully fix the flag, beat 6 promoted the structural fix (explicit dimensions + `layout="position"`) instead of patching layer-by-layer. Memory holds.
- `feedback_visibility_tools_first.md` — referenced after R1 ("we're in cycle 1, don't build diagnostic infrastructure yet"). Pattern held — direct fix landed without needing diagnostic overlays.

**Live discoveries:**

- **Cross-route framer-motion `layoutId` requires synchronous mount on BOTH ends.** Testbed validated the engine but not the integration. New memory captures the preview cache fix.
- **Same-`layoutId` parent + child = frame drops.** When a `<motion.div layoutId>` contains another `<motion.div layoutId>`, framer-motion's transform tracking on the child gets disrupted by the parent's transform during cross-route animation. Sibling pattern works. Single firing; Tech Rule on second firing.
- **`layout="position"` is the right escape hatch when only position changes.** Without it, framer-motion's auto-detect tries to animate size too, can no-op out, and frames drop. With explicit dimensions + `layout="position"`, the animation is fully deterministic. Single firing.
- **Module-scope variables survive Next.js App Router page unmounts.** Used as the back-direction cache for feed posts. Survives /find/[id] navigation cleanly because module scope persists across React unmounts. Single firing.
- **iPhone QA cycles can override design-record motion specs.** D11 + D12 timings looked good in the still-frame mockup but felt disjointed on real device. Six rounds of David's frame-by-frame video QA converged on values not in the design record. Spec docs need a "runtime overrides" amendment pattern. Single firing.
- **`<motion.div role="button">` avoids nested-button HTML when motion element needs `<button>` children.** Used for the photograph wrapper that contains the flag bubble. Single firing.

**Operational follow-ups:**
- Archive-drift accounting: rotated session 77 to tombstone. Session 72 falls off the bottom of last-5 visible tombstones at session 78 close. Archive-drift backfill to session-archive.md (sessions 54 + 55 + 57–77) still on the operational backlog.
- **NEW operational backlog:** amend [`docs/marketplace-transitions-design.md`](docs/marketplace-transitions-design.md) with a "Runtime Overrides" section noting D11 + D12 values were superseded by on-device feedback in session 78. Cheap docs hygiene.
- **NEW operational backlog:** validate `/shelves` → `/shelf/[slug]` transition on iPhone; if it snaps, apply preview cache pattern (cache `hero_image_url` on `/shelves` tile tap, read synchronously on `/shelf/[slug]`).

**Tech Rule candidates (this session):**

- "Preview-cache the layoutId payload on user tap so destination renders synchronously" — first firing. New memory.
- "Module-scope cache survives Next.js App Router unmounts" — first firing. Pattern.
- "layoutId children inside layoutId parents drop frames mid-flight" — first firing. Sibling-pattern fix.
- "`layout='position'` + explicit dimensions stabilizes layoutId when only position changes" — first firing.
- "iPhone QA can override design-record motion specs" — first firing. Documentation amendment pattern.
- "`<motion.div role='button'>` avoids nested-button HTML" — first firing. Pattern.
- **Smallest→largest commit sequencing — finally clean execution.** Session 70 first firing, session 77 second firing, **session 78 first clean execution** (4 baseline commits in size order before any rework). Pattern is now load-bearing in practice.

**Notable artifacts shipped this session:**
- [`lib/tokens.ts`](lib/tokens.ts) — 3 new motion tokens: `MOTION_SHARED_ELEMENT_EASE` (iOS spring-out), `MOTION_SHARED_ELEMENT_FORWARD` (0.34s), `MOTION_SHARED_ELEMENT_BACK` (0.30s).
- [`hooks/useSession.tsx`](hooks/useSession.tsx) — wraps `<MotionConfig reducedMotion="user">` around children (app-shell gate).
- [`app/page.tsx`](app/page.tsx) — module-scope `cachedFeedPosts`; sessionStorage preview write on tile tap; entrance fade dropped; flag motion.div as sibling with own layoutId at top:8 right:8.
- [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) — `previewImageUrl` from sessionStorage in useState initializer; photograph hero escapes loading gate; `<motion.div role="button" layoutId>` for photo; flag as sibling at top:8 right:8 with `layout="position"`; share airplane on masthead; D11/D12 timings collapsed to 0.
- [`app/flagged/page.tsx`](app/flagged/page.tsx) — sessionStorage preview write on tile tap; flag as sibling with own layoutId.
- [`app/shelves/page.tsx`](app/shelves/page.tsx) — `<motion.div layoutId={`booth-${vendor.id}`}>` on hero img; admin tap to /my-shelf gracefully no-ops the morph.
- [`app/shelf/[slug]/page.tsx`](app/shelf/[slug]/page.tsx) — passes `layoutId={`booth-${vendor.id}`}` to BoothHero.
- [`components/BoothPage.tsx`](components/BoothPage.tsx) — BoothHero gains optional `layoutId` prop wrapping the photograph container.

---


## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–78 still missing — operational backlog growing). Session 73 fell off the bottom of last-5 visible tombstones at session 79 close.

- **Session 78** (2026-04-27) — Track D phase 5 shipped end-to-end across 6 iPhone-QA cycles. 11 runtime commits + close. FB Marketplace shared-element transition is now live across three production surfaces (feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]). Critical fix `c3b9541` introduced the **preview-cache pattern**: source surfaces write `image_url` to sessionStorage on tap so destination renders motion node synchronously before async data fetches resolve; module-scope cache (`cachedFeedPosts`) handles the back direction. ONE new memory (`feedback_preview_cache_for_shared_element_transitions.md`). Smallest→largest commit sequencing finally cleanly executed (sessions 70 + 77 firings precede). FIVE new single-firing Tech Rule candidates (preview-cache pattern, sibling-not-child layoutIds, `layout="position"` stabilization, `<motion.div role="button">`, iPhone QA can override design-record motion specs). D11 + D12 design record values overridden by on-device feedback. David: "looks good."
- **Session 77** (2026-04-27) — Track D phases 1–4 + masthead bug 5-attempt arc. Six runtime/docs commits + close. Two parallel arcs that merged at close. **Track D (`d3ddffb` design-to-Ready + `e601db5` testbed + bundled mockup in `c968c1a`):** D1–D14 frozen for FB Marketplace shared-element transitions; design record committed; `/transition-test` testbed validated cross-route framer-motion `layoutId` works in Next.js 14 App Router without explicit `<AnimatePresence>`. Phase 5 rollout queued for session 78. **Masthead bug 5-attempt arc (`361e1de` + `c968c1a` + `d429bbb` + `166ed59` ✅):** sessions 76 + 77 attempts 1–4 all patched the wrong layer (React tree, browser bfcache, iOS PWA event listeners). Attempt 5 replaced `position: sticky` with `position: fixed` + spacer, eliminating the iOS PWA sticky-paint bug class entirely. Less code, structurally correct. ONE new memory (`feedback_kill_bug_class_after_3_patches.md`). "Smallest→largest commit sequencing" — second firing (then session 78 first clean execution). "PWA standalone vs browser Safari is a different render path" — first firing.
- **Session 76** (2026-04-27) — 6-item redirect bundle: bug fix + green tokens + find-title centering + animation consistency. Seven runtime/docs commits + close. **Track A (`b5470da`):** /find/[id] masthead present in loading + !post branches (mirrors /shelf/[slug] pattern — addressed wrong layer; real fix landed session 77). **Track B (`d0c4ce3` + `fd1a874`):** Treehouse Finds wordmark, "Booth" eyebrow, booth numeral all `v1.green` across every applicable surface. **Track C (`a2cf548` + bundled in `fd1a874`):** Find-detail title centered + price 32px IM Fell twin below in priceInk; em-dash retired; Frame B picked. **Track E (`ecb8ef8` + `3832fc1`):** 5 motion tokens added to lib/tokens.ts (`MOTION_EASE_OUT`, `MOTION_CARD_DURATION`, `MOTION_STAGGER`, `MOTION_STAGGER_MAX`, `MOTION_EMPTY_DURATION`); Booths VendorCard gains `whileTap: scale 0.97`; empty-state + card-entrance unified across 4 primary tabs. Track D (FB Marketplace shared-element transitions) carried to session 77 as its own session. ZERO new memories. `feedback_ask_which_state_first.md` 10th–13th firings. Same-session design-record-commit rule 11th + 12th firings. "Verify sub-agent claims that contradict known semantic rules" — second firing (now promotion-ready).
- **Session 75** (2026-04-27) — David approved feed seeding then redirected to a 7-item polish + system-rule bundle: admin login redirect, BoothHero lightbox, /vendor-request rewrite, booth-numeral font system swap. Six runtime/docs commits + close shipping all 7 end-to-end. **Track A (`60a7a11` admin redirect + `eef1746` BoothHero lightbox):** `pickDest(user)` helper in /login centralizes admin → `/`; transparent overlay at z-5 sandwiches between photo + pencil + post-it. **Track C (`d747b71` design-to-Ready + `01a6b44` feat):** `FONT_POSTIT_NUMERAL` → `FONT_NUMERAL` (Times New Roman) across 7 surfaces; project-wide rule "letters → IM Fell or sans; numbers → FONT_NUMERAL" frozen; build-error caught the 7th surface (PhotographPreview). **Track B (`a427ee7` design-to-Ready + `fbbba21` feat):** /vendor-request one-screen redesign with owner-ack checkbox gate, hard-required Mall+Booth#, FONT_SYS photo copy, intro paragraph dropped + migration 013 (HITL paste pending). ZERO new memories. ZERO new Tech Rule promotions; four single-firing candidates.
- **Session 74** (2026-04-27) — Gemba walk follow-up at America's Antique Mall surfaced 7 items; six beats, four runtime/docs commits + close shipping all 7 end-to-end. **Polish quartet (`30b9922`):** AddBoothInline alphanumeric `booth_number`, /post/preview FB CTA retired, AddFindTile to grid tail, my-shelf 9-cell placeholder grid dropped. **Item 4 (`d52b149`):** /post/preview's three router.push call sites preserve `?vendor=<id>` through publish flow. **Booth management (`6d32c9c` design-to-Ready + `c5437df` feat):** D1–D7 frozen for Edit + Add sheets (Pencil bubble repurpose, slug auto-update, no `user_id` safety gate, mall-change conflict path, no hero in Edit, Add tile tail position, hero retained for mall-walk capture). 4 new components (BoothFormFields, EditBoothSheet, AddBoothSheet, AddBoothTile) + PATCH `/api/admin/vendors` with BOOTH_CONFLICT 409. Third oscillation of AddBoothInline-on-/shelves (sessions 37 + 67 retired; 74 restored intentionally per demo-authenticity reasoning). Optimistic `setVendors` on success — no full reload. Same-session design-record-commit rule 8th firing. ZERO new memories. ZERO new Tech Rule firings; one single-firing candidate ("audit existing affordances for semantic drift").
---

## CURRENT ISSUE
> Last updated: 2026-04-28 (session 79 close — Track D extension to More-from-shelf + BoothPage tiles + scroll-restore on /flagged + /my-shelf + /shelf/[slug] attempted across 12 commits. Cross-page layoutId namespace collisions surfaced; conditional layoutId via reactive store + flushSync + rAF defer fought React batching + framer projection + Next.js Link timing through 4 iPhone-QA cycles. David elected Option A: full revert to session 78 close. Production state identical to `4bcefeb`.)

**Working tree:** clean. **Build:** green. **Beta gate:** technically unblocked since session 50; no code-level regressions. **NET CHANGE this session: zero.** 12 commits attempted Track D extension; final commit `a9dc1bd` reverts everything back to session 78's state. **Production behavior identical to session 78 close.** The session's value lives in the new memory (`feedback_extend_existing_primitive_via_testbed.md`) and the diagnostic notes in the session block above. Feed content seeding is STILL top of queue — **22× bumped** now (was 21× at session 78 close; 79 didn't move the needle). The `/my-shelf` back-nav scroll anchor (session 79's primary user ask) remains an open carry-forward and is independent of the morph work; could ship cleanly in a focused future session WITHOUT any layoutId changes.

### 🚧 Recommended next session — Feed content seeding (~30–60 min)

The single longest-deferred V1 unblocker, now **22× bumped** through sessions 55, 60–79. Migration 013 (owner_acknowledged) ran in session 77; Track D phase 5 transitions polished in session 78 — empty-grid limitations are still the only thing standing between current state and first beta vendor invite. 10–15 real posts across 2–3 vendors. The seeding walk has zero remaining technical blockers.

**Why now (over the alternatives):**
- Real content makes the session-78-shipped Track D transitions land with their full intended visual punch. Empty seed photos don't exercise the morph as effectively as varied real vendor content.
- Flag-on-seeded-photos is the first opportunity to validate the saved-state UX (frosted bubble + green fill) against actual marketplace photography.
- Nothing else in the queue is gating beta. Q-014 (Metabase) is more valuable post-seeding because more events will fire to stress-test the analytics pipeline.

**Verify before starting:** the `/transition-test` testbed still works on production. It's the layoutId regression canary.

### Alternative next moves (top 3)

1. **Re-attempt Phase 3 scroll-restore (NO morph changes).** Session 79 attempted Track D extension AND scroll restore in one session; the morph work blew up but the scroll-restore code in commits `71a0555` (`/flagged`) + `51067b7` (`/my-shelf` + `/shelf/[slug]`) was independent and functioned correctly. Cherry-pick or re-implement those two commits as a single focused session. Lands the user's primary session-79 ask (`/my-shelf` back-nav anchor). ~30–60 min, size S-M. **Strict scope rule: NO `<motion.div>` or `layoutId` touched.** Just module-scope post caches + sessionStorage scroll keys + `requestAnimationFrame` scroll-restore once data is ready. The same primitives that already work on home page in session 78.
2. **Validate `/shelves` → `/shelf/[slug]` transition on iPhone.** Carried from session 78. Session 78 only QA-validated home → /find/[id] (and back). The `/shelves` surface ships with the same layoutId pattern but its destination (`/shelf/[slug]`) has its own data-fetch (`getVendorBySlug`). If BoothHero only mounts after vendor data loads, the transition will snap exactly like `/find/[id]` did before the preview cache. **Likely fix if it surfaces:** cache `hero_image_url` to sessionStorage on `/shelves` tile tap, read synchronously on `/shelf/[slug]` mount, render BoothHero with cached URL before vendor fetch resolves. Same primitive as session 78. ~20–30 min if needed.
3. **Q-014 — Metabase analytics surface** (David surfaced session 73, queued in [`docs/queued-sessions.md`](docs/queued-sessions.md)) — strategic next step on the analytics arc. **More valuable AFTER feed seeding** because more events will be flowing to stress-test the dashboards.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 80 opener (pre-filled — Feed content seeding)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: Feed content seeding. Single longest-deferred V1 unblocker, 22× bumped. Goal: 10–15 real posts across 2–3 vendors so the Track D phase 5 transitions (shipped session 78, polished across 6 iPhone-QA cycles) land with their full visual punch on real marketplace photography. Migration 013 (owner_acknowledged) already ran session 77; no remaining technical blockers. Walk through the post flow per docs/onboarding-journey.md, fill 2–3 vendor booths with diverse photos. CONTEXT FROM SESSION 79: production state is identical to session 78 close (`4bcefeb`); session 79 attempted to extend Track D to More-from-shelf + BoothPage tiles + add scroll-restore on /flagged + /my-shelf + /shelf/[slug], hit cross-page layoutId namespace collisions and reactive-store timing issues that couldn't be resolved on remote iPhone debugging, full revert to session 78 baseline (commit `a9dc1bd`). The /my-shelf back-nav scroll anchor remains an open carry-forward — re-attempt as a SEPARATE focused session WITHOUT morph changes. ALTERNATIVES IF SEEDING DELAYED: (1) Re-attempt Phase 3 scroll-restore on /my-shelf + /shelf/[slug] + /flagged using ONLY the scroll-key + module-cache pattern from session 78's home feed; commits `71a0555` + `51067b7` are in git history as reference. STRICT SCOPE: NO motion.div or layoutId changes. ~30–60 min. (2) Validate /shelves → /shelf/[slug] transition on iPhone (session 78 carry); fix with hero_image_url preview cache if it snaps. (3) Q-014 Metabase analytics surface (more valuable post-seeding). CARRY-FORWARDS FROM SESSIONS 78 + 79: preview cache pattern (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) is reusable for any future shared-element work; framer-motion layoutId is a global namespace and cross-page collisions fire whenever two surfaces share the same id; conditional layoutId via reactive store fights React batching + framer projection + Next.js Link timing in ways that may not be reliably solvable without on-device debugging; testbed `/transition-test` should be USED for surface-extension work, not just initial primitive validation; D11+D12 design record values were overridden by on-device feedback in session 78. /transition-test stays live as the layoutId regression canary.
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
- **Track D phase 5 — surface rollout** ✅ — **shipped session 78** across 11 runtime commits and 6 iPhone-QA cycles. Three surfaces live: feed → /find/[id], /shelves → /shelf/[slug], /flagged → /find/[id]. Final commit `b95bec0` unifies flag dimensions + offset across all surfaces. Critical fix `c3b9541` introduced the **preview cache pattern** (sessionStorage `treehouse_find_preview:${id}` + module-scope `cachedFeedPosts`) that any future shared-element work will need to reuse. **NEW carry-forward: validate /shelves → /shelf/[slug] on iPhone** — David only QA-validated home → /find. /shelves has its own data-fetch and may need the same cache treatment. **NEW carry-forward: D11 + D12 design record values overridden by on-device feedback** — all entrance delays compressed to 0; post-it crossfade replaced with zoom-in 1.15→1; bubble timing matches photograph morph. Design record stays as historical reference; runtime values only in CLAUDE.md session 78 block. Operational backlog: amend the design record with a "Runtime Overrides" section.
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
- **Feed content seeding** — rolled forward from sessions 55–77, **78**. 10–15 real posts across 2–3 vendors. **Now 21× bumped**. Sessions 61–78 each strengthened the case; session 78 shipped Track D phase 5 (FB Marketplace transitions polished across 6 iPhone-QA cycles), the last technical blocker. Now top of the queue with zero remaining technical blockers — Migration 013 done in session 77, transitions polished in session 78. Real content makes the freshly-shipped morph land with full visual punch.
- **Hero image upload size guard** — verify coverage across upload surfaces. Note: session 61 added DELETE coverage at `/api/admin/featured-image`; size guard remains a separate concern on the upload path.
- **Tech Rule promotion batch** — 28+ candidates queued; **TR-l + TR-m both 🟢 promotion-ready**, **"verify sub-agent claims that contradict known semantic rules" 🟢 promotion-ready** (session 76 2nd firing), **"smallest→largest commit sequencing" 🟢 promotion-ready** (session 70 1st + session 77 2nd misfire + session 78 1st clean execution — load-bearing in practice). Recent additions: session 61 (TR-n), session 62 (TR-p testbed-first for AI/LLM call unknowns + `feedback_testbed_first_for_ai_unknowns.md` memory), session 64 (`feedback_still_frame_before_animation_port.md`), session 65 (`feedback_verify_third_party_software_exists.md` + "platform-managed env > manual paste"), session 68 (`feedback_state_controls_above_hero_chrome.md`), session 69 ("when wrapping one part of a parallel structure in a card, decide for the whole structure or none of it"). Session 70 surfaced "smallest→largest commit sequencing" + "italic-ascender 1px lift". Session 71 surfaced "verify sub-agent claims" (now 2nd-fired) + "screenshot before scoping multi-change visual fixes". Session 73 surfaced **TR-q** ("`force-dynamic` does NOT propagate `cache: "no-store"` to inner fetches"). Session 74 surfaced "audit existing affordances for semantic drift". Session 75 surfaced four single-firings ("audit existing affordances" 2nd firing — BoothHero z-index, "long-form helper copy on paper-wash → sans", "narrow-named tokens audited for generalization", "trust the build"). Session 76 surfaced three single-firings + 1 second-firing ("Detail-page render branches must render base chrome", "Default to stacked over inline for title + secondary value patterns", "Audit invariants against sibling pages"). Session 77 surfaced "PWA standalone vs browser Safari is a different render path" (1st firing, masthead breakthrough) and the kill-the-bug-class memory (`feedback_kill_bug_class_after_3_patches.md`). **Session 78** surfaced FIVE new single-firings: (1) preview-cache the layoutId payload so destination renders synchronously (1st firing — new memory `feedback_preview_cache_for_shared_element_transitions.md`); (2) module-scope cache survives Next.js App Router unmounts (1st firing); (3) layoutId children inside layoutId parents drop frames mid-flight (1st firing — sibling-pattern fix); (4) `layout="position"` + explicit dimensions stabilizes layoutId when only position changes (1st firing); (5) iPhone QA can override design-record motion specs (1st firing — D11/D12 in session 78). Plus `<motion.div role="button">` avoids nested-button HTML (1st firing). Full register: [`docs/tech-rules-queue.md`](docs/tech-rules-queue.md).
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
- **Operational backlog** — staging migration paste, OTP template paste, debug-toast cleanup, doc-only updates (Design agent principle, KNOWN PLATFORM GOTCHAS), `/admin` `auth.users` delete spike, `/api/suggest` SDK migration, archive-drift backfill, strip verbose diag logs from `/api/admin/events/route.ts`, audit other `createClient` callsites, **NEW: reap dormant showPlaceholders prop infrastructure in BoothPage.tsx**. → [`docs/queued-sessions.md`](docs/queued-sessions.md) §Operational backlog.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 was a small surgical session rationalizing admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; session 75 closed a 7-item David-redirect bundle end-to-end; session 76 closed five of six David-redirect items end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end — the FB Marketplace shared-element transition is now live across three production surfaces after 11 runtime commits and 6 iPhone-QA cycles, demonstrating the **preview-cache pattern as new reusable infrastructure**. **Session 79 was a net-zero session: 12 commits attempted Track D extension + scroll-restore, full revert to session 78 baseline shipped (`a9dc1bd`).** The session's value lives in the new memory codifying "use the existing testbed for surface extensions, not just initial primitive validation" — extension to new surfaces introduces NEW cross-surface namespace collisions and timing interactions that production code can't recover from cleanly. Framer-motion's `layoutId` is a global namespace; conditional layoutId via reactive store fights React batching + framer projection + Next.js Link timing. Feed content seeding remains top of queue, **22× bumped**, zero remaining technical blockers. The `/my-shelf` back-nav scroll anchor (session 79 primary user ask) is an open carry-forward — re-attemptable in a focused future session WITHOUT morph changes. **Next natural investor-update trigger point** is still after feed content seeding lands. Q-014 (Metabase) remains the next-session-or-two strategic shipment that turns "data flowing" into "investor-ready dashboards."
