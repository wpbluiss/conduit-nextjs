import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { exchangeGitHubCode } from "@/lib/connectors/github";

export const runtime = "nodejs";

// GET /api/conduit/connectors/github/callback
// GitHub redirects here after the user grants consent.
// Validates CSRF state, exchanges the auth code for tokens, and stores them.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("github_oauth_state")?.value;

  jar.delete("github_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "github_denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "github_csrf");
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
    tokens = await exchangeGitHubCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "github_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "github",
        access_token: tokens.access_token,
        refresh_token: null,
        expires_at: null,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "github_db");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connector_connected", "github");
  return NextResponse.redirect(settingsUrl);
}
