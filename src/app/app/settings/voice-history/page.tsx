import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mic } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { employeeById } from "@/lib/conduit/employees";

export const dynamic = "force-dynamic";

interface SessionRow {
  id: string;
  employee_id: string;
  room_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  end_reason: string | null;
  transcript_summary: string | null;
  raw_transcript: Array<{ role: string; text: string; ts?: number }> | null;
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

export default async function VoiceHistoryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/settings/voice-history");

  const account = await getOrCreateAccount(supabase, user);

  const { data, error } = await supabase
    .from("conduit_voice_sessions")
    .select(
      "id, employee_id, room_name, started_at, ended_at, duration_seconds, end_reason, transcript_summary, raw_transcript",
    )
    .eq("account_id", account.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const sessions: SessionRow[] = error
    ? []
    : ((data ?? []) as unknown as SessionRow[]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 space-y-6">
        <div>
          <Link
            href="/app/settings"
            className="cx-type-xs text-[var(--cx-text-muted)] inline-flex items-center gap-1 hover:text-[var(--cx-text)] transition-colors duration-150"
          >
            <ArrowLeft size={12} /> Settings
          </Link>
          <h1 className="cx-heading-2xl mt-2">Voice History</h1>
          <p className="cx-type-sm text-[var(--cx-text-muted)] mt-1">
            Your past voice conversations. Transcripts stay private to your
            account.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="conduit-card p-8 text-center text-[var(--cx-text-muted)]">
            <Mic size={20} className="mx-auto mb-3 opacity-40" style={{ color: "var(--cx-accent)" }} />
            <p className="cx-type-sm font-medium text-[var(--cx-text)]">No voice conversations yet</p>
            <p className="cx-type-xs mt-1 text-[var(--cx-text-muted)]">
              Click &ldquo;Voice Mode&rdquo; on any employee workspace to start one.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const employee = employeeById(s.employee_id);
              return (
                <li
                  key={s.id}
                  className="conduit-card border-l-[3px] px-4 py-3"
                  style={{ borderLeftColor: employee.color }}
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="cx-type-sm font-medium text-[var(--cx-text)]">{employee.name}</span>
                    <span className="cx-mono cx-type-xs uppercase tracking-[0.15em] text-[var(--cx-text-muted)] tabular-nums">
                      {fmtRelative(s.started_at)} · {fmtDuration(s.duration_seconds)}
                    </span>
                    {s.end_reason && s.end_reason !== "user_left" && (
                      <span className="cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-text-muted)]">
                        ended: {s.end_reason}
                      </span>
                    )}
                  </div>
                  {s.transcript_summary && (
                    <p className="cx-type-sm text-[var(--cx-text-muted)] mt-1.5 leading-relaxed">
                      {s.transcript_summary}
                    </p>
                  )}
                  {s.raw_transcript && s.raw_transcript.length > 0 && (
                    <details className="mt-2">
                      <summary className="cx-type-xs text-[var(--cx-text-muted)] cursor-pointer hover:text-[var(--cx-text)] transition-colors duration-150">
                        Show full transcript ({s.raw_transcript.length} turns)
                      </summary>
                      <div className="mt-2 space-y-1 cx-type-xs max-h-64 overflow-y-auto pl-2 border-l border-[var(--cx-border)]">
                        {s.raw_transcript.map((entry, i) => (
                          <div
                            key={i}
                            className={
                              entry.role === "user"
                                ? "text-[var(--cx-text-muted)]"
                                : "text-[var(--cx-text)]"
                            }
                          >
                            <span className="cx-type-xs uppercase tracking-[0.12em] mr-2 text-[var(--cx-text-muted)]">
                              {entry.role === "user" ? "You" : employee.name}
                            </span>
                            {entry.text}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
