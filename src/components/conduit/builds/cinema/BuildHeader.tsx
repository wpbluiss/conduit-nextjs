"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, StopCircle, X, CheckCircle2, AlertTriangle } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";
import type { SessionRow } from "@/hooks/useBuildSession";
import { ReconnectingPip } from "./ReconnectingPip";
import type { SubscriptionStatus } from "@/hooks/useBuildSubscription";
import type { HeartbeatState } from "@/hooks/useBuildHeartbeat";

interface Props {
  session: SessionRow;
  subscription: SubscriptionStatus;
  heartbeat: HeartbeatState;
  onRefresh: () => void;
}

const ABORTABLE: SessionRow["status"][] = ["pending", "running", "deploying"];

function pillLabel(status: SessionRow["status"]): string {
  switch (status) {
    case "pending":
      return "Queued";
    case "running":
      return "Building";
    case "deploying":
      return "Deploying";
    case "complete":
      return "Live";
    case "failed":
      return "Failed";
    case "timeout":
      return "Timed out";
    case "aborted":
      return "Stopped";
  }
}

export function BuildHeader({ session, subscription, heartbeat, onRefresh }: Props) {
  const router = useRouter();
  const [aborting, setAborting] = useState(false);
  const [abortError, setAbortError] = useState<string | null>(null);

  const isAbortable = ABORTABLE.includes(session.status);

  const onAbort = async () => {
    if (!isAbortable || aborting) return;
    if (
      !window.confirm(
        "Stop this build? The worker subprocess will be killed and the session marked aborted.",
      )
    ) {
      return;
    }
    setAborting(true);
    setAbortError(null);
    try {
      const r = await fetch(`/api/engineering/session/${session.id}/abort`, {
        method: "POST",
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setAbortError(j.error ?? `abort_${r.status}`);
      }
      // Realtime UPDATE on the session row will flip status to 'aborted'.
    } catch (err) {
      setAbortError(err instanceof Error ? err.message : "abort_failed");
    } finally {
      setAborting(false);
    }
  };

  const StatusIcon =
    session.status === "complete"
      ? CheckCircle2
      : session.status === "failed" ||
          session.status === "timeout" ||
          session.status === "aborted"
        ? AlertTriangle
        : Loader2;

  return (
    <header className="eng-cinema-header">
      <div className="eng-cinema-title">
        <span className="eng-cinema-pill" data-status={session.status}>
          <StatusIcon
            size={11}
            className={
              session.status === "pending" ||
              session.status === "running" ||
              session.status === "deploying"
                ? "animate-spin"
                : undefined
            }
          />
          {pillLabel(session.status)}
        </span>
        <span className="eng-cinema-prompt" title={session.prompt}>
          {session.prompt || "Build session"}
        </span>
      </div>

      <div className="eng-cinema-actions">
        <ReconnectingPip
          subscription={subscription}
          heartbeat={heartbeat}
          onRefresh={onRefresh}
        />
        {abortError && (
          <span className="cx-type-xs text-[var(--color-pink)]">{abortError}</span>
        )}
        {isAbortable && (
          <PraxisButton
            variant="danger"
            size="sm"
            onClick={onAbort}
            disabled={aborting}
            title="Kill the worker subprocess for this build"
          >
            <StopCircle size={13} strokeWidth={1.75} />
            {aborting ? "Stopping…" : "Stop build"}
          </PraxisButton>
        )}
        <PraxisButton
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/app/builds")}
          aria-label="Back to all builds"
          title="Back to all builds"
        >
          <X size={16} strokeWidth={1.75} />
        </PraxisButton>
      </div>
    </header>
  );
}
