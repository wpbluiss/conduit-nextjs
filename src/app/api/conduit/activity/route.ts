import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import type { EmployeeKey } from "@/lib/ai/provider";

const PAGE_SIZE = 40;

export interface ActivityEvent {
  id: string;
  type: "conversation" | "build";
  conversationId: string | null;
  buildId: string | null;
  employee: EmployeeKey;
  summary: string;
  timestamp: string;
  buildName?: string;
}

export async function GET(req: NextRequest) {
  const current = await getCurrentAccount();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  const before = req.nextUrl.searchParams.get("before") ?? null;

  // Fetch conversation IDs for this account first (subquery pattern not type-safe with Supabase SDK).
  const { data: convRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id)
    .limit(200);
  const convIds = (convRows ?? []).map((r) => r.id as string);

  let msgQuery = supabase
    .from("conduit_messages")
    .select("id, conversation_id, employee, content, created_at")
    .eq("role", "assistant")
    .in("conversation_id", convIds.length > 0 ? convIds : ["__none__"])
    .not("employee", "is", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) {
    msgQuery = msgQuery.lt("created_at", before);
  }

  const { data: msgs } = await msgQuery;

  let buildQuery = supabase
    .from("conduit_builds")
    .select("id, build_name, status, created_at, conversation_id")
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) {
    buildQuery = buildQuery.lt("created_at", before);
  }

  const { data: builds } = await buildQuery;

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

  return NextResponse.json({ events, hasMore, nextBefore: hasMore ? lastTs : null });
}
