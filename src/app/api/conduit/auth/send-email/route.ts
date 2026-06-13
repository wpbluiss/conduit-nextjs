// Supabase Auth → Hooks → Send Email webhook handler.
//
// Configure in Supabase dashboard:
//   Auth → Hooks → Send Email → HTTP endpoint: https://conduitai.io/api/conduit/auth/send-email
//   Auth → Hooks → Send Email → HTTP headers: Authorization: Bearer <SUPABASE_AUTH_HOOK_SECRET>
//
// Env vars required (add to Vercel):
//   SUPABASE_AUTH_HOOK_SECRET — random secret, must match the value set in the Supabase dashboard hook config
//   RESEND_API_KEY            — from resend.com
//   RESEND_FROM_EMAIL         — verified sender, e.g. "Praxis <noreply@conduitai.io>"

import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";

export const runtime = "nodejs";

interface SupabaseEmailHookPayload {
  user: {
    id: string;
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: "signup" | "recovery" | "invite" | "email_change" | "magiclink";
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

export async function POST(request: NextRequest) {
  // Verify the bearer token matches our hook secret.
  const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!hookSecret || bearerToken !== hookSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: SupabaseEmailHookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { user, email_data } = payload;
  const { email_action_type, token_hash, redirect_to, site_url } = email_data;

  // Construct the verification URL from the token hash.
  // Format: <supabase_url>/auth/v1/verify?token=<token_hash>&type=<action>&redirect_to=<redirect_to>
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? site_url;
  const verifyUrl =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${encodeURIComponent(token_hash)}` +
    `&type=${encodeURIComponent(email_action_type)}` +
    `&redirect_to=${encodeURIComponent(redirect_to)}`;

  try {
    if (email_action_type === "signup") {
      const { subject, html } = welcomeEmail({ confirmationUrl: verifyUrl });
      await sendEmail({ to: user.email, subject, html });
    } else if (email_action_type === "recovery") {
      const { subject, html } = passwordResetEmail({ resetUrl: verifyUrl });
      await sendEmail({ to: user.email, subject, html });
    }
    // Other action types (invite, email_change, magiclink) fall back to
    // Supabase default templates — not yet custom-branded.
  } catch (err) {
    // Log but return 200 so Supabase doesn't block the auth flow.
    console.error("[send-email hook] email dispatch failed:", err);
  }

  return NextResponse.json({ message: "ok" });
}
