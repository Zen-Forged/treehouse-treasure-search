# Desktop frame — design record

Session 199 — Shape B design pass closes "desktop visitors land on app and see empty cream bg around the 430px PWA column." Reference: David's image showing photographed iPhone in flatlay scene with wordmark + tagline + decorative postcard/key/botanical elements.

## Context

Desktop rendering first surfaced as a first-class concern at session 198 C4 (Home Profile button overlay extended to viewport edge on desktop; max-width centering wrapper landed as the fix). The bug was a leading indicator: as Treehouse approaches beta, desktop visitors (press, investors, shoppers researching before installing PWA, vendors evaluating platform) become a real audience that today sees an unbranded empty viewport around a phone-sized column.

This design pass scopes the desktop chrome as a polished branded demo with the live PWA framed inside a photographed iPhone composition — matching David's reference image's editorial photography voice.

## Decision matrix

| Phase | Pattern | Decision |
|---|---|---|
| Triage | Cost-shape triage (Shape B picked over A/C) | Phone-frame simulation around live app |
| V1 axis | Frame style depth (3 frames) | Frame A — photo-realistic flatlay |
| Prose batch 1 | A1-A4 axes | 4/4 Recommended picks |
| Prose batch 2 | B1-B2 axes | 2/2 Recommended picks |

## Frozen decisions

**D1 — Cost shape = Shape B.** Phone-frame simulation around the live PWA. Not Shape A (background-only) which doesn't deliver the "demo with simulated phone" intent. Not Shape C (separate marketing landing page) which is multi-session and pulls in roadmap items (R7 onboarding, R15 app store) beyond current scope.

**D2 — Frame style = Frame A photo-realistic.** Matches reference image exactly: editorial photographed iPhone in flatlay scene with photographed decorations (botanicals, antique postcard, brass key, treehouse sketch). Highest brand fidelity; gated on photo production but accepted trade.

**D3 — Frame content = Live PWA (interactive).** The actual PWA renders inside the photographed phone's screen rectangle — clicks/scrolls work. Desktop visitors interact with real product; the frame doubles as a branded demo. Not a static screenshot/video loop.

