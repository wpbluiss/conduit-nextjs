"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function OutputsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="saved outputs"
      homeHref="/app/outputs"
      homeLabel="Outputs"
    />
  );
}
