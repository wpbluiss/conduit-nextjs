// Last-active by employee, merged across every signal that should bump the
// "Active Xh ago" stamp. Until R15 there was only conduit_messages — voice-
// only sessions and engineering builds left the team grid showing stale
// stamps even though Luis had just talked to that employee. This helper
// pulls all three signal sources scoped to one account, takes the max per
// employee, and returns a flat map.

import type { SupabaseClient } from "@supabase/supabase-js";

export type LastActiveMap = Record<string, string>;

/**
 * @param accountId - the conduit_accounts.id row
 * @param accountConvoIds - optional pre-fetched conversation ids; saves a
 *   round-trip when the caller already has them. If omitted the function
 *   queries them.
 */
export async function getLastActiveByEmployee(
  supabase: SupabaseClient,
  accountId: string,
  accountConvoIds?: string[],
): Promise<LastActiveMap> {
  let convoIds = accountConvoIds;
  if (!convoIds) {
    const { data } = await supabase
      .from("conduit_conversations")
      .select("id")
      .eq("account_id", accountId);
    convoIds = (data ?? []).map((c) => c.id as string);
  }

  const [messagesQ, voiceQ, engQ] = await Promise.all([
    convoIds.length === 0
      ? Promise.resolve({ data: [] as Array<{ employee: string | null; created_at: string; conversation_id: string | null }> })
      : supabase
          .from("conduit_messages")
          .select("employee, created_at, conversation_id")
          .eq("role", "assistant")
          .in("conversation_id", convoIds)
          .order("created_at", { ascending: false })
          .limit(150),
    supabase
      .from("conduit_voice_sessions")
      .select("employee, started_at")
      .eq("account_id", accountId)
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("conduit_engineering_sessions")
      .select("created_at, completed_at")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const lastByEmp: LastActiveMap = {};
  const bump = (employee: string | null | undefined, iso: string | null | undefined) => {
    if (!employee || !iso) return;
    const cur = lastByEmp[employee];
    if (!cur || cur < iso) lastByEmp[employee] = iso;
  };

  for (const m of messagesQ.data ?? []) {
    bump(m.employee as string | null, m.created_at as string | null);
  }
  for (const v of voiceQ.data ?? []) {
    bump(v.employee as string | null, v.started_at as string | null);
  }
  // Engineering sessions: bump the engineering employee on completed_at if
  // present (ship time is the meaningful signal), else created_at.
  for (const e of engQ.data ?? []) {
    bump("engineering", (e.completed_at as string | null) ?? (e.created_at as string | null));
  }

  return lastByEmp;
}

/**
 * Convenience: last-active for one employee. Used on the workspace page
 * (`/app/team/[employee]`) where the cost of pulling all employees is
 * unnecessary. Falls back to the multi-employee helper since that path
 * already merges all signals correctly.
 */
export async function getLastActiveForEmployee(
  supabase: SupabaseClient,
  accountId: string,
  employeeId: string,
): Promise<string | null> {
  const all = await getLastActiveByEmployee(supabase, accountId);
  return all[employeeId] ?? null;
}
