import Link from "next/link";
import { MapPin } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 text-[var(--color-text-muted)]">
        <MapPin size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold mb-2">Page not found</h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
        This page doesn&apos;t exist in your workspace.
      </p>
      <Link
        href="/app/workspace"
        className="btn-primary"
      >
        Back to workspace
      </Link>
    </div>
  );
}
