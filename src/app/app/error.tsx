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
          background: "color-mix(in srgb, var(--cx-danger, #F4607D) 12%, var(--cx-surface-raised, #1C1C26))",
          color: "var(--cx-danger, #F4607D)",
          border: "1px solid color-mix(in srgb, var(--cx-danger, #F4607D) 24%, transparent)",
        }}
      >
        <AlertTriangle size={22} strokeWidth={1.75} />
      </span>
      <h1 className="cx-heading-xl mb-3">
        Something went wrong
      </h1>
      <p className="cx-type-sm mb-8 max-w-xs" style={{ color: "var(--cx-text-muted, #A0A0B0)", lineHeight: "var(--cx-lh-body, 1.6)" }}>
        An error occurred while loading this page. Your data is safe — try reloading.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={onRetry} variant="primary" size="md">
          <RotateCcw size={14} strokeWidth={1.75} />
          Try again
        </Button>
        <Button
          onClick={() => router.push("/app/workspace")}
          variant="ghost"
          size="md"
        >
          <Home size={13} strokeWidth={1.75} />
          Workspace
        </Button>
      </div>
    </div>
  );
}
