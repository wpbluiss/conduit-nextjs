"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------

const ToastContext = createContext<ToastAPI>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast(): ToastAPI {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------
// Provider — manages the toast queue and renders the container
// ---------------------------------------------------------------

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
    (message: string, variant: ToastVariant) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, variant }]);
      const t = setTimeout(() => dismiss(id), 3000);
      timers.current.set(id, t);
    },
    [dismiss],
  );

  const api: ToastAPI = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------
// Visual Toast container — fixed bottom-right, glass floating tier
// ---------------------------------------------------------------

const ICON = {
  success: CheckCircle,
  error: WarningCircle,
  info: Info,
} as const;

const COLOR = {
  success: "var(--cx-reward)",
  error: "var(--cx-danger)",
  info: "var(--cx-accent)",
} as const;

// Enter: slide up from bottom-right (x+y drift → origin)
const ENTER = {
  initial: { opacity: 0, x: 10, y: 8, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
};

// Exit: fade + scale down (no slide — feels like it vanishes cleanly)
const EXIT = {
  exit: {
    opacity: 0,
    scale: 0.93,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  },
};

// Reduced-motion: instant appear/disappear, no animation
const REDUCED = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  const prefersReduced = useReducedMotion();
  const motionVariants = prefersReduced ? REDUCED : { ...ENTER, ...EXIT };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = ICON[toast.variant];
          const color = COLOR[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              {...motionVariants}
              className="cx-glass-float cx-glass-border pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-[12px]"
              style={{
                maxWidth: 320,
                color: "var(--cx-text)",
                // Colored left accent edge — wider than the hairline glass border
                borderLeftWidth: "3px",
                borderLeftColor: color,
              }}
            >
              <Icon
                size={18}
                weight="fill"
                color={color}
                className="shrink-0 mt-0.5"
              />
              <p className="cx-type-sm flex-1 leading-[1.6]">
                {toast.message}
              </p>
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className="cx-icon-btn shrink-0 -mt-0.5 -mr-1"
                style={{ width: 24, height: 24, padding: 0 }}
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
