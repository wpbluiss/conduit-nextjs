"use client";

import { useEffect } from "react";
import { phIdentify } from "@/lib/analytics/posthog";

export function PostHogIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    phIdentify(userId);
  // Run once on mount when userId is known.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
