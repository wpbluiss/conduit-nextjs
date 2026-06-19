"use client";

/**
 * Praxis console Toast component — glass surface, cx-* tokens, framer-motion.
 *
 * Five semantic variants per CONSOLE_REDESIGN.md §Glassmorphism + §Color system:
 *   success  → reward-green  (#34D399)
 *   error    → danger-coral  (#F4607D)  — manual dismiss only
 *   warning  → warn-amber    (#FBBF24)
 *   info     → accent-violet (#7C6CFF)
 *   reward   → reward-green  (#34D399)  — with pulse beat
 *
 * Each toast may have:
 *   title    — required display string
 *   body     — optional supporting text (cx-type-xs, text-muted)
 *   action   — optional inline CTA button
 *
 * Animated enter/exit:
 *   Enter: slide up + fade in, 180ms [0.22,1,0.36,1]
 *   Exit:  fade + scale down, 150ms
 *   Reduced-motion: instant opacity toggle only
 *
 * Stack behaviour (managed by ToastProvider, not this component):
 *   Max 3 visible; newer toasts push older ones up.
 *   Auto-dismiss 4 s (error: never — requires manual dismiss).
 *   Progress bar shows remaining time on auto-dismiss variants.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------
// Types (also exported from ToastContext — keep in sync)
// ---------------------------------------------------------------

export type ToastVariant = "success" | "error" | "warning" | "info" | "reward";

export interface ToastInput {
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

// ---------------------------------------------------------------
// Per-variant config — cx-* tokens, no hex
// ---------------------------------------------------------------

const VARIANT_CONFIG: Record<
  ToastVariant,
  {
    Icon: LucideIcon;
    color: string;          // CSS variable reference (inline style)
    autoDismiss: boolean;
    pulseClass?: string;
  }
> = {
  success: {
    Icon: CheckCircle2,
    color: "var(--cx-reward)",
    autoDismiss: true,
  },
  error: {
    Icon: AlertCircle,
    color: "var(--cx-danger)",
    autoDismiss: false,
  },
  warning: {
    Icon: AlertTriangle,
    color: "var(--cx-warn)",
    autoDismiss: true,
  },
  info: {
    Icon: Info,
    color: "var(--cx-accent)",
    autoDismiss: true,
  },
  reward: {
    Icon: Sparkles,
    color: "var(--cx-reward)",
    autoDismiss: true,
    pulseClass: "toast-reward-pulse",
  },
};

const AUTO_DISMISS_MS = 4000;

// ---------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------

const ENTER_VARIANTS = {
  initial: { opacity: 0, y: 12, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const EXIT_VARIANTS = {
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const REDUCED_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit:    { opacity: 0, transition: { duration: 0 } },
};

// ---------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const prefersReduced = useReducedMotion();
  const cfg = VARIANT_CONFIG[item.variant];
  const { Icon, color, autoDismiss, pulseClass } = cfg;

  // Progress bar state — only for auto-dismiss variants
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!autoDismiss) return;

    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 1 - elapsed / AUTO_DISMISS_MS);
      setProgress(remaining * 100);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoDismiss]);

  const motionProps = prefersReduced
    ? REDUCED_VARIANTS
    : { ...ENTER_VARIANTS, ...EXIT_VARIANTS };

  return (
    <motion.div
      layout
      {...motionProps}
      role="status"
      aria-live={item.variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`cx-glass-float cx-glass-border relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-[12px] pointer-events-auto${pulseClass ? ` ${pulseClass}` : ""}`}
      style={{
        maxWidth: 360,
        minWidth: 260,
        color: "var(--cx-text)",
        borderLeftWidth: "3px",
        borderLeftColor: color,
      }}
    >
      {/* Icon */}
      <Icon
        size={18}
        className="shrink-0 mt-0.5"
        style={{ color }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="cx-type-sm font-medium leading-[1.5]">{item.title}</p>
        {item.body && (
          <p className="cx-type-xs mt-0.5 leading-[1.55]" style={{ color: "var(--cx-text-muted)" }}>
            {item.body}
          </p>
        )}
        {item.action && (
          <button
            onClick={() => {
              item.action!.onClick();
              onDismiss(item.id);
            }}
            className="cx-type-xs font-medium mt-1.5 underline underline-offset-2"
            style={{ color }}
          >
            {item.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="cx-icon-btn shrink-0 -mt-0.5 -mr-1"
        style={{ width: 24, height: 24, padding: 0 }}
      >
        <X size={13} />
      </button>

      {/* Progress bar — auto-dismiss variants only */}
      {autoDismiss && !prefersReduced && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] rounded-full transition-none"
          style={{
            width: `${progress}%`,
            background: color,
            opacity: 0.5,
          }}
        />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------
// Toast container — fixed bottom-right stack
// ---------------------------------------------------------------

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  // Newest on top: reverse so newest renders last (visually on top due to flex-col-reverse)
  const visible = toasts.slice(-3); // max 3

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {visible.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
