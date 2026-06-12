import Link from "next/link";
import { PraxisLogo } from "@/components/conduit/PraxisLogo";

export default function AppNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <PraxisLogo size={36} glow className="mb-8" />
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "var(--color-accent)" }}
      >
        404
      </p>
      <h1
        className="serif text-3xl md:text-4xl mb-3"
        style={{ color: "var(--color-text)" }}
      >
        Page not found
      </h1>
      <p
        className="text-sm mb-8 max-w-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        This page doesn&apos;t exist. It may have been moved or the link may be wrong.
      </p>
      <Link
        href="/app/workspace"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
        style={{
          background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-elevated))",
          borderColor: "color-mix(in srgb, var(--color-accent) 35%, var(--color-border))",
          color: "var(--color-accent-hi)",
        }}
      >
        Back to workspace
      </Link>
    </div>
  );
}
