import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory rate limit: max 3 requests per IP per hour.
// Resets on cold start — acceptable for a simple waitlist.
const ipBucket = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipBucket.get(ip);
  if (!entry || now > entry.resetAt) {
    ipBucket.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_PER_WINDOW) return true;
  entry.count++;
  return false;
}

const CONFIRMATION_HTML = (email: string) => `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#0A0908;color:#F5F2EC;padding:40px 20px;max-width:560px;margin:0 auto">
  <p style="font-size:22px;font-weight:600;margin:0 0 12px">You're on the Praxis waitlist.</p>
  <p style="font-size:15px;color:#9A958C;line-height:1.6;margin:0 0 24px">
    We'll email <strong style="color:#F5F2EC">${email}</strong> as soon as early access opens.
    In the meantime, you can explore the Praxis Console — free to start, no card required.
  </p>
  <a href="https://conduitai.io/auth/sign-up"
     style="display:inline-block;background:#5B63E8;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600">
    Open Praxis Console
  </a>
  <p style="font-size:12px;color:#5C574F;margin-top:32px">
    Conduit AI · conduitai.io<br>
    You received this because you joined our waitlist.
  </p>
</body>
</html>
`;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("waitlist_emails")
    .insert({ email })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already registered — still success from the user's POV
      return NextResponse.json({ ok: true, duplicate: true });
    }
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  // Fire-and-forget — don't block the response on email delivery
  sendEmail({
    to: email,
    subject: "You're on the Praxis waitlist",
    html: CONFIRMATION_HTML(email),
  }).catch((err) => console.error("[waitlist] email send failed", err));

  return NextResponse.json({ ok: true });
}
