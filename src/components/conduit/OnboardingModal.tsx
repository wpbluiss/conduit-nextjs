"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PraxisLogo } from "./PraxisLogo";

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

export function OnboardingModal({
  defaultName,
}: {
  defaultName: string;
}) {
  const router = useRouter();
  // null = not yet determined (avoid SSR flash). true = show. false = hidden.
  const [visible, setVisible] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [customType, setCustomType] = useState("");
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

  if (!visible) return null;

  async function submit() {
    setSubmitting(true);
    setError(null);
    setStep(4);
    const res = await fetch("/api/conduit/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        business_type: finalType.trim(),
        business_description: description.trim(),
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Something went wrong, try again.");
      setSubmitting(false);
      setStep(3);
      return;
    }
    const j = await res.json();
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
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                Praxis · Step {Math.min(step, 3)} of 3
              </span>
            </div>
            {step < 4 && (
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
          <div className="h-[2px] bg-[var(--color-border)] relative rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-[2px] bg-[var(--color-accent)] transition-all duration-300"
              style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 py-10">
        <div className="w-full max-w-2xl">
          {step === 1 && (
            <div className="onboarding-step">
              <h2 className="serif text-3xl md:text-5xl leading-[1.05]">
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
                className="mt-8 w-full bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-1 py-3 text-2xl md:text-3xl serif placeholder:text-[var(--color-text-muted)]"
              />
              <div className="mt-10 flex justify-end">
                <button
                  onClick={() => name.trim() && setStep(2)}
                  disabled={!name.trim()}
                  className="btn-primary disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="onboarding-step">
              <h2 className="serif text-3xl md:text-5xl leading-[1.05]">
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
                    className={`px-4 py-2 text-sm rounded-full border transition-colors ${
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
                  className="mt-6 w-full bg-transparent border-b border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none px-1 py-2 text-xl"
                />
              )}
              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={() => finalType.trim() && setStep(3)}
                  disabled={!finalType.trim()}
                  className="btn-primary disabled:opacity-40"
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="onboarding-step">
              <h2 className="serif text-3xl md:text-5xl leading-[1.05]">
                Tell Atlas what you&apos;re working on.
              </h2>
              <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)]">
                A sentence or two. Goals, problems, what success looks like.
              </p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
                rows={5}
                placeholder="I'm trying to land my first 10 cleaning contracts in Houston…"
                className="mt-8 w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl focus:border-[var(--color-accent)] outline-none p-4 text-base resize-none leading-relaxed"
              />
              {error && (
                <p className="mt-3 text-sm text-[var(--color-pink)]">
                  {error}
                </p>
              )}
              <div className="mt-10 flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  Back
                </button>
                <button
                  onClick={submit}
                  disabled={!description.trim() || submitting}
                  className="btn-primary disabled:opacity-40"
                >
                  Meet Atlas <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
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
              <h2 className="serif text-3xl md:text-4xl leading-tight">
                Setting up your team…
              </h2>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Briefing Atlas. Bringing Marketing, Sales, and Engineering
                online.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 pb-6">
        <div className="max-w-2xl mx-auto text-center text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          Praxis · By Conduit
        </div>
      </div>
    </div>
  );
}
