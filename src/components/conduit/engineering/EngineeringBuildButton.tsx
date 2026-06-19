"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hammer, Lock, Loader2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [buildType, setBuildType] = useState("landing-page");

  if (!internalAccount) {
    return (
      <Button
        variant="primary"
        size="sm"
        isDisabled
        title="Engineering builds are in early access."
      >
        <Lock size={12} /> Start a build
      </Button>
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
        style={{ background: deptColor, color: "var(--cx-canvas)" }}
      >
        <Hammer size={13} /> Start a build
      </Button>

      <AnimatePresence>
        {open && (
        <motion.div
          key="build-modal-scrim"
          className="fixed inset-0 z-[90] cx-scrim flex items-center justify-center px-4"
          style={{ background: "var(--cx-modal-scrim, rgba(11,11,15,0.65))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
        >
          <motion.div
            className="cx-glass-overlay cx-glass-border w-full max-w-lg rounded-[16px] p-6"
            role="dialog"
            aria-modal="true"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  Engineering · early access
                </div>
                <h2 className="cx-type-lg font-semibold mt-1">Start a build</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={submitting || prompt.trim().length < 8}
                className="!text-sm inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: deptColor, color: "var(--cx-canvas)" }}
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Ship it
              </Button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
