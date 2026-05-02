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

## ✅ Session 100 (2026-05-02) — /find/[id] navigation refinement: tap = step in / swipe = look around / back = return to spot — 18 runtime commits + close

David opened with `/session-open`. Standup recommended iPhone QA on /flagged + product-state.md continuation OR R1. David redirected with a verbatim ask: *"We're refining the navigation behavior in the existing Treehouse Finds app. Do not redesign the UI or introduce new patterns. Work within the current structure. (...) Think of the app as a physical place, not a set of pages. When a user taps a find, they are stepping into that location. When they swipe left or right, they are moving between nearby finds within the same context. When they press back, they should return to the exact place they were in the feed."* Three constraints: back must always return to original feed scroll; swiping must NOT create navigation history; feed must remain stable. Result: a single-arc 18-commit session that reshaped /find/[id] navigation end-to-end and pushed past `feedback_cap_speculative_patching_at_3_rounds` deeper than any prior session (8 QA cycles before escalating to console.log instrumentation revealed the actual root cause).

**Phase A — context handoff plumbing (commit `4b81e21`).**

New helper module [`lib/findContext.ts`](lib/findContext.ts) carrying a single sessionStorage blob: `{ originPath, findRefs: [{ id, image_url, title }], cursorIndex }`. Home feed's `handleTileClick` writes the context (the visible mall-scope-filtered post list + tap-time cursor) alongside the existing preview-cache write. /find/[id]'s [id] effect reads it on mount and exposes `prevId`/`nextId` in state. Phase A is invisible plumbing (no behavior change) — single console.log harness for Inspector verification. David verified: log showed `cursor: 7, listLength: 41, prev: <id>, next: <id>` on detail mount.

**Phase B — swipe gesture, ending in 4 QA cycles (commits `00cc749`, `f02286b`, `8182599`, `c549534`, `2f7ec69`).**

Initial ship (`00cc749`): wrapped /find/[id] body in a `motion.div` with `drag="x"` + `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic={0.4}`. `onDragEnd` threshold 80px / 500px/s velocity → animate slide-out → `router.replace(newId)` → animate slide-in. Pre-warm preview cache for prevId/nextId. New `find_swiped` R3 event. Carousel "More from this booth" got `touchAction: pan-x` to keep its native horizontal scroll working over its own region.

David QA flagged residual flicker — metadata (post-it, save bubble, title, caption, share) loaded a beat after the photo. Three QA cycles followed:
- **QA #1** (`f02286b`): pre-fetch full Post for prevId/nextId on detail mount via shared module-scope post cache. Cache hit on swipe → metadata paints sync.
- **QA #2** (`8182599`): switched to a structurally cheaper path — extended `getFeedPosts` SELECT to match `getPost` (vendor.user_id, vendor.bio, mall.address) + dumped every loaded feed post into the shared post cache on Home load. Zero extra round trips. Tap from Home → /find/[id] cache hit instant. Cache moved from /find/[id]-internal to `lib/findContext.ts` shared helpers (`setPostCache` / `getPostCache` / `clearPostCache`). Edit pages clear cache on PATCH success.
- **QA #3** (`c549534`): RAF-defer slide-in animation by one frame so React commits cache-hit state before the slide-in starts. Backfired — David screenshot showed an EMPTY VIEWPORT between slide-out end and slide-in start (the wrapper at +innerWidth offscreen, with the RAF gap making the empty state visible).
- **QA #4** (`2f7ec69`): the structural fix per `feedback_total_strip_after_iterative_refinement_fails` — drop slide animations entirely. Drag-during-gesture only (motion.div follows finger as user pulls). On release past threshold: track + `router.replace`. Below threshold: framer-motion's `dragConstraints` auto-snaps back to x=0. Removed `useAnimation` / `swipeControls` / `swipeDirRef` / `swipeTransitioningRef` (-3 kB First Load JS). New `useLayoutEffect` for sync state on [id] change: `setPreviewImageUrl`, cache-hit/miss `setPost`+`setLoading`, `setPrevId`/`setNextId` — commits BEFORE paint so the visible state goes from old-find to new-find in one paint with no transition state. David: *"feels better lets move to phase c."*

**Phase C — extend the swipe context to /flagged + /shelf/[slug] + the More-from-this-booth carousel (commit `8f941dd`, then 8 QA cycles).**

Initial Phase C extended SELECTs in [`lib/posts.ts`](lib/posts.ts) (`getPostsByIds` + `getVendorPosts` to match `getPost`'s shape) + wired tap handlers in [`app/flagged/page.tsx`](app/flagged/page.tsx), [`components/BoothPage.tsx`](components/BoothPage.tsx) (WindowTile + ShelfTile via optional `swipeOriginPath` prop), and the ShelfSection inside [`app/find/[id]/page.tsx`](app/find/[id]/page.tsx) (carousel taps re-scope context to the booth's catalog). `/my-shelf` deliberately omits the prop (vendor-self surface, no swipe-nav).

David QA flagged the carousel scroll was being captured by the page-level swipe. **QA #1** (`699ea05`): rendered ShelfSection OUTSIDE the motion.div as a sibling — page-level drag's pointer listeners can't reach into the carousel's DOM subtree.

That fix surfaced the next bug: scroll-restore landing above the tapped carousel card position. Seven more QA cycles to crack it:
- **QA #2** (`824a913`): added `shelfReady` state — gate scroll-restore until carousel's `onReady` callback flips it true (carousel fetches async after parent post fetch; document grows after).
- **QA #3** (`beb16bd`): moved `setShelfReady(false)` reset from useEffect to useLayoutEffect (the stale-closure bug — scroll-restore was reading shelfReady=true from the previous render before the reset committed).
- **QA #4 original** (`37a43b1`): ResizeObserver watchdog re-firing scrollTo when document grows. Triggered React #418 hydration error in prod.
- **QA #4 revised** (`33e53c9`): backed off ResizeObserver to a staircase of setTimeouts (immediate + 100ms + 300ms + 600ms).
- **QA #5** (`4891e4f`): David Inspector data showed saved Y going 785 → 502 across a single back-nav cycle. Root cause: `scrollTo` triggers scroll events; our `onScroll` listener was writing the CLAMPED value back to sessionStorage, destroying the original. Fix: hold `findScrollWriteBlocked = true` through the staircase window.
- **QA #6** (`c6202cd`): David Inspector showed `scrollY=270` post-back-nav matching no saved value — iOS Safari's native popstate scroll restoration was firing AFTER our scrollTo and overriding it. Set `history.scrollRestoration = 'manual'` to opt out.
- **QA #7** (`bfc0236`): React #418 + #423 errors in console; downstream of `useState` initializer reading sessionStorage (server null, client URL → hydration mismatch → fallback to client re-render → useEffect ordering broken). Fix: initial state `null`, populate via existing useLayoutEffect. NEW memory: [`feedback_browser_api_in_useState_initializer_hydration.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_browser_api_in_useState_initializer_hydration.md).
- **diag** (`b9cb9bf`): David post-QA #7 reported scroll-restore STILL not landing — escalated past `feedback_cap_speculative_patching_at_3_rounds` (already 7 rounds in by this point, well past the 3-round cap). Added [scroll-restore] prefixed console.log at every gate + scrollTo call.
- **QA #8** (`c271c34`): David captured logs showing every `id-effect` log on back-nav had `wasBackForward: false / lastNavWasPopstate: false` — Next.js's internal `pushState`/`replaceState` calls during route transitions were firing through our monkey-patched wrappers and clobbering the JS flag BEFORE our useEffect could read it. Fix: replace JS flag with a sessionStorage marker timestamped on real popstate events. Next.js's internal history calls don't touch sessionStorage. NEW memory: [`feedback_nextjs_internal_history_calls_clobber_flags.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_nextjs_internal_history_calls_clobber_flags.md). David: *"and just like that, we're in business! works"* — logs showed `tryScroll:raf { before: 0, after: 702, targetY: 702, max: 810 }` exact match.
- **cleanup** (`6f04641`): stripped the diagnostic console.logs.

