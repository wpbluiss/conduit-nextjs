// R17 Slice 1: top-level Memory Desk surface.
// Promoted out of /app/settings/memory (which now redirects here).
// Contract: specs/memory-and-connectors/contracts/memory-desk.md

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import type { EmployeeId } from "@/lib/conduit/employees";
import type { MemoryRecord } from "@/lib/ai/memory";
import { MemoryDesk } from "@/components/conduit/memory/MemoryDesk";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/memory");
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const cap = account.internal_account ? 5000 : tier.memoryCap;

  const { data: memoryRows } = await supabase
    .from("conduit_memory")
    .select(
      "id, account_id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by, pinned, locked",
    )
    .eq("account_id", account.id)
    .is("archived_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  const memIds = (memoryRows ?? []).map((m) => m.id as string);
  const { data: scopeRows } = memIds.length
    ? await supabase
        .from("conduit_memory_scope")
        .select("memory_id, employee_id")
        .in("memory_id", memIds)
    : { data: [] as { memory_id: string; employee_id: string }[] };

  const scopeMap = new Map<string, EmployeeId[]>();
  for (const r of scopeRows ?? []) {
    const arr = scopeMap.get(r.memory_id as string) ?? [];
    arr.push(r.employee_id as EmployeeId);
    scopeMap.set(r.memory_id as string, arr);
  }

  const initial: MemoryRecord[] = (memoryRows ?? []).map(
    (m) =>
      ({
        ...m,
        scope: scopeMap.get(m.id as string) ?? [],
      }) as MemoryRecord,
  );

  return <MemoryDesk initial={initial} cap={cap} />;
}
