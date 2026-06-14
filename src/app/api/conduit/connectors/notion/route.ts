import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

// DELETE /api/conduit/connectors/notion
// Disconnects Notion by removing the stored token row.
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
    .eq("provider", "notion");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH /api/conduit/connectors/notion
// Updates the selected_pages list in the token's meta JSONB.
export async function PATCH(request: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  let body: { selected_pages?: Array<{ id: string; title: string }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const selectedPages = (body.selected_pages ?? []).slice(0, 5);

  const { data: existing } = await supabase
    .from("conduit_connector_tokens")
    .select("meta")
    .eq("account_id", account.id)
    .eq("provider", "notion")
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "not_connected" }, { status: 404 });
  }

  const currentMeta = (existing.meta as Record<string, unknown>) ?? {};
  const { error } = await supabase
    .from("conduit_connector_tokens")
    .update({
      meta: { ...currentMeta, selected_pages: selectedPages },
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", account.id)
    .eq("provider", "notion");

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
