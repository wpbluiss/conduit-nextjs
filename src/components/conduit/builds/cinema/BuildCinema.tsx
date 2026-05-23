"use client";

// Top-level cinema orchestrator. Mounts the resilience hook composition
// (useBuildSession), threads state down to the visual components.
//
// Contract: specs/engineering-build-trust/contracts/cinema-route.md §3

import { useEffect, useRef, useState } from "react";
import {
  useBuildSession,
  type SessionRow,
  type LogRow,
} from "@/hooks/useBuildSession";
import { BuildHeader } from "./BuildHeader";
import { BuildStageBand } from "./BuildStageBand";
import { BuildCraftStrip } from "./BuildCraftStrip";
import { BuildPreviewStage } from "./BuildPreviewStage";
import { BuildRawLogPanel } from "./BuildRawLogPanel";
import { BuildShippedSummary } from "./BuildShippedSummary";

interface Props {
  initialSession: SessionRow;
  initialLogs: LogRow[];
  internalAccount: boolean;
}

const CELEBRATION_MS = 1800;

export function BuildCinema({
  initialSession,
  initialLogs,
  internalAccount,
}: Props) {
  const { session, logs, files, step, heartbeat, subscription, refresh } =
    useBuildSession({
      sessionId: initialSession.id,
      initialSession,
      initialLogs,
    });

  // Celebration moment: pulse the step label briefly when status transitions
  // to "complete" while the cinema is open.
  const [celebrating, setCelebrating] = useState(false);
  const prevStatus = useRef<SessionRow["status"]>(initialSession.status);
  useEffect(() => {
    if (prevStatus.current !== "complete" && session.status === "complete") {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), CELEBRATION_MS);
      return () => clearTimeout(t);
    }
    prevStatus.current = session.status;
  }, [session.status]);

  // Echo deploy_url to sessionStorage so the segment error-boundary can
  // surface an "Open Vercel preview" affordance even if the cinema crashed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!session.deploy_url) return;
    try {
      sessionStorage.setItem(
        `eng-build-deploy:${session.id}`,
        session.deploy_url,
      );
    } catch {
      // ignore quota errors
    }
  }, [session.id, session.deploy_url]);

  const isTerminal =
    session.status === "complete" ||
    session.status === "failed" ||
    session.status === "timeout" ||
    session.status === "aborted";

  return (
    <div className="eng-cinema" data-dept="engineering">
      <BuildHeader
        session={session}
        subscription={subscription}
        heartbeat={heartbeat}
        onRefresh={refresh}
      />
      <BuildStageBand session={session} step={step} celebrating={celebrating} />
      <BuildCraftStrip files={files} />
      {!isTerminal && <BuildPreviewStage session={session} />}
      {isTerminal && session.status === "complete" && (
        <BuildPreviewStage session={session} />
      )}
      {isTerminal && (
        <BuildShippedSummary
          session={session}
          logs={logs}
          internalAccount={internalAccount}
        />
      )}
      <BuildRawLogPanel logs={logs} />
    </div>
  );
}
