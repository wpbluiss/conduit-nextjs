import Link from "next/link";
import { Building2, Clock, ClipboardList, ArrowRight } from "lucide-react";
import { EMPLOYEES } from "@/lib/conduit/employees";

const SOPS: { title: string; status: "draft" | "ready" | "active"; updated: string }[] = [
  { title: "Client onboarding", status: "active", updated: "2 weeks ago" },
  { title: "Weekly business review", status: "ready", updated: "1 month ago" },
  { title: "Incident response", status: "draft", updated: "Not started" },
  { title: "Quarterly planning", status: "draft", updated: "Not started" },
];

const VENDORS: { name: string; service: string; renewsInDays: number }[] = [
  { name: "Stripe", service: "Payments", renewsInDays: 47 },
  { name: "Notion", service: "Workspace", renewsInDays: 12 },
  { name: "Slack", service: "Comms", renewsInDays: 89 },
];

function statusColor(s: "draft" | "ready" | "active") {
  if (s === "active") return "var(--color-green)";
  if (s === "ready") return "var(--color-amber)";
  return "var(--color-text-muted)";
}

export default function OpsWorkspace() {
  const dept = EMPLOYEES.ops.color;
  const deptSoft = EMPLOYEES.ops.colorSoft;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* SOP list */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <ClipboardList size={11} /> Standard procedures
          </div>
          <Link
            href={`/app?pin=ops&prompt=${encodeURIComponent("Build an SOP for client onboarding")}`}
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: dept }}
          >
            New SOP →
          </Link>
        </div>
        <ul className="space-y-2">
          {SOPS.map((sop) => (
            <li
              key={sop.title}
              className="conduit-card border-l-[3px] px-4 py-3"
              style={{
                borderLeftColor: statusColor(sop.status),
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-[var(--color-text)] truncate">
                    {sop.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">
                    {sop.updated}
                  </div>
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
                  style={{
                    color: statusColor(sop.status),
                    background: `color-mix(in srgb, ${statusColor(sop.status)} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor(sop.status)} 28%, transparent)`,
                  }}
                >
                  {sop.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Vendor renewal countdown */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <Building2 size={11} /> Vendor renewals
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            {VENDORS.length} tracked
          </span>
        </div>
        <ul className="space-y-2">
          {VENDORS.map((v) => {
            const urgent = v.renewsInDays <= 14;
            return (
              <li
                key={v.name}
                className="conduit-card px-4 py-3 flex items-center justify-between gap-3"
                style={{
                  borderColor: urgent
                    ? "color-mix(in srgb, var(--color-amber) 35%, transparent)"
                    : undefined,
                }}
              >
                <div className="min-w-0">
                  <div className="text-sm text-[var(--color-text)]">
                    {v.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">
                    {v.service}
                  </div>
                </div>
                <div
                  className="text-right shrink-0"
                  style={{
                    color: urgent ? "var(--color-amber)" : "var(--color-text)",
                  }}
                >
                  <div className="serif text-2xl leading-none flex items-baseline gap-1 justify-end">
                    {v.renewsInDays}
                    <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                      d
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5 inline-flex items-center gap-1">
                    <Clock size={9} /> until renew
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <div
          className="conduit-card p-3 mt-3 text-xs text-[var(--color-text-muted)]"
          style={{ background: deptSoft }}
        >
          Scaffold — Ops will track real renewals once you point it at your
          finance + procurement tools.
        </div>
      </div>

      <div className="md:col-span-2">
        <Link
          href={`/app?pin=ops&prompt=${encodeURIComponent("Run the weekly business review")}`}
          className="conduit-card border-l-[3px] px-4 py-3 flex items-center justify-between hover:border-[var(--color-accent)] transition-colors"
          style={{ borderLeftColor: dept }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Weekly cadence
            </div>
            <div className="text-sm text-[var(--color-text)] mt-0.5">
              Run the weekly business review
            </div>
          </div>
          <ArrowRight size={14} style={{ color: dept }} />
        </Link>
      </div>
    </section>
  );
}
