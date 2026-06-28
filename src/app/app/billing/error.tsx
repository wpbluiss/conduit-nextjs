"use client";

import { SurfaceError } from "@/components/conduit/ui/SurfaceError";

interface Props {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
}

export default function BillingError(props: Props) {
  return (
    <SurfaceError
      {...props}
      surface="billing"
      homeHref="/app/billing"
      homeLabel="Billing"
    />
  );
}
