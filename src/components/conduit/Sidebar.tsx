"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Plus,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";

interface ConvoSummary {
  id: string;
  title: string | null;
  updated_at: string;
}

interface TeamActivity {
  employee: EmployeeKey;
  last_active_at: string | null;
}

const TEAM: EmployeeKey[] = ["jarvis", "marketing", "sales", "engineering"];

export function Sidebar({
  userEmail,
  accountName,
  conversations,
  team,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
  team: TeamActivity[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const lastActiveMap = new Map(
    team.map((t) => [t.employee, t.last_active_at]),
  );

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
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]"
                }`}
              >
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
          <ul className="space-y-1.5">
            {TEAM.map((emp) => {
              const lastActiveAt = lastActiveMap.get(emp);
              const ts = lastActiveAt ? Date.parse(lastActiveAt) : NaN;
              const active = !isNaN(ts) && Date.now() - ts < 60_000;
              return (
                <li key={emp} className="flex items-center gap-2 text-xs">
                  <span
                    aria-hidden
                    style={{ ["--dept" as string]: DEPT_COLOR[emp] }}
                    className={`team-dot ${active ? "active" : ""}`}
                  />
                  <span className="text-[var(--color-text)]">
                    {employeeLabel(emp)}
                  </span>
                  <span className="ml-auto text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.15em]">
                    {active ? "Active" : "Online"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-2 py-3 border-t border-[var(--color-border)] space-y-0.5">
          <Link
            href="/app/artifacts"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname.startsWith("/app/artifacts")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <FileText size={14} /> Artifacts
          </Link>
          <Link
            href="/app/settings"
            onClick={close}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname.startsWith("/app/settings")
                ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            <Settings size={14} /> Settings
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] rounded-lg"
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
