"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hammer } from "lucide-react";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import type { EmployeeKey } from "@/lib/ai/provider";
import type { ActivityEvent } from "@/app/api/conduit/activity/route";

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
  const Icon = event.type === "build" ? Hammer : (EMPLOYEE_ICON[event.employee] ?? Hammer);
  const color = DEPT_COLOR[event.employee] ?? "var(--color-accent)";

  const handleClick = () => {
    if (event.type === "build" && event.buildId) {
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
      <span
        className="mt-0.5 shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg"
        style={{
          background: `color-mix(in srgb, ${color} 14%, var(--color-surface-elevated))`,
          color,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 35%, transparent)`,
        }}
        aria-hidden
      >
        <Icon size={13} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 flex-wrap">
          <span
            className="cx-type-xs font-semibold uppercase tracking-[0.1em] shrink-0"
            style={{ color }}
          >
            {event.type === "build" ? "Engineering" : employeeLabel(event.employee)}
          </span>
          {event.type === "build" && (
            <span
              className="cx-type-xs uppercase tracking-[0.15em] shrink-0"
              style={{ color: "var(--color-text-muted)" }}
            >
              built
            </span>
          )}
        </span>
        <p
          className="mt-0.5 cx-type-sm leading-snug line-clamp-2"
          style={{ color: "var(--color-text)" }}
        >
          {event.summary || "(no content)"}
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
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <p
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          No activity yet. Start a conversation with your Praxis specialists.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
      <div ref={sentinelRef} className="py-4 flex items-center justify-center">
        {loading ? (
          <span
            className="cx-type-xs uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading…
          </span>
        ) : !hasMore ? (
          <span
            className="cx-type-xs uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            All activity loaded
          </span>
        ) : null}
      </div>
    </div>
  );
}
