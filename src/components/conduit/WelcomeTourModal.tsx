"use client";

import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { PraxisAvatar } from "./praxis/PraxisAvatar";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";

const TOUR_EMPLOYEES: EmployeeId[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "ops",
];

async function dismissTour() {
  await fetch("/api/conduit/account/prefs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dismiss_tour: true }),
  }).catch(() => {});
}

export function WelcomeTourModal({
  allowedEmployees,
}: {
  allowedEmployees: EmployeeKey[];
}) {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  if (!visible) return null;

  const allowedSet = new Set(allowedEmployees);
  const visibleEmployees = TOUR_EMPLOYEES.filter(
    (e) => e === "jarvis" || allowedSet.has(e as EmployeeKey),
  );

  function close() {
    setVisible(false);
    void dismissTour();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center px-4 pb-6 sm:pb-0"
      style={{ pointerEvents: "none" }}
      aria-live="polite"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl"
        style={{
          pointerEvents: "auto",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          padding: "var(--space-6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-5)",
          }}
        >
          <div style={{ display: "flex", gap: "var(--space-1)" }}>
            {([1, 2, 3] as const).map((n) => (
              <span
                key={n}
                style={{
                  width: 20,
                  height: 3,
                  borderRadius: 9999,
                  background:
                    n <= step
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  transition: "background 200ms",
                }}
              />
            ))}
          </div>
          <button
            onClick={close}
            aria-label="Dismiss tour"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-muted)",
              padding: "var(--space-1)",
              display: "flex",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
              <PraxisAvatar employee="jarvis" size="xl" pulse="ambient" />
              <div>
                <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-2)" }}>
                  MEET ATLAS
                </p>
                <h2
                  className="serif"
                  style={{ fontSize: "1.5rem", lineHeight: 1.2, marginBottom: "var(--space-3)" }}
                >
                  Your chief of staff is online.
                </h2>
                <p className="praxis-body-sm" style={{ color: "var(--color-text-muted)" }}>
                  Atlas routes every request to the right specialist, remembers
                  your business context, and keeps the whole team coordinated.
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: "var(--space-6)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setStep(2)}
                className="btn-primary"
              >
                Meet the team <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Team */}
        {step === 2 && (
          <div>
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-2)" }}>
              YOUR TEAM
            </p>
            <h2
              className="serif"
              style={{ fontSize: "1.5rem", lineHeight: 1.2, marginBottom: "var(--space-4)" }}
            >
              Nine specialists, one shared brain.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
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
                      alignItems: "flex-start",
                      gap: "var(--space-2)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <PraxisAvatar employee={emp} size="sm" />
                    <div style={{ minWidth: 0 }}>
                      <p
                        className="praxis-microlabel"
                        style={{ fontWeight: 600, color: meta.color }}
                      >
                        {meta.name}
                      </p>
                      <p
                        className="praxis-microlabel"
                        style={{
                          color: "var(--color-text-muted)",
                          marginTop: "var(--space-1)",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {meta.tagline}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginTop: "var(--space-5)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button onClick={() => setStep(3)} className="btn-primary">
                Let&apos;s go <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: CTA */}
        {step === 3 && (
          <div>
            <p className="praxis-eyebrow" style={{ marginBottom: "var(--space-2)" }}>
              YOU&apos;RE ALL SET
            </p>
            <h2
              className="serif"
              style={{ fontSize: "1.5rem", lineHeight: 1.2, marginBottom: "var(--space-3)" }}
            >
              Start by talking to Atlas.
            </h2>
            <p className="praxis-body-sm" style={{ color: "var(--color-text-muted)" }}>
              Just describe what you&apos;re working on. Atlas will brief the
              right specialist and keep everything in sync. No menu to navigate
              — just talk.
            </p>
            <div
              style={{
                marginTop: "var(--space-5)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <button onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button onClick={close} className="btn-primary">
                Open chat <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
