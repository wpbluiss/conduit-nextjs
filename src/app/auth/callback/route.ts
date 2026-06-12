import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Auth callback for PKCE flows (email confirmation, password reset, magic link).
 * Supabase sends users here with ?code=... after email actions. This route
 * exchanges the one-time code for a session, then redirects to the intended
 * destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password reset: bounce to the reset-password page so the user can
      // set their new password while the session is active.
      if (type === "recovery") {
        return NextResponse.redirect(new URL("/auth/reset-password", origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Code missing or exchange failed — redirect to sign-in with an error flag.
  return NextResponse.redirect(
    new URL("/auth/sign-in?error=link_expired", origin),
  );
}
