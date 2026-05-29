# Changelog

All notable changes to Treehouse Finds, versioned per session.

**Scheme:** `v0.{session}.{patch}` while pre-beta — patch increments for mid-session hotfix cycles. `v1.0.0` lands at beta launch. Each entry maps directly to the corresponding session block in [CLAUDE.md](CLAUDE.md) — open that block for the full beat-by-beat narrative + memory firings + carries.

Format inspired by [Keep a Changelog](https://keepachangelog.com).

---

## [v0.203.0] — 2026-05-29

### Session 203 — Location hours end-to-end: Shape A deep-link + Shape B open-now badge (Google Places + weekly cron) — 6 runtime commits + 1 close

David's ask: surface each Location's hours of operation automatically, never hand-maintained. Audit established malls had no hours column + `add-mall.ts` uses free OSM geocoding (no Google key in the stack). Cost-shape triage → David picked **Shape A (deep-link)** first, then greenlit **Shape B (open-now badge)** after a cost analysis verified against current 2026 pricing ($0/month at ~29 malls weekly — the opening-hours SKU is Place Details Enterprise, $20/1k with 1,000 free/mo; gated only by a billing card de-risked with a hard quota cap). Both shipped end-to-end: Shape A as the floor + graceful fallback, Shape B as the enrichment across the three decide-to-visit surfaces. Hours read live from the merchant's Google Business Profile — zero ongoing maintenance.

### Added

- **`lib/mapsDeepLink.ts` `googleListingUrl()`** — Google Maps place-listing URL (where hours render); distinct from the directions URL `navigateUrl()`.
- **"Hours on Google ›" affordance on MallBlock** (Shape A, `75bd5af`) — /shelf + /my-shelf; iframe-safe `<a target="_blank">`.
- **Shape B substrate:** migration 025 (`place_id` / `hours_json` / `hours_timezone` / `business_status` / `hours_fetched_at` on malls) · `scripts/backfill-mall-place-ids.ts` (one-time Text Search → place_id; 16/16 resolved in prod) · `lib/googlePlaces.ts` (Place Details New, Enterprise field mask = the cost lever) · `/api/cron/refresh-mall-hours` (CRON_SECRET-gated weekly) · `vercel.json` cron `0 8 * * 1` · `scripts/refresh-mall-hours.ts` (first populate; 16/16 hours in prod) · `lib/mallHours.ts` (timezone-aware open-now compute, 11/11 unit tests) · `components/MallHoursBadge.tsx` · `/mall-hours-test` smoke route · migration 026 (`mall_hours_badge_tapped` event).
- **Open-now badge** ("Open now · closes 6 PM" / "Closed · opens 9 AM") on MallBlock + SavedMallCardV2 + PinCallout, tappable → Google listing (`41ee21b`).
- **`docs/location-hours-design.md`** — Shape B design record (14 frozen decisions + risk register + 5 arcs).

### Changed

- `lib/posts.ts` long mall-join SELECT extended with the hours columns (one `replace_all`) so /shelf + /my-shelf carry hours; /flagged + /map already do via `getActiveMalls` `select("*")`.
- `Mall` type + event-type unions (`lib/events.ts` + `lib/clientEvents.ts` + `/api/events` whitelist) extended with the hours fields + the badge-tap event.

### iPhone QA watch-items

- Eyeball badge placement + dot/text sizing (D13 dial) on /shelf, Saved, and the Map pin. Verified live on `/shelf/the-quirky-turkey` ("Open now · closes 7 PM", green dot) — the visual dial is David's call.
- 🖐️ HITL: paste migration 026 (prod + staging) so badge-tap analytics land (until then the event 400s silently — harmless); add `CRON_SECRET` to Vercel env so the Monday refresh authenticates.

[v0.203.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.203.0

---

## [v0.202.0] — 2026-05-29

### Session 202 — On-device QA of the session-201 ships (all clean) + Share My Shelf instructions reshape — 1 runtime commit + 1 close

A `/session-open`-recommended QA pass. **All four session-201 ships passed:** nav-detach (background→resume keeps the floating nav pinned — the session-200 fix validated on-device); the map-led CTA renders the real cream pinned-map in the captured Story CTA on production; desktop Directions verified locally via a live `window.open` intercept inside the un-sandboxed, same-origin DesktopFrame iframe (captured the Google Maps URL + `_blank` + `noopener,noreferrer` + handle returned + no fallback — the iframe-navigation bug is structurally dead); the empty-mall vendor CTA's deep-link → form-prefill contract verified. The one finding off the walk drove a single-commit reshape of the Share My Shelf instructions.

### Changed

- **Share My Shelf action hierarchy + instructions (`components/ShelfImageShareScreen.tsx`)** — the old "Tap Share, then pick Facebook … we'll attach the images" promised what Facebook's iOS share target silently drops (a multi-image payload — the D14 carry, now confirmed). Reshaped (Option A): the primary green action flips to **"Save 5 cards to Photos"** (the iOS save-to-Photos handler, which already auto-copies the caption); native share is demoted + relabeled **"Send to an app"** (still serves Instagram / Messages / AirDrop, which genuinely accept the files — no longer dangling Facebook as a one-tap that drops images); the 3 steps are rewritten to the honest **save → post → paste** flow. No logic change (+10/-10 LOC).

### Fixed

- **The D14 multi-file carry** (open since session 198) — resolved by routing around Facebook's share target (instruct download-then-manual-post) rather than relying on a native handoff that silently degrades.

### iPhone QA watch-items

- Auth-gated /my-shelf eyeball: confirm the green button reads "Save 5 cards to Photos" + the 3 honest steps land right (surface isn't reachable in local preview without vendor auth + a ≥3-post booth).

[v0.202.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.202.0

---

## [v0.201.0] — 2026-05-29

### Session 201 — Share My Shelf Arc 3 brand-identity pass + desktop Directions fix + map-led CTA card + empty-mall vendor CTA — 8 runtime commits + 1 close

Session-open standup recommended on-device QA of the session-200 ships; David redirected to **Share My Shelf Arc 3** (brand-identity pass). Audited the four `components/share-shelf/` cards via the Preview MCP (Preview-as-visibility-tool, session-200 pattern) — the find/feed cards already cleared the "share-worthy" bar; the hero read flat (the green gradient's two stops both resolve to `#1F4A31` since the session-168 consolidation = a literal flat fill) and the wordmark was buried on the CTA card alone. David picked **Brand-signature system (Shape B)** + keep the text wordmark for now. Then two QA-driven follow-ons: the desktop **Directions** button did nothing (the iframe couldn't navigate to Google Maps), and David's QA verdict on the CTA card — the QR is dead weight on a phone-viewed Story — drove a **map-led CTA redesign**. Finally a long-pending uncommitted ask: a **vendor-request CTA on the empty-mall state**.

### Added

- **`v2.accent.greenDeep` (`#143020`)** — darker forest stop so the Share My Shelf brand-chrome gradients (Story hero + Feed strip) read with real tonal depth instead of a flat fill. Additive, social-asset-capture only (mirrors `v2.priceGold`'s session-196 precedent).
- **`components/share-shelf/brandMarks.tsx`** — two shared brand-signature primitives: `ShelfLeafBubble` (the leaf corner mark, extracted from the inline copies on StoryFindCard + FeedCard, tone-aware onDark/onLight) + `ShelfBrandFooter` (the "Treehouse Finds" wordmark lockup). Every card now carries the same corner + footer so the 5-card sequence reads as one designed set.
- **`lib/mapsDeepLink.ts` `openNavigation()`** — platform-routing helper: iOS `maps://` via `location.href`, web Google Maps via `window.open(_blank)`.
- **Vendor-request CTA on the empty-mall Home state** — "Have a booth at {mall}?" + "Request a digital booth →" deep-linked to `/vendor-request?mall_id=…&mall_name=…` (form pre-fills the location). Uses `EmptyState`'s existing `cta` slot.

### Changed

- **StoryHeroCard** — green→greenDeep gradient depth + a large faint leaf backdrop motif (fills the dead band) + leaf-bubble corner + wordmark footer + flex-centered name block. The flat/empty hero is now dense + designed.
- **StoryFindCard + FeedCard** — adopt the shared marks + gain the wordmark footer; deeper bottom gradient so meta + footer read; Feed strip gets the gradient depth.
- **StoryCtaCard — map-led redesign** — the QR (dead weight on a phone-viewed Story) is replaced with a pinned Mapbox Static Images snapshot (cream brand style, session 181) + a layered CTA: "Come find us at {mall}" + city/state + "Bookmark the booth in the app". Gains a `mall` prop (threaded through `ShelfImageShareScreen` + the smoke route); a probe `Image` falls the box back to a pin glyph if the snapshot can't load (no token / preview-origin 403). Production (`app.kentuckytreehouse.com` referer-allowlisted) loads the real map.
- **Directions opens in a new tab on web** — all three consumers (LocationActions "Take the Trip", PinCallout "Go", /flagged "Get Directions") route through `openNavigation`. Fixes desktop, where the old `location.href` tried to navigate the DesktopFrame iframe to Google Maps (refused via `X-Frame-Options`), so nothing happened.

### Removed

- StoryCtaCard QR code + `react-qr-code` import + URL preview (replaced by the map; `boothUrl` kept on the contract as reserved `_boothUrl`).
- Inline leaf-bubble copies on StoryFindCard + FeedCard + the standalone wordmark on StoryCtaCard (replaced by the shared marks; `PiLeafFill` / `FONT_NUMERAL` imports retire as dead-code byproducts).

### iPhone QA watch-items

- **Map-led CTA card** — confirm the actual cream pinned-map renders on a production capture (the local preview shows the pin-glyph fallback because the Mapbox token 403s off the production origin).
- **Directions** — click on desktop to confirm a Google Maps tab opens; the iOS `maps://` path is unchanged but worth a tap on-device.
- **Empty-mall vendor CTA** — scope Home to an empty mall on-device to confirm the prompt + pre-scoped link read well.
- **Carry-over (from v0.200.0):** Finding 3 nav-detach still needs on-device validation.

[v0.201.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.201.0

---

## [v0.200.0] — 2026-05-28

### Session 200 — Desktop-frame QA bundle (review-board exemption + iOS nav-detach fix) + /welcome redesign to the /login family — 4 runtime commits + 1 close

Session-open standup recommended Round 3 QA on v0.199.0; David redirected to three iPhone/desktop QA findings on the session-199 desktop frame ship, then a fresh /welcome redesign ask. Findings 1 + 3 shipped; finding 2 closed no-change after reproducing it via local preview (Preview MCP — visibility-first applied to a desktop-rendering bug). The /welcome redesign was cost-shape-triaged (David picked Shape A — match the /login family) and shipped via a 2nd-consumer ActionCard extraction.

### Added

- **`components/ActionCard.tsx`** — shared entry-surface path card extracted from `app/login/page.tsx` (2nd-consumer trigger: `/welcome`). Generalized to render `<a>` for `href` (full nav) or `<button>` for `onClick` (client router.push). Single source of truth so `/login` + `/welcome` path cards stay in lockstep.

### Changed

- **`/welcome` redesigned to match the `/login` entry-surface family** — leads with the `/wordmark.png` brand lockup (96px) + italic Cormorant sub-text, top-anchored (no floating card), two paths rebuilt as shared `<ActionCard>`s (PiStorefrontBold → `/vendor-request`, PiBookmarkSimpleBold → `/me`), header help bubble (PiQuestion → `/contact`) mirroring `/login`. Auth/redirect logic preserved verbatim. David: it "doesn't fit well with the rest of the design ... feel more integrated and substantial as it's the first point of entry for a vendor."
- **`<DesktopFrame>`** gains a `usePathname()` route-exemption (`FRAME_EXEMPT_PREFIXES = ["/review-board"]`) — 4th pass-through case alongside mobile / embedded / pre-mount. `/review-board` (the internal design control room) no longer renders inside the simulated-iPhone chrome at desktop width.
- **`<BottomNav>`** floating pill promoted to its own compositing layer (`translateZ(0)`) + a resume-nudge effect (`visibilitychange` / `pageshow[persisted]` / `focus` / `visualViewport` resize) that re-anchors it to the live viewport bottom — fixes the iOS Safari PWA bug where the `position:fixed; bottom:<offset>` pill desyncs and floats mid-content after the app is backgrounded/resumed.

### Removed

- `app/login/page.tsx` local `ActionCard` definition (moved to shared component; byte-identical render via `href`).
- `app/welcome/page.tsx` local `WelcomeRow` + footer contact link (replaced by shared `ActionCard` + header help bubble).

### iPhone QA watch-items

- **Finding 3 (nav detach) needs on-device validation** — cannot be reproduced on desktop preview; background the PWA a while → resume → confirm the floating nav stays pinned. If it still detaches, escalate to device-inspector.
- **`/login` authed-cards** (Profile tab while signed in as vendor/admin) — glance to confirm the `ActionCard` extraction left them unchanged (verified-pure refactor, but the authed state needs auth to render).
- **`/welcome`** — confirm it reads substantial + on-family as a fresh-auth user (or via the `/review-board` welcome tile).

[v0.200.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.200.0

---

## [v0.199.0] — 2026-05-26

### Session 199 — Desktop frame chrome end-to-end (Shape B design pass + 4 implementation arcs + 2 QA dial rounds + photo swap-in) — 6 runtime commits + 1 close

David's session-open standup recommended iPhone QA on production v0.198.0; David redirected to a desktop-rendering ask referencing an editorial flatlay mockup. Cost-shape Shape B picked (phone-frame simulation around live app) over Shape A (bg-only) and Shape C (separate marketing landing page). V1 mockup spanned frame style depth axis with 3 frames; David picked **Frame A** (photo-realistic flatlay + photographed iPhone). 4/4 + 2/2 Recommended picks across two prose batches locked 12 frozen decisions D1-D12 + 7-arc implementation plan + 7 Tier B items + 8-row risk register.

Implementation shipped across 4 arcs + 2 mid-session QA dial rounds in single ~3-hour session: Arc 1 (design record + V1 mockup) → Arc 2.1 (primitive + smoke route) → Arc 2.3 (layout adoption) → Arc 2.4 (composition responsive + scrollbar handling) → Arc 3.1 (photo swap-in optimized 3.1MB → 780KB via pngquant) → Arc 2.5 + 3.2 (composition geometry dial + BrandChrome refactor with canonical wordmark + center align + QR code). Each commit built clean across all 48 routes at the boundary gate.

Architectural decision: live PWA renders inside an **iframe** within the phone-stage rectangle, not as direct child rendering. PWA was designed for mobile-viewport-as-scroll-container (StickyMasthead position:fixed, window-scroll listeners, scroll-restore primitives). Iframe gives the PWA its own document scope so every existing PWA feature works pixel-perfect inside the phone-screen without re-engineering. Same-origin iframe shares cookies/auth state. Embedded-mode detection via `?desktop-frame=embedded` URL query prevents infinite recursion.

### Added
- **`docs/desktop-frame-design.md`** (Arc 1 commit `c649eec`) — design record with 12 frozen decisions D1-D12, 3 component contracts (DesktopFrame + BrandChrome + PhoneStage), 3-arc implementation sequence, 7 Tier B headroom items, 8-row risk register, and Midjourney photo brief with primary prompt + iteration notes for David to run externally in parallel.
- **`docs/mockups/desktop-frame-v1.html`** (Arc 1 commit `c649eec`) — V1 mockup spans frame style depth axis with 3 frames (A photo-realistic / B stylized SVG / C hybrid) at 1440×900 preview scale + 8-row trade-off matrix.
- **`<DesktopFrame>` primitive** at `components/DesktopFrame.tsx` (Arc 2.1 commit `0a1596f`) — wraps `{children}` in branded desktop chrome at ≥1024px viewport. Pass-through at <1024px or when running inside the chrome's own iframe (embedded mode). Internal `<BrandChrome>` sub-component renders wordmark image + tagline + ornament + subtext + QR code. Phone bezel CSS-rendered (dark titanium gradient + realistic shadow) wrapping iframe of current path with `?desktop-frame=embedded` appended.
- **`/desktop-frame-test` smoke route** (Arc 2.1 commit `0a1596f`) — per `feedback_testbed_first_for_ai_unknowns` ✅ Promoted — **6th cumulative firing** (postcard-test → search-bar-test → geolocation-test → vendors-test → share-shelf-test → desktop-frame-test). Mounts primitive with placeholder inner content visible at mobile viewport; David previews chrome at desktop viewport.
- **`public/desktop-hero.png`** (Arc 3.1 commit `f021d4f`) — photographed flatlay (1672×941) with botanical sprig top-left + antique treehouse sketch top-right + vintage postcard bottom-left + brass key + dried botanicals bottom-right + empty cream-paper center. Optimized via `npx pngquant-bin --quality=70-90 --force` in-place: 3.1MB → 780KB (75% reduction). Quality holds — decorations, postcard handwriting, key patina all legible at production scale.
- **QR code affordance in BrandChrome** (Arc 3.2 commit `1727fd4`) — encodes `https://app.kentuckytreehouse.com/` so desktop visitors can scan with phone camera → open PWA on iPhone where canonical experience lives. The digital-to-physical bridge thesis applied at the marketing layer. react-qr-code (already a dep from session 196 StoryCtaCard work) at size 120px, fgColor `#5a4a30` brown matching wordmark, bgColor transparent with soft cream quiet zone padding. Caption "Scan to take it with you" in Cormorant italic 13px.

### Changed
- **`app/layout.tsx`** (Arc 2.3 commit `48d2d3f`) — wraps `{children}` in `<DesktopFrame>` inside FindSessionProvider. Single import + 1 wrap, no removals. At viewport <1024px or when inside DesktopFrame's iframe, the primitive is a pass-through — PWA behavior preserved.
- **`<DesktopFrame>` composition geometry** (Arc 2.4 commit `0c01a3b`) — previous `BrandChrome` at `left: 8%` + `PhoneStage` at `right: 12%` (absolute positioned to viewport edges) created ~700px empty middle on 1920px viewport. Restructured into centered composition wrapper with `max-width: 1200 → 1100` + flexbox `justifyContent: center` + `gap: 80`. Brand chrome + phone now form a center-anchored ~820px block regardless of viewport width. Composition stays centered at any viewport; photographed flatlay decorations at viewport corners (via `cover` bg) frame the composition on wide screens.
- **Scrollbar hiding in embedded iframe** (Arc 2.4 commit `0c01a3b`) — David's QA: "any ideas on how to handle the scroll option better so it's not so distracting from the design?" When DesktopFrame detects embedded mode, `document.body.classList.add("desktop-frame-embedded")` activates new `globals.css` rules that hide scrollbars across body + all descendants via `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` + `width: 0; height: 0` defensives.
- **Hero photo swap** (Arc 3.1 commit `f021d4f`) — `bgStyle.background` swapped from CSS-rendered placeholder (multi-layer radial + linear gradients approximating paper texture) to `url(/desktop-hero.png) center/cover` with `#e8ddc7` (v1.paperCream) fallback before photo loads.
- **BrandChrome wordmark + alignment + QR** (Arc 2.5 + 3.2 commit `1727fd4`) — David's QA: "Replace the Treehouse and lock symbol you have with the logo we use for the app. The text can be centered underneath it and we should add a QR code." Replaced custom green SVG leaf glyph + CSS-rendered "treehouse FINDS" Cormorant 64px text wordmark with `<img src="/wordmark.png" />` — the canonical app wordmark asset rendered by `<StickyMasthead>` across the entire PWA (botanical glyph + "treehouse" italic-serif + "FINDS" small-caps with horizontal accents, all baked in). Brand chrome container now `textAlign: center` + flex column + alignItems center; all child elements (wordmark img, tagline, ornament, subtext, new QR section) center within the column. Ornament margin `18px 0 14px` → `18px auto 14px`. Tagline 28px → 26px, subtext 16px → 15px (visual rhythm with the tighter wordmark image scale).

### Removed
- **Custom green SVG leaf glyph + h1 text wordmark** (Arc 3.2 commit `1727fd4`) — Arc 2.1's placeholder rendering retired as scope-adjacent dead-code byproduct per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. ~25 LOC retired alongside the feature change (`wordmarkStyle` + `wordmarkSubStyle` styles + inline `<svg>` markup + `<h1>` text composition).

### Fixed
- **Desktop visitors landing on empty cream bg around 430px PWA column** — root concern resolved. Visible chrome surface for desktop visitors (press, investors, shoppers researching, vendors evaluating); identity beat + interactive demo + scan-to-mobile affordance all in one composition.

### iPhone QA watch-items
- **Round 3 QA on Vercel preview after this ship** — composition geometry at 1024 / 1280 / 1440 / 1920 viewports; wordmark image proportions vs tagline + QR; QR scan validates (visit `https://app.kentuckytreehouse.com/`); QR transparent-bg quiet zone reads natural on photo or feels like unwanted card overlay; corner decorations stay visible at ultra-wide viewports without aggressive cover crop.
- **Below 1024px (mobile + tablet portrait)** — Desktop chrome inactive; PWA renders identically to v0.198.0. No regressions expected.
- **Authed user behavior** — D4 visitor-only gate deferred to Arc 3.3 follow-up. Currently authed users (admin/vendor/shopper) at desktop viewport see the chrome with their PWA inside the iframe. Acceptable for now; future Arc 3.3 adds `useShopperAuth` check to gate chrome to signed-out visitors only.
- **VisitorTrackerMount duplicate-fire on desktop** — Tier B concern. Parent chrome page + iframe both mount VisitorTrackerMount → 2 `visitor_engaged` events per desktop visitor. Fix candidate: detect `window.self !== window.top` in `lib/visitorTracker.ts` + early-return when iframed.

[v0.199.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.199.0

---

## [v0.198.0] — 2026-05-26

### Session 198 — Share My Shelf relocation + UX fixes + iPhone-QA 8-finding bundle + within-session dial — 12 runtime commits + 1 close

David's session-open standup recommended Arc 2 iPhone QA + Arc 3 brand identity pass per session 197 close opener. David redirected with a 3-finding Share My Shelf bundle (iOS Download routing to Instagram instead of Photos / relocate Shelf Image out of ShareSheet popup / no instructions on what to do or how to share + FB doesn't receive multi-file payload). Audit-first localized actual failure modes; David picked Shape A (keep architecture, fix Items 1+2, add instructions overlay). Mid-session second redirect: 8-finding iPhone-QA bundle on production v0.198.0 ship (Profile button extends to viewport edge on desktop / edit pencil relocation to button / photo replace on edit page / status toggle / typography dials / saved card color flip / Take the Trip relocation / BottomNav rename). Third redirect: within-session reversal of C6 (saved card color flip) after David's iPhone QA — "for simplicity, lets just keep the bg all one color of the card."

12 runtime commits sequenced smallest→largest across 3 arcs, build green at every commit boundary covering all 48 routes. **Net runtime change: +727 / -159 LOC = +568 LOC overall across 8 files.**

### Added
- **Arc 1 — Share My Shelf Shape A (3 commits)**:
  - **`ShelfImageShareScreen` iOS save-to-Photos path** (C1 commit `023b418`, +31 LOC) — `handleDownload` UA-aware: iOS branches to `navigator.share({ files })` with NO text/url payload so iOS share sheet foregrounds "Save N Images" rather than routing to Instagram. Non-iOS keeps existing `<a download>` 5-sequential path. Analytics `method` field disambiguates `"ios_save"` from `"download"` / `"native_share_*"` / `"desktop_fallback"`.
  - **Instructions overlay** (C2 commit `8e93a28`, +70 / -30 LOC) — replaces cryptic "Share My Shelf · 5-card Story sequence" eyebrow + bottom footer disclaimer with action-oriented "How to share your shelf" title + 3-step numbered block. New `<Step>` helper at module scope (green-circle bullet + Inter 13px body). Per David's QA: "When the user clicks the button it shows the cards but no instructions on what to do or how to share."
  - **"Share on Social" CTA on /my-shelf** (C3 commit `e10d17e`, +103 / -57 LOC across 2 files) — single coupled commit. ShareSheet drops `showShelfImage` flag + `shelf-image` Screen variant + handler + tile + ShelfImageShareScreen import + PiImageSquare import (-48 LOC). /my-shelf gains "Share on Social" secondary outlined button between Add a Find and Edit Booth + `showShelfShare` state + BottomSheet wrapper hosting ShelfImageShareScreen directly (+75 LOC).
- **Arc 2 — iPhone-QA 8-finding bundle (8 commits sequenced smallest→largest)**:
  - **C1 BottomNav label** (commit `c6e98d3`, +1 / -1 LOC) — "Saved" → "Flagged" (route + key preserved per `feedback_user_facing_copy_scrub_skip_db_identifiers` ✅ Promoted).
  - **C2 Edit-find subtitle** (commit `f1bd683`, +11 / -3 LOC) — "Click submit when finished" → "Click post changes when finished" + fontSize 14 → 16 + maxWidth 290 → 320.
  - **C3 Remove from shelf typography** (commit `cdc4f09`, +10 / -2 LOC) — fontSize 14 → 16 + fontWeight default → 500 + textDecorationColor opacity 0.38 → 0.55 (dotted underline tracks heavier text).
  - **C4 Profile button max-width centering** (commit `3a7e2fd`, +30 / -6 LOC) — wrap position:fixed overlay in centered max-width:430 container mirroring StickyMasthead (TabsChrome.tsx). pointerEvents:none on wrapper + pointerEvents:auto on inner so taps in empty area pass through.
  - **C5 Status segmented-pill toggle** (commit `399ce08`, +68 / -34 LOC) — replaces 2-pill grid with unified segmented toggle. New `<StatusToggle>` + `<StatusSegment>` primitives at module scope. role="radiogroup" + role="radio" canonical a11y for binary picker. Selected half fills v2.accent.greenMid + white text; unselected stays transparent + ink-secondary.
  - **C6 Coupled SavedMallCardV2 color flip + Take the Trip relocation** (commit `f19439a`, +90 / -75 LOC across 2 files) — color flip (outer card / mall wrapper warm / accordion header warm / trailing row card / Take the Trip footer warm) + Take the Trip relocated from top mall section to new dedicated bottom row at article level. _Within-session reversed at C9 dial below._
  - **C7 /find Pencil → Edit Find CTA** (commit `ae6c0e9`, +59 / -21 LOC) — title-block inline pencil retired (was owner-only position:absolute bubble at right gutter). New "Edit Find" outlined secondary CTA stacked below Explore this Booth in the engagement-stack (Flag the Find → Explore this Booth → Edit Find). Mirrors session 186 Edit Booth pencil-to-CTA promotion pattern.
  - **C8 Image REPLACE on edit page** (commit `1f3e0bd`, +167 / -1 LOC) — restores photo display at top of /find/[id]/edit (was retired session 186). Replace photo affordance: file picker → FileReader dataURL → `compressImage` → `uploadPostImageViaServer` → preview updates → PATCH body includes new image_url on submit (only when changed via `imageChanged` flag). REMOVE deferred per API constraint (validator requires non-empty http(s) URL) + entity-model decision.
- **Arc 3 — within-session dial (1 commit)**:
  - **C9 Saved card flatten + retire trailing row** (commit `ee27601`, +37 / -41 LOC across 2 files) — within-session reversal of C6 color flip per David's iPhone QA: "For simplicity, lets just keep the bg all one color of the card and remove the lighter white surface color row as it's no longer needed as the button at the bottom closes out the list visually." Mall section wrapper + AccordionBoothSection header + Take the Trip footer row all revert warm → card; 44px trailing empty row inside booth body retires entirely. Visual hierarchy now reads as identity-by-content (typography + icons + dividers) on a single card-bg substrate; green Take the Trip is the only saturated-color punctuation closing the read. Take the Trip relocation from C7... wait C6 relocation preserved verbatim — only the bg around it flattens.

### Changed
- **/api/post-image** — no API-side changes; existing endpoint already accepts `{ base64DataUrl, vendorId }` with service-role bypass + ownership-or-admin auth (Wave 1.5 session 92). C8 reuses verbatim.
- **PATCH /api/my-posts/[id]** — no API-side changes; image_url validator already supported (session 92). C8 includes `image_url` in batched PATCH body when `imageChanged = imageUrl !== originalImageUrl`.

### Removed
- **Shelf Image 4th tile in ShareSheet** (-48 LOC across ShareSheet.tsx) — `showShelfImage` flag + `shelf-image` Screen variant + handler + tile + ShelfImageShareScreen import + PiImageSquare import + GridScreen 4-tile variant comment. ShareSheet now serves 2 tiles (public /shelf: Email+SMS) or 3 tiles (/my-shelf: Email+SMS+QR) — no 4-tile variant.
- **Old eyebrow + footer disclaimer on ShelfImageShareScreen** ("Share My Shelf · 5-card Story sequence" + "Tap Share to post directly on Facebook, Instagram, or anywhere else") — retired per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted; new instructions block covers the same intent earlier in read order.
- **Title-block inline pencil on /find/[id]** — owner-only position:absolute bubble retired (C7). Wrapper position:relative dropped since no positioned child remains; title block becomes purely centered. Pencil affordance moves to dedicated "Edit Find" CTA in the engagement-stack.
- **Old `<StatusPill>` component on /find/[id]/edit** (C5) — single consumer replaced by `<StatusToggle>` + `<StatusSegment>`. Per `feedback_dead_code_cleanup_as_byproduct`.
- **44px trailing empty row inside AccordionBoothSection** (C9) — was warm at session 175 (Review Board completion-row spec) → card at session 198 C6 color flip → retired entirely at C9. Take the Trip footer below {children} closes the list visually now.

### Fixed
- **iOS PWA Download routing to Instagram** (C1 Arc 1) — `<a download>` + blob URL on iOS gets intercepted as open-intent rather than save-to-disk intent; iOS routes to registered PNG handler (Instagram). Fix: feature-detect iOS UA + `navigator.canShare({ files })` → branch to `navigator.share({ files })` with no text/url payload so iOS share sheet foregrounds "Save N Images" / "Save to Files."
- **Profile button on desktop extends to viewport edge** (C4 Arc 2) — Home-only floating overlay used `right: OVERLAY_X` against position:fixed which anchors to actual viewport right edge. On iPhone the viewport IS the 390-430 column so it rendered correctly; on desktop the bubble flew to far-right of whatever-wide-window. Wrapped in centered max-width:430 container mirroring StickyMasthead pattern.

### Memory firings cumulative through session 198
- `feedback_user_clarification_restate_interpretation` ✅ Promoted — multiple firings (3-finding Share My Shelf restate, Shape A architectural conversation restate, 8-finding bundle restate, C9 dial restate); ~55+ cumulative.
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — 3 cost-shape triages this session (Arc 1 Shape A vs B vs C for Share My Shelf relocation; Arc 2 Shape A surgical bundle implicit; #4 toggle shape + #3 image scope clarification calls).
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 — 12 firings (~618+ cumulative); each commit independently revertable.
- `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — Arc 1 C3 (ShareSheet retire + /my-shelf relocate must move together) + Arc 2 C6 (color flip + Take the Trip relocation share visual context) + Arc 3 C9 (4 bg flips + 1 element retire must move together).
- `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 — C9 reverses C6 same session per David's iPhone QA finding. Pattern continues to fire load-bearingly when first-iteration interpretations need course-correction.
- `feedback_visibility_tools_first` ✅ Promoted — audit-first localized 3 surfaces (ShelfImageShareScreen + ShareSheet + /my-shelf) in 5 parallel reads before Arc 1; 4 parallel reads (TabsChrome + edit page + SavedMallCardV2 + BottomNav) before Arc 2; identified all 8 substrate locations.
- `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — Arc 1 C3 ShareSheet retire byproducts + Arc 2 C5 StatusPill retire + C7 pencil retire + C9 trailing row retire all attached to replacing commits per the rule.
- `feedback_user_facing_copy_scrub_skip_db_identifiers` ✅ Promoted — Arc 2 C1 "Saved" → "Flagged" label only; route `/flagged`, NavTab key `"flagged"`, active="flagged" callsites preserved verbatim.
- `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted — David's button label "Share on Social" shipped verbatim; David's "Click post changes when finished" shipped verbatim.
- `feedback_surface_locked_design_reversals` ✅ Promoted — Arc 1 C3 reverses session 196 C2 frozen "Shelf Image as 4th tile" + Arc 2 C6 reverses session 175 Review Board Saved Browse #1 + Arc 3 C9 reverses Arc 2 C6 within same session; all 3 reversals surfaced with prior reasoning quoted in commit bodies.
- `feedback_treehouse_no_coauthored_footer` ✅ Promoted honored on all 12 runtime commits + this close.

### NEW Tech Rule candidate patterns surfaced (single firings each; all promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted)
1. **"iOS Safari + iOS PWA intercept `<a download>` + blob URL as open-intent"** — sub-pattern of platform-quirk-as-bug-class. Canonical iOS save path is `navigator.share({ files })` with no text/url payload; iOS share sheet then surfaces "Save N Images" / "Save to Files" rather than messaging-app routing. Generalizes to any future blob-URL download flow that needs to work on iOS PWA.
2. **"Mobile-first fixed-positioned chrome that worked on iPhone fails on desktop without max-width centering"** — sub-pattern of `feedback_visibility_tools_first` ✅ Promoted extended to viewport-width-assumption bugs. Surfaces only when the project crosses from "iPhone PWA only" to "any user opens it on desktop." Fix shape: wrap in centered max-width container mirroring StickyMasthead's `left:50% + transform:translateX(-50%) + width:100% + maxWidth:430`.
3. **"role='radiogroup' + role='radio' is the canonical a11y vocabulary for binary segmented-pill toggles"** — sub-pattern of `feedback_verify_primitive_contract_via_grep` ✅ Promoted extended to a11y semantic role choices. aria-pressed is for toggle-buttons (one button, on/off); aria-checked + radiogroup is for pickers (one of N).
4. **"Visual hierarchy from bg-color tiering is over-engineered when content provides the differentiation"** — sub-pattern of `feedback_total_strip_after_iterative_refinement_fails` ✅ Promoted at first iteration. David's C9 dial: when 3+ bg tiers compete with content-based identity (typography + icons + dividers), the bg tiering becomes redundant chrome. Simplification → single bg substrate + saturated-color punctuation (Take the Trip button) closing the read.
5. **"Bottom-row footer relocation makes per-section decorative completion-rows redundant"** — sub-pattern of `feedback_dead_code_cleanup_as_byproduct` extended from code retirement to chrome retirement. When a parent-level action row anchors the visual bottom of a card, per-section trailing rows become noise.

### Roadmap delta
18 R-rows total. 13 ✅ Shipped, 0 🟢 Ready, 5 🟡 Captured. Unchanged at row level — session 198 is iPhone-QA-driven refinement work on already-shipped surfaces (Share My Shelf vendor-value substrate + /find/[id] + /find/[id]/edit + /my-shelf + /flagged + BottomNav + Home chrome). Substrate added: `<Step>` helper + `<StatusToggle>` + `<StatusSegment>` + photo-replace pipeline on /find/[id]/edit + iOS save-to-Photos branch + centered-max-width chrome primitive on Home Profile overlay. Substrate removed: `<StatusPill>` + Shelf Image 4th tile in ShareSheet + title-block inline pencil + 44px trailing empty row in AccordionBoothSection + old eyebrow + footer disclaimer on ShelfImageShareScreen.

### iPhone QA watch-items
- **Item 1 D14 architectural concern unresolved** — Shape A keeps architecture; FB-doesn't-attach-multi-file on iOS may still surface in QA. If reads as broken at the FB step, Shape B (rearchitect around FB single-file reality — composite image OR hosted gallery URL) becomes next-session candidate.
- **Item 1 iOS save-to-Photos** — confirm "Save 5 Images" surfaces in share sheet on iPhone PWA download tap (not Instagram routing).
- **Item 2 Share on Social entry point** — confirm new button reads at correct visual tier on /my-shelf (secondary outlined matches Edit Booth; PiShareFat 13 size).
- **Item 3 instructions overlay** — confirm 3-step block reads cleanly above carousel; copy verbatim per Recommended pick.
- **Arc 2 items** — confirm all 8 dials read as intended on iPhone PWA (BottomNav label / subtitle / Remove typography / Profile button on desktop / Status toggle / Saved card flat / Edit Find CTA / Photo replace).
- **C9 dial** — confirm saved card reads as one continuous card surface with Take the Trip green footer button as sole saturated-color punctuation.

[v0.198.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.198.0

---

## [v0.197.0] — 2026-05-25

### Session 197 — Share My Shelf Arc 2 wrapper UX end-to-end (multi-card carousel + capture pipeline + multi-file native share + regenerate + reorder) — 6 runtime commits + 1 close

David's session-open pick from the recommended options: Arc 2 wrapper UX implementation. Pure execution pass against the locked design record §3.5 + §6 from session 196 — zero design calls, zero re-scoping mid-session. **35th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted** across 35+ different features; load-bearing operating mode validated yet again on yet another feature.

Cost-shape triage at session-open per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 surfaced Shape A (full Arc 2 per §6 spec) / Shape B (capture-pipeline-only conservative) / Shape C (Arc 2 + Arc 4 caption-gen combined). David picked Shape A. 6 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88, each with tsc + `npx next build` green at every commit boundary (48 routes throughout).

### Added
- **`lib/aiShelfCaption.ts`** (Arc 2 C1 commit `38463f9`, +131 LOC) — placeholder caption generator per D15 template. Format-aware: `"story"` → multi-line narrative (hook + venue + URL preview); `"feed"` → single hook line. Plus `placeholderHeroHook(count, seed)` cycler through 5 hook variants for C5 regenerate paired with shuffled finds. Arc 4 swaps internals to Sonnet call; signature is the load-bearing contract that gets locked NOW so consumers don't change later.
- **`lib/useShelfCapture.ts`** (Arc 2 C2 commit `dd5cff5`, +182 LOC) — multi-card off-screen capture pipeline. Mounts 5 cards via `data-shelf-card` markers + single stable `containerRef` (vs 5 per-card refs that would re-fire the effect every render). Parallel capture via `Promise.all` of html2canvas-pro calls. 300ms post-mount delay covers off-screen img decode (session-152 used 250ms; conservative bump for 5-card load). Blob URL lifecycle: prior URLs revoked when new capture lands; in-flight URLs revoked on abort; unmount-only effect revokes the last-ready URLs after final paint. State machine: `idle → rendering → ready | error`.
- **`v2.priceGold` was already shipped session 196 Arc 1.1** (referenced here for context only).
- **Multi-card carousel preview UI** (Arc 2 C3 commit `aa3c0d8`, +293 / −620 LOC) — refactored `<ShelfImageShareScreen>` from session-152 single-card 1080×1350 monolith to 5-card Story sequence per D4. Composes Arc 1 components (StoryHeroCard + 3× StoryFindCard + StoryCtaCard) off-screen via useShelfCapture hook from C2; reads blob URLs into a horizontal scroll-snap carousel (240px-wide cards / 9:16 aspect / scroll-snap-mandatory-x / visible neighbor edges). Each preview labeled "1 · Hero" through "5 · CTA". Loading / rendering / error states surface in placeholder slot with Cormorant italic status copy matching session-152 voice.
- **navigator.share multi-file payload** (Arc 2 C4 commit `487fa00`, +90 / −26 LOC) — D14 + D15 wired. 3-tier fallback ladder mitigates D14 risk-register Med-likelihood / High-impact "multi-file payload compatibility": (1) `canShare({ files: all 5 })` → native multi-file share; (2) `canShare({ files: [hero] })` → degrade gracefully to single-card share if multi-file rejected; (3) desktop fallback → open FB sharer in new tab + download all 5 sequentially. Filenames prefixed `1-` through `5-` so OS alphabetical sort puts them in Story-sequence order when vendor picks them in FB's photo picker. Download button label updated to "Download all 5 cards" to reflect multi-file behavior. User-canceled (AbortError) does NOT cascade to fallback paths — explicit early return.
- **Regenerate affordance** (Arc 2 C5 commit `aaed8bd`, +61 / −8 LOC) — D8 single-affordance re-rolls finds + cycles placeholder hook. Vendor with >3 posts: shuffle source via Math.random sort + take first 3. Vendor with ≤3 posts: hook variant still cycles for visible feedback + capture re-fires for any photo re-decode variance. Dashed-border pill between carousel preview and primary Share button. Cormorant italic 14px secondary voice matches session-41 SentBody "Share with someone else" affordance vocabulary. PiShuffle icon (better mental model than refresh — vendor understands they're getting a different combo, not the same thing again).
- **Reorder affordance** (Arc 2 C6 commit `d291f6f`, +148 / −12 LOC) — D3 drag-rearrange the 3 picked finds within the Story sequence. framer-motion Reorder.Group on a compact chip row below the carousel (touch-action conflict-free since strip sits in vertical-stack layout vs the horizontal scroll-snap carousel above). Each chip: rank number (green) + title (Cormorant italic 12px, ellipsis on overflow) + drag-grip glyph (PiDotsSixVertical). `whileDrag` lift (scale 1.05 + soft shadow + grabbing cursor + z-index elevation) matches Layer 2 lift vocabulary. Hero (slot 0) + CTA (slot 4) stay fixed — only the 3 find slots reorder among themselves per D3.
- **Insufficient-posts state branch** (Arc 2 C6 same commit) — schema-forced extension per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted (6th cumulative firing post-promotion at session 141). D9 froze 5-card sequence but didn't enumerate the `<3-posts vendor` case. Pre-C6 wrapper would fall through to "rendering" infinitely for vendors with 1-2 posts (captureReady gated on `picks.length === 3` → useShelfCapture stayed disabled). New branch surfaces clear copy: *"Add at least 3 finds to your shelf to share a 5-card Story sequence."* 3-find floor stays structural for MVP per D9; Tier B6 (pre-capture vendor inputs) would unblock 1-2 post vendors via variable card counts.

### Changed
- `components/ShareSheet.tsx:252` — doc-rot comment updated from "composes ShelfImageTemplate (off-screen 1080×1350)" to reflect the new 5-card Story sequence path (session 197 Arc 2 C3).
- `scripts/lint-shared.ts` EXCLUDED_PREFIXES — both `components/ShelfImageTemplate.tsx` + `components/ShelfImageShareScreen.tsx` removed; wrapper is no longer parked code, actively maintained going forward (Arc 2 C3).

### Removed
- **`components/ShelfImageTemplate.tsx`** (-695 LOC; deleted in Arc 2 C3) — session-152 parked 1080×1350 monolith. No remaining consumer after wrapper refactor; ShelfImageShareScreen now composes the 5 Arc 1 components instead. Scope-adjacent dead-code retirement per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted.
- **PARKED file-top comment block** in `components/ShelfImageShareScreen.tsx` (Arc 2 C3) — wrapper is no longer parked; session-152 revive contract satisfied + the parked code itself has retired.

### Memory firings cumulative through session 197
- `feedback_design_record_as_execution_spec` ✅ Promoted — **35th cumulative firing**. Arc 2 ran as pure execution against §3.5 + §6 with zero re-scoping mid-flight; one schema-forced extension (insufficient-posts branch) surfaced explicitly per the canonical sub-pattern (NOT a design reversal).
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 — 6 firings this session (~606+ cumulative). Each commit independently revertable: utility module → hook in isolation → wrapper refactor (with retire byproducts) → handler swap → regenerate → reorder.
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — Shape A/B/C surfaced via AskUserQuestion at session-open before any code drafted.
- `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — ShelfImageTemplate.tsx -695 LOC delete + ShareSheet doc-rot comment scrub + lint-shared EXCLUDED_PREFIXES retire all rolled into C3 since the consumer disappeared together (-695 + -23 + -3 = -721 LOC retired in the refactor commit).
- `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141 — **6th cumulative firing post-promotion**. Insufficient-posts branch surfaced explicitly as schema-forced extension in C6 commit body (NOT a D9 reversal). Pattern continues to generalize across DB schema layer (sessions 125 + 136) + primitive contract layer (sessions 141 dim + 142 save-props + 163 LocationActions + FlagGlyph) + state-machine branch layer (this session).
- `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted — D13 progressive-capture escalation pre-scoped in C2 commit body for round-2 fix if iPhone QA shows >4s capture latency on iPhone 12+. Pre-commit-escalation pattern from session 183 continues.
- `feedback_visibility_tools_first` ✅ Promoted — audit-first localized Arc 1 component contracts (StoryHeroCard + StoryFindCard + StoryCtaCard + FeedCard) + parked wrapper (ShelfImageShareScreen pre-refactor) + ShareSheet seam + smoke route + fixtures in 5 parallel reads before drafting any commits.
- `feedback_verify_primitive_contract_via_grep` ✅ Promoted — confirmed framer-motion 12 + html2canvas-pro + react-qr-code all present in package.json BEFORE drafting C2/C4/C6 contracts; grep'd ShelfImageTemplate consumers BEFORE deleting the file (only the just-refactored wrapper + 3 doc-rot mentions; safe to retire).
- `feedback_treehouse_no_coauthored_footer` honored on all 6 runtime commits + this close commit.

### NEW Tech Rule candidate patterns surfaced (single firings each; all promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted)
1. **"Multi-tier `canShare` fallback ladder pre-shipped as one commit (vs patch-by-patch on each failure mode)"** — sub-pattern of `feedback_kill_bug_class_after_3_patches` ✅ Promoted inverted to "ship the structural defense FIRST rather than wait for the bug class to fire." The 3-tier ladder in C4 (multi → single → desktop) ships all three paths in one commit because D14 risk register surfaced multi-file compatibility as Med/High risk at design time. Generalizes to any third-party API with known device-variability axis.
2. **"C3 ships intermediate-state with planned C4 swap keeping main functional between commits"** — single-card share preserved through C3 commit (session-152 parity); C4 swaps handler internals to multi-file without callsite change. Lets the 6-commit Arc 2 cadence preserve main-is-shippable invariant at every commit boundary. Sub-pattern of `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted INVERTED (when coupling can be broken via temporary-parity, ship both halves as independent commits + document the intermediate state in commit body).
3. **"Schema-forced extension surfaces during implementation as an UN-ENUMERATED-DOMAIN branch (insufficient-posts)"** — sub-pattern of `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted at the un-enumerated-state-domain layer (vs un-enumerated-site layer at session 174 / un-enumerated-dimension layer at session 175 / un-enumerated-prop layer at session 163). Pattern continues to generalize across audit-bounded layers; would have been silent infinite-render-loop for ≤2-post vendors if C6 hadn't enumerated explicitly.
4. **"Compact chip row outside parent scroll container avoids touch-action conflict on drag-reorder"** — framer-motion Reorder.Group on touch needs `touch-action: none` on items; placing the strip in a vertical-stack layout (not nested inside a horizontal scroll-snap parent) sidesteps disambiguation entirely. Reusable for any future drag-reorder UI that needs to coexist with horizontal scroll above/below.
5. **"6-commit Arc-execution session as canonical Arc 2-shape pattern"** — Arc 2 follows the same 5-7 commit pattern that Arc 1 followed (session 196: 6 commits 1.1-1.6 sequencing smallest→largest). The Arc-pattern repeatability accumulates substrate per session-145 NEW pattern at scale; each Arc lowers the cost of the next Arc by accumulating canonical commit-shape vocabulary. Future Arc 3 (brand identity pass) + Arc 4 (caption gen) + Arc 5 (polish + iPhone QA) expected to follow same shape.

### Net runtime change
**+905 / −666 LOC across 4 files + 1 new lib utility + 1 new hook** (Arc 2 C1-C6: 2 new lib files + wrapper refactor + handler swap + 2 affordance additions; -695 LOC delete byproduct of refactor). Codebase nets **+239 LOC overall** despite the large delete because the multi-card carousel + capture pipeline + multi-tier share fallback + regenerate + reorder + insufficient-posts branch all ship new functionality.

### iPhone QA watch-items
- `/my-shelf` (vendor self-view OR admin managing vendor via ?vendor=<id>): tap masthead share airplane → 4-tile grid renders → tap **Shelf Image** → sub-screen opens with "Generating your 5-card Story…" → carousel populates with 5 captured previews (hero / 3 finds / CTA) labeled 1-5.
- **Reorder strip below carousel**: drag a chip to a different position → carousel re-captures + reflects new order. Hero + CTA chips stay fixed (only 3 finds reorder).
- **Regenerate pill below reorder strip**: tap → if vendor has >3 posts, picks shuffle + carousel re-captures with new finds; if exactly 3 posts, hook variant on hero card cycles + capture re-runs.
- **Share button**: tap → iOS Share Sheet opens with 5 PNG file attachments + caption text pre-filled in clipboard (vendor pastes after) + booth URL in url field. On devices that reject multi-file, falls back gracefully to single-card share. On desktop, opens FB sharer in new tab + downloads all 5 PNGs sequentially.
- **Download all 5 cards button**: tap → 5 PNGs land in Files app with `treehouse-finds-{slug}-{1-hero|2-find-1|3-find-2|4-find-3|5-cta}.png` filenames + caption auto-copied to clipboard.
- **Empty state coverage**: vendor with 0 posts → "Add at least one find" copy (existing); vendor with 1-2 posts → "Add at least 3 finds to your shelf to share a 5-card Story sequence" copy (NEW C6 branch).
- **Capture latency target**: <4s on iPhone 12+. If actual measured latency is significantly higher, D13 progressive-capture escalation lands as Arc 2.5 dial commit (pre-scoped in C2 commit body).
- **D14 empirical validation**: confirm `navigator.share({ files: [all 5] })` succeeds on iOS Safari 16+ and Android Chrome 75+. If multi-file is rejected, the single-card fallback path activates and analytics fires `method: "native_share_single"` instead of `"native_share_multi"`.

[v0.197.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.197.0

---

## [v0.196.0] — 2026-05-25

### Session 196 — Share My Shelf revival + owner-only gating + Shape C enrichment design pass (Frame β multi-card Story + Frame ii balanced co-brand) + Arc 1 substrate end-to-end — 11 commits + 1 close

David's session-open redirected from recommended Ask #4 visual analytics admin tab design pass into picking up the parked Share My Shelf social image generator (session 152 ship-and-park within same session; code preserved with documented revive contract in 2 file-top comments). Cost-shape triage at the outer layer surfaced Shape A (revive AS-IS) / Shape B (design-pass-first) / Shape C (multi-format vendor marketing toolkit, 4-6 session arc) — David picked Shape C after the framing: *"This is a huge selling feature for vendors to promote their booth on social without a lot of effort on their part. The interface should feel intuitive but equally important is that the end result needs to be share worthy."*

What would historically be 3-5 separate sessions (revival commits + reference scan + V1 mockup + V2 mockup + decisions lock + Arc 1 substrate) compressed into ONE focused session because the operating-system rules composed cleanly at scale: cost-shape triage at 4 levels (outer Shape A/B/C + 2 inner Shape A/B/C + Shape α/β/γ for V1 axis A) + reference-first scan at 6th cumulative firing (Spotify Wrapped / Strava / Apple Fitness / Peloton / Pinterest / Canva / Etsy as canonical share-worthy auto-generated-asset references) + V1 spanning highest-leverage structural axis (Axis A Story format composition with 3 frames α/β/γ) + V2 spanning fill-refinement axis (Axis B brand identity depth with 3 frames i/ii/iii) + 3 prose questions batched via single AskUserQuestion locking remaining axes (Axis C Feed↔Story + Q1 caption strategy + Q2 regenerate scope) in one round-trip + design record amended with 16 frozen decisions D1-D16 + 7 component contracts + Arc 1 commit-level sequencing 1.1-1.6 smallest→largest.

**34th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted** — Arc 1 ran clean as pure execution against design record §3.5 with zero re-scoping mid-flight. Load-bearing operating mode validated yet again on yet another feature (35+ different features now). **5th cumulative firing post-promotion of `project_vendor_value_first_prioritization` ✅ Promoted** — Share My Shelf vendor marketing toolkit is core paid-user-value substrate composing onto sessions 184-187 vendor-profile-enrichment arc. **5th cumulative firing of `feedback_testbed_first_for_ai_unknowns` ✅ Promoted at session 118** — `/share-shelf-test` smoke route extends the postcard-test → search-bar-test → geolocation-test → vendors-test → share-shelf-test pattern. **6th cumulative firing of `feedback_reference_first_when_concept_unclear` ✅ Promoted** validates promotion-strength yet again.

### Added
- **Share Sheet 5th hook restored** (commit C1 `210b424`, +36/−8) — Shelf Image tile reintegrated into ShareSheet per session 152 documented revive contract. PiImageSquare import + ShelfImageShareScreen import + Screen union extension + handleShelfImageTap + 4th GridScreen tile + render branch. Single coupled commit per 5-hook contract triplet.
- **`showShelfImage` owner-only gate** (commit C2 `24e27fc`, +41/−18) — Booth entity discriminator extended with parallel additive optional flag matching session 192 `showQr` precedent. `/my-shelf` passes `showShelfImage: true`; `/shelf/[slug]` stays default false. Per-affordance gating preserved (separate flags rather than dual-purposing one shared owner-mode flag).
- **Shape C design record + V1 mockup** (commit C3 `c1a1d74`, +1,212) — `docs/share-my-shelf-enrichment-design.md` with strategic framing + cost-shape locks + reference scan + V1 mockup spanning Axis A 3 frames (α single-card / β multi-card sequence / γ tappable template). David picked Frame β (canonical Spotify Wrapped pattern; 4-6× more brand impressions per share).
- **V2 mockup spanning Axis B** (commit C4 `3e35cc0`, +1,053) — `docs/mockups/share-my-shelf-enrichment-v2.html` with 3 brand-identity-depth frames (i Light Treehouse / ii Balanced co-brand / iii Heavy Treehouse). David picked Frame ii balanced co-brand. Recommendation rationale tied to pre-beta brand recognition reality (Treehouse chrome doesn't yet carry equity to spend Spotify-Wrapped-style heavy).
- **D1-D16 frozen + component contracts + Arc 1 sequencing** (commit C5 `aac1c1c`, +57/−2) — Design record §3.5 amended with 16 frozen decisions + 7 component contracts (StoryHeroCard / StoryFindCard / StoryCtaCard / FeedCard / ShelfImageShareScreen refactor / lib/aiShelfCaption.ts / /share-shelf-test) + 6-commit Arc 1 sequencing smallest→largest.
- **`v2.priceGold` token** (Arc 1.1 commit `c883377`, +10 LOC) — #FFD89B semantic for price-on-dark-photo-overlay across StoryFindCard + FeedCard. 2nd-consumer extraction trigger met (inline-first-extract-on-2nd rule honored).
- **`<StoryHeroCard>` at 1080×1920** (Arc 1.2 commit `d134308`, +183 LOC) — Story sequence card 1 of 5 with green-gradient bg (v2.accent.green → v2.accent.greenMid 160°) + 280px PiLeafFill glyph motif at low opacity + Cormorant italic 132px vendor name + booth pill + mall city/state + AI hook with hairline-border closing.
- **`<StoryFindCard>` at 1080×1920** (Arc 1.3 commit `25b9f5e`, +175 LOC) — Story sequence cards 2-4 with full-bleed photo (`crossOrigin="anonymous"` for Supabase CORS) + bottom dark gradient + title Cormorant italic 92px + price priceGold Times New Roman 76px + cream booth tag upper-left (D16 survives screenshot/repost) + cream leaf bubble upper-right.
- **`<StoryCtaCard>` at 1080×1920** (Arc 1.4 commit `ca3c7fc`, +150 LOC) — Story sequence card 5 with v1.postit bg + 8px dashed green border + Inter "Visit Booth N" small-caps header + 640×640 QR via react-qr-code (green-on-postit fgColor/bgColor override) + Cormorant italic "See the shelf before you visit" invite + Inter URL preview (strips protocol) + Times New Roman wordmark.
- **`<FeedCard>` at 1080×1350** (Arc 1.5 commit `a5e33f4`, +210 LOC) — Feed format single-card-repurposed per D6 with top 168px green hero strip ("This week at {vendor_name}" Cormorant italic) + photo region matching StoryFindCard pattern (booth tag + leaf bubble + title + price priceGold meta).
- **`/share-shelf-test` smoke route** (Arc 1.6 commit `e25cbab`, +260 LOC) — Mounts all 4 Arc 1 components with `FIXTURE_VENDORS[0]` + `FIXTURE_MALL` + `FIXTURE_POSTS[0..2]` fixture data + 5-card Story horizontal scroll + Feed companion below + in-page notes section documenting Arc 1 scope. transform:scale(0.3) for viewport-reviewable visual at full pixel fidelity (html2canvas capture in Arc 2 targets unscaled DOM nodes). 47 → 48 total routes.

### Changed
- ShareSheet GridScreen `onShelfImageTap` prop is OPTIONAL (matches session 192 `onQrTap?` pattern); tiles array uses spread-conditional. Render matrix: `/shelf/[slug]` (showQr=false, showShelfImage=false) → [Email, SMS] = 2 tiles; `/my-shelf` (showQr=true, showShelfImage=true) → [Email, SMS, QR, Shelf Image] = 4 tiles. Admin View (`/my-shelf?vendor=<id>`) inherits the 4-tile grid via session 148 admin-vendor-parity Pencil precedent — admin acts as vendor-manager on the management surface.
- Booth entity discriminator (`ShareSheetEntity` union in `components/ShareSheet.tsx`) extended with `showShelfImage?: boolean`.
- Design record `docs/share-my-shelf-enrichment-design.md` adopts §3.5 with D1-D16 frozen decisions + 7 component contracts + Arc 1.1-1.6 commit-level sequencing.

### iPhone QA watch-items
- `/my-shelf` (vendor self-view OR admin managing vendor): tap masthead share airplane → 4-tile grid [Email, SMS, QR, Shelf Image] renders cleanly → tap Shelf Image opens sub-screen → 1080×1350 capture completes → 4 actions (Share / Download / Copy caption / Copy booth link) all work.
- `/shelf/[slug]` (admin direct land OR shopper OR vendor-not-owner): tap masthead share airplane → 2-tile grid [Email, SMS] only — Shelf Image + QR both absent.
- `/share-shelf-test` visual review (local dev OR Vercel preview): Frame β 5-card multi-card composition reads coherently; Frame ii balanced chrome (~40% Treehouse) reads right for pre-beta brand recognition; Cormorant italic typography legible at all card scales (132px / 92px / 72px / 56px); priceGold contrast on dark photo overlay reads clearly; QR + CTA card density breathes; booth tag + leaf bubble visible across all 3 find cards.

[v0.196.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.196.0

---

## [v0.195.0] — 2026-05-25

### Session 195 — Pending-vendor-request routing landing closes session-193 admin-email-test bug + admin PIN gate retired (security fix, parallel-auth bypass of email-OTP boundary) — 4 runtime commits + 1 close

David opened with `/session-open`; standup recommended Ask #4 visual analytics admin tab design pass + 8-tag batched walk. David redirected with a bug noticed during the session-193 admin email test: a user who submits `/vendor-request` then signs in via `/login` OTP before admin approval was landing on `/welcome`'s "Just exploring vs Set up booth" disambiguation, inviting a duplicate submission. Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized the existing v1.1k `<DoneScreen state="already_pending">` sub-state inside `/vendor-request` — never reachable from /login post-OTP today, only from a duplicate form re-submission. Per `feedback_enumerate_states_in_self_heal_helpers` ✅ Promoted (2nd cumulative firing post-promotion — session 123 was 1st), session-123's self-heal short-circuit assumed `"none"` was terminal; pending vendor_request is the un-enumerated intermediate state between truly-new and approved-and-linked.

Shape A picked: query param + routing seam. 3 runtime commits sequenced smallest→largest closed the routing gap. After David's clean iPhone QA walk on the pending-vendor fix, David surfaced a 2nd bug — the admin PIN gate at `/admin/login` is an insecure parallel-auth path. Audit confirmed: PIN bypasses email-OTP's security boundary (anyone with the static `ADMIN_PIN` env var could request + verify an admin OTP without proving inbox control). C4 retired it end-to-end. Net runtime change across the session: **+147 / −538 LOC = −391 LOC overall** — codebase shrinks while shipping 1 routing-gap fix + 1 security-gate retire.

### Added

- **`app/api/vendor-request/check-pending/route.ts`** — POST with `requireAuth` + service-role lookup of `vendor_requests` by `lower(email)` WHERE `status='pending'`. Mirrors `/api/setup/lookup-vendor` auth shape. Returns `{ ok, hasPending }`. Single-row indexed lookup via existing `vendor_requests_email_pending_idx` (migration 005).
- **`ExtendedUserRole` type** in `lib/auth.ts` — `UserRole | "pending_vendor"` surfaced on routing-only wrapper. Pure `UserRole` stays untouched so chrome consumers (`lib/useUserRole.ts` → BottomNav) don't have to handle pending state.
- **`hasPendingVendorRequest()` helper** in `lib/auth.ts` — client-side helper that POSTs to `/api/vendor-request/check-pending` via `authFetch`. Defensive try/catch returns `false` on any failure.
- **`?state=pending` query param** on `/vendor-request` — when authed user lands with this param, pre-renders the existing `DoneScreen` "already_pending" state on mount instead of the empty form. Authed-gate guards against direct URL access by unauth'd users.

### Changed

- **`lib/auth.ts` `detectUserRoleWithAutoClaim`** return type widens to `Promise<ExtendedUserRole>`. After auto-claim doesn't link any rows, checks for pending vendor_request — if found, returns `"pending_vendor"` so routing surfaces land the user on the existing DoneScreen instead of /welcome.
- **`app/login/page.tsx` `pickDest`** + **`app/welcome/page.tsx` mount-time role-detect** — single coupled commit (C3) adds the `"pending_vendor"` routing branch (`router.replace("/vendor-request?state=pending")`) BEFORE the shopper branch (shopper-with-pending-vendor-approval is still pending-vendor for routing purposes).
- **`app/admin/page.tsx:559` unauth redirect** — `/admin/login` → `/login` (session 195 admin PIN retire). Admin now signs in via the same email-first OTP flow as every other user; `isAdmin(user)` email-match against `NEXT_PUBLIC_ADMIN_EMAIL` continues to enforce /admin access.
- **`CONTEXT.md`** — scrubbed 7 current-state references to `/admin/login` + `/api/auth/admin-pin` + `ADMIN_PIN` as scope-adjacent dead-code byproduct per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (route table + API table + sign-in pattern section + env var table + working-features list + rate-limit list + sprint-status table). Historical CHANGELOG references preserved (audit trail).

### Removed

- **`app/admin/login/page.tsx`** (-340 LOC) — Dedicated PIN entry UI. Parallel-auth shortcut that bypassed email-OTP's security boundary; retired session 195. Admin signs in via `/login` like everyone else.
- **`app/api/auth/admin-pin/route.ts`** (-85 LOC) — Server PIN verify + service-role `generateLink` + email_otp extraction. Static-shared-secret risk (anyone with `ADMIN_PIN` value could request + verify admin OTP without inbox proof). Retired session 195.

### Fixed

- **Pending-vendor-request post-OTP routing** — vendor who submitted `/vendor-request` then signed in before admin approval was landing on `/welcome` disambiguation (inviting duplicate submission). Now routes to existing `DoneScreen` "already_pending" via new `"pending_vendor"` role. Closes bug surfaced during session-193 admin-email-test.
- **Parallel-auth security gap** — admin PIN entry at `/admin/login` allowed sign-in as admin via static-shared-secret without proving control of the admin email inbox. Retired via C4; canonical email-OTP flow is now the only admin sign-in path.

### iPhone QA watch-items

- **Pending-vendor landing** — QA'd clean this session on Vercel preview. Sign in with the email used during session-193 admin-email-test → route to `/vendor-request?state=pending` showing Clock glyph + "We already have you." + "Your request is in the queue..." copy.
- **Admin PIN retire** — production QA owed after merge. Sign in via `/login` with admin email → magic-link OTP → routes to `/` → tap masthead Profile bubble → `/admin` loads (admin gate enforced by `isAdmin(user)` email-match). 🖐️ HITL: remove `ADMIN_PIN` from Vercel project env (Production + Preview + Development scopes) — cleanup hygiene post-retire.

[v0.195.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.195.0

---

## [v0.194.0] — 2026-05-25

### Session 194 — R3 events write-path investigation closes substrate-healthy + Ask #2 visitor tracking shipped end-to-end (Shape C aggressive cadence) + R3 instrumentation completeness ship + latent session-58 staging migration-012 gap surfaced + closed — 6 runtime commits + 3 HITL pastes + 2 smoke tests + 1 close

David opened with `/session-open`; standup recommended the session-193-prefilled primary (R3 events write-path investigation + admin email QA + 7-tag batched walk). David: *"yes."* The R3 substrate question (`rows_before = 0` on session-193 prod TRUNCATE) was the load-bearing primary — visual-analytics tab design (Ask #4 Shape B) is moot if events isn't writing.

Probe 3 audit-first investigation (vendor_request_submitted end-to-end via /vendor-request POST → recordEvent → events table) verified **R3 substrate is healthy** in single round-trip. SQL probe returned `vendor_requests` insert at 18:02:38.015 + `events.vendor_request_submitted` row at 18:02:38.285 (270ms gap = exactly the code flow). `rows_before = 0` at session 193 was real-traffic-low (pre-beta organic activity essentially zero), not write-failure. Inverted finding: substrate is healthy + the enum has a 40-value gap — every `recordEvent()` for one of the newer 28 server-side EventType + 10 actively-wired client-side ClientEventType + 2 dormant share_shelf_image_* declared since session 91 had been silently failing with `invalid input value for enum event_type`.

Per cost-shape Shape C aggressive-cadence triage, shipped R3 instrumentation completeness (migration 023 + EventType + whitelist + `flagged_booth_explored` dead-declaration retirement) + Ask #2 visitor tracking end-to-end (migration 024 + `lib/visitorTracker.ts` ~210 LOC + VisitorTrackerMount client component + root layout adoption + `clientEvents.ts` track() hook + 3 HITL pastes + 2 smoke tests) same session.

Ask #2 design pass via two batched AskUserQuestion rounds (6 axes locked, all Recommended picks): Defer Vercel Analytics entirely · First interaction OR 10s dwell · localStorage forever · UUID minted at engagement moment (Design B — bot filtering by design) · `is_first_session` boolean in payload · Ship same session.

HITL paste on staging surfaced **session-58 latent gap**: 50≠55 math diagnostic → missing migration 012 (session-73 R3 v1.1 amendment 5 enum values). Fix applied in 1 round-trip per `feedback_cap_speculative_patching_at_3_rounds` round-0 escalation. Session 162 carry was framed as "migration 010+011 staging gap" — corrected: actual missing was 012. Prod paste clean at 55 on first verification.

Both smoke tests validated visitor_engaged end-to-end on prod (Run 1 incognito fresh visitor → `is_first=true, trigger="interaction", time_to_engage_ms=10, first_event_type="page_viewed"`; Run 2 refresh same tab → same visitor_id, `is_first=false`). Discovery: page_viewed IS instrumented on 5 surfaces (Home / /flagged / /shelf/[slug] / /my-shelf / /find/[id]) via existing useEffect-on-mount calls from prior sessions — session 193 framing was off. Session-193 admin alert email QA closed during Probe 3 (both emails landed).

### Added

- **`supabase/migrations/023_events_enum_completeness.sql`** — 40 idempotent `ALTER TYPE event_type ADD VALUE IF NOT EXISTS` statements covering all server-side + client-side event types added across sessions 91-186. Closes ~3-4 sessions of latent silent-no-op declarations.
- **`supabase/migrations/024_events_visitor_engaged.sql`** — Single `ALTER TYPE ADD VALUE IF NOT EXISTS 'visitor_engaged'`. Companion to Ask #2 visitor tracking.
- **`lib/visitorTracker.ts`** (~210 LOC) — Module-scope state machine that fires `visitor_engaged` once per browser session when the engagement threshold is met (first meaningful interaction OR 10s dwell). UUID minted at engagement moment (Design B — bots that bounce in <10s without tapping never receive a visitor_id). Persists in localStorage `th_visitor_id` forever; sessionStorage `th_visitor_engaged_fired` guard prevents duplicate fires per browser session. Posts directly to `/api/events` to avoid circular import with `lib/clientEvents.ts`.
- **`components/VisitorTrackerMount.tsx`** — Tiny "use client" wrapper that calls `initVisitorTracker()` on app boot. Mounts via `app/layout.tsx` body so the tracker fires across every surface (shopper + vendor + admin).
- **`visitor_engaged` event type** — Added to `lib/events.ts` EventType + `lib/clientEvents.ts` ClientEventType + `/api/events` route CLIENT_EVENT_TYPES whitelist + event_type enum on both staging + prod. Payload shape: `{ visitor_id, is_first_session, trigger: "interaction" | "dwell_10s", time_to_engage_ms, page_path, mall_scope, first_event_type? }`.
- **12 EventType union entries** in `lib/events.ts` — client-side types previously declared only in ClientEventType (session 100 find_swiped / R17 location_* + find_navigate_tapped + find_view_on_map_tapped / R18 flagged_directions_tapped / session 135 share_booth_* / session 152 dormant share_shelf_image_*). Single-source-of-truth completeness.
- **13 CLIENT_EVENT_TYPES whitelist entries** in `app/api/events/route.ts` — closes the long-standing drift gap acknowledged at session 137 commit body. Without these, route returned 400 silently for the affected client events.
- **`notifyVisitorInteraction()` hook** called from `lib/clientEvents.ts` track() — fires the visitor tracker on first meaningful interaction; defensive try/catch ensures tracker bugs never disrupt the original track() flow.

### Changed

- **`app/layout.tsx`** — VisitorTrackerMount mounts as the first child of `<FindSessionProvider>` (sibling-before-{children} so the tracker initializes before any page-level content fires interactions on first paint).
- **`lib/clientEvents.ts` track()** — gains `notifyVisitorInteraction(event_type)` hook before the existing flow. Guard skips visitor_engaged itself to avoid recursion (tracker also guards internally — belt-and-suspenders).

### Removed

- **`flagged_booth_explored`** ClientEventType declaration (dead-declaration cleanup per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted). Declared at session 99, **0 callsites in any consumer** confirmed via session-194 audit-first grep. Pattern extends dead-code-cleanup to dead-type-declarations.

### Fixed

- **Latent session-58 staging migration-012 gap closed** during HITL paste — `booth_bookmarked`, `booth_unbookmarked`, `find_shared`, `tag_extracted`, `tag_skipped` enum values backfilled on staging. Surfaced via 50≠55 math diagnostic before any speculative patching.
- **R3 instrumentation silent-no-op for 28 newer server-side event types** — closes ~3-4 sessions of latent failure mode. `recordEvent()` for booth_*_by_admin, mall_hero_*_by_admin, share_mall_*, share_find_*, vendor_force_*_by_admin, home_strip_tapped, map_carousel_*, vendor_profile_enriched, etc. now writes cleanly post-paste.

### iPhone QA watch-items

- **8 production tags** awaiting batched iPhone PWA walk (v0.187.0 → v0.194.0) — combinable with future production-touching work.
- **Visitor tracking strictness** — current behavior counts `page_viewed` as engagement (because lib/clientEvents.ts track() hooks any non-`visitor_engaged` event). Looser than session-193 framing ("first tap or 10s") implied. Tier B headroom captured in `lib/visitorTracker.ts` module header: filter `page_viewed` from `notifyVisitorInteraction` for stricter beta-grade bot filtering. Watch real-content behavior on /flagged + /shelf/[slug] + /find/[id] for any cohort-skew oddness.

[v0.194.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.194.0

---

## [v0.193.0] — 2026-05-21

### Session 193 — Strategic analytics conversation + Ask #1 events reset (HITL prod) + Ask #3 admin alert email on new booth request — 1 runtime commit + 1 HITL + 1 close

David opened with `/session-open`; standup recommended batched iPhone PWA walk across 6 production tags (v0.187.0 → v0.192.0) + customer-feature-list review. David redirected to a 4-axis strategic analytics ask: (1) reset events table for clean live-data baseline; (2) track new visitors (currently no page-view event tracked anywhere); (3) email david@zenforged.com on new booth request submission; (4) visual entity-resolved analytics admin tab (raw `find_id` / `vendor_slug` strings replaced by photo + title + price tiles).

Strategic conversation surfaced the load-bearing connection between asks #2 and #4: the events table tracks specific *actions* (saves, shares, bookmarks) but NOT page views — so "what pages are getting viewed" is a data shape that doesn't exist yet. Page-view tracking is the substrate ask #4 needs to work visually. Vercel Analytics ($10/mo Pro, built-in) handles unique visitor counts + top pages natively with zero engineering; complementary to a custom entity-aware in-app tab. Per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132, surfaced 3 cost shapes per ask + load-bearing clarification questions before drafting any code. David picked: full wipe both environments / "engaged visitor" definition recommended for #2 (deferred to session 194) / Shape B new dedicated Engagement tab for #4 / ship #1 + #3 today, defer #2 + #4.

### Added

- **`sendNewBoothRequestAlert()` in `lib/email.ts`** — internal admin alert email mirroring existing `sendRequestReceived` shape; reuses `renderEmailShell` + paper-cream brand tokens. Body includes proof photo banner (540px max-width, 12px radius, 1px hairline border) + details block (Name / Email / Mall / Booth # / Booth name; em-dash placeholder for null booth fields) + "Review in admin" full-width green CTA linking to `/admin`. Recipient defaults to `david@zenforged.com`, overridable via `ADMIN_ALERT_EMAIL` env var. `replyTo` set to vendor's email so admin can reply directly from inbox to ask follow-up questions. Best-effort delivery — a failed send NEVER fails the underlying `/api/vendor-request` POST.

### Changed

- **`/api/vendor-request` POST email-send block** — parallelized via `Promise.all([sendRequestReceived(...), sendNewBoothRequestAlert(...)])`. Both sends are independent + best-effort; parallelization shaves ~200ms off response time without changing failure semantics. Each send's `!ok` result logs via the existing `logError` helper.

### Fixed

- **R3 events table baseline** — `TRUNCATE TABLE events` applied to prod via HITL SQL paste (BEGIN/COMMIT-wrapped with `COUNT(*)` audit before + after). Staging skipped per David's call (was never fully synced; will rebuild if a preview surface is needed for #2/#4 implementation). **Discovery flagged for session 194**: `rows_before = 0`. R3 events have been wired since session 73 (~120 sessions); the empty baseline suggests writes may be silently failing in prod OR the table was wiped externally. Investigation owed before visual-analytics tab design (Shape B for ask #4) — the tab is moot if the substrate isn't writing. Carries as session 194 primary investigation.

### iPhone QA watch-items

- Submit a test booth request via `/vendor-request` on production; confirm `david@zenforged.com` receives the alert email with: proof photo banner, all 5 details rows populated (or em-dashes for null booth fields), Review-in-admin CTA routes to `/admin`, replyTo header carries vendor's email address.
- Confirm vendor still receives `sendRequestReceived` receipt (existing behavior preserved through parallel-send refactor).

[v0.193.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.193.0

---

## [v0.192.0] — 2026-05-20

### Session 192 — 5-finding iPhone-QA-driven dial bundle: F5 caption hairline + F2 BoothCloser retire on /shelf + F4 ✓ Found indicator gated for MVP + F3 ShareSheet QR scope owner-only + F1 social-link about:blank fix — 5 runtime commits + 1 close

David opened with `/session-open` against stale local context (project actually at session 191, not 163 per loaded CLAUDE.md). Local main was **31 commits behind origin/main**; resolved via `feedback_worktree_drift_reset_and_cherry_pick.md` ✅ Promoted at session 153 detection sub-pattern + new "stash-rename + FF" resolution sub-pattern (preserves in-progress brand-asset work without clobber).

David then surfaced **5 iPhone QA findings** in single message — instead of running the recommended batched walk across v0.187.0 → v0.191.0, the walk happened ahead of session-open + the findings landed inline. Bundle ran end-to-end without a design pass per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132: all 5 findings triaged as **Shape A pure dials** (audit-first surfaced concrete fix shape per finding; no V1 mockup needed). 5 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 (5 firings this session, ~579+ cumulative).

Audit-first parallel grep on all 5 findings before drafting any code; 3-question batched `AskUserQuestion` resolved 3 independent unblocking decisions (F4 radio identity + F2 retire scope + home-hero worktree-drift) in 1 round-trip per `feedback_user_clarification_restate_interpretation` ✅ Promoted. Build clean at every commit boundary; tsc + `npx next build` clean across all 48 routes throughout.

### Added

- **F5 hairline above generated caption on `/find/[id]`** — `v1.inkHairline` divider inside existing caption wrapper conditional so it renders only when `post.caption` is non-null. Matches the `v1.inkHairline` pattern at line 666 on same page. Width 100% inside wrapper's `padding 0 30px`; `marginBottom: 22` leaves quiet breath before the italic opening quote.
- **F3 BoothEntity.showQr opt-in capability flag** — discriminated-union ShareSheet entity type extended with `showQr?: boolean`. `/my-shelf` callsite passes `showQr: true` (owner-view); `/shelf/[slug]` callsite stays default (shoppers AND admin viewing /shelf see Email + SMS only). Sub-pattern of session-80 BoothHero `saved + onToggleBookmark` opt-in extended to discriminated-union entity capability flag.

### Changed

- **F1 AboutBoothSection FB/IG social links** — swap from `<button onClick={() => { track + window.open(url, "_blank", "noopener,noreferrer") }}>` to native `<a href={url} target="_blank" rel="noopener noreferrer" onClick={() => track()}>`. iPhone Safari treats JS-initiated tabs as popups without intact parent reference, so back-nav landed on `about:blank` instead of /shelf. User-initiated anchor click creates a proper tab with intact history. Same secure-link intent as D9 (target=_blank + noopener + noreferrer), different implementation — explicitly NOT a design reversal per `feedback_surface_locked_design_reversals` ✅ Promoted; surfaced in commit body.
- **F4 SavedFindRow grid template** trimmed from `"24px 64px 1fr 36px"` → `"64px 1fr 36px"` to avoid 36px dead-space gutter when `<FoundCheckCircle>` render is gated. Revival: two flips (`false → true` on render line + template restore).

### Removed

- **F2 `<BoothCloser>` mount on `/shelf/[slug]`** — closer text "Thanks for visiting my booth..." (session 157 ship + session 167 refinement) reads redundant after vendor profile enrichment Arc 2 (session 187) gave each booth its own bio + social links + in-mall directions. Component preserved in `components/BoothPage.tsx` for `/my-shelf` consumer + future /shelf revival. Historical comments on /shelf referencing BoothCloser placement left as design-lineage documentation.
- **F3 FindShareBody QR channel + screen state machine** — `FindGridScreen` tiles drop QR (SMS + Copy Link only); `screen` state collapses to single-grid render (`useState` + `useEffect` reset + `showBack` + `onBack` all retire as dead-code byproduct per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted); `FindQrScreen` function deleted (~33 LOC; was FindShareBody's only consumer).
- **F3 `share_find_qr_viewed` event type** — retired from 3 declarations: `lib/clientEvents.ts` union + `lib/events.ts` union + `app/api/events/route.ts` CLIENT_EVENT_TYPES whitelist. `share_find_channel_tapped` keeps its existing "qr_code" payload value (no new rows will fire it going forward from find-tier; preserved for historical event rows).
- **F4 `<FoundCheckCircle>` render in SavedFindRow** — wrapped in `{false && <FoundCheckCircle ...>}` per session 191 NEW pattern "long-range Edit via `{false && ...}` dead-code preservation" extended to single-render-line scale. **2nd firing of session 191 pattern → Tech Rule promotion-ready on 3rd firing.** Hook + props + component file all stay wired untouched; find-to-found product thesis from session 121 stays valid (temporary MVP scope-trim, not retirement).
- **F1 `window.open()` JS-initiated tab open** — replaced by user-initiated anchor (see above).

### Fixed

- **F1 iPhone Safari about:blank back-nav on social links** — root cause: `window.open()` from a click handler creates a popup-style tab without intact parent reference; tapping browser back lands on `about:blank` instead of the originating page. Fix: native `<a target="_blank">` anchor (user-initiated nav → normal tab with proper back-history).

### iPhone QA watch-items

- **F5 caption hairline** reads as designed on `/find/[id]` (only renders when caption exists; should sit just above the opening italic quote with quiet breath).
- **F2 /shelf bottom** feels right after BoothCloser retire (no awkward gap; BoothHero content rolls naturally into BottomNav).
- **F4 row layout** reflows cleanly on `/saved` — no dead 36px gutter on the left of each saved-find row.
- **F3 ShareSheet QR** appears on `/my-shelf` (vendor owner-view) + **absent** from `/find/[id]` AND `/shelf/[slug]` (shoppers + admin). SMS + Email + Copy Link channels unchanged on respective surfaces.
- **F1 social link tap** → external app/browser opens FB or IG → tap browser back → returns to `/shelf/[slug]` cleanly (not `about:blank`).

[v0.192.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.192.0

---

## [v0.191.0] — 2026-05-20

### Session 191 — EditBoothSheet UI revisit (Q-016 carry from session 186): 4-section structure + photo overlays + FB/IG icon prefixes + dynamic URL preview + WCAG launch-blocker fix caught by design-reviewer subagent — 7 runtime commits + 1 close

David redirected from recommended batched iPhone QA into Q-016 EditBoothSheet UI revisit. Sheet grew organically from 2 fields → 7 fields across sessions 184-187 vendor profile enrichment arc; this session restructured holistically into 4 numbered sections + photo affordance overlay primitive + Phosphor icon prefixes on social inputs + escape-hatch /contact Link + sub-text size bumps + bio placeholder color fix + directions UI counter.

Two cost-shape triages this session: (1) META Shape A at session-open per `feedback_pre_mockup_prose_model_first` ✅ Promoted + `feedback_v2_options_before_drafting` ✅ Promoted at session 135 — David's prose covers structural axes; 8 batched `AskUserQuestion` answers cover fill axes; no V1 mockup needed. (2) Post-implementation Shape B at design-reviewer subagent review — 4 prose-resolvable axes after agent caught launch-blocker WCAG fail.

17 frozen decisions D1-D17 in `docs/edit-booth-sheet-revisit-design.md` + 4 explicit reversals R1-R4 (session 186 D2 divider / D5 sibling buttons / D10 counter / D11 field labels) + 6 Tier B headroom items + 7-row risk register. **33rd cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted** across 33+ different features — D1-D17 ran clean through C2-C4 implementation with zero re-scoping mid-flight.

**First production catch of a launch-blocker by the design-reviewer subagent.** After C4 push, dispatched `Agent({ subagent_type: "design-reviewer" })` for citation-grounded code review against the locked design record. Agent caught REC-1: "Need to update?" Link at v2.text.muted (#A39686) on cream (#FFFCF5) computes ~2.85:1 — fails WCAG 2.1 SC 1.4.3 (4.5:1 for interactive text <18px). Same offender class session 174 contrast audit Shape β closed (baseline 99 → 0); session 191 C4 reintroduced it on a brand-new affordance the audit didn't enumerate. **3rd cumulative firing of `feedback_subagent_dispatch_catches_audit_drift`** ✅ Promoted-via-memory at session 173 — sub-pattern: agent catches what humans + audits miss when bug-class substrate is freshly relevant.

Shape B improvement bundle (4 commits sequenced smallest→largest): C5 REC-1 contrast fix (Link color v2.text.muted → v2.text.secondary; matches session 153 /login footer canonical) + C6 Save CTA breathing room (24px wrapper marginTop) + C7 Section 1 sub-header (promotes Tier B3 to V1 per agent REC-2 Gestalt similarity reasoning) + C8 dynamic canonical URL preview + scope-adjacent WCAG fix on FB/IG helpers (`npm run lint:contrast` back to pre-session-191 baseline of 3 pre-existing violations).

The 6-session arc from "build the subagent" (session 172) → "first dispatch validates trust contract" (173) → "audit drift catch" (173) → **"first launch-blocker catch before merge"** (191) is itself a compounding-discipline data point: operational substrate investments repay their cost in a measurable way each session. Session 191 compressed what would historically be 2-3 sessions (design pass + implementation + post-implementation QA + post-QA fix bundle) into one focused session because the operating-system rules all composed cleanly at this scale.

### Added

- **`docs/edit-booth-sheet-revisit-design.md`** — 17 frozen decisions D1-D17 + 4 reversals R1-R4 + 6 Tier B headroom + 7-row risk register + 5-arc implementation sequencing (~336 LOC).
- **Camera-bubble + trash-corner photo affordance overlay pattern** in `EditBoothSheet.tsx` for both Booth photo (84×84 rounded-8) + Profile photo (96×96 circular). Photo container itself becomes the tap target → file picker. Trash-corner stops propagation so it doesn't double-fire the picker. Keyboard-accessible via `role="button"` + Enter/Space handler. aria-label per state.
- **PiFacebookLogo + PiInstagramLogo icon prefixes** on social URL inputs (v2.accent.green, size 18, absolute-positioned in left padding slot). Matches session 187 AboutBoothSection display canonical for consumer/edit visual symmetry.
- **Dynamic canonical URL preview helper text** below FB/IG inputs — empty input shows "We'll format this as a link." (forward-looking); non-empty + valid shows "Will display as: {stripped-canonical}" so vendor sees what's saved without scrolling the input. `wordBreak: break-all` wraps long URLs multi-line.
- **`<Link href="/contact">` inline escape-hatch** in Section 1 booth-name helper. Uses `/contact` route from Wave 1 session 92 — reuses 100% of existing infrastructure per `feedback_synthesize_existing_row_to_reuse_flow_infra` ✅ Promoted.
- **4 numbered section wrappers** (Your Booth Identity / About Your Booth / Connect With Shoppers / Find Me in the Mall) with Cormorant 18 upright titles + Cormorant italic 14 sub-headers.
- **Section 1 sub-header** *"Show shoppers your booth's photos and name."* added post-QA per design-reviewer REC-2 (promotes design record Tier B3 to V1).
- **`.th-bio-textarea::placeholder` CSS rule** (`color: v2.text.muted; opacity: 1`) so Firefox honors the explicit placeholder color (browser default light-gray was hard to read).
- **`DIRECTIONS_MAX_LEN` + `DIRECTIONS_WARN_LEN` constants** mirroring bio's 280-char pattern; directions textarea slice-caps onChange; UI counter at bottom-right turns red at 270+.
- **`dirsValid` check** in `canSave` predicate.

### Changed

- **`/api/vendor/profile`** — `DIRECTIONS_TEXT_MAX_LEN` constant 500 → 280 mirroring the new vendor-facing cap. Error message updates to match. R3 reversal of session 186 D10 surfaced explicitly per `feedback_surface_locked_design_reversals` ✅ Promoted.
- **EditBoothSheet field labels dropped** where section header carries meaning — Bio / Facebook URL / Instagram URL / In-mall directions labels retire (R4 reversal of session 186 D11). aria-label attributes added on unlabeled inputs so screen readers carry the field name.
- **Profile photo moved** from inside the vendor-only block at the bottom into Section 1 (Your Booth Identity) per D12. Gated by `{mode === "vendor" && ...}` since avatar is vendor-mode only.
- **Sub-text size bumps** per D8 — field labels FONT_INTER 13 → 14, helper text 14 → 15, char counters 11 → 12.
- **Bio textarea placeholder copy** simplified — "Tell shoppers about your booth — what you specialize in, what makes it worth visiting…" → "What you specialize in, what makes it worth visiting…" (section sub-header now carries the "tell shoppers" framing).
- **"Need to update?" Link color** v2.text.muted → v2.text.secondary (REC-1 launch-blocker WCAG fix; ~2.85:1 → ~6.9:1 on cream).
- **FB + IG helper text color** v2.text.muted → v2.text.secondary (same WCAG fix class as REC-1; closes 2 new lint:contrast violations session 191 introduced).
- **Save CTA wrapper** gains `marginTop: 24` breath above Section 4 counter (P1-C post-QA fix).
- **Section 1 h3 margin** "0 0 14px" → "0 0 4px" to compose with new sub-header's "0 0 14px" for consistent 18px total bottom breath matching Sections 2-4.
- **`package.json` version bumped 0.190.0 → 0.191.0** per Shape A versioning protocol.

### Removed

- **Session 186 D2 hairline divider** between booth-name + identity sections (R1 reversal; gap-only 32px section marginBottom delimiter per D3).
- **Session 186 D5 sibling Replace/Remove text-buttons** + `ImagePlus` icon usage (R2 reversal; camera-bubble + trash-corner overlays per D4).
- **Session 186 D10 no-UI-counter + 500-char defensive cap** (R3 reversal; UI counter at 280; server cap moves to match).
- **384-LOC dead-coded `{false && ...}` vendor-only block** retired via `sed -i 'start,end d'` per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (NEW Tech Rule candidate: "Long-range Edit via temporarily-dead-coded {false && ...} block + sed cleanup" — when Edit target too large for safe single-string-match, gate old block with `{false && expr}` then sed-delete; cleaner than multi-pass Edits that risk JSX brace miscount).

### Fixed

- **WCAG launch-blocker** on "Need to update?" Link (REC-1) — caught by design-reviewer subagent before merge. First production catch of a launch-blocker by the agent shipped session 172.
- **Long URLs flowing off input edge** without visual indicator (P1-B) — dynamic canonical preview below input shows full normalized URL so vendor sees what's saved.
- **Save CTA cramped against Section 4 counter** (P1-C) — 24px wrapper marginTop adds breath above Save changes button.
- **Section 1 lacks sub-header** breaking Gestalt similarity pattern Sections 2-4 establish (P2-A REC-2) — added matching directive voice sub-header.
- **Bio placeholder reads pale** (D9) — explicit `::placeholder { color: v2.text.muted; opacity: 1 }` rule overrides browser default light-gray.
- **24th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161 — html2canvas-pro node_modules drift (parked Share My Shelf from session 152); `npm install` at C2 commit boundary resolved in 1 round-trip per canonical recipe.

### Deprecated

- *(none)*

### iPhone QA watch-items

- Sheet body ~30% taller than session 186 baseline; on iPhone SE (smallest viewport) Save CTA requires scroll to reach. Risk-1 in design record captures this; B5 sticky-Save CTA promotion is the escalation path if friction surfaces.
- Bio Lora italic 15px entry voice (session 186 D7 lock) vs vendor's iPhone arm-length legibility — outside advisory bounds per design-reviewer subagent; brand-voice call. Watch for vendor feedback post-real-content-seeding.
- Photo overlay `role="button"` containers + sibling Trash button accessible-name parity — verify with VoiceOver enabled on iPhone QA (REC-3 advisory; likely passes — both have aria-labels).
- Long Facebook share URLs in preview helper wrap multi-line via `wordBreak: break-all`; verify legibility on real content seeding.

[v0.191.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.191.0

---

## [v0.190.0] — 2026-05-20

### Session 190 — Mapbox preview token HITL closes 36-session carry + /map auto-peek flyTo offset fix + 4-finding iPhone-QA dial bundle — 5 runtime commits + 1 close

5 runtime commits + 1 close + 1 empty preview-trigger commit. David picked the long-deferred 🖐️ HITL Mapbox preview-only token setup at session open: 5-step block-by-block walkthrough closes 36-session carry (156→189) permanently — separate preview-only token provisioned in Mapbox Studio with no URL restrictions + set as `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel Preview-scope env; production token URL-restricted untouched. David asked "is step 4 required?" mid-flow → trade-off surfaced + David picked Path B (fresh-branch verification via empty trigger commit `a20abe3`). David walked Vercel preview clean: warm-cream cartography on /map + static map snapshots on /find/[id] both render. Carry retires permanently.

Post-token-setup iPhone QA on preview surfaced /map auto-peek pin position bug (pre-existing from session 188 auto-peek substrate). Race between two TreehouseMap useEffects on mount when /map opens with pre-selected mall scope: scope-driven flyTo (800ms, NO offset) vs peek-state easeTo (320ms, WITH MAP_PEEK_OFFSET_Y). Longer animation lands last and overrides; pin lands at viewport center where callout obscures pin. Audit-first localized in 1 round per `feedback_visibility_tools_first` ✅ Promoted. Ref-based conditional offset shipped: apply `MAP_PEEK_OFFSET_Y` to scope-driven flyTo when `peekedMallIdRef.current === selectedMallId`. Both animations land at same target — race is no-op. 23rd cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161 (html2canvas-pro on flyTo fix; `npm install` resolved in 1 round-trip).

David walked /map ship clean + surfaced 4-finding refinement bundle in single message. Per `feedback_user_clarification_restate_interpretation` ✅ Promoted, restated each before drafting; cost-shape triage per finding per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132. 4 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 (5 firings this session); build clean at every commit boundary; tsc + `npm run build` clean across all 48 routes.

The session's structural beat: **preview-QA-gate-immediately-repays-setup-cost** (NEW Tech Rule candidate) — F2 surfaced a pre-existing bug latent since session 188 that only became visible because the preview QA loop newly worked, validating that operational-substrate investments repay their cost immediately when the next disciplined QA loop fires.

### Added

- **`lib/useUserLocation.ts`** — `{ requestPermission?: boolean }` option (default `true` backwards-compat). When false, hook subscribes to broadcasts but doesn't trigger fresh `getCurrentPosition`. Reusable pattern for any permission-prompt-prompting hook.
- **`components/TreehouseMap.tsx`** — `peekedMallIdRef` for scope-driven flyTo conditional offset. Reads peekedMallId via ref inside flyTo effect so peek changes don't add it to that effect's deps (which would re-fire the long 800ms animation on every carousel tap).
- **`components/BottomNav.tsx`** — file-top R10 D1 iteration log session 190 entry with before/after table for next refinement's reference. 9th cumulative iteration of R10 D1.

### Changed

- **`components/TreehouseMap.tsx`** — scope-driven flyTo now applies `offset: [0, MAP_PEEK_OFFSET_Y]` when `peekedMallIdRef.current === selectedMallId` (auto-peek scenario only). When scope changes without active peek for same mall, centering behavior unchanged.
- **`components/MapCarousel.tsx`** — outer fixed wrapper bg constraint: `left: 0, right: 0` + `margin: "0 auto"` + `maxWidth: 430` so wrapper clips to mobile column on desktop / landscape iPhone. Transform stays free for framer-motion `y` entrance animation. On mobile-narrow viewports (≤430), behavior unchanged.
- **`app/(tabs)/flagged/page.tsx`** — page-level `useUserLocation()` call updated to pass `{ requestPermission: false }`. Saved page subscribes without triggering prompt. If user granted permission earlier on /map (or any other requesting surface), cached state propagates via storage + custom event broadcasts; distance shows on Saved per-mall cards. Otherwise status stays `idle` → milesFromUser returns null → DistancePill renders nothing → sort falls back to save-recency desc.
- **`components/BottomNav.tsx` badge geometry** — bounded revision of session 157 Review Board Profile #1 verbatim spec (`top: 0, right: -2, minWidth: 24, height: 22, borderRadius: 20, fontSize: 13`) → canonical iOS/Android corner-bubble pattern (`top: -5, right: -7, minWidth: 16, height: 16, borderRadius: 999, fontSize: 10, boxShadow: 0 0 0 1.5px v2.surface.input`). Negative offsets push badge outside icon row so it floats over icon's top-right corner. Pill stays pill-shaped via minWidth + horizontal padding (extends for 2-3 digit counts). 1.5px cream halo matches nav-bar surface for clean edge separation. Reversal trail preserved in in-file comment block per `feedback_surface_locked_design_reversals` ✅ Promoted.
- **`components/BottomNav.tsx` tab array** — bounded reversal of session 121 R18 + session 179 "Saved holds slot 2" rule. Before: `Explore · Saved · Map · [Booth]`. After: `Explore · Map · Saved · [Booth]`. 9th iteration of R10 D1. New muscle-memory anchor: Map is always second-from-left; Saved sits at the more central position adjacent to the role-specialty slot when present. Session 114's "rightmost = role-specialty when present" rule preserved (Booth/Admin stays rightmost when vendor/admin authed). Prior reasoning quoted verbatim in commit body before drafting.
- **`package.json` version bumped 0.189.0 → 0.190.0** per Shape A versioning protocol.

### Fixed

- **/map pre-selected mall pin position bug** — pre-existing from session 188 auto-peek substrate; race between scope-driven 800ms flyTo (no offset) vs peek-state 320ms easeTo (with offset). Longer animation wins → pin centered → callout obscures pin. Shape A surgical conditional offset via ref shipped as `716507f`.
- **MapCarousel bg bleed past 430px mobile column** — on desktop / landscape iPhone, outer fixed wrapper bg flowed into negative-space gutters beside the centered (tabs)/ mobile column. Now clipped via margin auto + maxWidth.
- **Saved page geolocation prompt fires unwanted** — `useUserLocation` auto-prompted on first mount across all consumers per R17 silent-first-mount design. Saved-context (`/flagged`) now opt-outs via `{ requestPermission: false }`. NOT a R17 D3 design reversal — D3 specified silent prompt for FEATURE surfaces (/map + /find/[id] + /shelf); Saved per-mall distance was added in session 121 R18 without re-evaluating the prompt mechanic. This commit closes that gap with an opt-out, not by overturning the canonical D3 default — sub-pattern of `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141.

### Removed

- *(none — all changes are additive or in-place revisions)*

### Deprecated

- *(none)*

### iPhone QA watch-items

- **Pre-selected mall pin position** — open /map from Home with Crestwood/Middletown/America's pre-selected; confirm pin lands lower with callout above (matches Image 2 from session 190 chat, not Image 1).
- **Carousel bg on desktop / landscape iPhone** — confirm carousel bg clips to the 430px centered column instead of bleeding into gutters.
- **Saved silent geolocation** — sign out + open /flagged cold (no prior /map visit); confirm no location-permission prompt fires; per-mall distance pills hide silently; mall order falls back to save-recency.
- **Saved badge corner-pill** — confirm corner-pill sits at top-right of leaf icon (overlapping), with cream halo separating it from icon + nav bg.
- **BottomNav tab order** — confirm new order Explore → Map → Saved → [Booth if vendor]; role-specialty slot still rightmost.

[v0.190.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.190.0

---

## [v0.189.0] — 2026-05-20

### Session 189 — Admin Vendors tab Path B reversal: Force-unlink persistence + auto-claim vocab-drift fix + Relink end-to-end retirement — 3 runtime commits + 1 close

3 runtime commits + 1 close. David's calibration question on the admin "Relink to request" affordance crystallized a 62-session-deferred decision (session 127 Path A vs B) into a coherent 3-arc ship that retires 634 LOC of obsolete substrate while shipping a clean structural answer to "vendor wants to switch emails." Cost-shape triage fired at 3 levels per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132: META-level interpretation triage (A bug fix / B replace with re-invite / C both — David picked B); sub-design call on Force-unlink scope (a always denies / b checkbox / c two buttons — David picked a); format-level cost shape (Shape α no design record / Shape β short design record — David picked α). The Shape α pick is itself meaningful — well-shaped narrow behavioral changes can ship clean via commit-body audit trail when operating-system rules (smallest→largest + audit-first + single-coupled-commit + dead-code-cleanup-as-byproduct + surface-locked-design-reversals) compose to cover the documentation needs.

The session's load-bearing operational beat: audit-first via `feedback_visibility_tools_first` ✅ Promoted surfaced a 66-session-deep latent vocab-drift bug as adjacent finding during Arc 2 scoping. `app/api/setup/lookup-vendor/route.ts:97` filtered `.neq("status", "rejected")` but session 136's Requests tab redesign canonicalized the terminal status as `"denied"` via migration 021. The string `"rejected"` no longer exists in canonical vocabulary — `"denied"` was silently passing through auto-claim. Without this fix, Arc 2's Path B persistence wouldn't actually persist — auto-claim would still pick up denied requests on next sign-in. Sub-pattern of `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141: vocab-drift surfaced as adjacent finding, NOT design reversal. Captured as Arc 1 in commit body explicitly. 22nd cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at Arc 1 commit boundary (html2canvas-pro `npm install` resolved for session 152's parked component).

David's Vercel preview QA clean. Spotted one legacy operational issue post-ship: "Yesterday's Memories shows Disconnected status... I may just need a query for supabase to clear out that issue." — exactly the legacy pre-Path-B disconnected fossil flagged in Arc 3 commit body. Pre-session-189 force-unlinks left matchingRequest = approved while user_id = null; rows show DISCONNECTED with no actionable affordance. Shipped 3 SQL queries (VERIFY read-only + TARGETED single-row + BULK BACKFILL all-legacy) mirroring the live diagnosis predicate exactly. David ran the bulk backfill against production → "All clear." 5 legacy fossils cleaned in one paste. Legacy fossil retirement carry from Arc 3 closes same session.

### Changed

- **`app/api/setup/lookup-vendor/route.ts`** — auto-claim status filter `.neq("status", "rejected")` → `.in("status", ["pending", "approved"])`. Positive-list filter prevents future status additions from silently expanding claim-eligible set. Section-header comment updated to canonical "claim-eligible (status pending|approved)."
- **`app/api/admin/vendors/route.ts` `handleForceUnlink`** — Path B persistence. After clearing `vendors.user_id`, queries matching `vendor_request` (mall_id + booth_number + status pending|approved + most-recent-first) and updates to `status="denied"` with auto-generated `denial_reason: "Replaced by admin force-unlink — booth re-invited to new email"`. Fires `vendor_request_denied` event (session 136 D12 payload shape) with `source: "force_unlink"` discriminator. `vendor_force_unlinked_by_admin` payload extended with `denied_request_id` for audit traceability. Deny is best-effort (logs but doesn't fail the request).
- **`components/admin/ForceUnlinkConfirm.tsx`** — copy reflects Path B semantics: *"won't be able to re-claim this booth on next sign-in"* + *"Invite a new vendor email to attach this booth to a different account"* + italic muted footnote *"Reversible by re-approving the denied request from the Requests tab."* File-top comment block updated to mark Path B semantics canonical.
- **`components/admin/VendorsTab.tsx`** — `PILL.disconnected` + `rowStatus` comments updated to mark "disconnected" as LEGACY pre-Path-B state. `showInvite` gate predicate UNCHANGED — Path B's deny-side-effect means post-force-unlink rows naturally surface Invite because diagnosis matchingRequest predicate excludes denied requests. Comment block updates clarify the new state-transition narrative.
- **`package.json` version bumped 0.188.0 → 0.189.0** per Shape A versioning protocol.

### Removed

- **`components/admin/RelinkSheet.tsx`** — deleted entirely (-256 LOC). Sessions 124-126 substrate retire as scope-adjacent dead-code per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — Relink affordance retires because the canonical "vendor wants to switch emails" flow is now Force-unlink → Invite, not Force-unlink → Relink.
- **`app/api/admin/vendors/route.ts handleRelink` function** + Arc 4 D14 section comment (-154 LOC). PATCH body discriminator `action?: "force-unlink" | "relink"` → `action?: "force-unlink"`; `vendorRequestId` body field dropped; action-dispatch `"relink"` branch + validation drop; PATCH section comment updated (two actions instead of three). Retirement reasoning preserved in section comment block as audit trail.
- **`components/admin/VendorsTab.tsx`** Relink UI gate — `RelinkSheet` import + `relinkingVendor` useState + RelinkSheet modal render block + `onRelink` prop chain (VendorRowAccordion + ActionRow) + `showRelink` predicate + ActionRow "Relink to request" button all drop. Action row simplified to (conditional Invite) + Edit + (conditional Force-unlink) + Delete.

### Fixed

- **Session 127 Path A vs B 62-session-deferred decision** — finally lands as Path B (persistent force-unlink). Path A (today): Force-unlink soft-resets, auto-claim re-attaches prior email on next sign-in — was the wrong mental model for "vendor switches emails." Path B: Force-unlink also denies matching request → terminates prior email's claim path → admin invites new email → vendor claims with new email. Surfaced per `feedback_surface_locked_design_reversals` ✅ Promoted with prior reasoning quoted before drafting code.
- **66-session-deep auto-claim vocab-drift bug** — pre-existing latent bug from session 123 ship surfaced as adjacent finding during Arc 2 audit. Auto-claim filter excluded only `"rejected"` (no requests today have this status post-session-136) but did NOT exclude `"denied"` (the canonical terminal status). Fix is load-bearing for Path B persistence to actually persist.
- **80-session-deep silent-regression-byproduct (Yesterday's Memories + 4 other legacy disconnected rows)** — pre-Path-B force-unlinks left rows in `DISCONNECTED` state with no actionable affordance. SQL backfill query mirrors live diagnosis predicate; 5 fossils cleaned in single paste against production at session 189 close.

### Deprecated

- *(none)*

[v0.189.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.189.0

---

## [v0.188.0] — 2026-05-20

### Session 188 — Map PinCallout refinement: Frame B vertical-stacked symmetric reshape + 30-day freshness window + silent-regression repair + offset/padding dial chain — 9 runtime commits + 1 design-to-Ready + 1 close

10 runtime + docs commits. Design-pass + execution + iPhone-QA-driven dial chain + latent silent-regression repair, all in single focused session. David opened with `/session-open`; standup recommended iPhone QA on production v0.187.0; David redirected through two strategic pivots (customer-facing feature list one-pager drafted at `docs/customer-feature-list.md` then parked uncommitted; environments-strategy conversation surfaced load-bearing questions but pivoted again) before landing on a 6-finding iPhone-QA bundle for the /map PinCallout. Cost-shape Shape B locked at scope (V1 mockup-first) per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132; V1 mockup spanned thumb-size + density axis; David picked Frame B (Balanced — 56px circle thumb, 7/10/12 spacing, 20px name, 14px stat line). 20 frozen decisions D1–D20 + 6 Tier B items + 7-row risk register locked in `docs/map-pincallout-refinement-design.md` per Design Agent rule. Then pure execution: Arc 1.1 data layer (30-day `created_at` freshness filter on `getMallStatsByMallId` + fixture mirror) → Arc 1.2 PinCallout vertical-stacked reshape (single coupled commit per D1-D19 with 2 bounded reversals R-1 + R-2 surfaced in commit body) → Arc 1.3 iPhone-QA dial chain (6 dials + 1 diagnostic endpoint that localized the load-bearing silent regression). **32nd cumulative firing of `feedback_design_record_as_execution_spec`** validated across 32+ different features. Build green at every commit boundary; tsc + `npm run build` clean across all 48 routes throughout.

The session's load-bearing operational beat: dials 1-3 (offset 60 → 115 → 140 → 150) were patching the symptom against a broken baseline (asymmetric FIT_PADDING.bottom = 223 forcing pins into upper portion of the bordered window). Dial 5 was the STRUCTURAL fix (FIT_PADDING bottom 223 → 56 symmetric, retiring the misleading "WITH_SHELF" suffix since the session-178 carousel-retire made the constant stale). Once padding centered the bordered window vertical axis, dial 6 recalibrated offset to +110 — landing on the midpoint math the original calculation predicted before context interference. Pattern matches `feedback_kill_bug_class_after_3_patches` ✅ Promoted at the calibration-cascade layer: 3+ patches at progressively deeper layers signal the bug class is in the OTHER constant, not the one you're dialing. **2nd cumulative firing of NEW Tech Rule candidate from session 180** "Container-geometry change cascades to recalibrate Mapbox easeTo offset" promoted-via-memory at this close as `feedback_container_geometry_cascade_audit.md`.

The diagnostic endpoint `/api/diag/mall-stats` (shipped at commit `16cbf70`) was the visibility-first move that localized a latent silent regression: `getMallStatsByMallId` was written explicitly for PinCallout's stat row at session 108 (R10 Arc 3) but the consumer wiring from `/map/page.tsx → MapPageBody → TreehouseMap` was never completed. `mallStats?` prop is optional; when undefined, TreehouseMap falls through to `findCount={stats?.findCount ?? 0}` → always 0. The bug was masked for 80 sessions because the saved-state branch in PinCallout uses `savedCount` which IS wired separately. Unsaved-state users + signed-out testing saw "0 fresh finds" on every callout. The diag probe returned 71 finds in the 30-day window across 5 malls in ~30 seconds — bug-in-data-vs-bug-in-consumer-chain isolated in 1 round-trip. Validates `feedback_visibility_tools_first` ✅ Promoted + `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted at round 0 at the silent-regression layer. Endpoint retired in this close commit (cleanup byproduct).

### Added

- **`docs/map-pincallout-refinement-design.md` + `docs/mockups/map-pincallout-refinement-v1.html`** — 20 frozen decisions D1–D20 + 6 Tier B headroom items + 7-row risk register + 3-arc implementation sequence + 2 bounded-reversal entries R-1 + R-2. V1 mockup spans 3 candidate frames (α compact / β balanced — picked / γ hero thumb) with reference frame showing current production composition. Mockup IS the authority per Design Agent rule (session 56).
- **`<PinCallout>` `<PiLeaf>` glyph prefix** on stat line at 15px outline weight in `v2.accent.green` per D10. Imported from `react-icons/pi` alongside existing PiCaretLeft + PiCaretRight.
- **`FRESHNESS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000`** extracted as module-scope constant in both `lib/posts.ts` + `lib/fixtures.ts`. Canonical project-wide freshness window. Future surfaces wanting a "fresh activity" affordance reuse this window unless explicitly redesigned.
- **`cachedMallStats: Record<string, MallStats> | null`** module-scope cache in `app/(tabs)/map/page.tsx` per `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168 (7th cumulative firing post-promotion). Mirrors existing `cachedMalls` pattern for warm-nav hydration when shopper navigates Home → /map → Home → /map.
- **`docs/customer-feature-list.md`** — customer-facing one-pager draft with split-track audience structure (For Shoppers / For Vendors) + thesis anchoring on digital-to-physical bridge. Drafted earlier in session per David's marketing-doc / Shape B pick before pivot to map refinement. Lands on main as a draft pending review.
- **NEW memory file `feedback_container_geometry_cascade_audit.md`** — when a container UI primitive's outer dimensions change (callout reshape, shelf retirement, chrome geometry), downstream Mapbox camera-API constants (easeTo offset, fitBounds padding) silently become wrong. 2nd cumulative firing of NEW Tech Rule candidate from session 180 → promotes to memory per `feedback_tech_rule_promotion_destination`.

### Changed

- **`<PinCallout>` composition reshape** from horizontal (thumb-left + text-right) to **vertical-stacked symmetric** per D1-D3. Order top→bottom: 56px circle thumb · DistancePill · 20px Cormorant 600 centered mall name · PiLeaf + count + "fresh finds" centered stat line · Directions outline + Explore filled CTA row · tail. Right-aligned ellipsis truncation on mall name retires (D8) — centered allows 2-line wrap naturally. Public PinCallout API stable; no signature changes.
- **`<PinCallout>` thumb shape: 36px rounded rect (`borderRadius: 6`) → 56px circle (`borderRadius: "50%"`)** per D4-D6. Hero image fills via `objectFit: cover`; MapPin glyph fallback at 18px when null. 1.5px `v2.surface.card` outline + `0 2px 6px rgba(42,26,10,0.15)` shadow for lift against callout body.
- **`<PinCallout>` stat line — split treatment per D9** (BOUNDED REVERSAL of session-158 D-bundle "fresh finds" Cormorant italic 14 typography). Now: count number in `FONT_NUMERAL` (Times New Roman, project canonical for numeric stamps per session 75 + reaffirmed by 2026-05 ui-tokenization-audit at session 162) + label in `FONT_INTER` sans per David's verbatim "change to a sans serif font we already use." Both `v2.accent.green`; number `fontWeight: 700`, label `fontWeight: 600` at 14px. Reuses MallScopeHeader split-treatment pattern from session 75 D5.
- **`getMallStatsByMallId` query semantic shift** per D11+D12: `findCount` now scopes to posts at the mall with `status = 'available'` AND `created_at >= NOW() - INTERVAL '30 days'`. Variable name preserved (no rename — too invasive for the semantic clarification). Comment block in `lib/posts.ts` captures the 30-day semantic as canonical reference. Schema-forced deviation surfaced per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141 — design record D11 referenced `published_at`; codebase canonical is `created_at` (set at row insertion = functionally the publication timestamp). Confirmed via grep: `published_at` doesn't exist anywhere in codebase.
- **`getFixtureMallStats` extended with matching 30-day filter** against `FIXTURE_POSTS[].created_at` per D13. Review Board parity preserved; edge fixtures (oldest POST_BASE indices) may age out naturally over time — acceptable drift.
- **`MAP_PEEK_OFFSET_Y` dial chain** 60 → 115 → 140 → 150 → 110 across 4 iPhone-QA dial rounds. Final +110 lands callout center ≈ `container_center + 1` (visually dead-centered in bordered window). Dial chain logic captured in updated comment block in `components/TreehouseMap.tsx`: dials 1-3 patched symptom against broken padding baseline; dial 5 was structural fix (padding asymmetry retired); dial 6 recalibrated against corrected baseline.
- **`FIT_PADDING_WITH_SHELF` → `FIT_PADDING`** rename + bottom value 223 → 56 (symmetric with top/left/right at 56). Session-161 carousel-overlay shelf retired at session 178 (F2 Map page extraction); the 223px bottom reservation was leftover obsolete calibration pushing pin clusters into the upper portion of the bordered window post-178. Symmetric padding now centers pin bounds-rectangle in the bordered window vertical space. Constant renamed per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (semantic-changed-by-rename pattern from session 175 `STICKY_THIN_HEIGHT → HERO_BOTTOM_EDGE`).
- **`<MapPageBody>` mallStats prop now wired through from `/map/page.tsx`** — fixes 80-session-deep latent silent regression. `getMallStatsByMallId` fetched on mount alongside `getActiveMalls`, cached in module-scope `cachedMallStats`, passed as prop to MapPageBody → TreehouseMap → PinCallout. PinCallout stat line now reads correct fresh-finds counts for unsaved-state users (was always 0 since session 108 R10 Arc 3).
- **`package.json` version bumped 0.187.0 → 0.188.0** per Shape A versioning protocol.

### Removed

- **`/api/diag/mall-stats` diagnostic endpoint** (shipped at commit `16cbf70`, retired in this close commit). Served its purpose — localized the silent regression in 1 round-trip via JSON response showing 71 finds in 30-day window across 5 malls + zero filter error + per-mall breakdown. Pattern (build a server-side probe endpoint that runs the same query path the consumer uses + returns JSON via curl) preserved in this changelog + session block as canonical NEW pattern for future "is the bug in data layer or consumer chain" diagnoses.
- **`PinCallout` `headerRow` JSX variable retired** (replaced by separate `mallNameRow` + DistancePill as siblings in vertical stack). Pre-Arc-1.2 horizontal composition with mall name + DistancePill in flex-row no longer needed.
- **`lucide-react` `ChevronRight` import retired from PinCallout** — scope-adjacent dead-code byproduct per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. No-coords fallback branch reshape (D18) drops chevron; whole-card-as-button preserves the commit affordance without explicit affordance icon.

### Fixed

- **PinCallout "0 fresh finds" bug class** end-to-end. Root cause: latent silent regression since session 108 (R10 Arc 3) — `mallStats` prop never wired from `/map/page.tsx` → MapPageBody → TreehouseMap. Saved-state branch using `savedCount` (wired separately) masked the bug for signed-in shoppers with saves; unsaved-state users + signed-out testing saw 0 on every callout. Diagnosis: `/api/diag/mall-stats` probe + Vercel runtime logs MCP + 5-line grep audit of prop chain.
- **PinCallout vertical-clipping at bordered map window top edge** when pin sits in upper portion. Combined fix: dial 5 (FIT_PADDING bottom symmetric) + dial 6 (MAP_PEEK_OFFSET_Y recalibration) lands callout visually centered in the bordered window with no edge clipping.
- **Pin clustering in upper portion of bordered map window on Reset state** — fixed by FIT_PADDING.bottom dial (223 → 56 symmetric).

### iPhone QA watch-items

- David's final iPhone QA after dial 6 (offset 150 → 110): not yet confirmed clean. Likely landing well per the math (callout center ≈ container_center + 1), but session-189 should validate the dial-6 ship on production v0.188.0 first.
- Walk reset state + selected pins across north (e.g., Kentucky-Indiana border malls) + south (Owensboro, Paducah) edges to confirm centering holds across geographic extents.
- Verify saved-state branch ("X saved finds") still works correctly with the new split-treatment composition.
- Verify no-coords fallback branch (D18) reshape — defensive coverage that all production malls have coords today, but the path is exercised on Mall coords missing.

[v0.188.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.188.0

---

## [v0.187.0] — 2026-05-18

### Session 187 — Vendor profile enrichment Arc 2 (Display surface) end-to-end + iPhone-QA-driven dial round 1 (compound lockup reshape + MallBlock dial) — 6 runtime commits + 1 close

6 runtime commits + 1 close. Pure execution pass against the 15-decision design record locked at session 185 + 30-firings-deep `feedback_design_record_as_execution_spec` — load-bearing operating mode crosses its **31st cumulative firing** across 31+ different features. Arc 2 main ship (4 commits sequenced smallest→largest: MallBlock directionsText + BoothTitleBlock avatarUrl compound lockup + AboutBoothSection NEW primitive in isolation + single coupled page composition on /shelf/[slug] AND /my-shelf). David walked Vercel preview + surfaced 4 dial findings; iPhone-QA-driven dial round 1 ships in 2 more commits sequenced smallest→largest (C5 MallBlock cosmetic dial: PinGlyph retire + fontWeight bump; C6 BoothTitleBlock structural reshape: eyebrow above lockup, [avatar | name] row as the actual lockup). 2nd iPhone QA walk: clean. **5th cumulative firing post-promotion of `project_vendor_value_first_prioritization`** validates the vendor-value gate continues firing load-bearingly across 4 consecutive sessions of vendor-value execution (184 + 185 + 186 + 187). The storefront-identity thesis is now visible on production — vendors who filled Arc 1 fields (avatar + bio + Facebook URL + Instagram URL + in-mall directions) see them on `/shelf/[slug]` as the compound identity lockup + bio paragraph + social bubbles + directions below address. Vendors who haven't enriched see no change (D4 + D11 fallbacks). Build green at every commit boundary; tsc + `npm run build` clean across all 48 routes throughout.

### Added

- **`<AboutBoothSection>` NEW primitive** at `components/AboutBoothSection.tsx` (149 LOC) per D9+D11+D13 verbatim contract. Props: `{ bio, facebookUrl, instagramUrl, vendorSlug }`. Returns null per D11 when all 3 nullable inputs are null/empty (no extra padding for unenriched booths). Bio rendered in Cormorant italic 15px (`v2.text.primary`, lineHeight 1.5, max-width 320px centered, white-space: pre-wrap preserves vendor's intentional newlines from EditBoothSheet textarea). Social bubbles per D9: 36×36 circular bubbles with bg `v2.surface.warm` + 1px `v2.border.light` border + Phosphor `PiFacebookLogo` / `PiInstagramLogo` at size 20 in `v2.accent.green`. Individual bubbles hide when their URL is null. Tap: `window.open(url, '_blank', 'noopener,noreferrer')` + fires `vendor_social_tapped` R3 event with `{ vendor_slug, platform: "facebook" | "instagram" }` payload.
- **`<BoothTitleBlock>` `avatarUrl?: string | null` prop** per D3+D4. Conditional layout: when null, existing centered fallback layout preserved verbatim (vendors who haven't uploaded an avatar see no change per D4); when set, compound lockup — eyebrow ("A curated booth by") on its own centered line + [avatar | name] flex row below, centered as a group, avatar align-items:center against the name h1 itself (post-C6 QA reshape per F1+F2; not the C2-shipped text-stack-with-eyebrow-inside layout). 40px circular avatar with `objectFit: cover`, 2px `v2.surface.warm` border + `box-shadow: 0 1px 3px rgba(0,0,0,0.10)` for matte lift off page bg.
- **`<MallBlock>` `directionsText?: string | null` prop** per D10. Renders inline Cormorant italic 13px on `v2.text.secondary` (lineHeight 1.4, marginTop 6px, max-width 320px centered, white-space: pre-wrap for multiline) when set to a non-empty trimmed string. Empty/whitespace-only/null → renders nothing (existing booths see no change).
- **3-anchor page composition on /shelf/[slug] AND /my-shelf** — single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted threads `vendor.avatar_url` → BoothTitleBlock + `vendor.directions_text` → MallBlock + renders `<AboutBoothSection>` between them. /my-shelf inclusion is the feature-parity default per `feedback_make_same_change_to_sibling_surface` — vendor self-preview surface matches shopper view at /shelf/[slug] so vendors edit and review against the same canonical shape.

### Changed

- **MallBlock mall name fontWeight 400 (default) → 600** per David's iPhone QA F4. Matches BoothTitleBlock h1 weight (Review Board Finding 8A pattern from session 153). The two Cormorant 18+ identity beats (vendor name h1 32px + mall name 18px) now read at the same visual weight, reinforcing identity-then-place reading order.
- **BoothTitleBlock compound layout reshape (within-session QA-driven reversal of C2)** — C2 shipped the compound as `[avatar | text-stack]` where text-stack contained eyebrow+name with text-align:left. C6 reshape per David's F1+F2: eyebrow renders on its own centered line (full page width via textAlign:center) + the [avatar | nameBlock] row sits below as the actual lockup (avatar align-items:center against the name h1 itself, not the text-stack). Within-session reshape surfaced explicitly per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128.

### Removed

- **`<PinGlyph>` from MallBlock** per David's iPhone QA F3. Import drops from top of `components/BoothPage.tsx`; render + flex/gap wrapper around mall name retire as scope-adjacent dead code per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. PinGlyph still exported from `components/PinGlyph.tsx` and consumed by `<MallMatchChip>` (session 165 dual-slot search-mall-match wiring); only the BoothPage consumer site retires. Bounded reversal of session 128 refinement D6 ("PinGlyph renders inline before mall name") surfaced explicitly per `feedback_surface_locked_design_reversals` ✅ Promoted — reason: with the avatar lockup landing on the surface above (Arc 2.1 compound), the MallBlock pin became visual noise competing with the avatar for "place identity" attention.

### Fixed

- **Pre-existing local-env `html2canvas-pro` miss at C1 commit boundary** — **20th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161; `npm install` resolved in 1 round-trip. Parked dep from session 152's Share My Shelf parked feature.

### Implementation sequencing — 6 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88

| # | SHA | Scope | LOC |
|---|---|---|---|
| 1 | `e858200` | Arc 2.3 — MallBlock directionsText prop + render below address (D10) | +36 / −2 + package-lock |
| 2 | `c4e6385` | Arc 2.1 — BoothTitleBlock avatarUrl prop + compound lockup (D3+D4) | +97 / −17 |
| 3 | `d1f7bcb` | Arc 2.2 — `<AboutBoothSection>` NEW primitive in isolation (D9+D11+D13) | +149 / 0 |
| 4 | `2c2ed83` | Arc 2.4 — page composition on /shelf/[slug] + /my-shelf (coupled) | +59 / −3 |
| 5 | `c61309a` | QA-driven C5 — MallBlock retire PinGlyph + bump mall name to 600 | +20 / −16 |
| 6 | `5202f5d` | QA-driven C6 — BoothTitleBlock compound reshape (F1 + F2) | +144 / −133 |

### Sub-decisions inside locked design axes (surfaced explicitly per `feedback_schema_forced_deviation_not_design_reversal`)

1. **Feature-parity on /my-shelf (D11 + D3/D4/D10 surface scope)** — design record Arc 2 sequencing only lists /shelf/[slug] composition (sub-arc 2.4) but D11 component contract for AboutBoothSection is surface-agnostic. /my-shelf inclusion is the natural feature-parity default since BoothTitleBlock + MallBlock are already shared primitives between both surfaces; omitting AboutBoothSection on /my-shelf while extending the other two would create inconsistent vendor self-preview. Vendors edit + review against the same canonical shape shoppers see.
2. **No SELECT extension needed** — both `getVendorBySlug` (used by /shelf) and `getVendorsByUserId` (used by /my-shelf) already use `select *` which returns all 5 enrichment columns. Verified via grep at session-187 audit-first pass; saved a commit that would have been pure type/SELECT extension.
3. **Avatar `alt=""` (empty)** — avatar is decorative; the vendor name is already adjacent in the h1 + screen readers shouldn't read the name twice. Avoids "Avatar of {name}" duplication noise.

### Memory firings cumulative through session 187

- `feedback_design_record_as_execution_spec` ✅ Promoted — **31st cumulative firing** across 31+ different features (load-bearing operating mode crossing past the threshold validated at session 186)
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 — 6 firings (~549+ cumulative)
- `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141 — 1 firing (/my-shelf feature-parity surfaced in C4 commit body)
- `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 — 1 firing (C6 reshapes C2 same-session)
- `feedback_surface_locked_design_reversals` ✅ Promoted — 1 bounded reversal (session 128 D6 PinGlyph placement)
- `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — PinGlyph import + render + flex wrapper retire in C5 same as feature change
- `feedback_user_clarification_restate_interpretation` ✅ Promoted — restated all 4 iPhone QA findings explicitly before drafting code
- `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted — David's spec (centered eyebrow / vertically aligned avatar / retire pin / bump weight) shipped verbatim with explicit framing of the bounded reversals
- `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — C4 ships /shelf + /my-shelf together to keep visual presentation consistent at same commit boundary
- `feedback_visibility_tools_first` ✅ Promoted — parallel reads of design record + BoothPage primitives + lib/posts.ts + types + analytics layers + migration 022 in audit-first pass before drafting any commits
- `feedback_verify_primitive_contract_via_grep` ✅ Promoted — grep'd Phosphor exports + analytics whitelist verification + getVendorBySlug SELECT shape BEFORE drafting code; saved a SELECT-extension commit by confirming `select *` already covered new columns
- `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161 — **20th cumulative firing** (html2canvas-pro at C1 boundary)
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — 1 firing (Shape A 2-commit sequence for QA dial bundle)
- `project_vendor_value_first_prioritization` ✅ Promoted at session 171 — **5th cumulative firing post-promotion** validates the vendor-value gate as load-bearing operating mode across 4 consecutive sessions of vendor-value execution (184 + 185 + 186 + 187)

### NEW Tech Rule candidate patterns surfaced (single firings each, all promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted)

1. **"`select *` substring-aware audit before drafting SELECT-extension commit"** — when adding new columns that need to render at consumer surfaces, grep existing SELECT shapes BEFORE drafting any SELECT-extension commit. If consumers already use `select *`, the new columns are returned automatically — no commit needed. Saved 1 commit + reduced surface area for this session. Sub-pattern of `feedback_verify_primitive_contract_via_grep` extended to data-layer SELECT contracts.
2. **"Within-Frame internal reshape during iPhone QA — NOT a Frame reversal"** — David's iPhone QA F1+F2 reshaped the BoothTitleBlock compound from `[avatar | text-stack]` to `[eyebrow centered above | [avatar | name] row below]`. Both layouts are still "Frame C" (40px avatar inline with display_name lockup); the reshape is internal to Frame C, not a Frame reversal back to Frame A/B/D.
3. **"Splitting `titleStack` into `eyebrow` + `nameBlock` JSX variables for cross-layout reuse"** — when a primitive's render needs different compositions per prop case (compound lockup vs centered fallback), extract the shared-content JSX into named variables (`eyebrow`, `nameBlock`) that both branches reference. Cleaner than duplicating the inner content or chaining ternaries inside JSX.
4. **"Stacking 4 iPhone QA findings into 2 smartly-coupled commits"** — David surfaced 4 findings in single message; 2 cluster on MallBlock cosmetic dials (F3+F4); 2 cluster on BoothTitleBlock structural reshape (F1+F2). C5 ships cosmetic dials; C6 ships structural reshape. Per-primitive coupling reads cleaner than per-finding splitting (4 commits) or single-commit-multi-primitive (cross-cuts revertability).
5. **"Bounded reversal of own-just-shipped code is the cleanest within-session firing"** — C2 shipped the [avatar | text-stack] compound layout in this session; C6 reshapes it same session. Distinguishes from cross-session reversals (where prior reasoning was locked in a different session). Within-session reversal commits carry both shipping commits' SHAs in the commit body so the reasoning chain is fully traceable in `git log`.
6. **"Feature-parity default for /shelf/[slug] vs /my-shelf consumer pair"** — when a primitive extension lands on /shelf/[slug] (shopper view), default to wiring the same primitive on /my-shelf (vendor self-preview) unless there's an explicit reason for divergence. Sub-pattern of `feedback_make_same_change_to_sibling_surface`.

### iPhone QA watch-items

iPhone QA round 1 walked Vercel preview on 6-commit ship (C1-C6); David verbatim: **"QA walk clean. push to prod"**. All 4 dial findings shipped via C5+C6 and re-walked clean.

Open production watch-items for session 188:
- **iPhone QA on production v0.187.0** (~5-10 min) — after PR squash-merge + tag, walk production-PWA to confirm Vercel preview ↔ production parity. Surfaces any URL-allowlist-bound regressions (vendor-avatar storage, Mapbox token) that Vercel preview can't catch.
- **Q-016 EditBoothSheet UI revisit** — captured in `docs/queued-sessions.md` §Q-016. Holistic design pass on the 7-field sheet post-Arc-2 ship + iPhone QA against real-content seeding.
- **R19 (`Vendor profile enrichment`) candidate promotion call** — design record §9 deferred to post-Arc-2 ship. With Arc 2 live on production, the storefront-identity thesis becomes measurable via vendor-side engagement (vendors uploading + iterating their profile) + shopper-side engagement (social taps + return visits to enriched booths). Promotion to R19 ✅ Shipped lands when both signals fire on production analytics.
- **Real-content seeding** — Arc 1 + Arc 2 both ship the enrichment substrate; David needs to fill 1-2 vendor profiles with actual avatars + bios + social URLs + directions on production to validate the full flow end-to-end + surface any UX dials that V1 mockup with placeholder data couldn't catch.

[v0.187.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.187.0

---

## [v0.186.0] — 2026-05-18

### Session 186 — Vendor profile enrichment Arc 1 (Edit surface) end-to-end + mid-session URL UX refinement + EditBoothSheet keyboard + Edit Booth CTA promotion — 9 runtime commits + 1 close

9 runtime commits + 1 close. Pure execution pass against the 15-decision design record locked at session 185 — load-bearing operating mode validated at the **30th cumulative firing of `feedback_design_record_as_execution_spec`** ✅ Promoted across 30 different features, crossing the threshold where the rule is now demonstrably "the standard way design-pass → implementation runs in this project." Cost-shape triage compounded mid-session per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — main Arc 1 ship (5 commits) + David's mid-session URL UX refinement (2 commits) + David's EditBoothSheet keyboard + Edit Booth CTA refinement (2 commits) all sequenced cleanly without re-scoping the design record. Build green at every commit boundary; tsc + `npm run build` clean across all 48 routes throughout.

### Added

- **`/api/vendor-avatar` endpoint** — POST + DELETE mirroring `/api/vendor-hero` pattern verbatim per D6. requireAuth + ownership-or-admin gate; service-role for storage + DB writes; storage path `vendor-avatars/{vendorId}.jpg`. Fires `vendor_avatar_uploaded` on POST + `vendor_avatar_removed` on DELETE (vendor-hero only fires on DELETE — for vendor-avatar, knowing when a vendor first uploaded an identity photo is the load-bearing analytics signal per D12). Both events include `by_admin: true` payload when admin acts on behalf (matches session 92 `vendor_hero_removed` audit pattern).
- **`lib/socialUrls.ts`** — 2 normalizer helpers (`normalizeInstagramUrl` + `normalizeFacebookUrl`) returning `string | null`. Vendors paste any shape (bare handle / `@handle` / host+path / full URL with or without www / share/profile URLs / mobile/short variants) and the system stores ONE canonical shape (`https://instagram.com/<path>` and `https://facebook.com/<path>[?query]` — no www, no trailing slash, query string preserved for FB `profile.php?id=` + `share/X`). Heuristic: input "looks like URL" if it has a slash OR a `.com|.net|.org|.am|.co|.io|.me|.us` TLD-like suffix; else treat as bare handle (so dotted IG handles like `treehouse.finds` parse correctly). Host allowlist accepts `instagram.com` + `instagr.am` for IG; `facebook.com` + `fb.com` + `fb.me` + `m.facebook.com` for FB.
- **EditBoothSheet — Vendor identity section (vendor mode only)** per D2+D5+D7+D8+D10+D14. New 5-field block between commit 4's hairline divider and Save button:
  - **Profile photo (avatar)** — 96×96 circular preview matching the 40px /shelf compound-lockup render (Arc 2); Replace + Remove buttons mirroring hero photo pattern; `compressImage(maxWidth=256, quality=0.85)` per D5; atomic save via `/api/vendor-avatar` (NOT batched into form Save)
  - **Bio** — `<textarea>` with FONT_LORA italic 15px placeholder matching the literary-serif voice the bio will render in on /shelf (Arc 2); live char counter turns red at 270+ (BIO_WARN_LEN); 280-char server-mirrored cap
  - **Facebook URL** — text input with normalizer-driven validation; amber border on invalid input surfaces live; placeholder `facebook.com/yourbooth` signals shape-flexibility
  - **Instagram URL** — same shape as Facebook; placeholder `@yourbooth or instagram.com/yourbooth` signals both shapes accepted
  - **In-mall directions** — `<textarea>`, multiline, 500-char server cap (no UI counter; directions are short by nature)
- **"Edit Booth" CTA button on /my-shelf** — stacked under "Add a Find" per David's session-186 ask. Same chrome family as Add a Find (10px radius, 11px Inter 600 0.12em uppercase, 8px gap before glyph) with color reversal per session 157 engagement-tier pattern: Add a Find = primary filled greenMid; Edit Booth = secondary cream-bg + 1px greenMid border + greenMid text. Lucide Pencil glyph (size 13, strokeWidth 1.8) preserves affordance continuity with the retired pencil bubble. Wires to the existing `setShowEditSheet(true)` handler — zero behavior change on the sheet itself.

### Changed

- **`/api/vendor/profile` PATCH** — extended to accept `bio` + `facebook_url` + `instagram_url` + `directions_text` (all optional + independently nullable; PATCH is now a partial-update endpoint per D7+D8+D10). Existing `display_name` path preserved verbatim. URL fields routed through `lib/socialUrls` normalizers — any shape vendor pastes gets canonicalized server-side too (defensive against admin tools / direct API hits). `vendor_profile_enriched` fires server-side per D12 when one or more of the 4 enrichment fields flip NULL → non-empty for the FIRST time; payload carries `fields_filled: string[]`. Existing-row snapshot fetched as part of the ownership round-trip (zero extra query — single SELECT covers ownership gate + change-detection).
- **3-layer analytics whitelist extension** per D12 — `lib/events.ts` EventType (server) gets all 4 new events; `lib/clientEvents.ts` ClientEventType + `app/api/events/route.ts` CLIENT_EVENT_TYPES gain `vendor_social_tapped` (only Arc 1 event that fires client-side; the other three fire server-side via recordEvent). Defensive 3-layer coverage avoids session 137 silent-400 drift.
- **EditBoothSheet validation + Save payload** — `isValidHttpUrl` regex retired; replaced with `normalizeFacebookUrl` + `normalizeInstagramUrl` calls. `facebookCanonical` + `instagramCanonical` computed once per render against trimmed input; both `fbInputInvalid` + `igInputInvalid` surface the amber border on invalid input; `urlsValid` gates `canSave`. handleSave's vendor-mode payload sends canonical URLs (not raw input).
- **EditBoothSheet placeholder copy** — FB now reads `facebook.com/yourbooth`; IG reads `@yourbooth or instagram.com/yourbooth` (signals both shapes are accepted).
- **EditBoothSheet hairline divider per D2** — quiet 1px `v2.border.light` divider between Booth identity (hero photo + booth name / admin BoothFormFields) and Vendor identity section. Margin 10px above + 18px below.

### Removed

- **Inline Pencil bubble on BoothTitleBlock** — `onEditName` prop + `hasEdit` derivation + Pencil branch + `Pencil` Lucide import + flex wrapper around h1+chevron all retired per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. Diverges from D13 of `docs/vendor-profile-enrichment-design.md` which kept `onEditName?: () => void` in BoothTitleBlock contract — sub-decision per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 (the pencil affordance no longer scaled visually once EditBoothSheet grew to 7 fields; CTA-shaped button reads as explicit entry point rather than tiny adornment).
- **`autoFocus` on EditBoothSheet booth name input** — structural fix per `feedback_kill_bug_class_after_3_patches` ✅ Promoted. Session 175 commit `5fa118f` patched the keyboard-cover symptom via `onFocus` + setTimeout(300) + scrollIntoView; that patch only mitigated AFTER autoFocus had already triggered the keyboard. Removing autoFocus removes the bug class at its source. The onFocus scrollIntoView retained (still load-bearing when user manually taps the input). David: *"keyboard shouldn't auto-pop up as it covers most of the text. Keyboard should only pop-up on click inside the menu input."*

### Fixed

- **Pre-existing local-env `html2canvas-pro` miss at C1 commit boundary** — 19th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161; `npm install` resolved in 1 round-trip. Parked dep from session 152's Share My Shelf parked feature.

### Implementation sequencing — 9 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88

| # | SHA | Scope | LOC |
|---|---|---|---|
| 1 | `37c3ada` | Analytics whitelist (4 events × 3 layers) | +26 / −2 |
| 2 | `11898a0` | `/api/vendor-avatar` endpoint (POST + DELETE) | +191 / 0 |
| 3 | `1726d4a` | `/api/vendor/profile` PATCH extension (4 fields + `vendor_profile_enriched` detection) | +161 / −26 |
| 4 | `1668653` | EditBoothSheet hairline divider per D2 | +10 / 0 |
| 5 | `2a4f6ff` | EditBoothSheet 5 new field renderers (avatar + bio + 2 URLs + directions) | +507 / −18 |
| 6 | `5f628f2` | `lib/socialUrls.ts` helper in isolation | +131 / 0 |
| 7 | `6a0a996` | Wire normalizer into client + server (coupled) | +63 / −35 |
| 8 | `b39d669` | Drop autoFocus on EditBoothSheet booth name input | +21 / −8 |
| 9 | `a1a6bd2` | Pencil bubble → "Edit Booth" CTA under "Add a Find" | +107 / −93 |

### Sub-decisions inside locked design axes (surfaced explicitly per `feedback_schema_forced_deviation_not_design_reversal`)

1. **Commit ordering reorder (1.5 → 1.1)** — design record sequenced analytics whitelist as 1.5 (last); promoted to commit 1 because commit 2's `/api/vendor-avatar` fires `recordEvent("vendor_avatar_uploaded", ...)` which needs the EventType union extension to type-check.
2. **Admin mode enrichment scope** — design record D15 said "both modes get all 5 fields"; Arc 1 scoped to vendor mode only. Admin retains access to enrichment via the existing impersonation flow (`/my-shelf?vendor=<id>` Pencil → vendor mode of this sheet, session 148 admin-vendor parity). Avoids dual-PATCH complexity in admin mode without losing functional reach.

### Memory firings cumulative through session 186

- `feedback_design_record_as_execution_spec` ✅ Promoted — **30th cumulative firing** across 30+ different features (load-bearing operating mode threshold)
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 — 9 firings (~543+ cumulative)
- `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted-via-memory at session 141 — 2 firings (commit ordering + admin scope)
- `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 — 1 firing (D13 BoothTitleBlock `onEditName` retired)
- `feedback_kill_bug_class_after_3_patches` ✅ Promoted — autoFocus removed at source (vs session 175's scrollIntoView patch)
- `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — Pencil import + `hasEdit` + flex wrapper + `onEditName` prop all retired in same commit as feature change
- `feedback_user_clarification_restate_interpretation` ✅ Promoted — URL normalization spec restated; preview-behavior axis batched
- `feedback_v2_options_before_drafting` ✅ Promoted — preview-behavior `AskUserQuestion` before drafting code (silent / live preview / on-blur update)
- `feedback_synthesize_existing_row_to_reuse_flow_infra` ✅ Promoted — `/api/vendor-avatar` mirrors `/api/vendor-hero` shape verbatim; `vendor_profile_enriched` detection synthesized inside existing PATCH ownership round-trip (zero extra query)
- `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — client + server normalizer commit 7 (contract pair on same input vocabulary)
- `feedback_visibility_tools_first` ✅ Promoted — parallel reads of design record + 6 contracts in 1 round-trip BEFORE drafting any code
- `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161 — **19th cumulative firing** (html2canvas-pro at C1 boundary)
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — 3 cost-shape triages (URL normalization location + preview visibility + ship vs design pass for EditBoothSheet revisit)
- `project_vendor_value_first_prioritization` ✅ Promoted at session 171 — **4th cumulative firing post-promotion** validates the vendor-value gate continues firing load-bearingly
- `feedback_treehouse_no_coauthored_footer` honored on all 9 runtime commits + this close
- `feedback_session_close_auto_merges_pr` honored on this close

### NEW Tech Rule candidate patterns surfaced (single firings each, all promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted)

1. **"Server-side null→non-null detection synthesized inside ownership round-trip (zero extra query)"** — `/api/vendor/profile` PATCH's existing SELECT for ownership gate also returns existing enrichment field values; null→non-empty comparison drives `vendor_profile_enriched` detection without a second SELECT. Generalizes to any future "fire-once-per-first-fill" analytics where ownership check already fetches the row.
2. **"URL normalizer in shared `lib/` for both client + server validation"** — single source of truth eliminates client/server drift on input vocabulary; defensive 2-layer normalization (client pre-PATCH + server defensive) covers all callers without per-caller maintenance. Sub-pattern of `feedback_single_coupled_commit_when_must_move_together` extended to "contract pairs live in shared helper, both consumers call the same function."
3. **"Lenient TLD-hint heuristic for distinguishing 'looks like URL' vs 'looks like handle'"** — `TLD_HINT_RE` pattern catches common social/business TLDs (.com .net .org .am .co .io .me .us) without enumerating every TLD; bare handles with dots (e.g., `treehouse.finds`) parse correctly because their dot isn't followed by a TLD-like suffix. Reusable for any future handle-vs-URL discriminator.
4. **"Preserve query string in URL normalization for share/profile semantic-bearing URLs"** — Facebook `profile.php?id=...` and `share/X` paths carry semantic meaning in the query string; canonical normalization MUST preserve `url.search` or the URL becomes useless. Generalizes to any third-party URL canonicalization where the query string carries identity.
5. **"Auto-trigger retired when surface scope grows past single-target threshold"** — `autoFocus` on the booth name input was right when the sheet had 1 editable field (Wave 1 Task 4 vendor self-edit); wrong when the sheet has 7 editable fields (vendor profile enrichment). The auto-trigger assumed a canonical "primary edit target" that no longer exists. Generalizes to any auto-focus/auto-select/auto-open primitive: revisit on scope expansion.
6. **"Inline affordance bubble → dedicated CTA button as scope-shift signal"** — when the action behind a small inline affordance (32×32 pencil bubble) expands to span an entire identity-editing surface (7-field EditBoothSheet), the bubble adornment reads as visually inadequate to the new scope. Promote to a CTA-shaped button stacked with peer actions. Generalizes to any future "the thing this opens grew significantly" UX evolution.

### Roadmap delta

**18 R-rows total. 13 ✅ Shipped, 0 🟢 Ready, 5 🟡 Captured.** Unchanged at row level — Arc 1 ships the data + edit layer for vendor profile enrichment; nothing user-visible on /shelf until Arc 2 ships display surface (session 187). R19 (`Vendor profile enrichment`) candidate promotion still deferred to post-Arc-2 ship when storefront-identity thesis is visible on production.

**Substrate added:** `/api/vendor-avatar` endpoint · `lib/socialUrls.ts` (normalizeInstagramUrl + normalizeFacebookUrl helpers) · `/api/vendor/profile` PATCH 4-field extension + first-fill detection · 4 new R3 events across 3 layers · EditBoothSheet 5-field Vendor identity section (vendor mode) · "Edit Booth" CTA on /my-shelf.

**Substrate retired:** Inline Pencil bubble on BoothTitleBlock + `onEditName` prop + `hasEdit` derivation + Pencil Lucide import + flex wrapper around h1+chevron · `autoFocus` on booth name input · `isValidHttpUrl` regex in `/api/vendor/profile` (replaced by normalizer calls) · `isValidHttpUrl` local function in EditBoothSheet (replaced by `fbInputInvalid` + `igInputInvalid` derivation).

**Net runtime change:** **+1,173 / −138 LOC** across 9 files (codebase nets +1,035 lines — substantial because Arc 1 adds 7-field UI + 2 endpoints + 1 helper module + 4 events across 3 layers).

### iPhone QA watch-items

1. Avatar upload flow — Replace + Remove from EditBoothSheet → confirm 96×96 circular preview updates immediately + `/api/vendor-avatar` 200s + `vendor.avatar_url` written; remove button hides when avatar_url is null.
2. Bio textarea — verify FONT_LORA italic 15px renders correctly on iPhone; char counter turns red at 270+ chars; resize:vertical works as expected.
3. URL normalization — paste each David-spec input shape (bare handle / `@handle` / host+path / full URL with www / FB share/X / fb.me / m.facebook.com / instagr.am) → confirm normalized canonical URL writes to DB; re-open sheet → input shows canonical.
4. Invalid URL — type `not a url` or `twitter.com/x` → amber border + Save button gates (no silent acceptance).
5. Directions textarea — paste multi-line text → confirm newlines preserved (Arc 2 will validate `white-space: pre-wrap` on /shelf render).
6. Keyboard interaction — open EditBoothSheet on /my-shelf → confirm keyboard does NOT pop up automatically; tap any input → keyboard appears + scrollIntoView lands input above keyboard.
7. Edit Booth CTA — verify stacked layout under Add a Find on /my-shelf; tap → opens EditBoothSheet in vendor mode (same behavior as old Pencil bubble).
8. Admin impersonation parity — sign in as admin, visit `/my-shelf?vendor=<id>` → confirm Edit Booth CTA renders + opens vendor-mode sheet → enrichment fields visible + saveable on behalf of vendor.
9. Build artifacts — `/my-shelf` bundle 6.80 → 7.14 kB (+340 bytes from field renderers); no other bundle regressions.

### Action item logged for post-Arc-2 follow-up

**Q-016** added to `docs/queued-sessions.md` — EditBoothSheet UI design + layout revisit (holistic design pass on the sheet AS A WHOLE once Arc 2 ships + iPhone QA against real-content seeding lands). Triggered by David at session-186 close: *"Lets add an action item to revisit the UI design and layout of this edit menu after we go through the full implementation."* The sheet grew organically from 2 fields → 7 fields across Arc 1; deserves a re-evaluation of visual hierarchy + grouping + breathing room + density + Save button placement + admin parity decision once the dust settles. Cost-shape triage in the Q-016 opener.

[v0.186.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.186.0

---

## [v0.185.0] — 2026-05-18

### Session 185 — Vendor profile enrichment design pass Shape B continues: Frame C avatar lockup + 15 frozen decisions D1–D15 + V1 mockup + HITL migration 022 paste + iPhone QA round 1 PASS on production v0.184.0

1 docs commit + 1 close. Pure design-to-Ready ship per recent project cadence (session 117 R17 design-to-Ready → session 118 Arc 1; session 131 Requests tab → session 136 implementation arcs). David opened with `/session-open`; recommended sequence was (a) HITL migration 022 paste → (b) iPhone QA round 1 on production v0.184.0 → (c) vendor profile enrichment design pass Shape B continues. David picked the recommended sequence. All 3 primary deliverables closed cleanly.

### Added

- **`docs/vendor-profile-enrichment-design.md`** — design record with 15 frozen decisions D1–D15 + Frame C avatar lockup pick + V1 mockup reference + 6-row risk register + 8 Tier B headroom items + 3-arc implementation sequencing for sessions 186-187. Per Design Agent rule (`feedback_commit_design_records_in_same_session`, session 56), design record + V1 mockup commit together. Skipped design-reviewer subagent dispatch (scope well-bounded, no audit substrate drift risk); David can `/design-review` later if wanted.
- **`docs/mockups/vendor-profile-enrichment-v1.html`** — 4 frames spanning the avatar placement axis (Frame A 84px above BoothHero / Frame B 56px in vendor section / Frame C 40px inline with display_name lockup / Frame D 56px in cartographic group) per `feedback_mockup_options_span_structural_axes` ✅ Promoted. All 3 prose-locked axes (Edit surface + Social icons + Bio/directions split) held constant across frames so only placement varies. 6-axis trade-off matrix at bottom (identity prominence / WHO vs WHAT separation / clash risk / vertical cost / fallback composition / editorial parallel).

### Verified

- **iPhone QA round 1 PASS on production v0.184.0** — 4 surfaces walked clean: (1) `/me` display ⭐ load-bearing — avatar renders, NO `@handle` h1, scouting-since eyebrow + private 3-stat row balanced spacing; (2) Fresh-email sign-in flow — magic link → `/login?confirmed=1` polls → `/welcome` → "Just exploring" → `/me` with ~200ms silent auto-claim window then populated state with derived initials; (3) Existing-shopper sign-in — direct route to `/me`, no auto-claim flash; (4) `/flagged` sync footer migration — guest saves migrate to DB on sign-in. Handle retirement flow validated end-to-end. **Session 184→185 QA carry retires.**
- **HITL migration 022 pasted** — David pasted into both Supabase dashboards (prod + staging); 2-row verify query returned `instagram_url` + `directions_text` on both projects. Session 186 Arc 1 implementation is unblocked.

### Design pass — 4 prose axes + 4 fill-refinement axes locked

**Audit-first** per `feedback_visibility_tools_first` ✅ Promoted: parallel reads of `app/shelf/[slug]/page.tsx` + `components/EditBoothSheet.tsx` + `types/treehouse.ts` Vendor interface + grep for current rendering → localized architecture in 1 round-trip BEFORE drafting any prose Qs. Findings sharpened the design surface: `Vendor` type already extended at session 184 (instagram_url + directions_text); EditBoothSheet vendor mode shows only display_name + hero photo today (lots of room); /shelf/[slug] layout is StickyMasthead → BoothHero → BoothTitleBlock → MallBlock → Bookmark Booth → WindowView → BoothCloser → BottomNav; NO LocationActions on /shelf (retired session 157 Review Board #1).

**4 prose axes batched** via single `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted (4-question batched form is the canonical session 184 pattern):

- **Axis 1 — Edit surface** ✅ Extend EditBoothSheet vendor mode (Recommended pick) — 2 visual sections (Booth identity + Vendor identity) inside existing sheet; one pencil entry point.
- **Axis 2 — Avatar placement** → "Show design options" (V1 mockup needed for genuinely visual axis); skip prose lock.
- **Axis 3 — Social icons** ✅ Phosphor PiFacebookLogo + PiInstagramLogo as 36×36 bubbles below bio (Recommended pick).
- **Axis 4 — Bio + directions placement** ✅ Split — bio in vendor section, directions inline in cartographic block (Recommended pick).

**V1 mockup** spans Axis 2 only — 4 frames covering structural placement options on /shelf/[slug]. David picked **Frame C** with explicit reasoning quoted in design record: *"This to me is the most logical spot as it becomes part of the lockup for the Booth name and identity."* Vendor identity becomes a compound visual element with existing booth identity (eyebrow + h1) rather than competing for visual hierarchy. The BoothHero photo retains its role as primary content beat.

**4 fill-refinement axes batched** via second `AskUserQuestion`:

- **Axis 5 — Avatar lockup orientation** ✅ Left of text stack (Recommended pick).
- **Axis 6 — Avatar fallback when null** → **DEVIATION from Recommended** → Hide avatar entirely when null (David picked the more conservative option vs initials-with-vendorHueBg). Restated explicitly: vendors who upload an avatar get the compound lockup; vendors who don't get the existing centered BoothTitleBlock layout. Avoids "vendor identity is just initials, doesn't feel curated" weak-signal reading.
- **Axis 7 — Bio character limit** ✅ 280 chars (Recommended pick).
- **Axis 8 — Section break style** ✅ Hairline divider only (Recommended pick).

### 15 frozen decisions D1–D15

Edit surface + section break style + avatar placement + fallback + upload UX + endpoint contract + bio UX + URL fields + social icons + directions display + about-section conditional render + 4 NEW R3 analytics events (`vendor_profile_enriched` + `vendor_avatar_uploaded` + `vendor_avatar_removed` + `vendor_social_tapped`) + 3 component contracts (BoothTitleBlock extension + AboutBoothSection NEW + MallBlock extension) + EditBoothSheet vendor mode field order + admin/vendor parity (session 148 substrate composes).

### 3 implementation arcs sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88

- **Arc 1 (session 186, ~5 commits)** — Edit surface — `/api/vendor-avatar` endpoint + `/api/vendor/profile` PATCH extension + EditBoothSheet section break + 5 new field renderers + ClientEventType + EventType + CLIENT_EVENT_TYPES whitelist extensions (avoid session 137 silent-400 drift). Ships independently — vendors can fill out fields; nothing renders on /shelf yet.
- **Arc 2 (session 187, ~4 commits)** — Display surface — BoothTitleBlock conditional compound lockup + AboutBoothSection NEW primitive + MallBlock directions extension + /shelf composition. Ships independently — vendors who filled Arc 1 fields see them; vendors who didn't see no change.
- **Arc 3 (session 187 continuation)** — iPhone QA dials + R19 (`Vendor profile enrichment`) promotion call deferred to post-Arc-2 ship when storefront-identity thesis is visible on production.

### Memory firings cumulative through session 185

- `feedback_visibility_tools_first` ✅ Promoted — parallel reads in 1 round-trip BEFORE drafting prose Qs
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — Shape B continues from session 184 (~60+ cumulative)
- `feedback_v2_options_before_drafting` ✅ Promoted — 2 batched AskUserQuestion rounds (4-axis prose + 4-axis fill) before drafting V1 mockup
- `feedback_mockup_options_span_structural_axes` ✅ Promoted — 4 frames span PLACEMENT axis (structural), not style variants within one placement
- `feedback_pre_mockup_prose_model_first` ✅ Promoted at session 143 — prose IS the design for 3 of 4 axes; V1 mockup only for Axis 2 (genuinely visual)
- `feedback_user_clarification_restate_interpretation` ✅ Promoted — restated Frame C implications + Axis 2 deviation from recommended before drafting record (~54+ cumulative)
- `feedback_commit_design_records_in_same_session` (Design Agent rule from session 56) — design record + V1 mockup committed together at `80b8f3b`
- `project_vendor_value_first_prioritization` ✅ Promoted at session 171 — **3rd cumulative firing post-promotion** validates the rule continues firing load-bearingly when vendor-value design work is in scope (Shape B continues from session 184's 2nd firing)
- `feedback_treehouse_no_coauthored_footer` honored on commit + this close
- `feedback_session_close_auto_merges_pr` honored on this close

### NEW Tech Rule candidate patterns surfaced (single firings each, all promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted)

1. **"User-articulated 'becomes part of X lockup' reasoning locks compound primitive extension"** — when user picks a frame with reasoning like "this becomes part of the lockup for Y," that's a compound-primitive-extension decision with different implications than "X stands alone." Sub-pattern of `feedback_user_clarification_restate_interpretation` extended to design-reasoning capture. Frame C lockup framing this session.
2. **"Deviation from RECOMMENDED on fallback-state axes signals deliberate product call"** — David picked "hide avatar when null" (NOT recommended initials-with-hue). Deviation on a fallback-state axis indicates a deliberate product call about "what does this look like for users who haven't engaged" — worth surfacing explicitly in design records with the deviation reasoning preserved.
3. **"Conditional primitive layout via prop presence (not enum variant)"** — BoothTitleBlock conditionally renders compound vs centered based on `avatarUrl` being non-null. Cleaner than passing an explicit `variant: "compound" | "centered"` prop because the layout shape IS the meaning. Sub-pattern of `feedback_dead_code_cleanup_as_byproduct` extended to "let the data shape determine the rendering shape."
4. **"Design pass with 4 prose axes + 1 V1 mockup axis (out of 4) is the prose-model-first compromise shape"** — when 3 of 4 axes are prose-resolvable but the 4th is genuinely visual, do prose axes first (locks 75% of decisions) then V1 mockup only for the visual axis (compresses V1 to single-axis-frames spanning placement options). 4× narrower than full V1 spanning all axes. Sub-pattern of `feedback_pre_mockup_prose_model_first` extended.

### Roadmap delta

**18 R-rows total. 13 ✅ Shipped, 0 🟢 Ready, 5 🟡 Captured.** Unchanged at row level — session 185 is design-to-Ready ship for vendor profile enrichment (candidate R19); promotion call deferred to post-Arc-2 ship when storefront-identity thesis is visible on production.

**Substrate added this session:** `docs/vendor-profile-enrichment-design.md` (15 frozen decisions + 3 arcs + 6 risks + 8 Tier B) · `docs/mockups/vendor-profile-enrichment-v1.html` (4 frames + 6-axis trade-off matrix).

**Substrate retired:** none (pure additive design-to-Ready ship).

**Net runtime change:** 0 LOC (docs-only session). **+969 / −0 LOC** across 2 new docs files.

[v0.185.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.185.0

---

## [v0.184.0] — 2026-05-18

### Session 184 — Vendor profile enrichment design pass kickoff (Shape B) + Arc 0 ship: migration 022 schema additions + handle retirement single coupled commit (-203 LOC net)

2 runtime commits + 1 close. David's session-opening ask: vendor-side profile enrichment — Facebook + Instagram URLs + bio + custom directions text + profile image update + retire @handle from setup ("handles don't quite make sense outside of other social platforms that use it, unless I'm missing something"). Per `project_vendor_value_first_prioritization` ✅ Promoted — matches the captured "vendor profile enrichment" candidate exactly. Audit-first via parallel reads localized current vendor architecture in 1 round-trip: `vendors` table already has `bio` + `avatar_url` + `facebook_url` + `hero_image_url` (only `instagram_url` + `directions_text` missing); handle is shopper-only (lives on shoppers table at `/login/email/handle` picker + `/me` `@handle` h1); vendors have no handle field at all. David's ambiguity-invitation ("unless I'm missing something") resolved with explicit take: for vendors, handle is redundant (booth name + booth slug serve as unique identity); for shoppers, handle serves no public-facing purpose (no social-graph). Cost-shape triage at 3 axes per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted via batched `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted — David picked all 3 RECOMMENDED options (retire handle picker + display entirely / reuse avatar_url + new placement / just FB+IG). Top-level cost-shape pick: **Shape B + Arc 0 today** (design pass in session 185; Arc 0 ships migration + handle retirement now to clear shopper-flow ambiguity before vendor profile arc).

### Added

- **`supabase/migrations/022_vendor_profile_enrichment.sql`** — additive nullable columns `vendors.instagram_url` + `vendors.directions_text`. NULL semantics documented inline: instagram_url NULL = no IG linked + UI hides icon; directions_text NULL = no custom directions + UI falls back to mall street address + R17 LocationActions alone. No backfill; existing rows render exactly as they did pre-migration. **HITL pending**: paste into both Supabase dashboards (prod + staging) before session 185 implementation arcs.
- **`types/treehouse.ts` Vendor interface extended** — `instagram_url: string | null` + `directions_text: string | null`. 2 in-codebase Vendor literal sites updated additively: `lib/fixtures.ts` VENDOR_BASE (all 5 fixture vendors inherit via spread) + `components/admin/VendorsTab.tsx` vendorRowToVendor() helper (defaults to null since admin tab doesn't expose these fields yet).
- **`lib/useShopperAuth.ts` silent auto-claim primitive** — module-scope `autoClaimPromise` dedupes the silent POST to /api/shopper-claim across concurrent useShopperAuth consumer mounts (Masthead + /me + /flagged footer all subscribe at once on warm nav). New `suggestHandleFromEmail()` helper (moved from retired picker page; strips non-alphanumeric, collapses hyphens, scout-XXXX fallback). New `autoClaimSilently(email)` POSTs with derived handle + any pending localStorage saves/booth-bookmarks; soft-fails with console.error; next page load retries naturally since promise resets on full page reload not warm nav. **7th cumulative firing of `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168** — pattern extends from READ layer (cachedRoleState + cachedShopperAuthState + cachedAuthUser + cachedMalls + cachedMallId + cachedVendorBundle) to WRITE layer (autoClaimPromise dedupes POST across concurrent mounts via Promise-cache vs state-cache).

### Changed

- **`lib/useShopperAuth.ts` `loadShopper` extended with `isRetry` guard** — when row null + user exists, commits `isLoading: true` (holds consumers in non-flashing state ~150–400ms), awaits `autoClaimSilently`, then recurses with `isRetry=true`. If retry STILL finds no row, the endpoint failed; renders authed-no-shopper state so caller surfaces a fallback path. Infinite-loop-guard via isRetry guarantees ≤2 queries per claim.
- **`app/login/page.tsx`** — `pickDest` `?role=shopper` early return retargets /login/email/handle → /me. Saves a tap by routing direct to /me (where auto-claim fires silently) instead of /welcome detour. `handleSend` + `handleResend` magic-link redirect simplified — removed role-based redirectTo branching; explicit `?redirect=` still wins; role threading happens in pickDest.
- **`app/me/page.tsx`** — removed /login/email/handle redirect; useShopperAuth's auto-claim handles the missing-row case transparently. Blank-surface guard (already covers loading + !shopper cases) keeps the page quiet during the ~150–400ms auto-claim window. File-top doc comment updated with session 184 handle retirement BOUNDED REVERSAL note + new auth-state-branching table.
- **`app/welcome/page.tsx`** — "Just exploring" → /me directly (was /login/email/handle). File-top comment updated.
- **`app/me/page.tsx` avatar margin-bottom 14 → 22** — compensates for retired @handle h1 (the avatar + scouting-since eyebrow now sit closer together; extra 8px preserves rhythm vs stats below).

### Removed

- **`app/login/email/handle/page.tsx` DELETED (-312 LOC)** — picker page wholesale retire per Q1 cost-shape pick "Retire picker + display." Suggestion logic moved to lib/useShopperAuth.ts module scope where it's the load-bearing input to silent auto-claim. **BOUNDED REVERSAL** of R1 Arc 3 ship (sessions 111-112) per `feedback_surface_locked_design_reversals` ✅ Promoted — original D7+D8 rationale (handle as explicit cross-device identity step) cited; counter-rationale: handle has no public-facing role (no social-graph), the picker step is pure friction over auto-suggestion.
- **`app/me/page.tsx` `@{auth.shopper.handle}` h1 block (-14 LOC)** — BOUNDED REVERSAL of R1 D4 (h1 as Cormorant 22 / 500 / v2.text.primary identity beat); avatar + scouting-since eyebrow + private 3-stat row are sufficient identity for the shopper's OWN reflective destination. handle DB column + UNIQUE constraint + initials derivation preserved per `feedback_user_facing_copy_scrub_skip_db_identifiers` ✅ Promoted — avatar still renders initials derived from auto-claim-generated handle.
- **`app/review-board/page.tsx` "Handle pick" tile entry** — scope-adjacent dead code retirement per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (its target route deletes in same commit). Comment block in the System section documents the retire alongside the Welcome tile.

### Fixed

- **18th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** — html2canvas-pro local-env miss caught by tsc at C1 commit-boundary gate (fresh worktree, dep missing locally); canonical recipe (`npm install`) resolved in 1 round-trip.

### iPhone QA watch-items

- **/me display on Vercel preview v0.184.0** ⭐ load-bearing — sign out → sign back in (existing shopper) → /me renders avatar + scouting-since + private 3-stat row, NO `@handle` h1 above the eyebrow. Avatar spacing should feel balanced vs stats row.
- **Fresh-email sign-in flow** — sign in with email that's never been used → /login form → magic link → /login?confirmed=1 → polls → routes to /welcome → "Just exploring" → /me → blank surface ~200ms (auto-claim window) → populated state with derived initials.
- **Existing-shopper sign-in flow** — sign in with email that has shopper row → routes direct to /me with populated state (no auto-claim fires; existing row hydrates synchronously).
- **/flagged sync footer (guest with saves) → magic link → /me with saves migrated** — verifies auto-claim's silent migration of `loadFollowedIds()` + `loadBookmarkedBoothIds()` localStorage IDs to DB via /api/shopper-claim.
- **HITL pending**: paste migration 022 into prod + staging Supabase dashboards before session 185 implementation arcs.
- **NEW Tech Rule candidate (single firing this session, promotes on 2nd)**: "Hook-internal silent primitive replaces explicit picker page when UI step has no real user choice" — when a UI step is purely mechanical (auto-suggest from existing data; no validation needed), eliminate the surface by moving the work into a hook's internal lifecycle. Generalizes beyond auth/handle to any "we ask the user but they have no real choice" friction pattern.

[v0.184.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.184.0

---

## [v0.183.0] — 2026-05-18

### Session 183 — iPhone QA round 1 on production v0.182.0: F1 ✅ PASS retires carry + 3-commit fix bundle smallest→largest closes F4 /login footer + F2 TabsChrome Shape B split (chrome flicker root-cause kill) + F3 Next/Image round 3 escalation (BoothHero load delay)

3 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA walk on Vercel preview v0.182.0 + batched production walks across v0.180.0 + v0.181.0 + v0.182.0 + 29-session-deep Mapbox preview-only token carry + 11-session-deep launch-gaps. David walked production v0.182.0 + reported 4 findings in single message: **F1** ✅ PASS (Saved StickyMasthead lands clean); **F2** still seeing flicker on back-nav to / with screenshot showing tiles painted but masthead/chrome unpainted; **F3** /shelf BoothHero takes ~1s+ to load; **F4** change /login footer text to "Are you a vendor? Request your digital booth" + darken font. Per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~52nd cumulative firing), restated each finding's interpretation explicitly BEFORE drafting cost shapes — F1 PASS retires carry; F2 is **back-nav warm-mount chrome flicker** (different bug class than C1 cold-load fixed); F3 triggers session 182 C2 commit body's pre-scoped round 3 escalation per `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted; F4 verbatim per `feedback_user_provided_verbatim_values_ship_as_is` (2nd cumulative firing — promotion-ready on 3rd). Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized F2 root cause at `app/(tabs)/layout.tsx:103` in single 6-parallel-read cycle: `<Suspense fallback={null}>` wrapping `<TabsChrome />` + `useSearchParams` in TabsChrome forces Next.js 14 Suspense bailout on warm-nav from /find/[id] back to /, so the floating chrome (HomeHero + Profile + chip) renders the null fallback until URL hydrates. 3 cost shapes for F2 surfaced via `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted (Shape A skeleton fallback patch / Shape B split RECOMMENDED / Shape C off useSearchParams refactor); David picked Shape B.

### Added

- **`lib/cachedMalls.ts`** — shared module-scope cache + `useActiveMalls()` reactive hook + inflight Promise dedup + `getCachedMalls()` sync accessor. Extracted from TabsChrome.tsx's local cachedMalls (session 175 — 5th cumulative firing of `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168) to enable TabsChrome + new MallParamReceiver to share one fetch without re-implementing the cache + inflight Promise primitive. **6th cumulative firing of the warm-nav hydration discipline.** Reusable substrate for future "two consumers want the same hydrated state" cases.
- **`components/MallParamReceiver.tsx`** — URL-aware ?mall= intake side-effect extracted from TabsChrome. Renders null + runs the canonical side-effect (look up mall slug → setMallId + fire `filter_applied` R3 event + strip param). Suspense-wrapped in `app/(tabs)/layout.tsx` so its useSearchParams bailout is contained without affecting the floating chrome stack.
- **`<SearchBarSlot>` internal subcomponent inside `components/HomeHero.tsx`** — URL-aware ?q= read/write contained in own Suspense boundary inside HomeHero's bottom-anchored 16px SearchBar slot. Hero photograph + cream-fade + wordmark all paint synchronously around this slot; only the search bar suspends briefly on warm-nav URL hydration. NEW Tech Rule candidate: **"Internalize URL state inside consumer + own Suspense boundary"** — sub-pattern of the broader Suspense-bailout-containment pattern; consumer API simplifies from URL-prop plumbing to `<HomeHero showSearch />` flag.
- **`next.config.js` `images.remotePatterns`** — `*.supabase.co/storage/v1/object/public/**` (production hero photos served via Supabase Storage public URLs) + `picsum.photos/**` (smoke route fixtures for `/shelf-v2-test` + `/home-hero-test` etc.). Required for Next/Image to optimize remote URLs without runtime errors.

### Changed

- **`components/TabsChrome.tsx` split per F2 Shape B (root-cause kill)** — slimmed from URL-aware orchestrator to non-URL Base chrome. Removed `useSearchParams`, `handleSearchChange` callback, ?mall= intake side-effect. Now renders OUTSIDE the layout's Suspense boundary so the floating chrome stack (HomeHero + Profile overlay + MallPickerChip) paints synchronously on warm-nav from /find/[id] → /. Path branches preserved (`/map → null`; `/flagged → StickyMasthead`; `/ → Home chrome`). Reads `useActiveMalls()` from shared `lib/cachedMalls.ts` instead of local cache. NEW Tech Rule candidate: **"`<Suspense fallback={null}>` at layout level + `useSearchParams` in chrome orchestrator = whole-chrome-invisible on warm-nav"** — Next.js 14 App Router specific bug class; the fix shape generalizes to any layout-level orchestrator that mixes URL-dep + non-URL-dep chrome.
- **`components/HomeHero.tsx` API simplified** — props collapse from `searchQuery?: string + onSearchChange?: (q: string) => void + searchPlaceholder?: string` to `showSearch?: boolean + searchPlaceholder?: string`. HomeHero now owns URL state for its SearchBar slot internally via the new `<SearchBarSlot>` subcomponent.
- **`app/(tabs)/layout.tsx`** — TabsChrome moves OUTSIDE the previous `<Suspense fallback={null}>` wrapper. New `<Suspense fallback={null}><MallParamReceiver /></Suspense>` sibling component contains the ?mall= side-effect's URL hydration; renders null so its Suspense window has no visible chrome cost.
- **`components/BoothPage.tsx` BoothHero round 3 escalation (F3) — Next/Image + Vercel Image API + edge cache** — replaces session 182 C2's manual `useLayoutEffect + <link rel="preload">` document.head.appendChild primitive with framework-native `<Image fill priority sizes="(max-width: 430px) 100vw, 430px" />`. Vercel Image API at runtime: fetches origin Supabase URL → re-encodes to AVIF/WebP (typically 50-80% smaller payload) → resizes to device-appropriate width via `sizes` hint (mobile gets ~640px AVIF/WebP variant) → caches at Vercel edge → auto-emits `<link rel="preload" imagesrcset="...">` in head for any `<Image priority>` in React tree. Per `feedback_kill_bug_class_after_3_patches` ✅ Promoted round 3 escalation (round 1 session 171 `new Image()` useEffect; round 2 session 182 useLayoutEffect + W3C preload; round 3 here = framework-native primitive that auto-emits preload AND optimizes the asset itself).
- **`app/login/page.tsx` /login footer text + darken (F4)** — text "New here? Request a digital booth →" → "Are you a vendor? Request your digital booth" (no arrow per David's verbatim spec; ship as-is per `feedback_user_provided_verbatim_values_ship_as_is` 2nd cumulative firing → promotion-ready on 3rd). Color v2.text.muted (#A39686) → v2.text.secondary (#5C5246) — one tier up the v2.text scale per "darken the font." Stays footer-voice (not primary-CTA voice v2.text.primary #2B211A). `textDecorationColor` mirrors color for visual cohesion of dotted underline.
- **`app/home-hero-test/page.tsx`** — adopts new HomeHero showSearch API; visual smoke testing preserved (typing in search bar on smoke route now routes to / via internalized URL state; documented in comment).

### Removed

- **`components/BoothPage.tsx`** — `useLayoutEffect` import + entire preload useLayoutEffect body (~34 LOC retired) + `<img>`'s `fetchpriority` + `decoding` attrs. Next/Image's `priority` prop covers preload emission; `decoding="async"` is the default for off-main-thread decoding. Scope-adjacent dead-code retirement per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted (as byproduct of round 3 ship).

### Fixed

- **F2 chrome-flicker on warm-nav back to / from /find/[id]** — root cause was `<Suspense fallback={null}>` at layout level + `useSearchParams` in TabsChrome triggering Next.js 14 Suspense bailout on warm-nav. Shape B split addresses root cause: non-URL chrome (HomeHero photo + Profile + chip) renders OUTSIDE Suspense + paints synchronously; URL-dependent code (SearchBar slot + MallParamReceiver) contained in own Suspense boundaries. Visual outcome: floating chrome stack appears immediately on warm-nav with no empty-cream-flash.
- **F3 BoothHero ~1s+ cold-load delay** — round 3 escalation from session 182 C2's pre-scoped commit body. Session 182 C2's `useLayoutEffect + <link rel="preload">` got Supabase URL into high-priority preload slot but didn't reduce physical network time (~500ms-1s cold fetch for raw Supabase JPEG/PNG). Next/Image + Vercel Image API + edge cache fixes both the preload AND the asset-size root cause. First visit post-deploy builds the edge cache; subsequent visits near-instant.
- **F4 /login footer text + visual weight** — copy swap + color darken per David's verbatim spec.
- **17th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** — html2canvas-pro local-env miss caught by tsc at C1 commit-boundary gate; canonical recipe (`npm install`) resolved in 1 round-trip.

### iPhone QA watch-items

- **/flagged → /find/[id] → back to / chrome flicker (C2 F2) on Vercel preview v0.183.0** ⭐ load-bearing — HomeHero photo + Profile bubble + MallPickerChip should paint synchronously on warm-nav (no empty cream-space-then-chrome-pops-in flash). SearchBar may briefly appear empty for a few ms (16px bottom inset only), then hydrate with `?q` value if any.
- **/shelf/[slug] BoothHero cold-load (C3 F3) on Vercel preview v0.183.0** ⭐ load-bearing — Force-quit PWA + re-open + tap any booth. Photo should paint significantly faster than v0.182.0 (Next/Image serves AVIF/WebP at ~640px width from Vercel edge). First visit post-deploy builds edge cache; subsequent near-instant. If still flickers → round 4 escalation candidates (NOT pre-scoped in C3 commit body since round 3 is canonical framework-native primitive): preconnect to `*.supabase.co` in head · Next.js custom loader prop pointing at Supabase Image Transformations · lower default quality.
- **/login email-entry footer (C1 F4) on Vercel preview v0.183.0** — Should read "Are you a vendor? Request your digital booth" (no arrow) in v2.text.secondary #5C5246 (visibly darker than old v2.text.muted #A39686).
- **Production walks combinable across v0.180.0 + v0.181.0 + v0.182.0 + v0.183.0** (after preview QA + merge) — 4 production-tagged sessions worth of validation surfaces all combinable in single batched walk (~30-40 min combined).
- **NEW Tech Rule candidate single firings**: 5 NEW candidates this session — Suspense fallback=null + useSearchParams in chrome orchestrator = whole-chrome-invisible on warm-nav / Internalize URL state inside consumer + own Suspense / Shared module-scope cache module + reactive hook with inflight Promise dedup / Round 3 escalation pre-scoped in round 2 commit body becomes 1-step ship / Same-message multi-finding bundle with PASS marker closes prior carry as byproduct. All single firings; promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted.

[v0.183.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.183.0

---

## [v0.182.0] — 2026-05-18

### Session 182 — 4-item iPhone-QA-driven dial bundle: Saved header → StickyMasthead + HomeHero + BoothHero flicker kill-the-bug-class structural fix + vendor-request footer restoration

4 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA validation on Vercel preview + production v0.181.0 + 28-session Mapbox preview token + 10-session launch-gaps. David redirected with a 4-item bundle in single message: (1) Saved page header → match other pages (not Explore); (2) hero image flicker on Home/Explore page each load; (3) same flicker on /shelf BoothHero; (4) add back vendor request submission on /login. Per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~51st cumulative firing), restated interpretation before drafting cost shapes. Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized all 4 surfaces in 5 parallel reads — (tabs)/layout + TabsChrome + HomeHero + BoothPage + login page + git history grep for session 157 commit `5c75af0` that retired the vendor footer link. Cost-shape triage at 3 levels per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132: Item 1 + Item 4 batched into single `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted; Items 2+3 bundled as Shape A recommended inline (kill-the-bug-class structural fix per `feedback_kill_bug_class_after_3_patches` ✅ Promoted — session 171 dial #1 was patch round 1 of BoothHero flicker; David's session 182 report = patch round 2 = escalate to W3C-canonical primitive). David picked Item 1 Shape A (Full StickyMasthead) + Item 4 Shape A (session 153 footer link verbatim). Round 3 escalation (Next/Image + Supabase remotePatterns) explicitly NOT pre-committed per `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted — deferred until iPhone QA shows whether Shape A fully kills /shelf flicker.

### Added

- **`<link rel="preload" as="image" href="/home-hero.png" fetchPriority="high">` in `app/layout.tsx` `<head>`** — browser starts fetch during HTML parse, before any JS runs. By the time React mounts `<HomeHero>` (33vh background-image hero), the image is in HTTP cache and the CSS rule paints with photo already present. Kills the HomeHero flicker bug class at the HTML-parse layer. Reusable primitive for any future statically-known image asset (wordmark, hero, splash, fallback) that needs first-paint guarantee. NEW Tech Rule candidate: "`<link rel='preload' as='image'>` in root layout head as canonical kill-the-bug-class for static-asset paint-in" — CSS `backgroundImage: url(...)` is lazy-fetched after stylesheet cascade resolves; preload link in `<head>` inverts the ordering at HTML-parse layer.
- **Dynamic `<link rel="preload">` injection primitive in `components/BoothPage.tsx`** — `useLayoutEffect` + `document.createElement('link') + document.head.appendChild(link)` with cleanup-on-unmount. useLayoutEffect (NOT useEffect) is the load-bearing axis — fires post-commit-pre-paint, in the same render cycle as the img element mount; browser dedupes preload + img fetch into the high-priority slot. NEW Tech Rule candidate: "useLayoutEffect + document.head.appendChild as W3C-canonical primitive for dynamic preload links" — sub-pattern of `feedback_kill_bug_class_after_3_patches` extended from "replace the wrong primitive" to "replace the wrong React lifecycle hook." useLayoutEffect (NOT useEffect) is the load-bearing axis when DOM side effects need to land in the same paint cycle as React's render.
- **Saved-page StickyMasthead render branch in `components/TabsChrome.tsx`** — new `if (pathname === "/flagged") return <StickyMasthead left={MastheadBackButton} right={MastheadProfileButton} />;` early-return added BEFORE the Home render path. `bg` prop omitted — StickyMasthead defaults to v2.bg.main (#E6DECF) which matches Saved's page bg v2.bg.tabs (same #E6DECF per session 166 dial 8 tier extraction); no bg dial needed. Cross-(tabs) chrome reads consistently when navigating Home → Saved → Map. NEW Tech Rule candidate: "Saved page chrome → StickyMasthead pattern as cross-(tabs) chrome continuity" — sub-pattern of `feedback_surface_locked_design_reversals` extended from "reverse a specific value" to "reverse the scope of a universal application."
- **Session 153 vendor-request footer link restored on `/login`** — minimal Inter italic 11px + dotted underline + v2.text.muted; "New here? Request a digital booth →"; renders only on `renderState === "form" && screen === "enter-email"` so it's quiet chrome below the form that doesn't compete with the Continue button. All token + import dependencies (Link from "next/link", FONT_INTER, v2) already existed in scope (verified via grep before edit per `feedback_verify_primitive_contract_via_grep` ✅ Promoted).

### Changed

- **`components/BoothPage.tsx` BoothHero preloader primitive replaced** — session 171's `new Image()` useEffect preloader (patch round 1) → `<link rel="preload">` document.head.appendChild useLayoutEffect (canonical primitive; patch round 2 escalation). Session 171's analysis was correct (img mounts AFTER React commits with resolved heroImageUrl prop; browser fetches between commit and paint); fix shape was wrong — useEffect fires post-paint, so the cold-start race wasn't helped at all (preloader only warmed cache for warm-nav re-mounts). NOT a dead-code-cleanup-as-byproduct since the file body net-grew — patch-shape replacement per `feedback_kill_bug_class_after_3_patches` ✅ Promoted.
- **Saved chrome retired (but NOT deleted from codebase)** — HomeHero render path skipped on Saved branch (still renders on Home via `searchQuery={isHome ? q : undefined}` conditional); floating MastheadBackButton overlay retired on Saved (slot moves into StickyMasthead left); floating MastheadProfileButton overlay retired on Saved (slot moves into StickyMasthead right). Home keeps current behavior verbatim — HomeHero + floating Profile overlay + MallPickerChip + no back button (Home is root, no back-from route). BOUNDED REVERSAL of session 175 Option α + session 121 R18 D-lock per `feedback_surface_locked_design_reversals` ✅ Promoted (**11th cumulative firing this session**) — session 175 made hero universal across Home + Saved as full-identity-beat thesis; session 182 scopes reversal narrowly to Saved only (Home keeps the hero as load-bearing identity beat for the Explore surface).
- **Session 157 vendor-request footer retire reversed on `/login`** — session 157 commit `5c75af0` retired the session 153 minimal Inter 11px italic footer link with reasoning "the triage process below already provides discoverability." Empirically that path requires the new vendor to be in the system already — brand-new vendors with no email on file have no way to surface the /vendor-request entry from /login. Session 157 retirement assumed /welcome's post-magic-link triage caught new vendors, but it only triages users who can already sign in. The restored footer link closes that gap. BOUNDED REVERSAL per `feedback_surface_locked_design_reversals` ✅ Promoted (**10th cumulative firing this session**).

### Fixed

- **HomeHero flicker on Home/Explore cold-load** — David: "There is a flicker of the hero image on the explore/home page each time it loads." Root cause: HomeHero ([components/HomeHero.tsx:118](components/HomeHero.tsx:118)) paints via CSS `backgroundImage: url('/home-hero.png')` — CSS background images are fetched lazily AFTER stylesheet cascade resolves; no priority hints possible on the CSS rule itself. First paint shows the cream-fade gradient over nothing, then the photo pops in (two-frame flicker). Static preload link inverts that ordering at the HTML-parse layer — browser sees the preload directive before any JS runs, fetches with highest priority, image is in cache by the time HomeHero mounts.
- **BoothHero flicker on `/shelf/[slug]` cold-load** — David: "Same flicker occurs on the booth hero image on the /shelf page." Session 171 dial #1 shipped a `new Image()` preloader in `useEffect` thinking it warmed the cache before the img mount; in practice useEffect fires post-paint, so the cold-start race was untouched (preloader only helped warm-nav re-mounts when navigating between vendor /shelf pages). Patch round 2 fix: replace `new Image()` useEffect with `<link rel="preload" as="image" href={heroImageUrl} fetchpriority="high">` document.head.appendChild via useLayoutEffect. useLayoutEffect fires post-commit-pre-paint in the same render cycle as img mount; browser dedupes preload + img fetch into the high-priority slot. If iPhone QA shows flicker persists post-C2, round 3 escalation = Shape B (Next/Image with `priority` + Supabase `images.remotePatterns` config in next.config.js + per-image sizing) documented in C2 commit body as committed follow-on per `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted.

### iPhone QA watch-items

- **/flagged (Saved) on Vercel preview v0.182.0**: slim StickyMasthead replaces 33vh hero photo; back button left, wordmark center, Profile right; tap back → routes to / (Explore via router.back fallback).
- **/ (Home/Explore) on Vercel preview v0.182.0**: HomeHero flicker should be GONE on cold-load (preload in head; browser fetches during HTML parse). LOAD-BEARING validation since this is the primary asset David flagged.
- **/shelf/[slug] on Vercel preview v0.182.0**: BoothHero flicker should be reduced or gone on cold-load. If still flickers, that's patch round 3 territory and escalation to Shape B (Next/Image + Supabase `images.remotePatterns` config).
- **/login on Vercel preview v0.182.0**: email form state should show "New here? Request a digital booth →" link below the Continue button (tiny Inter italic 11px + dotted underline + v2.text.muted).
- **Production walks combinable across v0.180.0 + v0.181.0 + v0.182.0** (after preview QA + merge) — 3 production-tagged sessions worth of validation surfaces all combinable in single batched walk after merge (~20-30 min combined).
- **NEW Tech Rule candidate single firings**: 4 NEW candidates this session — preload-in-head as kill-the-bug-class for static-asset paint-in / useLayoutEffect + document.head.appendChild as W3C-canonical primitive for dynamic preload links / Saved chrome → StickyMasthead as cross-(tabs) continuity / 4-item single-message bundle composed of 2 reversals + 2 bug-class kills compresses 4 axes into single session. All single firings; promote on 2nd firing per `feedback_tech_rule_promotion_destination` ✅ Promoted.

[v0.182.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.182.0

---

## [v0.181.0] — 2026-05-17

### Session 181 — Custom Mapbox Studio cream style closes /find/[id] vs /map cartography mismatch + retires ~110 LOC runtime palette helper as scope-adjacent dead-code byproduct

2 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA on production v0.180.0 + 27-session Mapbox preview-token + 9-session launch-gaps strategic session. David redirected with iPhone QA screenshots of /find/[id]'s static map snapshot rendering cool/white against /map's warm-cream live cartography: *"I want the static map image to match more closely with the actual cartography on the map."* Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized in 2 reads — `lib/mapStaticImage.ts:63` hardcodes `mapbox/light-v11`; Mapbox Static Images API only accepts hosted style URLs (can't apply runtime layer overrides the way `TreehouseMap.tsx`'s `applyCartographicPalette()` does). Session 169 file-top comment explicitly called the gap "acceptable for a small thumbnail; the brand-cream cartographic vocabulary lives on /map proper" — David's QA reversed that lock per `feedback_surface_locked_design_reversals` ✅ Promoted (**9th cumulative firing**). Cost-shape triage per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132: Shape A custom Mapbox Studio style URL (RECOMMENDED — closes 73-session Studio carry from session 108 + retires ~110 LOC runtime substrate) vs Shape B live mini-map embed (defeats snapshot simplicity) vs Shape C stay-as-is (reverses David's ask). David picked Shape A. Mid-flow blocker: Mapbox Studio v3 dropped the legacy Light template from the "New style" dialog — only Standard / scratch / Upload remain. Pivot to script-first per session-103 canonical: write `scripts/generate-cream-mapbox-style.ts` that fetches `mapbox/light-v11` via Styles API + walks layers[] applying same per-id logic as `applyCartographicPalette` writing literal hex values + outputs Studio-uploadable JSON. David ran the script (45/50 layers mutated, 5 untouched are structural fade-only), uploaded `treehouse-cream-style.v1.json` to Studio, published as `Treehouse Cream v1`, returned style URL `mapbox://styles/kentuckytreehouse/cmpak5jem000x01ry5jwe5t6w`. Code-side single coupled commit ships style URL swap on both consumers + retires runtime helpers as scope-adjacent dead-code byproduct per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. **15th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** (html2canvas-pro parked dep from session 152; `npm install` resolved at C1 boundary in 1 round-trip).

### Added

- **`scripts/generate-cream-mapbox-style.ts`** (one-shot Mapbox style generator) — fetches `mapbox/light-v11` via Styles API (curl-equivalent, no Referer so URL restriction doesn't block laptop runs), walks `layers[]` applying same per-id paint logic as `TreehouseMap.tsx`'s `applyCartographicPalette` but writes literal hex values into the JSON (preserves existing zoom-interpolation expressions on line-width by merging paint properties rather than replacing), strips server-managed fields (`id`, `created`, `modified`, `owner`, etc.) so Studio's upload endpoint accepts the JSON as a fresh style payload, outputs `scripts/treehouse-cream-style.v1.json` (5,457 lines baked from light-v11). Run with `npx tsx scripts/generate-cream-mapbox-style.ts`. Mirrors `scripts/add-mall.ts` env-loader convention (session 103). Future palette tweaks become a single re-run + re-upload instead of layer-by-layer Studio clicking. NEW Tech Rule candidate: "Script-generated Mapbox style JSON for Studio upload as patch shape for Mapbox Studio v3 template removal" — sub-pattern of `feedback_script_first_over_sql_dump` (promoted session 57) extended to third-party SaaS UI changes that remove direct paths.
- **`scripts/treehouse-cream-style.v1.json`** (Studio-uploadable artifact, committed for reproducibility) — baked Mapbox Style Spec v8 JSON with cream palette pre-applied. Validates clean: 50 layers, background `#E6DECF` (cream landmass), water `#C5D6C4` (sage), waterway `#AAC3AA` (deeper sage line), roads `#FFFFFF`, labels `rgba(42,26,10,0.55)` text + `rgba(245,242,235,0.85)` halo with width 1.2. Existing zoom-interpolation expressions on line-width, dash arrays, opacity fades all preserved intact (script merges paint properties, doesn't replace).
- **Custom Mapbox Studio style URL `kentuckytreehouse/cmpak5jem000x01ry5jwe5t6w`** (live in Mapbox cloud, owned by David's Studio account) — published as "Treehouse Cream v1". Closes the **73-session Mapbox Studio carry from session 108** (Arc 3 design memo deferred italic-Lora label face + custom style URL until "David moves to a Studio-hosted style URL"). Italic-Lora label face still deferred but no longer architecturally blocked — adding it is a Studio Fonts upload + label-layer font-family swap in the same Studio editing surface.

### Changed

- **`lib/mapStaticImage.ts:63`** static-image URL: `mapbox/light-v11` → `kentuckytreehouse/cmpak5jem000x01ry5jwe5t6w`. File-top comment lines 22-26 updated — prior caveat about "static snapshots render at the Mapbox default light-v11 palette — acceptable for a small thumbnail" retired; replaced with session-181 reversal acknowledgement quoting David's verbatim ask + explanation of the script-first generation path.
- **`components/TreehouseMap.tsx:488`** live-map `style` URL: `mapbox://styles/mapbox/light-v11` → `mapbox://styles/kentuckytreehouse/cmpak5jem000x01ry5jwe5t6w`. File-top comment (lines 1-9) updated — Arc 3 "this commit ships only the shell, palette per D25 lands in commit 2" historical narrative retired; replaced with current-state explanation of the custom Studio style baking the palette natively.
- **`components/TreehouseMap.tsx:828`** error-chrome `background` value: `resolveCssVar(v1.basemap.cream)` → `v1.basemap.cream` (direct CSS var reference). CSS vars resolve natively in JSX inline styles — Mapbox was the only non-CSS-API consumer in the project that needed the `resolveCssVar` bridge. Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — style URL swap + dead-code retire interlock; splitting leaves intermediate commit where the retired helper still runs redundantly. NEW Tech Rule candidate: "Custom hosted style URL retires runtime layer-override helper at the seam" — corollary of session 156's CSS-var-bridge pattern; bridges built at runtime to compensate for upstream gaps retire automatically when the upstream closes the gap.

### Removed

- **`resolveCssVar()` helper function** (`components/TreehouseMap.tsx` lines 38-53; ~16 LOC) — session-156 CSS-var-to-non-CSS-API bridge added because Mapbox `setPaintProperty` doesn't resolve CSS variables. With `applyCartographicPalette` retired, the only remaining consumer (error chrome bg at line 828) drops its wrapper since CSS vars resolve natively in JSX inline styles. Mapbox was the sole non-CSS-API consumer.
- **`applyCartographicPalette()` helper function** (`components/TreehouseMap.tsx` lines 55-148; ~94 LOC) — session-108 D25 runtime layer-walking paint override that walked light-v11's layers + called `setPaintProperty` per-id to apply the v1.basemap.* palette. Custom Mapbox Studio style URL ships these colors natively. Function body + comment block + the `applyCartographicPalette(map)` callsite in `map.on("style.load")` handler all retire. `style.load` handler stays for `styleLoadedRef.current = true` + `map.resize()` + `clearTimeout(watchdog)` per session 156 load-reliability primitives.
- **NOT removed (audit-before-retire bounded scope per `feedback_verify_primitive_contract_via_grep`):** `v1.basemap.cream` + `v1.basemap.cream2` tokens stay in `lib/tokens.ts` because `TreehouseMap.tsx:828` (error chrome bg) and `MapCarousel.tsx:337` (selected card accent bg) both still reference them. `--th-v1-basemap-*` CSS vars in `app/globals.css` stay (referenced by the tokens). NEW Tech Rule candidate: "Audit token consumers BEFORE scoping dead-code retire" — sub-pattern of `feedback_verify_primitive_contract_via_grep` extended to dead-code-retire scope-bounding.

### Fixed

- **/find/[id] static map snapshot reads visually disconnected from /map live cartography** — David's iPhone QA screenshots showed cool/white static against warm-cream live; both surfaces now point at the same custom Studio style URL and render identical cream cartography. Reverses session-169 design comment lock "the brand-cream cartographic vocabulary lives on /map proper" — caveat was deliberate at session 169 (static snapshot was added as a tap-able thumbnail under DestinationHero; runtime override couldn't apply); reversal becomes possible at session 181 because the custom Studio style URL is the seam where both consumers get the palette for free. NEW Tech Rule candidate: "Single user redirect closes long-deferred carry as side-effect" — David's QA finding became the natural forcing function for the session-108 Mapbox Studio carry (73 sessions deep); long carries get closed by adjacent feature work, not always by dedicated cleanup sessions.

### iPhone QA watch-items

- **/find/[id] cartographic block** on Vercel preview v0.181.0: static map snapshot renders cream cartography matching /map live cartography (warm cream landmass · sage water · faint ink labels · paper-cream halo).
- **/map live map** on Vercel preview v0.181.0: no regression on cartographic palette (custom Studio style URL provides same colors `applyCartographicPalette` previously applied at runtime; visual should be identical to v0.180.0 live map).
- **/map error chrome fallback** — `v1.basemap.cream` direct reference renders cream bg correctly when watchdog surfaces "Map didn't load. Tap to retry." overlay (line 828 swap from `resolveCssVar(v1.basemap.cream)` to `v1.basemap.cream` — CSS var resolves natively in JSX inline).
- **/map carousel selected card accent bg** (MapCarousel:337) — still uses `var(--th-v1-basemap-cream2)` fallback to `#EFE6D2`; should not regress with token preserved.
- **Mapbox token URL allowlist gap** — Vercel preview at `*.vercel.app` may fail tile fetches silently (token URL restriction allowlist is `app.kentuckytreehouse.com + localhost` only; **28-session carry now**, was 27→28 since David didn't confirm provisioning the preview-only token in the Studio session this round). If preview snapshots appear blank, that's the gap — production-PWA QA after merge is the canonical validation path.

[v0.181.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.181.0

---

## [v0.180.0] — 2026-05-17

### Session 180 — /map page chrome-cohesion 5-dial bundle (Shape A compressed into 3 smartly-coupled commits) + 1 iPhone-QA-driven MAP_PEEK_OFFSET_Y dial

4 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA on production v0.179.0 + 26-session-deep Mapbox preview-only token + 8-session-deep launch-gaps strategic session. David redirected with a verbatim 5-finding dial bundle on /map page chrome geometry + color cohesion: (1) anchor top of map to bottom of masthead, no padding; (2) MallPickerChip bg → page bg; (3) anchor bottom of map to top of mall carousel, no padding; (4) extend carousel bg to bottom of page; (5) carousel bg → page bg. Per `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132, Shape A picked implicitly (5 surgical dials with explicit values; well-scoped); 5 dials compressed into 3 smartly-coupled commits per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted. David's iPhone QA on Vercel preview: *"looks good. Walk clean."* Net change: ~+90 / −20 LOC across 4 files in ~30-min execution window.

### Added

- **MallPickerChip `stickyBg?: string` additive prop** with default `v2.bg.tabs` (preserves Home consumer verbatim — Home page bg is v2.bg.tabs so chip continues to blend); /map passes `v2.surface.warm` to match /map's page bg per (tabs)/layout pathname branch (session 179). **8th cumulative firing of `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted** at session 141 — design record D11 assumed the same bg vocabulary would carry; /map's page-bg override surfaces the gap. NOT a reversal — design didn't reach the surface-specific-bg dimension. Mirrors session 179 chevronDirection additive prop shape (7th firing).
- **MapPageBody outer wrapper `paddingBottom: max(213px, calc(safe-area + 213px))`** — reserves carousel's vertical extent so bordered window's bottom edge sits at carousel-rectangle-top per David's "anchor bottom of map to top of carousel" ask. 213 = 81 (carousel bottom offset, unchanged) + 132 (content vertical extent: 12 top + 114 card + 6 bottom padding after borderTop retirement). Safe-area-aware to match carousel's own bottom math on notched iPhones. NEW Tech Rule candidate: "Bordered-window padding-bottom reservation as primitive pattern for fixed-bottom-chrome geometry."

### Changed

- **MapPageBody FRAME_PAD_TOP 14 → 0** (David ask 1) — with chip-bg flip dissolving the chip strip into warm v2.surface.warm page-bg, the 14px top breathing room above the bordered window became a visible page-bg gap between chip-bottom and bordered-window-top. Retiring it anchors the bordered window's top edge flush against the chip-bottom edge — the visual bottom of the unified masthead/chip/page-bg chrome stack. Within-session dial of session-178 D14 per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128. Bounded reversal — side padding FRAME_PAD_X=14 preserved.
- **MapCarousel background `v2.bg.main #F7F3EB` → `v2.surface.warm #FBF6EA`** (David asks 4 + 5) — matches /map's page-bg per (tabs)/layout pathname branch (session 179). With bg=page-bg the shelf is visually continuous with page-bg above the carousel (where bordered-window-bottom now sits) AND below (where page-bg shows through BottomNav's floating-overlay chrome). David's "extend bg to bottom of page" reads as the visual continuity achieved by the bg match — page-bg flows uninterrupted from carousel top through BottomNav's gap.
- **MAP_PEEK_OFFSET_Y `-20` → `+60`** (David iPhone QA on Shape A bundle: selected mall callout "appears too high and gets cutoff") — root cause: C2 (FRAME_PAD_TOP 14 → 0) + C3 (paddingBottom 0 → 213px) made bordered window ~199px shorter; session 179's -20 offset was calibrated for the taller container, putting pin proportionally higher relative to top edge. +60 inverts direction — pin now sits 60px BELOW container vertical center; with callout-above-pin ~155px tall + tail, element CENTER (~pin - 62) lands at ~container center, reading visually centered per David's literal ask. **3rd iteration of MAP_PEEK_OFFSET_Y dial chain** within bounded magnitude per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 (session 158: -60, session 179: -20, session 180: +60). NEW Tech Rule candidate: "Container-geometry change cascades to recalibrate Mapbox easeTo offset" — sub-pattern of within-session-design-record-reversal extended from token values to camera-geometry constants.

### Removed

- **MapCarousel `borderTop: 1px solid v2.border.medium`** — session-161 substrate defining shelf edge against map above when carousel was a distinct band. With bg=page-bg the band has no edge; the chrome becomes redundant. Per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — scope-adjacent retirement in same commit as the bg flip. NEW Tech Rule candidate: "Carousel chrome retire as byproduct of bg-page-bg flip" — sub-pattern of dead-code-cleanup-as-byproduct extended to chrome-retire-when-rendering-context-changes. Mirrors session 179 C7 (selected card border retire as byproduct of bg→nav-pill-greenLight flip).
- **MapCarousel `boxShadow: "0 -2px 6px rgba(42,26,10,0.06)"`** — same reasoning as borderTop. Scope-adjacent retirement in same commit as bg flip.

### Fixed

- **Selected mall PinCallout vertical clipping on /map post-Shape-A-bundle** — callout opens above pin per Mapbox PinCallout placement; with the new shorter bordered window the -20 offset put pin too high relative to top edge, leaving callout's top flush against masthead/chip chrome. MAP_PEEK_OFFSET_Y +60 dial places callout+pin element vertically centered. David's iPhone QA on Vercel preview: *"looks good. Walk clean."*
- **`feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** — **14th cumulative firing** (html2canvas-pro parked dep from session 152; `npm install` resolved at C1 commit boundary).

### iPhone QA watch-items

- **/map page chrome-cohesion validation** end-to-end on production v0.180.0: chip bg dissolves into page-bg (warm) · map top flush with chip-bottom (no padding gap) · map bottom flush with carousel-rectangle-top (213px paddingBottom reservation) · carousel bg = page-bg (no visible band) · borderTop + shadow retired (carousel reads invisible against page-bg) · selected mall callout vertically centered in bordered window (MAP_PEEK_OFFSET_Y +60).
- **Home chip no regression** on `stickyBg` default (chip continues to blend with Home page-bg v2.bg.tabs) + `chevronDirection="down"` default preserved.
- **Map nav tab + chip-as-back-nav (session 179)** still work end-to-end.
- **/shelves URL bar redirect** still lands on /map (session-108 disposition restored at session 179).
- **Mapbox preview-only token** still pending — 27-session carry now (156→180). ~15 min HITL closes permanently.

[v0.180.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.180.0

---

## [v0.179.0] — 2026-05-17

### Session 179 — Chip-not-selectable bug root-caused at config-substrate layer via Chrome MCP audit (1 round-trip, 0 speculative patches) + Map nav restored as peer entry path to /map (8th iteration R10 D1) + 10-finding Shape A dial bundle on /map page UX (6 commits sequenced smallest→largest)

8 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA on production v0.178.0 paired with the 25-session-deep Mapbox preview-only token + 7-session-deep launch-gaps strategic session. David: *"yes."* While David stepped to do Mapbox HITL, iPhone QA on production surfaced two findings: *"the mall chip is not selectable and there is no map icon in the nav bar."* The session inverted from "QA-on-clean-ship" into a discipline-stack-test at scale — chip-bug-investigation + Map-nav-design-reversal + 10-finding /map UX dial bundle, all in single ~3-hour session, all running through the operating-system rules without re-scoping mid-flight. **Canonical operational form of `feedback_surface_locked_design_reversals` ✅ Promoted at the SUBSTRATE LAYER** (config files, not visual chrome) — session 178's design reversal of session 155's /map retirement didn't reverse the next.config.js `/map → /` permanent redirect, which silently intercepted every `router.push("/map")` from chip onClick → 308 → bounce to / → URL stayed /. **`feedback_visibility_tools_first` ✅ Promoted + `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted at round 0** — Chrome MCP `javascript_tool` JS eval against production React tree localized the bug in 1 round-trip (0 speculative patches).

### Added

- **Map nav tab restored at slot 3 in BottomNav** — 8th iteration of R10 D1 BottomNav history; 4th cumulative iteration adding/removing Map tab from nav across project history (107→110→121→155→178→179). Per David's "Interp 2 + keep both as peer entry paths. Map position should be after saved icon." Guest/shopper/admin: `Explore · Saved · Map` (3-tab); Vendor: `Explore · Saved · Map · Booth` (4-tab; rightmost-role-specialty rule preserved). Icon: `PiMapPinBold` (Phosphor outlined, matches `PiLeafBold` + `PiStorefrontBold` family; reserves `PiMapPinFill` for primary-glyph identity contexts like the chip per session 178 paired-glyph vocabulary). 3 explicit reversals surfaced in commit body per `feedback_surface_locked_design_reversals` ✅ Promoted.
- **`chevronDirection: "down" | "up"` additive prop on `<MallPickerChip>`** with `aria-label` adaptation ("Back to Explore — current location: {mallName}" when `chevronDirection="up"`). Conditional `PiCaretDown` / `PiCaretUp` render. Default "down" preserves Home consumer verbatim. Additive prop per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted (**7th cumulative firing post-promotion**). /map passes `chevronDirection="up"` — mirror of Home's chevron-down: Home = "tap to expand to map"; /map = "tap to collapse to explore."
- **`(tabs)/layout.tsx` pathname-based bg branch** — /map page bg overrides to `v2.surface.warm` (#FBF6EA) matching the /map page's StickyMasthead bg per finding 1. Scope-bounded: Home + Saved stay on `v2.bg.tabs` (#E6DECF) per session 166 dial 8 chrome-tier extraction.
- **Carousel selected card chromatic emphasis** — bg `v2.surface.input` → `rgba(30,77,43,0.10)` matching `BottomNav.tsx C.greenLight` (line 168). Cross-surface visual continuity with active-nav-tab pill vocabulary.
- **Cross-surface BottomNav stroke vocabulary as standard `rgba(42,26,10,0.18)`** for chrome boundaries on /map (Reset button + carousel cards both). Anchored to David's finding-7 nav-bar visual continuity ask.

### Changed

- **Carousel ↔ navbar perceived padding halved (~24px → ~12px)** — wrapper-bottom `87` → `81` (gap shelf↔nav: 12px → 6px) AND inner shelf padding-bottom `12` → `6` (cards-bottom inside shelf: 12px → 6px). Coupled per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — both contribute to same perceived padding; splitting leaves mismatched internal-vs-external gaps.
- **MallPickerChip padding `12/6` → `8/8` symmetric** — vertical centering on /map between masthead + bordered window. **3rd iteration of session-164 D11 dial chain** within bounded magnitude per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128 (D11 dial chain: session 164 22/10 → session 166 dial 6 12/6 → session 179 8/8). Applied universally (Home + /map both).
- **Carousel selected card scale `1.12` → `1.03` + translateY `−12` → `0`** — subtle "in focus" cue; neighbors no longer collide laterally (1.03 = ~4px lateral expansion total fits within 8px shelf gap). Reverses session-165 R2's pronounced peek-up lift per `feedback_surface_locked_design_reversals` ✅ Promoted. Carousel shelf top padding `22` → `12` (peek-up headroom no longer needed). Selected card boxShadow pronounced lift → matches non-peeked baseline (bg-color carries selection now, not elevation).
- **Carousel selected card border `1.5px solid v2.accent.green` → `1px rgba(42,26,10,0.18)`** — unified with non-peeked + Reset chrome-boundary vocabulary. Per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted — bright green border becomes redundant 3rd emphasis cue stacked atop bg + scale; nav-pill vocabulary uses bg-only distinction.
- **Reset button border `v2.border.light #E5DED2` → `rgba(42,26,10,0.18)`** + carousel card non-peeked border `v2.border.medium #D6CCBC` → `rgba(42,26,10,0.18)` (BottomNav stroke vocabulary cross-surface match).
- **/map chip onTap** changes from `setSheetOpen(true)` → `router.push("/")` — chip role on /map becomes back-to-Explore navigation (mirror of Home chip's forward-to-/map role). **Bounded reversal of session 178 D6** per `feedback_surface_locked_design_reversals` ✅ Promoted. Scope-changing on /map now happens exclusively via pin tap → callout → Explore CTA (commits + routes to /) OR Reset button (clears scope, stays on /map).
- **`next.config.js` /shelves redirect destination** restored from `/` → `/map` (session-108 original disposition; session 155 had retargeted to `/` because /map was retiring same session — constraint now gone with session 178 + 179).

### Removed

- **`next.config.js` `/map` + `/map/:path*` permanent redirects** — were session 155 substrate that survived into session 178's /map page revival as silent config-substrate contradiction. Every `router.push("/map")` from chip onClick hit 308 → bounced to / → URL stayed /. **NEW Tech Rule candidate** surfaced in commit body: "Cross-session feature restoration must retire prior-session retirement redirects in same commit as feature ship — grep `next.config` + `middleware` before declaring an R-session implementation arc complete." Sub-pattern of `feedback_surface_locked_design_reversals` ✅ Promoted extended to config-substrate layer.
- **MallSheet import + `sheetOpen` state + `<MallSheet>` JSX from `app/(tabs)/map/page.tsx`** per finding 4 + session 178 D6 reversal. MallSheet.tsx file kept on disk for parked-component pattern (session 152 precedent; BoothPickerSheet.tsx still references MallSheet inheritance in file-top comment).
- **Carousel peeked-state geometric peek-up** (translateY −12px + scale 1.12 + heavy lift shadow + 22px shelf top padding) — replaced by chromatic bg-tint emphasis matching nav-pill vocabulary.
- **`map_page_sheet` R3 analytics path** — no remaining trigger after MallSheet retires from /map. `map_page_pin` (Explore CTA) + `map_page_reset` preserved as surviving scope-management paths.

### Fixed

- **Chip on Home — "chip not selectable" (`router.push("/map")` silently no-op'd).** Root cause: `next.config.js:23` permanent redirect `/map → /` from session 155 surviving into session 178's /map page revival. Localized in 1 round-trip via Chrome MCP per `feedback_visibility_tools_first` ✅ Promoted + `feedback_cap_speculative_patching_at_3_rounds` ✅ Promoted at round 0 (zero speculative patches). Chrome MCP `javascript_tool` JS eval verified React onClick handler IS attached + executes without error AND URL doesn't change — escalated diagnosis from "is the handler firing?" directly to "what's intercepting the navigation?" without speculative patches.
- **`feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** — **13th cumulative firing** (html2canvas-pro `npm install` at C1 commit boundary).

### Deprecated

- **`home_strip_tapped` analytics event on /map chip back-nav path** — intentionally not fired post-session-179; semantically different from Home chip's "tap to expand to map." Operational drift flagged in C8 commit body: if R3 analytics needs explicit back-nav tracking, add dedicated event (e.g., `map_back_to_explore`) in follow-up commit + update `lib/clientEvents.ts` ClientEventType union. Non-blocking.

### iPhone QA watch-items

- **/map page Shape A 10-dial validation** end-to-end on production v0.179.0: page bg unifies with masthead bg (v2.surface.warm) · carat shows up · chip tap → routes back to `/` (no bottom sheet) · carousel shelf bg unchanged · carousel-to-nav padding ~12px (was ~24px) · selected card subtle (1.03 scale, no neighbor collision) · selected card bg = nav-pill greenLight · chip vertically centered between masthead + window · Reset visible stroke · carousel cards visible strokes.
- **Home chip no regression** on `chevronDirection="down"` default (PiCaretDown still renders + tap routes forward to /map).
- **Map nav tab** taps land on /map with active highlight (green pill); muscle-memory path alongside chip; vendor rightmost-Booth rule preserved.
- **/shelves URL bar** redirects to /map (session-108 original disposition restored).
- **Mapbox preview-only token** still pending — 26-session carry now (156→179). ~15 min HITL closes permanently.

[v0.179.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.179.0

---

## [v0.178.0] — 2026-05-17

### Session 178 — F2 Map page extraction implementation Arcs 1-4 end-to-end (8 commits against locked design record, 0 re-scoping) + 3 QA dial commits (/map masthead bg + v1.iconBubble solid + /find/[id] paired-glyph swap)

11 runtime commits + 1 close. David: *"F2 Map page extraction."* Pure execution against `docs/map-page-extraction-design.md` (locked session 176 C2, 20 frozen decisions D1–D20 + Frame A bordered window + 4-arc sequencing). **29th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted crosses the load-bearing operating mode threshold David's session 177 CURRENT ISSUE called out** — Arc 1 shipped clean across 3 commits, Arcs 2–4 then shipped clean across 5 more, zero re-scoping mid-flight, only one schema-forced extension surfaced explicitly (MallPickerChip `stickyTop` prop) per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted. David's mid-PR iPhone QA walk surfaced 3 dial bundles compressed into this same session per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted: (1) /map masthead bg → `v2.surface.warm` matches /find exactly; (2) `v1.iconBubble` token rgba → solid `#EFEBDF` system-wide via session 144 Layer 1 CSS-var refactor + `overlay` variant retire on both masthead-button primitives; (3) /find/[id] paired-glyph swap (`PiStorefrontBold` ↔ `PiMapPinFill`) + 4-sub-dial visual unify across cartographic eyebrow + carousel header.

### Added

- **`/map` dedicated route** at `app/(tabs)/map/page.tsx`. Reverses session 109's /map page deletion + retires session 155's drawer-overlay reshape; revives the pre-155 "contained window" feel. Composition top-to-bottom per D9 + D10 + D11 + Frame A: `<StickyMasthead bg={v2.surface.warm}>` with `<MastheadBackButton fallback="/" />` + wordmark + `<MastheadProfileButton />` matches /find/[id] exactly · `<MallPickerChip stickyTop={0}>` mirror of Home's strip · `<MapPageBody>` Frame A bordered window · `<MapCarousel open={true}>` always-visible page-level sibling per D15.
- **`components/MapPageBody.tsx`** (~160 LOC) — Frame A bordered window primitive composing `<TreehouseMap>` + inline `<MapControlPill>` overlay. 1px solid v2.border.medium + 14px radius + 14px page padding + drop shadow + MapControlPill anchored top-right inside the window per D5 + D14. Pure presentation; consumer owns peekedMallId + resetKey state.
- **`components/MapPageTransition.tsx`** (~30 LOC) — framer-motion slide-up enter wrapper per D4. `initial={{y:"100%"}} animate={{y:0}}` with MOTION_BOTTOM_SHEET timing — preserves the muscle-memory drawer-enter cadence users built across sessions 154-177. Wraps only MapPageBody (not the full page) so position:fixed StickyMasthead + position:sticky MallPickerChip don't fight transform-creates-containing-block during animation. Enter-only scope; exit deferred per risk R5.
- **`app/map-page-test/page.tsx`** smoke route — primitive-isolated validation of Frame A geometry with 3 mock KY malls + console.log handlers + bottom-shelf stand-in. Per `feedback_testbed_first_for_ai_unknowns` ✅ Promoted (5th cumulative firing post-promotion).
- **`stickyTop` optional prop on `<MallPickerChip>`** — additive contract extension per `feedback_schema_forced_deviation_not_design_reversal` ✅ Promoted (5th cumulative firing); default = `HERO_BOTTOM_EDGE` for Home consumer; /map passes `0` since there's no hero above the chip per D11.
- **3 new R3 analytics events** scoped to /map: `filter_applied` with `source: "map_page_pin"` (PinCallout commit per D7) / `source: "map_page_sheet"` (MallSheet picker tap per D6) / `source: "map_page_reset"` (Reset pill tap).
- **Module-scope `cachedMalls` cache** in `app/(tabs)/map/page.tsx` per `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168 (6th cumulative firing post-promotion). Eliminates chip text flicker on warm-nav cycles.
- **Auto-peek useEffect** on `/map` — selected mall surfaces PinCallout immediately on mount.
- **`<MallSheet>` revived from dormant** (20 sessions since session 158 when MallMapDrawer became canonical) — file-top revival comment + audit notes. Mounted as scope picker on `/map` per D6. Visual vocabulary preserved verbatim; `findCounts` intentionally omitted on /map consumer.

### Changed

- **/map masthead bg** dialed `v2.bg.tabs` → `v2.surface.warm` per David's QA: *"I'd like this page to use the masthead that's used on the /find page."* Matches /find/[id] + /shelf/[slug] exactly. Within-session refinement per `feedback_within_session_design_record_reversal` ✅ Promoted-via-memory at session 128.
- **`v1.iconBubble` token value** flipped `rgba(42,26,10,0.06)` → `#EFEBDF` (solid) per David: *"Instead of them being transparent variations, can we just change the buttons to #efebdf without transparency? This keep the color accurate across headers regardless of the BG."* Single `--th-v1-icon-bubble` CSS-var edit cascades to **16+ inline consumer surfaces + 2 primitives + IconBubble in /find/[id]** automatically via session 144 Layer 1 token foundation refactor — zero per-callsite edits for the bg change itself. David verbatim per `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted. First proper cross-arc demonstration of the Layer 1 refactor's payoff at scale.
- **Home `<MallPickerChip>` onTap handler** swaps from `toggleDrawer()` to `router.push('/map')` per D1.
- **`/find/[id]` cartographic eyebrow icon swap** `PiStorefrontBold` → `PiMapPinFill` + text "Purchase this item at" → "Visit location to purchase find" + typography unify (dropped fontWeight 600 + lineHeight 1.3 so eyebrow matches carousel header below exactly). David verbatim per `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted.
- **`/find/[id]` "More from this booth…" carousel header** gains `PiStorefrontBold` icon prefix + text rename to "More finds from this booth" (ellipsis dropped). The two header icons effectively SWAP positions — pin-glyph moves UP to cartographic eyebrow ("the place"); booth-glyph moves DOWN to carousel header ("the booth"). Reads as deliberate paired-structure vocabulary across the scroll.
- **PinCallout Explore CTA on /map** commits scope + `router.push('/')` per D7 — "let me see what's there" routes to Explore feed with new scope active. `useSavedMallId` cross-instance broadcast ensures Home chip hydrates synchronously on next nav with no flash through all-Kentucky.

### Removed

- **`components/MallMapDrawer.tsx` (399 LOC)** — wrapper retired. Inner composition logic moved to MapPageBody at Arc 1.1.
- **`lib/useMapDrawer.tsx` (64 LOC)** — MapDrawerContext + MapDrawerProvider retired. Map scope-picker moved to dedicated /map route; cross-component drawer-open state no longer needed.
- **`MapDrawerProvider` import + wrapper** from `app/layout.tsx`.
- **TabsChrome substantial simplification** — `useMapDrawer` destructure + `<MallMapDrawer>` JSX mount (~50 LOC with handlers + analytics) + close-on-leave-Home useEffect (session 168 round 4 fix) all retire. Back-overlay conditional simplifies; `showChipAndDrawer` → `showChip` rename for accuracy.
- **`variant` prop on `<MastheadBackButton>` + `<MastheadProfileButton>`** + all `overlay` branches. Was load-bearing only because transparent default vanished against HomeHero photo (session 169 round 4 Review Board Finding 2); with default now solid #EFEBDF, visibility concern is gone; variant is dead substrate per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. 2 TabsChrome callsites + `v2` imports (unused) all drop.
- **`CHIP_VISIBLE_HEIGHT_PX` export** from `components/MallPickerChip.tsx` — constant existed only for MallMapDrawer's top:calc geometry; no remaining consumer.
- **Search-context MallMatchChip drawer-overlay slot** (session 165 Shape A dual-slot pattern). Home's inline MallMatchChip in `app/(tabs)/page.tsx` is the surviving consumer + carries `search_mall_match` analytics forward unchanged.

### Fixed

- **MallPickerChip `stickyTop` extension** addresses /map's "no hero above the chip" case — chip pins flush below masthead at `top:0` instead of HERO_BOTTOM_EDGE (would be wrong anchor on /map).
- **`feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted at session 161** — **12th cumulative firing** (html2canvas-pro parked dep from session 152; `npm install` resolved in 1 round-trip at Arc 1.1 commit boundary).

### iPhone QA watch-items

- **F2 /map page D1–D20 validation** — StickyMasthead matches /find · MallStrip pin to top:0 · Frame A bordered window geometry + MapControlPill placement · slide-up transition perception ("drawer expanded" vs "page jump") · MallSheet picker open + close + commit · pin tap → callout → Explore commits scope + routes to / synchronously · Reset clears scope + dismisses peek + fitBounds re-fires · D7 "exit no slide-down" trade-off perception on back-nav.
- **Cross-surface `v1.iconBubble` solid #EFEBDF** verification on 16+ consumer surfaces.
- **/find/[id] paired-glyph + copy** — pin glyph + "Visit location to purchase find" / booth glyph + "More finds from this booth" / typography unified.
- **F2 Tier B dials post-QA** — MapControlPill placement · chip caret (chevron-down → chevron-right) · slide-up exit (deferred per risk R5).
- **Mapbox preview-only token** still pending (25-session carry; 156→178) — /map silently fails tile fetches on Vercel preview; production-PWA QA is fallback. ~15 min HITL closes permanently.

[v0.178.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.178.0

---

## [v0.177.0] — 2026-05-17

### Session 177 — iPhone QA bundle on production v0.176.0: /find/[id] map filter retire + carousel revival + Explore this Booth CTA + hero compression magnitude dial

4 runtime commits + 1 close. David opened with `/session-open`; standup recommended F2 Map page extraction implementation (Arcs 1-5 against session 176's locked design record) as PRIMARY. David redirected with 4 iPhone-QA-driven findings on production v0.176.0 — same shape as session 175 (QA pivot pre-empting recommended primary). Per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~31+ cumulative firings), each finding restated interpretively + clarifying questions batched via single `AskUserQuestion` per `feedback_v2_options_before_drafting` ✅ Promoted before drafting any code: F1 scope (/find/[id] only vs global cartographic mute) / F2 magnitude (40 vs 60 vs 20px) / bundle vs F2 sequencing. David picked all 3 Recommended options (/find/[id]-only / 40px / bundle this session + F2 next session). 4 commits sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 (~499+ cumulative firings).

C1 `d91ecda` — F2 SCROLL_BEFORE_STICKY_PX 80 → 40 (smallest dial). David's verbatim: *"The sticky position of the explore header goes too far and cuts off part of the logo. It should look more like the second image attached with just some padding between the top of the logo and the screen up top."* Bounded magnitude dial of session 176 C1 — structural pattern (negative-top sticky compression) preserved; magnitude halves. 80px (~36% compression on iPhone SE) → 40px (~18% compression). Compressed hero now shows ~40px of breathing room above the wordmark when sticky-pinned. `HERO_BOTTOM_EDGE` export inherits the new value automatically via `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`; chip + drawer consumers re-anchor without code changes. **11th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161 — html2canvas-pro `npm install` at C1 commit boundary; lockfile updated.

C2 `72d3a3b` — F4 Explore this Booth button stacked below Flag the Find. David's verbatim: *"Add a button under the 'Flag the Find' button for 'Explore this Booth' (navigate to /shelf)."* Bounded revival of session 170 Arc 3's OTHER CTA-pair half per `feedback_surface_locked_design_reversals` ✅ Promoted (~82+ cumulative firings). Session 169 round 2 shipped Explore Booth + Flag the Find as side-by-side 50/50 CTA pair; session 170 Arc 3 retired BOTH on Shape B re-architecture ("save bubble IS primary CTA; booth nav via DestinationHero strip"); session 171 C6 bounded-revived Flag the Find under Price as dual affordance with photograph save bubble; session 177 C2 bounded-revives Explore Booth as a STACKED button below Flag the Find (not side-by-side per session 169 — David's verbatim singular noun + vertical stack vocabulary). Outer wrapper restructured from single-button container to flex-column with gap 10 so both buttons share the same padding + marginBottom. Style mirrors session 169 secondary outlined treatment exactly (cream bg + green text + 1px green outline) — Flag the Find above stays primary engagement CTA per lattice canonical `project_layered_engagement_share_hierarchy` ✅ Promoted. Label "Explore this Booth" verbatim per `feedback_user_provided_verbatim_values_ship_as_is` ✅ Promoted. PiStorefrontBold import REVIVED — was retired session 170 Arc 3 alongside the original Explore Booth CTA; revival comment preserves provenance.

C3 `d437c35` — F1 retire CSS warmth filter on /find/[id] map thumbnail. David's verbatim: *"The overlay on the map in the /find section is offputting due to the stark contrast i.e. warm hue on the map. We need it to be more muted like the mapbox background is."* Bounded surface-locked design reversal of session 171 dial #2 per `feedback_surface_locked_design_reversals`. Session 171 shipped `filter: sepia(0.4) saturate(1.1) hue-rotate(-8deg)` on the static Mapbox thumbnail to push the default light-v11 grey toward the project's v1.basemap.cream warm-cream (#F1E9D2) so the thumbnail matched /map page's interactive cartographic vocabulary. Production iPhone QA on v0.176.0 reads that warmth as stark contrast against the surrounding warm-cream cardstock. Audit-first per `feedback_visibility_tools_first` ✅ Promoted localized the bug class: /find/[id]'s map is a STATIC Mapbox image (`lib/mapStaticImage.ts` using `mapbox/light-v11`), NOT TreehouseMap with runtime palette overrides — the warm hue was purely the CSS filter. Bounded reversal scope: ONLY this thumbnail surface; /map page's interactive TreehouseMap keeps the warm-cream cartographic palette (session 156's `resolveCssVar`-fixed `setPaintProperty` overrides) since map IS the primary identity surface there. Placeholder bg also dialed v2.surface.warm → #F2EFEA neutral cream-grey for visual consistency with the now-muted image.

C4 `7c76217` — F3 revive "More from this booth" carousel (no Visit Booth text). David's verbatim: *"Need to add back in the more from this booth functionality at the bottom of the /find page. However, do not include the text on the far right that says 'visit booth' as this will be replaced by this [Explore this Booth button under Flag the Find — F4]."* Largest commit (+415/-42 LOC). Bounded surface-locked design reversal of session 170 Arc 4 (commit `dde9696` that retired the entire <ShelfSection> + 326 LOC + all substrate). Audit-first git-history recovery via `git show dde9696^:app/find/[id]/page.tsx` extracted the exact pre-retirement source state — mirror-image revival preserves all prior decisions including session 169 round 3's earlier retirement of the "Visit Booth" right-slot text (commit `03a6c76` — David's session-177 spec aligns automatically since the revival source state already honored it). Sub-pattern of `feedback_visibility_tools_first`: parent-of-retirement-commit recovery (`git show <sha>^:path`) reads as a canonical pattern for "revive the structural pattern that was retired at <sha>." Imports revived (useCallback / getVendorPosts / writeFindContext / getVendorPostsCache / setVendorPostsCache / FindRef / HomeFeedTile) + module-scope `findStripScrollKey` helper + 326-LOC `<ShelfSection>` function + `setShelfHasItems` + `shelfReady` useState + Phase C QA fix #3 setShelfReady reset + scroll-restore `shelfReady` gate + `handleShelfReady` useCallback + mount site OUTSIDE swipe-nav motion.div per pre-retirement geometry. All revival markers preserved with explicit "REVIVED at session 177 C4" provenance comments for greppability. F4 + F3 are the cross-session reversals of session 170 Arc 3 + Arc 4 respectively; F3's carousel restores parallel-discovery affordance ("look at other finds at this booth"), F4's button restores discoverable booth-nav affordance — DestinationHero's tappable vendor strip remains as co-equal third affordance, same pattern as Flag the Find ↔ photograph save bubble pair (multiple co-equal affordances for the same intent on the same surface — lattice canonical).

Vercel queue operational gap surfaced — when worktree push lands behind 2 prior deployments (session 176 close docs + PR squash-merge), MCP doesn't expose a cancel/delete tool. Workaround: dashboard URL handoff with identification of which deployments are non-load-bearing to cancel. NEW Tech Rule candidate: "Vercel queue cancellation requires dashboard (MCP gap) — provide URL + identify safe-to-cancel deployments by commit message inspection."

### Added

- **"Explore this Booth" button** below Flag the Find on `/find/[id]` (`app/find/[id]/page.tsx`). Secondary outlined CTA (cream bg + green text + 1px green outline + PiStorefrontBold 14px). Routes to `/shelf/[vendorSlug]`. Gated on `vendorSlug` non-null.
- **"More from this booth" carousel** revived at bottom of `/find/[id]`. Horizontal-scroll thumbnail strip showing other finds from the same booth (excluding current find). Cache-hit fast path via `getVendorPostsCache` + async fetch fallback via `getVendorPosts`. Per-tile tap writes swipe-context via `writeFindContext` so users can swipe through booth siblings. Header eyebrow LEFT-ONLY ("More from this booth…" italic Cormorant 18 in v2.text.secondary) — NO "Visit Booth" right-slot text (F4 Explore this Booth button under Flag the Find carries that intent).

### Changed

- **Home hero compression magnitude** — `SCROLL_BEFORE_STICKY_PX = 80` → `40` in `components/HomeHero.tsx`. Compressed pinned hero now shows ~40px breathing room above the wordmark (was: leaf glyph flush against URL bar). Bounded magnitude dial of session 176 C1; structural pattern preserved. `HERO_BOTTOM_EDGE` export inherits new value automatically; chip + drawer geometry re-anchors without code changes.
- **/find/[id] static map thumbnail palette** — CSS `filter: sepia(0.4) saturate(1.1) hue-rotate(-8deg)` retired in `components/DestinationHero.tsx`. Static Mapbox image now renders unmodified at default `mapbox/light-v11` neutral palette. Placeholder bg v2.surface.warm → #F2EFEA cream-grey for visual consistency. Bounded reversal scope: only this /find/[id] thumbnail; /map page's interactive TreehouseMap keeps warm-cream cartographic palette.

### Removed

- **CSS warmth filter** on `/find/[id]` map thumbnail (session 171 dial #2 retired per David's QA on v0.176.0).

### iPhone QA watch-items

- **F2 magnitude validation** — 40px reads as "just enough breathing room above the wordmark" not too aggressive / not too subtle. Dial up to 50 or down to 30 if QA flags.
- **F4 Explore this Booth button** — verify cream-on-cream readability against /find/[id] page bg; verify tap routes to correct `/shelf/[vendorSlug]`; verify stacked-pair visual hierarchy (Flag the Find = primary; Explore this Booth = secondary).
- **F1 muted map thumbnail** — verify default light-v11 grey reads cohesively with surrounding warm-cream cardstock (no jarring contrast); placeholder bg #F2EFEA harmonizes with both states.
- **F3 carousel revival end-to-end** — verify cache-hit fast path (back-nav into same find restores scroll position pre-paint); verify scroll-restore shelfReady gate (peer-nav into different find waits for carousel ready signal before scrollTo); verify per-tile tap preserves swipe-context (tap booth sibling → swipe back to original find works).

[v0.177.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.177.0

---

## [v0.176.0] — 2026-05-17

### Session 176 — Home hero scroll-and-compress dial + Map page extraction R-session design-to-Ready (Frame A bordered window + 20 frozen decisions)

2 runtime commits + 1 close. David opened with `/session-open`; standup recommended Round 3 iPhone QA + launch-gaps strategic session pair. David redirected to two iPhone-QA-driven findings on production v0.175.0: (F1) Home hero should scroll a bit before becoming sticky (reference image: Saved page hero at natural top-of-flow position); (F2) Pull MallMapDrawer back out of Explore into its own dedicated `/map` page with back button + no search bar + "contained window" feel + "seamless transition" + David's explicit "needs an R session." Per `feedback_user_clarification_restate_interpretation` ✅ Promoted, both findings restated interpretively before drafting; F2 surfaced as MAJOR design reversal of session 109's /map-page deletion + session 155's drawer-overlay reshape per `feedback_surface_locked_design_reversals` ✅ Promoted (~78+ cumulative firings).

C1 `b102aaa` — F1 Shape A scroll-and-compress dial. `position: sticky; top: -SCROLL_BEFORE_STICKY_PX (= 80px)` replaces Option α's `top: 0`. At scrollY=0 hero sits at top:0 (full 33vh visible, chrome bubbles overlay photograph, matches reference image). User scrolls — hero scrolls UP with content for 80px. Past threshold, sticky activates pinning hero with top 80px offscreen. Visible pinned hero = 33vh - 80px (~36% compressed on iPhone SE; wordmark + SearchBar still visible). BOUNDED REVIVAL of session 164 D16-D19 + session 166 dial 10 collapsing-header pattern at smaller magnitude (session 164: 158-191px collapse = 58-72% on iPhone SE; session 176: 80px collapse = 36%). BOUNDED REVISION of session 175 Option α — full-identity-beat thesis stays for scrollY=0; partial-compression activates AFTER user scrolls past 80px threshold. Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — `HERO_BOTTOM_EDGE` export updates from `${HERO_HEIGHT_VH}vh` to `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)` so chip + drawer geometry inherit compressed bottom edge automatically. Pre-existing local-env miss on parked `ShelfImageShareScreen.tsx` (html2canvas-pro) resolved via `npm install` at commit boundary — **10th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161.

C2 `c064baa` — F2 Map page extraction R-session design-to-Ready. Audit-first per `feedback_visibility_tools_first` ✅ Promoted dispatched Explore-agent inventory of session 155-166 map substrate (10 file reads + git-history recovery of pre-155 /map page from commit `3bbcbfb0d^` for the "contained window" reference David pointed at). Pre-V1 prose scoping (Q1-Q4 single AskUserQuestion) locked 4 structural decisions before drafting V1 mockup: D1 strip-routes-to-/map; D2 strip-mirrors-on-/map; D3 carousel-canonical-bottom-shelf; D4 framer-motion-slide-up. V1 mockup at `docs/mockups/map-page-extraction-v1.html` spans containment geometry across 3 frames (A bordered window literal revival / B soft-padded breathing room / C full-bleed) per `feedback_mockup_options_span_structural_axes` ✅ Promoted with 7-axis trade-off matrix. **David picked Frame A** — bordered window literal revival (1px border + 14px radius + 14px page padding). Post-V1 prose fill-refinement (Q5-Q7) — V2 mockup SKIPPED per `feedback_v2_options_before_drafting` ✅ Promoted (axes prose-resolvable); 3 fill axes locked: D6 MallSheet revival on /map strip tap; D7 PinCallout commit routes to /explore; D8 Saved keeps no /map entry. 20 frozen decisions D1-D20 + 8 Tier B explicit headroom items + 7-row risk register + 4-arc implementation sequencing (~8 commits, single-session ship plausible at ~90 min in session 177+). 6 cross-session reversals surfaced explicitly + acknowledged across sessions 109 + 155 + 156 + 158 + 161 + 166 + 175. Substrate inventory: 866-LOC TreehouseMap + 297-LOC MapCarousel + 439-LOC PinCallout + 5 hooks + cartographic palette + peek-state pattern all carry verbatim; MallMapDrawer wrapper + useMapDrawer context + drawer-specific framer-motion all retire; MallSheet (456 LOC dormant since session 158) revives for D6. Design record + V1 mockup committed together as single coupled commit per Design Agent rule + `feedback_commit_design_records_in_same_session` ✅ Promoted.

### Added

- **`SCROLL_BEFORE_STICKY_PX` constant** in `components/HomeHero.tsx` (= 80) — scroll distance allowed before negative-top sticky activates on Home. Easily dial-able via iPhone QA; module-scope constant propagates through chip + drawer geometry via single `HERO_BOTTOM_EDGE` export.
- **`docs/map-page-extraction-design.md`** — 20-decision design record for /map page extraction R-session (Frame A bordered window, 4-arc implementation sequencing, 8 Tier B headroom items, 7-row risk register). 🟢 Ready for implementation in session 177+.
- **`docs/mockups/map-page-extraction-v1.html`** — V1 mockup with 3 frames spanning containment geometry axis + 7-axis trade-off matrix. Frame A locked.

### Changed

- **Home hero sticky behavior** — `position: sticky; top: 0` → `position: sticky; top: -80px`. At scrollY=0 hero shows full 33vh; user scrolls 80px before pinning; pinned hero shows 33vh - 80px (~36% compressed on iPhone SE). Bounded revival of session 164 collapsing-header pattern at smaller magnitude. Bounded revision of session 175 Option α (scrollY=0 thesis preserved; pinned-state thesis revised).
- **`HERO_BOTTOM_EDGE` export** — value updates from `${HERO_HEIGHT_VH}vh` to `calc(${HERO_HEIGHT_VH}vh - ${SCROLL_BEFORE_STICKY_PX}px)`. Consumers (`MallPickerChip`, `MallMapDrawer`) inherit compressed bottom edge automatically via existing import; single coupled commit because hero offset + chip pin + drawer pin all track same physical dimension.

### iPhone QA watch-items

- **C1 scroll-and-compress dial** — verify 80px threshold reads as "a bit" not too aggressive or too subtle. Hero pinned compressed state should still show wordmark + SearchBar clearly. Dial `SCROLL_BEFORE_STICKY_PX` if QA flags.
- **Chip + drawer geometry under compression** — chip + drawer should pin flush against compressed hero bottom edge without gap or overlap on iPhone SE / 14 Pro Max. `HERO_BOTTOM_EDGE` calc inherits automatically; verify visually.
- **Combined walk owed**: C1 verification + Round 3 carries from session 175 (Option α + chip flicker now superseded by C1 behavior change; Round 3 walks the new state) + 9 unwalked v0.174 watch-items (combinable into single ~30 min walk).
- **F2 design pass**: implementation pending Arc 1+2+3+4 in session 177+ (~8 commits, ~90 min single-session ship plausible against locked record). Production iPhone QA at Arc 5.

[v0.176.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.176.0

---

## [v0.175.0] — 2026-05-17

### Session 175 — iPhone QA dial bundle on production v0.174.1: /login sub-text + EditBoothSheet typography + iOS keyboard + Home/Saved hero behavior reversal (session 164 D16-D19) + mall chip flicker fix

5 runtime commits + 1 close. David walked production v0.174.1 on iPhone PWA + surfaced findings across 3 rounds compressed into single session. Round 1 shipped surgical 3-fix bundle (C1 /login sub-text bumps + C3 EditBoothSheet iOS keyboard `scrollIntoView` + C2 EditBoothSheet typography size bumps). Round 2 shipped Option α major design reversal — Home hero stops collapsing entirely + Saved gets static in-flow hero (4-file coupled commit reversing session 164 D16-D19 sticky-collapsing-header). Round 3 shipped mall chip flicker fix (5th cumulative firing of `feedback_module_scope_cache_for_warm_nav_hydration` ✅ Promoted at session 168). David ran `/session-close` before completing Round 3 walk continuation on C4+C5 → carries to session 176 as primary validation gate.

First cross-axis firing of `feedback_audit_bounded_enumeration_is_patch_shape` ✅ Promoted at session 174 close — pattern generalizes from un-enumerated SITES (color audit's per-site enumeration) to un-enumerated DIMENSIONS (color vs size as separate audit axes). EditBoothSheet's colors passed WCAG 4.5:1; what failed is absolute SIZE legibility at iPhone arm-length (16/11/11 px), an un-enumerated dimension. David's "Why wasn't this caught?" surfaced this honest scope-bound answer explicitly.

### Added

- **`HERO_BOTTOM_EDGE` export** in `components/HomeHero.tsx` — `${HERO_HEIGHT_VH}vh` constant representing the hero's natural bottom edge in viewport coordinates. Consumers (`MallPickerChip`, `MallMapDrawer`) pin themselves at or below this edge.
- **`cachedMallId` module-scope cache** in `lib/useSavedMallId.ts` — sync warm-nav hydration primitive. `useState` initializer reads cache → hydrates synchronously on warm-nav re-mount. Setter writes cache alongside localStorage + custom-event broadcast. Storage event (cross-tab) also updates cache.
- **`cachedMalls` module-scope cache** in `components/TabsChrome.tsx` — sync warm-nav hydration for `getActiveMalls()` async fetch. Paired with `cachedMallId` for full sync-hydration of `selectedMall` computation on warm-nav.
- **iOS keyboard `scrollIntoView` pattern** at EditBoothSheet booth name input (vendor mode) — `onFocus` handler with `setTimeout(300)` + `scrollIntoView({ block: "center", behavior: "smooth" })`. 300ms delay clears iOS keyboard slide-up animation (~250ms) + sheet entry transition (340ms). Captured `target` const avoids stale ref.

### Changed

- **`/login` top sub-text** ("Enter your email to continue on Treehouse Finds.") — 18 → 20px Cormorant italic + weight 400 → 500. Third bump on this string (14→16 session 153, 16→18 session 169, 18→20 here).
- **`/login` bottom sub-text** ("We'll email you a sign-in link — no password needed.") — 14 → 16px Cormorant italic + weight 400 → 500. Paired with top sub-text bump.
- **EditBoothSheet title** ("Edit booth name") — 16 → 20px Cormorant.
- **EditBoothSheet eyebrow** ("Kentucky Treehouse · America's Antique Mall") — 11 → 13px italic Cormorant.
- **EditBoothSheet helper** ("Booth number and location are managed by Treehouse Finds...") — 11 → 14px italic Cormorant (matches /login bottom sub-text for cross-surface Cormorant italic helper-voice consistency).
- **Home hero behavior** — `position: sticky; top: calc(STICKY_THIN_HEIGHT - 33vh)` collapsing-header → `position: sticky; top: 0; height: 33vh` (stays at full 33vh pinned to viewport top throughout scroll). Page content scrolls under the full hero + chip. NO COLLAPSE.
- **Saved hero behavior** — sticky-collapsing → `position: static` (renders in document flow at top of page; scrolls away with content). Identity beat that scrolls with content, not sticky chrome.
- **`MallPickerChip` sticky top** — pins at `HERO_BOTTOM_EDGE` (33vh) so it sits flush against hero's bottom edge throughout scroll.
- **`MallMapDrawer` top calc** — `calc(HERO_BOTTOM_EDGE + 48px)` ≈ 318px on iPhone SE; MallPickerChip stays visible above drawer as dismiss affordance.

### Removed

- **Session-166-dial-3 drawer-open auto-scroll effect** (~30 lines) in `components/TabsChrome.tsx`. Retired as scope-adjacent dead-code byproduct of Option α per `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted. The auto-scroll forced scrollY to ~190px on drawer-open at scrollY=0 so hero would collapse out of drawer's render area. With Option α the hero stays full 33vh sticky at top:0 throughout scroll — drawer pins regardless of scrollY, no "drawer behind hero" race to resolve.
- **`HERO_STRIP_HEIGHT_HOME`** (`"calc(max(14px, env(safe-area-inset-top, 14px)) + 144px)"`) + **`HERO_STRIP_HEIGHT_SAVED`** (`"90px"`) + **`stickyThinHeight` ternary** + **calc-based negative-offset sticky positioning** in `HomeHero.tsx`. All dead code post-Option α.
- **`STICKY_THIN_HEIGHT` export** — renamed to `HERO_BOTTOM_EDGE` (semantic-meaning change; the export now represents the hero's natural bottom edge, not a collapsed thin-strip value). Sub-pattern of `feedback_dead_code_cleanup_as_byproduct` extended from code deletion to identifier semantics.

### Fixed

- **EditBoothSheet booth name input** keyboard covers most of sheet on iOS Safari (David's verbatim: "when edit is selected the keyboard covers most of it. This shouldn't happen.") — fixed via `onFocus` handler + `scrollIntoView({ block: "center" })` with 300ms delay clearing keyboard slide-up + sheet entry transition.
- **Mall chip flicker on Saved → Explore warm-nav** (David's verbatim: "The mall chip flickers when navigating from Saved to Explore (takes a split second to load)") — module-scope caches for `malls` + `mallId` enable sync hydration on warm-nav re-mount of TabsChrome; chip mounts with correct mall name immediately, eliminating "All Kentucky locations" → mall-name text flip.

### iPhone QA watch-items

1. **C4 Option α Home hero behavior** — verify hero stays full 33vh sticky during scroll (no collapse); page content scrolls under hero + chip. ~33vh hero + 48px chip = ~318px fixed chrome on Home during scroll (~40% iPhone SE viewport). Trade accepted at Option α pick: identity presence + simplicity over feed real estate.
2. **C4 Option α Saved static-in-flow** — verify hero renders inline at top + scrolls away with content (no sticky behavior on Saved).
3. **C4 MallMapDrawer drawer-open at scrollY=0** — opens cleanly below hero + chip without auto-scroll jank (auto-scroll effect retired).
4. **C5 chip warm-nav sync** — chip mounts with correct mall name on Saved → Explore nav (no "All Kentucky locations" flash). First cold mount may still show brief unhydrated state — acceptable since warm-nav was the surfacing path.
5. **C3 iOS keyboard scroll behavior** — booth name input scrolls into center of visible viewport after keyboard slides up (~300ms delay).
6. **C2 EditBoothSheet typography** — 20/13/14 px sizes read comfortably at iPhone arm-length without feeling oversized.
7. **C1 /login sub-text prominence** — 20px italic 500 + 16px italic 500 read prominent without feeling heavy.

[v0.175.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.175.0

---

## [v0.174.2] — 2026-05-17

### Session 174 final close — CLAUDE.md addendum integrating v0.174.1 Round 2 hotfix narrative

Docs-only patch increment per Shape A versioning ("still bump for docs-only sessions so timeline stays continuous"). Integrates the v0.174.1 hotfix arc into the session 174 full block, updates CURRENT ISSUE to point at v0.174.1 production state, refreshes session 175 opener with v0.174.1-aware iPhone QA framing. No runtime code changes.

### Changed

- **CLAUDE.md session 174 full block** — extended with `### Round 2 hotfix — v0.174.1` subsection covering David's Saved Browse #1 finding + 3-file visual hierarchy ship (SavedMallCardV2 article bg flip + mall-section card wrapper, AccordionBoothSection trailing empty row, SavedFindRow card → warm). Worktree-drift-resolution pattern fired 2nd cumulative time post-promotion (session 153 was 1st post-promotion firing).
- **CURRENT ISSUE** — Last updated date stays 2026-05-17; production reference updated `v0.174.0` → `v0.174.1` with hotfix merge SHA `a40d0b5`; recommended next session unchanged (iPhone QA on v0.174.1 contrast sweep + Saved visual hierarchy paired with launch-gaps strategic session).
- **Session 175 opener** — pre-filled opener block updated to reference v0.174.1 + 6 contrast-sweep watch-items extended with 3 Saved-visual-hierarchy watch-items from v0.174.1.

[v0.174.2]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.2

---

## [v0.174.1] — 2026-05-17

### Session 174 hotfix — Round 2 Review Board (Saved Browse #1): visual hierarchy on /flagged

Mid-session hotfix on top of v0.174.0 per Shape A versioning (patch increment). David's Round 2 iPhone QA finding post-v0.174.0 ship: *"change bg of the card container for the booth list to v2.surface.warm. But keep the mall section and booth sections (not the saved finds) the surface card color. Then add an empty row after the last item saved on the list and keep it the v2.surface.warm color."* Single coupled commit per `feedback_single_coupled_commit_when_must_move_together` ✅ Promoted — 3 file changes causally linked for visual hierarchy to read coherently.

Two clarifications resolved at opener per `feedback_user_clarification_restate_interpretation` ✅ Promoted (~23+ cumulative firings) + `feedback_v2_options_before_drafting` ✅ Promoted: mall section scope = "Full top portion" (mall header + DistancePill + Take the Trip + finds-waiting eyebrow) + empty row height = "Half-row breathing space" (~44px). Both recommended picks.

### Changed

- **`components/v2/SavedMallCardV2.tsx`** — outer `<article>` bg: `v2.surface.card → v2.surface.warm`. NEW inner `<div bg: v2.surface.card>` wrapper around full mall-section top portion (head-δ + Take the Trip + finds-waiting eyebrow). Reads as "warm container with card identity at top."
- **`components/v2/AccordionBoothSection.tsx`** — NEW trailing empty row at end of expanded body (aria-hidden, height 44px, `bg: v2.surface.warm`, borderTop 1px `v2.border.light`). Matches SavedFindRow separator pattern; reads as "completion row" extending warm-rows zone below last entry.
- **`components/v2/SavedFindRow.tsx`** — row bg: `v2.surface.card → v2.surface.warm`. Find rows recede as "warm casual rows" against booth body's card surface.

### iPhone QA watch-items

- **`SavedFindRow:138` save bubble bg** is `v2.surface.warm` — now matches row bg; only 1px border + green leaf icon distinguishes bubble. May visually disappear; one-line dial to `v2.surface.card` if reads "lost in the row" on real device.
- **Hairline contrast** — `SavedFindRow` borderTop 1px `v2.border.light` against warm bg (vs previous card bg); watch for softer separator read.
- **Booth-to-booth seam** — between two `AccordionBoothSection`s the article's warm bg shows briefly + the next section's borderTop hairline; should read as natural section break.

[v0.174.1]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.1

---

## [v0.174.0] — 2026-05-17

### Session 174 — Contrast fix-bundle implementation (Arcs 1-4 against locked audit) + iPhone-QA-driven Shape β system-wide sweep (Arc 5) + lint baseline 99 → 0

18 runtime commits + 1 close. Largest single-session contrast pass on record + the cleanest live demonstration of `feedback_kill_bug_class_after_3_patches` ✅ Promoted firing at audit-execution scope. David opened with `/session-open`; standup recommended fix-bundle implementation against the now-fresh `docs/contrast-audit.md` per session 173 close opener. David: *"yes."* Per `feedback_v2_options_before_drafting` ✅ Promoted + `feedback_triage_cost_shape_before_design_pass` ✅ Promoted, surfaced REC-3 (lint script vs token split) + REC-4 (italic-serif brand voice scope) as cost-shape triage at opener to batch brand/arch context-switch vs mid-session. David picked **REC-3 Lint script** (smallest blast radius, namespace stable, tooling investment as structural backstop) + **REC-4 audit recommendation** (all 4 Cormorant italic Tier 1 sites promote to `v2.text.primary`).

Arcs 1-4 shipped 13 commits sequenced smallest→largest with build clean at every commit boundary, vendor-flow first per REC-5 + `project_vendor_value_first_prioritization` ✅ Promoted. **29th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted** validated across 29+ different features — audit ran as execution spec; zero design calls + 2 brand/arch picks resolved at opener as cost-shape triage; multiple audit-description + line-number drifts caught + handled via grep-localization per `feedback_subagent_dispatch_catches_audit_drift` ✅ Promoted (BoothPage:596→:644, :688→:736, shelf:210→:243, find/[id]:1125 description drift, find/[id]/edit:601→:602, audit-missed :234 + :882 + ShareSheet's audit-paired icon all surfaced + handled via `feedback_dead_code_cleanup_as_byproduct` ✅ Promoted byproduct cleanup pattern).

David's iPhone QA on Vercel preview surfaced THE bug-class moment: **"I am still seeing areas where it's difficult to read"** with a Review Board finding on `/login` "muted font color still appearing `color: var(--th-v2-text-muted)`". Diagnosed gap — the audit's per-site enumeration was scope-bounded to ≤14px text + 15-16px italic; the systemic recommendation #1 said "retire `v2.text.muted` as a TEXT color entirely" but the execution only swept enumerated sites. **75% miss rate on `/login` alone** (audit enumerated 1 of 8 in-scope muted sites; the other 7 were "≥15px non-italic muted assumed legible" — David's QA invalidated the audit's assumption: muted is #A39686 on #E6DECF = **2.16:1 which fails WCAG AA at any size, italic or not**).

Per `feedback_kill_bug_class_after_3_patches` ✅ Promoted (3rd attempt — audit enumeration + execution + QA — escalates to structural fix) + `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted (per-site enumeration was the patch shape; system sweep + lint enforcement is the structural-fix shape), cost-shape triage surfaced 3 shapes Shape α (user-facing only, defer admin) vs Shape β (system-wide all 99 baseline) vs Shape γ (per-site triage). David picked **Shape β — System-wide sweep, all 99 baseline**. Arc 5 shipped 5 commits + lint extension + baseline doc update: 36 files swept across vendor-flow (Arc 5.1, 8 files) + auth/shopper (Arc 5.2, 7 files) + shared chrome (Arc 5.3, 12 files) + admin/Review Board (Arc 5.4, 9 files) + lint extension catching v1.inkFaint + Lucide bare-JSX icons (Arc 5.5) + baseline doc updated with decay-tracking table. **Baseline dropped 99 → 0.** Contrast bug class structurally closed.

Tooling additions: `scripts/lint-contrast.ts` modeled after session-162 `lint-shared.ts` pattern (detection: `color: v[12].(text.muted|inkMuted|inkFaint)` inline + TSX prop; allowlist: comments + placeholder context + decorative ≥22px icons via library-prefix OR bare-PascalCase JSX heuristic + size threshold). `npm run lint:contrast` registered as 6th lint script alongside spacing/colors/fonts/shadows/radius. Warn-not-fail per session 143 lock — calibration debt baseline, regression detection on new callsites. `docs/contrast-lint-baseline.md` ships as living document with decay tracking (Arc 4 init: 99 → Arc 5 close: 0).

### Added

- **`scripts/lint-contrast.ts`** (NEW, 134 LOC) — contrast token-compliance lint per REC-3 architectural pick. Detects `v2.text.muted` / `v1.inkMuted` / `v1.inkFaint` used as prose color; allowlists per-line based on comment / placeholder / ≥22px decorative icon (two-tier: prefix-name libraries + bare-PascalCase JSX for Lucide). Warn-not-fail.
- **`docs/contrast-lint-baseline.md`** (NEW) — living document tracking baseline decay session-over-session. Initial entries: Arc 4 init (99) + Arc 5 close (0; Δ −99).
- **`npm run lint:contrast`** — 6th lint script registered in `package.json` alongside spacing/colors/fonts/shadows/radius.

### Changed

- **System-wide v2.text.muted retirement as prose color** (Arc 5 Shape β) across **36 files / ~114 sites** (vendor-flow first per REC-5):
  - Vendor-flow (Arc 5.1, 8 files): `vendor-request` + `post/tag` + `setup` + `AddBoothSheet` + `AddBoothInline` + `EditBoothSheet` + `AddBoothTile` + `BoothPickerSheet`
  - Auth + shopper (Arc 5.2, 7 files): `login` + `welcome` + `admin/login` + `find/[id]` + `(tabs)/page` + `my-shelf` + `contact`
  - Shared chrome (Arc 5.3, 12 files): `MallScopeHeader` + `MallSheet` + `BoothPage` + `BoothLockupCard` + `SearchBar` + `EmptyState` + `FeaturedBanner` + `PhotographPreview` + `PostingAsBlock` + `TreehouseMap` + `VendorCTACard` + `BoothFormFields`
  - Admin + Review Board (Arc 5.4, 9 files): `admin/RelinkSheet` + `admin/VendorsTab` + `admin/ForceDeleteConfirm` + `admin/InviteVendorSheet` + 5 `review-board/*` files
  - Targets: `v2.text.muted → v2.text.secondary` + `v1.inkMuted → v1.inkMid` + `v1.inkFaint → v1.inkMid` (all #5C5246, passes WCAG AA 5.71-7.45:1 on all 4 in-scope backgrounds; preserves v1 namespace on v1-layer files)
  - Preserved per audit recommendation #1: border consumers + conditional ternary branches + placeholder template-literal at `SearchBar:181` (`${v2.text.muted}` syntax bypassed bare `color:` pattern naturally)
- **Arc 1 — Decoration retire (17 sites, 4 commits):** `textDecorationStyle: "dotted" → "solid"` + `textDecorationColor: v2.text.muted | v1.inkFaint → v2.border.light` across vendor-flow (BoothPage:648 + find/[id]/edit:514) + chrome primitives (MallScopeHeader + DestinationHero + BoothLockupCard) + auth/onboarding (login + setup + welcome + vendor-request × 3) + v1-layer shopper (find/[id] × 3 + shelf/[slug]:261). Decoration retire ships FIRST per REC-2 + `feedback_kill_bug_class_after_3_patches` so Arc 2 replace_all is structurally safe.
- **Arc 2 — Tier 2 sweep + REC-6 state-conveying icons (24 sites, 3 commits):** post/preview + me + ShareSheet (Arc 2.1, +ShareSheet:1162 PiLeafBold per REC-6) + find/[id]/edit (Arc 2.2, +audit-missed :234 drift) + shopper-flow REC-6 icon pairs (Arc 2.3, PinCallout:184 MapPin + login:732+733 + vendor-request:822+823 PiEnvelopeSimple+text per REC-6 "icon + text it prefixes are same scope unit").
- **Arc 3 — Tier 1 ship + REC-4 italic-serif (16 sites, 5 commits):** BoothPage (Arc 3.1, 4 sites incl audit-missed :882 byproduct) + find/[id]/edit (Arc 3.2, 3 sites with audit description drift surfaced) + auth/onboarding REC-4 picks (Arc 3.3, 4 italic-serif → primary per David's pick + handle:282 helper → secondary) + v1-layer shopper (Arc 3.4, 3 sites with audit description drift surfaced) + Saved chrome (Arc 3.5, SavedMallCardV2:168).

### Fixed

- David's iPhone QA finding (`/login` muted font color persisting in computed styles) — closed structurally via Shape β system sweep. All 8 in-scope `/login` muted sites now retired to `v2.text.secondary` (passing WCAG AA 5.71-7.45:1 on all backgrounds).

### iPhone QA watch-items

- **Decorative `·` bullet separators** (PostingAsBlock + VendorsTab) — visually darken slightly from muted → mid (same family, just less ghostly); acceptable variation OR one-line dial-back per site if reads "too prominent / pulling attention."
- **"(optional)" italic suffixes** after form labels — darken to mid; potentially reads more prominent than intended (subordinated label decoration); dial back if needed.
- **Dotted-decoration source colors** at find/[id]/edit:506 + other italic-serif Tier 1 sites swept to primary per REC-4 — voice trade-off acknowledged (loses some soft editorial-register voice); dial back specific sites to secondary if italic stroke loss + primary tier reads heavy.
- **BoothPage :509 chevron `▾`** (Cormorant 20px decorative, sweep visually darkens) — defer classification; iPhone QA dial if reads heavy.
- **`/shelf/[slug]:227` Heart icon** (size 32 decorative on NotFound) — was preserved per audit ≥22px exclusion + post-Arc-5 lint allowlist; should still read muted but darker on cream bg.
- **`/vendor-request:544` PiCamera 28px + opacity:0.75 compound risk** — single-line dial (drop opacity to 1.0 OR promote color tier) if camera placeholder reads ghostly on real device.

[v0.174.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.174.0

---

## [v0.173.0] — 2026-05-17

### Session 173 — Design-reviewer subagent registration validated via real dispatch + 4 audit-doc RECs applied to `docs/contrast-audit.md`

4 audit-doc commits + 1 close (docs-only session — no runtime code changed). Shape A gameplan move #1 follow-on per session 172 close opener. Validates subagent registration end-to-end via real `subagent_type: "design-reviewer"` Agent tool dispatch (vs session 172's inline-threaded `general-purpose` workaround per `reference_subagent_registration_session_start_only` ✅ Promoted) — agent registered from disk at session N+1 exactly as the platform fact predicted. Reproducibility check: 4 of 6 session-172 RECs reconverged + 2 sharpenings; critical NEW finding the static audit doc AND session 172 dispatch both missed — 13 omitted decoration sites (76% miss rate vs audit's 4 enumerated) — recommends arc re-sequencing so decoration retire ships FIRST, dissolving mixed-consumer collision class before ARC-2 `replace_all` runs.

All 4 advisory-actionable RECs applied to `docs/contrast-audit.md` per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted (+150/-18 lines, ~470+ cumulative firings); audit doc now sets up session 174's fix-bundle implementation as clean execution pass against fresh substrate. REC-3 (lint-script vs token-split architectural pick) + REC-4 (italic-serif brand voice scope) deferred to session 174 implementation opener — both need David's brand/arch input.

### Changed

- **`docs/contrast-audit.md` — 4 RECs applied via session 173 design-reviewer dispatch:**
  - **REC-1 (Launch-blocking) — re-baseline:** Token reference table updated with current resolved hex values from `app/globals.css` `:root` (verified session 173 via direct file read; supersedes any stale values cited elsewhere in doc). NEW "WCAG ratios reference matrix" section after Token reference computes 12 fg×bg pairs via Python WCAG 2.x relative-luminance algorithm as ground-truth reference for all offender rows. Notes bg.main 23.9% drop since session 168 (`#FBF6EA` → `#E6DECF`) and `v1.paperCream` as WORST-case canvas at 2.45:1 (not tabulated in original audit). 5 key findings derivable from matrix: muted FAILS on ALL 4 backgrounds (even highest-contrast `v2.surface.card` at 2.82:1 fails AA-large + non-text 3:1); secondary PASSES AA on ALL 4 (universal safe target); primary PASSES AAA on ALL 4.
  - **REC-2 (Launch-blocking) — 17-site enumeration + arc re-sequence (single coupled commit):** Bonus pattern table reorganized into 3 subsections (9 in-scope `v2.text.muted` decoration sites + 8 in-scope `v1.inkFaint` decoration sites + 4 post-flow excluded sites). Audit's BoothPage line :600 corrected to :648 (line drift post-session-171). Systemic recommendation #3 updated 4 → 17 instances + mixed-consumer collision risk flagged + sequencing-first guidance added. "Recommended fix-bundle sequencing" RE-ORDERED: OLD order (Arc 1 Tier 1 → Arc 2 Tier 2 sweep → Arc 3 Bonus → Arc 4 Token) → NEW order (Arc 1 Decoration retire → Arc 2 Tier 2 sweep (now safe) → Arc 3 Tier 1 ship → Arc 4 Token enforcement). Each arc gains vendor-flow-first sub-sequencing per REC-5. Arc 4 promoted from "(optional)" — JSDoc-only enforcement insufficient per `feedback_predicate_accumulating_patches_signals_wrong_shape` ✅ Promoted; lint-vs-token-split call deferred to session 174 opener. Session estimate updated 60-90 min → 75-105 min (Arc 1 expanded 4 → 17 sites).
  - **REC-5 (Medium) — vendor-value sequencing framing:** NEW "Vendor-value sequencing framing (session 173 — REC-5)" section before "Recommended fix-bundle sequencing." Identifies 6 vendor-flow files in scope (`/find/[id]/edit` + `/post/preview` + `/post/tag` + `/me` + `BoothPage` + `ShareSheet`) for first-within-arc sequencing per `project_vendor_value_first_prioritization` ✅ Promoted. Verbatim implementation-session opener paragraph included so session 174's standup can copy-paste rather than re-derive rationale.
  - **REC-6 (Medium) — icon spot-audit:** Exclusion table row tightened from "Icons >14px in muted" → "Decorative icons ≥22px in muted only"; sub-22px icons + state-conveying icons demoted out of exclusion to NEW "Icon contrast spot-audit (session 173 — REC-6)" section. Grep-derived inventory: 4 state-conveying icons needing color promotion (`ShareSheet:1162` PiLeafBold size 14 / `PinCallout:184` MapPin size 16 / `vendor-request:822` + `login:732` PiEnvelopeSimple size 14); 4 decorative ≥22px icons for iPhone QA spot-check (`vendor-request:544` PiCamera size 28 + opacity:0.75 flagged as COMPOUND RISK at ~1.6:1 effective contrast). Cites WCAG 2.1 SC 1.4.11 3:1 floor for non-text + session 45 precedent invalidation post-session-168.

### Added

- **2 memory files promoted-via-memory** (2nd cumulative firing per `feedback_tech_rule_promotion_destination` ✅ Promoted):
  - **`feedback_subagent_ship_with_validating_test_case.md`** — When shipping a new subagent (or significantly extending an existing one), include a real-input test case dispatch in the same session as the agent ship. Validates trust contract works end-to-end + catches structural design flaws before they reach production use. Session 172 first firing (inline-threaded `general-purpose` workaround); session 173 second firing (real `subagent_type` dispatch validating registration path).
  - **`feedback_subagent_dispatch_catches_audit_drift.md`** — When dispatching a read-only subagent against a static audit/design record/spec doc that was written 5+ sessions ago, the agent's fresh read of current substrate often surfaces drift the static doc missed (stale offender lists / stale baselines / stale exclusion rules / missing offenders). Dispatch as freshness check before treating doc as canonical. Session 172 first firing (bg-baseline drift); session 173 second firing (13 omitted decoration sites + WCAG 1.4.11 floor + worst-case `v1.paperCream`).

### iPhone QA watch-items

None — docs-only session; no user-visible chrome changed. Session 174 fix-bundle implementation will be the QA target.

[v0.173.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.173.0

---

## [v0.172.0] — 2026-05-17

### Session 172 — Design-reviewer subagent + /design-review slash command + validated test case against contrast audit

2 runtime commits + 1 close. Shape A gameplan move #1 from session 171 close — David committed at session 171 to evolve the operating mode away from per-pixel "pixel prompting" toward a design-reviewer agent that takes design authority on structural calls. Session 172 shipped the agent definition + canonical dispatch wrapper end-to-end + ran a real-input test case against `docs/contrast-audit.md` to validate the trust contract.

Audit-first localized no existing subagents at `.claude/agents/` (project or user level — first subagent in the project). 3 cost-shape Qs surfaced + David picked all recommendations: Shape B (agent + slash command, not agent-only) · Pre-implementation design pass (NOT post-implementation pre-QA self-walk) · Always advisory (NOT autonomous on token-layer remaps). The pre-mockup-prose-model-first rule fired — David's session 171 close articulation IS the design; no V1 mockup phase needed.

Test case dispatched the agent against `docs/contrast-audit.md` (47 offenders across 19 files + 3 systemic recommendations from session 171 Explore agent). The agent's structured triage report surfaced **6 substantive RECs the audit had NOT caught**: (REC-1) audit was written against `v2.bg.main = #FBF6EA` but `:root` now resolves `#E6DECF` post-session-168 unification — agent computed actual WCAG ratios via Python (`v2.text.muted #A39686` on `#E6DECF` = 2.16:1, materially worse than audit-implied 2.68:1; recommends re-baseline before ARC-1 ships); (REC-2) systemic "retire v2.text.muted as text color" recommendation demoted to optional in audit's ARC-4 — agent cited `feedback_predicate_accumulating_patches_signals_wrong_shape` + `feedback_kill_bug_class_after_3_patches` + grep-verified 144 callsites / 110 legitimate non-prose consumers, recommends enforcement seam (lint script OR token split with deprecated JSDoc + successor tokens); (REC-3) "italic serif at ≤15px retire" recommendation overstates against Brand Rules editorial voice — agent cited DECISION_GATE Brand Rules row 64 + `feedback_lora_lineheight_minimum_for_clamp` ✅ Promoted (clamp-floor 1.3 NOT "retire at ≤15px"), proposes sharpened scope; (REC-4) ARC-2 `replace_all` per file risks mixed-consumer collision in 6 vendor-flow files (icon + text both using `v2.text.muted` in same file); (REC-5) "icons >14px exempt" exclusion rule predates bg-unification — at #E6DECF (2.16:1) meaningful state icons now fail WCAG 1.4.11 non-text 3:1 threshold; (REC-6) fires vendor-value gate explicitly — bundle composes onto vendor value (6 of 19 files vendor-flow surfaces) not pure shopper polish.

Trust-contract validation: every recommendation carried explicit citation (file:line / memory file with ✅ Promoted status / brand rule row / WCAG ratio computed not assumed / session number). "Outside advisory bounds — needs David's input" section surfaced 4 honest items (italic-serif scope / token-split vs lint architectural pick / audit re-run scope / 1-vs-2-session shape) — agent correctly declined to decide brand calls or cost-shape calls from operating disciplines alone. No vibes language; no per-pixel asks; structured triage shape held end-to-end. The agent works as designed.

David's pick on the 6 RECs: defer all to follow-on session. Session 172 closes as "agent + slash command + validated test case shipped; audit findings deferred." Lets David sleep on the recommendations before picking how to act (especially REC-2 lint-vs-split architectural pick + REC-3 brand-voice call).

**Subagent registration constraint surfaced as platform fact**: Claude Code reads `.claude/agents/` at session start, NOT dynamically. The freshly-shipped `design-reviewer.md` won't dispatch via `Agent({ subagent_type: "design-reviewer" })` until next session. Slash commands at `.claude/commands/` DO auto-register dynamically (confirmed via skill-listing reminder after commit 2). Workaround for same-session validation: thread agent system prompt inline via `general-purpose` dispatch with "STEP 1 — Read your agent definition" as first instruction. Captured as NEW memory file `reference_subagent_registration_session_start_only.md` for future subagent ships.

### Added

- **`.claude/agents/design-reviewer.md`** — Pre-implementation design-pass advisor for Treehouse Finds. Read-only tools (Read, Grep, Glob, Bash); no Edit/Write/NotebookEdit by design. Persona + must-cite trust contract verbatim from David session 171 close ("as long as the explanation can point to sound reasoning from a UI/UX design process I'm good with the calls you make") + acceptable citation sources enumerated (WCAG AA contrast ratios with computed ratios not asserted / Fitts's Law tap targets / scanning patterns / mobile-first density for 40-65 demographic / lattice canonical per `project_layered_engagement_share_hierarchy` / Brand Rules from `docs/DECISION_GATE.md` / digital-to-physical bridge thesis / vendor-value priority gate / project precedent from session blocks / token canonical values from `lib/tokens.ts` / operating-discipline memory files at `~/.claude/projects/.../memory/`) + structural-axes-only output format with 6 explicit ✅/❌ examples + structured triage report shape (Citation / Reasoning / Recommendation / Severity per REC + "Outside advisory bounds" + "Verified against — substrate read" sections) + 7 enumerated anti-patterns (drifting into pixel asks / recommending without citation / auto-applying changes / compromising trust contract for politeness / citing wrong source / vibes-coded language / scope drift beyond dispatch) + project-specific design disciplines composing list (11 promoted memory files the agent must cite when their domains apply).
- **`.claude/commands/design-review.md`** — Canonical dispatch wrapper for the design-reviewer subagent. Verifies target file exists; pre-loads canonical substrate (Brand Rules section + 3 project priority memories + MEMORY.md index + lib/tokens.ts head); dispatches via Agent tool with self-contained prompt threading the must-cite trust contract verbatim; relays structured triage report back without auto-applying. Embedded dispatch prompt template so future sessions get consistent scaffolding. Anti-patterns enumerated explicitly: don't skip substrate read / don't thread per-pixel asks / don't auto-apply / don't compress structured output / don't dispatch on pure-logic work.
- **`memory/reference_subagent_registration_session_start_only.md`** — NEW reference memory capturing the Claude Code platform fact: subagent registration is session-start-only; slash commands register dynamically. Includes the inline-threaded general-purpose workaround for same-session validation (the pattern that produced session 172's test-case triage report). Origin: session 172 dispatch failure ("Agent type 'design-reviewer' not found").

### iPhone QA watch-items

N/A — no runtime app changes. Test case via `/design-review docs/contrast-audit.md` next session validates the subagent registration path end-to-end (~5 min sanity check at session 173 open).

[v0.172.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.172.0

---

## [v0.171.0] — 2026-05-17

### Session 171 — iPhone QA dial bundle ×2 + wordmark swap ×2 + contrast audit (Audit B) + vendor-value priority gate memory + Shape A gameplan locked

14 runtime commits + 1 close. David opened with `/session-open`; standup recommended iPhone QA on production v0.170.0. David redirected with **6-item iPhone QA finding bundle on session 170 Shape B re-architecture**: (1) restore Flag the Find button under Price (reverses session 170 Arc 3 retirement on dual-affordance model), (2) tint embedded map snapshot toward cartographic cream palette, (3) increase "Purchase this item at" eyebrow weight, (4) darker mall name color, (5) booth name weight bump, (6) bold variant of booth icon project-wide. Triage cost shape A (6 commits sequenced smallest→largest); 2 load-bearing clarifications via AskUserQuestion (save model dual vs single; map palette CSS-filter vs container-bg vs Mapbox-Studio). Bundle shipped clean; David: "clean."

Pivoted to wordmark swap (`treehouse_updated.png` → overwrites `wordmark.png`); David then re-swapped with cropped version (`treehouse_wordmark.png`) when first version rendered ~10% narrower than original at established display heights. Both swaps optimized via pngquant (176KB → 40KB / 173KB → 41KB, ~77% reductions matching session 104 + 164 brand-asset-optimization precedent).

Second iPhone QA round surfaced **5 new findings + launch-blocking contrast audit ask**: (1) BoothHero hero image flickers on /shelf load — paint in if possible, (2) /shelf scroll-restore should activate only on back-nav not forward-from-/find, (3) bold variant of bookmark icon, (4) reduce mall-name-to-address gap in MallBlock, (5) darker color for "A curated booth by" + **"We need to do a full audit on contrast and legibility for this to launch"**. Per `feedback_recurring_phrase_signals_system` ✅ Promoted, item 5's "this continues to be hard to read" + "I see this also on other pages" + explicit launch-blocker framing = system-level concern. Triage cost shape Audit B (Explore-agent scan → prioritized offender doc) picked over Audit A (defer) and Audit C (lint:contrast script).

Explore agent dispatched in **background parallel** with foreground dial-bundle shipping (first firing of this parallelism pattern — async agent did read-only audit while 5 commits + audit-doc commit shipped in foreground). Audit produced 47 offenders across 19 files (16 Tier 1 critical small italic on secondary/muted; 18 Tier 2 high small upright on muted; 9 Tier 3 borderline; 4 bonus dotted-underline pattern; systemic recommendation to retire `v2.text.muted` as a text-color token entirely).

David's **meta-reflection** at session close: "for about the last 30 sessions I've been what I'd consider 'pixel prompting'... I want to create a team who are experts in UI/UX design and helps make the right decisions together without a lot of my input." Surfaced 3 strategic concerns (map nav topology / found-state ephemerality + onboarding gap / color consolidation 100-shades-of-green) + vendor-value priority concern (paid users are vendors; prioritize vendor-experience + vendor-promotion features over shopper polish). Restated interpretation; proposed gameplan Shape A (4 moves: design-reviewer agent + launch-gaps doc + strategic-vs-tactical session split + color consolidation arc). David picked **Shape A** with the load-bearing trust contract: *"as long as the explanation can point to sound reasoning from a UI/UX design process I'm good with the calls you make."* Vendor-value priority captured as project memory file [`project_vendor_value_first_prioritization.md`](memory/project_vendor_value_first_prioritization.md) — now auto-loaded into every future session-opening standup.

### Added

- **`components/DestinationHero.tsx`** dial bundle — `fontWeight: 600` on eyebrow (C1), `color: v2.text.secondary` on mall subtitle both rendering paths (C2), `fontWeight: 600` on vendor name (C3), CSS `filter: "sepia(0.4) saturate(1.1) hue-rotate(-8deg)"` on Mapbox static snapshot to push light-v11 toward cartographic warm-cream (C4 — Cost-shape A per David's Q2 pick over container-bg + Mapbox Studio paths).
- **Flag the Find button under Price on `/find/[id]`** — full-width primary CTA restoring session-169 round-2 button as DUAL AFFORDANCE with photograph corner save bubble (bounded surface-locked reversal of session 170 Arc 3 thesis "the corner bubble IS the page's primary CTA"). Both affordances toggle same `isSaved` state via React reactivity. Visual: v2.accent.greenMid bg + cream text + outline FlagGlyph (unsaved) → v2.surface.input bg + greenMid text + filled FlagGlyph + 1px border (saved). Padding 10/9 keeps height constant across border toggle. Explore Booth from the prior pair does NOT return per David's singular ask.
- **`docs/contrast-audit.md`** — Audit B deliverable; 47 prioritized offenders across 19 files with file:line + element + font + size + current-token → suggested-mapping. Tier 1 (16 critical) / Tier 2 (18 high) / Tier 3 (9 borderline) / Bonus (4 dotted-underline). Systemic recommendations: retire `v2.text.muted` as text color (preserve for icons + dividers + placeholders); italic serif at ≤15px on warm-cream fails 40-65 demographic (session 46 IM Fell precedent extends to Cormorant + Lora); retire dotted-underline pattern for body text. Recommended fix-bundle sequencing: 4 arcs (Tier 1 ship / Tier 2 sweep / Bonus retire / optional token enforcement). Input for follow-on fix-bundle session.
- **`memory/project_vendor_value_first_prioritization.md`** — NEW project memory capturing David's vendor-value priority gate articulated at session close. Auto-loaded into every future session; runs at session-opening standup as "Does this add vendor value or assist vendors in promoting to shoppers? If not, can it be deferred?" Pairs with `project_treehouse_thesis_digital_to_physical_bridge` + `project_layered_engagement_share_hierarchy`. Includes explicit vendor-value candidate backlog (Share My Shelf revival / vendor profile enrichment / Stripe integration / Analytics+KPIs / vendor onboarding).
- **Global `popstate` listener** installed once-per-tab via module-scope `installPopstateMarker()` on `/shelf/[slug]` mount. Writes `Date.now()` to `sessionStorage` key `th_recent_popstate` on real popstate events (Next.js internal pushState doesn't fire native popstate per `feedback_nextjs_internal_history_calls_clobber_flags` ✅ Promoted). Listener persists across route changes (deliberately not cleaned up — global session-state writer, not per-component state).
- **HTML5 paint-in hints on `<BoothHero>` `<img>`** — `fetchPriority="high"` + `decoding="async"` + browser-cache preloader via `new Image().src = heroImageUrl` in dedicated useEffect once URL is known. Two-layer paint-in: warm-nav re-mounts paint from HTTP cache instantly; cold-start gets ~30-50% faster paint via fetch-priority hint. Closes visible flicker on `/shelf` cold load.

### Changed

- **Wordmark asset `/public/wordmark.png`** swapped twice in same session — first to `treehouse_updated.png` (1211×721, 1.679:1 aspect, ~10% narrower than original script wordmark), then re-swapped to cropped `treehouse_wordmark.png` (1092×601, 1.817:1 aspect, ~3% narrower — much closer to original footprint). Visual identity shift: refined serif Roman "treehouse" + small-caps "FINDS" with hairline rules + sapling glyph above (vs prior script-italic "treehouse" + leaf-on-stem). URL contract `/wordmark.png` preserved so all 5 runtime consumers + email pipeline + 13 mockup/doc references inherit automatically. Final size: 107KB → 41KB (~62% reduction across both swaps via pngquant per session 104 + 164 brand-asset-optimization precedent).
- **`PiStorefront` → `PiStorefrontBold` sweep** across 4 surfaces: BottomNav (Booth tab role-conditional, size 22) · DestinationHero (eyebrow above destination card, size 18) · `/login` (vendor sign-in action card, size 20) · `v2/AccordionBoothSection` (Saved page accordion booth header, size 22). Mirrors session 169 PiLeaf → PiLeafBold project-wide sweep. 2 doc-rot comments updated in same commit per `feedback_dead_code_cleanup_as_byproduct`; 1 historical-retirement comment intentionally preserved at `app/find/[id]/page.tsx:69` for greppability.
- **`PiBookmarkSimple` → `PiBookmarkSimpleBold` sweep** across 2 surfaces: `BookmarkBoothBubble` (BoothHero photo top-right bookmark bubble, size 22) · `/shelf/[slug]` (admin-only inline "Bookmark Booth" button, size 14). All 3 engagement-tier bubbles now render at Bold weight when unsaved (FlagGlyph PiLeafBold + BookmarkBoothBubble PiBookmarkSimpleBold + StarFavoriteBubble PiStar) — visual lattice cohesion across find/booth/mall tiers per `project_layered_engagement_share_hierarchy`.
- **`/shelf/[slug]` scroll-restore** gated on real popstate via the new `th_recent_popstate` sessionStorage marker. Within 1000ms window of marker timestamp = back-nav → restore `pendingScrollY`; outside window OR no marker (forward-nav / fresh deep-link / hard refresh) → `scrollTo(0, 0)`. Marker consumed after read so sibling pages don't reuse same back-nav signal. Closes the "/shelf doesn't load from top when navigating forward from /find" bug class.
- **`BoothPage` `<MallBlock>` mall name `lineHeight`**: `1.3` → `1.15`. Tightens half-leading sum from ~6.3px to ~4.9px visual gap (~22% reduction) between mall name and address. Continues session 153 R10A tightening to the previously-unaddressed half-leading layer. Single-line text (not clamped) so `feedback_lora_lineheight_minimum_for_clamp` doesn't apply.
- **`BoothPage` "A curated booth by" eyebrow color**: `v2.text.secondary` → `v2.text.primary` (the audit's canonical Tier 1 example). Single instance fix; remaining 46 offenders carry as fix-bundle session candidates via `docs/contrast-audit.md`.

### Fixed

- **`BoothHero` hero image flicker on `/shelf` load** via preloader + fetchPriority + decoding hints (see Added).
- **`/shelf` scroll position restoring on forward-nav** via popstate-gated restore (see Changed).
- **`package-lock.json` drift** swept clean alongside close (was modified by mid-session `npm install` to resolve `html2canvas-pro` pre-existing local-env miss per `feedback_pre_existing_local_env_build_failure_at_boundary_gate` ✅ Promoted — 11th cumulative firing).

### iPhone QA watch-items

**Bundle 1 (6 commits, dial-class):**
- "Purchase this item at" + vendor name read at proper weight without overshoot; if Cormorant 600 feels heavy, dial to 500
- Mall subtitle reads at secondary not muted; if still quiet, bump to primary
- Map snapshot tints toward warm cream not muddy brown; dial-up sepia(0.55) saturate(1.2) if still grey; dial-down sepia(0.3) drop hue-rotate if too brown
- PiStorefrontBold reads cohesive with PiLeafBold on BottomNav + DestinationHero
- Flag the Find button under Price + photograph save bubble both toggle same state on tap (either affordance, immediate reflection)

**Bundle 2 (6 commits, dial-class + audit doc):**
- MallBlock spacing on /shelf + /my-shelf reads as tightly-coupled lockup; dial address lineHeight 1.55 → 1.3 if still too loose
- "A curated booth by" reads cleanly at primary color
- BookmarkBoothBubble bolder + cohesive with PiLeafBold + PiStorefrontBold lattice siblings
- BoothHero cold-cache walk on cellular — does hero paint with first frame or still flicker?
- /shelf scroll-restore matrix: back from /find restores ✓ · forward from /find lands at top ✓ · deep-link lands at top ✓ · hard refresh lands at top ✓
- PWA wordmark cache — hard-refresh iPhone PWA if old wordmark persists

**Wordmark swap:**
- Aspect ratio 1.875:1 → 1.817:1 (final cropped version) means ~3% narrower at same display height. Watch surfaces sized by height for any "too small" feel; per-callsite height/width prop dial is clean follow-on if needed.

### Mapbox preview-token gap (17-session carry, 156→171)

Production-PWA QA remains authoritative for map-snapshot consumers (DestinationHero map snapshot silently fails on `*.vercel.app` previews per Mapbox token URL allowlist excluding `*` wildcards). ~15 min HITL to provision preview-only token + set `NEXT_PUBLIC_MAPBOX_TOKEN` for Preview Vercel env.

[v0.171.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.171.0

---

## [v0.170.0] — 2026-05-17

### Session 170 — /find/[id] destination hero design-pass + 4-arc Shape B ship

5 runtime commits + 1 close. David opened with a design ask on `/find/[id]` surfacing 4 concerns: (1) save/unsave CTA visually identical to secondary Explore Booth button, (2) "Purchase this item at" eyebrow reads weak vs dominant title + price, (3) mall + booth + map should be one component (secondary hero), (4) page reads as stacked add-ons not cohesive composition. Audit-first read confirmed: items 1–3 are direct consequences of session 169 round 2's additive ship (CTA pair + standalone map snapshot landed as separate refinements). Item 4 is the synthesis question once they stack. Cost-shape triage A/B/C surfaced 3 plausible scopes; David picked **Shape B — re-architect destination as secondary hero**. 3 prose Qs before V1 + 1 prose Q on save bubble weight locked all structural decisions except the destination hero's surface identity. V1 mockup at `docs/mockups/find-destination-hero-v1.html` spanned 3 frames (Anchored card / Distinctive secondary hero / Map-led composition) — David picked **Frame C**. 4 prose Qs on fill-refinement (eyebrow placement / map aspect / card lift / tap surface model) — all recommended picks (clean design pass; no V2 mockup needed). 23 frozen decisions D1–D23 + component contract + 7 Tier B items + 6-item risk register + 4-arc implementation sequencing locked at `docs/find-destination-hero-design.md`. Implementation shipped clean against the locked record (28th cumulative firing of `feedback_design_record_as_execution_spec` ✅ Promoted across 28+ different features — load-bearing operating mode validated yet again).

**Page composition collapses 7 stacked sections → 3 anchors**: Photo hero (with PiLeaf save bubble top-right — primary CTA, lattice canonical 44×44, already on photograph since session 97) → Title + Price (unchanged) → DestinationHero (informational only — eyebrow + mall/booth + tappable map) → page ends. CTA pair retires (Explore Booth + Flag the Find both delete; booth navigation covered by DestinationHero's tappable vendor/booth strip → /shelf/[slug]); "More from this booth" carousel + ShelfSection retire entirely.

### Added
- **`components/DestinationHero.tsx`** — Frame C map-led composition primitive (~275 LOC). Map snapshot fills 16:9 at top of card; mall + booth info as info strip below; eyebrow "Purchase this item at" floats outside above the card. Props: `mallName/City/State/Lat/Lng/Slug` + `vendorName/Slug` + `boothNumber` + `mapLink` (all nullable, defensive throughout). Three independent tap targets per D15: map → `/map?mall=<slug>`; mall subtitle text → Apple Maps via `mapLink` (stopPropagation); vendor + booth strip → `/shelf/[vendorSlug]`. Defensive fallbacks (D17–D20): missing mall coords → map omits + card collapses to info strip; missing vendorSlug → strip renders without Link; missing mapLink → subtitle as plain text; map `onError` → `<img>` hides + Link wrapper stays (Mapbox preview-deployment silent fail per session 156 token allowlist 15-session carry).
- **23-decision design record** at `docs/find-destination-hero-design.md` — D1 page composition / D2 carousel retires / D3 CTA pair retires / D4–D6 save bubble (lattice canonical 44×44 with FlagGlyph weight toggle) / D7–D10 DestinationHero structural shape (16:9 map at top, 2-column info strip below) / D11–D12 eyebrow outside above card / D13–D14 card visual (v2.surface.card + 1px v2.border.light + radius 12 + subtle shadow) / D15–D16 three independent tap targets with stopPropagation / D17–D20 defensive fallbacks / D21–D23 page-level (bg unchanged, title block unchanged, page ends after DestinationHero).
- **V1 mockup** at `docs/mockups/find-destination-hero-v1.html` — 3 frames spanning destination-hero surface identity (Anchored card / Distinctive secondary hero / Map-led) with full page composition each + 7-axis trade-off matrix.

### Changed
- **/find/[id] page composition** — collapses from 7 stacked sections to 3 anchors per Shape B Frame C re-architecture. Inline cartographic block (eyebrow + cardInner IIFE + standalone map snapshot Link) replaced by single `<DestinationHero>` call.

### Removed
- **CTA pair under price retires entirely** — Explore Booth (secondary outlined green-on-cream) + Flag the Find / Remove Flag (primary filled green with saved-state color flip) both delete. Save covered by existing photograph corner bubble (lattice canonical, since session 97). Booth navigation covered by DestinationHero's tappable vendor/booth strip. Surface-locked design reversal of session 169 round 2's "two butts under the price" decision per `feedback_surface_locked_design_reversals` — same product need (primary CTA + secondary booth nav) solved structurally instead of as a button pair.
- **"More from this booth" carousel + `<ShelfSection>` function definition retires** — David's session-170 Q2 pick: "Retire entirely". Booth navigation covered by DestinationHero strip + carousel-isolated state (allItems, ready, stripRef, stripPendingX, stripRestored, findStripScrollKey, handleCarouselTap with writeFindContext swipe-context handoff) all retire as scope-adjacent dead code byproducts per `feedback_dead_code_cleanup_as_byproduct`.
- **Inline cartographic block** (~260 LOC of eyebrow row + cardInner IIFE + standalone map snapshot Link) — all 3 parts collapse into `<DestinationHero>` per single-coupled-commit (3 inline parts must move together). Surface-locked design reversal of session 169 round 2's standalone map snapshot placement — same Mapbox asset + same tap target (/map?mall=), just restructured into the card per Frame C.
- **Page-level dead-code byproducts retire alongside ShelfSection**: `useCallback` import (only consumer was handleShelfReady) · `getVendorPosts` from "@/lib/posts" (only consumer was carousel fetch) · `getVendorPostsCache, setVendorPostsCache, writeFindContext, FindRef` from "@/lib/findContext" (all 4 consumed only inside ShelfSection) · `HomeFeedTile` import (only consumer was per-tile render) · `findStripScrollKey` module helper (only consumer was carousel horizontal scroll-restore) · `shelfReady` useState + `setShelfReady` calls + Phase C QA fix #3 reset hook · `setShelfHasItems` useState (dead destructure half) · `handleShelfReady` useCallback · `shelfReady` gate in scroll-restore useLayoutEffect + `shelfReady` from deps array (document height now stabilizes after `setLoading(false)` without async-fetch growth; staircase retry 100/300/600ms preserved as safety net).
- **`mallSnapshotUrl` direct import on /find/[id]/page.tsx** — only consumer was the inline map snapshot; DestinationHero owns it now.
- **`PiStorefront` direct import on /find/[id]/page.tsx** — only consumers were Explore Booth button (Arc 3) + inline cartographic eyebrow (Arc 2); both retired.

### Fixed
- **Resolved pre-existing local-env build failure** on parked `html2canvas-pro` module (`components/ShelfImageShareScreen.tsx`) via `npm install` at Arc 1 commit-boundary tsc gate. **10th cumulative firing of `feedback_pre_existing_local_env_build_failure_at_boundary_gate`** ✅ Promoted at session 161 close — memory file from 9 sessions ago saved time today (resolution shape pre-specified the fix: `npm install` not regression hunt).

### iPhone QA watch-items

- `/find/[id]` cold-start composition reads cohesive (3 anchors, not 7 stacked sections); destination hero reads as the "where you go" anchor
- Save bubble on photograph top-right toggles PiLeaf ↔ PiLeafFill on tap; saved-state color flips to v1.green
- DestinationHero map snapshot renders on production-PWA (preview likely silent-fails per session 156 Mapbox token URL allowlist 15-session carry)
- Map snapshot tap routes to `/map?mall=<slug>`; mall map auto-flies to the correct mall scope
- Mall subtitle dotted-underline tap opens Apple Maps deep-link (native maps app, not in-app /map)
- Vendor + booth strip tap routes to `/shelf/[vendorSlug]`
- No CTA buttons under price (entire row retired); no "More from this booth" carousel (entire section retired)
- Back-nav scroll-restore still works after `shelfReady` gate retirement (staircase 100/300/600ms preserved as safety net)
- Photograph + post-it stamp + share airplane bubble + save bubble all render in their canonical session-97/159/169 positions

[v0.170.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.170.0

---

## [v0.169.0] — 2026-05-16

### Session 169 — Review Board walk #3 — 4 iPhone-QA-driven dial rounds across single session

17 runtime commits + 1 close. **New record for single-session refinement chain depth** — extends session 168's 9-rounds-within-one-push-cycle to **4 separate push cycles + iPhone-QA-on-Vercel-preview rounds + dial cycles inside one session**. David's Review Board feedback paste opened the session (8 findings across 6 surfaces); each round shipped + pushed + David QA'd on Vercel preview + surfaced next-round findings = 21 distinct findings acknowledged + closed across 4 rounds. Round 3 unification lock (back-button + profile bubble = v1.iconBubble) conflicted with Round 4 visibility ask (bubble invisible on dark hero photo overlay); design tension resolved cleanly via `variant` prop on shared primitive that preserves the consistency lock as default + restores context-aware visual as the overlay variant. The "ship → push → iPhone QA on Vercel preview → next round" cadence at production-preview velocity compresses dramatically (each round shipped + validated in under 30 min of dial time) without compromising commit hygiene or design-tension surfacing.

### Added
- **`lib/mapStaticImage.ts`** — Mapbox Static Images URL composer primitive. Pure-string helper composing `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+{green}({lng},{lat})/{lng},{lat},{zoom}/{w}x{h}@2x?access_token=...`. Reusable for any future thumbnail-map use case. Returns "" when token absent for graceful fallback. File-top captures the session-156 token URL allowlist gap (preview deployments fail tile fetches silently; production-PWA is authoritative QA).
- **/find/[id] CTA pair side-by-side** — Explore Booth (secondary outlined green-on-cream + PiStorefront glyph, Links to /shelf/[vendorSlug]) on left + Flag the Find (primary filled green) on right. Replaces session-157 single full-width Save-the-Find button per David's session-169-Round-2 design ask.
- **/find/[id] tappable map snapshot** — Mapbox static image (aspectRatio 2.5/1) under the mall/booth card, wrapped in Link to /map?mall=<slug> for spatial-wayfinding tap target. `<img onError>` graceful-hide for preview deployments where token URL allowlist excludes *.vercel.app.
- **/my-shelf "Add a Find" primary CTA** — full-width green button above WindowView (replacing DiamondDivider) with PiCamera glyph. Mirrors /shelf/[slug] Bookmark Booth shape from Round 1; promotes vendor-self primary action from grid-cell dashed tile to primary affordance above the grid.
- **Floating back button on /flagged** — TabsChrome extends drawer-back overlay condition to also render on /flagged (routes to / via fallback). Symmetric to Profile overlay at top-right.
- **`StickyMasthead` optional `bg?: string` prop** — default v2.bg.main backward-compat for all non-passing consumers; /find/[id] + /shelf/[slug] + /my-shelf pass `bg={v2.surface.warm}` so masthead chrome + page bg read continuous on those 3 pages.
- **`MastheadBackButton` + `MastheadProfileButton` `variant?: "default" | "overlay"` prop** — default = v1.iconBubble (Round 3 unification lock for masthead-slot consistency). "overlay" = solid v2.surface.warm + 1px v2.border.light border (pre-Round-3 visual restored as overlay-only contract for floating-overlay context over dark hero photo).
- **Mall lat/lng + slug revived on /find/[id] page state** — retired session 157 alongside LocationActions render; SELECT-side enrichment on lib/posts.ts kept them flowing through unchanged. Revived for map snapshot consumer + Explore Booth Link href.

### Changed
- **System-wide page bg flip on /find/[id] + /shelf/[slug] + /my-shelf**: `v2.bg.main` (#E6DECF) → `v2.surface.warm` (#FBF6EA). Reads as "you've entered a specific physical place" warmer chrome vs (tabs)/ Explore/Saved/Booth-nav default.
- **Back-button + profile-icon system-wide unification → `v1.iconBubble`** — `MastheadBackButton` + `MastheadProfileButton` primitives flipped (v2.surface.warm + border → v1.iconBubble + no border). Inline back-button sweep on 10 v2 user-facing surfaces (login + login/email/handle + post/tag + post/preview + vendor-request + setup + welcome + me + find/[id]/edit + my-shelf local Masthead). Login Help icon also flipped for masthead cohesion. /shelf/[slug] + /contact + /admin/login skipped (already on v1.iconBubble inline). Matches /find/[id]'s IconBubble reference exactly.
- **PiLeaf → PiLeafBold system-wide sweep** — FlagGlyph default `weight` "regular" → "bold" + 8 direct callsites (PiLeafIcon wrapper + HomeFeedTile + SavedFindRow + SavedMallCardV2 + BottomNav + my-shelf empty state + TreehouseMap LeafBubblePin + ShareSheet footer disclaimer). Closes session-97 project-wide bold-retire reversal arc (97 retire → 160 bounded local revival → 169 full canonical promotion).
- **"Take Trip" → "Take the Trip" vocabulary unification** — system sweep across LocationActions.tsx:109 + SavedMallCardV2.tsx:203 + 3 scope-adjacent doc updates. All 4 consumers (LocationActions on /find + /shelf + /map's PinCallout + SavedMallCardV2 on Saved) read identically post-sweep.
- **/find/[id] "Save the Find" / "Saved" CTA copy → "Flag the Find" / "Remove Flag"** — saved-state moves from passive past-tense to explicit-intent verb. ARIA labels updated. Internal `handleToggleSave` + `shopper_saves` DB column + `find_saved` / `find_unsaved` events preserved per `feedback_user_facing_copy_scrub_skip_db_identifiers`.
- **SearchBar typed-text + placeholder color** — `v1.inkPrimary` (#2B211A) → `v2.text.muted` (#A39686). Paired `::placeholder` rule pinned to same hex.
- **BoothTitleBlock top padding** — 36 → 16 (canonical space.s16). Shared primitive; both consumer Skeleton blocks updated in same commit to avoid skeleton-to-real-content jolt.
- **Login content positioning** — `justifyContent: "center"` → `flex-start` + explicit `paddingTop: 24`. Wordmark + form anchored near header.
- **/post/tag layout** — Find + Tag stack vertically + centered at 58% width (was 2-col side-by-side per session 94 D7-2e).
- **/shelf/[slug] Bookmark Booth button placement** — above WindowView (replacing DiamondDivider), not below BoothCloser (session 157 placement).
- **/find/[id] eyebrows** — "Purchase this item at" + PiStorefront glyph 16→18; "More from this booth…" + sibling "Visit Booth →" link 16→18; "More from this booth…" color v2.text.muted → v2.text.secondary for cross-eyebrow consistency.
- **Login subtext readability** — wordmark sub 16→18 + "We'll email you..." 12→14; post/preview subtitle 14→16.

### Removed
- **/find/[id] "Visit Booth →" link** above "More from this booth" header (session 157 Find #6 placement) — round-2 Explore Booth secondary CTA carries booth-navigation now. ChevronRight import dropped (only consumer).
- **/shelf/[slug] + /my-shelf `DiamondDivider` imports** — primitive still exported from components/BoothPage.tsx for any future consumer.
- **/my-shelf WindowView `showAddTile` + `onAddClick` prop wiring** — dashed AddFindTile inside grid retires; promotes to primary CTA above grid.
- **"Take Trip" copy** — system-wide rename to "Take the Trip" across 4 LocationActions consumers + SavedMallCardV2.
- **PiLeaf Regular weight as default** — system-wide flip to PiLeafBold across 9 consumer sites + FlagGlyph default. PiLeafFill (saved/active states) unchanged.

### iPhone QA watch-items
- /find/[id] + /shelf/[slug] + /my-shelf page bg #FBF6EA reads right vs (tabs)/ default #E6DECF.
- v1.postit #fbf3df stamp on #FBF6EA — barely-distinguishable; small dial may be needed if it reads as merging.
- variant="overlay" Profile + Back bubbles render with proper contrast on TabsChrome over HomeHero hero photo (dark woodgrain corner).
- Floating back button on /flagged routes to / cleanly via BottomNav nav from Explore.
- PiLeafBold weight reads as intended across 9 sweep sites.
- /find/[id] CTA pair (Explore Booth left secondary + Flag the Find right primary) reads as dual hierarchy.
- Mapbox static map snapshot renders on production-PWA (preview likely silently failed per session 156 token URL allowlist 15-session carry).
- "Take the Trip" + "Flag the Find" + "Remove Flag" copy reads as clear action-intent vocabulary across all consumers.
- Masthead-page-bg continuity via new `bg` prop (no visible seam on /find /shelf /my-shelf).

[v0.169.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.169.0

---

## [v0.168.0] — 2026-05-16

### Session 168 — Foundation unification (greens + inks + bg) + BottomNav pill restructure + 9 iPhone-QA-driven dial rounds

16 runtime commits + 1 close. The longest single-session refinement chain on record — David's foundation-color-unification ask opened the session; 9 rounds of iPhone-QA-driven dial cycles compounded across the day. Foundation greens + inks consolidated to canonical values via Shape A token-value collapse (zero consumer code changes). BottomNav pill restructured to canonical single-pill computed-position pattern after 2 layoutId-pattern patches failed (per `feedback_kill_bug_class_after_3_patches`). Masthead paddingBottom dialed 12 → 0 → 8 via convergence-via-iteration (shipping endpoints faster than guessing the middle). Background unified system-wide to v2.bg.tabs canonical (#E6DECF) across ~37 v2 surfaces + masthead + body + Mapbox cartographic land base.

### Added
- **Memory file [`feedback_module_scope_cache_for_warm_nav_hydration.md`](memory/feedback_module_scope_cache_for_warm_nav_hydration.md)** — promoted at 4 firings in single session. When an async-state hook (auth / role / vendor / posts) starts at INITIAL_STATE on every mount and flashes guest/loading chrome before settling, add module-scope cache so warm-nav re-mounts hydrate synchronously. Sub-pattern of `feedback_synthesize_existing_row_to_reuse_flow_infra` extended from row-level to state-level synthesis. 4 canonical implementations this session: cachedAuthUser (app/my-shelf/page.tsx), cachedRoleState (lib/useUserRole.ts), cachedShopperAuthState (lib/useShopperAuth.ts), cachedVendorBundle (app/my-shelf/page.tsx).
- **MEMORY.md index** updated with new entry.
- **BottomNav canonical single-pill primitive** — sliding indicator pattern used by Material Design tabs / Vercel docs nav / Linear view switcher. `tabRefs` + `pillGeom` useState + useLayoutEffect re-measure + window-resize listener + `pointerEvents:none`. Replaces 2-rounds-of-failed-patches layoutId approach.
- **TabsChrome auto-close-drawer-on-nav-away rule** — `useEffect` watching `pathname !== "/"` calls `closeDrawer()`. Lives in TabsChrome (Home-chrome contract) not in MapDrawerProvider itself (preserves future cross-surface use cases).
- **BottomNav scroll-storage clearing on Booth tap** — surgical fix so `/my-shelf` lands at scroll=0 on tab nav (preserves /find/[id] back-nav scroll restoration intent from sessions 85+86).
- **SavedEmptyState `<MdOutlineExplore>` icon** — mirrors BottomNav Explore-tab vocabulary so empty-state CTA reads as direct shortcut to that tab.

### Changed
- **`v2.accent.green` `#285C3C` → `#1F4A31`** — collapsed to canonical (matches David's preferred greenDark). 77 consumer surfaces inherit via CSS var.
- **`v2.accent.greenMid` `#3E694F` → `#1F4A31`** — also canonical. Was misclassified at round 1 as "intentional toggle variant"; iPhone QA audit revealed canonical CTA fill across 5 surfaces (all 3 lattice tiers). Saved-state hierarchy preserved by bg-to-cream flip pattern.
- **`v1.green` + `colors.green` `#1e4d2b` → `#1F4A31`** — same canonical (~86 consumers across v1 + v0.2 inherit).
- **6 rgba green derivations updated** to new (31,74,49) source RGB (shadow CTAs, disabled state, v0.2 light/solid/border).
- **`v1.ink-*` + `colors.text-*` ink scale → matching `v2.text.*` canonical values** — v1.inkPrimary `#2a1a0a` → `#2B211A`, v1.inkMid `#4a3520` → `#5C5246`, v1.inkMuted `#6b5538` → `#A39686`, v1.inkFaint `rgba(42,26,10,0.28)` → solid `#A39686`. Same flip for v0.2 textPrimary/Mid/Muted/Faint.
- **`v2.bg.main` `#F7F3EB` → `#E6DECF`** — unifies all v2 surfaces + StickyMasthead chrome with v2.bg.tabs canonical. Body bg (globals.css + layout.tsx inline-style pairing) + Mapbox `--th-v1-basemap-cream` follow.
- **StickyMasthead `paddingBottom: 12 → 0 → 8`** + MASTHEAD_HEIGHT calc `safe+84 → safe+72 → safe+80` (coupled with paddingBottom; spacer must match paint height). Convergence-via-iteration: 12 too gappy, 0 too tight, 8 (canonical space.s8) just right.
- **BottomNav structure** — pill moved from per-tab layoutId target to nav-level single absolute element with `getBoundingClientRect`-driven `x` + `width`. `overflow:hidden` retired (no longer needed; also unclips Saved badge). +114 / −77 LOC.
- **CLAUDE.md** rotated: session 168 = new full block at top, session 167 demoted to mini-block tombstone.
- **package.json** version `0.167.1` → `0.168.0`.
- **/review-board style guide** — `<GreenDriftCallout>` body flipped from "drift exists; pick your tier" → "drift resolved; v2.accent.greenDark preferred for new work." Green section reorganized canonical-first. Ink section restructured to canonical 3-step + hairline. v2.bg.main swatch hex + notes updated to "Unified v2 body + page + masthead chrome."

### Removed
- **layoutId-pill pattern on BottomNav** — replaced by canonical single-pill primitive. Patches at rounds 3-4 (initial=false + overflow:hidden + tween + layout=position) didn't fully constrain; kill-the-bug-class restructure shipped at round 5.
- **`overflow: hidden` on BottomNav `<nav>`** — no longer needed structurally; also unclips the Saved-tab badge that sits at `right: -2` on the icon row.
- **12px masthead `paddingBottom` slab** — set when masthead carried a hairline borderBottom (retired session 156). Border gone → slab persisted without semantic purpose. Now 8 (canonical space.s8 — clear breath without slab feel).
- **`<motion.div initial={...}>` default mount animation on BottomNav pill** — `initial={false}` added at round 3 (subsequently moot after round 5 restructure but kept as defensive default on the canonical pattern).

### iPhone QA watch-items
- /find/[id] post-it stamp contrast against warmer #E6DECF bg (v1.postit #fefae8 unchanged; verify still reads).
- /shelf/[slug] BoothHero composition + post-it readability.
- Form-page bg on /me + /login + /vendor-request + /welcome (warmer cream now).
- Mapbox land base on /map (basemap.cream follows so land + chrome continuous).
- /admin UNCHANGED on purpose (v0.2 namespace); verify no accidental drift.
- BottomNav canonical pill slides cleanly L↔R between Explore/Saved/Booth (vendor) — no corner artifact, contained in nav at all times.
- Masthead 8px breathing room reads right.
- Module-scope cache flash-suppression: tap Booth from another tab as vendor → Masthead + BoothHero + title + mall all paint in one frame, no skeleton flash.
- Inline-hex consumer drift: ~14 inline `#1e4d2b` + 2 `#285C3C` + 19 rgba(30,77,43,*) + 2 rgba(40,92,60,*) still on old hex; mostly low-visibility shadows/glows + admin event-color tags + email CTAs + brand themeColor meta + isSaved heart + BottomNav internal const + 2 style-guide swatches.

[v0.168.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.168.0

---

## [v0.167.1] — 2026-05-16

### Session 167 close — docs, memory, chrome-arc archive context

Closing-ceremony patch on v0.167.0. No user-visible runtime changes. Captures the session's operational learnings + rotates session blocks per the standard close protocol. The session's two meaningful operational ships are already in production:
- **v0.167.0** — Shape A versioning infrastructure (CHANGELOG.md + per-session bump + annotated tags wired into /session-close)
- **Worktree cleanup** — 48 → 5 worktrees + 52 → 3 local claude/* branches retired (operational hygiene; not a code change)

#### Added
- **Memory file `feedback_pre_mockup_prose_model_first.md`** — promoted at first firing. When user has a clear picture in their head, the prose IS the design — skip V1 mockup phase + implement directly. Reserves mockup-first design passes for genuinely-unclear-shape asks. 22-variable budget rule + "too many variables / cancel this" signal handling. Sub-pattern of `feedback_reference_first_when_concept_unclear.md`. First firing was this session (22-variable design pass cancelled → user prose model gave cleaner direction in 2 sentences).
- **MEMORY.md index** updated with new entry.

#### Changed
- **CLAUDE.md** rotated: session 167 = new full block at top, session 166 demoted from full block to mini-block tombstone, session 160 mini-block rotated off entirely (referenced in git history).
- **package.json** version `0.167.0` → `0.167.1`.

#### Archived (not deleted)
- **Chrome-unification work** at [`archive/chrome-unification-v1`](https://github.com/Zen-Forged/treehouse-treasure-search/tree/archive/chrome-unification-v1) on origin. 6 commits including design record (`docs/chrome-unification-design.md`), V1+V2 mockups, BG.png + treehouse_transparent.png assets, full primitive code rewrite (HomeHero / StickyMasthead / MallPickerChip / MallMapDrawer / TabsChrome / lib/chromeTokens.ts). Preserved for future revival; not promoted to production this session per David's "iterate from production baseline" call.

#### Patterns observed (Tech Rule candidates — promote on second firing)
- **Cost-shape triage at META level for tooling/process asks** — David's "how do I version" question → 4 cost shapes (A/B/C/D) surfaced before any implementation. Sub-pattern of `feedback_triage_cost_shape_before_design_pass.md` ✅ Promoted extended from design asks to tooling/process asks.
- **Archive-then-fresh-branch flow for cancelled exploration** — when a multi-commit exploration ends with "don't merge this, iterate from production," canonical move: push HEAD to `archive/*` ref on origin → delete original `claude/*` ref on origin → cherry-pick keepers (e.g., versioning infra) to fresh branch off main → ship fresh branch. Preserves work without polluting main + makes future revival a `git checkout archive/*` away.
- **Worktree cleanup as scope-adjacent operational hygiene** — `gh pr list --state merged --base main` + worktree-list-porcelain + per-branch lookup loop retired 43 of 46 merged worktrees in single pass. Pattern: cleanup is cheap when scoped to `--state merged` (safe by definition) + per-branch worktree-path lookup; the 3 unmerged worktrees flagged for user-discretion.

[v0.167.1]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.1

---

## [v0.167.0] — 2026-05-16

### Versioning infrastructure — Shape A (annotated tags + CHANGELOG)

Mid-session David asked "how do I start controlling versioning better." Cost-shape triage surfaced 4 shapes (A tags+CHANGELOG / B + GitHub Releases / C + Vercel promotion gate / D + visual regression). David picked Shape A — lightest, fits pre-beta iteration cadence, composes cleanly with heavier shapes later. Sub-decision on naming scheme: session-aligned `v0.{session}.{patch}` so versions map directly to CLAUDE.md session blocks.

The original session-167 chrome-unification ship (BG.png hero + new wordmark + chip-overlay refinement) was archived to [`archive/chrome-unification-v1`](https://github.com/Zen-Forged/treehouse-treasure-search/tree/archive/chrome-unification-v1) per David's call — too many unknowns surfaced during the design pass; iterate from production baseline going forward. This release ships **only the versioning discipline**, not the chrome change.

#### Added
- **`CHANGELOG.md`** at repo root — this file. Each future entry will be prepended at session close per the updated protocol.
- **`package.json`** `"version"` field bumped `0.1.0` (Next.js scaffold default) → `0.167.0` aligning to session number.
- **`.claude/commands/session-close.md`** updated with new **step 4 (Versioning)** before the Git step + a **post-merge tagging step** in the Git block. At every future session close it now: bumps `package.json`, prepends a CHANGELOG.md entry, includes both in the close commit, then after the squash-merge fires `git tag -a v0.{session}.0 <merge-sha>` + pushes the tag.

#### What this unlocks
- **Named references** — "v0.167" instead of commit SHAs in design conversations + investor updates
- **Rollback targets** — `git checkout v0.X.0` restores any past production state; `git diff v0.X.0..v0.Y.0` shows what changed between any two releases
- **Public timeline** — CHANGELOG.md is a public artifact suitable for investor updates, beta sign-up pages, or just remembering "what shipped when"
- **Hotfix lane** — same-day fix after a session ship goes as `v0.{session}.1`, `v0.{session}.2`, etc., without colliding with the next session's `v0.{session+1}.0`

#### Pre-v0.167.0 history
Sessions 1-166 ran without formal version tags. Detailed narrative lives in [CLAUDE.md](CLAUDE.md) session blocks + [`docs/session-archive.md`](docs/session-archive.md). PRs #1-#46 on [Zen-Forged/treehouse-treasure-search](https://github.com/Zen-Forged/treehouse-treasure-search/pulls?q=is%3Apr+is%3Aclosed) carry per-session squash commits to `main`. Backfilling 166 retroactive tags was deliberately skipped — would inflate the timeline without adding rollback value (each commit SHA on main is already accessible via PR history).

[v0.167.0]: https://github.com/Zen-Forged/treehouse-treasure-search/releases/tag/v0.167.0
