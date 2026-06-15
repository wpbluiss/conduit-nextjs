import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { EMPLOYEES } from "@/lib/conduit/employees";

interface Framework {
  id: string;
  name: string;
  blurb: string;
  total: number;
  done: number;
  highlights: { label: string; done: boolean }[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: "hipaa",
    name: "HIPAA",
    blurb: "Health information privacy & security.",
    total: 18,
    done: 4,
    highlights: [
      { label: "Privacy notice published", done: true },
      { label: "Risk assessment complete", done: true },
      { label: "BAA templates", done: false },
      { label: "Workforce training", done: false },
    ],
  },
  {
    id: "soc2",
    name: "SOC 2",
    blurb: "Security, availability, and confidentiality controls.",
    total: 64,
    done: 21,
    highlights: [
      { label: "Access control policy", done: true },
      { label: "Change management", done: true },
      { label: "Vendor risk reviews", done: false },
      { label: "Continuous monitoring", done: false },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR",
    blurb: "EU data protection & subject rights.",
    total: 12,
    done: 6,
    highlights: [
      { label: "Lawful basis documented", done: true },
      { label: "DPA in place", done: true },
      { label: "DSAR workflow", done: false },
      { label: "Records of processing", done: false },
    ],
  },
];

export default function ComplianceWorkspace() {
  const dept = EMPLOYEES.compliance.color;
  const deptSoft = EMPLOYEES.compliance.colorSoft;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
          <ShieldCheck size={11} /> Framework readiness
        </div>
        <Link
          href={`/app?pin=compliance&prompt=${encodeURIComponent("What regulations apply to my business?")}`}
          className="cx-type-xs uppercase tracking-[0.15em]"
          style={{ color: dept }}
        >
          Pick the right framework →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FRAMEWORKS.map((f) => {
          const pct = Math.round((f.done / f.total) * 100);
          return (
            <Link
              key={f.id}
              href={`/app?pin=compliance&prompt=${encodeURIComponent(
                `Walk me through ${f.name} readiness`,
              )}`}
              className="conduit-card border-l-[3px] p-5 flex flex-col gap-3 hover:border-[var(--color-accent)] transition-colors"
              style={{ borderLeftColor: dept }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="serif text-2xl">{f.name}</div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {f.blurb}
                  </p>
                </div>
                <span className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  {f.done}/{f.total}
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: dept,
                  }}
                />
              </div>
              <div className="cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                {pct}% scaffolded
              </div>

              <ul className="space-y-1.5 text-xs">
                {f.highlights.map((h) => (
                  <li
                    key={h.label}
                    className="flex items-center gap-2 leading-tight"
                  >
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background: h.done
                          ? "var(--color-green)"
                          : "var(--color-text-muted)",
                        opacity: h.done ? 0.85 : 0.4,
                      }}
                      aria-hidden
                    />
                    <span
                      className={
                        h.done
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)]"
                      }
                    >
                      {h.label}
                    </span>
                  </li>
                ))}
              </ul>

              <span
                className="cx-type-xs uppercase tracking-[0.15em] inline-flex items-center gap-1 mt-auto"
                style={{ color: dept }}
              >
                Open framework <ArrowRight size={10} />
              </span>
            </Link>
          );
        })}
      </div>

      <div
        className="conduit-card p-3 text-xs text-[var(--color-text-muted)]"
        style={{ background: deptSoft }}
      >
        Scaffolds — Compliance keeps track of evidence and policy state once you
        connect a control source. Until then, these are starter checklists.
      </div>
    </section>
  );
}
