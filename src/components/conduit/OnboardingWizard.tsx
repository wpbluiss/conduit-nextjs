"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, ChevronLeft } from "lucide-react";
import { createHouseholdAction } from "@/app/onboarding/actions";

const TOTAL_STEPS = 4;

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const TRANSITION = { type: "spring" as const, stiffness: 380, damping: 36 };

interface WizardState {
  name: string;
  savingsGoal: string;
  targetDate: string;
  monthlyTarget: string;
  accountName: string;
  accountBalance: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [state, setState] = useState<WizardState>({
    name: "",
    savingsGoal: "",
    targetDate: "",
    monthlyTarget: "",
    accountName: "",
    accountBalance: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function patch(updates: Partial<WizardState>) {
    setState((s) => ({ ...s, ...updates }));
  }

  function next() {
    setDir(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    setError(null);
  }

  function back() {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
    setError(null);
  }

  function finish() {
    start(async () => {
      const fd = new FormData();
      fd.set("name", state.name || "My Household");
      fd.set("savings_goal", state.savingsGoal || "0");
      fd.set("monthly_target", state.monthlyTarget || "0");
      fd.set("target_date", state.targetDate);
      fd.set("account_name", state.accountName);
      fd.set("account_balance", state.accountBalance);
      const res = await createHouseholdAction(fd);
      if (res.ok) {
        router.push("/app");
        router.refresh();
      } else {
        setError(res.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-canvas,#0a0a0b)] px-5 py-12">
      {/* Progress dots */}
      <div className="mb-10 flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.span
            key={i}
            animate={{ width: i === step ? 24 : 8, opacity: i <= step ? 1 : 0.25 }}
            transition={TRANSITION}
            className="h-2 rounded-full bg-primary"
          />
        ))}
      </div>

      <div className="w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
          >
            {step === 0 && <StepWelcome onNext={next} />}
            {step === 1 && (
              <StepName
                value={state.name}
                onChange={(v) => patch({ name: v })}
                onNext={next}
                onBack={back}
              />
            )}
            {step === 2 && (
              <StepGoal
                goal={state.savingsGoal}
                date={state.targetDate}
                monthly={state.monthlyTarget}
                onGoal={(v) => patch({ savingsGoal: v })}
                onDate={(v) => patch({ targetDate: v })}
                onMonthly={(v) => patch({ monthlyTarget: v })}
                onNext={next}
                onSkip={next}
                onBack={back}
              />
            )}
            {step === 3 && (
              <StepAccount
                name={state.accountName}
                balance={state.accountBalance}
                onName={(v) => patch({ accountName: v })}
                onBalance={(v) => patch({ accountBalance: v })}
                onFinish={finish}
                onSkip={finish}
                onBack={back}
                pending={pending}
                error={error}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Step 0: Welcome ─────────────────────────────────────────── */

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
        <Sparkles className="size-8" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Let&apos;s set up your household
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Praxis keeps your finances, goals, and AI team in one place. Takes
          about&nbsp;60&nbsp;seconds.
        </p>
      </div>
      <button
        onClick={onNext}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Get started <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/* ── Step 1: Name ─────────────────────────────────────────────── */

function StepName({
  value, onChange, onNext, onBack,
}: {
  value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Name your household</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is just for you — pick anything you like.
        </p>
      </div>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onNext()}
        placeholder="e.g. The Johnson Family"
        className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <NextButton
        onClick={onNext}
        disabled={!value.trim()}
        label="Continue"
      />
    </div>
  );
}

/* ── Step 2: Goal ─────────────────────────────────────────────── */

function StepGoal({
  goal, date, monthly,
  onGoal, onDate, onMonthly,
  onNext, onSkip, onBack,
}: {
  goal: string; date: string; monthly: string;
  onGoal: (v: string) => void; onDate: (v: string) => void; onMonthly: (v: string) => void;
  onNext: () => void; onSkip: () => void; onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Set a savings goal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What are you saving toward? You can change this any time.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target amount ($)</span>
          <input
            type="number"
            value={goal}
            onChange={(e) => onGoal(e.target.value)}
            placeholder="10,000"
            min={0}
            className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly savings ($)</span>
            <input
              type="number"
              value={monthly}
              onChange={(e) => onMonthly(e.target.value)}
              placeholder="500"
              min={0}
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => onDate(e.target.value)}
              className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <NextButton onClick={onNext} disabled={!goal} label="Continue" />
        <button onClick={onSkip} className="py-2 text-sm text-muted-foreground hover:text-foreground">
          Skip for now
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: First account ────────────────────────────────────── */

function StepAccount({
  name, balance, onName, onBalance,
  onFinish, onSkip, onBack, pending, error,
}: {
  name: string; balance: string;
  onName: (v: string) => void; onBalance: (v: string) => void;
  onFinish: () => void; onSkip: () => void; onBack: () => void;
  pending: boolean; error: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <BackButton onClick={onBack} />
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Add your first account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A checking or savings account to get started. You can always add more.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="e.g. Chase Checking"
            className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current balance ($)</span>
          <input
            type="number"
            value={balance}
            onChange={(e) => onBalance(e.target.value)}
            placeholder="0.00"
            min={0}
            step={0.01}
            className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-[15px] placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <button
          onClick={onFinish}
          disabled={pending || !name.trim() || !balance}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Check className="size-4" />
          )}
          {pending ? "Creating…" : "Finish setup"}
        </button>
        <button
          onClick={onSkip}
          disabled={pending}
          className="py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          I&apos;ll connect later
        </button>
      </div>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────────── */

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" /> Back
    </button>
  );
}

function NextButton({
  onClick, disabled, label,
}: {
  onClick: () => void; disabled?: boolean; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
    >
      {label} <ArrowRight className="size-4" />
    </button>
  );
}
