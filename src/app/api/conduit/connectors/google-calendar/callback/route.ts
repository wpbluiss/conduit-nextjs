import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { exchangeGoogleCode } from "@/lib/connectors/google-calendar";

export const runtime = "nodejs";

// GET /api/conduit/connectors/google-calendar/callback
// Google redirects here after the user grants consent.
// Validates CSRF state, exchanges the auth code for tokens, and stores them.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("gcal_oauth_state")?.value;

  // Clear the state cookie regardless of outcome.
  jar.delete("gcal_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "google_calendar_denied");
    return NextResponse.redirect(settingsUrl);
  }

  // CSRF check.
  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "google_calendar_csrf");
    return NextResponse.redirect(settingsUrl);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.nextUrl.origin));
  }

  const account = await getOrCreateAccount(supabase, user);

  let tokens: { access_token: string; refresh_token?: string; expires_in: number; scope: string };
  try {
    tokens = await exchangeGoogleCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "google_calendar_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "google_calendar",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "google_calendar_db");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connector_connected", "google_calendar");
  return NextResponse.redirect(settingsUrl);
}
