"use client";

/**
 * RewardMomentContext — global reward-moment animation layer for Praxis.
 *
 * API:
 *   const { triggerReward, triggerRewardEmployee, rewardEmployee } = useRewardMoment()
 *   triggerReward()                            // fires confetti at viewport center
 *   triggerReward({ x: 200, y: 300 })          // fires from a specific screen point
 *   triggerRewardEmployee("engineering")       // sets rewardEmployee for 750ms (sidebar pulse)
 *
 * Trigger points wired externally:
 *   • specialist response complete (via SpecialistChip onComplete callback)
 *   • toast variant="success" or variant="reward" (via ToastContext push)
 *   • explicit hook calls anywhere in the console
 *
 * Reduced-motion: ConfettiBurst is never mounted when prefers-reduced-motion is set.
 * Cap: at most 3 active bursts simultaneously to bound GPU work.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfettiBurst } from "@/components/conduit/ui/ConfettiBurst";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { EmployeeKey } from "@/lib/ai/provider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RewardOrigin {
  x: number;
  y: number;
}

interface RewardMomentContextValue {
  triggerReward: (origin?: RewardOrigin) => void;
  /** Pulse the specialist avatar in the sidebar for 750ms. */
  triggerRewardEmployee: (employee: EmployeeKey) => void;
  /** The specialist whose sidebar avatar should pulse right now, or null. */
  rewardEmployee: EmployeeKey | null;
}

type Burst = { id: number } & RewardOrigin;

// ─── Context ──────────────────────────────────────────────────────────────────

const RewardMomentContext = createContext<RewardMomentContextValue>({
  triggerReward: () => {},
  triggerRewardEmployee: () => {},
  rewardEmployee: null,
});

export function useRewardMoment(): RewardMomentContextValue {
  return useContext(RewardMomentContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_BURSTS = 3;
let _bid = 0;

export function RewardMomentProvider({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [rewardEmployee, setRewardEmployee] = useState<EmployeeKey | null>(null);
  const rewardEmpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReward = useCallback(
    (origin?: RewardOrigin) => {
      if (prefersReduced) return;
      const x = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 400);
      const y = origin?.y ?? (typeof window !== "undefined" ? window.innerHeight * 0.45 : 300);
      const id = ++_bid;
      setBursts((prev) => {
        // Cap at MAX_BURSTS — drop the oldest if needed
        const next = [...prev, { id, x, y }];
        return next.length > MAX_BURSTS ? next.slice(next.length - MAX_BURSTS) : next;
      });
    },
    [prefersReduced],
  );

  const triggerRewardEmployee = useCallback((employee: EmployeeKey) => {
    if (rewardEmpTimerRef.current) clearTimeout(rewardEmpTimerRef.current);
    setRewardEmployee(employee);
    rewardEmpTimerRef.current = setTimeout(() => setRewardEmployee(null), 750);
  }, []);

  const removeBurst = useCallback((id: number) => {
    setBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <RewardMomentContext.Provider value={{ triggerReward, triggerRewardEmployee, rewardEmployee }}>
      {children}
      {bursts.map((b) => (
        <ConfettiBurst
          key={b.id}
          origin={{ x: b.x, y: b.y }}
          onDone={() => removeBurst(b.id)}
        />
      ))}
    </RewardMomentContext.Provider>
  );
}
