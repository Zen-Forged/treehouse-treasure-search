# Share Booth redesign — design record

> **Status:** 🟢 Ready for implementation
> **Picked frame:** Frame C (compact — slim header + 3 squares + footer disclaimer)
> **Mockup:** [`docs/mockups/share-booth-redesign-v1.html`](mockups/share-booth-redesign-v1.html)
> **Successor to:** [`docs/share-booth-build-spec.md`](share-booth-build-spec.md) (session 41 + Q-008/Q-011 addendums) — historical reference
> **Last updated:** session 135 (2026-05-09)

---

## Reversal log (Q-007 + Q-008 + Q-011 surface, surfaced explicitly per `feedback_surface_locked_design_reversals`)

Three frozen decisions from the session 41 build spec are reversed by this redesign:

| Old decision | Old session | New decision | Reason |
|---|---|---|---|
| Email is the primary share affordance — entire sheet IS an email-entry form | Q-007 session 41 | Email is one of three equal channels behind a tile tap | David's mockup: 3-tile channel grid; email no longer dominates |
| 160px QR code with logo overlay rendered always-visible above email form | Q-007 session 41 | QR demoted to a sub-screen reached by tapping the QR tile | David: "make the QR code less of the focus" |
| 3-tile preview strip showing first 3 finds embedded in sheet | Q-007 session 41 | Preview tiles retired entirely | David: "removing the loaded images in the share card" |

Preserved (no reversal):
- Bottom-sheet primitive itself (Q3=B locked this session — no full-page route conversion)
- `/api/share-booth` server route + Gmail/Outlook-audited HTML email template (Q-011 sessions 51–53) — backend unchanged; UX moves behind a tile tap
- Vendor/admin authenticated mode + shopper anonymous mode (Q-008 session 50) — auth path preserved verbatim
- QR component + Treehouse logo overlay (`react-qr-code` + `/icon.png`) — relocated, unchanged

---

## Frozen decisions

### D1 — Bottom-sheet primitive preserved
The existing `ShareBoothSheet` component shell stays. No route conversion, no full-page modal. Backdrop + paperCream sheet + handle pill + 22px horizontal padding all preserved exactly. **Why:** Q3=B locked the cheapest path; route work would be a separate scope.

### D2 — Three channels in V1: Email + SMS + QR Code
Messenger deferred (Q2) to a future session. No "Coming soon" placeholder tile — Frame C drops the 4th slot entirely. **Why:** dead pixels on a placeholder tile invite questions and add UX noise; appending a 4th channel later is a one-tile change.

### D3 — Slim header (Frame C shape)
Header retires the wordmark + the "SHARE THIS BOOTH" eyebrow. Composition top-down:
- Top bar: just × close (no back on grid screen — see D11)
- Booth name medium (28px Lora upright, weight 500, letter-spacing -0.015em, line-height 1.05)
- Booth pill (BOOTH D19 styling — 12px FONT_SYS, weight 600, letter-spacing 0.18em, hairline border, paperCream-tinted bg)
- Mall row: PiMapPin + mall name (16px Lora upright, weight 500)
- Address line: full street address (12px FONT_SYS, inkMid, line-height 1.4)
- Section divider (1px hairline)
- "Share via" eyebrow (10px FONT_SYS, weight 600, letter-spacing 0.16em, uppercase, inkMuted)

**Why:** Frame C trades wordmark presence for vertical room and channel foreground.

### D4 — Address line is full street address
Mall name on top line; below it the full address (`5252 Bardstown Rd, Louisville, KY 40291` shape). **Why:** Q9=b — concept-faithful + share recipients may be unfamiliar with the mall and need full address to navigate.

### D5 — 3 square tiles in a single row
- `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px`
- Tile: paperCream-tinted bg, hairline border, 10px radius, 16px top padding / 6px horizontal / 12px bottom
- Icon ~22px ink-primary, centered top
- Label below icon: 13px Lora weight 600, ink-primary
- **No sub-labels** (Frame C drops them — icons + label carry the channel meaning)
- Subtle tile shadow `0 1px 2px rgba(44,36,28,0.05)`

**Why:** Frame C maximizes vertical room; sub-labels added clutter without proportional clarity.

