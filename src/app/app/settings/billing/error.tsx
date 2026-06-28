"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function BillingSettingsError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="billing settings"
      homeHref="/app/settings/billing"
      homeLabel="Settings"
    />
  );
}
