import Link from "next/link";
import { Home } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p className="praxis-eyebrow" style={{ color: "var(--color-accent)" }}>
          404
        </p>
        <h1
          className="praxis-display-1"
          style={{ marginTop: "var(--space-3)", color: "var(--color-text)" }}
        >
          Page not found
        </h1>
        <p
          className="praxis-body-lg"
          style={{
            marginTop: "var(--space-4)",
            color: "var(--color-text-muted)",
          }}
        >
          This page doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/app/workspace"
          className="btn-primary inline-flex items-center gap-2"
          style={{ marginTop: "var(--space-8)" }}
        >
          <Home size={16} />
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
