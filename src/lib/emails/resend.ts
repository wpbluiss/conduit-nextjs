import { Resend } from "resend";

const FROM = "Praxis by Conduit AI <noreply@conduitai.io>";

let _resend: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send a transactional email via Resend.
 * Returns silently (logs warning) if RESEND_API_KEY is not configured —
 * callers must not crash when email is unavailable.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not configured — email skipped", {
      to: opts.to,
      subject: opts.subject,
    });
    return;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });

  if (error) {
    console.error("[email] Resend send error", { error, to: opts.to });
  }
}
