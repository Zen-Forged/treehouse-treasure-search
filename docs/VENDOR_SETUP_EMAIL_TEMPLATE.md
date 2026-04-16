# Vendor Setup Email Template

This document provides the email template for notifying approved vendors that their account is ready.

## When to use
- After approving a vendor request in the admin panel
- When a vendor account has been created but the vendor hasn't been notified yet
- As a reference for consistent vendor onboarding communication

## Email Template

**Subject:** Your Treehouse vendor account is ready!

**Body:**
```
Hi [VENDOR_NAME],

Great news! Your vendor access request for Treehouse has been approved. Your booth account is now set up and ready to use.

To get started:
1. Click this link to complete your account setup: [SETUP_URL]
2. Sign in with this email address: [VENDOR_EMAIL]
3. Start posting finds to share with browsers before they make the trip

Your booth details:
- Name: [VENDOR_NAME]
- Booth: [BOOTH_NUMBER or "Not specified"]
- Mall: [MALL_NAME or "Not specified"]

Once you're set up, you can manage your booth and post finds at treehouse-treasure-search.vercel.app

Welcome to Treehouse!

Best regards,
The Treehouse Team
```

## Template Variables

| Variable | Source | Example |
|----------|--------|---------|
| `[VENDOR_NAME]` | vendor_requests.name | "Jane's Vintage Finds" |
| `[SETUP_URL]` | `${baseUrl}/setup` | "https://treehouse-treasure-search.vercel.app/setup" |
| `[VENDOR_EMAIL]` | vendor_requests.email | "jane@example.com" |
| `[BOOTH_NUMBER]` | vendor_requests.booth_number | "A-24" or "Not specified" |
| `[MALL_NAME]` | vendor_requests.mall_name | "America's Antique Mall" or "Not specified" |

## Admin Workflow

1. **Review Request**: Check vendor_requests in admin panel
2. **Approve**: Click "Approve" button to create vendor account
3. **Copy Template**: Email template is automatically copied to clipboard
4. **Send Email**: Paste template into email client and send to vendor
5. **Follow Up**: Vendor clicks setup link → completes account linking → starts posting

## Setup Flow for Vendor

1. **Receive Email**: Vendor gets approval email with setup link
2. **Click Link**: Navigates to `/setup` page  
3. **Sign In**: Uses magic link authentication with their email
4. **Auto-Link**: System finds their vendor account and links to user_id
5. **Redirect**: Automatically redirected to My Booth to start posting

## Troubleshooting

### Vendor can't find their account
- Verify vendor email matches the email in vendor_requests table
- Check that vendor account was created successfully (vendors table)
- Ensure vendor_requests.status is marked as "approved"

### Setup link doesn't work
- Verify the setup URL is correct: `${baseUrl}/setup`
- Check that the vendor account exists and user_id is null
- Confirm email address is exactly the same as in vendor_requests

### Vendor already linked
- If vendor account already has user_id, setup will show error
- Admin needs to check why account was previously linked
- May need to manually unlink or create new vendor account

## Technical Notes

### Database Flow
```
vendor_requests (pending) → admin approval → vendors (user_id: null) → setup flow → vendors (user_id: populated)
```

### Key Functions
- `getVendorByEmail()`: Finds vendor account by email cross-reference
- `linkVendorToUser()`: Links authenticated user_id to vendor row
- `markVendorRequestApproved()`: Updates request status

### Security
- Only unlinked vendor accounts can be claimed via setup
- Email must match exactly between vendor_requests and auth session
- Setup page requires authenticated session (magic link)

## Future Enhancements

### Sprint 4 Improvements
- **Automated Emails**: Integrate Resend to send emails automatically
- **Batch Approval**: Select multiple requests and approve in bulk
- **Status Tracking**: Show delivery status and setup completion
- **Template Customization**: Allow admin to customize email template

### Advanced Features
- **Vendor Onboarding**: Multi-step setup flow with booth details editing
- **Account Recovery**: Handle edge cases like duplicate accounts
- **Analytics**: Track approval rates and setup completion metrics
