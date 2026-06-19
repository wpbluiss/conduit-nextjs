"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";

const STORAGE_KEY = "praxis.cookie_consent";

export type ConsentValue = "accepted" | "declined";

export function getCookieConsent(): ConsentValue | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  // On auth pages the logo anchors the top — keep banner at the bottom on all
  // breakpoints so it never obscures the wordmark.
  const isAuthPage = pathname?.startsWith("/auth");

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
    // Gate: dispatch event so any analytics listener can initialize.
    window.dispatchEvent(new CustomEvent("praxis:consent", { detail: { accepted: true } }));
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
    window.dispatchEvent(new CustomEvent("praxis:consent", { detail: { accepted: false } }));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-[55] px-4 pb-4 md:px-6 ${isAuthPage ? "md:pb-6" : "md:top-0 md:bottom-auto md:pt-6 md:pb-0"}`}
    >
      <div
        className="mx-auto max-w-3xl cx-glass-float cx-glass-border flex flex-row items-center gap-2 p-3 md:flex-row md:items-center md:gap-6 md:p-4"
      >
        <p className="flex-1 text-xs md:text-sm text-[var(--color-text-muted)] leading-relaxed">
          We use analytics to improve Praxis.{" "}
          <a
            href="/legal/privacy"
            className="text-[var(--color-accent)] hover:underline"
          >
            Privacy policy
          </a>
          .
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <PraxisButton onClick={decline} variant="ghost" size="sm">
            Decline
          </PraxisButton>
          <PraxisButton onClick={accept} variant="primary" size="sm">
            Accept
          </PraxisButton>
          <PraxisButton
            onClick={decline}
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
          >
            <X size={14} strokeWidth={1.75} />
          </PraxisButton>
        </div>
      </div>
    </div>
  );
}
