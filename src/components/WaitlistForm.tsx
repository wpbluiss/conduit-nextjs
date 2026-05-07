"use client";

import { useState } from "react";

export default function WaitlistForm({
  product,
  source,
  ctaLabel = "Get notified",
  accent = "#FF8A3D",
}: {
  product: "praxis-mobile" | "praxis-hq";
  source?: string;
  ctaLabel?: string;
  accent?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const r = await fetch("/api/conduit/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product, email, source }),
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
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again in a moment.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="flex-1 bg-[#0A0908] border border-[#1F1C19] focus:border-[var(--accent)] outline-none px-4 py-3 text-[15px] text-[#F5F1EA] placeholder:text-[#5C5854] transition-colors"
          style={{ ["--accent" as string]: accent }}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary justify-center disabled:opacity-50"
          style={{
            background: accent,
            color: "#0A0908",
          }}
        >
          {status === "loading" ? "Saving…" : ctaLabel}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-[13px] ${
            status === "error" ? "text-[#F472B6]" : "text-[#8C8884]"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
