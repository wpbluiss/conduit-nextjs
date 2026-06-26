"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Code2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PraxisButton } from "@/components/conduit/ui/Button";
import { useRewardMoment } from "@/context/RewardMomentContext";
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
import { CX_REWARD, CX_ACCENT, CX_ACCENT_BRIGHT, CX_TEXT } from "@/lib/design-system/cx-tokens";

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

// 5 evenly-spaced spark angles — GPU-cheap (transform + opacity only, no layout)
const SPARK_COUNT = 5;
const SPARK_ANGLES_DEG = Array.from({ length: SPARK_COUNT }, (_, i) => (360 / SPARK_COUNT) * i);
const SPARK_COLORS = SPARK_ANGLES_DEG.map((_, i) =>
  i % 3 === 0 ? CX_ACCENT_BRIGHT : i % 3 === 1 ? CX_REWARD : CX_ACCENT,
);

/**
 * BuildShippedRewardBeat — one-shot celebration animation when a build ships.
 *
 * Full-motion:
 *   - Outer card glow ring expands from accent → reward green (520ms)
 *   - 5 GPU-cheap spark particles burst outward (400ms staggered 15ms)
 *
 * Reduced-motion:
 *   - Simple green opacity flash on the ring (250ms, no scale/translate)
 */
function BuildShippedRewardBeat({ fired }: { fired: boolean }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <AnimatePresence>
        {fired && (
          <motion.span
            key="shipped-ring-reduced"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ borderRadius: "inherit" }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <span
              aria-hidden
              className="absolute inset-0"
              style={{
                borderRadius: "inherit",
                boxShadow: `0 0 0 2px ${CX_REWARD}, 0 0 20px 4px ${CX_REWARD}40`,
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {fired && (
        <>
          {/* Expanding glow ring — card-edge accent→green sweep */}
          <motion.span
            key="shipped-ring"
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: "inherit", zIndex: 1 }}
            initial={{
              opacity: 0.9,
              scale: 0.97,
              boxShadow: `0 0 0 2px ${CX_ACCENT}, 0 0 24px 6px ${CX_ACCENT}44`,
            }}
            animate={{
              opacity: 0,
              scale: 1.04,
              boxShadow: `0 0 0 2px ${CX_REWARD}, 0 0 32px 10px ${CX_REWARD}38`,
            }}
            exit={{}}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* 5 spark particles — radial burst from center-top of card */}
          {SPARK_ANGLES_DEG.map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            // Burst 40–60px outward, clipped by overflow:visible on parent
            const dist = 50;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;
            return (
              <motion.span
                key={`shipped-spark-${i}`}
                aria-hidden
                className="pointer-events-none absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  left: "50%",
                  top: "24px",
                  marginLeft: -2,
                  marginTop: -2,
                  background: SPARK_COLORS[i],
                  zIndex: 2,
                }}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
                exit={{}}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: i * 0.015,
                }}
              />
            );
          })}
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Animated "Shipped." headline — pulses accent→reward-green on first render.
 * Reduced-motion: renders static text, no color animation.
 */
function ShippedHeadline({ fired }: { fired: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <h2 className="eng-cinema-summary-headline" style={{ position: "relative" }}>
      {prefersReduced ? (
        "Shipped."
      ) : (
        <motion.span
          animate={
            fired
              ? {
                  color: [
                    CX_TEXT,
                    CX_REWARD,
                    CX_ACCENT_BRIGHT,
                    CX_TEXT,
                  ],
                }
              : { color: "var(--color-text)" }
          }
          transition={
            fired
              ? { duration: 0.7, ease: [0.22, 1, 0.36, 1], times: [0, 0.25, 0.55, 1] }
              : { duration: 0 }
          }
        >
          Shipped.
        </motion.span>
      )}
    </h2>
  );
}

