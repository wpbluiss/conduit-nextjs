import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import {
  exchangeLinkedInCode,
  getLinkedInPersonUrn,
} from "@/lib/connectors/linkedin";

export const runtime = "nodejs";

// GET /api/conduit/connectors/linkedin/callback
// LinkedIn redirects here after the user grants access.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("linkedin_oauth_state")?.value;
  jar.delete("linkedin_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "linkedin_denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "linkedin_csrf");
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

  let tokens: { access_token: string; expires_in: number };
  try {
    tokens = await exchangeLinkedInCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "linkedin_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Fetch the person URN to enable personal post fetching later.
  const personUrn = await getLinkedInPersonUrn(tokens.access_token).catch(() => null);

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "linkedin",
        access_token: tokens.access_token,
        refresh_token: null,
        expires_at: expiresAt,
        scope: "r_liteprofile r_emailaddress r_organization_social w_member_social",
        meta: personUrn ? { person_urn: personUrn } : {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "linkedin_db");
    return NextResponse.redirect(settingsUrl);
  }

  settingsUrl.searchParams.set("connector_connected", "linkedin");
  return NextResponse.redirect(settingsUrl);
}
