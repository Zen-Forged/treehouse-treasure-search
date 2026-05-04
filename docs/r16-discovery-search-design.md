# R16 — Discovery: search bar on Home — Design record

> **Status:** ✅ **Shipped session 105** (2026-05-03) end-to-end. Tasks 1–7 sprint + custom-caret bug-class kill (round 5 structural fix) + backfill polish. 17 runtime commits.
> **Status history:** 🟡 Captured (102) → 🟢 Ready (102, same session) → ✅ Shipped (105). First R-item to graduate Captured → Shipped across just 2 sessions of work (102 design + 105 implementation, with sessions 103–104 running other arcs in between).
> **Roadmap entry:** [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md#r16--discovery-search-bar-on-home-) — R16.
> **Mockups:**
> - [`docs/mockups/discovery-browse-by-v1.html`](mockups/discovery-browse-by-v1.html) — V1 (3-frame "Browse by..." landing page exploration; **rejected** as over-designed for phase 1).
> - [`docs/mockups/discovery-search-bar-v1.html`](mockups/discovery-search-bar-v1.html) — V1.5 (search bar on Home, three states: idle / active-with-results / empty).
> - [`docs/mockups/discovery-search-bar-v2.html`](mockups/discovery-search-bar-v2.html) — V2 picked. Same as V1.5 with `PiBinocularsFill` lead icon.
> **Effort:** M (2 sessions: this one = design-to-Ready, next = implementation + backfill).
> **Purpose of this doc:** Freeze the design + data-layer decisions so the implementation session can run as a straight sprint against a spec, not a re-scoping pass.

---

## Origin (session 102)

David asked where search functionality fell on the roadmap during session-open standup. Search was parked post-beta with no R-item; pagination + image-cataloging concerns were separately captured. Conversation surfaced that the three are **one product question dressed as three** — *"how do shoppers find specific things in a growing feed?"* — and that the dependency runs:

```
image-extracted attributes → tag-based filtering → pagination on a now-narrowable feed
```

Session 102 design pass:

1. **Reference-first** (per [`feedback_reference_first_when_concept_unclear.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_reference_first_when_concept_unclear.md)) — 6 cross-domain references (1stDibs, Cooper Hewitt, Pinterest, Are.na, Letterboxd, Apartment Therapy). Anti-references: Etsy, eBay, Depop (query-first / conversion-optimized).
2. **V1 mockup** = 3 structural frames for a "Browse by..." landing page (flat tag wall / hierarchical rows / editorial + chip rail).
3. **David's pivot:** *"The design approach is minimalistic magic, surfacing the right elements in the right context without over explaining... I'm honestly thinking all we need is a search bar at the top of the feed page."* Provided glass-morphism CSS for the bar.
4. **V1.5 mockup** = the search-bar approach, three states.
5. **V2 mockup** = V1.5 with `PiBinocularsFill` lead icon (more on-brand; binoculars = scout the landscape; magnifying glass = database query).

NEW memory captured this session: [`feedback_minimalistic_magic_no_destination_for_one_input.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_minimalistic_magic_no_destination_for_one_input.md).

---

## Scope

R16 makes the existing 30-day Home feed **searchable in place**, backed by AI-extracted tags written at post-publish time. It also ships the data-layer primitives (tag column + tsvector + GIN index + Postgres `websearch_to_tsquery`) that any future R-item touching discovery (R10 map, R5b caps, future R5b-derived "trending tags") can reuse.

**It does NOT ship:**
- A new destination page (`Browse by...` was killed).
- Pagination on the Home feed itself. R16 narrows the feed via search/scope; pagination only matters within the narrowed result set, which falls below the existing degradation threshold (~100 posts).
- The filter glyph's interactive behavior. Phase-1 hook only.
- Search analytics events. Free addition under R3 in a follow-up if shopper-search behavior becomes interesting.

---

## Design decisions (frozen 2026-05-02)

| # | Question | Decision | Source |
|---|----------|----------|--------|
| D1 | Where does discovery live — new tab / new page / in-place affordance? | **In-place affordance on Home only.** Search bar slotted between `StickyMasthead` and the mall scope block. No new BottomNav tab; no new destination page. | David, session 102 — *"all we need is a search bar at the top of the feed page."* |
| D2 | Bar placement — above the mall scope block, or inside the masthead row (Twitter-style focus mode)? | ~~Above the mall scope block.~~ **REVERSED session 105** → BELOW the mall scope block. David: *"the search should probably be under the mall location filter."* The mall picker is the primary "where am I shopping" choice; search is secondary "what am I looking for here." Subordinate visual position matches conceptual subordination + reinforces the digital-to-physical thesis. | David, session 105 iPhone QA. |
| D3 | Visual treatment — flat / outlined / glass / inset? | ~~Glass-morphism, pill-shaped — 65% white bg + `backdrop-filter: blur(10px)` + 1px subtle border + soft 8/24 shadow.~~ **REVERSED session 107** → form-input bg (`v1.postit` + `v1.inkHairline` border). Pill shape (`borderRadius: 999`) + `10px 18px` padding preserved — search vocabulary stays distinct from rectangular form fields. Focused state: green-tinted border + 3px green ring shadow. David's call during R10 Arc 2 iPhone QA: *"Change the search bg color to match the color of the other text input fields i.e. request booth page."* The glass-morphism aesthetic was tied to the white-translucent bg — once we matched form-input cream, the blur became noise. | David, session 107 iPhone QA. |
| D4 | Lead icon — magnifying glass or binoculars? | ~~`PiBinocularsFill`.~~ **REVERSED session 107** → Lucide `Search` (magnifying glass). David's call during R10 Arc 2 iPhone QA: *"i still like the concept but rather it be clear than too clever."* The binoculars-as-scout-the-landscape framing was on-brand but read as opaque against the minimalistic-magic rule. Universal-recognition wins over thesis cleverness for a single-purpose primitive. | David, session 107 iPhone QA. |
| D5 | Right-side glyph — present in phase 1? | ~~Yes, present but inert. `PiSlidersHorizontal` in regular weight. Phase-2 hook for axis filtering.~~ **REVERSED session 105** → RETIRED. David: *"Remove the filter icon on the far right, unless it serves a purpose."* Inert iconography on a single-purpose primitive read as visual noise against the minimalistic-magic rule. Add back when there's real interactive behavior to wire to. Divider went with it (its only job was separating the two icons). | David, session 105 iPhone QA. |
| D6 | Search target columns | **Multi-column tsvector** over `posts.title` + `posts.caption` + `posts.tags` + `vendors.display_name` + `vendors.booth_number` + `malls.name`. Single `websearch_to_tsquery` call against a generated tsvector + GIN index. Sub-50ms even at 10k rows. | Session 102 — confirmed by David. |
| D7 | Search scope — within selected mall, or across all malls? | **Respects the current mall scope by default.** The mall picker is a pre-existing user signal — search inherits it. When results are empty, an italic "Search all of Kentucky →" CTA appears as a contextual escape hatch (only on empty). | Session 102. |
| D8 | Tag extraction — new AI route, or enrich existing call? | **Enrich the existing `/api/post-caption` Sonnet 4.6 vision call.** Same image, same model, ~+150 tokens output, no new round-trip. Tags returned in the same JSON response as title + caption. | Session 102 — token/cost minimization. |
| D9 | Tag schema — flat `text[]` or typed columns (material/era/object_type)? | **Flat `text[]`.** 5–6 lowercase strings per find drawn from a Claude-picked subset of {material, era, object_type, color, subject, category} axes. Simpler enrichment, simpler search. Promote to typed columns only if shopper data shows demand for axis-narrowed filtering (Frame B from the V1 mockup). | Session 102 — phase-1 minimum viable. |
| D10 | Backfill existing posts | **One-shot `scripts/backfill-tags.ts`** runs the enriched `/api/post-caption` over existing rows that have NULL tags. Cost estimate at ~120 posts: ~$0.50 in Sonnet vision calls. | Session 102. |
| D11 | URL shape — modal-style state or query-param? | **Query param `?q=brass`.** URL-shareable; browser back exits search cleanly; respects mall picker via co-existing `?mall=<slug>`. | Session 102 — composes with existing mall URL state. |
| D12 | Empty-state UI when no results in current mall | ~~Single italic Lora line + outlined green CTA. CTA: "Search all of Kentucky →" routes to same Home with mall scope cleared.~~ **REVERSED session 105** → italic Lora subtitle ALONE; widen-to-all-Kentucky CTA DROPPED. David: *"search only the selected mall location."* If users want to broaden, they use the mall picker themselves — no hand-holding affordance per the minimalistic-magic rule. Copy: *"Nothing matching '{query}' at {mall} yet."* (or *"Nothing matching '{query}' yet."* on the all-Kentucky scope). | David, session 105 iPhone QA. |
| D13 | Active-results UI — labels / count / matching-reason chips? | **Nothing.** No "12 results" header, no matching-reason chips on tiles. Per the design philosophy: *"we don't need to call it out anywhere."* The magic is that things just appear. | David, session 102 — minimalistic magic. |
| D14 | Sticky behavior — does the bar stick on scroll? | **No, scrolls away with the masthead.** Sticky search is heavier visual chrome; user can swipe up to expose it. Reconsider only if real-content QA flags it. | Session 102 implementation default. |
| D15 | Placeholder copy — "Search…" or "Spot…" verb? | **"Search finds, booths, or styles"** (kept). David flagged "Spot…" as potentially clever-for-clever's-sake; "Search" is the universal mental model. Easy revision if real-device QA reads stale. | Session 102 — defer to convention until evidence demands shift. |

**All 15 decisions (D1–D15) are frozen as of session 102.** Implementation session can proceed as a straight sprint against this spec.

---

## Schema

New migration: `supabase/migrations/019_post_tags_and_search.sql`.

```sql
-- ── Tags column ───────────────────────────────────────────────
-- Lowercase strings, 5–6 typical, populated by enriched
-- /api/post-caption at write time. Empty array (not NULL)
-- when extraction fails so search queries don't need NULL guards.
ALTER TABLE posts
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';

-- ── Generated tsvector for full-text search ──────────────────
-- Concatenates title + caption + tags + (joined later via search query)
-- vendor display_name + mall name. Stored generated to avoid runtime
-- recomputation; index gets full-text speed; small storage cost
-- (one tsvector per post).
ALTER TABLE posts
  ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')),                'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(tags, '{}'::text[]), ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(caption, '')),              'C')
  ) STORED;

-- GIN index on the generated tsvector
CREATE INDEX idx_posts_search_tsv ON posts USING GIN (search_tsv);

-- Optional secondary index on tags for ILIKE / array-contains queries
-- (cheap given small array per row + GIN supports text[] natively)
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
```

**Why a generated tsvector and not a separate trigger-maintained column?** Postgres 12+ supports `GENERATED ALWAYS AS ... STORED`. Auto-updates on INSERT/UPDATE; no trigger to maintain; zero application-layer concern. The vendor + mall name parts are NOT in the generated column because they live in joined tables — they're added at query time as a runtime tsvector union. See "Search query" below.

**Why include weights (A/B/C)?** Title matches rank highest; tag matches mid; caption matches lowest. Means "brass candlestick" beats "rambling caption that mentions brass" without needing per-column queries.

**Why default `'{}'` not NULL?** Empty array is safer for downstream code — no NULL guards, can `&&` against another array, can iterate without crashing. Also: posts that fail enrichment shouldn't be invisible to text search; the title+caption parts still index correctly.

**RLS:** Existing `posts: public read` policy already returns the new columns. No RLS change.

---

## AI enrichment — extend `/api/post-caption`

[`app/api/post-caption/route.ts:134`](../app/api/post-caption/route.ts) — extend the `system` prompt to include a third return field. Same model, same vision call, ~+150 tokens output.

**New system prompt** (additions in **bold**):

```
You are a writer for Treehouse, a local discovery app for antique and thrift finds.

Given an image, return a JSON object with exactly **three** fields:
- "title": A concise, accurate item name (3–6 words). Be specific: material, era, type. ...
- "caption": One or two sentences, maximum. ...
- **"tags": An array of 5–6 lowercase categorical strings drawn from these axes (pick the ones that apply, skip the ones that don't):**
  **- material (brass, ceramic, wood, glass, cast iron, porcelain, leather, sterling, ...)**
  **- era (victorian, art deco, mid-century, 1970s, ...)**
  **- object_type (lamp, vase, bookend, bowl, painting, bust, mirror, ...)**
  **- color (amber, cobalt, cream, forest green, rust, ...)**
  **- subject (only when applicable — portrait of franklin, horse, eagle, ...)**
  **- category (lighting, kitchenware, decor, art, jewelry, toys, ...)**
  **All tags lowercase. Single words or short phrases. No duplicates. Aim for 5–6, never more than 8.**

Return ONLY valid JSON. No markdown, no code fences.
Example: {"title":"Vintage brass candlestick", "caption":"Carries its age quietly. The kind of piece that looks like it was always there.", **"tags":["brass","candlestick","mid-century","decor","amber"]**}
```

**TypeScript shape change:**

```ts
// Before
type CaptionResponse = { title: string; caption: string; source: "claude" | "mock" };

// After
type CaptionResponse = { title: string; caption: string; tags: string[]; source: "claude" | "mock" };
```

**MOCK_RESPONSES update** at the top of `route.ts`: each mock entry gains a small representative `tags` array. Falls back gracefully if Claude doesn't return tags (older clients during deploy gap).

**No max_tokens bump needed.** Current cap is 200; the additional tags push us to ~260–280 typical, well under the cap. Bump to `max_tokens: 320` for safety margin.

---

## Backfill script

`scripts/backfill-tags.ts` — one-shot, idempotent, resumable.

```ts
// Pseudocode shape
import { getServiceClient } from "@/lib/supabaseAdmin";
import { Anthropic } from "@anthropic-ai/sdk";

async function main() {
  const supabase = getServiceClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, image_url, title, caption, tags")
    .or("tags.eq.{},tags.is.null") // posts that haven't been enriched yet
    .limit(500);

  for (const post of posts ?? []) {
    if (!post.image_url) continue;
    // Fetch image, base64-encode, call Claude with the same enriched prompt
    const tags = await extractTagsFromImage(post.image_url);
    await supabase.from("posts").update({ tags }).eq("id", post.id);
    await sleep(500); // rate-limit cushion
    console.log(`[backfill] ${post.id} → ${tags.join(", ")}`);
  }
}
```

**Why service-role client?** Bypasses RLS; can update tags on every post regardless of authorship. Read-only would also work since RLS allows public reads, but UPDATE needs admin rights.

**Cost estimate at ~120 prod posts:**
- Sonnet 4.6 vision call: ~$0.003 per call (image + ~280 tokens output)
- Total: ~$0.36–$0.50

**Run shape:** `npx ts-node scripts/backfill-tags.ts` from David's local machine with prod creds. Resumable — if interrupted, re-run picks up posts that still have `tags = '{}'`.

---

## Search query

New helper in [`lib/posts.ts`](../lib/posts.ts):

```ts
export async function searchPosts(opts: {
  query: string;
  mallSlug?: string | "all";
  limit?: number;
}): Promise<Post[]> {
  const { query, mallSlug, limit = 40 } = opts;

  // Empty query → fall through to getFeedPosts (caller handles)
  if (!query.trim()) return getFeedPosts(limit);

  let q = supabase
    .from("posts")
    .select(`
      id, vendor_id, mall_id, title, caption, image_url, price_asking,
      status, location_label, created_at,
      vendor:vendors(id, display_name, booth_number, slug),
      mall:malls(id, name, slug)
    `)
    .eq("status", "available")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .textSearch("search_tsv", query, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (mallSlug && mallSlug !== "all") {
    // Need to join through the slug → id resolution; either:
    // (a) pass mall_id directly from the picker (preferred — picker already has it)
    // (b) resolve slug → id via a sub-query (slower)
    // Caller passes mall_id when known; this helper signature simplifies later
  }

  const { data, error } = await q;
  if (error) { console.error("[posts] searchPosts:", error.message); return []; }
  return (data ?? []) as Post[];
}
```

**Notes:**
- `textSearch` with `type: "websearch"` accepts natural-language queries (`"brass candlestick"`, `"art deco lamp"`, `"mid-century"`) without forcing the user to know `&` / `|` operators.
- 30-day window from R5a is preserved — search respects the freshness cutoff.
- Vendor/mall name search isn't in the generated tsvector (because those columns are joined). Two options:
  - **(a)** Add the join into the generated column via a function (complex).
  - **(b)** Run a second query against vendors/malls that match by name and union the IDs into the post query.
  - **(c)** Phase 1: skip vendor/mall name search; rely on title/caption/tags only. Document as known phase-1 limitation. **Recommended — vendor/booth name search adds complexity that the implementation session can decide on; titles + tags cover 80% of intent.**

**Recommendation: ship (c), document, revisit if shopper feedback flags missing vendor/mall search.**

---

## Frontend — `<SearchBar>` primitive

New component: `components/SearchBar.tsx`.

**Props:**
```ts
type Props = {
  initialQuery?: string;
  placeholder?: string;
  onChange: (query: string) => void;
};
```

**Shape:**
```tsx
import { BinocularsFill, SlidersHorizontal, X } from "@phosphor-icons/react";

export function SearchBar({ initialQuery = "", placeholder, onChange }: Props) {
  const [value, setValue] = useState(initialQuery);
  const [focused, setFocused] = useState(false);

  // Debounced onChange
  useEffect(() => {
    const t = setTimeout(() => onChange(value), 200);
    return () => clearTimeout(t);
  }, [value, onChange]);

  return (
    <div style={{ ...searchBarStyle, ...(focused ? searchBarFocusedStyle : {}) }}>
      <BinocularsFill size={22} weight="fill" color={v1.inkMid} />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Search finds, booths, or styles"}
        style={inputStyle}
      />
      {value && (
        <button onClick={() => setValue("")} style={clearGlyphStyle}>
          <X size={14} weight="bold" color={v1.inkMid} />
        </button>
      )}
      <div style={dividerStyle} />
      <SlidersHorizontal size={20} weight="regular" color={v1.inkMid} />
    </div>
  );
}
```

**Styles** (per David's CSS, translated to inline-style objects matching project pattern; dimensions reflect the same-session slim-down to pill — see D3):

```ts
const searchBarStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12,
  width: "100%", padding: "10px 18px", borderRadius: 999,
  background: "rgba(255, 255, 255, 0.65)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(0, 0, 0, 0.06)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
  transition: "all 180ms ease",
};

const searchBarFocusedStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10), 0 0 0 3px rgba(30,77,43,0.08)",
  borderColor: "rgba(30,77,43,0.20)",
};
```

---

## Home page wiring

[`app/page.tsx`](../app/page.tsx):

1. Slot `<SearchBar>` between `<StickyMasthead>` and the mall scope block (around line ~1000-ish, where the masonry's outer wrapper begins).
2. Add `q` state synced to URL: read from `searchParams.get("q")` on mount, write to URL on change via `router.replace`.
3. Replace `getFeedPosts()` call with conditional:
   - `q?.trim()` truthy → `searchPosts({ query: q, mallSlug })`.
   - Else → existing `getFeedPosts({ mallSlug })`.
4. Empty-state branch: when `q` non-empty AND results empty, render the italic Lora line + green CTA (per D12). CTA `onClick` clears the mall picker (`router.replace("/?q=brass&mall=all")`).
5. The masthead, mall scope, hairline, and BottomNav stay unchanged regardless of search state — only the masonry / empty branch swaps.

---

## Out of scope (R16 phase 1)

Explicit list of things R16 does NOT do:

- **Filter glyph interactivity.** The `PiSlidersHorizontal` glyph renders but is non-interactive. Phase-2 hook for axis chips (material / era / object) if shopper data flags demand.
- **No autocomplete / search history / recent searches.** Pure debounced text input.
- **No matching-reason chips on tiles.** No "matched: tag" or "matched: title" labels. The magic is invisible.
- **No vendor-name / mall-name search.** Title + caption + tags only in phase 1. Documented limitation.
- **No `search_performed` analytics event.** Can be added later as a one-line R3 extension if shopper-search behavior becomes interesting (~5 min add).
- **No pagination on the Home masonry.** R16 narrows the feed; pagination remains a separate concern only re-enters scope if a single search returns >100 posts (unlikely at beta scale).
- **No new BottomNav tab.** Discovery stays on Home. A future R-item can promote search to its own surface only if behavior data demands it.
- **No "Browse by..." landing page.** V1 mockup of this approach was killed per [`feedback_minimalistic_magic_no_destination_for_one_input.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_minimalistic_magic_no_destination_for_one_input.md).
- **No tag editing on `/find/[id]/edit`.** Vendors don't see tags as editable in phase 1 — they're an invisible discovery primitive. If vendors ask, we add it. (Risk: bad AI tags propagate. Mitigation: backfill script makes it cheap to re-run after improving the system prompt.)

---

## Implementation plan (next session)

Smallest→largest commit sequencing per [`feedback_smallest_to_largest_commit_sequencing.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_smallest_to_largest_commit_sequencing.md):

### Task 1 — Migration 🖐️ HITL
- Write `supabase/migrations/019_post_tags_and_search.sql` per the schema spec above.
- HITL paste in Supabase dashboard for prod + staging (existing pattern; no migrations pipeline yet).
- Verify `posts.tags` and `posts.search_tsv` exist + GIN index present.

### Task 2 — `/api/post-caption` enrichment 🟢 AUTO
- Extend system prompt with the tags axes (D8, D9).
- Bump `max_tokens` 200 → 320.
- Update `MOCK_RESPONSES` to include representative `tags` arrays.
- Update TypeScript return shape.
- Update [`app/post/preview/page.tsx`](../app/post/preview/page.tsx) (the consumer) to pass `tags` through to the post-publish payload.
- Commit. CI green.

### Task 3 — Post-publish writes tags 🟢 AUTO
- The post-publish flow currently writes `{ title, caption, image_url, price_asking, vendor_id, mall_id }`. Extend to include `tags: payload.tags ?? []`.
- Test by publishing one find with the dev server + verifying tags column populated in Supabase dashboard.
- Commit.

### Task 4 — `<SearchBar>` primitive 🟢 AUTO
- New file: `components/SearchBar.tsx`.
- Inline style objects per the spec.
- No consumers in this commit — primitive only.
- Commit.

### Task 5 — `searchPosts` lib helper 🟢 AUTO
- Add to `lib/posts.ts` per the spec.
- Phase-1 limitation: title/caption/tags only (vendor/mall name search deferred per recommendation).
- Commit.

### Task 6 — Home page wiring 🟢 AUTO
- Slot `<SearchBar>` into `app/page.tsx`.
- Wire `?q=` URL state.
- Conditional `searchPosts` vs `getFeedPosts`.
- Empty-state branch (D12).
- Commit.

### Task 7 — Backfill script 🟢 AUTO + 🖐️ HITL run
- Write `scripts/backfill-tags.ts`.
- David runs locally with prod creds: `npx ts-node scripts/backfill-tags.ts`.
- Verify ~120 posts get tags populated.
- Re-run on staging.

### Task 8 — Build + iPhone QA 🖐️ HITL
- `npm run build 2>&1 | tail -30` clean.
- Vercel preview iPhone QA per [`feedback_mid_session_iphone_qa_on_vercel_preview.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_mid_session_iphone_qa_on_vercel_preview.md):
  - Idle bar against paperCream (glass styling reads right against warm bg)
  - Tap → focused state ring
  - Type "brass" → masonry filters
  - Clear (×) → restored
  - Type something with no results in current mall → empty state + CTA
  - Tap CTA → all-Kentucky scope shows results
  - URL share-test: copy `?q=brass`, paste in fresh tab → search state restores

**Estimated runtime:** one session, ~90–120 min. Backfill script is the longest task; everything else is straightforward.

---

## Cross-references

- Roadmap entry: [`docs/roadmap-beta-plus.md`](roadmap-beta-plus.md) R16 section.
- Mockups: V1 (rejected landing page) / V1.5 / V2 (picked) — see top of this doc.
- Memory captured this session: [`feedback_minimalistic_magic_no_destination_for_one_input.md`](/Users/davidbutler/.claude/projects/-Users-davidbutler-Projects-treehouse-treasure-search/memory/feedback_minimalistic_magic_no_destination_for_one_input.md).
- Adjacent reseller-layer schema reference (NOT consumed): [`app/api/identify/route.ts`](../app/api/identify/route.ts) — reseller `/scan` `/decide` extracts ~15 attributes for eBay matching; R16's 6-axis subset is the shopper-side cut.
- Caption AI route being extended: [`app/api/post-caption/route.ts`](../app/api/post-caption/route.ts).
- Post schema authority: [`supabase/migrations/001_initial_schema.sql:115`](../supabase/migrations/001_initial_schema.sql).

---

## Open questions deferred to implementation session

- **Whether vendor/mall name search lands phase 1 or defers.** Recommendation: defer (phase-1 limitation). Implementation session can flip if it's trivially cheap with a sub-select.
- **Exact wording of the empty-state CTA** — "Search all of Kentucky →" vs "Look across Kentucky →" (binoculars vocabulary). Implementation session decides on real device.
- **Whether to add a `search_performed` event under R3.** Out of scope for R16 ship; ~5 min add when desired.

---

> Last updated: 2026-05-03 (session 105 close — R16 ✅ Shipped end-to-end. Tasks 1–7 from this spec ran as a straight sprint per the 102 plan. 3 design-record reversals (D2, D5, D12) surfaced post-iPhone-QA + applied with explicit acknowledgement per `feedback_surface_locked_design_reversals.md`. Custom-caret bug-class kill (round 5 structural fix) replaced 4 failed CSS-only attempts on the iOS WebKit empty-input caret position; full chronology preserved in `components/SearchBar.tsx` file-top comment block. Backfill ran clean: 54/54 ok, 0 failed.)

---

## Session 105 implementation notes

**What shipped (17 commits, see CLAUDE.md session 105 block for full table):**
- Migration 019 with IMMUTABLE wrapper retry (Postgres 42P17 caught on first paste)
- Tasks 2/3/5/6/7 chained smallest→largest
- 3 design-record reversals (D2/D5/D12) applied post-iPhone-QA
- Vertical rhythm match: SearchBar wrapper padding 6/12 = both gaps match masonry's 12px stacked-thumbnail gap
- Diamond-divider hairline RETIRED on Home — SearchBar serves as the visual separator above the masonry
- MallScopeHeader top padding 20 → 8 (inherits to /flagged + /shelves)
- Custom green caret (round 5 structural fix — see below)
- Backfill axis-prefix sanitizer (split-on-colon) mirrored to live `/api/post-caption` route

**Custom caret (R16 round 5, kill-the-bug-class):**

iOS WebKit renders the empty-input caret using the font's cap height (~11px for Lora 15) anchored to the line-box top, regardless of CSS `line-height` / `vertical-align` / `appearance` / `box-sizing`. Verified via debug-overlay measurement (3 colored reference lines at y=0/11/21 inside the input box) — caret consistently rendered at y=0–11 (top half) on first focus, then re-anchored correctly after first keystroke.

**Failed CSS-only attempts (rounds 1–4):**
1. `appearance: none` + `WebkitAppearance: none` + `lineHeight: "normal"` — caret unchanged
2. Explicit `height: 22` + `lineHeight: "22px"` + `margin: 0` — caret unchanged
3. `type="search"` → `type="text"` (with inputMode="search" + enterKeyHint="search" preserved) — caret unchanged
4. `lineHeight: 1` (= font-size, smaller line-box) — caret unchanged

**Round 5 structural fix:**
- Set `caret-color: transparent` on the input WHILE empty + focused (hides the misaligned native caret)
- Render our own thin green vertical bar (2 × 17px, `v1.green` brand) absolute-positioned via `top: 50%` + `transform: translateY(-50%)` so it tracks the input box center exactly
- Animate via `@keyframes th-caret-blink 1.06s steps(2, start)` matching iOS native blink cadence (hard 50/50 on/off, no opacity ramp)
- Once user types, native caret takes back over with `caret-color: v1.green` so it stays brand-consistent across both states

**Future sessions:** read the `components/SearchBar.tsx` file-top "Custom caret" comment block before attempting any CSS-only fix on the empty-input caret. The 5-round chronology + lever-disconnection diagnosis is documented there to prevent re-litigation.
