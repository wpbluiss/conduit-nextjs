"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * LiveChat — the ember/PDL chat wired to the REAL backend (/api/conduit/chat
 * SSE engine + real conduit_conversations / conduit_messages). Interaction
 * layer folded in from the proof: ⌘K palette, slash-commands, @mention
 * routing, reactions. Responsive two-pane / mobile drawer.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Code2, TrendingUp, Megaphone, DollarSign, Wrench, ShieldCheck,
  Users, Scale, SquarePen, Menu, ArrowUp, Paperclip, Search, Settings,
  MoreHorizontal, Command, Slash, AtSign, Copy, RefreshCw, Hammer, FileText, Download, Printer, X, AudioLines,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import PraxisLiveRoom from "@/components/conduit/voice/PraxisLiveRoom";
import type { VoiceTokenResponse } from "@/components/conduit/voice/VoiceRoom";

type Icon = React.ComponentType<{ className?: string }>;
const ICON: Record<EmployeeId, Icon> = {
  jarvis: Sparkles, engineering: Code2, sales: TrendingUp, marketing: Megaphone,
  finance: DollarSign, ops: Wrench, compliance: ShieldCheck, hr: Users, legal: Scale,
};

const SLASH: { cmd: string; desc: string; emp: EmployeeId; template: string; icon: Icon }[] = [
  { cmd: "/build", desc: "Build with Engineering", emp: "engineering", template: "Build me ", icon: Hammer },
  { cmd: "/draft", desc: "Draft with Marketing", emp: "marketing", template: "Draft me ", icon: FileText },
  { cmd: "/plan", desc: "Plan with Atlas", emp: "jarvis", template: "Plan ", icon: Sparkles },
  { cmd: "/numbers", desc: "Numbers with Finance", emp: "finance", template: "Run the numbers on ", icon: DollarSign },
  { cmd: "/review", desc: "Legal review", emp: "legal", template: "Review ", icon: Scale },
];

// Deliverables are type-aware: code downloads as runnable source; docs as
// Markdown and can also export to PDF.
const DOC_TYPES = new Set(["post", "doc", "brief", "proposal", "report", "letter", "plan", "copy", "email", "memo"]);
function extFor(type: string) { return type === "migration" || type === "sql" ? "sql" : type === "code" || type === "build" ? "ts" : "md"; }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "artifact"; }
function escapeHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

export type LiveMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeId | null;
  content: string;
  pending?: boolean;
  artifacts?: { id: string; title: string; type: string; by: EmployeeId }[];
  created_at?: string;
};
type Convo = { id: string; title: string; updated_at: string };
type OpenArt = { id: string; title: string; type: string; by: EmployeeId };

