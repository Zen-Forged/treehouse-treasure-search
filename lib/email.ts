// lib/email.ts
// Resend-backed transactional emails for vendor onboarding.
//
// Two public functions:
//   sendRequestReceived(payload)       — Email #1 per onboarding-journey.md
//   sendApprovalInstructions(payload)  — Email #2 per onboarding-journey.md
//
// Design notes:
//  - Best-effort delivery. Both functions catch and log errors rather than
//    throwing. A failed email should not fail the underlying HTTP request
//    (vendor_requests insert or approval). The caller should still succeed
//    from the user's perspective — the email is a notification, not part of
//    the transaction. Retry/DLQ is explicitly out of scope for beta.
//  - No Resend dependency is added to package.json. We use fetch() against
//    Resend's REST API directly — simpler, fewer bytes, no SDK version to
//    maintain.
//  - If RESEND_API_KEY is unset, functions no-op with a console warning.
//    This keeps local dev frictionless when someone hasn't set up Resend.
//  - Sending domain must match what's configured in Resend dashboard and
//    Shopify DNS (see CLAUDE.md DNS STATE). We send from:
//        Treehouse <hello@kentuckytreehouse.com>
//    Reply-to is admin's email so vendors can hit reply.
//
// Copy is deliberately warm and observational per Brand Rules in
// docs/DECISION_GATE.md. No transactional/marketing-speak.

const RESEND_API_URL = "https://api.resend.com/emails";

// From-address must live on a verified Resend domain. We use a dedicated
// transactional alias on the root zone (Shopify DNS has the Resend DKIM
// records — session 4's setup). Display name gives the email a human face.
const FROM_ADDRESS = "Treehouse <hello@kentuckytreehouse.com>";

// Where the app lives. Used to build absolute sign-in URLs in email bodies.
// Falls back to the custom domain if the env var is missing (e.g. local dev
// without NEXT_PUBLIC_SITE_URL set).
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.kentuckytreehouse.com";
}

// ── Public types ──────────────────────────────────────────────────────────────

export interface RequestReceivedPayload {
  name:       string;
  email:      string;
  mallName?:  string | null;
}

export interface ApprovalPayload {
  name:          string;
  email:         string;
  mallName?:     string | null;
  boothNumber?:  string | null;
}

// ── Email #1 — Request received (receipt) ────────────────────────────────────

/**
 * Sends the "we got your request" receipt email.
 *
 * Triggered by:
 *   - POST /api/vendor-request (after successful vendor_requests insert)
 *
 * Doubles as a data-integrity check: if the vendor typo'd their email, they
 * won't receive this email and will notice immediately, before admin wastes
 * time approving a dead-letter request.
 */
