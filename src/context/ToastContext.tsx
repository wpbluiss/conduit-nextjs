"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
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
// Visual Toast container — fixed bottom-right, slide-in/fade-out
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

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
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
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="cx-glass-float cx-glass-border pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-[12px]"
              style={{
                maxWidth: 320,
                color: "var(--cx-text)",
              }}
            >
              <Icon
                size={18}
                weight="fill"
                color={color}
                className="shrink-0 mt-0.5"
              />
              <p
                className="flex-1 text-[14px] leading-[1.5]"
              >
                {toast.message}
              </p>
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 mt-0.5 text-[var(--pdl-text-muted,#8A88A4)] hover:text-[var(--pdl-text,#F5F1EA)] transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
