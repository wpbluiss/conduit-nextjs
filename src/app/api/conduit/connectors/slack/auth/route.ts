import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSlackOAuthUrl, isSlackConfigured } from "@/lib/connectors/slack";

export const runtime = "nodejs";

// GET /api/conduit/connectors/slack/auth
// Redirects the user to Slack's OAuth consent screen.
// A random `state` nonce is stored in a short-lived cookie to prevent CSRF.
export async function GET() {
  if (!isSlackConfigured()) {
    return NextResponse.json(
      { error: "slack_not_configured" },
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

  const state = crypto.randomUUID();
  const jar = await cookies();
  jar.set("slack_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getSlackOAuthUrl(state));
}
