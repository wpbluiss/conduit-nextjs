"use client";

import { useState, useEffect, useTransition } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button, SpinnerIcon } from "@/components/conduit/ui/Button";

type MFAState =
  | { phase: "loading" }
  | { phase: "idle"; enrolled: false }
  | { phase: "idle"; enrolled: true; factorId: string }
  | { phase: "enrolling"; factorId: string; qrDataUrl: string; secret: string; uri: string }
  | { phase: "verifying"; factorId: string; qrDataUrl: string; secret: string }
  | { phase: "disabling"; factorId: string }
  | { phase: "backup-codes"; factorId: string; codes: string[] }
  | { phase: "regenerating"; factorId: string };

function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      disabled={disabled}
      placeholder="000000"
      className="w-full cx-input text-center cx-type-xl cx-mono tracking-[0.4em] disabled:opacity-50"
    />
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="cx-glass cx-glass-border rounded-xl p-5">
      {children}
    </div>
  );
}

function BackupCodesGrid({ codes }: { codes: string[] }) {
  const formatted = codes.map((c) => `${c.slice(0, 5)} ${c.slice(5)}`);

  function copyAll() {
    navigator.clipboard.writeText(formatted.join("\n"));
  }

  function download() {
    const text = [
      "Praxis backup codes — keep these safe, each can only be used once.",
      "",
      ...formatted,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "praxis-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {formatted.map((c) => (
          <div
            key={c}
            className="rounded-lg px-3 py-2 text-center cx-mono cx-type-sm tracking-widest select-all"
            style={{
              background: "var(--cx-surface)",
              border: "1px solid var(--cx-border)",
              color: "var(--cx-text)",
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={copyAll} className="flex-1 justify-center">
          <Copy size={13} strokeWidth={1.75} /> Copy all
        </Button>
        <Button variant="secondary" size="sm" onClick={download} className="flex-1 justify-center">
          <Download size={13} strokeWidth={1.75} /> Download
        </Button>
      </div>
    </div>
  );
}

export function MFASecurity() {
  const [state, setState] = useState<MFAState>({ phase: "loading" });
  const [code, setCode] = useState("");
  const [disableConfirm, setDisableConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadFactors();
  }, []);

  async function loadFactors() {
    setState({ phase: "loading" });
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) {
      setState({ phase: "idle", enrolled: false });
      return;
    }
    const verified = data.totp.find((f: { id: string; status: string }) => f.status === "verified");
    if (verified) {
      setState({ phase: "idle", enrolled: true, factorId: verified.id });
    } else {
      setState({ phase: "idle", enrolled: false });
    }
  }

  async function startEnrollment() {
    setError(null);
    setCode("");
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) {
        setError(error?.message ?? "Failed to start enrollment. Try again.");
        return;
      }
      const { id, totp } = data;
      const qrDataUrl = await QRCode.toDataURL(totp.uri, { margin: 1, width: 200 });
      setState({
        phase: "enrolling",
        factorId: id,
        qrDataUrl,
        secret: totp.secret,
        uri: totp.uri,
      });
    });
  }

  async function verifyEnrollment() {
    if (state.phase !== "enrolling" && state.phase !== "verifying") return;
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
        factorId: state.factorId,
      });
      if (cErr || !challenge) {
        setError(cErr?.message ?? "Challenge failed. Try again.");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: state.factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) {
        setError("Incorrect code. Check your authenticator app and try again.");
        setCode("");
        return;
      }

      // Generate backup codes immediately after enrollment
      const res = await fetch("/api/conduit/auth/backup-codes", { method: "POST" });
      const json = await res.json();
      setCode("");
      if (res.ok && json.codes) {
        setState({ phase: "backup-codes", factorId: state.factorId, codes: json.codes });
      } else {
        setSuccess("Two-factor authentication is now enabled.");
        await loadFactors();
      }
    });
  }

  async function generateNewCodes() {
    if (state.phase !== "idle" || !state.enrolled) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/conduit/auth/backup-codes", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.codes) {
        setState({ phase: "backup-codes", factorId: state.factorId, codes: json.codes });
      } else {
        setError("Failed to generate backup codes. Try again.");
      }
    });
  }

  async function disableMFA() {
    if (state.phase !== "disabling") return;
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: state.factorId });
      if (error) {
        setError(error.message ?? "Failed to disable 2FA. Try again.");
        return;
      }
      // Clear backup codes when MFA is disabled
      await fetch("/api/conduit/auth/backup-codes", { method: "DELETE" });
      setSuccess("Two-factor authentication has been disabled.");
      setDisableConfirm("");
      await loadFactors();
    });
  }

  function cancelDisable() {
    if ("factorId" in state && state.phase === "disabling") {
      setState({ phase: "idle", enrolled: true, factorId: state.factorId });
      setDisableConfirm("");
      setError(null);
    }
  }

  if (state.phase === "loading") {
    return (
      <div className="flex items-center gap-2 cx-type-base text-[var(--cx-text-muted)]">
        <SpinnerIcon size={14} />
        Loading security settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="cx-type-md font-semibold text-[var(--cx-text)]">
          Two-factor authentication
        </h2>
        <p className="mt-1 cx-type-base text-[var(--cx-text-muted)]">
          Add a second layer of security using an authenticator app (Google Authenticator, 1Password, Authy, etc.).
        </p>
      </div>

      {success && (
        <div
          className="rounded-lg px-4 py-3 cx-type-base"
          style={{ background: "color-mix(in srgb, var(--cx-reward) 12%, transparent)", color: "var(--cx-reward)", border: "1px solid color-mix(in srgb, var(--cx-reward) 30%, transparent)" }}
        >
          {success}
        </div>
      )}

      {/* ── Enabled state ── */}
      {state.phase === "idle" && state.enrolled && (
        <>
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1 cx-type-xs font-semibold uppercase tracking-[0.12em]"
                    style={{ background: "color-mix(in srgb, var(--cx-reward) 15%, transparent)", color: "var(--cx-reward)" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Enabled
                  </span>
                </div>
                <p className="mt-2 cx-type-base text-[var(--cx-text-muted)]">
                  Authenticator app — your account is protected with TOTP.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="shrink-0"
                onClick={() => { setError(null); setState({ phase: "disabling", factorId: state.factorId }); }}
              >
                Disable
              </Button>
            </div>
          </SectionCard>

          {/* Backup codes management */}
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="cx-type-base font-medium text-[var(--cx-text)]">
                  Backup codes
                </p>
                <p className="mt-1 cx-type-base text-[var(--cx-text-muted)]">
                  Use a one-time backup code if you lose access to your authenticator app.
                  Each code works once.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={generateNewCodes}
                isLoading={isPending}
                loadingText="Regenerating…"
                isDisabled={isPending}
              >
                Regenerate
              </Button>
            </div>
            {error && <p className="mt-2 cx-type-xs text-[var(--cx-danger)]">{error}</p>}
          </SectionCard>
        </>
      )}

      {/* ── Backup codes reveal ── */}
      {state.phase === "backup-codes" && (
        <SectionCard>
          <h3 className="cx-type-base font-semibold text-[var(--cx-text)]">
            Save your backup codes
          </h3>
          <p className="mt-1.5 cx-type-base text-[var(--cx-text-muted)]">
            Each code can only be used once. Store them somewhere safe — they won't be shown again.
          </p>
          <BackupCodesGrid codes={state.codes} />
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              setSuccess("Two-factor authentication is now enabled.");
              await loadFactors();
            }}
            className="mt-4 w-full justify-center"
          >
            I&apos;ve saved my codes — done
          </Button>
        </SectionCard>
      )}

      {/* ── Disable confirm ── */}
      {state.phase === "disabling" && (
        <SectionCard>
          <h3 className="cx-type-base font-semibold text-[var(--cx-danger)]">
            Disable two-factor authentication
          </h3>
          <p className="mt-1.5 cx-type-base text-[var(--cx-text-muted)]">
            This removes the additional security layer from your account. Type <strong>DISABLE</strong> to confirm.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block cx-label text-[var(--cx-text-muted)] cx-mono">
              Type DISABLE to confirm
            </span>
            <input
              value={disableConfirm}
              onChange={(e) => setDisableConfirm(e.target.value)}
              placeholder="DISABLE"
              className="w-full cx-input"
            />
          </label>
          {error && <p className="mt-2 cx-type-xs text-[var(--cx-danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelDisable}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isDisabled={isPending || disableConfirm !== "DISABLE"}
              isLoading={isPending}
              loadingText="Disabling…"
              onClick={disableMFA}
            >
              Disable 2FA
            </Button>
          </div>
        </SectionCard>
      )}

      {/* ── Not enrolled ── */}
      {state.phase === "idle" && !state.enrolled && (
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="cx-type-base font-medium text-[var(--cx-text)]">
                Not configured
              </p>
              <p className="mt-1 cx-type-base text-[var(--cx-text-muted)]">
                Enable 2FA to protect your account with a time-based one-time password.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={startEnrollment}
              isLoading={isPending}
              isDisabled={isPending}
              className="shrink-0"
            >
              Enable 2FA
            </Button>
          </div>
        </SectionCard>
      )}

      {/* ── Enrollment: scan QR ── */}
      {state.phase === "enrolling" && (
        <SectionCard>
          <h3 className="cx-type-base font-semibold mb-4 text-[var(--cx-text)]">
            Step 1 — Scan with your authenticator app
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div
              className="rounded-xl p-3"
              style={{ background: "white", display: "inline-block" }}
            >
              <img
                src={state.qrDataUrl}
                alt="TOTP QR code"
                width={200}
                height={200}
                className="block"
              />
            </div>
            <div className="w-full">
              <p className="cx-type-xs text-center mb-2 text-[var(--cx-text-muted)]">
                Can't scan? Enter this key manually:
              </p>
              <p
                className="text-center cx-type-sm cx-mono tracking-widest select-all rounded-lg px-3 py-2 text-[var(--cx-text)]"
                style={{ background: "var(--cx-surface-raised)", border: "1px solid var(--cx-border)", wordBreak: "break-all" }}
              >
                {state.secret}
              </p>
            </div>
          </div>
          <p className="mt-5 cx-type-base font-medium text-[var(--cx-text)]">
            Step 2 — Enter the 6-digit code from your app
          </p>
          <div className="mt-3">
            <CodeInput value={code} onChange={setCode} disabled={isPending} />
          </div>
          {error && <p className="mt-2 cx-type-xs text-[var(--cx-danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setState({ phase: "idle", enrolled: false }); setError(null); setCode(""); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isDisabled={isPending || code.length !== 6}
              isLoading={isPending}
              loadingText="Verifying…"
              onClick={verifyEnrollment}
            >
              Verify &amp; enable
            </Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
