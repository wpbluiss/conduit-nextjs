"use client";

import { ExternalLink } from "lucide-react";
import { usePreviewIframe } from "@/hooks/usePreviewIframe";
import type { SessionRow } from "@/hooks/useBuildSession";

interface Props {
  session: SessionRow;
}

/**
 * Bottom stage — the materialization moment. When deploy_url first arrives,
 * the iframe loads with the curtain-rise animation (CSS keyframe in
 * engineering-cinema.css). On block, falls back to a placeholder card.
 */
export function BuildPreviewStage({ session }: Props) {
  const { state, onLoad, onError } = usePreviewIframe(session.deploy_url);

  if (state.kind === "absent") {
    // No deploy_url yet — render placeholder copy (FR-006 grace).
    return (
      <section className="eng-cinema-preview" aria-label="Live preview">
        <div className="eng-cinema-preview-placeholder">
          <span className="eng-cinema-step-eyebrow">PREVIEW</span>
          <p className="eng-cinema-preview-placeholder-headline">
            The site will appear here when Engineering finishes the first deploy.
          </p>
        </div>
      </section>
    );
  }

  if (state.kind === "blocked") {
    return (
      <section className="eng-cinema-preview" aria-label="Live preview blocked">
        <div className="eng-cinema-preview-fallback">
          <span className="eng-cinema-step-eyebrow">PREVIEW BLOCKED</span>
          <p className="eng-cinema-preview-placeholder-headline">
            The site refused to render inside the cinema — that&apos;s a security
            choice on the deploy. Open it in a new tab instead.
          </p>
          <span className="eng-cinema-preview-fallback-url">{state.url}</span>
          <a
            href={state.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-1.5"
          >
            Open in new tab <ExternalLink size={13} />
          </a>
        </div>
      </section>
    );
  }

  // loading or loaded
  return (
    <section className="eng-cinema-preview" aria-label="Live preview">
      <iframe
        key={state.url}
        className="eng-cinema-preview-iframe"
        src={state.url}
        title="Live build preview"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={onLoad}
        onError={onError}
        data-state={state.kind}
      />
    </section>
  );
}
