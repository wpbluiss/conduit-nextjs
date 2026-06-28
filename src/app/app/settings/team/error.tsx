"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function TeamSettingsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="team settings"
      homeHref="/app/settings/team"
      homeLabel="Settings"
    />
  );
}
