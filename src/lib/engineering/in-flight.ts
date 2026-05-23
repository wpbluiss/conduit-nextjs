// Server-side helper: load all in-flight Engineering builds for an account
// with enough log tail per session to derive step + file counts.
//
// Consumed by:
//   - /app/workspace server render → EngineeringBuildStrip initial
//   - /app/app/layout (Sidebar pip initial) — via a parallel layout query
//
// Pure read; RLS-scoped via the standard server-Supabase client.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type SessionStatus,
  deriveStep,
  deriveFileTouches,
  fileCount,
  currentFile,
  type Step,
} from "@/lib/engineering/step-taxonomy";

export interface InFlightBuild {
  id: string;
  prompt: string;
  buildType: string | null;
  status: Extract<SessionStatus, "pending" | "running" | "deploying">;
  startedAt: string | null;
  createdAt: string;
  step: Step;
  fileCount: number;
  currentFile: string | null;
  inputTokens: number;
  outputTokens: number;
}

const ACTIVE_STATUSES = ["pending", "running", "deploying"] as const;

export async function getInFlightBuilds(
  supabase: SupabaseClient,
  accountId: string,
): Promise<InFlightBuild[]> {
  // Pull active sessions first; if none, short-circuit (no log query).
  const { data: sessions } = await supabase
    .from("conduit_engineering_sessions")
    .select(
      "id, prompt, build_type, status, started_at, created_at, total_input_tokens, total_output_tokens",
    )
    .eq("account_id", accountId)
    .in("status", ACTIVE_STATUSES as unknown as string[])
    .order("created_at", { ascending: false })
    .limit(5);

  if (!sessions || sessions.length === 0) return [];

  // Pull last 30 log rows per session in parallel.
  const ids = sessions.map((s) => s.id as string);
  const logsBySession = new Map<
    string,
    { ts: string; level: "info" | "stdout" | "stderr" | "system"; message: string }[]
  >();
  await Promise.all(
    ids.map(async (id) => {
      const { data: logs } = await supabase
        .from("conduit_engineering_logs")
        .select("ts, level, message")
        .eq("session_id", id)
        .order("ts", { ascending: false })
        .limit(30);
      // Re-sort ASC so the taxonomy helpers see chronological order.
      const asc = (logs ?? []).slice().reverse() as {
        ts: string;
        level: "info" | "stdout" | "stderr" | "system";
        message: string;
      }[];
      logsBySession.set(id, asc);
    }),
  );

  return sessions.map((s) => {
    const id = s.id as string;
    const logs = logsBySession.get(id) ?? [];
    const touches = deriveFileTouches(logs);
    const status = s.status as InFlightBuild["status"];
    return {
      id,
      prompt: (s.prompt as string) ?? "",
      buildType: (s.build_type as string | null) ?? null,
      status,
      startedAt: (s.started_at as string | null) ?? null,
      createdAt: s.created_at as string,
      step: deriveStep({ status }, logs),
      fileCount: fileCount(touches),
      currentFile: currentFile(touches),
      inputTokens: (s.total_input_tokens as number | null) ?? 0,
      outputTokens: (s.total_output_tokens as number | null) ?? 0,
    };
  });
}
