"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Send } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { EmployeeBadge, employeeLabel } from "./EmployeeBadge";

export interface MessageRow {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeKey | null;
  content: string;
  metadata?: Record<string, unknown> | null;
  // Inline UI extras (client-only)
  pending?: boolean;
  artifacts?: { id: string; title: string; type: string }[];
  handoffTo?: EmployeeKey;
}

const SUGGESTIONS = [
  { text: "Help me grow my business", pin: undefined as EmployeeKey | undefined },
  {
    text: "Write me 3 blog posts about getting my first 10 customers",
    pin: "marketing" as EmployeeKey,
  },
  {
    text: "How would you build me a CRM for my business?",
    pin: "engineering" as EmployeeKey,
  },
  {
    text: "Draft me a cold outreach campaign",
    pin: "sales" as EmployeeKey,
  },
];

const EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
];

export function Chat({
  conversationId: initialId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: MessageRow[];
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(
    initialId,
  );
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pin, setPin] = useState<EmployeeKey | "auto">("auto");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerArtifactId, setDrawerArtifactId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = useCallback(
    async (text: string, employeePin?: EmployeeKey) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setLoading(true);
      setInput("");

      const userMsg: MessageRow = { role: "user", content: trimmed };
      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: "assistant", employee: "jarvis", content: "", pending: true },
      ]);

      const body: Record<string, unknown> = { message: trimmed };
      if (conversationId) body.conversation_id = conversationId;
      const finalPin = employeePin ?? (pin === "auto" ? undefined : pin);
      if (finalPin) body.employee_override = finalPin;

      const resp = await fetch("/api/conduit/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 409) {
          router.refresh();
          return;
        }
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.pending) {
            last.pending = false;
            last.content =
              "Something hiccuped on my end. Try that again in a moment.";
          }
          return next;
        });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let currentEmployee: EmployeeKey = finalPin ?? "jarvis";
      // Update the placeholder to the right employee
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.pending) last.employee = currentEmployee;
        return next;
      });

      const ensurePendingFor = (employee: EmployeeKey) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            return next;
          }
          next.push({
            role: "assistant",
            employee,
            content: "",
            pending: true,
          });
          return next;
        });
      };

      const appendTo = (employee: EmployeeKey, delta: string) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            last.content += delta;
          }
          return next;
        });
      };

      const finishCurrent = (employee: EmployeeKey) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            last.pending = false;
          }
          return next;
        });
      };

      const recordArtifact = (
        employee: EmployeeKey,
        a: { id: string; title: string; type: string },
      ) => {
        setMessages((prev) => {
          const next = [...prev];
          // attach to most recent assistant message of this employee
          for (let i = next.length - 1; i >= 0; i--) {
            const m = next[i];
            if (m.role === "assistant" && m.employee === employee) {
              m.artifacts = [...(m.artifacts ?? []), a];
              break;
            }
          }
          return next;
        });
      };

      const handleEvent = (event: string, data: Record<string, unknown>) => {
        if (event === "token") {
          const employee = (data.employee as EmployeeKey) || currentEmployee;
          currentEmployee = employee;
          ensurePendingFor(employee);
          appendTo(employee, (data.delta as string) || "");
        } else if (event === "handoff") {
          const to = data.to as EmployeeKey;
          finishCurrent(currentEmployee);
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `→ ${employeeLabel(to)} taking this`,
              handoffTo: to,
            },
          ]);
          currentEmployee = to;
          ensurePendingFor(to);
        } else if (event === "message_end") {
          const employee = (data.employee as EmployeeKey) || currentEmployee;
          finishCurrent(employee);
        } else if (event === "artifact") {
          recordArtifact(
            (data.employee as EmployeeKey) || currentEmployee,
            {
              id: data.id as string,
              title: data.title as string,
              type: data.type as string,
            },
          );
        } else if (event === "done") {
          const cid = data.conversation_id as string;
          if (cid && cid !== conversationId) {
            setConversationId(cid);
            window.history.replaceState({}, "", `/app?c=${cid}`);
          }
        } else if (event === "error") {
          appendTo(
            (data.employee as EmployeeKey) || currentEmployee,
            `\n\n${(data.message as string) || "Try again in a moment."}`,
          );
          finishCurrent(currentEmployee);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLine = line.slice(6);
          }
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            handleEvent(event, data);
          } catch {
            // ignore malformed event
          }
        }
      }

      setLoading(false);
      router.refresh();
    },
    [conversationId, loading, pin, router],
  );

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="pt-12 md:pt-20">
              <h1 className="serif text-3xl md:text-5xl text-[var(--color-text)]">
                What can your team do for you today?
              </h1>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Talk to Jarvis. He&apos;ll route to Marketing, Sales, or
                Engineering — or handle it himself.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text, s.pin)}
                    className="hairline px-4 py-3 text-left text-sm text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)] transition-colors flex items-start justify-between gap-3"
                  >
                    <span>{s.text}</span>
                    <ArrowRight
                      size={14}
                      className="shrink-0 mt-1 opacity-60"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble
              key={m.id ?? i}
              message={m}
              onOpenArtifact={(id) => setDrawerArtifactId(id)}
            />
          ))}
        </div>
      </div>

      <div className="hairline border-l-0 border-r-0 border-b-0 px-4 md:px-8 py-3 md:py-4 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Talk to your team…"
              className="flex-1 resize-none bg-[var(--color-surface-elevated)] hairline px-4 py-3 outline-none focus:border-[var(--color-accent)] max-h-40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="btn-primary !px-4 !py-3 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
            <label className="flex items-center gap-2">
              Talking to:
              <select
                value={pin}
                onChange={(e) => setPin(e.target.value as EmployeeKey | "auto")}
                className="bg-[var(--color-surface-elevated)] hairline px-2 py-1 text-[var(--color-text)]"
              >
                <option value="auto">Jarvis (auto-route)</option>
                {EMPLOYEES.filter((e) => e !== "jarvis").map((e) => (
                  <option key={e} value={e}>
                    {employeeLabel(e)}
                  </option>
                ))}
                <option value="jarvis">Jarvis only</option>
              </select>
            </label>
            <span className="hidden sm:inline">
              Shift+Enter for newline
            </span>
          </div>
        </div>
      </div>

      {drawerArtifactId && (
        <ArtifactDrawer
          artifactId={drawerArtifactId}
          onClose={() => setDrawerArtifactId(null)}
        />
      )}
    </>
  );
}

