"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;
    posthog.identify(userId);
  }, [userId]);
  return null;
}
