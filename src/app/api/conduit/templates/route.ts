import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_TEMPLATES = 50;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  const { data, error } = await supabase
    .from("conduit_prompt_templates")
    .select("id, title, body, created_at, updated_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(MAX_TEMPLATES);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const account = await getOrCreateAccount(supabase, user);

  let body: { title?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const bodyText = body.body?.trim() ?? "";
  if (!title || title.length > 120)
    return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  if (!bodyText || bodyText.length > 4000)
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  // Enforce per-account cap.
  const { count } = await supabase
    .from("conduit_prompt_templates")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id);
  if ((count ?? 0) >= MAX_TEMPLATES)
    return NextResponse.json({ error: "limit_reached" }, { status: 400 });

  const { data, error } = await supabase
    .from("conduit_prompt_templates")
    .insert({ account_id: account.id, title, body: bodyText })
    .select("id, title, body, created_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ template: data }, { status: 201 });
}
