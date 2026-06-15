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
  // R12.5: round-table additions. When mode === 'roundtable', participants
  // is the full set of employees in the room (always includes Atlas).
  mode?: "solo" | "roundtable";
  participants?: string[];
  conversation_id?: string | null;
}

export interface ParticipantDisplay {
  id: string;
  name: string;
  initial: string;
  color: string;
}

interface Props {
  tokenResponse: VoiceTokenResponse;
  // Solo: name/initial/color for the single employee.
  // Roundtable: same fields apply to the *primary* employee_id but the
  // additional participants come through participantDisplays.
  employeeName: string;
  employeeInitial: string;
  deptColor: string;
  participantDisplays?: ParticipantDisplay[];
  onClose: (info: { saved: boolean }) => void;
}

interface TranscriptEntry {
  id: string;
  role: "user" | "agent";
  text: string;
  speakerId?: string;
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
  participantDisplays,
  onClose,
}: Props) {
  const isRoundTable = tokenResponse.mode === "roundtable";
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [agentPresent, setAgentPresent] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // R12.5: which participant is currently speaking. Worker publishes this
  // as a data event right before each turn begins.
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(
    isRoundTable ? null : tokenResponse.employee_id,
  );

  const displays =
    participantDisplays && participantDisplays.length > 0
      ? participantDisplays
      : [
          {
            id: tokenResponse.employee_id,
            name: employeeName,
            initial: employeeInitial,
            color: deptColor,
          },
        ];
  const activeDisplay =
    displays.find((d) => d.id === activeSpeaker) ?? displays[0];
  const headerColor = activeDisplay?.color ?? deptColor;

  const roomRef = useRef<Room | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const agentAnalyserRef = useRef<AnalyserNode | null>(null);
  const startedAtRef = useRef<number>(0);
  const audioElementsRef = useRef<HTMLMediaElement[]>([]);

  // Single-shot connect on mount.
  useEffect(() => {
    // Polish 2026-05-07: explicit audio capture constraints for the mic
    // track LiveKit publishes. autoGainControl was the culprit pushing
    // baseline room noise above the worker's RMS gate, which was
    // self-cutting Atlas mid-sentence. echoCancellation + noiseSuppression
    // stay on (defaults) so the agent's own outbound audio doesn't bleed
    // back into the inbound stream.
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
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
          employee?: string;
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
              speakerId:
                event.role === "user" ? undefined : event.employee,
              text: event.text!,
              ts: Date.now(),
            },
          ]);
        } else if (event.type === "active_speaker" && event.employee) {
          // R12.5: worker fires this right before each turn so the UI
          // can highlight the right avatar a beat before audio arrives.
          setActiveSpeaker(event.employee);
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
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: "color-mix(in srgb, var(--cx-canvas) 90%, transparent)",
        backdropFilter: "var(--cx-glass-blur-float, blur(28px) saturate(140%))",
        WebkitBackdropFilter: "var(--cx-glass-blur-float, blur(28px) saturate(140%))",
        color: "var(--cx-text, #F4F4F7)",
      }}
    >
      <div
        className="px-4 md:px-6 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}
      >
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/60">
          Praxis Voice · {isRoundTable ? "Round-table" : employeeName}
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
        {isRoundTable ? (
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-5 max-w-2xl">
            {displays.map((d) => {
              const isActive = activeSpeaker === d.id;
              return (
                <div key={d.id} className="relative">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg md:text-xl font-medium serif transition-all ${
                      isActive ? "" : "opacity-40"
                    }`}
                    style={{ background: d.color, color: "var(--cx-canvas, #0B0B0F)" }}
                    title={d.name}
                  >
                    {d.initial}
                  </div>
                  {isActive && connected && (
                    <div
                      className="absolute -inset-1 rounded-full animate-pulse"
                      style={{
                        boxShadow: `0 0 0 3px color-mix(in srgb, ${d.color} 40%, transparent)`,
                      }}
                    />
                  )}
                  <div
                    className={`mt-1 text-[10px] uppercase tracking-[0.15em] text-center transition-colors ${
                      isActive ? "text-white/80" : "text-white/30"
                    }`}
                  >
                    {d.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl md:text-4xl font-medium serif"
              style={{ background: deptColor, color: "var(--cx-canvas, #0B0B0F)" }}
            >
              {employeeInitial}
            </div>
            {connected && agentPresent && (
              <div
                className="absolute -inset-2 rounded-full animate-pulse"
                style={{
                  boxShadow: `0 0 0 4px color-mix(in srgb, ${deptColor} 20%, transparent)`,
                }}
              />
            )}
          </div>
        )}

        <div className="w-full max-w-md space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
              You {muted && "· muted"}
            </div>
            <Waveform analyserRef={userAnalyserRef} color={headerColor} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
              {isRoundTable
                ? activeDisplay?.name ?? "Team"
                : employeeName}
            </div>
            <Waveform analyserRef={agentAnalyserRef} color={headerColor} />
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
        {transcript.slice(-6).map((t) => {
          const speaker =
            t.role === "user"
              ? "You"
              : t.speakerId
                ? displays.find((d) => d.id === t.speakerId)?.name ??
                  employeeName
                : isRoundTable
                  ? activeDisplay?.name ?? employeeName
                  : employeeName;
          return (
            <div
              key={t.id}
              className={t.role === "user" ? "text-white/60" : "text-white/90"}
            >
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 mr-2">
                {speaker}
              </span>
              {t.text}
            </div>
          );
        })}
      </div>

      <div
        className="px-4 py-4 md:py-5 flex items-center justify-center gap-4 border-t"
        style={{ borderColor: "var(--cx-glass-border, rgba(255,255,255,0.08))" }}
      >
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
