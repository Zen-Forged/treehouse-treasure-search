# R10 — Location map nav + persistent postcard mall card — Design record

> **Status:** 🟢 **Ready** as of session 106 (2026-05-04). Design + nav + primitive frozen; implementation sprint follows in a later session.
> **Status history:** 🟡 Captured (55) → 🟢 Ready (106).
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r10--location-map-nav-icon-) — R10.
> **Mockups:**
> - [`docs/mockups/r10-location-map-v1.html`](mockups/r10-location-map-v1.html) — V1 (3 structural frames + pin variants + bottom-card spec). Rejected: bottom-card identifier duplicated the mall picker; "where does the card live on the map" tension unresolved.
> - [`docs/mockups/r10-location-map-v2.html`](mockups/r10-location-map-v2.html) — V2 (postcard mall card persistent across Home / Saved / Map). Direction approved.
> - [`docs/mockups/r10-location-map-v3.html`](mockups/r10-location-map-v3.html) — V3 (component-isolated; full-height stamp + page-contextual glyph). Refined further.
> - [`docs/mockups/r10-location-map-v4.html`](mockups/r10-location-map-v4.html) — **V4 PICKED for the postcard card.** Square stamp + wavy SVG ink cancellation.
> - [`docs/mockups/r10-location-map-v5.html`](mockups/r10-location-map-v5.html) — **V5 PICKED for the page body.** All-Kentucky overview / specific-mall / peek-callout states + cartographic basemap + peek-then-commit interaction + redirect-to-Home search behavior. Recommendations all accepted by David.
> **Effort:** L (3–4 sessions: this one = design-to-Ready, plus an implementation arc covering primitive + nav redesign + /map page + map-provider integration + scope-state machine).
> **Purpose of this doc:** Freeze the visual + nav + primitive decisions so the implementation arc runs against a spec, not a re-scoping pass. Map-provider choice is the only deferred axis.

---

## Origin (session 106)

David surfaced R10 at session-open after redirecting from R1 — *"now that we're getting requests to add locations I want to spend this session on scoping and designing the Location Map functionality."* Provided an Airbnb screenshot as primary reference + a hand-drawn mockup as the brief mid-pass.

The hand-drawn mockup was the load-bearing pivot: rather than a one-off Map page with a bottom card, David's vision was a **persistent mall card across Home / Saved / Map** with body content varying per tab. This dissolved the V1 bottom-card-spec tension because the persistent top card IS the mall identifier — no duplicate is needed on the map.

V2 → V3 → V4 → V5 iteration narrative:
- **V2** locked the "mall card persistent across 3 tabs" thesis and the 4-tab BottomNav (Booths retires).
- **V3** isolated the card and gave the stamp a contextual glyph (Home / Map / Profile / Saved) matching the BottomNav active tab.
- **V4** kept V3's structure but made the stamp square (was rectangular full-height) and replaced the stacked-hairline cancellation with wavy SVG ink — *"feels very UI and not realistic"* per David.
- **V5** designed the actual `/map` page body — All-Kentucky overview, specific-mall, peek-callout states. Surfaced 3 open axes: basemap style, pin-tap interaction, search behavior on Map.

David approved V4: *"looks good lets lock it in."* — locking the postcard card primitive.

David approved all V5 recommendations: cartographic warm-cream basemap + peek-then-commit interaction + redirect-to-Home search. Locks the page-body layer.

---

## Scope

R10 ships:
1. A new BottomNav tab — **Map** — with an interactive map of active mall locations.
2. A persistent header primitive — **`<PostcardMallCard>`** — that ships to **Home, Saved, and Map** identically. Same primitive, same mall scope, different page body underneath.
3. A larger **wordmark hero masthead** for primary tab pages (no back-button to share the row with on root-level tabs).
4. **BottomNav redesign** — drops to 4 tabs (Home / Map / Profile / Saved). Booths tab retires; its three jobs redistribute. Saved glyph swaps from FlagGlyph to leaf; badge swaps from anonymous dot to count pill.

