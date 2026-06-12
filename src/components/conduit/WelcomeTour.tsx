"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { PraxisAvatar } from "./praxis/PraxisAvatar";
import { PraxisLogo } from "./PraxisLogo";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const FIRST_PROMPTS: { text: string; hint: string; dept: EmployeeId }[] = [
  { text: "Help me grow my business", hint: "Atlas routes it", dept: "jarvis" },
  { text: "Write 3 blog posts for my first 10 customers", hint: "Marketing drafts", dept: "marketing" },
  { text: "Draft a cold outreach campaign", hint: "Sales builds the play", dept: "sales" },
  { text: "How would you build me a CRM?", hint: "Engineering plans it", dept: "engineering" },
  { text: "Draft an NDA for a contractor", hint: "Legal first-draft", dept: "legal" },
  { text: "Write an offer letter for a new hire", hint: "HR writes it", dept: "hr" },
];

interface Props {
  accountId: string;
  allowedEmployees: EmployeeId[];
}

export function WelcomeTour({ accountId, allowedEmployees }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dismissed, setDismissed] = useState(false);

  const allowedSet = new Set(allowedEmployees);

  async function markSeen() {
    const supabase = createSupabaseBrowserClient();
    await supabase
      .from("conduit_accounts")
      .update({ seen_welcome_tour: true })
      .eq("id", accountId);
  }

  async function dismiss() {
    setDismissed(true);
    await markSeen();
    router.refresh();
  }

  async function finish(href: string) {
    await markSeen();
    router.push(href);
    router.refresh();
  }

  if (dismissed) return null;

  const visibleEmployees = EMPLOYEE_ORDER.filter((e) => allowedSet.has(e));
  const visiblePrompts = FIRST_PROMPTS.filter((p) => allowedSet.has(p.dept) || p.dept === "jarvis");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(10,8,21,0.85)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Praxis"
    >
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--space-6) var(--space-8) var(--space-4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <PraxisLogo size={22} />
            <span className="praxis-microlabel" style={{ color: "var(--color-text-muted)" }}>
              WELCOME · {step} / 3
            </span>
          </div>
          <button
            onClick={dismiss}
            aria-label="Skip tour"
            style={{
              padding: "var(--space-2)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step indicator bar */}
        <div
          style={{
            height: "2px",
            background: "var(--color-border)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              background: "var(--color-accent)",
              width: `${(step / 3) * 100}%`,
              transition: "width 280ms var(--praxis-ease-out-quart)",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "var(--space-8)", minHeight: "340px" }}>

          {step === 1 && (
            <div>
              <h2 className="praxis-display-1" style={{ marginBottom: "var(--space-2)" }}>
                Meet your team
              </h2>
              <p className="praxis-body-lg" style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-6)" }}>
                {visibleEmployees.length === 9
                  ? "Nine specialists, one shared brain."
                  : `${visibleEmployees.length} specialists, one shared brain.`}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "var(--space-3)",
                }}
              >
                {visibleEmployees.map((emp) => {
                  const meta = EMPLOYEES[emp];
                  return (
                    <div
                      key={emp}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-3)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-surface-raised)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <PraxisAvatar employee={emp} size="md" />
                      <div>
                        <p className="praxis-body-sm" style={{ fontWeight: 500 }}>{meta.name}</p>
                        <p className="praxis-microlabel" style={{ color: "var(--color-text-muted)", textTransform: "none", letterSpacing: 0 }}>
                          {meta.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="praxis-display-1" style={{ marginBottom: "var(--space-2)" }}>
                Talk to anyone, anytime
              </h2>
              <p className="praxis-body-lg" style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-6)" }}>
                Ask naturally — Atlas routes to the right specialist automatically.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-3)",
                }}
              >
                {visiblePrompts.slice(0, 4).map((p) => {
                  const meta = EMPLOYEES[p.dept];
                  return (
                    <div
                      key={p.text}
                      style={{
                        padding: "var(--space-4)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-surface-raised)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-2)",
                          marginBottom: "var(--space-2)",
                        }}
                      >
                        <PraxisAvatar employee={p.dept} size="sm" />
                        <span className="praxis-microlabel" style={{ color: meta.color, textTransform: "none", letterSpacing: 0 }}>
                          {p.hint}
                        </span>
                      </div>
                      <p className="praxis-body-sm" style={{ color: "var(--color-text-muted)" }}>
                        &ldquo;{p.text}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: "center", paddingTop: "var(--space-4)" }}>
              <PraxisAvatar employee="jarvis" size="2xl" pulse="ambient" />
              <h2 className="praxis-display-1" style={{ marginTop: "var(--space-6)", marginBottom: "var(--space-3)" }}>
                Your team is ready
              </h2>
              <p className="praxis-body-lg" style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-8)", maxWidth: "26rem", margin: "0 auto var(--space-8)" }}>
                Start with anything — Atlas routes it to the right person.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => finish("/app")}
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
                >
                  Start a conversation <ArrowRight size={15} />
                </button>
                <button
                  onClick={() => finish("/app/workspace")}
                  className="btn-secondary"
                >
                  Explore the workspace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step < 3 && (
          <div
            style={{
              padding: "var(--space-4) var(--space-8) var(--space-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s > 1 ? (s - 1) as 1 | 2 | 3 : s))}
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            ) : (
              <button onClick={dismiss} className="btn-ghost" style={{ color: "var(--color-text-muted)" }}>
                Skip
              </button>
            )}
            <button
              onClick={() => setStep((s) => (s < 3 ? (s + 1) as 1 | 2 | 3 : s))}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
            >
              Next <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
