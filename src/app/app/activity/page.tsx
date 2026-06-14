import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import type { EmployeeKey } from "@/lib/ai/provider";
import { ActivityFeed } from "@/components/conduit/ActivityFeed";
import type { ActivityEvent } from "@/app/api/conduit/activity/route";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity — Praxis",
};

const PAGE_SIZE = 40;

export default async function ActivityPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/activity");
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  // Fetch conversation IDs for this account first (subquery pattern not type-safe with Supabase SDK).
  const { data: convRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id)
    .limit(200);
  const convIds = (convRows ?? []).map((r) => r.id as string);

  const [{ data: msgs }, { data: builds }] = await Promise.all([
    supabase
      .from("conduit_messages")
      .select("id, conversation_id, employee, content, created_at")
      .eq("role", "assistant")
      .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
      .not("employee", "is", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
    supabase
      .from("conduit_builds")
      .select("id, build_name, status, created_at, conversation_id")
      .eq("account_id", account.id)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
  ]);

  const events: ActivityEvent[] = [
    ...(msgs ?? []).map((m) => ({
      id: `msg-${m.id as string}`,
      type: "conversation" as const,
      conversationId: m.conversation_id as string,
      buildId: null,
      employee: (m.employee as EmployeeKey) ?? "jarvis",
      summary: ((m.content as string) ?? "").slice(0, 120),
      timestamp: m.created_at as string,
    })),
    ...(builds ?? []).map((b) => ({
      id: `build-${b.id as string}`,
      type: "build" as const,
      conversationId: (b.conversation_id as string | null) ?? null,
      buildId: b.id as string,
      employee: "engineering" as EmployeeKey,
      summary: (b.build_name as string) ?? "Build",
      timestamp: b.created_at as string,
      buildName: (b.build_name as string) ?? undefined,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, PAGE_SIZE);

  const hasMore = events.length === PAGE_SIZE;
  const lastTs = events[events.length - 1]?.timestamp ?? null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header
        className="px-6 py-5 border-b shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          Activity
        </h1>
        <p
          className="mt-0.5 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          Recent specialist activity across all conversations and builds
        </p>
      </header>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="mx-auto max-w-2xl">
          <ActivityFeed
            initial={events}
            initialHasMore={hasMore}
            initialNextBefore={lastTs}
          />
        </div>
      </div>
    </div>
  );
}
