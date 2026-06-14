import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_LABELS = 10;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_conversation_labels")
    .select("id, name, color, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ labels: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { name?: string; color?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 32);
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const color = body.color ?? "#6366f1";
  if (!COLOR_RE.test(color)) return NextResponse.json({ error: "invalid color" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);

  // Cap at MAX_LABELS per account
  const { count } = await supabase
    .from("conduit_conversation_labels")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);

  if ((count ?? 0) >= MAX_LABELS) {
    return NextResponse.json({ error: "label_limit_reached" }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("conduit_conversation_labels")
    .insert({ account_id: account.id, name, color })
    .select("id, name, color, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ label: data }, { status: 201 });
}
