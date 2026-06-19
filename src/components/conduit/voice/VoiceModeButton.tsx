"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { PraxisButton } from "@/components/conduit/ui/Button";
import { useToast } from "@/context/ToastContext";
import VoiceRoom, {
  type ParticipantDisplay,
  type VoiceTokenResponse,
} from "./VoiceRoom";

interface Props {
  employeeId: string;
  employeeName: string;
  employeeInitial: string;
  deptColor: string;
  // R12.5: optional roundtable wiring. mode === 'roundtable' triggers the
  // multi-employee flow; participants is the list (Atlas is silently
  // added server-side if absent); conversation_id links voice <-> text.
  mode?: "solo" | "roundtable";
  participants?: string[];
  conversationId?: string | null;
  participantDisplays?: ParticipantDisplay[];
  /** Override the trigger button label (e.g. "Voice mode" on chat header). */
  label?: string;
}

export default function VoiceModeButton({
  employeeId,
  employeeName,
  employeeInitial,
  deptColor,
  mode,
  participants,
  conversationId,
  participantDisplays,
  label,
}: Props) {
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const [token, setToken] = useState<VoiceTokenResponse | null>(null);

  async function start() {
    setRequesting(true);
    try {
      // Request mic permission up front so the user-gesture window is open
      // when LiveKit later calls setMicrophoneEnabled.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((t) => t.stop());

      const body: Record<string, unknown> = { employee_id: employeeId };
      if (mode) body.mode = mode;
      if (participants && participants.length > 0)
        body.participants = participants;
      if (conversationId) body.conversation_id = conversationId;
      const res = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        if (res.status === 503) {
          toast.error(err.message ?? "Voice mode is being set up. Try again shortly.");
        } else if (res.status === 429) {
          toast.error(err.message ?? "Daily voice cap reached.");
        } else if (res.status === 403) {
          toast.error("Voice Mode requires a paid tier.");
        } else {
          toast.error(err.error ?? "Couldn't start voice mode.");
        }
        return;
      }
      const json = (await res.json()) as VoiceTokenResponse;
      setToken(json);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (
        e.name === "NotAllowedError" ||
        e.name === "PermissionDeniedError" ||
        e.name === "SecurityError"
      ) {
        toast.error("Mic permission denied — enable in browser settings.");
      } else {
        toast.error(e.message ?? "Couldn't start voice mode.");
      }
    } finally {
      setRequesting(false);
    }
  }

  return (
    <>
      <PraxisButton
        type="button"
        variant="secondary"
        size="sm"
        onClick={start}
        disabled={requesting}
        title="Live voice conversation"
      >
        <Mic size={14} style={{ color: deptColor }} />
        {requesting ? "Connecting…" : (label ?? "Voice Mode")}
      </PraxisButton>

      {token && (
        <VoiceRoom
          tokenResponse={token}
          employeeName={employeeName}
          employeeInitial={employeeInitial}
          deptColor={deptColor}
          participantDisplays={participantDisplays}
          onClose={({ saved }) => {
            setToken(null);
            if (saved) {
              toast.success({
                title: "Conversation saved.",
                action: {
                  label: "View transcript",
                  onClick: () => window.location.assign("/app/conversations"),
                },
              });
            }
          }}
        />
      )}
    </>
  );
}
