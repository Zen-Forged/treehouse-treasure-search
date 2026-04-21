// lib/email.ts
// Resend-backed transactional emails for vendor onboarding + booth sharing.
//
// Three public functions:
//   sendRequestReceived(payload)       — Email #1 per onboarding-journey.md
//   sendApprovalInstructions(payload)  — Email #2 per onboarding-journey.md
//   sendBoothWindow(payload)           — Window share email (Q-007, session 39)
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
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
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
    replyTo: adminEmail || undefined,
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
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const firstName  = payload.firstName.trim() || "there";
  const subject    = `Your Treehouse Finds booth is ready, ${firstName}`;

  const mallLine = payload.mallName
    ? `Your booth at ${escapeHtml(payload.mallName)} is ready to start filling with finds.`
    : `Your booth is ready to start filling with finds.`;

  const html = renderEmailShell({
    preheader: "Your booth is ready — open Treehouse to sign in.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(firstName)},</p>
      <p style="${pStyle}">${mallLine}</p>

      <!-- Instruction box (paper-wash primitive) -->
      <div style="${boxStyle}">
        <p style="${boxPStyle}">
          To sign in, open <strong style="color:#2a1a0a;font-weight:600;">Treehouse Finds</strong> on your phone, tap <strong style="color:#2a1a0a;font-weight:600;">Sign In</strong>, and enter this email:
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
    `To sign in, open Treehouse Finds on your phone, tap Sign In, and enter this email:`,
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
    replyTo: adminEmail || undefined,
    subject,
    html,
    text,
  });
}

// ── Email #3 — Window share (Q-007, session 39) ─────────────────────────

/**
 * The Window share email payload.
 *
 * Design note on `senderFirstName`: this feeds the in-body italic voice line.
 * For MVP (session 39), `/api/share-booth` passes `vendor.display_name` here
 * — the ownership check in the route guarantees the signed-in user owns the
 * active vendor, so "vendor shares their own booth" is the only path. If
 * non-vendor shoppers ever share a booth (Direction A territory, Sprint 5+),
 * the sender-name source will need its own resolution step upstream.
 *
 * Design note on pronoun: build-spec §Unresolved flagged three options. We
 * lean on option (c) — drop pronoun entirely, rephrase with vendor name:
 * "Sarah sent you a Window into ZenForged Finds." Cleanest, no schema change,
 * no guessing. Matches the subject-line pattern ("A Window into {vendor}").
 */
export interface ShareBoothWindowPayload {
  recipientEmail: string;
  /** Signed-in user's display name — for MVP equals vendor.displayName. */
  senderFirstName: string;
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
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const siteUrl    = getSiteUrl();

  const vendorName     = payload.vendor.displayName.trim() || "a booth";
  const senderFirst    = payload.senderFirstName.trim() || "Someone";
  const vendorPageUrl  = `${siteUrl}/vendor/${payload.vendor.slug}`;

  const subject    = `A Window into ${vendorName}`;
  const preheader  = `${senderFirst} sent you a Window into ${vendorName}.`;

  const bodyHtml = renderWindowBody({
    senderFirst,
    vendorName,
    boothNumber:    payload.vendor.boothNumber,
    heroImageUrl:   payload.vendor.heroImageUrl,
    mallName:       payload.mall.name,
    mallAddress:    payload.mall.address,
    googleMapsUrl:  payload.mall.googleMapsUrl,
    posts:          payload.posts,
    vendorPageUrl,
  });

  const footerHtml = `You're receiving this because someone shared a Treehouse Finds Window with you. Reply to this email if anything looks off.`;

  const html = renderEmailShell({ preheader, bodyHtml, footerHtml });

  // Plain-text fallback. Email clients that can't render HTML (or the
  // user's preview pane) fall back to this. Keep it readable as prose.
  const text = [
    `${senderFirst} sent you a Window into ${vendorName}.`,
    ``,
    vendorName,
    payload.vendor.boothNumber ? `Booth ${payload.vendor.boothNumber}` : ``,
    `${payload.mall.name}${payload.mall.address ? " — " + payload.mall.address : ""}`,
    ``,
    `The Window:`,
    ...payload.posts.map(p => `  • ${p.title}`),
    ``,
    `Explore the rest of the booth:`,
    vendorPageUrl,
    ``,
    `— Treehouse Finds`,
  ].filter(Boolean).join("\n");

  return sendEmail({
    to:      payload.recipientEmail,
    replyTo: adminEmail || undefined,
    subject,
    html,
    text,
  });
}

// ── Window body composition (internal helpers) ───────────────────────────

