"use client";

// Compact in-progress builds list in the Sidebar.
// Shows up to 3 active builds (status icon + truncated title + elapsed time).
// Returns null when no builds are in flight.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Upload, Clock, Hammer } from "lucide-react";
import { useInFlightBuilds } from "./useInFlightBuilds";
import type { InFlightBuild } from "@/lib/engineering/in-flight";

const DEPT_COLOR_ENG = "var(--cx-accent)";
const MAX_SHOWN = 3;

function formatElapsed(startedAt: string | null, createdAt: string, nowMs: number): string {
  const origin = startedAt ?? createdAt;
  const sec = Math.max(0, Math.round((nowMs - new Date(origin).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function truncate(s: string, max = 28): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function BuildIcon({ build }: { build: InFlightBuild }) {
  if (build.status === "deploying") {
    return (
      <Upload
        size={11}
        strokeWidth={2.25}
        style={{ color: DEPT_COLOR_ENG, flexShrink: 0 }}
        aria-hidden
      />
    );
  }
  if (build.status === "pending") {
    return (
      <Clock
        size={11}
        strokeWidth={2.25}
        className="text-[var(--color-text-muted)]"
        style={{ flexShrink: 0 }}
        aria-hidden
      />
    );
  }
  // running
  return (
    <Loader2
      size={11}
      strokeWidth={2.25}
      className="animate-spin"
      style={{ color: DEPT_COLOR_ENG, flexShrink: 0 }}
      aria-hidden
    />
  );
}

interface Props {
  initial: InFlightBuild[];
  accountId: string;
}

export function SidebarBuildsSection({ initial, accountId }: Props) {
  const { active } = useInFlightBuilds({ initial, accountId });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (active.length === 0) return;
    const t = setInterval(() => setNowMs(Date.now()), 5_000);
    return () => clearInterval(t);
  }, [active.length]);

  if (active.length === 0) return null;

  const shown = active.slice(0, MAX_SHOWN);
  const overflow = active.length - MAX_SHOWN;

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-1.5 px-3 pb-1">
        <Hammer
          size={10}
          strokeWidth={2.5}
          style={{ color: DEPT_COLOR_ENG }}
          aria-hidden
        />
        <span className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Building
        </span>
        {active.length > 1 && (
          <span
            className="ml-auto cx-type-xs tabular-nums px-1.5 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${DEPT_COLOR_ENG} 14%, transparent)`,
              color: DEPT_COLOR_ENG,
            }}
          >
            {active.length}
          </span>
        )}
      </div>

      <ul className="space-y-0.5">
        {shown.map((build) => (
          <li key={build.id}>
            <Link
              href={`/app/builds/${build.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] transition-colors duration-100"
              aria-label={`Build in progress: ${build.prompt}`}
            >
              <BuildIcon build={build} />
              <span className="flex-1 truncate">
                {truncate(build.prompt)}
              </span>
              <span
                className="shrink-0 tabular-nums cx-type-xs"
                style={{ color: DEPT_COLOR_ENG }}
                aria-label={`Elapsed: ${formatElapsed(build.startedAt, build.createdAt, nowMs)}`}
              >
                {formatElapsed(build.startedAt, build.createdAt, nowMs)}
              </span>
            </Link>
          </li>
        ))}
        {overflow > 0 && (
          <li>
            <Link
              href="/app/builds"
              className="flex items-center gap-2 px-3 py-1 cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              +{overflow} more
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
