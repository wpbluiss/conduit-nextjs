"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { EMPLOYEES, EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";
import { PraxisAvatar } from "./praxis/PraxisAvatar";

const INTRO_PROMPTS: { text: string; pin: EmployeeKey; hint: string }[] = [
  {
    text: "Help me grow my business — where do we start?",
    pin: "jarvis",
    hint: "Atlas will route the work to the right team",
  },
  {
    text: "Write a LinkedIn post about what my business does",
    pin: "marketing",
    hint: "Marketing will draft it",
  },
  {
    text: "Draft a quick outreach message to potential customers",
    pin: "sales",
    hint: "Sales builds the play",
  },
];

export function MeetTheTeamIntro({
  allowedEmployees,
  onDismiss,
}: {
  allowedEmployees: EmployeeKey[];
  onDismiss: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const visibleEmployees = EMPLOYEE_ORDER.filter(
    (id) =>
      allowedEmployees.includes(id as EmployeeKey) || id === "jarvis",
  ).slice(0, 9) as EmployeeKey[];

  async function dismiss() {
    onDismiss();
    // Fire-and-forget — dismissal is best-effort; worst case the intro
    // shows again on next login until migration 029 is applied.
    fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intro_dismiss: true }),
    }).catch(() => undefined);
  }

  return (
    <div className="fixed inset-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="conduit-card w-full max-w-2xl p-8 relative"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close intro"
          className="absolute top-4 right-4 p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            Welcome · Step {step} of 3
          </div>
          <div className="h-[2px] bg-[var(--color-border)] rounded-full overflow-hidden">
            <div
              className="h-[2px] bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1 — Meet the team */}
        {step === 1 && (
          <div>
            <h2 className="serif text-3xl leading-tight">
              Meet your team
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Nine AI employees, each with a specialty. Atlas routes work
              to the right person automatically.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visibleEmployees.map((empId) => {
                const emp = EMPLOYEES[empId];
                return (
                  <div
                    key={empId}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
                  >
                    <PraxisAvatar employee={empId} size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                        {emp.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — What they do */}
        {step === 2 && (
          <div>
            <h2 className="serif text-3xl leading-tight">
              What they can do
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Your team handles the full stack — from strategy to execution.
            </p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["Atlas (Chief of Staff)", "Routes every request to the right employee. Holds context across all your work."],
                  ["Marketing", "Blog posts, social content, email campaigns, brand positioning."],
                  ["Sales", "Cold outreach, CRM setup, deal strategy, objection handling."],
                  ["Engineering", "Build plans, code architecture, technical specs, bug triage."],
                  ["Finance", "P&L review, cash flow, projections, commission tracking."],
                  ["HR", "Job descriptions, offer letters, handbooks, interview guides."],
                  ["Legal", "Contracts, NDAs, agreements — always with attorney-review note."],
                  ["Operations", "SOPs, checklists, scheduling, internal coordination."],
                  ["Compliance", "Regulatory guidance, licensing, risk flagging."],
                ] as [string, string][]
              )
                .filter(([name]) => {
                  if (name.startsWith("Atlas")) return true;
                  const key = name.toLowerCase().split(" ")[0] as EmployeeKey;
                  return visibleEmployees.includes(key);
                })
                .slice(0, 6)
                .map(([name, desc]) => (
                  <div
                    key={name}
                    className="flex gap-3 text-sm p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
                  >
                    <span className="font-medium shrink-0 text-[var(--color-accent-hi)] w-28 truncate">
                      {name.split(" ")[0]}
                    </span>
                    <span className="text-[var(--color-text-muted)]">{desc}</span>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn-primary">
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Start */}
        {step === 3 && (
          <div>
            <h2 className="serif text-3xl leading-tight">
              Ready when you are
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Try one of these to get started, or just type in the chat.
            </p>
            <div className="mt-6 space-y-3">
              {INTRO_PROMPTS.map((p) => {
                const emp = EMPLOYEES[p.pin];
                return (
                  <div
                    key={p.text}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-accent)] transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <PraxisAvatar employee={p.pin} size="sm" />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                        {emp.name}
                      </span>
                    </div>
                    <p className="text-sm">{p.text}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button onClick={dismiss} className="btn-primary">
                Start chatting <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