interface WindowBodyOpts {
  senderFirst:   string;
  vendorName:    string;
  boothNumber:   string | null;
  heroImageUrl:  string | null;
  mallName:      string;
  mallAddress:   string | null;
  googleMapsUrl: string | null;
  posts:         Array<{ id: string; title: string; imageUrl: string | null }>;
  vendorPageUrl: string;
}

function renderWindowBody(opts: WindowBodyOpts): string {
  const {
    senderFirst, vendorName, boothNumber, heroImageUrl,
    mallName, mallAddress, googleMapsUrl, posts, vendorPageUrl,
  } = opts;

  const voiceLine = `${escapeHtml(senderFirst)} sent you a Window into ${escapeHtml(vendorName)}.`;

  return `
      <!-- Sender voice line — italic, quiet -->
      <p style="margin: 0 0 24px; font-family: ${SERIF}; font-style: italic; font-size: 14px; line-height: 1.6; color: ${INKMID}; text-align: center;">
        ${voiceLine}
      </p>

      <!-- Vendor name hero — Georgia 34px centered -->
      <h2 style="margin: 0 0 20px; padding: 0; font-family: ${SERIF}; font-size: 34px; font-weight: 600; color: ${INK}; line-height: 1.15; letter-spacing: -0.01em; text-align: center;">
        ${escapeHtml(vendorName)}
      </h2>

      <!-- Banner: hero photograph + pinned post-it. Table-based for Outlook. -->
      ${renderBanner(heroImageUrl, boothNumber, vendorName)}

      <!-- Location line — pin glyph + mall + address -->
      ${renderLocationLine(mallName, mallAddress, googleMapsUrl)}

      <!-- The Window — 6-tile grid, 3 cols × 2 rows, HTML table -->
      ${renderWindowGrid(posts)}

      <!-- Closer block + CTA -->
      <div style="margin: 30px 0 0; text-align: center;">
        <p style="margin: 0 0 6px; font-family: ${SERIF}; font-style: italic; font-size: 19px; line-height: 1.35; color: ${INK};">
          Explore the rest of the booth
        </p>
        <p style="margin: 0 0 20px; font-family: ${SERIF}; font-size: 13px; line-height: 1.55; color: ${INKMID};">
          More treasures waiting to be discovered.
        </p>
        <a href="${escapeAttr(vendorPageUrl)}" style="display: inline-block; padding: 12px 22px; background: #1e4d2b; color: #fff9e8; font-family: ${SERIF}; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 999px; letter-spacing: 0.005em;">
          Open in Treehouse Finds
        </a>
      </div>
  `;
}

/**
 * Banner primitive — hero image with post-it pinned bottom-right.
 *
 * Rendering strategy: nested <table> with background-image on a wrapper cell
 * (via `background` attribute + VML fallback for Outlook). Post-it overlays
 * using absolute positioning inside a conditional-compat wrapper. CSS
 * transforms are stripped by Outlook; the post-it rotation is baked into
 * an inline SVG instead (see renderPostItSvg).
 *
 * Graceful fallback when heroImageUrl is null: solid earth-tone fill with
 * a subtle linear-gradient overlay to simulate the scrim.
 */
function renderBanner(
  heroImageUrl: string | null,
  boothNumber:  string | null,
  vendorName:   string,
): string {
  const bannerBg = heroImageUrl
    ? `background: #1a1a18 url('${escapeAttr(heroImageUrl)}') center/cover no-repeat;`
    : `background: linear-gradient(135deg, #6a4e30 0%, #8a6b45 50%, #5a3e20 100%);`;

  // Mail-client note: the <img> fallback ensures Outlook desktop (which often
  // ignores background-image on td) still shows the hero. Object-fit is NOT
  // respected in most email clients; we rely on width/height + max-height.
  const heroFallbackImg = heroImageUrl
    ? `<img src="${escapeAttr(heroImageUrl)}" alt="${escapeAttr(vendorName)}" width="540" height="196" style="display: block; width: 100%; max-width: 540px; height: 196px; object-fit: cover; border-radius: 12px;" />`
    : `<div style="width: 100%; height: 196px; border-radius: 12px; ${bannerBg}"></div>`;

  // Post-it only appears when there's a booth number; otherwise the banner
  // stands on its own.
  const postItOverlay = boothNumber
    ? `
        <!--[if !mso]><!-- -->
        <div style="position: relative; margin-top: -96px; margin-right: 14px; margin-bottom: 10px; text-align: right; line-height: 0;">
          ${renderPostItSvg(boothNumber)}
        </div>
        <!--<![endif]-->`
    : ``;

  return `
      <div style="margin: 0 0 18px; border-radius: 12px; overflow: hidden;">
        ${heroFallbackImg}
        ${postItOverlay}
      </div>
  `;
}

