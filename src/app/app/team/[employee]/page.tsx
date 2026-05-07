import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, FileText, Hammer, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import {
  EMPLOYEES,
  type EmployeeId,
  isValidEmployee,
} from "@/lib/conduit/employees";
import {
  WORKSPACE_PROMPTS,
  emptyStateCopy,
} from "@/lib/conduit/workspace-prompts";
import { tierById } from "@/lib/billing/tiers";
import { EmployeeAvatar } from "@/components/conduit/EmployeeBadge";
import SalesWorkspace from "@/components/conduit/sales/SalesWorkspace";
import VoiceModeButton from "@/components/conduit/voice/VoiceModeButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ employee: string }>;
}

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

export default async function WorkspacePage({ params }: PageProps) {
  const { employee: employeeParam } = await params;
  if (!isValidEmployee(employeeParam)) notFound();
  const employeeId = employeeParam as EmployeeId;
  const employee = EMPLOYEES[employeeId];

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/team/" + employeeId);

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const allowed =
    Boolean(account.internal_account) ||
    tier.allowedEmployees.includes(employeeId);
  if (!allowed) {
    redirect(
      `/app/settings?reason=workspace_locked&employee=${employeeId}`,
    );
  }

  // R11: Sales gets its own leads-driven workspace.
  if (employeeId === "sales") {
    return <SalesWorkspace supabase={supabase} account={account} />;
  }

  const cycleStart = new Date(account.billing_cycle_start);

  // Stats — run in parallel.
  const [artifactsCountQ, lastMessageQ, conversationsQ, buildsCountQ] =
    await Promise.all([
      supabase
        .from("conduit_artifacts")
        .select("id", { count: "exact", head: true })
        .eq("account_id", account.id)
        .eq("produced_by", employeeId)
        .gte("created_at", cycleStart.toISOString()),
      supabase
        .from("conduit_messages")
        .select("created_at, conversation_id")
        .eq("role", "assistant")
        .eq("employee", employeeId)
        .in(
          "conversation_id",
          (
            await supabase
              .from("conduit_conversations")
              .select("id")
              .eq("account_id", account.id)
          ).data?.map((c) => c.id) ?? [],
        )
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("conduit_messages")
        .select("conversation_id")
        .eq("role", "assistant")
        .eq("employee", employeeId)
        .gte("created_at", cycleStart.toISOString())
        .in(
          "conversation_id",
          (
            await supabase
              .from("conduit_conversations")
              .select("id")
              .eq("account_id", account.id)
          ).data?.map((c) => c.id) ?? [],
        ),
      employeeId === "engineering"
        ? supabase
            .from("conduit_builds")
            .select("id", { count: "exact", head: true })
            .eq("account_id", account.id)
            .eq("status", "live")
            .gte("created_at", cycleStart.toISOString())
        : Promise.resolve({ count: 0 } as { count: number | null }),
    ]);

  const artifactsCount = artifactsCountQ.count ?? 0;
  const buildsCount =
    employeeId === "engineering" ? (buildsCountQ.count ?? 0) : 0;
  const conversationIds = new Set(
    (conversationsQ.data ?? []).map((m) => m.conversation_id as string),
  );
  const conversationCount = conversationIds.size;
  const lastActiveIso =
    (lastMessageQ.data?.[0]?.created_at as string | undefined) ?? null;

  // Recent activity — last 10 of (artifacts produced + conversations responded in).
  const [recentArtifacts, recentConvos] = await Promise.all([
    supabase
      .from("conduit_artifacts")
      .select("id, type, title, created_at, conversation_id")
      .eq("account_id", account.id)
      .eq("produced_by", employeeId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("conduit_messages")
      .select("conversation_id, created_at, content")
      .eq("role", "assistant")
      .eq("employee", employeeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Map convo_id → first-seen message time + snippet
  const convoMap = new Map<
    string,
    { conversation_id: string; created_at: string; content: string }
  >();
  for (const m of recentConvos.data ?? []) {
    const cid = m.conversation_id as string | null;
    if (!cid) continue;
    if (!convoMap.has(cid)) {
      convoMap.set(cid, {
        conversation_id: cid,
        created_at: m.created_at as string,
        content: ((m.content as string) ?? "").slice(0, 160),
      });
    }
  }
  // Pull conversation titles for the convos in scope
  const convoIds = [...convoMap.keys()].slice(0, 10);
  const convoTitlesQ = convoIds.length
    ? await supabase
        .from("conduit_conversations")
        .select("id, title")
        .in("id", convoIds)
    : { data: [] };
  const titleMap = new Map<string, string>();
  for (const c of convoTitlesQ.data ?? [])
    titleMap.set(c.id as string, (c.title as string) ?? "Untitled");

  type ActivityRow =
    | {
        kind: "artifact";
        id: string;
        title: string;
        type: string;
        created_at: string;
        conversation_id: string | null;
      }
    | {
        kind: "conversation";
        id: string;
        title: string;
        snippet: string;
        created_at: string;
      };

  const activity: ActivityRow[] = [
    ...(recentArtifacts.data ?? []).map((a) => ({
      kind: "artifact" as const,
      id: a.id as string,
      title: (a.title as string) ?? "Untitled artifact",
      type: a.type as string,
      created_at: a.created_at as string,
      conversation_id: (a.conversation_id as string | null) ?? null,
    })),
    ...convoIds.map((cid) => {
      const m = convoMap.get(cid)!;
      return {
        kind: "conversation" as const,
        id: cid,
        title: titleMap.get(cid) ?? "Untitled chat",
        snippet: m.content,
        created_at: m.created_at,
      };
    }),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const empty = activity.length === 0;
  const emptyState = emptyStateCopy(employeeId, employee.canExecute);
  const prompts = WORKSPACE_PROMPTS[employeeId];
  const dept = employee.color;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header band */}
      <div
        className="px-4 md:px-8 py-8 md:py-10 border-b border-[var(--color-border)]"
        style={{
          background: `linear-gradient(135deg, ${employee.colorSoft}, transparent 60%)`,
        }}
      >
        <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-4 md:gap-6">
          <EmployeeAvatar employee={employeeId} size={56} />
          <div className="min-w-0 flex-1">
            <div
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: dept }}
            >
              {employee.role}
            </div>
            <h1
              className="serif text-3xl md:text-4xl mt-1"
              style={{ color: dept }}
            >
              {employee.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-xl">
              {employee.tagline}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <VoiceModeButton
              employeeId={employeeId}
              employeeName={employee.name}
              employeeInitial={employee.initial}
              deptColor={dept}
            />
            <Link
              href={`/app?pin=${employeeId}`}
              className="btn-primary !text-sm"
              style={{ background: dept, color: "#0A0908" }}
            >
              Talk to {employee.name} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 py-8 space-y-10">
        {/* Quick start */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
            Quick start
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prompts.map((p) => (
              <Link
                key={p}
                href={`/app?pin=${employeeId}&prompt=${encodeURIComponent(p)}`}
                style={{
                  ["--dept" as string]: dept,
                  ["--dept-soft" as string]: employee.colorSoft,
                }}
                className="conduit-suggestion px-4 py-3 text-sm block"
              >
                {p}
              </Link>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
            This cycle
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {employeeId === "engineering" ? (
              <Stat label="Builds shipped" value={String(buildsCount)} />
            ) : employee.canExecute ? (
              <Stat
                label="Artifacts produced"
                value={String(artifactsCount)}
              />
            ) : (
              <Stat label="Activity" value="Conversational" sub="No autonomous execution yet" />
            )}
            <Stat label="Conversations" value={String(conversationCount)} />
            <Stat label="Last active" value={relativeTime(lastActiveIso)} />
          </div>
        </section>

        {/* Recent activity / empty */}
        <section>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3">
            Recent activity
          </div>
          {empty ? (
            <div
              className="conduit-card p-6"
              style={{
                boxShadow: `inset 0 0 0 1px ${employee.colorSoft}`,
                background: `linear-gradient(180deg, ${employee.colorSoft}, transparent 80%)`,
              }}
            >
              <p className="text-[var(--color-text)]">
                {emptyState.headline}
              </p>
              <Link
                href={`/app?pin=${employeeId}`}
                className="mt-3 inline-flex items-center gap-1 text-sm"
                style={{ color: dept }}
              >
                {emptyState.cta}
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) =>
                a.kind === "artifact" ? (
                  <li key={`a-${a.id}`}>
                    <Link
                      href={
                        a.conversation_id
                          ? `/app?c=${a.conversation_id}`
                          : "/app/artifacts"
                      }
                      className="conduit-card border-l-[3px] px-4 py-3 flex items-start gap-3 hover:border-[var(--color-accent)] transition-colors"
                      style={{ borderLeftColor: dept }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                        style={{ background: employee.colorSoft }}
                      >
                        {a.type === "build" ? (
                          <Hammer size={14} style={{ color: dept }} />
                        ) : (
                          <FileText size={14} style={{ color: dept }} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          {a.type.replace("_", " ")} ·{" "}
                          {relativeTime(a.created_at)}
                        </span>
                        <span className="block text-sm text-[var(--color-text)] truncate">
                          {a.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li key={`c-${a.id}`}>
                    <Link
                      href={`/app?c=${a.id}`}
                      className="conduit-card border-l-[3px] px-4 py-3 flex items-start gap-3 hover:border-[var(--color-accent)] transition-colors"
                      style={{ borderLeftColor: dept }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                        style={{ background: employee.colorSoft }}
                      >
                        <MessageSquare size={14} style={{ color: dept }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          conversation · {relativeTime(a.created_at)}
                        </span>
                        <span className="block text-sm text-[var(--color-text)] truncate">
                          {a.title}
                        </span>
                        {a.snippet && (
                          <span className="block text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                            {a.snippet}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="conduit-card px-4 py-3">
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="serif text-2xl mt-1">{value}</div>
      {sub && (
        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
