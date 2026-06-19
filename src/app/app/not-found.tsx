import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
      <p
        className="cx-label mb-3"
      >
        404
      </p>
      <h1 className="cx-heading-2xl mb-3">
        Page not found
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        This page doesn&rsquo;t exist. You may have followed a broken link.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/app/workspace"
          className="btn-primary btn-sz-md inline-flex items-center gap-2"
        >
          <Home size={14} />
          Workspace
        </Link>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft size={13} />
          New chat
        </Link>
      </div>
    </div>
  );
}
