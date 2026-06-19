"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
  /** Human-readable surface name shown in the message ("conversations", "builds", …) */
  surface: string;
  /** Where the "Go home" button navigates — defaults to /app/workspace */
  homeHref?: string;
  homeLabel?: string;
}

export function SurfaceError({
  error,
  reset,
  unstable_retry,
  surface,
  homeHref = "/app/workspace",
  homeLabel = "Workspace",
}: Props) {
  const router = useRouter();

  useEffect(() => {
    if (typeof console !== "undefined") {
      console.error(`SurfaceError [${surface}]:`, error.digest ?? error.message);
    }
  }, [error, surface]);

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
          background:
            "color-mix(in srgb, var(--cx-danger, #F4607D) 12%, var(--cx-surface-raised, #1C1C26))",
          color: "var(--cx-danger, #F4607D)",
          border:
            "1px solid color-mix(in srgb, var(--cx-danger, #F4607D) 24%, transparent)",
        }}
      >
        <AlertTriangle size={22} />
      </span>
      <h1 className="cx-heading-xl mb-3">Something went wrong</h1>
      <p
        className="cx-type-sm mb-8 max-w-xs"
        style={{
          color: "var(--cx-text-muted, #A0A0B0)",
          lineHeight: "var(--cx-lh-body, 1.6)",
        }}
      >
        An error occurred while loading your {surface}. Your data is safe — try
        reloading.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={onRetry} variant="primary" size="md">
          <RotateCcw size={14} />
          Try again
        </Button>
        <Button onClick={() => router.push(homeHref)} variant="ghost" size="md">
          <Home size={13} />
          {homeLabel}
        </Button>
      </div>
    </div>
  );
}
