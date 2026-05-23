"use client";

import { useEffect, useState } from "react";
import type { SessionRow } from "@/hooks/useBuildSession";
import type { Step } from "@/lib/engineering/step-taxonomy";
import {
  actualSpendCents,
  formatSpendUsd,
} from "@/lib/engineering/spend-estimate";

interface Props {
  session: SessionRow;
  step: Step;
  /** Set true briefly when transitioning to a `complete` status — drives the celebration moment. */
  celebrating?: boolean;
}

function formatElapsed(
  startedAt: string | null,
  completedAt: string | null,
  nowMs: number,
): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : nowMs;
  const sec = Math.max(0, Math.round((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function BuildStageBand({ session, step, celebrating }: Props) {
  const isTerminal =
    session.status === "complete" ||
    session.status === "failed" ||
    session.status === "timeout" ||
    session.status === "aborted";

  // Monotonic elapsed clock — increments via interval, freezes on terminal.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (isTerminal) return;
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isTerminal]);

  const tokensIn = session.total_input_tokens ?? 0;
  const tokensOut = session.total_output_tokens ?? 0;
  const spendCents = actualSpendCents(tokensIn, tokensOut);

  return (
    <section
      className="eng-cinema-stage"
      data-terminal={isTerminal ? "true" : undefined}
      data-celebrating={celebrating ? "true" : undefined}
    >
      <div>
        <div className="eng-cinema-step-eyebrow">{step.eyebrow}</div>
        <div className="eng-cinema-step-label">{step.label}</div>
      </div>
      <div className="eng-cinema-meta">
        <div className="eng-cinema-meta-row">
          <span className="eng-cinema-meta-label">Elapsed</span>
          <span className="eng-cinema-meta-value">
            {formatElapsed(session.started_at, session.completed_at, nowMs)}
          </span>
          <span className="eng-cinema-meta-label">Spend</span>
          <span className="eng-cinema-meta-value">
            {formatSpendUsd(spendCents)}
          </span>
          <span className="eng-cinema-meta-label">Tokens in</span>
          <span className="eng-cinema-meta-value">{formatTokens(tokensIn)}</span>
          <span className="eng-cinema-meta-label">Tokens out</span>
          <span className="eng-cinema-meta-value">{formatTokens(tokensOut)}</span>
        </div>
      </div>
      <div className="eng-cinema-stage-ribbon" aria-hidden />
    </section>
  );
}
