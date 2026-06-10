"use client";

import { useState, useTransition } from "react";
import { Button } from "./forms";
import { createCheckout, openBillingPortal } from "@/lib/finance/actions";

export function UpgradeButton({ label = "Upgrade to Plus" }: { label?: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="animate"
        disabled={pending}
        className="w-full"
        onClick={() =>
          start(async () => {
            const res = await createCheckout();
            if (res.ok && res.url) window.location.href = res.url;
            else setError(res.error || "Couldn't start checkout.");
          })
        }
      >
        {pending ? "Starting…" : label}
      </Button>
      {error && <p className="text-xs text-[#ffa876] mt-2 text-center">{error}</p>}
    </div>
  );
}

export function ManageBillingButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await openBillingPortal();
            if (res.ok && res.url) window.location.href = res.url;
            else setError(res.error || "Couldn't open billing.");
          })
        }
      >
        {pending ? "Opening…" : "Manage billing"}
      </Button>
      {error && <p className="text-xs text-[#ffa876] mt-2">{error}</p>}
    </div>
  );
}
