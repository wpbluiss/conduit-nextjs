import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { captureServerEvent, hashUserId } from "@/lib/analytics/posthog";

export const runtime = "nodejs";

// Supabase PKCE email confirmation lands here with ?code=...
// Exchange the code for a session and redirect.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Guard against open-redirect: only follow relative next paths.
  const rawNext = searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") ? rawNext : "/app";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const ageMs = Date.now() - new Date(user.created_at).getTime();
        if (ageMs < 60_000) {
          await captureServerEvent(hashUserId(user.id), "user_signed_up", {
            source: rawNext.includes("pricing") ? "pricing-CTA" : "organic",
          });
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
