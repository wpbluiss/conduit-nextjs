"use client";

// Two-tab shell for /app/builds. Left tab preserves R7 (templates) cards
// exactly. Right tab is the R15 engineering sessions list.
//
// R15.5 changes:
//   - Engineering tab is no longer gated by internal_account; every
//     user sees their own builds (RLS scopes the rows) and can open them.
//   - UsageBanner surfaces today's build count + spend against tier caps.
//   - Per-card "Continue" button submits a follow-up prompt with
//     parentSessionId — the worker copies the parent's workspace files
//     into the new session so the user can iterate.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, ArrowRight, EyeOff, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, PraxisButton } from "@/components/conduit/ui/Button";
import type { DailyUsage } from "@/lib/engineering/limits";

const FAILED_STATUSES = new Set(["failed", "timeout", "aborted"]);
const SHOW_FAILED_KEY = "praxis.builds.showFailed";

export interface R7Build {
  id: string;
  template_id: string;
  build_name: string;
  status: string;
  live_url: string | null;
  github_repo_url: string | null;
  error_message: string | null;
  created_at: string;
  conversation_id: string | null;
}

export interface EngSession {
  id: string;
  prompt: string;
  build_type: string | null;
  status:
    | "pending"
    | "running"
    | "deploying"
    | "complete"
    | "failed"
    | "timeout"
    | "aborted";
  deploy_url: string | null;
  github_repo: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  parent_session_id?: string | null;
}

interface Props {
  r7Builds: R7Build[];
  engSessions: EngSession[];
  internal: boolean;
  tierName: string;
  usage: DailyUsage;
}

