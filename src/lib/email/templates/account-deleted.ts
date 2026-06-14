import { emailBase } from "../base";

export function accountDeletedEmail({
  email,
}: {
  email: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Praxis account has been deleted",
    html: emailBase({
      title: "Account deleted — Praxis",
      previewText: "Your account and all associated data have been permanently removed.",
      body: `
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
          Account deleted.
        </h1>
        <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
          We've permanently deleted the Praxis account associated with
          <strong style="color:#B8B2AC;">${email}</strong> and all related data —
          conversations, memory, artifacts, builds, household, and financial records.
        </p>

        <p style="margin:20px 0 0;font-size:15px;color:#6E6660;line-height:1.6;">
          If you didn't request this deletion or believe this was a mistake,
          please contact us immediately at
          <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>.
        </p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
          <tr>
            <td style="font-size:13px;color:#5A5248;line-height:1.7;">
              This is a confirmation of your data deletion request. No further action is required.
              You can create a new account at any time at
              <a href="https://conduitai.io" style="color:#847A6E;">conduitai.io</a>.
            </td>
          </tr>
        </table>
      `,
    }),
  };
}