function MessageBubble({
  message,
  onOpenArtifact,
}: {
  message: MessageRow;
  onOpenArtifact: (id: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-[var(--color-surface-elevated)] hairline px-4 py-3 text-[var(--color-text)] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "system" && message.handoffTo) {
    return (
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] flex items-center gap-2">
          <ArrowRight size={12} />
          {employeeLabel(message.handoffTo)} taking this
        </div>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>
    );
  }

  const employee = (message.employee as EmployeeKey) ?? "jarvis";
  return (
    <div className="space-y-2">
      <EmployeeBadge employee={employee} />
      <div className="text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
        {message.content}
        {message.pending && (
          <span
            aria-hidden
            className="inline-block w-2 h-4 -mb-1 ml-1 bg-[var(--color-accent)] caret"
          />
        )}
      </div>
      {message.artifacts?.map((a) => (
        <button
          key={a.id}
          onClick={() => onOpenArtifact(a.id)}
          className="mt-2 hairline px-3 py-2 text-sm flex items-center gap-2 text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)] transition-colors"
        >
          <FileText size={14} />
          <span className="font-medium text-[var(--color-text)]">
            {a.title}
          </span>
          <span className="text-xs">— Open</span>
        </button>
      ))}
    </div>
  );
}

function ArtifactDrawer({
  artifactId,
  onClose,
}: {
  artifactId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    title: string;
    content: string;
    type: string;
    produced_by: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/conduit/artifacts/${artifactId}`);
      if (r.ok) {
        const j = await r.json();
        setData(j.artifact);
      }
    })();
  }, [artifactId]);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div onClick={onClose} className="flex-1 bg-black/60" />
      <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] hairline border-r-0 border-t-0 border-b-0 overflow-y-auto p-6">
        {!data ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
                  {data.type.replace("_", " ")} · by {data.produced_by}
                </div>
                <h2 className="serif text-2xl mt-1">{data.title}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(data.content)
                  }
                  className="btn-secondary !px-3 !py-2 text-xs"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([data.content], {
                      type: "text/markdown",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${data.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-secondary !px-3 !py-2 text-xs"
                >
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[var(--color-text)] leading-relaxed text-sm">
              {data.content}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
