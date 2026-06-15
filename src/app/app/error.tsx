"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function AppError({ error, reset, unstable_retry }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error("AppError:", error.digest ?? error.message);
    }
  }, [error]);

  const onRetry = () => {
    if (unstable_retry) unstable_retry();
    else if (reset) reset();
    else router.refresh();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
      <span
        className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-6"
        style={{
          background: "color-mix(in srgb, var(--color-pink) 12%, var(--color-surface-elevated))",
          color: "var(--color-pink)",
        }}
      >
        <AlertTriangle size={22} />
      </span>
      <h1 className="cx-heading-xl mb-3">
        Something went wrong
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
        An error occurred while loading this page. Your data is safe — try reloading.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          onClick={onRetry}
          className="inline-flex items-center gap-2"
          style={{ padding: "10px 20px", fontSize: "14px" }}
        >
          <RotateCcw size={14} />
          Try again
        </Button>
        <button
          type="button"
          onClick={() => router.push("/app/workspace")}
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Home size={13} />
          Workspace
        </button>
      </div>
    </div>
  );
}
