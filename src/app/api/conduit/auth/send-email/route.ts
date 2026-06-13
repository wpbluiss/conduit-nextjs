import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";
import { inviteEmail } from "@/lib/email/templates/invite";

export const runtime = "nodejs";

// Supabase "Send Email" auth hook.
//
// Configure in: Supabase dashboard → Authentication → Hooks → "Send Email".
// Set the URL to: https://conduitai.io/api/conduit/auth/send-email
// Set the signing secret to any strong random string, and store it as:
//   SUPABASE_AUTH_HOOK_SECRET (Vercel env var)
//
// Supabase signs each request with a JWT using this secret. We verify
// the JWT before processing. The route ALWAYS returns 200 so Supabase
// doesn't fail the auth event — Resend errors are logged but not surfaced.
//
// Required env vars: SUPABASE_AUTH_HOOK_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL

interface SupabaseHookUser {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
}

interface SupabaseHookEmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type:
    | "signup"
    | "recovery"
    | "invite"
    | "magic_link"
    | "email_change"
    | string;
  site_url?: string;
}

interface SupabaseHookBody {
  user: SupabaseHookUser;
  email_data: SupabaseHookEmailData;
}

async function verifyHookJwt(req: Request): Promise<boolean> {
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!secret) {
    // If the secret is not configured, skip verification in development.
    // Log a warning so this doesn't silently pass in production.
    if (process.env.NODE_ENV === "production") {
      console.error("[auth-hook] SUPABASE_AUTH_HOOK_SECRET is not set — rejecting in production");
      return false;
    }
    console.warn("[auth-hook] SUPABASE_AUTH_HOOK_SECRET not set — skipping JWT verification (dev only)");
    return true;
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

function buildConfirmationUrl(
  emailData: SupabaseHookEmailData,
  type?: string,
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const resolvedType =
    type ??
    (emailData.email_action_type === "recovery"
      ? "recovery"
      : emailData.email_action_type === "invite"
        ? "invite"
        : "signup");
  const params = new URLSearchParams({
    token_hash: emailData.token_hash,
    type: resolvedType,
    redirect_to: emailData.redirect_to,
  });
  return `${supabaseUrl}/auth/v1/verify?${params.toString()}`;
}

export async function POST(req: Request): Promise<NextResponse> {
  const ok = await verifyHookJwt(req);
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SupabaseHookBody;
  try {
    body = (await req.json()) as SupabaseHookBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { user, email_data } = body;
  if (!user?.email || !email_data) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const actionType = email_data.email_action_type;

  // Always return 200 — Supabase marks the auth event failed if we return non-2xx,
  // which would block the user. Resend errors are logged but don't break auth.
  try {
    if (actionType === "signup") {
      const confirmationUrl = buildConfirmationUrl(email_data);
      const { subject, html } = welcomeEmail({ confirmationUrl });
      await sendEmail({ to: user.email, subject, html });
    } else if (actionType === "recovery") {
      const confirmationUrl = buildConfirmationUrl(email_data);
      const { subject, html } = passwordResetEmail({ resetUrl: confirmationUrl });
      await sendEmail({ to: user.email, subject, html });
    } else if (actionType === "invite") {
      const acceptUrl = buildConfirmationUrl(email_data);
      const inviterName =
        (user as { invited_by_name?: string }).invited_by_name ?? "Someone";
      const { subject, html } = inviteEmail({ inviterName, acceptUrl });
      await sendEmail({ to: user.email, subject, html });
    } else {
      // Unhandled type — log but do not block auth.
      console.warn("[auth-hook] unhandled email_action_type:", actionType);
    }
  } catch (err) {
    console.error("[auth-hook] sendEmail error:", err);
  }

  return NextResponse.json({ message: "ok" });
}
