"use client";

// Composed hook that wires together: realtime subscription + heartbeat +
// derived step + file touches. Consumed by BuildCinema (one session view).
//
// The host (BuildCinema) feeds in `initialSession` + `initialLogs` from
// server-render; subsequent state lives entirely in this hook.

import { useCallback, useMemo, useState } from "react";
import {
  deriveStep,
  deriveFileTouches,
  type FileTouch,
  type SessionStatus,
  type Step,
} from "@/lib/engineering/step-taxonomy";
import {
  useBuildSubscription,
  type SubscriptionStatus,
} from "./useBuildSubscription";
import { useBuildHeartbeat, type HeartbeatState } from "./useBuildHeartbeat";

export interface SessionRow {
  id: string;
  prompt: string;
  build_type: string | null;
  status: SessionStatus;
  deploy_url: string | null;
  github_repo: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  parent_session_id?: string | null;
  conversation_id?: string | null;
}

export interface LogRow {
  id: string;
  ts: string;
  level: "info" | "stdout" | "stderr" | "system";
  message: string;
}

export interface UseBuildSessionInput {
  sessionId: string;
  initialSession: SessionRow;
  initialLogs: LogRow[];
}

export interface UseBuildSessionResult {
  session: SessionRow;
  logs: LogRow[];
  files: FileTouch[];
  step: Step;
  heartbeat: HeartbeatState;
  subscription: SubscriptionStatus;
  /** Force a refetch of session + logs (consumed by "Refresh now" affordance). */
  refresh: () => Promise<void>;
}

export function useBuildSession(
  input: UseBuildSessionInput,
): UseBuildSessionResult {
  const { sessionId, initialSession, initialLogs } = input;
  const [session, setSession] = useState<SessionRow>(initialSession);
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [lastEventAt, setLastEventAt] = useState<number>(() => {
    const lastLog = initialLogs[initialLogs.length - 1];
    if (lastLog) return new Date(lastLog.ts).getTime();
    if (initialSession.completed_at)
      return new Date(initialSession.completed_at).getTime();
    if (initialSession.started_at)
      return new Date(initialSession.started_at).getTime();
    return new Date(initialSession.created_at).getTime();
  });

  const handleLog = useCallback((row: LogRow) => {
    setLogs((prev) => {
      // Dedupe by id (realtime can re-deliver during reconcile).
      if (prev.some((l) => l.id === row.id)) return prev;
      return [...prev, row];
    });
    setLastEventAt(Date.now());
  }, []);

  const handleSession = useCallback((row: Record<string, unknown>) => {
    setSession((prev) => ({ ...prev, ...(row as Partial<SessionRow>) }));
    setLastEventAt(Date.now());
  }, []);

  const reconcile = useCallback(async () => {
    try {
      const r = await fetch(`/api/engineering/session/${sessionId}`, {
        cache: "no-store",
      });
      if (!r.ok) return;
      const j = (await r.json()) as { session?: SessionRow; logs?: LogRow[] };
      if (j.session) setSession(j.session);
      if (j.logs) {
        setLogs((prev) => {
          const seen = new Set(prev.map((l) => l.id));
          const next = [...prev];
          for (const l of j.logs!) {
            if (!seen.has(l.id)) next.push(l);
          }
          next.sort((a, b) => a.ts.localeCompare(b.ts));
          return next;
        });
      }
      setLastEventAt(Date.now());
    } catch {
      // best effort; cinema continues with whatever realtime gives us
    }
  }, [sessionId]);

  const { status: subscription } = useBuildSubscription({
    sessionId,
    onLog: handleLog,
    onSession: handleSession,
    onReconcile: reconcile,
  });

  const { heartbeat, refresh: refreshHeartbeat } = useBuildHeartbeat({
    status: session.status,
    lastEventAt,
  });

  const refresh = useCallback(async () => {
    await reconcile();
    refreshHeartbeat();
  }, [reconcile, refreshHeartbeat]);

  const files = useMemo(() => deriveFileTouches(logs), [logs]);
  const step = useMemo(
    () => deriveStep(session, logs, heartbeat),
    [session, logs, heartbeat],
  );

  return {
    session,
    logs,
    files,
    step,
    heartbeat,
    subscription,
    refresh,
  };
}
