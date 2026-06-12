"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: Props) {
  useEffect(() => {
    // Log digest without leaking to users
    if (error.digest) console.error("Root error:", error.digest);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center"
      style={{ background: "var(--color-bg-canvas)" }}>
      <p className="text-sm font-mono tracking-widest uppercase mb-4"
        style={{ color: "var(--color-indigo-500)" }}>
        500
      </p>
      <h1 className="text-4xl md:text-5xl font-semibold mb-4 tracking-tight"
        style={{ color: "var(--color-ink-primary)" }}>
        Something went wrong
      </h1>
      <p className="text-base md:text-lg mb-10 max-w-md"
        style={{ color: "var(--color-ink-secondary)" }}>
        An unexpected error occurred. Our team has been notified. Try refreshing the page.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-indigo-500)", color: "#fff" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
          style={{
            color: "var(--color-ink-primary)",
            borderColor: "var(--color-border-default)",
          }}
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
