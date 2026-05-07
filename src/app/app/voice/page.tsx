import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, Lock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateAccount } from "@/lib/conduit/account";
import { tierById } from "@/lib/billing/tiers";
import { readVoiceCeilings } from "@/lib/voice/config";
import {
  EMPLOYEE_ORDER,
  EMPLOYEES,
  type EmployeeId,
} from "@/lib/conduit/employees";
import { EmployeeAvatar } from "@/components/conduit/EmployeeBadge";

export const dynamic = "force-dynamic";

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
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

export default async function VoiceRoomLanding() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/app/voice");

  const account = await getOrCreateAccount(supabase, user);
  const tier = tierById(account.tier_id);
  const internal = Boolean(account.internal_account);
  const ttsAllowed = internal || account.tier_id !== "free";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const ceilings = await readVoiceCeilings(supabase);

  const [todaySessionsQ, recentSessionsQ] = await Promise.all([
    supabase
      .from("conduit_voice_sessions")
      .select("duration_seconds")
      .eq("account_id", account.id)
      .gte("started_at", todayStart.toISOString())
      .not("duration_seconds", "is", null),
    supabase
      .from("conduit_voice_sessions")
      .select("id, employee, started_at, duration_seconds")
      .eq("account_id", account.id)
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const usedToday = (todaySessionsQ.data ?? []).reduce(
    (sum, s) => sum + ((s.duration_seconds as number | null) ?? 0),
    0,
  );
  const usedTodayMin = Math.floor(usedToday / 60);

  const recent = (recentSessionsQ.data ?? []) as Array<{
    id: string;
    employee: string;
    started_at: string;
    duration_seconds: number | null;
  }>;

  const allowed = (
    internal ? EMPLOYEE_ORDER : tier.allowedEmployees
  ) as EmployeeId[];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Praxis Console · Voice Room
          </p>
          <h1 className="serif text-4xl md:text-5xl mt-2 inline-flex items-center gap-3">
            <Mic className="text-[var(--color-accent)]" size={32} />
            Voice Room
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)] max-w-xl">
            Talk to your team like a Zoom call. Pick an employee to start a
            session.
          </p>
        </div>

        {!ttsAllowed && (
          <div className="conduit-card p-5 mb-6 inline-flex items-center gap-3 max-w-xl">
            <Lock size={14} className="text-[var(--color-accent-hi)]" />
            <div>
              <div className="text-sm">Voice mode is a Pro perk</div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Free accounts can still use voice <em>input</em> in chat.{" "}
                <Link
                  href="/app/settings/billing"
                  className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
                >
                  Upgrade
                </Link>{" "}
                to hear the team speak back.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          <div className="conduit-card p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Today
            </div>
            <div className="serif text-3xl mt-2">
              {usedTodayMin}{" "}
              <span className="text-base text-[var(--color-text-muted)]">
                / {ceilings.dailyMinutes} min
              </span>
            </div>
            <div className="h-1.5 mt-3 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-[var(--color-accent)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (usedTodayMin / Math.max(1, ceilings.dailyMinutes)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
              Daily cap resets at midnight
            </div>
          </div>
          <div className="conduit-card p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Per-session cap
            </div>
            <div className="serif text-3xl mt-2">
              {Math.floor(ceilings.maxSeconds / 60)} min
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)] mt-1.5">
              You&apos;ll hear a soft warning at{" "}
              {Math.floor(ceilings.warnSeconds / 60)} min
            </div>
          </div>
          <div className="conduit-card p-5">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Voice settings
            </div>
            <p className="text-[12px] mt-2 text-[var(--color-text-muted)]">
              Per-employee voices, auto-play, streaming.
            </p>
            <Link
              href="/app/settings/voice"
              className="mt-3 inline-flex items-center gap-1 text-[12px] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
            >
              Manage →
            </Link>
          </div>
        </div>

        {/* Pick an employee */}
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Talk to
          </h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Click to open the workspace + start voice
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {(EMPLOYEE_ORDER as EmployeeId[]).map((emp) => {
            const meta = EMPLOYEES[emp];
            const isAllowed = allowed.includes(emp);
            return (
              <Link
                key={emp}
                href={isAllowed ? `/app/team/${emp}` : "/app/settings/billing"}
                className={`conduit-card border-l-[3px] p-4 transition-colors flex items-center gap-3 ${
                  isAllowed
                    ? "hover:border-[var(--color-accent)]"
                    : "opacity-60"
                }`}
                style={{ borderLeftColor: meta.color }}
              >
                <EmployeeAvatar employee={emp} size={32} />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: meta.color }}
                  >
                    {meta.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] truncate">
                    {meta.role}
                  </div>
                </div>
                {!isAllowed && (
                  <Lock size={12} className="text-[var(--color-text-muted)]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Recent sessions */}
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Recent sessions
          </h2>
          <Link
            href="/app/settings/voice-history"
            className="text-[10px] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
          >
            See full history →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-muted)] mt-2">
            No voice sessions yet. Pick an employee above to start your first
            room.
          </p>
        ) : (
          <ul className="space-y-2">
            {recent.map((s) => {
              const empKey = (
                EMPLOYEE_ORDER as string[]
              ).includes(s.employee)
                ? (s.employee as EmployeeId)
                : "jarvis";
              const meta = EMPLOYEES[empKey];
              return (
                <li
                  key={s.id}
                  className="conduit-card border-l-[3px] px-4 py-3 flex items-center gap-3"
                  style={{ borderLeftColor: meta.color }}
                >
                  <EmployeeAvatar employee={empKey} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm" style={{ color: meta.color }}>
                      {meta.name}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                      {fmtDuration(s.duration_seconds ?? 0)} ·{" "}
                      {relativeTime(s.started_at)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
