"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Hammer } from "lucide-react";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";
import type { ActivityEvent } from "@/app/api/conduit/activity/route";
import { EmptyState, ActivityEmptySVG } from "./EmptyState";
import { CX_ACCENT, CX_ACCENT_BRIGHT, CX_REWARD } from "@/lib/design-system/cx-tokens";

// 3 evenly-spaced spark angles for the build-shipped beat.
const SPARK_ANGLES = [0, 120, 240];
const SPARK_COLORS = [CX_REWARD, CX_ACCENT_BRIGHT, CX_REWARD];

/**
 * BuildShippedPulse — one-shot reward beat overlaid on the build event icon.
 * Fires once on mount (initial render). Respects prefers-reduced-motion:
 * reduced path = a 300ms opacity flash only.
 *
 * The radial size (16px) fits the 28×28 icon cell without overflowing the row.
 */
function BuildShippedPulse() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  // After the animation completes, remove from DOM so it never re-fires.
  useEffect(() => {
    const id = setTimeout(() => setDone(true), reduced ? 320 : 560);
    return () => clearTimeout(id);
  }, [reduced]);

  if (done) return null;

  if (reduced) {
    return (
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-lg"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{ background: CX_REWARD }}
      />
    );
  }

  return (
    <>
      {/* Expanding accent→green ring pulse */}
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-lg"
        initial={{
          opacity: 0.9,
          scale: 0.85,
          boxShadow: `0 0 0 2px ${CX_ACCENT}, 0 0 8px 2px ${CX_ACCENT}55`,
        }}
        animate={{
          opacity: 0,
          scale: 2.0,
          boxShadow: `0 0 0 2px ${CX_REWARD}, 0 0 12px 4px ${CX_REWARD}44`,
        }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* 3 spark particles — GPU-only transforms */}
      <AnimatePresence>
        {SPARK_ANGLES.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const tx = Math.round(Math.cos(rad) * 18);
          const ty = Math.round(Math.sin(rad) * 18);
          return (
            <motion.span
              key={`spark-${i}`}
              aria-hidden
              className="absolute pointer-events-none rounded-full"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.04,
              }}
              style={{
                width: 4,
                height: 4,
                left: "50%",
                top: "50%",
                marginLeft: -2,
                marginTop: -2,
                background: SPARK_COLORS[i],
              }}
            />
          );
        })}
      </AnimatePresence>
    </>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function EventRow({ event }: { event: ActivityEvent }) {
  const router = useRouter();
  const isBuild = event.type === "build";
  const Icon = isBuild ? Hammer : (EMPLOYEE_ICON[event.employee] ?? Hammer);
  const color = isBuild
    ? "var(--cx-reward)"
    : (DEPT_COLOR[event.employee] ?? "var(--color-accent)");

  const handleClick = () => {
    if (event.buildId) {
      router.push(`/app/builds/${event.buildId}`);
    } else if (event.conversationId) {
      router.push(`/app?c=${event.conversationId}`);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] rounded-lg"
    >
      {/* Icon cell — relative so BuildShippedPulse can overlay */}
      <span
        className="relative mt-0.5 shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg"
        style={{
          background: isBuild
            ? "color-mix(in srgb, var(--cx-reward) 10%, var(--color-surface-elevated))"
            : `color-mix(in srgb, ${color} 14%, var(--color-surface-elevated))`,
          color,
          boxShadow: isBuild
            ? "inset 0 0 0 1px color-mix(in srgb, var(--cx-reward) 35%, transparent)"
            : `inset 0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)`,
        }}
        aria-hidden
      >
        <Icon size={13} strokeWidth={1.75} />
        {/* Reward beat — fires once on mount for build-shipped events */}
        {isBuild && <BuildShippedPulse />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 flex-wrap">
          <span
            className="cx-type-xs font-semibold uppercase tracking-[0.1em] shrink-0"
            style={{ color: isBuild ? "var(--cx-reward)" : color }}
          >
            {isBuild ? "Engineering" : employeeLabel(event.employee)}
          </span>
          {isBuild && (
            <span
              className="cx-type-xs tabular-nums shrink-0 inline-flex items-center gap-1 px-1.5 py-px rounded-full"
              style={{
                color: "var(--cx-reward)",
                background: "color-mix(in srgb, var(--cx-reward) 10%, transparent)",
              }}
            >
              ✓ Shipped
            </span>
          )}
        </span>
        <p
          className="mt-0.5 cx-type-sm leading-snug line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {event.summary || (isBuild ? "Engineering build" : "(no content)")}
        </p>
        <span
          className="mt-1 block cx-mono cx-type-xs tabular-nums"
          style={{ color: "var(--color-text-muted)" }}
        >
          {relativeTime(event.timestamp)}
        </span>
      </span>
    </motion.button>
  );
}

interface Props {
  initial: ActivityEvent[];
  initialHasMore: boolean;
  initialNextBefore: string | null;
}

export function ActivityFeed({ initial, initialHasMore, initialNextBefore }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextBefore, setNextBefore] = useState<string | null>(initialNextBefore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !nextBefore) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/conduit/activity?before=${encodeURIComponent(nextBefore)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        events: ActivityEvent[];
        hasMore: boolean;
        nextBefore: string | null;
      };
      setEvents((prev) => {
        const ids = new Set(prev.map((e) => e.id));
        return [...prev, ...data.events.filter((e) => !ids.has(e.id))];
      });
      setHasMore(data.hasMore);
      setNextBefore(data.nextBefore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextBefore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 px-6">
        <EmptyState
          icon={<ActivityEmptySVG />}
          title="No activity yet"
          body="Start a conversation with your Praxis specialists and their work will appear here."
          className="max-w-sm"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y" style={{ borderColor: "var(--cx-border)" }}>
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
      <div ref={sentinelRef} className="py-4 flex items-center justify-center">
        {loading ? (
          <span
            className="cx-type-xs uppercase tracking-wider"
            style={{ color: "var(--cx-text-faint)" }}
          >
            Loading…
          </span>
        ) : !hasMore ? (
          <span
            className="cx-type-xs uppercase tracking-wider"
            style={{ color: "var(--cx-text-faint)" }}
          >
            All activity loaded
          </span>
        ) : null}
      </div>
    </div>
  );
}
