"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type LocalTrackPublication,
  type RemoteTrack,
  type RemoteParticipant,
  type RemoteTrackPublication,
  type LocalAudioTrack,
  type RemoteAudioTrack,
} from "livekit-client";
import { Mic, MicOff, X, AlertCircle, PhoneOff } from "lucide-react";
import Waveform from "./Waveform";

export interface VoiceTokenResponse {
  token: string;
  ws_url: string;
  room_name: string;
  employee_id: string;
  voice_id: string | null;
  voice_locale: string;
  max_seconds: number;
  warn_seconds: number;
  daily_seconds_used: number;
  daily_seconds_max: number;
  internal_account: boolean;
}

interface Props {
  tokenResponse: VoiceTokenResponse;
  employeeName: string;
  employeeInitial: string;
  deptColor: string;
  onClose: (info: { saved: boolean }) => void;
}

interface TranscriptEntry {
  id: string;
  role: "user" | "agent";
  text: string;
  ts: number;
}

function setupAnalyser(
  track: LocalAudioTrack | RemoteAudioTrack,
): AnalyserNode | null {
  const mst = track.mediaStreamTrack;
  if (!mst) return null;
  type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor =
    window.AudioContext ||
    (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const src = ctx.createMediaStreamSource(new MediaStream([mst]));
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  src.connect(analyser);
  if (ctx.state === "suspended") void ctx.resume();
  return analyser;
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function VoiceRoom({
  tokenResponse,
  employeeName,
  employeeInitial,
  deptColor,
  onClose,
}: Props) {
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [agentPresent, setAgentPresent] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);

  // Single-shot connect on mount.
  useEffect(() => {
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    const onLocalPublished = (pub: LocalTrackPublication) => {
      if (pub.track && pub.track.kind === Track.Kind.Audio) {
        userAnalyserRef.current = setupAnalyser(pub.track as LocalAudioTrack);
      }
    };
    const onRemoteSubscribed = (
      track: RemoteTrack,
      _pub: RemoteTrackPublication,
      _participant: RemoteParticipant,
    ) => {
      if (track.kind === Track.Kind.Audio) {
        const elem = track.attach();
        elem.style.display = "none";
        document.body.appendChild(elem);
        audioElementsRef.current.push(elem);
        void elem.play().catch(() => {
          /* autoplay blocks resolve once user has gestured to start the call */
        });
        agentAnalyserRef.current = setupAnalyser(track as RemoteAudioTrack);
        setAgentPresent(true);
      }
    };
    const onParticipantConnected = (p: RemoteParticipant) => {
      if (p.identity?.startsWith("agent-") || p.identity?.startsWith("conduit-")) {
        setAgentPresent(true);
      }
    };
    const onParticipantDisconnected = (p: RemoteParticipant) => {
      if (p.identity?.startsWith("agent-") || p.identity?.startsWith("conduit-")) {
        setAgentPresent(false);
      }
    };
    const onData = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const event = JSON.parse(text) as {
          type?: string;
          role?: string;
          text?: string;
        };
        if (event.type === "transcript" && event.text) {
          setTranscript((prev) => [
            ...prev,
            {
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random()}`,
              role: event.role === "user" ? "user" : "agent",
              text: event.text!,
              ts: Date.now(),
            },
          ]);
        }
      } catch {
        // non-JSON data messages from the worker are ignored
      }
    };
    const onDisconnected = () => {
      setConnected(false);
    };

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
        setConnected(true);
        startedAtRef.current = Date.now();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      room.removeAllListeners();
      void room.disconnect();
      for (const el of audioElementsRef.current) {
        el.remove();
      }
      audioElementsRef.current = [];
    };
  }, [tokenResponse]);

  // Session timer. Hard cut at max_seconds — server enforces too, but
  // nice to not let the UI keep ticking past it.
  useEffect(() => {
    if (!connected) return;
    const i = window.setInterval(() => {
      const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(sec);
      if (sec >= tokenResponse.max_seconds) {
        end();
      }
    }, 1000);
    return () => window.clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, tokenResponse.max_seconds]);

  function toggleMute() {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    void room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  }

  function end() {
    void roomRef.current?.disconnect();
    onClose({ saved: connected && elapsedSec > 1 });
  }

  const inWarn = elapsedSec >= tokenResponse.warn_seconds;
  const remainingSec = Math.max(0, tokenResponse.max_seconds - elapsedSec);

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex flex-col text-white">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between border-b border-white/10">
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/60">
          Conduit Voice · {employeeName}
        </div>
        <button
          type="button"
          onClick={end}
          className="text-white/60 hover:text-white"
          aria-label="End call"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4">
        <div className="relative">
          <div
            className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl md:text-4xl font-medium serif"
            style={{ background: deptColor, color: "#0A0908" }}
          >
            {employeeInitial}
          </div>
          {connected && agentPresent && (
            <div
              className="absolute -inset-2 rounded-full animate-pulse"
              style={{ boxShadow: `0 0 0 4px ${deptColor}33` }}
            />
          )}
        </div>

        <div className="w-full max-w-md space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
              You {muted && "· muted"}
            </div>
            <Waveform analyserRef={userAnalyserRef} color={deptColor} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
              {employeeName}
            </div>
            <Waveform analyserRef={agentAnalyserRef} color={deptColor} />
          </div>
        </div>

        <div className="min-h-[20px] text-sm">
          {!connected && !error && (
            <span className="text-white/60">Connecting…</span>
          )}
          {connected && !agentPresent && (
            <span className="text-white/60">{employeeName} is joining…</span>
          )}
          {error && (
            <span className="text-red-400 inline-flex items-center gap-1.5">
              <AlertCircle size={14} />
              {error}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 max-h-32 md:max-h-40 overflow-y-auto space-y-1 text-sm">
        {transcript.slice(-6).map((t) => (
          <div
            key={t.id}
            className={t.role === "user" ? "text-white/60" : "text-white/90"}
          >
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 mr-2">
              {t.role === "user" ? "You" : employeeName}
            </span>
            {t.text}
          </div>
        ))}
      </div>

      <div className="px-4 py-4 md:py-5 flex items-center justify-center gap-4 border-t border-white/10">
        <button
          type="button"
          onClick={toggleMute}
          disabled={!connected}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
          aria-label={muted ? "Unmute" : "Mute"}
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <div
          className={`px-3 py-1 rounded-full text-sm tabular-nums transition-colors ${
            inWarn ? "text-amber-300 bg-amber-300/10" : "text-white/70 bg-white/5"
          }`}
          title={`${remainingSec}s remaining`}
        >
          {fmtTime(elapsedSec)} / {fmtTime(tokenResponse.max_seconds)}
        </div>
        <button
          type="button"
          onClick={end}
          className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
          aria-label="End call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
