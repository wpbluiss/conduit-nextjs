"use client";

// Sidebar pulse pip on the /app/builds entry. Small dept-tinted dot
// that appears whenever ≥ 1 build is in flight.
//
// Contract: specs/engineering-build-trust/contracts/in-flight-tile.md §4

import { useInFlightBuilds } from "./useInFlightBuilds";
import type { InFlightBuild } from "@/lib/engineering/in-flight";

interface Props {
  initial: InFlightBuild[];
  accountId: string;
}

export function SidebarBuildPip({ initial, accountId }: Props) {
  const { active } = useInFlightBuilds({ initial, accountId });
  if (active.length === 0) return null;
  return <span className="eng-sidebar-pip" aria-label="Builds in flight" />;
}
