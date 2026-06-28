import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { employeeById } from "@/lib/conduit/employees";
import { VoiceHistoryList } from "./VoiceHistoryList";

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

  const rawSessions: SessionRow[] = error
    ? []
    : ((data ?? []) as unknown as SessionRow[]);

  const sessions = rawSessions.map((s) => {
    const emp = employeeById(s.employee_id);
    return {
      id: s.id,
      employee_id: s.employee_id,
      started_at: s.started_at,
      duration_seconds: s.duration_seconds,
      end_reason: s.end_reason,
      transcript_summary: s.transcript_summary,
      raw_transcript: s.raw_transcript,
      employee: { name: emp.name, color: emp.color },
    };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 space-y-6">
        {/* Breadcrumb + title */}
        <div>
          <Link
            href="/app/settings"
            className="cx-type-xs text-[var(--cx-text-muted)] inline-flex items-center gap-1.5 hover:text-[var(--cx-text)] transition-colors duration-150"
          >
            <ArrowLeft size={12} strokeWidth={1.75} />
            Settings
          </Link>
          <h1 className="cx-heading-lg mt-3">Voice History</h1>
          <p className="cx-type-sm text-[var(--cx-text-muted)] mt-1">
            Your past voice conversations with Praxis specialists. Transcripts stay private to your account.
          </p>
        </div>

        {/* Session list — client component for animated cards */}
        <VoiceHistoryList sessions={sessions} />
      </div>
    </div>
  );
}
