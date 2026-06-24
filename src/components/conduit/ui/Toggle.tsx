"use client";

/**
 * Praxis console Toggle (switch) — Apple-grade, cx-* tokens, framer-motion.
 *
 * Visual: glass track at rest (--cx-border-strong), accent-filled when on,
 * thumb slides with a spring animation on state change.
 *
 * Usage:
 *   <Toggle checked={enabled} onChange={setEnabled} label="Email alerts" />
 *   <Toggle checked={on} onChange={setOn} label="Product updates" desc="Weekly roundup" />
 *
 * For always-on locked toggles, use `locked` prop to show the "on" state
 * without allowing interaction.
 */

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CX_SPRING_SNAPPY, CX_EASE, CX_DUR_FAST } from "@/lib/ui/motion";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  desc?: string;
  locked?: boolean;
  disabled?: boolean;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  desc,
  locked = false,
  disabled = false,
  id: externalId,
}: ToggleProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const prefersReduced = useReducedMotion();
  const isDisabled = disabled || locked;

  return (
    <div className="flex items-start justify-between gap-4">
      {label && (
        <div className="flex flex-col gap-0.5 min-w-0">
          <label
            htmlFor={id}
            className="cx-type-sm font-medium cursor-pointer select-none"
            style={{ color: isDisabled ? "var(--cx-text-muted)" : "var(--cx-text)" }}
          >
            {label}
            {locked && (
              <span className="ml-1.5 cx-type-xs font-normal" style={{ color: "var(--cx-text-faint)" }}>
                (always on)
              </span>
            )}
          </label>
          {desc && (
            <span className="cx-type-xs" style={{ color: "var(--cx-text-muted)", lineHeight: "var(--cx-lh-body)" }}>
              {desc}
            </span>
          )}
        </div>
      )}

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !isDisabled && onChange(!checked)}
        disabled={isDisabled}
        className="relative shrink-0 inline-flex h-6 w-11 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cx-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: checked ? "var(--cx-accent)" : "var(--cx-border-strong)",
          transition: prefersReduced
            ? "none"
            : `background ${CX_DUR_FAST}s cubic-bezier(${CX_EASE.join(",")})`,
        }}
      >
        <motion.span
          className="inline-block h-5 w-5 rounded-full shadow-sm"
          style={{ background: "var(--cx-toggle-thumb, rgba(255,255,255,0.95))" }}
          animate={{ x: checked ? 20 : 2 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { ...CX_SPRING_SNAPPY, mass: 0.6 }
          }
          aria-hidden
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

/**
 * ToggleRow — Toggle inside a card-section row with divider support.
 * Use this in settings panels for consistent visual rhythm.
 */
interface ToggleRowProps extends Omit<ToggleProps, "id"> {
  withDivider?: boolean;
}

export function ToggleRow({ withDivider = false, ...props }: ToggleRowProps) {
  return (
    <>
      {withDivider && (
        <hr
          className="my-0"
          style={{ border: "none", borderTop: "1px solid var(--cx-border)", opacity: 0.6 }}
        />
      )}
      <Toggle {...props} />
    </>
  );
}
