"use client";

import { useEffect, useState, useCallback } from "react";
import { Bookmark, Copy, Download, Trash2, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";

interface Output {
  id: string;
  title: string;
  content: string;
  specialist: string;
  source_conversation_id: string | null;
  created_at: string;
}

function CopyAction({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cx-type-xs transition-colors"
      style={{
        color: copied ? "var(--color-accent)" : "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DownloadAction({ content, title }: { content: string; title: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
    a.href = url;
    a.download = `${slug || "output"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cx-type-xs transition-colors"
      style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
      aria-label="Download as Markdown"
    >
      <Download size={11} />
      <span className="hidden sm:inline">Download</span>
    </button>
  );
}

export default function OutputsPage() {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conduit/outputs")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => j && setOutputs(j.outputs ?? []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Delete this output?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conduit/outputs/${id}`, { method: "DELETE" });
      if (res.ok) setOutputs((prev) => prev.filter((o) => o.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/app"
            className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
          >
            <ArrowLeft size={14} />
          </Link>
          <h1 className="cx-heading-2xl">Outputs</h1>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-8">
          Specialist responses you&apos;ve saved for reference.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="conduit-card p-5 space-y-2 animate-pulse">
                <div className="h-4 w-48 rounded bg-[var(--color-border)]" />
                <div className="h-3 w-full rounded bg-[var(--color-border)] opacity-60" />
                <div className="h-3 w-3/4 rounded bg-[var(--color-border)] opacity-40" />
              </div>
            ))}
          </div>
        ) : outputs.length === 0 ? (
          <div className="conduit-card p-12 text-center">
            <Bookmark size={32} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm text-[var(--color-text-muted)]">
              No outputs saved yet. Hover over any specialist response in chat and click <strong>Save</strong> to add it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outputs.map((output) => {
              const emp = EMPLOYEES[output.specialist as EmployeeId];
              const deptColor = emp?.color ?? "var(--color-accent)";
              return (
                <div
                  key={output.id}
                  className="conduit-card overflow-hidden"
                  style={{ borderLeft: `3px solid ${deptColor}` }}
                >
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="min-w-0">
                        <h2 className="text-sm font-medium text-[var(--color-text)] truncate">
                          {output.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="cx-type-xs uppercase tracking-[0.15em] font-medium"
                            style={{ color: deptColor }}
                          >
                            {emp?.name ?? output.specialist}
                          </span>
                          <span className="cx-meta">
                            {new Date(output.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDelete(output.id)}
                        disabled={deletingId === output.id}
                        className="shrink-0 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-destructive,#ef4444)] transition-colors disabled:opacity-40"
                        aria-label="Delete output"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="text-sm text-[var(--color-text-muted)] mt-2 line-clamp-3 whitespace-pre-wrap">
                      {output.content}
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-2 px-5 py-2.5"
                    style={{ borderTop: "1px solid var(--color-border)" }}
                  >
                    <CopyAction content={output.content} />
                    <DownloadAction content={output.content} title={output.title} />
                    {output.source_conversation_id && (
                      <Link
                        href={`/app?c=${output.source_conversation_id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg cx-type-xs transition-colors ml-auto"
                        style={{ color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                      >
                        View in chat
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
