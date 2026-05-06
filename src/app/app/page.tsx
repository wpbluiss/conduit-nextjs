import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { Chat, type MessageRow } from "@/components/conduit/Chat";
import type { EmployeeKey } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function ChatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const account = await getOrCreateAccount(supabase, user);

  let conversationId: string | null = null;
  let messages: MessageRow[] = [];
  if (params.c) {
    const { data: convo } = await supabase
      .from("conduit_conversations")
      .select("id, account_id")
      .eq("id", params.c)
      .maybeSingle();
    if (convo && convo.account_id === account.id) {
      conversationId = convo.id;
      const { data: rows } = await supabase
        .from("conduit_messages")
        .select("id, role, employee, content, metadata, created_at")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: true });

      // Fetch artifacts referenced by these messages so they show up after refresh
      const messageIds = (rows ?? []).map((r) => r.id);
      let artifactsByMsg: Record<
        string,
        { id: string; title: string; type: string }[]
      > = {};
      if (messageIds.length) {
        const { data: arts } = await supabase
          .from("conduit_artifacts")
          .select("id, title, type, message_id")
          .in("message_id", messageIds);
        artifactsByMsg = (arts ?? []).reduce(
          (acc, a) => {
            const mid = a.message_id as string | null;
            if (!mid) return acc;
            (acc[mid] = acc[mid] || []).push({
              id: a.id,
              title: a.title,
              type: a.type,
            });
            return acc;
          },
          {} as Record<
            string,
            { id: string; title: string; type: string }[]
          >,
        );
      }

      messages = (rows ?? []).map((r) => ({
        id: r.id,
        role: r.role as MessageRow["role"],
        employee: r.employee as EmployeeKey | null,
        content: r.content,
        metadata: r.metadata,
        artifacts: artifactsByMsg[r.id],
      }));
    }
  }

  return (
    <Chat conversationId={conversationId} initialMessages={messages} />
  );
}
