## HOW TO START A NEW SESSION

1. Run `th` in Terminal — reads CLAUDE.md and copies to clipboard
2. Open claude.ai → New conversation
3. Paste the opener below, fill in CURRENT ISSUE from clipboard

```
PROJECT: Treehouse — Zen-Forged/treehouse-treasure-search — treehouse-treasure-search.vercel.app
STACK: Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Anthropic SDK · Supabase · SerpAPI · Vercel
Filesystem MCP is connected at /Users/davidbutler/Projects/treehouse-treasure-search
Read CLAUDE.md, CONTEXT.md, and docs/DECISION_GATE.md. Then run the session opening standup from MASTER_PROMPT.md.

CURRENT ISSUE:
[paste here]
```

## HOW TO END A SESSION

Tell Claude: "close out the session" then run `thc`

---

## TERMINAL COMMAND FORMATTING CONVENTION
> Whenever Claude surfaces multiple terminal commands that must be run in sequence, they MUST be broken out into separate code blocks — one command per block. This lets David copy each command individually without accidentally running the next one before verifying the previous succeeded. Applies to deploy checklists, QA sequences, debug scripts, and HITL steps.

**Do this:**

```bash
npm run build 2>&1 | tail -30
```

```bash
git add -A && git commit -m "..." && git push
```

```bash
npx vercel --prod
```

**Not this:**

```bash
npm run build 2>&1 | tail -30
git add -A && git commit -m "..." && git push
npx vercel --prod
```

