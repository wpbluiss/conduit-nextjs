import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { exchangeNotionCode, searchNotionPages, syncNotionPages } from "@/lib/connectors/notion";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const jar = await cookies();
  const expectedState = jar.get("notion_oauth_state")?.value;
  jar.delete("notion_oauth_state");

  const settingsUrl = new URL("/app/settings?tab=integrations", request.nextUrl.origin);

  if (error || !code) {
    settingsUrl.searchParams.set("connector_error", "notion_denied");
    return NextResponse.redirect(settingsUrl);
  }

  if (!state || state !== expectedState) {
    settingsUrl.searchParams.set("connector_error", "notion_csrf");
    return NextResponse.redirect(settingsUrl);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/sign-in", request.nextUrl.origin));

  const account = await getOrCreateAccount(supabase, user);

  let tokens: { access_token: string; workspace_id: string; workspace_name: string; bot_id: string };
  try {
    tokens = await exchangeNotionCode(code);
  } catch {
    settingsUrl.searchParams.set("connector_error", "notion_exchange");
    return NextResponse.redirect(settingsUrl);
  }

  const { error: dbError } = await supabase
    .from("conduit_connector_tokens")
    .upsert(
      {
        account_id: account.id,
        provider: "notion",
        access_token: tokens.access_token,
        refresh_token: null,
        expires_at: null,
        scope: "read_content",
        meta: {
          workspace_id: tokens.workspace_id,
          workspace_name: tokens.workspace_name,
          bot_id: tokens.bot_id,
          page_ids: [],
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id,provider" },
    );

  if (dbError) {
    settingsUrl.searchParams.set("connector_error", "notion_db");
    return NextResponse.redirect(settingsUrl);
  }

  // Initial sync: retrieve the most recently edited accessible pages (up to 5).
  // Non-blocking — if this fails the user can select pages manually in Settings.
  try {
    const pages = await searchNotionPages(tokens.access_token, "");
    const topPageIds = pages.slice(0, 5).map((p) => p.id);
    if (topPageIds.length > 0) {
      await supabase
        .from("conduit_connector_tokens")
        .update({
          meta: {
            workspace_id: tokens.workspace_id,
            workspace_name: tokens.workspace_name,
            bot_id: tokens.bot_id,
            page_ids: topPageIds,
          },
        })
        .eq("account_id", account.id)
        .eq("provider", "notion");
      await syncNotionPages(supabase, account.id, tokens.access_token, topPageIds);
    }
  } catch {
    // Non-fatal: pages can be selected manually in Settings.
  }

  settingsUrl.searchParams.set("connector_connected", "notion");
  return NextResponse.redirect(settingsUrl);
}
