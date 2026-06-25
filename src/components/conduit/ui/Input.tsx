"use client";

/**
 * Praxis console canonical Input — glass surface, cx-* tokens.
 *
 * Wraps the .cx-input CSS utility in a React component with full state coverage:
 * rest / hover / focus (accent glow) / error (danger border+glow) / disabled
 *
 * Use this for all text, email, password, search, and url inputs in /app.
 * For compact dense-list contexts use `size="sm"` (maps to .cx-input-sm).
 *
 * Usage:
 *   <Input placeholder="e.g. Acme AI Team" value={val} onChange={…} />
 *   <Input type="password" error="Must be 8+ chars" />
 *   <Input size="sm" value={query} onChange={…} />
 */

import { type ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  size?: "md" | "sm";
  error?: boolean | string;
}

export function Input({ size = "md", error, className, ...props }: InputProps) {
  return (
    <input
      data-slot="cx-input"
      className={cn(
        size === "sm" ? "cx-input-sm" : "cx-input",
        error && "cx-input--error",
        "w-full",
        className,
      )}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}

/**
 * Textarea variant — same glass treatment, vertically resizable.
 */
interface TextareaProps extends ComponentProps<"textarea"> {
  error?: boolean | string;
}

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="cx-textarea"
      className={cn("cx-textarea w-full", error && "cx-input--error", className)}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}

/**
 * Select wrapper — native select with cx-select/cx-select-sm glass treatment.
 * For complex dropdowns with search or multi-select, use a Radix Select or
 * the Popover + listbox pattern instead.
 */
interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  size?: "md" | "sm";
  error?: boolean | string;
}

export function Select({ size = "md", error, className, ...props }: SelectProps) {
  return (
    <select
      data-slot="cx-select"
      className={cn(
        size === "sm" ? "cx-select-sm" : "cx-select",
        error && "cx-input--error",
        "w-full",
        className,
      )}
      aria-invalid={error ? "true" : undefined}
      {...props}
    />
  );
}
