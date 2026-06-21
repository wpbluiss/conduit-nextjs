"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Praxis UI rebrand — PROOF surface (standalone, no auth, mock data).
 * Disciplined single-accent identity (ember on warm black), centered
 * composition, mono "spec-sheet" labels. Built on real Watermelon UI
 * components.  →  /rebrand-preview
 */

import * as React from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid, MessageSquare, Hammer, Sparkles, Mic, Activity, Settings,
  Search, Bell, Plus, Rocket, Zap, TrendingUp, DollarSign, Megaphone,
  Code2, Wrench, ShieldCheck, Users, Scale,
} from "lucide-react";

import { ShadcnButton as Button } from "@/components/ui/button";
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

const CREW: { id: string; name: string; role: string; icon: Icon; load: number; status: string; active: boolean }[] = [
  { id: "atlas", name: "Atlas", role: "Chief of Staff", icon: Sparkles, load: 72, status: "planning", active: true },
  { id: "eng", name: "Engineering", role: "Build & Ship", icon: Code2, load: 91, status: "shipping", active: true },
  { id: "sales", name: "Sales", role: "Pipeline & Close", icon: TrendingUp, load: 48, status: "live", active: true },
  { id: "mkt", name: "Marketing", role: "Brand & Demand", icon: Megaphone, load: 63, status: "drafting", active: true },
  { id: "fin", name: "Finance", role: "Books & Forecast", icon: DollarSign, load: 30, status: "idle", active: false },
  { id: "ops", name: "Operations", role: "Systems & Process", icon: Wrench, load: 55, status: "running", active: true },
  { id: "comp", name: "Compliance", role: "Risk & Controls", icon: ShieldCheck, load: 22, status: "idle", active: false },
  { id: "hr", name: "HR", role: "People & Culture", icon: Users, load: 18, status: "idle", active: false },
  { id: "legal", name: "Legal", role: "Counsel & Contracts", icon: Scale, load: 40, status: "review", active: true },
];

const STATS: { label: string; value: string; delta: string; icon: Icon }[] = [
  { label: "Tasks shipped today", value: "47", delta: "+12 vs yest", icon: Rocket },
  { label: "Active employees", value: "9", delta: "all live", icon: Zap },
  { label: "Pipeline value", value: "$128k", delta: "+8.4%", icon: TrendingUp },
  { label: "Spend today", value: "$3.91", delta: "of $5 cap", icon: DollarSign },
];

const FEED: { who: string; what: string; when: string }[] = [
  { who: "Engineering", what: "shipped RLS policies on 6 tables", when: "2m" },
  { who: "Marketing", what: "drafted 3 launch posts + a hero", when: "11m" },
  { who: "Atlas", what: "queued tomorrow's plan across 6 fields", when: "26m" },
  { who: "Sales", what: "moved 2 deals to negotiation", when: "44m" },
  { who: "Operations", what: "locked 2 public storage buckets", when: "1h" },
];

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: "spring" as const, stiffness: 210, damping: 26 } }),
};

