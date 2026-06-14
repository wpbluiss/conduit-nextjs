import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { getSlackToken, listSlackChannels } from "@/lib/connectors/slack";

export const runtime = "nodejs";

// GET /api/conduit/connectors/slack/channels
// Returns the list of Slack channels the bot token has access to.
// Used by the channel picker in Settings → Integrations.
export async function GET() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const token = await getSlackToken(supabase, account.id);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const channels = await listSlackChannels(token.access_token);
  return NextResponse.json({ channels });
}
