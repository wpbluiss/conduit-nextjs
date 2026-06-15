"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// Reads ?ref=CODE from the URL on first app load, claims the referral via API,
// then strips the param from the URL without triggering a page reload.
export function ReferralClaimer() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const code = params.get("ref");
    if (!code || !/^[A-Z0-9]{8}$/i.test(code)) return;

    // Fire-and-forget — never block the app on this
    fetch("/api/conduit/referrals/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.toUpperCase() }),
    }).catch(() => {});

    // Strip ?ref from the URL without re-rendering the page
    const next = new URLSearchParams(params.toString());
    next.delete("ref");
    const qs = next.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
