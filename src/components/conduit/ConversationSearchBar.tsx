"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquarePlus, Search, X } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { PraxisButton } from "@/components/conduit/ui/Button";
import { DEPT_COLOR, EMPLOYEE_ICON } from "./EmployeeBadge";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";

const TEAM = new Set<string>(EMPLOYEE_ORDER);

interface SearchResult {
  conversation_id: string;
  message_id: string | null;
  title: string | null;
  dominant_employee: string | null;
  updated_at: string | null;
  snippet: string;
  match_type?: "message" | "title";
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const listboxId = useId();

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  // Start open when seeded from URL so results appear immediately
  const [focused, setFocused] = useState(initialQ.length >= 2);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/conduit/conversations/search?q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as { results: SearchResult[] };
      setResults(json.results ?? []);
      setSearched(true);
    } catch {
      // swallow — search is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  // Seed from URL on mount
  useEffect(() => {
    if (initialQ.length >= 2) void search(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      setSearched(false);
      setActiveIndex(-1);
      // Clear ?q= param
      const params = new URLSearchParams(window.location.search);
      params.delete("q");
      const newUrl = params.toString() ? `?${params}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
      return;
    }
    setLoading(true);
    setActiveIndex(-1);
    debounceRef.current = setTimeout(() => {
      void search(query);
      // Persist ?q= in URL
      const params = new URLSearchParams(window.location.search);
      params.set("q", query);
      router.replace(`?${params}`, { scroll: false });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, router]);

  const clear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setResults([]);
      setSearched(false);
      setActiveIndex(-1);
      setFocused(false);
      inputRef.current?.blur();
      const params = new URLSearchParams(window.location.search);
      params.delete("q");
      const newUrl = params.toString() ? `?${params}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
      return;
    }
    if (!showResults) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      const r = results[activeIndex];
      const href = r.message_id
        ? `/app?c=${r.conversation_id}&msg=${r.message_id}`
        : `/app?c=${r.conversation_id}`;
      router.push(href);
      setFocused(false);
      return;
    }
  };

  // Hide results only when focus leaves the entire component (not when tabbing between input and results)
  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node | null)) {
      setTimeout(() => setFocused(false), 50);
    }
  };

  const showResults = focused && query.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mb-6" onBlur={handleContainerBlur}>
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
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search conversations…"
          aria-label="Search conversations"
          autoComplete="off"
          className="flex-1 bg-transparent cx-type-base outline-none placeholder:text-[var(--color-text-muted)]"
          style={{ color: "var(--color-text)" }}
        />
        {query && (
          <PraxisButton
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            aria-label="Clear search"
            className="shrink-0"
          >
            <X size={13} />
          </PraxisButton>
        )}
        {loading && (
          <span
            className="shrink-0 w-3 h-3 rounded-full border-t animate-spin"
            style={{ borderColor: "var(--cx-accent)" }}
            aria-hidden
          />
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden cx-glass-float cx-glass-border py-1"
        >
          {!loading && searched && results.length === 0 && (
            <div className="px-4 py-4">
              <p className="cx-type-base mb-3" style={{ color: "var(--cx-text-muted)" }}>
                No conversations match &ldquo;{query}&rdquo;
              </p>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 cx-type-sm font-medium"
                style={{ color: "var(--cx-accent)" }}
              >
                <MessageSquarePlus size={13} />
                Start a new one →
              </Link>
            </div>
          )}
          {results.map((r, idx) => {
            const dom = r.dominant_employee as string | null;
            const isTeam = dom === "team";
            const empKey = (dom && TEAM.has(dom) ? dom : "jarvis") as EmployeeKey;
            const RecentIcon = EMPLOYEE_ICON[empKey];
            const color = DEPT_COLOR[empKey];
            const isActive = idx === activeIndex;

            return (
              <Link
                key={r.conversation_id}
                id={`search-result-${idx}`}
                role="option"
                aria-selected={isActive}
                href={r.message_id ? `/app?c=${r.conversation_id}&msg=${r.message_id}` : `/app?c=${r.conversation_id}`}
                onClick={() => setFocused(false)}
                className="flex items-start gap-3 px-4 py-3 transition-colors"
                style={{
                  background: isActive
                    ? "color-mix(in srgb, var(--color-accent) 10%, transparent)"
                    : undefined,
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
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
                    <RecentIcon size={9} style={{ strokeWidth: 2.5 }} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="cx-type-base font-medium text-[var(--color-text)] truncate">
                      {r.title || "Untitled chat"}
                    </span>
                    {r.updated_at && (
                      <span className="shrink-0 cx-mono cx-type-xs tabular-nums text-[var(--color-text-muted)]">
                        {relativeDate(r.updated_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 cx-type-xs text-[var(--color-text-muted)] leading-snug line-clamp-2">
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