### D6 — Channel icons (react-icons / Phosphor canonical family)
- **Email:** `<PiEnvelopeSimple />` from `react-icons/pi` (mirrors letter/postcard family already in project)
- **SMS:** `<PiChatCircleText />` from `react-icons/pi`
- **QR Code:** `<PiQrCode />` from `react-icons/pi`

Implementation may swap to closer matches if Phosphor variants surface during build (`<PiEnvelope>`, `<PiChatTeardropText>`, etc.) — this is dial-detail.

### D7 — Email tile: existing form preserved (Q6=a)
Tap Email → `setScreen("email")` → grid swaps to email-entry sub-screen → existing compose/sending/sent/error states from current ShareBoothSheet render unchanged. Existing `/api/share-booth` backend + Gmail/Outlook-audited HTML email template + rate limits + Q-008 vendor/admin/shopper auth modes preserved verbatim.

**Why:** Q6=a — preserves ~4 sessions of email-template work + Q-011 4-client audit. Email sub-screen is content-only refactor of existing code.

### D8 — Email sub-screen header
Same slim header as the grid screen (booth name + pill + mall + full address) — context is preserved as the user composes. Above the slim header: back arrow ← (returns to grid via `setScreen("grid")`) + × close (calls `onClose()`).

### D9 — SMS body template (Q7=c)
Tap SMS → `window.location.href = sms:?body=${encodeURIComponent(body)}` → device's native Messages app opens with prefilled body → sheet closes (`onClose()`).

Body template:
```
Found this booth on Treehouse Finds: {boothName} · {url}
```

`{boothName}` = `vendor.business_name`. `{url}` = same canonical booth URL used by the QR code (`window.location.origin + "/shelf/" + vendor.slug`).

**Why:** Q7=c — concise, names the source brand once, dot-separator pairs cleanly with project conventions.

### D10 — QR sub-screen
Tap QR Code tile → `setScreen("qr")` → grid swaps to QR sub-screen.

