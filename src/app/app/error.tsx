"use client";

// Console-wide error boundary. Next.js 16 mounts this when a child server or
// client component throws during render. The Sidebar stays mounted (parent
// layout is unaffected), so the user can navigate away without a full reload.

import { useEffect } from "react";
import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}

export default function AppError({ error, unstable_retry, reset }: Props) {
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    // Log the error digest for diagnosing production issues without surfacing
    // raw stack traces to the user.
    if (error.digest) {
      console.error("AppError digest:", error.digest);
    }
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="praxis-eyebrow" style={{ color: "var(--color-accent)" }}>
          Something went wrong
        </p>
        <h1
          className="praxis-display-1"
          style={{ marginTop: "var(--space-3)", color: "var(--color-text)" }}
        >
          Page error
        </h1>
        <p
          className="praxis-body-lg"
          style={{
            marginTop: "var(--space-4)",
            color: "var(--color-text-muted)",
          }}
        >
          An unexpected error occurred. Your data is safe — try refreshing, or
          head back to the workspace.
        </p>
        <div
          style={{
            marginTop: "var(--space-8)",
            display: "flex",
            gap: "var(--space-3)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RotateCcw size={15} />
              Try again
            </button>
          )}
          <Link
            href="/app/workspace"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm text-[var(--color-text)] transition-colors"
          >
            <Home size={15} />
            Back to workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
