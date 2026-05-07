import type { EmployeeId } from "./employees";

export const WORKSPACE_PROMPTS: Record<EmployeeId, string[]> = {
  jarvis: [
    "Give me a status check on the business",
    "What should I prioritize today?",
    "Summarize what the team's been working on",
    "Help me think through a tough decision",
  ],
  marketing: [
    "Write me a blog post on why every cleaning business needs a website",
    "Draft 5 social posts for this week",
    "Create ad copy for our newest service",
    "Build me a content calendar for the month",
  ],
  sales: [
    "Sketch a cold outreach campaign",
    "Help me qualify a prospect",
    "Draft a sales script for inbound calls",
    "Build me a 5-touch follow-up sequence",
  ],
  engineering: [
    "Build me a landing page",
    "Build me a basic CRM",
    "Build me a lead capture page",
    "Build me a contact form",
  ],
  finance: [
    "Walk me through my P&L",
    "Help me set up commission tracking",
    "Project my next 90 days of cash flow",
    "Review my unit economics",
  ],
  compliance: [
    "What regulations apply to my business?",
    "Walk me through HIPAA basics",
    "Review my privacy-policy approach",
    "What licenses do I need to operate in California?",
  ],
  hr: [
    "Draft me an offer letter",
    "Write a job description for a part-time bookkeeper",
    "Build an interview rubric for an ops manager",
    "Draft an employee handbook section on PTO",
  ],
  ops: [
    "Build me an SOP for client onboarding",
    "Set up a weekly standup template",
    "Design a process map for invoice approvals",
    "Create a 30-day onboarding checklist",
  ],
  legal: [
    "Draft a basic NDA",
    "Draft a service agreement",
    "Draft a contractor agreement",
    "Draft basic terms of service",
  ],
};

export function emptyStateCopy(
  employeeId: EmployeeId,
  canExecute: boolean,
): { headline: string; cta: string } {
  if (employeeId === "jarvis") {
    return {
      headline:
        "You haven't checked in with me yet. Want a status update on the business, or working on something specific?",
      cta: "Pick a quick-start above or start a fresh conversation →",
    };
  }
  const label =
    employeeId === "marketing"
      ? "Marketing"
      : employeeId === "sales"
        ? "Sales"
        : employeeId === "engineering"
          ? "Engineering"
          : employeeId === "finance"
            ? "Finance"
            : employeeId === "compliance"
              ? "Compliance"
              : employeeId === "hr"
                ? "HR"
                : employeeId === "ops"
                  ? "Operations"
                  : "Legal";

  if (canExecute) {
    return {
      headline: `${label}'s ready when you are.`,
      cta: "Pick a quick-start above or start a fresh conversation →",
    };
  }
  return {
    headline: `${label} hasn't run any plays yet. Right now ${label} sketches strategies and drafts artifacts — autonomous execution coming in a future update.`,
    cta: "Try a quick-start above to get started →",
  };
}
