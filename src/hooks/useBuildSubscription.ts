"use client";

// Realtime subscription with explicit channel-status awareness.
// Wraps Supabase postgres_changes channels for one engineering session.
// The load-bearing addition over BuildSession.tsx's existing pattern is
// the `onStatusChange` handler — it surfaces channel health so the cinema
// can show a reconnecting indicator instead of failing silently.
//
// Contract: specs/engineering-build-trust/data-model.md §2.4

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SubscriptionStatus =
  | { kind: "idle" }
  | { kind: "subscribing" }
  | { kind: "live" }
  | { kind: "degraded"; since: number }
  | { kind: "reconnecting"; since: number }
  | { kind: "reconciling"; since: number };

export interface UseBuildSubscriptionOptions {
  sessionId: string;
  onLog: (row: {
    id: string;
    ts: string;
    level: "info" | "stdout" | "stderr" | "system";
    message: string;
  }) => void;
  onSession: (row: Record<string, unknown>) => void;
  /** Called after a degraded → live transition so the host can re-fetch and dedupe. */
  onReconcile?: () => void;
}

export function useBuildSubscription(opts: UseBuildSubscriptionOptions): {
  status: SubscriptionStatus;
} {
  const { sessionId, onLog, onSession, onReconcile } = opts;
  const [status, setStatus] = useState<SubscriptionStatus>({ kind: "idle" });

  // Latest callbacks captured in refs so the subscription effect doesn't
  // re-subscribe when the parent re-renders with new handler identities.
  const onLogRef = useRef(onLog);
  const onSessionRef = useRef(onSession);
  const onReconcileRef = useRef(onReconcile);
  onLogRef.current = onLog;
  onSessionRef.current = onSession;
  onReconcileRef.current = onReconcile;

  const wasDegraded = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    setStatus({ kind: "subscribing" });
    const channel = supabase
      .channel(`engineering:${sessionId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "conduit_engineering_logs",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: Parameters<typeof onLogRef.current>[0] }) => {
          onLogRef.current(payload.new);
        },
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "conduit_engineering_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          onSessionRef.current(payload.new);
        },
      )
      .subscribe((channelStatus: string) => {
        const s = String(channelStatus);
        if (s === "SUBSCRIBED") {
          if (wasDegraded.current) {
            // Transitioning from degraded → reconciling → live.
            setStatus({ kind: "reconciling", since: Date.now() });
            onReconcileRef.current?.();
            // After the reconcile fires, host updates state; we settle to live.
            // Use a short timer so the "back online" celebration is visible.
            setTimeout(() => setStatus({ kind: "live" }), 1200);
          } else {
            setStatus({ kind: "live" });
          }
          wasDegraded.current = false;
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
          wasDegraded.current = true;
          setStatus({ kind: "degraded", since: Date.now() });
        } else if (s === "CLOSED") {
          // Supabase JS auto-reconnects; mark reconnecting to surface the pip.
          if (wasDegraded.current) {
            setStatus({ kind: "reconnecting", since: Date.now() });
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { status };
}
