import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const account = await getOrCreateAccount(supabase, user);
  const type = request.nextUrl.searchParams.get("type");

  let q = supabase
    .from("conduit_artifacts")
    .select("id, type, title, produced_by, created_at, conversation_id")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(200);
  if (type) q = q.eq("type", type);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ artifacts: data });
}