export function BuildShippedSummary({ session, logs, internalAccount }: Props) {
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
    <BuildShippedSummaryInner
      session={session}
      isSuccess={isSuccess}
      headline={headline}
      body={body}
      recovery={recovery}
      translated={translated}
      totalFiles={totalFiles}
      totalTokens={totalTokens}
      spendCents={spendCents}
    />
  );
}

// Split into inner component so we can use hooks without conditional early return above
interface InnerProps {
  session: SessionRow;
  isSuccess: boolean;
  headline: string;
  body: string;
  recovery: Recovery | null;
  translated: ReturnType<typeof translateBuildError> | null;
  totalFiles: number;
  totalTokens: number;
  spendCents: number;
}

function BuildShippedSummaryInner({
  session,
  isSuccess,
  headline,
  body,
  recovery,
  translated,
  totalFiles,
  totalTokens,
  spendCents,
}: InnerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { triggerReward } = useRewardMoment();

  // Fire reward beat once on mount for successful builds
  const firedRef = useRef(false);
  const [rewardFired, setRewardFired] = useState(false);

  useEffect(() => {
    if (isSuccess && !firedRef.current) {
      firedRef.current = true;
      // Brief delay so the card enters before the burst fires
      const id = setTimeout(() => {
        setRewardFired(true);
        // Also fire the global confetti burst from viewport center
        triggerReward(
          typeof window !== "undefined"
            ? { x: window.innerWidth / 2, y: window.innerHeight * 0.4 }
            : undefined,
        );
      }, 180);
      return () => clearTimeout(id);
    }
  }, [isSuccess, triggerReward]);

  return (
    <section
      className="eng-cinema-summary"
      data-status={session.status}
      style={{ position: "relative", overflow: "visible" }}
    >
      {/* Reward beat — fires once on successful build mount */}
      {isSuccess && <BuildShippedRewardBeat fired={rewardFired} />}

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
        {isSuccess ? (
          <ShippedHeadline fired={rewardFired} />
        ) : (
          <h2 className="eng-cinema-summary-headline">{headline}</h2>
        )}
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
            className="btn-primary btn-sz-sm inline-flex items-center gap-1.5"
          >
            Open live site <ExternalLink size={13} strokeWidth={1.75} />
          </a>
        )}
        {isSuccess && session.github_repo && (
          <a
            href={session.github_repo}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sz-sm inline-flex items-center gap-1.5"
          >
            <Code2 size={13} strokeWidth={1.75} /> View repo
          </a>
        )}
        {isSuccess && (
          <Link
            href={`/app/team/engineering`}
            className="btn-secondary btn-sz-sm inline-flex items-center gap-1.5"
            title="Iterate on this build by talking to Engineering"
          >
            Continue with Engineering <ArrowRight size={13} strokeWidth={1.75} />
          </Link>
        )}
        {recovery && recovery.kind === "retry" && (
          <Link
            href="/app/team/engineering"
            className="btn-primary btn-sz-sm inline-flex items-center gap-1.5"
            title={
              recovery.promptSeed ? `Will reuse: ${recovery.promptSeed}` : undefined
            }
          >
            {recovery.label} <ArrowRight size={13} strokeWidth={1.75} />
          </Link>
        )}
        {recovery && recovery.kind === "continue-from" && (
          <Link
            href={`/app/builds?continue=${recovery.parentSessionId}`}
            className="btn-primary btn-sz-sm inline-flex items-center gap-1.5"
          >
            {recovery.label} <ArrowRight size={13} strokeWidth={1.75} />
          </Link>
        )}
        {recovery && recovery.kind === "contact-support" && (
          <span className="cx-type-base text-[var(--color-text-muted)]">
            {recovery.label}
          </span>
        )}
        {recovery && recovery.kind === "edit-env" && (
          <a
            href={recovery.href}
            target={recovery.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="btn-primary btn-sz-sm inline-flex items-center gap-1.5"
          >
            {recovery.label} <ExternalLink size={13} strokeWidth={1.75} />
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