It does **not** ship:
- A 5th tab. The 4-tab model is locked.
- Map-provider integration. Mapbox vs Google Maps vs Leaflet+OSM is deferred to the implementation session — see "Open implementation questions" below.
- Pin clustering. Phase-1 has 5 active locations across Kentucky; clustering is a post-launch axis if location count grows.
- Within-mall booth pins. Map shows mall locations only; booth-level navigation stays at /shelf/[slug].
- Mall hero photos on the map. Hero column exists from session 92's migration 016, but V4's design uses textual postcard cards, not photo cards.

---

## Design decisions (frozen 2026-05-04)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Where does the Map slot in the BottomNav? | **New 5th tab → reduce to 4 tabs by retiring Booths.** Final order: Home / Map / Profile / Saved. The Booths-as-list-page becomes redundant once the postcard card identifies the mall scope and the /map tab is the canonical "browse locations" surface. | David's hand-drawn mockup, session 106. |
| D2 | Booths tab retirement — where do its three jobs go? | **Browse all booths in a mall** → /map (tap a pin → scope → existing booth-grouped Saved view + per-booth "Explore the booth →" CTA). **Vendor-add booth** → /admin Locations tab + EditBoothSheet (already exists per session 74). **My Booth entry** → Profile tab inline link (vendors only). | Session 106 redistribution. |
| D3 | Saved tab glyph — keep FlagGlyph or swap? | **Swap to leaf glyph.** Same brand glyph as the save-bubbles on every tile; consistency across surfaces. Lucide-style stroke 2.0 to match other tabs. | David's hand-drawn mockup, session 106. |
| D4 | Saved tab badge — dot or count? | **Count pill.** Brand-green pill with Times-New-Roman numeral (matches the booth-numeral typography system from session 75). Replaces today's anonymous green dot. | David's hand-drawn mockup, session 106. |
| D5 | Persistent header on primary tabs (Home / Saved / Map) — what's the shape? | **`<PostcardMallCard>` primitive.** Postcard-bg surface, "from:" eyebrow + Lora mall name + pin/address row + square contextual stamp on the right. Identical across all 3 tabs. | V2 mockup approved by David. |
| D6 | Tab masthead chrome — keep StickyMasthead or use a hero wordmark? | **Hero wordmark masthead on root-level tab pages.** Wordmark renders ~86px tall (vs 40px inline elsewhere) since there's no back-button or right-slot to share the row with. **Sub-pages still use the 40px inline StickyMasthead.** | David's hand-drawn mockup, session 106. |
| D7 | Card surface — paperWarm or new token? | **New token: `postcardBg #f4ecd8`.** Slightly more saturated than paperWarm; reads as "card stock" rather than "off-white." | V4. |
| D8 | Card border + radius + shadow | **1px solid rgba(42,26,10,0.10) + 12px radius + new `shadow-postcard` token** (`0 4px 14px rgba(42,26,10,0.16), 0 1px 2px rgba(42,26,10,0.08)`). Lighter than `shadow-polaroid` because the card is a chrome element, not a focal-point primitive. | V4. |
| D9 | "from:" eyebrow typography | **Lora italic 18 / inkMuted / line-height 1.** Postal vocabulary anchor — sets up the postcard read before the user reaches the mall name. | V2 → V4. |
| D10 | Mall name typography | **Lora 22 / 500 / inkPrimary / line-height 1.3** with `WebkitLineClamp: 2`. Up to 2 lines for long names. *Session 107 iPhone-QA dial: 26 → 22 + lineHeight 1.15 → 1.3 to stop Lora descender clipping under `-webkit-box` clamp. Generalizes the session-83 `feedback_lora_lineheight_minimum_for_clamp` rule beyond ≤14px text — applies to any clamped Lora.* | V4 + session-107 dial. |
| D11 | Address row | **Lucide MapPin 12 (inkMid) + system-sans 12 (inkMid).** Single line, ellipsis. Composes from `address + city + state + zip_code`. *Session 107 iPhone-QA dial: 13 → 12 to land paired with the name dial; reads visually weighted under the bigger Lora.* | V4 + session-107 dial. |
| D12 | Stamp shape — full-height rectangle or square? | **Square 52×52, vertically centered.** V3 went full-height; David: *"the stamp to remain square."* Smaller footprint, more recognizable as a postage stamp. | David, session 106 V3 → V4 redirect. |
| D13 | Stamp glyph — fixed leaf or page-contextual? | **Page-contextual.** Each tab renders its BottomNav-active glyph in the stamp: Home = Lucide Home; Map = Lucide MapPin; Profile = Lucide CircleUser; Saved = brand leaf. Same Lucide shapes / 2.0 stroke as the BottomNav so the stamp glyph and active tab glyph match. | David, session 106: *"the inside of the stamp would change based on the page and carry the same icon styles as the nav bar."* |
| D14 | Stamp rim — perforated edge, dashed border, or plain? | **1.5px dashed greenBorder rim.** Renders identically across browsers. Reads as "stamp perforation" without per-pixel pseudo-element hacks. V2's radial-gradient perforation retired. | V3 → V4. |
| D15 | Stamp inner | **Solid green fill, 2px radius, glyph centered, glyph color `greenOn`.** | V2 → V4. |
| D16 | Cancellation marks — present at all? | **Yes, kept.** Reads as postal cancellation, reinforces the postcard vocabulary. | David, session 106: *"I like the stamp and cancellation mark concept."* |
| D17 | Cancellation rendering | **Wavy SVG ink — 5 quadratic Bézier paths (`Q` + `T` smooth-quad chains)** at baselines y=4, 11, 18, 25, 32 in a 84×38 viewBox. Stroke `inkPrimary` 1.6px, opacity 0.42, rotated −6° as a group. **No** stacked div-bars (V3 read as "very UI" per David). | David, session 106 V3 → V4 redirect. |
| D18 | Cancellation positioning | **Absolute, partial overlap with stamp's left edge.** `right: 54px` from card outer (~14px overlap into stamp) + 70px extension across the paper area. `pointer-events: none` so it doesn't intercept taps. `z-index: 2` (over the stamp). | V4. |
| D19 | Tap behavior on the card | ~~Opens `<MallSheet>` everywhere — the card IS the mall picker on every tab.~~ **REVERSED (partial) session 107** → On **Map** the card opens MallSheet (the change UI). On **Home + Saved** the card routes to `/map` instead. David: *"If the location needs to be changed, it will be changed on the map page and filtered on all subsequent pages."* The shared scope still persists via `useSavedMallId`; Home + Saved are now filter consumers, not changers. The card's "from: <mall>" identifier role stays the same on every surface; only the tap action diverges. | David, session 107 iPhone QA. |
| D20 | Search bar placement on tab pages | ~~Below the mall card, above the body content. Same primitive across Home / Saved / Map.~~ **REVERSED session 107** → Home + Saved keep the SearchBar; **Map drops it**. David: *"doesn't make sense to include right now, trying to keep the scope of the functionality contained by page."* Search becomes a Home-only concern; Map stays purely geographic. The map body grows into the freed vertical space. | David, session 107 iPhone QA. |
| D21 | Search bar placeholder copy | **"Search finds, booths, or styles"** — adds "or styles" to surface R16's tag layer. Was "Search finds, booths…" prior. Applies on Home + Saved (Map drops the bar entirely per D20 reversal). | David, session 106. |
| D22 | Map page — bottom card present? | **No bottom card on the map.** The persistent top postcard already identifies the mall scope. V1's bottom-card spec is dissolved. Map fills the body entirely. | V2 thesis, locked V4. |
| D23 | Map page — scope state machine | **Two scope states.** *Specific mall*: card shows that mall; map zooms to its coordinates with a single highlighted pin. *All Kentucky*: card shows "All Kentucky Locations" with a literary subtitle ("5 active locations · Louisville to Lexington"); map zooms out, shows all active mall pins. Pin-tap behavior is governed by D26 (peek-then-commit), not instant rescope. | Session 106 — composes with the existing MallSheet "All Kentucky" scope choice. |
| D24 | Pin treatment on the map | **Leaf-bubble pin** (paper-warm circle outlined green; selected = green fill, white glyph). Cartographic dot variant available for deep zoom-out / clustering when location count grows. Other V1 pin variants (name pill, photo thumb, numeral) retired. | V1 mockup recommendation, kept V4. |
| D25 | Basemap visual style | **Cartographic warm-cream.** Custom-styled Mapbox layer: cream landmass (`map-cream #efe6cf`), tan lowland (`map-cream-2 #e6d9b8`), sage water (`map-water #c5d6c4`, deeper `map-water-2 #aac3aa`), white roads, italic-Lora region labels at low opacity. Matches v1.x ecosystem palette + the in-app cartographic eyebrow on /find/[id]. Standard light is the fallback only if Mapbox custom styling proves cost-prohibitive at projected traffic. | V5 mockup, David accepted recommendation session 106. |
| D26 | Pin-tap interaction | **Peek-then-commit.** Tap a pin → pin enters selected state (green fill, glyph in `green-on`, scale +15%, soft halo) AND an inline `<PinCallout>` appears above the pin showing 36px hero thumb + Lora mall name + Times-New-Roman booth/find counts + chevron. Tap the callout → commits the rescope (postcard card animates to that mall, map zooms in to specific-mall state). Tap empty map → dismisses callout, pin returns to default. Refines D23's earlier instant-rescope language. | V5 mockup, David accepted recommendation session 106. |
| D27 | Search bar behavior on Map | ~~Redirect to Home — submitting a search on Map routes to `/?q=<query>` preserving any active mall scope.~~ **REVERSED (moot) session 107** — Map drops the SearchBar entirely per D20 reversal. The redirect-to-Home behavior would never fire; the SearchBar `onSubmit` API extension shipped commit `90a03a8` stays in place but no consumer calls it. (Retain the prop so a future "search-on-Map" reversal-of-the-reversal can wire it in trivially.) | David, session 107 iPhone QA. |

