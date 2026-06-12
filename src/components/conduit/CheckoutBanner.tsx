"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  checkout?: string;
  topup?: string;
}

export function CheckoutBanner({ checkout, topup }: Props) {
  const router = useRouter();
  const cleared = useRef(false);

  const isSuccess = checkout === "success" || topup === "success";
  const isCanceled = checkout === "canceled" || topup === "canceled";

  useEffect(() => {
    if ((!isSuccess && !isCanceled) || cleared.current) return;
    cleared.current = true;
    // Remove the query param from the URL without a page reload.
    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    url.searchParams.delete("topup");
    window.history.replaceState({}, "", url.toString());
    // Refresh server data so the tier shows up-to-date.
    if (isSuccess) router.refresh();
  }, [isSuccess, isCanceled, router]);

  if (!isSuccess && !isCanceled) return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
      style={{
        background: isSuccess
          ? "color-mix(in srgb, var(--color-green) 10%, var(--color-surface-elevated))"
          : "color-mix(in srgb, var(--color-text-muted) 10%, var(--color-surface-elevated))",
        border: `1px solid ${isSuccess ? "color-mix(in srgb, var(--color-green) 30%, transparent)" : "var(--color-border)"}`,
      }}
    >
      {isSuccess ? (
        <CheckCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-green)]" />
      ) : (
        <XCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
      )}
      <span style={{ color: isSuccess ? "var(--color-green)" : "var(--color-text-muted)" }}>
        {isSuccess
          ? topup
            ? "Top-up complete — tokens added to your account."
            : "Upgrade complete — your plan has been updated."
          : "Checkout was canceled — nothing was charged."}
      </span>
    </div>
  );
}
