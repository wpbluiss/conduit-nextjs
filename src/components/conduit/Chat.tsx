"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Send } from "lucide-react";
import type { EmployeeKey } from "@/lib/ai/provider";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  EmployeeAvatar,
  EmployeeBadge,
  employeeLabel,
} from "./EmployeeBadge";

export interface MessageRow {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeKey | null;
  content: string;
  metadata?: Record<string, unknown> | null;
  pending?: boolean;
  artifacts?: { id: string; title: string; type: string; preview?: string }[];
  handoffTo?: EmployeeKey;
}

const SUGGESTIONS: {
  text: string;
  pin?: EmployeeKey;
  dept: EmployeeKey;
  hint: string;
}[] = [
  {
    text: "Help me grow my business",
    dept: "jarvis",
    hint: "Strategy with Jarvis",
  },
  {
    text: "Write me 3 blog posts about getting my first 10 customers",
    pin: "marketing",
    dept: "marketing",
    hint: "Marketing will draft them",
  },
  {
    text: "How would you build me a CRM for my business?",
    pin: "engineering",
    dept: "engineering",
    hint: "Engineering's plan",
  },
  {
    text: "Draft me a cold outreach campaign",
    pin: "sales",
    dept: "sales",
    hint: "Sales builds the play",
  },
];

const PIN_OPTIONS: { value: EmployeeKey | "auto"; label: string }[] = [
  { value: "auto", label: "Jarvis (auto-route)" },
  { value: "jarvis", label: "Jarvis only" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "engineering", label: "Engineering" },
];

