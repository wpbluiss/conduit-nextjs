"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Provider = "google" | "apple";

const BUTTON_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  width: "100%",
  padding: "11px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--color-ink-on-inverse)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s, border-color 0.15s",
  lineHeight: 1,
  userSelect: "none",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 14 17" fill="currentColor" aria-hidden>
      <path d="M13.1 12.9c-.3.7-.6 1.3-1 1.9-.5.8-1 1.3-1.4 1.6-.5.5-1.1.7-1.7.7-.4 0-.9-.1-1.5-.4-.5-.2-1-.4-1.5-.4-.5 0-1 .1-1.5.4-.5.2-.9.4-1.3.4-.6 0-1.2-.3-1.7-.8-.5-.5-1-1.1-1.4-2C.4 13.4 0 12.2 0 11c0-1.3.3-2.4.8-3.3.4-.7 1-1.3 1.7-1.7.7-.4 1.5-.6 2.3-.6.5 0 1 .1 1.6.4.6.2 1 .4 1.2.4.2 0 .7-.2 1.3-.4.7-.3 1.3-.4 1.7-.4 1.7.1 3 .9 3.8 2.3-1.5.9-2.2 2.2-2.2 3.8 0 1.3.5 2.4 1.5 3.2.4-.2.7-.3 1-.3-.1.3-.2.6-.4.8Zm-3.2-13c0 1-.4 2-1.1 2.7-.8.8-1.7 1.3-2.7 1.2a2 2 0 0 1 0-.3c0-1 .4-2 1.1-2.7.4-.4.8-.7 1.3-.9.5-.2 1-.3 1.4-.3.1.1.1.2 0 .3Z" />
    </svg>
  );
}

interface Props {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo }: Props) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: Provider) {
    setLoadingProvider(provider);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          redirectTo ??
          `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoadingProvider(null);
    }
    // On success, browser navigates away — no need to reset state.
  }

  const HOVER_STYLE: React.CSSProperties = {
    background: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.18)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <OAuthButton
        label="Continue with Google"
        icon={<GoogleIcon />}
        loading={loadingProvider === "google"}
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("google")}
        hoverStyle={HOVER_STYLE}
      />
      <OAuthButton
        label="Continue with Apple"
        icon={<AppleIcon />}
        loading={loadingProvider === "apple"}
        disabled={loadingProvider !== null}
        onClick={() => handleOAuth("apple")}
        hoverStyle={HOVER_STYLE}
      />
      {error && (
        <p
          style={{ fontSize: "13px", color: "#f87171", textAlign: "center", marginTop: "2px" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function OAuthButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
  hoverStyle,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  hoverStyle: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        ...BUTTON_STYLE,
        ...(hovered && !disabled ? hoverStyle : {}),
        opacity: disabled && !loading ? 0.55 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          style={{ animation: "spin 0.8s linear infinite" }}
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="30 28" />
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}

export function OAuthDivider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        margin: "20px 0",
      }}
    >
      <div
        style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}
      />
      <span
        style={{
          fontSize: "11px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-on-inverse-mute, rgba(255,255,255,0.3))",
        }}
      >
        or
      </span>
      <div
        style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }}
      />
    </div>
  );
}
