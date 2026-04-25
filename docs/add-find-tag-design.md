---
title: Add Find — tag-capture step (design record)
status: 🟢 Ready for build
session: 62 (2026-04-25)
mockup: docs/mockups/add-find-with-tag-v1.html
type: decision-record
---

# Add Find — tag-capture step

A new optional step in the vendor's Add Find flow. Vendor photographs the inventory tag after the item photo; Claude vision pulls the title + price; the review page prefills with badges showing what came from the tag versus what's still manual. Skip is a one-tap fallback to today's flow.

**Why this matters (problem statement, from David at session-62 standup):**

> Currently the Add Find flow generates a title and caption from the item photo. The vendor then has to either manually edit the title (if the auto-generated one doesn't match what the physical tag says) and add the price. This causes two real-world problems for vendors:
>
> 1. When an item is inventoried at the mall, a tag is created with the name AND price the buyer sees. The auto-generated title may or may not match the tag — meaning the buyer scanning the booth could see one name in the app and a different one on the physical tag.
> 2. The price is already on the tag, but currently requires manual entry. Pure copy-and-input friction with no creative input from the vendor.
>
> Capturing the tag photo solves both: the title authoritatively comes from what the buyer reads in person, and the price is read off the tag without manual transcription. The interpretive caption (which is about feel, not facts) keeps coming from the item photo.

This feature is positioned as the V1 vendor-experience unlock — the Add Find flow becomes ~2× faster per find AND the title accuracy goes to 100% match against the physical tag.

---

## Frozen decisions

### D1 — Tag photo storage: **discard after extraction**

The tag photo is sent to `/api/extract-tag` for vision processing and discarded after the response returns. **No upload to Supabase storage. No new column on `posts`.**

**Why:** No use case yet justifies persisting it. Audit-trail / dispute-verification could be reasons to revisit (Option B), but those are hypothetical until the first real dispute happens. Don't add a column for a hypothetical.

**Reversible if:** future audit/dispute use case lands. Migration would add `tag_image_url` to `posts` plus a parallel upload step in publish. Not load-bearing for the V1 ship.

### D2 — Vision API: **reuse `/api/post-caption` shape, new route `/api/extract-tag`**

The new route mirrors `/api/post-caption` line-for-line:
- Anthropic SDK + Claude Sonnet 4.6 vision (pinned model, same as post-caption per session-27 lesson)
- Rate limit: 10 req/IP/60s, in-memory map (matches post-caption — same upgrade-to-Upstash trigger when it bites)
- Mock fallback structure: `source: "claude" | "mock"` + `reason?` field
- Base64 input via `imageDataUrl`
- Verbose `logError` helper

**Diff vs. post-caption:**
- System prompt rewritten for tag extraction (printed retail tag → JSON `{title, price}`)
- Response shape: `{ title: string, price: number | null, source, reason? }` instead of `{title, caption}`
- `price: null` when the tag price is unparseable or missing — surfaced as a graceful-collapse signal, not an error

### D3 — Where the new step lives: **new page `/post/tag` between `AddFindSheet` and `/post/preview`**

Linear page-to-page flow keeps the iOS reload-resilience pattern intact (`postStore` survives the page transition). Reusing the existing `/post/preview` chrome (Mode C masthead, paperCream bg, sticky bottom bar) means zero new visual primitives.

**Routing change:** `app/my-shelf/page.tsx` `handleAddFile` redirects to `/post/tag` instead of `/post/preview` (1-line change). `/post/tag` writes both photos + extracted fields to `postStore` and redirects to `/post/preview`.

### D4 — Skip placement: **on the tag page itself**

Primary green CTA "Take photo of tag" + secondary underlined italic skip link below it. `AddFindSheet` stays unchanged (Camera / Library, two rows). The vendor doesn't pre-commit when opening the sheet; they decide after the item photo is captured.

### D5 — Failure handling: **mirror `/api/post-caption` failure pattern**

- `source: "claude"` + valid `{title, price}` → success path, prefill on preview
- `source: "mock"` + `reason: "error"` → preview lands with empty title/price + the existing `<AmberNotice>` reading "Couldn't read this tag — fill in the title and price below."
- `source: "claude"` + `price: null` → title prefills, price stays empty + a softer notice ("Couldn't read the price — fill it in below."). Title might still be readable even when the price isn't (handwritten price + printed name is a real tag pattern).

No new failure UX vocabulary. Same amber notice idiom that's already shipped.

### D6 — Title source priority when tag is captured: **tag title overrides Claude title**

- Tag-extracted `title` populates the Title field on `/post/preview`
- Claude's interpretive title (the `/api/post-caption` output's `title` field) is discarded when tag flow ran
- Claude's `caption` (interpretive — about feel/character/material) is still generated from the item photo and used as today

