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
    <div className="wm-rebrand fixed inset-0 z-[70] flex flex-col items-center justify-between overflow-hidden px-6 py-10 text-center text-foreground"
      style={{ background: "radial-gradient(60% 55% at 50% 26%, color-mix(in srgb, var(--wm-ember) 13%, var(--wm-background)), var(--wm-background) 72%)", transform: "translateZ(0)" }}>
      <div className="flex flex-col items-center gap-3">
        <p className="wm-label flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-primary" /> Live room · {ids.length} in the room</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {ids.map((id) => { const I = ICON[id] ?? Sparkles; const on = id === activeSpeaker; return (
            <div key={id} className="flex flex-col items-center gap-1">
              <span className={`grid size-12 place-items-center rounded-full bg-secondary text-primary transition-all ${on ? "scale-110 ring-2 ring-primary wm-glow" : "border border-white/10 opacity-50"}`}><I className="size-5" /></span>
              <span className="cx-type-xs text-muted-foreground">{EMPLOYEES[id].name}</span>
            </div>
          ); })}
        </div>
      </div>

      <div className="relative grid place-items-center">
        {connected && agentPresent && [0, 1].map((r) => (
          <span key={r} className="absolute size-40 animate-ping rounded-full border border-primary/25" style={{ animationDuration: "2.6s", animationDelay: `${r * 1.1}s` }} />
        ))}
        <div className="grid size-40 place-items-center rounded-full wm-glow" style={{ background: "radial-gradient(circle at 50% 32%, var(--wm-ember-hi), var(--wm-ember-deep))" }}>
          <ActiveIcon className="size-14 text-primary-foreground" />
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        <div>
          <p className="wm-label mb-1 text-left">You {muted && "· muted"}</p>
          <Waveform analyserRef={userAnalyserRef} color="var(--wm-ember)" />
        </div>
        <div>
          <p className="wm-label mb-1 text-left">{EMPLOYEES[activeSpeaker]?.name ?? "Team"}</p>
          <Waveform analyserRef={agentAnalyserRef} color="var(--wm-ember-hi)" />
        </div>
        <div className="min-h-10 text-sm leading-relaxed">
          {!connected && !error && <span className="text-muted-foreground">Connecting…</span>}
          {connected && !agentPresent && <span className="text-muted-foreground">The room is joining…</span>}
          {error && <span className="inline-flex items-center gap-1.5 text-destructive"><AlertCircle className="size-3.5" /> {error}</span>}
          {connected && agentPresent && lastAgent && (
            <span><span className="font-semibold text-primary">{EMPLOYEES[(lastAgent.speakerId as EmployeeId) ?? activeSpeaker]?.name ?? "Team"}:</span> {lastAgent.text}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button onClick={toggleMute} disabled={!connected} className={`grid size-14 place-items-center rounded-full border border-white/10 disabled:opacity-40 ${muted ? "bg-secondary text-primary" : "bg-secondary/60 text-foreground hover:bg-secondary"}`} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}</button>
        <div className={`rounded-full px-3 py-1 font-mono text-sm tabular-nums ${inWarn ? "bg-amber-400/10 text-amber-300" : "bg-white/5 text-muted-foreground"}`}>{fmtTime(elapsedSec)} / {fmtTime(tokenResponse.max_seconds)}</div>
        <PraxisButton variant="danger" size="icon" onClick={end} aria-label="End call"><PhoneOff className="size-7" /></PraxisButton>
      </div>
    </div>
  );
}
