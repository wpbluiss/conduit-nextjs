"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  MessageSquare,
  FileText,
  Lock,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

interface ConvoSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

interface TeamActivity {
  employee: EmployeeKey;
  last_active_at: string | null;
}

const TEAM: EmployeeKey[] = EMPLOYEE_ORDER as EmployeeKey[];

export function Sidebar({
  userEmail,
  accountName,
  conversations,
  team,
  allowedEmployees,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
  team: TeamActivity[];
  allowedEmployees: EmployeeKey[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  // Streaming employee: pulsed strong + steady while a Chat is streaming.
  // Chat dispatches `conduit:stream` CustomEvents; this listens.
  const [streamingEmployee, setStreamingEmployee] =
    useState<EmployeeKey | null>(null);
  useEffect(() => {
    const onStream = (e: Event) => {
      const detail = (e as CustomEvent<{ employee: EmployeeKey | null }>)
        .detail;
      setStreamingEmployee(detail?.employee ?? null);
    };
    window.addEventListener("conduit:stream", onStream as EventListener);
    return () =>
      window.removeEventListener("conduit:stream", onStream as EventListener);
  }, []);

  // `team` prop reserved for future per-convo dominant-employee coloring.
  void team;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-30 conduit-card p-2"
      >
        <Menu size={18} />
      </button>

      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200`}
      >
        <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <Link
            href="/app"
            onClick={close}
            className="flex items-center gap-2"
          >
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
            <span className="serif text-xl text-[var(--color-text)]">
              Conduit
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="md:hidden text-[var(--color-text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Workspace
          </div>
          <div className="mt-1 text-sm truncate">{accountName}</div>
        </div>

        <button
          type="button"
          onClick={() => {
            close();
            router.push("/app");
            router.refresh();
          }}
          className="mx-4 mb-3 conduit-card px-3 py-2 text-sm flex items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
        >
          <Plus size={14} /> New chat
        </button>

        <div className="px-4 mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Recent
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {conversations.length === 0 && (
            <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">
              Your team is online. What are we building today?
            </p>
          )}
          {conversations.map((c) => {
            const active = activeId === c.id;
            return (
              <Link
                key={c.id}
                href={`/app?c=${c.id}`}
                onClick={close}
                className={`relative flex items-center gap-2 pl-3 pr-3 py-2 text-sm rounded-lg transition-colors duration-100 ${
                  active
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                    style={{ background: "var(--color-accent)" }}
                  />
                )}
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">
                  {c.title || "Untitled chat"}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pt-3 pb-2 border-t border-[var(--color-border)]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2">
            Team status
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {TEAM.map((emp, slot) => {
              const isStreaming = streamingEmployee === emp;
              const allowed = allowedEmployees.includes(emp);
              return (
                <li
                  key={emp}
                  className={`flex items-center gap-2 text-xs ${
                    allowed ? "" : "opacity-50"
                  }`}
                  title={
                    allowed
                      ? undefined
                      : "Available on a higher plan"
                  }
                >
                  <span
                    aria-hidden
                    data-slot={slot % 4}
                    style={{ ["--dept" as string]: DEPT_COLOR[emp] }}
                    className={`team-dot ${
                      !allowed
                        ? ""
                        : isStreaming
                          ? "streaming"
                          : "ambient"
                    }`}
                  />
                  <span className="text-[var(--color-text)] truncate">
                    {employeeLabel(emp)}
                  </span>
                  {!allowed ? (
                    <Lock
                      size={10}
                      aria-label="Locked"
                      className="ml-auto text-[var(--color-text-muted)]"
                    />
                  ) : (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{
                        background: isStreaming
                          ? DEPT_COLOR[emp]
                          : "var(--color-text-muted)",
                        opacity: isStreaming ? 1 : 0.4,
                      }}
                      aria-label={isStreaming ? "Active" : "Online"}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-2 py-3 border-t border-[var(--color-border)] space-y-0.5">
          <Link
            href="/app/artifacts"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors duration-100 ${
              pathname.startsWith("/app/artifacts")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
            }`}
          >
            <FileText size={14} /> Artifacts
          </Link>
          <Link
            href="/app/settings"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors duration-100 ${
              pathname.startsWith("/app/settings")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
            }`}
          >
            <Settings size={14} /> Settings
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
            >
              <LogOut size={14} /> Sign out
            </button>
          </form>
          <div className="px-3 pt-1 text-[10px] text-[var(--color-text-muted)] truncate">
            {userEmail}
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-hidden
        />
      )}
    </>
  );
}
