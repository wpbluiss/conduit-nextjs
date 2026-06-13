"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { GradientText } from "./ui";
import { Button, inputCls, labelCls } from "./forms";
import {
  onboardComplete,
  onboardJoinHousehold,
} from "@/lib/finance/actions";

type Step = "welcome" | "name" | "goal" | "account" | "partner" | "join";

const GOAL_TYPES = [
  { value: "savings", label: "Build savings" },
  { value: "debt", label: "Pay off debt" },
  { value: "retirement", label: "Retirement" },
];

export function OnboardingFlow({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [householdName, setHouseholdName] = useState(`${firstName}'s Household`);
  const [goalType, setGoalType] = useState("savings");
  const [goalAmount, setGoalAmount] = useState("10000");
  const [goalDate, setGoalDate] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const STEPS: Step[] = ["welcome", "name", "goal", "account", "partner"];
  const stepIndex = STEPS.indexOf(step);
  const totalSteps = STEPS.length - 1; // exclude welcome from count

  function complete(opts?: { skipAccount?: boolean; skipPartner?: boolean }) {
    setError(null);
    start(async () => {
      const res = await onboardComplete({
        name: householdName.trim() || `${firstName}'s Household`,
        savingsGoal: parseFloat(goalAmount) || 10000,
        monthlyTarget: Math.round((parseFloat(goalAmount) || 10000) / 12),
        targetDate: goalDate || null,
        accountName:
          opts?.skipAccount || !accountName.trim() ? null : accountName.trim(),
        accountBalance:
          opts?.skipAccount || !accountName.trim()
            ? null
            : parseFloat(accountBalance) || 0,
        partnerEmail:
          opts?.skipPartner || !partnerEmail.trim()
            ? null
            : partnerEmail.trim(),
      });
      if (res.ok) {
        router.push("/finance");
        router.refresh();
      } else {
        setError(res.error || "Something went wrong — try again.");
      }
    });
  }

  function joinPartner() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("code", joinCode.trim());
      const res = await onboardJoinHousehold(fd);
      if (res.ok) {
        router.push("/finance");
        router.refresh();
      } else {
        setError(res.error || "No household found for that code.");
      }
    });
  }

  // ── Welcome ──────────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div className="w-full max-w-lg text-center">
        <div className="fin-mono text-[11px] uppercase tracking-[0.3em] text-[var(--fin-muted)] mb-4">
          Welcome to Cadence
        </div>
        <h1 className="fin-display text-4xl sm:text-5xl tracking-tight mb-4">
          Hey, {firstName}.{" "}
          <GradientText>Let&apos;s get your money sorted.</GradientText>
        </h1>
        <p className="text-sm text-[var(--fin-muted)] mb-8 max-w-sm mx-auto">
          One household, one goal. Takes under 60 seconds to set up.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="animate"
            onClick={() => setStep("name")}
            className="sm:w-48"
          >
            Get started
          </Button>
          <Button
            variant="ghost"
            onClick={() => setStep("join")}
            className="sm:w-48"
          >
            Join a partner
          </Button>
        </div>
      </div>
    );
  }

  // ── Join a partner ────────────────────────────────────────────────────────
  if (step === "join") {
    return (
      <div className="w-full max-w-md">
        <button
          className="fin-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] mb-6 hover:text-[var(--fin-text)] transition"
          onClick={() => { setStep("welcome"); setError(null); }}
        >
          ← Back
        </button>
        <h2 className="fin-display text-2xl tracking-tight mb-2">
          Join your partner&apos;s household
        </h2>
        <p className="text-sm text-[var(--fin-muted)] mb-6">
          Ask your partner for their code (Settings → Household).
        </p>
        <div className="fin-card p-6 space-y-4">
          <label className="block">
            <span className={labelCls}>Household code</span>
            <input
              className={`${inputCls} uppercase tracking-widest`}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7M2QX"
              maxLength={6}
            />
          </label>
          {error && <p className="text-xs text-[#f0888c]">{error}</p>}
          <Button
            variant="animate"
            onClick={joinPartner}
            disabled={pending || joinCode.trim().length < 4}
            className="w-full"
          >
            {pending ? "Joining…" : "Join household"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Step indicator (steps 2-5) ────────────────────────────────────────────
  const wizardStepNum = stepIndex; // 1=name, 2=goal, 3=account, 4=partner

  return (
    <div className="w-full max-w-md">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-[2px] flex-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--fin-accent)] rounded-full transition-all duration-300"
            style={{ width: `${(wizardStepNum / totalSteps) * 100}%` }}
          />
        </div>
        <span className="fin-mono text-[10px] text-[var(--fin-muted)] tabular-nums shrink-0">
          {wizardStepNum} / {totalSteps}
        </span>
      </div>

      {/* ── Step: Name ─────────────────────────────────────────────────── */}
      {step === "name" && (
        <div>
          <h2 className="fin-display text-3xl tracking-tight mb-2">
            Name your <GradientText>household</GradientText>
          </h2>
          <p className="text-sm text-[var(--fin-muted)] mb-6">
            You can always change this later.
          </p>
          <div className="fin-card p-6 space-y-4">
            <label className="block">
              <span className={labelCls}>Household name</span>
              <input
                className={inputCls}
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder={`${firstName}'s Household`}
                autoFocus
              />
            </label>
            <Button
              variant="animate"
              onClick={() => setStep("goal")}
              disabled={!householdName.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </div>
          <button
            className="mt-4 w-full text-center fin-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] hover:text-[var(--fin-text)] transition"
            onClick={() => complete({ skipAccount: true, skipPartner: true })}
            disabled={pending}
          >
            Skip setup
          </button>
        </div>
      )}

      {/* ── Step: Goal ─────────────────────────────────────────────────── */}
      {step === "goal" && (
        <div>
          <h2 className="fin-display text-3xl tracking-tight mb-2">
            What&apos;s your <GradientText>goal?</GradientText>
          </h2>
          <p className="text-sm text-[var(--fin-muted)] mb-6">
            Pick the one that matters most right now.
          </p>
          <div className="fin-card p-6 space-y-5">
            <div className="flex gap-2 flex-wrap">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoalType(g.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    goalType === g.value
                      ? "border-[var(--fin-accent)] text-[var(--fin-accent-hi)] bg-[color-mix(in_srgb,var(--fin-accent)_12%,transparent)]"
                      : "border-white/10 text-[var(--fin-muted)] hover:border-white/25 hover:text-[var(--fin-text)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelCls}>Target amount ($)</span>
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  step="500"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Target date</span>
                <input
                  className={inputCls}
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                />
              </label>
            </div>
            <Button
              variant="animate"
              onClick={() => setStep("account")}
              disabled={!goalAmount || parseFloat(goalAmount) <= 0}
              className="w-full"
            >
              Continue
            </Button>
          </div>
          <button
            className="mt-4 w-full text-center fin-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] hover:text-[var(--fin-text)] transition"
            onClick={() => complete({ skipAccount: true, skipPartner: true })}
            disabled={pending}
          >
            Skip setup
          </button>
        </div>
      )}

      {/* ── Step: First account ────────────────────────────────────────── */}
      {step === "account" && (
        <div>
          <h2 className="fin-display text-3xl tracking-tight mb-2">
            Add your first <GradientText>account</GradientText>
          </h2>
          <p className="text-sm text-[var(--fin-muted)] mb-6">
            A checking account or savings balance is a great start.
          </p>
          <div className="fin-card p-6 space-y-4">
            <label className="block">
              <span className={labelCls}>Account name</span>
              <input
                className={inputCls}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Chase Checking"
                autoFocus
              />
            </label>
            <label className="block">
              <span className={labelCls}>Current balance ($)</span>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="100"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                placeholder="0"
              />
            </label>
            {error && <p className="text-xs text-[#f0888c]">{error}</p>}
            <Button
              variant="animate"
              onClick={() => setStep("partner")}
              disabled={pending || !accountName.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </div>
          <button
            className="mt-4 w-full text-center fin-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] hover:text-[var(--fin-text)] transition"
            onClick={() => {
              setAccountName("");
              setAccountBalance("");
              setStep("partner");
            }}
            disabled={pending}
          >
            Skip, I&apos;ll connect my bank later
          </button>
        </div>
      )}

      {/* ── Step: Invite partner ───────────────────────────────────────── */}
      {step === "partner" && (
        <div>
          <h2 className="fin-display text-3xl tracking-tight mb-2">
            Invite your <GradientText>partner?</GradientText>
          </h2>
          <p className="text-sm text-[var(--fin-muted)] mb-6">
            Share a household view — one pool, one goal together.
          </p>
          <div className="fin-card p-6 space-y-4">
            <label className="block">
              <span className={labelCls}>Partner&apos;s email</span>
              <input
                className={inputCls}
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                autoFocus
              />
            </label>
            {error && <p className="text-xs text-[#f0888c]">{error}</p>}
            <Button
              variant="animate"
              onClick={() => complete()}
              disabled={pending || !partnerEmail.trim()}
              className="w-full"
            >
              {pending ? "Setting up…" : "Send invite & finish"}
            </Button>
          </div>
          <button
            className="mt-4 w-full text-center fin-mono text-[11px] uppercase tracking-[0.2em] text-[var(--fin-muted)] hover:text-[var(--fin-text)] transition"
            onClick={() => complete({ skipPartner: true })}
            disabled={pending}
          >
            {pending ? "Setting up…" : "Just me for now"}
          </button>
        </div>
      )}
    </div>
  );
}
