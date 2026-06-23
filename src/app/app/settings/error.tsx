"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function SettingsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="settings"
      homeHref="/app/settings/profile"
      homeLabel="Settings"
    />
  );
}
