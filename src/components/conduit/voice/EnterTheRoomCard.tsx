"use client";

// "Enter the room" hero on /app/voice. Mints a roundtable token with the
// full set of employees the caller's tier allows, then mounts the existing
// multi-avatar VoiceRoom overlay. Atlas is the moderator; "team", "everyone",
// "go around" round-robin trigger phrases handled by the worker per R12.5.

import { useState } from "react";
import { Mic, Lock, AlertCircle } from "lucide-react";
import { Button, PraxisButton } from "@/components/conduit/ui/Button";
import VoiceRoom, {
  type ParticipantDisplay,
  type VoiceTokenResponse,
} from "./VoiceRoom";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";

interface Props {
  participants: EmployeeId[];
  // When false, render a locked variant pointing at billing.
  available: boolean;
  // Used in copy: "Pro plan · 4 in the room", "Internal · full team", etc.
  tierLabel: string;
  conversationId?: string | null;
}

export default function EnterTheRoomCard({
  participants,
  available,
  tierLabel,
  conversationId,
}: Props) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<VoiceTokenResponse | null>(null);

  const displays: ParticipantDisplay[] = participants.map((p) => ({
    id: p,
    name: EMPLOYEES[p].name,
    initial: EMPLOYEES[p].initial,
    color: EMPLOYEES[p].color,
  }));

  // Atlas is always the visible primary employee for the room — the worker
  // treats it as the moderator. Token route silently re-adds it if missing.
  const primary = "jarvis" as EmployeeId;
  const primaryMeta = EMPLOYEES[primary];

  async function start() {
    if (!available || requesting) return;
    setError(null);
    setRequesting(true);
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());

      const r = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employee_id: primary,
          mode: "roundtable",
          participants,
          conversation_id: conversationId ?? null,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        if (r.status === 503) {
          setError(j.message ?? "Voice mode is being set up.");
        } else if (r.status === 429) {
          setError(j.message ?? "Daily voice cap reached.");
        } else if (r.status === 403) {
          setError(j.message ?? "Voice Mode requires a paid tier.");
        } else {
          setError(j.error ?? "Couldn't start voice mode.");
        }
        return;
      }
      const json = (await r.json()) as VoiceTokenResponse;
      setToken(json);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (
        e.name === "NotAllowedError" ||
        e.name === "PermissionDeniedError" ||
        e.name === "SecurityError"
      ) {
        setError("Mic permission denied — enable in browser settings.");
      } else {
        setError(e.message ?? "Couldn't start voice mode.");
      }
    } finally {
      setRequesting(false);
    }
  }

  if (!available) {
    return (
      <div className="conduit-card p-6 md:p-7 mb-10 border border-[var(--color-border)] flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-surface-elevated)]">
          <Lock size={20} className="text-[var(--color-accent-hi)]" />
        </div>
        <div className="flex-1">
          <div className="cx-type-xs uppercase tracking-[0.2em] text-[var(--color-accent-hi)] mb-1">
            Pro perk
          </div>
          <h2 className="serif text-2xl mb-1">Enter the room</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Get the whole team on the line. Atlas moderates; say{" "}
            <span className="text-[var(--color-text)]">team</span> for a
            round-robin or address an employee directly. Available on Pro and up.
          </p>
        </div>
        <a
          href="/app/settings/billing"
          className="btn-primary btn-sz-sm shrink-0"
        >
          Upgrade
        </a>
      </div>
    );
  }

  return (
    <>
      <div
        className="conduit-card p-6 md:p-7 mb-10 flex flex-col md:flex-row items-start md:items-center gap-5"
        style={{
          background: `linear-gradient(135deg, ${primaryMeta.colorSoft}, transparent 65%)`,
          borderColor: "var(--color-accent)",
        }}
      >
        <AvatarStack displays={displays} />
        <div className="flex-1 min-w-0">
          <div className="cx-type-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-1 inline-flex items-center gap-2">
            <span className="live-dot" aria-hidden /> {tierLabel}
          </div>
          <h2 className="serif text-2xl md:text-3xl mb-1">Enter the room</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Talk to your whole team at once. Address anyone, or say{" "}
            <span className="text-[var(--color-text)]">team</span> for a
            round-robin. Atlas closes.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={start}
          isLoading={requesting}
          loadingText="Connecting…"
          className="shrink-0"
        >
          <Mic size={14} />
          Enter the room
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[70] max-w-sm text-sm bg-red-950/90 border border-red-500/40 rounded-md px-3 py-2 text-red-100 inline-flex items-start gap-2 shadow-lg"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div>
            <div>{error}</div>
            <PraxisButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
            >
              dismiss
            </PraxisButton>
          </div>
        </div>
      )}

      {token && (
        <VoiceRoom
          tokenResponse={token}
          employeeName={primaryMeta.name}
          employeeInitial={primaryMeta.initial}
          deptColor={primaryMeta.color}
          participantDisplays={displays}
          onClose={() => setToken(null)}
        />
      )}
    </>
  );
}

function AvatarStack({ displays }: { displays: ParticipantDisplay[] }) {
  // Cap visible avatars at 5; show +N for the rest. Keeps the hero card
  // tight on small screens.
  const max = 5;
  const visible = displays.slice(0, max);
  const overflow = displays.length - visible.length;
  return (
    <div className="flex items-center -space-x-2 shrink-0">
      {visible.map((d) => (
        <div
          key={d.id}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-base serif border-2 border-[var(--color-bg)]"
          style={{ background: d.color, color: "var(--cx-canvas)" }}
          title={d.name}
        >
          {d.initial}
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs serif border-2 border-[var(--color-bg)] bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
          title={`+${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
