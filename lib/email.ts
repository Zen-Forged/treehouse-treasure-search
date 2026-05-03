// lib/email.ts
// Resend-backed transactional emails for vendor onboarding + booth sharing.
//
// Three public functions:
//   sendRequestReceived(payload)       — Email #1 per onboarding-journey.md
//   sendApprovalInstructions(payload)  — Email #2 per onboarding-journey.md
//   sendBoothWindow(payload)           — Window share email (Q-007, session 39)
//
// Session 52 Q-011 v4 (2026-04-24, simplified button-forward):
//  - After v3 solved the Gmail compat problem, David flagged the email was
//    still text-heavy and the primary CTA was buried at the bottom after
//    the full tile grid. v4 pivots the design goal from "make it render"
//    to "make it convert" — a well-formatted email that gets people to
//    tap the button and go see more finds.
//  - Shell masthead retired entirely. The sender envelope already names
//    the brand ("Treehouse Finds" in the From row); re-identifying in the
//    body added ~45px of vertical weight for zero new information.
//  - Opener collapses from two blocks to one phrase: italic "You've
//    received a personal invite to explore" flows grammatically into the
//    vendor name as its object. IM Fell vendor name bumps 32→34px since
//    it's now the undisputed top visual.
//  - Button moves up to sit directly under the banner + info bar.
//    Recipient sees the CTA while still looking at what they were sent.
//    Button is full-width block (10px radius, 15px/20 padding, Georgia
//    600 16px) — maximum tap area, modern-app feel.
//  - Button copy: "Explore the booth" (was "Open in Treehouse Finds").
//  - Subject: "A personal invite to explore {vendor}" (was "A Window
//    into {vendor}"). Preheader: "A personal invite to explore
//    {vendor}." Subject + preheader + opener now all share the phrase —
//    narrative unity from inbox-scan to first line of body.
//  - Closer block deleted entirely. No "Explore the rest of the booth"
//    italic eyebrow. No "More treasures waiting to be discovered."
//    sub-copy. No border-top hairline separator.
//  - "THE WINDOW" tile-grid eyebrow deleted. Tiles stand naked under the
//    button as supporting preview.
//  - The word "Window" is retired from user-facing copy entirely. It
//    lives on in internal identifiers (`sendBoothWindow`,
//    `ShareBoothWindowPayload`, docs/share-booth-qa-walk.md) —
//    developer-facing, no reason to churn.
//  - See docs/share-booth-build-spec.md v4 addendum and
//    docs/mockups/share-booth-email-v4.html (Variant B full-width) for
//    the lock.
//
// Session 52 Q-011 v3 (2026-04-24, info bar pivot):
//  - Window email banner redesigned AGAIN after v2 kept failing Gmail QA.
//    Two rounds of overlap-style post-it (v2.0 position:absolute, v2.1
//    negative-margin sibling) both broke on Gmail web + iOS Gmail because
//    Gmail strips `position` from inline styles and mangles inline-flow
//    overlap patterns. Root truth: any post-it-over-banner overlap needs
//    primitives Gmail is hostile to.
//  - v3 retires the post-it gesture from emails. Booth number moves into
//    a two-cell horizontal info bar BELOW the banner, paired with mall
//    name + address in a second cell. Pure HTML <table> — the oldest and
//    most forgiving email primitive; every mail client in circulation
//    since 2005 renders it identically.
//  - Semantic improvement: "this booth is at that mall" was split across
//    two primitives in v1/v2 (post-it overlay + standalone pin-prefixed
//    location row). v3 unifies them into one element. One primitive, one
//    thought. The standalone mall-location line (renderLocationLine) and
//    its teardrop PinGlyph SVG are retired.
//  - Variant locked: A — Attached. Banner image + info bar share one
//    rounded outer frame with a hairline divider between them. Matches
//    David's session-52 hand-sketch.
//  - Booth cell is 32% width with text-align:center. Eyebrow is
//    "BOOTH" (uppercase, hardcoded, Georgia italic 11px letterspaced —
//    matches the existing "THE WINDOW" eyebrow pattern). Numeral is
//    Times New Roman 26/500, auto-shrinks by digit count (26 / 22 / 18).
//  - Mall cell (68%) keeps IM Fell 17px mall name + system-ui 13px
//    dotted-underline address. IM Fell → Georgia graceful fallback.
//  - See docs/share-booth-build-spec.md v3 addendum and
//    docs/mockups/share-booth-email-v3.html (Variant A) for the lock.
//
// Session 52 Q-011 v2 (2026-04-24):
//  - Window email banner redesign per docs/mockups/share-booth-email-v2.html
//    (v2.2 final state, locked session 51). Four-axis brand-drift fix:
//    (1) post-it rendered as a STYLED DIV, not inline SVG — Gmail web strips
//        <rect> / <circle> SVG children as anti-tracking defense, leaving
//        only the numeral as flow content. Plain <div> with background-color
//        survives. (Helper retired in v3.)
//    (2) Banner is Variant B — post-it embedded bottom-right inside the
//        banner frame (position: absolute), no negative-margin overhang.
//        Banner height bumps to 220px + border-radius 16px.
//    (3) Mall location line replaces the Unicode ⦲ with the teardrop
//        PinGlyph SVG from components/BoothPage.tsx. Restores session-17
//        glyph hierarchy (pin = mall, post-it = booth).
//    (4) Vendor name is IM Fell 32px/400 (non-italic), loaded via Google
//        Fonts <link> in the shell <head>. Georgia is the graceful fallback
//        for Outlook + some Android clients. Eyebrow "Step inside a curated
//        booth from" echoes /shelf BoothTitleBlock voice.
//  - Masthead shrunk to SMALL — 13px uppercase "TREEHOUSE FINDS" Georgia 600
//    letterspaced + 10px italic tagline preserved. Quiet brand anchor; the
//    booth leads. Supersedes session-38 decision 4.
//  - Opener rewritten: Georgia italic 15px "You've received a personal invite."
//    Always renders. Retires the senderMode branching — senderFirstName was
//    always vendor.display_name, producing "Kentucky Treehouse sent you a
//    Window into Kentucky Treehouse." in QA. No sender name to resolve means
//    no bug surface. Preheader simplifies to "A personal invite to a curated
//    booth."; plain-text opener adopts the same universal line.
//  - senderFirstName + senderMode now @deprecated on ShareBoothWindowPayload.
//    Server route still passes them (for rate-limit bucket selection — auth
//    branch vs anon branch is unchanged) but the email template ignores both.
//    Safe-delete from the payload in a follow-up cleanup session.
//
// Session 41 Q-010 (2026-04-21):
//  - Window email CTA URL fixed from /vendor/{slug} → /shelf/{slug}. The
//    canonical public shelf route is /shelf/{slug}; /vendor/{slug} is a
//    legacy alias kept for URL-compat but not the target for new outgoing
//    links. `handleShare` in /my-shelf uses /shelf/{slug} — this aligns
//    Window emails with that committed URL.
//  - Local variable renamed vendorPageUrl → shelfPageUrl so future readers
//    don't have to trace "why does a variable named vendor lead to /shelf".
//  - Caught by David's session-41 QA walk Scenario 1.5 — email CTA on
//    delivered Window email routed to /vendor/kentucky-chicken instead of
//    /shelf/kentucky-chicken. Build-spec §3 incorrectly specified /vendor/;
//    spec updated separately.
//
// Session 39 (Q-007 Window Sprint):
//  - Added sendBoothWindow() extending renderEmailShell() with a new
//    footerHtml override (default preserves the onboarding footer copy
//    for the two existing callers — session-33 dependent-surface audit).
//  - Post-it rendered as INLINE SVG (not CSS transform) for Outlook
//    compat. CSS rotation is stripped; SVG rotation is preserved.
//  - Window grid as a 3×2 HTML <table> (table-based layout mandatory
//    for Outlook; nested divs collapse unpredictably).
//  - Subject line mode-neutral ("A Window into {vendor}") so the copy
//    reads true whether sender is vendor or shopper.
//
// Session 32 v1.2 (onboarding refresh) history preserved below.
//
// Session 32 v1.2 changes:
//  - Moved off v0.2 white-card chrome onto v1.1l paper-as-surface (#e8ddc7 bg,
//    no inner card). Paper IS the container.
//  - IM Fell English retired from all three email templates. Brand lockup,
//    eyebrows, signatures now all Georgia. Safest across every mail client
//    (Outlook/Gmail strip external font loads), zero external font request,
//    fastest render. Sprint 5 typography reassessment will revisit IM Fell's
//    use elsewhere in the app.
//  - Email #1 copy updated to acknowledge the new booth photo (added v1.2)
//    and drop the "we'll take a look at your booth at X" visit implication.
//  - Email #2 clickable CTA link retired — it opened in a Safari tab on
//    iPhones with the PWA installed, breaking session continuity. New copy:
//    "Open Treehouse on your phone, tap Sign In, and enter this email:"
//    with the address echoed in a copyable pill.
//  - Salutations use first_name only ("Hi Sarah", not "Hi Sarah Morrison").
//
// Design notes (preserved from session 8):
//  - Best-effort delivery. All functions catch and log errors rather than
//    throwing. A failed email should not fail the underlying HTTP request.
//  - No Resend SDK dependency — native fetch against Resend REST API.
//  - RESEND_API_KEY unset → no-op with console warning (keeps local dev
//    frictionless).
//  - From: Treehouse Finds <hello@kentuckytreehouse.com>. Reply-to is admin email.

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS   = "Treehouse Finds <hello@kentuckytreehouse.com>";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.kentuckytreehouse.com";
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface RequestReceivedPayload {
  /**
   * First name used for the salutation. v1.2 prefers first_name alone
   * ("Hi Sarah") over the legacy full-name salutation ("Hi Sarah Morrison").
   * Callers that still only have a combined `name` can pass just that string
   * here — the template will use it verbatim.
   */
  firstName: string;
  email:     string;
  mallName?: string | null;
}

