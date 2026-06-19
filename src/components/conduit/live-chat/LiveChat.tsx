"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * LiveChat — the ember/PDL chat wired to the REAL backend (/api/conduit/chat
 * SSE engine + real conduit_conversations / conduit_messages). Interaction
 * layer folded in from the proof: ⌘K palette, slash-commands, @mention
 * routing, reactions. Responsive two-pane / mobile drawer.
 */

import * as React from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import {
  Sparkles, Code2, TrendingUp, Megaphone, DollarSign, Wrench, ShieldCheck,
  Users, Scale, SquarePen, Menu, ArrowUp, Paperclip, Search, Settings,
  MoreHorizontal, Command, Slash, AtSign, Copy, RefreshCw, Hammer, FileText, Download, Printer, X, AudioLines,
} from "lucide-react";
import { Button } from "@/components/conduit/ui/Button";
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import PraxisLiveRoom from "@/components/conduit/voice/PraxisLiveRoom";
import type { VoiceTokenResponse } from "@/components/conduit/voice/VoiceRoom";
import { PaywallModal, type PaywallPayload } from "@/components/conduit/PaywallModal";

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

// cx-reward token value (#34D399) used only for ephemeral animation keyframes
const CX_REWARD_RING = "rgba(52,211,153,0.4)";
const CX_REWARD_RING_FADE = "rgba(52,211,153,0)";

// Dept-accent RGB values for pulsing avatar glow while specialist is pending.
// Parallel to the CSS variable dept palette — keeps glow computation in JS where
// framer-motion can interpolate the rgba() strings.
const DEPT_GLOW_RGB: Record<EmployeeId, string> = {
  jarvis:      "200,197,189",
  marketing:   "255,138,61",
  sales:       "52,211,153",
  engineering: "96,165,250",
  finance:     "234,179,8",
  compliance:  "168,85,247",
  hr:          "236,72,153",
  ops:         "20,184,166",
  legal:       "59,130,246",
};

// Mono micro-copy shown while the specialist is thinking/processing.
// Phrased to feel purposeful — not generic "loading…" — per CONSOLE_REDESIGN.md
const THINKING_COPY: Record<EmployeeId, string> = {
  jarvis:      "routing to the right specialist…",
  engineering: "reviewing the build requirements…",
  sales:       "reviewing your pipeline…",
  marketing:   "crafting content strategy…",
  finance:     "running the numbers…",
  hr:          "reviewing people strategy…",
  ops:         "mapping out the process…",
  compliance:  "checking compliance requirements…",
  legal:       "reviewing legal considerations…",
};

