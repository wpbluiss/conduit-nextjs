"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function ActivityError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="activity feed"
      homeHref="/app/activity"
      homeLabel="Activity"
    />
  );
}
