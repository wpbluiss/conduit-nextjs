"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

export function AnalyticsPageView() {
  useEffect(() => {
    track("page_view");
  }, []);
  return null;
}
