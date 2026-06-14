import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_conversations")
    .select("id, title, created_at, updated_at")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ conversations: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);

  const body = await request.json().catch(() => ({}));
  const { ids, action } = body as { ids: unknown; action: unknown };

  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) {
    return NextResponse.json(
      { error: "ids must be a non-empty array (max 100)" },
      { status: 400 },
    );
  }
  if (!ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "ids must be strings" }, { status: 400 });
  }
  if (action !== "archive" && action !== "unarchive") {
    return NextResponse.json(
      { error: "action must be archive or unarchive" },
      { status: 400 },
    );
  }

  const archived_at = action === "archive" ? new Date().toISOString() : null;

  // Update only rows owned by this account — no separate ownership check needed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("conduit_conversations") as any)
    .update({ archived_at })
    .in("id", ids as string[])
    .eq("account_id", account.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_conversations")
    .insert({ account_id: account.id, title: "New conversation" })
    .select("id, title, created_at, updated_at")
    .single();
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ conversation: data });
}
