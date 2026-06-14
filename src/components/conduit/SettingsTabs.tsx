"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Info,
  Lock,
  Play,
  X,
} from "lucide-react";
import { PraxisButton, SpinnerIcon } from "./PraxisButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { EmployeeKey } from "@/lib/ai/provider";
import { EMPLOYEE_ORDER } from "@/lib/conduit/employees";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
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
  | "business"
  | "voice"
  | "team"
  | "usage"
  | "billing"
  | "security"
  | "notifications"
  | "integrations"
  | "appearance"
  | "api";

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
            ["business", "Business"],
            ["voice", "Voice"],
            ["team", "Team"],
            ["usage", "Usage"],
            ["billing", "Billing"],
            ["security", "Security"],
            ["notifications", "Notifications"],
            ["integrations", "Integrations"],
            ["appearance", "Appearance"],
            ["api", "API"],
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
        />
      )}
      {tab === "business" && <BusinessTab account={account} />}
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
}: {
  email: string;
  fullName: string;
  creatorMode: boolean;
  creatorModeVersion: number;
  timezone: string;
  themePref: "system" | "light" | "dark";
  displayName: string | null;
  avatarUrl: string | null;
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
  const days = Object.keys(usage.byDay).sort();
  const last14 = days.slice(-14);
  const fillByDay = last14.map((d) => ({ d, v: usage.byDay[d] }));
  const max = Math.max(1, ...fillByDay.map((x) => x.v));
  const empNames = EMPLOYEE_ORDER as EmployeeKey[];
  const empValues = empNames.map((emp) => ({
    emp,
    val: (usage.byEmployee[emp]?.input ?? 0) + (usage.byEmployee[emp]?.output ?? 0),
  }));
  const empTotal = Math.max(1, empValues.reduce((s, x) => s + x.val, 0));

  const capPct = Math.min(
    100,
    Math.round((usage.cap.used / Math.max(1, usage.cap.limit)) * 100),
  );

  return (
    <div className="space-y-8 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Today" value={`$${(usage.today.cost / 100).toFixed(2)}`} sub={`${(usage.today.input + usage.today.output).toLocaleString()} tokens`} />
        <Stat label="This week" value={`$${(usage.thisWeek.cost / 100).toFixed(2)}`} sub={`${(usage.thisWeek.input + usage.thisWeek.output).toLocaleString()} tokens`} />
        <Stat label="This month" value={`$${(usage.totals.cost / 100).toFixed(2)}`} sub={`${(usage.totals.input + usage.totals.output).toLocaleString()} tokens`} />
        <Stat
          label="Builds"
          value={String(usage.buildsThisCycle ?? 0)}
          sub="This cycle"
        />
      </div>

      <div className="conduit-card px-5 py-4">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Token cap (this cycle)
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

      <div>
        <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
          Tokens · last 14 days
        </div>
        {fillByDay.length === 0 ? (
          <p className="text-[var(--color-text-muted)]">No usage yet.</p>
        ) : (
          <div className="conduit-card p-4">
            <div className="flex items-end gap-1 h-32">
              {fillByDay.map(({ d, v }) => {
                const h = Math.round((v / max) * 100);
                return (
                  <div
                    key={d}
                    title={`${d}: ${v.toLocaleString()} tokens`}
                    className="flex-1 rounded-t-md bg-[var(--color-accent)] opacity-70 hover:opacity-100 transition-opacity"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="conduit-card p-5">
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-3">
            Share by employee
          </div>
          {empTotal === 1 ? (
            <p className="text-[var(--color-text-muted)]">No usage yet.</p>
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
              const v = usage.byEmployee[emp];
              if (!v) return null;
              return (
                <div
                  key={emp}
                  className="flex items-center justify-between"
                >
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
            {empNames.every((e) => !usage.byEmployee[e]) && (
              <p className="text-[var(--color-text-muted)] text-xs">
                No usage yet.
              </p>
            )}
          </div>
        </div>
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
  const tier = tierById(account.tier_id ?? "free");
  const internal = Boolean(account.internal_account);

  useEffect(() => {
    if (!account.has_stripe_customer) return;
    fetch("/api/conduit/billing/invoices")
      .then((r) => r.ok ? r.json() : null)
      .then((j) => j && setInvoices(j.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [account.has_stripe_customer]);

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
            {(account.subscription_status ?? "inactive").replace(
              "_",
              " ",
            )}
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
        </div>
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
      </div>

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
}

const NOTIF_DEFAULTS: NotificationPrefs = {
  product_updates: true,
  weekly_digest: true,
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
      if (!r.ok) setError("Couldn't save preference.");
    } catch {
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
          label="Weekly financial digest"
          desc="A weekly summary of your spending and AI activity (coming soon)."
          value={prefs.weekly_digest}
          onChange={() => toggle("weekly_digest")}
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

type IntegrationDef = {
  name: string;
  description: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
};

const INTEGRATIONS: IntegrationDef[] = [
  {
    name: "GitHub",
    description:
      "Let Praxis Engineering open PRs, push commits, and read repository context directly from your GitHub account.",
    Icon: BrandMarkGithub,
  },
  {
    name: "Slack",
    description:
      "Receive build updates, specialist summaries, and workflow notifications in any Slack channel.",
    Icon: BrandMarkSlack,
  },
  {
    name: "Notion",
    description:
      "Sync Praxis outputs — briefs, reports, SOPs — directly to your Notion workspace as formatted pages.",
    Icon: BrandMarkNotion,
  },
];

function IntegrationsTab() {
  return (
    <div className="space-y-6 text-sm">
      <p className="text-[var(--color-text-muted)] max-w-xl">
        Connect your tools so Praxis can act on your behalf — pushing code,
        sending messages, and syncing outputs without copy-paste.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INTEGRATIONS.map(({ name, description, Icon }) => (
          <div
            key={name}
            className="conduit-card p-5 flex flex-col gap-4"
          >
            {/* Header row */}
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
                  background:
                    "color-mix(in srgb, var(--color-amber) 12%, transparent)",
                  color: "var(--color-amber)",
                  border:
                    "1px solid color-mix(in srgb, var(--color-amber) 28%, transparent)",
                }}
              >
                Coming soon
              </span>
            </div>

            {/* Name + description */}
            <div>
              <div className="font-medium text-[var(--color-text)]">{name}</div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                {description}
              </p>
            </div>

            {/* Placeholder connect button */}
            <button
              disabled
              className="mt-auto w-full py-2 rounded-lg text-xs font-medium cursor-not-allowed opacity-40"
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
