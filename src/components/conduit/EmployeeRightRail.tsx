import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight } from "lucide-react";
import {
  EMPLOYEES,
  type EmployeeId,
} from "@/lib/conduit/employees";

interface MemoryRow {
  id: string;
  kind: string;
  content: string;
  tags: string[] | null;
  created_at: string;
}

const QUICK_ACTIONS: Record<EmployeeId, string[]> = {
  jarvis: ["Status check on the business", "Help me decide a tradeoff"],
  marketing: ["Draft a blog post", "Plan a 30-day content calendar"],
  sales: ["Refresh leads", "Draft a cold outreach for the top lead"],
  engineering: ["Start a new build", "Sketch a custom integration"],
  finance: ["Walk through my P&L", "90-day cash flow projection"],
  compliance: ["What regulations apply to my business?", "HIPAA basics"],
  hr: ["Draft a job description", "Build an interview rubric"],
  ops: ["Build an SOP for client onboarding", "Set up weekly standup"],
  legal: ["Draft a basic NDA", "Draft a service agreement"],
};

export default async function EmployeeRightRail({
  supabase,
  accountId,
  employeeId,
}: {
  supabase: SupabaseClient;
  accountId: string;
  employeeId: EmployeeId;
}) {
  const meta = EMPLOYEES[employeeId];

  // Pull the 3 most recent memory notes that mention this employee in tags
  // (e.g. tag "sales") or the employee name in content. Falls back to
  // recent memory if nothing matches.
  const tag = employeeId;
  const { data: byTag } = await supabase
    .from("conduit_memory")
    .select("id, kind, content, tags, created_at")
    .eq("account_id", accountId)
    .is("archived_at", null)
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .limit(3);

  let memory: MemoryRow[] = (byTag ?? []) as MemoryRow[];
  if (memory.length < 3) {
    const { data: recent } = await supabase
      .from("conduit_memory")
      .select("id, kind, content, tags, created_at")
      .eq("account_id", accountId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(3 - memory.length + 5);
    const seen = new Set(memory.map((m) => m.id));
    for (const r of (recent ?? []) as MemoryRow[]) {
      if (memory.length >= 3) break;
      if (!seen.has(r.id)) memory.push(r);
    }
  }

  const actions = QUICK_ACTIONS[employeeId] ?? [];

  return (
    <aside className="w-full md:w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-6">
      {/* About */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          About {meta.name}
        </div>
        <p className="text-sm text-[var(--color-text)] leading-relaxed">
          {meta.tagline}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
            style={{
              background: meta.colorSoft,
              color: meta.color,
            }}
          >
            {meta.role}
          </span>
          <span
            className={`inline-flex items-center text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full hairline ${
              meta.canExecute
                ? "text-[var(--color-text)]"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {meta.canExecute ? "Ships work" : "Strategy mode"}
          </span>
        </div>
      </section>

      {/* Recent context */}
      <section>
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Recent context
        </div>
        {memory.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            No memory notes yet. Tell Atlas about {meta.name.toLowerCase()}{" "}
            and he&apos;ll save what matters.
          </p>
        ) : (
          <ul className="space-y-2">
            {memory.map((m) => (
              <li
                key={m.id}
                className="conduit-card px-3 py-2 text-xs leading-snug"
              >
                <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
                  {m.kind}
                </div>
                <p className="text-[var(--color-text)] line-clamp-3">
                  {m.content}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/app/settings/memory"
          className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
        >
          See all memory <ArrowRight size={10} />
        </Link>
      </section>

      {/* Quick actions */}
      {actions.length > 0 && (
        <section>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            Quick actions
          </div>
          <div className="space-y-1.5">
            {actions.map((a) => (
              <Link
                key={a}
                href={`/app?pin=${employeeId}&prompt=${encodeURIComponent(a)}`}
                style={{
                  ["--dept" as string]: meta.color,
                  ["--dept-soft" as string]: meta.colorSoft,
                }}
                className="conduit-suggestion px-3 py-2.5 text-[12px] block leading-snug"
              >
                {a}
              </Link>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
