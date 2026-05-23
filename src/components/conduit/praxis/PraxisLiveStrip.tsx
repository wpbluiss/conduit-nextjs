"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";

interface Props {
  /** Employee currently in the live voice room (drives the strip color). */
  employee: EmployeeId;
  /** URL to rejoin (typically /app/voice). */
  rejoinHref: string;
  /** Optional copy override; defaults to "{name} · live now". */
  label?: string;
}

/**
 * Above-the-hero strip rendered whenever there's a live voice session.
 * Continuous waveform pulse + Rejoin CTA in the employee's color.
 *
 * Per contracts/primitives.md P-007. Client component because the
 * dashboard's tab-visibility may suppress paint cycles; mounting here
 * keeps things explicit.
 */
export function PraxisLiveStrip({ employee, rejoinHref, label }: Props) {
  const meta = EMPLOYEES[employee];
  return (
    <div className="praxis-live-strip" data-dept={employee} role="status">
      <span className="praxis-live-strip-wave" aria-hidden>
        <i /><i /><i />
      </span>
      <span className="praxis-eyebrow" style={{ color: "var(--color-text)" }}>
        {label ?? `${meta.name} · live now`}
      </span>
      <Link
        href={rejoinHref}
        className="praxis-eyebrow"
        style={{
          marginLeft: "auto",
          color: "var(--dept)",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-1)",
        }}
      >
        Rejoin <ArrowRight size={11} />
      </Link>
    </div>
  );
}
