import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — Conduit AI",
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24 text-center"
      style={{ background: "var(--color-bg-canvas)", color: "var(--color-ink-primary)" }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.18em] mb-4"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        404
      </p>
      <h1
        className="text-4xl md:text-5xl mb-4"
        style={{ fontFamily: "var(--font-serif)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.1 }}
      >
        Page not found
      </h1>
      <p
        className="text-base mb-10 max-w-sm"
        style={{ color: "var(--color-ink-secondary)", lineHeight: 1.6 }}
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="conduit-btn-primary"
          style={{ padding: "12px 24px", fontSize: "14px" }}
        >
          Back to home
        </Link>
        <Link
          href="/auth/sign-in"
          className="text-sm"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Sign in →
        </Link>
      </div>
    </main>
  );
}