**All 27 decisions (D1–D27) are frozen as of session 106.** Implementation arc proceeds against this spec.

---

## Component contract — `<PostcardMallCard>`

```tsx
type StampGlyph = "home" | "map" | "profile" | "saved";

interface PostcardMallCardProps {
  mall: Pick<Mall, "id" | "slug" | "name" | "address" | "city" | "state" | "zip">
        | "all-kentucky";   // "All Kentucky" scope variant
  stampGlyph: StampGlyph;
  onTap?: () => void;       // Default: open MallSheet
}
```

**Render contract:**
- Card surface: `postcardBg`, 12px radius, `shadow-postcard`, `1px` border at `rgba(42,26,10,0.10)`, padding `16px`.
- Layout: flex row, `align-items: center`, `gap: 14px`, `position: relative`.
- Text-block (flex 1, `padding-right: 28px` to keep address clear of cancellation ink):
  - "from:" — Lora italic 18 / inkMuted.
  - Mall name — Lora 26 / 500 / inkPrimary, `WebkitLineClamp: 2`.
  - Address row — Lucide MapPin 13 + system-sans 13 / inkMid, single-line ellipsis. For `"all-kentucky"`: literary subtitle ("5 active locations · Louisville to Lexington") rather than postal address.
- Cancellation SVG: absolute, `right: 54px`, `top: 50%`, `translateY(-50%) rotate(-6deg)`, 84×38 viewBox, 5 wavy paths, 1.6px stroke `inkPrimary`, opacity 0.42, `pointer-events: none`, `z-index: 2`.
- Stamp: 52×52, flex-item `align-self: center`, `1.5px dashed greenBorder` rim with 4px padding, inner solid green fill 2px radius, glyph 26px in `greenOn`. Glyph SVG resolved from `stampGlyph` prop.

