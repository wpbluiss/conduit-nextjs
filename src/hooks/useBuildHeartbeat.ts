"use client";

// Stuck-detection heartbeat. Tracks the most-recent event timestamp;
// transitions to `investigating` when no event has arrived in N seconds
// for a non-terminal session.
//
// Contract: specs/engineering-build-trust/data-model.md §2.5

import { useEffect, useRef, useState } from "react";
import type { SessionStatus } from "@/lib/engineering/step-taxonomy";

export type HeartbeatState =
  | { kind: "healthy"; lastEventAt: number }
  | { kind: "investigating"; lastEventAt: number; since: number };

const STUCK_THRESHOLD_MS = 90_000;
const CHECK_INTERVAL_MS = 5_000;

interface UseBuildHeartbeatInput {
  status: SessionStatus;
  /** Most-recent realtime event timestamp (log INSERT or session UPDATE). Pass Date.now() on each event. */
  lastEventAt: number;
}

export function useBuildHeartbeat(input: UseBuildHeartbeatInput): {
  heartbeat: HeartbeatState;
  refresh: () => void;
} {
  const { status, lastEventAt } = input;
  const [heartbeat, setHeartbeat] = useState<HeartbeatState>({
    kind: "healthy",
    lastEventAt,
  });

  // Keep latest lastEventAt in a ref so the interval doesn't need to re-run.
  const lastRef = useRef(lastEventAt);
  lastRef.current = lastEventAt;

  // Update heartbeat on lastEventAt change → healthy.
  useEffect(() => {
    setHeartbeat({ kind: "healthy", lastEventAt });
  }, [lastEventAt]);

  // Interval check for stuck condition.
  useEffect(() => {
    const isTerminal =
      status === "complete" ||
      status === "failed" ||
      status === "timeout" ||
      status === "aborted";
    if (isTerminal) return;
    const t = setInterval(() => {
      const elapsed = Date.now() - lastRef.current;
      if (elapsed >= STUCK_THRESHOLD_MS) {
        setHeartbeat((prev) =>
          prev.kind === "investigating"
            ? prev
            : {
                kind: "investigating",
                lastEventAt: lastRef.current,
                since: Date.now(),
              },
        );
      }
    }, CHECK_INTERVAL_MS);
    return () => clearInterval(t);
  }, [status]);

  const refresh = () => {
    setHeartbeat({ kind: "healthy", lastEventAt: Date.now() });
    lastRef.current = Date.now();
  };

  return { heartbeat, refresh };
}
