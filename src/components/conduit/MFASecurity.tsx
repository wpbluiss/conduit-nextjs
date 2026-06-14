"use client";

import { useState, useEffect, useTransition } from "react";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { SpinnerIcon } from "./PraxisButton";

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
      className="w-full rounded-lg px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none transition-all duration-200 font-mono disabled:opacity-50"
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text)",
      }}
    />
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-elevated)",
      }}
    >
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
      <div className="grid grid-cols-2 gap-1.5">
        {formatted.map((c) => (
          <div
            key={c}
            className="rounded-lg px-3 py-2 text-center font-mono text-sm tracking-widest select-all"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyAll}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Copy size={13} /> Copy all
        </button>
        <button
          type="button"
          onClick={download}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <Download size={13} /> Download
        </button>
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
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
        <SpinnerIcon size={14} />
        Loading security settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          Two-factor authentication
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Add a second layer of security using an authenticator app (Google Authenticator, 1Password, Authy, etc.).
        </p>
      </div>

      {success && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "color-mix(in srgb, #30a46c 12%, transparent)", color: "#30a46c", border: "1px solid color-mix(in srgb, #30a46c 30%, transparent)" }}
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
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ background: "color-mix(in srgb, #30a46c 15%, transparent)", color: "#30a46c" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    Enabled
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Authenticator app — your account is protected with TOTP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setError(null); setState({ phase: "disabling", factorId: state.factorId }); }}
                className="shrink-0 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{ background: "color-mix(in srgb, #e5484d 12%, transparent)", color: "#f0888c", border: "1px solid color-mix(in srgb, #e5484d 30%, transparent)" }}
              >
                Disable
              </button>
            </div>
          </SectionCard>

          {/* Backup codes management */}
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  Backup codes
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Use a one-time backup code if you lose access to your authenticator app.
                  Each code works once.
                </p>
              </div>
              <button
                type="button"
                onClick={generateNewCodes}
                disabled={isPending}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {isPending ? <SpinnerIcon size={14} /> : "Regenerate"}
              </button>
            </div>
            {error && <p className="mt-2 text-xs" style={{ color: "#f0888c" }}>{error}</p>}
          </SectionCard>
        </>
      )}

      {/* ── Backup codes reveal ── */}
      {state.phase === "backup-codes" && (
        <SectionCard>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            Save your backup codes
          </h3>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Each code can only be used once. Store them somewhere safe — they won't be shown again.
          </p>
          <BackupCodesGrid codes={state.codes} />
          <button
            type="button"
            onClick={async () => {
              setSuccess("Two-factor authentication is now enabled.");
              await loadFactors();
            }}
            className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium btn-primary"
          >
            I've saved my codes — done
          </button>
        </SectionCard>
      )}

      {/* ── Disable confirm ── */}
      {state.phase === "disabling" && (
        <SectionCard>
          <h3 className="text-sm font-semibold" style={{ color: "#f0888c" }}>
            Disable two-factor authentication
          </h3>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            This removes the additional security layer from your account. Type <strong>DISABLE</strong> to confirm.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              Type DISABLE to confirm
            </span>
            <input
              value={disableConfirm}
              onChange={(e) => setDisableConfirm(e.target.value)}
              placeholder="DISABLE"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
            />
          </label>
          {error && <p className="mt-2 text-xs" style={{ color: "#f0888c" }}>{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={cancelDisable}
              className="rounded-lg px-4 py-2 text-sm transition-opacity"
              style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || disableConfirm !== "DISABLE"}
              onClick={disableMFA}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "#e5484d", color: "#fff" }}
            >
              {isPending ? "Disabling…" : "Disable 2FA"}
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Not enrolled ── */}
      {state.phase === "idle" && !state.enrolled && (
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                Not configured
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Enable 2FA to protect your account with a time-based one-time password.
              </p>
            </div>
            <button
              type="button"
              onClick={startEnrollment}
              disabled={isPending}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-50 btn-primary"
            >
              {isPending ? <SpinnerIcon size={14} /> : "Enable 2FA"}
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Enrollment: scan QR ── */}
      {state.phase === "enrolling" && (
        <SectionCard>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Step 1 — Scan with your authenticator app
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div
              className="rounded-xl p-3"
              style={{ background: "#fff", display: "inline-block" }}
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
              <p className="text-xs text-center mb-2" style={{ color: "var(--color-text-muted)" }}>
                Can't scan? Enter this key manually:
              </p>
              <p
                className="text-center text-sm font-mono tracking-widest select-all rounded-lg px-3 py-2"
                style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text)", wordBreak: "break-all" }}
              >
                {state.secret}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium" style={{ color: "var(--color-text)" }}>
            Step 2 — Enter the 6-digit code from your app
          </p>
          <div className="mt-3">
            <CodeInput value={code} onChange={setCode} disabled={isPending} />
          </div>
          {error && <p className="mt-2 text-xs" style={{ color: "#f0888c" }}>{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => { setState({ phase: "idle", enrolled: false }); setError(null); setCode(""); }}
              className="rounded-lg px-4 py-2 text-sm transition-opacity"
              style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || code.length !== 6}
              onClick={verifyEnrollment}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40 btn-primary"
            >
              {isPending ? (
                <span className="flex items-center gap-1.5"><SpinnerIcon size={14} />Verifying…</span>
              ) : "Verify & enable"}
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
