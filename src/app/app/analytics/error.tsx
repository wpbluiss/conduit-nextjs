"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function AnalyticsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="analytics"
      homeHref="/app/analytics"
      homeLabel="Analytics"
    />
  );
}
