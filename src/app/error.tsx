"use client";

// Root-level error boundary for the marketing site. Next.js 16 mounts this
// when any page outside /app throws during render. Keeps the header/footer
// layout visible and gives the visitor a path back to the homepage.

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}

export default function RootError({ error, unstable_retry, reset }: Props) {
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    if (error.digest) console.error("RootError digest:", error.digest);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <p
          style={{
            fontSize: "0.625rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-text-muted, #888)",
            marginBottom: "1rem",
          }}
        >
          500
        </p>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 600,
            lineHeight: 1.15,
            color: "var(--color-text, #fff)",
            marginBottom: "1rem",
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            color: "var(--color-text-muted, #888)",
            marginBottom: "2rem",
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. Please try again or return to the
          homepage.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="btn-primary"
            >
              Try again
            </button>
          )}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--color-border, #333)",
              fontSize: "0.875rem",
              color: "var(--color-text, #fff)",
              textDecoration: "none",
            }}
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
