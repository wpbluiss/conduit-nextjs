"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import {
  EMPLOYEE_ORDER,
  EMPLOYEES,
  type EmployeeId,
} from "@/lib/conduit/employees";
import { PraxisCard } from "./PraxisCard";
import { PraxisAvatar } from "./PraxisAvatar";
import { PraxisPulsePip } from "./PraxisPulsePip";
import { useDeptTint } from "./usePraxisTint";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type {
  TeamActivityBundle,
  TeamActivityEmployee,
} from "@/lib/conduit/team-activity";

interface Props {
  /** Server-rendered initial activity bundle. */
  initial: TeamActivityBundle;
  /** Set of employee ids the operator's tier allows. */
  allowedEmployees: Set<EmployeeId>;
  /** Optional: most-engaged dept in last 7 days (for FR-004 ordering). */
  mostEngagedDept?: EmployeeId | null;
  /** Polling cadence in ms (R-002 default 60_000). 0 disables polling. */
  pollIntervalMs?: number;
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Opinionated order per FR-004: Atlas first, then most-engaged dept,
 * then remaining in EMPLOYEE_ORDER sequence.
 */
function orderedEmployees(mostEngaged: EmployeeId | null | undefined): EmployeeId[] {
  const rest = EMPLOYEE_ORDER.filter(
    (e) => e !== "jarvis" && e !== mostEngaged,
  );
  const ordered: EmployeeId[] = ["jarvis"];
  if (mostEngaged && mostEngaged !== "jarvis") ordered.push(mostEngaged);
  return [...ordered, ...rest];
}

interface CardSnapshot {
  employee: EmployeeId;
  row: TeamActivityEmployee;
  isAllowed: boolean;
  isStreaming: boolean;
}

/**
 * Per contracts/primitives.md P-008. Renders the 9-card team grid;
 * subscribes to the team-activity poll (60s, visibility-gated);
 * detects newly-shipped artifacts/builds against a session-mounted
 * baseline (R-008 — no faking retroactive aliveness); fires
 * ship-celebration once per genuinely-new ship.
 *
 * Hover wires useDeptTint().setHoverDept for canvas-tint flow.
 * Card click initiates the View Transitions API page-transition
 * with a graceful fallback (R-001).
 */
export function PraxisTeamRoster({
  initial,
  allowedEmployees,
  mostEngagedDept = null,
  pollIntervalMs = 60_000,
}: Props) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const tint = useDeptTint();
  const [bundle, setBundle] = useState<TeamActivityBundle>(initial);

  // Track streaming employee from window event (already dispatched
  // by Chat.tsx — same channel the sidebar pip uses).
  const [streamingEmployee, setStreamingEmployee] =
    useState<EmployeeId | null>(null);
  useEffect(() => {
    const onStream = (e: Event) => {
      const d = (e as CustomEvent<{ employee: EmployeeId | null }>).detail;
      setStreamingEmployee(d?.employee ?? null);
    };
    window.addEventListener("conduit:stream", onStream as EventListener);
    return () =>
      window.removeEventListener("conduit:stream", onStream as EventListener);
  }, []);

  // Ship-celebration detection per R-008.
  // sessionMountedAtMs set once via lazy useState init (Date.now()
  // during render would violate react-hooks/purity).
  const [sessionMountedAtMs] = useState<number>(() => Date.now());
  const lastSeenShip = useRef<Record<string, number>>({});
  const [celebrationDept, setCelebrationDept] = useState<EmployeeId | null>(
    null,
  );

  // Initialize last-seen-ship from the server-rendered initial bundle
  // (effect-side, no setState — just writing to a ref).
  useEffect(() => {
    if (Object.keys(lastSeenShip.current).length > 0) return;
    for (const e of EMPLOYEE_ORDER) {
      const iso = initial.employees[e].last_artifact_created_at;
      lastSeenShip.current[e] = iso ? new Date(iso).getTime() : 0;
    }
  }, [initial]);

