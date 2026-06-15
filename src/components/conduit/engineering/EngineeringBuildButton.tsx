"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, Lock, Loader2, X } from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";

interface Props {
  internalAccount: boolean;
  deptColor: string;
}

const BUILD_TYPES: { id: string; label: string; hint: string }[] = [
  {
    id: "landing-page",
    label: "Landing page",
    hint: "Single-page static site (HTML/CSS/JS).",
  },
  {
    id: "web-app",
    label: "Web app",
    hint: "Next.js + Tailwind scaffold.",
  },
  {
    id: "api",
    label: "API",
    hint: "Node.js + Express server.",
  },
  {
    id: "custom",
    label: "Custom",
    hint: "Let claude pick the stack.",
  },
];

export default function EngineeringBuildButton({
  internalAccount,
  deptColor,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [buildType, setBuildType] = useState("landing-page");

  if (!internalAccount) {
    return (
      <span
        className="btn-primary !text-sm opacity-50 cursor-not-allowed inline-flex items-center gap-1.5"
        title="Engineering builds are in early access."
      >
        <Lock size={12} /> Start a build
      </span>
    );
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/engineering/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, buildType }),
      });
      const json = (await r.json().catch(() => ({}))) as {
        session_id?: string;
        error?: string;
        message?: string;
      };
      if (!r.ok || !json.session_id) {
        setError(json.message ?? json.error ?? `request_${r.status}`);
        return;
      }
      setOpen(false);
      setPrompt("");
      // Hand off to the durable cinema URL — never an in-memory modal.
      router.push(`/app/builds/${json.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="!text-sm inline-flex items-center gap-1.5"
        style={{ background: deptColor, color: "#0A0908" }}
      >
        <Hammer size={13} /> Start a build
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="conduit-card w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Engineering · early access
                </div>
                <h2 className="serif text-xl mt-1">Start a build</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <label className="block cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-1.5">
              Build type
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {BUILD_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBuildType(t.id)}
                  className="text-left rounded-md p-2 border transition-colors"
                  style={{
                    borderColor:
                      buildType === t.id ? deptColor : "var(--color-border)",
                    background:
                      buildType === t.id
                        ? `color-mix(in srgb, ${deptColor} 8%, transparent)`
                        : "transparent",
                  }}
                >
                  <div className="text-sm">{t.label}</div>
                  <div className="cx-type-xs text-[var(--color-text-muted)] mt-0.5">
                    {t.hint}
                  </div>
                </button>
              ))}
            </div>

            <label className="block cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-1.5">
              What should I build?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build me a one-page landing for a fictional barbershop in West Palm Beach with a contact form."
              rows={5}
              className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-md focus:border-[var(--color-accent)] outline-none p-3 text-sm resize-none leading-relaxed"
              maxLength={4000}
            />
            <div className="cx-type-xs text-[var(--color-text-muted)] mt-1">
              {prompt.length}/4000
            </div>

            {error && (
              <p className="mt-3 text-xs text-[var(--color-pink)]">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-3 py-1.5"
              >
                Cancel
              </button>
              <Button
                onClick={submit}
                disabled={submitting || prompt.trim().length < 8}
                className="!text-sm inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: deptColor, color: "#0A0908" }}
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Ship it
              </Button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
