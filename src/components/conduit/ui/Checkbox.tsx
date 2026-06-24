"use client";

/**
 * Praxis console Checkbox — glass-aligned, cx-* tokens, framer-motion.
 *
 * Visual: hairline border at rest, accent fill + white check when checked,
 * scale press animation on click. Matches the Button press feel.
 *
 * Usage:
 *   <Checkbox checked={selected} onChange={setSelected} label="Accept terms" />
 *   <Checkbox checked={agreed} onChange={setAgreed} />
 */

import { useId, type ChangeEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CX_SPRING_SNAPPY } from "@/lib/ui/motion";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  desc?: string;
  disabled?: boolean;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  desc,
  disabled = false,
  id: externalId,
}: CheckboxProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const prefersReduced = useReducedMotion();

  return (
    <div className="flex items-start gap-3">
      <motion.button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        whileTap={disabled || prefersReduced ? undefined : { scale: 0.88 }}
        transition={prefersReduced ? { duration: 0 } : { ...CX_SPRING_SNAPPY, mass: 0.5 }}
        className="relative shrink-0 inline-flex items-center justify-center w-5 h-5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cx-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed mt-[1px]"
        style={{
          background: checked ? "var(--cx-accent)" : "transparent",
          border: `1.5px solid ${checked ? "var(--cx-accent)" : "var(--cx-border-strong)"}`,
          transition: prefersReduced ? "none" : "background 120ms ease-out, border-color 120ms ease-out",
          borderRadius: "var(--cx-radius-xs, 4px)",
          minWidth: 20,
          minHeight: 20,
        }}
      >
        <motion.span
          aria-hidden
          initial={false}
          animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check size={12} strokeWidth={2.5} style={{ color: "var(--cx-canvas)" }} />
        </motion.span>
      </motion.button>

      {label && (
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <label
            htmlFor={id}
            className="cx-type-sm cursor-pointer select-none"
            style={{ color: disabled ? "var(--cx-text-muted)" : "var(--cx-text)" }}
          >
            {label}
          </label>
          {desc && (
            <span
              className="cx-type-xs"
              style={{ color: "var(--cx-text-muted)", lineHeight: "var(--cx-lh-body)" }}
            >
              {desc}
            </span>
          )}
        </div>
      )}

      {/* Accessible hidden input for form submission */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
