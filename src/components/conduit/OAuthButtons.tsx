"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 612 0 499.2 0 392.8c0-204.5 132.4-312.3 261.3-312.3 70.2 0 128.6 46.2 172.4 46.2 42.6 0 109.2-49.3 190.6-49.3 30.6 0 110.7 2.6 173.6 81.2zm-252.6-72.1c33.5-40.8 57.9-97.7 57.9-154.6 0-7.9-.6-15.8-2-22.4-55.3 2-120.9 36.8-159.8 80-31.2 35.5-60.6 92.5-60.6 150.1 0 8.5 1.3 17 2 19.6 3.3.6 8.5 1.3 13.8 1.3 49.9 0 112.6-33.5 148.7-74z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface OAuthButtonsProps {
  next?: string;
}

export function OAuthButtons({ next = "/app/workspace" }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: "apple" | "google") => {
    setLoading(provider);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (oauthError) {
      setError("Couldn't start sign-in. Please try again.");
      setLoading(null);
    }
    // On success, Supabase redirects the browser — no need to reset loading.
  };

  return (
    <div className="space-y-3 mb-6">
      <button
        type="button"
        onClick={() => signIn("apple")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-medium transition-all duration-200 disabled:opacity-60"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.12)",
          color: "var(--color-ink-on-inverse)",
        }}
        aria-label="Continue with Apple"
      >
        {loading === "apple" ? (
          <SpinnerIcon />
        ) : (
          <AppleLogo />
        )}
        Continue with Apple
      </button>

      <button
        type="button"
        onClick={() => signIn("google")}
        disabled={loading !== null}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-[14px] font-medium transition-all duration-200 disabled:opacity-60"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.12)",
          color: "var(--color-ink-on-inverse)",
        }}
        aria-label="Continue with Google"
      >
        {loading === "google" ? (
          <SpinnerIcon />
        ) : (
          <GoogleLogo />
        )}
        Continue with Google
      </button>

      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}

      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--color-ink-on-inverse-mute)" }}>
          or
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="30 28"
      />
    </svg>
  );
}
