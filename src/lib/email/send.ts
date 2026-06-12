// Thin wrapper around the Resend HTTP API. No package needed — just fetch.
// Requires RESEND_API_KEY env var (server-side only, never exposed to client).

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string };
}

const FROM = "Praxis by Conduit AI <noreply@conduitai.io>";

export async function sendEmail({
  to,
  subject,
  html,
  from = FROM,
}: SendEmailParams): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Soft failure — don't break the caller if email isn't configured.
    console.warn("[email] RESEND_API_KEY not set; email not sent.");
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    const data = (await res.json()) as ResendResponse;
    if (!res.ok || data.error) {
      console.error("[email] Resend error", data.error);
      return { ok: false, error: data.error?.message ?? "send_failed" };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] fetch error", err);
    return { ok: false, error: "network_error" };
  }
}
