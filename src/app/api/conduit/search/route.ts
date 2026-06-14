import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ chats: [], memory: [], artifacts: [] });
  }

  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const pattern = `%${q}%`;
  const [chatsQ, memoryQ, artifactsQ] = await Promise.all([
    supabase
      .from("conduit_conversations")
      .select("id, title, updated_at, dominant_employee")
      .eq("account_id", account.id)
      .ilike("title", pattern)
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("conduit_memory")
      .select("id, content, kind, created_at")
      .eq("account_id", account.id)
      .is("archived_at", null)
      .ilike("content", pattern)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("conduit_artifacts")
      .select("id, title, type, created_at, conversation_id")
      .eq("account_id", account.id)
      .ilike("title", pattern)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    chats: chatsQ.data ?? [],
    memory: memoryQ.data ?? [],
    artifacts: artifactsQ.data ?? [],
  });
}
