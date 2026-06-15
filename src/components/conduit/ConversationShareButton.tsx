"use client";

import { useState } from "react";
import { Share2, Link2, X, Check } from "lucide-react";

interface Props {
  conversationId: string;
  initialShareToken?: string | null;
}

export function ConversationShareButton({ conversationId, initialShareToken = null }: Props) {
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (loading) return;

    if (shareToken) {
      await copyLink(shareToken);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/conduit/conversations/${conversationId}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("share_failed");
      const { share_token } = await res.json() as { share_token: string };
      setShareToken(share_token);
      await copyLink(share_token);
    } catch {
      // Silent — user can retry
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/conduit/conversations/${conversationId}/share`, {
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
    const url = `${window.location.origin}/share/c/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        title={shareToken ? "Copy share link" : "Share this conversation"}
        aria-label={shareToken ? "Copy share link" : "Share conversation"}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors disabled:opacity-50"
        style={{
          color: shareToken ? "var(--color-accent-hi)" : "var(--color-text-muted)",
          border: shareToken ? "1px solid var(--color-border)" : "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = shareToken ? "var(--color-accent-hi)" : "var(--color-text-muted)";
          (e.currentTarget as HTMLElement).style.borderColor = shareToken ? "var(--color-border)" : "transparent";
        }}
      >
        {copied ? <Check size={12} /> : shareToken ? <Link2 size={12} /> : <Share2 size={12} />}
        <span className="hidden sm:inline">
          {copied ? "Copied!" : shareToken ? "Shared" : "Share"}
        </span>
      </button>
      {shareToken && (
        <button
          type="button"
          onClick={handleRevoke}
          disabled={loading}
          title="Revoke share link"
          aria-label="Revoke share link"
          className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors disabled:opacity-50"
          style={{
            color: "var(--color-text-muted)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}
