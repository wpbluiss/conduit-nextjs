"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (error.digest) {
      console.error("GlobalError digest:", error.digest);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="praxis-root min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center bg-[var(--color-surface)] text-[var(--color-text)]">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-4">
          500
        </p>
        <h1 className="text-4xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-[var(--color-text-muted)] max-w-sm mb-8">
          An unexpected error occurred. If this keeps happening, contact{" "}
          <a
            href="mailto:support@conduitai.io"
            className="text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
          >
            support@conduitai.io
          </a>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button type="button" onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
