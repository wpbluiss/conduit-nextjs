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
  Play,
  X,
} from "lucide-react";
import { PraxisButton, SpinnerIcon } from "./PraxisButton";
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
  | "referrals";

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
    <div>
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
        {(
          [
            ["profile", "Profile"],
            ["workspace", "Workspace"],
            ["business", "Business"],
            ["specialists", "Specialists"],
            ["voice", "Voice"],
            ["team", "Team"],
            ["usage", "Usage"],
            ["billing", "Billing"],
            ["security", "Security"],
            ["notifications", "Notifications"],
            ["integrations", "Integrations"],
            ["appearance", "Appearance"],
            ["api", "API"],
            ["referrals", "Referrals"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-[var(--color-accent)] text-[var(--color-text)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
      {tab === "integrations" && <IntegrationsTab />}
      {tab === "appearance" && (
        <AppearanceTab
          themePref={account.theme_preference ?? "system"}
          accentPref={account.accent_preference ?? "ember"}
        />
      )}
      {tab === "api" && <ApiKeysTab />}
      {tab === "referrals" && <ReferralsTab />}
    </div>
  );
}

function TeamTab() {
  return (
    <div className="space-y-6 text-sm">
      <div>
        <p className="text-[var(--color-text-muted)] max-w-xl">
          Per-employee voice picks live in the <strong>Voice</strong> tab. This
          tab will also gain personality tuning (tone sliders, custom system
          prompt overrides) in a future update.
        </p>
      </div>
      <div
        className="conduit-card p-5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-elevated)), var(--color-surface-elevated))",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-2">
          Coming soon
        </div>
        <p className="serif text-2xl">Personality tuning</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
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
    <form onSubmit={handleSave} className="space-y-8 text-sm">
      {/* Nicknames */}
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-3">
          Custom nicknames
        </h3>
        <p className="text-[var(--color-text-muted)] max-w-xl mb-4">
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
                    background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 32%, transparent)`,
                  }}
                >
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`nick-${emp}`}
                    className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-1"
                  >
                    {canonical}
                    <span className="ml-1 text-[var(--color-text-muted)] normal-case tracking-normal">
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
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 ring-[var(--color-accent)]"
                  />
                </div>
                {nicknames[emp] && (
                  <button
                    type="button"
                    onClick={() => handleNicknameReset(emp)}
                    title="Reset to default"
                    className="shrink-0 p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response length */}
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-3">
          Response length
        </h3>
        <p className="text-[var(--color-text-muted)] max-w-xl mb-4">
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
                    background: `color-mix(in srgb, ${color} 18%, var(--color-surface-elevated))`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 32%, transparent)`,
                  }}
                >
                  <Icon size={14} style={{ color }} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-1.5">
                    {canonical}
                  </span>
                  <div className="flex gap-1" role="group" aria-label={`${canonical} response length`}>
                    {RESPONSE_LENGTH_OPTIONS.map(({ value, label, hint }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleLengthChange(emp, value)}
                        title={hint}
                        className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                          current === value
                            ? "bg-[var(--color-accent)] text-white"
                            : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)]"
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

      <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
        <PraxisButton type="submit" disabled={busy}>
          {busy ? <SpinnerIcon /> : <Check size={14} />}
          Save settings
        </PraxisButton>
      </div>
    </form>
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
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-2">
            <Lock size={12} /> Pro feature
          </div>
          <p className="serif text-2xl">Voice mode is a Pro perk</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Free accounts can still use voice <em>input</em> in chat. Upgrade
            to hear your team talk back.
          </p>
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
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
    <div className="space-y-6 text-sm">
      {!voiceConfigured && (
        <div className="conduit-card p-4 text-xs text-[var(--color-amber)] border-[var(--color-amber)]/40">
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
            <span className="text-xs text-[var(--color-text-muted)]">
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
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
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
                    className="text-[12px] font-medium"
                    style={{ color: DEPT_COLOR[emp] }}
                  >
                    {employeeLabel(emp)}
                  </span>
                  <button
                    onClick={() => preview(emp, current)}
                    disabled={!voiceConfigured || isPreviewing}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-40"
                  >
                    {isPreviewing ? (
                      "Playing…"
                    ) : (
                      <>
                        <Play size={10} /> Preview
                      </>
                    )}
                  </button>
                </div>
                <select
                  value={current}
                  onChange={(e) => setEmployeeVoice(emp, e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
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
                  <button
                    onClick={() =>
                      setEmployeeVoice(emp, DEFAULT_EMPLOYEE_VOICES[emp])
                    }
                    className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {saving && (
        <p className="text-xs text-[var(--color-text-muted)]">Saving…</p>
      )}
      {error && <p className="text-sm text-[var(--color-pink)]">{error}</p>}
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
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {desc}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          value
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-border)]"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
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
  "var(--color-pink)",
  "var(--color-yellow, #f59e0b)",
  "var(--color-green)",
  "var(--color-green)",
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
            background: score >= n ? STRENGTH_COLORS[score] : "var(--color-border)",
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
    <div className="space-y-8 text-sm">
      {/* ── Workspace logo ── */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
          Workspace logo
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)] mb-3">
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
              className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border-2 border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors"
              style={{ background: "var(--color-surface-elevated)" }}
            >
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Workspace logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold" style={{ color: "var(--color-accent-hi)" }}>
                  {(wsName || workspaceName || "P")[0]?.toUpperCase() ?? "P"}
                </span>
              )}
            </div>
            {logoUploading && (
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                <SpinnerIcon size={18} />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </button>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
            >
              {logoUploading ? "Uploading…" : "Choose logo"}
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={removeLogo}
                disabled={logoRemoving}
                className="block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-pink)] disabled:opacity-50 transition-colors"
              >
                {logoRemoving ? "Removing…" : "Remove logo"}
              </button>
            )}
            {logoError && (
              <p className="text-[11px] text-[var(--color-pink)]">{logoError}</p>
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
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block">
          Workspace name
        </label>
        <p className="text-[11px] text-[var(--color-text-muted)] -mt-1">
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
            className="w-full conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm pr-12"
          />
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] tabular-nums"
            style={{
              color:
                wsName.length >= WS_NAME_MAX
                  ? "var(--color-pink)"
                  : "var(--color-text-muted)",
            }}
          >
            {wsName.length}/{WS_NAME_MAX}
          </span>
        </div>
        {wsNameError && <p className="text-[11px] text-[var(--color-pink)]">{wsNameError}</p>}
        <PraxisButton
          type="submit"
          isLoading={wsNameSaving}
          isDisabled={wsNameSaving}
          variant="secondary"
          className="!text-xs"
        >
          {wsNameSaved ? <><Check size={12} /> Saved</> : "Save name"}
        </PraxisButton>
      </form>
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
    <div className="space-y-8 text-sm">
      {/* ── Avatar ── */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={avatarUploading}
          className="relative group shrink-0"
          aria-label="Upload avatar"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold overflow-hidden border-2 border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors"
            style={{ background: "var(--color-surface-elevated)" }}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span style={{ color: "var(--color-accent-hi)" }}>{initials}</span>
            )}
          </div>
          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <SpinnerIcon size={18} />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center shadow">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <path d="M5 2v6M2 5h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
        <div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
          >
            {avatarUploading ? "Uploading…" : "Choose photo"}
          </button>
          <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
            JPEG, PNG, WebP or GIF · max 5 MB
          </p>
          {avatarError && (
            <p className="mt-1 text-[11px] text-[var(--color-pink)]">{avatarError}</p>
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

      {/* ── Display name ── */}
      <form onSubmit={saveName} className="space-y-2 max-w-sm">
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block">
          Display name
        </label>
        <div className="flex gap-2">
          <input
            value={nameValue}
            onChange={(e) => { setNameValue(e.target.value); setNameSaved(false); setNameError(""); }}
            maxLength={100}
            placeholder={fullName || "Your name"}
            className="flex-1 conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
          />
          <PraxisButton
            type="submit"
            isLoading={nameSaving}
            isDisabled={!nameValue.trim() || nameSaving}
            variant="secondary"
            className="!text-xs shrink-0"
          >
            {nameSaved ? <><Check size={12} /> Saved</> : "Save"}
          </PraxisButton>
        </div>
        {nameError && <p className="text-[11px] text-[var(--color-pink)]">{nameError}</p>}
      </form>

      {/* ── Workspace name ── */}
      <form onSubmit={saveWsName} className="space-y-2 max-w-sm">
        <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block">
          Workspace name
        </label>
        <p className="text-[11px] text-[var(--color-text-muted)] -mt-1">
          Shown in the sidebar header. Leave blank to use your account name.
        </p>
        <div className="flex gap-2">
          <input
            value={wsName}
            onChange={(e) => { setWsName(e.target.value); setWsNameSaved(false); setWsNameError(""); }}
            maxLength={80}
            placeholder="e.g. Acme AI Team"
            className="flex-1 conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
          />
          <PraxisButton
            type="submit"
            isLoading={wsNameSaving}
            isDisabled={wsNameSaving}
            variant="secondary"
            className="!text-xs shrink-0"
          >
            {wsNameSaved ? <><Check size={12} /> Saved</> : "Save"}
          </PraxisButton>
        </div>
        {wsNameError && <p className="text-[11px] text-[var(--color-pink)]">{wsNameError}</p>}
      </form>

      {/* ── Account info ── */}
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
            Email
          </div>
          <div>{email}</div>
        </div>
        <ThemeToggle initialPref={themePref} />
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-2">
            Timezone
          </div>
          <select
            value={tz}
            onChange={(e) => saveTz(e.target.value)}
            className="w-full max-w-sm bg-[var(--color-surface-elevated)] hairline px-3 py-2 outline-none focus:border-[var(--color-accent)] rounded-lg"
          >
            {[...new Set([tz, ...COMMON_TIMEZONES])].map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
            {tzSaving ? "Saving…" : tzSaved ? "Saved" : "Used so the team knows what time of day it is for you."}
          </p>
        </div>
        {creatorMode && (
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
              Mode
            </div>
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent-hi)",
                background:
                  "color-mix(in srgb, var(--color-accent) 8%, transparent)",
              }}
            >
              <span
                aria-hidden
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
              />
              Creator Mode v{creatorModeVersion}
              {creatorModeVersion >= 2 ? " — premium routing" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Change email ── */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Update email
        </div>
        {emailSent ? (
          <p className="text-xs text-[var(--color-green)]">
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
              className="w-full conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
            />
            {emailError && (
              <p className="text-xs text-[var(--color-pink)]">{emailError}</p>
            )}
            <PraxisButton
              type="submit"
              isLoading={emailSaving}
              isDisabled={!newEmail.trim() || newEmail.trim() === email}
              variant="secondary"
              className="!text-xs"
            >
              Send confirmation
            </PraxisButton>
          </form>
        )}
      </div>

      {/* ── Change password ── */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
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
              className="w-full conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
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
              className="w-full conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
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
              className="w-full conduit-card px-4 py-2.5 outline-none focus:border-[var(--color-accent)] text-sm"
            />
          </div>
          {pwError && (
            <p className="text-xs text-[var(--color-pink)]">{pwError}</p>
          )}
          <PraxisButton
            type="submit"
            isLoading={pwSaving}
            isDisabled={!currentPw || !newPw || !confirmPw}
            variant="secondary"
            className="!text-xs"
          >
            Update password
          </PraxisButton>
        </form>
      </div>

      {/* ── Guided Tour ── */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Guided Tour
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3 max-w-sm">
          Replay the step-by-step walkthrough of Praxis specialists and key features.
        </p>
        <RestartTourButton />
      </div>

      {/* ── Data & Privacy ── */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Data &amp; Privacy
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3 max-w-sm">
          Download a JSON bundle of all your data — profile, conversation
          history, and AI memory. Your data is yours.
        </p>
        <PraxisButton
          onClick={downloadExport}
          isLoading={exporting}
          loadingText="Preparing export…"
          variant="secondary"
          className="!text-xs"
        >
          Download my data
        </PraxisButton>
        {exportError && (
          <p className="mt-2 text-xs text-[var(--color-pink)]">{exportError}</p>
        )}
      </div>
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
      className="!text-xs"
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
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
            Business name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
            Business type
          </label>
          <input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] block mb-2">
            What you&apos;re working on
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)] resize-none"
          />
        </div>
        {error && <p className="text-sm text-[var(--color-pink)]">{error}</p>}
        <PraxisButton
          onClick={save}
          isLoading={saving}
          loadingText="Saving…"
        >
          Save
        </PraxisButton>
      </div>

      {/* Company brief */}
      <div className="conduit-card p-5">
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
          Company brief
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          A short context block Atlas shares with your whole team. All 9 specialists
          read this on every turn — no more repeating yourself.
        </p>
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
              className="w-full conduit-card px-4 py-3 outline-none focus:border-[var(--color-accent)] resize-none text-sm"
            />
            <span
              className="absolute bottom-3 right-3 text-[10px] tabular-nums"
              style={{
                color:
                  brief.length >= COMPANY_BRIEF_MAX
                    ? "var(--color-pink)"
                    : "var(--color-text-muted)",
              }}
            >
              {brief.length}/{COMPANY_BRIEF_MAX}
            </span>
          </div>
          {briefError && (
            <p className="text-xs text-[var(--color-pink)]">{briefError}</p>
          )}
          <div className="flex items-center gap-3">
            <PraxisButton
              type="submit"
              isLoading={briefSaving}
              isDisabled={briefSaving}
              variant="secondary"
              className="!text-xs"
            >
              {briefSaved ? <><Check size={12} /> Saved</> : "Save brief"}
            </PraxisButton>
            {brief && (
              <button
                type="button"
                onClick={() => { setBrief(""); setBriefSaved(false); }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>
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
    <div className="space-y-8 text-sm">
      {/* Month selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">Period</span>
        <div className="flex flex-wrap gap-1.5">
          {monthOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedMonth(opt.value)}
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={{
                background: selectedMonth === opt.value
                  ? "var(--color-accent)"
                  : "var(--color-surface-elevated)",
                color: selectedMonth === opt.value
                  ? "#fff"
                  : "var(--color-text-muted)",
                border: `1px solid ${selectedMonth === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {monthLoading && (
          <span className="text-[11px] text-[var(--color-text-muted)] animate-pulse">Loading…</span>
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
          <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Token cap (current cycle)
          </span>
          <span className="text-sm">
            {usage.cap.used.toLocaleString()} /{" "}
            {usage.cap.limit.toLocaleString()}
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-2 rounded-full"
            style={{
              width: `${capPct}%`,
              background:
                capPct >= 100
                  ? "var(--color-pink)"
                  : capPct >= 80
                    ? "var(--color-amber)"
                    : "var(--color-accent)",
            }}
          />
        </div>
        {usage.cycleResetDate && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
            Resets on {usage.cycleResetDate}
          </p>
        )}
      </div>

      {/* Daily token bar chart */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Tokens · daily
        </div>
        {monthLoading ? (
          <p className="text-[var(--color-text-muted)]">Loading…</p>
        ) : fillByDay.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No usage yet.</p>
        ) : (
          <div className="conduit-card p-4">
            <div className="flex items-end gap-px h-32">
              {fillByDay.map(({ d, v }) => {
                const h = Math.round((v / max) * 100);
                return (
                  <div
                    key={d}
                    title={`${d}: ${v.toLocaleString()} tokens`}
                    className="flex-1 rounded-t bg-[var(--color-accent)] opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${Math.max(2, h)}%` }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-[var(--color-text-muted)]">
              <span>{fillByDay[0]?.d}</span>
              <span>{fillByDay[fillByDay.length - 1]?.d}</span>
            </div>
          </div>
        )}
      </div>

      {/* Per-employee breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            Share by employee
          </div>
          {monthLoading || empTotal === 1 ? (
            <p className="text-[var(--color-text-muted)]">
              {monthLoading ? "Loading…" : "No usage yet."}
            </p>
          ) : (
            <Donut data={empValues} total={empTotal} />
          )}
        </div>
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            By employee
          </div>
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
                  <span className="text-[var(--color-text-muted)] text-xs">
                    {(v.input + v.output).toLocaleString()} · $
                    {(v.cost / 100).toFixed(2)}
                  </span>
                </div>
              );
            })}
            {empNames.every((e) => !displayData.byEmployee[e]) && (
              <p className="text-[var(--color-text-muted)] text-xs">
                No usage yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Connector call totals */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Connector context fetches (all time)
        </div>
        {connectorStats.length === 0 ? (
          <div className="conduit-card p-5 text-[var(--color-text-muted)] text-xs">
            No connectors connected.{" "}
            <a href="/app/settings?tab=integrations" className="underline hover:text-[var(--color-accent)]">
              Connect one in Integrations →
            </a>
          </div>
        ) : (
          <div className="conduit-card divide-y divide-[var(--color-border)]">
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
                <div key={stat.provider} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div>
                    <p className="text-[var(--color-text)] text-[13px]">{label}</p>
                    <p className="text-[var(--color-text-muted)] text-[11px] mt-0.5">
                      Last fetched: {lastFetched}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[var(--color-text)] text-[13px] font-medium tabular-nums">
                      {stat.fetch_count.toLocaleString()}
                    </p>
                    <p className="text-[var(--color-text-muted)] text-[11px]">fetches</p>
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
      <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="transparent"
          stroke="var(--color-border)"
          strokeWidth="14"
        />
        {segments}
      </svg>
      <div className="text-xs space-y-1">
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
              <span className="text-[var(--color-text-muted)]">
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
      <div className="space-y-6 text-sm">
        <div className="conduit-card p-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-1">
            Internal Account · Conduit AI Team
          </div>
          {/* Conduit AI (the parent company) intentional — internal team badge. */}
          <div className="serif text-2xl">No charge, full access</div>
          <p className="mt-2 text-[var(--color-text-muted)]">
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
    <div className="space-y-6 text-sm">
      {/* Current plan */}
      <div className="conduit-card p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Current plan ·{" "}
            {isCanceling
              ? "cancels at period end"
              : (account.subscription_status ?? "inactive").replace("_", " ")}
          </div>
          <div className="serif text-2xl mt-1">{tier.name}</div>
          <div className="text-[var(--color-text-muted)] text-xs mt-1">
            {tier.monthlyPriceCents > 0
              ? `$${tier.monthlyPriceCents / 100} / month`
              : "Free forever"}{" "}
            · {tier.monthlyTokenAllowance.toLocaleString()} tokens / month
            {account.bonus_tokens && account.bonus_tokens > 0
              ? ` · +${account.bonus_tokens.toLocaleString()} bonus`
              : ""}
          </div>
          {cycleResetDate && (
            <div className="text-[var(--color-text-muted)] text-[11px] mt-1">
              Cycle resets {cycleResetDate}
            </div>
          )}
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
                color: "var(--color-amber)",
                border: "1px solid color-mix(in srgb, var(--color-amber) 30%, transparent)",
              }}
            >
              <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-amber)" }} />
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} of free period left
            </div>
          )}
          {isCanceling && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: "color-mix(in srgb, var(--color-destructive, #ef4444) 10%, transparent)",
                color: "var(--color-destructive, #ef4444)",
                border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 30%, transparent)",
              }}
            >
              <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-destructive, #ef4444)" }} />
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
              className="!text-xs"
            >
              Manage subscription
              <ExternalLink size={12} />
            </PraxisButton>
          )}
          {account.has_stripe_customer && tier.monthlyPriceCents > 0 && (
            isCanceling ? (
              <button
                type="button"
                onClick={() => handleCancelOrReactivate("reactivate")}
                disabled={busy !== null}
                className="text-[11px] underline underline-offset-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40 text-center"
              >
                {busy === "reactivate" ? "Reactivating…" : "Reactivate plan"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={busy !== null}
                className="text-[11px] underline underline-offset-2 text-[var(--color-text-muted)] hover:text-[var(--color-destructive,#ef4444)] transition-colors disabled:opacity-40 text-center"
              >
                Cancel subscription
              </button>
            )
          )}
        </div>
      </div>

      {/* Cancel subscription confirmation modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && setShowCancelModal(false)}
        >
          <div
            className="conduit-card p-6 max-w-sm w-full space-y-4"
            style={{ background: "var(--color-surface-elevated)" }}
          >
            <div>
              <div className="serif text-xl mb-1">Cancel subscription?</div>
              <p className="text-sm text-[var(--color-text-muted)]">
                You&apos;ll keep full access to Praxis until{" "}
                {cancelAt
                  ? new Date(cancelAt * 1000).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
                  : "the end of your billing period"}
                . After that, your workspace reverts to the free tier.
              </p>
            </div>
            <ul className="text-[11px] text-[var(--color-text-muted)] space-y-1 list-disc list-inside">
              <li>All 9 specialists become read-only after downgrade</li>
              <li>Memory, conversations, and integrations are preserved</li>
              <li>You can reactivate any time before the period ends</li>
            </ul>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
              >
                Keep my plan
              </button>
              <button
                type="button"
                onClick={() => handleCancelOrReactivate("cancel")}
                disabled={busy === "cancel"}
                className="px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-40"
                style={{
                  background: "color-mix(in srgb, var(--color-destructive, #ef4444) 12%, transparent)",
                  color: "var(--color-destructive, #ef4444)",
                  border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 35%, transparent)",
                }}
              >
                {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
              </button>
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
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            Invoice history
          </div>
          {invoices === null ? (
            <div className="conduit-card p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="h-3 rounded w-24 animate-pulse bg-[var(--color-border)]" />
                  <div className="h-3 rounded w-16 animate-pulse bg-[var(--color-border)]" />
                  <div className="h-3 rounded w-12 animate-pulse bg-[var(--color-border)]" />
                  <div className="h-3 rounded w-20 animate-pulse bg-[var(--color-border)]" />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="conduit-card p-5 text-center text-sm text-[var(--color-text-muted)]">
              No invoices yet
            </div>
          ) : (
            <div className="conduit-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {["Date", "Amount", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-muted)] font-normal"
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
                      className={
                        i < invoices.length - 1
                          ? "border-b border-[var(--color-border)]"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {new Date(inv.date * 1000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {(inv.amount / 100).toLocaleString(undefined, {
                          style: "currency",
                          currency: inv.currency.toUpperCase(),
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.1em]"
                          style={{
                            background:
                              inv.status === "paid"
                                ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                                : "color-mix(in srgb, var(--color-text-muted) 15%, transparent)",
                            color:
                              inv.status === "paid"
                                ? "var(--color-accent)"
                                : "var(--color-text-muted)",
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
                            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
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
        <p className="text-sm text-[var(--color-pink)]">{error}</p>
      )}

      {/* Tier comparison */}
      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
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
                    ? "border-[var(--color-accent)]"
                    : ""
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                  {isCurrent ? "Current" : t.name}
                </div>
                <div className="serif text-2xl mt-1">{t.name}</div>
                <div className="mt-1">
                  <span className="text-2xl font-medium">
                    ${t.monthlyPriceCents / 100}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {" "}/mo
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-xs text-[var(--color-text-muted)]">
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {(t.monthlyTokenAllowance / 1000).toLocaleString()}k
                    tokens / month
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {t.modelCeiling === "haiku"
                      ? "Fast routing model"
                      : t.modelCeiling === "sonnet"
                        ? "Adaptive routing (Sonnet on reasoning)"
                        : "Premium routing (Opus on reasoning + code)"}
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check
                      size={12}
                      className="mt-0.5 shrink-0 text-[var(--color-accent)]"
                    />
                    {t.allowedEmployees.length} employees
                  </li>
                  {t.features.multiUser && (
                    <li className="flex items-start gap-1.5">
                      <Check
                        size={12}
                        className="mt-0.5 shrink-0 text-[var(--color-accent)]"
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
                    className="mt-4 w-full justify-center !text-xs !py-2"
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
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Buy more tokens
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOPUPS.map((t) => (
            <button
              key={t.id}
              onClick={() => buyTopup(t.id)}
              disabled={busy !== null}
              className="conduit-card p-4 text-left hover:border-[var(--color-accent)] transition-colors disabled:opacity-50"
            >
              <div className="serif text-xl">${t.amountCents / 100}</div>
              <div className="mt-1 text-sm">
                {(t.tokensGranted / 1000).toLocaleString()}k tokens
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--color-accent)]">
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
        <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
          Bonus tokens stack on top of your monthly allowance and roll over
          until used.
        </p>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)]">
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
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
          Refer & Earn
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          Share your link. When a friend signs up,{" "}
          <strong className="text-[var(--color-text)]">both of you get 50 bonus tokens</strong>.
        </p>
      </div>

      {data?.referral_code ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-[var(--color-surface)] rounded-lg px-3 py-2 text-[var(--color-text)] truncate">
            {link}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hi)] transition-colors"
          >
            {copied ? <Check size={12} /> : <ExternalLink size={12} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      ) : (
        <div className="h-8 rounded-lg animate-pulse bg-[var(--color-border)] w-48" />
      )}

      {data && data.referral_count > 0 && (
        <div className="flex items-center gap-6 text-sm pt-2 border-t border-[var(--color-border)]">
          <div>
            <span className="font-semibold text-[var(--color-text)]">
              {data.referral_count}
            </span>
            <span className="text-[var(--color-text-muted)] ml-1">
              {data.referral_count === 1 ? "referral" : "referrals"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-[var(--color-text)]">
              +{data.total_earned}
            </span>
            <span className="text-[var(--color-text-muted)] ml-1">bonus tokens earned</span>
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

  const barColor =
    pct >= 100
      ? "var(--color-pink)"
      : pct >= 80
        ? "var(--color-amber)"
        : "var(--color-accent)";

  return (
    <div className="conduit-card p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Usage this cycle
        </span>
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: barColor }}
        >
          {pct}%
        </span>
      </div>

      <div>
        <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-[var(--color-text-muted)] tabular-nums">
          <span>{used.toLocaleString()} used</span>
          <span>{total.toLocaleString()} total</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[12px]">
        <span
          className="font-medium"
          style={{ color: remaining === 0 ? "var(--color-pink)" : "var(--color-text)" }}
        >
          {remaining.toLocaleString()} tokens remaining
        </span>
        {resetDate && (
          <span className="text-[var(--color-text-muted)]">Resets {resetDate}</span>
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
      <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="serif text-2xl mt-1">{value}</div>
      {sub && (
        <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
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
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-6 text-sm">
      <p className="text-[var(--color-text-muted)]">
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
        <p className="text-xs text-[var(--color-text-muted)]">Saving…</p>
      )}
      {error && <p className="text-sm text-[var(--color-pink)]">{error}</p>}
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

function IntegrationsTab() {
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
    <div className="space-y-6 text-sm">
      <p className="text-[var(--color-text-muted)] max-w-xl">
        Connect your tools so Praxis specialists can act with full context —
        aware of your calendar, messages, and data.
      </p>

      {/* Live connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Calendar size={20} style={{ color: "#4285F4" }} />
            </div>
            {isConnected("google_calendar") ? (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)",
                  color: "var(--color-success, #22c55e)",
                  border: "1px solid color-mix(in srgb, var(--color-success, #22c55e) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "var(--color-accent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text)]">Google Calendar</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              Gives your Operations specialist awareness of upcoming meetings and
              blocked time when answering scheduling questions.
            </p>
          </div>
          {isConnected("google_calendar") ? (
            <button
              onClick={() => disconnect("google_calendar")}
              disabled={disconnecting === "google_calendar"}
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              style={{
                background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                color: "var(--color-destructive, #ef4444)",
              }}
            >
              <Link2Off size={12} />
              {disconnecting === "google_calendar" ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : isAvailable("google_calendar") ? (
            <a
              href="/api/conduit/connectors/google-calendar/auth"
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 no-underline"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                color: "var(--color-accent)",
              }}
            >
              <Link size={12} />
              Connect Google Calendar
            </a>
          ) : (
            <button
              disabled
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Not configured
            </button>
          )}
        </div>

        {/* Slack */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <BrandMarkSlack size={20} />
            </div>
            {isConnected("slack") ? (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)",
                  color: "var(--color-success, #22c55e)",
                  border: "1px solid color-mix(in srgb, var(--color-success, #22c55e) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "var(--color-accent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text)]">Slack</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
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
                    className="flex-1 text-xs rounded-lg px-2 py-2"
                    style={{
                      background: "var(--color-surface-elevated)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="">Pick a channel…</option>
                    {slackChannels.map((c) => (
                      <option key={c.id} value={c.id}>#{c.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveSlackChannel}
                    disabled={!selectedChannel || savingChannel}
                    className="px-3 py-2 rounded-lg text-xs font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                      border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {savingChannel ? "…" : "Save"}
                  </button>
                </div>
              )}
              <button
                onClick={() => disconnect("slack")}
                disabled={disconnecting === "slack"}
                className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                style={{
                  background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                  border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                  color: "var(--color-destructive, #ef4444)",
                }}
              >
                <Link2Off size={12} />
                {disconnecting === "slack" ? "Disconnecting…" : "Disconnect"}
              </button>
            </div>
          ) : isAvailable("slack") ? (
            <a
              href="/api/conduit/connectors/slack/auth"
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 no-underline"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                color: "var(--color-accent)",
              }}
            >
              <Link size={12} />
              Connect Slack
            </a>
          ) : (
            <button
              disabled
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Not configured
            </button>
          )}
        </div>

        {/* HubSpot */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Database size={20} style={{ color: "#FF7A59" }} />
            </div>
            {isConnected("hubspot") ? (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)",
                  color: "var(--color-success, #22c55e)",
                  border: "1px solid color-mix(in srgb, var(--color-success, #22c55e) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "var(--color-accent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text)]">HubSpot</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              Gives your Sales specialist real-time awareness of recent contacts
              and open deals so every response reflects your live CRM.
            </p>
          </div>
          {isConnected("hubspot") ? (
            <button
              onClick={() => disconnect("hubspot")}
              disabled={disconnecting === "hubspot"}
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              style={{
                background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                color: "var(--color-destructive, #ef4444)",
              }}
            >
              <Link2Off size={12} />
              {disconnecting === "hubspot" ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : isAvailable("hubspot") ? (
            <a
              href="/api/conduit/connectors/hubspot/auth"
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 no-underline"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                color: "var(--color-accent)",
              }}
            >
              <Link size={12} />
              Connect HubSpot
            </a>
          ) : (
            <button
              disabled
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Not configured
            </button>
          )}
        </div>
      </div>

        {/* Google Drive */}
        <div className="conduit-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
              }}
            >
              <BrandMarkDrive size={20} />
            </div>
            {isConnected("google_drive") ? (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)",
                  color: "var(--color-success, #22c55e)",
                  border: "1px solid color-mix(in srgb, var(--color-success, #22c55e) 28%, transparent)",
                }}
              >
                Connected
              </span>
            ) : (
              <span
                className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                  color: "var(--color-accent)",
                  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
                }}
              >
                Not connected
              </span>
            )}
          </div>
          <div>
            <div className="font-medium text-[var(--color-text)]">Google Drive</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              Select up to 5 Docs or Sheets — brand guides, product specs, customer
              lists — and every specialist references them automatically.
            </p>
          </div>
          {isConnected("google_drive") ? (
            <div className="mt-auto flex flex-col gap-3">
              {/* Selected files list */}
              {driveSelectedFiles.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Synced files ({driveSelectedFiles.length}/5):
                  </p>
                  {driveSelectedFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-[var(--color-text)]">{f.name}</span>
                      <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                        {f.mimeType === "application/vnd.google-apps.spreadsheet" ? "Sheet" : "Doc"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* File picker */}
              {driveSearchResults === null ? (
                <button
                  onClick={() => { setDriveSearchResults([]); }}
                  className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                  style={{
                    background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                    border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                    color: "var(--color-accent)",
                  }}
                >
                  <Link size={12} />
                  {driveSelectedFiles.length > 0 ? "Change files" : "Pick files"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") searchDriveFiles(); }}
                      placeholder="Search Docs & Sheets…"
                      className="flex-1 text-xs rounded-lg px-2 py-2"
                      style={{
                        background: "var(--color-surface-elevated)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={searchDriveFiles}
                      disabled={driveSearching}
                      className="px-3 py-2 rounded-lg text-xs font-medium shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                        border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {driveSearching ? "…" : "Search"}
                    </button>
                  </div>
                  {driveSearchResults.length > 0 && (
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
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
                            className="text-left px-3 py-2 text-xs flex items-center gap-2"
                            style={{
                              background: isSelected ? "color-mix(in srgb, var(--color-success, #22c55e) 8%, transparent)" : "transparent",
                              color: isSelected ? "var(--color-success, #22c55e)" : "var(--color-text)",
                              borderBottom: "1px solid var(--color-border)",
                            }}
                          >
                            <span className="shrink-0 text-[10px] opacity-60">
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
                    <p className="text-[11px] text-[var(--color-text-muted)] text-center py-2">No Docs or Sheets found.</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDriveSearchResults(null)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium"
                      style={{
                        background: "var(--color-surface-elevated)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Done
                    </button>
                    {driveSelectedFiles.length > 0 && (
                      <button
                        onClick={() => saveDriveFiles([])}
                        disabled={driveSaving}
                        className="flex-1 py-2 rounded-lg text-xs font-medium"
                        style={{
                          background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                          border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                          color: "var(--color-destructive, #ef4444)",
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Refresh + Disconnect */}
              <div className="flex gap-2">
                {driveSelectedFiles.length > 0 && (
                  <button
                    onClick={refreshDriveFiles}
                    disabled={driveRefreshing}
                    className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{
                      background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                      border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {driveRefreshing ? "Syncing…" : "Refresh"}
                  </button>
                )}
                <button
                  onClick={() => disconnect("google_drive")}
                  disabled={disconnecting === "google_drive"}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                  style={{
                    background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                    border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                    color: "var(--color-destructive, #ef4444)",
                  }}
                >
                  <Link2Off size={12} />
                  {disconnecting === "google_drive" ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>
            </div>
          ) : isAvailable("google_drive") ? (
            <a
              href="/api/conduit/connectors/google-drive/auth"
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 no-underline"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
                color: "var(--color-accent)",
              }}
            >
              <Link size={12} />
              Connect Google Drive
            </a>
          ) : (
            <button
              disabled
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Not configured
            </button>
          )}
        </div>

      {/* GitHub connector */}
      <div className="conduit-card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
            }}
          >
            <BrandMarkGithub size={20} />
          </div>
          {isConnected("github") ? (
            <span
              className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "color-mix(in srgb, var(--color-success, #22c55e) 12%, transparent)",
                color: "var(--color-success, #22c55e)",
                border: "1px solid color-mix(in srgb, var(--color-success, #22c55e) 28%, transparent)",
              }}
            >
              Connected
            </span>
          ) : (
            <span
              className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 12%, transparent)",
                color: "var(--color-accent)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
              }}
            >
              Not connected
            </span>
          )}
        </div>
        <div>
          <div className="font-medium text-[var(--color-text)]">GitHub</div>
          <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
            Gives your Engineering specialist live awareness of open PRs, issues,
            and CI status from your repos — no copy-pasting required.
          </p>
        </div>
        {isConnected("github") ? (
          <div className="space-y-3">
            {githubConnectedMeta && (
              <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                <p>Connected as <span className="font-medium text-[var(--color-text)]">@{githubConnectedMeta.login}</span></p>
                {githubConnectedMeta.repos.length > 0 && (
                  <p>Repos: {githubConnectedMeta.repos.join(", ")}</p>
                )}
                {githubConnectedMeta.last_fetched_at && (
                  <p>Last synced: {new Date(githubConnectedMeta.last_fetched_at).toLocaleString()}</p>
                )}
              </div>
            )}
            <button
              onClick={() => disconnect("github")}
              disabled={disconnecting === "github"}
              className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              style={{
                background: "color-mix(in srgb, var(--color-destructive, #ef4444) 8%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-destructive, #ef4444) 25%, transparent)",
                color: "var(--color-destructive, #ef4444)",
              }}
            >
              <Link2Off size={12} />
              {disconnecting === "github" ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : isAvailable("github") ? (
          <a
            href="/api/conduit/connectors/github/auth"
            className="mt-auto w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 no-underline"
            style={{
              background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface-elevated))",
              border: "1px solid color-mix(in srgb, var(--color-accent) 25%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            <Link size={12} />
            Connect GitHub
          </a>
        ) : (
          <button
            disabled
            className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40 flex items-center justify-center gap-1.5"
            style={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Not configured
          </button>
        )}
      </div>

      {/* Coming soon — Notion */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)] mb-3">
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
                    background: "var(--color-surface-elevated)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Icon size={20} />
                </div>
                <span
                  className="text-[10px] uppercase tracking-[0.1em] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "color-mix(in srgb, var(--color-amber) 12%, transparent)",
                    color: "var(--color-amber)",
                    border: "1px solid color-mix(in srgb, var(--color-amber) 28%, transparent)",
                  }}
                >
                  Coming soon
                </span>
              </div>
              <div>
                <div className="font-medium text-[var(--color-text)]">{name}</div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {description}
                </p>
              </div>
              <button
                disabled
                className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed"
                style={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                Connect {name}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className="conduit-card p-5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-elevated)), var(--color-surface-elevated))",
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent-hi)] mb-2">
          More coming
        </div>
        <p className="serif text-xl">Zapier, Airtable, Linear, and more.</p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          Every integration ships with native Praxis actions — not generic
          webhooks. Want one prioritized?{" "}
          <a
            href="mailto:hello@conduitai.io"
            className="text-[var(--color-accent)] hover:underline"
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
      if (!stored && accentPref !== "ember") {
        localStorage.setItem(ACCENT_STORAGE_KEY, accentPref);
        const preset = ACCENT_PRESETS[accentPref] ?? ACCENT_PRESETS.ember;
        const s = document.documentElement.style;
        s.setProperty("--color-accent", preset.accent);
        s.setProperty("--color-accent-hi", preset.hi);
        s.setProperty("--color-accent-deep", preset.deep);
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAccent = (key: string) => {
    const preset = ACCENT_PRESETS[key] ?? ACCENT_PRESETS.ember;
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
    <div className="space-y-6 text-sm">
      <p className="text-[var(--color-text-muted)] max-w-xl">
        Choose how Praxis looks on this device. Changes apply immediately.
      </p>

      <div className="conduit-card p-5">
        <ThemeToggle initialPref={themePref} />
      </div>

      <div className="conduit-card p-5 space-y-4">
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
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
                className="flex flex-col items-center gap-1.5 group focus:outline-none"
              >
                <span
                  className="w-8 h-8 rounded-full transition-transform group-hover:scale-110"
                  style={{
                    background: preset.accent,
                    outline: active ? `3px solid ${preset.accent}` : "3px solid transparent",
                    outlineOffset: "2px",
                    boxShadow: active
                      ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${preset.accent}`
                      : "none",
                  }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.1em]"
                  style={{
                    color: active ? preset.accent : "var(--color-text-muted)",
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
          <p className="text-[11px] text-[var(--color-text-muted)]">Saving…</p>
        )}
        {accentError && (
          <p className="text-[11px] text-[var(--color-pink)]">{accentError}</p>
        )}
      </div>
    </div>
  );
}

function AlwaysOnRow({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-start justify-between gap-4 opacity-60">
      <div>
        <div className="flex items-center gap-1.5">
          {label}
          <span
            title={desc}
            className="cursor-help text-[var(--color-text-muted)]"
          >
            <Info size={12} />
          </span>
        </div>
        <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
          {desc}
        </div>
      </div>
      {/* Always-on toggle — locked on */}
      <div
        aria-label="Always on — cannot be disabled"
        title="Cannot be disabled"
        className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full cursor-not-allowed bg-[var(--color-accent)]"
      >
        <span className="inline-block h-5 w-5 transform rounded-full bg-white translate-x-5" />
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

function ApiKeysTab() {
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-1">API Keys</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Generate keys to access Praxis programmatically. Keys are shown once — store them securely.
        </p>
      </div>

      {/* New key banner (shown once after creation) */}
      {revealedKey && (
        <div className="conduit-card p-4 border border-[var(--color-accent)] rounded-xl">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-accent)] mb-2 font-semibold">
            New API key — copy it now
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-[var(--color-surface)] rounded-lg px-3 py-2 text-[var(--color-text)] break-all">
              {revealedKey}
            </code>
            <button
              type="button"
              onClick={copyKey}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-2 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hi)] transition-colors"
            >
              {copied ? <Check size={12} /> : <Lock size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
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
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-muted)] transition-colors"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-accent-hi)] transition-colors disabled:opacity-50"
        >
          {creating ? <SpinnerIcon /> : <ArrowRight size={14} />}
          Generate
        </button>
      </form>

      {/* Active keys */}
      {loading ? (
        <div className="text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : activeKeys.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No active API keys.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] font-semibold">
            Active keys
          </p>
          {activeKeys.map((k) => (
            <div
              key={k.id}
              className="conduit-card flex items-center gap-4 px-4 py-3 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">{k.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  <code className="font-mono">{k.key_preview}</code>
                  {" · Created "}
                  {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && (
                    <> · Last used {new Date(k.last_used_at).toLocaleDateString()}</>
                  )}
                  {!k.last_used_at && " · Never used"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(k.id)}
                disabled={revoking === k.id}
                aria-label={`Revoke key ${k.name}`}
                className="shrink-0 inline-flex items-center gap-1 text-xs rounded-lg px-3 py-1.5 text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors disabled:opacity-50"
              >
                <X size={12} />
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-muted)] font-semibold">
            Revoked keys
          </p>
          {revokedKeys.map((k) => (
            <div
              key={k.id}
              className="conduit-card flex items-center gap-4 px-4 py-3 rounded-xl opacity-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate line-through">
                  {k.name}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  <code className="font-mono">{k.key_preview}</code>
                  {" · Revoked "}
                  {k.revoked_at ? new Date(k.revoked_at).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="conduit-card p-4 rounded-xl text-sm text-[var(--color-text-muted)] space-y-1">
        <p className="font-medium text-[var(--color-text)]">Using API keys</p>
        <p>Include your key in the <code className="font-mono text-xs">Authorization</code> header:</p>
        <code className="block text-xs font-mono bg-[var(--color-surface)] rounded-lg px-3 py-2 mt-1">
          Authorization: Bearer prx_…
        </code>
        <p className="text-xs mt-2">Maximum 20 active keys per account.</p>
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
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8 text-sm">
      <div>
        <h2 className="text-lg font-semibold mb-1">Refer &amp; Earn</h2>
        <p className="text-[var(--color-text-muted)] max-w-xl">
          Share your personal link. When someone signs up and starts using Praxis,
          you both get bonus tokens.
        </p>
      </div>

      {/* Referral link */}
      <div className="conduit-card p-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Your referral link
        </div>
        {referralUrl ? (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralUrl}
              aria-label="Your referral link"
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none select-all cursor-text"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={copyLink}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs rounded-lg px-4 py-2 font-medium transition-colors"
              style={{
                background: copied ? "color-mix(in srgb, var(--color-accent) 15%, transparent)" : "var(--color-accent)",
                color: copied ? "var(--color-accent)" : "#fff",
                border: copied ? "1px solid var(--color-accent)" : "none",
              }}
            >
              {copied ? <><Check size={12} /> Copied!</> : <><Link size={12} /> Copy link</>}
            </button>
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)] text-xs">
            Your referral code is being generated — refresh in a moment.
          </p>
        )}
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Share this link with founders and operators. They get bonus tokens on their first session; you get bonus tokens once they&apos;re active.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
            Successful referrals
          </div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--color-accent)" }}>
            {data?.referral_count ?? 0}
          </div>
        </div>
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
            Bonus tokens earned
          </div>
          <div className="text-3xl font-semibold tabular-nums" style={{ color: "var(--color-accent)" }}>
            {(data?.total_earned ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="conduit-card p-5 space-y-3">
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          How it works
        </div>
        <ol className="space-y-2 text-[var(--color-text-muted)]">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>1</span>
            Share your link with another founder or operator.
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>2</span>
            They sign up and activate their workspace.
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "color-mix(in srgb, var(--color-accent) 15%, transparent)", color: "var(--color-accent)" }}>3</span>
            You both receive bonus tokens — added to your allowance automatically.
          </li>
        </ol>
      </div>
    </div>
  );
}
