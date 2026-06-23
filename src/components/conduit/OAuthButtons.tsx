"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { PraxisButton } from "@/components/conduit/ui/Button";

type OAuthProvider = "apple" | "google";

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.53 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function OAuthButton({
  provider,
  redirectTo,
}: {
  provider: OAuthProvider;
  redirectTo: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    // signInWithOAuth redirects; if we reach here, something failed
    setLoading(false);
  }

  const label = provider === "apple" ? "Apple" : "Google";

  return (
    <PraxisButton
      type="button"
      variant="secondary"
      size="md"
      onClick={handleClick}
      disabled={loading}
      aria-label={`Continue with ${label}`}
      className="w-full"
      style={{
        // Apple HIG: use system font for the Apple button
        fontFamily:
          provider === "apple"
            ? "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
            : undefined,
      }}
    >
      {provider === "apple" ? <AppleIcon /> : <GoogleIcon />}
      {loading ? `Connecting…` : `Continue with ${label}`}
    </PraxisButton>
  );
}

export function OAuthButtons({ redirectTo = "/app/workspace" }: { redirectTo?: string }) {
  return (
    <>
      <div className="flex flex-col gap-2.5">
        <OAuthButton provider="google" redirectTo={redirectTo} />
        <OAuthButton provider="apple" redirectTo={redirectTo} />
      </div>

      <div className="relative flex items-center gap-3 my-5">
        <div
          className="flex-1 h-px"
          style={{ background: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}
        />
        <span
          className="cx-type-xs uppercase tracking-[0.16em] shrink-0"
          style={{ color: "var(--color-ink-on-inverse-mute)" }}
        >
          or
        </span>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}
        />
      </div>
    </>
  );
}
