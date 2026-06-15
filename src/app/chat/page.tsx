import { redirect } from "next/navigation";
import { getCurrentAccount, userDisplayName } from "@/lib/conduit/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tierById } from "@/lib/billing/tiers";
import { EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { LiveChat, type LiveMsg } from "@/components/conduit/live-chat/LiveChat";
import { UserProvider } from "@/context/UserContext";

const INITIAL_MSG_LIMIT = 50;

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
  let initialHasMore = false;
  if (activeId) {
    // Fetch newest INITIAL_MSG_LIMIT+1 messages (DESC) so we can detect
    // whether there are older ones without a separate count query, then
    // reverse to ascending order for display.
    const msgsQ = await supabase
      .from("conduit_messages")
      .select("id, role, employee, content, created_at")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: false })
      .limit(INITIAL_MSG_LIMIT + 1);
    const rows = msgsQ.data ?? [];
    initialHasMore = rows.length > INITIAL_MSG_LIMIT;
    initialMessages = rows
      .slice(0, INITIAL_MSG_LIMIT)
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id as string,
        role: m.role as "user" | "assistant",
        employee: (m.employee as EmployeeId | null) ?? null,
        content: (m.content as string) ?? "",
        created_at: m.created_at as string,
      }));
  }

  return (
    <UserProvider
      initialUser={{ id: user.id, email: user.email ?? "", plan: account.tier_id }}
    >
      <LiveChat
        firstName={firstName}
        conversations={conversations}
        activeConversationId={activeId}
        initialMessages={initialMessages}
        initialHasMore={initialHasMore}
        allowedEmployees={allowed}
        initialPin={(sp?.pin as EmployeeId) ?? null}
      />
    </UserProvider>
  );
}
