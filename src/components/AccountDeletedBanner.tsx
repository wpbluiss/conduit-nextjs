"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

export function AccountDeletedBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (params.get("deleted") === "1") {
      setVisible(true);
      // Strip the param from the URL without adding a history entry
      const url = new URL(window.location.href);
      url.searchParams.delete("deleted");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, [params, router]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-3 shadow-lg backdrop-blur"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      <CheckCircle className="size-4 shrink-0 text-emerald-400" aria-hidden />
      <p className="text-sm text-emerald-100">
        Your account has been permanently deleted. We&apos;ve sent you a confirmation email.
      </p>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="ml-2 shrink-0 rounded-full p-1 text-emerald-400 transition-colors hover:bg-white/10"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
