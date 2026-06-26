import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArrowRight, Hammer } from "lucide-react";
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

interface EngSession {
  id: string;
  prompt: string;
  status: string;
  deploy_url: string | null;
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

const ACTIVE_STATUSES = new Set(["pending", "running", "deploying"]);

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

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
  const [byTagQ, engSessionsQ] = await Promise.all([
    supabase
      .from("conduit_memory")
      .select("id, kind, content, tags, created_at")
      .eq("account_id", accountId)
      .is("archived_at", null)
      .contains("tags", [tag])
      .order("created_at", { ascending: false })
      .limit(3),
    employeeId === "engineering"
      ? supabase
          .from("conduit_engineering_sessions")
          .select("id, prompt, status, deploy_url, created_at")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as EngSession[] }),
  ]);

  let memory: MemoryRow[] = (byTagQ.data ?? []) as MemoryRow[];
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

  const engSessions = ((engSessionsQ.data ?? []) as EngSession[]).slice(0, 3);
  const activeSession = engSessions.find((s) => ACTIVE_STATUSES.has(s.status));
  const actions = QUICK_ACTIONS[employeeId] ?? [];

  return (
    <aside
      className="w-full md:w-80 shrink-0 cx-glass-border-l cx-glass-accent p-5 space-y-6"
    >
      {/* About */}
      <section>
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          About {meta.name}
        </div>
        <p className="cx-type-base text-[var(--color-text)] leading-relaxed">
          {meta.tagline}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span
            className="inline-flex items-center cx-type-xs uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
            style={{
              background: meta.colorSoft,
              color: meta.color,
            }}
          >
            {meta.role}
          </span>
          <span
            className={`inline-flex items-center cx-type-xs uppercase tracking-[0.15em] px-2 py-0.5 rounded-full hairline ${
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
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Recent context
        </div>
        {memory.length === 0 && engSessions.length === 0 ? (
          <p className="cx-type-xs" style={{ color: "var(--cx-text-muted)" }}>
            No memory notes yet. Tell Atlas about {meta.name.toLowerCase()}{" "}
            and he&apos;ll save what matters.
          </p>
        ) : (
          <ul className="space-y-2">
            {/* Engineering: surface recent build sessions before memory notes
                so a freshly-shipped build is the first thing the user sees. */}
            {engSessions.map((s) => (
              <li key={`s-${s.id}`}>
                <Link
                  href={`/app/builds?session=${s.id}`}
                  className="conduit-card px-3 py-2 cx-type-xs leading-snug block hover:border-[var(--color-accent)] transition-colors"
                >
                  <div className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1 inline-flex items-center gap-1.5">
                    <Hammer size={10} strokeWidth={1.75} /> build · {s.status} · {relativeTime(s.created_at)}
                  </div>
                  <p className="text-[var(--color-text)] line-clamp-2">
                    {s.prompt}
                  </p>
                </Link>
              </li>
            ))}
            {memory.map((m) => (
              <li
                key={m.id}
                className="conduit-card px-3 py-2 cx-type-xs leading-snug"
              >
                <div className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
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
          className="mt-2 inline-flex items-center gap-1 cx-type-xs uppercase tracking-[0.15em] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
        >
          See all memory <ArrowRight size={10} strokeWidth={1.75} />
        </Link>
      </section>

      {/* Quick actions */}
      {actions.length > 0 && (
        <section>
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            Quick actions
          </div>
          <div className="space-y-1.5">
            {/* Engineering: if a build is in flight, lead with a Resume link. */}
            {employeeId === "engineering" && activeSession && (
              <Link
                href={`/app/builds?session=${activeSession.id}`}
                style={{
                  ["--dept" as string]: meta.color,
                  ["--dept-soft" as string]: meta.colorSoft,
                }}
                className="conduit-suggestion px-3 py-2.5 cx-type-xs block leading-snug border-[var(--color-accent)]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Hammer size={11} strokeWidth={1.75} /> Resume last build · {activeSession.status}
                </span>
              </Link>
            )}
            {actions.map((a) => (
              <Link
                key={a}
                href={`/app?pin=${employeeId}&prompt=${encodeURIComponent(a)}`}
                style={{
                  ["--dept" as string]: meta.color,
                  ["--dept-soft" as string]: meta.colorSoft,
                }}
                className="conduit-suggestion px-3 py-2.5 cx-type-xs block leading-snug"
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
