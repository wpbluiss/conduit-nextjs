import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAccount, userDisplayName } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { EMPLOYEE_ORDER, isValidEmployee, type EmployeeId } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";
import {
  getTeamActivityBundle,
  pickPrimaryEvent,
} from "@/lib/conduit/team-activity";
import {
  activityBucket,
  composeWelcomeCopy,
  timeOfDayBucket,
} from "@/lib/conduit/welcome-copy";
import { PraxisWelcomeHero } from "@/components/conduit/praxis/PraxisWelcomeHero";
import { PraxisLiveStrip } from "@/components/conduit/praxis/PraxisLiveStrip";
import { PraxisCard } from "@/components/conduit/praxis/PraxisCard";
import { PraxisTeamRoster } from "@/components/conduit/praxis/PraxisTeamRoster";
import { EngineeringBuildStrip } from "@/components/conduit/builds/in-flight/EngineeringBuildStrip";
import { getInFlightBuilds } from "@/lib/engineering/in-flight";

export const dynamic = "force-dynamic";

export default async function WorkspaceDashboard() {
  const current = await getCurrentAccount();
  if (!current) redirect("/auth/sign-in?next=/app/workspace");
  const { account, user } = current;
  const supabase = await createSupabaseServerClient();
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const allowed = (
    internal
      ? (EMPLOYEE_ORDER as EmployeeKey[])
      : (tier.allowedEmployees as EmployeeKey[])
  ) as EmployeeKey[];
  const allowedSet = new Set<EmployeeId>(allowed as EmployeeId[]);
  const firstName = userDisplayName(user).split(" ")[0];

  // Server-render the initial activity bundle. Client roster takes
  // this as `initial` and polls /api/conduit/team-activity every 60s
  // to refresh.
  const [bundle, atlasMemoryQ, lastConvoQ, inFlightBuilds] = await Promise.all([
    getTeamActivityBundle(supabase, account.id),
    supabase
      .from("conduit_memory")
      .select("id, kind, content, tags, created_at")
      .eq("account_id", account.id)
      .eq("written_by", "jarvis")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("conduit_conversations")
      .select("id, title, updated_at, dominant_employee")
      .eq("account_id", account.id)
      .order("updated_at", { ascending: false })
      .limit(1),
    getInFlightBuilds(supabase, account.id),
  ]);

  const atlasMemory = atlasMemoryQ.data?.[0] ?? null;
  const lastConvoRaw = lastConvoQ.data?.[0] ?? null;
  const lastConversation = lastConvoRaw
    ? {
        id: lastConvoRaw.id as string,
        title: (lastConvoRaw.title as string | null) ?? null,
        updated_at: lastConvoRaw.updated_at as string,
        dominant_employee:
          (lastConvoRaw.dominant_employee as EmployeeId | null) ?? null,
      }
    : null;

  const primaryEvent = pickPrimaryEvent({
    bundle,
    atlasMemory: atlasMemory
      ? {
          content: atlasMemory.content as string,
          created_at: atlasMemory.created_at as string,
          primary_employee: "jarvis",
        }
      : null,
    lastConversation,
    sessionMountedAt: Date.now(),
  });

  // Most-engaged dept in last 7 days — pick the one with the
  // freshest last_active_at among non-Atlas employees.
  let mostEngaged: EmployeeId | null = null;
  let mostEngagedTs = 0;
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  for (const e of EMPLOYEE_ORDER) {
    if (e === "jarvis") continue;
    const iso = bundle.employees[e].last_active_at;
    if (!iso) continue;
    const ts = new Date(iso).getTime();
    if (ts > mostEngagedTs && ts >= sevenDaysAgo) {
      mostEngagedTs = ts;
      mostEngaged = e;
    }
  }

  const copy = composeWelcomeCopy({
    firstName,
    hoursSinceLastVisit: null,
    timeOfDay: timeOfDayBucket(),
    primaryEvent: primaryEvent.kind === "none" ? null : primaryEvent,
  });

  // Activity bucket — count signals in last hour for breath cadence.
  const oneHourAgo = Date.now() - 3600_000;
  let signalCount = 0;
  for (const e of EMPLOYEE_ORDER) {
    const last = bundle.employees[e].last_active_at;
    if (last && new Date(last).getTime() >= oneHourAgo) signalCount++;
  }
  const bucket = activityBucket(signalCount);

  // KPI tile data.
  const pipelineCount = bundle.employees.sales.top_lead_score !== null
    ? bundle.employees.sales.top_lead_name
    : null;
  const topLeadScore = bundle.employees.sales.top_lead_score;
  const topLeadName = bundle.employees.sales.top_lead_name;

  // Voice today: sum durations from today's voice sessions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: voiceTodayRows } = await supabase
    .from("conduit_voice_sessions")
    .select("duration_seconds")
    .eq("account_id", account.id)
    .gte("started_at", todayStart.toISOString())
    .not("duration_seconds", "is", null);
  const voiceSecondsToday = (voiceTodayRows ?? []).reduce(
    (sum, s) => sum + ((s.duration_seconds as number | null) ?? 0),
    0,
  );
  const voiceMinutesToday = Math.floor(voiceSecondsToday / 60);

  // Voice cap (from existing tier config).
  const { readVoiceCeilings } = await import("@/lib/voice/config");
  const ceilings = await readVoiceCeilings(supabase);
  const voiceCapMinutes = ceilings.dailyMinutes;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
      <div
        className="mx-auto"
        style={{
          maxWidth: "72rem",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-10)",
        }}
      >

        {/* Live-strip — only when voice session active */}
        {bundle.voice_live && (
          <PraxisLiveStrip
            employee={
              lastConversation?.dominant_employee &&
              isValidEmployee(lastConversation.dominant_employee)
                ? lastConversation.dominant_employee
                : undefined
            }
            rejoinHref="/app/voice"
          />
        )}

        {/* Engineering build in-flight strip — only when ≥1 active build */}
        <EngineeringBuildStrip
          initial={inFlightBuilds}
          accountId={account.id}
          internalAccount={internal}
        />

        {/* Welcome hero */}
        <PraxisWelcomeHero copy={copy} activityBucket={bucket} />

        {/* KPI tiles — operational row */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gap: "var(--space-3)" }}
          data-cluster="kpi"
        >
          {/* Atlas pinged you */}
          <PraxisCard
            variant="kpi"
            dept="jarvis"
            href="/app/team/jarvis"
            ariaLabel="Atlas pinged you"
          >
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              ATLAS PINGED YOU
            </p>
            {atlasMemory ? (
              <p
                className="praxis-body-sm"
                style={{
                  color: "var(--color-text)",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {atlasMemory.content as string}
              </p>
            ) : (
              <p className="praxis-body-sm" style={{ color: "var(--color-text-muted)" }}>
                Tell Atlas about your business — he&apos;ll start tracking what matters.
              </p>
            )}
          </PraxisCard>

          {/* Pipeline */}
          <PraxisCard
            variant="kpi"
            dept="sales"
            href="/app/team/sales"
            ariaLabel="Sales pipeline"
          >
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              PIPELINE
            </p>
            <p className="praxis-numeric-display">
              {topLeadScore !== null ? topLeadScore : "—"}
            </p>
            <p
              className="praxis-microlabel"
              style={{
                marginTop: "var(--space-2)",
                textTransform: "none",
                letterSpacing: 0,
                fontSize: "var(--cx-type-xs)",
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {topLeadName ? `Top: ${topLeadName}` : pipelineCount ? "" : "No active leads"}
            </p>
          </PraxisCard>

          {/* Last conversation */}
          <PraxisCard
            variant="kpi"
            dept={lastConversation?.dominant_employee ?? undefined}
            href={lastConversation ? `/app?c=${lastConversation.id}` : "/app"}
            ariaLabel="Last conversation"
          >
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              LAST CONVERSATION
            </p>
            {lastConversation ? (
              <>
                <p
                  className="praxis-body-sm"
                  style={{
                    color: "var(--color-text)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {lastConversation.title ?? "Untitled chat"}
                </p>
                <p className="praxis-microlabel" style={{ marginTop: "var(--space-2)" }}>
                  Continue →
                </p>
              </>
            ) : (
              <p className="praxis-body-sm" style={{ color: "var(--color-text-muted)" }}>
                Talk to Atlas — he&apos;ll route the request.
              </p>
            )}
          </PraxisCard>

          {/* Voice minutes today */}
          <PraxisCard
            variant="kpi"
            href="/app/voice"
            ariaLabel="Voice minutes today"
          >
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-3)" }}>
              VOICE TODAY
            </p>
            <p className="praxis-numeric-display">
              {voiceMinutesToday}
              <span style={{ fontSize: "var(--cx-type-md)", color: "var(--color-text-muted)" }}>
                {" "}/ {voiceCapMinutes}
              </span>
            </p>
            <div
              style={{
                marginTop: "var(--space-2)",
                height: "4px",
                borderRadius: "9999px",
                background: "var(--color-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "9999px",
                  background: "var(--color-accent)",
                  width: `${Math.min(
                    100,
                    Math.round((voiceMinutesToday / Math.max(1, voiceCapMinutes)) * 100),
                  )}%`,
                  transition: "width 220ms var(--praxis-ease-out-quart)",
                }}
              />
            </div>
          </PraxisCard>
        </div>

        {/* Team roster */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "var(--space-4)",
            }}
          >
            <h2 className="praxis-eyebrow">Your team</h2>
            <span className="praxis-microlabel" style={{ textTransform: "none", letterSpacing: 0 }}>
              {allowed.length} active
            </span>
          </div>
          <PraxisTeamRoster
            initial={bundle}
            allowedEmployees={allowedSet}
            mostEngagedDept={mostEngaged}
          />
        </div>

      </div>
    </div>
  );
}
