"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
// Note: routeDept is derived directly from pathname + initialDept (no
// useEffect) to satisfy react-hooks/set-state-in-effect.

import { usePathname } from "next/navigation";
import type { EmployeeId } from "@/lib/conduit/employees";
import { isValidEmployee } from "@/lib/conduit/employees";
import {
  PraxisTintContext,
  useDeptTint,
  type PraxisTintState,
  type TintStrength,
} from "./usePraxisTint";

interface Props {
  children: ReactNode;
  /** Initial server-rendered dept (e.g. most-recently-active on dashboard). */
  initialDept?: EmployeeId | null;
  /** Defaults to "wash"; chat surfaces flip to "wash-strong" when pinned. */
  initialStrength?: TintStrength;
}

/**
 * Writes data-dept + data-tint-strength on the nearest ancestor
 * element with class `.praxis-canvas-tint`. CSS handles the visual
 * transition (240ms in / 480ms out via the .praxis-canvas-tint
 * `transition` rule).
 *
 * State machine (per research.md R-005):
 *   priority: streamDept > pinDept > hoverDept > routeDefault > none
 *
 * Per-route default behavior (via usePathname()):
 *   - /app/workspace  → initial dept comes from initialDept prop
 *                       (server-computed most-recently-active employee).
 *                       Hover updates it transiently.
 *   - /app            → no default until pinned or streaming.
 *   - /app/team/[employee] → page-side calls setRouteDept on mount
 *                            via PraxisRoomBinder.
 *   - elsewhere → cleared.
 *
 * Subscribes to the `conduit:stream` window event already dispatched
 * by Chat.tsx so the dashboard tab tints the moment any chat surface
 * starts streaming.
 */
export function PraxisCanvasTintProvider({
  children,
  initialDept = null,
  initialStrength = "wash",
}: Props) {
  const pathname = usePathname();

  const [hoverDept, setHoverDept] = useState<EmployeeId | null>(null);
  const [pinDept, setPinDept] = useState<EmployeeId | null>(null);
  const [streamDept, setStreamDept] = useState<EmployeeId | null>(null);

  // Route default derives from pathname directly — no useState/useEffect.
  //   /app/workspace → initialDept (server-rendered most-recent activity)
  //   /app/team/...  → null (PraxisRoomBinder pins via setHoverDept on mount)
  //   /app and else  → null
  const routeDept = useMemo<EmployeeId | null>(() => {
    if (pathname === "/app/workspace") return initialDept;
    return null;
  }, [pathname, initialDept]);

  // Listen for conduit:stream events (already dispatched by Chat.tsx).
  useEffect(() => {
    const onStream = (e: Event) => {
      const detail = (e as CustomEvent<{ employee: EmployeeId | null }>).detail;
      const dept = detail?.employee ?? null;
      if (dept && isValidEmployee(dept)) {
        setStreamDept(dept);
      } else {
        setStreamDept(null);
      }
    };
    window.addEventListener("conduit:stream", onStream as EventListener);
    return () =>
      window.removeEventListener("conduit:stream", onStream as EventListener);
  }, []);

  // Compute effective dept by priority.
  const currentDept: EmployeeId | null =
    streamDept ?? pinDept ?? hoverDept ?? routeDept ?? null;

  // Strength: pin uses "strong" wash; everything else uses default.
  const currentStrength: TintStrength =
    pinDept && currentDept === pinDept ? "wash-strong" : initialStrength;

  // Write attributes onto the nearest .praxis-canvas-tint ancestor.
  const markerRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!markerRef.current) return;
    let node: HTMLElement | null = markerRef.current.parentElement;
    while (node) {
      if (node.classList?.contains("praxis-canvas-tint")) {
        canvasRef.current = node;
        break;
      }
      node = node.parentElement;
    }
  }, []);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) return;
    if (currentDept) {
      node.setAttribute("data-dept", currentDept);
    } else {
      node.removeAttribute("data-dept");
    }
    if (currentStrength === "wash-strong") {
      node.setAttribute("data-tint-strength", "strong");
    } else {
      node.removeAttribute("data-tint-strength");
    }
  }, [currentDept, currentStrength]);

  const clearPin = useCallback(() => setPinDept(null), []);
  const setHoverDeptStable = useCallback(
    (d: EmployeeId | null) => setHoverDept(d),
    [],
  );
  const setPinDeptStable = useCallback(
    (d: EmployeeId | null) => setPinDept(d),
    [],
  );
  const setStreamDeptStable = useCallback(
    (d: EmployeeId | null) => setStreamDept(d),
    [],
  );

  const value: PraxisTintState = useMemo(
    () => ({
      currentDept,
      currentStrength,
      setHoverDept: setHoverDeptStable,
      setPinDept: setPinDeptStable,
      clearPin,
      setStreamDept: setStreamDeptStable,
    }),
    [
      currentDept,
      currentStrength,
      setHoverDeptStable,
      setPinDeptStable,
      clearPin,
      setStreamDeptStable,
    ],
  );

  return (
    <PraxisTintContext.Provider value={value}>
      <span ref={markerRef} aria-hidden style={{ display: "none" }} />
      {children}
    </PraxisTintContext.Provider>
  );
}

/**
 * Helper for team-detail pages — pins the route dept on mount and
 * clears it on unmount. Single-purpose `"use client"` component so
 * the team page can stay a server component.
 */
export function PraxisRoomBinder({ employee }: { employee: EmployeeId }) {
  const ctx = useDeptTint();
  useEffect(() => {
    ctx.setStreamDept(null);
    ctx.clearPin();
    ctx.setHoverDept(employee);
    return () => ctx.setHoverDept(null);
  }, [ctx, employee]);
  return null;
}