export function LiveChat({
  firstName, conversations, activeConversationId, initialMessages, initialHasMore, allowedEmployees, initialPin,
}: {
  firstName: string;
  conversations: Convo[];
  activeConversationId: string | null;
  initialMessages: LiveMsg[];
  initialHasMore?: boolean;
  allowedEmployees: EmployeeId[];
  initialPin: EmployeeId | null;
}) {
  const router = useRouter();
  const allowedSet = new Set<EmployeeId>(allowedEmployees);
  const roster = EMPLOYEE_ORDER.filter((id) => id === "jarvis" || allowedSet.has(id));

  const [messages, setMessages] = React.useState<LiveMsg[]>(initialMessages);
  const [convoId, setConvoId] = React.useState<string | null>(activeConversationId);
  const [pin, setPin] = React.useState<EmployeeId>(initialPin ?? "jarvis");
  // Only force an employee when the user explicitly picked one; otherwise
  // let Atlas auto-route (the engine's handoff magic).
  const [userPinned, setUserPinned] = React.useState<boolean>(Boolean(initialPin));
  const [input, setInput] = React.useState("");
  const [drawer, setDrawer] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hasOlderMessages, setHasOlderMessages] = React.useState(Boolean(initialHasMore));
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const skipAutoScroll = React.useRef(false);
  const [palette, setPalette] = React.useState(false);
  const [paletteQ, setPaletteQ] = React.useState("");
  const [reactions, setReactions] = React.useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [openArtifact, setOpenArtifact] = React.useState<OpenArt | null>(null);
  const [artContent, setArtContent] = React.useState<string | null>(null);
  const [artLoading, setArtLoading] = React.useState(false);
  const [artCopied, setArtCopied] = React.useState(false);
  const [roomToken, setRoomToken] = React.useState<VoiceTokenResponse | null>(null);
  const [launching, setLaunching] = React.useState(false);
  const [voiceErr, setVoiceErr] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const emp = EMPLOYEES[pin];
  const EmpIcon = ICON[pin] ?? Sparkles;

  // Sync canonical server data into state whenever the route changes
  // (conversation switch, new chat, post-send refresh). Without this the
  // rail navigates but the thread keeps showing stale state.
  React.useEffect(() => {
    setMessages(initialMessages);
    setConvoId(activeConversationId);
    setHasOlderMessages(Boolean(initialHasMore));
  }, [activeConversationId, initialMessages, initialHasMore]);

  const slashOpen = input.startsWith("/") && !input.includes(" ");
  const mentionMatch = input.match(/(^|\s)@(\w*)$/);
  const menu: "slash" | "mention" | null = slashOpen ? "slash" : mentionMatch ? "mention" : null;
  const slashItems = SLASH.filter((s) => (s.emp === "jarvis" || allowedSet.has(s.emp)) && s.cmd.startsWith(input.toLowerCase()));
  const mentionItems = roster.filter((id) => EMPLOYEES[id].name.toLowerCase().startsWith((mentionMatch?.[2] ?? "").toLowerCase()));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  React.useEffect(() => {
    if (skipAutoScroll.current) {
      skipAutoScroll.current = false;
      return;
    }
    const t = setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, [messages, loading]);
  React.useEffect(() => {
    if (!openArtifact) { setArtContent(null); return; }
    let alive = true; setArtLoading(true); setArtContent(null);
    fetch(`/api/conduit/artifacts/${openArtifact.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) { setArtContent((j?.artifact?.content as string) ?? "(could not load this artifact)"); setArtLoading(false); } })
      .catch(() => { if (alive) { setArtContent("(could not load this artifact)"); setArtLoading(false); } });
    return () => { alive = false; };
  }, [openArtifact]);

  function grow() { const ta = taRef.current; if (!ta) return; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  function applySlash(s: typeof SLASH[number]) { setPin(s.emp); setUserPinned(true); setInput(s.template); taRef.current?.focus(); }
  function applyMention(id: EmployeeId) { setInput((v) => v.replace(/(^|\s)@\w*$/, (_m, p1) => `${p1}@${EMPLOYEES[id].name} `)); setPin(id); setUserPinned(true); taRef.current?.focus(); }
  function react(id: string, e: string) { setReactions((r) => ({ ...r, [id]: r[id] === e ? "" : e })); }
  function copyMsg(m: LiveMsg) { navigator.clipboard?.writeText(m.content).catch(() => {}); const k = m.id ?? ""; setCopiedId(k); setTimeout(() => setCopiedId((c) => (c === k ? null : c)), 1400); }
  function copyArt() { if (!artContent) return; navigator.clipboard?.writeText(artContent).catch(() => {}); setArtCopied(true); setTimeout(() => setArtCopied(false), 1400); }
  function downloadArt() { if (!openArtifact || !artContent) return; const blob = new Blob([artContent], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${slugify(openArtifact.title)}.${extFor(openArtifact.type)}`; a.click(); URL.revokeObjectURL(url); }
  function pdfArt() { if (!openArtifact || !artContent) return; const w = window.open("", "_blank"); if (!w) return; w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(openArtifact.title)}</title><style>body{font-family:Georgia,serif;max-width:680px;margin:48px auto;padding:0 24px;color:#111;line-height:1.6}.k{color:#888;text-transform:uppercase;letter-spacing:.14em;font-size:11px;font-family:system-ui,sans-serif}h1{font-family:system-ui,sans-serif;font-size:22px;margin:.2em 0 1em}pre{white-space:pre-wrap;font-family:inherit;margin:0}</style></head><body><div class="k">${escapeHtml(openArtifact.type)} · by ${escapeHtml(EMPLOYEES[openArtifact.by]?.name ?? "Praxis")} · Praxis</div><h1>${escapeHtml(openArtifact.title)}</h1><pre>${escapeHtml(artContent)}</pre></body></html>`); w.document.close(); w.focus(); setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 350); }

  const loadOlderMessages = React.useCallback(async () => {
    if (!convoId || loadingOlder || !hasOlderMessages) return;
    const oldestMsg = messages.find((m) => m.created_at);
    if (!oldestMsg?.created_at) return;
    setLoadingOlder(true);
    skipAutoScroll.current = true;
    try {
      const res = await fetch(
        `/api/conduit/conversations/${convoId}?before=${encodeURIComponent(oldestMsg.created_at)}&limit=50`,
      );
      if (!res.ok) return;
      const j = (await res.json()) as {
        messages: Array<{ id: string; role: string; employee: string | null; content: string; created_at: string }>;
        hasMore: boolean;
      };
      const older: LiveMsg[] = j.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          id: m.id,
          role: m.role as LiveMsg["role"],
          employee: (m.employee as EmployeeId | null) ?? null,
          content: m.content ?? "",
          created_at: m.created_at,
        }));
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
      setHasOlderMessages(j.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }, [convoId, loadingOlder, hasOlderMessages, messages]);

  const send = React.useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true); setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setMessages((p) => [...p, { role: "user", content: trimmed }, { role: "assistant", employee: pin, content: "", pending: true }]);
    let current: EmployeeId = pin;
    const ensure = (e: EmployeeId) => setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last && last.role === "assistant" && last.pending && last.employee === e) return n; n.push({ role: "assistant", employee: e, content: "", pending: true }); return n; });
    const append = (e: EmployeeId, d: string) => setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last && last.role === "assistant" && last.pending && last.employee === e) last.content += d; return n; });
    const finish = (e: EmployeeId) => setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last && last.role === "assistant" && last.pending && last.employee === e) last.pending = false; return n; });
    try {
      const body: Record<string, unknown> = { message: trimmed };
      if (userPinned) body.employee_override = pin;
      if (convoId) body.conversation_id = convoId;
      const resp = await fetch("/api/conduit/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!resp.ok || !resp.body) {
        if (resp.status === 409) { router.refresh(); return; }
        let fallback = "Something hiccuped. Try that again in a moment.";
        if (resp.status === 429) {
          const j = (await resp.json().catch(() => ({}))) as { message?: string };
          fallback = j.message || "You're sending messages too quickly. Give it a moment and try again.";
        }
        setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last?.pending) { last.pending = false; last.content = fallback; } return n; });
        return;
      }
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
      const handle = (event: string, data: Record<string, unknown>) => {
        if (event === "token") { const e = (data.employee as EmployeeId) || current; current = e; ensure(e); append(e, (data.delta as string) || ""); }
        else if (event === "handoff") { const to = data.to as EmployeeId; finish(current); setMessages((p) => [...p, { role: "system", content: `→ ${EMPLOYEES[to]?.name ?? to} taking this` }]); current = to; }
        else if (event === "message_end") { finish((data.employee as EmployeeId) || current); }
        else if (event === "done") { const cid = data.conversation_id as string; if (cid && cid !== convoId) { setConvoId(cid); window.history.replaceState({}, "", `/chat?c=${cid}`); } }
        else if (event === "error") { append((data.employee as EmployeeId) || current, `\n\n${(data.message as string) || "Try again in a moment."}`); finish(current); }
        else if (event === "artifact") { const a = { id: data.id as string, title: (data.title as string) || "Untitled", type: (data.type as string) || "doc", by: ((data.employee as EmployeeId) || current) }; setMessages((p) => { const n = [...p]; for (let j = n.length - 1; j >= 0; j--) { if (n[j].role === "assistant" && n[j].employee === a.by) { n[j] = { ...n[j], artifacts: [...(n[j].artifacts ?? []), a] }; break; } } return n; }); }
        else if (event === "paywall_required") { finish(current); setMessages((p) => [...p, { role: "system", content: (data.message as string) || "Upgrade required to continue." }]); }
      };
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
        for (const part of parts) {
          let event = "message", dataLine = "";
          for (const line of part.split("\n")) { if (line.startsWith("event: ")) event = line.slice(7).trim(); else if (line.startsWith("data: ")) dataLine = line.slice(6); }
          if (!dataLine) continue;
          try { handle(event, JSON.parse(dataLine)); } catch { /* ignore */ }
        }
      }
    } finally { setLoading(false); router.refresh(); }
  }, [convoId, loading, pin, userPinned, router]);

  async function openLive() {
    if (launching || roomToken) return;
    setVoiceErr(null); setLaunching(true);
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());
      const res = await fetch("/api/voice/token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: pin, mode: "roundtable", participants: roster, conversation_id: convoId ?? undefined }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        setVoiceErr(e.message || e.error || "Couldn't start the live room.");
        return;
      }
      setRoomToken((await res.json()) as VoiceTokenResponse);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      setVoiceErr(e.name === "NotAllowedError" || e.name === "PermissionDeniedError"
        ? "Mic permission denied — enable it in your browser settings."
        : (e.message || "Couldn't start the live room."));
    } finally { setLaunching(false); }
  }

  const Rail = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 px-1"><div className="grid size-8 place-items-center rounded-lg bg-primary"><span className="font-mono text-sm font-bold text-primary-foreground">P</span></div><span className="font-semibold tracking-tight">Praxis</span></div>
        <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary hover:bg-input" onClick={() => { setDrawer(false); router.push("/chat?new=1"); }}><SquarePen className="size-4" /></Button>
      </div>
      <div className="px-3 pb-2">
        <button onClick={() => setPalette(true)} className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary"><Search className="size-4" /> Search<span className="ml-auto flex items-center gap-0.5 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-mono"><Command className="size-2.5" />K</span></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <p className="wm-label px-2 py-2">Recent</p>
        {conversations.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">No conversations yet.</p>}
        {conversations.map((c) => { const on = c.id === convoId; return (
          <button key={c.id} onClick={() => { setDrawer(false); router.push(`/chat?c=${c.id}`); }} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${on ? "bg-secondary" : "hover:bg-secondary/60"}`}>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary ${on ? "ring-1 ring-primary/40" : ""}`}><Sparkles className="size-4" /></span>
            <span className="block min-w-0 flex-1 truncate text-sm font-medium">{c.title}</span>
          </button>
        ); })}
      </div>
      <div className="flex items-center gap-3 border-t border-white/8 p-3"><span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold">{firstName[0]?.toUpperCase() ?? "U"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{firstName}</span><span className="block truncate text-xs text-muted-foreground">Praxis</span></span><Settings className="size-4 text-muted-foreground" /></div>
    </div>
  );

  return (
    <div className="wm-rebrand flex h-[100dvh] w-full overflow-hidden text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-white/8 bg-card/40 backdrop-blur-xl lg:block">{Rail}</aside>
      <AnimatePresence>
        {drawer && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs border-r border-white/8 bg-card lg:hidden">{Rail}</motion.aside>
        </>)}
      </AnimatePresence>

      <AnimatePresence>
        {palette && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPalette(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-card wm-glow">
              <div className="flex items-center gap-2 border-b border-white/8 px-4"><Search className="size-4 text-muted-foreground" /><input autoFocus value={paletteQ} onChange={(e) => setPaletteQ(e.target.value)} placeholder="Jump to a teammate, start a chat…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd></div>
              <div className="max-h-72 overflow-y-auto p-2">
                <p className="wm-label px-2 py-1.5">Actions</p>
                <button onClick={() => { setPalette(false); router.push("/chat?new=1"); }} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"><span className="grid size-7 place-items-center rounded-md bg-secondary text-primary"><SquarePen className="size-4" /></span>New chat</button>
                <p className="wm-label px-2 py-1.5 pt-3">Talk to</p>
                {roster.filter((id) => EMPLOYEES[id].name.toLowerCase().includes(paletteQ.toLowerCase())).map((id) => { const I = ICON[id]; return <button key={id} onClick={() => { setPin(id); setUserPinned(true); setPalette(false); }} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"><span className="grid size-7 place-items-center rounded-md bg-secondary text-primary"><I className="size-4" /></span><span className="flex-1">{EMPLOYEES[id].name}</span><span className="text-xs text-muted-foreground">{EMPLOYEES[id].role}</span></button>; })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openArtifact && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpenArtifact(null)} className="flex-1 bg-black/50" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }} className="flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-card">
              <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><FileText className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="wm-label">{openArtifact.type} · by {EMPLOYEES[openArtifact.by]?.name ?? "Praxis"}</p><h2 className="truncate text-lg font-semibold">{openArtifact.title}</h2></div>
                <Button onClick={copyArt} disabled={!artContent} size="icon" variant="ghost" className="size-9 rounded-lg text-muted-foreground hover:bg-secondary" title="Copy">{artCopied ? <span className="text-xs text-primary">✓</span> : <Copy className="size-4" />}</Button>
                <Button onClick={downloadArt} disabled={!artContent} size="sm" variant="secondary" className="gap-1.5 rounded-lg bg-secondary text-xs"><Download className="size-3.5" /> {extFor(openArtifact.type).toUpperCase()}</Button>
                {DOC_TYPES.has(openArtifact.type) && <Button onClick={pdfArt} disabled={!artContent} size="sm" variant="secondary" className="gap-1.5 rounded-lg bg-secondary text-xs"><Printer className="size-3.5" /> PDF</Button>}
                <Button onClick={() => setOpenArtifact(null)} size="icon" variant="ghost" className="size-9 rounded-lg text-muted-foreground hover:bg-secondary"><X className="size-4" /></Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {artLoading || artContent === null ? <p className="text-sm text-muted-foreground">Loading…</p> : <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90">{artContent}</pre>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {roomToken && <PraxisLiveRoom tokenResponse={roomToken} onClose={() => { setRoomToken(null); router.refresh(); }} />}
      {voiceErr && (
        <div className="fixed top-4 left-1/2 z-[80] -translate-x-1/2 rounded-lg border border-destructive/40 bg-card px-4 py-2.5 text-sm wm-glow">
          <span className="text-destructive">{voiceErr}</span>
          <button onClick={() => setVoiceErr(null)} className="ml-3 text-xs text-muted-foreground underline">dismiss</button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/8 bg-background/70 px-4 py-3 backdrop-blur">
          <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary lg:hidden" onClick={() => setDrawer(true)}><Menu className="size-4" /></Button>
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><EmpIcon className="size-5" /></span>
          <div className="min-w-0"><p className="truncate font-semibold leading-tight">{emp.name}</p><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> {emp.role}</p></div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={openLive} disabled={launching} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground wm-glow disabled:opacity-50"><AudioLines className="size-3.5" /> {launching ? "Connecting…" : "Live"}</button>
            <button onClick={() => setPalette(true)} className="hidden items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground sm:flex"><Command className="size-3" />K</button>
          </div>
        </header>

        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-white/8 px-4 py-2.5">
          <span className="wm-label shrink-0 pr-1">Talk to</span>
          {roster.map((id) => { const I = ICON[id]; const on = id === pin && userPinned; return <button key={id} onClick={() => { setPin(id); setUserPinned(true); }} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/8 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><I className="size-3.5" />{EMPLOYEES[id].name}</button>; })}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-7">
            {hasOlderMessages && (
              <div className="flex justify-center">
                <button
                  onClick={loadOlderMessages}
                  disabled={loadingOlder}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-secondary/50 px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  {loadingOlder ? (
                    <span className="animate-spin inline-block size-3 rounded-full border border-current border-t-transparent" />
                  ) : null}
                  {loadingOlder ? "Loading…" : "Load older messages"}
                </button>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><EmpIcon className="size-7" /></span>
                <h2 className="text-2xl font-semibold tracking-tight">How can the team help, {firstName}?</h2>
                <p className="max-w-sm text-muted-foreground">Pick a teammate above, type <span className="font-mono text-foreground">/</span> for commands, or just start — Atlas routes it to whoever&apos;s right.</p>
              </div>
            )}
            {messages.map((m, i) => {
              if (m.role === "system") return <div key={m.id ?? i} className="flex items-center gap-3 py-1"><div className="h-px flex-1 bg-white/8" /><span className="wm-label">{m.content}</span><div className="h-px flex-1 bg-white/8" /></div>;
              if (m.role === "user") return (
                <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="flex justify-end"><div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed">{m.content}</div></motion.div>
              );
              const e = (m.employee as EmployeeId) ?? "jarvis"; const I = ICON[e] ?? Sparkles; const k = m.id ?? String(i);
              return (
                <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="group flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><I className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-sm font-semibold">{EMPLOYEES[e]?.name ?? "Atlas"}</p>
                    {m.pending && !m.content ? (
                      <div className="flex items-center gap-1 py-2">{[0, 1, 2].map((j) => (<motion.span key={j} className="size-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: j * 0.18 }} />))}</div>
                    ) : (
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{m.content}{m.pending && <span className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-primary align-middle" />}</div>
                    )}
                    {m.artifacts?.map((a) => (
                      <button key={a.id} onClick={() => setOpenArtifact(a)} className="mt-3 flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-secondary/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><FileText className="size-5" /></span>
                        <span className="min-w-0 flex-1"><span className="wm-label block">{a.type}</span><span className="block truncate text-sm font-medium">{a.title}</span></span>
                        <span className="shrink-0 text-xs text-primary">Open →</span>
                      </button>
                    ))}
                    {!m.pending && (
                      <div className="mt-2 flex items-center gap-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => copyMsg(m)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs hover:bg-secondary hover:text-foreground">{copiedId === k ? <span className="text-primary">Copied</span> : <Copy className="size-3.5" />}</button>
                        <span className="mx-1 h-3 w-px bg-white/10" />
                        <button onClick={() => react(k, "🔥")} className="rounded-md px-1.5 py-1 text-sm hover:bg-secondary">🔥</button>
                        <button onClick={() => react(k, "👍")} className="rounded-md px-1.5 py-1 text-sm hover:bg-secondary">👍</button>
                      </div>
                    )}
                    {reactions[k] && <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs">{reactions[k]}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/8 bg-background/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="relative mx-auto w-full max-w-3xl">
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-card wm-glow">
                  <p className="wm-label flex items-center gap-1.5 px-3 py-2">{menu === "slash" ? <><Slash className="size-3" /> Commands</> : <><AtSign className="size-3" /> Route to teammate</>}</p>
                  <div className="max-h-60 overflow-y-auto pb-1">
                    {menu === "slash" ? (slashItems.length ? slashItems : SLASH).map((s) => (
                      <button key={s.cmd} type="button" onClick={() => applySlash(s)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"><span className="grid size-7 place-items-center rounded-md bg-secondary text-primary"><s.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block font-mono text-sm">{s.cmd}</span><span className="block truncate text-xs text-muted-foreground">{s.desc}</span></span></button>
                    )) : mentionItems.map((id) => { const I = ICON[id]; return (
                      <button key={id} type="button" onClick={() => applyMention(id)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-secondary"><span className="grid size-7 place-items-center rounded-md bg-secondary text-primary"><I className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm">{EMPLOYEES[id].name}</span><span className="block truncate text-xs text-muted-foreground">{EMPLOYEES[id].role}</span></span></button>
                    ); })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-secondary/60 p-2 transition-all focus-within:border-primary/50 focus-within:bg-secondary focus-within:wm-glow">
              <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-input hover:text-foreground"><Paperclip className="size-4" /></Button>
              <textarea ref={taRef} value={input} rows={1} onChange={(e) => { setInput(e.target.value); grow(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !menu) { e.preventDefault(); send(input); } }} placeholder={`Message ${emp.name}…  ·  / for commands  ·  @ to route`} className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground" />
              <motion.div whileTap={{ scale: 0.9 }}><Button type="submit" size="icon" disabled={!input.trim() || loading} className="size-9 shrink-0 rounded-xl wm-glow disabled:opacity-40"><ArrowUp className="size-4" /></Button></motion.div>
            </div>
            <p className="wm-label mt-2 flex items-center justify-center gap-3"><span className="flex items-center gap-1"><Command className="size-3" />K</span><span className="flex items-center gap-1"><Slash className="size-3" />commands</span><span className="flex items-center gap-1"><AtSign className="size-3" />route</span></p>
          </form>
        </div>
      </div>
    </div>
  );
}
