"use client";

import type { SubscriptionStatus } from "@/hooks/useBuildSubscription";
import type { HeartbeatState } from "@/hooks/useBuildHeartbeat";
import { PraxisButton } from "@/components/conduit/PraxisButton";

interface Props {
  subscription: SubscriptionStatus;
  heartbeat: HeartbeatState;
  onRefresh?: () => void;
}

/**
 * Surface the realtime channel health + stuck-detection state.
 * Renders nothing in the healthy/live case to avoid visual noise.
 * Hides itself on terminal builds (heartbeat investigating only
 * matters mid-build per useBuildHeartbeat).
 */
export function ReconnectingPip({ subscription, heartbeat, onRefresh }: Props) {
  if (heartbeat.kind === "investigating") {
    return (
      <PraxisButton
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="eng-reconnecting-pip"
        data-kind="investigating"
        title="No activity for ~90s — check now."
      >
        <span className="eng-reconnecting-pip-dot" aria-hidden />
        Refresh now
      </PraxisButton>
    );
  }
  if (subscription.kind === "degraded" || subscription.kind === "reconnecting") {
    return (
      <span className="eng-reconnecting-pip" data-kind="reconnecting">
        <span className="eng-reconnecting-pip-dot" aria-hidden />
        Reconnecting…
      </span>
    );
  }
  if (subscription.kind === "reconciling") {
    return (
      <span className="eng-reconnecting-pip" data-kind="reconciling">
        <span className="eng-reconnecting-pip-dot" aria-hidden />
        Back online
      </span>
    );
  }
  return null;
}
