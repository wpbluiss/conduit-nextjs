import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
import { ALL_EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import { getLastActiveByEmployee } from "@/lib/conduit/employee-activity";
import { DEPT_COLOR, DEPT_COLOR_SOFT, employeeLabel } from "@/components/conduit/EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";
import { PraxisAvatar } from "@/components/conduit/praxis/PraxisAvatar";

export const dynamic = "force-dynamic";

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function TeamDashboardPage() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/team");
  const { account } = current;
  const supabase = await createSupabaseServerClient();

  // Fetch last-active timestamps across messages + voice + engineering.
  const lastActiveMap = await getLastActiveByEmployee(supabase, account.id);

  // Fetch the most recent assistant message per employee for the snippet +
  // conversation link. One query ordered by recency; we pick the first hit
  // per employee in-memory (avoids 9 separate queries).
  const { data: convoRows } = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id);

  const convoIds = (convoRows ?? []).map((c) => c.id as string);

  type MsgRow = { employee: string | null; content: string; conversation_id: string | null; created_at: string };
  let recentByEmp: Record<string, { snippet: string; convoId: string }> = {};
  if (convoIds.length > 0) {
    const { data: msgs } = await supabase
      .from("conduit_messages")
      .select("employee, content, conversation_id, created_at")
      .eq("role", "assistant")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false })
      .limit(200);

    for (const m of (msgs ?? []) as MsgRow[]) {
      if (!m.employee || !m.conversation_id) continue;
      if (recentByEmp[m.employee]) continue;
      const snippet = m.content.slice(0, 120).replace(/\n/g, " ").trim();
      recentByEmp[m.employee] = { snippet, convoId: m.conversation_id };
    }
  }

  const hasAnyActivity = Object.keys(lastActiveMap).length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <div className="mb-8">
          <p
            className="text-[11px] uppercase tracking-[0.18em] mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Praxis · Your team
          </p>
          <h1
            className="text-2xl font-semibold leading-tight"
            style={{ color: "var(--color-text)" }}
          >
            {hasAnyActivity ? "Your specialists" : "Meet your team"}
          </h1>
          {!hasAnyActivity && (
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Start a task to put your team to work.{" "}
              <Link
                href="/app"
                className="underline underline-offset-2 hover:opacity-80"
                style={{ color: "var(--color-accent)" }}
              >
                Open chat →
              </Link>
            </p>
          )}
        </div>

        {/* Specialist grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_EMPLOYEES.map((emp) => {
            const empKey = emp.id as EmployeeKey;
            const lastActive = lastActiveMap[emp.id] ?? null;
            const recent = recentByEmp[emp.id] ?? null;
            const deptColor = DEPT_COLOR[empKey];
            const deptColorSoft = DEPT_COLOR_SOFT[empKey];
            const workspaceHref = `/app/team/${emp.id}`;
            const convoHref = recent?.convoId
              ? `/app?c=${recent.convoId}`
              : workspaceHref;

            return (
              <Link
                key={emp.id}
                href={convoHref}
                className="conduit-card flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={
                  {
                    "--dept": deptColor,
                    textDecoration: "none",
                  } as React.CSSProperties
                }
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PraxisAvatar
                      employee={emp.id as EmployeeId}
                      size="md"
                      pulse={lastActive ? "ambient" : undefined}
                    />
                    <div>
                      <p
                        className="text-[14px] font-semibold leading-tight"
                        style={{ color: "var(--color-text)" }}
                      >
                        {emp.name}
                      </p>
                      <p
                        className="text-[11px] uppercase tracking-[0.1em] mt-0.5"
                        style={{ color: deptColor }}
                      >
                        {emp.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full"
                    style={{
                      background: lastActive ? deptColorSoft : "var(--color-surface-elevated)",
                      color: lastActive ? deptColor : "var(--color-text-muted)",
                    }}
                  >
                    {lastActive ? "active" : "idle"}
                  </span>
                </div>

                {/* Recent output snippet */}
                {recent ? (
                  <p
                    className="text-[13px] leading-relaxed line-clamp-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {recent.snippet}
                    {recent.snippet.length >= 120 ? "…" : ""}
                  </p>
                ) : (
                  <p
                    className="text-[13px] leading-relaxed italic"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {emp.tagline}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--color-border)]">
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {lastActive
                      ? `Last active ${relativeTime(lastActive)}`
                      : "Not yet activated"}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: deptColor }}
                  >
                    {recent ? (
                      <>
                        <MessageSquare size={11} />
                        Open
                      </>
                    ) : (
                      <>
                        Start
                        <ArrowRight size={11} />
                      </>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Team link */}
        <p className="mt-8 text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
          Each specialist has a dedicated workspace —{" "}
          <Link
            href="/app/team/jarvis"
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: "var(--color-text-muted)" }}
          >
            open Atlas
          </Link>{" "}
          to route any task.
        </p>
      </div>
    </div>
  );
}
