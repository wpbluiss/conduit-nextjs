"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { PraxisButton } from "@/components/conduit/ui/Button";

type GsKey = "gs_msg" | "gs_connector" | "gs_template" | "gs_invite";
type GsState = Partial<Record<GsKey | "gs_dismissed", boolean>>;

const ITEMS: { key: GsKey; label: string; href: string }[] = [
  { key: "gs_msg", label: "Send your first message", href: "/app" },
  {
    key: "gs_connector",
    label: "Connect a data source",
    href: "/app/settings?tab=integrations",
  },
  {
    key: "gs_template",
    label: "Save a task template",
    href: "/app/settings?tab=templates",
  },
  {
    key: "gs_invite",
    label: "Invite a team member",
    href: "/app/settings?tab=team",
  },
];

async function patchChecklist(patch: Partial<Record<string, boolean>>) {
  await fetch("/api/conduit/onboarding-checklist", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  }).catch(() => null);
}

export function GettingStartedChecklist({
  hasConversations,
}: {
  hasConversations: boolean;
}) {
  const [state, setState] = useState<GsState | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/conduit/onboarding-checklist")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { checklist: Record<string, boolean> } | null) => {
        if (!j) return;
        const s: GsState = {
          gs_msg: j.checklist.gs_msg,
          gs_connector: j.checklist.gs_connector,
          gs_template: j.checklist.gs_template,
          gs_invite: j.checklist.gs_invite,
          gs_dismissed: j.checklist.gs_dismissed,
        };
        if (hasConversations && !s.gs_msg) {
          s.gs_msg = true;
          void patchChecklist({ gs_msg: true });
        }
        setState(s);
        if (!s.gs_dismissed) setVisible(true);
      })
      .catch(() => null);
  }, [hasConversations]);

  const check = useCallback((key: GsKey) => {
    setState((prev: GsState | null) => {
      const next = { ...(prev ?? {}), [key]: true };
      void patchChecklist({ [key]: true });
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    void patchChecklist({ gs_dismissed: true });
  }, []);

  if (!visible || state === null) return null;

  const done = ITEMS.filter((i) => state[i.key]).length;

  if (done === ITEMS.length) {
    void patchChecklist({ gs_dismissed: true });
    return null;
  }

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
              {done} of {ITEMS.length} complete
            </div>
          </div>
          <PraxisButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={dismiss}
            aria-label="Dismiss getting started checklist"
          >
            <X size={12} strokeWidth={1.75} />
          </PraxisButton>
        </div>

        <div
          className="w-full rounded-full overflow-hidden mb-2"
          style={{ height: 2, background: "var(--color-border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${(done / ITEMS.length) * 100}%`,
              background: "var(--color-accent)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <ul className="pb-1.5">
        {ITEMS.map((item) => {
          const checked = Boolean(state[item.key]);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={() => !checked && check(item.key)}
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
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
