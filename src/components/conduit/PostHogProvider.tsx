"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

let initialized = false;

function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!initialized) return;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname]);
  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || initialized) return;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
    });
    initialized = true;
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PageViewTracker />
      {children}
    </PHProvider>
  );
}
