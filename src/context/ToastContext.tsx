"use client";

/**
 * ToastContext — global toast/notification system for the Praxis console.
 *
 * API:
 *   const toast = useToast()
 *   toast.success("Saved!")                            // string shorthand
 *   toast.error({ title: "Failed", body: "…" })        // object form
 *   toast.warning("Low token budget")
 *   toast.info("Routing to Engineering…")
 *   toast.reward("Build shipped! 🚀")
 *   toast.dismiss(id)                                   // programmatic dismiss
 *
 * Existing call sites using string-only variants (success/error/info) continue
 * to work unchanged — the string is mapped to { title: string }.
 *
 * Stack rules (enforced by the provider):
 *   - Max 3 toasts visible; oldest is silently dropped when a 4th arrives.
 *   - Auto-dismiss after 4 s: success, warning, info, reward.
 *   - Error variant: never auto-dismisses — user must click ✕.
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { ToastContainer } from "@/components/conduit/ui/Toast";
import type { ToastVariant, ToastInput, ToastItem } from "@/components/conduit/ui/Toast";
import { useRewardMoment } from "@/context/RewardMomentContext";

export type { ToastVariant };

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

type ToastArg = string | ToastInput;

interface ToastAPI {
  success: (input: ToastArg) => void;
  error:   (input: ToastArg) => void;
  warning: (input: ToastArg) => void;
  info:    (input: ToastArg) => void;
  reward:  (input: ToastArg) => void;
  dismiss: (id: number) => void;
}

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------

const ToastContext = createContext<ToastAPI>({
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
  reward:  () => {},
  dismiss: () => {},
});

export function useToast(): ToastAPI {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

let _id = 0;

function toItem(variant: ToastVariant, input: ToastArg): Omit<ToastItem, "id"> {
  if (typeof input === "string") return { variant, title: input };
  return { variant, title: input.title, body: input.body, action: input.action };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { triggerReward } = useRewardMoment();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, input: ToastArg) => {
      const id = ++_id;
      const item: ToastItem = { id, ...toItem(variant, input) };

      setToasts((prev) => {
        // Enforce max-3: drop the oldest if needed
        const next = [...prev, item];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });

      // Fire confetti near the toast stack (bottom-right) for reward-positive variants
      if (variant === "success" || variant === "reward") {
        triggerReward(
          typeof window !== "undefined"
            ? { x: window.innerWidth - 180, y: window.innerHeight - 120 }
            : undefined,
        );
      }

      // Error variant: never auto-dismiss
      if (variant !== "error") {
        const t = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        timers.current.set(id, t);
      }
    },
    [dismiss, triggerReward],
  );

  const api: ToastAPI = {
    success: (input) => push("success", input),
    error:   (input) => push("error",   input),
    warning: (input) => push("warning", input),
    info:    (input) => push("info",    input),
    reward:  (input) => push("reward",  input),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
