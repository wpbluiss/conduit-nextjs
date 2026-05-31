"use client";

// Praxis Design Language — R18 Sidebar slice
//
// The primary chrome, rebuilt on pdl/* primitives + --pdl-* tokens.
// Closes spec findings S-1 (team list → right-flyout popover), S-2
// (always-visible "+ New chat" → one quiet icon affordance), S-3
// (icon-default rail, hover-peek + pin-lock), S-4 (quiet active cue,
// no heavy stripe), C-1 (token-aware mobile scrim, no bg-black/60).
//
// Behaviours preserved from the prior rail: streaming employee dot
// (conduit:stream), in-flight build pip, allowed-employee lock gating,
// recent conversations, tier line, sign-out, mobile open/close.

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Brain,
  ChevronRight,
  CreditCard,
  Hammer,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  Mic,
  Pin,
  PinOff,
  Plus,
  Settings,
  Sparkles,
  UserRound,
  Users2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { PraxisLogo } from "./PraxisLogo";
import { SidebarBuildPip } from "./builds/in-flight/SidebarBuildPip";
import type { InFlightBuild } from "@/lib/engineering/in-flight";
import { Popover } from "./pdl/Popover";

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
const PIN_KEY = "praxis:sidebar:pinned";

export function Sidebar({
  userEmail,
  accountName,
  conversations,
  team,
  allowedEmployees,
  tierName,
  accountId,
  inFlightBuildsInitial,
}: {
  userEmail: string;
  accountName: string;
  conversations: ConvoSummary[];
  team: TeamActivity[];
  allowedEmployees: EmployeeKey[];
  tierName?: string;
  accountId: string;
  inFlightBuildsInitial: InFlightBuild[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const activeId = params.get("c");

  // Mobile off-canvas state.
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Desktop pin (hover-peek by default; pin locks the panel open in flow).
  // SSR renders collapsed; the persisted pin is applied post-hydration so
  // there is no markup mismatch.
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(PIN_KEY) === "1") setPinned(true);
    } catch {
      /* private mode / disabled storage — fall back to unpinned */
    }
  }, []);
  const togglePin = useCallback(() => {
    setPinned((v) => {
      const next = !v;
      try {
        localStorage.setItem(PIN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Streaming employee — pulsed dot in the team flyout + pip on the Team icon.
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
  const onTeam = pathname.startsWith("/app/team/");
  const showLeads = allowedEmployees.includes("sales");
  const showBuilds = allowedEmployees.includes("engineering");

  const newChat = () => {
    close();
    router.push("/app");
    router.refresh();
  };

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="pdl-sidebar-menu-btn"
      >
        <Menu size={18} />
      </button>

      <aside
        className="pdl-sidebar-rail"
        data-pinned={pinned || undefined}
        data-open={open || undefined}
      >
        <div className="pdl-sidebar-panel">
          {/* Header — Praxis mark + wordmark + pin / close */}
          <div className="pdl-sidebar-header">
            <Link
              href="/app/workspace"
              onClick={close}
              className="pdl-sidebar-brand"
              aria-label="Praxis — Workspace"
            >
              <span className="pdl-brand-icon">
                <PraxisLogo size={24} glow />
              </span>
              <span className="pdl-brand-word pdl-reveal">Praxis</span>
            </Link>
            <button
              type="button"
              onClick={togglePin}
              className="pdl-pin-btn pdl-reveal"
              data-pinned={pinned || undefined}
              aria-label={pinned ? "Unpin sidebar" : "Pin sidebar open"}
              aria-pressed={pinned}
            >
              {pinned ? <PinOff size={15} /> : <Pin size={15} />}
            </button>
            <button
              type="button"
              onClick={close}
              className="pdl-sidebar-close"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="pdl-sidebar-nav">
            {/* New chat — the single quiet add affordance (S-2) */}
            <button
              type="button"
              onClick={newChat}
              className="pdl-nav-item"
              data-variant="newchat"
              data-active={isChat && !activeId ? true : undefined}
              aria-label="New chat"
            >
              <span className="pdl-nav-icon">
                <Plus size={18} />
              </span>
              <span className="pdl-nav-label">New chat</span>
            </button>

            <NavItem
              href="/app/workspace"
              Icon={LayoutGrid}
              label="Workspace"
              active={isActive("/app/workspace")}
              onClick={close}
            />
            <NavItem
              href="/app/memory"
              Icon={Brain}
              label="Memory"
              active={isActive("/app/memory")}
              onClick={close}
            />

            {/* Team — single item, right-flyout to the 9 specialists (S-1) */}
            <Popover
              side="right"
              align="start"
              className="pdl-sidebar-flyout"
              ariaLabel="Your team"
              trigger={
                <button
                  type="button"
                  className="pdl-nav-item"
                  data-active={onTeam || undefined}
                  aria-label="Team"
                >
                  <span className="pdl-nav-icon">
                    <span className="pdl-glyph-wrap">
                      <Users2 size={18} />
                      {streamingEmployee && (
                        <span
                          className="pdl-nav-streaming-pip"
                          aria-hidden
                        />
                      )}
                    </span>
                  </span>
                  <span className="pdl-nav-label">Team</span>
                  <span className="pdl-nav-trail pdl-reveal">
                    <ChevronRight size={14} />
                  </span>
                </button>
              }
            >
              {(closeFlyout) => (
                <TeamFlyout
                  allowedEmployees={allowedEmployees}
                  streamingEmployee={streamingEmployee}
                  pathname={pathname}
                  onNavigate={() => {
                    closeFlyout();
                    close();
                  }}
                />
              )}
            </Popover>

            {showBuilds && (
              <Link
                href="/app/builds"
                onClick={close}
                className="pdl-nav-item"
                data-active={isActive("/app/builds") || undefined}
              >
                <span className="pdl-nav-icon">
                  <span className="pdl-glyph-wrap">
                    <Hammer size={18} />
                    <SidebarBuildPip
                      initial={inFlightBuildsInitial}
                      accountId={accountId}
                    />
                  </span>
                </span>
                <span className="pdl-nav-label">Builds</span>
              </Link>
            )}

            <NavItem
              href="/app/voice"
              Icon={Mic}
              label="Voice Room"
              active={isActive("/app/voice")}
              onClick={close}
            />
            {showLeads && (
              <NavItem
                href="/app/team/sales"
                Icon={Sparkles}
                label="Leads"
                active={pathname === "/app/team/sales"}
                onClick={close}
              />
            )}
            <NavItem
              href="/app/analytics"
              Icon={BarChart3}
              label="Analytics"
              active={isActive("/app/analytics")}
              onClick={close}
            />

            {/* Recent — reveal-only, max 4 (P3 density) */}
            {conversations.length > 0 && (
              <div className="pdl-collapsible">
                <div className="pdl-nav-group-label">Recent</div>
                {conversations.slice(0, 4).map((c) => {
                  const active = isChat && activeId === c.id;
                  const dom = c.dominant_employee;
                  const isTeamConvo = dom === "team";
                  const empKey = (
                    dom && (TEAM as string[]).includes(dom) ? dom : "jarvis"
                  ) as EmployeeKey;
                  const RecentIcon = EMPLOYEE_ICON[empKey];
                  return (
                    <Link
                      key={c.id}
                      href={`/app?c=${c.id}`}
                      onClick={close}
                      className="pdl-recent-row"
                      data-active={active || undefined}
                    >
                      <span className="pdl-recent-glyph">
                        {isTeamConvo ? (
                          <span
                            className="pdl-dept-glyph"
                            data-team="true"
                            aria-hidden
                          />
                        ) : (
                          <span
                            className="pdl-dept-glyph"
                            style={
                              {
                                ["--dept"]: DEPT_COLOR[empKey],
                              } as React.CSSProperties
                            }
                            aria-hidden
                          >
                            <RecentIcon size={11} strokeWidth={2.5} />
                          </span>
                        )}
                      </span>
                      <span className="pdl-recent-title">
                        {c.title || "Untitled chat"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          {/* Footer — account menu (settings, billing, sign-out, tier) */}
          <div className="pdl-sidebar-footer">
            <Popover
              side="top"
              align="start"
              className="pdl-sidebar-flyout"
              ariaLabel="Account menu"
              trigger={
                <button
                  type="button"
                  className="pdl-nav-item"
                  aria-label="Account menu"
                >
                  <span className="pdl-nav-icon">
                    <UserRound size={18} />
                  </span>
                  <span className="pdl-nav-label">{accountName}</span>
                </button>
              }
            >
              {(closeMenu) => (
                <AccountMenu
                  accountName={accountName}
                  userEmail={userEmail}
                  tierName={tierName}
                  onNavigate={() => {
                    closeMenu();
                    close();
                  }}
                />
              )}
            </Popover>
          </div>
        </div>
      </aside>

      {/* Mobile scrim — token-aware (C-1: no more bg-black/60) */}
      {open && (
        <div
          onClick={close}
          className="pdl-scrim md:hidden"
          style={{ zIndex: 55 }}
          aria-hidden
        />
      )}
    </>
  );
}

function NavItem({
  href,
  Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  Icon: LucideIcon;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="pdl-nav-item"
      data-active={active || undefined}
    >
      <span className="pdl-nav-icon">
        <Icon size={18} />
      </span>
      <span className="pdl-nav-label">{label}</span>
    </Link>
  );
}

function TeamFlyout({
  allowedEmployees,
  streamingEmployee,
  pathname,
  onNavigate,
}: {
  allowedEmployees: EmployeeKey[];
  streamingEmployee: EmployeeKey | null;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="pdl-flyout">
      <div className="pdl-flyout-head">
        <div className="pdl-flyout-title">Your team</div>
        <div className="pdl-flyout-sub">9 specialists</div>
      </div>
      {TEAM.map((emp) => {
        const allowed = allowedEmployees.includes(emp);
        const active = pathname === `/app/team/${emp}`;
        const streaming = streamingEmployee === emp;
        const Icon = EMPLOYEE_ICON[emp];
        return (
          <Link
            key={emp}
            href={allowed ? `/app/team/${emp}` : "/app/settings"}
            onClick={onNavigate}
            className="pdl-flyout-row"
            data-active={active || undefined}
            data-locked={!allowed || undefined}
            title={allowed ? undefined : "Available on a higher plan"}
          >
            <span
              className="pdl-dept-glyph"
              style={{ ["--dept"]: DEPT_COLOR[emp] } as React.CSSProperties}
              aria-hidden
            >
              <Icon size={12} strokeWidth={2.25} />
            </span>
            <span className="pdl-flyout-label">{employeeLabel(emp)}</span>
            {allowed ? (
              <span
                className="pdl-status-dot"
                data-streaming={streaming || undefined}
                style={{ ["--dept"]: DEPT_COLOR[emp] } as React.CSSProperties}
                aria-label={streaming ? "Active now" : "Online"}
              />
            ) : (
              <Lock
                size={12}
                className="text-[var(--pdl-text-muted)]"
                aria-label="Locked — upgrade to unlock"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function AccountMenu({
  accountName,
  userEmail,
  tierName,
  onNavigate,
}: {
  accountName: string;
  userEmail: string;
  tierName?: string;
  onNavigate: () => void;
}) {
  return (
    <div className="pdl-flyout">
      <div className="pdl-flyout-head">
        <div className="pdl-flyout-title">{accountName}</div>
        <div className="pdl-flyout-sub">{userEmail}</div>
        <span className="pdl-tier-chip">
          Praxis Flow{tierName ? ` · ${tierName}` : ""}
        </span>
      </div>
      <Link
        href="/app/settings"
        onClick={onNavigate}
        className="pdl-flyout-row"
      >
        <Settings size={15} />
        <span className="pdl-flyout-label">Settings</span>
      </Link>
      <Link
        href="/app/settings/billing"
        onClick={onNavigate}
        className="pdl-flyout-row"
      >
        <CreditCard size={15} />
        <span className="pdl-flyout-label">Billing</span>
      </Link>
      <div className="pdl-flyout-sep" />
      <form action="/auth/sign-out" method="post">
        <button type="submit" className="pdl-flyout-row">
          <LogOut size={15} />
          <span className="pdl-flyout-label">Sign out</span>
        </button>
      </form>
    </div>
  );
}
