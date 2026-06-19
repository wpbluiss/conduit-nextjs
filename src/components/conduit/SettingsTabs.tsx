"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  Check,
  Database,
  ExternalLink,
  Info,
  Link,
  Link2Off,
  Lock,
  Pencil,
  Play,
  Plus,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Button as PraxisButton, SpinnerIcon } from "@/components/conduit/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEES, EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { DEPT_COLOR, EMPLOYEE_ICON, employeeLabel } from "./EmployeeBadge";
import { useNicknames } from "@/context/NicknameContext";
import { useToast } from "@/context/ToastContext";
import { ORDERED_TIERS, TOPUPS, tierById, type TierId } from "@/lib/billing/tiers";
import { DEFAULT_EMPLOYEE_VOICES, VOICE_NAMES } from "@/lib/voice/defaults";
import { ThemeToggle } from "./ThemeToggle";
import { ACCENT_PRESETS, ACCENT_STORAGE_KEY } from "@/lib/conduit/accent-presets";
import { track } from "@/lib/analytics/track";
import { MFASecurity } from "./MFASecurity";
import { BrandMarkGithub } from "./brand-marks/BrandMarkGithub";
import { BrandMarkSlack } from "./brand-marks/BrandMarkSlack";
import { BrandMarkNotion } from "./brand-marks/BrandMarkNotion";
import { BrandMarkDrive } from "./brand-marks/BrandMarkDrive";
import { AnimatedStat } from "@/components/conduit/ui/AnimatedStat";

interface UsageData {
  totals: { input: number; output: number; cost: number };
  byEmployee: Record<string, { input: number; output: number; cost: number }>;
  byDay: Record<string, number>;
  today: { input: number; output: number; cost: number };
  thisWeek: { input: number; output: number; cost: number };
  cap: { used: number; limit: number };
  buildsThisCycle?: number;
  cycleResetDate?: string | null;
}

interface AccountData {
  id: string;
  name: string;
  business_type: string;
  business_description: string;
  creator_mode?: boolean;
  creator_mode_version?: number;
  tier_id?: string;
  subscription_status?: string;
  bonus_tokens?: number;
  internal_account?: boolean;
  has_stripe_customer?: boolean;
  billing_cycle_start?: string;
  account_created_at?: string;
  timezone?: string;
  theme_preference?: "system" | "light" | "dark" | null;
  display_name?: string | null;
  avatar_url?: string | null;
  accent_preference?: string | null;
  company_brief?: string | null;
  workspace_name?: string | null;
  specialist_nicknames?: Record<string, string> | null;
  specialist_prefs?: Record<string, { response_length?: "short" | "balanced" | "detailed" }> | null;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Mexico_City",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
];

export type SettingsTabKey =
  | "profile"
  | "workspace"
  | "business"
  | "specialists"
  | "voice"
  | "team"
  | "usage"
  | "billing"
  | "security"
  | "notifications"
  | "integrations"
  | "appearance"
  | "api"
  | "referrals"
  | "labels";

const SETTINGS_NAV: { title: string | null; items: [SettingsTabKey, string][] }[] = [
  {
    title: null,
    items: [
      ["profile", "Profile"],
      ["appearance", "Appearance"],
      ["security", "Security"],
    ],
  },
  {
    title: "Workspace",
    items: [
      ["workspace", "Workspace"],
      ["business", "Business"],
      ["team", "Team"],
      ["specialists", "Specialists"],
      ["voice", "Voice"],
    ],
  },
  {
    title: "Platform",
    items: [
      ["integrations", "Integrations"],
      ["notifications", "Notifications"],
      ["api", "API Keys"],
      ["labels", "Labels"],
      ["referrals", "Referrals"],
    ],
  },
  {
    title: "Billing",
    items: [
      ["usage", "Usage"],
      ["billing", "Billing"],
    ],
  },
];

const ALL_NAV_ITEMS = SETTINGS_NAV.flatMap((s) => s.items);

