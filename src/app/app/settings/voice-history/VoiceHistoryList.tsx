"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Mic } from "lucide-react";

interface SessionRow {
  id: string;
  employee_id: string;
  started_at: string;
  duration_seconds: number | null;
  end_reason: string | null;
  transcript_summary: string | null;
  raw_transcript: Array<{ role: string; text: string; ts?: number }> | null;
  employee: { name: string; color: string };
}

function fmtDuration(s: number | null): string {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SessionCard({ session, index }: { session: SessionRow; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasTranscript = session.raw_transcript && session.raw_transcript.length > 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
    >
      <div
        className="cx-glass cx-glass-border rounded-xl overflow-hidden"
        style={{ borderLeft: `3px solid ${session.employee.color}` }}
      >
        <div className="px-4 py-3.5">
          {/* Header row */}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="cx-type-sm font-semibold text-[var(--cx-text)]">
              {session.employee.name}
            </span>
            <span className="cx-mono cx-type-xs text-[var(--cx-text-muted)] tabular-nums">
              {fmtRelative(session.started_at)}
            </span>
            <span
              className="cx-mono cx-type-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: `color-mix(in srgb, ${session.employee.color} 12%, var(--cx-surface))`,
                color: session.employee.color,
              }}
            >
              {fmtDuration(session.duration_seconds)}
            </span>
            {session.end_reason && session.end_reason !== "user_left" && (
              <span
                className="cx-type-xs px-1.5 py-0.5 rounded-full uppercase tracking-[0.1em]"
                style={{
                  background: "color-mix(in srgb, var(--cx-warn) 10%, var(--cx-surface))",
                  color: "var(--cx-warn)",
                }}
              >
                {session.end_reason}
              </span>
            )}
          </div>

          {/* Summary */}
          {session.transcript_summary && (
            <p className="cx-type-sm text-[var(--cx-text-muted)] mt-2 leading-relaxed">
              {session.transcript_summary}
            </p>
          )}

          {/* Transcript expand toggle */}
          {hasTranscript && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="mt-2.5 inline-flex items-center gap-1.5 cx-type-xs text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] transition-colors duration-150 focus-visible:outline-none focus-visible:text-[var(--cx-text)]"
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChevronDown size={13} strokeWidth={1.75} />
              </motion.span>
              {expanded
                ? "Hide transcript"
                : `Show transcript (${session.raw_transcript!.length} turns)`}
            </button>
          )}
        </div>

        {/* Transcript panel */}
        {hasTranscript && (
          <motion.div
            initial={false}
            animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="px-4 pb-4 space-y-2 max-h-72 overflow-y-auto"
              style={{ borderTop: "1px solid var(--cx-border)" }}
            >
              <div className="pt-3" />
              {session.raw_transcript!.map((entry, i) => {
                const isUser = entry.role === "user";
                return (
                  <div key={i} className="flex gap-2.5">
                    <span
                      className="cx-mono cx-type-xs font-semibold shrink-0 mt-px"
                      style={{
                        color: isUser ? "var(--cx-text-muted)" : session.employee.color,
                        minWidth: 52,
                      }}
                    >
                      {isUser ? "You" : session.employee.name.split(" ")[0]}
                    </span>
                    <span
                      className="cx-type-xs leading-relaxed"
                      style={{ color: isUser ? "var(--cx-text-muted)" : "var(--cx-text)" }}
                    >
                      {entry.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.li>
  );
}

export function VoiceHistoryList({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="cx-glass cx-glass-border rounded-xl p-10 text-center"
      >
        <div
          className="mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "var(--cx-accent-tint)" }}
        >
          <Mic size={22} strokeWidth={1.75} style={{ color: "var(--cx-accent-bright)" }} />
        </div>
        <p className="cx-type-sm font-semibold text-[var(--cx-text)]">
          No voice conversations yet
        </p>
        <p className="cx-type-xs mt-1 text-[var(--cx-text-muted)] max-w-xs mx-auto">
          Click &ldquo;Voice Mode&rdquo; on any specialist workspace to start a conversation.
        </p>
      </motion.div>
    );
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s, i) => (
        <SessionCard key={s.id} session={s} index={i} />
      ))}
    </ul>
  );
}
