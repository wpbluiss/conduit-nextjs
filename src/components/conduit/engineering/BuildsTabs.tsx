"use client";

// Two-tab shell for /app/builds. Left tab preserves R7 (templates) cards
// exactly. Right tab is the new R15 engineering sessions list — only loaded
// for internal_account users for v1, others see an early-access notice.

import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import BuildSession from "./BuildSession";

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
    | "timeout";
  deploy_url: string | null;
  github_repo: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Props {
  r7Builds: R7Build[];
  engSessions: EngSession[];
  internal: boolean;
}

export default function BuildsTabs({ r7Builds, engSessions, internal }: Props) {
  // Default the tab to whichever has rows; if both empty, default to templates
  // for non-internal users and engineering for internal.
  const defaultTab: "templates" | "engineering" =
    internal && engSessions.length > 0
      ? "engineering"
      : "templates";
  const [tab, setTab] = useState<"templates" | "engineering">(defaultTab);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] mb-6 -mt-2">
        <Tab
          active={tab === "templates"}
          onClick={() => setTab("templates")}
          label="R7 Templates"
          count={r7Builds.length}
        />
        <Tab
          active={tab === "engineering"}
          onClick={() => setTab("engineering")}
          label="Engineering Builds"
          count={internal ? engSessions.length : null}
          badge={internal ? null : "Early access"}
        />
      </div>

      {tab === "templates" ? (
        <TemplatesTab builds={r7Builds} />
      ) : (
        <EngineeringTab
          sessions={engSessions}
          internal={internal}
          onOpen={setActiveSessionId}
        />
      )}

      {activeSessionId && (
        <BuildSession
          sessionId={activeSessionId}
          onClose={() => setActiveSessionId(null)}
        />
      )}
    </>
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
        <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)]">
          {count}
        </span>
      )}
      {badge && (
        <span className="ml-2 text-[9px] uppercase tracking-[0.15em] text-[var(--color-accent-hi)]">
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
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Nothing shipped yet
        </div>
        <p className="text-[var(--color-text)] mb-4">
          Ask Engineering for a landing page, CRM, blog, lead-capture page, or
          contact form.
        </p>
        <Link href="/app" className="btn-primary">
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
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {b.template_id}
            </span>
            <StatusPill status={b.status} />
          </div>
          <div className="serif text-lg leading-snug">{b.build_name}</div>
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
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-auto pt-2">
            <span>{new Date(b.created_at).toLocaleString()}</span>
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
  internal,
  onOpen,
}: {
  sessions: EngSession[];
  internal: boolean;
  onOpen: (id: string) => void;
}) {
  if (!internal) {
    return (
      <div className="conduit-card p-6 max-w-md">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-2">
          Early access
        </div>
        <p className="text-[var(--color-text)] mb-2">
          Real-execution engineering builds are in private beta.
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Templates (the other tab) ship today on every plan.
        </p>
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <div className="conduit-card p-8 max-w-md">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
          Nothing built yet
        </div>
        <p className="text-[var(--color-text)] mb-4">
          Open Engineering and click <span className="font-medium">Start a build</span>.
        </p>
        <Link href="/app/team/engineering" className="btn-primary">
          Open Engineering →
        </Link>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sessions.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onOpen(s.id)}
          className="conduit-card border-l-[3px] p-5 flex flex-col gap-3 text-left hover:border-[var(--color-accent)] transition-colors"
          style={{ borderLeftColor: "var(--color-dept-engineering)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {s.build_type ?? "custom"}
            </span>
            <StatusPill status={s.status} />
          </div>
          <div className="serif text-base leading-snug line-clamp-2">
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
          <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] mt-auto pt-2">
            <span>{new Date(s.created_at).toLocaleString()}</span>
            <span>
              {(s.total_input_tokens ?? 0) + (s.total_output_tokens ?? 0)}t
            </span>
          </div>
        </button>
      ))}
    </div>
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
    archived: { color: "var(--color-text-muted)", label: "Archived" },
  };
  const m = map[status] ?? map.pending;
  return (
    <span
      className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
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
