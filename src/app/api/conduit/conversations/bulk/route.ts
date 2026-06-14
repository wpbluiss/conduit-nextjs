import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  let body: { ids?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (body.action !== "archive" && body.action !== "unarchive") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  if (
    !Array.isArray(body.ids) ||
    body.ids.length === 0 ||
    body.ids.length > 200 ||
    !body.ids.every((id) => typeof id === "string")
  ) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }

  const ids = body.ids as string[];
  const archivedAt =
    body.action === "archive" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("conduit_conversations")
    .update({ archived_at: archivedAt })
    .in("id", ids)
    .eq("account_id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: ids.length, action: body.action });
}
