"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, EMPLOYEE_ICON } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

const TEAM = new Set<string>(EMPLOYEE_ORDER);

interface SearchResult {
  conversation_id: string;
  title: string | null;
  dominant_employee: string | null;
  snippet: string;
  role: string;
  employee: string | null;
}

function HighlightSnippet({ text, query }: { text: string; query: string }) {
  if (!query) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            style={{
              background: "color-mix(in srgb, var(--color-accent) 25%, transparent)",
              color: "var(--color-accent-hi, var(--color-accent))",
              borderRadius: "2px",
              padding: "0 1px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

export function ConversationSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/conduit/messages/search?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { results: SearchResult[] };
      setResults(json.results ?? []);
    } catch {
      // swallow — search is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => void search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const clear = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const showDropdown = focused && (results.length > 0 || (loading && query.length >= 2));

  return (
    <div className="relative w-full max-w-xl mb-6">
      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl conduit-card transition-colors"
        style={{
          borderColor: focused ? "var(--color-accent)" : undefined,
        }}
      >
        <Search
          size={14}
          className="shrink-0"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          autoComplete="off"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-muted)]"
          style={{ color: "var(--color-text)" }}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={13} />
          </button>
        )}
        {loading && (
          <span
            className="shrink-0 w-3 h-3 rounded-full border-t border-[var(--color-accent)] animate-spin"
            aria-hidden
          />
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden conduit-card py-1"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          {results.length === 0 && !loading && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((r) => {
            const dom = r.dominant_employee as string | null;
            const isTeam = dom === "team";
            const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
            const RecentIcon = EMPLOYEE_ICON[empKey];
            const color = DEPT_COLOR[empKey];

            return (
              <Link
                key={r.conversation_id}
                href={`/app?c=${r.conversation_id}`}
                className="flex items-start gap-3 px-4 py-3 hover:bg-[color-mix(in_srgb,var(--color-accent)_6%,transparent)] transition-colors"
              >
                {isTeam ? (
                  <span
                    aria-hidden
                    className="mt-0.5 inline-block w-4 h-4 rounded-full shrink-0"
                    style={{
                      background:
                        "conic-gradient(from 90deg, var(--color-dept-marketing), var(--color-dept-sales), var(--color-dept-engineering), var(--color-dept-jarvis), var(--color-dept-marketing))",
                    }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex items-center justify-center shrink-0 w-4 h-4 rounded-[4px]"
                    style={{
                      background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
                      color,
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 60%, transparent)`,
                    }}
                  >
                    <RecentIcon size={9} strokeWidth={2.5} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--color-text)] truncate">
                    {r.title || "Untitled chat"}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-text-muted)] leading-snug line-clamp-2">
                    <HighlightSnippet text={r.snippet} query={query} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