**Tap behavior:** entire card is tappable (button role). Default `onTap` opens MallSheet (existing primitive). Consuming pages can override for special cases.

---

## BottomNav delta

Before (today, 5 tabs role-conditional):
```
Home · Profile · Saved (FlagGlyph) · Booths · [My Booth | Admin]
```

After (R10, 4 tabs flat):
```
Home · Map · Profile · Saved (Leaf + count pill)
```

- **Booths** retires entirely. Three jobs redistribute per D2.
- **Saved** glyph swaps to leaf; badge swaps to count pill (Times-New-Roman numeral in green-on pill).
- **My Booth / Admin** entry points relocate to Profile tab inline (vendor + admin role-conditional links).
- **All 4 tabs visible to all roles.** Role-conditional content lives one level deep, not in the nav.

---

## /map page — structural spec

```tsx
// app/map/page.tsx
const [scope, setScope] = useScopeFromUrl();              // mall | "all-kentucky"
const [peekedMallId, setPeekedMallId] = useState(null);   // peek state, transient

<TabPageMasthead />                         // wordmark hero (~86px)
<PostcardMallCard mall={scope} stampGlyph="map" />
<SearchBar onSubmit={(q) => router.push(`/?q=${q}${scopeParam}`)} />  // redirects to Home (D27)
<div className="map-body">
  <InteractiveMap
    pins={scope === "all-kentucky" ? allMalls : [scope]}
    selectedMallId={scope === "all-kentucky" ? null : scope.id}  // committed selection
    peekedMallId={peekedMallId}                                  // transient peek (D26)
    onPinTap={(mallId) => setPeekedMallId(mallId)}
    onMapTap={() => setPeekedMallId(null)}
  />
  {peekedMallId && (
    <PinCallout
      mall={byId(peekedMallId)}
      anchor={pinScreenPosition(peekedMallId)}
      onCommit={() => { setScope(byId(peekedMallId)); setPeekedMallId(null); }}
    />
  )}
</div>
<BottomNav active="map" />
```

