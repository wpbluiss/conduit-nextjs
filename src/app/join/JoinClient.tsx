"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";

export function JoinClient({
  code,
  householdName,
  isAuthenticated,
}: {
  code: string;
  householdName: string | null;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    setError(null);
    const res = await fetch("/api/conduit/household/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.message ?? "Something went wrong. Please try again.");
      setJoining(false);
      return;
    }
    setJoined(true);
    setTimeout(() => router.push("/finance"), 1800);
  };

  if (!code || !householdName) {
    return (
      <div className="text-center space-y-4">
        <div className="text-[var(--color-text-muted)] text-sm">
          This invite link is invalid or has already been used.
        </div>
        <Link
          href="/"
          className="inline-block text-sm text-[var(--color-accent-hi)] hover:underline"
        >
          Go to Praxis →
        </Link>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="text-center space-y-3">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          }}
        >
          <Users size={24} className="text-[var(--color-accent-hi)]" />
        </div>
        <p className="text-[var(--color-text)] font-medium">
          You&apos;ve joined <strong>{householdName}</strong>!
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Redirecting to your shared dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4"
          style={{
            background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
          }}
        >
          <Users size={24} className="text-[var(--color-accent-hi)]" />
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Household invite
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Join <span className="text-[var(--color-accent-hi)]">{householdName}</span>
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs mx-auto">
          You&apos;ve been invited to share a household view in Praxis Finance.
        </p>
      </div>

      {isAuthenticated ? (
        <div className="space-y-3">
          <PraxisButton
            onClick={handleJoin}
            isLoading={joining}
            loadingText="Joining…"
            variant="primary"
            className="w-full justify-center"
          >
            Join this household
          </PraxisButton>
          {error && (
            <p className="text-sm text-center text-[var(--color-pink)]">{error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(`/join?code=${code}`)}`}
            className="conduit-btn-primary w-full justify-center flex items-center gap-2"
          >
            Sign in to join
          </Link>
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            New to Praxis?{" "}
            <Link
              href={`/auth/sign-up?next=${encodeURIComponent(`/join?code=${code}`)}`}
              className="text-[var(--color-accent-hi)] hover:underline"
            >
              Create a free account
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
