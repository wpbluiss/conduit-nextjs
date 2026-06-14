"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Brain,
  CreditCard,
  ChevronLeft,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  Mic,
  Plus,
  Settings,
  Sparkles,
  Users2,
  Menu,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import type { InFlightBuild } from "@/lib/engineering/in-flight";

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

const EXPANDED_W = 256;
const COLLAPSED_W = 60;
const SIDEBAR_COOKIE = "sidebar_collapsed";

function writeSidebarCookie(value: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
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
  initialCollapsed = false,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
  team: TeamActivity[];
  allowedEmployees: EmployeeKey[];
  tierName?: string;
  accountId: string;
  inFlightBuildsInitial: InFlightBuild[];
  initialCollapsed?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");
  const reducedMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeSidebarCookie(next);
      return next;
    });
  };
  const [open, setOpen] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);

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

      <TooltipProvider delayDuration={300}>
      <motion.aside
        id="app-sidebar"
        ref={sidebarRef}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Navigation"
        animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
        className={`fixed md:static z-40 inset-y-0 left-0 overflow-hidden bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      >
        {/* Header — Praxis wordmark + workspace name */}
        <div className={`${collapsed ? "px-2 justify-center" : "px-5"} py-4 flex items-center justify-between border-b border-[var(--color-border)]`}>
          <Link
            href="/app/workspace"
            onClick={close}
            className="flex items-center"
            aria-label="Workspace"
          >
            <PraxisLogo size={32} withWordmark={!collapsed} glow />
          </Link>
          {!collapsed && (
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="md:hidden text-[var(--color-text-muted)]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="px-5 py-3 border-b border-[var(--color-border)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Workspace
            </div>
            <div className="mt-1 text-sm truncate">{accountName}</div>
          </div>
        )}

        {/* New chat — quick action */}
        <SidebarTooltip label="New chat" collapsed={collapsed}>
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/app");
              router.refresh();
            }}
            className={`mx-2 my-3 conduit-card ${collapsed ? "px-0 py-2 justify-center" : "px-3 py-2"} text-sm flex items-center gap-2 hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors`}
          >
            <Plus size={14} />
            {!collapsed && <span>New chat</span>}
          </button>
        </SidebarTooltip>

        {/* Primary nav sections */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3">
          <NavLink
            href="/app/workspace"
            icon={<LayoutGrid size={14} />}
            label="Workspace"
            active={isActive("/app/workspace")}
            collapsed={collapsed}
            onClick={close}
          />

          {/* Team header */}
          <div className="mt-3">
            {!collapsed && (
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
            )}
            {(collapsed || teamExpanded) && (
              <ul className="space-y-0.5 mt-1">
                {TEAM.map((emp) => {
                  const isStreaming = streamingEmployee === emp;
                  const allowed = allowedEmployees.includes(emp);
                  const active = pathname === `/app/team/${emp}`;
                  const Icon = EMPLOYEE_ICON[emp];
                  const rowInner = (
                    <span className={`relative flex items-center ${collapsed ? "justify-center px-0 py-1.5" : "gap-2 px-3 py-1.5"} text-xs rounded-lg transition-colors duration-100 hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]`}>
                      {active && !collapsed && (
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
                      {!collapsed && (
                        <>
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
                        </>
                      )}
                    </span>
                  );
                  return (
                    <li
                      key={emp}
                      title={allowed ? undefined : "Available on a higher plan"}
                    >
                      <SidebarTooltip label={employeeLabel(emp)} collapsed={collapsed}>
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
                      </SidebarTooltip>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3 space-y-0.5">
            <NavLink
              href="/app/voice"
              icon={<Mic size={14} />}
              label="Voice Room"
              active={isActive("/app/voice")}
              collapsed={collapsed}
              onClick={close}
            />
            {allowedEmployees.includes("sales") && (
              <NavLink
                href="/app/team/sales"
                icon={<Sparkles size={14} />}
                label="Leads"
                active={pathname === "/app/team/sales"}
                collapsed={collapsed}
                onClick={close}
              />
            )}
            <NavLink
              href="/app/memory"
              icon={<Brain size={14} />}
              label="Memory"
              active={isActive("/app/memory")}
              collapsed={collapsed}
              onClick={close}
            />
            {allowedEmployees.includes("engineering") && (
              <SidebarTooltip label="Builds" collapsed={collapsed}>
              <Link
                href="/app/builds"
                onClick={close}
                className={`relative flex items-center ${collapsed ? "justify-center px-0" : "gap-2 px-3"} py-2 text-sm rounded-lg transition-colors duration-100 ${
                  isActive("/app/builds")
                    ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
                }`}
              >
                {isActive("/app/builds") && !collapsed && (
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
                {!collapsed && <span>Builds</span>}
              </Link>
              </SidebarTooltip>
            )}
            <NavLink
              href="/app/analytics"
              icon={<BarChart3 size={14} />}
              label="Analytics"
              active={isActive("/app/analytics")}
              collapsed={collapsed}
              onClick={close}
            />
          </div>

          {/* Recent conversations — hidden when collapsed (no meaningful icon) */}
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

        {/* Bottom — settings, billing, sign out, email, tier + collapse toggle */}
        {/* pb-safe: env(safe-area-inset-bottom) respects iOS home-bar notch */}
        <div
          className="px-2 pt-2 pb-3 border-t border-[var(--color-border)] space-y-0.5"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" }}
        >
          {/* Collapse toggle — desktop only */}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden md:flex items-center ${collapsed ? "justify-center px-0" : "gap-2 px-3"} py-1.5 w-full text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100`}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              className="inline-flex shrink-0"
            >
              <ChevronLeft size={14} />
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </button>

          <NavLink
            href="/app/settings"
            icon={<Settings size={14} />}
            label="Settings"
            active={
              pathname === "/app/settings" ||
              (pathname.startsWith("/app/settings/") &&
                !pathname.startsWith("/app/settings/billing"))
            }
            collapsed={collapsed}
            onClick={close}
            small
          />
          <NavLink
            href="/app/settings/billing"
            icon={<CreditCard size={14} />}
            label="Billing"
            active={isActive("/app/settings/billing")}
            collapsed={collapsed}
            onClick={close}
            small
          />
          <SidebarTooltip label="Sign out" collapsed={collapsed}>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className={`w-full flex items-center ${collapsed ? "justify-center px-0" : "gap-2 px-3"} py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] rounded-lg transition-colors duration-100`}
              >
                <LogOut size={14} />
                {!collapsed && <span>Sign out</span>}
              </button>
            </form>
          </SidebarTooltip>
          {!collapsed && (
            <>
              <div className="px-3 pt-2 text-[10px] text-[var(--color-text-muted)] truncate">
                {userEmail}
              </div>
              <div className="px-3 text-[10px] text-[var(--color-text-muted)]">
                Praxis Flow{tierName ? ` · ${tierName}` : ""}
              </div>
            </>
          )}
        </div>
      </motion.aside>
      </TooltipProvider>

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
  return (
    <SidebarTooltip label={label} collapsed={collapsed}>
      <Link
        href={href}
        onClick={onClick}
        className={`relative flex items-center ${collapsed ? "justify-center px-0" : "gap-2 px-3"} ${
          small ? "py-1.5 text-xs" : "py-2 text-sm"
        } rounded-lg transition-colors duration-100 ${
          active
            ? "bg-[var(--color-surface-elevated)] text-[var(--color-text)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]"
        }`}
      >
        {active && !collapsed && (
          <span
            aria-hidden
            className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[var(--color-accent)]"
          />
        )}
        {icon}
        {!collapsed && <span>{label}</span>}
      </Link>
    </SidebarTooltip>
  );
}

function SidebarTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
