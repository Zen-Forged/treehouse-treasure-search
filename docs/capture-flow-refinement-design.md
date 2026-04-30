# Capture-flow refinement — design record

> **Status:** Frozen (V3 commitment surface) — session 94, 2026-04-30
> **Mockups (chronological):**
>   - V1: [docs/mockups/capture-flow-refinement-v1.html](mockups/capture-flow-refinement-v1.html) — masthead-size compare + initial layout
>   - V2: [docs/mockups/capture-flow-refinement-v2.html](mockups/capture-flow-refinement-v2.html) — picks locked + retake added
>   - V3: [docs/mockups/capture-flow-refinement-v3.html](mockups/capture-flow-refinement-v3.html) — vertical centering + final commit
> **Build doc** — read by future Claude sessions, not David. Mockup wins on visual disagreement (Design Agent rule).

## Bundle scope

Refinement of the capture-and-add-find user journey end-to-end:

1. **Home** — drop the bottom Request-Digital-Booth CTA card (now redundant with /login + /login/email).
2. **Masthead system-wide** — wordmark grows + chrome height grows for a heavier brand anchor.
3. **/post/tag** — adopts the shared masthead, adopts the polaroid photo treatment, gets new instructional copy, gains a Find-retake affordance.
4. **/post/preview** — title/caption/price move above the photo, all booth chrome removed, polaroid replaces the framed photograph, caption auto-grows, input bg flips to postit cream, disabled-publish unified to the standard pattern, post-publish interstitial retired.

## Decisions (D1–D15)