export interface ApprovalPayload {
  firstName:    string;
  email:        string;
  mallName?:    string | null;
  boothNumber?: string | null;
  /**
   * Vendor's hero photo (proof photo from the request, or a later-uploaded
   * booth photo). Renders as a banner above the instructions block when
   * present. Reverses the session-32 v1.2 image-less treatment after
   * session-104 follow-up: vendors should see *their booth* in the welcome
   * email, not just text.
   */
  heroImageUrl?: string | null;
}

// ── Email #1 — Request received (receipt) ────────────────────────────────────

/**
 * Sends the "we got your request" receipt email.
 *
 * Triggered by: POST /api/vendor-request (after successful insert)
 *
 * v1.2: copy acknowledges the booth photo + drops the visit implication.
 * Doubles as a data-integrity check — a typo'd email will bounce and the
 * vendor will notice before admin wastes time approving a dead-letter
 * request.
 */
export async function sendRequestReceived(
  payload: RequestReceivedPayload,
): Promise<{ ok: boolean; error?: string }> {
  const firstName  = payload.firstName.trim() || "there";
  const subject    = `We got your Treehouse Finds request, ${firstName}`;

  const html = renderEmailShell({
    preheader: "Thanks for putting your booth forward — we'll be in touch.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(firstName)},</p>
      <p style="${pStyle}">Thanks — we got your booth photo and details.</p>
      <p style="${pStyle}">We'll take a look and be in touch when your shelf is ready to fill.</p>
      <p style="${signStyle}">&mdash; Treehouse Finds</p>
    `,
  });

  const text = [
    `Hi ${firstName},`,
    ``,
    `Thanks — we got your booth photo and details.`,
    ``,
    `We'll take a look and be in touch when your shelf is ready to fill.`,
    ``,
    `— Treehouse Finds`,
  ].join("\n");

  return sendEmail({
    to:      payload.email,
    replyTo: "info@kentuckytreehouse.com",
    subject,
    html,
    text,
  });
}

// ── Email #2 — Approval + sign-in instructions ──────────────────────────────

/**
 * Sends the "your booth is ready — sign in" email after admin approves a
 * vendor request.
 *
 * Triggered by: POST /api/admin/vendor-requests { action: "approve" }
 *
 * v1.2: no clickable in-app link (PWA session-continuity fix). Vendor opens
 * Treehouse themselves; email address is echoed in a copyable pill so the
 * vendor can long-press-to-copy if they don't know it by heart.
 */
export async function sendApprovalInstructions(
  payload: ApprovalPayload,
): Promise<{ ok: boolean; error?: string }> {
  const firstName  = payload.firstName.trim() || "there";
  const subject    = `Your Treehouse Finds booth is ready, ${firstName}`;
  const siteUrl    = getSiteUrl();

  const mallLine = payload.mallName
    ? `Your booth at ${escapeHtml(payload.mallName)} is ready to start filling with finds.`
    : `Your booth is ready to start filling with finds.`;

  // Booth hero image — banner above the instructions block. Skipped silently
  // when the vendor row has no hero (rare; createVendor backfills from the
  // proof photo on approval).
  const heroBlock = payload.heroImageUrl
    ? `
      <div style="margin: 0 0 24px;">
        <img src="${escapeAttr(payload.heroImageUrl)}" alt="${escapeAttr(payload.mallName ?? "Your booth")}" width="540" height="200" style="display: block; width: 100%; max-width: 540px; height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid ${HAIR_SOFT};" />
      </div>`
    : ``;

  const html = renderEmailShell({
    preheader: "Your booth is ready — open Treehouse to sign in.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(firstName)},</p>
      <p style="${pStyle}">${mallLine}</p>

      ${heroBlock}

      <!-- Primary CTA — direct link to the app. Reverses session-32 v1.2
           PWA-session-continuity decision per session-104 product call:
           prioritize onboarding adoption; PWA install can come later. -->
      <div style="margin: 0 0 24px; padding: 0 4px;">
        <a href="${escapeAttr(siteUrl)}" style="display: block; padding: 15px 20px; background: #1e4d2b; color: #fff9e8; font-family: ${SERIF}; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; letter-spacing: 0.005em;">
          Open Treehouse Finds
        </a>
      </div>

      <!-- Instruction box (paper-wash primitive) — sign-in helper -->
      <div style="${boxStyle}">
        <p style="${boxPStyle}">
          Once you're there, tap <strong style="color:#2a1a0a;font-weight:600;">Sign In</strong> and enter this email:
        </p>
        <p style="${boxPStyle} text-align:center; margin-bottom: 10px;">
          <span style="${echoPillStyle}">${escapeHtml(payload.email)}</span>
        </p>
        <p style="${boxPStyle} margin-bottom: 0;">
          We'll send you a 6-digit code to finish signing in.
        </p>
      </div>

      <p style="${pStyle} margin-top: 22px;">Welcome to the search.</p>
      <p style="${signStyle}">&mdash; Treehouse Finds</p>
    `,
  });

  const text = [
    `Hi ${firstName},`,
    ``,
    payload.mallName
      ? `Your booth at ${payload.mallName} is ready to start filling with finds.`
      : `Your booth is ready to start filling with finds.`,
    ``,
    `Open Treehouse Finds:`,
    `  ${siteUrl}`,
    ``,
    `Once you're there, tap Sign In and enter this email:`,
    ``,
    `  ${payload.email}`,
    ``,
    `We'll send you a 6-digit code to finish signing in.`,
    ``,
    `Welcome to the search.`,
    ``,
    `— Treehouse Finds`,
  ].join("\n");

  return sendEmail({
    to:      payload.email,
    replyTo: "info@kentuckytreehouse.com",
    subject,
    html,
    text,
  });
}

// ── Email #3 — Window share (Q-007, session 39) ─────────────────────────

/**
 * The Window share email payload.
 *
 * Session 52 Q-011 v2: the email template no longer consults `senderFirstName`
 * or `senderMode` — the opener is a universal `"You've received a personal
 * invite."` line that runs for vendor, admin, and anonymous shopper sends.
 * The server route still reads `senderMode` to pick the right rate-limit
 * bucket (5/10min auth vs 2/10min anon), but that's server-side only. Both
 * fields are kept on the type as optional + @deprecated so callers that still
 * pass them (currently just /api/share-booth) don't have to change — and so
 * a follow-up cleanup session can delete them cleanly.
 */
export interface ShareBoothWindowPayload {
  recipientEmail: string;
  /**
   * @deprecated Session 52 / Q-011 v2 — display-unused in the email template.
   * Retained on the type for back-compat with /api/share-booth, which still
   * passes `vendor.display_name` here. Safe to remove in a follow-up cleanup.
   */
  senderFirstName?: string;
  /**
   * @deprecated Session 52 / Q-011 v2 — no longer consulted by the email
   * template (which renders the same universal opener regardless of sender).
   * Server route in /api/share-booth still uses this for rate-limit bucket
   * selection (5/10min auth vs 2/10min anon); that logic is unchanged and
   * lives on the route side, not the email side.
   */
  senderMode?:    "vendor" | "anonymous";
  vendor: {
    displayName:   string;
    boothNumber:   string | null;
    heroImageUrl:  string | null;
    slug:          string;
  };
  mall: {
    name:          string;
    address:       string | null;
    googleMapsUrl: string | null;
  };
  posts: Array<{
    id:         string;
    title:      string;
    imageUrl:   string | null;
    // price_asking is intentionally omitted — brand rule: no prices in the
    // Window. Kept out of the interface entirely so no caller can accidentally
    // wire them in.
  }>;
}

/**
 * Sends a Window share email to a single recipient.
 *
 * Triggered by: POST /api/share-booth (after requireAuth + ownership check
 * + rate limit + empty-window guard).
 *
 * Best-effort delivery like the other email functions. Returns { ok, error? }.
 * Never throws; a failed send should not fail the HTTP request (Resend is
 * down, RESEND_API_KEY missing, etc.). Caller logs on !ok and surfaces the
 * error to the user.
 *
 * Subject line is mode-neutral ("A Window into {vendor}") so the copy reads
 * true whether sender is the vendor or a shopper who stumbled in — MVP only
 * allows the former via ownership check but the email copy stays honest.
 */
export async function sendBoothWindow(
  payload: ShareBoothWindowPayload,
): Promise<{ ok: boolean; error?: string }> {
  const siteUrl    = getSiteUrl();

  const vendorName    = payload.vendor.displayName.trim() || "a booth";
  // Session 41 Q-010: canonical public booth URL is /shelf/{slug}, not
  // /vendor/{slug}. The Window CTA and the plain-text fallback both land
  // recipients here.
  const shelfPageUrl  = `${siteUrl}/shelf/${payload.vendor.slug}`;

  // Session 52 Q-011 v4: subject + preheader + opener all share the same
  // phrase. "Window" retires from user-facing copy; lives on in internal
  // identifiers only (sendBoothWindow, ShareBoothWindowPayload, the QA-walk
  // doc — developer-facing, no reason to churn).
  const subject    = `A personal invite to explore ${vendorName}`;
  const preheader  = `A personal invite to explore ${vendorName}.`;

  const bodyHtml = renderWindowBody({
    vendorName,
    boothNumber:    payload.vendor.boothNumber,
    heroImageUrl:   payload.vendor.heroImageUrl,
    mallName:       payload.mall.name,
    mallAddress:    payload.mall.address,
    googleMapsUrl:  payload.mall.googleMapsUrl,
    posts:          payload.posts,
    shelfPageUrl,
  });

  const footerHtml = `You're receiving this because someone shared a Treehouse Finds Window with you. Reply to this email if anything looks off.`;

  const html = renderEmailShell({ preheader, bodyHtml, footerHtml });

  // Plain-text fallback. Email clients that can't render HTML (or the
  // user's preview pane) fall back to this.
  // Session 52 Q-011 v4: opener matches the HTML body's single phrase.
  // URL moves up directly after the mall info (mirrors the HTML's
  // button placement below the banner + info bar). Tile list moves
  // below the URL as supporting preview.
  const text = [
    `You've received a personal invite to explore ${vendorName}.`,
    ``,
    payload.vendor.boothNumber ? `Booth ${payload.vendor.boothNumber}` : ``,
    `${payload.mall.name}${payload.mall.address ? " — " + payload.mall.address : ""}`,
    ``,
    `Explore the booth:`,
    shelfPageUrl,
    ``,
    `Finds in the booth:`,
    ...payload.posts.map(p => `  • ${p.title}`),
    ``,
    `— Treehouse Finds`,
  ].filter(Boolean).join("\n");

  return sendEmail({
    to:      payload.recipientEmail,
    replyTo: "info@kentuckytreehouse.com",
    subject,
    html,
    text,
  });
}

// ── Window body composition (internal helpers) ───────────────────────────

interface WindowBodyOpts {
  vendorName:    string;
  boothNumber:   string | null;
  heroImageUrl:  string | null;
  mallName:      string;
  mallAddress:   string | null;
  googleMapsUrl: string | null;
  posts:         Array<{ id: string; title: string; imageUrl: string | null }>;
  // Renamed from vendorPageUrl → shelfPageUrl in session 41 Q-010 to reflect
  // the canonical public shelf URL (/shelf/{slug}, not /vendor/{slug}).
  shelfPageUrl:  string;
}

function renderWindowBody(opts: WindowBodyOpts): string {
  const {
    vendorName, boothNumber, heroImageUrl,
    mallName, mallAddress, googleMapsUrl, posts, shelfPageUrl,
  } = opts;

  // Session 52 Q-011 v4: simplified opener (one italic line flowing into
  // the vendor name as its object) + button moved up directly under the
  // banner + info bar + closer block deleted. Tiles stand naked below the
  // button as supporting preview.
  return `
      <!-- Invite line — flows grammatically into the vendor name -->
      <p style="margin: 0 16px 10px; padding: 0; font-family: ${SERIF}; font-style: italic; font-size: 15px; line-height: 1.5; color: ${INKMID}; text-align: center; letter-spacing: 0.01em;">
        You've received a personal invite to explore
      </p>

      <!-- Vendor name hero — IM Fell 34px, undisputed top visual -->
      <h2 style="margin: 0 10px 20px; padding: 0; font-family: ${IMFELL}; font-size: 34px; font-weight: 400; color: ${INK}; line-height: 1.1; letter-spacing: -0.005em; text-align: center;">
        ${escapeHtml(vendorName)}
      </h2>

      <!-- Banner + attached 2-cell info bar (v3 locked, unchanged) -->
      ${renderBanner(heroImageUrl, boothNumber, vendorName, mallName, mallAddress, googleMapsUrl)}

      <!-- Primary CTA — full-width green block, directly under info bar -->
      <div style="margin: 0 0 28px; padding: 0 4px;">
        <a href="${escapeAttr(shelfPageUrl)}" style="display: block; padding: 15px 20px; background: #1e4d2b; color: #fff9e8; font-family: ${SERIF}; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; letter-spacing: 0.005em;">
          Explore the booth
        </a>
      </div>

      <!-- Supporting tile preview — 6-tile 3×2 grid, no eyebrow -->
      ${renderWindowGrid(posts)}
  `;
}

/**
 * Banner primitive — v3 unified image + info bar (session 52 Q-011 v3).
 *
 * Structure: one rounded outer div with `overflow: hidden` wrapping two
 * siblings — the hero image on top, the info-bar <table> on bottom. Info
 * bar has two cells: booth (32% width, centered "BOOTH" eyebrow + numeral)
 * and mall (68%, IM Fell name + dotted-underline address). Hairline
 * divider above the info bar (image-to-info-bar boundary) + a softer
 * hairline between the two cells.
 *
 * Why this shape: v2's overlap-style post-it (and its v2.1 sibling refactor)
 * both failed Gmail QA because Gmail strips `position` from inline styles
 * and mangles inline-flow overlap patterns. v3 uses only HTML <table> +
 * block <div> with border/padding/background — the oldest, most forgiving
 * email primitives. Renders identically in every mail client in circulation.
 *
 * Semantic improvement: v2 split booth-number and mall-info across two
 * primitives (post-it overlay + standalone pin-prefixed location row).
 * "This booth is at that mall" is one thought — v3 unifies them.
 *
 * Fallback when heroImageUrl is null: linear-gradient earth-tone wash at
 * 200px height.
 *
 * Fallback when boothNumber is null: info bar drops the booth cell, mall
 * cell takes full width. (Rare in practice — booth without a number.)
 *
 * Fallback when mallAddress is null: mall cell shows only the name.
 * Fallback when googleMapsUrl is null: address renders as plain text, no
 * underline.
 */
function renderBanner(
  heroImageUrl:  string | null,
  boothNumber:   string | null,
  vendorName:    string,
  mallName:      string,
  mallAddress:   string | null,
  googleMapsUrl: string | null,
): string {
  // Hero layer. Block-level, fills the wrapper. Outlook ignores object-fit;
  // graceful degradation is the image stretches/squashes — hero is decorative.
  const heroLayer = heroImageUrl
    ? `<img src="${escapeAttr(heroImageUrl)}" alt="${escapeAttr(vendorName)}" width="540" height="200" style="display: block; width: 100%; max-width: 540px; height: 200px; object-fit: cover; border: 0;" />`
    : `<div style="width: 100%; height: 200px; background: linear-gradient(135deg, #8a7555 0%, #5a4a2e 100%);"></div>`;

  // Numeral auto-shrinks by digit count. Tighter than v2's post-it numeral
  // (30/24/20) because the info-bar cell is narrower than a post-it square.
  const digitCount = boothNumber ? boothNumber.length : 0;
  const numeralSize = digitCount <= 4 ? 26 : digitCount === 5 ? 22 : 18;

  // Address content. Dotted underline only when a Google Maps link wraps it.
  const addressStyleBase = `font-family: ${SYS}; font-size: 13px; color: ${INKMID}; line-height: 1.45;`;
  const addressStyleLink = `${addressStyleBase} text-decoration: underline; text-decoration-style: dotted; text-decoration-color: ${FAINT}; text-underline-offset: 2px;`;
  const addressContent = mallAddress
    ? (googleMapsUrl
        ? `<a href="${escapeAttr(googleMapsUrl)}" style="${addressStyleLink}">${escapeHtml(mallAddress)}</a>`
        : `<span style="${addressStyleBase}">${escapeHtml(mallAddress)}</span>`)
    : ``;

  const boothCell = boothNumber
    ? `
        <td width="32%" valign="middle" style="padding: 12px 16px; border-right: 1px solid ${HAIR_SOFT}; text-align: center;">
          <p style="margin: 0 0 3px; padding: 0; font-family: ${SERIF}; font-style: italic; font-size: 11px; letter-spacing: 0.12em; line-height: 1.1; color: ${INKMID};">
            BOOTH
          </p>
          <p style="margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; font-size: ${numeralSize}px; font-weight: 500; line-height: 1; color: ${INK};">
            ${escapeHtml(boothNumber)}
          </p>
        </td>`
    : ``;

  // When there's no booth number, mall cell takes full width with
  // consistent padding. Otherwise 68%.
  const mallCellWidth = boothNumber ? `68%` : `100%`;

  return `
      <div style="margin: 0 0 20px; border: 1px solid ${HAIR_SOFT}; border-radius: 16px; overflow: hidden;">
        ${heroLayer}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${PAPER}; border-top: 1px solid ${HAIR};">
          <tr>
            ${boothCell}
            <td width="${mallCellWidth}" valign="middle" style="padding: 12px 16px;">
              <div style="font-family: ${IMFELL}; font-size: 17px; color: ${INK}; line-height: 1.25; letter-spacing: -0.005em; margin: 0 0 2px;">
                ${escapeHtml(mallName)}
              </div>
              ${addressContent ? `<div style="margin: 0;">${addressContent}</div>` : ``}
            </td>
          </tr>
        </table>
      </div>
  `;
}

/**
 * The Window — 6-tile grid, 3 cols × 2 rows, HTML <table>.
 *
 * Outlook note: nested tables are the only reliable grid primitive. Flexbox,
 * CSS grid, and display:inline-block all break in at least one major client.
 *
 * If fewer than 6 posts are passed, empty cells are rendered with a paper
 * wash — but this shouldn't happen in practice since the /api/share-booth
 * route rejects empty-window sends and the /my-shelf entry icon is hidden
 * when posts.length < 1. Defense-in-depth only.
 *
 * Title truncation: we rely on the email client's own word-wrap at the
 * ~130px cell width. Georgia 12px wraps naturally; 2-line max is enforced
 * via max-height + overflow. Build-spec §Unresolved #3 picked option (b).
 */
function renderWindowGrid(
  posts: Array<{ id: string; title: string; imageUrl: string | null }>,
): string {
  if (posts.length === 0) return ``;

  // Pad to a multiple of 3 with null cells so each row is complete.
  // Shouldn't happen (empty-window guard blocks send before here) but keeps
  // the HTML well-formed if it does.
  const padded: Array<{ id: string; title: string; imageUrl: string | null } | null> = [...posts];
  while (padded.length % 3 !== 0 && padded.length < 6) padded.push(null);

  const rows: string[] = [];
  for (let i = 0; i < padded.length; i += 3) {
    const rowCells = [padded[i], padded[i + 1], padded[i + 2]].map(cell => {
      if (!cell) {
        return `<td width="33.33%" valign="top" style="padding: 6px;">
            <div style="background: rgba(42,26,10,0.04); aspect-ratio: 4/5; width: 100%; border-radius: 6px; min-height: 140px;"></div>
          </td>`;
      }
      const img = cell.imageUrl
        ? `<img src="${escapeAttr(cell.imageUrl)}" alt="${escapeAttr(cell.title)}" width="100%" style="display: block; width: 100%; height: auto; aspect-ratio: 4/5; object-fit: cover; border-radius: 6px;" />`
        : `<div style="background: rgba(42,26,10,0.06); aspect-ratio: 4/5; width: 100%; border-radius: 6px; min-height: 140px;"></div>`;
      return `<td width="33.33%" valign="top" style="padding: 6px;">
          ${img}
          <p style="margin: 7px 0 0; padding: 0; font-family: ${SERIF}; font-style: italic; font-size: 12px; line-height: 1.35; color: ${INKMID}; max-height: 2.7em; overflow: hidden; text-align: center;">
            ${escapeHtml(cell.title)}
          </p>
        </td>`;
    }).join("");
    rows.push(`<tr>${rowCells}</tr>`);
  }

  // Session 52 Q-011 v4: "The Window" eyebrow retired. Tiles stand naked
  // under the button as supporting preview — no label needed, the grid
  // is self-explanatory.
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 8px;">
        ${rows.join("")}
      </table>
  `;
}

// ── Internal: send via Resend REST API ──────────────────────────────────────

interface SendEmailInput {
  to:       string;
  subject:  string;
  html:     string;
  text:     string;
  replyTo?: string;
}

async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — skipping send to",
      maskEmail(input.to),
    );
    return { ok: true };
  }

  const body: Record<string, unknown> = {
    from:    FROM_ADDRESS,
    to:      [input.to],
    subject: input.subject,
    html:    input.html,
    text:    input.text,
  };
  if (input.replyTo) body.reply_to = input.replyTo;

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "unreadable response");
      console.error(
        `[email] Resend API error (${res.status}) sending to ${maskEmail(input.to)}:`,
        errorText,
      );
      return { ok: false, error: `Resend ${res.status}: ${errorText}` };
    }

    console.log(`[email] Sent "${input.subject}" to ${maskEmail(input.to)}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[email] Unexpected error sending to ${maskEmail(input.to)}:`,
      message,
    );
    return { ok: false, error: message };
  }
}

// ── Internal: HTML template shell (v1.2 paper-as-surface, all Georgia) ──────

// Georgia for body copy + masthead + signatures; IM Fell English for editorial
// voice (Window email vendor name + eyebrow + mall name) — loaded via Google
// Fonts <link> in the shell <head>, Georgia falls back in Outlook + some
// Android clients. System UI for the mall address (matches /shelf BoothPage
// treatment).
const SERIF     = "Georgia, 'Times New Roman', serif";
const IMFELL    = "'IM Fell English', Georgia, 'Times New Roman', serif";
const SYS       = "-apple-system, 'Segoe UI', Roboto, sans-serif";
const INK       = "#2a1a0a";
const INKMID    = "#4a3520";
const PAPER     = "#e8ddc7";
// Two hairline weights. HAIR (stronger) = image-to-info-bar divider and shell
// masthead/footer rules. HAIR_SOFT (quieter) = cell-to-cell dividers inside
// the info bar and the outer frame border.
const HAIR      = "rgba(42,26,10,0.18)";
const HAIR_SOFT = "rgba(42,26,10,0.12)";
const FAINT     = "rgba(42,26,10,0.28)";

const pStyle    = `margin: 0 0 16px; font-family: ${SERIF}; font-size: 16px; line-height: 1.7; color: ${INK};`;
const signStyle = `margin: 28px 0 0; font-family: ${SERIF}; font-style: italic; font-size: 16px; line-height: 1.5; color: ${INKMID};`;

// Instruction box — paper-wash primitive matching the v1.1k success-screen
// surface. Translucent postit wash on paperCream, inkHairline border.
const boxStyle  = `margin: 24px 0 8px; padding: 18px 18px; background: rgba(255,250,234,0.55); border: 1px solid ${HAIR}; border-radius: 10px;`;
const boxPStyle = `margin: 0 0 10px; font-family: ${SERIF}; font-size: 15px; line-height: 1.65; color: ${INKMID};`;

// Echo pill — system-ui on paper-wash tab background, matches the v1.1k
// email echo line primitive style where possible. Stays small and quiet.
const echoPillStyle = `display: inline-block; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: rgba(42,26,10,0.06); padding: 3px 10px; border-radius: 4px; font-size: 14px; color: ${INK}; font-weight: 500; letter-spacing: -0.005em;`;

function renderEmailShell(opts: { preheader: string; bodyHtml: string; footerHtml?: string }): string {
  // Table-based layout for email-client compatibility. Paper as surface —
  // no inner white card. Body content sits directly on paperCream.
  //
  // Footer override (session 39): the onboarding emails (receipt + approval)
  // use the default "you submitted a booth request" copy; the Window email
  // passes its own "someone shared a Window with you" copy. The default is
  // preserved verbatim so existing callers don't shift.
  const footerHtml = opts.footerHtml ?? `You're receiving this because you submitted a booth request to Treehouse Finds. Reply to this email if anything looks off.`;

  // Session 104 — wordmark masthead reinstated (reverses session-52 v4
  // retirement). Hosted /wordmark.png at 160px display width, hairline
  // divider below. Gmail blocks images by default — alt="Treehouse Finds"
  // ensures a brand-name fallback before the user shows-images.
  const wordmarkUrl = `${getSiteUrl()}/wordmark.png`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Treehouse Finds</title>
  <!-- IM Fell English — editorial voice for Window email (session 52 Q-011 v2).
       Georgia falls back in Outlook + some Android clients. -->
  <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: ${PAPER}; font-family: ${SERIF};">
  <!-- Preheader — hidden, drives inbox preview -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(opts.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${PAPER};">
    <tr>
      <td align="center" style="padding: 36px 16px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px;">
          <!-- Wordmark masthead — session 104 reinstatement. -->
          <tr>
            <td align="center" style="padding: 8px 10px 22px; border-bottom: 1px solid ${HAIR};">
              <img src="${wordmarkUrl}" alt="Treehouse Finds" width="160" style="display: inline-block; max-width: 160px; height: auto; border: 0;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 24px 10px 0;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <!-- Footer — quiet, italic, faint -->
          <tr>
            <td style="padding: 28px 10px 0;">
              <div style="border-top: 1px solid ${HAIR}; padding-top: 22px; text-align: center;">
                <p style="margin: 0; font-family: ${SERIF}; font-size: 11px; color: ${FAINT}; line-height: 1.6;">
                  ${footerHtml}
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Internal: helpers ────────────────────────────────────────────────────────

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape for use inside an HTML attribute value (e.g. href, src, alt).
 * Currently identical to escapeHtml — both handle the critical `"` and `&`
 * characters that break attribute parsing. Kept as a separate symbol so future
 * callers don't have to reason about which to use at call sites.
 */
function escapeAttr(input: string): string {
  return escapeHtml(input);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
