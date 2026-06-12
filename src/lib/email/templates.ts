// Praxis branded HTML email templates.
// Table-based, inline-styles — works in Gmail, Apple Mail, Outlook.
//
// Palette: warm near-black (#0a0908) + cream (#f5f1ea) + ember (#ff8a3d).
// These are the same values from watermelon.css / praxis-design-language.css,
// hardcoded here because CSS custom properties don't work in email clients.

const BG = "#0a0908";
const BG_CARD = "#141210";
const BORDER = "#2a2521";
const CREAM = "#f5f1ea";
const CREAM_MUTED = "#8a8580";
const EMBER = "#ff8a3d";

function wrapper(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Praxis by Conduit AI</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-body { padding: 24px 16px !important; }
      .email-card { padding: 32px 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td class="email-body" style="padding:48px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">

          <!-- Logo row -->
          <tr>
            <td style="padding-bottom:40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <div style="width:28px;height:28px;background:${EMBER};border-radius:6px;display:inline-block;"></div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:18px;font-weight:600;color:${CREAM};letter-spacing:-0.02em;">Praxis</span>
                    <span style="font-size:12px;color:${CREAM_MUTED};margin-left:8px;letter-spacing:0.04em;text-transform:uppercase;">by Conduit AI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="email-card" style="background-color:${BG_CARD};border:1px solid ${BORDER};border-radius:12px;padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
                Praxis &middot; Conduit AI &middot; <a href="https://conduitai.io" style="color:${CREAM_MUTED};text-decoration:underline;">conduitai.io</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:${CREAM_MUTED};">
                You received this because you have a Praxis account.
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

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:${CREAM};letter-spacing:-0.02em;line-height:1.3;">${text}</h1>`;
}

function body(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;color:${CREAM_MUTED};line-height:1.7;">${text}</p>`;
}

function cta(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
    <tr>
      <td style="border-radius:8px;background:${EMBER};">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#0a0908;text-decoration:none;letter-spacing:-0.01em;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${BORDER};margin:24px 0;" />`;
}

function keyValue(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
    <tr>
      <td style="font-size:12px;color:${CREAM_MUTED};text-transform:uppercase;letter-spacing:0.06em;width:40%;">${label}</td>
      <td style="font-size:14px;color:${CREAM};text-align:right;">${value}</td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Welcome / Verify email
// Paste into Supabase Auth > Email Templates > Confirm signup.
// Use {{ .ConfirmationURL }} for the verification link.
// ---------------------------------------------------------------------------
export function welcomeEmail(opts: { confirmUrl: string }): string {
  return wrapper(`
    ${heading("Welcome to Praxis.")}
    ${body("Your AI workforce is ready. Confirm your email to unlock the console — Atlas, your Chief of Staff, is standing by.")}
    ${cta(opts.confirmUrl, "Confirm email →")}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
      If you didn't sign up for Praxis, you can safely ignore this email.
    </p>
  `);
}

// Supabase template token version (paste into dashboard with {{ .ConfirmationURL }})
export const SUPABASE_WELCOME_TEMPLATE = welcomeEmail({ confirmUrl: "{{ .ConfirmationURL }}" });

// ---------------------------------------------------------------------------
// Password reset
// Paste into Supabase Auth > Email Templates > Reset password.
// ---------------------------------------------------------------------------
export function passwordResetEmail(opts: { resetUrl: string }): string {
  return wrapper(`
    ${heading("Reset your password.")}
    ${body("We received a request to reset the password on your Praxis account. Click below to choose a new one.")}
    ${cta(opts.resetUrl, "Reset password →")}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
      This link expires in 1 hour. If you didn't request a reset, no action is needed.
    </p>
  `);
}

export const SUPABASE_RESET_TEMPLATE = passwordResetEmail({ resetUrl: "{{ .ConfirmationURL }}" });

// ---------------------------------------------------------------------------
// Payment receipt — subscription upgrade
// ---------------------------------------------------------------------------
export function subscriptionReceiptEmail(opts: {
  tierName: string;
  amount: string;
  date: string;
  paymentMethod?: string;
  manageUrl: string;
}): string {
  return wrapper(`
    ${heading("Payment confirmed.")}
    ${body(`Your Praxis ${opts.tierName} subscription is active. Here's your receipt.`)}
    ${divider()}
    ${keyValue("Plan", `Praxis ${opts.tierName}`)}
    ${keyValue("Amount", opts.amount)}
    ${keyValue("Date", opts.date)}
    ${opts.paymentMethod ? keyValue("Method", opts.paymentMethod) : ""}
    ${divider()}
    ${cta(opts.manageUrl, "Manage billing →")}
    <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
      Questions? Reply to this email or contact <a href="mailto:luis@conduitai.io" style="color:${EMBER};text-decoration:none;">luis@conduitai.io</a>.
    </p>
  `);
}

// ---------------------------------------------------------------------------
// Token top-up receipt
// ---------------------------------------------------------------------------
export function topupReceiptEmail(opts: {
  tokensGranted: string;
  amount: string;
  date: string;
  manageUrl: string;
}): string {
  return wrapper(`
    ${heading("Tokens added.")}
    ${body(`${opts.tokensGranted} tokens have been added to your Praxis account. They never expire.`)}
    ${divider()}
    ${keyValue("Tokens", opts.tokensGranted)}
    ${keyValue("Amount charged", opts.amount)}
    ${keyValue("Date", opts.date)}
    ${divider()}
    ${cta(opts.manageUrl, "Go to console →")}
    <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
      Questions? Reply to this email or contact <a href="mailto:luis@conduitai.io" style="color:${EMBER};text-decoration:none;">luis@conduitai.io</a>.
    </p>
  `);
}

// ---------------------------------------------------------------------------
// Account deletion confirmation (optional)
// ---------------------------------------------------------------------------
export function accountDeletedEmail(opts: { email: string }): string {
  return wrapper(`
    ${heading("Your account has been deleted.")}
    ${body(`We've deleted the Praxis account associated with <strong style="color:${CREAM};">${opts.email}</strong>. All data has been removed.`)}
    ${divider()}
    <p style="margin:0;font-size:12px;color:${CREAM_MUTED};line-height:1.6;">
      Changed your mind? You can create a new account at <a href="https://conduitai.io/auth/sign-up" style="color:${EMBER};text-decoration:none;">conduitai.io/auth/sign-up</a>.
    </p>
  `);
}