**D4 — Authed-state gate = visitors only (signed-out users).** Signed-in users (admin/vendor/shopper) get full-viewport PWA on desktop (vendors managing booth need viewport space; signed-in shoppers shouldn't see marketing chrome). Visitor view = branded demo. **Implementation note:** Arc 2 can ship without gate first (chrome shows to all desktop viewers); Arc 3 follow-up adds the visitor-only gate to avoid hydration-flash complexity in the initial ship.

**D5 — Marketing chrome = wordmark + tagline only.** Three lines verbatim from reference image:
- "Embrace the search."
- "Treasure the find."
- "Share the story."
Plus subtext: "Find before you visit."
No install CTAs, no App Store badges (Tier B B1), no marketing copy beyond tagline. Quiet, brand-led. The framed live app carries the conversion message.

**D6 — Breakpoint = 1024px (laptop+).** Below 1024 → current cream-bg-around-430px behavior unchanged (existing PWA chrome). Above 1024 → desktop frame chrome activates. Tablet-portrait (768-1023px) deliberately falls back to current behavior — feels cramped at 768px viewport width per Tier B B5.

**D7 — Photo sourcing = AI-generate via Midjourney/DALL-E.** David runs prompt externally + iterates + delivers final image. Drafted prompt + iteration notes below in §Midjourney photo brief. Final asset lands at `public/desktop-hero.webp` (or `.jpg` if AVIF/WebP not available).

**D8 — Ship sequence = Code-first with placeholder bg.** Chrome substrate ships THIS session with a CSS-rendered placeholder bg approximating the paper-texture/flatlay look. Photo swaps in as a single CSS change (one-line update to background-image) when David delivers final Midjourney output. Code is independent + revertable; chrome works in production immediately.

**D9 — Composition contract.** Match reference image structurally:
- Top left: botanical sprig
- Top right: hand-drawn treehouse sketch on aged paper
- Middle left (negative space): brand chrome (wordmark + tagline + subtext)
- Middle right: photographed iPhone, straight-on, titanium finish, blank/black screen
- Bottom left: vintage postcard with stamp + handwriting
- Bottom right: antique brass skeleton key

**D10 — Phone-screen rectangle coords = TBD on photo delivery.** Placeholder uses centered phone shape at standard iPhone proportions (~290×600 in mockup; real photo will dictate final coords). Single CSS calibration commit after photo lands.

**D11 — Live app rendering.** PWA's existing 430px max-width column renders inside the phone-screen rectangle via absolute positioning on desktop. Existing PWA chrome (StickyMasthead, BottomNav, TabsChrome) unchanged. On viewport <1024px or when authed user (D4), the page-level max-width: 430 centering applies as today.

**D12 — Wordmark composition.** Renders as 2-line lockup:
- Line 1: "treehouse" — Cormorant Garamond 400, ~64px, ink-primary
- Line 2: "FINDS" — Cormorant Garamond 500, ~18px, letter-spacing 0.32em, with top hairline border
Matches reference image's wordmark treatment exactly.

**D13 — Tagline composition.** 3 stacked lines Cormorant Garamond 400 italic ~28px, line-height 1.35. Ornament (small gold horizontal element) below tagline. "Find before you visit." subtext below ornament in Cormorant Garamond italic ~16px ink-secondary.

## Component contracts

### `<DesktopFrame>` — primary primitive

**Purpose:** Wraps `{children}` in branded desktop chrome at ≥1024px for visitor users. Pass-through at <1024px OR when authed.

**Props:**
- `children: React.ReactNode` — the PWA app to render inside the phone-screen rectangle.

**Behavior:**
- At viewport <1024px → renders `{children}` only (no chrome wrapper).
- At viewport ≥1024px → renders desktop frame: bg photo + brand chrome left + phone bezel + phone-screen rectangle containing `{children}`.
- Auth state check (D4) deferred to Arc 3 — initial implementation renders chrome to all desktop viewers.

**File:** `components/DesktopFrame.tsx` (new).

**Composition tree:**
```
<DesktopFrame>
  <div class="desktop-bg" style={{ backgroundImage: 'url(/desktop-hero-placeholder.svg)' }}>
    <BrandChrome />
    <PhoneStage>
      {children}
    </PhoneStage>
  </div>
</DesktopFrame>
```

### `<BrandChrome>` — sub-component

**Purpose:** Renders wordmark + tagline + ornament + subtext at left-of-phone position.

**Props:** None (static brand chrome).

**Layout:** Absolute positioned at `left: 8%, top: 50%, transform: translateY(-50%)`. Max-width ~380px. Wordmark + 3-line tagline + ornament + subtext stacked.

**File:** Internal to `components/DesktopFrame.tsx` (extract to separate file only if 2nd consumer surfaces).

### `<PhoneStage>` — sub-component

**Purpose:** Positions live PWA inside phone-screen rectangle.

**Props:**
- `children: React.ReactNode` — PWA renders here.

**Layout:** Absolute positioned at coords matching photo's phone-screen rectangle (placeholder: `right: 10%, top: 50%, transform: translateY(-50%)`, dimensions: 290×600 with 36px border-radius + overflow:hidden). Real coords dialed when final photo lands.

**File:** Internal to `components/DesktopFrame.tsx`.

## Implementation arcs

Sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88. Build clean at every commit boundary.

### Arc 1 — Design record + V1 mockup (this commit, docs only)

Single docs commit ships `docs/desktop-frame-design.md` (this file) + `docs/mockups/desktop-frame-v1.html` together per Design Agent rule + `feedback_commit_design_records_in_same_session`. David can start running Midjourney externally in parallel with Arc 2 code ship.

### Arc 2 — Code substrate (3-4 commits, smallest→largest)

**Arc 2.1 — `<DesktopFrame>` primitive in isolation + smoke route**
- New file `components/DesktopFrame.tsx` containing the full primitive (DesktopFrame + BrandChrome + PhoneStage).
- New smoke route `/desktop-frame-test` mounting `<DesktopFrame><PlaceholderPwaShell /></DesktopFrame>` so David can preview at full desktop viewport before integration.
- Placeholder bg via CSS gradient + grain pattern (similar to V1 mockup's Frame A preview).
- Build green; no production consumers yet.
- Per `feedback_testbed_first_for_ai_unknowns` ✅ Promoted — **6th cumulative firing** (postcard-test → search-bar-test → geolocation-test → vendors-test → share-shelf-test → desktop-frame-test).

**Arc 2.2 — Placeholder bg refinement (optional, defer to QA)**
- If smoke-test preview looks cheap, dial CSS gradient/grain to better approximate paper texture.
- Single commit if needed; skip if 2.1's placeholder reads acceptable.

**Arc 2.3 — `app/layout.tsx` adoption**
- Wrap `{children}` in `<DesktopFrame>` so every page benefits.
- CSS media query (`@media (min-width: 1024px)`) controls chrome visibility — at <1024px the wrapper is `display: contents` (pass-through) and PWA renders as today.
- No auth gate yet (D4 deferred to Arc 3).
- Build green; chrome live on every page in production at desktop viewport.

**Arc 2.4 — Per-page max-width override**
- The route-group `(tabs)/layout.tsx` + ~24 other surfaces set `max-width: 430` centering. Inside `<PhoneStage>` (290px wide), the 430 centering is moot since parent constrains.
- Verify PWA renders correctly inside PhoneStage. If max-width centering causes visual issues (overflow, alignment), add `data-desktop-frame` attribute to PhoneStage + CSS override.
- May not need a commit; depends on Arc 2.3 visual QA outcome.

### Arc 3 — Follow-up (future session, gated on photo delivery)

**Arc 3.1 — Photo swap-in**
- Single CSS change: `backgroundImage: 'url(/desktop-hero.webp)'` replaces placeholder.
- Asset lands at `public/desktop-hero.webp` (or `.jpg` if AVIF/WebP path adds friction).
- Calibrate phone-screen-rectangle coords (D10) against actual photo geometry — likely 1-2 line CSS dial.

**Arc 3.2 — Visitor-only auth gate (D4)**
- Add `useShopperAuth` check in `<DesktopFrame>` — render chrome only when `auth.ready && auth.user === null`.
- Handle hydration flash: SSR renders chrome (default visitor state); useLayoutEffect hides chrome if authed.
- Per `feedback_browser_api_in_useState_initializer_hydration` ✅ Promoted.

## Midjourney photo brief

**Recommended Midjourney version:** v6.1 or v7 (whichever ships latest at time of generation).

**Primary prompt:**

```
Editorial overhead flatlay product photography, warm cream textured handmade paper background, soft natural directional lighting from upper left creating gentle shadows. Slight oblique angle, approximately 15 degrees off pure top-down.

Composition arranged clockwise:
- Top left: small green botanical sprig with delicate leaves, eucalyptus or olive branch, casual organic placement
- Top right: hand-drawn antique ink sketch of a treehouse on aged parchment paper, slight rotation 8 degrees clockwise, sepia tones
- Right center: realistic Apple iPhone 15 Pro in titanium natural finish, straight-on view, screen completely matte black and blank (no UI, no reflections, no content), casting subtle soft shadow on paper below
- Bottom left: vintage handwritten postcard with weathered edges, green postage stamp visible, slight rotation 6 degrees counter-clockwise, faint cursive handwriting in sepia ink
- Bottom right: antique brass skeleton key with patinated finish, rotated 25 degrees clockwise, warm tarnish

Empty negative space in center-left area for typography overlay.

Color palette: cream and parchment base, sepia browns, warm beige, antique paper tones, sage and forest green accents from botanical, aged brass and bronze metallic. No saturated or vibrant colors.

Mood: Anthropologie editorial catalog crossed with antique stationary store. Treasure-hunting nostalgia. Premium curated craft retail. Quiet warmth. Storytelling object arrangement.

--ar 16:9 --style raw --v 6.1 --no logos, screen content, text on phone, modern plastic objects, vibrant saturated colors, harsh shadows, busy patterns
```

**Iteration notes** (if first pass isn't right):

- **Phone position wrong:** Adjust "Right center" → "Center-right" / "Right of center" / "Centered" depending on desired position. Reference image has phone at ~60% horizontal position.
- **Decorations cluttered:** Add "minimal arrangement, generous breathing room between objects" to prompt.
- **Colors too warm/cold:** Dial palette descriptors. "More cream-leaning, less yellow" or "warmer terracotta accents."
- **Phone reads as modern (out of voice):** Specify "iPhone with slight age — handled, slight fingerprints near edges" or alternately drop phone make to just "minimalist smartphone, titanium finish."
- **Empty screen looks fake:** Add "screen has subtle matte texture, not glossy reflection."
- **Botanicals not right type:** Swap "eucalyptus or olive branch" → "sage, lavender, dried flowers, herb sprig."
- **Postcard not editorial enough:** Add "1920s era vintage postcard, faded ink, edges show age and travel."
- **Treehouse sketch wrong:** Adjust "hand-drawn ink sketch" → "delicate pen sketch with watercolor wash" or "minimalist line drawing."

**Generation cadence:**
- Run 4-6 initial generations with primary prompt
- Pick best 2-3 compositions; run variations (V1/V2/V3/V4 in Midjourney) on each
- Upscale final pick
- Post-process in Photoshop/Lightroom if needed (color grading, minor element repositioning, screen-rectangle cleanup)

**Final asset specifications:**
- Format: WebP (preferred) or JPG. AVIF if Vercel/Next.js Image supports.
- Dimensions: 2880×1620 source (2x for retina) → output as responsive srcset
- Optimization: <500KB compressed. Use pngquant-bin or sharp via Next.js Image component for automatic optimization.
- File location: `public/desktop-hero.webp`

**Phone-screen rectangle calibration after photo lands:**
After upload, measure exact pixel coordinates of the iPhone's screen area within the photo at output resolution. Document coords in `<PhoneStage>` component CSS for absolute positioning. Single CSS calibration commit closes Arc 3.1.

## Tier B headroom

- **B1 — App Store badges + Install CTA.** Composes with R15 app store launch (roadmap-beta-plus.md). Adds "Download on App Store" badge below or beside phone frame when app ships to App Store. Defer until app store launch lands.
- **B2 — Animated decorations.** Subtle gentle sway on botanicals, slight key rotation hover. Currently static (D9). Defer unless real-content seeding shows the chrome reads dead. Couple with `prefers-reduced-motion` query.
- **B3 — Vendor-specific desktop chrome.** Authed vendors managing booth on desktop get full viewport today (D4). If desktop vendor admin work becomes a real use case, separate `<VendorDesktopChrome>` primitive could ship — wider admin layout, table views, etc.
- **B4 — Internationalization.** Tagline currently English only. Composes with future i18n initiative.
- **B5 — Tablet portrait breakpoint behavior (768-1023px).** Currently falls back to cream-bg-around-430px. Could ship a "tablet" variant of desktop chrome (smaller frame, no decorations) if tablet visitors become measurable in analytics.
- **B6 — Reduced-motion handling.** Tier B B2 prerequisite.
- **B7 — Dark-mode handling.** Cream paper bg doesn't transition naturally to dark mode. If/when dark mode ships project-wide, desktop chrome needs a dark variant (slate paper texture? Inverted sepia tones?).

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| R1 — Photo asset weight degrades desktop load time | Med | Aggressive WebP/AVIF compression + responsive srcset. Target <500KB. Vercel Image API for runtime optimization. |
| R2 — Phone-screen rectangle coordinate calibration off after photo lands | Low | Single CSS dial commit closes; placeholder coords are approximations. |
| R3 — Live PWA aspect ratio mismatch with photographed iPhone screen | Low-Med | PhoneStage uses overflow:hidden; PWA scrolls inside. Width should align (430px column vs ~290px phone in mockup proportions — photo composition can dial iPhone size to fit). |
| R4 — Existing per-page `max-width: 430` centering conflicts with PhoneStage positioning | Low | Arc 2.4 validates in QA; CSS data-attribute override if needed. |
| R5 — Auth state hydration flash on authed users at desktop viewport | Low (Arc 3) | Defer to Arc 3.2. Acceptable flash direction (chrome shows briefly then hides) for authed users. |
| R6 — Future overlays/modals/full-screen takeovers conflict with PhoneStage geometry | Med | Document `<DesktopFrame>` opt-out via prop (`disabled`) for routes that need full viewport. |
| R7 — Midjourney generation doesn't land on right composition after 6+ iterations | Low-Med | Pivot to stock photo + Photoshop composite, OR commission a stylist (D7 alternative paths). |
| R8 — Phone screen blank/dark in photo doesn't blend cleanly with live PWA's cream bg | Med | Photo screen should be matte black; PhoneStage overlay sits on top with PWA's actual cream bg. Border-radius + slight inset shadow at PhoneStage edge masks the seam. |

## Carries opening from this design pass

- **Photo asset delivery (Arc 3.1 prerequisite)** — David runs Midjourney externally; lands `public/desktop-hero.webp` when ready. Single CSS swap-in commit closes Arc 3.1.
- **Visitor-only auth gate (Arc 3.2)** — Add after Arc 2 chrome ships and validates in production.
- **iPhone QA on desktop browser** — Validate chrome at 1024px / 1280px / 1440px / 1920px viewport widths. Sub-1024px (mobile + tablet portrait) should be unchanged from current PWA behavior.

## Reversal traceability

Per `feedback_surface_locked_design_reversals` ✅ Promoted — no prior locked decisions reversed by this design pass. Desktop rendering treatment was implicit ("PWA cream bg around 430px column") rather than a frozen decision. Session 198 C4's Profile button max-width centering was the first explicit desktop-aware decision and remains unaffected by this design (it's a mobile-first fix that happens to also work on desktop; desktop chrome wraps around the floating Profile button container).
