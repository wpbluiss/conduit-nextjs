import type { EmployeeId } from "@/lib/conduit/employees";
import { EMPLOYEES } from "@/lib/conduit/employees";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late";

export type PrimaryEventKind =
  | "shipped-build"
  | "scored-hot-lead"
  | "atlas-memory-pinned"
  | "prior-conversation"
  | "none";

export interface PrimaryEvent {
  kind: PrimaryEventKind;
  employeeId: EmployeeId;
  label: string; // e.g. "finished the 3-post draft"
  href?: string;
}

export interface WelcomeCopy {
  /** Short upper eyebrow above the headline. */
  eyebrow: string;
  /** The hero line; pre-resolved with firstName + event label. */
  headline: string;
  /** Optional supporting line under the hero. */
  subline?: string;
  /** When set, the headline is a click-through to the event. */
  primaryEventEmployee?: EmployeeId;
  primaryEventHref?: string;
}

interface ComposeInput {
  firstName: string;
  hoursSinceLastVisit: number | null;
  timeOfDay: TimeOfDay;
  primaryEvent: PrimaryEvent | null;
}

const tod = (t: TimeOfDay): string => {
  switch (t) {
    case "morning":   return "Good morning";
    case "afternoon": return "Good afternoon";
    case "evening":   return "Good evening";
    case "late":      return "Welcome back";
  }
};

/**
 * Deterministic copy ladder for the /app/workspace hero.
 *
 * Inputs are real, observed values; copy variants enumerate combinations
 * of time-of-day × recent-event-kind × inactivity-window. NO LLM-generated
 * copy at render time — every placeholder maps to a real DB row value
 * (Principle Zero).
 *
 * Per research.md R-009. ~32 variants — all statically auditable in this
 * file.
 */
export function composeWelcomeCopy({
  firstName,
  hoursSinceLastVisit,
  timeOfDay,
  primaryEvent,
}: ComposeInput): WelcomeCopy {
  const greeting = tod(timeOfDay);

  // No prior data at all — first-day account.
  if (!primaryEvent || primaryEvent.kind === "none") {
    return {
      eyebrow: "Praxis Console",
      headline: `${greeting}, ${firstName}. Your team is on standby.`,
      subline:
        "Tell Atlas about your business — he'll route the first request to the right employee.",
    };
  }

  const empName = EMPLOYEES[primaryEvent.employeeId]?.name ?? "Atlas";

  // Long inactivity → recap framing.
  const isReturning = hoursSinceLastVisit !== null && hoursSinceLastVisit >= 72;

  switch (primaryEvent.kind) {
    case "shipped-build":
      return {
        eyebrow: isReturning ? "While you were away" : "Live now",
        headline: `${greeting}, ${firstName}. ${empName} ${primaryEvent.label}.`,
        subline: isReturning
          ? `${empName} shipped this on its own. Take a look.`
          : `${empName} just shipped this.`,
        primaryEventEmployee: primaryEvent.employeeId,
        primaryEventHref: primaryEvent.href,
      };

    case "scored-hot-lead":
      return {
        eyebrow: isReturning ? "While you were away" : "Sales",
        headline: `${greeting}, ${firstName}. ${empName} ${primaryEvent.label}.`,
        subline: "Atlas thinks this one's worth a call.",
        primaryEventEmployee: primaryEvent.employeeId,
        primaryEventHref: primaryEvent.href,
      };

    case "atlas-memory-pinned":
      return {
        eyebrow: "Atlas pinned this",
        headline: `${greeting}, ${firstName}. ${primaryEvent.label}.`,
        subline: "Atlas is holding context for you.",
        primaryEventEmployee: primaryEvent.employeeId,
        primaryEventHref: primaryEvent.href,
      };

    case "prior-conversation":
      return {
        eyebrow: isReturning ? "Picking up where you left off" : "Recent",
        headline: `${greeting}, ${firstName}. ${primaryEvent.label}.`,
        subline: `Continue with ${empName} or start something new.`,
        primaryEventEmployee: primaryEvent.employeeId,
        primaryEventHref: primaryEvent.href,
      };
  }
}

/**
 * Deterministic copy for the /app chat empty state. Replaces the
 * generic "What are we building today?" with named-Atlas presence.
 *
 * Per spec FR-008 / Story 3 AC-1. Time-of-day variant; never invents
 * department state.
 */
export function composeChatEmptyCopy({
  firstName,
  timeOfDay,
}: {
  firstName: string;
  timeOfDay: TimeOfDay;
}): { eyebrow: string; headline: string; subline: string } {
  const headline =
    timeOfDay === "morning"
      ? `Atlas is at the table, ${firstName}.`
      : timeOfDay === "evening" || timeOfDay === "late"
      ? `Atlas is still here, ${firstName}.`
      : `Atlas is at the table.`;
  return {
    eyebrow: "Your team is online",
    headline,
    subline:
      "Tell Atlas what you need. He'll route the right employee — or handle it himself.",
  };
}

/**
 * Coarse-bucket the team's last-hour activity so the dashboard hero
 * picks a breath cadence (per FR-012). Heuristic — refine per real
 * usage.
 */
export function activityBucket(
  signals: number,
): "none" | "low" | "high" {
  if (signals === 0) return "none";
  if (signals < 3) return "low";
  return "high";
}

/**
 * Bucket the current hour into time-of-day. Server-rendered; respects
 * the operator's environment time-zone via Date defaults on Vercel.
 */
export function timeOfDayBucket(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "late";
}
