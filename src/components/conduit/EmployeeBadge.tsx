import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEES } from "@/lib/conduit/employees";
import {
  Code2,
  Compass,
  DollarSign,
  HeartHandshake,
  Megaphone,
  Scale,
  ShieldCheck,
  TrendingUp,
  Workflow,
  type LucideIcon,
} from "lucide-react";

// Re-exported as Records for compatibility with existing call sites that
// indexed by EmployeeKey directly.
export const DEPT_COLOR: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.color]),
) as Record<EmployeeKey, string>;

export const DEPT_COLOR_SOFT: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.colorSoft]),
) as Record<EmployeeKey, string>;

// R14 role-icon avatars — replaces the letter-initial mark in the rail
// and any dense surface where the icon reads faster than a letter.
export const EMPLOYEE_ICON: Record<EmployeeKey, LucideIcon> = {
  jarvis: Compass,        // Atlas — routes work, holds bigger picture
  marketing: Megaphone,
  sales: TrendingUp,
  engineering: Code2,
  finance: DollarSign,
  compliance: ShieldCheck,
  hr: HeartHandshake,
  ops: Workflow,
  legal: Scale,
};

export function EmployeeAvatar({
  employee,
  size = 28,
  active = false,
  variant = "icon",
}: {
  employee: EmployeeKey;
  size?: number;
  active?: boolean;
  /** "icon" → R14 role icon (default). "letter" → legacy initial. */
  variant?: "icon" | "letter";
}) {
  const m = EMPLOYEES[employee];
  const Icon = EMPLOYEE_ICON[employee];
  // Glyph scales with the chip; gives the icon enough breathing room.
  const glyphSize = Math.max(10, Math.round(size * 0.5));
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: m.colorSoft,
        color: m.color,
        ["--dept" as string]: m.color,
        boxShadow: `inset 0 0 0 1.5px ${m.color}`,
      }}
      className={`relative inline-flex items-center justify-center rounded-full text-[11px] font-medium ${
        active ? "employee-pulse" : ""
      }`}
    >
      {variant === "letter" ? (
        <span style={{ color: "var(--color-text)" }}>{m.initial}</span>
      ) : (
        <Icon size={glyphSize} strokeWidth={2.25} />
      )}
    </span>
  );
}

export function EmployeeBadge({
  employee,
  withRole = false,
}: {
  employee: EmployeeKey;
  withRole?: boolean;
}) {
  const m = EMPLOYEES[employee];
  return (
    <div className="inline-flex items-center gap-2 relative">
      <EmployeeAvatar employee={employee} size={26} />
      <span className="leading-tight">
        <span
          className="block text-[12px] font-medium tracking-tight"
          style={{ color: m.color }}
        >
          {m.name}
        </span>
        {withRole && (
          <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {m.role}
          </span>
        )}
      </span>
    </div>
  );
}

/** Dept-tinted pill showing the specialist name — used in chat message headers. */
export function SpecialistChip({
  employee,
  label,
}: {
  employee: EmployeeKey;
  label?: string;
}) {
  const m = EMPLOYEES[employee];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none tracking-tight select-none"
      style={{
        background: m.colorSoft,
        color: m.color,
        border: `1px solid color-mix(in srgb, ${m.color} 28%, transparent)`,
      }}
    >
      {label ?? m.name}
    </span>
  );
}

export function employeeLabel(employee: EmployeeKey): string {
  return EMPLOYEES[employee].name;
}

export function employeeRole(employee: EmployeeKey): string {
  return EMPLOYEES[employee].role;
}
