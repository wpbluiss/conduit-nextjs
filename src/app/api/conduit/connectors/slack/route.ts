import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// DELETE /api/conduit/connectors/slack
// Disconnects Slack by removing the stored token row.
export async function DELETE() {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("conduit_connector_tokens")
    .delete()
    .eq("account_id", account.id)
    .eq("provider", "slack");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/conduit/connectors/slack
// Updates the selected channel stored in meta.
export async function PATCH(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;

  let body: { channel_id?: string; channel_name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const channelId = body.channel_id?.trim();
  if (!channelId) {
    return NextResponse.json({ error: "channel_id_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Verify the token exists first.
  const { data: existing } = await supabase
    .from("conduit_connector_tokens")
    .select("meta")
    .eq("account_id", account.id)
    .eq("provider", "slack")
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const { error } = await supabase
    .from("conduit_connector_tokens")
    .update({
      meta: { channel_id: channelId, channel_name: body.channel_name ?? channelId },
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account.id)
    .eq("provider", "slack");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
