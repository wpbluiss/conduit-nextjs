"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function VoiceSettingsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="voice settings"
      homeHref="/app/settings/voice"
      homeLabel="Settings"
    />
  );
}