/**
 * Post-it as inline SVG (Outlook-compat rotation).
 *
 * Why SVG: CSS `transform: rotate(6deg)` is stripped by Outlook, and some
 * Gmail native clients. SVG internal `transform="rotate(...)"` is respected
 * by every modern mail client. 86×86 viewBox matches the /my-shelf BoothHero
 * post-it sizing.
 *
 * Paper fill #fffaea, hairline border via stroke, subtle shadow via filter.
 * Numeral in Georgia via <text> element; auto-shrinks when digit count grows.
 */
function renderPostItSvg(boothNumber: string): string {
  // Auto-scale numeral size by digit count (mirrors lib/utils.ts
  // boothNumeralSize). 36px ≤4 digits, 28px @ 5, 22px @ 6+.
  const digitCount = boothNumber.length;
  const fontSize = digitCount <= 4 ? 36 : digitCount === 5 ? 28 : 22;

  // Rotate 4° (spec calls for 6° in the /my-shelf BoothHero; 4° reads
  // slightly more legible at small email scale without losing the gesture).
  return `<svg width="86" height="86" viewBox="0 0 86 86" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
    <g transform="rotate(4, 43, 43)">
      <!-- Post-it body -->
      <rect x="8" y="8" width="70" height="70" fill="#fffaea" stroke="rgba(42,26,10,0.18)" stroke-width="0.5" />
      <!-- Push pin (small dark disc at top-center) -->
      <circle cx="43" cy="14" r="3" fill="#2a1a0a" opacity="0.85" />
      <!-- "Booth Location" eyebrow -->
      <text x="43" y="30" font-family="Georgia, 'Times New Roman', serif" font-size="7" font-style="italic" fill="#6b5538" text-anchor="middle" letter-spacing="0.5">
        BOOTH
      </text>
      <!-- Numeral -->
      <text x="43" y="60" font-family="'Times New Roman', Georgia, serif" font-size="${fontSize}" font-weight="400" fill="#2a1a0a" text-anchor="middle">
        ${escapeHtml(boothNumber)}
      </text>
    </g>
  </svg>`;
}

/**
 * Location line — pin glyph + mall name + address (as Google Maps link if available).
 *
 * Uses the ⚲ glyph to match the app's cartographic pin primitive (glyph
 * hierarchy locked session 17: pin = mall, X = booth — see design-system.md).
 */
function renderLocationLine(
  mallName:      string,
  mallAddress:   string | null,
  googleMapsUrl: string | null,
): string {
  const addressContent = mallAddress
    ? (googleMapsUrl
        ? `<a href="${escapeAttr(googleMapsUrl)}" style="color: ${INKMID}; text-decoration: underline;">${escapeHtml(mallAddress)}</a>`
        : escapeHtml(mallAddress))
    : ``;

  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
        <tr>
          <td style="vertical-align: top; width: 24px; padding-top: 2px; font-family: ${SERIF}; font-size: 18px; color: ${INK}; line-height: 1;">
            ⦲
          </td>
          <td style="vertical-align: top; padding-left: 8px;">
            <div style="font-family: ${SERIF}; font-size: 15px; font-weight: 600; color: ${INK}; line-height: 1.35;">
              ${escapeHtml(mallName)}
            </div>
            ${addressContent ? `<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: ${INKMID}; line-height: 1.5; margin-top: 3px;">${addressContent}</div>` : ``}
          </td>
        </tr>
      </table>
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

  return `
      <p style="margin: 0 0 12px; font-family: ${SERIF}; font-style: italic; font-size: 13px; color: ${INKMID}; text-transform: uppercase; letter-spacing: 0.18em; text-align: center;">
        The Window
      </p>
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

// Georgia throughout for maximum mail-client compatibility. No external font
// requests. Paper #e8ddc7 is the page background; no inner card.
const SERIF  = "Georgia, 'Times New Roman', serif";
const INK    = "#2a1a0a";
const INKMID = "#4a3520";
const PAPER  = "#e8ddc7";
const HAIR   = "rgba(42,26,10,0.18)";
const FAINT  = "rgba(42,26,10,0.28)";

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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Treehouse Finds</title>
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
          <!-- Brand lockup — Georgia semibold 26px, centered, thin hairline below -->
          <tr>
            <td align="center" style="padding: 8px 0 22px; border-bottom: 1px solid ${HAIR};">
              <p style="margin: 0; font-family: ${SERIF}; font-size: 26px; font-weight: 600; color: ${INK}; letter-spacing: -0.01em; line-height: 1.1;">
                Treehouse Finds
              </p>
              <p style="margin: 6px 0 0; font-family: ${SERIF}; font-style: italic; font-size: 11px; color: ${INKMID}; letter-spacing: 0.02em; line-height: 1.5;">
                Embrace the Search. Treasure the Find.
              </p>
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
