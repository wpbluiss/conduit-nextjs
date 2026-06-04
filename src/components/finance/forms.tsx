"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { clsx } from "./clsx";

export const inputCls =
  "w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet-400/50 focus:bg-white/[0.07] transition placeholder:text-white/25 text-[var(--fin-text)]";
export const labelCls =
  "block text-[11px] uppercase tracking-[0.16em] text-[var(--fin-muted)] font-mono mb-1.5";

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  step,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <input
        className={inputCls}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select className={clsx(inputCls, "appearance-none")} name={name} defaultValue={defaultValue}>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0C0C12]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline" | "animate" | "danger";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-white text-black hover:bg-white/90",
    ghost: "text-[var(--fin-muted)] hover:text-white hover:bg-white/5",
    outline: "border border-white/15 text-white hover:bg-white/5",
    animate: "fin-btn-animate text-white shadow-lg shadow-violet-500/20",
    danger: "border border-red-400/20 text-red-300 hover:bg-red-400/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function SubmitButton({
  children,
  pending,
  variant = "animate",
}: {
  children: React.ReactNode;
  pending: boolean;
  variant?: "primary" | "animate";
}) {
  return (
    <Button type="submit" variant={variant} disabled={pending} className="w-full">
      {pending ? "Saving…" : children}
    </Button>
  );
}

type ActionFn = (form: FormData) => Promise<{ ok: boolean; error?: string }>;

export function FormModal({
  trigger,
  title,
  description,
  action,
  children,
  triggerVariant = "outline",
  triggerClassName,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: ActionFn;
  children: React.ReactNode;
  triggerVariant?: "primary" | "ghost" | "outline" | "animate";
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock background scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function submit(formData: FormData) {
    start(async () => {
      const res = await action(formData);
      if (res.ok) {
        setOpen(false);
        setError(null);
      } else {
        setError(res.error || "Something went wrong");
      }
    });
  }

  return (
    <>
      <Button variant={triggerVariant} onClick={() => setOpen(true)} className={triggerClassName}>
        {trigger}
      </Button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fin-scope fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
                style={{ background: "transparent" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  className="fin-card relative z-10 w-full max-w-md p-6 max-h-[90dvh] overflow-y-auto rounded-b-none sm:rounded-[18px]"
                  initial={{ y: 24, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 24, opacity: 0, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  style={{ overflowY: "auto" }}
                >
                  <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                  {description && (
                    <p className="text-sm text-[var(--fin-muted)] mt-1 mb-4">{description}</p>
                  )}
                  <form action={submit} className="mt-4 space-y-3">
                    {children}
                    {error && <p className="text-xs text-red-300">{error}</p>}
                    <div className="pt-1 pb-[env(safe-area-inset-bottom)]">
                      <SubmitButton pending={pending}>{title}</SubmitButton>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
