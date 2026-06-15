"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Code2 } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";
import type { SessionRow, LogRow } from "@/hooks/useBuildSession";
import {
  translateBuildError,
  scrubProviderTells,
  type Recovery,
} from "@/lib/engineering/error-translation";
import {
  actualSpendCents,
  formatSpendUsd,
} from "@/lib/engineering/spend-estimate";
import { fileCount, deriveFileTouches } from "@/lib/engineering/step-taxonomy";

interface Props {
  session: SessionRow;
  logs: LogRow[];
  internalAccount: boolean;
}

function formatElapsed(
  startedAt: string | null,
  completedAt: string | null,
): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const sec = Math.max(0, Math.round((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function isTerminal(status: SessionRow["status"]): boolean {
  return (
    status === "complete" ||
    status === "failed" ||
    status === "timeout" ||
    status === "aborted"
  );
}

export function BuildShippedSummary({ session, logs, internalAccount }: Props) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isTerminal(session.status)) return null;

  const isSuccess = session.status === "complete";

  // For non-success: translate the error and substitute the caller-wired
  // recovery fields per contracts/error-translation.md §4.
  const translated = isSuccess
    ? null
    : translateBuildError(session.error_message, { internalAccount });

  // Substitute caller-known values into Recovery.
  const recovery: Recovery | null = translated
    ? translated.recovery.kind === "retry"
      ? {
          ...translated.recovery,
          promptSeed: translated.recovery.promptSeed ?? session.prompt,
        }
      : translated.recovery.kind === "continue-from"
        ? { ...translated.recovery, parentSessionId: session.id }
        : translated.recovery
    : null;

  const tokensIn = session.total_input_tokens ?? 0;
  const tokensOut = session.total_output_tokens ?? 0;
  const totalTokens = tokensIn + tokensOut;
  const spendCents = actualSpendCents(tokensIn, tokensOut);

  const files = deriveFileTouches(logs);
  const totalFiles = fileCount(files);

  const headline = isSuccess
    ? "Shipped."
    : translated?.headline ?? "Build ended.";

  const body = isSuccess
    ? "Engineering shipped this site."
    : translated?.body ?? "";

  return (
    <section className="eng-cinema-summary" data-status={session.status}>
      <div>
        <div className="eng-cinema-step-eyebrow">
          {isSuccess
            ? "LIVE"
            : session.status === "failed"
              ? "DID NOT SHIP"
              : session.status === "timeout"
                ? "TOOK TOO LONG"
                : "YOU STOPPED THE BUILD"}
        </div>
        <h2 className="eng-cinema-summary-headline">{headline}</h2>
        {body && <p className="eng-cinema-summary-body">{body}</p>}
      </div>

      {/* Stat grid */}
      <div className="eng-cinema-summary-grid">
        <div className="eng-cinema-summary-stat">
          <span className="eng-cinema-summary-stat-label">Files touched</span>
          <span className="eng-cinema-summary-stat-value">
            {totalFiles}
          </span>
        </div>
        <div className="eng-cinema-summary-stat">
          <span className="eng-cinema-summary-stat-label">Elapsed</span>
          <span className="eng-cinema-summary-stat-value">
            {formatElapsed(session.started_at, session.completed_at)}
          </span>
        </div>
        <div className="eng-cinema-summary-stat">
          <span className="eng-cinema-summary-stat-label">Tokens</span>
          <span className="eng-cinema-summary-stat-value">
            {formatTokens(totalTokens)}
          </span>
        </div>
        <div className="eng-cinema-summary-stat">
          <span className="eng-cinema-summary-stat-label">Spend</span>
          <span className="eng-cinema-summary-stat-value">
            {formatSpendUsd(spendCents)}
          </span>
        </div>
      </div>

      {/* Actions row */}
      <div className="eng-cinema-summary-actions">
        {isSuccess && session.deploy_url && (
          <a
            href={session.deploy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-1.5"
          >
            Open live site <ExternalLink size={13} />
          </a>
        )}
        {isSuccess && session.github_repo && (
          <a
            href={session.github_repo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm text-[var(--color-text)] transition-colors"
          >
            <Code2 size={13} /> View repo
          </a>
        )}
        {isSuccess && (
          <Link
            href={`/app/team/engineering`}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            title="Iterate on this build by talking to Engineering"
          >
            Continue with Engineering <ArrowRight size={13} />
          </Link>
        )}
        {recovery && recovery.kind === "retry" && (
          <Link
            href="/app/team/engineering"
            className="btn-primary inline-flex items-center gap-1.5"
            title={
              recovery.promptSeed ? `Will reuse: ${recovery.promptSeed}` : undefined
            }
          >
            {recovery.label} <ArrowRight size={13} />
          </Link>
        )}
        {recovery && recovery.kind === "continue-from" && (
          <Link
            href={`/app/builds?continue=${recovery.parentSessionId}`}
            className="btn-primary inline-flex items-center gap-1.5"
          >
            {recovery.label} <ArrowRight size={13} />
          </Link>
        )}
        {recovery && recovery.kind === "contact-support" && (
          <span className="text-sm text-[var(--color-text-muted)]">
            {recovery.label}
          </span>
        )}
        {recovery && recovery.kind === "edit-env" && (
          <a
            href={recovery.href}
            target={recovery.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-1.5"
          >
            {recovery.label} <ExternalLink size={13} />
          </a>
        )}
      </div>

      {/* Optional raw-details disclosure */}
      {translated?.rawDetails && (
        <div>
          <PraxisButton
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? "Hide technical details" : "Show technical details"}
          </PraxisButton>
          {showDetails && (
            <pre className="eng-cinema-summary-rawdetails">
              {scrubProviderTells(translated.rawDetails)}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
