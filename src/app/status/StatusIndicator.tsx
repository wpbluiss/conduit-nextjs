"use client";

import { useEffect, useState } from "react";

type HealthStatus = "checking" | "operational" | "degraded" | "down";

interface ServiceRow {
  label: string;
  status: HealthStatus;
}

function StatusPip({ status }: { status: HealthStatus }) {
  const color =
    status === "operational"
      ? "var(--color-conduit-success)"
      : status === "degraded"
        ? "var(--color-conduit-warning)"
        : status === "checking"
          ? "var(--color-ink-tertiary)"
          : "var(--color-conduit-danger)";

  return (
    <span
      aria-hidden
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{
        background: color,
        boxShadow: status === "operational" ? `0 0 6px ${color}` : "none",
      }}
    />
  );
}

function statusLabel(s: HealthStatus) {
  if (s === "checking") return "Checking…";
  if (s === "operational") return "Operational";
  if (s === "degraded") return "Degraded";
  return "Disruption";
}

export function StatusIndicator() {
  const [overall, setOverall] = useState<HealthStatus>("checking");
  const [services, setServices] = useState<ServiceRow[]>([
    { label: "API", status: "checking" },
    { label: "Web app", status: "checking" },
  ]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const start = Date.now();
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const latency = Date.now() - start;
        const apiStatus: HealthStatus = res.ok
          ? latency > 5000
            ? "degraded"
            : "operational"
          : "down";
        setServices([
          { label: "API", status: apiStatus },
          { label: "Web app", status: "operational" },
        ]);
        setOverall(apiStatus === "operational" ? "operational" : apiStatus);
      } catch {
        setServices([
          { label: "API", status: "down" },
          { label: "Web app", status: "operational" },
        ]);
        setOverall("down");
      }
      setCheckedAt(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    }

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  const overallColor =
    overall === "operational"
      ? "var(--color-conduit-success)"
      : overall === "degraded"
        ? "var(--color-conduit-warning)"
        : overall === "checking"
          ? "var(--color-ink-tertiary)"
          : "var(--color-conduit-danger)";

  return (
    <div>
      {/* Overall banner */}
      <div
        className="rounded-xl p-5 mb-8 flex items-center gap-3"
        style={{
          background: `color-mix(in srgb, ${overallColor} 10%, var(--color-bg-surface))`,
          border: `1px solid color-mix(in srgb, ${overallColor} 30%, var(--color-border-subtle))`,
        }}
      >
        <StatusPip status={overall} />
        <span className="text-base font-semibold" style={{ color: "var(--color-ink-primary)" }}>
          {overall === "operational"
            ? "All systems operational"
            : overall === "checking"
              ? "Checking systems…"
              : overall === "degraded"
                ? "Some systems degraded"
                : "Service disruption"}
        </span>
        {checkedAt && (
          <span className="ml-auto text-xs font-mono" style={{ color: "var(--color-ink-tertiary)" }}>
            Updated {checkedAt}
          </span>
        )}
      </div>

      {/* Per-service rows */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border-subtle)" }}
      >
        {services.map((svc, i) => (
          <div
            key={svc.label}
            className="flex items-center justify-between px-5 py-4"
            style={{
              borderTop: i > 0 ? "1px solid var(--color-border-subtle)" : undefined,
              background: "var(--color-bg-surface)",
            }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--color-ink-primary)" }}>
              {svc.label}
            </span>
            <span className="flex items-center gap-2 text-sm" style={{ color: "var(--color-ink-secondary)" }}>
              <StatusPip status={svc.status} />
              {statusLabel(svc.status)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
