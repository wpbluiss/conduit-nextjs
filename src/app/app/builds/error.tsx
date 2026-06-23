"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function BuildsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="builds"
      homeHref="/app/builds"
      homeLabel="Builds"
    />
  );
}
