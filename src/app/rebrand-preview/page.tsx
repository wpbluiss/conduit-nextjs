"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Praxis UI rebrand — PROOF surface (standalone, no auth, mock data).
 * "Bold & playful" direction built on real Watermelon UI components +
 * the additive shadcn token bridge. Lives on its own route so the live
 * app is untouched until sign-off.  →  /rebrand-preview
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid, MessageSquare, Hammer, Sparkles, Mic, Activity, Settings,
  Search, Bell, Plus, TrendingUp, ArrowUpRight, Zap, Rocket, Megaphone,
  DollarSign, Wrench, ShieldCheck, Users, Scale, Code2, ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Icon = React.ComponentType<{ className?: string }>;

const NAV: { label: string; icon: Icon; active?: boolean }[] = [
  { label: "Workspace", icon: LayoutGrid, active: true },
  { label: "Chat", icon: MessageSquare },
  { label: "Builds", icon: Hammer },
  { label: "Memory", icon: Sparkles },
  { label: "Voice", icon: Mic },
  { label: "Analytics", icon: Activity },
  { label: "Settings", icon: Settings },
];

const CREW: { id: string; name: string; role: string; color: string; icon: Icon; load: number; status: string }[] = [
  { id: "atlas", name: "Atlas", role: "Chief of Staff", color: "#c8c5bd", icon: Sparkles, load: 72, status: "planning" },
  { id: "eng", name: "Engineering", role: "Build & Ship", color: "#8b5cf6", icon: Code2, load: 91, status: "shipping" },
  { id: "sales", name: "Sales", role: "Pipeline & Close", color: "#34d399", icon: TrendingUp, load: 48, status: "live" },
  { id: "mkt", name: "Marketing", role: "Brand & Demand", color: "#ff5da2", icon: Megaphone, load: 63, status: "drafting" },
  { id: "fin", name: "Finance", role: "Books & Forecast", color: "#ffb23c", icon: DollarSign, load: 30, status: "idle" },
  { id: "ops", name: "Operations", role: "Systems & Process", color: "#22d3ee", icon: Wrench, load: 55, status: "running" },
  { id: "comp", name: "Compliance", role: "Risk & Controls", color: "#a855f7", icon: ShieldCheck, load: 22, status: "idle" },
  { id: "hr", name: "HR", role: "People & Culture", color: "#f472b6", icon: Users, load: 18, status: "idle" },
  { id: "legal", name: "Legal", role: "Counsel & Contracts", color: "#5b8cff", icon: Scale, load: 40, status: "review" },
];

const STATS: { label: string; value: string; delta: string; tint: string; icon: Icon }[] = [
  { label: "Tasks shipped today", value: "47", delta: "+12", tint: "var(--wm-violet)", icon: Rocket },
  { label: "Active employees", value: "9", delta: "all live", tint: "var(--wm-pink)", icon: Zap },
  { label: "Pipeline value", value: "$128k", delta: "+8.4%", tint: "var(--wm-cyan)", icon: TrendingUp },
  { label: "Spend today", value: "$3.91", delta: "of $5 cap", tint: "var(--wm-amber)", icon: DollarSign },
];

const FEED: { who: string; what: string; when: string; color: string }[] = [
  { who: "Engineering", what: "shipped RLS policies on 6 tables", when: "2m", color: "#8b5cf6" },
  { who: "Marketing", what: "drafted 3 launch posts + a hero", when: "11m", color: "#ff5da2" },
  { who: "Atlas", what: "queued tomorrow's plan across 6 fields", when: "26m", color: "#c8c5bd" },
  { who: "Sales", what: "moved 2 deals to negotiation", when: "44m", color: "#34d399" },
  { who: "Ops", what: "locked 2 public storage buckets", when: "1h", color: "#22d3ee" },
];

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: "spring" as const, stiffness: 220, damping: 24 } }),
};