- **No bottom card.** Map fills body height between SearchBar and BottomNav.
- **Two interaction states layered:** committed scope (URL-backed, drives card + map zoom) and transient peek (component state, drives callout visibility).
- **Scope state** lives in URL query (`?mall=<slug>` or absent for all-Kentucky), composes with existing MallSheet selection. Peek state is **NOT** URL-backed — it's a transient UI-only state that doesn't survive navigation.
- **`setScope`** updates: card animates name; map zooms (provider API call).
- **`<PinCallout>`** is a new presentation primitive (see component contract below) — small, anchored to the tapped pin, dismissible.

## Component contract — `<PinCallout>`

```tsx
interface PinCalloutProps {
  mall: Pick<Mall, "id" | "slug" | "name" | "hero_image_url">;
  boothCount: number;
  findCount: number;
  anchor: { x: number; y: number };  // screen-space position of the pin
  onCommit: () => void;
}
```

**Render contract:**
- Surface: `paperWarm`, `1px` hairline border, 10px radius, `shadow-callout` (heavier than card shadow).
- Layout: flex row, `align-items: center`, `gap: 10px`, padding `8px 12px 8px 10px`, `min-width: 200px`.
- Hero thumb: 36×36, 6px radius, sourced from `mall.hero_image_url` (already on schema per migration 016). Falls back to a paper-warm placeholder if null.
- Mall name: Lora 13.5 / 500 / inkPrimary, single-line ellipsis, `max-width: 130px`.
- Stat row: Lora italic 11 / inkMuted with TNR booth/find counts in green (e.g. *"**14** booths · **86** finds"*).
- Chevron: 14px Lucide ChevronRight in green, on the right.
- Triangular tail: bottom-center pointing down at the pin (CSS borders + `drop-shadow` filter).
- Position: `transform: translate(-50%, calc(-100% - 12px))` — anchored above the pin's tip with a 12px gap.
- z-index: 10 (above pin, above map).
- Tap the entire callout → `onCommit`.

---

## Implementation sequencing (smallest → largest)

Per `feedback_smallest_to_largest_commit_sequencing.md`:

