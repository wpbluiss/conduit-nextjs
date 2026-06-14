"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ExternalLink,
  Lock,
  Play,
  X,
} from "lucide-react";
import { PraxisButton, SpinnerIcon } from "./PraxisButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { EmployeeKey } from "@/lib/ai/provider";
import { DEPT_COLOR, employeeLabel } from "./EmployeeBadge";
import { useToast } from "@/context/ToastContext";
import { ORDERED_TIERS, TOPUPS, tierById, type TierId } from "@/lib/billing/tiers";
import { DEFAULT_EMPLOYEE_VOICES, VOICE_NAMES } from "@/lib/voice/defaults";
import { ThemeToggle } from "./ThemeToggle";
import { track } from "@/lib/analytics/track";
import { MFASecurity } from "./MFASecurity";

interface UsageData {
  totals: { input: number; output: number; cost: number };
  byEmployee: Record<string, { input: number; output: number; cost: number }>;
  byDay: Record<string, number>;
  today: { input: number; output: number; cost: number };
  thisWeek: { input: number; output: number; cost: number };
  cap: { used: number; limit: number };
  buildsThisCycle?: number;
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
  | "security";

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
}: {
  email: string;
  fullName: string;
  creatorMode: boolean;
  creatorModeVersion: number;
  timezone: string;
  themePref: "system" | "light" | "dark";
}) {
  const [tz, setTz] = useState(timezone);
  const [tzSaving, setTzSaving] = useState(false);
  const [tzSaved, setTzSaved] = useState(false);
  const router = useRouter();
  const toast = useToast();

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

  return (
    <div className="space-y-8 text-sm">
      {/* ── Account info ── */}
      <div className="space-y-4">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)] mb-1">
            Name
          </div>
          <div>{fullName || "—"}</div>
        </div>
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
    </div>
  );
}

function BusinessTab({ account }: { account: AccountData }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(account.name);
  const [businessType, setBusinessType] = useState(account.business_type);
  const [description, setDescription] = useState(account.business_description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
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
  );
}

function UsageTab({ usage }: { usage: UsageData }) {
  const days = Object.keys(usage.byDay).sort();
  const last14 = days.slice(-14);
  const fillByDay = last14.map((d) => ({ d, v: usage.byDay[d] }));
  const max = Math.max(1, ...fillByDay.map((x) => x.v));
  const empNames: EmployeeKey[] = ["jarvis", "marketing", "sales", "engineering"];
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

function BillingTab({
  account,
  usage,
}: {
  account: AccountData;
  usage: UsageData;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tier = tierById(account.tier_id ?? "free");
  const internal = Boolean(account.internal_account);

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
      <div className="conduit-card p-6 flex items-center justify-between gap-4">
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
            Manage in Stripe
            <ExternalLink size={12} />
          </PraxisButton>
        )}
      </div>

      <UsageSummary
        usage={usage}
        cap={tier.monthlyTokenAllowance}
        bonus={account.bonus_tokens ?? 0}
      />

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
    </div>
  );
}

function UsageSummary({
  usage,
  cap,
  bonus,
}: {
  usage: UsageData;
  cap: number;
  bonus: number;
}) {
  const used = usage.cap.used;
  const total = cap + bonus;
  const pct = Math.min(100, Math.round((used / Math.max(1, total)) * 100));
  return (
    <div className="conduit-card p-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          Tokens this cycle
        </span>
        <span className="text-sm">
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background:
              pct >= 100
                ? "var(--color-pink)"
                : pct >= 80
                  ? "var(--color-amber)"
                  : "var(--color-accent)",
          }}
        />
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
