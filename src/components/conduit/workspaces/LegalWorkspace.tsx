import Link from "next/link";
import { ArrowRight, AlertTriangle, ScrollText } from "lucide-react";
import { EMPLOYEES } from "@/lib/conduit/employees";

const CONTRACTS: {
  title: string;
  counterparty: string;
  status: "draft" | "signed" | "active" | "expired";
  signedAgo: string;
}[] = [
  {
    title: "Customer MSA",
    counterparty: "Lunaro",
    status: "active",
    signedAgo: "3 months ago",
  },
  {
    title: "Mutual NDA",
    counterparty: "Greenfield Partners",
    status: "signed",
    signedAgo: "5 weeks ago",
  },
  {
    title: "Contractor agreement",
    counterparty: "Quinn (Design)",
    status: "draft",
    signedAgo: "Drafted yesterday",
  },
];

const EXPIRING: { title: string; counterparty: string; daysLeft: number }[] = [
  { title: "Hosting contract", counterparty: "Vercel", daysLeft: 18 },
  { title: "Software license", counterparty: "Figma", daysLeft: 5 },
];

function statusColor(s: "draft" | "signed" | "active" | "expired") {
  if (s === "active") return "var(--color-green)";
  if (s === "signed") return "var(--color-praxis-blue)";
  if (s === "expired") return "var(--color-pink)";
  return "var(--color-text-muted)";
}

export default function LegalWorkspace() {
  const dept = EMPLOYEES.legal.color;
  const deptSoft = EMPLOYEES.legal.colorSoft;

  return (
    <section className="space-y-6">
      {/* Expiring documents banner */}
      <div
        className="conduit-card border-l-[3px] p-4 flex items-start gap-3"
        style={{
          borderLeftColor: "var(--color-amber)",
          background:
            "color-mix(in srgb, var(--color-amber) 6%, transparent)",
        }}
      >
        <AlertTriangle
          size={16}
          className="shrink-0 mt-0.5"
          style={{ color: "var(--color-amber)" }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-[var(--color-text)]">
            {EXPIRING.length} documents expire in the next 30 days
          </div>
          <ul className="mt-2 space-y-1">
            {EXPIRING.map((e) => (
              <li
                key={e.title}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-[var(--color-text)]">
                  {e.title}{" "}
                  <span className="text-[var(--color-text-muted)]">
                    · {e.counterparty}
                  </span>
                </span>
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{
                    color:
                      e.daysLeft <= 7
                        ? "var(--color-pink)"
                        : "var(--color-amber)",
                  }}
                >
                  {e.daysLeft}d
                </span>
              </li>
            ))}
          </ul>
          <Link
            href={`/app?pin=legal&prompt=${encodeURIComponent("Review the contracts expiring this month")}`}
            className="mt-3 inline-flex items-center gap-1 text-xs"
            style={{ color: "var(--color-amber)" }}
          >
            Review expiring docs <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Contract list */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] inline-flex items-center gap-1.5">
            <ScrollText size={11} /> Contract library
          </div>
          <Link
            href={`/app?pin=legal&prompt=${encodeURIComponent("Draft a new service agreement")}`}
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: dept }}
          >
            Draft a contract →
          </Link>
        </div>
        <ul className="space-y-2">
          {CONTRACTS.map((c) => (
            <li key={c.title}>
              <Link
                href={`/app?pin=legal&prompt=${encodeURIComponent(`Open the ${c.title} with ${c.counterparty}`)}`}
                className="conduit-card border-l-[3px] px-4 py-3 flex items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-colors"
                style={{ borderLeftColor: statusColor(c.status) }}
              >
                <div className="min-w-0">
                  <div className="text-sm text-[var(--color-text)]">
                    {c.title}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] mt-0.5">
                    {c.counterparty} · {c.signedAgo}
                  </div>
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    color: statusColor(c.status),
                    background: `color-mix(in srgb, ${statusColor(c.status)} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor(c.status)} 28%, transparent)`,
                  }}
                >
                  {c.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div
          className="conduit-card p-3 mt-3 text-xs text-[var(--color-text-muted)]"
          style={{ background: deptSoft }}
        >
          Scaffold — Legal will track real contracts and expirations once you
          connect a doc source. Until then, draft any contract from scratch.
        </div>
      </div>
    </section>
  );
}
