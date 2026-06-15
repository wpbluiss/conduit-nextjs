import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGoogleOAuthUrl, isGoogleCalendarConfigured } from "@/lib/connectors/google-calendar";

export const runtime = "nodejs";

// GET /api/conduit/connectors/google-calendar/auth
// Redirects the user to Google's OAuth consent screen.
// A random `state` nonce is stored in a short-lived cookie to prevent CSRF.
export async function GET() {
  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "google_calendar_not_configured" },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Generate CSRF state nonce.
  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("gcal_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.redirect(getGoogleOAuthUrl(state));
}
