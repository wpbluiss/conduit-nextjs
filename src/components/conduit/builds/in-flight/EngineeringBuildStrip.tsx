"use client";

// Above-the-hero strip on /app/workspace whenever ≥ 1 build is in flight.
// Mirrors PraxisLiveStrip structure (praxis-system.css:495-531) with
// engineering-specific dept tint and meta (elapsed, file count).
//
// Contract: specs/engineering-build-trust/contracts/in-flight-tile.md §3

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  useInFlightBuilds,
  type CelebratingBuild,
} from "./useInFlightBuilds";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { translateBuildError } from "@/lib/engineering/error-translation";

interface Props {
  /** Server-rendered initial in-flight set from getInFlightBuilds(). */
  initial: InFlightBuild[];
  accountId: string;
  internalAccount: boolean;
}

function formatElapsed(startedAt: string | null, nowMs: number): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const sec = Math.max(0, Math.round((nowMs - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function truncatePrompt(s: string, max = 40): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export function EngineeringBuildStrip({
  initial,
  accountId,
  internalAccount,
}: Props) {
  const { active, celebrating } = useInFlightBuilds({ initial, accountId });

  // Monotonic clock for elapsed.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (active.length === 0 && celebrating.length === 0) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active.length, celebrating.length]);

  // Pick whichever strip to render: celebrating first (it's transient and
  // overrides ambient), else the most-recently-started active.
  const celeb = celebrating[celebrating.length - 1] ?? null;
  if (celeb) {
    return <CelebrationStrip build={celeb} internalAccount={internalAccount} />;
  }

  if (active.length === 0) return null;
  const primary = active[0];
  const extra = active.length - 1;

  return (
    <Link
      href={`/app/builds/${primary.id}`}
      className="eng-inflight-strip"
      aria-label={`Open the build in flight: ${truncatePrompt(primary.prompt)}`}
    >
      <div className="praxis-live-strip" data-dept="engineering" role="status">
        <span className="praxis-live-strip-wave" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span
          className="praxis-eyebrow"
          style={{ color: "var(--color-text)" }}
        >
          BUILDING ·{" "}
          <span style={{ color: "var(--color-text-muted)" }}>
            {primary.step.eyebrow}
          </span>
        </span>
        <span className="eng-inflight-strip-meta">
          <span>{formatElapsed(primary.startedAt, nowMs)}</span>
          {primary.fileCount > 0 && (
            <span>· {primary.fileCount} files</span>
          )}
          {extra > 0 && (
            <Link
              href="/app/builds"
              className="praxis-eyebrow"
              style={{
                marginLeft: "var(--space-2)",
                color: "var(--color-text-muted)",
              }}
            >
              +{extra} more
            </Link>
          )}
        </span>
        <span
          className="praxis-eyebrow"
          style={{
            color: "var(--dept, var(--color-accent))",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
          }}
        >
          Open live view <ArrowRight size={11} strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

function CelebrationStrip({
  build,
  internalAccount,
}: {
  build: CelebratingBuild;
  internalAccount: boolean;
}) {
  if (build.terminalStatus === "complete") {
    return (
      <Link
        href={`/app/builds/${build.id}`}
        className="eng-inflight-strip"
        data-state="celebrating"
        aria-label="Just shipped — open"
      >
        <div
          className="praxis-live-strip eng-inflight-strip-celebration"
          data-dept="engineering"
          role="status"
        >
          <span className="praxis-live-strip-wave" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span
            className="praxis-eyebrow"
            style={{ color: "var(--color-text)" }}
          >
            JUST SHIPPED ·{" "}
            <span style={{ color: "var(--color-text-muted)" }}>
              {truncatePrompt(build.prompt)}
            </span>
          </span>
          <span
            className="praxis-eyebrow"
            style={{
              marginLeft: "auto",
              color: "var(--dept, var(--color-accent))",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            Open summary <ArrowRight size={11} strokeWidth={1.75} />
          </span>
        </div>
      </Link>
    );
  }

  // failed / timeout / aborted
  const translated = translateBuildError(null, { internalAccount });
  void translated; // not actually needed here — strip just says it failed; cinema has detail
  const headline =
    build.terminalStatus === "aborted"
      ? "BUILD STOPPED"
      : "BUILD FAILED";

  return (
    <Link
      href={`/app/builds/${build.id}`}
      className="eng-inflight-strip"
      data-state="failed"
      aria-label="Build failed — open"
    >
      <div
        className="praxis-live-strip"
        data-dept="engineering"
        role="status"
      >
        <span className="praxis-live-strip-wave" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span
          className="praxis-eyebrow"
          style={{ color: "var(--color-text)" }}
        >
          {headline} ·{" "}
          <span style={{ color: "var(--color-text-muted)" }}>
            {truncatePrompt(build.prompt)}
          </span>
        </span>
        <span
          className="praxis-eyebrow"
          style={{
            marginLeft: "auto",
            color: "var(--color-pink)",
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-1)",
          }}
        >
          See what happened <ArrowRight size={11} strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}
