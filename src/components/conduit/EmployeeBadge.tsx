import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEES } from "@/lib/conduit/employees";
import { Compass, type LucideIcon } from "lucide-react";
import { SPECIALIST_ICON, SPECIALIST_ICON_STROKE } from "@/lib/ui/specialist-icons";

// Re-exported as Records for compatibility with existing call sites that
// indexed by EmployeeKey directly.
export const DEPT_COLOR: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.color]),
) as Record<EmployeeKey, string>;

export const DEPT_COLOR_SOFT: Record<EmployeeKey, string> = Object.fromEntries(
  Object.entries(EMPLOYEES).map(([id, c]) => [id, c.colorSoft]),
) as Record<EmployeeKey, string>;

// Re-export from canonical source for existing call sites.
export const EMPLOYEE_ICON: Record<EmployeeKey, LucideIcon> = SPECIALIST_ICON;

// Fallback for any employee id that isn't one of the current specialists
// (e.g. an old conversation/message tagged with a since-removed id). Prevents
// `EMPLOYEES[unknownId].name` from throwing and crashing the whole /app tree.
const FALLBACK_EMPLOYEE = {
  name: "Specialist",
  role: "",
  initial: "?",
  color: "var(--cx-text-muted)",
  colorSoft: "var(--cx-text-muted-tint, rgba(160,160,176,0.12))",
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
  const m = EMPLOYEES[employee] ?? FALLBACK_EMPLOYEE;
  const Icon = EMPLOYEE_ICON[employee] ?? Compass;
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
      className={`relative inline-flex items-center justify-center rounded-full cx-type-xs font-medium ${
        active ? "employee-pulse" : ""
      }`}
    >
      {variant === "letter" ? (
        <span style={{ color: "var(--color-text)" }}>{m.initial}</span>
      ) : (
        <Icon size={glyphSize} strokeWidth={SPECIALIST_ICON_STROKE} />
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
  const m = EMPLOYEES[employee] ?? FALLBACK_EMPLOYEE;
  return (
    <div className="inline-flex items-center gap-2 relative">
      <EmployeeAvatar employee={employee} size={26} />
      <span className="leading-tight">
        <span
          className="block text-xs font-medium tracking-tight"
          style={{ color: m.color }}
        >
          {m.name}
        </span>
        {withRole && (
          <span className="block cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
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
  const m = EMPLOYEES[employee] ?? FALLBACK_EMPLOYEE;
  const Icon = SPECIALIST_ICON[employee] ?? Compass;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cx-mono cx-type-xs font-semibold leading-none tracking-tight select-none"
      style={{
        background: m.colorSoft,
        color: m.color,
        border: `1px solid color-mix(in srgb, ${m.color} 30%, transparent)`,
        boxShadow: `inset 0 1px 0 color-mix(in srgb, ${m.color} 12%, transparent)`,
      }}
    >
      <Icon size={12} strokeWidth={SPECIALIST_ICON_STROKE} aria-hidden />
      {label ?? m.name}
    </span>
  );
}

export function employeeLabel(employee: EmployeeKey): string {
  return EMPLOYEES[employee]?.name ?? "Specialist";
}

export function employeeRole(employee: EmployeeKey): string {
  return EMPLOYEES[employee]?.role ?? "";
}
