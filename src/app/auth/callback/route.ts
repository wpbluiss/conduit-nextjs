import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send to sign-in with an error hint.
  return NextResponse.redirect(
    `${origin}/auth/sign-in?error=confirmation_failed`,
  );
}
