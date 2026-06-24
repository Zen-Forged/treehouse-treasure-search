# Home Hub — Design Record

> **Status:** 🟢 Ready for implementation
> **Created:** session 205 (2026-06-24)
> **Mockups:** [`docs/mockups/home-hub-v1.html`](mockups/home-hub-v1.html) (3-frame hero exploration — superseded) · [`docs/mockups/home-hub-v2.html`](mockups/home-hub-v2.html) (canonical, reference-aligned)
> **Cost shape:** Shape B — new persistent `/home` hub route + Home nav tab, alongside the existing Explore feed.

---

## 1. Problem & purpose

The app's `/` route **is** the Explore feed — it drops every role straight into browsing finds. There is **no surface that says "here's what Treehouse is and why you'd care"** before the browsing starts, and no central place a returning user orients from. The desktop marketing frame ([`components/DesktopFrame.tsx`](../components/DesktopFrame.tsx)) carries the brand pitch (*"Embrace the search. Treasure the find. Share the story."* / *"Find before you visit."*) — but that value-prop is **stranded on desktop** and never reaches the in-app mobile experience.

**The Home Hub is a dedicated surface that does two jobs at once:**
1. **Central hub** — a persistent place that orients you and launches you into Explore / Map / Saved.
2. **Sells the value & purpose from the first moment** — casts the 3-sided platform vision (shoppers find local treasures, vendors grow their booths, malls drive traffic) and leads with the digital→physical thesis (*find what's near you, before you visit*).

Anchored to project memory: `project_treehouse_thesis_digital_to_physical_bridge` (the hub's proximity-led hero + per-location distances make the bridge visual) · `project_vendor_value_first_prioritization` (a dedicated vendor-acquisition CTA on the hub) · `project_layered_engagement_share_hierarchy` (the hub composes the Mall / Booth / Find tiers into one orientation surface).

---

## 2. Structural decision

The load-bearing fork was **how Home relates to the existing Explore feed**. Three shapes were surfaced (smallest → largest): first-run splash only / **new hub tab alongside Explore** / Home becomes the front door (reverses session-134 Home→Explore rename).

**Decided: Shape B — new `/home` hub + Home nav tab. The Explore feed stays at `/`, untouched.** Composable, reversible, separates the two jobs cleanly: Home orients + sells, Explore browses. If the hub earns it, promoting it to the post-auth landing later is a one-line `pickDest` change (see D3 + Tier B).

---

## 3. Frozen decisions

| # | Decision | Notes |
|---|---|---|
| **D1** | **Shape B** — new persistent `/home` route + Home nav tab; `/` stays the Explore feed. | Front-door model (Shape C) explicitly deferred. |
| **D2** | **One pitch-forward composition** for everyone, with a light auth-aware utility touch (e.g. profile initials when signed in). No separate newcomer/returning layouts. | Ships in one design pass; sells value from the first moment to all viewers. |
| **D3** | **Opt-in tab** — auth still lands users on the feed / their role destination (current `pickDest` behavior unchanged). The Home tab is there when wanted. | **No routing reversal.** Making `/home` the default post-auth landing is a deliberate future call (Tier B). |
| **D4** | **Rich-media live content** — photographic location cards + promo-style cards. | ⚠️ **In-session reversal** of the earlier "lightweight count rows" pick, driven by David's reference screenshot. The richer media is the better call for a sell-the-value hub. |
| **D5** | **Hero = a rounded photographic hero *card*** (dark left-scrim, headline + sub + pill CTA), **not** the full-bleed 33vh sticky `<HomeHero>`. | Distinct from the Explore hero so the surfaces read differently. |
| **D6** | **Hero voice = proximity / local-discovery led.** Headline *"Discover treasures near you."* + sub *"Find what's on the shelves — before you visit."* + **Explore Nearby** pill. | Keeps `"Embrace the search…"` as supporting brand language elsewhere. The proximity voice makes the per-card "X mi" do real thesis work. |
| **D7** | **Nav model = keep the current nav + add a Home tab.** No center "List an Item" FAB (the reference's center action is vendor-only; a global create button would surface posting to shoppers who can't post). Posting stays in the vendor Booth flow. | Rejects the reference's 5-tab + FAB model. |
| **D8** | **Nav becomes: `Home · Explore · Map · Saved` (+ `Booth` rightmost for vendors).** Home takes slot 1; the existing first tab (label "Explore", href `/`) keeps its label but moves to slot 2; its internal key changes `home → explore`. New Home tab → href `/home`. | **10th iteration of R10 D1** (BottomNav). `activeNav`: `/home`→home, `/`→explore, `/map`→map, `/flagged`→flagged. Additive — Explore is still one tap. |
| **D9** | **The Treehouse Advantage = 3-audience value grid** — **Shoppers** (green), **Vendors** (gold), **Malls** (teal). Informational pitch copy; **not tappable** (actions live on the dedicated CTAs). | Casts the full 3-sided vision. |
| **D10** | **Malls column = vision copy with a `COMING SOON` tag, no live link.** | Mall-operator accounts are roadmap **R13** (unbuilt). Honest — sells the vision without a broken flow. Drops the tag + becomes live when R13 ships. |
| **D11** | **Explore Nearby = horizontal carousel of location cards** — per-location hero photo + name + distance + **booth** count + save heart — with a **`View Map ›`** link → `/map`. | "booths" vocabulary, not "vendors". Distance via `useUserLocation` (R17); sort distance-asc when granted, else by active/featured. Booth counts from mall stats. |
| **D12** | **Vendor CTA card** — gold-accented promo card: *"Have a booth? Join Treehouse."* + *"List your finds and reach local shoppers before they visit the mall."* + **Request a digital booth →** link → `/vendor-request`. Sits below the carousel. | Gold ties it to the Vendors column. Mirrors the session-201 empty-mall vendor CTA pattern. |
| **D13** | **No "Fresh finds, daily" promo card.** | ⚠️ **In-session reversal** — added then removed at David's call. Captured as Tier B (could return as a content row). |
| **D14** | **Masthead = centered `Treehouse Finds` wordmark + `LOCAL FINDS · REAL TREASURES` sub-brand + profile bubble (right).** No hamburger, no bell. | Hamburger implies a drawer the app doesn't have; bell implies notifications (R9, unbuilt). |
| **D15** | **Search = full-width `<SearchBar>` + green filter button**; routes into Explore (`/?q=…`). | Reuses the existing SearchBar primitive. Filter-button behavior is an open dial (D-open-2). |

### Open dials (resolve at build / first iPhone QA)

- **D-open-1 — Hero headline font/weight.** V2 uses Cormorant Garamond (app display serif). Heavier/blockier (Lora 700) is available for more of the reference's punch.
- **D-open-2 — Filter button behavior.** Open the mall/filter picker, or defer to Tier B (button present, no-op or hidden for V1).
- **D-open-3 — Hub background.** V2 lightened to a warmer near-cream `#F5F1E7` for an airy marketing feel vs the app standard `v2.bg.tabs #E6DECF`. Decide: hub-specific lighter cream (new Tier-1 token) or match the app.
- **D-open-4 — `COMING SOON` label on Malls.** Keep the explicit tag, or let the vision copy stand unlabeled.

---

## 4. Component contracts

New primitives live under `components/home-hub/` unless noted.

| Component | Contract | Reuse / notes |
|---|---|---|
| `app/(tabs)/home/page.tsx` | The hub page. Composes HubMasthead + search + HeroCard + AdvantageGrid + NearbyLocationsRail + VendorCtaCard. Server-fetches active malls + stats; client-hydrates distance. | Lives **inside `(tabs)`** so it shares BottomNav, but renders its **own** chrome (see TabsChrome branch). |
| `<HeroCard>` | `{ photoUrl, headline, sub, ctaLabel, onCta }`. Rounded 20px card, full-bleed photo, left→right dark scrim, headline (serif) + italic sub + green pill CTA. Defensive: gradient fallback when `photoUrl` null. | New primitive. |
| `<AdvantageGrid>` | 3 columns, each `{ icon, accentColor, label, copy, comingSoon? }`. Leaf-ornament eyebrow "THE TREEHOUSE ADVANTAGE". | New primitive. Icons via Phosphor (PiShoppingBagBold / PiStorefrontBold / PiBuildingsBold). |
| `<NearbyLocationCard>` | `{ mall, distanceMi?, boothCount, saved, onToggleSave, onTap }`. ~208px card: 124px photo banner with name overlay + meta row (distance · booth count + heart). | New primitive **or** extend the session-158/161 `<MapCarousel>` card. Evaluate reuse at build. |
| `<NearbyLocationsRail>` | `{ malls, userLocation }` + "EXPLORE NEARBY" header + `View Map ›` → `/map`. Horizontal scroll of `<NearbyLocationCard>`. Sort distance-asc when located. | New primitive. Consumes `getActiveMalls` + mall stats + `useUserLocation`. |
| `<VendorCtaCard>` | `{ href = "/vendor-request" }`. Gold promo card with storefront glyph + heading + sub + arrow link. | New primitive. Shares copy lineage with the session-201 empty-mall CTA. |
| HubMasthead | Centered wordmark + sub-brand + profile bubble. | Either a small new component or a `<StickyMasthead>` variant (`variant="hub"`). Evaluate at build. |
| Search slot | Reuse `<SearchBar>` + a filter button. | Routes `?q=` into `/`. Filter button per D-open-2. |

---

## 5. Routing & nav changes

- **New route:** `app/(tabs)/home/page.tsx` (`/home`). No `next.config.js` redirect collision.
- **`(tabs)/layout.tsx` / `TabsChrome`:** add a `pathname === "/home"` branch that renders **HubMasthead** (centered wordmark) instead of `<HomeHero>` + `<MallPickerChip>`. (Mirrors how `/map` returns its own chrome.)
- **`BottomNav.tsx`:** insert Home tab at slot 1 (`key: "home"`, label "Home", `href: "/home"`, house glyph); rename the existing first tab's key `home → explore` (label "Explore" unchanged, `href: "/"`). Update `activeNav` computation in the layout: `/home`→`home`, `/`→`explore`, `/map`→`map`, `/flagged`→`flagged`. Booth stays vendor-only, rightmost.
- **`pickDest` (auth landing): UNCHANGED** per D3.

---

## 6. Implementation arcs (smallest → largest)

> Per `feedback_smallest_to_largest_commit_sequencing` + `feedback_testbed_first_for_ai_unknowns`. Build green at every commit boundary.

- **Arc 1 — Route + nav scaffold.** Add `/home` shell page (placeholder body). Add Home tab to BottomNav (key rename `home→explore` + new Home tab) + `activeNav` remap + TabsChrome `/home` HubMasthead branch. Ships a working, navigable (empty) Home tab. *No `pickDest` change.*
- **Arc 2 — Primitives in isolation + smoke route.** Build `<HeroCard>`, `<AdvantageGrid>`, `<NearbyLocationCard>` + `<NearbyLocationsRail>`, `<VendorCtaCard>`, HubMasthead. Mount all on a `/home-hub-test` smoke route against fixtures. Validate composition before wiring data.
- **Arc 3 — Wire real data + compose the page.** `getActiveMalls` + mall stats + `useUserLocation` distance into the rail; SearchBar + filter; real masthead. Assemble `/home`. iPhone QA on Vercel preview.
- **Arc 4 — Dials + polish.** Resolve D-open-1..4 against on-device QA; spacing, hero weight, bg token, coming-soon label.

---

## 7. Tier B headroom (explicit doors left open)

- **B1** — "Fresh finds, daily" content row (removed at D13; can return).
- **B2** — Filter button real behavior (mall/filter picker) per D-open-2.
- **B3** — Malls audience → live (drop COMING SOON, link to onboarding) when **R13** ships.
- **B4** — Hero dynamic location/find count ("12 locations open today").
- **B5** — Promote `/home` to the default post-auth landing (D3 reversal) once it earns it.
- **B6** — Advantage grid cards become tappable (Shoppers → Explore, Vendors → /vendor-request).
- **B7** — Per-location real hero photos depend on `malls.hero_image_url` being populated (real-content seeding).
- **B8** — Desktop frame consolidation: the hub's value-prop overlaps `<DesktopFrame>`'s BrandChrome; consider the hub *being* what desktop embeds, or slimming BrandChrome, later.
- **B9** — Notifications bell / drawer (R9) — deferred with the nav model.

---

## 8. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Nav restructure (10th R10 D1) — Home demotes Explore to slot 2; muscle-memory churn for existing users. | Med | Additive; Explore still one tap; surface as a bounded R10 D1 iteration. |
| `/home` inside `(tabs)` needs its own chrome (not HomeHero/MallPickerChip) → TabsChrome conditional grows. | Low | Same pattern `/map` already uses (returns own chrome). |
| `activeNav` key rename (`home→explore`) — must update every consumer + any deep links to the old key. | Med | Grep `active="home"` / `activeNav` before shipping Arc 1. |
| Advertising "Malls" (unbuilt R13). | Low | D10 — COMING SOON tag, no live link. |
| Distance needs geolocation permission. | Low | Fallback: no distance shown, sort by active/featured (R17 `useUserLocation` already handles denied state). |
| Per-location hero photos may be missing. | Low | Gradient/glyph fallback in `<NearbyLocationCard>` (B7). |
| Hub bg lighter than app (`#F5F1E7` vs `#E6DECF`) → visual drift. | Low | D-open-3 decision; new Tier-1 token if kept. |

---

## 9. Reversals surfaced

Per `feedback_surface_locked_design_reversals` + `feedback_within_session_design_record_reversal`:

- **D4** — "lightweight count rows" (locked earlier this session) → **rich media** (reference-driven). The reference superseded the prose pick; the richer direction is correct for a sell-the-value hub.
- **D13** — "Fresh finds, daily" card **added then removed** within this session at David's call. Preserved as Tier B B1.
- **D8** — adds a **Home tab** and demotes Explore to nav slot 2. This does **not** revert the session-134 `Home → Explore` rename (the Explore feed keeps its name + its `/` route); it *adds* a distinct Home hub above it. 10th R10 D1 iteration.

---

## 10. Existing brand copy reused (not reinvented)

- Tagline thesis: *"Embrace the search. Treasure the find. Share the story."* (`DesktopFrame.tsx`) — supporting brand language.
- *"Find before you visit."* → adapted as the hero sub.
- Vendor CTA copy lineage: session-201 empty-mall *"Request a digital booth →"* → `/vendor-request`.
- Vocabulary: **booths** (not "vendors") on location cards; **locations** for malls.
