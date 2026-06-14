import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";

export const runtime = "nodejs";

// Supabase PKCE email confirmation lands here with ?code=...
// Exchange the code for a session and redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Guard against open-redirect: only follow relative next paths.
  const rawNext = searchParams.get("next") ?? "/app";
  // Sanitize: must be relative and not an auth route (prevents open-redirect).
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("/auth")
      ? rawNext
      : "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Detect brand-new sign-ups (account created in the last 60 s) and send
      // a warm welcome email. Non-blocking so a Resend error never breaks auth.
      const user = data?.session?.user;
      if (user?.email && user.created_at) {
        const ageSecs = (Date.now() - new Date(user.created_at).getTime()) / 1000;
        if (ageSecs < 60) {
          sendWelcomeEmail(user.email).catch(() => {});
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send to sign-in with an error hint.
  return NextResponse.redirect(
    `${origin}/auth/sign-in?error=confirmation_failed`,
  );
}
