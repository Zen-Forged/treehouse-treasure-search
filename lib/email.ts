// lib/email.ts
// Resend-backed transactional emails for vendor onboarding — v1.2 refresh (session 32).
//
// Two public functions:
//   sendRequestReceived(payload)       — Email #1 per onboarding-journey.md
//   sendApprovalInstructions(payload)  — Email #2 per onboarding-journey.md
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
//  - Best-effort delivery. Both functions catch and log errors rather than
//    throwing. A failed email should not fail the underlying HTTP request.
//  - No Resend SDK dependency — native fetch against Resend REST API.
//  - RESEND_API_KEY unset → no-op with console warning (keeps local dev
//    frictionless).
//  - From: Treehouse <hello@kentuckytreehouse.com>. Reply-to is admin email.

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS   = "Treehouse <hello@kentuckytreehouse.com>";

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
  const subject    = `We got your Treehouse request, ${firstName}`;

  const html = renderEmailShell({
    preheader: "Thanks for putting your booth forward — we'll be in touch.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(firstName)},</p>
      <p style="${pStyle}">Thanks — we got your booth photo and details.</p>
      <p style="${pStyle}">We'll take a look and be in touch when your shelf is ready to fill.</p>
      <p style="${signStyle}">&mdash; Treehouse</p>
    `,
  });

  const text = [
    `Hi ${firstName},`,
    ``,
    `Thanks — we got your booth photo and details.`,
    ``,
    `We'll take a look and be in touch when your shelf is ready to fill.`,
    ``,
    `— Treehouse`,
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
  const subject    = `Your Treehouse booth is ready, ${firstName}`;

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
          To sign in, open <strong style="color:#2a1a0a;font-weight:600;">Treehouse</strong> on your phone, tap <strong style="color:#2a1a0a;font-weight:600;">Sign In</strong>, and enter this email:
        </p>
        <p style="${boxPStyle} text-align:center; margin-bottom: 10px;">
          <span style="${echoPillStyle}">${escapeHtml(payload.email)}</span>
        </p>
        <p style="${boxPStyle} margin-bottom: 0;">
          We'll send you a 6-digit code to finish signing in.
        </p>
      </div>

      <p style="${pStyle} margin-top: 22px;">Welcome to the search.</p>
      <p style="${signStyle}">&mdash; Treehouse</p>
    `,
  });

  const text = [
    `Hi ${firstName},`,
    ``,
    payload.mallName
      ? `Your booth at ${payload.mallName} is ready to start filling with finds.`
      : `Your booth is ready to start filling with finds.`,
    ``,
    `To sign in, open Treehouse on your phone, tap Sign In, and enter this email:`,
    ``,
    `  ${payload.email}`,
    ``,
    `We'll send you a 6-digit code to finish signing in.`,
    ``,
    `Welcome to the search.`,
    ``,
    `— Treehouse`,
  ].join("\n");

  return sendEmail({
    to:      payload.email,
    replyTo: adminEmail || undefined,
    subject,
    html,
    text,
  });
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

function renderEmailShell(opts: { preheader: string; bodyHtml: string }): string {
  // Table-based layout for email-client compatibility. Paper as surface —
  // no inner white card. Body content sits directly on paperCream.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Treehouse</title>
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
                Treehouse
              </p>
              <p style="margin: 6px 0 0; font-family: ${SERIF}; font-style: italic; font-size: 11px; color: ${INKMID}; letter-spacing: 0.02em; line-height: 1.5;">
                Kentucky &amp; Southern Indiana
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
                  You're receiving this because you submitted a booth request to Treehouse. Reply to this email if anything looks off.
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
