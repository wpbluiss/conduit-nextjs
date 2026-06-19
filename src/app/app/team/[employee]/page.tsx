import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, FileText, Hammer, MessageSquare } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount } from "@/lib/conduit/account";
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
import { PraxisAvatar } from "@/components/conduit/praxis/PraxisAvatar";
import { PraxisRoomBinder } from "@/components/conduit/praxis/PraxisCanvasTintProvider";
import SalesWorkspace from "@/components/conduit/sales/SalesWorkspace";
import VoiceModeButton from "@/components/conduit/voice/VoiceModeButton";
import EmployeeRightRail from "@/components/conduit/EmployeeRightRail";
import EngineeringBuildButton from "@/components/conduit/engineering/EngineeringBuildButton";
import MarketingWorkspace from "@/components/conduit/workspaces/MarketingWorkspace";
import OpsWorkspace from "@/components/conduit/workspaces/OpsWorkspace";
import ComplianceWorkspace from "@/components/conduit/workspaces/ComplianceWorkspace";
import HRWorkspace from "@/components/conduit/workspaces/HRWorkspace";
import LegalWorkspace from "@/components/conduit/workspaces/LegalWorkspace";
import { getLastActiveForEmployee } from "@/lib/conduit/employee-activity";

const V2_EMPLOYEES = new Set<EmployeeId>([
  "marketing",
  "ops",
  "compliance",
  "hr",
  "legal",
]);

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

  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/team/" + employeeId);
  const { account } = current;
  const supabase = await createSupabaseServerClient();
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

  // Stats — run in parallel. Previously this Promise.all wrapper hid two
  // serial `await supabase.from("conduit_conversations").select("id")` calls
  // inside its arguments, so the conversations query fired twice in sequence
  // before the rest of the parallel block even started. Fetch the convo IDs
  // once up front, then fan out the dependent queries together.
  const accountConvoIdsQ = await supabase
    .from("conduit_conversations")
    .select("id")
    .eq("account_id", account.id);
  const accountConvoIds =
    (accountConvoIdsQ.data ?? []).map((c) => c.id as string);

  const [artifactsCountQ, conversationsQ, buildsCountQ, marketingRecentQ] =
    await Promise.all([
      supabase
        .from("conduit_artifacts")
        .select("id", { count: "exact", head: true })
        .eq("account_id", account.id)
        .eq("produced_by", employeeId)
        .gte("created_at", cycleStart.toISOString()),
      accountConvoIds.length
        ? supabase
            .from("conduit_messages")
            .select("conversation_id")
            .eq("role", "assistant")
            .eq("employee", employeeId)
            .gte("created_at", cycleStart.toISOString())
            .in("conversation_id", accountConvoIds)
        : Promise.resolve({ data: [] as { conversation_id: string }[] }),
      employeeId === "engineering"
        ? supabase
            .from("conduit_builds")
            .select("id", { count: "exact", head: true })
            .eq("account_id", account.id)
            .eq("status", "live")
            .gte("created_at", cycleStart.toISOString())
        : Promise.resolve({ count: 0 } as { count: number | null }),
      employeeId === "marketing"
        ? supabase
            .from("conduit_marketing_sessions")
            .select("id, prompt, status, created_at, output_urls")
            .eq("account_id", account.id)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);

  const artifactsCount = artifactsCountQ.count ?? 0;
  const buildsCount =
    employeeId === "engineering" ? (buildsCountQ.count ?? 0) : 0;
  const conversationIds = new Set(
    (conversationsQ.data ?? []).map((m) => m.conversation_id as string),
  );
  const conversationCount = conversationIds.size;
  // Polish 2026-05-07: merges conduit_messages + conduit_voice_sessions +
  // conduit_engineering_sessions so the stat reflects every signal that
  // should bump it, not just text chat.
  const lastActiveIso = await getLastActiveForEmployee(
    supabase,
    account.id,
    employeeId,
  );

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
    <div className="flex-1 flex min-h-0 overflow-hidden" data-dept={employeeId}>
      {/* PraxisRoomBinder pins canvas tint to this employee for the
          duration of the page. Cleared on unmount. */}
      <PraxisRoomBinder employee={employeeId} />
      <div className="flex-1 overflow-y-auto">
      {/* Header band — redesigned per S-002. Tint comes from the
          PraxisCanvasTintProvider (layout-level); local gradient
          removed so the room-level wash isn't competing. */}
      <div
        style={{
          paddingLeft: "var(--space-4)",
          paddingRight: "var(--space-4)",
          paddingTop: "var(--space-10)",
          paddingBottom: "var(--space-8)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="mx-auto"
          style={{
            maxWidth: "64rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "var(--space-6)",
          }}
        >
          <PraxisAvatar
            employee={employeeId}
            size="2xl"
            pulse="ambient"
            style={{ viewTransitionName: `vt-employee-${employeeId}` }}
          />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p className="praxis-eyebrow" style={{ color: "var(--dept)" }}>
              {employee.role}
            </p>
            <h1 className="praxis-display-1" style={{ marginTop: "var(--space-2)", color: "var(--dept)" }}>
              {employee.name}
            </h1>
            <p className="praxis-body-lg" style={{ marginTop: "var(--space-2)", maxWidth: "36rem" }}>
              {employee.tagline}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <VoiceModeButton
              employeeId={employeeId}
              employeeName={employee.name}
              employeeInitial={employee.initial}
              deptColor={dept}
            />
            {employeeId === "engineering" && (
              <EngineeringBuildButton
                internalAccount={Boolean(account.internal_account)}
                deptColor={dept}
              />
            )}
            <Link
              href={`/app?pin=${employeeId}`}
              className="btn-primary btn-sz-sm"
              style={{ background: dept, color: "var(--color-surface)" }}
            >
              Talk to {employee.name} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 md:px-8 py-8 space-y-10">
        {V2_EMPLOYEES.has(employeeId) ? (
          employeeId === "marketing" ? (
            <MarketingWorkspace
              recent={
                (marketingRecentQ.data ?? []) as unknown as Parameters<
                  typeof MarketingWorkspace
                >[0]["recent"]
              }
            />
          ) : employeeId === "ops" ? (
            <OpsWorkspace />
          ) : employeeId === "compliance" ? (
            <ComplianceWorkspace />
          ) : employeeId === "hr" ? (
            <HRWorkspace />
          ) : employeeId === "legal" ? (
            <LegalWorkspace />
          ) : null
        ) : (
          <>
            {/* Quick start */}
            <section>
              <div className="cx-label mb-3">
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
                    className="conduit-suggestion px-4 py-3 cx-type-base block"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </section>

            {/* Stats */}
            <section>
              <div className="cx-label mb-3">
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
          <div className="cx-label mb-3">
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
                className="mt-3 inline-flex items-center gap-1 cx-type-base"
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
                        <span className="block cx-label">
                          {a.type.replace("_", " ")} ·{" "}
                          <span className="tabular-nums">{relativeTime(a.created_at)}</span>
                        </span>
                        <span className="block cx-type-base text-[var(--color-text)] truncate">
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
                        <span className="block cx-label">
                          conversation · <span className="tabular-nums">{relativeTime(a.created_at)}</span>
                        </span>
                        <span className="block cx-type-base text-[var(--color-text)] truncate">
                          {a.title}
                        </span>
                        {a.snippet && (
                          <span className="block cx-type-xs text-[var(--color-text-muted)] truncate mt-0.5">
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
          </>
        )}
      </div>
      </div>
      <div className="hidden lg:block">
        <EmployeeRightRail
          supabase={supabase}
          accountId={account.id}
          employeeId={employeeId}
        />
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
      <div className="cx-label">
        {label}
      </div>
      <div className="cx-stat mt-1">{value}</div>
      {sub && (
        <div className="cx-type-xs text-[var(--color-text-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}
