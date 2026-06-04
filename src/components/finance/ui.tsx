import { clsx } from "./clsx";

export function Aurora() {
  return <div className="fin-aurora" aria-hidden />;
}

export function Card({
  className,
  glow = false,
  children,
}: {
  className?: string;
  glow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("fin-card", glow && "fin-glow", "p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] font-mono mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "green" | "amber" | "violet" | "cyan" | "pink" | "red";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-white/5 text-[var(--fin-muted)] border-white/10",
    green: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    violet: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    cyan: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    pink: "bg-pink-400/10 text-pink-300 border-pink-400/20",
    red: "bg-red-400/10 text-red-300 border-red-400/20",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function GradientText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={clsx("fin-gradient-text", className)}>{children}</span>;
}

export function Stat({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fin-muted)] font-mono mb-1.5">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{children}</div>
      {hint && <div className="text-xs text-[var(--fin-muted)] mt-1">{hint}</div>}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-[var(--fin-muted)] py-8 text-center border border-dashed border-white/10 rounded-xl">
      {children}
    </div>
  );
}
