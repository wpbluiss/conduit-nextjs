"use client";

// Compact in-progress builds list in the Sidebar.
// Shows up to 3 active builds (status icon + truncated title + elapsed time).
// When a build completes, shows a brief "Shipped" celebration row (5 s) then
// removes itself. Returns null when no active or celebrating builds.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Upload, Clock, Hammer, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useInFlightBuilds, type CelebratingBuild } from "./useInFlightBuilds";
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
        strokeWidth={2}
        style={{ color: DEPT_COLOR_ENG, flexShrink: 0 }}
        aria-hidden
      />
    );
  }
  if (build.status === "pending") {
    return (
      <Clock
        size={11}
        strokeWidth={2}
        className="text-[var(--cx-text-muted)]"
        style={{ flexShrink: 0 }}
        aria-hidden
      />
    );
  }
  // running
  return (
    <Loader2
      size={11}
      strokeWidth={2}
      className="animate-spin"
      style={{ color: DEPT_COLOR_ENG, flexShrink: 0 }}
      aria-hidden
    />
  );
}

// Celebration row — shown for CELEBRATION_MS (5 s) after a build ships.
function CelebrationRow({ build }: { build: CelebratingBuild }) {
  const prefersReducedMotion = useReducedMotion();
  const isSuccess = build.terminalStatus === "complete";

  return (
    <motion.li
      initial={prefersReducedMotion ? false : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, x: 6 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/app/builds/${build.id}`}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors duration-100"
        style={{
          color: isSuccess ? "var(--cx-reward)" : "var(--cx-danger)",
          background: isSuccess
            ? "color-mix(in srgb, var(--cx-reward) 8%, transparent)"
            : "color-mix(in srgb, var(--cx-danger) 8%, transparent)",
        }}
        aria-label={`Build ${isSuccess ? "shipped" : "failed"}: ${build.prompt}`}
      >
        <CheckCircle2
          size={11}
          strokeWidth={2}
          style={{ flexShrink: 0, color: isSuccess ? "var(--cx-reward)" : "var(--cx-danger)" }}
          aria-hidden
        />
        <span className="flex-1 truncate">{truncate(build.prompt)}</span>
        <motion.span
          className="shrink-0 cx-mono tabular-nums"
          style={{ fontSize: "var(--cx-type-xs)", color: isSuccess ? "var(--cx-reward)" : "var(--cx-danger)" }}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.2 }}
        >
          {isSuccess ? "✓ Shipped" : "✗ Failed"}
        </motion.span>
      </Link>
    </motion.li>
  );
}

interface Props {
  initial: InFlightBuild[];
  accountId: string;
}

export function SidebarBuildsSection({ initial, accountId }: Props) {
  const { active, celebrating } = useInFlightBuilds({ initial, accountId });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (active.length === 0) return;
    const t = setInterval(() => setNowMs(Date.now()), 5_000);
    return () => clearInterval(t);
  }, [active.length]);

  if (active.length === 0 && celebrating.length === 0) return null;

  const shown = active.slice(0, MAX_SHOWN);
  const overflow = active.length - MAX_SHOWN;
  // Show up to 2 celebrating builds so the sidebar doesn't overflow on rapid builds.
  const shownCelebrating = celebrating.filter(
    (c) => c.terminalStatus === "complete" || c.terminalStatus === "failed",
  ).slice(0, 2);

  return (
    <div className="mt-3 pt-3 border-t border-[var(--cx-border)]">
      <div className="flex items-center gap-1.5 px-3 pb-1">
        <Hammer
          size={10}
          strokeWidth={2}
          style={{ color: DEPT_COLOR_ENG }}
          aria-hidden
        />
        <span className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-text-muted)]">
          {active.length > 0 ? "Building" : "Engineering"}
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] hover:bg-[color-mix(in_srgb,var(--cx-accent)_8%,transparent)] transition-colors duration-100"
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
              className="flex items-center gap-2 px-3 py-1 cx-type-xs uppercase tracking-[0.15em] text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] transition-colors"
            >
              +{overflow} more
            </Link>
          </li>
        )}
        {/* Celebration rows — brief reward beat when builds complete */}
        <AnimatePresence>
          {shownCelebrating.map((build) => (
            <CelebrationRow key={`celeb-${build.id}`} build={build} />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
