"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { PraxisButton } from "@/components/conduit/ui/Button";

export type ChecklistKey =
  | "meet_team"
  | "first_project"
  | "connect_integration"
  | "invite_teammate"
  | "command_palette";

type ChecklistState = Partial<Record<ChecklistKey | "dismissed", boolean>>;

const ITEMS: {
  key: ChecklistKey;
  label: string;
  hint: string;
  href?: string;
  action?: string;
}[] = [
  {
    key: "meet_team",
    label: "Meet your specialist team",
    hint: "See all nine specialists and their roles",
    href: "/app/team",
  },
  {
    key: "first_project",
    label: "Start your first project",
    hint: "Open the Workspace and kick off a task",
    href: "/app/workspace",
  },
  {
    key: "connect_integration",
    label: "Connect an integration",
    hint: "Link GitHub, Slack, or Notion",
    href: "/app/settings?tab=integrations",
  },
  {
    key: "invite_teammate",
    label: "Invite a team member",
    hint: "Collaborate with your people inside Praxis",
    href: "/app/settings?tab=team",
  },
  {
    key: "command_palette",
    label: "Try the command palette",
    hint: "Press ⌘K to open quick actions",
    action: "cmd-k",
  },
];

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-border)" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeDasharray={`${pct * c} ${c}`}
        strokeDashoffset={c / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontSize="9"
        fill="var(--color-text)"
        fontFamily="inherit"
      >
        {done}/{total}
      </text>
    </svg>
  );
}

async function patchChecklist(patch: Partial<Record<string, boolean>>) {
  await fetch("/api/conduit/onboarding-checklist", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => null);
}

export function WelcomeChecklist({
  hasConversations,
}: {
  hasConversations: boolean;
}) {
  const [checklist, setChecklist] = useState<ChecklistState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/conduit/onboarding-checklist")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { checklist: ChecklistState } | null) => {
        if (!j) return;
        const state: ChecklistState = { ...j.checklist };
        // Auto-check "first_project" if the user already has conversations
        if (hasConversations && !state.first_project) {
          state.first_project = true;
          void patchChecklist({ first_project: true });
        }
        setChecklist(state);
        if (!state.dismissed) setVisible(true);
      })
      .catch(() => null);
  }, [hasConversations]);

  const check = useCallback((key: ChecklistKey) => {
    setChecklist((prev) => {
      const next = { ...(prev ?? {}), [key]: true };
      void patchChecklist({ [key]: true });
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    void patchChecklist({ dismissed: true });
  }, []);

  const triggerCmdK = useCallback(() => {
    check("command_palette");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
  }, [check]);

  if (checklist === null || !visible) return null;

  const done = ITEMS.filter((i) => checklist[i.key]).length;
  const allDone = done === ITEMS.length;

  if (allDone) {
    // Auto-dismiss once everything is checked
    void patchChecklist({ dismissed: true });
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="welcome-checklist"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="fixed bottom-6 right-4 md:right-6 z-30 w-[calc(100vw-2rem)] max-w-sm"
      >
        <div
          className="cx-glass-float cx-glass-border p-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ProgressRing done={done} total={ITEMS.length} />
              <div>
                <div className="cx-type-base font-medium">Get started with Praxis</div>
                <div className="cx-type-xs text-[var(--color-text-muted)] mt-0.5">
                  {done} of {ITEMS.length} complete
                </div>
              </div>
            </div>
            <PraxisButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={dismiss}
              aria-label="Dismiss checklist"
            >
              <X size={16} />
            </PraxisButton>
          </div>

          {/* Items */}
          <ul className="space-y-1">
            {ITEMS.map((item) => {
              const done = Boolean(checklist[item.key]);
              const inner = (
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cx-type-base transition-colors ${
                    done
                      ? "opacity-50"
                      : "hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                  }`}
                >
                  <span
                    className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors"
                    style={{
                      borderColor: done ? "var(--color-accent)" : "var(--color-border)",
                      background: done ? "var(--color-accent)" : "transparent",
                    }}
                  >
                    {done && <Check size={11} color="#fff" strokeWidth={3} />}
                  </span>
                  <span className={done ? "line-through text-[var(--color-text-muted)]" : ""}>
                    {item.label}
                  </span>
                </div>
              );

              return (
                <li key={item.key}>
                  {item.action === "cmd-k" ? (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={triggerCmdK}
                      className="w-full text-left"
                      isDisabled={done}
                    >
                      {inner}
                    </PraxisButton>
                  ) : item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => !done && check(item.key)}
                      className="block"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => !done && check(item.key)}
                      className="w-full text-left"
                      isDisabled={done}
                    >
                      {inner}
                    </PraxisButton>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Sidebar progress ring — compact version, rendered in the sidebar nav
export function ChecklistProgressPip({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  if (done >= total) return null;
  return (
    <div
      className="mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg cx-type-xs cursor-default"
      style={{
        background: "color-mix(in srgb, var(--color-accent) 8%, transparent)",
        border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
      }}
      title={`Onboarding: ${done}/${total} steps done`}
    >
      <ProgressRing done={done} total={total} />
      <span className="text-[var(--color-text-muted)] cx-type-xs leading-tight">
        Setup <br />
        <span style={{ color: "var(--color-accent)" }}>
          {done}/{total} done
        </span>
      </span>
    </div>
  );
}