export default function RebrandPreview() {
  const [auto, setAuto] = React.useState<boolean>(true);

  return (
    <div className="wm-rebrand wm-grid min-h-screen w-full text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-8 text-center sm:py-10">

        {/* ── Brand + centered nav ─────────────────────────────── */}
        <header className="flex w-full flex-col items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-primary">
              <span className="font-mono text-base font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Praxis</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-1.5">
            {NAV.map((n) => (
              <button
                key={n.label}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  n.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <n.icon className="size-4" />
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Ask anything…" className="h-10 w-64 rounded-full border-input bg-secondary/60 pl-9 text-center text-foreground placeholder:text-muted-foreground" />
            </div>
            <Button size="icon" variant="secondary" className="size-10 rounded-full bg-secondary hover:bg-input"><Bell className="size-4" /></Button>
            <Button className="h-10 gap-1.5 rounded-full px-5 font-semibold wm-glow"><Plus className="size-4" /> New task</Button>
          </div>
        </header>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <motion.div initial="hidden" animate="show" custom={0} variants={fade} className="mt-10 w-full">
          <Card className="wm-aurora relative overflow-hidden rounded-2xl border-white/8 bg-card/70">
            <CardContent className="relative z-10 flex flex-col items-center gap-5 px-6 py-12">
              <Badge variant="outline" className="gap-1.5 border-white/10 bg-secondary/60 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" /> Autonomous fleet · live
              </Badge>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
                Good evening, Luis.<br />Your <span className="wm-ink">workforce</span> shipped 47 things today.
              </h1>
              <p className="max-w-md text-muted-foreground">
                Nine employees, one command center. Heavy lifts get teed up for you — everything else just gets done.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <Button className="h-11 gap-1.5 rounded-full px-6 font-semibold wm-glow"><Rocket className="size-4" /> Open workspace</Button>
                <Button variant="secondary" className="h-11 rounded-full bg-secondary px-6 font-semibold hover:bg-input">Review briefs</Button>
              </div>
              <div className="mt-2 flex items-center justify-center gap-3">
                <div className="rounded-xl border border-white/8 bg-background/50 px-5 py-2.5">
                  <p className="font-mono text-2xl font-semibold text-primary">72h</p>
                  <p className="wm-label mt-0.5">uptime</p>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-background/50 px-5 py-3">
                  <span className="wm-label">Autopilot</span>
                  <Switch checked={auto} onCheckedChange={setAuto} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="mt-5 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial="hidden" animate="show" custom={i + 1} variants={fade} whileHover={{ y: -3 }}>
              <Card className="h-full rounded-2xl border-white/8 bg-card/70">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary"><s.icon className="size-5" /></span>
                  <p className="font-mono text-3xl font-semibold tracking-tight">{s.value}</p>
                  <p className="wm-label">{s.label}</p>
                  <span className="wm-label text-primary">{s.delta}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── Crew ─────────────────────────────────────────────── */}
        <motion.section initial="hidden" animate="show" custom={2} variants={fade} className="mt-12 w-full">
          <p className="wm-label">Your crew</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Nine employees, all reporting in</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CREW.map((c) => (
              <motion.div key={c.id} whileHover={{ y: -3 }}>
                <Card className="h-full rounded-2xl border-white/8 bg-card/70">
                  <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                    <Avatar size="lg" className="rounded-xl">
                      <AvatarFallback className={`rounded-xl bg-secondary text-foreground ${c.active ? "ring-1 ring-primary/40" : ""}`}>
                        <c.icon className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="wm-label mt-0.5">{c.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full" style={{ background: c.active ? "var(--wm-ember)" : "var(--wm-idle)" }} />
                      <span className="wm-label">{c.status}</span>
                    </div>
                    <Progress value={c.load} className="h-1.5 w-full max-w-[180px] bg-secondary" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Activity ─────────────────────────────────────────── */}
        <motion.section initial="hidden" animate="show" custom={3} variants={fade} className="mt-12 w-full max-w-2xl">
          <p className="wm-label">Live</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">What just happened</h2>
          <Card className="mt-6 rounded-2xl border-white/8 bg-card/70">
            <CardContent className="p-6">
              <Tabs defaultValue="activity">
                <TabsList className="mx-auto bg-secondary">
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="builds">Builds</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                </TabsList>
                <TabsContent value="activity" className="mt-5">
                  <ul className="flex flex-col">
                    {FEED.map((f, i) => (
                      <li key={i} className={`flex flex-col items-center gap-0.5 py-3 ${i > 0 ? "border-t wm-hair" : ""}`}>
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{f.who}</span>{" "}
                          <span className="text-muted-foreground">{f.what}</span>
                        </p>
                        <span className="wm-label">{f.when} ago</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="builds" className="mt-5 py-8 text-sm text-muted-foreground">2 builds in flight · 1 queued</TabsContent>
                <TabsContent value="alerts" className="mt-5 py-8 text-sm text-muted-foreground">No open alerts. Watchdog is green.</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.section>

        <p className="wm-label mt-12">Praxis rebrand preview · ember identity · centered · mock data</p>
      </div>
    </div>
  );
}
