// Thin Resend client. Skips gracefully if RESEND_API_KEY is not set.
// Required env vars (add to Vercel): RESEND_API_KEY, RESEND_FROM_EMAIL

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "Praxis <noreply@conduitai.io>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — email skipped:", payload.subject);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[email] Resend error", res.status, detail);
  }
}
