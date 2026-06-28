"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function MemoryError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="memory"
      homeHref="/app/memory"
      homeLabel="Memory"
    />
  );
}
