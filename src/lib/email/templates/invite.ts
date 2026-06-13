import { emailBase, ctaButton } from "../base";

export function inviteEmail({
  inviterName,
  acceptUrl,
}: {
  inviterName: string;
  acceptUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${inviterName} invited you to join Praxis`,
    html: emailBase({
      title: "You're invited to Praxis",
      previewText: `${inviterName} has invited you to their Praxis workspace. Accept to get started.`,
      body: `
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
          You're invited.
        </h1>
        <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
          <strong style="color:#F5EFE6;">${inviterName}</strong> has invited you to their
          Praxis workspace — an AI workforce with nine specialists covering marketing,
          sales, engineering, finance, and more.
        </p>

        ${ctaButton("Accept invitation →", acceptUrl)}

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;background:#0F0D0B;border:1px solid #2A2520;border-radius:12px;padding:20px;">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#5B63E8;">
                What is Praxis?
              </p>
              <p style="margin:0;font-size:14px;color:#8C8884;line-height:1.7;">
                Praxis is your AI co-founder team. Nine specialists — Atlas, Marketing,
                Sales, Engineering, Finance, Compliance, HR, Ops, and Legal — available
                24/7 via a single shared workspace.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0;font-size:13px;color:#5A5248;text-align:center;">
          This invitation link expires in 24 hours. If you weren't expecting this,
          you can safely ignore this email.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
          <tr>
            <td style="font-size:13px;color:#5A5248;line-height:1.7;">
              Questions? Reply to this email or write to
              <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>.
            </td>
          </tr>
        </table>
      `,
    }),
  };
}

// Supabase template variables version — paste into Supabase Auth → Email Templates → Invite user
export const SUPABASE_INVITE_TEMPLATE = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#14110F;border:1px solid #1F1C19;border-radius:16px;padding:40px;">
  <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;">You're invited to Praxis.</h1>
  <p style="margin:12px 0 24px;font-size:16px;color:#8C8884;line-height:1.6;">Click below to accept your invitation and set up your account.</p>
  <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:500;color:#FFFFFF;text-decoration:none;background:#5B63E8;border-radius:12px;">Accept invitation →</a>
  <p style="margin:24px 0 0;font-size:13px;color:#5A5248;">This link expires in 24 hours.</p>
</div>
`.trim();
