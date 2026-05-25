# Share My Shelf — Enrichment Design Record (Shape C)

> Session 196 — multi-session arc design pass for Share My Shelf vendor marketing toolkit.
> Cost-shape: **Shape C** (Multi-format vendor marketing toolkit, 4-6 session arc).
> Status: 🟢 Design pass in progress (V1 mockup shipped; pre-V2 scoping pending).
>
> **Strategic framing (David verbatim session 196):** *"This is a huge selling feature for vendors to promote their booth on social without a lot of effort on their part. The interface should feel intuitive but equally important is that the end result needs to be share worthy."*
>
> **Predecessor:** Session 152 shipped + parked + session 196 revived (commits 210b424 + 24e27fc). Parked code at `components/ShelfImageTemplate.tsx` + `components/ShelfImageShareScreen.tsx` is the baseline this enrichment composes ONTO; the structural redesign supersedes the single-format 1080×1350 ship.

---

## 1. Strategic frame

Share My Shelf carries three load-bearing roles in the project's strategic posture:

1. **Vendor-value selling feature** — per `project_vendor_value_first_prioritization` ✅ Promoted. Paid users are vendors; the vendor-marketing toolkit is a key adoption driver for vendor-side beta + GA paid conversion. 5th cumulative firing post-promotion this session (after sessions 184-187 vendor-profile-enrichment arc).
2. **Booth-tier Outbound affordance in the share lattice** — per `project_layered_engagement_share_hierarchy` ✅ Captured at session 137. The lattice anticipates the Booth-tier Outbound role carrying curated-experience load (Email Window + Shelf Image are both Booth-exclusive). Mall + Find tiers stay light (SMS + QR + Copy Link).
3. **Canonical digital→physical bridge for vendor marketing** — per `project_treehouse_thesis_digital_to_physical_bridge` ✅ Promoted. The Facebook/Instagram social post IS the bridge that drives real foot traffic into the real booth. The QR on the captured asset is the cleanest possible "tap → go visit this place" affordance.

---

## 2. Locked cost-shape decisions (session 196 pre-V1)

| Axis | Pick | Rationale |
|---|---|---|
| Cost shape | **Shape C** (Multi-format vendor marketing toolkit, 4-6 session arc) | Vendor-value selling feature framing makes Shape A/B undershoot the bar. David verbatim: *"the end result needs to be share worthy."* |
| Format set | **Story (1080×1920) + Feed (1080×1350)** | Story leads (5× vendor reach per Spotify/Strava benchmark); Feed retains session 152 baseline. Per-find + X/FB cover deferred to Tier B / future arcs. |
| Vendor input depth | **Zero-input baseline + regenerate + reorder** | Matches Spotify Wrapped / Strava pattern. Effort floor critical. Regenerate = re-roll the 6 finds shown; reorder = drag-arrange the photo grid. No forms, no headlines to write. |

---

## 3. Reference-first scan (cross-domain share-worthy auto-generated assets)

| Reference | Format | Effort | Brand depth | What makes it work |
|---|---|---|---|---|
| **Spotify Wrapped** | 10-15 cards, 1080×1920 Stories | Zero input | Heavy (pink/green) | Multi-card narrative arc + data-driven storytelling + Story-first |
| **Strava workout share** | 4-6 formats per workout | Zero input | Heavy (orange) | Auto-generates immediately; map + stats; one-tap to FB/IG/Twitter |
| **Apple Fitness Awards** | Story badge + cards | Zero input | Heavy (purple) | Story-format; achievement narrative |
| **Peloton workout cards** | 3-4 formats post-class | Zero input | Heavy | "I just rode X miles" canonical hero |
| **Pinterest "Generate Pin"** | Static pin from board | 1 input (pick board) | Pinterest red minimal | One-tap generation + share |
| **Canva Print/Etsy toolkit** | Multi-template editor | High input | Subtle (vendor) | Template picker + WYSIWYG editor |
| **Etsy Shop Stories** | Story builder | Medium input | Subtle | Vendor-driven; minimal chrome |

**Convergent pattern across the canonical references (Spotify/Strava/Apple/Peloton):**

1. **Story-format leads, Feed-format follows.** Stories generates ~5× more vendor → shopper exposure than Feed posts because Story dwell time + tap-through behavior favors striking branded chrome.
2. **Multi-card narrative beats single card.** Spotify ships 10+ cards (not 1 hero); Strava ships 4-6; Apple Fitness ships 3+. Vendors who tap "share" want to post a SEQUENCE.
3. **Zero-input baseline; optional regenerate.** None of the canonical share-worthy products ask the user anything. The user reviews, optionally regenerates, ships.