export default function RebrandPreview() {
  const [auto, setAuto] = React.useState<boolean>(true);

  return (
    <div className="wm-rebrand wm-grid min-h-screen w-full text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-0">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-white/5 bg-card/40 px-4 py-6 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-2 px-2">
            <div className="grid size-9 place-items-center rounded-xl wm-glow" style={{ background: "linear-gradient(135deg,var(--wm-violet),var(--wm-pink))" }}>
              <Sparkles className="size-5 text-white" />
            </div>
            <span className="wm-ink text-xl font-extrabold tracking-tight">Praxis</span>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <button
                key={n.label}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  n.active ? "text-white wm-glow" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
                style={n.active ? { background: "linear-gradient(100deg,var(--wm-violet),color-mix(in srgb,var(--wm-pink) 70%,var(--wm-violet)))" } : undefined}
              >
                <n.icon className="size-4" />
                {n.label}
                {n.active && <ChevronRight className="ml-auto size-4 opacity-80" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <p className="px-1 pb-2 text-xs font-semibold text-muted-foreground">Your crew · 9 live</p>
            <div className="flex flex-wrap gap-1.5">
              {CREW.map((c) => (
                <span key={c.id} className="grid size-7 place-items-center rounded-lg text-[11px] font-bold" style={{ background: `color-mix(in srgb, ${c.color} 22%, transparent)`, color: c.color }}>
                  {c.name[0]}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────── */}
        <main className="flex-1 px-5 py-6 sm:px-8">
          {/* Top bar */}
          <header className="mb-7 flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <p className="text-sm text-muted-foreground">Tuesday · good evening</p>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Hey Luis — your crew shipped <span className="wm-ink">47 things</span> today.
              </h1>
            </div>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ask anything…" className="h-10 w-56 rounded-xl border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button size="icon" variant="secondary" className="size-10 rounded-xl bg-white/5 hover:bg-white/10"><Bell className="size-4" /></Button>
            <Button className="h-10 gap-1.5 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(100deg,var(--wm-violet),var(--wm-pink))" }}>
              <Plus className="size-4" /> New task
            </Button>
          </header>

          {/* Hero */}
          <motion.div initial="hidden" animate="show" custom={0} variants={fade}>
            <Card className="wm-aurora wm-glow relative overflow-hidden rounded-3xl border-white/10 bg-card/60 p-0">
              <CardContent className="relative z-10 flex flex-col gap-5 px-7 py-8 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <Badge className="mb-3 border-0 bg-white/10 text-white backdrop-blur"><Zap className="size-3" /> Autonomous fleet · live</Badge>
                  <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                    Your <span className="wm-ink">AI workforce</span> is running the shop.
                  </h2>
                  <p className="mt-2 text-muted-foreground">Nine employees, one command center. Heavy lifts get teed up for you — everything else just gets done.</p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <Button className="h-11 gap-1.5 rounded-xl px-5 font-semibold text-white" style={{ background: "linear-gradient(100deg,var(--wm-violet),var(--wm-pink))" }}>
                      <Rocket className="size-4" /> Open workspace
                    </Button>
                    <Button variant="secondary" className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 font-semibold text-foreground hover:bg-white/10">
                      Review briefs
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:ml-auto">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center backdrop-blur">
                    <p className="text-3xl font-extrabold" style={{ color: "var(--wm-lime)" }}>72h</p>
                    <p className="text-xs text-muted-foreground">uptime</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur">
                    <span className="text-sm text-muted-foreground">Autopilot</span>
                    <Switch checked={auto} onCheckedChange={setAuto} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} initial="hidden" animate="show" custom={i + 1} variants={fade} whileHover={{ y: -4 }}>
                <Card className="group relative overflow-hidden rounded-2xl border-white/10 bg-card/60 p-0">
                  <div className="absolute -top-10 -right-8 size-28 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70" style={{ background: s.tint }} />
                  <CardContent className="relative z-10 flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="grid size-9 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${s.tint} 22%, transparent)`, color: s.tint }}>
                        <s.icon className="size-4" />
                      </span>
                      <Badge className="border-0 bg-white/10 text-foreground"><ArrowUpRight className="size-3" /> {s.delta}</Badge>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Crew + Activity */}
          <div className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            {/* Crew */}
            <motion.div initial="hidden" animate="show" custom={2} variants={fade}>
              <Card className="rounded-2xl border-white/10 bg-card/60">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Your crew</h3>
                    <Button variant="secondary" size="sm" className="rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground">Manage</Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CREW.map((c) => (
                      <motion.div key={c.id} whileHover={{ y: -3 }} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-colors hover:border-white/10">
                        <Avatar size="lg" className="rounded-xl">
                          <AvatarFallback className="rounded-xl font-bold" style={{ background: `color-mix(in srgb, ${c.color} 20%, transparent)`, color: c.color }}>
                            <c.icon className="size-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">{c.name}</p>
                            <span className="size-1.5 rounded-full" style={{ background: c.color }} />
                            <span className="text-xs text-muted-foreground">{c.status}</span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{c.role}</p>
                          <Progress value={c.load} className="mt-2 h-1.5 bg-white/5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Activity */}
            <motion.div initial="hidden" animate="show" custom={3} variants={fade}>
              <Card className="rounded-2xl border-white/10 bg-card/60">
                <CardContent className="p-5">
                  <Tabs defaultValue="activity">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold">Live</h3>
                      <TabsList className="bg-white/5">
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                        <TabsTrigger value="builds">Builds</TabsTrigger>
                        <TabsTrigger value="alerts">Alerts</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="activity" className="space-y-1">
                      {FEED.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]">
                          <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: f.color, boxShadow: `0 0 10px ${f.color}` }} />
                          <p className="text-sm leading-snug">
                            <span className="font-semibold" style={{ color: f.color }}>{f.who}</span>{" "}
                            <span className="text-muted-foreground">{f.what}</span>
                          </p>
                          <span className="ml-auto shrink-0 text-xs text-muted-foreground">{f.when}</span>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="builds" className="py-8 text-center text-sm text-muted-foreground">2 builds in flight · 1 queued</TabsContent>
                    <TabsContent value="alerts" className="py-8 text-center text-sm text-muted-foreground">No open alerts. Watchdog is green.</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Praxis rebrand preview · Watermelon UI · bold &amp; playful · mock data
          </p>
        </main>
      </div>
    </div>
  );
}