Layout top-down (Q8=a):
- Top bar: back arrow ← + × close
- **Repeats the slim header** verbatim (booth name + pill + mall + full address) — context preserved
- Section divider
- QR code: 200px (up from current 160px since this is now the sub-screen's hero affordance), Treehouse logo overlay unchanged (36px circular, white halo, `/icon.png` cream-on-leaf brand mark)
- "Scan to visit this booth" caption (12px italic Lora, ink-muted, centered)
- No footer disclaimer on this sub-screen

**Why:** Q8=a — context preservation costs ~120px of vertical space and gains zero ambiguity about which booth this QR opens.

### D11 — Top-bar nav state machine (Q10=a)
| Screen | Back ← | Close × |
|---|---|---|
| Grid (entry) | _absent_ | `onClose()` |
| Email sub-screen | `setScreen("grid")` | `onClose()` |
| QR sub-screen | `setScreen("grid")` | `onClose()` |

Both buttons render in the same `.sheet-topbar` slot regardless of screen — they appear/disappear without layout shift. The top-bar slot height is fixed at 36px so screen swaps don't cause vertical flicker.

### D12 — Footer disclaimer (grid screen only)
Below the channel grid, a hairline divider then a row containing:
- `<PiLeaf />` outline glyph (14px, ink-muted, no bg container)
- "Anyone with this link can view this booth in Treehouse Finds." (11px FONT_SYS, ink-muted, line-height 1.45, max-width ~240px)

**Not rendered on email or QR sub-screens** — context is implied once they've picked a channel.

### D13 — R3 events
Three new server-side `recordEvent` types + one client-side `track()` hook on tile tap:

| Event | Layer | Payload | Fires when |
|---|---|---|---|
| `share_booth_channel_tapped` | client `track()` | `{ channel: "email" \| "sms" \| "qr_code", vendor_slug, mall_id }` | Any tile tap on grid screen |
| `share_booth_qr_viewed` | client `track()` | `{ vendor_slug, mall_id }` | QR sub-screen renders (NOT the tile tap — separate visibility signal) |
| `share_booth_sms_initiated` | client `track()` | `{ vendor_slug, mall_id }` | SMS `sms:` URL fires |

Existing `share_booth_email_sent` event from current `/api/share-booth` server flow stays as-is (preserved by D7's email-form preservation).

### D14 — Sub-screen state machine
Sheet root holds `screen: "grid" | "email" | "qr"` state. Internal navigation is React state, not router history — sub-screens don't push browser history. Closing the sheet from any screen resets to "grid" on next open.

`AnimatePresence` from framer-motion can wrap the `<motion.div key={screen}>` swap with a slide transition (300ms ease) if it reads off without animation — implementation-time call.

---

## Implementation arcs (sequenced smallest→largest per `feedback_smallest_to_largest_commit_sequencing`)

### Arc 1 — Frame C scaffold + grid screen (~3 commits)
1. **Strip + scaffold** — Replace current `ShareBoothSheet` body with `screen: "grid"` shell + slim header (D3 + D4) + section divider + `Share via` eyebrow + footer disclaimer (D12). Preserve all existing props + Q-008 auth modes verbatim. Email form code lifts to a separate function `renderEmailScreen()` mounted only when `screen === "email"`.
2. **3-tile grid** — Wire D5 grid + D6 icons + tile tap handlers (placeholders for now: `console.log` per channel + `track()` for D13's `share_booth_channel_tapped`).
3. **Top-bar nav** — Wire D11 state machine. × always closes; ← appears on sub-screens. Fixed 36px slot height.

### Arc 2 — Channel handlers (~3 commits)
4. **Email channel** — Tap Email → `setScreen("email")` → render existing email form (lifted into `renderEmailScreen()`). Preserve compose/sending/sent/error states. Email sub-screen header per D8.
5. **SMS channel** — Tap SMS → fire D9 template via `sms:` URL → close sheet. Add `share_booth_sms_initiated` event.
6. **QR channel** — Tap QR → `setScreen("qr")` → render QR sub-screen per D10. Add `share_booth_qr_viewed` event on sub-screen mount.

### Arc 3 — Polish + R3 wiring + iPhone QA (~1 commit)
7. **R3 finalization** — Confirm 3 new client events fire correctly across all 3 callsites (BoothPage, /my-shelf admin, /shelf/[slug]). Verify existing `share_booth_email_sent` server event still fires through D7 path.

**Total estimated: ~7 commits, ~60–90 min implementation. Single session viable.**

---

## Tier B explicit headroom (deferred, doors left open)

| Item | Carries to | Why deferred |
|---|---|---|
| **Messenger channel** | Future session | Q2 deferred — needs FB Developer setup decision (deep link vs Send Dialog vs Web Share) |
| **Copy Link channel** | Future session | Q1 picked Email-replaces-Copy-Link; Copy Link could append as 4th tile if user demand surfaces |
| **AirDrop / Notes / iOS Web Share fallback** | Future session | Could surface as 5th "More" tile via `navigator.share()` — covers Messenger for users who have it installed |
| **Sub-screen slide animations** | Implementation-time call | D14 left the AnimatePresence swap as optional; ship without if static read is fine |
| **Booth photo as visual anchor in slim header** | Future session | Frame C deliberately drops imagery; if iPhone QA reads "too text-heavy," a small hero thumbnail could land |
| **Long-name truncation on slim header** | iPhone QA dial | Booth names like "Moorehouse Mercantile" (20 chars) fit at 28px; longer names may wrap to 2 lines or need fontSize down to 24/22 |

---

## Surfaces & callsites

Implementation maintains all 3 existing callsites with no regression:

| Callsite | Mode | File |
|---|---|---|
| Vendor self-share | Authenticated (vendor) | [components/BoothPage.tsx](../components/BoothPage.tsx) → `/shelf/[slug]` |
| Admin share-any-booth | Authenticated (admin) | [app/my-shelf/page.tsx](../app/my-shelf/page.tsx) — Q-009 session 45 |
| Shopper share | Anonymous | [app/shelf/[slug]/page.tsx](../app/shelf/[slug]/page.tsx) — Q-008 session 50 |

ShareBoothSheet props are unchanged (`vendor`, `mall`, `previewPosts`, `mode`, `open`, `onClose`). `previewPosts` becomes unused at the rendering layer but stays in the prop signature for now to avoid touching 3 callsites — retire as scope-adjacent dead-code cleanup in Arc 3 per `feedback_dead_code_cleanup_as_byproduct`.

---

## Out-of-scope explicitly

- Messenger integration (Q2 deferred)
- Email template changes (D7 preserves backend verbatim)
- New API routes (no schema, no migrations)
- Find-share / mall-share (Q5 = booth-only)
- Universal Links / deep-link CTA (Q-006 carries separately)
- Native iOS share sheet (`navigator.share`) as fallback or wrapper — captured as Tier B headroom
