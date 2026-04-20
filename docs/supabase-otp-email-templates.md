# Supabase OTP Email Templates — v1.2

> Session 32 (2026-04-20). These are the shipping HTML templates for
> Supabase Auth's Magic Link and Confirm Signup emails. They match the
> v1.1l paper-as-surface treatment used in `lib/email.ts`'s own emails.
>
> **🖐️ HITL to apply:** paste the HTML block below into BOTH of these:
>   Supabase Dashboard → Authentication → Email Templates → Magic Link
>   Supabase Dashboard → Authentication → Email Templates → Confirm Signup
>
> The same HTML works for both — Supabase renders `{{ .Token }}`,
> `{{ .ConfirmationURL }}`, and `{{ .Email }}` from the user's session
> at send time. Both templates need the update (session 6 gotcha: they
> are separate saves in the Supabase dashboard).

---

## Subject line (both templates)

```
Your Treehouse sign-in code
```

---

## HTML body (paste verbatim into both templates)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Treehouse</title>
</head>
<body style="margin: 0; padding: 0; background: #e8ddc7; font-family: Georgia, 'Times New Roman', serif;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Your Treehouse sign-in code.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #e8ddc7;">
    <tr>
      <td align="center" style="padding: 36px 16px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px;">

          <!-- Brand lockup -->
          <tr>
            <td align="center" style="padding: 8px 0 22px; border-bottom: 1px solid rgba(42,26,10,0.18);">
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 600; color: #2a1a0a; letter-spacing: -0.01em; line-height: 1.1;">
                Treehouse
              </p>
              <p style="margin: 6px 0 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 11px; color: #4a3520; letter-spacing: 0.02em; line-height: 1.5;">
                Kentucky &amp; Southern Indiana
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 24px 10px 0;">
              <p style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.7; color: #2a1a0a;">
                Here's your sign-in code. Enter it on the Treehouse sign-in screen to finish.
              </p>

              <!-- OTP code pill -->
              <div style="margin: 24px 0 8px; padding: 22px 18px 18px; background: rgba(255,250,234,0.55); border: 1px solid rgba(42,26,10,0.18); border-radius: 10px; text-align: center;">
                <p style="margin: 0 0 10px; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 12px; color: #4a3520; text-transform: uppercase; letter-spacing: 0.15em;">
                  Your code
                </p>
                <p style="margin: 0; padding: 4px 0 0 0.3em; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 34px; letter-spacing: 0.3em; color: #2a1a0a; font-weight: 500; user-select: all; -webkit-user-select: all;">
                  <code style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; background: transparent; user-select: all; -webkit-user-select: all;">{{ .Token }}</code>
                </p>
                <p style="margin: 10px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #4a3520; font-style: italic;">
                  Expires in 10 minutes.
                </p>
              </div>

              <p style="margin: 22px 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.7; color: #2a1a0a;">
                If you didn't ask for this, you can ignore this email.
              </p>

              <p style="margin: 28px 0 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 16px; line-height: 1.5; color: #4a3520;">
                &mdash; Treehouse
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 10px 0;">
              <div style="border-top: 1px solid rgba(42,26,10,0.18); padding-top: 22px; text-align: center;">
                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 11px; color: rgba(42,26,10,0.28); line-height: 1.6;">
                  This code was requested from Treehouse. Codes expire and can only be used once.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Why `{{ .Token }}` is wrapped in `<code>`

Session 6 discovery: Supabase `signInWithOtp` generates both a magic link
AND a 6-digit code. The default templates only render the magic link.
Wrapping `{{ .Token }}` in a selectable `<code>` element (with
`user-select: all`) makes the code long-pressable/tappable-to-copy on
iPhone. Paired with the Supabase Auth → Providers → Email setting for
OTP Length = 6, the vendor gets a clean 6-digit code they can tap-select
and paste into the PWA's sign-in screen.

---

## Other Supabase dashboard checks (session 6 legacy, still required)

- **Authentication → Providers → Email → OTP Length:** must be `6`
  (default is 8, and the app's OTP input expects 6).
- **Authentication → SMTP Settings:** must still be pointed at Resend
  (session 4 setup — sender `hello@kentuckytreehouse.com`).
- After saving both templates, send yourself a test email from the
  sign-in screen to confirm the code renders in the paper-wash pill
  and is selectable on iPhone.

---

## Rendering notes

- **Georgia throughout.** No external font load. Maximum compatibility
  across Gmail / Apple Mail / Outlook. Matches `lib/email.ts` v1.2.
- **Paper as surface.** `#e8ddc7` is the body background. No inner
  white card. Consistent with the app's v1.1l global bg.
- **Postit wash pill.** The OTP container uses the same
  `rgba(255,250,234,0.55)` on paper that the app uses for the success
  bubble primitive.
- **No external images.** Everything inline. No tracking, no surprise
  stripping by mail clients.