Canva/Etsy patterns (vendor-edit-rich) inform the rarer customization-edge cases but NOT the canonical baseline.

---

## 4. V1 mockup — Axis A (Story format composition)

V1 spans the highest-leverage structural axis: **Story format composition**. Cascades to all other choices once locked.

File: [docs/mockups/share-my-shelf-enrichment-v1.html](mockups/share-my-shelf-enrichment-v1.html)

| Frame | Story composition | Vendor posts as | References | Trade-off |
|---|---|---|---|---|
| **α Single-card Story** | One composite 1080×1920 card: booth header + 4-5 photo grid + CTA + QR/wordmark footer | 1 Story slide | Pinterest pin / Etsy Shop Story | Lowest cognitive load to view + share; single hero composition; vendor posts ONE slide |
| **β Multi-card Story sequence** | 3-5 separate 1080×1920 cards: (1) booth-hero card with vendor identity + "this week at the booth" hook; (2-4) individual find cards each featuring 1-2 photos + caption + price; (5) CTA card with QR + "Visit the booth" close | 3-5 Story slides as sequence | Spotify Wrapped / Strava / Apple Fitness | Canonical share-worthy pattern at scale; multi-slide narrative; HIGHER share completion (each card = own swipe-through engagement); 4-6× more brand impressions per share |
| **γ Tappable Story template** | Single 1080×1920 with 4-6 photo tap-zones; viewer taps each to see find detail/price on next slide | 1 Story with tap interactions | Instagram Story templates / Polls / Question stickers | Highest viewer engagement format; requires viewer to be actively curious; Story tap-zones less guaranteed to render across all clients |

**V1 question:** Which Story-format composition makes the right share-worthy bar at scale?

After V1 pick, V2 spans whichever sub-axis is most open (Brand depth OR Feed↔Story relationship).

---

## 5. Pre-V1 open questions (to surface alongside V1 pick)

These don't need answers BEFORE V1 pick, but will be locked at the same point David picks a frame so the design record is execution-spec ready:

- **Q1**: Caption strategy — is the caption auto-generated AI copy (per session 152's clipboard-copy pattern), templated copy with vendor-name substitution, or vendor-written? Affects effort floor.
- **Q2**: Regenerate scope — does "regenerate" re-roll which 6 finds AND/OR re-roll the AI caption AND/OR re-roll the visual template? Composability ladder.
- **Q3**: Capture trigger — does the multi-card Story sequence generate ALL cards upfront (slow capture, all ready) or progressive (1st card immediate, subsequent on demand)?
- **Q4**: Brand identity depth (Axis B) — light Treehouse (subtle leaf footer) / balanced (leaf + wordmark visible) / heavy (leaf-as-compositional-motif Spotify Wrapped style)? Likely V2 axis.
- **Q5**: Feed↔Story relationship (Axis C) — is the Feed format auto-derived from Story (e.g. condensed single composite OR Story-card-#3-repurposed) or independently designed?

---

## 6. Implementation arc sequencing (preliminary; refined after V1 + V2 picks)

The 4-6 session arc decomposes into ~5 implementation arcs:

| Arc | Scope | Sessions |
|---|---|---|
| **Arc 1 — Substrate refactor** | Refactor `ShelfImageTemplate` from monolithic 1080×1350 to per-card components (StoryHeroCard / StoryFindCard / StoryCtaCard / FeedComposite). Smoke route `/share-shelf-test` for primitive validation per `feedback_testbed_first_for_ai_unknowns` ✅ Promoted. | 1 |
| **Arc 2 — Wrapper UX** | New `<ShelfImageShareScreen>` with regenerate + reorder affordances + multi-card carousel preview. Native share path adapted for sequence (mobile native share sheet accepts multi-file payload via `navigator.share({ files: [...] })`). | 1 |
| **Arc 3 — Brand identity pass** | V2-axis fill-refinement on brand chrome (post-V1 pick). Treehouse leaf-as-compositional-motif OR balanced. Tested across Story + Feed formats. | 1 |
| **Arc 4 — Caption + copy gen** | AI-generated caption per format (calls existing post-caption Sonnet route OR new shelf-caption route). Caption variations for Story sequence vs Feed single. | 1 |
| **Arc 5 — Polish + iPhone QA** | Real-content seeding + iPhone QA dial bundle + html2canvas-pro cross-browser validation + Supabase CORS verification across multi-card capture sequence. | 1 |
| **Arc 6 (optional) — Tier B extension** | Per-find shareables + X/FB cover format + scheduled share prompts + share-success analytics. Likely follow-on after Arc 1-5 ships. | 1+ |

---

## 7. Tier B headroom (explicit doors-left-open)

Per `feedback_design_record_as_execution_spec` Tier B explicit headroom pattern (session 124 canonical):

- **B1 — Per-find shareable** (1080×1350 single-find card with photo + title + price + booth CTA). Different JOB than Shelf summary (Shelf = booth promo; per-find = item promo). Lattice-aware ship across Find tier.
- **B2 — X/FB cover format** (1200×675). Lower priority but cheap to add once Arc 1-2 substrate exists.
- **B3 — Scheduled share prompts** ("you have 3 new finds this week — share to FB?"). Push notification or in-app banner.
- **B4 — Share-success analytics dashboard** (share counts + channel breakdown + estimated reach + new visitor attribution via UTM-tagged QR).
- **B5 — Template picker** (alternate visual templates same content: editorial / bold / minimal). Currently zero-input picks canonical template; this opens up the rare customization-edge case.
- **B6 — Pre-capture vendor inputs** (pick which finds / write own headline). For vendors who want Canva-level control.
- **B7 — Automated weekly digest** (full automation: auto-generate weekly, vendor reviews + approves).
- **B8 — Vendor profile enrichment integration** — Story header could surface session-184-187 vendor profile fields (avatar / bio / social URLs) for stronger booth identity.
- **B9 — IG Reels / TikTok short-form** (if vendor adoption signals video appetite). Different capture pipeline entirely.
- **B10 — Direct FB Pages integration** (post to FB without manual share step, via FB Graph API). Requires OAuth + permissions.

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| html2canvas-pro performance on multi-card capture (3-5 cards) on low-end Android | Med | Med | Capture progressively (1st card immediate); fallback to single Feed format if any card fails |
| iOS Safari `navigator.share({ files: [...] })` multi-file payload compatibility | Med | High | Test early in Arc 2; fallback to one-at-a-time share if multi-file rejected |
| Supabase storage CORS edge cases on parallel image loads (6 photos × 5 cards = 30 image fetches) | Low | Med | Confirmed cooperative for single-card at session 152; smoke-test in Arc 1 |
| Vendor UX confusion on "regenerate vs reorder" affordance | Med | Low | Clear inline labels; tooltips on first use; analytics on which affordance is used more |
| AI caption quality variance across vendor inventory types | Med | Med | Per-format caption templates seeded with strong vendor-tone copy; AI variance bounded to known-good patterns |
| Multi-card story sequence dwell time too long (vendor abandons share mid-capture) | Low | Med | Progress UI during capture; total target < 4s on iPhone 12+ |
| Story format becomes obsolete (IG/FB Story usage trends shift) | Low | Low | Multi-format design hedges; Feed format stays; format set is design-record-level lever |

---

## 9. Memory rules driving this design record

- `project_vendor_value_first_prioritization` ✅ Promoted — vendor-value gate fires 5th post-promotion
- `project_layered_engagement_share_hierarchy` — Booth-tier Outbound role per lattice
- `project_treehouse_thesis_digital_to_physical_bridge` ✅ Promoted — share-to-FB IS the bridge
- `feedback_reference_first_when_concept_unclear` ✅ Promoted — 6th cumulative firing (Spotify/Strava/Apple/Peloton/Pinterest/Canva/Etsy scan)
- `feedback_mockup_options_span_structural_axes` ✅ Promoted — V1 spans Axis A composition only
- `feedback_pre_mockup_prose_model_first` ✅ Promoted at session 167 — pre-V1 scoping locked 2 axes before mockup variables exceeded 22
- `feedback_v2_options_before_drafting` ✅ Promoted-via-memory at session 135 — Q1-Q5 surfaced as pre-V1 questions to lock with V1 pick
- `feedback_design_record_as_execution_spec` ✅ Promoted — 33rd+ cumulative firing; design record + V1 mockup committed together per Design Agent rule (session 56)
- `feedback_triage_cost_shape_before_design_pass` ✅ Promoted-via-memory at session 132 — 2 cost-shape triages (Shape A/B/C session-196 outer + Shape A/B/C this design pass inner)
- `feedback_testbed_first_for_ai_unknowns` ✅ Promoted at session 118 — Arc 1 ships `/share-shelf-test` smoke route per pattern
- `feedback_smallest_to_largest_commit_sequencing` ✅ Promoted-via-memory at session 88 — implementation arcs sequence smallest→largest within each session

---

## 10. Next step

Surface [V1 mockup](mockups/share-my-shelf-enrichment-v1.html) → David picks Frame α/β/γ → V2 mockup (or prose) spans next-highest axis (Brand depth OR Feed↔Story relationship) → freeze D1-D? decisions → Arc 1 implementation begins next session.
