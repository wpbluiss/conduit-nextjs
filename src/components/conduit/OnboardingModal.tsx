"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { PraxisLogo } from "./PraxisLogo";
import { track } from "@/lib/analytics/track";
import { Button } from "@/components/conduit/ui/Button";

const DISMISS_KEY = "conduit_onboarding_skip_v1";

const BUSINESS_TYPES = [
  "cleaning",
  "real estate",
  "insurance",
  "restaurant",
  "dental",
  "med spa",
  "e-commerce",
  "agency",
  "consulting",
  "other",
];

const GOAL_OPTIONS = [
  "Grow sales & revenue",
  "Launch a new product or service",
  "Raise funding",
  "Build out the team",
  "Cut costs & improve margins",
  "Enter a new market",
  "Streamline operations",
  "Build brand awareness",
];

const MAX_GOALS = 3;

export function OnboardingModal({
  defaultName,
}: {
  defaultName: string;
}) {
  const router = useRouter();
  // null = not yet determined (avoid SSR flash). true = show. false = hidden.
  const [visible, setVisible] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [customType, setCustomType] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(DISMISS_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const finalType = businessType === "other" ? customType : businessType;

  const toggleGoal = (goal: string) => {
    setGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= MAX_GOALS) return prev;
      return [...prev, goal];
    });
  };

  if (!visible) return null;

  const TOTAL_STEPS = 4;
  const displayStep = Math.min(step, TOTAL_STEPS);

  async function submit() {
    setSubmitting(true);
    setError(null);
    setStep(5);
    const res = await fetch("/api/conduit/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        business_type: finalType.trim(),
        business_description: description.trim(),
        goals,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Something went wrong, try again.");
      setSubmitting(false);
      setStep(4);
      return;
    }
    const j = await res.json();
    try { localStorage.setItem("conduit_post_onboarding_nudge_v1", "1"); } catch { /* ignore */ }
    track("onboarding_completed", { business_type: finalType.trim() });
    router.replace(j.conversation_id ? `/app?c=${j.conversation_id}` : "/app");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-surface)] flex flex-col">
      {/* Step indicator */}
      <div className="px-8 md:px-12 pt-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <PraxisLogo size={24} />
              <span className="cx-type-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Praxis · Step {displayStep} of {TOTAL_STEPS}
              </span>
            </div>
            {step < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={dismiss}
              >
                Skip for now
              </Button>
            )}
          </div>
          <div className="h-[2px] bg-[var(--color-border)] relative rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${(displayStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-10">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <div className="onboarding-step">
              <h2 className="serif text-cx-2xl md:text-cx-3xl leading-[1.05]">
                What&apos;s your business called?
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)]">
                This is the name Atlas and your team will use.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                placeholder={`e.g. ${defaultName}'s Co.`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) setStep(2);
                }}
                className="mt-8 w-full bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-1 py-3 text-cx-xl md:text-cx-2xl serif placeholder:text-[var(--color-text-muted)]"
              />
              <div className="mt-10 flex justify-end">
                <Button
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  className="disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2 className="serif text-cx-2xl md:text-cx-3xl leading-[1.05]">
                What kind of business is it?
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)]">
                Pick one or describe your own.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBusinessType(t)}
                    className={`px-4 py-2 cx-type-base rounded-full border transition-colors ${
                      businessType === t
                        ? "border-[var(--color-accent)] text-[var(--color-accent-hi)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {businessType === "other" && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  autoFocus
                  placeholder="What kind?"
                  className="mt-6 w-full bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-1 py-2 cx-type-lg"
                />
              )}
              <div className="mt-10 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => finalType.trim() && setStep(3)}
                  disabled={!finalType.trim()}
                  className="disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2 className="serif text-cx-2xl md:text-cx-3xl leading-[1.05]">
                What are you working toward?
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)]">
                Pick up to {MAX_GOALS}. Your team will keep these front of mind.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((goal) => {
                  const selected = goals.includes(goal);
                  const atMax = goals.length >= MAX_GOALS && !selected;
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      disabled={atMax}
                      className={`flex items-center gap-3 px-4 py-3 cx-type-base rounded-xl border text-left transition-colors ${
                        selected
                          ? "border-[var(--color-accent)] text-[var(--color-accent-hi)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                          : atMax
                            ? "border-[var(--color-border)] text-[var(--color-text-muted)] opacity-40 cursor-not-allowed"
                            : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                          selected
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                            : "border-[var(--color-border)]"
                        }`}
                      >
                        {selected && <Check size={12} className="text-white" style={{ strokeWidth: 3 }} />}
                      </span>
                      {goal}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 cx-type-xs text-[var(--color-text-muted)]">
                {goals.length}/{MAX_GOALS} selected
              </p>
              <div className="mt-10 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)}>
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="onboarding-step">
              <h2 className="serif text-cx-2xl md:text-cx-3xl leading-[1.05]">
                Tell Atlas what you&apos;re working on.
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)]">
                A sentence or two. Context, constraints, what success looks like.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                rows={5}
                placeholder="I'm trying to land my first 10 cleaning contracts in Houston…"
                className="mt-8 w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none p-4 cx-type-md resize-none leading-relaxed"
              />
              {error && (
                <p className="mt-3 cx-type-base text-[var(--color-pink)]">
                  {error}
                </p>
              )}
              <div className="mt-10 flex justify-between">
                <Button variant="secondary" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button
                  onClick={submit}
                  disabled={!description.trim() || submitting}
                  className="disabled:opacity-40"
                >
                  Meet Atlas <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="onboarding-step text-center">
              <div className="flex justify-center gap-2 mb-6">
                <span
                  className="typing-dot"
                  style={{
                    ["--dept" as string]: "var(--color-accent)",
                    width: 10,
                    height: 10,
                  }}
                />
                <span
                  className="typing-dot"
                  style={{
                    ["--dept" as string]: "var(--color-accent)",
                    width: 10,
                    height: 10,
                  }}
                />
                <span
                  className="typing-dot"
                  style={{
                    ["--dept" as string]: "var(--color-accent)",
                    width: 10,
                    height: 10,
                  }}
                />
              </div>
              <h2 className="serif text-cx-2xl leading-tight">
                Setting up your team…
              </h2>
              <p className="mt-3 cx-type-base text-[var(--color-text-muted)]">
                Briefing Atlas. Bringing Marketing, Sales, and Engineering
                online.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 pb-6">
        <div className="max-w-2xl mx-auto text-center cx-type-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Praxis · By Conduit
        </div>
      </div>
    </div>
  );
}
