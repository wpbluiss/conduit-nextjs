import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone, Sparkles } from "lucide-react";
import { EMPLOYEES } from "@/lib/conduit/employees";

interface MarketingSession {
  id: string;
  prompt: string;
  status: string;
  created_at: string;
  output_urls?: unknown;
}

function relativeDay(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const d = Math.round(diff / (1000 * 60 * 60 * 24));
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.round(d / 7)}w ago`;
  return new Date(iso).toLocaleDateString();
}

const CHANNEL_HINTS: { label: string; ch: string }[] = [
  { label: "Blog", ch: "B" },
  { label: "Email", ch: "@" },
  { label: "Social", ch: "S" },
  { label: "Ads", ch: "A" },
  { label: "PR", ch: "P" },
];

export default function MarketingWorkspace({
  recent,
}: {
  recent: MarketingSession[];
}) {
  const dept = EMPLOYEES.marketing.color;
  const deptSoft = EMPLOYEES.marketing.colorSoft;

  // Generate a 7-day strip from today. Each day shows a single planned
  // channel as a scaffold until a real content_calendar table exists.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      iso: d.toISOString().slice(0, 10),
      dow: d.toLocaleDateString(undefined, { weekday: "short" }),
      dom: d.getDate(),
      isToday: i === 0,
      planned: CHANNEL_HINTS[i % CHANNEL_HINTS.length],
    };
  });

  return (
    <section className="space-y-6">
      {/* Content calendar — 7-day strip */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <CalendarDays size={11} /> Content calendar · next 7 days
          </div>
          <Link
            href={`/app?pin=marketing&prompt=${encodeURIComponent("Plan the week of content")}`}
            className="cx-type-xs uppercase tracking-[0.15em]"
            style={{ color: dept }}
          >
            Plan the week →
          </Link>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {week.map((d) => (
            <div
              key={d.iso}
              className="conduit-card p-2.5 flex flex-col items-center text-center"
              style={{
                borderColor: d.isToday
                  ? `color-mix(in srgb, ${dept} 45%, transparent)`
                  : undefined,
                background: d.isToday ? deptSoft : undefined,
              }}
            >
              <span className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                {d.dow}
              </span>
              <span className="serif text-lg leading-none mt-1">{d.dom}</span>
              <span
                className="mt-2 inline-flex items-center justify-center w-6 h-6 rounded-md cx-type-xs font-medium"
                style={{ background: deptSoft, color: dept }}
                title={d.planned.label}
              >
                {d.planned.ch}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 cx-type-xs text-[var(--color-text-muted)]">
          Scaffold — pin a real plan with Marketing and it&apos;ll replace these
          channel hints.
        </p>
      </div>

      {/* Recent posts */}
      <div>
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-3 inline-flex items-center gap-1.5">
          <Megaphone size={11} /> Recent posts
        </div>
        {recent.length === 0 ? (
          <div
            className="conduit-card p-5"
            style={{
              background: `linear-gradient(180deg, ${deptSoft}, transparent 70%)`,
            }}
          >
            <p className="text-sm text-[var(--color-text)] mb-3">
              No posts shipped yet. Marketing can draft your first blog post,
              a launch email, or a 30-day calendar — all from a single brief.
            </p>
            <Link
              href={`/app?pin=marketing&prompt=${encodeURIComponent("Draft a launch announcement")}`}
              className="inline-flex items-center gap-1 text-sm"
              style={{ color: dept }}
            >
              <Sparkles size={13} /> Draft a launch post
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app/builds?session=${s.id}`}
                  className="conduit-card border-l-[3px] px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-colors"
                  style={{ borderLeftColor: dept }}
                >
                  <div className="min-w-0">
                    <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      {s.status} · {relativeDay(s.created_at)}
                    </div>
                    <div className="text-sm text-[var(--color-text)] line-clamp-1">
                      {s.prompt}
                    </div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-[var(--color-text-muted)]"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
