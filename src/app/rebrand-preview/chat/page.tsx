"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Praxis chat surface — PROOF (standalone, no auth, mock data).
 * Responsive (desktop two-pane / mobile drawer), ember/PDL identity,
 * Watermelon UI. Built to feel ALIVE: streaming replies, a one-tap
 * team switcher (the workforce edge ChatGPT/Claude don't have), smart
 * suggestion chips, spring motion, tactile composer.
 *   →  /rebrand-preview/chat
 */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Code2, TrendingUp, Megaphone, DollarSign, Wrench, ShieldCheck,
  Users, Scale, SquarePen, Menu, ArrowUp, Paperclip, Mic, Search,
  Settings, MoreHorizontal, Copy, RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Icon = React.ComponentType<{ className?: string }>;
type EmpId = "atlas" | "engineering" | "sales" | "marketing" | "finance" | "ops" | "compliance" | "hr" | "legal";

const EMP: Record<EmpId, { name: string; role: string; icon: Icon }> = {
  atlas: { name: "Atlas", role: "Chief of Staff", icon: Sparkles },
  engineering: { name: "Engineering", role: "Build & Ship", icon: Code2 },
  sales: { name: "Sales", role: "Pipeline & Close", icon: TrendingUp },
  marketing: { name: "Marketing", role: "Brand & Demand", icon: Megaphone },
  finance: { name: "Finance", role: "Books & Forecast", icon: DollarSign },
  ops: { name: "Operations", role: "Systems & Process", icon: Wrench },
  compliance: { name: "Compliance", role: "Risk & Controls", icon: ShieldCheck },
  hr: { name: "HR", role: "People & Culture", icon: Users },
  legal: { name: "Legal", role: "Counsel & Contracts", icon: Scale },
};
const ORDER: EmpId[] = ["atlas", "engineering", "sales", "marketing", "finance", "ops", "compliance", "hr", "legal"];

type Msg = { id: string; role: "user" | "assistant"; emp?: EmpId; content: string; stream?: boolean };

const CONVOS: { id: string; title: string; emp: EmpId; time: string }[] = [
  { id: "c1", title: "RLS policies before launch", emp: "engineering", time: "now" },
  { id: "c2", title: "Launch week content plan", emp: "marketing", time: "2h" },
  { id: "c3", title: "Q3 runway model", emp: "finance", time: "Yest" },
  { id: "c4", title: "Weekly cross-org status", emp: "atlas", time: "Mon" },
];

const THREADS: Record<string, Msg[]> = {
  c1: [
    { id: "m1", role: "user", content: "Where are we on locking down the database before we let real users in?" },
    { id: "m2", role: "assistant", emp: "engineering", content: "We have 50 tables with RLS disabled — that's the blocker. I've grouped them: 38 are account-scoped, 8 are public-read, 4 need custom policies. I can write the account-scoped batch now; the 4 custom ones I'd want you to confirm access rules on first. Want me to start the batch?" },
    { id: "m3", role: "user", content: "Yes, start the account-scoped batch. Flag anything risky." },
    { id: "m4", role: "assistant", emp: "engineering", content: "On it. I'll enable RLS + owner policies on the 38, re-run the advisor to confirm zero regressions, and tee up the 4 custom ones as a brief for your review. One flag: conduit_secrets should move to Vault in the same pass — I'll include that." },
  ],
  c2: [
    { id: "m1", role: "user", content: "Give me a content plan for launch week." },
    { id: "m2", role: "assistant", emp: "marketing", content: "Founder-led, 5 days: Mon — the origin story. Tue — a 30s product demo. Wed — one real result. Thu — behind-the-scenes of the crew. Fri — an open invite. I'll draft all five posts + hooks; you record the two video ones. Voice or punchier?" },
  ],
  c3: [
    { id: "m1", role: "user", content: "What's our runway look like at the current burn?" },
    { id: "m2", role: "assistant", emp: "finance", content: "At today's burn you're inside the $5/day fleet cap plus infra — ~$190/mo all-in. Runway isn't the constraint; focus is. I'd hold spend flat until the first cohort of users." },
  ],
  c4: [
    { id: "m1", role: "user", content: "Give me the weekly cross-org status." },
    { id: "m2", role: "assistant", emp: "atlas", content: "Engineering: RLS hardening underway. Marketing: launch plan drafted, awaiting your video. Finance: runway flat. Legal: ToS draft ready. Blocking on you: confirm the 4 custom RLS rules, and record two launch videos." },
  ],
};

const GREETING: Record<EmpId, string> = {
  atlas: "Atlas here. I hold the whole org's context — tell me what you want to move and I'll route it.",
  engineering: "Engineering. What are we building, shipping, or fixing?",
  sales: "Sales. Point me at the pipeline — who do we move and by when?",
  marketing: "Marketing. Want copy, a campaign, or an asset? I'll make it on-brand.",
  finance: "Finance. Ask me about cash, runway, or a forecast — numbers first.",
  ops: "Operations. Name the bottleneck and I'll wire the fix.",
  compliance: "Compliance. I'll check anything against the rule and flag real risk.",
  hr: "HR. Hiring, onboarding, or team stuff — I'll keep it human.",
  legal: "Legal. Bottom line first, then the reasoning. What are we reviewing?",
};

const SUGGEST: Record<EmpId, string[]> = {
  atlas: ["What's blocking me today?", "Summarize the week", "Pull in Engineering"],
  engineering: ["Show the RLS brief", "Deploy to preview", "What needs a Max session?"],
  sales: ["Who's gone cold?", "Draft a follow-up", "Pipeline by stage"],
  marketing: ["Draft today's post", "3 hook ideas", "Plan the launch"],
  finance: ["Show runway", "Biggest cost driver", "Model +2 hires"],
  ops: ["What's flaky?", "Map the workflow", "Vendor list"],
  compliance: ["Pre-launch risk check", "Privacy gaps", "What needs a policy?"],
  hr: ["Draft a role", "Onboarding checklist", "Team pulse"],
  legal: ["Review the ToS", "Safe to sign?", "IP exposure"],
};

const REPLY: Record<EmpId, string> = {
  atlas: "Got it. I'll coordinate that across the team and surface anything that needs your call — give me a moment to line it up.",
  engineering: "Understood. I'll scope it, ship the safe parts now, and tee up anything heavy as a ready-to-run brief for your Max session.",
  sales: "On it — I'll move that through the pipeline and come back with the next action and a date attached.",
  marketing: "Love it. I'll draft it in your voice, give you two angles, and queue the assets for render.",
  finance: "Noted. I'll model it and give you the number plus the implication, not just the figure.",
  ops: "I see the bottleneck. I'll wire the fix and confirm it's actually running before I call it done.",
  compliance: "I'll check it against the rule and flag risk precisely — what's exposed and how to close it.",
  hr: "Understood. I'll handle it candidly and keep it human, then hand you something ready to send.",
  legal: "Bottom line first: I'll review and tell you safe-to-sign or fix-before-signing, with the why.",
};

function StreamingText({ text, animate }: { text: string; animate: boolean }) {
  const words = React.useMemo(() => text.split(" "), [text]);
  const [n, setN] = React.useState(animate ? 0 : words.length);
  React.useEffect(() => {
    if (!animate) { setN(words.length); return; }
    let i = 0;
    const id = setInterval(() => { i += 1; setN(i); if (i >= words.length) clearInterval(id); }, 26);
    return () => clearInterval(id);
  }, [animate, words.length]);
  return (
    <span>
      {words.slice(0, n).join(" ")}
      {animate && n < words.length && <span className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-primary align-middle" />}
    </span>
  );
}

export default function ChatPreview() {
  const [activeConvo, setActiveConvo] = React.useState("c1");
  const [activeEmp, setActiveEmp] = React.useState<EmpId>("engineering");
  const [messages, setMessages] = React.useState<Msg[]>(THREADS.c1);
  const [input, setInput] = React.useState("");
  const [drawer, setDrawer] = React.useState(false);
  const [thinking, setThinking] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const emp = EMP[activeEmp];

  React.useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 60);
    return () => clearTimeout(t);
  }, [messages, thinking]);

  function openConvo(id: string) {
    const c = CONVOS.find((x) => x.id === id);
    if (!c) return;
    setActiveConvo(id); setActiveEmp(c.emp); setMessages(THREADS[id] ?? []); setDrawer(false);
  }
  function switchEmp(id: EmpId) {
    setActiveEmp(id); setActiveConvo("");
    setMessages([{ id: "g" + Date.now(), role: "assistant", emp: id, content: GREETING[id], stream: true }]);
  }

  function push(text: string) {
    if (!text.trim() || thinking) return;
    setMessages((m) => [...m, { id: "u" + Date.now(), role: "user", content: text.trim() }]);
    setInput(""); if (taRef.current) taRef.current.style.height = "auto";
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: "a" + Date.now(), role: "assistant", emp: activeEmp, content: REPLY[activeEmp], stream: true }]);
      setThinking(false);
    }, 950);
  }

  function grow() {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }
  function copy(m: Msg) {
    navigator.clipboard?.writeText(m.content).catch(() => {});
    setCopied(m.id); setTimeout(() => setCopied((c) => (c === m.id ? null : c)), 1400);
  }

  const last = messages[messages.length - 1];
  const showSuggest = !thinking && last?.role === "assistant";

  const Rail = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="grid size-8 place-items-center rounded-lg bg-primary"><span className="font-mono text-sm font-bold text-primary-foreground">P</span></div>
          <span className="font-semibold tracking-tight">Praxis</span>
        </div>
        <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary hover:bg-input" onClick={() => switchEmp("atlas")}><SquarePen className="size-4" /></Button>
      </div>
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search chats" className="h-9 w-full rounded-lg border border-input bg-secondary/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <p className="wm-label px-2 py-2">Recent</p>
        {CONVOS.map((c) => {
          const E = EMP[c.emp]; const on = c.id === activeConvo;
          return (
            <button key={c.id} onClick={() => openConvo(c.id)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${on ? "bg-secondary" : "hover:bg-secondary/60"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-card text-primary ${on ? "ring-1 ring-primary/40" : ""}`}><E.icon className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{E.name} · {c.time}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 border-t border-white/8 p-3">
        <span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold">L</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">Luis Garcia</span><span className="block truncate text-xs text-muted-foreground">Founder · Pro</span></span>
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
        {/* header */}
        <header className="flex items-center gap-3 border-b border-white/8 bg-background/70 px-4 py-3 backdrop-blur">
          <Button size="icon" variant="secondary" className="size-9 rounded-lg bg-secondary lg:hidden" onClick={() => setDrawer(true)}><Menu className="size-4" /></Button>
          <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary"><emp.icon className="size-5" /></span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{emp.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" /> {emp.role} · 9 online</p>
          </div>
          <Button size="icon" variant="ghost" className="ml-auto size-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"><MoreHorizontal className="size-4" /></Button>
        </header>

        {/* team switcher — the workforce edge */}
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-white/8 px-4 py-2.5">
          <span className="wm-label shrink-0 pr-1">Talk to</span>
          {ORDER.map((id) => {
            const E = EMP[id]; const on = id === activeEmp;
            return (
              <button key={id} onClick={() => switchEmp(id)} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${on ? "border-primary/50 bg-primary/15 text-foreground" : "border-white/8 text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <E.icon className="size-3.5" />{E.name}
              </button>
            );
          })}
        </div>

        {/* thread */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-7">
            {messages.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
                {m.role === "user" ? (
                  <div className="flex justify-end"><div className="max-w-[82%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed">{m.content}</div></div>
                ) : (
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">{React.createElement(EMP[m.emp ?? activeEmp].icon, { className: "size-4" })}</span>
                    <div className="min-w-0">
                      <p className="mb-1 text-sm font-semibold">{EMP[m.emp ?? activeEmp].name}</p>
                      <div className="text-[15px] leading-relaxed text-foreground/90"><StreamingText text={m.content} animate={!!m.stream} /></div>
                      <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                        <button onClick={() => copy(m)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs hover:bg-secondary hover:text-foreground">{copied === m.id ? <span className="text-primary">Copied</span> : <Copy className="size-3.5" />}</button>
                        <button className="rounded-md p-1.5 hover:bg-secondary hover:text-foreground"><RefreshCw className="size-3.5" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {thinking && (
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><emp.icon className="size-4" /></span>
                <div className="flex items-center gap-1 pt-2">{[0, 1, 2].map((i) => (<motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />))}</div>
              </div>
            )}

            {showSuggest && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pl-11">
                {SUGGEST[activeEmp].map((s) => (
                  <button key={s} onClick={() => push(s)} className="rounded-full border border-white/10 bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground">{s}</button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-white/8 bg-background/70 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <form onSubmit={(e) => { e.preventDefault(); push(input); }} className="mx-auto w-full max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-secondary/60 p-2 transition-all focus-within:border-primary/50 focus-within:bg-secondary focus-within:wm-glow">
              <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-input hover:text-foreground"><Paperclip className="size-4" /></Button>
              <textarea ref={taRef} value={input} rows={1} onChange={(e) => { setInput(e.target.value); grow(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); push(input); } }} placeholder={`Message ${emp.name}…`} className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground" />
              <Button type="button" size="icon" variant="ghost" className="size-9 shrink-0 rounded-xl text-muted-foreground hover:bg-input hover:text-foreground"><Mic className="size-4" /></Button>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button type="submit" size="icon" disabled={!input.trim() || thinking} className="size-9 shrink-0 rounded-xl wm-glow disabled:opacity-40"><ArrowUp className="size-4" /></Button>
              </motion.div>
            </div>
            <p className="wm-label mt-2 text-center">Praxis · your AI workforce · verify important info</p>
          </form>
        </div>
      </div>
    </div>
  );
}
