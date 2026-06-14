import { emailBase, ctaButton } from "./base";
import { sendEmail } from "./send";

export async function sendWelcomeEmail(to: string): Promise<void> {
  const workspaceUrl = "https://conduitai.io/app";

  const html = emailBase({
    title: "Welcome to Praxis",
    previewText: "Your AI workforce is ready. Open your workspace and get started.",
    body: `
      <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;letter-spacing:-0.03em;color:#F5EFE6;line-height:1.2;">
        You're in.
      </h1>
      <p style="margin:12px 0 0;font-size:16px;color:#8C8884;line-height:1.6;">
        Welcome to Praxis. Your AI workforce — Atlas, Marketing, Sales,
        Engineering, Finance, and more — is standing by.
      </p>

      ${ctaButton("Open your workspace →", workspaceUrl)}

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:36px;padding-top:28px;border-top:1px solid #1F1C19;">
        <tr>
          <td style="font-size:13px;color:#5A5248;line-height:1.7;">
            Questions? Reply to this email or reach the founder directly at
            <a href="mailto:luis@conduitai.io" style="color:#847A6E;">luis@conduitai.io</a>.
          </td>
        </tr>
      </table>
    `,
  });

  await sendEmail({ to, subject: "Welcome to Praxis", html });
}
