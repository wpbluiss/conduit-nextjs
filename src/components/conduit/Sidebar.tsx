"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  CreditCard,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sparkles,
  Users2,
  Menu,
  X,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import { SidebarBuildsSection } from "./builds/in-flight/SidebarBuildsSection";
import { EmptyState, ChatEmptySVG } from "./EmptyState";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { ChangelogPopover } from "./ChangelogPopover";
import { NotificationCenter } from "./NotificationCenter";

interface ConvoSummary {
  id: string;
  title: string | null;
  updated_at: string;
  dominant_employee: string | null;
}

interface TeamActivity {
  employee: EmployeeKey;
  last_active_at: string | null;
}

const TEAM: EmployeeKey[] = EMPLOYEE_ORDER as EmployeeKey[];

const COLLAPSED_KEY = "praxis:sidebar:collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function Sidebar({
  userEmail,
  accountName,
  conversations,
  team,
  allowedEmployees,
  tierName,
  accountId,
  inFlightBuildsInitial,
  avatarUrl,
  displayName,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
  team: TeamActivity[];
  allowedEmployees: EmployeeKey[];
  tierName?: string;
  accountId: string;
  inFlightBuildsInitial: InFlightBuild[];
  avatarUrl?: string | null;
  displayName?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const [open, setOpen] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(true);
  // Desktop collapsed state — lazy init from localStorage, persisted.
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

  // Hydrate collapsed state from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // localStorage blocked
      }
      return next;
    });
  };

  const close = () => setOpen(false);

  // ESC key to close on mobile
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus trap + focus management: mobile only (when drawer is open as dialog)
  useEffect(() => {
    // Only trap on mobile viewports where the sidebar is a modal drawer
    if (!open || typeof window === "undefined" || window.innerWidth >= 768) return;
    if (!sidebarRef.current) return;
    const sidebar = sidebarRef.current;
    const focusable = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [open]);

  // Return focus to the hamburger button when the mobile drawer closes
  useEffect(() => {
    if (open || typeof window === "undefined" || window.innerWidth >= 768) return;
    openBtnRef.current?.focus();
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+S → toggle sidebar collapsed state
  useEffect(() => {
    const onToggle = () => toggleCollapsed();
    window.addEventListener("praxis:sidebar:toggle", onToggle);
    return () => window.removeEventListener("praxis:sidebar:toggle", onToggle);
  }, []);

  // Streaming employee: pulsed strong + steady while a Chat is streaming.
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

  // `team` prop reserved for future per-employee status coloring.
  void team;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");
  const isChat = pathname === "/app";

  return (
    <>
      <button
        ref={openBtnRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="app-sidebar"
        className="md:hidden fixed top-3 left-3 z-30 conduit-card p-2"
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop — framer-motion fade, closes on outside tap */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-30 bg-black/60"
            aria-hidden="true"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <motion.aside
        id="app-sidebar"
        ref={sidebarRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Navigation"
        animate={{ width: collapsed ? 56 : 256 }}
        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
        className={`fixed md:static z-40 inset-y-0 left-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ minWidth: collapsed ? 56 : 256 }}
      >
        {/* Header — Praxis wordmark + workspace name + collapse toggle */}
        <div
          className={`px-3 py-4 flex items-center border-b border-[var(--color-border)] ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <Link
              href="/app/workspace"
              onClick={close}
              className="flex items-center"
            >
              <PraxisLogo size={32} withWordmark glow />
            </Link>
          )}
          {collapsed && (
            <Link
              href="/app/workspace"
              onClick={close}
              className="flex items-center justify-center"
              title="Workspace"
            >
              <PraxisLogo size={28} glow />
            </Link>
          )}
          {/* Toggle button — desktop only */}
          {!collapsed && (
            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded"
              >
                <PanelLeftClose size={15} />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="md:hidden text-[var(--color-text-muted)]"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Expand button when collapsed — desktop only */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-[var(--color-border)]">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors p-1 rounded"
            >
              <PanelLeftOpen size={15} />
            </button>
          </div>
        )}

        {/* Workspace name — hidden when collapsed */}
        {!collapsed && (
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Workspace
            </div>
            <div className="mt-1 text-sm font-medium truncate">{accountName}</div>
            <div className="mt-1.5 flex items-center gap-1 w-fit px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--color-accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-accent) 22%, transparent)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/praxis-mark.png" alt="" width={9} height={14} style={{ display: "block", width: 9, height: 14, opacity: 0.8 }} />
              <span className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: "var(--color-accent-hi, var(--color-accent))" }}>Praxis</span>
            </div>
          </div>
        )}

        {/* New chat — quick action */}
        {collapsed ? (
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            title="New chat"
            aria-label="New chat"
            className="mx-auto my-3 conduit-card p-2 flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
          >
            <Plus size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            className="mx-3 my-3 conduit-card px-3 py-2 text-sm flex items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
          >
            <Plus size={14} /> New chat
          </button>
        )}

        {/* Primary nav sections */}
        <nav className="flex-1 overflow-y-auto pb-3" aria-label="Main navigation">
          <NavLink
            href="/app/workspace"
            icon={<LayoutGrid size={14} />}
            label="Workspace"
            active={isActive("/app/workspace")}
            onClick={close}
            collapsed={collapsed}
          />
          <NavLink
            href="/app/team"
            icon={<Users2 size={14} />}
            label="Team"
            active={pathname === "/app/team"}
            onClick={close}
            collapsed={collapsed}
          />

          {/* Team header (collapsible) — hidden in icon-only mode */}
          {!collapsed && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setTeamExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Users2 size={11} /> Team
                </span>
                <span aria-hidden className="text-[10px]">
                  {teamExpanded ? "−" : "+"}
                </span>
              </button>
              {teamExpanded && (
                <ul className="space-y-0.5 mt-1">
                  {TEAM.map((emp) => {
                    const isStreaming = streamingEmployee === emp;
                    const allowed = allowedEmployees.includes(emp);
                    const active = pathname === `/app/team/${emp}`;
                    const Icon = EMPLOYEE_ICON[emp];
                    const rowInner = (
                      <span className="relative flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]">
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                            style={{ background: DEPT_COLOR[emp] }}
                          />
                        )}
                        <span
                          aria-hidden
                          className="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-md"
                          style={{
                            background: `color-mix(in srgb, ${DEPT_COLOR[emp]} 18%, var(--color-surface-elevated))`,
                            color: DEPT_COLOR[emp],
                            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[emp]} 65%, transparent)`,
                          }}
                        >
                          <Icon size={11} strokeWidth={2.25} />
                        </span>
                        <span className="text-[var(--color-text)] truncate flex-1">
                          {employeeLabel(emp)}
                        </span>
                        {!allowed ? (
                          <Lock
                            size={10}
                            aria-label="Locked — upgrade to unlock"
                            className="text-[var(--color-text-muted)]"
                          />
                        ) : (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: DEPT_COLOR[emp],
                              opacity: isStreaming ? 1 : 0.55,
                              boxShadow: isStreaming
                                ? `0 0 6px ${DEPT_COLOR[emp]}`
                                : "none",
                            }}
                            aria-label={isStreaming ? "Active" : "Online"}
                          />
                        )}
                      </span>
                    );
                    return (
                      <li
                        key={emp}
                        title={allowed ? undefined : "Available on a higher plan"}
                      >
                        {allowed ? (
                          <Link
                            href={`/app/team/${emp}`}
                            onClick={close}
                            className="block"
                          >
                            {rowInner}
                          </Link>
                        ) : (
                          <Link
                            href="/app/settings"
                            onClick={close}
                            className="block"
                          >
                            {rowInner}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Team icons — icon-only mode */}
          {collapsed && (
            <div className="mt-2 space-y-0.5 px-2">
              {TEAM.map((emp) => {
                const isStreaming = streamingEmployee === emp;
                const allowed = allowedEmployees.includes(emp);
                const active = pathname === `/app/team/${emp}`;
                const Icon = EMPLOYEE_ICON[emp];
                const btn = (
                  <span
                    className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                    style={{
                      background: active ? `color-mix(in srgb, ${DEPT_COLOR[emp]} 18%, var(--color-surface-elevated))` : undefined,
                      boxShadow: active ? `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[emp]} 65%, transparent)` : undefined,
                    }}
                  >
                    <Icon
                      size={14}
                      strokeWidth={2.25}
                      style={{ color: active ? DEPT_COLOR[emp] : undefined }}
                    />
                    {!allowed && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 flex items-center justify-center">
                        <Lock size={8} className="text-[var(--color-text-muted)]" />
                      </span>
                    )}
                    {allowed && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-[var(--color-surface)]"
                        style={{
                          background: DEPT_COLOR[emp],
                          opacity: isStreaming ? 1 : 0.55,
                          boxShadow: isStreaming ? `0 0 4px ${DEPT_COLOR[emp]}` : "none",
                        }}
                      />
                    )}
                  </span>
                );
                return (
                  <li key={emp} className="list-none flex justify-center" title={employeeLabel(emp)}>
                    {allowed ? (
                      <Link href={`/app/team/${emp}`} onClick={close} className="block">
                        {btn}
                      </Link>
                    ) : (
                      <Link href="/app/settings" onClick={close} className="block">
                        {btn}
                      </Link>
                    )}
                  </li>
                );
              })}
            </div>
          )}

          <div className="mt-3 space-y-0.5">
            <NavLink
              href="/app/voice"
              icon={<Mic size={14} />}
              label="Voice Room"
              active={isActive("/app/voice")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("sales") && (
              <NavLink
                href="/app/team/sales"
                icon={<Sparkles size={14} />}
                label="Leads"
                active={pathname === "/app/team/sales"}
                onClick={close}
                collapsed={collapsed}
              />
            )}
            <NavLink
              href="/app/activity"
              icon={<Activity size={14} />}
              label="Activity"
              active={isActive("/app/activity")}
              onClick={close}
              collapsed={collapsed}
            />
            <NavLink
              href="/app/memory"
              icon={<Brain size={14} />}
              label="Memory"
              active={isActive("/app/memory")}
              onClick={close}
              collapsed={collapsed}
            />
            {allowedEmployees.includes("engineering") && (
              collapsed ? (
                <div className="flex justify-center">
                  <Link
                    href="/app/builds"
                    onClick={close}
                    title="Builds"
                    aria-label="Builds"
                    className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${
                      isActive("/app/builds")
                        ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                    }`}
                  >
                    <span className="relative inline-flex">
                      <Hammer size={14} />
                      <SidebarBuildPip
                        initial={inFlightBuildsInitial}
                        accountId={accountId}
                      />
                    </span>
                  </Link>
                </div>
              ) : (
                <Link
                  href="/app/builds"
                  onClick={close}
                  className={`relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors duration-100 ${
                    isActive("/app/builds")
                      ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                  }`}
                >
                  {isActive("/app/builds") && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
                    />
                  )}
                  <span className="relative inline-flex">
                    <Hammer size={14} />
                    <SidebarBuildPip
                      initial={inFlightBuildsInitial}
                      accountId={accountId}
                    />
                  </span>
                  <span>Builds</span>
                </Link>
              )
            )}
            <NavLink
              href="/app/analytics"
              icon={<BarChart3 size={14} />}
              label="Analytics"
              active={isActive("/app/analytics")}
              onClick={close}
              collapsed={collapsed}
            />
          </div>

          {/* In-flight builds — hidden in icon-only mode */}
          {!collapsed && allowedEmployees.includes("engineering") && (
            <SidebarBuildsSection
              initial={inFlightBuildsInitial}
              accountId={accountId}
            />
          )}

          {/* Empty state — no conversations yet, not in icon-only mode */}
          {!collapsed && conversations.length === 0 && (
            <div className="mt-4 px-3">
              <EmptyState
                icon={<ChatEmptySVG />}
                headline="Start a conversation"
                body="Your AI team is ready. Pick a specialist and say hello."
                cta={
                  <Link
                    href="/app"
                    onClick={close}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
                  >
                    <Plus size={12} />
                    New Chat
                  </Link>
                }
                className="border-dashed"
              />
            </div>
          )}

          {/* Recent conversations — hidden in icon-only mode */}
          {!collapsed && conversations.length > 0 && (
            <div className="mt-4">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Recent
              </div>
              <div className="space-y-0.5">
                {conversations.slice(0, 8).map((c) => {
                  const active = isChat && activeId === c.id;
                  const dom = c.dominant_employee;
                  const isTeam = dom === "team";
                  const empKey = (
                    dom && (TEAM as string[]).includes(dom) ? dom : "jarvis"
                  ) as EmployeeKey;
                  return (
                    <Link
                      key={c.id}
                      href={`/app?c=${c.id}`}
                      onClick={close}
                      className={`relative flex items-center gap-2 pl-3 pr-3 py-1.5 text-xs rounded-lg transition-colors duration-100 ${
                        active
                          ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
                          style={{
                            background: isTeam
                              ? "var(--color-accent)"
                              : DEPT_COLOR[empKey],
                          }}
                        />
                      )}
                      {isTeam ? (
                        <span
                          aria-hidden
                          className="inline-block w-3 h-3 rounded-full shrink-0"
                          style={{
                            background:
                              "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                          }}
                        />
                      ) : (
                        (() => {
                          const RecentIcon = EMPLOYEE_ICON[empKey];
                          return (
                            <span
                              aria-hidden
                              className="inline-flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-[4px]"
                              style={{
                                background: `color-mix(in srgb, ${DEPT_COLOR[empKey]} 18%, var(--color-surface-elevated))`,
                                color: DEPT_COLOR[empKey],
                                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${DEPT_COLOR[empKey]} 60%, transparent)`,
                              }}
                            >
                              <RecentIcon size={9} strokeWidth={2.5} />
                            </span>
                          );
                        })()
                      )}
                      <span className="truncate">
                        {c.title || "Untitled chat"}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {conversations.length > 8 && (
                <Link
                  href="/app/conversations"
                  onClick={close}
                  className="mt-1 flex items-center px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  See all ({conversations.length})
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Bottom — settings, billing, sign out, email, tier */}
        <div
          className="pt-2 pb-3 border-t border-[var(--color-border)] space-y-0.5"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
        >
          {collapsed ? (
            // Icon-only bottom strip
            <div className="flex flex-col items-center gap-1 px-2">
              <div className="flex justify-center"><ChangelogPopover /></div>
              <div className="flex justify-center"><NotificationCenter /></div>
              <Link href="/app/settings" title="Settings" aria-label="Settings" onClick={close}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${isActive("/app/settings") ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
                <Settings size={14} />
              </Link>
              <Link href="/app/settings/billing" title="Billing" aria-label="Billing" onClick={close}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${isActive("/app/settings/billing") ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}>
                <CreditCard size={14} />
              </Link>
              <form action="/auth/sign-out" method="post">
                <button type="submit" title="Sign out" aria-label="Sign out"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                  <LogOut size={14} />
                </button>
              </form>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 overflow-hidden border border-[var(--color-border)] mt-1"
                style={{ background: "var(--color-surface-elevated)" }}
                title={displayName || userEmail}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: "var(--color-accent-hi)" }}>
                    {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="px-2 space-y-0.5">
              <ChangelogPopover />
              <div className="px-1"><NotificationCenter /></div>
              <NavLink
                href="/app/settings"
                icon={<Settings size={14} />}
                label="Settings"
                active={
                  pathname === "/app/settings" ||
                  (pathname.startsWith("/app/settings/") &&
                    !pathname.startsWith("/app/settings/billing"))
                }
                onClick={close}
                small
              />
              <NavLink
                href="/app/settings/billing"
                icon={<CreditCard size={14} />}
                label="Billing"
                active={isActive("/app/settings/billing")}
                onClick={close}
                small
              />
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </form>
              <div className="px-3 pt-2 flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0 overflow-hidden border border-[var(--color-border)]"
                  style={{ background: "var(--color-surface-elevated)" }}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: "var(--color-accent-hi)" }}>
                      {(displayName || userEmail)[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] truncate min-w-0">
                  {displayName || userEmail}
                </span>
              </div>
              <div className="px-3 text-[10px] text-[var(--color-text-muted)]">
                Praxis Flow{tierName ? ` · ${tierName}` : ""}
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
  onClick,
  small = false,
  collapsed = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  small?: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <Link
          href={href}
          onClick={onClick}
          title={label}
          aria-label={label}
          className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-100 ${
            active
              ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
          }`}
        >
          {active && (
            <span
              aria-hidden
              className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
            />
          )}
          {icon}
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 ${
        small ? "py-1.5 text-xs" : "py-2 text-sm"
      } rounded-lg transition-colors duration-100 ${
        active
          ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
      }`}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
        />
      )}
      {icon}
      <span>{label}</span>
    </Link>
  );
}
