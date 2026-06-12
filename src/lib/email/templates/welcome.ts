import { emailBase, ctaButton } from "../base";

export function welcomeEmail({
  confirmationUrl,
}: {
  confirmationUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Confirm your email — Praxis is ready",
    html: emailBase({
      title: "Welcome to Praxis",
      previewText: "One click and your AI workforce is live.",
      body: `
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
          Welcome to Praxis.
        </h1>
        <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
          Confirm your email to activate your account and open the Console.
          Your AI workforce — Atlas, Marketing, Sales, Engineering, and more — is standing by.
        </p>

        ${ctaButton("Confirm email →", confirmationUrl)}

        <p style="margin:24px 0 0;font-size:13px;color:#5A5248;text-align:center;">
          This link expires in 24 hours. If you didn't create an account,
          you can safely ignore this email.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
          <tr>
            <td style="font-size:13px;color:#5A5248;line-height:1.7;">
              Questions? Reply to this email or write to
              <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>
              — you'll hear back from the founder.
            </td>
          </tr>
        </table>
      `,
    }),
  };
}

// Supabase template variables version — paste body only into Supabase dashboard
// Auth → Email Templates → Confirm signup
export const SUPABASE_WELCOME_TEMPLATE = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#14110F;border:1px solid #1F1C19;border-radius:16px;padding:40px;">
  <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;">Welcome to Praxis.</h1>
  <p style="margin:12px 0 24px;font-size:16px;color:#8C8884;line-height:1.6;">Confirm your email to activate your account and open the Console.</p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#FFFFFF;text-decoration:none;background:#5B63E8;border-radius:12px;">Confirm email →</a>
  <p style="margin:24px 0 0;font-size:13px;color:#5A5248;">This link expires in 24 hours.</p>
</div>
`.trim();
