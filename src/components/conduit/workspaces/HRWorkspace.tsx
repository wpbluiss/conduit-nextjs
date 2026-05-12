import Link from "next/link";
import { ArrowRight, Briefcase, Users2 } from "lucide-react";
import { EMPLOYEES } from "@/lib/conduit/employees";

const PIPELINE: { stage: string; count: number }[] = [
  { stage: "Applied", count: 47 },
  { stage: "Screened", count: 18 },
  { stage: "Interviewing", count: 6 },
  { stage: "Offer", count: 1 },
];

const ROLES: {
  title: string;
  team: string;
  location: string;
  applicants: number;
  status: "open" | "drafting";
}[] = [
  {
    title: "Founding Designer",
    team: "Product",
    location: "Remote · US",
    applicants: 23,
    status: "open",
  },
  {
    title: "Senior Engineer",
    team: "Engineering",
    location: "Remote · US",
    applicants: 19,
    status: "open",
  },
  {
    title: "Sales Lead",
    team: "GTM",
    location: "Remote",
    applicants: 5,
    status: "drafting",
  },
];

export default function HRWorkspace() {
  const dept = EMPLOYEES.hr.color;
  const deptSoft = EMPLOYEES.hr.colorSoft;
  const maxCount = Math.max(...PIPELINE.map((p) => p.count));

  return (
    <section className="space-y-6">
      {/* Pipeline funnel */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <Users2 size={11} /> Hiring pipeline
          </div>
          <Link
            href={`/app?pin=hr&prompt=${encodeURIComponent("Walk me through this week's pipeline")}`}
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: dept }}
          >
            Review pipeline →
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PIPELINE.map((p, idx) => {
            const pct = Math.round((p.count / maxCount) * 100);
            return (
              <div
                key={p.stage}
                className="conduit-card p-3 flex flex-col items-center text-center"
                style={{
                  borderColor:
                    idx === PIPELINE.length - 1
                      ? `color-mix(in srgb, ${dept} 45%, transparent)`
                      : undefined,
                  background:
                    idx === PIPELINE.length - 1 ? deptSoft : undefined,
                }}
              >
                <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  {p.stage}
                </span>
                <span className="serif text-3xl leading-none mt-2">
                  {p.count}
                </span>
                <div className="mt-3 w-full h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: dept,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open roles */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <Briefcase size={11} /> Open roles
          </div>
          <Link
            href={`/app?pin=hr&prompt=${encodeURIComponent("Open a new role — draft the job description")}`}
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: dept }}
          >
            Open a role →
          </Link>
        </div>
        <ul className="space-y-2">
          {ROLES.map((r) => (
            <li key={r.title}>
              <Link
                href={`/app?pin=hr&prompt=${encodeURIComponent(`Update the ${r.title} role`)}`}
                className="conduit-card border-l-[3px] px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-colors"
                style={{
                  borderLeftColor:
                    r.status === "open" ? dept : "var(--color-text-muted)",
                }}
              >
                <div className="min-w-0">
                  <div className="text-sm text-[var(--color-text)]">
                    {r.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">
                    {r.team} · {r.location}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="serif text-xl leading-none">
                    {r.applicants}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">
                    {r.status === "open" ? "applicants" : "drafting"}
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
        <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
          Scaffold — HR will reflect real pipeline data once you connect your
          ATS or just describe a role to start.
        </p>
      </div>
    </section>
  );
}
