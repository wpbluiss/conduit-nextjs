"use client";

import { X, CheckCircle, XCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

export type ToastVariant = "success" | "error" | "info";

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
}

const ICONS: Record<ToastVariant, React.ComponentType<{ size: number }>> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const COLORS: Record<ToastVariant, { icon: string; border: string }> = {
  success: {
    icon: "var(--color-green, #22c55e)",
    border: "rgba(34,197,94,0.25)",
  },
  error: {
    icon: "#f87171",
    border: "rgba(248,113,113,0.25)",
  },
  info: {
    icon: "var(--pdl-accent, #7c6ef7)",
    border: "rgba(124,110,247,0.25)",
  },
};

const EASE = [0.25, 1, 0.5, 1] as const;

interface Props {
  toast: ToastData;
  onDismiss: (id: string) => void;
  reduced: boolean;
}

export function ToastItem({ toast, onDismiss, reduced }: Props) {
  const Icon = ICONS[toast.variant];
  const { icon, border } = COLORS[toast.variant];

  return (
    <motion.div
      layout
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.22, ease: EASE }}
      role="status"
      aria-live="polite"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.75rem 1rem",
        borderRadius: "12px",
        border: `1px solid ${border}`,
        background: "var(--pdl-surface-glass, rgba(20,16,31,0.82))",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        color: "var(--pdl-text, #F5F1EA)",
        fontSize: "0.875rem",
        lineHeight: 1.4,
        minWidth: "260px",
        maxWidth: "400px",
        userSelect: "none",
      }}
    >
      <span style={{ flexShrink: 0, color: icon, display: "flex" }}>
        <Icon size={16} />
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px",
          color: "var(--pdl-text-muted, #8A88A4)",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}
