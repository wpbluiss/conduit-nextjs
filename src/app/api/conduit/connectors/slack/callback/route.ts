import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { exchangeSlackCode } from "@/lib/connectors/slack";

export const runtime = "nodejs";

// GET /api/conduit/connectors/slack/callback
// Slack redirects here after the user grants access.
// Validates CSRF state, exchanges the auth code for a bot token, and stores it.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("slack_oauth_state")?.value;
  jar.delete("slack_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "slack_denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "slack_csrf");
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

  let tokens: { access_token: string; scope: string };
  try {
    tokens = await exchangeSlackCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "slack_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "slack",
        access_token: tokens.access_token,
        refresh_token: null,
        expires_at: null,
        scope: tokens.scope,
        meta: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "slack_db");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connector_connected", "slack");
  return NextResponse.redirect(settingsUrl);
}
