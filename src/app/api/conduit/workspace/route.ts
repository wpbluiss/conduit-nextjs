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

  let body: { workspace_name?: string | null; avatar_url?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (body.workspace_name !== undefined) {
    const wn =
      body.workspace_name === null
        ? null
        : String(body.workspace_name).trim().slice(0, 64);
    update.workspace_name = wn || null;
  }

  if ("avatar_url" in body) {
    update.avatar_url = body.avatar_url ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_op" }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const account = await getOrCreateAccount(supabase, user);
  const { error } = await supabase
    .from("conduit_accounts")
    .update(update)
    .eq("id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
