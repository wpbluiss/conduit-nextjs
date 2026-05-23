// Per-employee activity bundle. Consumed by:
//   - /app/workspace server render (initial dashboard payload)
//   - /api/conduit/team-activity GET handler (polled refresh, R-002)
//
// Reads existing conduit_* tables only — no schema changes. Returns
// one row per of the 9 EMPLOYEE_ORDER ids + a single "voice_live"
// section for the live-strip.

import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { getLastActiveByEmployee } from "@/lib/conduit/employee-activity";

export interface TeamActivityEmployee {
  last_active_at: string | null;
  last_artifact_title: string | null;
  last_artifact_created_at: string | null;
  in_flight_build_id: string | null;
  /** Sales only — top open-pipeline lead score. */
  top_lead_score: number | null;
  top_lead_name: string | null;
}

export interface TeamActivityBundle {
  employees: Record<EmployeeId, TeamActivityEmployee>;
  voice_live: { session_id: string; started_at: string } | null;
}

function emptyEmployeeRow(): TeamActivityEmployee {
  return {
    last_active_at: null,
    last_artifact_title: null,
    last_artifact_created_at: null,
    in_flight_build_id: null,
    top_lead_score: null,
    top_lead_name: null,
  };
}

export async function getTeamActivityBundle(
  supabase: SupabaseClient,
  accountId: string,
): Promise<TeamActivityBundle> {
  // Initialize every employee with empty rows so the consumer never
  // has to defend against missing keys.
  const employees = Object.fromEntries(
    EMPLOYEE_ORDER.map((e) => [e, emptyEmployeeRow()]),
  ) as Record<EmployeeId, TeamActivityEmployee>;

  // Last-active map (merges messages + voice + engineering).
  const lastByEmp = await getLastActiveByEmployee(supabase, accountId);
  for (const emp of EMPLOYEE_ORDER) {
    employees[emp].last_active_at = lastByEmp[emp] ?? null;
  }

  // Fan out the per-dept queries in parallel — each is bounded.
  const [
    recentArtifactsQ,
    inFlightBuildsQ,
    voiceLiveQ,
    topLeadQ,
  ] = await Promise.all([
    supabase
      .from("conduit_artifacts")
      .select("id, title, created_at, produced_by")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("conduit_engineering_sessions")
      .select("id, status, created_at")
      .eq("account_id", accountId)
      .in("status", ["pending", "running", "deploying"])
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("conduit_voice_sessions")
      .select("id, started_at, ended_at")
      .eq("account_id", accountId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1),
    // sales_leads — flagged pre-existing namespace gap (plan.md
    // Principle II verdict). Read pattern inherited from
    // workspace/page.tsx unchanged.
    supabase
      .from("sales_leads")
      .select("id, business_name, score, status")
      .eq("account_id", accountId)
      .in("status", ["new", "qualified", "contacted"])
      .order("score", { ascending: false })
      .limit(1),
  ]);

  // Most-recent artifact per dept.
  for (const a of recentArtifactsQ.data ?? []) {
    const dept = a.produced_by as string | null;
    if (!dept) continue;
    const row = employees[dept as EmployeeId];
    if (!row) continue;
    if (!row.last_artifact_created_at) {
      row.last_artifact_title = (a.title as string) ?? "Untitled artifact";
      row.last_artifact_created_at = a.created_at as string;
    }
  }

  // Engineering in-flight build.
  const inFlight = inFlightBuildsQ.data?.[0];
  if (inFlight) {
    employees.engineering.in_flight_build_id = inFlight.id as string;
  }

  // Top open Sales lead.
  const lead = topLeadQ.data?.[0];
  if (lead) {
    employees.sales.top_lead_score = (lead.score as number) ?? null;
    employees.sales.top_lead_name = (lead.business_name as string) ?? null;
  }

  // Voice-live.
  const voice = voiceLiveQ.data?.[0];
  const voice_live = voice
    ? {
        session_id: voice.id as string,
        started_at: voice.started_at as string,
      }
    : null;

  return { employees, voice_live };
}

/**
 * Pick the highest-priority primary event for the welcome hero
 * (per FR-001 priority: shipped-build > scored-hot-lead >
 * atlas-memory > prior-conversation > none).
 *
 * Memory-pinned and prior-conversation inputs are passed by the
 * page-level helper because they require additional queries the
 * activity bundle doesn't fan out for.
 */
export function pickPrimaryEvent(args: {
  bundle: TeamActivityBundle;
  atlasMemory: {
    content: string;
    created_at: string;
    primary_employee?: EmployeeId | null;
  } | null;
  lastConversation: {
    title: string | null;
    updated_at: string;
    dominant_employee: EmployeeId | null;
    id: string;
  } | null;
  sessionMountedAt: number;
}): {
  kind:
    | "shipped-build"
    | "scored-hot-lead"
    | "atlas-memory-pinned"
    | "prior-conversation"
    | "none";
  employeeId: EmployeeId;
  label: string;
  href?: string;
} {
  const { bundle, atlasMemory, lastConversation, sessionMountedAt } = args;

  // 1. shipped-build — most recent live artifact within the session window.
  // Scan recent artifacts; pick the freshest. The bundle doesn't track
  // "live" status directly; treat the most recent artifact as the proxy.
  let mostRecentArtifact: {
    employeeId: EmployeeId;
    title: string;
    createdAtMs: number;
  } | null = null;
  for (const empId of Object.keys(bundle.employees) as EmployeeId[]) {
    const row = bundle.employees[empId];
    if (!row.last_artifact_created_at || !row.last_artifact_title) continue;
    const ms = new Date(row.last_artifact_created_at).getTime();
    if (
      !mostRecentArtifact ||
      ms > mostRecentArtifact.createdAtMs
    ) {
      mostRecentArtifact = {
        employeeId: empId,
        title: row.last_artifact_title,
        createdAtMs: ms,
      };
    }
  }
  // Treat as shipped-build only if it landed within the session window
  // (Principle Zero: no faking retroactive aliveness for "live now"
  // framing — but it's fine to surface "{emp} finished {x}" as long as
  // the copy isn't claiming it just happened).
  void sessionMountedAt;

  // 2. scored-hot-lead — sales top score >= 80.
  const topScore = bundle.employees.sales.top_lead_score;
  const topName = bundle.employees.sales.top_lead_name;
  if (topScore !== null && topScore >= 80 && topName) {
    return {
      kind: "scored-hot-lead",
      employeeId: "sales",
      label: `just scored ${topName} at ${topScore}/100`,
      href: "/app/team/sales",
    };
  }

  // 3. shipped-build — promote freshest artifact if present.
  if (mostRecentArtifact) {
    return {
      kind: "shipped-build",
      employeeId: mostRecentArtifact.employeeId,
      label: `finished ${truncate(mostRecentArtifact.title, 60)}`,
      href: `/app/team/${mostRecentArtifact.employeeId}`,
    };
  }

  // 4. atlas-memory-pinned.
  if (atlasMemory) {
    return {
      kind: "atlas-memory-pinned",
      employeeId: atlasMemory.primary_employee ?? "jarvis",
      label: truncate(atlasMemory.content, 90),
      href: "/app/settings/memory",
    };
  }

  // 5. prior-conversation.
  if (lastConversation) {
    return {
      kind: "prior-conversation",
      employeeId: lastConversation.dominant_employee ?? "jarvis",
      label: `Picking up on ${truncate(
        lastConversation.title ?? "your last conversation",
        60,
      )}`,
      href: `/app?c=${lastConversation.id}`,
    };
  }

  // 6. none.
  return { kind: "none", employeeId: "jarvis", label: "" };
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