Caption is interpretive, not a tag-reading. The vendor picks the photo and the writer (Claude) describes how it feels. The tag picks the title (because that's what the buyer reads on the physical tag) and the price (because that's what the buyer pays).

### D7 — Price format: **numeric or null, no client-side string parsing**

`/api/extract-tag` system prompt instructs Claude to return `price` as a plain number (integer or float, two-decimal max), or `null` when the tag price is missing/handwritten/unreadable. Client side does not attempt to parse strings like "$22 firm" or "22.00/handwritten" — that's the prompt's job.

When `null`: surface the soft amber notice (D5), leave the price field empty, vendor types it in.

### D8 — Caption generation timing

| Flow | When `/api/extract-tag` runs | When `/api/post-caption` runs |
|---|---|---|
| Tag captured | On `/post/tag` after tag photo picked | Parallel: kicked off on `/post/tag` simultaneously with extract-tag |
| Skip | (not run) | On `/post/preview` mount (today's behavior) |

**Tag flow:** both API calls run in parallel during the "Reading the tag…" extracting state. Preview page lands with both results already in `postStore` and renders immediately.

**Skip flow:** today's behavior unchanged. Preview mounts → `/api/post-caption` fires → prefills.

This means the worst-case latency on the tag flow is `max(extract_tag_ms, post_caption_ms)`, not `extract_tag_ms + post_caption_ms`.

---

## Subordinate decisions (locked from mockup approval, session 62)

| # | Decision | Choice |
|---|---|---|
| M1 | Page layout | Approved as drawn (item photo medium-sized → italic IM Fell hint → green CTA → underlined italic skip link) |
| M2 | CTA copy | "Take photo of tag" |
| M3 | Skip copy | "Skip — I'll add title and price manually" |
| M4 | Page title + subhead | "Now the tag" / italic subhead "Capture the title and price in one shot." |
| M5 | "From tag" badge | Variant α — green-on-green pill with Lucide `Tag` icon + italic IM Fell "from tag" |

---

## What gets touched (build-phase outline)

| File | Status | Change | Approx |
|---|---|---|---|
| `app/post/tag/page.tsx` | **NEW** | Tag-capture page (3 states: ready / extracting / error) + camera input + parallel extract-tag + post-caption kickoff | ~250 lines |
| `app/api/extract-tag/route.ts` | **NEW** | Vision route mirroring `/api/post-caption`. Tag-specific system prompt. Returns `{title, price, source, reason?}` | ~200 lines |
| `lib/postStore.ts` | modify | Expand draft shape to `{ imageDataUrl, tagDataUrl?: string, extractedTitle?: string \| null, extractedPrice?: number \| null, extractionRan?: "success" \| "error" \| "skip" }` | ~50 lines |
| `app/my-shelf/page.tsx` | modify | `handleAddFile` redirect target: `/post/preview` → `/post/tag` (1-line change) | 1 line |
| `app/post/preview/page.tsx` | modify | (a) On mount, branch on `extractionRan`: if "success" or "error", do NOT call `/api/post-caption` for title/caption merge — already pre-fetched on `/post/tag`. If "skip", today's behavior. (b) Wire up "from tag" badges next to Title and Price labels when those came from tag. (c) Surface soft "Couldn't read price" notice when `extractedPrice === null` && `extractionRan === "success"` | ~80 lines |
| `components/TagBadge.tsx` | **NEW** | Tiny inline pill component — Lucide Tag glyph + italic IM Fell "from tag", green-on-green per Variant α | ~40 lines |
| `components/AddFindSheet.tsx` | unchanged | — | 0 |
| `docs/add-find-tag-design.md` | **NEW (this file)** | Decision record — D1-D8 + M1-M5 frozen, ships at design-to-Ready commit | — |
| `docs/mockups/add-find-with-tag-v1.html` | **NEW** | Approved mockup, ships at design-to-Ready commit | — |
| `docs/add-find-tag-build-spec.md` | deferred | Dev handoff spec — written at start of implementation session, NOT now | — |

**Effort estimate:** 1 implementation session, ~2-3 hours of focused work. Can be split if the tag-page UI + the API + the preview-page wiring grow beyond a single session, but I expect a single session given the existing patterns this is mirroring.

---

## Build phases (suggested execution order for the implementation session)

1. **`/api/extract-tag` route** — mirror `/api/post-caption` line-by-line, swap system prompt + response shape. Stand-alone testable via curl with a sample tag photo before any UI work.
2. **`postStore` expansion** — extend the draft shape with optional tag fields. Backward-compatible default (omitted fields = today's skip flow).
3. **`/post/tag` page** — three states: ready (Frame 1), extracting (Frame 2), error (rare; back-button + skip-fallback). Camera input via hidden `<input type="file" capture="environment">`. On photo pick: set tagDataUrl in `postStore`, fire extract-tag + post-caption in parallel, redirect to `/post/preview` once both resolve.
4. **`my-shelf` redirect target update** — 1-line change.
5. **`TagBadge` component** — small green-on-green pill, drop-in next to field labels.
6. **`/post/preview` wiring** — read `extractionRan` flag from `postStore`, branch behavior, render `<TagBadge>` next to Title/Price labels conditionally, surface the soft "couldn't read price" notice when applicable.
7. **QA walk on iPhone** — at minimum: tag-flow happy path, tag-flow with handwritten/unreadable price (graceful collapse), tag-flow with totally unreadable tag (full amber notice fallback), skip-flow (today's behavior intact).

---

## Out of scope for this build

- Persisting the tag photo to Supabase storage (D1: deferred, not blocked)
- Showing the tag photo in the published post on `/find/[id]` (no use case yet)
- Editing the post AFTER publish to re-extract from a new tag (no use case yet)
- Tag-extraction analytics events (R3 events table can absorb later — `tag_extracted_success` / `tag_extracted_no_price` / `tag_skipped` are good candidates if we want to measure adoption, not in this build)
- Multi-tag posts (one tag per find, period)
- Front-of-house tag style validation — Claude is asked to read whatever's photographed; we don't constrain to a specific tag template

---

## Risks worth flagging before implementation

1. **Generic system prompt without sample tags.** David doesn't have sample tags to share for prompt tuning (per session-62 chat). The first iteration uses a generic "printed retail tag" prompt; we tune on first QA walk if Claude misreads. **Mitigation:** the failure path is graceful — bad extraction lands the vendor in today's manual-edit flow with an amber notice, not a broken page.
2. **Two parallel API calls = doubled rate-limit consumption.** Each tag-flow find consumes 1 extract-tag request + 1 post-caption request from the in-memory rate limiter. The 10 req/IP/60s limit covers ~5 finds per minute per vendor. Reasonable for V1 vendor pace; revisit when a vendor reports hitting the limit.
3. **Claude vision cost.** Two vision calls per find vs. one today. Sonnet 4.6 vision is ~$0.003 per image at typical photo sizes. At 100 finds/day that's an extra $0.30/day. Negligible at beta scale; revisit at scale-out.

---

## Acceptance criteria (definition of done for the implementation session)

1. ✅ Tag-flow happy path: vendor takes item photo → routes to `/post/tag` → photographs tag → "Reading the tag…" extracting state → lands on `/post/preview` with title + price prefilled, both wearing the green "from tag" pill, caption populated from Claude on item photo, vendor can publish without typing anything.
2. ✅ Skip-flow works exactly as today (regression check on the existing path).
3. ✅ Tag-flow with handwritten / partially obscured price: title prefills, price empty, soft amber notice surfaces, vendor types price.
4. ✅ Tag-flow with totally unreadable tag: full amber notice surfaces ("Couldn't read this tag — fill in the title and price below."), both fields empty, vendor types both. Same UX as today's `aiFailed` path on `/post/preview`.
5. ✅ `npm run build` clean.
6. ✅ Visual: matches Frame 1 / Frame 2 / Frame 3 of the approved mockup at production scale on iPhone.

---

## Lineage

- **Session 62 (2026-04-25)** — design-to-Ready: D1-D8 frozen at chat scoping, mockup `add-find-with-tag-v1.html` approved at variant α, design record written + committed.
- **Session 63 (TBD)** — implementation per build phases above. Build spec to be written at the start of session 63 as the dev handoff doc.
