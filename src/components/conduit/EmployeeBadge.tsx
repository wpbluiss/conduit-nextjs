import type { EmployeeKey } from "@/lib/ai/provider";

const STYLES: Record<
  EmployeeKey,
  { initial: string; bg: string; ring: string; label: string }
> = {
  jarvis: {
    initial: "J",
    bg: "#1F1C19",
    ring: "#8C8884",
    label: "Jarvis",
  },
  marketing: {
    initial: "M",
    bg: "#103a28",
    ring: "#34D399",
    label: "Marketing",
  },
  sales: {
    initial: "S",
    bg: "#3a2a08",
    ring: "#FBBF24",
    label: "Sales",
  },
  engineering: {
    initial: "E",
    bg: "#0e2440",
    ring: "#22D3EE",
    label: "Engineering",
  },
};

export function EmployeeBadge({
  employee,
  size = "sm",
}: {
  employee: EmployeeKey;
  size?: "sm" | "md";
}) {
  const s = STYLES[employee];
  const dim = size === "md" ? 28 : 22;
  return (
    <div className="inline-flex items-center gap-2">
      <span
        aria-hidden
        style={{
          width: dim,
          height: dim,
          background: s.bg,
          borderColor: s.ring,
        }}
        className="inline-flex items-center justify-center rounded-full border text-[11px] font-medium text-[var(--color-text)]"
      >
        {s.initial}
      </span>
      <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {s.label}
      </span>
    </div>
  );
}

export function employeeLabel(employee: EmployeeKey): string {
  return STYLES[employee].label;
}
