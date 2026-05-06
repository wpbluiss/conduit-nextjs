"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [step, setStep] = useState(1);
  const [name, setName] = useState(defaultName);
  const [businessType, setBusinessType] = useState("");
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalType = businessType === "other" ? customType : businessType;

  async function submit() {
    setSubmitting(true);
    setError(null);
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
      return;
    }
    const j = await res.json();
    router.replace(j.conversation_id ? `/app?c=${j.conversation_id}` : "/app");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
      <div className="w-full max-w-lg bg-[var(--color-surface-elevated)] hairline p-6 md:p-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Step {step} of 3
          </div>
          <div className="mt-2 h-px bg-[var(--color-border)] relative">
            <div
              className="absolute left-0 top-0 h-px bg-[var(--color-accent)]"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="serif text-2xl mb-2">
              What&apos;s your business called?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              This is the name Jarvis and your team will use.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Acme Cleaning Co."
              className="w-full bg-[var(--color-surface)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)]"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="serif text-2xl mb-2">
              What kind of business is it?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Pick one or describe your own.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {BUSINESS_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBusinessType(t)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    businessType === t
                      ? "border-[var(--color-accent)] text-[var(--color-accent-hi)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text)]"
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
                placeholder="What kind?"
                className="w-full bg-[var(--color-surface)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)]"
              />
            )}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => finalType.trim() && setStep(3)}
                disabled={!finalType.trim()}
                className="btn-primary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="serif text-2xl mb-2">
              Tell Jarvis what you&apos;re working on or trying to build.
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              A sentence or two. Goals, problems, what success looks like.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              rows={5}
              placeholder="I'm trying to land my first 10 commercial cleaning contracts in Houston…"
              className="w-full bg-[var(--color-surface)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)] resize-none"
            />
            {error && (
              <p className="mt-3 text-sm text-[var(--color-pink)]">{error}</p>
            )}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={!description.trim() || submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? "Setting up…" : "Meet Jarvis"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
