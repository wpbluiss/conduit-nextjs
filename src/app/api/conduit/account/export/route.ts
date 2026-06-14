import { NextResponse } from "next/server";
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

  // Fetch conversations first to get IDs needed for message query.
  // RLS on conduit_conversations (account_members_full_access) ensures
  // we only see this user's rows — no additional filter needed beyond
  // the explicit account_id eq for clarity.
  const { data: conversations } = await supabase
    .from("conduit_conversations")
    .select("id, title, created_at, updated_at")
    .eq("account_id", account.id)
    .order("created_at", { ascending: true });

  const convIds = (conversations ?? []).map((c: { id: string }) => c.id);

  // Messages and memory can be fetched in parallel.
  const [msgResult, memResult] = await Promise.all([
    convIds.length > 0
      ? supabase
          .from("conduit_messages")
          .select("id, conversation_id, role, employee, content, created_at")
          .in("conversation_id", convIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("conduit_memory")
      .select("id, kind, dept, scope, content, created_at, updated_at")
      .eq("account_id", account.id)
      .order("created_at", { ascending: true }),
  ]);

  const messages: Array<{
    id: string;
    conversation_id: string;
    role: string;
    employee?: string | null;
    content: string;
    created_at: string;
  }> = msgResult.data ?? [];

  const bundle = {
    exported_at: new Date().toISOString(),
    profile: {
      name: account.name,
      email: user.email,
      created_at: account.created_at,
      timezone: account.timezone,
      tier: account.tier_id,
    },
    conversations: (conversations ?? []).map(
      (conv: { id: string; title: string | null; created_at: string; updated_at: string }) => ({
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        messages: messages
          .filter((m) => m.conversation_id === conv.id)
          .map(({ conversation_id: _omit, ...m }) => m),
      }),
    ),
    memory: memResult.data ?? [],
  };

  const json = JSON.stringify(bundle, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="praxis-export-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
