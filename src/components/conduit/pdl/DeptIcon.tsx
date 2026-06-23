// pdl — DeptIcon
// Contract: specs/praxis-design-language/contracts/foundations.md §2.2
//
// Semantic Lucide icon for one of the 9 Praxis employees. Reads from
// the EMPLOYEE_ICON registry. Never renders text. The dept identity is
// carried through icon SHAPE, not color — colored dept tints belong to
// the wrapping surface (badge, chip, node glow), not to this glyph.

import { EMPLOYEE_ICON } from "@/components/conduit/EmployeeBadge";
import { SPECIALIST_ICON_STROKE } from "@/lib/ui/specialist-icons";
import type { EmployeeKey } from "@/lib/ai/provider";

interface Props {
  employee: EmployeeKey;
  size?: number;
  className?: string;
}

export function DeptIcon({ employee, size = 16, className }: Props) {
  const Icon = EMPLOYEE_ICON[employee];
  if (!Icon) {
    // Defensive: if an invalid id slipped through, render nothing rather
    // than fall back to text-initial (P1 forbids text-initial avatars).
    if (typeof console !== "undefined") {
      console.warn(`[DeptIcon] unknown employee id: ${employee}`);
    }
    return null;
  }
  return <Icon size={size} strokeWidth={SPECIALIST_ICON_STROKE} className={className} aria-hidden />;
}
