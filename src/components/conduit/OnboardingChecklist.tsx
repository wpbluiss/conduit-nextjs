"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";

const LS_KEY = "praxis:ob_checklist_v1";

type StepKey = "first_chat" | "save_memory" | "set_context";
type StepState = Partial<Record<StepKey, boolean>>;

const STEPS: { key: StepKey; label: string; href: string }[] = [
  { key: "first_chat", label: "Chat with your first specialist", href: "/app" },
  { key: "save_memory", label: "Save a memory", href: "/app/memory" },
  {
    key: "set_context",
    label: "Set your business context",
    href: "/app/settings",
  },
];

export function OnboardingChecklist({
  conversationCount,
  hasContext,
}: {
  conversationCount: number;
  hasContext: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [steps, setSteps] = useState<StepState>({});

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY) === "1") return;
    } catch {
      // localStorage blocked — proceed without dismiss check
    }

    Promise.all([
      fetch("/api/conduit/memory")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/conduit/connectors")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([memData, connData]) => {
      const memoryCount = Array.isArray(memData?.memories)
        ? memData.memories.length
        : 0;
      const connectorCount = Array.isArray(connData?.connected)
        ? connData.connected.length
        : 0;

      // Only show for workspaces with < 3 conversations and no connectors
      if (conversationCount >= 3 || connectorCount > 0) return;

      const state: StepState = {
        first_chat: conversationCount > 0,
        save_memory: memoryCount > 0,
        set_context: hasContext,
      };

      // Auto-dismiss if all steps already done
      if (STEPS.every((s) => state[s.key])) {
        try {
          localStorage.setItem(LS_KEY, "1");
        } catch {}
        return;
      }

      setSteps(state);
      setVisible(true);
    });
  }, [conversationCount, hasContext]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {}
    setVisible(false);
  }, []);

  if (!visible) return null;

  const doneCount = STEPS.filter((s) => steps[s.key]).length;

  return (
    <div
      className="mx-3 mb-3 rounded-xl overflow-hidden"
      style={{
        background:
          "color-mix(in srgb, var(--color-accent) 5%, var(--color-surface-elevated))",
        border:
          "1px solid color-mix(in srgb, var(--color-accent) 15%, var(--color-border))",
      }}
    >
      <div className="px-3 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <div
              className="cx-type-xs font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Get started
            </div>
            <div
              className="cx-type-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {doneCount} of {STEPS.length} complete
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss onboarding checklist"
            className="transition-colors p-0.5 rounded hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={12} strokeWidth={1.75} />
          </button>
        </div>

        <div
          className="w-full rounded-full overflow-hidden mb-2"
          style={{ height: 2, background: "var(--color-border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${(doneCount / STEPS.length) * 100}%`,
              background: "var(--color-accent)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <ul className="pb-1.5">
        {STEPS.map((step) => {
          const checked = Boolean(steps[step.key]);
          return (
            <li key={step.key}>
              <Link
                href={step.href}
                className={`flex items-center gap-2 px-3 py-1.5 cx-type-xs transition-colors ${
                  checked
                    ? "pointer-events-none opacity-50"
                    : "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                }`}
                tabIndex={checked ? -1 : 0}
                aria-disabled={checked}
              >
                <span
                  className="shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                  style={{
                    borderColor: checked
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                    background: checked ? "var(--color-accent)" : "transparent",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                >
                  {checked && <Check size={8} color="#fff" strokeWidth={2} />}
                </span>
                <span
                  className={checked ? "line-through" : ""}
                  style={{
                    color: checked
                      ? "var(--color-text-muted)"
                      : "var(--color-text)",
                  }}
                >
                  {step.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
