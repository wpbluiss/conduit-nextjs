import { redirect } from "next/navigation";
import { getCurrentAccount, userDisplayName } from "@/lib/conduit/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tierById } from "@/lib/billing/tiers";
import { EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { LiveChat, type LiveMsg } from "@/components/conduit/live-chat/LiveChat";

// Wired-live chat in the new ember identity. Additive route (the existing
// /app chat is untouched); reuses the real /api/conduit/chat SSE engine +
// real conduit_conversations / conduit_messages for the signed-in account.
export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; pin?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/chat");
  const { account, user } = current;
  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const allowed = (internal ? EMPLOYEE_ORDER : tier.allowedEmployees) as EmployeeId[];
  const firstName = userDisplayName(user).split(" ")[0] || "there";

  const convosQ = await supabase
    .from("conduit_conversations")
    .select("id, title, updated_at")
    .eq("account_id", account.id)
    .order("updated_at", { ascending: false })
    .limit(50);
  const conversations = (convosQ.data ?? []).map((c) => ({
    id: c.id as string,
    title: (c.title as string | null) ?? "New conversation",
    updated_at: c.updated_at as string,
  }));

  // ?new=1 starts a fresh empty thread; otherwise ?c= wins, falling back to
  // the most recent conversation on plain /chat.
  const activeId = sp?.new ? null : sp?.c ?? conversations[0]?.id ?? null;
  let initialMessages: LiveMsg[] = [];
  if (activeId) {
    const msgsQ = await supabase
      .from("conduit_messages")
      .select("id, role, employee, content, metadata")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .limit(200);
    initialMessages = (msgsQ.data ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id as string,
        role: m.role as "user" | "assistant",
        employee: (m.employee as EmployeeId | null) ?? null,
        content: (m.content as string) ?? "",
        audio_path: (m.metadata as Record<string, unknown> | null)?.audio_path as string | undefined,
      }));
  }

  return (
    <LiveChat
      firstName={firstName}
      conversations={conversations}
      activeConversationId={activeId}
      initialMessages={initialMessages}
      allowedEmployees={allowed}
      initialPin={(sp?.pin as EmployeeId) ?? null}
    />
  );
}