1. **Token additions** — add `postcardBg`, `shadowPostcard`, `shadowCallout`, basemap palette tokens (`map-cream`, `map-cream-2`, `map-water`, `map-water-2`, `map-park`, `map-label`), count-pill background tokens to `lib/tokens.ts`.
2. **`<PostcardMallCard>` primitive** — pure presentation, no wiring. Add a smoke-test page (similar to `/search-bar-test` from session 102) under `/postcard-test` for iPhone QA in isolation.
3. **`<PinCallout>` primitive** — pure presentation. Smoke-test alongside PostcardMallCard.
4. **`<TabPageMasthead>` primitive** — large wordmark hero, used on root-level tab pages.
5. **BottomNav redesign** — swap Saved glyph + add count pill + add Map tab + retire Booths label/route. Profile tab gains role-conditional inline links to /my-shelf and /admin.
6. **Home (`app/page.tsx`)** — replace existing MallScopeHeader with `<TabPageMasthead> + <PostcardMallCard stampGlyph="home"> + <SearchBar>`. Existing feed below is unchanged.
7. **Saved (`app/flagged/page.tsx`)** — same swap. `stampGlyph="saved"`.
8. **`/map` page** — new route. Postcard card + search bar + interactive map body + peek-callout state machine. `stampGlyph="map"`. SearchBar `onSubmit` handler routes to `/?q=...&mall=<slug>` per D27.
9. **MallSheet integration** — wire `<PostcardMallCard onTap>` to existing MallSheet. Should compose without primitive changes.
10. **Map-provider integration** — Mapbox custom-styled per D25 (cartographic warm-cream basemap). Pin rendering, scope-driven zoom, peek-then-commit on pin tap (D26). **This is the largest task; merits its own session.**
11. **Booths route disposition** — preserve `/shelves` URL as a 301 redirect to `/map` for backwards compatibility, OR delete entirely. Decide at implementation time based on outbound link audit.

Sub-tasks 1–5 can ship as a primitive-layer arc in one session. 6–9 follow as a tab-redesign arc. 10 is a self-contained map-integration arc. 11 is the cleanup commit.

---

## Open implementation questions

These are **NOT** design decisions — they're implementation-time picks deferred to the relevant arc:

