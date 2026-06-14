import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const dynamic = "force-dynamic";

export async function GET() {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("conduit_notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unreadCount = (data ?? []).filter((n: { read_at: unknown }) => !n.read_at).length;
  return NextResponse.json({ notifications: data ?? [], unreadCount });
}

export async function PATCH(req: Request) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { account } = current;

  const body = await req.json().catch(() => ({}));
  const { id } = body as { id?: string };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("conduit_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", account.id)
    .is("read_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