function SpecialistChip({ icon: I, complete, pending, employee, reducedMotion }: {
  icon: React.ComponentType<{ className?: string }>;
  complete: boolean;
  pending: boolean;
  employee: EmployeeId;
  reducedMotion: boolean;
}) {
  const controls = useAnimation();
  // Pre-initialize to true for messages already complete on mount (loaded from history)
  const firedRef = React.useRef(complete);
  const rgb = DEPT_GLOW_RGB[employee] ?? "124,108,255";

  React.useEffect(() => {
    if (complete && !firedRef.current && !reducedMotion) {
      firedRef.current = true;
      controls.start({
        scale: [1, 1.18, 0.95, 1],
        boxShadow: [
          `0 0 0 0px ${CX_REWARD_RING_FADE}`,
          `0 0 0 5px ${CX_REWARD_RING}`,
          `0 0 0 0px ${CX_REWARD_RING_FADE}`,
        ],
      }, { duration: 0.38, ease: [0.22, 1, 0.36, 1] });
    }
  }, [complete, reducedMotion, controls]);

  return (
    <motion.span
      animate={controls}
      className="relative mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"
      style={{ willChange: "transform, box-shadow" }}
    >
      <I className="size-4" />
      {/* Dept-accent pulsing ring while specialist is thinking — fades out on completion */}
      <AnimatePresence>
        {pending && !reducedMotion && (
          <motion.span
            key="pending-ring"
            className="pointer-events-none absolute inset-0 rounded-lg"
            animate={{
              boxShadow: [
                `0 0 0 0px rgba(${rgb},0)`,
                `0 0 0 3px rgba(${rgb},0.45)`,
                `0 0 0 0px rgba(${rgb},0)`,
              ],
            }}
            exit={{ boxShadow: `0 0 0 0px rgba(${rgb},0)`, transition: { duration: 0.2 } }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
    </motion.span>
  );
}

// Premium thinking indicator — accent shimmer bar + pulsing dots + specialist micro-copy.
// Per CONSOLE_REDESIGN.md §"AI is thinking / processing": GPU-cheap (transform/opacity only),
// staggered for personality, instant acknowledge then meaningful wait feedback.
function ThinkingIndicator({ employee, reducedMotion }: {
  employee: EmployeeId;
  reducedMotion: boolean;
}) {
  const label = THINKING_COPY[employee] ?? "thinking…";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-2.5 py-1"
      aria-live="polite"
    >
      {/* Thin accent progress shimmer — slides left-to-right, GPU-only (translateX) */}
      <div
        className="relative h-0.5 w-40 overflow-hidden rounded-full"
        style={{ background: "rgba(124,108,255,0.10)" }}
        role="status"
        aria-label={`${EMPLOYEES[employee]?.name ?? "Specialist"} is thinking`}
      >
        {reducedMotion ? (
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-full" style={{ background: "rgba(124,108,255,0.4)" }} />
        ) : (
          <motion.div
            className="absolute inset-y-0 left-0 w-2/5 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(124,108,255,0.75), rgba(124,108,255,0.95), rgba(124,108,255,0.75), transparent)" }}
            animate={{ x: ["-100%", "350%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.1 }}
          />
        )}
      </div>
      {/* Three staggered pulsing dots — wave pattern gives personality */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((j) => (
          <motion.span
            key={j}
            className="size-1.5 rounded-full"
            style={{ backgroundColor: "var(--cx-accent, #7C6CFF)" }}
            animate={reducedMotion ? { opacity: 0.5 } : {
              opacity: [0.25, 1, 0.25],
              scale:   [0.75, 1.15, 0.75],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: j * 0.22,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {/* Specialist-specific mono micro-copy — fades in after a beat */}
      <motion.p
        className="cx-mono cx-type-xs"
        style={{ color: "var(--cx-text-faint, #6B6B7B)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: reducedMotion ? 0 : 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
}

// Streaming caret — soft accent-violet blink while tokens are arriving.
// Uses framer-motion so it inherits the app's easing system and responds
// to prefers-reduced-motion without separate CSS keyframes.
function StreamingCaret({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.span
      className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 rounded-full align-middle"
      style={{ backgroundColor: "var(--cx-accent, #7C6CFF)" }}
      animate={reducedMotion ? { opacity: 0.8 } : { opacity: [1, 0] }}
      transition={reducedMotion ? {} : {
        duration: 0.7,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
    />
  );
}

export type LiveMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeId | null;
  content: string;
  pending?: boolean;
  error?: boolean;
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
  const ctxUser = useUser();
  const reducedMotion = useReducedMotion();
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
  const [paywall, setPaywall] = React.useState<PaywallPayload | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState("");
  const [editSaving, setEditSaving] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const editTaRef = React.useRef<HTMLTextAreaElement>(null);
  const lastSentMsg = React.useRef<string>("");
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

  function startEdit(m: LiveMsg) {
    if (!m.id) return;
    setEditingId(m.id);
    setEditText(m.content);
    setTimeout(() => { editTaRef.current?.focus(); editTaRef.current?.select(); }, 0);
  }

  function cancelEdit() { setEditingId(null); setEditText(""); }

  async function submitEdit(msgId: string) {
    const trimmed = editText.trim();
    if (!trimmed || editSaving) return;
    setEditSaving(true);
    try {
      const r = await fetch(`/api/conduit/messages/${msgId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "edit", content: trimmed }),
      });
      if (!r.ok) { setEditSaving(false); return; }
      // Optimistically: update message content + strip all subsequent messages
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === msgId);
        if (idx === -1) return prev;
        const updated = prev.slice(0, idx + 1).map((m, i) =>
          i === idx ? { ...m, content: trimmed } : m
        );
        return updated;
      });
      setEditingId(null);
      setEditText("");
      // Re-send the edited message to get a fresh reply
      send(trimmed);
    } finally {
      setEditSaving(false);
    }
  }
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
    lastSentMsg.current = trimmed;
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
        setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last?.pending) { last.pending = false; last.content = fallback; last.error = true; } return n; });
        return;
      }
      const reader = resp.body.getReader(); const dec = new TextDecoder(); let buf = "";
      const handle = (event: string, data: Record<string, unknown>) => {
        if (event === "token") { const e = (data.employee as EmployeeId) || current; current = e; ensure(e); append(e, (data.delta as string) || ""); }
        else if (event === "handoff") { const to = data.to as EmployeeId; finish(current); setMessages((p) => [...p, { role: "system", content: `→ ${EMPLOYEES[to]?.name ?? to} taking this` }]); current = to; }
        else if (event === "message_end") { finish((data.employee as EmployeeId) || current); }
        else if (event === "done") { const cid = data.conversation_id as string; if (cid && cid !== convoId) { setConvoId(cid); window.history.replaceState({}, "", `/chat?c=${cid}`); } }
        else if (event === "error") { const errMsg = (data.message as string) || "Try again in a moment."; setMessages((p) => { const n = [...p]; const last = n[n.length - 1]; if (last && last.role === "assistant" && last.pending) { last.pending = false; last.content = last.content || errMsg; last.error = true; } return n; }); }
        else if (event === "artifact") { const a = { id: data.id as string, title: (data.title as string) || "Untitled", type: (data.type as string) || "doc", by: ((data.employee as EmployeeId) || current) }; setMessages((p) => { const n = [...p]; for (let j = n.length - 1; j >= 0; j--) { if (n[j].role === "assistant" && n[j].employee === a.by) { n[j] = { ...n[j], artifacts: [...(n[j].artifacts ?? []), a] }; break; } } return n; }); }
        else if (event === "paywall_required") { finish(current); setPaywall({ reason: (data.reason as PaywallPayload["reason"]) || "cap_reached", message: (data.message as string) || "Upgrade required to continue.", employee: data.employee as string | undefined, tier_id: data.tier_id as PaywallPayload["tier_id"] }); }
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
        <Button size="icon-sm" variant="secondary" className="!rounded-lg bg-secondary hover:bg-input" onClick={() => { setDrawer(false); router.push("/chat?new=1"); }} aria-label="New conversation"><SquarePen className="size-4" /></Button>
      </div>
      <div className="px-3 pb-2">
        <button onClick={() => setPalette(true)} aria-label="Search conversations (⌘K)" className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary"><Search className="size-4" /> Search<span className="ml-auto flex items-center gap-0.5 rounded border border-white/10 px-1.5 py-0.5 cx-type-xs font-mono"><Command className="size-2.5" />K</span></button>
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
      <div className="flex items-center gap-3 border-t border-white/8 p-3"><span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold">{firstName[0]?.toUpperCase() ?? "U"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{firstName}</span><span className="block truncate text-xs text-muted-foreground">{ctxUser?.email ?? "Praxis"}</span></span><Settings className="size-4 text-muted-foreground" /></div>
    </div>
  );

  return (
    <>
    <div className="wm-rebrand flex h-[100dvh] w-full overflow-hidden text-foreground">
      <aside className="cx-glass hidden w-72 shrink-0 border-r lg:block" style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}>{Rail}</aside>
      <AnimatePresence>
        {drawer && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
          <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 320, damping: 34 }} className="cx-glass fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs border-r lg:hidden" style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}>{Rail}</motion.aside>
        </>)}
      </AnimatePresence>

      <AnimatePresence>
        {palette && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPalette(false)} className="cx-scrim absolute inset-0 bg-black/60" />
            <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="cx-glass-float cx-glass-border relative w-full max-w-lg overflow-hidden rounded-2xl wm-glow">
              <div className="flex items-center gap-2 border-b border-white/8 px-4"><Search className="size-4 text-muted-foreground" /><input autoFocus value={paletteQ} onChange={(e) => setPaletteQ(e.target.value)} placeholder="Jump to a teammate, start a chat…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><kbd className="rounded border border-white/10 px-1.5 py-0.5 cx-type-xs text-muted-foreground">esc</kbd></div>
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
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }} className="cx-glass-float flex h-full w-full max-w-2xl flex-col border-l" style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}>
              <div className="flex items-center gap-2 border-b border-white/8 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><FileText className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="wm-label">{openArtifact.type} · by {EMPLOYEES[openArtifact.by]?.name ?? "Praxis"}</p><h2 className="truncate cx-type-md font-semibold">{openArtifact.title}</h2></div>
                <Button onClick={copyArt} disabled={!artContent} size="icon-sm" variant="ghost" className="!rounded-lg text-muted-foreground hover:bg-secondary" title="Copy" aria-label="Copy artifact">{artCopied ? <span className="text-xs text-primary">✓</span> : <Copy className="size-4" />}</Button>
                <Button onClick={downloadArt} disabled={!artContent} size="sm" variant="secondary" className="gap-1.5 !rounded-lg bg-secondary text-xs"><Download className="size-3.5" /> {extFor(openArtifact.type).toUpperCase()}</Button>
                {DOC_TYPES.has(openArtifact.type) && <Button onClick={pdfArt} disabled={!artContent} size="sm" variant="secondary" className="gap-1.5 !rounded-lg bg-secondary text-xs"><Printer className="size-3.5" /> PDF</Button>}
                <Button onClick={() => setOpenArtifact(null)} size="icon-sm" variant="ghost" className="!rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Close artifact"><X className="size-4" /></Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {artLoading || artContent === null ? <p className="text-sm text-muted-foreground">Loading…</p> : <pre className="whitespace-pre-wrap font-mono cx-type-sm leading-relaxed text-foreground/90">{artContent}</pre>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {roomToken && <PraxisLiveRoom tokenResponse={roomToken} onClose={() => { setRoomToken(null); router.refresh(); }} />}
      {voiceErr && (
        <div className="cx-glass-float fixed top-4 left-1/2 z-[80] -translate-x-1/2 rounded-lg border border-destructive/40 px-4 py-2.5 text-sm wm-glow">
          <span className="text-destructive">{voiceErr}</span>
          <Button variant="ghost" size="sm" onClick={() => setVoiceErr(null)} className="ml-3 text-xs underline">dismiss</Button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="cx-glass flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}>
          <Button size="icon-sm" variant="secondary" className="!rounded-lg bg-secondary lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation"><Menu className="size-4" /></Button>
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><EmpIcon className="size-5" /></span>
          <div className="min-w-0"><p className="truncate font-semibold leading-tight">{emp.name}</p><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> {emp.role}</p></div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="primary" size="sm" onClick={openLive} isLoading={launching} loadingText="Connecting…" className="!rounded-full gap-1.5 text-xs font-semibold"><AudioLines className="size-3.5" /> Live</Button>
            <Button variant="ghost" size="sm" onClick={() => setPalette(true)} className="hidden gap-1.5 border border-white/10 text-xs sm:flex" aria-label="Open command palette"><Command className="size-3" />K</Button>
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadOlderMessages}
                  isLoading={loadingOlder}
                  loadingText="Loading…"
                  className="!rounded-full border border-white/10 bg-secondary/50 text-xs text-muted-foreground hover:bg-secondary"
                >
                  Load older messages
                </Button>
              </div>
            )}
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><EmpIcon className="size-7" /></span>
                <h2 className="text-2xl font-semibold tracking-tight">How can the team help, {firstName}?</h2>
                <p className="max-w-sm text-muted-foreground">Pick a teammate above, type <span className="font-mono text-foreground">/</span> for commands, or just start — Atlas routes it to whoever&apos;s right.</p>
              </div>
            )}
            {(() => {
              // Last persisted user message — the only one that gets an edit affordance.
              const lastUserIdx = messages.reduce((acc, m, idx) => m.role === "user" && m.id && !loading ? idx : acc, -1);
              return messages.map((m, i) => {
              if (m.role === "system") return <div key={m.id ?? i} className="flex items-center gap-3 py-1"><div className="h-px flex-1 bg-white/8" /><span className="wm-label">{m.content}</span><div className="h-px flex-1 bg-white/8" /></div>;
              if (m.role === "user") {
                const isLastUser = i === lastUserIdx;
                const isEditing = isLastUser && editingId === m.id;
                return (
                  <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="group/user flex justify-end">
                    {isEditing ? (
                      <div className="w-full max-w-[82%] space-y-2">
                        <textarea
                          ref={editTaRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(m.id!); }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          rows={3}
                          className="w-full resize-none rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-relaxed outline-none ring-1 ring-primary/50 focus:ring-primary"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs">Cancel</Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => submitEdit(m.id!)}
                            isDisabled={!editText.trim()}
                            isLoading={editSaving}
                            loadingText="Saving…"
                            className="text-xs"
                          >
                            Save &amp; resubmit
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex items-start gap-2 max-w-[82%]">
                        {isLastUser && m.id && (
                          <button
                            onClick={() => startEdit(m)}
                            title="Edit message"
                            aria-label="Edit message"
                            className="mt-1.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover/user:opacity-100 hover:text-foreground hover:bg-secondary"
                          >
                            <SquarePen className="size-3.5" />
                          </button>
                        )}
                        <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-sm leading-relaxed">{m.content}</div>
                      </div>
                    )}
                  </motion.div>
                );
              }
              const e = (m.employee as EmployeeId) ?? "jarvis"; const I = ICON[e] ?? Sparkles; const k = m.id ?? String(i);
              return (
                <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="group flex gap-3">
                  <SpecialistChip icon={I} complete={!m.pending} pending={!!m.pending} employee={e} reducedMotion={reducedMotion} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-sm font-semibold">{EMPLOYEES[e]?.name ?? "Atlas"}</p>
                    <AnimatePresence mode="sync" initial={false}>
                      {m.pending && !m.content ? (
                        <ThinkingIndicator key="thinking" employee={e} reducedMotion={reducedMotion} />
                      ) : m.error ? (
                        <div key="error" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
                          <p className="text-sm text-destructive/90 leading-relaxed">{m.content}</p>
                          {lastSentMsg.current && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => send(lastSentMsg.current)}
                              isLoading={loading}
                              loadingText="Retrying…"
                              className="mt-2 gap-1.5 text-xs"
                            >
                              <RefreshCw className="size-3" /> Retry
                            </Button>
                          )}
                        </div>
                      ) : (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
                        >
                          {m.content}
                          {m.pending && <StreamingCaret reducedMotion={reducedMotion} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {m.artifacts?.map((a) => (
                      <button key={a.id} onClick={() => setOpenArtifact(a)} aria-label={`Open artifact: ${a.title}`} className="mt-3 flex w-full max-w-sm items-center gap-3 rounded-xl border border-white/10 bg-secondary/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary"><FileText className="size-5" /></span>
                        <span className="min-w-0 flex-1"><span className="wm-label block">{a.type}</span><span className="block truncate text-sm font-medium">{a.title}</span></span>
                        <span className="shrink-0 text-xs text-primary">Open →</span>
                      </button>
                    ))}
                    {!m.pending && (
                      <div className="mt-2 flex items-center gap-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="sm" onClick={() => copyMsg(m)} className="gap-1 px-1.5 py-1 text-xs" aria-label="Copy message">{copiedId === k ? <span className="text-primary">Copied</span> : <Copy className="size-3.5" />}</Button>
                        <span className="mx-1 h-3 w-px bg-white/10" />
                        <button onClick={() => react(k, "🔥")} aria-label="React with fire" className="rounded-md px-1.5 py-1 text-sm hover:bg-secondary">🔥</button>
                        <button onClick={() => react(k, "👍")} aria-label="React with thumbs up" className="rounded-md px-1.5 py-1 text-sm hover:bg-secondary">👍</button>
                      </div>
                    )}
                    {reactions[k] && <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs">{reactions[k]}</span>}
                  </div>
                </motion.div>
              );
            });
            })()}
          </div>
        </div>

        <div className="cx-glass border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="relative mx-auto w-full max-w-3xl">
            <AnimatePresence>
              {menu && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="cx-glass-float cx-glass-border absolute bottom-full left-0 mb-2 w-72 overflow-hidden rounded-xl wm-glow">
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
            <div
              data-tour-target="chat-input"
              className="flex items-end gap-2 rounded-2xl border bg-secondary/60 p-2 transition-all focus-within:bg-secondary focus-within:wm-glow"
              style={{
                borderColor: loading
                  ? "var(--cx-accent, #7C6CFF)"
                  : "rgba(255,255,255,0.10)",
                boxShadow: loading
                  ? "0 0 0 3px var(--cx-accent-glow-raw, rgba(124,108,255,0.18))"
                  : undefined,
                transition: "border-color 120ms cubic-bezier(0.22,1,0.36,1), box-shadow 120ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <Button type="button" size="icon-sm" variant="ghost" className="!rounded-xl shrink-0 text-muted-foreground hover:bg-input hover:text-foreground" aria-label="Attach file"><Paperclip className="size-4" /></Button>
              <textarea
                ref={taRef}
                value={input}
                rows={1}
                readOnly={loading}
                onChange={(e) => { setInput(e.target.value); grow(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !menu) { e.preventDefault(); send(input); } }}
                placeholder={loading ? "Waiting for response…" : `Message ${emp.name}…  ·  / for commands  ·  @ to route`}
                className="max-h-40 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" variant="primary" size="icon-sm" isDisabled={!input.trim() || loading} className="!rounded-xl shrink-0 disabled:opacity-40" aria-label="Send message"><ArrowUp className="size-4" /></Button>
            </div>
            <p className="wm-label mt-2 flex items-center justify-center gap-3"><span className="flex items-center gap-1"><Command className="size-3" />K</span><span className="flex items-center gap-1"><Slash className="size-3" />commands</span><span className="flex items-center gap-1"><AtSign className="size-3" />route</span></p>
          </form>
        </div>
      </div>
    </div>
    {paywall && (
      <PaywallModal payload={paywall} onClose={() => setPaywall(null)} />
    )}
    </>
  );
}
