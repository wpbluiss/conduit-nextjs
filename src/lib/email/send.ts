/**
 * Transactional email sender using Resend.
 *
 * Usage:
 *   import { sendEmail } from "@/lib/email/send";
 *   await sendEmail({ to: user.email, subject: "…", html: welcomeEmail({…}) });
 *
 * Env var required: RESEND_API_KEY
 * Get yours at https://resend.com/api-keys
 *
 * Supabase auth emails (welcome/verify, password reset) must also be
 * configured in the Supabase dashboard:
 *   Authentication → Email Templates → paste the HTML from src/emails/
 * Set SMTP to Resend under Authentication → SMTP Settings for full control.
 */

const RESEND_API = "https://api.resend.com/emails";
const FROM = "Praxis <hello@conduitai.io>";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set — configure it to send email");
  }

  const body: Record<string, unknown> = { from: FROM, to, subject, html };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
}
