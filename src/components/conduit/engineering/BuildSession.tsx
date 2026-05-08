"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  FileCode,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SessionStatus =
  | "pending"
  | "running"
  | "deploying"
  | "complete"
  | "failed"
  | "timeout";

export interface SessionRow {
  id: string;
  prompt: string;
  build_type: string | null;
  status: SessionStatus;
  deploy_url: string | null;
  github_repo: string | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface LogRow {
  id: string;
  ts: string;
  level: "info" | "stdout" | "stderr" | "system";
  message: string;
}

interface Props {
  sessionId: string;
  onClose: () => void;
  // history mode skips realtime subscription (still subscribes, but session is
  // already terminal so it's mostly a no-op) and starts with backfilled logs.
  initialSession?: SessionRow | null;
  initialLogs?: LogRow[];
}

const TERMINAL_RENDER_CAP = 1000;
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function BuildSession({
  sessionId,
  onClose,
  initialSession = null,
  initialLogs = [],
}: Props) {
  const [session, setSession] = useState<SessionRow | null>(initialSession);
  const [logs, setLogs] = useState<LogRow[]>(initialLogs);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

  // Backfill if we weren't seeded.
  useEffect(() => {
    if (initialSession && initialLogs.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/engineering/session/${sessionId}`);
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(j.error ?? `fetch_${r.status}`);
          return;
        }
        const j = (await r.json()) as { session: SessionRow; logs: LogRow[] };
        if (cancelled) return;
        setSession(j.session);
        setLogs(j.logs ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "fetch_failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, initialSession, initialLogs.length]);

  // Realtime subscription — postgres_changes on logs + session.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`engineering:${sessionId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "conduit_engineering_logs",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: { new: LogRow }) => {
          setLogs((prev) => [...prev, payload.new]);
        },
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "conduit_engineering_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: { new: SessionRow }) => {
          setSession(payload.new);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Auto-scroll terminal to bottom on new log.
  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  const files = useMemo(() => {
    // Build a flat sorted list of files claude has touched.
    const seen = new Map<string, "write" | "edit">();
    for (const log of logs) {
      if (log.level !== "system") continue;
      const m = log.message.match(/^(WRITE|EDIT)\s+(.+)$/);
      if (!m) continue;
      const kind = m[1] === "WRITE" ? "write" : "edit";
      const path = m[2].trim();
      if (!seen.has(path) || kind === "write") seen.set(path, kind);
    }
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [logs]);

  const status: SessionStatus = session?.status ?? "pending";
  const statusLabel = labelForStatus(status);
  const elapsed = useElapsed(session?.started_at, session?.completed_at);
  const tokensIn = session?.total_input_tokens ?? 0;
  const tokensOut = session?.total_output_tokens ?? 0;

  const visibleLogs =
    logs.length > TERMINAL_RENDER_CAP
      ? logs.slice(logs.length - TERMINAL_RENDER_CAP)
      : logs;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--color-border)]">
        <div className="min-w-0 flex items-center gap-3">
          <span
            className="inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: colorForStatus(status),
              background: `color-mix(in srgb, ${colorForStatus(status)} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${colorForStatus(status)} 28%, transparent)`,
            }}
          >
            {status === "running" || status === "deploying" || status === "pending" ? (
              <Loader2 size={11} className="animate-spin" />
            ) : status === "complete" ? (
              <CheckCircle2 size={11} />
            ) : (
              <AlertTriangle size={11} />
            )}
            {statusLabel}
          </span>
          <span className="serif text-base truncate text-[var(--color-text)]">
            {session?.prompt ?? "Build session"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[var(--color-card-hover)] text-[var(--color-text-muted)]"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] min-h-0">
        {/* Left: files */}
        <aside className="hidden lg:flex flex-col border-r border-[var(--color-border)] overflow-y-auto">
          <div className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] sticky top-0 bg-[var(--color-bg)]">
            Files ({files.length})
          </div>
          {files.length === 0 ? (
            <p className="px-4 text-xs text-[var(--color-text-muted)]">
              Files claude touches will appear here.
            </p>
          ) : (
            <ul className="px-2 pb-4 space-y-px">
              {files.map(([path, kind]) => (
                <li
                  key={path}
                  className="px-2 py-1 rounded text-xs flex items-center gap-2 truncate"
                  style={{
                    color: kind === "write" ? "var(--color-text)" : "var(--color-text-muted)",
                  }}
                  title={path}
                >
                  <FileCode size={11} className="shrink-0 opacity-70" />
                  <span className="truncate">{path}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Center: terminal */}
        <section className="flex flex-col min-w-0 bg-[#08090b]">
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed"
            style={{ color: "#d2d6dc" }}
          >
            {error && (
              <div className="text-[#ff8a92] mb-2">[error] {error}</div>
            )}
            {logs.length === 0 && !error && (
              <div className="text-[#6b7380]">Waiting for the worker…</div>
            )}
            {visibleLogs.map((log) => (
              <div key={log.id} className="whitespace-pre-wrap break-words">
                <span className="text-[#586374] select-none mr-2">
                  {TIME_FMT.format(new Date(log.ts))}
                </span>
                <span style={{ color: colorForLevel(log.level) }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Right: status */}
        <aside className="hidden lg:flex flex-col border-l border-[var(--color-border)]">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Step
            </div>
            <div className="serif text-2xl mt-1" style={{ color: colorForStatus(status) }}>
              {statusLabel}
            </div>
            {session?.error_message && (
              <p className="mt-2 text-xs text-[var(--color-pink)] break-words">
                {session.error_message}
              </p>
            )}
          </div>

          <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-[var(--color-border)]">
            <Stat label="Elapsed" value={elapsed} />
            <Stat label="Files" value={String(files.length)} />
            <Stat label="In tokens" value={fmtTokens(tokensIn)} />
            <Stat label="Out tokens" value={fmtTokens(tokensOut)} />
          </div>

          <div className="px-5 py-4 space-y-2">
            {session?.deploy_url ? (
              <a
                href={session.deploy_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary !w-full !justify-center"
              >
                Open preview <ExternalLink size={13} />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="btn-primary !w-full !justify-center opacity-40 cursor-not-allowed"
              >
                Open preview
              </button>
            )}
            {session?.github_repo && (
              <a
                href={session.github_repo}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                View repo →
              </a>
            )}
          </div>

          <div className="mt-auto px-5 py-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              Minimize
            </button>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 leading-snug">
              Build keeps running. Reopen any time from{" "}
              <span className="text-[var(--color-text)]">Builds</span>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}

function useElapsed(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (completedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [completedAt]);
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : now;
  const sec = Math.max(0, Math.round((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

function labelForStatus(s: SessionStatus): string {
  switch (s) {
    case "pending":
      return "Queued";
    case "running":
      return "Building";
    case "deploying":
      return "Deploying";
    case "complete":
      return "Live";
    case "failed":
      return "Failed";
    case "timeout":
      return "Timed out";
  }
}

function colorForStatus(s: SessionStatus): string {
  switch (s) {
    case "pending":
      return "var(--color-text-muted)";
    case "running":
    case "deploying":
      return "var(--color-amber)";
    case "complete":
      return "var(--color-green)";
    case "failed":
    case "timeout":
      return "var(--color-pink)";
  }
}

function colorForLevel(level: LogRow["level"]): string {
  switch (level) {
    case "stderr":
      return "#ff9aa2";
    case "system":
      return "#7ad8a8";
    case "info":
      return "#9ec5ff";
    case "stdout":
    default:
      return "#d2d6dc";
  }
}
