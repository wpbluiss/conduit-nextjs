"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ArrowLeft } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  // Next.js 16 uses unstable_retry; keep both for forward-compat
  unstable_retry?: () => void;
}

export default function AppError({ error, reset, unstable_retry }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (error.digest) console.error("App error:", error.digest);
  }, [error]);

  const onRetry = () => {
    if (unstable_retry) unstable_retry();
    else if (reset) reset();
    else router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
      <p
        className="text-xs font-mono tracking-widest uppercase mb-3"
        style={{ color: "var(--color-accent)" }}
      >
        Error
      </p>
      <h1
        className="serif text-3xl md:text-4xl mb-3"
        style={{ color: "var(--color-text)" }}
      >
        Something went wrong
      </h1>
      <p
        className="text-sm mb-8 max-w-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        An unexpected error occurred. The app is still running — try refreshing or go back to the workspace.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-elevated))",
            borderColor: "color-mix(in srgb, var(--color-accent) 35%, var(--color-border))",
            color: "var(--color-accent-hi)",
          }}
        >
          <RotateCcw size={13} /> Try again
        </button>
        <button
          type="button"
          onClick={() => router.push("/app/workspace")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors"
          style={{
            color: "var(--color-text-muted)",
            borderColor: "var(--color-border)",
          }}
        >
          <ArrowLeft size={13} /> Back to workspace
        </button>
      </div>
    </div>
  );
}
