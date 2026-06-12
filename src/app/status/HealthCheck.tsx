"use client";

import { useEffect, useState } from "react";

type HealthState = "checking" | "ok" | "degraded";

export function HealthCheck() {
  const [state, setState] = useState<HealthState>("checking");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  async function check() {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        ts?: string;
      };
      setState(res.ok && json.ok ? "ok" : "degraded");
      setCheckedAt(json.ts ?? new Date().toISOString());
    } catch {
      setState("degraded");
      setCheckedAt(new Date().toISOString());
    }
  }

  useEffect(() => {
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  const label =
    state === "checking"
      ? "Checking…"
      : state === "ok"
        ? "All systems operational"
        : "Degraded — engineering aware";

  const dotColor =
    state === "checking"
      ? "bg-[var(--color-cream-mute)]"
      : state === "ok"
        ? "bg-[#22c55e]"
        : "bg-[var(--color-conduit-danger)]";

  const textColor =
    state === "ok"
      ? "text-[#22c55e]"
      : state === "degraded"
        ? "text-[var(--color-conduit-danger)]"
        : "text-[var(--color-cream-mute)]";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`w-3 h-3 rounded-full shrink-0 ${dotColor} ${state === "ok" ? "shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]" : ""}`}
        />
        <span className={`text-[16px] font-medium ${textColor}`}>{label}</span>
      </div>
      {checkedAt && (
        <p className="text-[13px] text-[var(--color-cream-mute)]">
          Last checked{" "}
          <time dateTime={checkedAt}>
            {new Date(checkedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </p>
      )}
    </div>
  );
}
