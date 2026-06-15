"use client";

import { useState } from "react";
import { Share2, Link2, X, Check } from "lucide-react";

interface Props {
  artifactId: string;
  initialShareToken: string | null;
}

export function ArtifactShareButton({ artifactId, initialShareToken }: Props) {
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    if (shareToken) {
      // Already shared — copy the link
      await copyLink(shareToken);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/conduit/artifacts/${artifactId}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("share_failed");
      const { share_token } = await res.json() as { share_token: string };
      setShareToken(share_token);
      await copyLink(share_token);
    } catch {
      // Silent — user will see no change; can retry
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conduit/artifacts/${artifactId}/share`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("revoke_failed");
      setShareToken(null);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — show the URL in a prompt fallback
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        title={shareToken ? "Copy share link" : "Share this artifact"}
        aria-label={shareToken ? "Copy share link" : "Share artifact"}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors disabled:opacity-50 ${
          shareToken
            ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hi)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
        }`}
      >
        {copied ? (
          <Check size={13} />
        ) : shareToken ? (
          <Link2 size={13} />
        ) : (
          <Share2 size={13} />
        )}
      </button>
      {shareToken && (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={loading}
          title="Revoke share link"
          aria-label="Revoke share link"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-red-400 hover:bg-[var(--color-surface-raised)] transition-colors disabled:opacity-50"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
