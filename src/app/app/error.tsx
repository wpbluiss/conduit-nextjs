"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (error.digest) {
      console.error("AppError digest:", error.digest);
    }
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-4 text-[var(--color-pink)]">
        <AlertCircle size={40} strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-xs mb-6">
        An unexpected error occurred in this section. Your other tabs are
        unaffected.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary inline-flex items-center gap-1.5"
        >
          <RefreshCw size={13} />
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push("/app/workspace")}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-3"
        >
          Back to workspace
        </button>
      </div>
    </div>
  );
}