export function SettingsTabs({
  email,
  fullName,
  account,
  usage,
  defaultTab = "profile",
}: {
  email: string;
  fullName: string;
  account: AccountData;
  usage: UsageData;
  defaultTab?: SettingsTabKey;
}) {
  const [tab, setTab] = useState<SettingsTabKey>(defaultTab);

  return (
    <div className="flex flex-col md:flex-row gap-8">

      {/* ── Mobile: horizontal pill strip ──────────────────────────── */}
      <div className="md:hidden -mx-1 px-1 pb-2 overflow-x-auto">
        <div className="flex gap-1">
          {ALL_NAV_ITEMS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-full cx-type-xs whitespace-nowrap shrink-0 transition-all duration-150 ${
                tab === key
                  ? "bg-[var(--cx-accent-tint)] text-[var(--cx-accent-bright)] font-medium"
                  : "text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] hover:bg-[var(--cx-surface-raised)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop: vertical sidebar nav ──────────────────────────── */}
      <nav
        className="hidden md:flex flex-col w-48 shrink-0 sticky top-8 self-start cx-glass cx-glass-border rounded-xl p-3"
        aria-label="Settings navigation"
      >
        {SETTINGS_NAV.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-5" : ""}>
            {section.title && (
              <div className="cx-label text-[var(--cx-text-faint)] px-2 mb-1.5">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg cx-type-sm transition-all duration-[var(--cx-dur-fast)] ease-[var(--cx-ease)] focus-visible:outline-none ${
                    tab === key
                      ? "text-[var(--cx-accent-bright)] font-medium"
                      : "text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] hover:bg-[var(--cx-surface-raised)]"
                  }`}
                  style={
                    tab === key
                      ? {
                          background: "var(--cx-accent-tint)",
                          boxShadow: "inset 3px 0 0 var(--cx-accent)",
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Content ────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {tab === "profile" && (
          <ProfileTab
            email={email}
            fullName={fullName}
            creatorMode={Boolean(account.creator_mode)}
            creatorModeVersion={account.creator_mode_version ?? 1}
            timezone={account.timezone ?? "America/New_York"}
            themePref={account.theme_preference ?? "system"}
            displayName={account.display_name ?? null}
            avatarUrl={account.avatar_url ?? null}
            workspaceName={account.workspace_name ?? null}
          />
        )}
        {tab === "workspace" && (
          <WorkspaceTab
            workspaceName={account.workspace_name ?? null}
            avatarUrl={account.avatar_url ?? null}
          />
        )}
        {tab === "business" && <BusinessTab account={account} />}
        {tab === "specialists" && (
          <SpecialistsTab
            initialNicknames={account.specialist_nicknames ?? {}}
            initialPrefs={account.specialist_prefs ?? {}}
          />
        )}
        {tab === "voice" && (
          <VoiceTab
            ttsAllowed={Boolean(
              account.internal_account || (account.tier_id ?? "free") !== "free",
            )}
          />
        )}
        {tab === "team" && <TeamTab />}
        {tab === "usage" && <UsageTab usage={usage} />}
        {tab === "billing" && <BillingTab account={account} usage={usage} />}
        {tab === "security" && <MFASecurity />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "integrations" && (
          <IntegrationsTab
            isFreeUser={
              !account.internal_account && (account.tier_id ?? "free") === "free"
            }
          />
        )}
        {tab === "appearance" && (
          <AppearanceTab
            themePref={account.theme_preference ?? "system"}
            accentPref={account.accent_preference ?? "violet"}
          />
        )}
        {tab === "api" && (
          <ApiKeysTab
            isPro={Boolean(
              account.internal_account || (account.tier_id ?? "free") !== "free",
            )}
          />
        )}
        {tab === "referrals" && <ReferralsTab />}
        {tab === "labels" && <LabelsTab />}
      </div>
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6">
      <div>
        <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl">
          Per-employee voice picks live in the <strong>Voice</strong> tab. This
          tab will also gain personality tuning (tone sliders, custom system
          prompt overrides) in a future update.
        </p>
      </div>
      <div
        className="conduit-card p-5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--cx-accent) 6%, var(--cx-surface)), var(--cx-surface))",
        }}
      >
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-accent-bright)] mb-2">
          Coming soon
        </div>
        <p className="cx-heading-xl">Personality tuning</p>
        <p className="mt-2 cx-type-sm text-[var(--cx-text-muted)]">
          Dial each employee&apos;s tone, verbosity, and risk appetite. Pin
          custom system prompt addenda that ride along with every turn.
        </p>
      </div>
    </div>
  );
}

type ResponseLength = "short" | "balanced" | "detailed";

const RESPONSE_LENGTH_OPTIONS: { value: ResponseLength; label: string; hint: string }[] = [
  { value: "short", label: "Short", hint: "1–3 sentences" },
  { value: "balanced", label: "Balanced", hint: "Default" },
  { value: "detailed", label: "Detailed", hint: "Full explanations" },
];

function SpecialistsTab({
  initialNicknames,
  initialPrefs,
}: {
  initialNicknames: Record<string, string>;
  initialPrefs: Record<string, { response_length?: ResponseLength }>;
}) {
  const toast = useToast();
  const { setNicknames: setCtxNicknames } = useNicknames();
  const [view, setView] = useState<"settings" | "usage">("settings");
  const [nicknames, setNicknames] = useState<Record<string, string>>(
    () => Object.fromEntries(
      (EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => [emp, initialNicknames[emp] ?? ""])
    )
  );
  const [prefs, setPrefs] = useState<Record<string, ResponseLength>>(
    () => Object.fromEntries(
      (EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => [
        emp,
        initialPrefs[emp]?.response_length ?? "balanced",
      ])
    )
  );
  const [busy, setBusy] = useState(false);

  const handleNicknameChange = (emp: EmployeeKey, val: string) => {
    setNicknames((prev) => ({ ...prev, [emp]: val.slice(0, 32) }));
  };

  const handleNicknameReset = (emp: EmployeeKey) => {
    setNicknames((prev) => ({ ...prev, [emp]: "" }));
  };

  const handleLengthChange = (emp: EmployeeKey, val: ResponseLength) => {
    setPrefs((prev) => ({ ...prev, [emp]: val }));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const nicknamePayload = Object.fromEntries(
        Object.entries(nicknames).filter(([, v]) => v.trim())
      );
      const prefPayload = Object.fromEntries(
        Object.entries(prefs)
          .filter(([, v]) => v !== "balanced")
          .map(([k, v]) => [k, { response_length: v }])
      );
      const [nickRes, prefRes] = await Promise.all([
        fetch("/api/conduit/settings/specialist-nicknames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nicknames: nicknamePayload }),
        }),
        fetch("/api/conduit/settings/specialist-prefs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefs: prefPayload }),
        }),
      ]);
      if (!nickRes.ok || !prefRes.ok) throw new Error("save_failed");
      const nickData = (await nickRes.json()) as { nicknames: Record<string, string> };
      setCtxNicknames(nickData.nicknames as Partial<Record<EmployeeKey, string>>);
      toast.success("Specialist settings saved");
    } catch {
      toast.error("Failed to save — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-view toggle */}
      <div className="flex gap-1 border-b border-[var(--cx-border)] -mb-2">
        {(["settings", "usage"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-4 py-3 cx-type-sm transition-colors border-b-2 -mb-px capitalize ${
              view === v
                ? "border-[var(--cx-accent)] text-[var(--cx-text)]"
                : "border-transparent text-[var(--cx-text-muted)] hover:text-[var(--cx-text)]"
            }`}
          >
            {v === "usage" ? "Usage metrics" : "Settings"}
          </button>
        ))}
      </div>

      {view === "usage" ? (
        <SpecialistMetrics />
      ) : (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Nicknames */}
      <div>
        <h3 className="cx-type-md font-semibold mb-2">
          Custom nicknames
        </h3>
        <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl mb-4">
          Give each specialist a custom nickname. Leave blank to use the default name.
          Nicknames appear in the sidebar, chat, and specialist picker.
        </p>
        <div className="space-y-3">
          {(EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => {
            const Icon = EMPLOYEE_ICON[emp];
            const color = DEPT_COLOR[emp];
            const canonical = employeeLabel(emp);
            return (
              <div key={emp} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, var(--cx-surface))`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 32%, transparent)`,
                  }}
                >
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`nick-${emp}`}
                    className="block cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-text-muted)] mb-1"
                  >
                    {canonical}
                    <span className="ml-1 text-[var(--cx-text-muted)] normal-case tracking-normal">
                      · {EMPLOYEES[emp].role}
                    </span>
                  </label>
                  <input
                    id={`nick-${emp}`}
                    type="text"
                    value={nicknames[emp]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleNicknameChange(emp, e.target.value)}
                    placeholder={canonical}
                    maxLength={32}
                    className="w-full cx-input-sm"
                  />
                </div>
                {nicknames[emp] && (
                  <PraxisButton
                    type="button"
                    onClick={() => handleNicknameReset(emp)}
                    title="Reset to default"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                  >
                    <X size={13} />
                  </PraxisButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response length */}
      <div>
        <h3 className="cx-type-md font-semibold mb-2">
          Response length
        </h3>
        <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl mb-4">
          Control how verbose each specialist is. Short is best for quick answers; Detailed for research and complex tasks.
        </p>
        <div className="space-y-3">
          {(EMPLOYEE_ORDER as EmployeeKey[]).map((emp) => {
            const Icon = EMPLOYEE_ICON[emp];
            const color = DEPT_COLOR[emp];
            const canonical = employeeLabel(emp);
            const current = prefs[emp] ?? "balanced";
            return (
              <div key={emp} className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                  style={{
                    background: `color-mix(in srgb, ${color} 18%, var(--cx-surface))`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 32%, transparent)`,
                  }}
                >
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block cx-type-xs cx-mono uppercase tracking-[0.12em] text-[var(--cx-text-muted)] mb-2">
                    {canonical}
                  </span>
                  <div className="flex gap-1" role="group" aria-label={`${canonical} response length`}>
                    {RESPONSE_LENGTH_OPTIONS.map(({ value, label, hint }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleLengthChange(emp, value)}
                        title={hint}
                        className={`px-3 py-2 rounded-md cx-type-xs font-medium transition-all ${
                          current === value
                            ? "bg-[var(--cx-accent)] text-white"
                            : "border border-[var(--cx-border)] text-[var(--cx-text-muted)] hover:text-[var(--cx-text)] hover:border-[var(--cx-text-muted)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[var(--cx-border)]">
        <PraxisButton type="submit" disabled={busy}>
          {busy ? <SpinnerIcon /> : <Check size={14} />}
          Save settings
        </PraxisButton>
      </div>
    </form>
      )}
    </div>
  );
}

type MetricsRange = "7" | "30" | "90" | "all";

interface SpecialistMetric {
  employee: string;
  totalMessages: number;
  thisMonth: number;
  avgWordCount: number;
}

const RANGE_OPTIONS: { value: MetricsRange; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "all", label: "All time" },
];

function SpecialistMetrics() {
  const [range, setRange] = useState<MetricsRange>("30");
  const [metrics, setMetrics] = useState<SpecialistMetric[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/conduit/specialists/metrics?range=${range}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: { metrics: SpecialistMetric[] }) => {
        setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [range]);

  const maxMessages = Math.max(1, ...(metrics ?? []).map((m) => m.totalMessages));
  const totalMessages = (metrics ?? []).reduce((s, m) => s + m.totalMessages, 0);

  return (
    <div className="space-y-5">
      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="cx-label">Period</span>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className="px-3 py-1 rounded-full cx-type-xs font-medium transition-colors"
              style={{
                background: range === value ? "var(--cx-accent)" : "var(--cx-surface-raised)",
                color: range === value ? "var(--cx-text)" : "var(--cx-text-muted)",
                border: `1px solid ${range === value ? "var(--cx-accent)" : "var(--cx-border)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {loading && (
          <div className="cx-skeleton" style={{ height: 10, width: 64, borderRadius: 9999, opacity: 0.45 }} />
        )}
      </div>

      {error && (
        <p className="text-[var(--cx-text-muted)] cx-type-sm">
          Failed to load metrics. Please try again.
        </p>
      )}

      {!loading && !error && metrics !== null && metrics.length === 0 && (
        <div className="conduit-card p-8 text-center">
          <p className="cx-type-sm text-[var(--cx-text-muted)]">No specialist activity in this period.</p>
          <p className="cx-type-xs text-[var(--cx-text-muted)] mt-1">
            Start a conversation with any specialist to see usage here.
          </p>
        </div>
      )}

      {!error && metrics !== null && metrics.length > 0 && (
        <>
          {/* Summary stat */}
          <div className="flex items-baseline gap-2">
            <AnimatedStat value={totalMessages} />
            <span className="text-[var(--cx-text-muted)]">
              specialist {totalMessages === 1 ? "response" : "responses"} in this period
            </span>
          </div>

          {/* Ranked list */}
          <div className="space-y-3">
            {metrics.map((m) => {
              const Icon = EMPLOYEE_ICON[m.employee as EmployeeKey];
              const color = DEPT_COLOR[m.employee as EmployeeKey];
              const label = employeeLabel(m.employee as EmployeeKey);
              const barPct = Math.round((m.totalMessages / maxMessages) * 100);
              const sharePct = Math.round((m.totalMessages / totalMessages) * 100);

              return (
                <div key={m.employee} className="conduit-card px-4 py-4">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${color} 18%, var(--cx-surface))`,
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 32%, transparent)`,
                      }}
                    >
                      <Icon size={13} style={{ color }} strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="font-medium text-[var(--cx-text)]">{label}</span>
                        <div className="flex items-center gap-3 cx-mono cx-type-xs text-[var(--cx-text-muted)] shrink-0">
                          <span title="Responses in period">
                            <span className="font-semibold text-[var(--cx-text)]">{m.totalMessages.toLocaleString()}</span>
                            {" "}responses
                          </span>
                          <span title="Responses this calendar month">
                            <span className="font-semibold text-[var(--cx-text)]">{m.thisMonth.toLocaleString()}</span>
                            {" "}this month
                          </span>
                          <span title="Average words per response">
                            ~<span className="font-semibold text-[var(--cx-text)]">{m.avgWordCount}</span>
                            {" "}words/reply
                          </span>
                          <span
                            className="cx-type-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              background: `color-mix(in srgb, ${color} 14%, var(--cx-surface))`,
                              color,
                            }}
                          >
                            {sharePct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Usage bar */}
                  <div className="h-2 rounded-full bg-[var(--cx-border)] overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${barPct}%`,
                        background: color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface VoicePrefsResp {
  voice_enabled: boolean;
  voice_auto_play: boolean;
  voice_speed: number;
  streaming_tts_enabled: boolean;
  employee_voices: Record<string, string>;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

// R2 parity: the full Praxis roster gets a voice selector + preview button,
// matching Mobile R19. Order mirrors `EMPLOYEE_ORDER` in
// `src/lib/conduit/employees.ts`.
const VOICE_EMPLOYEES: EmployeeKey[] = [
  "jarvis",
  "marketing",
  "sales",
  "engineering",
  "finance",
  "compliance",
  "hr",
  "ops",
  "legal",
];

function VoiceTab({ ttsAllowed }: { ttsAllowed: boolean }) {
  const [prefs, setPrefs] = useState<VoicePrefsResp | null>(null);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [voiceConfigured, setVoiceConfigured] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    (async () => {
      const [pRes, vRes] = await Promise.all([
        fetch("/api/conduit/voice/prefs"),
        fetch("/api/conduit/voice/voices"),
      ]);
      if (pRes.ok) setPrefs(await pRes.json());
      if (vRes.ok) {
        const j = await vRes.json();
        setVoices(j.voices ?? []);
        setVoiceConfigured(Boolean(j.configured));
      }
    })();
  }, []);

  if (!ttsAllowed) {
    return (
      <div className="space-y-4">
        <div className="conduit-card p-6 text-center relative">
          <div className="flex items-center justify-center gap-2 cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-accent-bright)] mb-2">
            <Lock size={12} /> Pro feature
          </div>
          <p className="cx-heading-xl">Voice mode is a Pro perk</p>
          <p className="mt-2 cx-type-sm text-[var(--cx-text-muted)]">
            Free accounts can still use voice <em>input</em> in chat. Upgrade
            to hear your team talk back.
          </p>
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="space-y-6" aria-busy aria-label="Loading voice settings">
        <div className="conduit-card p-5 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="h-3 w-28 rounded-full animate-pulse bg-[var(--cx-border)]" />
                <div className="h-2 w-44 rounded-full animate-pulse bg-[var(--cx-border)] opacity-60" />
              </div>
              <div className="h-6 w-11 rounded-full shrink-0 animate-pulse bg-[var(--cx-border)]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="conduit-card p-4 h-20 animate-pulse bg-[var(--cx-surface-raised)]" />
          ))}
        </div>
      </div>
    );
  }

  const setPref = (patch: Partial<VoicePrefsResp>) =>
    setPrefs({ ...prefs, ...patch });

  const save = async (patch: Partial<VoicePrefsResp>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    setSaving(true);
    setError(null);
    const r = await fetch("/api/conduit/voice/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!r.ok) setError("Couldn't save preferences.");
  };

  const setEmployeeVoice = async (employee: EmployeeKey, voiceId: string) => {
    setPref({
      employee_voices: { ...prefs.employee_voices, [employee]: voiceId },
    });
    await save({ employee_voices: { [employee]: voiceId } });
  };

  const preview = async (employee: EmployeeKey, voiceId: string) => {
    if (!voiceConfigured) return;
    setPreviewing(`${employee}:${voiceId}`);
    setError(null);
    try {
      const r = await fetch("/api/conduit/voice/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ voice_id: voiceId, employee }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(
          j.message ||
            "Preview unavailable. Voice will still work in chat.",
        );
        setPreviewing(null);
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      a.src = url;
      a.onended = () => {
        setPreviewing(null);
        URL.revokeObjectURL(url);
      };
      await a.play();
    } catch {
      setError("Preview unavailable. Voice will still work in chat.");
      setPreviewing(null);
    }
  };

  return (
    <div className="space-y-6">
      {!voiceConfigured && (
        <div className="conduit-card p-4 cx-type-xs text-[var(--cx-warn)] border-[var(--cx-warn)]/40">
          Voice provider not connected yet. Settings save, previews are
          disabled until upstream keys land.
        </div>
      )}

      <div className="conduit-card p-5 space-y-4">
        <ToggleRow
          label="Enable voice mode"
          desc="Show the mic button and play audio replies."
          value={prefs.voice_enabled}
          onChange={(v) => save({ voice_enabled: v })}
        />
        <ToggleRow
          label="Auto-play AI responses"
          desc="Speak each reply as soon as it finishes."
          value={prefs.voice_auto_play}
          onChange={(v) => save({ voice_auto_play: v })}
        />
        <ToggleRow
          label="Streaming audio"
          desc="Audio plays sentence-by-sentence instead of waiting for the full response. Lower latency, slightly higher cost."
          value={prefs.streaming_tts_enabled}
          onChange={(v) => save({ streaming_tts_enabled: v })}
        />
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span>Playback speed</span>
            <span className="cx-type-xs text-[var(--cx-text-muted)]">
              {prefs.voice_speed.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={prefs.voice_speed}
            onChange={(e) =>
              setPref({ voice_speed: parseFloat(e.target.value) })
            }
            onPointerUp={() => save({ voice_speed: prefs.voice_speed })}
            className="w-full accent-[var(--cx-accent)]"
          />
        </div>
      </div>

      <div>
        <div className="cx-type-md font-semibold mb-3">
          Voices
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VOICE_EMPLOYEES.map((emp) => {
            const current =
              prefs.employee_voices[emp] ?? DEFAULT_EMPLOYEE_VOICES[emp];
            const isPreviewing = previewing === `${emp}:${current}`;
            return (
              <div
                key={emp}
                className="conduit-card border-l-[3px] p-4 space-y-2"
                style={{
                  borderLeftColor: DEPT_COLOR[emp],
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="cx-type-xs font-medium"
                    style={{ color: DEPT_COLOR[emp] }}
                  >
                    {employeeLabel(emp)}
                  </span>
                  <PraxisButton
                    type="button"
                    onClick={() => preview(emp, current)}
                    isDisabled={!voiceConfigured || isPreviewing}
                    variant="ghost"
                    size="sm"
                    className="cx-type-xs uppercase tracking-[0.18em]"
                  >
                    {isPreviewing ? (
                      "Playing…"
                    ) : (
                      <>
                        <Play size={10} /> Preview
                      </>
                    )}
                  </PraxisButton>
                </div>
                <select
                  value={current}
                  onChange={(e) => setEmployeeVoice(emp, e.target.value)}
                  className="w-full cx-select-sm"
                >
                  {/* Always offer the default first */}
                  <option value={DEFAULT_EMPLOYEE_VOICES[emp]}>
                    {VOICE_NAMES[DEFAULT_EMPLOYEE_VOICES[emp]] ??
                      DEFAULT_EMPLOYEE_VOICES[emp]}{" "}
                    (default)
                  </option>
                  {voices
                    .filter(
                      (v) => v.voice_id !== DEFAULT_EMPLOYEE_VOICES[emp],
                    )
                    .map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </option>
                    ))}
                </select>
                {current !== DEFAULT_EMPLOYEE_VOICES[emp] && (
                  <PraxisButton
                    type="button"
                    onClick={() =>
                      setEmployeeVoice(emp, DEFAULT_EMPLOYEE_VOICES[emp])
                    }
                    variant="ghost"
                    size="sm"
                    className="cx-type-xs"
                  >
                    Reset to default
                  </PraxisButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {saving && (
        <p className="cx-type-xs text-[var(--cx-text-muted)]">Saving…</p>
      )}
      {error && <p className="cx-type-sm text-[var(--cx-danger)]">{error}</p>}
    </div>
  );
}


function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div>{label}</div>
        {desc && (
          <div className="cx-type-xs text-[var(--cx-text-muted)] mt-0.5">
            {desc}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none ${
          value
            ? "bg-[var(--cx-accent)]"
            : "bg-[var(--cx-border-strong)]"
        }`}
        style={undefined}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform motion-safe:duration-150 motion-safe:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
          style={{ background: value ? "var(--cx-toggle-thumb, rgba(255,255,255,0.95))" : "var(--cx-text-muted)" }}
        />
      </button>
    </div>
  );
}

/* ─── Password strength helper ───────────────────────────────────────────── */

interface PwStrength { score: number; missing: string[] }

function checkPasswordStrength(pw: string): PwStrength {
  const checks = [
    { test: pw.length >= 8, label: "8+ characters" },
    { test: /[a-z]/.test(pw), label: "lowercase letter" },
    { test: /[A-Z]/.test(pw), label: "uppercase letter" },
    { test: /[0-9]/.test(pw), label: "number" },
  ];
  const missing = checks.filter((c) => !c.test).map((c) => c.label);
  return { score: 4 - missing.length, missing };
}

const STRENGTH_COLORS = [
  "",
  "var(--cx-danger)",
  "var(--cx-warn)",
  "var(--cx-reward)",
  "var(--cx-reward)",
] as const;

function PwMeter({ pw }: { pw: string }) {
  if (!pw) return null;
  const { score } = checkPasswordStrength(pw);
  return (
    <div className="flex gap-1 mt-2" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{
            background: score >= n ? STRENGTH_COLORS[score] : "var(--cx-border)",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Workspace tab ───────────────────────────────────────────────────────── */

const WS_NAME_MAX = 64;

function WorkspaceTab({
  workspaceName,
  avatarUrl,
}: {
  workspaceName: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const toast = useToast();

  const [wsName, setWsName] = useState(workspaceName ?? "");
  const [wsNameSaving, setWsNameSaving] = useState(false);
  const [wsNameSaved, setWsNameSaved] = useState(false);
  const [wsNameError, setWsNameError] = useState("");

  const [logoPreview, setLogoPreview] = useState<string | null>(avatarUrl);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const saveWsName = async (e: FormEvent) => {
    e.preventDefault();
    setWsNameSaving(true);
    setWsNameError("");
    setWsNameSaved(false);
    const trimmed = wsName.trim().slice(0, WS_NAME_MAX);
    const r = await fetch("/api/conduit/workspace", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspace_name: trimmed || null }),
    });
    setWsNameSaving(false);
    if (r.ok) {
      setWsNameSaved(true);
      toast.success("Workspace name updated.");
      router.refresh();
    } else {
      setWsNameError("Couldn't save workspace name. Try again.");
    }
  };

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (file.size > 2 * 1024 * 1024) {
      setLogoError("Logo must be under 2 MB.");
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setLogoError("Only JPEG or PNG logos are allowed.");
      if (logoInputRef.current) logoInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/conduit/workspace/logo", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({})) as { avatar_url?: string; error?: string };
      if (!r.ok) {
        const msg =
          j.error === "file_too_large"
            ? "Logo must be under 2 MB."
            : j.error === "invalid_file_type"
              ? "Only JPEG or PNG logos are allowed."
              : "Upload failed. Try again.";
        setLogoError(msg);
        setLogoPreview(avatarUrl);
        URL.revokeObjectURL(objectUrl);
      } else if (j.avatar_url) {
        setLogoPreview(j.avatar_url);
        URL.revokeObjectURL(objectUrl);
        toast.success("Workspace logo updated.");
        router.refresh();
      }
    } catch {
      setLogoError("Upload failed. Try again.");
      setLogoPreview(avatarUrl);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    setLogoRemoving(true);
    setLogoError(null);
    const r = await fetch("/api/conduit/workspace", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ avatar_url: null }),
    });
    setLogoRemoving(false);
    if (r.ok) {
      setLogoPreview(null);
      toast.success("Workspace logo removed.");
      router.refresh();
    } else {
      setLogoError("Couldn't remove logo. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="conduit-card p-6 space-y-6">
        <h2 className="cx-type-md font-semibold">Workspace</h2>

        {/* ── Workspace logo ── */}
        <div>
          <div className="cx-label mb-1">
            Workspace logo
          </div>
          <p className="cx-type-xs text-[var(--cx-text-muted)] mb-3">
            Shown in the sidebar header. JPEG or PNG, max 2 MB.
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="relative group shrink-0"
              aria-label="Upload workspace logo"
            >
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border-2 border-[var(--cx-border)] group-hover:border-[var(--cx-accent)] transition-colors"
                style={{ background: "var(--cx-surface)" }}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Workspace logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="cx-type-2xl font-bold" style={{ color: "var(--cx-accent-bright)" }}>
                    {(wsName || workspaceName || "P")[0]?.toUpperCase() ?? "P"}
                  </span>
                )}
              </div>
              {logoUploading && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "var(--cx-canvas-dim, rgba(11,11,15,0.60))" }}>
                  <SpinnerIcon size={18} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--cx-accent)] flex items-center justify-center shadow">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                  <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </button>
            <div className="space-y-2">
              <PraxisButton
                type="button"
                onClick={() => logoInputRef.current?.click()}
                isDisabled={logoUploading}
                variant="ghost"
                size="sm"
                className=""
              >
                {logoUploading ? "Uploading…" : "Choose logo"}
              </PraxisButton>
              {logoPreview && (
                <PraxisButton
                  type="button"
                  onClick={removeLogo}
                  isDisabled={logoRemoving}
                  variant="ghost"
                  size="sm"
                  className=""
                >
                  {logoRemoving ? "Removing…" : "Remove logo"}
                </PraxisButton>
              )}
              {logoError && (
                <p className="cx-type-xs text-[var(--cx-danger)]">{logoError}</p>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleLogoChange}
              aria-hidden
            />
          </div>
        </div>

        {/* ── Workspace name ── */}
        <form onSubmit={saveWsName} className="space-y-2 max-w-sm">
          <label className="cx-label block">
            Workspace name
          </label>
          <p className="cx-type-xs text-[var(--cx-text-muted)] -mt-1">
            Shown in the sidebar. Leave blank to use your account name.
          </p>
          <div className="relative">
            <input
              value={wsName}
              onChange={(e) => {
                setWsName(e.target.value.slice(0, WS_NAME_MAX));
                setWsNameSaved(false);
                setWsNameError("");
              }}
              maxLength={WS_NAME_MAX}
              placeholder="e.g. Acme AI Team"
              className="w-full cx-input"
              style={{ paddingRight: "3rem" }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 cx-type-xs tabular-nums"
              style={{
                color:
                  wsName.length >= WS_NAME_MAX
                    ? "var(--cx-danger)"
                    : "var(--cx-text-muted)",
              }}
            >
              {wsName.length}/{WS_NAME_MAX}
            </span>
          </div>
          {wsNameError && <p className="cx-type-xs text-[var(--cx-danger)]">{wsNameError}</p>}
          <PraxisButton
            type="submit"
            isLoading={wsNameSaving}
            isDisabled={wsNameSaving}
            variant="secondary"
            className=""
          >
            {wsNameSaved ? <><Check size={12} /> Saved</> : "Save name"}
          </PraxisButton>
        </form>
      </section>
    </div>
  );
}

/* ─── Profile tab ─────────────────────────────────────────────────────────── */

function ProfileTab({
  email,
  fullName,
  creatorMode,
  creatorModeVersion,
  timezone,
  themePref,
  displayName,
  avatarUrl,
  workspaceName,
}: {
  email: string;
  fullName: string;
  creatorMode: boolean;
  creatorModeVersion: number;
  timezone: string;
  themePref: "system" | "light" | "dark";
  displayName: string | null;
  avatarUrl: string | null;
  workspaceName: string | null;
}) {
  const [tz, setTz] = useState(timezone);
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);
  const router = useRouter();

  // Display name editing
  const [nameValue, setNameValue] = useState(displayName ?? fullName ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  // Workspace name editing
  const [wsName, setWsName] = useState(workspaceName ?? "");
  const [wsNameSaving, setWsNameSaving] = useState(false);
  const [wsNameSaved, setWsNameSaved] = useState(false);
  const [wsNameError, setWsNameError] = useState("");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const downloadExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/conduit/account/export");
      if (!res.ok) {
        setExportError("Export failed. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `praxis-export-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  const toast = useToast();

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setNameSaving(true);
    setNameError("");
    setNameSaved(false);
    const r = await fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ display_name: trimmed }),
    });
    setNameSaving(false);
    if (r.ok) {
      setNameSaved(true);
      toast.success("Display name updated.");
      router.refresh();
    } else {
      setNameError("Couldn't save name. Try again.");
    }
  };

  const saveWsName = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = wsName.trim();
    setWsNameSaving(true);
    setWsNameError("");
    setWsNameSaved(false);
    const r = await fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ workspace_name: trimmed || null }),
    });
    setWsNameSaving(false);
    if (r.ok) {
      setWsNameSaved(true);
      toast.success("Workspace name updated.");
      router.refresh();
    } else {
      setWsNameError("Couldn't save workspace name. Try again.");
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    // Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/conduit/account/avatar", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({})) as { avatar_url?: string; error?: string };
      if (!r.ok) {
        const msg =
          j.error === "file_too_large"
            ? "Image must be under 5 MB."
            : j.error === "invalid_file_type"
              ? "Only JPEG, PNG, WebP, or GIF images are allowed."
              : "Upload failed. Try again.";
        setAvatarError(msg);
        setAvatarPreview(avatarUrl);
        URL.revokeObjectURL(objectUrl);
      } else if (j.avatar_url) {
        setAvatarPreview(j.avatar_url);
        URL.revokeObjectURL(objectUrl);
        toast.success("Avatar updated.");
        router.refresh();
      }
    } catch {
      setAvatarError("Upload failed. Try again.");
      setAvatarPreview(avatarUrl);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  const saveTz = async (next: string) => {
    setTz(next);
    setTzSaving(true);
    setTzSaved(false);
    const r = await fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: next }),
    });
    setTzSaving(false);
    if (r.ok) {
      setTzSaved(true);
      router.refresh();
    }
  };

  const submitEmailChange = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newEmail.trim();
    if (!trimmed || trimmed === email) return;
    setEmailSaving(true);
    setEmailError("");
    setEmailSent(false);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailSaving(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSent(true);
      setNewEmail("");
    }
  };

  const submitPasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords don't match."); return; }
    const strength = checkPasswordStrength(newPw);
    if (strength.score < 3) {
      setPwError(`Password needs: ${strength.missing.join(", ")}.`);
      return;
    }
    setPwSaving(true);
    const supabase = createSupabaseBrowserClient();
    // Verify current password before updating
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPw,
    });
    if (authError) {
      setPwError("Current password is incorrect.");
      setPwSaving(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (updateError) {
      setPwError(updateError.message);
    } else {
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password updated.");
    }
  };

  const initials = (nameValue || fullName || email)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

  return (
    <div className="space-y-6">
      {/* ── Identity card ── */}
      <section className="conduit-card p-6 space-y-6">
        <h2 className="cx-type-md font-semibold">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative group shrink-0"
            aria-label="Upload avatar"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center cx-type-md font-semibold overflow-hidden border-2 border-[var(--cx-border)] group-hover:border-[var(--cx-accent)] transition-colors"
              style={{ background: "var(--cx-surface-raised)" }}
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Your avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span style={{ color: "var(--cx-accent-bright)" }}>{initials}</span>
              )}
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: "var(--cx-canvas-dim, rgba(11,11,15,0.60))" }}>
                <SpinnerIcon size={18} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--cx-accent)] flex items-center justify-center shadow">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
          <div>
            <PraxisButton
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              isDisabled={avatarUploading}
              variant="ghost"
              size="sm"
            >
              {avatarUploading ? "Uploading…" : "Choose photo"}
            </PraxisButton>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)]">
              JPEG, PNG, WebP or GIF · max 5 MB
            </p>
            {avatarError && (
              <p className="mt-1 cx-type-xs text-[var(--cx-danger)]">{avatarError}</p>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
            aria-hidden
          />
        </div>

        {/* Display name */}
        <form onSubmit={saveName} className="space-y-2 max-w-sm">
          <label className="cx-label block">
            Display name
          </label>
          <div className="flex gap-2">
            <input
              value={nameValue}
              onChange={(e) => { setNameValue(e.target.value); setNameSaved(false); setNameError(""); }}
              maxLength={100}
              placeholder={fullName || "Your name"}
              className="flex-1 cx-input"
            />
            <PraxisButton
              type="submit"
              isLoading={nameSaving}
              isDisabled={!nameValue.trim() || nameSaving}
              variant="secondary"
              className="shrink-0"
            >
              {nameSaved ? <><Check size={12} /> Saved</> : "Save"}
            </PraxisButton>
          </div>
          {nameError && <p className="cx-type-xs text-[var(--cx-danger)]">{nameError}</p>}
        </form>

        {/* Workspace name */}
        <form onSubmit={saveWsName} className="space-y-2 max-w-sm">
          <label className="cx-label block">
            Workspace name
          </label>
          <p className="cx-type-xs text-[var(--cx-text-muted)] -mt-1">
            Shown in the sidebar header. Leave blank to use your account name.
          </p>
          <div className="flex gap-2">
            <input
              value={wsName}
              onChange={(e) => { setWsName(e.target.value); setWsNameSaved(false); setWsNameError(""); }}
              maxLength={80}
              placeholder="e.g. Acme AI Team"
              className="flex-1 cx-input"
            />
            <PraxisButton
              type="submit"
              isLoading={wsNameSaving}
              isDisabled={wsNameSaving}
              variant="secondary"
              className="shrink-0"
            >
              {wsNameSaved ? <><Check size={12} /> Saved</> : "Save"}
            </PraxisButton>
          </div>
          {wsNameError && <p className="cx-type-xs text-[var(--cx-danger)]">{wsNameError}</p>}
        </form>
      </section>

      {/* ── Account card ── */}
      <section className="conduit-card p-6 space-y-6">
        <h2 className="cx-type-md font-semibold">Account</h2>
        <div className="space-y-5">
          <div>
            <div className="cx-label mb-1">
              Email
            </div>
            <div className="cx-type-sm">{email}</div>
          </div>
          <ThemeToggle initialPref={themePref} />
          <div>
            <div className="cx-label mb-2">
              Timezone
            </div>
            <select
              value={tz}
              onChange={(e) => saveTz(e.target.value)}
              className="w-full max-w-sm cx-select-sm"
            >
              {[...new Set([tz, ...COMMON_TIMEZONES])].map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)]">
              {tzSaving ? "Saving…" : tzSaved ? "Saved" : "Used so the team knows what time of day it is for you."}
            </p>
          </div>
          {creatorMode && (
            <div>
              <div className="cx-label mb-1">
                Mode
              </div>
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border cx-type-xs"
                style={{
                  borderColor: "var(--cx-accent)",
                  color: "var(--cx-accent-bright)",
                  background: "var(--cx-accent-tint)",
                }}
              >
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: "var(--cx-accent)" }}
                />
                Creator Mode v{creatorModeVersion}
                {creatorModeVersion >= 2 ? " — premium routing" : ""}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Security card ── */}
      <section className="conduit-card p-6 space-y-6">
        <h2 className="cx-type-md font-semibold">Security</h2>

        {/* Update email */}
        <div>
          <div className="cx-label mb-3">
            Update email
          </div>
          {emailSent ? (
            <p className="cx-type-xs text-[var(--cx-reward)]">
              Confirmation email sent to {newEmail || "your new address"} — check your inbox to confirm the change.
            </p>
          ) : (
            <form onSubmit={submitEmailChange} className="space-y-3 max-w-sm">
              <input
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                autoComplete="email"
                required
                className="w-full cx-input"
              />
              {emailError && (
                <p className="cx-type-xs text-[var(--cx-danger)]">{emailError}</p>
              )}
              <PraxisButton
                type="submit"
                isLoading={emailSaving}
                isDisabled={!newEmail.trim() || newEmail.trim() === email}
                variant="secondary"
              >
                Send confirmation
              </PraxisButton>
            </form>
          )}
        </div>

        {/* Change password */}
        <div className="pt-4 border-t border-[var(--cx-border)]">
          <div className="cx-label mb-3">
            Change password
          </div>
          <form onSubmit={submitPasswordChange} className="space-y-3 max-w-sm">
            <div>
              <input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }}
                autoComplete="current-password"
                required
                className="w-full cx-input"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwError(""); }}
                autoComplete="new-password"
                required
                className="w-full cx-input"
              />
              <PwMeter pw={newPw} />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
                autoComplete="new-password"
                required
                className="w-full cx-input"
              />
            </div>
            {pwError && (
              <p className="cx-type-xs text-[var(--cx-danger)]">{pwError}</p>
            )}
            <PraxisButton
              type="submit"
              isLoading={pwSaving}
              isDisabled={!currentPw || !newPw || !confirmPw}
              variant="secondary"
            >
              Update password
            </PraxisButton>
          </form>
        </div>
      </section>

      {/* ── Actions card ── */}
      <section className="conduit-card p-6 space-y-6">
        <h2 className="cx-type-md font-semibold">Account actions</h2>

        {/* Guided Tour */}
        <div>
          <div className="cx-label mb-2">
            Guided tour
          </div>
          <p className="cx-type-xs text-[var(--cx-text-muted)] mb-3 max-w-sm">
            Replay the step-by-step walkthrough of Praxis specialists and key features.
          </p>
          <RestartTourButton />
        </div>

        {/* Data & Privacy */}
        <div className="pt-4 border-t border-[var(--cx-border)]">
          <div className="cx-label mb-2">
            Data &amp; privacy
          </div>
          <p className="cx-type-xs text-[var(--cx-text-muted)] mb-3 max-w-sm">
            Download a JSON bundle of all your data — profile, conversation
            history, and AI memory. Your data is yours.
          </p>
          <PraxisButton
            onClick={downloadExport}
            isLoading={exporting}
            loadingText="Preparing export…"
            variant="secondary"
          >
            Download my data
          </PraxisButton>
          {exportError && (
            <p className="mt-2 cx-type-xs text-[var(--cx-danger)]">{exportError}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function RestartTourButton() {
  const router = useRouter();
  const toast = useToast();
  const [restarting, setRestarting] = useState(false);

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await fetch("/api/conduit/account/onboarded", { method: "DELETE" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("praxis_tour_v1_done");
      }
      toast.success("Tour reset — redirecting…");
      router.push("/app");
    } catch {
      toast.error("Couldn't reset tour. Please try again.");
      setRestarting(false);
    }
  };

  return (
    <PraxisButton
      onClick={handleRestart}
      isLoading={restarting}
      loadingText="Resetting…"
      variant="secondary"
      className=""
    >
      Restart guided tour
    </PraxisButton>
  );
}

const COMPANY_BRIEF_MAX = 500;

function BusinessTab({ account }: { account: AccountData }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(account.name);
  const [businessType, setBusinessType] = useState(account.business_type);
  const [description, setDescription] = useState(account.business_description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brief, setBrief] = useState(account.company_brief ?? "");
  const [briefSaving, setBriefSaving] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/conduit/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        business_type: businessType,
        business_description: description,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed.");
      return;
    }
    toast.success("Settings saved.");
    router.refresh();
  }

  async function saveBrief(e: FormEvent) {
    e.preventDefault();
    const trimmed = brief.trim().slice(0, COMPANY_BRIEF_MAX);
    setBriefSaving(true);
    setBriefError(null);
    setBriefSaved(false);
    const r = await fetch("/api/conduit/account/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ company_brief: trimmed || null }),
    });
    setBriefSaving(false);
    if (r.ok) {
      setBriefSaved(true);
      toast.success("Company brief saved.");
      router.refresh();
    } else {
      setBriefError("Couldn't save brief. Try again.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Business info card */}
      <section className="conduit-card p-6 space-y-5">
        <h2 className="cx-type-md font-semibold">Business info</h2>
        <div>
          <label className="cx-label block mb-2">
            Business name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full cx-input"
          />
        </div>
        <div>
          <label className="cx-label block mb-2">
            Business type
          </label>
          <input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full cx-input"
          />
        </div>
        <div>
          <label className="cx-label block mb-2">
            What you&apos;re working on
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full cx-textarea"
          />
        </div>
        {error && <p className="cx-type-xs text-[var(--cx-danger)]">{error}</p>}
        <PraxisButton
          onClick={save}
          isLoading={saving}
          loadingText="Saving…"
        >
          Save
        </PraxisButton>
      </section>

      {/* Company brief card */}
      <section className="conduit-card p-6 space-y-4">
        <div>
          <h2 className="cx-type-md font-semibold mb-1">Company brief</h2>
          <p className="cx-type-xs text-[var(--cx-text-muted)]">
            A short context block Atlas shares with your whole team. All 9 specialists
            read this on every turn — no more repeating yourself.
          </p>
        </div>
        <form onSubmit={saveBrief} className="space-y-3">
          <div className="relative">
            <textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value.slice(0, COMPANY_BRIEF_MAX));
                setBriefSaved(false);
              }}
              rows={4}
              maxLength={COMPANY_BRIEF_MAX}
              placeholder="e.g. Acme builds B2B SaaS for HR teams in the US mid-market. We're pre-revenue, 2 founders, focused on getting our first 10 design partners this quarter."
              className="w-full cx-textarea"
            />
            <span
              className="absolute bottom-3 right-3 cx-type-xs tabular-nums"
              style={{
                color:
                  brief.length >= COMPANY_BRIEF_MAX
                    ? "var(--cx-danger)"
                    : "var(--cx-text-muted)",
              }}
            >
              {brief.length}/{COMPANY_BRIEF_MAX}
            </span>
          </div>
          {briefError && (
            <p className="cx-type-xs text-[var(--cx-danger)]">{briefError}</p>
          )}
          <div className="flex items-center gap-3">
            <PraxisButton
              type="submit"
              isLoading={briefSaving}
              isDisabled={briefSaving}
              variant="secondary"
            >
              {briefSaved ? <><Check size={12} /> Saved</> : "Save brief"}
            </PraxisButton>
            {brief && (
              <PraxisButton
                type="button"
                onClick={() => { setBrief(""); setBriefSaved(false); }}
                variant="ghost"
                size="sm"
              >
                Clear
              </PraxisButton>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

function UsageTab({ usage }: { usage: UsageData }) {
  // Build 3 month options: current + 2 prior calendar months
  const now = new Date();
  const monthOptions = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [historicalData, setHistoricalData] = useState<{
    totals: { input: number; output: number; cost: number };
    byEmployee: Record<string, { input: number; output: number; cost: number }>;
    byDay: Record<string, number>;
    messageCount: number;
  } | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [connectorStats, setConnectorStats] = useState<Array<{
    provider: string;
    fetch_count: number;
    last_fetched_at: string | null;
    connected_since: string;
  }>>([]);

  useEffect(() => {
    fetch("/api/conduit/connectors")
      .then((r) => r.json())
      .then((data) => setConnectorStats(data.stats ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMonthLoading(true);
    setHistoricalData(null);
    fetch(`/api/conduit/usage/monthly?month=${selectedMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setHistoricalData(data);
        setMonthLoading(false);
      })
      .catch(() => setMonthLoading(false));
  }, [selectedMonth]);

  const displayData = historicalData ?? {
    totals: usage.totals,
    byEmployee: usage.byEmployee,
    byDay: usage.byDay,
    messageCount: 0,
  };

  const days = Object.keys(displayData.byDay).sort();
  const fillByDay = days.map((d) => ({ d, v: displayData.byDay[d] }));
  const max = Math.max(1, ...fillByDay.map((x) => x.v));
  const empNames = EMPLOYEE_ORDER as EmployeeKey[];
  const empValues = empNames.map((emp) => ({
    emp,
    val: (displayData.byEmployee[emp]?.input ?? 0) + (displayData.byEmployee[emp]?.output ?? 0),
  }));
  const empTotal = Math.max(1, empValues.reduce((s, x) => s + x.val, 0));

  const capPct = Math.min(
    100,
    Math.round((usage.cap.used / Math.max(1, usage.cap.limit)) * 100),
  );

  return (
    <div className="space-y-8">
      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="cx-label">Period</span>
        <div className="flex flex-wrap gap-2">
          {monthOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedMonth(opt.value)}
              className="px-3 py-1 rounded-full cx-type-xs font-medium transition-colors"
              style={{
                background: selectedMonth === opt.value
                  ? "var(--cx-accent)"
                  : "var(--cx-surface-raised)",
                color: selectedMonth === opt.value
                  ? "var(--cx-text)"
                  : "var(--cx-text-muted)",
                border: `1px solid ${selectedMonth === opt.value ? "var(--cx-accent)" : "var(--cx-border)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {monthLoading && (
          <div className="cx-skeleton" style={{ height: 10, width: 64, borderRadius: 9999, opacity: 0.45 }} />
        )}
      </div>

      {/* Summary stats for selected month */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat
          label="AI messages"
          value={monthLoading ? "—" : String(displayData.messageCount)}
          sub="This period"
        />
        <Stat
          label="Tokens"
          value={monthLoading ? "—" : (displayData.totals.input + displayData.totals.output).toLocaleString()}
          sub="Input + output"
        />
        <Stat
          label="Est. cost"
          value={monthLoading ? "—" : `$${(displayData.totals.cost / 100).toFixed(2)}`}
          sub="This period"
        />
      </div>

      {/* Billing cycle cap — always shows current cycle data */}
      <div className="conduit-card px-5 py-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="cx-label">
            Token cap (current cycle)
          </span>
          <span className="cx-type-sm cx-mono">
            {usage.cap.used.toLocaleString()} /{" "}
            {usage.cap.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--cx-border)] overflow-hidden">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${capPct}%`,
              background:
                capPct >= 100
                  ? "var(--cx-danger)"
                  : capPct >= 80
                    ? "var(--cx-warn)"
                    : "var(--cx-accent)",
            }}
          />
        </div>
        {usage.cycleResetDate && (
          <p className="cx-type-xs text-[var(--cx-text-muted)] mt-2">
            Resets on {usage.cycleResetDate}
          </p>
        )}
      </div>

      {/* Daily token bar chart */}
      <div>
        <div className="cx-label mb-3">
          Tokens · daily
        </div>
        {monthLoading ? (
          <div className="conduit-card p-4">
            <div className="flex items-end gap-px h-32">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t animate-pulse bg-[var(--cx-border)]"
                  style={{ height: `${18 + Math.abs(Math.sin(i * 0.9)) * 45 + (i % 4) * 8}%` }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between cx-type-xs text-[var(--cx-text-muted)]">
              <div className="h-3 w-16 rounded animate-pulse bg-[var(--cx-border)]" />
              <div className="h-3 w-16 rounded animate-pulse bg-[var(--cx-border)]" />
            </div>
          </div>
        ) : fillByDay.length === 0 ? (
          <div className="conduit-card p-6 text-center">
            <p className="cx-type-sm text-[var(--cx-text-muted)]">No usage yet.</p>
            <p className="cx-type-xs text-[var(--cx-text-faint)] mt-1">
              Token usage will appear here once you start chatting.
            </p>
          </div>
        ) : (
          <div className="conduit-card p-4" key={selectedMonth}>
            <div className="flex items-end gap-px h-32">
              {fillByDay.map(({ d, v }, i) => {
                const h = Math.round((v / max) * 100);
                return (
                  <div
                    key={d}
                    title={`${d}: ${v.toLocaleString()} tokens`}
                    className="flex-1 rounded-t bg-[var(--cx-accent)] hover:opacity-100 transition-opacity cx-bar-anim"
                    style={{
                      height: `${Math.max(2, h)}%`,
                      opacity: 0.65,
                      animationDelay: `${i * 12}ms`,
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between cx-type-xs cx-mono text-[var(--cx-text-muted)]">
              <span>{fillByDay[0]?.d}</span>
              <span>{fillByDay[fillByDay.length - 1]?.d}</span>
            </div>
          </div>
        )}
      </div>

      {/* Per-employee breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="conduit-card p-5">
          <div className="cx-label mb-3">
            Share by employee
          </div>
          {monthLoading ? (
            <div className="flex items-center gap-5">
              <div className="w-[120px] h-[120px] rounded-full animate-pulse bg-[var(--cx-border)] shrink-0" />
              <div className="space-y-2 flex-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--cx-border)]" />
                    <div className="h-3 rounded animate-pulse bg-[var(--cx-border)]" style={{ width: `${55 + i * 12}%` }} />
                  </div>
                ))}
              </div>
            </div>
          ) : empTotal === 1 ? (
            <p className="cx-type-xs text-[var(--cx-text-muted)]">No usage yet.</p>
          ) : (
            <Donut key={selectedMonth} data={empValues} total={empTotal} />
          )}
        </div>
        <div className="conduit-card p-5">
          <div className="cx-label mb-3">
            By employee
          </div>
          {monthLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--cx-border)]" />
                    <div className="h-3 w-20 rounded animate-pulse bg-[var(--cx-border)]" />
                  </div>
                  <div className="h-3 w-24 rounded animate-pulse bg-[var(--cx-border)]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {empNames.map((emp) => {
                const v = displayData.byEmployee[emp];
                if (!v) return null;
                return (
                  <div key={emp} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: DEPT_COLOR[emp] }}
                      />
                      {employeeLabel(emp)}
                    </span>
                    <span className="cx-type-xs cx-mono text-[var(--cx-text-muted)]">
                      {(v.input + v.output).toLocaleString()} · $
                      {(v.cost / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {empNames.every((e) => !displayData.byEmployee[e]) && (
                <p className="cx-type-xs text-[var(--cx-text-muted)]">
                  No usage yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connector call totals */}
      <div>
        <div className="cx-label mb-3">
          Connector context fetches (all time)
        </div>
        {connectorStats.length === 0 ? (
          <div className="conduit-card p-5 text-[var(--cx-text-muted)] cx-type-xs">
            No connectors connected.{" "}
            <a href="/app/settings?tab=integrations" className="underline hover:text-[var(--cx-accent)]">
              Connect one in Integrations →
            </a>
          </div>
        ) : (
          <div className="conduit-card divide-y divide-[var(--cx-border)]">
            {connectorStats.map((stat) => {
              const label =
                stat.provider === "google_calendar"
                  ? "Google Calendar"
                  : stat.provider === "slack"
                    ? "Slack"
                    : stat.provider === "hubspot"
                      ? "HubSpot"
                      : stat.provider === "google_drive"
                        ? "Google Drive"
                        : stat.provider;
              const lastFetched = stat.last_fetched_at
                ? new Date(stat.last_fetched_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never";
              return (
                <div key={stat.provider} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div>
                    <p className="text-[var(--cx-text)] cx-type-sm">{label}</p>
                    <p className="text-[var(--cx-text-muted)] cx-type-xs mt-0.5">
                      Last fetched: {lastFetched}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[var(--cx-text)] cx-mono cx-type-sm font-medium">
                      {stat.fetch_count.toLocaleString()}
                    </p>
                    <p className="text-[var(--cx-text-muted)] cx-type-xs">fetches</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Donut({
  data,
  total,
}: {
  data: { emp: EmployeeKey; val: number }[];
  total: number;
}) {
  const r = 50;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = data
    .filter((d) => d.val > 0)
    .map((d) => {
      const frac = d.val / total;
      const length = frac * c;
      const seg = (
        <circle
          key={d.emp}
          cx="60"
          cy="60"
          r={r}
          fill="transparent"
          stroke={`var(--color-dept-${d.emp})`}
          strokeWidth="14"
          strokeDasharray={`${length} ${c - length}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 60 60)"
        />
      );
      offset += length;
      return seg;
    });
  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden className="cx-chart-anim">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="transparent"
          stroke="var(--cx-border)"
          strokeWidth="14"
        />
        {segments}
      </svg>
      <div className="cx-type-xs space-y-1">
        {data
          .filter((d) => d.val > 0)
          .map((d) => (
            <div key={d.emp} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: DEPT_COLOR[d.emp] }}
              />
              <span>{employeeLabel(d.emp)}</span>
              <span className="text-[var(--cx-text-muted)]">
                {Math.round((d.val / total) * 100)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

interface InvoiceItem {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
}

function BillingTab({
  account,
  usage,
}: {
  account: AccountData;
  usage: UsageData;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceItem[] | null>(null);
  const [cancelAt, setCancelAt] = useState<number | null>(null);
  const [isCanceling, setIsCanceling] = useState(
    account.subscription_status === "canceling",
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
  const tier = tierById(account.tier_id ?? "free");
  const internal = Boolean(account.internal_account);

  useEffect(() => {
    if (!account.has_stripe_customer) return;
    fetch("/api/conduit/billing/invoices")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => j && setInvoices(j.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [account.has_stripe_customer]);

  useEffect(() => {
    if (!account.has_stripe_customer) return;
    if (account.subscription_status !== "active" && account.subscription_status !== "canceling") return;
    fetch("/api/conduit/billing/subscription")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (!j?.subscription) return;
        setCancelAt(j.subscription.cancel_at ?? null);
        setIsCanceling(j.subscription.cancel_at_period_end ?? false);
      })
      .catch(() => undefined);
  }, [account.has_stripe_customer, account.subscription_status]);

  if (internal) {
    return (
      <div className="space-y-6">
        <div className="conduit-card p-6">
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-accent-bright)] mb-1">
            Internal Account · Conduit AI Team
          </div>
          {/* Conduit AI (the parent company) intentional — internal team badge. */}
          <div className="cx-heading-xl">No charge, full access</div>
          <p className="mt-2 text-[var(--cx-text-muted)]">
            You&apos;re on the internal team account. All tiers, all
            employees, no token cap. Subscription UI is hidden.
          </p>
        </div>
        <UsageSummary usage={usage} cap={tier.monthlyTokenAllowance} bonus={0} />
      </div>
    );
  }

  const upgrade = async (tierId: TierId) => {
    setBusy(tierId);
    setError(null);
    track("checkout_clicked", { tier_id: tierId });
    const currentIdx = ORDERED_TIERS.findIndex((t) => t.id === tier.id);
    const targetIdx = ORDERED_TIERS.findIndex((t) => t.id === tierId);
    if (targetIdx > currentIdx) {
      track("upgrade_initiated", { from_tier: tier.id, to_tier: tierId });
    } else if (targetIdx < currentIdx) {
      track("downgrade_clicked", { from_tier: tier.id, to_tier: tierId });
    }
    try {
      const res = await fetch("/api/conduit/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tier_id: tierId,
          return_url: window.location.href,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "billing_not_configured"
            ? "Billing isn't live yet."
            : j.error === "tier_price_not_configured"
              ? "Pricing not connected. Try again shortly."
              : "Couldn't start checkout.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout.");
      setBusy(null);
    }
  };

  const buyTopup = async (topupId: string) => {
    setBusy(topupId);
    setError(null);
    track("checkout_clicked", { topup_id: topupId });
    try {
      const res = await fetch("/api/conduit/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topup_id: topupId,
          return_url: window.location.href,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "billing_not_configured"
            ? "Top-ups aren't live yet."
            : "Couldn't start checkout.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't start checkout.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    setError(null);
    track("portal_opened", { tier_id: tier.id });
    try {
      const res = await fetch("/api/conduit/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ return_url: window.location.href }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          j.error === "no_customer"
            ? "Subscribe first to access the billing portal."
            : "Couldn't open portal.",
        );
        setBusy(null);
        return;
      }
      window.location.href = j.url;
    } catch {
      setError("Couldn't open portal.");
      setBusy(null);
    }
  };

  const handleCancelOrReactivate = async (action: "cancel" | "reactivate") => {
    setBusy(action);
    setError(null);
    setShowCancelModal(false);
    try {
      const res = await fetch("/api/conduit/billing/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error === "billing_not_configured" ? "Billing isn't live yet." : "Couldn't update subscription. Try again.");
        setBusy(null);
        return;
      }
      setIsCanceling(j.cancel_at_period_end ?? action === "cancel");
      if (j.cancel_at) setCancelAt(j.cancel_at);
    } catch {
      setError("Couldn't update subscription. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const allowance = tier.monthlyTokenAllowance + (account.bonus_tokens ?? 0);

  const trialDaysLeft =
    (account.tier_id ?? "free") === "free" && account.account_created_at
      ? Math.max(
          0,
          30 -
            Math.floor(
              (Date.now() - new Date(account.account_created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            ),
        )
      : null;

  const cycleResetDate = account.billing_cycle_start
    ? new Date(
        new Date(account.billing_cycle_start).getTime() +
          30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="conduit-card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-text-muted)]">
            Current plan ·{" "}
            {isCanceling
              ? "cancels at period end"
              : (account.subscription_status ?? "inactive").replace("_", " ")}
          </div>
          <div className="cx-heading-xl mt-1">{tier.name}</div>
          <div className="cx-type-xs cx-mono text-[var(--cx-text-muted)] mt-1">
            {tier.monthlyPriceCents > 0
              ? `$${tier.monthlyPriceCents / 100} / month`
              : "Free forever"}{" "}
            · {tier.monthlyTokenAllowance.toLocaleString()} tokens / month
            {account.bonus_tokens && account.bonus_tokens > 0
              ? ` · +${account.bonus_tokens.toLocaleString()} bonus`
              : ""}
          </div>
          {cycleResetDate && (
            <div className="text-[var(--cx-text-muted)] cx-type-xs mt-1">
              Cycle resets {cycleResetDate}
            </div>
          )}
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full cx-type-xs font-medium"
              style={{
                background: "color-mix(in srgb, var(--cx-warn) 12%, transparent)",
                color: "var(--cx-warn)",
                border: "1px solid color-mix(in srgb, var(--cx-warn) 30%, transparent)",
              }}
            >
              <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: "var(--cx-warn)" }} />
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} of free period left
            </div>
          )}
          {isCanceling && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full cx-type-xs font-medium"
              style={{
                background: "color-mix(in srgb, var(--cx-danger) 10%, transparent)",
                color: "var(--cx-danger)",
                border: "1px solid color-mix(in srgb, var(--cx-danger) 30%, transparent)",
              }}
            >
              <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: "var(--cx-danger)" }} />
              {cancelAt
                ? `Cancels ${new Date(cancelAt * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : "Cancels at end of billing period"}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 items-stretch sm:items-end shrink-0">
          {account.has_stripe_customer && (
            <PraxisButton
              onClick={openPortal}
              isLoading={busy === "portal"}
              isDisabled={busy !== null && busy !== "portal"}
              variant="secondary"
              className=""
            >
              Manage subscription
              <ExternalLink size={12} />
            </PraxisButton>
          )}
          {account.has_stripe_customer && tier.monthlyPriceCents > 0 && (
            isCanceling ? (
              <PraxisButton
                type="button"
                onClick={() => handleCancelOrReactivate("reactivate")}
                isDisabled={busy !== null}
                variant="ghost"
                size="sm"
                className="cx-type-xs text-center"
              >
                {busy === "reactivate" ? "Reactivating…" : "Reactivate plan"}
              </PraxisButton>
            ) : (
              <PraxisButton
                type="button"
                onClick={() => setShowCancelModal(true)}
                isDisabled={busy !== null}
                variant="ghost"
                size="sm"
                className="cx-type-xs text-center"
              >
                Cancel subscription
              </PraxisButton>
            )
          )}
        </div>
      </div>

      {/* Cancel subscription confirmation modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "var(--cx-modal-scrim, rgba(11,11,15,0.65))" }}
          onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
        >
          <div
            className="cx-glass-modal p-6 max-w-sm w-full space-y-4"
          >
            <div>
              <div className="cx-heading-lg mb-1">Cancel subscription?</div>
              <p className="cx-type-sm text-[var(--cx-text-muted)]">
                You&apos;ll keep full access to Praxis until{" "}
                {cancelAt
                  ? new Date(cancelAt * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
                  : "the end of your billing period"}
                . After that, your workspace reverts to the free tier.
              </p>
            </div>
            <ul className="cx-type-xs text-[var(--cx-text-muted)] space-y-1 list-disc list-inside">
              <li>All 9 specialists become read-only after downgrade</li>
              <li>Memory, conversations, and integrations are preserved</li>
              <li>You can reactivate any time before the period ends</li>
            </ul>
            <div className="flex gap-2 justify-end pt-2">
              <PraxisButton
                type="button"
                onClick={() => setShowCancelModal(false)}
                variant="secondary"
                size="sm"
              >
                Keep my plan
              </PraxisButton>
              <PraxisButton
                type="button"
                onClick={() => handleCancelOrReactivate("cancel")}
                isDisabled={busy === "cancel"}
                variant="danger"
                size="sm"
              >
                {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
              </PraxisButton>
            </div>
          </div>
        </div>
      )}

      <UsageSummary
        usage={usage}
        cap={tier.monthlyTokenAllowance}
        bonus={account.bonus_tokens ?? 0}
        resetDate={cycleResetDate}
      />

      {/* Invoice history — only shown on paid accounts with a Stripe customer */}
      {account.has_stripe_customer && (
        <div>
          <div className="cx-label mb-3">
            Invoice history
          </div>
          {invoices === null ? (
            <div className="conduit-card p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="h-3 rounded w-24 animate-pulse bg-[var(--cx-border)]" />
                  <div className="h-3 rounded w-16 animate-pulse bg-[var(--cx-border)]" />
                  <div className="h-3 rounded w-12 animate-pulse bg-[var(--cx-border)]" />
                  <div className="h-3 rounded w-20 animate-pulse bg-[var(--cx-border)]" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="conduit-card p-5 text-center cx-type-sm text-[var(--cx-text-muted)]">
              No invoices yet
            </div>
          ) : (
            <div className="conduit-card overflow-hidden">
              <table className="w-full cx-type-sm">
                <thead>
                  <tr className="border-b border-[var(--cx-border)]">
                    {["Date", "Amount", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left cx-label font-normal"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className={`hover:bg-[var(--cx-surface-raised)] transition-colors duration-100 ${
                        i < invoices.length - 1
                          ? "border-b border-[var(--cx-border)]"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--cx-text-muted)] cx-mono">
                        {new Date(inv.date * 1000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium cx-mono">
                        {(inv.amount / 100).toLocaleString(undefined, {
                          style: "currency",
                          currency: inv.currency.toUpperCase(),
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full cx-type-xs uppercase tracking-[0.1em]"
                          style={{
                            background:
                              inv.status === "paid"
                                ? "color-mix(in srgb, var(--cx-accent) 12%, transparent)"
                                : "color-mix(in srgb, var(--cx-text-muted) 15%, transparent)",
                            color:
                              inv.status === "paid"
                                ? "var(--cx-accent)"
                                : "var(--cx-text-muted)",
                          }}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.pdf_url && (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 cx-type-xs text-[var(--cx-accent)] hover:underline"
                          >
                            Download PDF
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="cx-type-sm text-[var(--cx-danger)]">{error}</p>
      )}

      {/* Tier comparison */}
      <div>
        <div className="cx-label mb-3">
          Plans
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ORDERED_TIERS.map((t) => {
            const isCurrent = t.id === tier.id;
            const isUpgrade =
              !isCurrent &&
              ORDERED_TIERS.findIndex((x) => x.id === t.id) >
                ORDERED_TIERS.findIndex((x) => x.id === tier.id);
            return (
              <div
                key={t.id}
                className={`conduit-card p-5 ${
                  isCurrent
                    ? "border-[var(--cx-accent)]"
                    : ""
                }`}
              >
                <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-text-muted)]">
                  {isCurrent ? "Current" : t.name}
                </div>
                <div className="cx-heading-xl mt-1">{t.name}</div>
                <div className="mt-1">
                  <span className="cx-type-xl font-semibold">
                    ${t.monthlyPriceCents / 100}
                  </span>
                  <span className="cx-type-xs text-[var(--cx-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="mt-3 space-y-2 cx-type-xs text-[var(--cx-text-muted)]">
                  <li className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--cx-accent)]"
                    />
                    {(t.monthlyTokenAllowance / 1000).toLocaleString()}k
                    tokens / month
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--cx-accent)]"
                    />
                    {t.modelCeiling === "haiku"
                      ? "Fast routing model"
                      : t.modelCeiling === "sonnet"
                        ? "Adaptive routing (Sonnet on reasoning)"
                        : "Premium routing (Opus on reasoning + code)"}
                  </li>
                  <li className="flex items-start gap-2">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--cx-accent)]"
                    />
                    {t.allowedEmployees.length} employees
                  </li>
                  {t.features.multiUser && (
                    <li className="flex items-start gap-2">
                      <Check
                        size={12}
                        className="mt-0.5 shrink-0 text-[var(--cx-accent)]"
                      />
                      Multi-user (when shipped)
                    </li>
                  )}
                </ul>
                {isUpgrade && t.id !== "free" && (
                  <PraxisButton
                    onClick={() => upgrade(t.id as TierId)}
                    isLoading={busy === t.id}
                    isDisabled={busy !== null && busy !== t.id}
                    variant="primary"
                    className="mt-4 w-full justify-center !py-2"
                  >
                    {`Upgrade to ${t.name}`}
                    <ArrowRight size={12} />
                  </PraxisButton>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top-ups */}
      <div>
        <div className="cx-label mb-3">
          Buy more tokens
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOPUPS.map((t) => (
            <button
              key={t.id}
              onClick={() => buyTopup(t.id)}
              disabled={busy !== null}
              className="conduit-card p-4 text-left hover:border-[var(--cx-accent)] transition-colors disabled:opacity-50"
            >
              <div className="cx-heading-lg">${t.amountCents / 100}</div>
              <div className="mt-1 cx-type-sm text-[var(--cx-text-muted)]">
                {(t.tokensGranted / 1000).toLocaleString()}k tokens
              </div>
              <span className="mt-3 inline-flex items-center gap-1 cx-type-xs text-[var(--cx-accent)]">
                {busy === t.id ? (
                  <>
                    <SpinnerIcon size={11} />
                    Opening…
                  </>
                ) : (
                  <>
                    Buy
                    <ArrowRight size={11} />
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 cx-type-xs text-[var(--cx-text-muted)]">
          Bonus tokens stack on top of your monthly allowance and roll over
          until used.
        </p>
      </div>

      <p className="cx-type-xs text-[var(--cx-text-muted)]">
        Allowance: {allowance.toLocaleString()} this cycle.
      </p>

      <ReferralSection />
    </div>
  );
}

function ReferralSection() {
  const [data, setData] = useState<{
    referral_code: string | null;
    referral_count: number;
    total_earned: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/conduit/referrals")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const link =
    typeof window !== "undefined" && data?.referral_code
      ? `${window.location.origin}/join/${data.referral_code}`
      : null;

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your referral link:", link);
    }
  }

  return (
    <div className="conduit-card p-5 space-y-4">
      <div>
        <div className="cx-label mb-1">
          Refer & Earn
        </div>
        <p className="cx-type-sm text-[var(--cx-text-muted)]">
          Share your link. When a friend signs up,{" "}
          <strong className="text-[var(--cx-text)]">both of you get 50 bonus tokens</strong>.
        </p>
      </div>

      {data?.referral_code ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 cx-type-xs cx-mono bg-[var(--cx-canvas)] rounded-lg px-3 py-2 text-[var(--cx-text)] truncate">
            {link}
          </code>
          <PraxisButton
            type="button"
            onClick={copyLink}
            variant="primary"
            size="sm"
            className="shrink-0"
          >
            {copied ? <Check size={12} /> : <ExternalLink size={12} />}
            {copied ? "Copied!" : "Copy link"}
          </PraxisButton>
        </div>
      ) : (
        <div className="h-8 rounded-lg animate-pulse bg-[var(--cx-border)] w-48" />
      )}

      {data && data.referral_count > 0 && (
        <div className="flex items-center gap-6 cx-type-sm pt-2 border-t border-[var(--cx-border)]">
          <div>
            <span className="font-semibold text-[var(--cx-text)]">
              {data.referral_count}
            </span>
            <span className="text-[var(--cx-text-muted)] ml-1">
              {data.referral_count === 1 ? "referral" : "referrals"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-[var(--cx-text)]">
              +{data.total_earned}
            </span>
            <span className="text-[var(--cx-text-muted)] ml-1">bonus tokens earned</span>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageSummary({
  usage,
  cap,
  bonus,
  resetDate,
}: {
  usage: UsageData;
  cap: number;
  bonus: number;
  resetDate?: string | null;
}) {
  const used = usage.cap.used;
  const total = cap + bonus;
  const remaining = Math.max(0, total - used);
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayPct(pct), 60);
    return () => clearTimeout(t);
  }, [pct]);

  const barColor =
    pct >= 100
      ? "var(--cx-danger)"
      : pct >= 80
        ? "var(--cx-warn)"
        : "var(--cx-accent)";

  return (
    <div className="conduit-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="cx-label">
          Usage this cycle
        </span>
        <span
          className="cx-mono cx-type-xs font-medium"
          style={{ color: barColor }}
        >
          {pct}%
        </span>
      </div>

      <div>
        <div className="h-2 rounded-full bg-[var(--cx-border)] overflow-hidden">
          <div
            className="h-2 rounded-full motion-safe:transition-[width] motion-safe:duration-700"
            style={{
              width: `${displayPct}%`,
              background: barColor,
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <div className="mt-2 flex items-baseline justify-between cx-type-xs cx-mono text-[var(--cx-text-muted)]">
          <span>{used.toLocaleString()} used</span>
          <span>{total.toLocaleString()} total</span>
        </div>
      </div>

      <div className="flex items-center justify-between cx-type-xs">
        <span
          className="font-medium"
          style={{ color: remaining === 0 ? "var(--cx-danger)" : "var(--cx-text)" }}
        >
          {remaining.toLocaleString()} tokens remaining
        </span>
        {resetDate && (
          <span className="text-[var(--cx-text-muted)]">Resets {resetDate}</span>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="conduit-card px-4 py-3">
      <div className="cx-label">
        {label}
      </div>
      <div className="cx-heading-xl mt-1">{value}</div>
      {sub && (
        <div className="cx-type-xs text-[var(--cx-text-muted)] mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Notifications tab ───────────────────────────────────────────────────── */

interface NotificationPrefs {
  product_updates: boolean;
  weekly_digest: boolean;
  build_completion_alerts: boolean;
  low_balance_warning: boolean;
}

const NOTIF_DEFAULTS: NotificationPrefs = {
  product_updates: true,
  weekly_digest: true,
  build_completion_alerts: true,
  low_balance_warning: true,
};

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conduit/notification-prefs")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.prefs) setPrefs({ ...NOTIF_DEFAULTS, ...j.prefs });
        else setPrefs(NOTIF_DEFAULTS);
      })
      .catch(() => setPrefs(NOTIF_DEFAULTS));
  }, []);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!prefs) return;
    const prev = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(key);
    setError(null);
    try {
      const r = await fetch("/api/conduit/notification-prefs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!r.ok) {
        setPrefs(prev);
        setError("Couldn't save preference.");
      }
    } catch {
      setPrefs(prev);
      setError("Couldn't save preference.");
    }
    setSaving(null);
  };

  if (!prefs) {
    return (
      <div className="conduit-card p-5 space-y-4" aria-busy aria-label="Loading notification settings">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-36 rounded-full animate-pulse bg-[var(--cx-border)]" />
              <div className="h-2 w-52 rounded-full animate-pulse bg-[var(--cx-border)] opacity-60" />
            </div>
            <div className="h-6 w-11 rounded-full shrink-0 animate-pulse bg-[var(--cx-border)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="cx-type-sm text-[var(--cx-text-muted)]">
        Choose which emails you receive from Praxis. Billing receipts and
        security alerts are always sent regardless of these settings.
      </p>

      <div className="conduit-card p-5 space-y-4">
        <ToggleRow
          label="Product updates & new features"
          desc="Hear about new Praxis capabilities, releases, and tips."
          value={prefs.product_updates}
          onChange={() => toggle("product_updates")}
        />
        <ToggleRow
          label="Weekly digest"
          desc="Monday morning summary of each specialist's activity from the past week."
          value={prefs.weekly_digest}
          onChange={() => toggle("weekly_digest")}
        />
        <ToggleRow
          label="Build completion alerts"
          desc="Email when an Engineering build finishes (success or failure)."
          value={prefs.build_completion_alerts}
          onChange={() => toggle("build_completion_alerts")}
        />
        <ToggleRow
          label="Low token balance warning"
          desc="Alert when your monthly token balance falls below 10%."
          value={prefs.low_balance_warning}
          onChange={() => toggle("low_balance_warning")}
        />

        {/* Always-on rows — visually disabled with tooltip */}
        <AlwaysOnRow
          label="Billing receipts"
          desc="Receipts for charges to your payment method. Required per Stripe ToS."
        />
        <AlwaysOnRow
          label="Security alerts"
          desc="Sign-in from new devices, password changes, and 2FA events."
        />
      </div>

      {saving && (
        <p className="cx-type-xs text-[var(--cx-text-muted)]">Saving…</p>
      )}
      {error && <p className="cx-type-sm text-[var(--cx-danger)]">{error}</p>}
    </div>
  );
}

/* ─── Integrations tab ────────────────────────────────────────────────────── */

interface ConnectorStatus {
  connected: string[];
  available: { google_calendar: boolean; slack: boolean; hubspot: boolean; github: boolean; google_drive: boolean };
}

interface GoogleDriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  cachedAt: string | null;
}

interface SlackChannel {
  id: string;
  name: string;
  is_member: boolean;
}

function IntegrationsTab({ isFreeUser }: { isFreeUser: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<ConnectorStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[] | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [savingChannel, setSavingChannel] = useState(false);
  // GitHub OAuth connector state
  const [githubConnectedMeta, setGithubConnectedMeta] = useState<{ login: string; repos: string[]; last_fetched_at: string | null } | null>(null);
  // Google Drive connector state
  const [driveSelectedFiles, setDriveSelectedFiles] = useState<GoogleDriveFileInfo[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [driveSearchResults, setDriveSearchResults] = useState<Array<{ id: string; name: string; mimeType: string }> | null>(null);
  const [driveSearching, setDriveSearching] = useState(false);
  const [driveSaving, setDriveSaving] = useState(false);
  const [driveRefreshing, setDriveRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/conduit/connectors");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        // If GitHub is connected, load its metadata.
        if ((data.connected as string[]).includes("github")) {
          fetch("/api/conduit/connectors/github")
            .then((r) => r.ok ? r.json() : null)
            .then((j: { login?: string; repos?: string[]; last_fetched_at?: string | null } | null) => {
              if (j?.login) setGithubConnectedMeta({ login: j.login, repos: j.repos ?? [], last_fetched_at: j.last_fetched_at ?? null });
            })
            .catch(() => {});
        } else {
          setGithubConnectedMeta(null);
        }
        // If Google Drive is connected, load its selected files.
        if ((data.connected as string[]).includes("google_drive")) {
          fetch("/api/conduit/connectors/google-drive")
            .then((r) => r.ok ? r.json() : null)
            .then((j: { files?: GoogleDriveFileInfo[] } | null) => {
              if (j?.files) setDriveSelectedFiles(j.files);
            })
            .catch(() => {});
        } else {
          setDriveSelectedFiles([]);
        }
      }
    } catch {
      // Non-fatal — tab still shows "Coming soon" for all.
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Surface OAuth success/error from URL params set by the callback route.
  useEffect(() => {
    const connected = params.get("connector_connected");
    const error = params.get("connector_error");
    if (connected) {
      const labels: Record<string, string> = {
        google_calendar: "Google Calendar",
        slack: "Slack",
        hubspot: "HubSpot",
        github: "GitHub",
        google_drive: "Google Drive",
      };
      toast.success(`${labels[connected] ?? connected} connected.`);
      fetchStatus();
      // Clean the URL.
      router.replace("/app/settings?tab=integrations");
    }
    if (error) {
      const msgs: Record<string, string> = {
        google_calendar_denied: "Google Calendar access was denied.",
        google_calendar_csrf: "OAuth state mismatch — please try again.",
        google_calendar_exchange: "Failed to exchange Google auth code.",
        google_calendar_db: "Failed to save Google Calendar connection.",
        slack_denied: "Slack access was denied.",
        slack_csrf: "OAuth state mismatch — please try again.",
        slack_exchange: "Failed to exchange Slack auth code.",
        slack_db: "Failed to save Slack connection.",
        hubspot_denied: "HubSpot access was denied.",
        hubspot_csrf: "OAuth state mismatch — please try again.",
        hubspot_exchange: "Failed to exchange HubSpot auth code.",
        hubspot_db: "Failed to save HubSpot connection.",
        google_drive_denied: "Google Drive access was denied.",
        google_drive_csrf: "OAuth state mismatch — please try again.",
        google_drive_exchange: "Failed to exchange Google Drive auth code.",
        google_drive_db: "Failed to save Google Drive connection.",
        github_denied: "GitHub access was denied.",
        github_csrf: "OAuth state mismatch — please try again.",
        github_exchange: "Failed to exchange GitHub auth code.",
        github_db: "Failed to save GitHub connection.",
      };
      toast.error(msgs[error] ?? "Connection failed.");
      router.replace("/app/settings?tab=integrations");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Fetch Slack channels when Slack becomes connected.
  useEffect(() => {
    if (!status?.connected.includes("slack") || slackChannels !== null) return;
    fetch("/api/conduit/connectors/slack/channels")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (j?.channels) setSlackChannels(j.channels);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const saveSlackChannel = async () => {
    if (!selectedChannel) return;
    setSavingChannel(true);
    try {
      const channel = slackChannels?.find((c) => c.id === selectedChannel);
      const res = await fetch("/api/conduit/connectors/slack", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: selectedChannel,
          channel_name: channel?.name ?? selectedChannel,
        }),
      });
      if (res.ok) {
        toast.success("Slack channel saved.");
      } else {
        toast.error("Failed to save channel.");
      }
    } finally {
      setSavingChannel(false);
    }
  };

  const disconnect = async (provider: string) => {
    setDisconnecting(provider);
    try {
      // For providers with underscores, convert to hyphens for the URL.
      const urlProvider = provider.replace(/_/g, "-");
      const res = await fetch(`/api/conduit/connectors/${urlProvider}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const labels: Record<string, string> = {
          google_calendar: "Google Calendar",
          slack: "Slack",
          hubspot: "HubSpot",
          github: "GitHub",
          google_drive: "Google Drive",
        };
        toast.success(`${labels[provider] ?? provider} disconnected.`);
        if (provider === "slack") setSlackChannels(null);
        if (provider === "github") setGithubConnectedMeta(null);
        if (provider === "google_drive") {
          setDriveSelectedFiles([]);
          setDriveSearchResults(null);
          setDriveSearchQuery("");
        }
        fetchStatus();
      } else {
        toast.error("Failed to disconnect.");
      }
    } finally {
      setDisconnecting(null);
    }
  };

  const searchDriveFiles = async () => {
    setDriveSearching(true);
    try {
      const q = encodeURIComponent(driveSearchQuery);
      const res = await fetch(`/api/conduit/connectors/google-drive/files?q=${q}`);
      if (res.ok) {
        const j = await res.json() as { files?: Array<{ id: string; name: string; mimeType: string }> };
        setDriveSearchResults(j.files ?? []);
      } else {
        toast.error("Drive search failed.");
      }
    } finally {
      setDriveSearching(false);
    }
  };

  const saveDriveFiles = async (fileIds: string[]) => {
    setDriveSaving(true);
    try {
      const res = await fetch("/api/conduit/connectors/google-drive/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_ids: fileIds }),
      });
      const j = await res.json() as { ok?: boolean; files?: GoogleDriveFileInfo[]; error?: string };
      if (res.ok && j.ok) {
        setDriveSelectedFiles(j.files ?? []);
        setDriveSearchResults(null);
        setDriveSearchQuery("");
        toast.success("Google Drive files saved.");
      } else {
        toast.error("Failed to save Drive files.");
      }
    } finally {
      setDriveSaving(false);
    }
  };

  const refreshDriveFiles = async () => {
    setDriveRefreshing(true);
    try {
      const res = await fetch("/api/conduit/connectors/google-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json() as { ok?: boolean; files?: GoogleDriveFileInfo[]; error?: string };
      if (res.ok && j.ok) {
        setDriveSelectedFiles(j.files ?? []);
        toast.success("Google Drive synced.");
      } else {
        toast.error("Sync failed. Try again.");
      }
    } finally {
      setDriveRefreshing(false);
    }
  };

  const isConnected = (provider: string) =>
    status?.connected.includes(provider) ?? false;

  const isAvailable = (provider: string) =>
    provider === "google_calendar"
      ? status?.available.google_calendar ?? false
      : provider === "slack"
        ? status?.available.slack ?? false
        : provider === "hubspot"
          ? status?.available.hubspot ?? false
          : provider === "github"
            ? status?.available.github ?? false
            : provider === "google_drive"
              ? status?.available.google_drive ?? false
              : false;

  return (
    <div className="space-y-6">
      <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl">
        Connect your tools so Praxis specialists can act with full context —
        aware of your calendar, messages, and data.
      </p>

      {/* Live connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:grid-flow-dense">
        {/* Google Calendar */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--cx-surface)",
                border: "1px solid var(--cx-border)",
              }}
            >
              <Calendar size={20} style={{ color: "#4285F4" }} />
            </div>
            {isConnected("google_calendar") ? (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)",
                  color: "var(--cx-reward)",
                  border: "1px solid color-mix(in srgb, var(--cx-reward) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)",
                  color: "var(--cx-accent)",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--cx-text)]">Google Calendar</div>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
              Gives your Operations specialist awareness of upcoming meetings and
              blocked time when answering scheduling questions.
            </p>
          </div>
          {isConnected("google_calendar") ? (
            <PraxisButton
              type="button"
              onClick={() => disconnect("google_calendar")}
              isDisabled={disconnecting === "google_calendar"}
              variant="danger"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              <Link2Off size={12} />
              {disconnecting === "google_calendar" ? "Disconnecting…" : "Disconnect"}
            </PraxisButton>
          ) : isAvailable("google_calendar") ? (
            <a
              href="/api/conduit/connectors/google-calendar/auth"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Link size={12} />
              Connect Google Calendar
            </a>
          ) : (
            <PraxisButton
              isDisabled
              variant="secondary"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              Not configured
            </PraxisButton>
          )}
        </div>

        {/* Slack */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--cx-surface)",
                border: "1px solid var(--cx-border)",
              }}
            >
              <BrandMarkSlack size={20} />
            </div>
            {isConnected("slack") ? (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)",
                  color: "var(--cx-reward)",
                  border: "1px solid color-mix(in srgb, var(--cx-reward) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)",
                  color: "var(--cx-accent)",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--cx-text)]">Slack</div>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
              Surface recent channel messages as context for all specialists.
              Pick one channel — your team's activity becomes AI-accessible.
            </p>
          </div>
          {isConnected("slack") ? (
            <div className="mt-auto flex flex-col gap-2">
              {/* Channel picker */}
              {slackChannels !== null && slackChannels.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="flex-1 cx-select-sm"
                  >
                    <option value="">Pick a channel…</option>
                    {slackChannels.map((c) => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>
                  <PraxisButton
                    type="button"
                    onClick={saveSlackChannel}
                    isDisabled={!selectedChannel || savingChannel}
                    variant="secondary"
                    size="sm"
                    className=""
                  >
                    {savingChannel ? "…" : "Save"}
                  </PraxisButton>
                </div>
              )}
              <PraxisButton
                type="button"
                onClick={() => disconnect("slack")}
                isDisabled={disconnecting === "slack"}
                variant="danger"
                size="sm"
                className="w-full justify-center"
              >
                <Link2Off size={12} />
                {disconnecting === "slack" ? "Disconnecting…" : "Disconnect"}
              </PraxisButton>
            </div>
          ) : isFreeUser ? (
            <a
              href="/app/settings?tab=billing"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Lock size={12} />
              Pro feature — Upgrade
            </a>
          ) : isAvailable("slack") ? (
            <a
              href="/api/conduit/connectors/slack/auth"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Link size={12} />
              Connect Slack
            </a>
          ) : (
            <PraxisButton
              isDisabled
              variant="secondary"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              Not configured
            </PraxisButton>
          )}
        </div>

        {/* HubSpot */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--cx-surface)",
                border: "1px solid var(--cx-border)",
              }}
            >
              <Database size={20} style={{ color: "#FF7A59" }} />
            </div>
            {isConnected("hubspot") ? (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)",
                  color: "var(--cx-reward)",
                  border: "1px solid color-mix(in srgb, var(--cx-reward) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)",
                  color: "var(--cx-accent)",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--cx-text)]">HubSpot</div>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
              Gives your Sales specialist real-time awareness of recent contacts
              and open deals so every response reflects your live CRM.
            </p>
          </div>
          {isConnected("hubspot") ? (
            <PraxisButton
              type="button"
              onClick={() => disconnect("hubspot")}
              isDisabled={disconnecting === "hubspot"}
              variant="danger"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              <Link2Off size={12} />
              {disconnecting === "hubspot" ? "Disconnecting…" : "Disconnect"}
            </PraxisButton>
          ) : isAvailable("hubspot") ? (
            <a
              href="/api/conduit/connectors/hubspot/auth"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Link size={12} />
              Connect HubSpot
            </a>
          ) : (
            <PraxisButton
              isDisabled
              variant="secondary"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              Not configured
            </PraxisButton>
          )}
        </div>

        {/* Google Drive */}
        <div className="conduit-card p-5 flex flex-col gap-4 md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--cx-surface)",
                border: "1px solid var(--cx-border)",
              }}
            >
              <BrandMarkDrive size={20} />
            </div>
            {isConnected("google_drive") ? (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)",
                  color: "var(--cx-reward)",
                  border: "1px solid color-mix(in srgb, var(--cx-reward) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)",
                  color: "var(--cx-accent)",
                  border: "1px solid color-mix(in srgb, var(--cx-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--cx-text)]">Google Drive</div>
            <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
              Select up to 5 Docs or Sheets — brand guides, product specs, customer
              lists — and every specialist references them automatically.
            </p>
          </div>
          {isConnected("google_drive") ? (
            <div className="mt-auto flex flex-col gap-3">
              {/* Selected files list */}
              {driveSelectedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="cx-type-xs text-[var(--cx-text-muted)]">
                    Synced files ({driveSelectedFiles.length}/5):
                  </p>
                  {driveSelectedFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 cx-type-xs">
                      <span className="truncate text-[var(--cx-text)]">{f.name}</span>
                      <span className="shrink-0 text-[var(--cx-text-muted)]">
                        {f.mimeType === "application/vnd.google-apps.spreadsheet" ? "Sheet" : "Doc"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* File picker */}
              {driveSearchResults === null ? (
                <PraxisButton
                  type="button"
                  onClick={() => { setDriveSearchResults([]); }}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                >
                  <Link size={12} />
                  {driveSelectedFiles.length > 0 ? "Change files" : "Pick files"}
                </PraxisButton>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") searchDriveFiles(); }}
                      placeholder="Search Docs & Sheets…"
                      className="flex-1 cx-type-xs rounded-lg px-2 py-2 bg-[var(--cx-surface)] border border-[var(--cx-border)] text-[var(--cx-text)] outline-none"
                    />
                    <PraxisButton
                      type="button"
                      onClick={searchDriveFiles}
                      isDisabled={driveSearching}
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                    >
                      {driveSearching ? "…" : "Search"}
                    </PraxisButton>
                  </div>
                  {driveSearchResults.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--cx-border)" }}>
                      {driveSearchResults.map((f) => {
                        const isSelected = driveSelectedFiles.some((s) => s.id === f.id);
                        return (
                          <button
                            key={f.id}
                            onClick={() => {
                              if (isSelected) return;
                              if (driveSelectedFiles.length >= 5) {
                                toast.error("Maximum 5 files. Remove one first.");
                                return;
                              }
                              const updated = [...driveSelectedFiles.map((s) => s.id), f.id];
                              saveDriveFiles(updated);
                            }}
                            disabled={isSelected || driveSaving}
                            className="text-left px-3 py-2 cx-type-xs flex items-center gap-2 transition-opacity duration-100 disabled:opacity-60"
                            style={{
                              background: isSelected ? "color-mix(in srgb, var(--cx-reward) 8%, transparent)" : "transparent",
                              color: isSelected ? "var(--cx-reward)" : "var(--cx-text)",
                              borderBottom: "1px solid var(--cx-border)",
                            }}
                          >
                            <span className="shrink-0 cx-type-xs opacity-60">
                              {f.mimeType === "application/vnd.google-apps.spreadsheet" ? "Sheet" : "Doc"}
                            </span>
                            <span className="truncate">{f.name}</span>
                            {isSelected && <Check size={10} className="shrink-0 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {driveSearchResults.length === 0 && !driveSearching && driveSearchQuery && (
                    <p className="cx-type-xs text-[var(--cx-text-muted)] text-center py-2">No Docs or Sheets found.</p>
                  )}
                  <div className="flex gap-2">
                    <PraxisButton
                      type="button"
                      onClick={() => setDriveSearchResults(null)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 justify-center"
                    >
                      Done
                    </PraxisButton>
                    {driveSelectedFiles.length > 0 && (
                      <PraxisButton
                        type="button"
                        onClick={() => saveDriveFiles([])}
                        isDisabled={driveSaving}
                        variant="danger"
                        size="sm"
                        className="flex-1 justify-center"
                      >
                        Clear all
                      </PraxisButton>
                    )}
                  </div>
                </div>
              )}
              {/* Refresh + Disconnect */}
              <div className="flex gap-2">
                {driveSelectedFiles.length > 0 && (
                  <PraxisButton
                    type="button"
                    onClick={refreshDriveFiles}
                    isDisabled={driveRefreshing}
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-center"
                  >
                    {driveRefreshing ? "Syncing…" : "Refresh"}
                  </PraxisButton>
                )}
                <PraxisButton
                  type="button"
                  onClick={() => disconnect("google_drive")}
                  isDisabled={disconnecting === "google_drive"}
                  variant="danger"
                  size="sm"
                  className="flex-1 justify-center"
                >
                  <Link2Off size={12} />
                  {disconnecting === "google_drive" ? "Disconnecting…" : "Disconnect"}
                </PraxisButton>
              </div>
            </div>
          ) : isFreeUser ? (
            <a
              href="/app/settings?tab=billing"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Lock size={12} />
              Pro feature — Upgrade
            </a>
          ) : isAvailable("google_drive") ? (
            <a
              href="/api/conduit/connectors/google-drive/auth"
              className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
            >
              <Link size={12} />
              Connect Google Drive
            </a>
          ) : (
            <PraxisButton
              isDisabled
              variant="secondary"
              size="sm"
              className="mt-auto w-full justify-center"
            >
              Not configured
            </PraxisButton>
          )}
        </div>

      {/* GitHub connector */}
      <div className="conduit-card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--cx-surface)",
              border: "1px solid var(--cx-border)",
            }}
          >
            <BrandMarkGithub size={20} />
          </div>
          {isConnected("github") ? (
            <span
              className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)",
                color: "var(--cx-reward)",
                border: "1px solid color-mix(in srgb, var(--cx-reward) 28%, transparent)",
              }}
            >
              Connected
            </span>
          ) : (
            <span
              className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "color-mix(in srgb, var(--cx-accent) 12%, transparent)",
                color: "var(--cx-accent)",
                border: "1px solid color-mix(in srgb, var(--cx-accent) 28%, transparent)",
              }}
            >
              Not connected
            </span>
          )}
        </div>
        <div>
          <div className="font-medium text-[var(--cx-text)]">GitHub</div>
          <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
            Gives your Engineering specialist live awareness of open PRs, issues,
            and CI status from your repos — no copy-pasting required.
          </p>
        </div>
        {isConnected("github") ? (
          <div className="space-y-3">
            {githubConnectedMeta && (
              <div className="cx-type-xs text-[var(--cx-text-muted)] space-y-1">
                <p>Connected as <span className="font-medium text-[var(--cx-text)]">@{githubConnectedMeta.login}</span></p>
                {githubConnectedMeta.repos.length > 0 && (
                  <p>Repos: {githubConnectedMeta.repos.join(", ")}</p>
                )}
                {githubConnectedMeta.last_fetched_at && (
                  <p>Last synced: <time className="cx-mono tabular-nums" dateTime={githubConnectedMeta.last_fetched_at}>{new Date(githubConnectedMeta.last_fetched_at).toLocaleString()}</time></p>
                )}
              </div>
            )}
            <PraxisButton
              type="button"
              onClick={() => disconnect("github")}
              isDisabled={disconnecting === "github"}
              variant="danger"
              size="sm"
              className="w-full justify-center"
            >
              <Link2Off size={12} />
              {disconnecting === "github" ? "Disconnecting…" : "Disconnect"}
            </PraxisButton>
          </div>
        ) : isAvailable("github") ? (
          <a
            href="/api/conduit/connectors/github/auth"
            className="mt-auto btn-secondary btn-sz-sm w-full no-underline"
          >
            <Link size={12} />
            Connect GitHub
          </a>
        ) : (
          <PraxisButton
            isDisabled
            variant="secondary"
            size="sm"
            className="mt-auto w-full justify-center"
          >
            Not configured
          </PraxisButton>
        )}
      </div>
      </div>

      {/* Coming soon — Notion */}
      <div>
        <p className="cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-text-muted)] mb-3">
          Coming soon
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: "Notion",
              description:
                "Sync Praxis outputs — briefs, reports, SOPs — directly to your Notion workspace as formatted pages.",
              Icon: BrandMarkNotion,
            },
          ].map(({ name, description, Icon }) => (
            <div key={name} className="conduit-card p-5 flex flex-col gap-4 opacity-60">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--cx-surface)",
                    border: "1px solid var(--cx-border)",
                  }}
                >
                  <Icon size={20} />
                </div>
                <span
                  className="cx-type-xs uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "color-mix(in srgb, var(--cx-warn) 12%, transparent)",
                    color: "var(--cx-warn)",
                    border: "1px solid color-mix(in srgb, var(--cx-warn) 28%, transparent)",
                  }}
                >
                  Coming soon
                </span>
              </div>
              <div>
                <div className="font-medium text-[var(--cx-text)]">{name}</div>
                <p className="mt-1 cx-type-xs text-[var(--cx-text-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
              <PraxisButton
                isDisabled
                variant="secondary"
                size="sm"
                className="mt-auto w-full justify-center"
              >
                Connect {name}
              </PraxisButton>
            </div>
          ))}
        </div>
      </div>

      <div
        className="conduit-card p-5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--cx-accent) 6%, var(--cx-surface)), var(--cx-surface))",
        }}
      >
        <div className="cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-accent-bright)] mb-2">
          More coming
        </div>
        <p className="cx-heading-lg">Zapier, Airtable, Linear, and more.</p>
        <p className="mt-2 cx-type-xs text-[var(--cx-text-muted)]">
          Every integration ships with native Praxis actions — not generic
          webhooks. Want one prioritized?{" "}
          <a
            href="mailto:hello@conduitai.io"
            className="text-[var(--cx-accent)] hover:underline"
          >
            Let us know.
          </a>
        </p>
      </div>
    </div>
  );
}

function AppearanceTab({
  themePref,
  accentPref,
}: {
  themePref: "system" | "light" | "dark";
  accentPref: string;
}) {
  const [accent, setAccent] = useState(() => {
    // Prefer localStorage so the swatch reflects what's actually painted.
    try { return localStorage.getItem(ACCENT_STORAGE_KEY) || accentPref; } catch { return accentPref; }
  });
  const [accentSaving, setAccentSaving] = useState(false);
  const [accentError, setAccentError] = useState<string | null>(null);

  // On first render: if localStorage is empty but DB has a preference,
  // sync it so the next page load (and other tabs) pick it up.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (!stored && accentPref !== "violet") {
        localStorage.setItem(ACCENT_STORAGE_KEY, accentPref);
        const preset = ACCENT_PRESETS[accentPref] ?? ACCENT_PRESETS.violet;
        const s = document.documentElement.style;
        s.setProperty("--color-accent", preset.accent);
        s.setProperty("--color-accent-hi", preset.hi);
        s.setProperty("--color-accent-deep", preset.deep);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAccent = (key: string) => {
    const preset = ACCENT_PRESETS[key] ?? ACCENT_PRESETS.violet;
    const s = document.documentElement.style;
    s.setProperty("--color-accent", preset.accent);
    s.setProperty("--color-accent-hi", preset.hi);
    s.setProperty("--color-accent-deep", preset.deep);
    try { localStorage.setItem(ACCENT_STORAGE_KEY, key); } catch { /* ignore */ }
  };

  const chooseAccent = async (key: string) => {
    setAccent(key);
    applyAccent(key);
    setAccentSaving(true);
    setAccentError(null);
    try {
      const r = await fetch("/api/conduit/account/prefs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accent_preference: key }),
      });
      if (!r.ok) setAccentError("Couldn't save accent preference.");
    } catch {
      setAccentError("Couldn't save accent preference.");
    }
    setAccentSaving(false);
  };

  return (
    <div className="space-y-6">
      <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl">
        Choose how Praxis looks on this device. Changes apply immediately.
      </p>

      <div className="conduit-card p-5">
        <ThemeToggle initialPref={themePref} />
      </div>

      <div className="conduit-card p-5 space-y-4">
        <div className="cx-label">
          Accent colour
        </div>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
          {Object.entries(ACCENT_PRESETS).map(([key, preset]) => {
            const active = accent === key;
            return (
              <button
                key={key}
                role="radio"
                aria-checked={active}
                aria-label={preset.label}
                title={preset.label}
                onClick={() => chooseAccent(key)}
                className="flex flex-col items-center gap-2 group focus:outline-none"
              >
                <span
                  className="w-8 h-8 rounded-full transition-transform group-hover:scale-110"
                  style={{
                    background: preset.accent,
                    outline: active ? `3px solid ${preset.accent}` : "3px solid transparent",
                    outlineOffset: "2px",
                    boxShadow: active
                      ? `0 0 0 2px var(--cx-canvas), 0 0 0 4px ${preset.accent}`
                      : "none",
                  }}
                />
                <span
                  className="cx-type-xs uppercase tracking-[0.1em]"
                  style={{
                    color: active ? preset.accent : "var(--cx-text-muted)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>
        {accentSaving && (
          <p className="cx-type-xs text-[var(--cx-text-muted)]">Saving…</p>
        )}
        {accentError && (
          <p className="cx-type-xs text-[var(--cx-danger)]">{accentError}</p>
        )}
      </div>
    </div>
  );
}

function AlwaysOnRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-4 opacity-60">
      <div>
        <div className="flex items-center gap-2">
          {label}
          <span
            title={desc}
            className="cursor-help text-[var(--cx-text-muted)]"
          >
            <Info size={12} />
          </span>
        </div>
        <div className="cx-type-xs text-[var(--cx-text-muted)] mt-0.5">
          {desc}
        </div>
      </div>
      {/* Always-on toggle — locked on */}
      <div
        aria-label="Always on — cannot be disabled"
        title="Cannot be disabled"
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full cursor-not-allowed bg-[var(--cx-accent)]"
      >
        <span className="inline-block h-5 w-5 transform rounded-full translate-x-5" style={{ background: "var(--cx-toggle-thumb, rgba(255,255,255,0.95))" }} />
      </div>
    </div>
  );
}

// ─── API Keys Tab ────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

function ApiKeysTab({ isPro }: { isPro: boolean }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conduit/api-keys")
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []))
      .catch(() => setKeys([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conduit/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("create_failed");
      const data = await res.json() as { key: string; meta: ApiKey };
      setRevealedKey(data.key);
      setKeys((prev) => [data.meta, ...prev]);
      setNewName("");
    } catch {
      // silent — user retries
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (revoking) return;
    if (!confirm("Revoke this API key? It will stop working immediately.")) return;
    setRevoking(id);
    try {
      await fetch(`/api/conduit/api-keys/${id}`, { method: "DELETE" });
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)),
      );
    } catch {
      // silent
    } finally {
      setRevoking(null);
    }
  }

  async function copyKey() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your API key:", revealedKey);
    }
  }

  const activeKeys = keys.filter((k) => !k.revoked_at);
  const revokedKeys = keys.filter((k) => k.revoked_at);

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="cx-heading-lg mb-1">API Keys</h2>
          <p className="cx-type-sm text-[var(--cx-text-muted)]">
            Integrate Praxis into your own tools and workflows via REST API.
          </p>
        </div>
        <div
          className="conduit-card p-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--cx-accent) 6%, var(--cx-surface)), var(--cx-surface))",
          }}
        >
          <div className="flex items-center justify-center gap-2 cx-type-xs uppercase tracking-[0.18em] text-[var(--cx-accent-bright)] mb-2">
            <Lock size={12} /> Pro feature
          </div>
          <p className="cx-heading-xl">Programmatic access</p>
          <p className="mt-2 cx-type-sm text-[var(--cx-text-muted)] max-w-md mx-auto">
            Generate API keys to call Praxis specialists from your own code,
            automations, and integrations. Upgrade to Pro to unlock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="cx-heading-lg mb-1">API Keys</h2>
        <p className="cx-type-sm text-[var(--cx-text-muted)]">
          Generate keys to access Praxis programmatically. Keys are shown once — store them securely.
        </p>
      </div>

      {/* New key banner (shown once after creation) */}
      {revealedKey && (
        <div className="conduit-card p-4 border border-[var(--cx-accent)] rounded-xl">
          <p className="cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-accent)] mb-2 font-semibold">
            New API key — copy it now
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 cx-type-xs cx-mono bg-[var(--cx-canvas)] rounded-lg px-3 py-2 text-[var(--cx-text)] break-all">
              {revealedKey}
            </code>
            <PraxisButton
              type="button"
              onClick={copyKey}
              variant="primary"
              size="sm"
              className="shrink-0"
            >
              {copied ? <Check size={12} /> : <Lock size={12} />}
              {copied ? "Copied!" : "Copy"}
            </PraxisButton>
          </div>
          <p className="cx-type-xs text-[var(--cx-text-muted)] mt-2">
            This key will not be shown again. Dismiss by creating another key or refreshing.
          </p>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Key name (e.g. CI/CD Pipeline)"
          maxLength={80}
          required
          className="flex-1 cx-input"
        />
        <PraxisButton
          type="submit"
          isDisabled={creating || !newName.trim()}
          variant="primary"
        >
          {creating ? <SpinnerIcon /> : <ArrowRight size={14} />}
          Generate
        </PraxisButton>
      </form>

      {/* Active keys */}
      {loading ? (
        <div className="space-y-2" aria-busy aria-label="Loading API keys">
          {[70, 85, 60].map((w, i) => (
            <div key={i} className="conduit-card flex items-center gap-4 px-4 py-3 rounded-xl" style={{ opacity: 0.38 - i * 0.04 }}>
              <div className="flex-1 space-y-1.5">
                <div className="cx-skeleton" style={{ height: 12, width: `${w}%`, borderRadius: 9999 }} />
                <div className="cx-skeleton" style={{ height: 10, width: "45%", borderRadius: 9999, opacity: 0.55 }} />
              </div>
              <div className="cx-skeleton shrink-0" style={{ height: 28, width: 60, borderRadius: 6, opacity: 0.4 }} />
            </div>
          ))}
        </div>
      ) : activeKeys.length === 0 ? (
        <p className="cx-type-sm text-[var(--cx-text-muted)]">No active API keys.</p>
      ) : (
        <div className="space-y-2">
          <p className="cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-text-muted)] font-semibold">
            Active keys
          </p>
          {activeKeys.map((k) => (
            <div
              key={k.id}
              className="conduit-card flex items-center gap-4 px-4 py-3 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="cx-type-sm font-medium text-[var(--cx-text)] truncate">{k.name}</p>
                <p className="cx-type-xs text-[var(--cx-text-muted)] mt-0.5 cx-mono tabular-nums">
                  <code className="font-mono">{k.key_preview}</code>
                  {" · Created "}
                  {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && (
                    <> · Last used {new Date(k.last_used_at).toLocaleDateString()}</>
                  )}
                  {!k.last_used_at && " · Never used"}
                </p>
              </div>
              <PraxisButton
                type="button"
                onClick={() => handleRevoke(k.id)}
                isDisabled={revoking === k.id}
                aria-label={`Revoke key ${k.name}`}
                variant="danger"
                size="sm"
                className="shrink-0"
              >
                <X size={12} />
                Revoke
              </PraxisButton>
            </div>
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="space-y-2">
          <p className="cx-type-xs uppercase tracking-[0.12em] text-[var(--cx-text-muted)] font-semibold">
            Revoked keys
          </p>
          {revokedKeys.map((k) => (
            <div
              key={k.id}
              className="conduit-card flex items-center gap-4 px-4 py-3 rounded-xl opacity-50"
            >
              <div className="flex-1 min-w-0">
                <p className="cx-type-sm font-medium text-[var(--cx-text)] truncate line-through">
                  {k.name}
                </p>
                <p className="cx-type-xs text-[var(--cx-text-muted)] mt-0.5 cx-mono tabular-nums">
                  <code className="font-mono">{k.key_preview}</code>
                  {" · Revoked "}
                  {k.revoked_at ? new Date(k.revoked_at).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="conduit-card p-4 rounded-xl cx-type-sm text-[var(--cx-text-muted)] space-y-1">
        <p className="font-medium text-[var(--cx-text)]">Using API keys</p>
        <p>Include your key in the <code className="font-mono cx-type-xs">Authorization</code> header:</p>
        <code className="block cx-type-xs font-mono bg-[var(--cx-canvas)] rounded-lg px-3 py-2 mt-1">
          Authorization: Bearer prx_…
        </code>
        <p className="cx-type-xs mt-2">Maximum 20 active keys per account.</p>
      </div>
    </div>
  );
}

// ─── Referrals Tab ────────────────────────────────────────────────────────────

interface ReferralData {
  referral_code: string | null;
  referral_count: number;
  total_earned: number;
}

function ReferralsTab() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/conduit/referrals")
      .then((r) => r.json())
      .then((d) => setData(d as ReferralData))
      .catch(() => setData({ referral_code: null, referral_count: 0, total_earned: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const referralUrl = data?.referral_code ? `${origin}/r/${data.referral_code}` : null;

  const copyLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your referral link:", referralUrl);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8" aria-busy aria-label="Loading referral data">
        <div className="space-y-2">
          <div className="cx-skeleton" style={{ height: 26, width: 140, borderRadius: 6, opacity: 0.5 }} />
          <div className="cx-skeleton" style={{ height: 11, width: 280, borderRadius: 9999, opacity: 0.3 }} />
        </div>
        <div className="conduit-card p-5 space-y-3">
          <div className="cx-skeleton" style={{ height: 9, width: 100, borderRadius: 9999, opacity: 0.45 }} />
          <div className="cx-skeleton" style={{ height: 36, borderRadius: 8, opacity: 0.28 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="cx-heading-lg mb-1">Refer &amp; Earn</h2>
        <p className="cx-type-sm text-[var(--cx-text-muted)] max-w-xl">
          Share your personal link. When someone signs up and starts using Praxis,
          you both get bonus tokens.
        </p>
      </div>

      {/* Referral link */}
      <div className="conduit-card p-5 space-y-3">
        <div className="cx-label">
          Your referral link
        </div>
        {referralUrl ? (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralUrl}
              aria-label="Your referral link"
              className="flex-1 cx-input-sm select-all cursor-text"
              onFocus={(e) => e.currentTarget.select()}
            />
            <PraxisButton
              type="button"
              onClick={copyLink}
              variant="primary"
              size="sm"
              className="shrink-0"
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Link size={12} /> Copy link</>}
            </PraxisButton>
          </div>
        ) : (
          <p className="cx-type-xs text-[var(--cx-text-muted)]">
            Your referral code is being generated — refresh in a moment.
          </p>
        )}
        <p className="cx-type-xs text-[var(--cx-text-muted)]">
          Share this link with founders and operators. They get bonus tokens on their first session; you get bonus tokens once they&apos;re active.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="conduit-card p-5">
          <div className="cx-label mb-1">
            Successful referrals
          </div>
          <AnimatedStat
            value={data?.referral_count ?? 0}
            style={{ color: "var(--cx-accent)" }}
          />
        </div>
        <div className="conduit-card p-5">
          <div className="cx-label mb-1">
            Bonus tokens earned
          </div>
          <AnimatedStat
            value={data?.total_earned ?? 0}
            style={{ color: "var(--cx-accent)" }}
          />
        </div>
      </div>

      {/* How it works */}
      <div className="conduit-card p-5 space-y-3">
        <div className="cx-label">
          How it works
        </div>
        <ol className="space-y-2 text-[var(--cx-text-muted)]">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center cx-type-xs font-bold" style={{ background: "color-mix(in srgb, var(--cx-accent) 15%, transparent)", color: "var(--cx-accent)" }}>1</span>
            Share your link with another founder or operator.
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center cx-type-xs font-bold" style={{ background: "color-mix(in srgb, var(--cx-accent) 15%, transparent)", color: "var(--cx-accent)" }}>2</span>
            They sign up and activate their workspace.
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center cx-type-xs font-bold" style={{ background: "color-mix(in srgb, var(--cx-accent) 15%, transparent)", color: "var(--cx-accent)" }}>3</span>
            You both receive bonus tokens — added to your allowance automatically.
          </li>
        </ol>
      </div>
    </div>
  );
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7",
  "#ec4899", "#6b7280",
];

interface LabelRecord {
  id: string;
  name: string;
  color: string;
}

function LabelsTab() {
  const [labels, setLabels] = useState<LabelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[6]);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conduit/labels")
      .then((r) => r.json())
      .then((d: { labels?: LabelRecord[] }) => setLabels(d.labels ?? []))
      .catch(() => setLabels([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/conduit/labels", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, color: newColor }),
      });
      if (!res.ok) throw new Error("create_failed");
      const data = await res.json() as { label: LabelRecord };
      setLabels((prev) => [...prev, data.label]);
      setNewName("");
      setShowCreate(false);
    } catch {
      // silent — user retries
    } finally {
      setCreating(false);
    }
  }

  function startEdit(label: LabelRecord) {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }

  async function handleSave(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/conduit/labels/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      if (!res.ok) throw new Error("update_failed");
      const data = await res.json() as { label: LabelRecord };
      setLabels((prev) => prev.map((l) => (l.id === id ? data.label : l)));
      setEditingId(null);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this label? It will be removed from all conversations.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/conduit/labels/${id}`, { method: "DELETE" });
      setLabels((prev) => prev.filter((l) => l.id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="cx-heading-lg mb-1">Labels</h2>
        <p className="cx-type-sm text-[var(--cx-text-muted)]">
          Color-coded labels to organize conversations by project, client, or status.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy aria-label="Loading labels">
          {[75, 60, 82].map((w, i) => (
            <div key={i} className="conduit-card flex items-center gap-3 px-4 py-3 rounded-xl" style={{ opacity: 0.38 - i * 0.04 }}>
              <div className="cx-skeleton shrink-0" style={{ width: 14, height: 14, borderRadius: 9999 }} />
              <div className="cx-skeleton flex-1" style={{ height: 12, width: `${w}%`, borderRadius: 9999 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {labels.length === 0 && !showCreate && (
            <div className="conduit-card p-6 flex flex-col items-center gap-3 text-center">
              <Tag size={20} style={{ color: "var(--cx-text-muted)" }} />
              <p className="cx-type-sm text-[var(--cx-text-muted)]">No labels yet. Create one to start organizing conversations.</p>
            </div>
          )}

          {labels.map((label) =>
            editingId === label.id ? (
              <div
                key={label.id}
                className="conduit-card p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 32))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSave(label.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    maxLength={32}
                    className="flex-1 cx-input-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSave(label.id)}
                    disabled={!editName.trim() || saving}
                    className="px-3 py-1.5 rounded-lg cx-type-xs font-medium text-white disabled:opacity-50 transition-[opacity,transform] duration-[120ms] hover:opacity-90 active:scale-[0.96] motion-reduce:active:scale-100"
                    style={{ background: editColor, minHeight: 32 }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <PraxisButton
                    type="button"
                    onClick={() => setEditingId(null)}
                    variant="ghost"
                    size="sm"
                    className=""
                  >
                    Cancel
                  </PraxisButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: editColor === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                key={label.id}
                className="conduit-card p-3 flex items-center gap-3"
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ background: label.color }}
                />
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cx-type-xs font-medium"
                  style={{
                    background: `color-mix(in srgb, ${label.color} 15%, var(--cx-surface))`,
                    color: label.color,
                    border: `1px solid color-mix(in srgb, ${label.color} 40%, transparent)`,
                  }}
                >
                  {label.name}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <PraxisButton
                    type="button"
                    onClick={() => startEdit(label)}
                    aria-label={`Rename label ${label.name}`}
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Pencil size={12} />
                  </PraxisButton>
                  <PraxisButton
                    type="button"
                    onClick={() => void handleDelete(label.id)}
                    isDisabled={deletingId === label.id}
                    aria-label={`Delete label ${label.name}`}
                    variant="danger"
                    size="icon-sm"
                  >
                    <Trash2 size={12} />
                  </PraxisButton>
                </div>
              </div>
            )
          )}

          {/* Create new label */}
          {showCreate ? (
            <div className="conduit-card p-3 space-y-2">
              <form onSubmit={(e) => void handleCreate(e)} className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Label name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.slice(0, 32))}
                  maxLength={32}
                  className="flex-1 cx-input-sm"
                />
                <button
                  type="submit"
                  disabled={!newName.trim() || creating}
                  className="px-3 py-1.5 rounded-lg cx-type-xs font-medium text-white disabled:opacity-50 transition-[opacity,transform] duration-[120ms] hover:opacity-90 active:scale-[0.96] motion-reduce:active:scale-100"
                  style={{ background: newColor, minHeight: 32 }}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
                <PraxisButton
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(""); }}
                  variant="ghost"
                  size="sm"
                  className=""
                >
                  Cancel
                </PraxisButton>
              </form>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c,
                      outline: newColor === c ? `2px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : labels.length < 10 ? (
            <PraxisButton
              type="button"
              onClick={() => setShowCreate(true)}
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              style={{ border: "1px dashed var(--cx-border)" }}
            >
              <Plus size={14} />
              Create label
            </PraxisButton>
          ) : (
            <p className="cx-type-xs text-[var(--cx-text-muted)]">Label limit reached (10 max).</p>
          )}
        </div>
      )}
    </div>
  );
}
