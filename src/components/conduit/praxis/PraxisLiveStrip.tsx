"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES, isValidEmployee } from "@/lib/conduit/employees";

interface Props {
  /**
   * Employee currently in the live voice room (drives strip color + name).
   * Optional: when omitted or unknown, renders a neutral
   * "Voice room · live now" in the accent color.
   */
  employee?: EmployeeId;
  /** URL to rejoin (typically /app/voice). */
  rejoinHref: string;
  /** Optional copy override. */
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
  const meta =
    employee && isValidEmployee(employee) ? EMPLOYEES[employee] : null;
  const displayLabel =
    label ?? (meta ? `${meta.name} · live now` : "Voice room · live now");
  return (
    <div className="praxis-live-strip" data-dept={meta?.id} role="status">
      <span className="praxis-live-strip-wave" aria-hidden>
        <i /><i /><i />
      </span>
      <span className="praxis-eyebrow" style={{ color: "var(--color-text)" }}>
        {displayLabel}
      </span>
      <Link
        href={rejoinHref}
        className="praxis-eyebrow"
        style={{
          marginLeft: "auto",
          color: "var(--dept, var(--color-accent))",
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
