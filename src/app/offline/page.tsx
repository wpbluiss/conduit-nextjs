import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're offline — Praxis",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: "#0E0D0C", color: "#F5EFE6" }}
    >
      {/* Ember glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(214,120,23,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-[480px]">
        <p
          className="text-xs uppercase tracking-[0.18em] mb-6"
          style={{ color: "rgba(214,120,23,0.8)" }}
        >
          No connection
        </p>
        <h1
          className="text-[40px] md:text-[52px] leading-[1.0] tracking-[-0.03em] mb-5"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
        >
          You&rsquo;re offline.
        </h1>
        <p className="text-[16px] leading-[1.65] mb-8" style={{ color: "rgba(245,239,230,0.55)" }}>
          Praxis needs a connection to talk to your team. Check your internet and try again.
        </p>
        <Link
          href="/app/workspace"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-medium transition-all"
          style={{
            background: "rgba(214,120,23,0.12)",
            border: "1px solid rgba(214,120,23,0.3)",
            color: "#D67817",
          }}
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
