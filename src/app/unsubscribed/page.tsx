import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed — Praxis",
  robots: { index: false, follow: false },
};

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<Shell />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
          style={{
            background: ok ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
            border: ok
              ? "1px solid rgba(52,211,153,0.18)"
              : "1px solid rgba(239,68,68,0.18)",
          }}
        >
          {ok ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="#34D399"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 9v4M12 17h.01"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="9" stroke="#EF4444" strokeWidth="2" />
            </svg>
          )}
        </div>

        <h1 className="serif text-2xl mb-3">
          {ok ? "You're unsubscribed" : "Link not found"}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-8">
          {ok
            ? "You won't receive weekly digest emails from Praxis. You can re-enable them anytime in your Settings."
            : "This unsubscribe link is invalid or has already been used. You can manage email preferences in Settings."}
        </p>

        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/app/settings"
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hi)] transition-colors"
          >
            Manage notification preferences →
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Back to Praxis
          </Link>
        </div>
      </div>
    </main>
  );
}

function Shell() {
  return (
    <main className="praxis-root conduit-bg-canvas min-h-screen" />
  );
}
