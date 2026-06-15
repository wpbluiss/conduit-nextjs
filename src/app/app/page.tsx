import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount, userDisplayName } from "@/lib/conduit/account";
import { Chat, type MessageRow } from "@/components/conduit/Chat";
import type { EmployeeKey } from "@/lib/ai/provider";
import { tierById } from "@/lib/billing/tiers";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function ChatPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const current = await getCurrentAccount();
  if (!current) return null;
  const { account, user } = current;
  const supabase = await createSupabaseServerClient();

  const PAGE_SIZE = 30;
  let conversationId: string | null = null;
  let conversationTitle: string | null = null;
  let handoffConversationId: string | null = null;
  let handoffEmployee: string | null = null;
  let messages: MessageRow[] = [];
  let initialHasMore = false;
  if (params.c) {
    const { data: convo } = await supabase
      .from("conduit_conversations")
      .select("id, account_id, title, handoff_conversation_id, handoff_employee")
      .eq("id", params.c)
      .maybeSingle();
    if (convo && convo.account_id === account.id) {
      conversationId = convo.id;
      conversationTitle = (convo.title as string | null) ?? null;
      handoffConversationId = (convo.handoff_conversation_id as string | null) ?? null;
      handoffEmployee = (convo.handoff_employee as string | null) ?? null;
      // Load only the most recent PAGE_SIZE messages for fast initial render.
      // The client fetches older pages via /api/conduit/messages when scrolling up.
      const { data: rows } = await supabase
        .from("conduit_messages")
        .select("id, role, employee, content, metadata, created_at")
        .eq("conversation_id", convo.id)
        .is("hidden_at", null)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE + 1);

      initialHasMore = (rows?.length ?? 0) > PAGE_SIZE;
      const page = (rows ?? []).slice(0, PAGE_SIZE).reverse();

      // Fetch artifacts referenced by these messages so they show up after refresh
      const messageIds = page.map((r) => r.id);
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

      // Fetch existing feedback reactions for these messages.
      let feedbackByMsg: Record<string, 1 | -1> = {};
      if (messageIds.length) {
        try {
          const { data: feedbackRows } = await supabase
            .from("conduit_message_feedback")
            .select("message_id, rating")
            .in("message_id", messageIds)
            .eq("account_id", account.id);
          feedbackByMsg = (feedbackRows ?? []).reduce(
            (acc, f) => {
              acc[f.message_id as string] = f.rating as 1 | -1;
              return acc;
            },
            {} as Record<string, 1 | -1>,
          );
        } catch {
          // Non-fatal: feedback hydration failure doesn't block chat load.
        }
      }

      messages = page.map((r) => ({
        id: r.id,
        role: r.role as MessageRow["role"],
        employee: r.employee as EmployeeKey | null,
        content: r.content,
        metadata: r.metadata,
        artifacts: artifactsByMsg[r.id],
        feedback: feedbackByMsg[r.id] ?? null,
        created_at: r.created_at as string | null,
      }));
    }
  }

  const firstName = userDisplayName(user).split(" ")[0];
  const ttsAllowed = Boolean(
    account.internal_account || account.tier_id !== "free",
  );
  const allowedEmployees = (
    account.internal_account
      ? (EMPLOYEE_ORDER as EmployeeKey[])
      : (tierById(account.tier_id).allowedEmployees as EmployeeKey[])
  ) as EmployeeKey[];

  // Detect first-run: user has no conversations yet.
  const { count: convCount } = await supabase
    .from("conduit_conversations")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .limit(1);
  const isFirstRun = (convCount ?? 0) === 0;

  return (
    <Chat
      conversationId={conversationId}
      conversationTitle={conversationTitle}
      initialMessages={messages}
      initialHasMore={initialHasMore}
      firstName={firstName}
      internalAccount={Boolean(account.internal_account)}
      voice={{
        enabled: Boolean(account.voice_enabled),
        autoPlay: Boolean(account.voice_auto_play),
        ttsAllowed,
      }}
      allowedEmployees={allowedEmployees}
      isFirstRun={isFirstRun}
      companyBrief={account.company_brief ?? null}
      handoffConversationId={handoffConversationId}
      handoffEmployee={handoffEmployee}
    />
  );
}