| Question | Options | Notes |
|----------|---------|-------|
| Map provider | Mapbox / Google Maps / Leaflet + Stadia | **Resolved session 107 → Mapbox.** See [Map provider — recommendation memo](#map-provider--recommendation-memo-session-107) below for rationale, projected-traffic numbers, fallback path, and account-setup HITL. |
| Pin clustering | Yes / no for phase 1 | Skip for now (5 active malls). Add a clustering layer when location count >15 OR pin overlap becomes an issue. |
| Map interaction — pan/zoom limits | KY-bounded / unconstrained | Constrain to KY bounding box for phase 1 (zooms beyond reveal empty map; bad UX). |
| `/shelves` route disposition | 301 redirect / delete / keep as deprecated | Audit outbound links (vendor invitations, admin dashboards, share links) before deciding. |
| `<TabPageMasthead>` shared with sub-pages? | Yes / no | Default no — sub-pages keep StickyMasthead with back button. Reconsider if visual rhythm reads disjointed. |
| Pin-screen-position for callout anchor | Provider API / DOM measurement | Both Mapbox + Google expose `project(lngLat)` to compute screen-space coordinates. Use the provider API to keep the callout in sync during pan/zoom. |

---

## Map provider — recommendation memo (session 107)

> **Status:** Recommendation ready, awaiting David's call. If accepted, locks the last deferred design-class axis on R10 + unblocks Arc 3 (map integration) for a future session.

### TL;DR

**Pick Mapbox.** Free tier covers Treehouse traffic through Year 2 with margin. Mapbox Studio is the canonical territory for D25 cartographic warm-cream styling — closest match to the design record's palette + italic-Lora region labels at low opacity, no client-side approximation. Account-setup HITL is a single-step access-token grab. Fallback path is Google Maps if Mapbox account setup snags or if a future cost spike materializes.

### Pricing comparison (2026 verified)

| Provider | Free tier (per month) | Beyond free | Custom styling | Commercial use on free? |
|---|---|---|---|---|
| **Mapbox GL JS Web** | **50,000 map loads** | $5/1K (50–100K) → $4/1K (100–200K) → $3/1K (200K+) | Mapbox Studio included on every account; full vector-style expressivity | Yes |
| **Google Maps JavaScript API** | 10,000 dynamic-map loads (Essentials SKU) | ~$7/1K (no universal $200 credit anymore) | Cloud-based JSON style array, free | Yes |
| **Stadia Maps + Leaflet** | 200K credits (~200K tile loads) | $20/mo Starter (1M credits, 3¢/1K) | OpenMapTiles vector schema via Maputnik editor | **No — paid plan required for commercial use** |

A "map load" = one `Map` object initialization on Mapbox/Google. Tile loads on Stadia are per-tile (a single map view with zoom is ~5–15 tiles).

### Projected traffic (Treehouse Finds)

| Phase | MAU | Map loads / user / month | Total map loads / month | Mapbox cost | Google cost | Stadia cost |
|---|---|---|---|---|---|---|
| Beta (now) | ~50–200 | ~5–10 | ≤2,000 | $0 | $0 | $20/mo (forced) |
| Year 1 | 1K–2K | ~10 | 10–20K | $0 | $0–70 | $20/mo |
| Year 2 (optimistic) | 5K–10K | ~10 | 50K–100K | $0–250 | $280–700 | $20/mo |

**At every realistic projection through Year 2, Mapbox is free or cheapest. Stadia is the only provider that forces a paid plan from day one** because its free tier is non-commercial.

### Custom-styling expressiveness for D25

D25 calls for a *cartographic warm-cream* basemap: cream landmass (`#efe6cf`), tan lowland (`#e6d9b8`), sage water (`#c5d6c4` / `#aac3aa`), white roads, italic-Lora region labels at low opacity. This is the heart of the postcard / place-identity vocabulary — not a polish item.

| Provider | D25 styling fit | Effort estimate |
|---|---|---|
| **Mapbox Studio** | Direct. Vector layers + per-layer paint properties + custom font upload (Lora). Layer-isolated label rotation + per-zoom opacity ramps. | ~half-day setup; style URL is a config value the runtime reads. |
| **Google Maps style array** | Possible but verbose. JSON `featureType` + `elementType` + `stylers` per layer. **No custom font loading** — labels are Roboto-only on standard tiles. | ~half-day; design record's italic-Lora labels would need a workaround (overlay layer or compromise). |
| **Leaflet + Stadia (vector)** | Possible via Maputnik editor on Stadia's OpenMapTiles vector schema. Label customization comparable to Mapbox. | ~half-day (Maputnik) + Leaflet integration setup. |

**Mapbox > Stadia ≈ Leaflet > Google** on D25 fit. Google is the only one that doesn't support custom font loading on labels — direct hit on D25's italic-Lora requirement.

### Other implementation primitives (peek-then-commit, screen-space anchor)

All three providers expose:
- Marker/symbol layer with feature-state for D26's pin-selected styling (scale +15%, halo).
- Screen-space projection (`map.project(lngLat)` on Mapbox, `Projection.fromLatLngToContainerPixel` on Google, `latLngToContainerPoint` on Leaflet) for `<PinCallout>` anchor positioning.
- Pan/zoom event hooks for repositioning the callout during interaction.

No differentiator here — all three are equivalent for D26.

### Account-setup HITL

**🖐️ Mapbox setup (~5 min, one-time):**
1. Sign up at https://account.mapbox.com/auth/signup/ — free, no credit card needed for the free tier.
2. Create a public access token at https://account.mapbox.com/access-tokens/. URL-restrict to `app.kentuckytreehouse.com` + `*.vercel.app` (preview deployments) so token can't be hijacked off-site.
3. Add `NEXT_PUBLIC_MAPBOX_TOKEN` to Vercel env (Production + Preview + Development).
4. Optional but recommended: add a billing alert at $5/mo so an unexpected traffic spike pages David before a bill lands.

If David later wants to lock in the cartographic warm-cream style as a Studio-hosted style URL (vs inline JSON), one extra step:
5. Open Mapbox Studio → New Style → Monochrome → tune palette per D25 tokens → publish → copy style URL (`mapbox://styles/<user>/<style-id>`) → use in runtime instead of inline.

This second step is design-time, not a blocker for Arc 3 — Arc 3 can ship with an inline JSON style and David can move to Studio later if he wants to iterate on the palette in a visual editor.

### Fallback path

If Mapbox account setup hits a snag (corporate billing requirements, account-creation friction, etc.):
1. **First fallback: Google Maps** with cloud-based JSON styling. Compromise on D25's italic-Lora labels (drop the custom font, keep the palette). Account setup is heavier (Google Cloud project + billing account + API restrictions) but doable.
2. **Second fallback: Leaflet + Stadia Maps** at $20/mo Starter plan. D25 fits cleanly via Maputnik editor on Stadia's OpenMapTiles vector schema. Slightly more runtime integration work because Leaflet is raster-first; vector tile rendering goes through `maplibre-gl-leaflet`.

**Do not switch providers mid-arc** — each requires a different SDK + style format + token grab. The cost of switching post-ship is real.

### Recommendation

**Mapbox.** Reasons (ordered by weight):
1. **D25 fit is direct** — italic-Lora region labels at low opacity is canonical Mapbox Studio. No compromise on the heart of the postcard place-identity vocabulary.
2. **Free tier covers projected traffic through Year 2** with comfortable margin (50K loads/month vs ~20K projected at Year 1).
3. **Account-setup HITL is the lightest** of the three — single-step token grab + URL restriction.
4. **Fallback path is real** — Google Maps is a capable second choice if anything blocks Mapbox. We don't lose the option by trying Mapbox first.

Decision pending David's approval before Arc 3 starts.

---

## Carry-forward (non-load-bearing)

- **Wordmark hero size 86px** is a deliberate evolution from session 88's 30→40 dial. Reason: tab pages don't share the masthead row with back/right slots, so the wordmark can grow to fill more of the available vertical space. The 40px inline pattern is preserved on sub-pages.
- **Postcard primitive composes with future R-items.** R5b (mall hero photos in the feed) could optionally swap the card-only treatment for a card-with-hero variant (image fills the top half of the card, postcard text below). Not in R10 scope.
- **Stamp could become animated on tab change.** When user taps a different tab, the stamp glyph could cross-fade. Phase-2 polish if real-device QA reads as static. Not in R10 scope.
- **Cancellation-line variation per mall.** Could deterministically vary the wave amplitudes per `mall.id` so each mall's card has a slightly different cancellation pattern (subtle "stamped at this post office" feel). Cute idea, parked.
- **All-Kentucky scope address line copy.** Currently "5 active locations · Louisville to Lexington" — composes from `count(active malls)` + bounding-box city pair. If location footprint grows beyond Louisville-Lexington, copy auto-updates from city extents.

---

## What survives from V1 / V2 / V3 / V4 in V5

V1 contributed the structural-axis framing (where does map slot in nav, pin treatment, bottom-card spec). The persistent-card thesis killed V1's bottom-card spec entirely.

V2 contributed:
- Postcard mall card primitive
- 4-tab BottomNav
- Saved glyph + count pill
- Wordmark hero masthead
- Search bar with "or styles"
- "No bottom card on map" thesis

V3 contributed:
- Component-isolated rendering
- Page-contextual stamp glyph (D13)
- Dashed-border stamp rim instead of perforation pseudo-elements (D14)

V4 contributed:
- Square stamp (D12 — David's redirect)
- Wavy SVG ink cancellation (D17 — David's redirect)
- Tighter footprint with cancellation overlapping stamp left edge (D18)

V5 contributed:
- Cartographic warm-cream basemap (D25)
- Peek-then-commit interaction via `<PinCallout>` primitive (D26 — refines D23)
- Search-on-Map redirects to Home (D27)
- Three-state Map page rendering: All-Kentucky overview, specific-mall, peek-callout

---

## Status notes for future sessions

- **R10 graduates 🟡 Captured → 🟢 Ready in session 106 (this session).** Both the postcard primitive (V4) and the `/map` page body (V5) are locked in the same session.
- Implementation arc is the next significant feature ship. Sequence per the implementation sequencing above.
- The first commit of the implementation arc should land the smoke-test page (`/postcard-test`) so iPhone QA can isolate `<PostcardMallCard>` + `<PinCallout>` before they ship to live surfaces. Per `feedback_testbed_first_for_ai_unknowns.md` — same shape of risk applies: card composes across multiple consumers, so primitive-isolated validation first.
- **Map provider choice (Mapbox / Google / Leaflet) is the only deferred design axis.** Cartographic warm-cream styling per D25 IS canonical Mapbox Studio territory; if Mapbox cost is gated, the closest fallback is Google Maps with style-array (more verbose, less stylable but cheaper). Decide in the map-integration arc, not now.
