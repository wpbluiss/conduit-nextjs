import { emailBase, ctaButton } from "../base";

export function passwordResetEmail({
  resetUrl,
}: {
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reset your Praxis password",
    html: emailBase({
      title: "Reset your password",
      previewText: "Use this link to set a new password. Expires in 1 hour.",
      body: `
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
          Reset your password.
        </h1>
        <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
          Someone requested a password reset for your Praxis account.
          Click below to choose a new password.
        </p>

        ${ctaButton("Set new password →", resetUrl)}

        <p style="margin:24px 0 0;font-size:13px;color:#5A5248;text-align:center;">
          This link expires in 1 hour. If you didn't request a reset, you can
          safely ignore this email — your account is unchanged.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
          <tr>
            <td style="font-size:13px;color:#5A5248;line-height:1.7;">
              If you need help, contact
              <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>.
            </td>
          </tr>
        </table>
      `,
    }),
  };
}

// Supabase template variables version — paste into Supabase Auth → Email Templates → Reset password
export const SUPABASE_RESET_TEMPLATE = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#14110F;border:1px solid #1F1C19;border-radius:16px;padding:40px;">
  <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;">Reset your password.</h1>
  <p style="margin:12px 0 24px;font-size:16px;color:#8C8884;line-height:1.6;">Click below to set a new password for your Praxis account. This link expires in 1 hour.</p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#FFFFFF;text-decoration:none;background:#5B63E8;border-radius:12px;">Set new password →</a>
  <p style="margin:24px 0 0;font-size:13px;color:#5A5248;">If you didn't request this, ignore this email.</p>
</div>
`.trim();
