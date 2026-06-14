"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

type Status = "idle" | "loading" | "success" | "error";

export default function LandingWaitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        duplicate?: boolean;
        error?: string;
      };

      if (res.status === 429) {
        setStatus("error");
        setMessage("Too many requests — try again in an hour.");
        return;
      }
      if (!res.ok || !json.ok) {
        setStatus("error");
        setMessage(
          json.error === "invalid_email"
            ? "That doesn't look like a valid email."
            : "Couldn't save that — try again in a moment.",
        );
        return;
      }

      setStatus("success");
      setMessage(
        json.duplicate
          ? "You're already on the list — we'll be in touch."
          : "You're on the list. We'll email you when early access opens.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network hiccup — try again in a moment.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-start gap-2.5 mt-3">
        <CheckCircle
          size={18}
          weight="fill"
          className="text-[var(--color-conduit-success)] shrink-0 mt-0.5"
        />
        <p className="text-[13px] text-[var(--color-cream-soft)]">{message}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-label="Email address for waitlist"
          className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[var(--color-edge)] focus:border-[var(--color-indigo-500)] outline-none px-4 py-2.5 text-[14px] text-[var(--color-cream)] placeholder:text-[var(--color-cream-mute)] rounded-xl transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="conduit-btn-secondary disabled:opacity-50 justify-center"
          style={{ padding: "10px 18px", fontSize: "13px" }}
        >
          {status === "loading" ? "Saving…" : "Join the waitlist"}
          {status !== "loading" && <ArrowRight size={13} weight="bold" />}
        </button>
      </form>
      {message && status === "error" && (
        <p className="mt-2 text-[12px] text-[var(--color-conduit-danger)]">
          {message}
        </p>
      )}
    </div>
  );
}
