"use client";

import { useEffect, useMemo, useRef } from "react";
import type { LogRow } from "@/hooks/useBuildSession";
import { scrubProviderTells } from "@/lib/engineering/error-translation";

interface Props {
  logs: LogRow[];
}

const RENDER_CAP = 1000;
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/**
 * Collapsed-by-default detail panel. The ops-fidelity terminal treatment
 * is preserved here — it just isn't the dominant element anymore.
 * Provider-tell scrubbing applies at render time per FR-030 / Constitution III.
 */
export function BuildRawLogPanel({ logs }: Props) {
  const visible = useMemo(
    () => (logs.length > RENDER_CAP ? logs.slice(-RENDER_CAP) : logs),
    [logs],
  );

  // Scroll to bottom on each new log when expanded.
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  return (
    <details className="eng-cinema-log">
      <summary className="eng-cinema-log-summary">
        <span>Technical log</span>
        <span aria-hidden>· {logs.length}</span>
      </summary>
      <div className="eng-cinema-log-scroll" ref={scrollRef} role="log">
        {visible.length === 0 ? (
          <div className="eng-cinema-log-line">
            <span className="eng-cinema-log-level-info">Waiting for the worker…</span>
          </div>
        ) : (
          visible.map((log) => (
            <div key={log.id} className="eng-cinema-log-line">
              <span className="eng-cinema-log-ts">
                {TIME_FMT.format(new Date(log.ts))}
              </span>
              <span className={`eng-cinema-log-level-${log.level}`}>
                {scrubProviderTells(log.message)}
              </span>
            </div>
          ))
        )}
      </div>
    </details>
  );
}
