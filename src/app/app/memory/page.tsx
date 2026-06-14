// R18 Slice 1: Memory canvas (node-graph on dotted grid).
// Server-fetches identically to R17 Slice 1 plus position_x/y from the
// R18 migration. Mounts <MemoryCanvas> (replaces the R17 <MemoryDesk>
// dossier; that component + MemorySection/MemoryCard/MemoryAddForm are
// deleted in this slice).
//
// Contract: specs/praxis-design-language/contracts/memory-canvas.md §2

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import type { EmployeeId } from "@/lib/conduit/employees";
import type { MemoryRecord } from "@/lib/ai/memory";
import { MemoryCanvas } from "@/components/conduit/memory/MemoryCanvas";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; dept?: string; kind?: string }>;
}

export default async function MemoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/memory");
  const { account } = current;
  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const cap = account.internal_account ? 5000 : tier.memoryCap;

  const { data: memoryRows } = await supabase
    .from("conduit_memory")
    .select(
      "id, account_id, kind, content, tags, source_conversation_id, source_message_id, written_by, created_at, updated_at, archived_at, superseded_by, pinned, locked, position_x, position_y",
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

  return (
    <MemoryCanvas
      initial={initial}
      cap={cap}
      initialQ={params.q ?? ""}
      initialDept={params.dept ?? "all"}
      initialKinds={(params.kind ?? "").split(",").filter(Boolean)}
    />
  );
}