export default function BuildsTabs({
  r7Builds,
  engSessions,
  internal,
  tierName,
  usage,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const continueFromUrl = params.get("continue");

  const defaultTab: "templates" | "engineering" =
    engSessions.length > 0 ? "engineering" : "templates";
  const [tab, setTab] = useState<"templates" | "engineering">(defaultTab);
  const [continueParent, setContinueParent] = useState<EngSession | null>(null);
  const [showFailed, setShowFailed] = useState(false);

  // ?continue=<id> opens the ContinueModal preloaded with that session.
  // Triggered by the cinema's failure-recovery affordance (BuildShippedSummary).
  useEffect(() => {
    if (!continueFromUrl) return;
    const match = engSessions.find((s) => s.id === continueFromUrl);
    if (match) {
      setTab("engineering");
      setContinueParent(match);
    }
  }, [continueFromUrl, engSessions]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(SHOW_FAILED_KEY);
      if (v === "1") setShowFailed(true);
    } catch {}
  }, []);

  const persistShowFailed = (next: boolean) => {
    setShowFailed(next);
    try {
      localStorage.setItem(SHOW_FAILED_KEY, next ? "1" : "0");
    } catch {}
  };

  const visibleEng = showFailed
    ? engSessions
    : engSessions.filter((s) => !FAILED_STATUSES.has(s.status));
  const hiddenEngCount = engSessions.length - visibleEng.length;

  const visibleR7 = showFailed
    ? r7Builds
    : r7Builds.filter((b) => !FAILED_STATUSES.has(b.status));
  const hiddenR7Count = r7Builds.length - visibleR7.length;

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] mb-6 -mt-2">
        <div className="flex items-center gap-1">
          <Tab
            active={tab === "templates"}
            onClick={() => setTab("templates")}
            label="R7 Templates"
            count={visibleR7.length}
          />
          <Tab
            active={tab === "engineering"}
            onClick={() => setTab("engineering")}
            label="Engineering Builds"
            count={visibleEng.length}
          />
        </div>
        <FailedToggle
          showFailed={showFailed}
          onToggle={persistShowFailed}
          hiddenCount={
            tab === "engineering" ? hiddenEngCount : hiddenR7Count
          }
        />
      </div>

      {tab === "engineering" && (
        <UsageBanner usage={usage} internal={internal} tierName={tierName} />
      )}

      {tab === "templates" ? (
        <TemplatesTab builds={visibleR7} />
      ) : (
        <EngineeringTab
          sessions={visibleEng}
          onContinue={setContinueParent}
        />
      )}

      <AnimatePresence>
        {continueParent && (
          <ContinueModal
            key="continue-modal"
            parent={continueParent}
            onClose={() => setContinueParent(null)}
            onCreated={(newId) => {
              setContinueParent(null);
              router.push(`/app/builds/${newId}`);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function UsageBanner({
  usage,
  internal,
  tierName,
}: {
  usage: DailyUsage;
  internal: boolean;
  tierName: string;
}) {
  if (internal || usage.unlimited) {
    return (
      <div className="flex items-center gap-3 mb-4 cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        <span className="text-[var(--color-green)]">●</span> Unlimited
        engineering builds (internal account)
      </div>
    );
  }
  const buildsRemaining = Math.max(
    0,
    usage.buildsLimit - usage.buildsToday,
  );
  const spendCents = usage.spendCentsToday;
  const dollars = (spendCents / 100).toFixed(2);
  const capDollars = (usage.spendCapCents / 100).toFixed(2);
  const buildsExhausted = buildsRemaining === 0;
  const spendExhausted = spendCents >= usage.spendCapCents;
  const exhausted = buildsExhausted || spendExhausted;

  return (
    <div
      className="conduit-card p-3 mb-4 flex items-center justify-between text-xs"
      style={{
        borderColor: exhausted
          ? "color-mix(in srgb, var(--color-pink) 35%, transparent)"
          : undefined,
      }}
    >
      <div className="flex items-center gap-4">
        <span className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Today &middot; {tierName}
        </span>
        <span className={buildsExhausted ? "text-[var(--color-pink)]" : ""}>
          {usage.buildsToday} / {usage.buildsLimit} builds
        </span>
        <span className={spendExhausted ? "text-[var(--color-pink)]" : ""}>
          ${dollars} / ${capDollars} spend
        </span>
      </div>
      {exhausted && (
        <Link
          href="/app/settings/billing"
          className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
        >
          Upgrade →
        </Link>
      )}
    </div>
  );
}

function FailedToggle({
  showFailed,
  onToggle,
  hiddenCount,
}: {
  showFailed: boolean;
  onToggle: (next: boolean) => void;
  hiddenCount: number;
}) {
  // Nothing to surface if no failures exist and the toggle is already off.
  if (!showFailed && hiddenCount === 0) return null;
  return (
    <PraxisButton
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggle(!showFailed)}
      title={
        showFailed
          ? "Hide failed and aborted builds"
          : "Show failed and aborted builds"
      }
    >
      <EyeOff size={11} />
      {showFailed
        ? "Hide failed"
        : `Show failed${hiddenCount > 0 ? ` (${hiddenCount})` : ""}`}
    </PraxisButton>
  );
}

function Tab({
  active,
  onClick,
  label,
  count,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number | null;
  badge?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-3 py-2 text-sm transition-colors"
      style={{
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        borderBottom: `2px solid ${active ? "var(--color-accent)" : "transparent"}`,
      }}
    >
      {label}
      {count !== null && (
        <span className="ml-1.5 cx-type-xs text-[var(--color-text-muted)]">
          {count}
        </span>
      )}
      {badge && (
        <span className="ml-2 cx-type-xs uppercase tracking-[0.15em] text-[var(--color-accent-hi)]">
          {badge}
        </span>
      )}
    </button>
  );
}

function TemplatesTab({ builds }: { builds: R7Build[] }) {
  if (builds.length === 0) {
    return (
      <div className="conduit-card p-8 max-w-md">
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Nothing shipped yet
        </div>
        <p className="text-[var(--color-text)] mb-4">
          Ask Engineering for a landing page, CRM, blog, lead-capture page, or
          contact form.
        </p>
        <Link href="/app" className="btn-primary btn-sz-md">
          Go to chat →
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {builds.map((b) => (
        <div
          key={b.id}
          className="conduit-card border-l-[3px] p-5 flex flex-col gap-3"
          style={{ borderLeftColor: "var(--color-dept-engineering)" }}
        >
          <div className="flex items-center justify-between">
            <span className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {b.template_id}
            </span>
            <StatusPill status={b.status} />
          </div>
          <div className="cx-type-md font-medium leading-snug">{b.build_name}</div>
          {b.live_url ? (
            <a
              href={b.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] inline-flex items-center gap-1 truncate"
            >
              {b.live_url}
              <ExternalLink size={11} />
            </a>
          ) : b.error_message ? (
            <p className="text-xs text-[var(--color-pink)]">{b.error_message}</p>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)]">Building…</p>
          )}
          <div className="flex items-center justify-between cx-type-xs text-[var(--color-text-muted)] mt-auto pt-2">
            <span className="cx-mono tabular-nums">{new Date(b.created_at).toLocaleString()}</span>
            {b.conversation_id && (
              <Link
                href={`/app?c=${b.conversation_id}`}
                className="hover:text-[var(--color-text)]"
              >
                Open chat →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EngineeringTab({
  sessions,
  onContinue,
}: {
  sessions: EngSession[];
  onContinue: (parent: EngSession) => void;
}) {
  if (sessions.length === 0) {
    return (
      <div className="conduit-card p-8 max-w-md">
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Nothing built yet
        </div>
        <p className="text-[var(--color-text)] mb-4">
          Open Engineering and click <span className="font-medium">Start a build</span>.
        </p>
        <Link href="/app/team/engineering" className="btn-primary btn-sz-md">
          Open Engineering →
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="conduit-card border-l-[3px] p-5 flex flex-col gap-3 text-left"
          style={{ borderLeftColor: "var(--color-dept-engineering)" }}
        >
          <Link
            href={`/app/builds/${s.id}`}
            className="flex flex-col gap-3 text-left hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center justify-between">
              <span className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {s.build_type ?? "custom"}
                {s.parent_session_id && (
                  <span className="ml-2 text-[var(--color-accent)]">
                    · continuation
                  </span>
                )}
              </span>
              <StatusPill status={s.status} />
            </div>
            <div className="cx-type-base leading-snug line-clamp-2">
              {s.prompt}
            </div>
            {s.deploy_url ? (
              <span className="text-xs text-[var(--color-accent)] inline-flex items-center gap-1 truncate">
                {s.deploy_url.replace(/^https?:\/\//, "")}
                <ExternalLink size={11} />
              </span>
            ) : s.error_message ? (
              <p className="text-xs text-[var(--color-pink)] line-clamp-2">
                {s.error_message}
              </p>
            ) : (
              <p className="text-xs text-[var(--color-text-muted)]">
                {labelForLiveStatus(s.status)}
              </p>
            )}
          </Link>
          <div className="flex items-center justify-between cx-type-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
            <span className="cx-mono tabular-nums">{new Date(s.created_at).toLocaleString()}</span>
            <span className="flex items-center gap-3">
              <span className="cx-mono tabular-nums">
                {(s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0)}t
              </span>
              {s.status === "complete" && (
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onContinue(s)}
                  title="Continue from this build (clones the workspace files)"
                >
                  Continue <ArrowRight size={10} />
                </PraxisButton>
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContinueModal({
  parent,
  onClose,
  onCreated,
}: {
  parent: EngSession;
  onClose: () => void;
  onCreated: (newSessionId: string) => void;
}) {
  const reduced = useReducedMotion();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (prompt.trim().length < 8) {
      setError("Tell Engineering what to change (8+ characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/engineering/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          buildType: parent.build_type,
          parentSessionId: parent.id,
        }),
      });
      const j = (await r.json()) as {
        session_id?: string;
        message?: string;
        error?: string;
      };
      if (!r.ok || !j.session_id) {
        setError(j.message ?? j.error ?? `error_${r.status}`);
        setSubmitting(false);
        return;
      }
      onCreated(j.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "submit_failed");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[110] cx-scrim flex items-center justify-center p-4"
      style={{ background: "var(--cx-modal-scrim, rgba(11,11,15,0.65))" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
    >
      <motion.div
        className="w-full max-w-lg cx-glass-overlay cx-glass-border rounded-[16px] p-6"
        role="dialog"
        aria-modal="true"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-1">
              Continue build
            </div>
            <p className="cx-type-base line-clamp-2">{parent.prompt}</p>
          </div>
          <PraxisButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </PraxisButton>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Engineering will start a new build with this prompt and the
          previous build&apos;s files already in place.
        </p>
        <textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should change?"
          rows={4}
          className="w-full rounded-md bg-[var(--color-card)] border border-[var(--color-border)] p-3 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          disabled={submitting}
        />
        {error && (
          <p className="text-xs text-[var(--color-pink)] mt-2">{error}</p>
        )}
        <div className="flex items-center justify-end gap-2 mt-4">
          <PraxisButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </PraxisButton>
          <Button
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? "Starting…" : "Start continuation →"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function labelForLiveStatus(s: string): string {
  switch (s) {
    case "pending":
      return "Queued";
    case "running":
      return "Running…";
    case "deploying":
      return "Deploying…";
    case "aborted":
      return "Aborted";
    default:
      return "—";
  }
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: "var(--color-text-muted)", label: "Pending" },
    queued: { color: "var(--color-text-muted)", label: "Queued" },
    building: { color: "var(--color-amber)", label: "Building" },
    running: { color: "var(--color-amber)", label: "Running" },
    deploying: { color: "var(--color-amber)", label: "Deploying" },
    live: { color: "var(--color-green)", label: "Live" },
    complete: { color: "var(--color-green)", label: "Live" },
    failed: { color: "var(--color-pink)", label: "Failed" },
    timeout: { color: "var(--color-pink)", label: "Timed out" },
    aborted: { color: "var(--color-text-muted)", label: "Aborted" },
    archived: { color: "var(--color-text-muted)", label: "Archived" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className="cx-type-xs uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
      style={{
        color: m.color,
        background: `color-mix(in srgb, ${m.color} 14%, transparent)`,
        border: `1px solid color-mix(in srgb, ${m.color} 28%, transparent)`,
      }}
    >
      {m.label}
    </span>
  );
}