  // Polling refresh — every pollIntervalMs while document is visible.
  // Ship-celebration detection happens INSIDE the network response
  // handler (a legitimate external-system-update pattern the React
  // rules allow setState from).
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let celebrationTimer: ReturnType<typeof setTimeout> | null = null;
    const tick = async () => {
      if (document.visibilityState !== "visible") {
        timer = setTimeout(tick, pollIntervalMs);
        return;
      }
      try {
        const res = await fetch("/api/conduit/team-activity", {
          cache: "no-store",
        });
        if (res.ok) {
          const next = (await res.json()) as TeamActivityBundle;
          // Detect new ships against the session-mounted baseline.
          for (const e of EMPLOYEE_ORDER) {
            const iso = next.employees[e].last_artifact_created_at;
            if (!iso) continue;
            const ms = new Date(iso).getTime();
            const lastSeen = lastSeenShip.current[e] ?? 0;
            if (ms > lastSeen && ms > sessionMountedAtMs && !reduced) {
              setCelebrationDept(e);
              if (celebrationTimer) clearTimeout(celebrationTimer);
              celebrationTimer = setTimeout(
                () => setCelebrationDept(null),
                1300,
              );
            }
            lastSeenShip.current[e] = ms;
          }
          setBundle(next);
        }
      } catch {
        // ignore — next tick will retry
      }
      timer = setTimeout(tick, pollIntervalMs);
    };
    timer = setTimeout(tick, pollIntervalMs);
    return () => {
      if (timer) clearTimeout(timer);
      if (celebrationTimer) clearTimeout(celebrationTimer);
    };
  }, [pollIntervalMs, reduced, sessionMountedAtMs]);

  const order = useMemo(
    () => orderedEmployees(mostEngagedDept),
    [mostEngagedDept],
  );

  const cards: CardSnapshot[] = useMemo(
    () =>
      order.map((employee) => ({
        employee,
        row: bundle.employees[employee],
        isAllowed: allowedEmployees.has(employee),
        isStreaming: streamingEmployee === employee,
      })),
    [order, bundle, allowedEmployees, streamingEmployee],
  );

  // Click handler — uses View Transitions API when available + not reduced.
  const onCardClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (reduced) return; // fall through to native nav
      if (typeof document === "undefined") return;
      const startVT = (document as Document & {
        startViewTransition?: (cb: () => void) => unknown;
      }).startViewTransition;
      if (!startVT) return; // browser doesn't support — fall through
      e.preventDefault();
      startVT(() => {
        router.push(href);
      });
    },
    [reduced, router],
  );

  return (
    <div
      className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden"
      style={{ gap: "var(--space-3)", scrollbarWidth: "none" }}
      role="list"
      aria-label="Your Praxis team"
    >
      {cards.map((c) => {
        const meta = EMPLOYEES[c.employee];
        const isInFlightEng =
          c.employee === "engineering" && Boolean(c.row.in_flight_build_id);
        // When Engineering has a build in flight, the click target on the
        // team card routes the user to the cinema (where the build is happening
        // right now) rather than to Engineering's profile page. The profile is
        // still reachable via the sidebar's Team list.
        const href = !c.isAllowed
          ? "/app/settings/billing"
          : isInFlightEng && c.row.in_flight_build_id
            ? `/app/builds/${c.row.in_flight_build_id}`
            : `/app/team/${c.employee}`;
        const isHotLead =
          c.employee === "sales" &&
          c.row.top_lead_score !== null &&
          c.row.top_lead_score >= 80;
        const pulseState: "ambient" | "streaming" | undefined = c.isStreaming
          ? "streaming"
          : "ambient";
        const avatarPulse =
          celebrationDept === c.employee
            ? "celebration"
            : c.isStreaming
            ? "streaming"
            : "ambient";

        // Build the bottom-line copy (one-liner from real data).
        let bottomLine: string;
        if (!c.isAllowed) {
          bottomLine = `Hire ${meta.name}`;
        } else if (isInFlightEng) {
          bottomLine = "Building now →";
        } else if (isHotLead) {
          bottomLine = `Just scored: ${c.row.top_lead_name} · ${c.row.top_lead_score}/100`;
        } else if (c.row.last_artifact_title) {
          bottomLine = c.row.last_artifact_title;
        } else if (c.row.last_active_at) {
          bottomLine = `Active ${relativeTime(c.row.last_active_at)}`;
        } else {
          bottomLine = "Online";
        }

        return (
          <PraxisCard
            key={c.employee}
            variant="team"
            dept={c.employee}
            locked={!c.isAllowed}
            href={href}
            ariaLabel={
              c.isAllowed
                ? `${meta.name} — ${bottomLine}`
                : `Hire ${meta.name} — upgrade required`
            }
            style={{
              viewTransitionName: `vt-employee-${c.employee}`,
            }}
            onMouseEnter={() => c.isAllowed && tint.setHoverDept(c.employee)}
            onMouseLeave={() => c.isAllowed && tint.setHoverDept(null)}
            onFocus={() => c.isAllowed && tint.setHoverDept(c.employee)}
            onBlur={() => c.isAllowed && tint.setHoverDept(null)}
            className="praxis-team-card snap-start shrink-0 w-40 sm:w-auto"
          >
            <ClickInterceptor href={href} onClick={onCardClick}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "var(--space-3)",
                }}
              >
                <PraxisAvatar
                  employee={c.employee}
                  size="lg"
                  pulse={avatarPulse}
                  ghosted={!c.isAllowed}
                />
                {c.isAllowed ? (
                  <PraxisPulsePip
                    employee={c.employee}
                    state={pulseState}
                    size={6}
                  />
                ) : (
                  <Lock
                    size={11}
                    aria-hidden
                    style={{ color: "var(--color-text-muted)", opacity: 0.5 }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: c.isAllowed ? "var(--dept)" : "var(--color-text-muted)",
                  }}
                >
                  {meta.name}
                </div>
                <div className="praxis-microlabel">{meta.role}</div>
              </div>
              <div
                className="praxis-microlabel"
                style={{
                  marginTop: "var(--space-3)",
                  color: c.isAllowed ? "var(--color-text-muted)" : "var(--color-text-muted)",
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={bottomLine}
              >
                {bottomLine}
              </div>
            </ClickInterceptor>
          </PraxisCard>
        );
      })}
    </div>
  );
}

/**
 * Tiny wrapper that swallows clicks on the inner content so the View
 * Transitions trigger on the outer <a>. We can't put onClick on PraxisCard
 * (which is the <a>) because PraxisCard is a server component and we
 * need a client handler; this inner element listens for the bubbled
 * click and calls the parent's handler.
 *
 * Trade-off: feels a little ad-hoc, but it keeps PraxisCard server-safe
 * and the View Transitions wrapper one component deep. Alternative
 * (passing onClick down to PraxisCard) would force PraxisCard to be a
 * client component, which adds JS to every consumer (KPI tiles too).
 */
function ClickInterceptor({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClickCapture={(e) => {
        // Find the closest <a>; if it matches our href, invoke the VT handler.
        const target = (e.target as HTMLElement).closest("a");
        if (target && target.getAttribute("href") === href) {
          onClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, href);
        }
      }}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}
