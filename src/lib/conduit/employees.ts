// Single source of truth for the Praxis employee roster.
// Color, initial, role label, voice category are all read from here. UI
// components, the Atlas routing prompt, the intent classifier, and the
// tier allowlist all reference this file so adding a future employee is a
// one-file change.
//
// Note: the `'jarvis'` enum value is preserved as the Chief of Staff's
// internal id (DB column values live there). The display name is "Atlas".

import type { IntentClass } from "@/lib/ai/intent-classifier";

export type EmployeeId =
  | "jarvis"
  | "marketing"
  | "sales"
  | "engineering"
  | "finance"
  | "compliance"
  | "hr"
  | "ops"
  | "legal";

export interface EmployeeConfig {
  id: EmployeeId;
  name: string; // shown in UI
  role: string; // sub-label
  color: string; // hex; falls back as the dept accent
  colorSoft: string; // rgba 14% — for backgrounds
  initial: string;
  tagline: string;
  canExecute: boolean;
  /** Default intent for short-circuit routing in the classifier. */
  voiceCategory: IntentClass;
}

// Dept color values resolve through CSS variables, not hardcoded hex.
// That lets praxis-tokens.css swap colors per theme (deep emerald on
// light bone, bright emerald on dark amethyst) without component edits.
// On marketing surfaces (no .praxis-root wrapper), globals.css :root
// supplies dark-theme jewel-tones as the default.
export const EMPLOYEES: Record<EmployeeId, EmployeeConfig> = {
  jarvis: {
    id: "jarvis",
    name: "Atlas",
    role: "Chief of Staff",
    color: "var(--color-dept-jarvis)",
    colorSoft: "var(--color-dept-jarvis-soft)",
    initial: "A",
    tagline: "Your right hand. Routes work, holds the bigger picture.",
    canExecute: true,
    voiceCategory: "routing",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    role: "Content + Brand",
    color: "var(--color-dept-marketing)",
    colorSoft: "var(--color-dept-marketing-soft)",
    initial: "M",
    tagline: "Writes, designs, and ships content for your business.",
    canExecute: true,
    voiceCategory: "creative",
  },
  sales: {
    id: "sales",
    name: "Sales",
    role: "Pipeline + Outreach",
    color: "var(--color-dept-sales)",
    colorSoft: "var(--color-dept-sales-soft)",
    initial: "S",
    tagline: "Prospects, qualifies, calls, and closes.",
    canExecute: false,
    voiceCategory: "creative",
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    role: "Build + Ship",
    color: "var(--color-dept-engineering)",
    colorSoft: "var(--color-dept-engineering-soft)",
    initial: "E",
    tagline: "Builds tools, websites, CRMs, automations.",
    canExecute: true, // R7: real builds via templates + GitHub + Vercel
    voiceCategory: "code",
  },
  finance: {
    id: "finance",
    name: "Finance",
    role: "Books + Strategy",
    color: "var(--color-dept-finance)",
    colorSoft: "var(--color-dept-finance-soft)",
    initial: "F",
    tagline: "P&L, commissions, cash strategy, projections.",
    canExecute: false,
    voiceCategory: "reasoning",
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    role: "Regs + Risk",
    color: "var(--color-dept-compliance)",
    colorSoft: "var(--color-dept-compliance-soft)",
    initial: "C",
    tagline: "Regulatory guidance, licensing, HIPAA awareness.",
    canExecute: false,
    voiceCategory: "reasoning",
  },
  hr: {
    id: "hr",
    name: "HR",
    role: "People + Hiring",
    color: "var(--color-dept-hr)",
    colorSoft: "var(--color-dept-hr-soft)",
    initial: "H",
    tagline: "Recruitment, handbooks, team structure.",
    canExecute: true, // produces real artifacts (job descs, handbooks)
    voiceCategory: "creative",
  },
  ops: {
    id: "ops",
    name: "Operations",
    role: "Calendar + Process",
    color: "var(--color-dept-ops)",
    colorSoft: "var(--color-dept-ops-soft)",
    initial: "O",
    tagline: "Scheduling, internal coordination, process design.",
    canExecute: true, // SOPs, checklists, process docs
    voiceCategory: "routing",
  },
  legal: {
    id: "legal",
    name: "Legal",
    role: "Contracts + Agreements",
    color: "var(--color-dept-legal)",
    colorSoft: "var(--color-dept-legal-soft)",
    initial: "L",
    tagline:
      "Contracts, BAAs, basic agreements (with attorney-review disclaimer).",
    canExecute: true,
    voiceCategory: "reasoning",
  },
};

export const EMPLOYEE_ORDER: EmployeeId[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

export const ALL_EMPLOYEES: EmployeeConfig[] = EMPLOYEE_ORDER.map(
  (id) => EMPLOYEES[id],
);

export function employeeById(id: string): EmployeeConfig {
  return EMPLOYEES[id as EmployeeId] ?? EMPLOYEES.jarvis;
}

export function isValidEmployee(id: string): id is EmployeeId {
  return id in EMPLOYEES;
}
