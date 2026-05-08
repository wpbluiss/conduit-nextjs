"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

export type WaitlistField =
  | {
      kind: "text";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
    };

export default function WaitlistForm({
  product,
  source,
  ctaLabel = "Get notified",
  extraFields = [],
}: {
  product: "praxis-mobile" | "praxis-hq";
  source?: string;
  ctaLabel?: string;
  extraFields?: WaitlistField[];
}) {
  const [email, setEmail] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    // Pack extras into source as a delimited string. Existing schema only
    // captures (product, email, source) — bumping source cap to 256 server-
    // side gives us enough room for the brief's name/role/agency/use-case
    // fields without a migration.
    const extrasStr = Object.entries(extras)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
      .join("|");
    const finalSource = [source, extrasStr].filter(Boolean).join("::");

    try {
      const r = await fetch("/api/conduit/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, email, source: finalSource }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        duplicate?: boolean;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setStatus("error");
        setMessage(
          j.error === "invalid_email"
            ? "That doesn't look like a valid email."
            : "Couldn't save that, try again in a moment.",
        );
        return;
      }
      setStatus("success");
      setMessage(
        j.duplicate
          ? "You're already on the list — we'll be in touch."
          : "On the list. We'll email you when it ships.",
      );
      setEmail("");
      setExtras({});
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again in a moment.");
    }
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md flex items-start gap-3 p-4 rounded-xl border border-[var(--color-conduit-success)]/30 bg-[var(--color-conduit-success)]/5">
        <CheckCircle
          size={22}
          weight="fill"
          color="#4ADE80"
          className="shrink-0 mt-0.5"
        />
        <div>
          <p className="text-[15px] text-[var(--color-cream)] font-medium">
            On the list.
          </p>
          <p className="text-[13px] text-[var(--color-cream-soft)] mt-1">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      {extraFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {extraFields.map((f) =>
            f.kind === "select" ? (
              <div key={f.name}>
                <label
                  htmlFor={f.name}
                  className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--color-cream-mute)] mb-1.5"
                >
                  {f.label}
                </label>
                <select
                  id={f.name}
                  required={f.required}
                  value={extras[f.name] ?? ""}
                  onChange={(e) =>
                    setExtras((s) => ({ ...s, [f.name]: e.target.value }))
                  }
                  className="w-full bg-[var(--color-ink-surface)] border border-[var(--color-edge)] focus:border-[var(--color-ember-500)] outline-none px-3.5 py-3 text-[14px] text-[var(--color-cream)] rounded-xl transition-colors"
                >
                  <option value="" disabled>
                    Choose one…
                  </option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div key={f.name}>
                <label
                  htmlFor={f.name}
                  className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--color-cream-mute)] mb-1.5"
                >
                  {f.label}
                </label>
                <input
                  id={f.name}
                  type="text"
                  required={f.required}
                  value={extras[f.name] ?? ""}
                  onChange={(e) =>
                    setExtras((s) => ({ ...s, [f.name]: e.target.value }))
                  }
                  placeholder={f.placeholder}
                  className="w-full bg-[var(--color-ink-surface)] border border-[var(--color-edge)] focus:border-[var(--color-ember-500)] outline-none px-3.5 py-3 text-[14px] text-[var(--color-cream)] placeholder:text-[var(--color-cream-mute)] rounded-xl transition-colors"
                />
              </div>
            ),
          )}
        </div>
      )}

      <div>
        {extraFields.length > 0 && (
          <label
            htmlFor="waitlist-email"
            className="block text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--color-cream-mute)] mb-1.5"
          >
            Email
          </label>
        )}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="waitlist-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="flex-1 bg-[var(--color-ink-surface)] border border-[var(--color-edge)] focus:border-[var(--color-ember-500)] outline-none px-4 py-3 text-[14px] text-[var(--color-cream)] placeholder:text-[var(--color-cream-mute)] rounded-xl transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="conduit-btn-primary justify-center disabled:opacity-50"
            style={{ padding: "12px 20px", fontSize: "14px" }}
          >
            {status === "loading" ? "Saving…" : ctaLabel}
            {status !== "loading" && <ArrowRight size={14} weight="bold" />}
          </button>
        </div>
      </div>
      {message && status === "error" && (
        <p className="mt-3 text-[13px] text-[var(--color-conduit-danger)]">
          {message}
        </p>
      )}
    </form>
  );
}