Exception: A single chained command with `&&` stays in one block (that's one atomic action by design).

---

## CURRENT ISSUE
> Last updated: 2026-04-19 (session 25 — v1.1k `/admin/login` orphan resolved; v1.1l `site_settings` migration applied; on-device verification of featured-banner uploads on Home + Find Map passed)

**Status:** ✅✅ **Session 25 closed the last two loose ends from the v1.1k + v1.1l sprints.** Session 23's CLAUDE.md claimed `app/admin/login/page.tsx` shipped but the file was never actually written — a repeat of the session 13 `lib/imageUpload.ts` orphan pattern. Discovered when the session opener's QA walk of `/admin/login` returned a 404. One commit shipped: the missing file, written from session 23's documented spec against v1.1k primitives (Mode C chrome, paper-wash logo bubble with Shield glyph, form input primitive, filled green CTA, signing-in bridge). In parallel, the `supabase/migrations/004_site_settings.sql` migration (committed in session 24 as 🖐️ HITL) was applied — David ran it in the Supabase SQL editor, verified the `site-assets` bucket exists + public, then uploaded hero banners for both Home (Featured Find, eyebrow variant) and Find Map (hero banner, overlay variant). Both render live on device. Build was green before push; Vercel deploy confirmed live on prod.

**Next session (26) opens with David's choice from the candidate queue.** No active iteration pending, no design debt, no pre-beta blockers. The v1.1l design pass is fully landed and verified on device. The longest-parked item remaining is KI-003 (vendors posting under stale identity after approval), which has been on hold since session 18. Sprint 4 tail (T4c remainder, T4b admin consolidation, T4d pre-beta QA walk) is also ready to batch now that design debt is cleared.

### What shipped this session (one commit)

**Discovery:** Session opener ran the v1.1k QA walk from CLAUDE.md. David hit `/admin/login` direct URL on iPhone — 404. Also noticed no hero banners on Home or Find Map (separate issue). Investigation revealed two independent orphans:

1. `app/admin/login/page.tsx` was never on disk. Session 23 documented it as shipped + HITL `mkdir -p` was confirmed run, but the actual `filesystem:write_file` never landed — classic session-13 pattern. `/admin/page.tsx`'s unauth-gate redirect (session 23 surgical edit) was pointing at the missing route.

2. `site_settings` table and `site-assets` Storage bucket did not exist in Supabase. The `004_site_settings.sql` migration from session 24 is a 🖐️ HITL step that must be applied manually in the SQL editor — it hadn't been run. `getSiteSettingUrl()` was hitting a missing table and silently returning null, so both featured banners collapsed invisibly. This was not a bug — the component is designed to collapse cleanly when data is absent — but it left David with an unexpected visual state because the migration hadn't been communicated as a pre-deploy blocker for v1.1l to actually render.

**Fix 1 — `app/admin/login/page.tsx` written from the v1.1k (g) spec:**
- `filesystem:create_directory` on `app/admin/login/` first (session 23 noted this was required)
- `filesystem:write_file` of the full page against the documented spec
- Two states: PIN entry + signing-in bridge (matches `/login` confirming state exactly for visual parity)
- Mode C chrome: back-arrow paper bubble top-left, paper-wash 44px logo bubble with `lucide-react Shield` glyph (green stroke + 15% green fill — audience cue differentiating from the curator leaf on `/login`), "Admin Sign in" IM Fell 28px, italic "Enter your PIN to continue." subhead
- v1.1k form input primitive with password-dot treatment: 22px centered, 0.4em letter-spacing, `FONT_SYS`
- Filled green "Sign in as Admin" CTA with inline Shield glyph (commit action per v1.1k (c))
- Inline red banner for errors, auto-clears on next keystroke
- Fine print at bottom: "Admin access only. Curators sign in here." — the last two words are an IM Fell italic dotted-underline text link to `/login`, matching v1.1k end-of-path vocabulary
- Auth flow unchanged: POST `/api/auth/admin-pin` with `{pin}` → server returns `{otp, email}` → client calls `supabase.auth.verifyOtp({email, token, type: "email"})` → `router.replace("/admin")` on success

**Parallel 🖐️ HITL — `004_site_settings.sql` applied:**
- David ran the full migration in the Supabase SQL editor
- Verified `site_settings` table created with seed rows (`featured_find_image_url`, `find_map_banner_image_url` both `{"url": null}`)
- Verified `site-assets` Storage bucket exists and is set to **public**
- Logged into `/admin` → Banners tab → uploaded images for both settings
- Confirmed on device: Home now shows "Featured Find" eyebrow + banner image; Find Map now shows overlay variant with "Find Map" title rendered 30px white IM Fell over the uploaded image

### Discipline note — why the orphan got through

The session-14 Tech Rule (*"A session is not closed until `npm run build` has run green against the committed state"*) passed in session 23. Build was green. The missed file was still missed because:

- `/admin/page.tsx`'s unauth redirect is a runtime string (`router.push("/admin/login")`), not an import. TypeScript has no way to verify the target route exists.
- Next.js's build step does not validate that every internal navigation target resolves to a page file. An orphan redirect builds fine.
- The CLAUDE.md close template lists files as shipped without a verification step. The Docs agent writes what was attempted, not what was verified on disk.

The session-14 Tech Rule as written is *necessary but not sufficient*. A proposed amendment lands in DECISION_GATE this session — see below.

### New Tech Rule proposal (promoted to DECISION_GATE this session)

> **File-creation verify at session close.** When a session's CLAUDE.md update declares that a NEW file was created (not edited), the Docs agent MUST verify the file's presence on disk via `filesystem:list_directory` or `filesystem:read_text_file` before `thc`. The build-check rule does not catch missing page routes, missing API routes whose callers reference them only via fetch strings, or any file referenced by runtime string rather than import. Verification is one tool call per new file — cheap insurance against the orphan pattern that bit sessions 13, 23, and would have bitten session 24 if v1.1l had declared a new file it didn't actually write.

### v1.1l — sprint that shipped in session 24, documented for the first time here

Session 24 was not explicitly opened as its own session (no `thc` between 23 and 24), but a full v1.1l design+feature sprint landed in commit `9edc897` on 2026-04-18 against David's on-device QA walk of v1.1k. `docs/design-system.md` advanced v1.1k → v1.1l with a seven-point Status paragraph. The commit message: `feat(v1.1l): StickyMasthead + FeaturedBanner + Find Map polish + post-it Times New Roman`. 18 files changed, 1205 insertions, 256 deletions. Summarizing here for continuity since CLAUDE.md did not have a session-24 close block before this one:

**v1.1l primitives (new):**
- **`<StickyMasthead>`** (`components/StickyMasthead.tsx`) — shared scroll-linked masthead chrome replacing six inline implementations. Scroll-linked bottom hairline: transparent at rest, fades in to `1px inkHairline` once `window.scrollY > 4`. `scrollTarget` prop for Booth pages (which use an overflow-auto container, not window scroll). Transition `border-color 0.2s ease`.
- **`<FeaturedBanner>`** (`components/FeaturedBanner.tsx`) — admin-editable hero banner primitive. Two variants: **eyebrow** (title above image as separate text block — Home "Featured Find") and **overlay** (title over image in IM Fell 30px white with text-shadow — Find Map "Find Map" title). 16px radius, 10px horizontal inset. Eyebrow: ~200px min-height, no scrim. Overlay: ~180px min-height, top-down `rgba(18,34,20)` scrim for white-text legibility. Graceful collapse when `imageUrl` is null.
- **`site_settings` data model** — keyed-row table with jsonb values. Two initial keys: `featured_find_image_url` (Home) and `find_map_banner_image_url` (Find Map). Public-readable, service-role-write via new `/api/admin/featured-image` route. Images stored in new `site-assets` Storage bucket (public). Migration: `supabase/migrations/004_site_settings.sql`. Read helper: `lib/siteSettings.ts` (`getSiteSettingUrl`, `getAllBannerUrls`).
- **`FeaturedBannerEditor`** (inlined in `app/admin/page.tsx`) — admin-UI upload component, one per setting key. `/admin` now has three tabs: Requests · Posts · Banners (new).

**v1.1l Find Map polish (on-device walk from v1.1k/j):**
- Spine line now connects the last `<Stop>` down to the closer circle (was open air — read as trailing off, not as "the trip ends here")
- Closer composition changes: circle + copy share one grid row, vertically centered (was stacked)
- Closer copy retires "End of the map. Not the end of the search." in favor of the tagline fragment **"Embrace the Search. Treasure the Find."** — first place in the product where the tagline surfaces as page copy
- X glyph strokeWidth 1.5 → 2.2 on both Find Map spine X and Find Detail vendor-row X — matches weight of the terminal closer circle
- Vendor name italic retires — IM Fell non-italic 18px mid-ink, parity with non-italic mall name

**v1.1l post-it font — partial v1.1j reversal to Times New Roman:**
- 36px numeral on post-it goes to `Times New Roman, Times, serif` (narrow exception from v1.1j's `FONT_SYS` swap)
- `FONT_SYS` at 36px on the post-it read as "system chrome on a post-it" — the material gesture needed a serif
- Times New Roman has a clearly-disambiguated `1` (solving the original "1 vs I" IM Fell bug) AND is a widely-available system serif with no extra font load
- **Scope limited to 36px post-it numeral only.** Inline pills (Find Detail `<Pill>`, Find Map `<BoothPill>`) stay on `FONT_SYS` per v1.1j — at small inline sizes the label context ("Booth" adjacent) disambiguates.
- Token: `FONT_POSTIT_NUMERAL` in `lib/tokens.ts`

**v1.1l post-it auto-scale for long booth numbers:**
- 36px for ≤4 digits, 28px for 5 digits, 22px for 6 digits
- Letter-spacing `-0.01em` all sizes
- Helper `boothNumeralSize(boothNumber)` in `lib/utils.ts`
- Applied in both Find Detail and BoothPage post-its

**v1.1l BottomNav idle-tab color:**
- `#8a8476` (v0.2 `textMuted`) → `v1.inkMuted` (`#6b5538`)
- One-line fix; full Nav Shelf rework still held for its own sprint

**Files touched v1.1l (18 files, 9edc897):**
- NEW: `components/StickyMasthead.tsx`, `components/FeaturedBanner.tsx`, `app/api/admin/featured-image/route.ts`, `lib/siteSettings.ts`, `supabase/migrations/004_site_settings.sql`
- MODIFIED: `lib/tokens.ts`, `lib/utils.ts`, `app/page.tsx`, `app/flagged/page.tsx`, `app/find/[id]/page.tsx`, `app/my-shelf/page.tsx`, `app/shelf/[slug]/page.tsx`, `components/BoothPage.tsx`, `components/BottomNav.tsx`, `app/admin/page.tsx`, `docs/design-system.md` (v1.1k → v1.1l)

### Files touched this session (25)
- `app/admin/login/page.tsx` — NEW (session 23's documented-but-missing file, finally on disk)
- `supabase/migrations/004_site_settings.sql` — APPLIED (🖐️ HITL ran this session; committed with v1.1l but never executed against Supabase until now)
- `site_settings` table + `site-assets` bucket — created in Supabase; two banner images uploaded via admin UI
- `CLAUDE.md` (this file) — session 24 (v1.1l) documented retroactively; session 25 close added; session 23 archive block annotated with orphan honesty note
- `docs/DECISION_GATE.md` — new Tech Rule: "File-creation verify at session close"; Risk Register updated (v1.1k orphan row resolved; session-14 build-check rule amended)

### Session 25 close HITL — already complete

1. ✅ `app/admin/login/page.tsx` written to disk (verified via `filesystem:list_directory` before commit — new verify discipline applied)
2. ✅ `npm run build` — green
3. ✅ Commit pushed to main: `fix(v1.1k): create missing app/admin/login/page.tsx (session-23 orphan)`
4. ✅ Vercel deploy triggered and confirmed live
5. ✅ On-device QA: `/admin/login` renders correctly, PIN sign-in lands on `/admin`, `/admin` unauth gate redirects here (not `/login`)
6. ✅ `004_site_settings.sql` applied via Supabase SQL editor; `site-assets` bucket verified public
7. ✅ Home banner uploaded + verified on device
8. ✅ Find Map banner uploaded + verified on device
9. ✅ This CLAUDE.md update (final HITL: `thc` to commit the docs update)

### Session 26 candidate queue

- **26A — KI-003 diagnosis** (vendors posting under stale identity after approval). Longest-parked item; pre-beta blocker. No longer blocked by any design work. Likely top of queue.
- **26B — Sprint 4 tail batch** (T4c copy polish remainder + T4b admin surface consolidation + T4d pre-beta QA walk of all three flows). Design debt is now empty; T4b becomes cleaner because `/admin/login` is a real dedicated route whose fate (keep dedicated vs. fold into `/admin` unauth gate) is a specific decision rather than an abstract one.
- **26C — `<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Mechanical work against a committed primitive; ~2 hours.
- **26D — Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **26E — Post-beta candidates surfacing now that design is landed:** 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal, feed pagination, ToS/privacy, error monitoring (Sentry or structured logs).
- **26F — Docs agent housekeeping:** `CONTEXT.md` is now ~18 sessions stale (last updated 2026-04-07, pre-v1.1); the existing "stale" call-out in Known Gaps is becoming a persistent risk. Worth a dedicated 30-minute refresh session that brings CONTEXT.md up to v1.1l so new-session openers have accurate architecture context, not just CLAUDE.md session state.

**Recommended:** 26A first (KI-003 diagnosis). It's been parked longest, it's the only remaining pre-beta tech blocker, and the design work that was consuming bandwidth across sessions 15–24 is now fully landed. Clearing KI-003 puts the product at a genuine beta-ready state.

---

## ARCHIVE — What was done earlier (2026-04-18, session 24 — v1.1l StickyMasthead + FeaturedBanner + Find Map polish + post-it Times New Roman)
> Session 24 was documented retroactively in session 25's close (above). Shipped in commit `9edc897`. 18 files, 1205 insertions, 256 deletions. See session 25 "v1.1l" summary above for full detail.

**Close HITL that did NOT run at the time:** The `004_site_settings.sql` migration was committed as 🖐️ HITL but never applied. The featured banners shipped as code but rendered invisibly (graceful-collapse path) until David ran the migration in session 25. Worth noting: the graceful-collapse was correct behavior — broken UI would have been worse — but the HITL instruction was buried in a comment header inside the SQL file rather than surfaced in CLAUDE.md's close HITL list. Future sprints that include a required Supabase migration should list it as an explicit HITL step in the session-close checklist, not just inside the file.

---

## ARCHIVE — What was done earlier (2026-04-18, session 23 — v1.1k activation flow pass)

**Status at the time:** ✅✅ *(Session claimed the v1.1k activation flow pass shipped in full: `/vendor-request`, `/login`, `/setup`, new `/admin/login`. Build green, commit pushed.)*

**Correction logged session 25:** `app/admin/login/page.tsx` was documented as shipped but was never on disk. The `mkdir -p` ran successfully in this session — that part is verified — but the subsequent `filesystem:write_file` call did not actually land the file. The build remained green because `/admin/page.tsx`'s unauth-gate redirect to `/admin/login` is a runtime string, not an import, so TypeScript and Next.js build steps had no way to catch the broken target. This was the same class of bug as session 13's `lib/imageUpload.ts` orphan. Session 25 wrote the file from the documented spec; it is now on disk and verified on device. DECISION_GATE Tech Rules gained a new file-creation verify step this session.

The four files that DID ship correctly in session 23: `app/vendor-request/page.tsx` (full rewrite), `app/login/page.tsx` (full rewrite, ~35% shorter), `app/setup/page.tsx` (full rewrite), and `app/admin/page.tsx` (one-line surgical redirect update). Everything below this line is session 23's original close copy preserved as historical record; the `app/admin/login/page.tsx` claim in it is known false.

### What shipped this session (one commit, per session 23 close — ACCURACY NOTE ABOVE)

**`docs/design-system.md` — v1.1j → v1.1k:**
Version bumped in header (v1.1j → v1.1k; session 23). New Status paragraph at top with eight lettered commitments:
(a) **Mode C resolved for task-first surfaces.** v1.0 header-pattern system committed Mode C for `/post`, `/post/preview`, `/vendor-request`, `/setup`, `/login` but didn't specify interior grammar. v1.1k commits: back-arrow paper bubble (`v1.iconBubble` 38px) top-left, no masthead wordmark, no diamond dividers, no post-it, no cartographic glyphs. Editorial voice (`FONT_IM_FELL`) carries titles/subheads/end-of-path; precise voice (`FONT_SYS`) carries form fields/inputs/email echoes/timers/errors.
(b) **Paper-wash 60px success bubble primitive.** `rgba(42,26,10,0.04)` bg, 0.5px `v1.inkHairline` edge, glyph in `v1.inkPrimary`. Generalizes the v1.1f paper-variant icon bubble to hero scale. Retires SaaS success-toast green chrome across activation flow.
(c) **Filled green CTA — commit actions only.** `v1.green` bg + white `FONT_SYS` 15px 500 weight, 14px radius. Reserved for commit actions: Request access, Email me a code, Sign in as Admin, Go to my shelf. End-of-path actions become IM Fell italic dotted-underline text links.
(d) **Form input primitive.** White translucent `rgba(255,253,248,0.70)` bg, 1px `v1.inkHairline` border (focus 1.5px `v1.inkPrimary`; error 1.5px `v1.redBorder`), 14px radius, 14×14px padding, `FONT_SYS` 16px. Labels above in IM Fell italic 13px `v1.inkMuted` with natural sentence casing.
(e) **Email echo line primitive.** Horizontal row (not a card): 14px mail glyph `v1.inkMuted` + "Sent to " + email (`FONT_SYS` 14px `v1.inkPrimary` 500 weight), 12px vertical padding, 0.5px `v1.inkHairline` rules above/below.
(f) **Mode C tab switcher retires.** Rounded-pill `Email code / Admin PIN` tab switcher on `/login` retires entirely. Admin PIN moves to new dedicated `/admin/login` route. `/login` becomes curator-only.
(g) **`/admin/login` scope committed.** New route, dedicated PIN entry surface. Three states: PIN entry, signing-in bridge, inline error. Composition: Mode C chrome + logo mark with shield glyph + "Admin Sign in" title + PIN input + filled green CTA + signing-in paper-wash bubble. *(Finally shipped session 25.)*
(h) **`<MallSheet>` migration to `/vendor-request` deliberately deferred.** Native HTML `<select>` used in v1.1k. Sprint 5 sub-sprint bundles migration with `/post` + `/post/preview` consumers.

Pattern retirement log: v0.2 `greenLight`/`greenBorder` success check-bubble chrome; rounded-pill tab switcher on `/login`; uppercase + tracked-letter-spacing form labels; green info boxes.

---

## ARCHIVE — What was done earlier (2026-04-18, session 22A — v1.1j QA polish pass)

**`docs/design-system.md` — v1.1i → v1.1j:** Six-point Status paragraph. (a) Diamond ornament retires from every divider. (b) Booth numbers switch to `FONT_SYS` globally (1-vs-I disambiguation). (c) `/my-shelf` Window View renders 9-cell placeholder composition for owner. (d) `<AddFindTile>` joins Shelf View for owner (reverses session-18 commitment). (e) Find Map closer closes the loop (spine drop + 16px terminal circle). (f) Home masthead left-slot logo enlarges 24/0.72 → 34/0.92.

**Tool-environment reinforced:** Box-drawing anchor bug in `filesystem:edit_file` fired four times this session. Workaround: drop rule line from anchor, use unique code content instead. Proposed Tech Rule promotion (finally landed session 24/25 era — see DECISION_GATE).

---

## ARCHIVE — What was done earlier (2026-04-18, session 21A — v1.1i code sprint + v1.1i-polish)

**Status:** ✅✅ v1.1i shipped in two same-session commits. Commit 1: `<MallSheet>` primitive NEW + `app/page.tsx` full rewrite (paper masonry + feed hero) + Find Detail 3B sold landing state + `app/flagged/page.tsx` `isSold` retirement + `components/MallHeroCard.tsx` DELETED. Commit 2: sticky mastheads across 5 pages + MallSheet centering fix (transform-free `left:0/right:0/margin:0 auto`) + subtle paper-tone drop-shadows on product photographs (tile-strength + hero-strength).

**Three-part v1.1i sold contract locked:** bookmark key kept when a saved find sells + Find Map tile renders identically to available + Find Detail 3B IS the reveal. Breaking any one breaks all three. Documented in `docs/design-system.md` v1.1i and in-file on `FindTile` in `app/flagged/page.tsx`. Do NOT add a status filter to `getPostsByIds`.

---

## ARCHIVE — What was done earlier (2026-04-18, session 20)
> Pure design-direction session; v1.1i spec committed to `docs/design-system.md`; two mockups on disk; no production code changed. Fully realized in code by session 21A.

David picked **C2** for the feed treatment and **3B** for the sold landing state. Five questions settled: all-malls hero copy ("Finds from across Kentucky"), sold retired from shopper discovery, MallSheet All row no-glyph, feed first-load defaults to All malls, frosted hearts always visible on tiles. Follow-on questions: 3B Find Detail, `/shelf/[slug]` keeps sold for vendor story, Find Map keeps bookmark + tile + uses 3B.

---

## ARCHIVE — What was done earlier (2026-04-18, session 19A)

Token consolidation cleanup. `lib/tokens.ts` extended with canonical `v1` + `fonts` (`FONT_IM_FELL`, `FONT_SYS`) exports alongside v0.2 `colors`. Inline `v1` objects retired from `app/find/[id]/page.tsx`, `app/flagged/page.tsx`, `components/BoothPage.tsx`. `BoothPage.tsx` re-exports the symbols so `/my-shelf` and `/shelf/[slug]` imports resolve unchanged.

---

## ARCHIVE — What was done earlier (2026-04-18, session 18 — v1.1h Booth page redesign)

Both `/my-shelf` and `/shelf/[slug]` rebuilt: banner as pure photograph with booth post-it pinned to it (cross-page primitive shared with Find Detail), vendor display name as IM Fell 32px page title, small pin-prefixed mall+address block, Window View (3-col 4:5 grid) + Shelf View (horizontal scroll 52vw/210px tiles with 22px left padding on first tile). Four v0.2 components DELETED: `<LocationStatement>`, `<BoothLocationCTA>`, `<ExploreBanner>`, `<TabSwitcher>`. `components/BoothPage.tsx` NEW, shared between both Booth pages. Georgia cleared from last major surface.

---

## ARCHIVE — What was done earlier (2026-04-18, session 17)

Find Detail v1.1e/v1.1f on-device polish (app-wide background to paperCream globally, masthead Title Case, frosted on-image save+share bubbles, status pill retirement, post-it relocation bottom-right with push pin + stacked "Booth Location" eyebrow + `+6deg` rotation). Find Map v1.1g full redesign of `/flagged` (Mode A masthead, "Find Map" subheader, intro voice, pin+mall anchor, X-glyph itinerary spine, `Booth [NNN pill]` rows, find tiles with frosted hearts + prices + sold treatment, chapter-break closer). Glyph hierarchy locked: pin = mall, X = booth.

---

## ARCHIVE — What was done earlier (2026-04-18, session 16)

Find Detail v1.0 code build + 4 iteration passes v1.0 → v1.1d. BottomNav minimal chrome patch (paperCream translucent bg + inkHairline border). Nav-shelf exploration mockup (4 approaches, still held for David review). Critical tool lesson: `create_file` in the container does NOT write to the Mac filesystem; `filesystem:write_file` is the only reliable write tool. Documented in DECISION_GATE.

---

## ARCHIVE — What was done earlier (2026-04-17, session 15)
> Design direction relocked; `docs/design-system.md` v1.0 committed; Find Detail spec locked in mockup; no production code changed.

Tagline anchor committed: **Embrace the Search. Treasure the Find. Share the Story.** Cartographic vocabulary committed (pin = mall, X = booth). Material vocabulary committed (booth post-it as one skeuomorphic signature per find). Typography rewritten (IM Fell English editorial, Caveat rare, system-ui precise data, Georgia + Mono retired from ecosystem). Paper as surface (no card chrome). v0.2 pattern retirement log.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 14)

Booth page v0.2 redesign shipped (`<LocationStatement>`, `<BoothLocationCTA>`, `<ShelfGrid>` rewrite, `<TabSwitcher>` relabeling). `lib/imageUpload.ts` reconstructed mid-session — session-13 orphan pattern (file documented as shipped but never committed). New Tech Rule added: *"A session is not closed until `npm run build` has run green against the committed state of the repo."* Session 25 amends this rule — see DECISION_GATE file-creation verify addition.

---

## ARCHIVE — What was done earlier (2026-04-17 late-night, session 13)
> KI-004 resolved, in-mall diagnostic tooling shipped, toast visual polish.

`app/api/admin/diagnose-request/route.ts` NEW. `app/api/admin/vendor-requests/route.ts` REWRITE (constraint-aware approval). `app/admin/page.tsx` REWRITE (Diagnose links, inline DiagnosisPanel, toast polish). `docs/admin-runbook.md` NEW with 9 SQL recipes.

**Fix policy for vendor approval (still committed):**
- Booth collision + unlinked + name match → safe claim
- Booth collision + unlinked + name differs → reject with named details
- Booth collision + already linked → hard reject
- Slug collision → auto-append `-2`, `-3`… up to 20 attempts
- All recovery paths use `.maybeSingle()` not `.single()`
- Error responses include `diagnosis` code + `conflict` object for UI rendering

## Image uploads
- `lib/imageUpload.ts` is the single source of truth. Import `compressImage` and `uploadPostImageViaServer`. Never write another copy.
- `uploadPostImageViaServer` THROWS on failure. Callers MUST try/catch and abort the post/update on throw. Never write a post row with image_url: null.
- `lib/posts.ts:uploadPostImage` is deprecated (anon client, can't see bucket through RLS). Don't use.
- `lib/posts.ts:uploadVendorHeroImage` is orphaned. Safe to delete next sprint.

---

## ARCHIVE — Earlier sessions (1–12)
> Condensed — full history available in git log

- **Session 12** — Design agent first direction pass; `docs/design-system.md` v0.2 (later rewritten v1.0 session 15)
- **Session 11** — Design agent activated; `docs/design-system.md` scaffolded
- **Session 10** — `/setup` 401 race polish; T4c orphan cleanup A/B/E
- **Session 9** — KI-001, KI-002, KI-003 resolved; Flow 2 end-to-end verified
- **Session 8** — Onboarding scope-out (`docs/onboarding-journey.md`); T4a email infrastructure
- **Session 7** — `/admin` mobile-first approval polish (T3); full database reset
- **Session 6** — Custom domain `app.kentuckytreehouse.com` live; OTP 6-digit primary auth path
- **Session 5** — `emailRedirectTo` fix; `safeRedirect(next, fallback)` helper
- **Session 4** — DNS pivot to Shopify-authoritative; Resend → Supabase SMTP
- **Session 3** — Resend account setup; DNS migration decision
- **Session 2** — Setup flow status-filter bug fix
- **Session 1** — RLS-blocked vendor-request flow fix; admin API hardening

---

## INVESTOR UPDATE SYSTEM
- **Google Drive folder:** https://drive.google.com/drive/folders/1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW
- **Folder ID:** `1l2toRdb-1sKCuYcJ25OKYzMqNMu2kBWW`
- **Cadence:** End of each sprint (weekly once beta launches)
- **Trigger:** Say "generate investor update" at session close
- **Process doc:** Notion → Agent System Operating Manual → 📋 Investor Update — Process & Cadence

---

## PROJECT OVERVIEW

**Two independent layers:**
1. **Ecosystem** (front door, warm parchment theme): feed, vendor profiles, mall pages, post flow → Supabase
2. **Reseller intel** (dark forest theme, untouched): scan → identify → comps → decide → localStorage only

**Operator note:** David Butler is an **online reseller** (Zen Forged LLC, ZenForged Finds online sales). He is not a physical storefront operator at any mall. In-person vendor onboarding sessions are deliberate scheduled meetups, not incidental. This matters for scoping — "in person" is a product choice, not a default.

**Tagline (committed session 15):** *Embrace the Search. Treasure the Find. Share the Story.* Anchored in `docs/DECISION_GATE.md`. First surfacing as page copy: Find Map closer, v1.1l.

**Onboarding canonical spec:** See `docs/onboarding-journey.md` for the three committed flows (Pre-Seeded, Demo, Vendor-Initiated).

**Design canonical spec:** See `docs/design-system.md` v1.1l for the visual + interaction system. All multi-screen UI work scopes against it before code. **v1.1l (session 24)** commits the `<StickyMasthead>` + `<FeaturedBanner>` primitives, admin-editable hero banners for Home and Find Map via `site_settings` keyed rows, Find Map closer rework (spine connects to terminal circle + tagline copy), X glyph strokeWidth bump, vendor-name italic retire on Find Map, post-it 36px numeral to Times New Roman with digit-count auto-scale, and BottomNav idle-tab color into v1 ink scale.

**Admin runbook:** See `docs/admin-runbook.md` for in-mall SQL triage recipes.

---

## STACK
```
Next.js 14 App Router · TypeScript · Tailwind CSS · Framer Motion
Anthropic SDK (claude-opus-4-5) · Supabase (Postgres + Storage + Auth) · SerpAPI · Vercel
lucide-react (Heart, Send, Store, Home, LayoutGrid, Stethoscope, Shield, Image, Upload, Loader icons)
Resend (dual use: SMTP provider for Supabase Auth OTP emails,
         AND direct Resend REST API for transactional emails via lib/email.ts)

Design v1.0 fonts (sessions 16+):
  IM Fell English (editorial voice) · Caveat (rare handwritten beats) · system-ui (precise data)
  Loaded via Google Fonts in app/layout.tsx.

v1.1l addition:
  Times New Roman (narrow exception for 36px post-it numeral only — token FONT_POSTIT_NUMERAL)
```

---

## ENV VARS
```
NEXT_PUBLIC_SUPABASE_URL         https://zogxkarpwlaqmamfzceb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbGci... (full JWT — in .env.local and Vercel)
NEXT_PUBLIC_ADMIN_EMAIL          david@zenforged.com
NEXT_PUBLIC_SITE_URL             https://app.kentuckytreehouse.com (for lib/email.ts absolute URLs)
NEXT_PUBLIC_DEV_VENDOR_EMAIL     vendor@test.com (optional)
ANTHROPIC_API_KEY                Claude Vision + caption generation
SERPAPI_KEY                      eBay sold comps
ADMIN_PIN                        Server-only PIN for admin login
SUPABASE_SERVICE_ROLE_KEY        Server-only service role key (REQUIRED for /api/admin/* + /api/setup/* + /api/vendor-request + /api/admin/featured-image)
RESEND_API_KEY                   Server-only Resend API key for lib/email.ts transactional emails (session 8)
EBAY_CLIENT_ID                   eBay direct API (not yet wired)
EBAY_CLIENT_SECRET               eBay direct API (not yet wired)
```

**SMTP note:** Resend SMTP credentials live in Supabase Auth → SMTP Settings (for OTP emails). Resend API key in Vercel env (for `lib/email.ts` transactional emails).

---

## DNS STATE (as of 2026-04-17)

**Registrar:** Squarespace Domains
**Authoritative nameservers:** Shopify's default nameservers
**DNSSEC:** Off

Key records (via Shopify DNS): A `@` → `23.227.38.65`, CNAME `app` → Vercel, Resend DKIM + SPF + MX on `send`/`resend._domainkey`. Full record list in session-14 archive.

**Dormant:** Cloudflare account has nameservers assigned but is not authoritative. Leftover from session 3's Path B plan.

---

## SUPABASE
- **Tables:** malls, vendors, posts, vendor_requests — RLS ENABLED ✅ — **site_settings (v1.1l, RLS disabled by design, anon-read service-role-write)**
- **vendor_requests RLS:** service-role-only (`USING (false) WITH CHECK (false)`) — must be accessed via `/api/*` routes
- **site_settings table (v1.1l):** `key text PRIMARY KEY, value jsonb, updated_at timestamptz, updated_by uuid`. Seed rows: `featured_find_image_url`, `find_map_banner_image_url` (both `{"url": null}` initially). Anon reads OK, writes via service role via `/api/admin/featured-image`.
- **Storage buckets:**
  - `post-images` — PUBLIC (vendor post images)
  - `site-assets` — PUBLIC (admin-uploaded hero banners, v1.1l)
- **Auth:** Magic link (OTP) via email, 6-digit code entry is primary path since session 6.
- **Malls:** 29 locations seeded (KY + Clarksville IN)
- **Primary mall:** America's Antique Mall, id: `19a8ff7e-cb45-491f-9451-878e2dde5bf4`, slug: `americas-antique-mall`
- **Extra columns vendors:** `facebook_url text`, `user_id uuid`, `hero_image_url text`, `bio text`
- **Unique constraints on vendors** (ALL FOUR):
  - `vendors_pkey` PRIMARY KEY (id)
  - `vendors_slug_key` UNIQUE (slug) — globally unique; auto-suffix on collision per session 13
  - `vendors_mall_booth_unique` UNIQUE (mall_id, booth_number) — pre-flight checked on approve
  - `vendors_user_id_key` UNIQUE (user_id) — one vendor row per auth user

---

## AUTH & SERVER API PATTERN

**Client → Server auth bridge (Option B — bearer header):**
- Client: import `authFetch` from `@/lib/authFetch`
- Server: first line of every `/api/admin/*` handler: `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
- For auth-required-but-not-admin routes: `requireAuth()`

**Redirect-preservation pattern (session 5):**
- `lib/auth.ts → sendMagicLink(email, redirectTo?)` appends path as `&next=`
- `app/login/page.tsx → safeRedirect(next, fallback)` validates same-origin relative paths only

**Email pattern (session 8):**
- `lib/email.ts` — Resend REST API wrapper. Best-effort delivery.

**Vendor approval pattern (session 13 — KI-004):**
- `/api/admin/vendor-requests` POST performs pre-flight booth check before insert
- Slug collisions auto-resolve via suffix loop
- All collision errors return `{error, diagnosis, conflict}` for UI rendering

**Admin sign-in pattern (v1.1k session 23 + v1.1k-fix session 25):**
- `/admin/login` route — dedicated PIN entry for admin audience
- POST `/api/auth/admin-pin` with `{pin}` → server verifies + returns `{otp, email}`
- Client calls `supabase.auth.verifyOtp({email, token, type: "email"})` → `router.replace("/admin")`
- `/admin` unauth gate redirects here (not `/login`)

**Featured banner pattern (v1.1l session 24):**
- `lib/siteSettings.ts:getSiteSettingUrl(key)` — anon read, returns `string | null`
- `/api/admin/featured-image` POST `{base64DataUrl, settingKey}` — admin-only upload + site_settings upsert
- `<FeaturedBanner>` renders null when URL is absent (graceful collapse)

---

## WORKING ✅
- Discovery feed, magic link auth, Admin PIN login (via `/admin/login`), OTP delivery
- Magic link `?redirect=` param preserved across round trip
- My Booth, Post flow, Post preview, Find detail, Public shelf
- Vendor request flow, Vendor account setup, admin approval workflow
- RLS — 12 policies + vendor_requests (service role only); site_settings intentionally no RLS (public read, service-role write)
- Rate limiting — `/api/post-caption` 10 req/60s, `/api/vendor-request` 3 req/10min, `/api/auth/admin-pin` 5 req/min per IP
- Custom domain `app.kentuckytreehouse.com`
- Branded email templates for Magic Link and Confirm Signup
- Agent roster: Dev · Product · Docs · Design active
- KI-001, KI-002, KI-003, KI-004 all resolved
- Flow 2 onboarding end-to-end verified working on iPhone
- `/setup` 401 race absorbed with retry+backoff
- Design agent activated, `docs/design-system.md` at **v1.1l** (sessions 15–24)
- Admin diagnostic UI, `docs/admin-runbook.md` with 9 SQL recipes

### Design v1.1l — shipped + verified on device (session 24 + session 25 verification)
- **`<StickyMasthead>`** primitive — all 6 mastheads migrated (Home, Find Map, Find Detail normal, Find Detail 3B, My Shelf, Public Shelf). Scroll-linked bottom hairline: transparent at rest, fades in past `scrollY > 4`. Booth pages pass a `scrollTarget` ref for their overflow-auto scroll container.
- **`<FeaturedBanner>`** primitive — Home "Featured Find" (eyebrow variant) + Find Map hero banner (overlay variant). Both admin-editable via `/admin` → Banners tab. Session 25 uploaded images for both; both render live.
- **`site_settings` table + `site-assets` storage bucket** — migration `004_site_settings.sql` applied in session 25 via Supabase SQL editor. Bucket verified public.
- **`/api/admin/featured-image`** upload route — admin-gated, writes to `site-assets`, upserts `site_settings` row.
- **Find Map closer rework** — spine connects to terminal 16px filled circle; copy + circle in one grid row vertically centered; copy now `"Embrace the Search. Treasure the Find."` (tagline surfacing first time in-product).
- **X glyph strokeWidth 1.5 → 2.2** — Find Map spine X and Find Detail vendor-row X. Matches terminal circle weight.
- **Vendor name italic retires on Find Map** — IM Fell non-italic 18px, parity with mall name.
- **Post-it 36px numeral font** — Times New Roman (narrow exception from v1.1j `FONT_SYS` swap; `FONT_POSTIT_NUMERAL` token). Post-it pills stay on `FONT_SYS`.
- **Post-it numeral auto-scale** — `boothNumeralSize(boothNumber)` helper: 36px ≤4 digits, 28px 5, 22px 6.
- **BottomNav idle color** — `v1.inkMuted` (`#6b5538`), no longer `#8a8476`.

### Design v1.1k — activation flow pass (session 23 + orphan fix session 25)
- **`/vendor-request`** — Mode C chrome, v1 palette, IM Fell intro + success editorial, `FONT_SYS` form fields, v1.1k form input primitive, filled green "Request access" CTA, paper-wash success bubble + email echo line + italic dotted-underline text links (no filled CTA on success).
- **`/login`** — curator-only (PIN tab retired). `/login` + `?redirect=/setup` KI-003 fix intact. paper-wash logo bubble with leaf logo + "Curator Sign in" IM Fell 28px. OTP entry: `FONT_SYS` 28px with 0.4em tracking, auto-verifies on 6th digit, paste-clipboard text link, resend row.
- **`/admin/login`** — NEW dedicated route. Paper-wash logo bubble with Shield glyph (differentiated audience cue), "Admin Sign in" title, password input 22px centered 0.4em tracking, filled green "Sign in as Admin" CTA with inline Shield. Signing-in bridge paper-wash + spinner.
- **`/setup`** — Mode C centered-hero, paper-wash success bubble + "Welcome to your shelf." (no name; mall in subhead carries personalization), filled green "Go to my shelf" + 3s auto-redirect. Error: red-retoned same bubble + italic error copy + try-again/back-to-sign-in text links.
- **`/admin` unauth gate redirect** — `/login` → `/admin/login` (one-line session-23 edit; target finally exists session 25).

### Design v1.1i — Feed + MallSheet + 3B (session 21A)
- Feed paper masonry + `<MallSheet>` primitive + Find Detail 3B sold landing state + Find Map `isSold` retirement + `<MallHeroCard>` deletion.
- Three-part v1.1i sold contract locked: bookmark + tile + 3B.

### Design v1.1h — Booth redesign (session 18)
- Both Booth pages: banner as photograph with post-it pinned, vendor name as 32px page title, pin-prefixed mall+address, Window View + Shelf View, 4 v0.2 components DELETED.

### Design v1.1g — Find Map redesign (session 17)
- `/flagged` full redesign. Glyph hierarchy locked: pin = mall, X = booth.

### Design v1.1d — Find Detail (session 16)
- Find Detail full build. IM Fell + Caveat loaded via Google Fonts.

### Design v1.1h token consolidation (session 19A)
- `lib/tokens.ts` canonical for v1.1h `v1` palette + fonts. All three surfaces import from it.

### Infrastructure
- **App-wide background paperCream `#e8ddc7` globally committed** (session 17)
- **BottomNav minimal chrome patch + v1.1l idle color** — full Nav Shelf rework still deferred

## KNOWN GAPS ⚠️

### 🔴 Pre-beta blockers
_None as of session 25 close._ Design debt is empty; the last tech blocker (KI-003) is parked but not active.

### 🟡 Remaining pre-beta tech work
- **KI-003 diagnosis** (vendors posting under stale identity after approval). Longest-parked item. No longer blocked by design work. Session 26 recommended opener.
- **Sprint 4 tail batch:**
  - 🟡 T4c remainder (copy polish) — `/api/setup/lookup-vendor` error copy + `/vendor-request` success screen copy. ~30 min.
  - 🟡 T4b — admin surface consolidation. `/admin/login` being a real dedicated route now makes T4b a cleaner decision sprint. ~4 hours.
  - 🟡 T4d — pre-beta QA pass walking all three flows end-to-end.
  - 🟢 Session 13 test data cleanup — 5+ "David Butler" variants in DB. ~5 min SQL via admin-runbook Recipe 4.

### 🟡 Sprint 5 + design follow-ons
- **`<MallSheet>` migration sub-sprint** (`/post`, `/post/preview`, `/vendor-request`). Mechanical work against committed primitive; ~2 hours.
- **Nav Shelf decision + BottomNav full chrome rework** (held since sessions 16–20; David picks from 4 mockups in `docs/mockups/nav-shelf-exploration.html`).
- **Guest-user UX parked items:** Rename "Sign in" → "Curator Sign In" (v1.1k partially did this — `/login` now says "Curator Sign in" — but the Home masthead + BottomNav affordance link still says "Sign in"), `/welcome` guest landing, PWA install onboarding, vendor onboarding Loom, bookmarks persistence (localStorage → DB-backed).

### 🟡 Sprint 3 leftovers still pending beta invites
- Error monitoring (Sentry or structured logs)
- Hero image upload size guard — verify coverage (12MB guard is in place in admin banners editor session 24; post flow guard predates)
- Feed content seeding (10–15 real posts) — required before beta invite
- Beta feedback mechanism (Tally.so link)

### 🟢 Sprint 6+ (parked)
- "Claim this booth" flow for Flow 1 pre-seeded vendors
- QR-code approval handshake
- Universal Links setup (iOS `apple-app-site-association`)
- Native app evaluation
- `admin-cleanup` tool (collapse the 3-table SQL reset to one click)
- Feed pagination, search, ToS/privacy
- Mall page vendor CTA, vendor directory
- Post-MVP: 3A Find Detail sold landing state (photograph-still-visible treatment), Find Map saved-but-sold tile signal

### 🟢 Cleanup (not urgent)
- Deprecated vendor-request functions still in `lib/posts.ts`
- `lib/posts.ts:uploadPostImage` deprecated (anon client, can't see bucket through RLS)
- `lib/posts.ts:uploadVendorHeroImage` orphaned
- Cloudflare nameservers — dormant, no cost
- `/shelves` AddBoothSheet — orphan after T4b ships
- `docs/VENDOR_SETUP_EMAIL_TEMPLATE.md` — obsolete since T4a
- Design v0.2 components deleted across sessions (LocationStatement, BoothLocationCTA, ExploreBanner, TabSwitcher, MallHeroCard, BoothFinderCard)
- `components/ShelfGrid.tsx` — parked with retention comments (session 18); zero current callers
- **`CONTEXT.md` is now ~18 sessions stale** (last updated 2026-04-07, pre-v1.1). Persistent risk. Session 26F candidate: 30-minute refresh bringing it up to v1.1l.
- Mockup HTML files in `docs/mockups/` — many historical records can retire once on-device QA confirms their respective versions hold. No urgency.

---

## DEBUGGING

Run one at a time:

```bash
curl -s https://treehouse-treasure-search.vercel.app/api/debug | python3 -m json.tool
```

```bash
npm run build 2>&1 | tail -30
```

```bash
npx vercel --prod
```

```bash
mkdir -p app/api/your-route-name
```

Commit and push (atomic, keep chained):

```bash
git add -A && git commit -m "..." && git push
```

Source `.env.local` into the current shell for a one-off curl with auth:

```bash
cd ~/Projects/treehouse-treasure-search && set -a && source .env.local && set +a
```

Check Supabase auth logs:
```
https://supabase.com/dashboard/project/zogxkarpwlaqmamfzceb/logs/auth-logs
```

Check Resend delivery logs:
```
https://resend.com/emails
```

Check Vercel function logs:
```
https://vercel.com/david-6613s-projects/treehouse-treasure-search/logs
```

Check DNS state:

```bash
dig kentuckytreehouse.com NS +short
```

```bash
dig kentuckytreehouse.com +short
```

```bash
dig resend._domainkey.kentuckytreehouse.com TXT +short
```

Quick site_settings read (v1.1l debug):

```sql
select key, value, updated_at from site_settings
where key in ('featured_find_image_url', 'find_map_banner_image_url');
```

---
