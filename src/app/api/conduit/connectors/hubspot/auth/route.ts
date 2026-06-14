import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHubSpotOAuthUrl, isHubSpotConfigured } from "@/lib/connectors/hubspot";

export const runtime = "nodejs";

// GET /api/conduit/connectors/hubspot/auth
// Redirects the user to HubSpot's OAuth consent screen.
export async function GET() {
  if (!isHubSpotConfigured()) {
    return NextResponse.json({ error: "hubspot_not_configured" }, { status: 503 });
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
  jar.set("hubspot_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(getHubSpotOAuthUrl(state));
}