export function Chat({
  conversationId: initialId,
  initialMessages,
  firstName,
}: {
  conversationId: string | null;
  initialMessages: MessageRow[];
  firstName: string;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(
    initialId,
  );
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pin, setPin] = useState<EmployeeKey | "auto">("auto");
  const [pinOpen, setPinOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerArtifactId, setDrawerArtifactId] = useState<string | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(initialId);
  }, [initialId, initialMessages]);

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
      setLimitMessage(null);
      setInput("");

      const finalPin = employeePin ?? (pin === "auto" ? undefined : pin);
      const placeholderEmp: EmployeeKey = finalPin ?? "jarvis";

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        {
          role: "assistant",
          employee: placeholderEmp,
          content: "",
          pending: true,
        },
      ]);

      const body: Record<string, unknown> = { message: trimmed };
      if (conversationId) body.conversation_id = conversationId;
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
      let currentEmployee: EmployeeKey = placeholderEmp;

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
        } else if (event === "limit_reached") {
          setLimitMessage((data.message as string) || "Token limit reached.");
          finishCurrent(currentEmployee);
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

  const pinLabel =
    PIN_OPTIONS.find((o) => o.value === pin)?.label ?? "Jarvis (auto-route)";
  const pinAvatarEmp: EmployeeKey = pin === "auto" ? "jarvis" : pin;

  return (
    <>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <EmptyState firstName={firstName} onSend={send} />
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

      <div className="px-4 md:px-8 py-3 md:py-4 bg-[var(--color-surface)]">
        <div className="mx-auto max-w-3xl">
          {limitMessage && (
            <div className="mb-3 conduit-card px-4 py-3 text-sm text-[var(--color-amber)] border-[var(--color-amber)]/40">
              {limitMessage}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="conduit-pill-input flex items-center gap-2 px-2 py-2"
          >
            <button
              type="button"
              onClick={() => setPinOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-[var(--color-surface-raised)] text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] shrink-0 relative"
            >
              <EmployeeAvatar employee={pinAvatarEmp} size={22} />
              <span>{pinLabel}</span>
              <span aria-hidden>▾</span>
              {pinOpen && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-56 conduit-card overflow-hidden text-left z-10"
                  onMouseLeave={() => setPinOpen(false)}
                >
                  {PIN_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPin(o.value);
                        setPinOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--color-surface-raised)] ${
                        pin === o.value
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)]"
                      }`}
                    >
                      <EmployeeAvatar
                        employee={o.value === "auto" ? "jarvis" : o.value}
                        size={18}
                      />
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </button>
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
              className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-[15px] max-h-32 leading-snug"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="conduit-circle-btn shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="mt-2 text-center text-[11px] text-[var(--color-text-muted)]">
            Shift+Enter for newline
          </p>
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

function EmptyState({
  firstName,
  onSend,
}: {
  firstName: string;
  onSend: (text: string, pin?: EmployeeKey) => void;
}) {
  return (
    <div className="pt-8 md:pt-16">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3">
        Welcome back, {firstName}
      </p>
      <h1 className="serif text-3xl md:text-5xl text-[var(--color-text)] leading-[1.05]">
        What&apos;s the team working on today?
      </h1>
      <p className="mt-4 text-sm text-[var(--color-text-muted)] max-w-xl">
        Talk to Jarvis. He routes to Marketing, Sales, or Engineering — or
        handles it himself.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSend(s.text, s.pin)}
            style={{
              ["--dept" as string]: DEPT_COLOR[s.dept],
              ["--dept-soft" as string]: DEPT_COLOR_SOFT[s.dept],
            }}
            className="conduit-suggestion px-4 py-4 text-left flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <EmployeeAvatar employee={s.dept} size={22} />
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: DEPT_COLOR[s.dept] }}
              >
                {s.hint}
              </span>
            </div>
            <span className="text-sm text-[var(--color-text)]">
              {s.text}
            </span>
          </button>
        ))}
      </div>
    </div>
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
        <div className="max-w-[85%] conduit-bubble-user px-4 py-3 text-[var(--color-text)] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "system" && message.handoffTo) {
    return (
      <div
        className="handoff-card flex items-center gap-3 my-3"
        style={{ ["--dept" as string]: DEPT_COLOR[message.handoffTo] }}
      >
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${DEPT_COLOR[message.handoffTo]} 50%, transparent)`,
            opacity: 0.5,
          }}
        />
        <div className="flex items-center gap-2 text-xs">
          <EmployeeAvatar employee={message.handoffTo} size={20} />
          <span style={{ color: DEPT_COLOR[message.handoffTo] }}>
            {employeeLabel(message.handoffTo)} is taking this from here
          </span>
        </div>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${DEPT_COLOR[message.handoffTo]} 50%, transparent)`,
            opacity: 0.5,
          }}
        />
      </div>
    );
  }

  const employee = (message.employee as EmployeeKey) ?? "jarvis";
  const empty = !message.content && message.pending;

  return (
    <div
      className="flex gap-3"
      style={{ ["--dept" as string]: DEPT_COLOR[employee] }}
    >
      <div className="pt-1 shrink-0">
        <EmployeeAvatar employee={employee} size={32} active={message.pending} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span
            className="text-[12px] font-medium"
            style={{ color: DEPT_COLOR[employee] }}
          >
            {employeeLabel(employee)}
          </span>
          {message.pending && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {empty
                ? `${employeeLabel(employee)} is thinking…`
                : "writing…"}
            </span>
          )}
        </div>
        <div className="conduit-bubble-assistant px-4 py-3 text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
          {empty ? (
            <span className="inline-flex items-center gap-1 py-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          ) : (
            <>
              {message.content}
              {message.pending && (
                <span
                  aria-hidden
                  className="inline-block w-[2px] h-4 -mb-1 ml-1 caret"
                  style={{ background: DEPT_COLOR[employee] }}
                />
              )}
            </>
          )}
        </div>
        {message.artifacts?.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpenArtifact(a.id)}
            style={{
              ["--dept" as string]: DEPT_COLOR[employee],
            }}
            className="mt-2 group conduit-card border-l-[3px] hover:border-l-[3px] px-4 py-3 text-left flex items-start gap-3 hover:border-[var(--dept)] transition-colors w-full max-w-md"
          >
            <span
              className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{ background: DEPT_COLOR_SOFT[employee] }}
            >
              <FileText size={16} style={{ color: DEPT_COLOR[employee] }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {a.type.replace("_", " ")} · by {employeeLabel(employee)}
              </span>
              <span className="block text-sm text-[var(--color-text)] mt-0.5 truncate">
                {a.title}
              </span>
              <span className="block text-[11px] text-[var(--color-text-muted)] mt-1 inline-flex items-center gap-1 group-hover:text-[var(--color-text)]">
                Open in drawer
                <ArrowRight size={11} />
              </span>
            </span>
          </button>
        ))}
      </div>
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
      <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] border-l border-[var(--color-border)] overflow-y-auto p-6 md:p-8">
        {!data ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {data.type.replace("_", " ")} · by {data.produced_by}
                </div>
                <h2 className="serif text-2xl md:text-3xl mt-1 leading-tight">
                  {data.title}
                </h2>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(data.content)
                  }
                  className="btn-secondary !px-3 !py-2 !text-xs"
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
                  className="btn-secondary !px-3 !py-2 !text-xs"
                >
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[var(--color-text)] leading-relaxed text-[15px]">
              {data.content}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
