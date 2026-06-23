"use client";

// Sidebar pulse pip on the /app/builds entry. Small dept-tinted dot
// that appears whenever ≥ 1 build is in flight.
// Also shows a brief reward-green pip when a build just shipped.
//
// Contract: specs/engineering-build-trust/contracts/in-flight-tile.md §4

import { useInFlightBuilds } from "./useInFlightBuilds";
import type { InFlightBuild } from "@/lib/engineering/in-flight";

interface Props {
  initial: InFlightBuild[];
  accountId: string;
}

export function SidebarBuildPip({ initial, accountId }: Props) {
  const { active, celebrating } = useInFlightBuilds({ initial, accountId });
  const hasActiveBuilds = active.length > 0;
  const hasShipped = celebrating.some((c) => c.terminalStatus === "complete");

  if (!hasActiveBuilds && !hasShipped) return null;

  if (hasShipped && !hasActiveBuilds) {
    // Reward-green pip: build just shipped, no longer running.
    return (
      <span
        className="eng-sidebar-pip"
        aria-label="Build just shipped"
        style={{ background: "var(--cx-reward)" }}
      />
    );
  }

  return <span className="eng-sidebar-pip" aria-label="Builds in flight" />;
}
