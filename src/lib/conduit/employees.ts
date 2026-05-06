// Single source of truth for the Conduit AI employee roster.
// Color, initial, role label, voice category are all read from here. UI
// components, the Jarvis routing prompt, the intent classifier, and the
// tier allowlist all reference this file so adding a future employee is a
// one-file change.

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

export const EMPLOYEES: Record<EmployeeId, EmployeeConfig> = {
  jarvis: {
    id: "jarvis",
    name: "Jarvis",
    role: "Chief of Staff",
    color: "#C8C5BD",
    colorSoft: "rgba(200, 197, 189, 0.14)",
    initial: "J",
    tagline: "Your right hand. Routes work, holds the bigger picture.",
    canExecute: true,
    voiceCategory: "routing",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    role: "Content + Brand",
    color: "#FF8A3D",
    colorSoft: "rgba(255, 138, 61, 0.14)",
    initial: "M",
    tagline: "Writes, designs, and ships content for your business.",
    canExecute: true,
    voiceCategory: "creative",
  },
  sales: {
    id: "sales",
    name: "Sales",
    role: "Pipeline + Outreach",
    color: "#34D399",
    colorSoft: "rgba(52, 211, 153, 0.14)",
    initial: "S",
    tagline: "Prospects, qualifies, calls, and closes.",
    canExecute: false,
    voiceCategory: "creative",
  },
  engineering: {
    id: "engineering",
    name: "Engineering",
    role: "Build + Ship",
    color: "#60A5FA",
    colorSoft: "rgba(96, 165, 250, 0.14)",
    initial: "E",
    tagline: "Builds tools, websites, CRMs, automations.",
    canExecute: false,
    voiceCategory: "code",
  },
  finance: {
    id: "finance",
    name: "Finance",
    role: "Books + Strategy",
    color: "#EAB308",
    colorSoft: "rgba(234, 179, 8, 0.14)",
    initial: "F",
    tagline: "P&L, commissions, cash strategy, projections.",
    canExecute: false,
    voiceCategory: "reasoning",
  },
  compliance: {
    id: "compliance",
    name: "Compliance",
    role: "Regs + Risk",
    color: "#A855F7",
    colorSoft: "rgba(168, 85, 247, 0.14)",
    initial: "C",
    tagline: "Regulatory guidance, licensing, HIPAA awareness.",
    canExecute: false,
    voiceCategory: "reasoning",
  },
  hr: {
    id: "hr",
    name: "HR",
    role: "People + Hiring",
    color: "#EC4899",
    colorSoft: "rgba(236, 72, 153, 0.14)",
    initial: "H",
    tagline: "Recruitment, handbooks, team structure.",
    canExecute: true, // produces real artifacts (job descs, handbooks)
    voiceCategory: "creative",
  },
  ops: {
    id: "ops",
    name: "Operations",
    role: "Calendar + Process",
    color: "#14B8A6",
    colorSoft: "rgba(20, 184, 166, 0.14)",
    initial: "O",
    tagline: "Scheduling, internal coordination, process design.",
    canExecute: true, // SOPs, checklists, process docs
    voiceCategory: "routing",
  },
  legal: {
    id: "legal",
    name: "Legal",
    role: "Contracts + Agreements",
    color: "#3B82F6",
    colorSoft: "rgba(59, 130, 246, 0.14)",
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
