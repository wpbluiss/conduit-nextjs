"use client";

import { createContext, useContext } from "react";
import type { EmployeeId } from "@/lib/conduit/employees";

export type TintStrength = "wash" | "wash-strong";

export interface PraxisTintState {
  /** The currently-applied dept tint, or null for no tint. */
  currentDept: EmployeeId | null;
  /** Effective strength of the canvas wash. */
  currentStrength: TintStrength;
  /** Transient hover tint (dashboard team-card hover). */
  setHoverDept(dept: EmployeeId | null): void;
  /** Persistent pin tint (chat composer pin). */
  setPinDept(dept: EmployeeId | null): void;
  clearPin(): void;
  /** Transient stream tint (chat in-flight assistant reply). */
  setStreamDept(dept: EmployeeId | null): void;
}

const Noop: PraxisTintState = {
  currentDept: null,
  currentStrength: "wash",
  setHoverDept: () => {},
  setPinDept: () => {},
  clearPin: () => {},
  setStreamDept: () => {},
};

export const PraxisTintContext = createContext<PraxisTintState>(Noop);

/**
 * Hook to read + mutate the canvas-tint state from any client
 * component under PraxisCanvasTintProvider. Returns a no-op
 * implementation outside the provider so consumers don't crash
 * during SSR or on non-/app routes.
 *
 * Per data-model.md §3 / contracts/primitives.md P-004.
 */
export function useDeptTint(): PraxisTintState {
  return useContext(PraxisTintContext);
}