export async function sendRequestReceived(
  payload: RequestReceivedPayload,
): Promise<{ ok: boolean; error?: string }> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const subject    = `We got your Treehouse request, ${payload.name}`;

  const mallLine = payload.mallName
    ? `We'll take a look at your booth at ${escapeHtml(payload.mallName)} and be in touch when your shelf is ready to fill.`
    : `We'll take a look and be in touch when your shelf is ready to fill.`;

  const html = renderEmailShell({
    preheader: "Thanks for putting your booth forward — we'll be in touch.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(payload.name)},</p>
      <p style="${pStyle}">Thanks for putting your booth forward.</p>
      <p style="${pStyle}">${mallLine}</p>
      <p style="${pStyle}">— Treehouse</p>
    `,
  });

  const text = [
    `Hi ${payload.name},`,
    ``,
    `Thanks for putting your booth forward.`,
    ``,
    payload.mallName
      ? `We'll take a look at your booth at ${payload.mallName} and be in touch when your shelf is ready to fill.`
      : `We'll take a look and be in touch when your shelf is ready to fill.`,
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
 * Triggered by:
 *   - POST /api/admin/vendor-requests { action: "approve" } (after vendor
 *     row is created and request status flipped to "approved")
 *
 * The CTA URL is the sign-in entry point with ?redirect=/setup. On OTP
 * verify, /login honors the redirect param and forwards to /setup, which
 * calls /api/setup/lookup-vendor to link vendors.user_id = auth.user.id.
 */
export async function sendApprovalInstructions(
  payload: ApprovalPayload,
): Promise<{ ok: boolean; error?: string }> {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  const subject    = `Your Treehouse booth is ready, ${payload.name}`;

  const signInUrl = `${getSiteUrl()}/login?redirect=${encodeURIComponent("/setup")}`;

  const mallLine = payload.mallName
    ? `Your booth at ${escapeHtml(payload.mallName)} is ready to start filling with finds.`
    : `Your booth is ready to start filling with finds.`;

  const html = renderEmailShell({
    preheader: "Your booth is ready — tap to sign in.",
    bodyHtml: `
      <p style="${pStyle}">Hi ${escapeHtml(payload.name)},</p>
      <p style="${pStyle}">${mallLine}</p>
      <p style="${pStyle}">Tap the link below to sign in — we'll email you a quick 6-digit code.</p>
      <p style="${pStyle} margin-top: 28px; margin-bottom: 28px;">
        <a href="${signInUrl}" style="${ctaStyle}">
          Sign in to your booth →
        </a>
      </p>
      <p style="${pStyle} color: #8a8478; font-size: 13px;">
        Or paste this link into your browser:<br>
        <span style="word-break: break-all;">${signInUrl}</span>
      </p>
      <p style="${pStyle}">— Treehouse</p>
    `,
  });

  const text = [
    `Hi ${payload.name},`,
    ``,
    payload.mallName
      ? `Your booth at ${payload.mallName} is ready to start filling with finds.`
      : `Your booth is ready to start filling with finds.`,
    ``,
    `Tap the link below to sign in — we'll email you a quick 6-digit code.`,
    ``,
    signInUrl,
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
    // No-op in local dev when Resend isn't configured. Don't fail loudly.
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

// ── Internal: HTML template shell ────────────────────────────────────────────

const pStyle     = "margin: 0 0 16px; font-family: Georgia, serif; font-size: 16px; line-height: 1.7; color: #1a1a18;";
const ctaStyle   = "display: inline-block; padding: 14px 28px; background: #1e4d2b; color: #ffffff; text-decoration: none; border-radius: 10px; font-family: system-ui, sans-serif; font-size: 15px; font-weight: 600;";

function renderEmailShell(opts: { preheader: string; bodyHtml: string }): string {
  // Inline styles for maximum email-client compatibility.
  // Preheader is the hidden preview text Gmail / Apple Mail show in the
  // inbox list.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Treehouse</title>
</head>
<body style="margin: 0; padding: 0; background: #f0ede6; font-family: Georgia, serif;">
  <!-- Preheader — hidden, drives inbox preview -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(opts.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f0ede6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width: 520px; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 12px rgba(26,24,16,0.06);">
          <tr>
            <td style="padding: 32px 36px 8px;">
              <!-- Brand lockup -->
              <p style="margin: 0; font-family: Georgia, serif; font-size: 20px; font-weight: 700; color: #1e4d2b; letter-spacing: -0.2px;">
                Treehouse
              </p>
              <p style="margin: 2px 0 0; font-family: Georgia, serif; font-style: italic; font-size: 11px; color: #8a8478; letter-spacing: 1px; text-transform: uppercase;">
                Local finds, before the drive
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 36px 32px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 36px 32px; border-top: 1px solid rgba(26,26,24,0.08);">
              <p style="margin: 0; font-family: Georgia, serif; font-size: 11px; color: #b0aa9e; line-height: 1.6;">
                You're receiving this because you submitted a booth request to Treehouse. Reply to this email if anything looks off.
              </p>
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

/**
 * Escape HTML-unsafe characters in user-provided strings before inlining
 * into HTML email templates.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Redact the local part of an email for log lines.
 * "alice@example.com" → "a***@example.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}
