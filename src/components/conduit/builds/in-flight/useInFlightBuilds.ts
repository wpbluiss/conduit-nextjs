"use client";

// Account-scoped in-flight build feed. Initial server-rendered snapshot +
// account-broad realtime subscription on conduit_engineering_sessions.
//
// Powers:
//   - EngineeringBuildStrip on /app/workspace
//   - SidebarBuildPip on the /app/builds entry
//
// Contract: specs/engineering-build-trust/contracts/in-flight-tile.md §2

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { InFlightBuild } from "@/lib/engineering/in-flight";

const ACTIVE_STATUSES = new Set([
  "pending",
  "running",
  "deploying",
]);
const CELEBRATION_MS = 5_000;

type SessionUpdate = Partial<{
  id: string;
  prompt: string;
  build_type: string | null;
  status: string;
  deploy_url: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  created_at: string;
  account_id: string;
}>;

export interface CelebratingBuild extends InFlightBuild {
  // Status at the moment of celebration (lets the strip distinguish
  // shipped from failed).
  terminalStatus: "complete" | "failed" | "timeout" | "aborted";
}

export interface UseInFlightBuildsResult {
  active: InFlightBuild[];
  celebrating: CelebratingBuild[];
}

interface Options {
  initial: InFlightBuild[];
  accountId: string;
}

export function useInFlightBuilds({
  initial,
  accountId,
}: Options): UseInFlightBuildsResult {
  const [active, setActive] = useState<InFlightBuild[]>(initial);
  const [celebrating, setCelebrating] = useState<CelebratingBuild[]>([]);

  // Track which sessions we've already seen so an UPDATE event arriving for
  // a row we never had server-render data on can still seed `active`.
  const knownIds = useRef<Set<string>>(new Set(initial.map((b) => b.id)));

  // Persisted cleanup timers for celebration buffer.
  const celebrationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dropCelebrationLater = useCallback((id: string) => {
    const existing = celebrationTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      setCelebrating((prev) => prev.filter((b) => b.id !== id));
      celebrationTimers.current.delete(id);
    }, CELEBRATION_MS);
    celebrationTimers.current.set(id, t);
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`account-builds:${accountId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "conduit_engineering_sessions",
          filter: `account_id=eq.${accountId}`,
        },
        (payload: { new: SessionUpdate }) => {
          const row = payload.new;
          if (!row?.id) return;
          knownIds.current.add(row.id);
          if (ACTIVE_STATUSES.has(String(row.status))) {
            setActive((prev) => {
              if (prev.some((b) => b.id === row.id)) return prev;
              return [
                buildFromRow(row),
                ...prev,
              ];
            });
          }
        },
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "conduit_engineering_sessions",
          filter: `account_id=eq.${accountId}`,
        },
        (payload: { new: SessionUpdate }) => {
          const row = payload.new;
          if (!row?.id) return;
          const rowId = row.id;
          const isActive = ACTIVE_STATUSES.has(String(row.status));

          if (isActive) {
            setActive((prev) => {
              const idx = prev.findIndex((b) => b.id === rowId);
              if (idx >= 0) {
                // Merge fresh fields onto the existing build.
                const merged = mergeBuild(prev[idx], row);
                const next = prev.slice();
                next[idx] = merged;
                return next;
              }
              // Was not in active (maybe newly created or returning from
              // an erroneous transient terminal). Add it.
              return [buildFromRow(row), ...prev];
            });
            // If this row was celebrating, cancel the celebration.
            setCelebrating((prev) => prev.filter((b) => b.id !== rowId));
            const t = celebrationTimers.current.get(rowId);
            if (t) {
              clearTimeout(t);
              celebrationTimers.current.delete(rowId);
            }
          } else {
            // Terminal transition.
            const terminalStatus = String(row.status) as
              | "complete"
              | "failed"
              | "timeout"
              | "aborted";
            setActive((prev) => {
              const idx = prev.findIndex((b) => b.id === rowId);
              if (idx < 0) return prev;
              // Move to celebrating.
              const finalBuild = mergeBuild(prev[idx], row);
              setCelebrating((celebs) => [
                ...celebs,
                { ...finalBuild, terminalStatus },
              ]);
              dropCelebrationLater(rowId);
              return prev.filter((b) => b.id !== rowId);
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      // Clear timers
      for (const t of celebrationTimers.current.values()) clearTimeout(t);
      celebrationTimers.current.clear();
    };
  }, [accountId, dropCelebrationLater]);

  return { active, celebrating };
}

function buildFromRow(row: SessionUpdate): InFlightBuild {
  const status = (row.status ?? "pending") as InFlightBuild["status"];
  return {
    id: String(row.id),
    prompt: row.prompt ?? "",
    buildType: row.build_type ?? null,
    status,
    startedAt: row.started_at ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
    step: {
      label:
        status === "pending"
          ? "Queued"
          : status === "deploying"
            ? "Deploying"
            : "Building",
      eyebrow:
        status === "pending"
          ? "WAITING FOR ENGINEERING"
          : status === "deploying"
            ? "PUSHING TO VERCEL"
            : "BUILDING THE PROJECT",
      kind:
        status === "pending"
          ? "queued"
          : status === "deploying"
            ? "deploying"
            : "writing",
    },
    fileCount: 0,
    currentFile: null,
    inputTokens: row.total_input_tokens ?? 0,
    outputTokens: row.total_output_tokens ?? 0,
  };
}

function mergeBuild(prev: InFlightBuild, row: SessionUpdate): InFlightBuild {
  const status = (row.status ?? prev.status) as InFlightBuild["status"];
  return {
    ...prev,
    status,
    startedAt: row.started_at ?? prev.startedAt,
    inputTokens: row.total_input_tokens ?? prev.inputTokens,
    outputTokens: row.total_output_tokens ?? prev.outputTokens,
    step: {
      ...prev.step,
      label:
        status === "pending"
          ? "Queued"
          : status === "deploying"
            ? "Deploying"
            : prev.step.label,
      eyebrow:
        status === "pending"
          ? "WAITING FOR ENGINEERING"
          : status === "deploying"
            ? "PUSHING TO VERCEL"
            : prev.step.eyebrow,
      kind:
        status === "pending"
          ? "queued"
          : status === "deploying"
            ? "deploying"
            : prev.step.kind,
    },
  };
}
