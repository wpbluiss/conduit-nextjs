"use client";

// Segment error boundary for the cinema. Next.js 16 mounts this when
// any child throws during render. The build itself continues on the
// worker — we are only recovering the UI.
//
// Contract: specs/engineering-build-trust/contracts/cinema-route.md §5

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";

interface Props {
  error: Error & { digest?: string };
  // Next.js 16 ships unstable_retry on error props; defensive optional.
  unstable_retry?: () => void;
  // Fallback for older API surfaces — same shape.
  reset?: () => void;
}

export default function CinemaError({ error, unstable_retry, reset }: Props) {
  const router = useRouter();
  const params = useParams<{ session?: string }>();
  const sessionId = params?.session;
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  useEffect(() => {
    // Log digest for diagnosis but do NOT surface it to the user.
    if (typeof console !== "undefined") {
      console.error("CinemaError:", error.digest ?? error.message);
    }
    if (typeof window === "undefined" || !sessionId) return;
    try {
      const cached = sessionStorage.getItem(`eng-build-deploy:${sessionId}`);
      if (cached) setDeployUrl(cached);
    } catch {
      // ignore
    }
  }, [error, sessionId]);

  const onReopen = () => {
    if (unstable_retry) {
      unstable_retry();
    } else if (reset) {
      reset();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="eng-cinema" data-dept="engineering">
      <section className="eng-cinema-summary" data-status="failed">
        <div>
          <div className="eng-cinema-step-eyebrow">SOMETHING IN THE LIVE VIEW BROKE</div>
          <h2 className="eng-cinema-summary-headline">
            Your build is still running.
          </h2>
          <p className="eng-cinema-summary-body">
            We hit a rendering snag — the cinema lost track of one piece of
            state. The build itself is unaffected on the Engineering worker.
            Reopen below to pick it up cleanly.
          </p>
        </div>
        <div className="eng-cinema-summary-actions">
          <Button
            onClick={onReopen}
            className="inline-flex items-center gap-1.5"
          >
            Reopen the live view <ArrowRight size={13} />
          </Button>
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] text-sm text-[var(--color-text)] transition-colors"
            >
              Open last-known preview <ExternalLink size={13} />
            </a>
          )}
          <button
            type="button"
            onClick={() => router.push("/app/builds")}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline-offset-2 hover:underline px-3"
          >
            Back to all builds
          </button>
        </div>
      </section>
    </div>
  );
}
