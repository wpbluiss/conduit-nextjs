import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Brain,
  ListTodo,
  MessageSquare,
  Mic2,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount, userDisplayName } from "@/lib/conduit/account";
import {
  EMPLOYEE_ORDER,
  EMPLOYEES,
  type EmployeeId,
} from "@/lib/conduit/employees";
import { tierById } from "@/lib/billing/tiers";
import { readVoiceCeilings } from "@/lib/voice/config";
import { EmployeeAvatar } from "@/components/conduit/EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

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
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function WorkspaceDashboard() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/workspace");

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const allowed = (
    internal
      ? (EMPLOYEE_ORDER as EmployeeKey[])
      : (tier.allowedEmployees as EmployeeKey[])
  ) as EmployeeKey[];

  const firstName = userDisplayName(user).split(" ")[0];

  // 4 dashboard tiles — fetch in parallel.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    atlasMemoryQ,
    leadsQ,
    topLeadQ,
    lastConvoQ,
    voiceTodayQ,
    ceilings,
  ] = await Promise.all([
    supabase
      .from("conduit_memory")
      .select("id, kind, content, tags, created_at")
      .eq("account_id", account.id)
      .eq("written_by", "jarvis")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("sales_leads")
      .select("id", { count: "exact", head: true })
      .eq("account_id", account.id)
      .in("status", ["new", "qualified", "contacted"]),
    supabase
      .from("sales_leads")
      .select("id, business_name, score, status")
      .eq("account_id", account.id)
      .in("status", ["new", "qualified", "contacted"])
      .order("score", { ascending: false })
      .limit(1),
    supabase
      .from("conduit_conversations")
      .select(
        "id, title, updated_at, dominant_employee",
      )
      .eq("account_id", account.id)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("conduit_voice_sessions")
      .select("duration_seconds")
      .eq("account_id", account.id)
      .gte("started_at", todayStart.toISOString())
      .not("duration_seconds", "is", null),
    readVoiceCeilings(supabase),
  ]);

  const atlasMemory =
    (atlasMemoryQ.data?.[0] as
      | {
          id: string;
          kind: string;
          content: string;
          tags: string[] | null;
          created_at: string;
        }
      | undefined) ?? null;

  const pipelineCount = leadsQ.count ?? 0;
  const topLead = topLeadQ.data?.[0] as
    | { id: string; business_name: string; score: number; status: string }
    | undefined;

  const lastConvo = lastConvoQ.data?.[0] as
    | {
        id: string;
        title: string | null;
        updated_at: string;
        dominant_employee: string | null;
      }
    | undefined;

  const voiceSecondsToday = (voiceTodayQ.data ?? []).reduce(
    (sum, s) => sum + ((s.duration_seconds as number | null) ?? 0),
    0,
  );
  const voiceMinutesToday = Math.floor(voiceSecondsToday / 60);
  const voiceCapMinutes = ceilings.dailyMinutes;

  // Last activity per employee for the team grid status dots.
  const { data: lastByEmpRows } = await supabase
    .from("conduit_messages")
    .select("employee, created_at, conversation_id")
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(150);
  const accountConvosQ = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id);
  const accountConvoIds = new Set(
    (accountConvosQ.data ?? []).map((c) => c.id as string),
  );
  const lastByEmp: Record<string, string> = {};
  for (const r of lastByEmpRows ?? []) {
    const e = r.employee as string | null;
    const cid = r.conversation_id as string | null;
    if (!e || !cid || !accountConvoIds.has(cid)) continue;
    if (!lastByEmp[e]) lastByEmp[e] = r.created_at as string;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] flex items-center gap-2">
            <span className="live-dot" aria-hidden /> Praxis Console · {tier.name}
            {internal && " · Internal"}
          </p>
          <h1 className="serif text-4xl md:text-5xl mt-2">
            Welcome back, {firstName}.
          </h1>
        </div>

        {/* 4-tile dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {/* Atlas pinged you */}
          <Link
            href="/app/team/jarvis"
            className="conduit-card border-l-[3px] p-5 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2 min-h-[140px]"
            style={{ borderLeftColor: EMPLOYEES.jarvis.color }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                <Brain size={11} /> Atlas pinged you
              </span>
              <EmployeeAvatar employee="jarvis" size={20} />
            </div>
            {atlasMemory ? (
              <>
                <p className="text-[13px] text-[var(--color-text)] leading-snug line-clamp-3 flex-1">
                  {atlasMemory.content}
                </p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-1">
                  {atlasMemory.kind} · {relativeTime(atlasMemory.created_at)}
                </span>
              </>
            ) : (
              <p className="text-[13px] text-[var(--color-text-muted)] leading-snug flex-1">
                Atlas hasn&apos;t saved any context yet. Tell him about your
                business and he&apos;ll start tracking.
              </p>
            )}
          </Link>

          {/* Pipeline */}
          <Link
            href="/app/team/sales"
            className="conduit-card border-l-[3px] p-5 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2 min-h-[140px]"
            style={{ borderLeftColor: EMPLOYEES.sales.color }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                <ListTodo size={11} /> Pipeline
              </span>
              <EmployeeAvatar employee="sales" size={20} />
            </div>
            <div className="serif text-3xl text-[var(--color-text)]">
              {pipelineCount.toLocaleString()}
            </div>
            <span className="text-[12px] text-[var(--color-text-muted)] truncate">
              {topLead
                ? `Top: ${topLead.business_name}`
                : "No active leads. Run discovery in Sales."}
            </span>
          </Link>

          {/* Last conversation */}
          <Link
            href={lastConvo ? `/app?c=${lastConvo.id}` : "/app"}
            className="conduit-card border-l-[3px] p-5 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2 min-h-[140px]"
            style={{
              borderLeftColor: lastConvo
                ? EMPLOYEES[
                    (EMPLOYEE_ORDER as string[]).includes(
                      lastConvo.dominant_employee ?? "",
                    )
                      ? (lastConvo.dominant_employee as EmployeeId)
                      : "jarvis"
                  ].color
                : "var(--color-border)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                <MessageSquare size={11} /> Last conversation
              </span>
            </div>
            {lastConvo ? (
              <>
                <p className="text-[13px] text-[var(--color-text)] leading-snug line-clamp-2 flex-1">
                  {lastConvo.title || "Untitled chat"}
                </p>
                <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] inline-flex items-center gap-1">
                  Continue <ArrowRight size={10} /> ·{" "}
                  {relativeTime(lastConvo.updated_at)}
                </span>
              </>
            ) : (
              <p className="text-[13px] text-[var(--color-text-muted)] leading-snug flex-1">
                No conversations yet. Talk to Atlas — he&apos;ll route the
                request to the right employee.
              </p>
            )}
          </Link>

          {/* Voice minutes today */}
          <Link
            href="/app/voice"
            className="conduit-card border-l-[3px] p-5 hover:border-[var(--color-accent)] transition-colors flex flex-col gap-2 min-h-[140px]"
            style={{ borderLeftColor: "var(--color-accent)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
                <Mic2 size={11} /> Voice minutes today
              </span>
            </div>
            <div className="serif text-3xl text-[var(--color-text)]">
              {voiceMinutesToday}
              <span className="text-base text-[var(--color-text-muted)]">
                {" "}
                / {voiceCapMinutes}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-[var(--color-accent)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (voiceMinutesToday / Math.max(1, voiceCapMinutes)) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">
              Resets at midnight
            </span>
          </Link>
        </div>

        {/* Team grid */}
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Your team
          </h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {allowed.length} active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {(EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => {
            const isAllowed = allowed.includes(emp);
            const meta = EMPLOYEES[emp];
            const lastIso = lastByEmp[emp];
            return (
              <Link
                key={emp}
                href={
                  isAllowed
                    ? `/app/team/${emp}`
                    : "/app/settings/billing"
                }
                className={`conduit-card border-l-[3px] p-4 transition-colors flex flex-col gap-2 ${
                  isAllowed
                    ? "hover:border-[var(--color-accent)]"
                    : "opacity-60"
                }`}
                style={{ borderLeftColor: meta.color }}
                title={
                  isAllowed
                    ? meta.tagline
                    : `${meta.name} unlocks on a higher plan.`
                }
              >
                <div className="flex items-center justify-between">
                  <EmployeeAvatar employee={emp} size={24} />
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: isAllowed ? meta.color : "var(--color-text-muted)",
                      opacity: isAllowed ? 0.85 : 0.4,
                    }}
                    aria-label={isAllowed ? "Online" : "Locked"}
                  />
                </div>
                <div>
                  <div
                    className="text-[13px] font-medium"
                    style={{ color: meta.color }}
                  >
                    {meta.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] truncate">
                    {meta.role}
                  </div>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-auto">
                  {isAllowed
                    ? lastIso
                      ? `Active ${relativeTime(lastIso)}`
                      : "Online"
                    : "Locked"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
