"use client";

// Manages the cinema's live preview iframe lifecycle:
//   - tracks load / blocked state with a 3s timer per FR-006/SC-010
//   - falls back gracefully when X-Frame-Options or CSP frame-ancestors blocks
//
// Contract: specs/engineering-build-trust/data-model.md §2.6

import { useCallback, useEffect, useRef, useState } from "react";

export type PreviewState =
  | { kind: "absent" }
  | { kind: "loading"; url: string }
  | { kind: "loaded"; url: string }
  | { kind: "blocked"; url: string };

const LOAD_TIMEOUT_MS = 3_000;

export function usePreviewIframe(deployUrl: string | null | undefined): {
  state: PreviewState;
  onLoad: () => void;
  onError: () => void;
} {
  const [state, setState] = useState<PreviewState>(
    deployUrl ? { kind: "loading", url: deployUrl } : { kind: "absent" },
  );

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRef = useRef(false);

  // Reset state if deployUrl changes (e.g. user switches builds).
  useEffect(() => {
    if (!deployUrl) {
      setState({ kind: "absent" });
      settledRef.current = false;
      return;
    }
    setState({ kind: "loading", url: deployUrl });
    settledRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Settled by timer with no load/error event → treat as blocked.
      if (!settledRef.current) {
        settledRef.current = true;
        setState({ kind: "blocked", url: deployUrl });
      }
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [deployUrl]);

  const onLoad = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (deployUrl) setState({ kind: "loaded", url: deployUrl });
  }, [deployUrl]);

  const onError = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (deployUrl) setState({ kind: "blocked", url: deployUrl });
  }, [deployUrl]);

  return { state, onLoad, onError };
}
