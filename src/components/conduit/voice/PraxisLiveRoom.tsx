"use client";

/**
 * PraxisLiveRoom — ember-skinned multi-agent voice room. Reuses the real
 * LiveKit connection logic from VoiceRoom (token, audio tracks, worker
 * `active_speaker` + `transcript` data events, session timer/caps) but wears
 * the new ember identity: employee orbs, active-speaker spotlight, waveforms.
 * Mounted by the /chat "Live" button. The existing VoiceRoom (/app) is
 * untouched.
 */

import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  Room, RoomEvent, Track,
  type LocalTrackPublication, type RemoteTrack, type RemoteParticipant,
  type RemoteTrackPublication, type LocalAudioTrack, type RemoteAudioTrack,
} from "livekit-client";
import {
  Mic, MicOff, PhoneOff, AlertCircle,
  Sparkles, Code2, TrendingUp, Megaphone, DollarSign, Wrench, ShieldCheck, Users, Scale,
} from "lucide-react";
import { PraxisButton } from "@/components/conduit/PraxisButton";
import Waveform from "./Waveform";
import { EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import type { VoiceTokenResponse } from "./VoiceRoom";

type Icon = ComponentType<{ className?: string }>;
const ICON: Record<EmployeeId, Icon> = {
  jarvis: Sparkles, engineering: Code2, sales: TrendingUp, marketing: Megaphone,
  finance: DollarSign, ops: Wrench, compliance: ShieldCheck, hr: Users, legal: Scale,
};

interface TranscriptEntry { id: string; role: "user" | "agent"; text: string; speakerId?: string; ts: number; }

function setupAnalyser(track: LocalAudioTrack | RemoteAudioTrack): AnalyserNode | null {
  const mst = track.mediaStreamTrack; if (!mst) return null;
  type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const src = ctx.createMediaStreamSource(new MediaStream([mst]));
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.8;
  src.connect(analyser);
  if (ctx.state === "suspended") void ctx.resume();
  return analyser;
}
function fmtTime(s: number): string { const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, "0")}`; }

export default function PraxisLiveRoom({
  tokenResponse, onClose,
}: {
  tokenResponse: VoiceTokenResponse;
  onClose: (info: { saved: boolean }) => void;
}) {
  const ids = ((tokenResponse.participants && tokenResponse.participants.length > 0
    ? tokenResponse.participants
    : [tokenResponse.employee_id]) as EmployeeId[]).filter((id) => id in EMPLOYEES);

  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [agentPresent, setAgentPresent] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeSpeaker, setActiveSpeaker] = useState<EmployeeId>(ids[0] ?? "jarvis");

  const roomRef = useRef<Room | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);

  useEffect(() => {
    const room = new Room({
      adaptiveStream: true, dynacast: true,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    });
    roomRef.current = room;

    const onLocalPublished = (pub: LocalTrackPublication) => {
      if (pub.track && pub.track.kind === Track.Kind.Audio) userAnalyserRef.current = setupAnalyser(pub.track as LocalAudioTrack);
    };
    const onRemoteSubscribed = (track: RemoteTrack, _p: RemoteTrackPublication, _pt: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio) {
        const elem = track.attach(); elem.style.display = "none"; document.body.appendChild(elem);
        audioElementsRef.current.push(elem);
        void elem.play().catch(() => {});
        agentAnalyserRef.current = setupAnalyser(track as RemoteAudioTrack);
        setAgentPresent(true);
      }
    };
    const onParticipantConnected = (p: RemoteParticipant) => { if (p.identity?.startsWith("agent-") || p.identity?.startsWith("conduit-")) setAgentPresent(true); };
    const onParticipantDisconnected = (p: RemoteParticipant) => { if (p.identity?.startsWith("agent-") || p.identity?.startsWith("conduit-")) setAgentPresent(false); };
    const onData = (payload: Uint8Array) => {
      try {
        const event = JSON.parse(new TextDecoder().decode(payload)) as { type?: string; role?: string; text?: string; employee?: string };
        if (event.type === "transcript" && event.text) {
          setTranscript((prev) => [...prev, {
            id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            role: event.role === "user" ? "user" : "agent",
            speakerId: event.role === "user" ? undefined : event.employee,
            text: event.text!, ts: Date.now(),
          }]);
        } else if (event.type === "active_speaker" && event.employee && event.employee in EMPLOYEES) {
          setActiveSpeaker(event.employee as EmployeeId);
        }
      } catch { /* ignore non-JSON */ }
    };
    const onDisconnected = () => setConnected(false);

    room.on(RoomEvent.LocalTrackPublished, onLocalPublished);
    room.on(RoomEvent.TrackSubscribed, onRemoteSubscribed);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.Disconnected, onDisconnected);

    (async () => {
      try {
        await room.connect(tokenResponse.ws_url, tokenResponse.token);
        await room.localParticipant.setMicrophoneEnabled(true);
        setConnected(true); startedAtRef.current = Date.now();
      } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    })();

    return () => {
      room.removeAllListeners(); void room.disconnect();
      for (const el of audioElementsRef.current) el.remove();
      audioElementsRef.current = [];
    };
  }, [tokenResponse]);

  useEffect(() => {
    if (!connected) return;
    const i = window.setInterval(() => {
      const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(sec);
      if (sec >= tokenResponse.max_seconds) end();
    }, 1000);
    return () => window.clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, tokenResponse.max_seconds]);

  function toggleMute() {
    const room = roomRef.current; if (!room) return;
    const next = !muted; void room.localParticipant.setMicrophoneEnabled(!next); setMuted(next);
  }
  function end() { void roomRef.current?.disconnect(); onClose({ saved: connected && elapsedSec > 1 }); }

  const inWarn = elapsedSec >= tokenResponse.warn_seconds;
  const ActiveIcon = ICON[activeSpeaker] ?? Sparkles;
  const lastAgent = [...transcript].reverse().find((t) => t.role === "agent");

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-between overflow-hidden px-6 py-10 text-center"
      style={{
        background: `radial-gradient(60% 55% at 50% 26%, color-mix(in srgb, var(--cx-accent) 13%, var(--cx-canvas)), var(--cx-canvas) 72%)`,
        color: "var(--cx-text)",
        transform: "translateZ(0)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <p className="cx-meta flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full" style={{ background: "var(--cx-accent)" }} />
          Live room · {ids.length} in the room
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {ids.map((id) => { const I = ICON[id] ?? Sparkles; const on = id === activeSpeaker; return (
            <div key={id} className="flex flex-col items-center gap-1">
              <span
                className={`grid size-12 place-items-center rounded-full transition-all ${on ? "scale-110" : "opacity-50"}`}
                style={{
                  background: on ? "var(--cx-accent-tint)" : "var(--cx-surface-raised)",
                  color: "var(--cx-accent)",
                  border: on ? "1px solid var(--cx-accent)" : "1px solid var(--cx-border)",
                  boxShadow: on ? "0 0 0 2px var(--cx-canvas), 0 0 0 4px var(--cx-accent), 0 10px 34px -16px color-mix(in srgb, var(--cx-accent) 65%, transparent)" : "none",
                }}
              ><I className="size-5" /></span>
              <span className="cx-meta">{EMPLOYEES[id].name}</span>
            </div>
          ); })}
        </div>
      </div>

      <div className="relative grid place-items-center">
        {connected && agentPresent && [0, 1].map((r) => (
          <span
            key={r}
            className="absolute size-40 animate-ping rounded-full"
            style={{ border: "1px solid color-mix(in srgb, var(--cx-accent) 25%, transparent)", animationDuration: "2.6s", animationDelay: `${r * 1.1}s` }}
          />
        ))}
        <div
          className="grid size-40 place-items-center rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 32%, var(--cx-accent-bright), var(--cx-accent))`,
            boxShadow: "0 10px 34px -16px color-mix(in srgb, var(--cx-accent) 65%, transparent)",
          }}
        >
          <ActiveIcon className="size-14 text-white" />
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <div>
          <p className="cx-meta mb-1 text-left">You {muted && "· muted"}</p>
          <Waveform analyserRef={userAnalyserRef} color="var(--cx-accent)" />
        </div>
        <div>
          <p className="cx-meta mb-1 text-left">{EMPLOYEES[activeSpeaker]?.name ?? "Team"}</p>
          <Waveform analyserRef={agentAnalyserRef} color="var(--cx-accent-bright)" />
        </div>
        <div className="min-h-10 text-sm leading-relaxed">
          {!connected && !error && <span style={{ color: "var(--cx-text-muted)" }}>Connecting…</span>}
          {connected && !agentPresent && <span style={{ color: "var(--cx-text-muted)" }}>The room is joining…</span>}
          {error && <span className="inline-flex items-center gap-1.5" style={{ color: "var(--cx-danger)" }}><AlertCircle className="size-3.5" /> {error}</span>}
          {connected && agentPresent && lastAgent && (
            <span><span className="font-semibold" style={{ color: "var(--cx-accent)" }}>{EMPLOYEES[(lastAgent.speakerId as EmployeeId) ?? activeSpeaker]?.name ?? "Team"}:</span> {lastAgent.text}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={toggleMute}
          disabled={!connected}
          className="grid size-14 place-items-center rounded-full disabled:opacity-40 transition-colors"
          style={{
            background: muted ? "var(--cx-accent-tint)" : "var(--cx-surface-raised)",
            color: muted ? "var(--cx-accent)" : "var(--cx-text)",
            border: "1px solid var(--cx-border)",
          }}
          aria-label={muted ? "Unmute" : "Mute"}
        >{muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}</button>
        <div
          className="rounded-full px-3 py-1 font-mono cx-type-sm tabular-nums"
          style={inWarn ? { background: "rgba(234,179,8,0.10)", color: "#FBBF24" } : { background: "var(--cx-surface-raised)", color: "var(--cx-text-muted)" }}
        >{fmtTime(elapsedSec)} / {fmtTime(tokenResponse.max_seconds)}</div>
        <PraxisButton variant="danger" size="icon" onClick={end} aria-label="End call"><PhoneOff className="size-7" /></PraxisButton>
      </div>
    </div>
  );
}
