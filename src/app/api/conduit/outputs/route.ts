import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";

export const runtime = "nodejs";

const MAX_CONTENT_CHARS = 20_000;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_outputs")
    .select("id, title, content, specialist, source_conversation_id, created_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ outputs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { title?: string; content?: string; specialist?: string; source_message_id?: string; source_conversation_id?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }

  const title = body.title?.trim();
  const content = body.content?.trim();
  const specialist = body.specialist?.trim();

  if (!title || title.length > 200) return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  if (!content || content.length > MAX_CONTENT_CHARS) return NextResponse.json({ error: "invalid_content" }, { status: 400 });
  if (!specialist) return NextResponse.json({ error: "invalid_specialist" }, { status: 400 });

  const account = await getOrCreateAccount(supabase, user);
  const { data, error } = await supabase
    .from("conduit_outputs")
    .insert({
      account_id: account.id,
      title,
      content,
      specialist,
      source_message_id: body.source_message_id ?? null,
      source_conversation_id: body.source_conversation_id ?? null,
    })
    .select("id, title, content, specialist, source_conversation_id, created_at")
    .single();

  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ output: data }, { status: 201 });
}
