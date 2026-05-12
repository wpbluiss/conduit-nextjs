# Praxis email templates — Supabase Auth

Transactional auth emails (signup confirm, password reset, magic link,
email change, invite) are sent by **Supabase Auth**, not by the app
code in this repo. The templates live in the Supabase Dashboard:

> Dashboard → Authentication → Email Templates

The SMTP provider is **Resend** (sending domain `conduitai.io`, verified
us-east-1). DNS records sit at Porkbun.

Brand spec for these emails: **Praxis** body copy + curved-P mark, with
a small **"By Conduit AI"** parent-company footer line. The product the
user signed up for is Praxis; Conduit AI is the company that ships it.

---

## Paste-ready HTML

The blocks below go directly into the Supabase Dashboard template body
fields. Supabase uses Go template variables like `{{ .ConfirmationURL }}`
— do not change those.

### Confirm signup

**Subject:** `Confirm your Praxis workspace`

```html
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:#F5F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0815;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#131027;border:1px solid #1F1C2E;border-radius:16px;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="40" height="61" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#F5F1EA;padding-bottom:12px;">
                Welcome to Praxis.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.55;color:#B8B5C9;padding-bottom:28px;">
                Praxis is your AI workforce — voice, sales, engineering,
                ops, finance. Running 24/7 for the businesses that hire
                them. Confirm your email to open your workspace.
              </td>
            </tr>
            <tr>
              <td>
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;font-size:15px;">
                  Confirm and open Praxis →
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.55;color:#8A88A4;padding-top:32px;">
                If you didn't ask for this, you can ignore this email —
                no account is created until you confirm.
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#5A5670;margin-top:24px;">
            By <span style="color:#8A88A4;">Conduit AI</span> · West Palm Beach, FL
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Reset password

**Subject:** `Reset your Praxis password`

```html
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:#F5F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0815;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#131027;border:1px solid #1F1C2E;border-radius:16px;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="40" height="61" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#F5F1EA;padding-bottom:12px;">
                Reset your password.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.55;color:#B8B5C9;padding-bottom:28px;">
                Someone (probably you) asked to reset the password for
                your Praxis workspace. Tap below to choose a new one.
                This link expires in 1 hour.
              </td>
            </tr>
            <tr>
              <td>
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;font-size:15px;">
                  Set a new password →
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:1.55;color:#8A88A4;padding-top:32px;">
                If you didn't ask for this, you can ignore this email —
                your current password still works.
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#5A5670;margin-top:24px;">
            By <span style="color:#8A88A4;">Conduit AI</span> · West Palm Beach, FL
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Magic link

**Subject:** `Your Praxis sign-in link`

```html
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:#F5F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0815;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#131027;border:1px solid #1F1C2E;border-radius:16px;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="40" height="61" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#F5F1EA;padding-bottom:12px;">
                One-tap sign-in.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.55;color:#B8B5C9;padding-bottom:28px;">
                Tap below to sign in to your Praxis workspace. This link
                expires in 1 hour and can only be used once.
              </td>
            </tr>
            <tr>
              <td>
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;font-size:15px;">
                  Open Praxis →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#5A5670;margin-top:24px;">
            By <span style="color:#8A88A4;">Conduit AI</span> · West Palm Beach, FL
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Change email address

**Subject:** `Confirm your new Praxis email`

```html
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:#F5F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0815;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#131027;border:1px solid #1F1C2E;border-radius:16px;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="40" height="61" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#F5F1EA;padding-bottom:12px;">
                Confirm your new email.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.55;color:#B8B5C9;padding-bottom:28px;">
                You asked to update the email on your Praxis workspace.
                Tap below to confirm the new address. Until you do, your
                old email is still active.
              </td>
            </tr>
            <tr>
              <td>
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;font-size:15px;">
                  Confirm new email →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#5A5670;margin-top:24px;">
            By <span style="color:#8A88A4;">Conduit AI</span> · West Palm Beach, FL
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Invite user (optional, if/when team invites ship)

**Subject:** `You've been invited to Praxis`

```html
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0A0815;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif;color:#F5F1EA;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0815;padding:48px 24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#131027;border:1px solid #1F1C2E;border-radius:16px;padding:40px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://conduitai.io/praxis-mark.png" alt="Praxis" width="40" height="61" style="display:block;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:#F5F1EA;padding-bottom:12px;">
                You're invited to Praxis.
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.55;color:#B8B5C9;padding-bottom:28px;">
                Someone added you to their Praxis workspace. Praxis is
                an AI workforce — voice, sales, engineering, ops, finance.
                Accept the invite to get started.
              </td>
            </tr>
            <tr>
              <td>
                <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#7C3AED;color:#FFFFFF;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:500;font-size:15px;">
                  Accept invite →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size:12px;color:#5A5670;margin-top:24px;">
            By <span style="color:#8A88A4;">Conduit AI</span> · West Palm Beach, FL
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## How to apply

1. Open Supabase Dashboard → your project → Authentication → Email
   Templates.
2. For each template (Confirm signup, Reset password, Magic Link,
   Change Email Address, Invite User):
   - Update the **Subject** field to the value above.
   - Replace the **Message body (HTML)** with the corresponding block
     above.
3. Click **Save changes**.
4. Send a test (e.g., trigger a real signup with a throwaway email) and
   confirm the mark renders, the purple button works, and the "By
   Conduit AI" footer is present.

## Notes

- The `https://conduitai.io/praxis-mark.png` URL relies on the asset
  being publicly served at the production domain. It is, today
  (commit `33538cf` and prior).
- Resend SMTP is configured in Supabase Dashboard → Project Settings →
  Auth → SMTP Settings. The sender is `noreply@conduitai.io` (verified
  in Resend).
- If we later want fully custom transactional email sent from app
  code (welcome series, billing receipts, support replies), add Resend
  + React Email to the repo and route via Supabase Auth Hooks. Out of
  scope here.
