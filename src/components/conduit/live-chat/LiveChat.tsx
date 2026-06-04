"use client";

/**
 * LiveChat — the new ember/PDL chat surface wired to the REAL backend.
 * Reuses the proven /api/conduit/chat SSE engine (token streaming, handoffs)
 * and real conduit_conversations / conduit_messages. Responsive: desktop
 * two-pane, mobile single column + slide-in drawer. Additive route (/chat);
 * the existing /app chat is untouched.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Code2, TrendingUp, Megaphone, DollarSign, Wrench, ShieldCheck,
  Users, Scale, SquarePen, Menu, ArrowUp, Paperclip, Search, Settings,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";

type Icon = React.ComponentType<{ className?: string }>;
const ICON: Record<EmployeeId, Icon> = {
  jarvis: Sparkles, engineering: Code2, sales: TrendingUp, marketing: Megaphone,
  finance: DollarSign, ops: Wrench, compliance: ShieldCheck, hr: Users, legal: Scale,
};

export type LiveMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeId | null;
  content: string;
  pending?: boolean;
};

type Convo = { id: string; title: string; updated_at: string };

export function LiveChat({
  firstName,
  conversations,
  activeConversationId,
  initialMessages,
  allowedEmployees,
  initialPin,
}: {
  firstName: string;
  conversations: Convo[];
  activeConversationId: string | null;
  initialMessages: LiveMsg[];
  allowedEmployees: EmployeeId[];
  initialPin: EmployeeId | null;
}) {
  const router = useRouter();
  const allowedSet = new Set<EmployeeId>(allowedEmployees);
  const roster = EMPLOYEE_ORDER.filter((id) => id === "jarvis" || allowedSet.has(id));

  const [messages, setMessages] = React.useState<LiveMsg[]>(initialMessages);
  const [convoId, setConvoId] = React.useState<string | null>(activeConversationId);
  const [pin, setPin] = React.useState<EmployeeId>(initialPin ?? "jarvis");
  const [input, setInput] = React.useState("");
  const [drawer, setDrawer] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const emp = EMPLOYEES[pin];
  const EmpIcon = ICON[pin] ?? Sparkles;

  React.useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, [messages, loading]);

  function grow() {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  const send = React.useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    setMessages((p) => [
      ...p,
      { role: "user", content: trimmed },
      { role: "assistant", employee: pin, content: "", pending: true },
    ]);

    let current: EmployeeId = pin;
    const ensure = (e: EmployeeId) => setMessages((p) => {
      const n = [...p]; const last = n[n.length - 1];
      if (last && last.role === "assistant" && last.pending && last.employee === e) return n;
      n.push({ role: "assistant", employee: e, content: "", pending: true }); return n;
    });
    const append = (e: EmployeeId, d: string) => setMessages((p) => {
      const n = [...p]; const last = n[n.length - 1];
      if (last && last.role === "assistant" && last.pending && last.employee === e) last.content += d;
      return n;
    });
    const finish = (e: EmployeeId) => setMessages((p) => {
      const n = [...p]; const last = n[n.length - 1];
      if (last && last.role === "assistant" && last.pending && last.employee === e) last.pending = false;
      return n;
    });

    try {
      const body: Record<string, unknown> = { message: trimmed, employee_override: pin };
      if (convoId) body.conversation_id = convoId;
      const resp = await fetch("/api/conduit/chat", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 409) { router.refresh(); return; }
        setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last?.pending) { last.pending = false; last.content = "Something hiccuped. Try that again in a moment."; } return n; });
        return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const handle = (event: string, data: Record<string, unknown>) => {
        if (event === "token") {
          const e = (data.employee as EmployeeId) || current; current = e;
          ensure(e); append(e, (data.delta as string) || "");
        } else if (event === "handoff") {
          const to = data.to as EmployeeId; finish(current);
          setMessages((p) => [...p, { role: "system", content: `→ ${EMPLOYEES[to]?.name ?? to} taking this` }]);
          current = to;
        } else if (event === "message_end") {
          finish((data.employee as EmployeeId) || current);
        } else if (event === "done") {
          const cid = data.conversation_id as string;
          if (cid && cid !== convoId) { setConvoId(cid); window.history.replaceState({}, "", `/chat?c=${cid}`); }
        } else if (event === "error") {
          append((data.employee as EmployeeId) || current, `\n\n${(data.message as string) || "Try again in a moment."}`); finish(current);
        } else if (event === "paywall_required") {
          finish(current);
          setMessages((p) => [...p, { role: "system", content: (data.message as string) || "Upgrade required to continue." }]);
        }
      };
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
        for (const part of parts) {
          let event = "message", dataLine = "";
          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) event = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLine = line.slice(6);
          }
          if (!dataLine) continue;
          try { handle(event, JSON.parse(dataLine)); } catch { /* ignore */ }
        }
      }
    } finally {
      setLoading(false);
      router.refresh();
    }
  }, [convoId, loading, pin, router]);

  const Rail = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="grid size-8 place-items-center rounded-lg bg-primary"><span className="font-mono text-sm font-bold text-primary-foreground">P</span></div>
          <span className="font-semibold tracking-tight">Praxis</span>
        </div>
        <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary hover:bg-input" onClick={() => router.push("/chat")}><SquarePen className="size-4" /></Button>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search chats" className="h-9 w-full rounded-lg border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <p className="wm-label px-2 py-2">Recent</p>
        {conversations.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No conversations yet.</p>}
        {conversations.map((c) => {
          const on = c.id === convoId;
          return (
            <button key={c.id} onClick={() => { setDrawer(false); router.push(`/chat?c=${c.id}`); }} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${on ? "bg-secondary" : "hover:bg-secondary/60"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary ${on ? "ring-1 ring-primary/40" : ""}`}><Sparkles className="size-4" /></span>
              <span className="block min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border-t border-white/8 p-3">
        <span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold">{firstName[0]?.toUpperCase() ?? "U"}</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{firstName}</span><span className="block truncate text-xs text-muted-foreground">Praxis</span></span>
        <Settings className="size-4 text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="wm-rebrand flex h-[100dvh] w-full overflow-hidden text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-card/40 backdrop-blur-xl lg:block">{Rail}</aside>
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs border-r border-white/8 bg-card lg:hidden">{Rail}</motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/8 bg-background/70 px-4 py-3 backdrop-blur">
          <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary lg:hidden" onClick={() => setDrawer(true)}><Menu className="size-4" /></Button>
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><EmpIcon className="size-5" /></span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{emp.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> {emp.role}</p>
          </div>
          <Button size="icon" variant="ghost" className="ml-auto size-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"><MoreHorizontal className="size-4" /></Button>
        </header>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-white/8 px-4 py-2.5">
          <span className="wm-label shrink-0 pr-1">Talk to</span>
          {roster.map((id) => {
            const E = EMPLOYEES[id]; const I = ICON[id]; const on = id === pin;
            return (
              <button key={id} onClick={() => setPin(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/8 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <I className="size-3.5" />{E.name}
              </button>
            );
          })}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-7">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><EmpIcon className="size-7" /></span>
                <h2 className="text-2xl font-semibold tracking-tight">How can the team help, {firstName}?</h2>
                <p className="max-w-sm text-muted-foreground">Pick a teammate above, or just start typing — Atlas will route it to whoever's right.</p>
              </div>
            )}
            {messages.map((m, i) => {
              if (m.role === "system") return (
                <div key={m.id ?? i} className="flex items-center gap-3 py-1 text-center"><div className="h-px flex-1 bg-white/8" /><span className="wm-label">{m.content}</span><div className="h-px flex-1 bg-white/8" /></div>
              );
              if (m.role === "user") return (
                <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="flex justify-end">
                  <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed">{m.content}</div>
                </motion.div>
              );
              const e = (m.employee as EmployeeId) ?? "jarvis"; const I = ICON[e] ?? Sparkles;
              return (
                <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><I className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="mb-1 text-sm font-semibold">{EMPLOYEES[e]?.name ?? "Atlas"}</p>
                    {m.pending && !m.content ? (
                      <div className="flex items-center gap-1 py-2">{[0, 1, 2].map((k) => (<motion.span key={k} className="size-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: k * 0.18 }} />))}</div>
                    ) : (
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{m.content}{m.pending && <span className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-primary align-middle" />}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 bg-background/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mx-auto w-full max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-secondary/60 p-2 transition-all focus-within:border-primary/50 focus-within:bg-secondary focus-within:wm-glow">
              <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-input hover:text-foreground"><Paperclip className="size-4" /></Button>
              <textarea ref={taRef} value={input} rows={1} onChange={(e) => { setInput(e.target.value); grow(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} placeholder={`Message ${emp.name}…`} className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground" />
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button type="submit" size="icon" disabled={!input.trim() || loading} className="size-9 shrink-0 rounded-xl wm-glow disabled:opacity-40"><ArrowUp className="size-4" /></Button>
              </motion.div>
            </div>
            <p className="wm-label mt-2 text-center">Praxis · your AI workforce · verify important info</p>
          </form>
        </div>
      </div>
    </div>
  );
}
