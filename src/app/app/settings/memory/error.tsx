"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function MemorySettingsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="memory settings"
      homeHref="/app/settings/memory"
      homeLabel="Settings"
    />
  );
}
