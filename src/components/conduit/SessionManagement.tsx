"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SpinnerIcon } from "./PraxisButton";
import { Monitor, Smartphone } from "lucide-react";

function parseDeviceLabel(ua: string): { label: string; isMobile: boolean } {
  const mobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  let browser = "Browser";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";

  const label = os ? `${browser} on ${os}` : browser;
  return { label, isMobile: mobile };
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-elevated)",
      }}
    >
      {children}
    </div>
  );
}

export function SessionManagement() {
  const [sessionInfo, setSessionInfo] = useState<{
    email: string;
    deviceLabel: string;
    isMobile: boolean;
    expiresAt: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, startSignOut] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setLoading(false);
        return;
      }
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const { label, isMobile } = parseDeviceLabel(ua);
      setSessionInfo({
        email: session.user.email ?? "",
        deviceLabel: label,
        isMobile,
        expiresAt: session.expires_at ?? null,
      });
      setLoading(false);
    })();
  }, []);

  const signOutOthers = () => {
    setError(null);
    startSignOut(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) {
        setError(error.message ?? "Sign-out failed. Try again.");
        return;
      }
      setDone(true);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          Active sessions
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          You are currently signed in on this device. Use the button below to
          revoke access on all other devices.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <SpinnerIcon size={14} />
          Loading session…
        </div>
      )}

      {!loading && sessionInfo && (
        <SectionCard>
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 shrink-0 rounded-lg p-2"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              {sessionInfo.isMobile ? (
                <Smartphone size={16} style={{ color: "var(--color-text-muted)" }} />
              ) : (
                <Monitor size={16} style={{ color: "var(--color-text-muted)" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {sessionInfo.deviceLabel}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    background: "color-mix(in srgb, #30a46c 15%, transparent)",
                    color: "#30a46c",
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  This device
                </span>
              </div>
              {sessionInfo.email && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {sessionInfo.email}
                </p>
              )}
              {sessionInfo.expiresAt && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Session active · expires{" "}
                  {new Date(sessionInfo.expiresAt * 1000).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {!loading && !sessionInfo && (
        <SectionCard>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Could not load session info.
          </p>
        </SectionCard>
      )}

      {done ? (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "color-mix(in srgb, #30a46c 12%, transparent)",
            color: "#30a46c",
            border: "1px solid color-mix(in srgb, #30a46c 30%, transparent)",
          }}
        >
          All other sessions have been signed out.
        </div>
      ) : (
        <div className="pt-1">
          <button
            type="button"
            disabled={signingOut || loading || !sessionInfo}
            onClick={signOutOthers}
            className="rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{
              background: "color-mix(in srgb, #e5484d 12%, transparent)",
              color: "#f0888c",
              border: "1px solid color-mix(in srgb, #e5484d 30%, transparent)",
            }}
          >
            {signingOut ? (
              <span className="flex items-center gap-1.5">
                <SpinnerIcon size={14} />
                Signing out…
              </span>
            ) : (
              "Sign out all other devices"
            )}
          </button>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Your current session on this device will remain active.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: "#f0888c" }}>
          {error}
        </p>
      )}
    </div>
  );
}