| # | Decision |
|---|---|
| **D1** | Home: `<VendorCTACard />` block + the hairline divider above it dropped from `app/page.tsx`. The "For vendors → Request Digital Booth" CTA now lives on `/login` (triage page) + `/login/email` (form-side eyebrow), so the Home footer was duplicating discovery. |
| **D2** | Masthead **+40px height · wordmark 90px** system-wide. Inner grid `minHeight: 50 → 90`. `MASTHEAD_HEIGHT` calc constant updated; spacer tracks. Affects every screen using `<StickyMasthead />` (~13 ecosystem pages). Lost ~40px above-the-fold space on Home — accepted trade for the heavier brand anchor. |
| **D3** | `/post/tag` retires its bespoke sticky chrome (custom `position: sticky` block with title + back inline) and adopts the shared `<StickyMasthead />`. |
| **D4** | Page title + italic subtitle move to a centered content block **below** the masthead on both `/post/tag` and `/post/preview`. Same typography on both: Lora 24px / italic 14px muted. Centered horizontally. |
| **D5** | When both photos are visible (the `/post/tag` extracting state), they stack **vertically**: Find on top, Tag below, both labeled lowercase italic Lora muted. Width 60% of page. |
| **D6** | `/post/tag` ready-state copy rewritten to instructional + explanatory (this is a new feature most vendors won't recognize on first sight): <br>• Title: **"Take a photo of the tag"**<br>• Subtitle: **"We'll read the title and price right off the tag, so you don't have to type them in."** <br><br>Extracting-state copy preserved verbatim ("Reading the tag…" / "Just a moment.") — those describe what's happening, no rewrite needed. |
| **D7** | `/post/preview`: Title, Caption, and Price fields all move **above** the photo. The photo becomes the visual confirmation at the bottom of the form, not the centerpiece above the form. |
| **D8** | `/post/preview`: `<PostingAsBlock />` removed entirely (display name + booth # + mall city). `<PhotographPreview />`'s booth-location post-it removed by passing `boothNumber={null}`. PhotographPreview's frame chrome itself (4:5 aspect frame + paperCream letterbox + hairline border + drop shadow) replaced with an inline polaroid wrapper (PhotographPreview component itself preserved — still used by `/post/edit/[id]`). |
| **D9** | Input field background: `v1.inkWash` → **`v1.postit`** (#fbf3df) on Title / Caption / Price on `/post/preview`. Matches the warm cream used on the `/login/email` email-address input. |
| **D10** | Caption: `rows={3}` + `minHeight: 78` retired. Auto-grow via `useEffect` reading `scrollHeight` and writing back into `style.height` on every value change. No internal scroll (`overflow: hidden`). Page scrolls on overflow. **No cap**: AI captions average 2–4 sentences; longer ones fall through to natural page scroll. |
| **D11** | Disabled publish button unified to the standard pattern: `background: rgba(30, 77, 43, 0.40)` + white text. Was `background: v1.inkWash` + `color: v1.inkFaint` — odd snowflake against `/vendor-request` and `/login/email` which already use the 40%-green pattern. |
| **D12** | `/post/preview` post-publish "View my shelf / Add another find" interstitial dropped. The `stage === "done"` JSX branch deleted entirely. On publish success, `router.replace(myShelfHref)` directly. Admin `?vendor=<id>` impersonation preserved through the existing `myShelfHref` calc. |
| **D13** | **Find-photo retake** affordance added: italic dotted-link "Retake" rendered below the Find polaroid on (a) `/post/tag` ready state and (b) `/post/preview`. Tap → opens `<AddFindSheet />` bottom sheet (Take photo / Choose from library) → on file select, updates `postStore.imageDataUrl` → polaroid re-renders. <br><br>**Hard constraint: AI APIs do NOT re-fire on retake.** `/api/post-caption` and `/api/extract-tag` skipped. Title / Caption / Price fields preserved verbatim — vendor keeps their typed-or-extracted values. The vendor's mental model is "I just want a better picture of the same thing" — re-running the AI would surprise them. |
| **D14** | **Vertical centering.** The middle band between masthead and bottom chrome (CTA stack on `/post/tag`, save bar on `/post/preview`) becomes a flex column with `justify-content: center`. When content fits, title + photo + retake center vertically — eliminates the "everything piled at the top of the page" feel. When content overflows (long auto-grown caption), the middle band falls to top-anchored scroll gracefully (`overflow-y: auto` on the band itself; `min-height: 0` lets it shrink). |
| **D15** | `/post/preview` title block intentionally padded with extra top spacing (~32px from masthead vs. ~18px on `/post/tag`) to let the title sit slightly down from the chrome. The page is content-heavy (3 fields + photo) and a small scroll is acceptable — David's call. |

## Rule deviations flagged

- **Polaroid on a navigate/detail-shaped surface.** Session 83 froze the rule "polaroid skips navigate/detail surfaces; lives only on browse/collect." `/post/preview` is review-not-detail (the photo is the artifact under review, not a destination), and `/post/tag` is capture-not-browse — both fall outside session 83's binary, but the visual treatment crosses the rule's stated boundary. Carving an explicit exception for the post flow. Recording here so a future session reading the polaroid-pattern roster doesn't reflexively retire it.

## Deferred

- **Tag-photo retake on `/post/preview`** (V2 Q6). Manual field editing covers the same need — vendors with bad tag extraction edit the title/price fields directly. Risk of overwriting typed work + ambiguity of where the affordance lives visually (tag photo isn't shown on preview) argued for defer. Beta feedback can pull it back in if real users want it.

## File map

| File | Change |
|---|---|
| `app/page.tsx` | Drop `<VendorCTACard />` import + block + the hairline divider above. |
| `components/StickyMasthead.tsx` | Wordmark height 50 → 90, inner grid `minHeight` 50 → 90, `MASTHEAD_HEIGHT` calc updated for the +40 total bump. |
| `components/VendorCTACard.tsx` | Untouched — left in repo for potential reuse but no longer rendered anywhere. |
| `app/post/tag/page.tsx` | Bespoke sticky masthead retired → `<StickyMasthead />`. New centered title block below masthead. Polaroid wrappers around Find + Tag photos. Vertical labels below each polaroid. Find retake affordance + hidden file input. Vertical centering on middle area. New ready-state copy. |
| `app/post/preview/page.tsx` | Field stack moved above photo. `<PostingAsBlock />` removed. `<PhotographPreview />` replaced with inline polaroid wrapper. Caption auto-grow effect. Input bg `v1.inkWash` → `v1.postit`. Disabled publish button color unified. `done`-stage JSX block + Camera icon import removed; on success → `router.replace(myShelfHref)`. Find retake handler + hidden file input. Vertical centering on middle area. New subtitle copy. |
| `components/PhotographPreview.tsx` | Untouched. Still used by `/post/edit/[id]`. |
| `components/PostingAsBlock.tsx` | Untouched. Still used by `/post/edit/[id]`. |
| `components/AddFindSheet.tsx` | Untouched — reused by retake handlers as-is. |

## What's NOT in scope

- `/post/edit/[id]` (the existing-find edit page) keeps `<PhotographPreview />` and `<PostingAsBlock />`. The visual divergence between "review-before-publish" (polaroid, no booth chrome) and "edit-an-existing-post" (framed photograph, post-it, posting-as block) is acceptable — they're different mental models (preview = artifact under review, edit = adjusting an established record).
- Mall hero composition, BoothHero on `/my-shelf`, BottomNav, anything outside the capture flow.
- Tag retake (deferred per D-Deferred).

## Implementation notes

- `MASTHEAD_HEIGHT` constant in `StickyMasthead.tsx` is the single source of truth for the spacer. Was `calc(max(14px, env(safe-area-inset-top, 14px)) + 63px)` (14 + 50 grid + 12 padBottom + 1 border). Becomes `calc(max(14px, env(safe-area-inset-top, 14px)) + 103px)` (14 + 90 grid + 12 padBottom + 1 border = 117 total; the 103 number is the static component, the 14 is folded into the env max).
- Caption auto-grow pattern:
  ```ts
  const captionRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = captionRef.current;
    if (!el) return;
    el.style.height = "auto";       // reset so the box can shrink, not just grow
    el.style.height = `${el.scrollHeight}px`;
  }, [caption]);
  ```
  The `auto` reset on every change is what allows the textarea to shrink when content is deleted; without it, `scrollHeight` stays at the historical max.
- Retake sheet behavior: open `<AddFindSheet open={true} />`, route the Take-photo / Choose-from-library callbacks to existing hidden file inputs (camera + library inputs are already wired on `/post/tag` for the Tag capture; on `/post/preview` we add new inputs). On file change, FileReader → data URL → `postStore.set({ ...draft, imageDataUrl: newUrl })` → close sheet → re-render. **No fetch calls fire.**
