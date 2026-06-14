import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { exchangeGoogleDriveCode } from "@/lib/connectors/google-drive";

export const runtime = "nodejs";

// GET /api/conduit/connectors/google-drive/callback
// Google redirects here after the user grants Drive consent.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("gdrive_oauth_state")?.value;
  jar.delete("gdrive_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "google_drive_denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "google_drive_csrf");
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
    tokens = await exchangeGoogleDriveCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "google_drive_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "google_drive",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: tokens.scope,
        meta: { selected_files: [] },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "google_drive_db");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connector_connected", "google_drive");
  return NextResponse.redirect(settingsUrl);
}