**Final shipped behavior on /find/[id]:**
- Drag horizontally with finger → motion.div follows. Below threshold release → spring back to center. Above threshold → router.replace to prev/next id. **No history growth** across swipes (`router.replace` not `router.push`). Browser back returns to the original feed scroll position.
- Tap any tile (Home / /flagged / /shelf/[slug] / More-from-this-booth carousel) → /find/[id] paints fully on first frame (cache hit + sync state via useLayoutEffect). Photo + post-it + save bubble + title + caption + share airplane all together.
- More-from-this-booth carousel re-scopes the swipe context to that booth's catalog (originPath = `/shelf/${vendorSlug}`). Tap a card → land on new find → swipe → moves through booth's siblings.
- /my-shelf untouched — no swipe affordance (vendor-self surface).

**Architecture decisions worth carrying forward:**
- Cache populated at LOAD sites (Home loadFeed, /flagged loadPosts, /shelf/[slug] page mount, /find/[id] fetch effect, ShelfSection's getVendorPosts) — not at TAP sites. One round trip per page load primes the cache for everything the user might step into.
- Shared post cache lives in [`lib/findContext.ts`](lib/findContext.ts) module scope. Survives swipe-driven router.replace, detail→back→detail trips, feed→detail→home→detail trips. Cleared per-id on edit submit.
- `useLayoutEffect` for any state that must commit BEFORE paint to avoid downstream effect-ordering issues (cache hit setPost, preview image, neighbor resolution, shelfReady reset).
- Next.js App Router popstate detection MUST use sessionStorage marker, not JS flag.
- Browser-only API reads in `useState` initializers are forbidden in this codebase (cause hydration mismatch).
- iOS Safari native scroll restoration is opted out of via `history.scrollRestoration = 'manual'` set on /find/[id] mount.

**Memory updates this session:**
- **NEW feedback memory:** [`feedback_nextjs_internal_history_calls_clobber_flags.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_nextjs_internal_history_calls_clobber_flags.md) — Next.js App Router popstate flag clobber bug + sessionStorage marker fix.
- **NEW feedback memory:** [`feedback_browser_api_in_useState_initializer_hydration.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_browser_api_in_useState_initializer_hydration.md) — sessionStorage/localStorage in useState initializer → React #418/#423 → downstream effect-ordering damage.
- ~3rd firing of [`feedback_cap_speculative_patching_at_3_rounds.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_cap_speculative_patching_at_3_rounds.md) — but this session was a **VIOLATION**: I went 7 rounds before escalating to console.log instrumentation. Should have escalated at round 4-5. The escalation finally cracked the bug at round 8. Tightening the rule: when each QA cycle reports "still wrong" with no narrowing of the problem space, that's the signal to instrument, not to patch again.
- ~7th firing of [`feedback_total_strip_after_iterative_refinement_fails.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_total_strip_after_iterative_refinement_fails.md) — Phase B QA #4 dropped slide animations entirely after 3 iteration rounds where each "fix" surfaced new flicker. The structural fix (no animation) was -38 net lines.
- ~40th firing of [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) — 18 commits sequenced from invisible plumbing (Phase A) → swipe gesture → context extension → 8 QA cycles → log strip. Each fix isolated.
- ~11th firing of [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md) — David ran iPhone QA + Inspector multiple times within session.

**Operational follow-ups (carry into session 101):**

- **🟡 NEW PRIMARY (session 100): /flagged + product-state.md carry-forwards from session 99 are STILL UNTOUCHED.** Original session-100 standup recommendation was iPhone QA on /flagged final state + product-state.md continuation. David redirected to navigation refinement; those items remain. Plus: docs/product-state.md is still uncommitted/mid-edit at session close.
- **🟡 NEW (session 100): Phase D candidate** — extend swipe-context handoff to /post/preview if vendor-self peer-nav becomes desirable. Currently /my-shelf and other vendor surfaces deliberately omit. Beta watch-item.
- **🟡 NEW (session 100): `getPostsByIds` + `getVendorPosts` SELECT extensions** — added vendor.user_id + vendor.bio + mall.address. Slight payload bump (~30-100 bytes/post). If feed pagination ever fires (R5b), reconsider whether all rows need the full join.
- **🟡 NEW (session 100): The `wasRecentPopstate(800ms)` window is conservatively wide.** If user does back → quick Link tap within 800ms, the new page might falsely treat the nav as back-forward. Bounded harm because pendingScrollY is null for the new id, but worth iPhone QA stress test on a slow scroll-then-back-then-forward pattern.
- **🟡 NEW (session 100): The diagnostic console.log harness pattern is reusable.** When the next opaque bug surfaces, `console.log("[<feature>]", { state })` at every gate + decision point is a repeatable escalation move. Worth documenting as a recurring template if it fires twice.
- **🟡 CARRY (session 99→100): iPhone QA pass on /flagged final state** still untouched.
- **🟡 CARRY (session 99→100): docs/product-state.md** still uncommitted/mid-edit.
- **🟡 CARRY (session 99→100): Booth-bookmark removal from /flagged** beta watch-item.
- **🟡 CARRY (session 99→100): Per-find unsave only via /find/[id]** watch for sync gaps if user unsaves then quickly switches tabs.
- **🟡 CARRY (session 99→100): "Form-submit replaces autosave"** 2nd firing — Tech Rule promotion-ready.
- **🟢 CARRY (session 99→100): One-time component catalog inventory** still deferred.
- **🟡 CARRY (session 98→100): iPhone QA pass 4 watch-items still un-walked** — form-submit verb mismatch on /find/[id]/edit, side-by-side check overlay weight on /post/tag, dotted placeholder visual weight.
- **🟡 CARRY (session 98→100): Phase 2 Session F continuation** (HairlineDivider, MastheadShareButton unification, /design-system showcase). Not load-bearing.
- **🟡 CARRY (session 98→100): Extend vendor/admin masthead-retire rule** to /vendor-request, /post/edit/[id], /admin/login.
- **🟡 CARRY (session 98→100): R1 shopper accounts design pass** — still largest unblocked R-item.
- **🟢 CARRY (session 94→100): Scheduled VendorCTACard cleanup agent fires May 21** (`trig_017455nMVrTTZb6PxYnYcYZY`).
- 🟡 CARRY (session 92): `inspect-grants.ts` heuristic refinement.
- 🟡 CARRY (session 92): Migration 010 + 011 staging gap.
- 🟢 CARRY (session 92): AI-route auth deferred.
- 🟡 CARRY (session 91): `vendor_request_approved` admin actor lacking `_by_admin` suffix.
- 🟡 CARRY (session 91): Q-014 Metabase scoping.
- 🟡 CARRY (session 91): Q-015 admin Vendors tab.
- 🟡 CARRY (session 91): feed pagination — Wave 1 explicit out-of-scope.
- 🟡 CARRY (session 89): BoothHero pencil-vs-bookmark symmetry question. UNTOUCHED.
- 🟡 CARRY (session 88): motion design revisit. UNTOUCHED.
- 🟡 CARRY (session 88): preview-cache role audit. UNTOUCHED.
- 🟡 CARRY (session 87): wordmark asset-weight optimization (455KB).
- 🟡 CARRY (session 87): docs/design-system.md wordmark spec stale (now 72px height system-wide).

**Roadmap movement:** No new R-items shipped or moved. R1 hard prereqs all green. Roadmap unchanged at 8/15.

**Commits this session (18 runtime + close):**

| Commit | Message |
|---|---|
| `4b81e21` | feat(find-detail): Phase A — context handoff plumbing for swipe nav |
| `00cc749` | feat(find-detail): Phase B — swipe between nearby finds |
| `f02286b` | fix(find-detail): Phase B QA — pre-fetch neighbors so swipe paints metadata instantly |
| `8182599` | fix(find-detail): Phase B QA #2 — feed-load primes post cache, no extra round trips |
| `c549534` | fix(find-detail): Phase B QA #3 — RAF-defer slide-in so it starts after React commits |
| `2f7ec69` | fix(find-detail): Phase B QA #4 — drop slide animations entirely; useLayoutEffect for sync state |
| `8f941dd` | feat(find-detail): Phase C — extend swipe-context handoff to /flagged + /shelf + carousel |
| `699ea05` | fix(find-detail): Phase C QA — render More-from-this-booth carousel outside swipe wrapper |
| `824a913` | fix(find-detail): Phase C QA #2 — gate scroll-restore on carousel ready signal |
| `beb16bd` | fix(find-detail): Phase C QA #3 — move shelfReady reset to useLayoutEffect |
| `37a43b1` | fix(find-detail): Phase C QA #4 — ResizeObserver watchdog on scroll-restore |
| `33e53c9` | fix(find-detail): revert ResizeObserver watchdog → staircase retry timeouts |
| `4891e4f` | fix(find-detail): Phase C QA #5 — block onScroll writes during scroll-restore staircase |
| `c6202cd` | fix(find-detail): Phase C QA #6 — opt out of iOS Safari native scroll restoration |
| `bfc0236` | fix(find-detail): Phase C QA #7 — fix React #418 hydration mismatch in previewImageUrl init |
| `b9cb9bf` | diag(find-detail): add console.log instrumentation to scroll-restore |
| `c271c34` | fix(find-detail): Phase C QA #8 — sessionStorage popstate marker (Next.js bypass) |
| `6f04641` | chore(find-detail): strip scroll-restore diagnostic logs |
| (session close) | docs: session 100 close — /find/[id] navigation refinement |

---

## ✅ Session 99 (2026-05-01) — /flagged destination redesign + product-state.md scaffold + reference-first process + thesis articulation — 4 runtime commits + close (rotated to mini-block session 100 close)

> Full block rotated out at session 100 close. Net: 4 runtime commits across 3 arcs. **Arc 1** — `docs/product-state.md` scaffold (uncommitted; David mid-edit) drafted via Explore-agent inventory across 14 categories, 9-section ~3.5pg doc covering features/personas/benefits/selling-points/detractors-internal-honest + roadmap-framed/cross-references. **Arc 2 — /flagged destination redesign end-to-end**: 6 cross-domain references (Airbnb Wishlists / Letterboxd / Are.na / Cooper Hewitt / Atlas Obscura / Mubi) → David picked AirSplit-style two-button-card-footer pattern → V1 mockup (per-find vs grouped structural axis) → David sketch refines to booth-as-container + horizontal find rows + CTA inside → V2 mockup (3 frames varying CTA placement) → Frame C picked → 10-decision design record → ship: booth-as-container (paper-warm, hairline, 12px radius), Lora 21 booth name + TNR 21 weight 500 green booth #, no chevron, no booth-bookmark, horizontal find rows (62px polaroid + Lora 14 title 3-line + price right), no leaf bubble, outlined green "Explore the booth →" footer routing to /shelf/[slug], italic Lora editorial preamble "The search continues at these destinations." above the stack. New R3 event `flagged_booth_explored`. **Arc 3** — thesis articulated: *"taking the digital world as a tool to explore the real world"* — Treehouse is digital-to-physical bridge, not marketplace. NEW project memory: `project_treehouse_thesis_digital_to_physical_bridge.md`. NEW feedback memory: `feedback_reference_first_when_concept_unclear.md`. Behavior changes: booth-bookmark glyph + per-find unsave gesture both retired from /flagged.

_(Session 99 detailed beat narrative removed at session 100 close — see [`project_treehouse_thesis_digital_to_physical_bridge.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/project_treehouse_thesis_digital_to_physical_bridge.md) + [`feedback_reference_first_when_concept_unclear.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_reference_first_when_concept_unclear.md) + the session 100 block above for the navigation refinement that built on the /flagged destination work.)_

---


## ✅ Session 98 (2026-05-01) — Capture flow polish + flow-continuity system rule + form-submit conversion on /find/[id]/edit — 16 runtime commits + close (rotated to mini-block session 99 close)

> Full block rotated out at session 99 close. Net: 16 runtime commits across 3 arcs. **Arc 1 — 7-item capture-flow polish on /post/tag + /post/preview** (Find/Tag labels dropped, retake bumped 13→15, find polaroid hidden during Reading, StickyMasthead retire on /post/tag, tagImageDataUrl on PostDraft, Caption field dropped from /post/preview, find+tag side-by-side rendering when tag captured). **Arc 2 — System-level "one-screen, top-anchored, breathing room" rule applied across /find/[id]/edit + /post/preview + /post/tag**, with /post/tag side-by-side restructure (find with check overlay + tag dotted placeholder; same 2-column structure persists during Reading the tag — progression visible IN the layout). **Arc 3 — 1.2s minimum dwell on Reading the tag + owner pencil moves from photo corner bubble to inline next-to-title (no bg, then dialed bottom-right after David QA) + /find/[id]/edit converted from autosave to form-submit** ("Post changes" button, retire savedFlash + per-field error machinery + Replace photo path + polaroid display, reorder fields to Title/Price/Caption/Status, copy "Edit find details" / "Click submit when finished"). NEW promoted-via-memory: `feedback_admin_flow_one_screen_progression.md` (composites with `feedback_vendor_admin_internal_flow_no_share_masthead.md` from session 97 — both apply to vendor/admin internal flow surfaces).

_(Session 98 detailed beat narrative removed at session 99 close — see [`feedback_admin_flow_one_screen_progression.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_admin_flow_one_screen_progression.md) + the session 99 block above for the /flagged destination redesign that built on session 98's vendor/admin chrome simplification pattern.)_


---

## ✅ Session 97 (2026-05-01) — iPhone QA bundle from session 96 close + Edit your find layout restructure + hero bubble proportionality — 9 runtime commits + close (rotated to mini-block session 98 close)

> Full block rotated out at session 98 close. Net: 9 runtime commits across 3 arcs. **Arc 1 — 6-item iPhone QA bundle from session 96 close**: vendor-request Go-back drop, BottomNav green-on-authed Profile cue retired, FlagGlyph PiLeafBold → PiLeaf for lighter weight, /flagged filterHidesAllSaves → EmptyState primitive, /find/[id]/edit EditField visual chrome aligns with FormField. **Arc 2 — `/find/[id]/edit` layout restructure** mirroring /post/preview chrome (StickyMasthead + body title block + PolaroidTile at 62% paperCream contain + Replace-photo italic dotted Lora link below polaroid). **Arc 3 — Vendor/admin chrome retire + hero bubble proportionality**: StickyMasthead retired from /find/[id]/edit + /post/preview (replaced with /login-style plain inline back-button-only header per new vendor/admin internal flow rule); hero save bubble scaled 36→72 (proportional math, too big) → dialed to 44/22 (BookmarkBoothBubble hero precedent). NEW promoted-via-memory: `feedback_vendor_admin_internal_flow_no_share_masthead.md`.

_(Session 97 detailed beat narrative removed at session 98 close — see [`feedback_vendor_admin_internal_flow_no_share_masthead.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_vendor_admin_internal_flow_no_share_masthead.md) + the session 98 block above for the form-submit + flow-continuity work that built on session 97's vendor/admin chrome simplification, including a second extension of the chrome rule to /post/tag.)_

---

## ✅ Session 96 (2026-05-01) — Phase 2 design-system hardening: Sessions C+D+E end-to-end + F partial — 23 commits + close (rotated to mini-block session 97 close)

> Full block rotated out at session 97 close. Net: 23 runtime commits across five arcs. **Session C** shipped `<EmptyState>` primitive (6 commits, 4 surfaces × 5 callsites). **Session D** shipped `<FormField>` + `<FormButton>` primitives across 9 form surfaces (10 commits, ~-141 net lines, retired Buttons.tsx, two-tier scale `size: 'page' | 'compact'`, page label upright Lora 15 / compact 13 ink-mid, input bg `v1.postit`, page CTA shadow `v1.shadow.ctaGreen` / compact `ctaGreenCompact`). **Session E** retired v0.2 cool-cream palette from /vendor/[slug] + /post/edit (2 commits — zero v1.x-layer consumers of v0.2 tokens remain). **Session F partial** stripped IM Fell stale comments across 17 files (Lora replaced IM Fell at session 82 — comments were rot). 2 mid-session iPhone QA fixes on /vendor-request: photo dropzone bg → `v1.postit` + owner-ack card → `v1.postit` + radius 14. 3 API expansions on FormField/formInputStyle when callers hit constraints mid-migration (boxSizing/lineHeight defaults, `label` prop ReactNode, fontSize differentiated by tier). NEW promoted-via-memory: `feedback_verify_primitive_contract_via_grep.md` (4 firings sessions 95+96 crossed promotion threshold).

_(Session 96 detailed beat narrative removed at session 97 close — see [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md) + [`feedback_verify_primitive_contract_via_grep.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_verify_primitive_contract_via_grep.md) + the session 97 block above for the iPhone QA followup that closed the Sessions C+D+E QA loop and surfaced the Edit your find layout restructure.)_


## Recent session tombstones (last 5)

> Older tombstones live in [`docs/session-archive.md`](docs/session-archive.md). Sessions 28–43 still awaiting archive-drift backfill (one-liner only); sessions 44–53 + 56 in archive (54 + 55 + 57–99 still missing — operational backlog growing). Session 95 mini-block retired at session 100 close. Visible window now sessions 96–99 mini + 100 full.

- **Session 100** (2026-05-02) — /find/[id] navigation refinement: tap = step in / swipe = look around / back = return to spot: 18 runtime commits across two phases + 8 QA cycles. **Phase A** — context handoff plumbing (`lib/findContext.ts` sessionStorage blob with originPath / findRefs / cursorIndex). **Phase B** — swipe gesture, ending in 4 QA cycles at the "drop slide animations entirely" architecture: drag-during-gesture only (motion.div follows finger), framer-motion auto-snap-back via dragConstraints, useLayoutEffect for sync state commit, no transition state between finds. **Phase C** — extended swipe context to /flagged + /shelf/[slug] + the More-from-this-booth carousel (re-scopes context to that booth's catalog when tapped), plus 8 scroll-restore QA cycles to crack iOS Safari + Next.js App Router edge cases (carousel out of motion.div, shelfReady gate, useLayoutEffect reset, ResizeObserver→staircase, write-block during restore, history.scrollRestoration=manual, hydration mismatch, sessionStorage popstate marker bypassing Next.js's internal history calls). NEW feedback memories: `feedback_nextjs_internal_history_calls_clobber_flags.md` + `feedback_browser_api_in_useState_initializer_hydration.md`. Cap-speculative-patching memory **VIOLATED** (8 rounds before escalating to console.log diagnostics; should have escalated at round 4-5). Final flow: tap any tile → /find/[id] paints fully on first frame; drag horizontally → swipe to prev/next find with no history growth; back → exact original feed scroll position.
- **Session 99** (2026-05-01) — /flagged destination redesign + product-state.md scaffold + reference-first process + thesis articulation: 4 runtime commits across 3 arcs. **Arc 1** — `docs/product-state.md` scaffold (uncommitted; David mid-edit) drafted via Explore-agent inventory across 14 categories, 9-section ~3.5pg doc covering features/personas/benefits/selling-points/detractors-internal-honest + roadmap-framed/cross-references. **Arc 2 — /flagged destination redesign end-to-end (4 commits)**: 6 cross-domain references (Airbnb Wishlists / Letterboxd / Are.na / Cooper Hewitt / Atlas Obscura / Mubi) → David picked AirSplit-style two-button-card-footer pattern → V1 mockup (per-find vs grouped structural axis) → David sketch refines to booth-as-container + horizontal find rows + CTA inside → V2 mockup (3 frames varying CTA placement) → Frame C picked → 10-decision design record → ship: booth-as-container (paper-warm, hairline, 12px radius), Lora 21 booth name + TNR 21 weight 500 green booth #, no chevron, no booth-bookmark, horizontal find rows (62px polaroid + Lora 14 title 3-line + price right), no leaf bubble, outlined green "Explore the booth →" footer routing to /shelf/[slug], italic Lora editorial preamble "The search continues at these destinations." above the stack. New R3 event `flagged_booth_explored`. **Arc 3** — thesis articulated: *"taking the digital world as a tool to explore the real world"* — Treehouse is digital-to-physical bridge, not marketplace. NEW project memory: `project_treehouse_thesis_digital_to_physical_bridge.md`. NEW feedback memory: `feedback_reference_first_when_concept_unclear.md` (4–6 cross-domain references BEFORE drafting any HTML mockup when concept is unclear). Behavior changes: booth-bookmark glyph + per-find unsave gesture both retired from /flagged.
- **Session 98** (2026-05-01) — Capture flow polish + flow-continuity system rule + form-submit conversion on /find/[id]/edit: 16 runtime commits across 3 arcs. **Arc 1 — 7-item capture-flow polish on /post/tag + /post/preview** (Find/Tag labels dropped, retake bumped 13→15, find polaroid hidden during Reading, StickyMasthead retire on /post/tag, tagImageDataUrl on PostDraft, Caption field dropped from /post/preview, find+tag side-by-side rendering when tag captured). **Arc 2 — System-level "one-screen, top-anchored, breathing room" rule applied across /find/[id]/edit + /post/preview + /post/tag**, with /post/tag side-by-side restructure (find with check overlay + tag dotted placeholder; same 2-column structure persists during Reading the tag). **Arc 3 — 1.2s minimum dwell on Reading the tag + owner pencil moves from photo corner bubble to inline next-to-title (bottom-right after David QA) + /find/[id]/edit converted from autosave to form-submit** ("Post changes" button, retire savedFlash + Replace photo path + polaroid display, reorder fields to Title/Price/Caption/Status, copy "Edit find details" / "Click submit when finished"). NEW promoted-via-memory: `feedback_admin_flow_one_screen_progression.md` (composites with `feedback_vendor_admin_internal_flow_no_share_masthead.md` from session 97).
- **Session 97** (2026-05-01) — iPhone QA bundle from session 96 close + Edit your find layout restructure + hero bubble proportionality: 9 runtime commits across 3 arcs. **Arc 1 — 6-item iPhone QA bundle**: vendor-request Go-back drop, BottomNav green-on-authed Profile cue retired, FlagGlyph PiLeafBold → PiLeaf for lighter weight, /flagged filterHidesAllSaves → EmptyState primitive, /find/[id]/edit EditField visual chrome aligns with FormField. **Arc 2 — `/find/[id]/edit` layout restructure** mirroring /post/preview (StickyMasthead + body title block + PolaroidTile at 62% paperCream contain + Replace-photo italic dotted Lora link). **Arc 3 — Vendor/admin chrome retire + hero bubble proportionality**: StickyMasthead retired from /find/[id]/edit + /post/preview per new vendor/admin internal flow rule; hero save bubble scaled 36→72 (proportional math) → dialed to 44/22 (BookmarkBoothBubble hero precedent). NEW promoted-via-memory: `feedback_vendor_admin_internal_flow_no_share_masthead.md`.
- **Session 96** (2026-05-01) — Phase 2 design-system hardening: Sessions C+D+E end-to-end + F partial: 23 runtime commits across five arcs. **Arc 1 — Session C `<EmptyState>`:** mockup-first, 6 commits, 4 surfaces × 5 callsites. **Arc 2 — Session D `<FormField>` + `<FormButton>`:** 10 commits, ~-141 net lines, 9 form surfaces (login/email + admin/login + vendor-request + post/preview + setup + EditBoothSheet + AddBoothSheet + AddBoothInline + BoothFormFields), Buttons.tsx retired, two-tier scale `size: 'page' | 'compact'`, page label upright Lora 15 / compact 13 ink-mid, input bg `v1.postit`, page CTA shadow `v1.shadow.ctaGreen` / compact `ctaGreenCompact`. **Arc 3 — mid-session iPhone QA fixes** on /vendor-request: photo dropzone bg + owner-ack card. **Arc 4 — Session E palette:** /vendor/[slug] + /post/edit migrated to v1.x tokens (zero v1.x-layer consumers of v0.2 cool-cream tokens remain). **Arc 5 — Session F partial:** IM Fell stale comment rot strip across 17 files. NEW promoted-via-memory: feedback_verify_primitive_contract_via_grep.md. 3 API expansions on FormField/formInputStyle when callers hit constraints mid-migration.
_(Sessions 93 + 94 + 95 tombstones rotated off at session 99 + 100 closes — sessions 87–99 missing from `docs/session-archive.md`; backfill remains operational backlog.)_

---

## CURRENT ISSUE
> Last updated: 2026-05-02 (session 100 close — /find/[id] navigation refinement: tap = step in / swipe = look around / back = return to spot. 18 runtime commits across two phases + 8 QA cycles. Phase A = context handoff plumbing (lib/findContext.ts sessionStorage blob). Phase B = swipe gesture, ending at "drop slide animations entirely" architecture (drag-during-gesture only, useLayoutEffect for sync state commit, framer-motion auto-snap-back). Phase C = extended swipe context to /flagged + /shelf/[slug] + More-from-this-booth carousel (re-scopes context per origin), plus 8 QA cycles to crack iOS Safari + Next.js App Router edge cases. Final flow: tap any tile → /find/[id] paints fully on first frame; drag horizontally → swipe to prev/next find with no history growth; back → exact original feed scroll position. NEW feedback memories: feedback_nextjs_internal_history_calls_clobber_flags.md + feedback_browser_api_in_useState_initializer_hydration.md. Cap-speculative-patching memory VIOLATED — 8 rounds before escalating to console.log diagnostics; should have escalated at round 4-5.)

**Working tree:** clean (after close commit). `docs/product-state.md` remains uncommitted/mid-edit by David (carry from session 99). **Build:** green. **Beta gate:** unblocked. **Net change this session:** 18 runtime commits + close. Navigation refinement is shipped end-to-end. Phase 2 design-system hardening unchanged at 5/6 sessions complete. R1 hard prereqs still all green from session 92. Roadmap unchanged at 8/15.

### 🚧 Recommended next session — iPhone QA on full nav refinement + carry-forwards from sessions 99-100 (~45–75 min)

Walk the full session-100 navigation refinement on real device end-to-end across all four entry paths. Then pick up the session-99 carry-forwards (still untouched: /flagged final state QA + product-state.md continuation) OR pivot to R1.

**Why this shape:**
- 8 QA cycles got us through the major edge cases but a clean cold-start walk across all entry paths (Home / /flagged / /shelf/[slug] / carousel) is needed to lock in confidence. Especially: rapid-fire swiping, edge-of-list bounce-back, vertical scroll passthrough, carousel horizontal scroll preserved, browser back from N-deep peer-nav landing at original feed scroll.
- /flagged + product-state.md from session 99 are both still untouched and both should be cleared before R1.
- R1 is still the largest unblocked R-item.

**Plan (in order):**

1. **🖐️ HITL — iPhone QA on session-100 navigation (~15–20 min):**
   - **From Home:** scroll feed → tap a find → drag horizontally to swipe to next/prev → continue swiping 5+ times → browser back → land at original Home feed scroll position.
   - **From /flagged:** tap any saved find → swipe across saved finds (should move through saved order, not feed order) → back → /flagged at original scroll.
   - **From /shelf/[slug] Window view:** tap a tile → swipe across that booth's posts → back → booth at original scroll.
   - **From /shelf/[slug] Shelf view (horizontal carousel):** tap a tile → swipe → back.
   - **From "More from this booth" carousel inside /find/[id]:** tap a card → land on new find → swipe → context now scoped to booth → back → previous /find/[id] at original scroll.
   - **Edge cases:** swipe at first/last find in context (should snap back, no nav). Direct URL paste to /find/[id] (no swipe affordance, behaves as today). Vertical scroll over photo + body (should pass through, not trigger swipe). Carousel horizontal scroll (should not trigger page swipe).
   - **/my-shelf:** untouched, no swipe (vendor-self surface).
2. **Address concrete issues from #1.** Likely 0–2 small commits.
3. **Move to /flagged final-state QA + product-state.md** (carry from session 99) OR pivot to R1.

### Alternative next moves (top 4)

1. **/flagged + product-state.md carry-forwards** (~30–45 min). Cold-walk /flagged final state from session 99 (multi-booth, All-Kentucky-Locations scope, filterHidesAllSaves empty state, editorial preamble plurality, "Explore the booth →" CTA + flagged_booth_explored event). Then either David finishes product-state.md himself OR hands back for thesis-led restructure.
2. **R1 (shopper accounts) design pass** (~60–80 min, mockup-first + reference-first). Largest unblocked R-item. Thesis sharpens framing: shopper accounts = "track places to return to," not "save listings."
3. **One-time component catalog inventory** (~60–90 min). Shadcn / Origin UI / Aceternity / Mobbin → `docs/component-catalog.md`. Compounds with reference-first pattern.
4. **Extend vendor/admin masthead-retire** to /vendor-request + /post/edit/[id] + /admin/login. ~30 min.

Full alternatives + operational backlog in [`docs/queued-sessions.md`](docs/queued-sessions.md).

### Session 101 opener (pre-filled — iPhone QA on full nav refinement + session-99 carry-forwards)

```
PROJECT: Treehouse Finds — Zen-Forged/treehouse-treasure-search — app.kentuckytreehouse.com
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Sentry · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE: iPhone QA on full session-100 navigation refinement across all four entry paths (Home / /flagged / /shelf/[slug] / More-from-this-booth carousel) — drag horizontally to swipe between finds, browser back to original feed scroll position, no history growth across swipes. Then carry-forwards from session 99 (/flagged final-state QA + product-state.md continuation), or pivot to R1.

NEW BEHAVIOR (session 100): /find/[id] now supports drag-horizontally-to-swipe between adjacent finds within the user's browsing context. Tap any tile → /find/[id] paints fully on first frame (cache hit + sync state). Drag horizontally → swipe to prev/next find via router.replace (no history growth). Below threshold release → spring back to center. Browser back → exact original feed scroll position via popstate detection + scroll-restore staircase. Context handoff via lib/findContext.ts sessionStorage blob. Carousel "More from this booth" re-scopes context to that booth's catalog when tapped. /my-shelf untouched (vendor-self surface, no swipe).

NEW MEMORIES (session 100): (a) feedback_nextjs_internal_history_calls_clobber_flags.md — Next.js App Router internal pushState/replaceState during route transitions clobbers JS-flag-based popstate detection; use sessionStorage marker instead. (b) feedback_browser_api_in_useState_initializer_hydration.md — sessionStorage/localStorage in useState initializer causes React #418/#423 hydration mismatch; default to null and read in useLayoutEffect.

CAP-SPECULATIVE-PATCHING VIOLATION (session 100): went 8 rounds before escalating to console.log diagnostic instrumentation. Should have escalated at round 4-5. Rule (feedback_cap_speculative_patching_at_3_rounds): when each QA cycle reports "still wrong" with no narrowing of the problem space, instrument, don't patch.

PROBLEMS SESSION 100 ALREADY SOLVED — don't accidentally revive: (a) /find/[id] motion.div has NO slide animations. Just drag="x" + dragConstraints={left:0,right:0} + dragElastic=0.4 + dragMomentum=false. handleSwipeEnd does ONLY track + router.replace; framer-motion's auto-snap-back handles below-threshold release. (b) ShelfSection (More-from-this-booth) is rendered OUTSIDE the motion.div as a sibling — its native horizontal scroll must NOT be inside the swipe wrapper. (c) Page-level useLayoutEffect on [id] commits sync state BEFORE paint: setPreviewImageUrl, setPost (cache hit/miss branches), setLoading, setPrevId, setNextId, setShelfReady(false). DO NOT move these to useEffect (post-paint) — would break scroll-restore. (d) previewImageUrl useState initializer is null. NEVER read sessionStorage in initializer (hydration mismatch). (e) Popstate detection uses sessionStorage marker `th_popstate_pending` (timestamped). DO NOT revert to a JS module-scope flag with monkey-patched pushState/replaceState wrappers — Next.js's internal history calls flip the flag false. (f) history.scrollRestoration = 'manual' set on /find/[id] mount — opts out of iOS Safari native scroll restoration. (g) findScrollWriteBlocked = true held through scroll-restore staircase window (raf + 100/300/600ms) so onScroll listener doesn't write the clamped value back to sessionStorage. (h) Shared post cache lives in lib/findContext.ts module scope (setPostCache / getPostCache / clearPostCache). Populated by Home loadFeed, /flagged loadPosts, /shelf/[slug] page mount, /find/[id] fetch effect on cache miss, ShelfSection's getVendorPosts. Cleared per-id by /find/[id]/edit + /post/edit/[id] on PATCH success. (i) getFeedPosts + getPostsByIds + getVendorPosts SELECTs all match getPost shape (vendor.user_id + vendor.bio + mall.address). (j) WindowView + ShelfView in BoothPage.tsx accept optional swipeOriginPath prop — when set, derive findRefs from posts and write findContext on tile tap. /my-shelf omits the prop (no swipe).

PROBLEMS SESSION 99 ALREADY SOLVED — don't accidentally revive: (a) /flagged is NOT a 3-col polaroid grid. Each booth is a paper-warm container (1px hairline, 12px radius, no scrim) floating on page paperCream. Booth header = Lora 21 booth name + TNR 21 weight 500 green booth number, no bullet, no chevron, NO booth-bookmark glyph. Find rows are HORIZONTAL: 62px polaroid + Lora 14 title 3-line clamp + Lora 14 priceInk price right-aligned. NO leaf bubble on each find row. Footer = outlined green "Explore the booth →" button routing to /shelf/[slug]. Editorial preamble "The search continues at these destinations." (b) Booth-bookmark glyph RETIRED from /flagged. (c) Per-find unsave gesture RETIRED from /flagged. (d) New R3 event flagged_booth_explored fires on CTA tap.

PROBLEMS SESSION 98 ALREADY SOLVED — don't accidentally revive: (a) /find/[id]/edit is form-submit, NOT autosave. Single handleSubmit. Subtitle "Click submit when finished" + button "Post changes". On success router.replace(/find/[id]). Field order: Title, Price, Caption, Status, Remove from shelf. (b) /find/[id] owner edit pencil sits at bottom-right of title block. Photo-corner bubble for owners DELETED. (c) /post/tag has plain inline <header>. Side-by-side find polaroid + dotted tag placeholder. Find polaroid HIDDEN during isExtracting. Min 1.2s dwell on "Reading the tag…". (d) /post/preview has NO Caption field. (e) PostDraft has tagImageDataUrl. (f) Vendor/admin internal flow rule applied to /login, /login/email, /post/preview, /find/[id]/edit, /post/tag.

DESIGN RULE (session 98 carry): Admin/vendor flow surfaces should fit one viewport, top-anchor content consistently, leave 14-18px breathing room. Memory: feedback_admin_flow_one_screen_progression.md.

PROBLEMS SESSION 97 ALREADY SOLVED: (a) /find/[id] hero save bubble 44×44 / FlagGlyph 22 / margin top:10 right:10. (b) FlagGlyph uses PiLeaf. (c) BottomNav Profile icon NOT tinted green. (d) /flagged filterHidesAllSaves uses <EmptyState> primitive.

PROBLEMS SESSION 96 ALREADY SOLVED: (a) <EmptyState> primitive 4 surfaces × 6 callsites. (b) <FormField> + <FormButton> own 9 form surfaces. Buttons.tsx RETIRED. (c) v1.shadow.ctaGreen / ctaGreenCompact tokens. (d) /vendor/[slug] + /post/edit palette is v1.x (zero v0.2 consumers).

PROBLEMS SESSION 95 ALREADY SOLVED: (a) v1.x tokens at lib/tokens.ts include shadow/gap/radius/icon scales. (b) MASTHEAD_HEIGHT exported. (c) <PolaroidTile> primitive 6+ callsites. (d) Wordmark 72px in StickyMasthead.

PROBLEMS SESSION 94/93/92 ALREADY SOLVED: (a) /post/preview retired PostingAsBlock + PhotographPreview, postit input bg, direct redirect after publish. (b) /login = triage cards, /login/email = OTP form. (c) BoothHero clean (no on-photo Pencil/Trash/scrim). EditBoothSheet has "Booth photo" section. (d) /api/vendor-hero + /api/post-image require auth+ownership. /api/my-posts/[id] PATCH multi-booth-safe. (e) Migrations 016+017+018 applied; OTP 600s + password min 8.

ALTERNATIVES IF DEFERRED: (1) /flagged + product-state.md carry-forwards from session 99. (2) R1 shopper accounts design pass. (3) Component catalog inventory. (4) Extend vendor/admin masthead retire.

CARRY-FORWARDS FROM SESSIONS 78–100: **Navigation refinement on /find/[id] complete (session 100)** — drag-to-swipe between finds with no history growth, browser back to original feed scroll. Phase 3 scroll-restore CLOSED (sessions 85+86, /find/[id] now extended in session 100 with the staircase + write-block + history.scrollRestoration=manual + sessionStorage popstate marker). Wordmark `public/wordmark.png` 72px in StickyMasthead. MASTHEAD_HEIGHT calc constant 103. ~13 ecosystem back-button surfaces 44px with ArrowLeft 22. /post/preview + /find/[id]/edit + /post/tag + /login + /login/email use plain inline <header>. <PolaroidTile> primitive owns Home masonry + /flagged thumbnails + /shelf/[slug] tiles + /post/tag + /post/preview polaroids. PostDraft has tagImageDataUrl. <EmptyState> primitive 4 surfaces × 6 callsites. <FormField> + <FormButton> own 9 form surfaces. /find/[id]/edit form-submit. Caption field RETIRED from /post/preview. /find/[id] owner pencil bottom-right of title block. /login = triage. /login/email = OTP. EditBoothSheet supports mode={"admin"|"vendor"}. /api/vendor-hero + /api/post-image require auth+ownership. RLS enabled on every public table. Migrations 016+017+018 applied. OTP 600s + password min 8. R5a getFeedPosts 30-day window. /flagged is booth-as-container (session 99). preview-cache pattern (treehouse_find_preview:${id}). **Shared post cache (lib/findContext.ts module scope) survives swipe-driven router.replace.** **Swipe-context handoff via lib/findContext.ts sessionStorage blob (originPath / findRefs / cursorIndex).** BoothLockupCard owns /shelves only. IM Fell retired from runtime UI. v0.2 colors zero v1.x consumers. AI routes deliberately unauthed. Treehouse thesis: digital-to-physical bridge (project_treehouse_thesis_digital_to_physical_bridge.md). Tech Rules queue: 0 🟢, ~35 🟡.

SCHEDULED AGENT: trig_017455nMVrTTZb6PxYnYcYZY fires Thu May 21 9:00 AM EDT — checks if VendorCTACard still unused → opens cleanup PR if so.

PHASE 2 PLAN STATE: Sessions A+B (95) + C+D+E (96) DONE. Session F PARTIAL. 5/6 sessions complete.
```

---

## KNOWN GAPS ⚠️ (active only)

### 🔴 Pre-beta blockers

*(Empty. T4d pre-beta QA walk re-passed session 46 end-to-end — all five exit criteria clean. Q-007 Window Sprint also remains passed per sessions 40–41. Featured banner reads restored session 48. Q-008 shopper share shipped session 50 (QA walk deferred to session 51, but non-gating — code is landed and the walk is verification not revision). No code-level regressions. Beta invites remain technically unblocked after session 50.)*

### 🟡 Remaining pre-beta polish (operational, not code-gating)

- **NEW PRIMARY (session 100): iPhone QA on full navigation refinement** — cold-walk all four entry paths (Home / /flagged / /shelf/[slug] window+shelf views / More-from-this-booth carousel). Verify: drag-to-swipe between adjacent finds, edge-of-list snap-back, vertical scroll passthrough, carousel horizontal scroll preserved, browser back to original feed scroll, no-history-growth across N-deep peer-nav, /my-shelf untouched.
- **NEW (session 100): The wasRecentPopstate(800ms) window is conservatively wide** — false-positive only fires if user clicks back AND a Link within 800ms; bounded harm because pendingScrollY=null gates it. Worth iPhone QA stress test on slow scroll-then-back-then-forward.
- **NEW (session 100): The diagnostic console.log harness pattern is reusable** — `console.log("[<feature>]", { state })` at every gate + decision point as a recurring escalation move. Worth documenting as a template if it fires again.
- **NEW (session 100): getPostsByIds + getVendorPosts SELECT extensions** — added vendor.user_id + vendor.bio + mall.address. Slight payload bump (~30-100 bytes/post). If feed pagination ever fires (R5b), reconsider whether all rows need the full join.
- **NEW (session 100): Phase D candidate** — extend swipe-context handoff to /post/preview if vendor-self peer-nav becomes desirable. Currently /my-shelf and other vendor surfaces deliberately omit. Beta watch-item.
- **CARRY (session 99→100): iPhone QA on /flagged final state** — cold-start across multi-booth + All-Kentucky-Locations scope + filterHidesAll empty state + editorial preamble plurality.
- **CARRY (session 99→100): Booth-bookmark glyph removed from /flagged** — beta watch-item.
- **CARRY (session 99→100): Per-find unsave only via /find/[id]** — watch for sync gaps.
- **CARRY (session 99→100): "Form-submit replaces autosave"** — 2nd firing. Tech Rule promotion-ready.
- **CARRY (session 99→100): docs/product-state.md uncommitted/mid-edit** — David will either finish + commit, or hand back for thesis-led restructure.
- **CARRY (session 98→99): iPhone QA pass 4** — verify form-submit conversion on /find/[id]/edit (Status pills don't save instantly + caption empty-string nullifies + title validation), side-by-side check + dotted layout on /post/tag (1.2s dwell + check overlay weight + dotted placeholder visual weight), pencil bottom-right placement on /find/[id], + flow-continuity goal across /post/tag + /post/preview + /find/[id]/edit (do titles land at the same vertical position now?).
- **NEW (session 98): Verb mismatch on /find/[id]/edit** — subtitle "Click submit when finished" + button "Post changes." Shipped per literal directive. If reads off, harmonize either direction (button → "Submit" OR subtitle → "Tap Post changes when finished").
- **NEW (session 98): Status toggle behavior shift** — pills no longer save instantly; vendor must tap Post changes. The "Marked sold" confirmation banner is gone (was tied to immediate-write). Watch for vendor confusion in beta feedback.
- **NEW (session 98): Caption empty-string nullifies existing caption** — typing then deleting caption + submitting writes null to caption column. Acceptable but worth verifying.
- **NEW (session 98): /find/[id]/edit on iPhone SE (375×667)** — with caption auto-grow on long captions, page might still scroll despite headroom tightening. Rule is "aim for one screen" not "force fit."
- **NEW (session 98): Check overlay tuning** — 32×32 frosted-paper bubble + green Check 16px on /post/tag find polaroid. Easy dial-back to 28×28 with 14px Check if too prominent.
- **NEW (session 98): Dotted placeholder visual weight** — 2px dashed minimal style. Easy swap to "Option B" with paperWarm frame if too sparse on real device.
- **CARRY (session 97→98): /vendor-request, /post/edit/[id], /admin/login still use StickyMasthead** — session 98 extended the vendor/admin-internal-flow rule to /post/tag; these 3 are next candidates but require David's explicit ask.
- **NEW (session 98): "Form-submit replaces autosave when batch save provides clearer mental model"** — single firing as a model-choice. Tech Rule on second firing.
- **NEW (session 98): "Side-by-side progression layout — same outer structure across flow steps with placeholder slots that fill"** — single firing.
- **NEW (session 97): "Per-context sizing on a swept primitive"** — 3rd firing across sessions 82 + 96 + 97. Tech Rule promotion-ready.
- **NEW (session 97): "User-references-existing-page as the spec, not a fresh mockup"** — first firing. Tech Rule on second firing.
- **NEW (session 97): "Ship a reasonable midpoint when math gives an unbounded answer; accept dial-back"** — first firing.
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

> **Sprint 4 fully closed sessions 40–41; sessions 42–53 ran the pre-beta polish arc; sessions 54–69 carried the polish + observability + brand + navigation + persistence + terminology + caption-typography + Option B booth-identity sweep; session 70 was the largest layout-redesign sweep in recent memory; session 71 closed three independent decision arcs; session 72 rationalized admin entry; session 73 closed R3 end-to-end; session 74 closed the Gemba-walk admin-management gap; sessions 75 + 76 closed David-redirect bundles end-to-end; session 77 shipped Track D phases 1–4 + the masthead 5-attempt arc; session 78 shipped Track D phase 5 end-to-end. Session 79 was net-zero (Track D extension attempt reverted). Session 80 closed a David-redirect bundle (5 items + 2 polish). Session 81 closed the demo-prep refinement bundle. Session 82 closed the largest design-system consolidation pass since the v1.x layer was named. Session 83 closed the polaroid evolved tile direction end-to-end. Session 84 was the first pure-security session since R12 Sentry. Session 85 closed Phase 3 scroll-restore on 2 of 3 surfaces. Session 86 closed the third — /my-shelf admin scroll-restore — in 1 fix commit + 1 cleanup after Safari Web Inspector via USB connected. Session 87 reconciled the Tech Rule queue (17 → 33 candidates) and shipped the brand asset overhaul. Session 88 closed the Tech Rule promotion batch end-to-end + bumped the wordmark height + ran a 9-commit animation/scroll-restore arc that ended in David's "pull out all the animations" call. Session 89 was a design intentionality pass — 9 runtime commits across two arcs. Session 90 was the auth-chrome relocation pass — 7 runtime commits relocating auth chrome off masthead onto BottomNav Profile tab + /login. Session 91 was the strategic-reset + Wave 1 cleanup pass — 13 runtime commits, roadmap moved 3/15 → 8/15. Session 92 was the Wave 1 follow-up + Wave 1.5 security continuation — 11 runtime commits across two arcs; R1 shopper accounts FULLY UNBLOCKED. Session 93 was the login triage cleanup — 1 runtime commit splitting `/login` into triage + `/login/email` for the OTP form. Session 94 was the capture-and-add-find UX refinement — 4 runtime commits with masthead +40 + wordmark 90 system-wide. Session 95 was the design system audit + Phase 2 A+B — 13 runtime commits across Phase 1 audit + Phase 2 plan + Session A token foundation + Session B `<PolaroidTile>` primitive (6 callsites, ~250 lines deleted) + cross-session login redirect fix + wordmark trim 90→72. Session 96 was the largest Phase 2 push of the project — 23 runtime commits across Sessions C+D+E end-to-end + F partial (EmptyState + FormField/FormButton + palette migrations + IM Fell comment rot strip). Session 97 was the iPhone QA followup + Edit your find layout restructure + hero bubble proportionality — 9 runtime commits across 3 arcs (6-item QA bundle + /find/[id]/edit layout restructure mirroring /post/preview + vendor/admin chrome retire promoted-via-memory + hero save bubble 44/22 dial). Session 98 was the capture-flow polish + flow-continuity system rule + form-submit conversion on /find/[id]/edit — 16 runtime commits across 3 arcs. Session 99 was the /flagged destination redesign + product-state.md scaffold + reference-first process change + thesis articulation — 4 runtime commits. **Session 100 was the /find/[id] navigation refinement — 18 runtime commits across two phases + 8 QA cycles. Phase A: context handoff plumbing via lib/findContext.ts sessionStorage blob. Phase B: drag-to-swipe gesture, ending at the "drop slide animations entirely" architecture per `feedback_total_strip_after_iterative_refinement_fails`. Phase C: extended swipe context to /flagged + /shelf/[slug] + the More-from-this-booth carousel + 8 scroll-restore QA cycles to crack iOS Safari + Next.js App Router edge cases (carousel-out-of-motion-div, shelfReady gate, useLayoutEffect reset, ResizeObserver→staircase, write-block during restore, history.scrollRestoration=manual, useState-initializer hydration mismatch, sessionStorage popstate marker bypassing Next.js's internal history calls). Final flow: tap any tile → /find/[id] paints fully on first frame; drag horizontally → swipe to prev/next find with no history growth; back → exact original feed scroll position. NEW feedback memories: feedback_nextjs_internal_history_calls_clobber_flags.md + feedback_browser_api_in_useState_initializer_hydration.md. Cap-speculative-patching memory VIOLATED — went 8 rounds before escalating to console.log diagnostics; should have escalated at round 4-5.** Smallest→largest commit sequencing now **40+ firings** total, promoted-via-memory at session 88. Mid-session iPhone QA on Vercel preview now **~11 firings**, also promoted-via-memory. **Next natural investor-update trigger point** is still after R1 (shopper accounts) lands — Phase 2 sits at 5/6 complete with primitive layer fully shipped; the visual-system is on solid enough footing that R1's design pass can ride on shipped primitives instead of fighting drift, and the digital-to-physical bridge thesis (session 99) sharpens R1's framing (shopper accounts as "track places to return to," not "save listings"). The session-100 navigation refinement is itself a meaningful investor-narrative beat — "the app feels physical, not page-y" is now demonstrable end-to-end.
