"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Mic2, MicOff, Send, Square } from "lucide-react";
import type { EmployeeId } from "@/lib/conduit/employees";
import { PraxisAvatar } from "./PraxisAvatar";
import { useDeptTint } from "./usePraxisTint";
import type { RecordingState } from "@/hooks/useVoiceRecorder";

export type PinValue = EmployeeId | "auto" | "team";

interface PinOption {
  value: PinValue;
  label: string;
}

interface Props {
  value: string;
  onChange(next: string): void;
  onSubmit(): void;
  pin: PinValue;
  pinOptions: PinOption[];
  onPinChange(next: PinValue): void;
  /** Whether voice input is supported in this browser. */
  speechSupported: boolean;
  /** Whether voice capture is currently listening. */
  speechListening: boolean;
  onSpeechToggle(): void;
  loading: boolean;
  streamingEmployee?: EmployeeId | null;
  placeholder?: string;
  /** Whether the browser supports MediaRecorder-based voice messages. */
  voiceMessageSupported?: boolean;
  /** Current state of the voice message recorder. */
  voiceRecordingState?: RecordingState;
  /** Elapsed recording seconds (shown during recording). */
  voiceRecordingSeconds?: number;
  onVoiceRecordStart?(): void;
  onVoiceRecordStop?(): void;
  onVoiceRecordCancel?(): void;
}

/**
 * Redesigned chat composer — demoted resting border so the room outranks
 * the input. Dept-colored focus ring only when focused. Avatar slot
 * pulses while streaming. Pin changes propagate to the canvas-tint
 * provider (persistent wash on pinned employee per FR-029).
 *
 * Per contracts/primitives.md P-010. Refactor of Chat.tsx:743–880.
 */
function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function PraxisComposerPill({
  value,
  onChange,
  onSubmit,
  pin,
  pinOptions,
  onPinChange,
  speechSupported,
  speechListening,
  onSpeechToggle,
  loading,
  streamingEmployee,
  placeholder,
  voiceMessageSupported = false,
  voiceRecordingState = "idle",
  voiceRecordingSeconds = 0,
  onVoiceRecordStart,
  onVoiceRecordStop,
  onVoiceRecordCancel,
}: Props) {
  const [pinOpen, setPinOpen] = useState(false);
  const tint = useDeptTint();
  const composerRef = useRef<HTMLFormElement>(null);

  // Propagate pin to canvas tint engine. "auto" / "team" clear the pin.
  useEffect(() => {
    if (pin === "auto" || pin === "team") {
      tint.clearPin();
    } else {
      tint.setPinDept(pin);
    }
  }, [pin, tint]);

  const pinLabel = pinOptions.find((o) => o.value === pin)?.label ?? "Atlas (auto-route)";
  const pinAvatarEmp: EmployeeId =
    pin === "auto" || pin === "team" ? "jarvis" : pin;

  // Dept for the composer's focus-ring color: the pinned employee, or
  // Atlas as the default.
  const composerDept = pinAvatarEmp;

  return (
    <form
      ref={composerRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="praxis-composer-pill"
      data-dept={composerDept}
      data-state={streamingEmployee ? "streaming" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2)",
      }}
    >
      <button
        type="button"
        onClick={() => setPinOpen((v) => !v)}
        className="praxis-microlabel"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          paddingLeft: "var(--space-2)",
          paddingRight: "var(--space-3)",
          paddingTop: "6px",
          paddingBottom: "6px",
          borderRadius: "var(--radius-pill)",
          background: "transparent",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          letterSpacing: 0,
          textTransform: "none",
          fontSize: "12px",
          position: "relative",
          flexShrink: 0,
          border: "none",
        }}
        aria-haspopup="listbox"
        aria-expanded={pinOpen}
      >
        <PraxisAvatar
          employee={pinAvatarEmp}
          size="md"
          pulse={
            streamingEmployee && streamingEmployee === pinAvatarEmp
              ? "streaming"
              : undefined
          }
        />
        <span>{pinLabel}</span>
        <span aria-hidden>▾</span>
        {pinOpen && (
          <div
            onMouseLeave={() => setPinOpen(false)}
            role="listbox"
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: "var(--space-2)",
              width: "16rem",
              borderRadius: "var(--radius-card)",
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
              overflow: "hidden",
              textAlign: "left",
              zIndex: 10,
            }}
          >
            {pinOptions.map((o) => {
              const optEmp: EmployeeId =
                o.value === "auto" || o.value === "team"
                  ? "jarvis"
                  : o.value;
              const active = pin === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinChange(o.value);
                    setPinOpen(false);
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-2) var(--space-3)",
                    fontSize: "12px",
                    textAlign: "left",
                    background: active
                      ? "var(--color-surface-raised)"
                      : "transparent",
                    color: active ? "var(--color-text)" : "var(--color-text-muted)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  <PraxisAvatar employee={optEmp} size="sm" />
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </button>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={1}
        placeholder={
          placeholder ?? (speechListening ? "Listening…" : "Talk to your team…")
        }
        style={{
          flex: 1,
          resize: "none",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "var(--space-2)",
          fontSize: "15px",
          lineHeight: 1.4,
          maxHeight: "8rem",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      />

      <button
        type="button"
        onClick={onSpeechToggle}
        disabled={!speechSupported}
        aria-label={
          !speechSupported
            ? "Voice input not supported in this browser"
            : speechListening
            ? "Stop listening"
            : "Start voice input"
        }
        title={
          !speechSupported
            ? "Voice input not supported — try Chrome"
            : speechListening
            ? "Stop and send"
            : "Hold or click to talk"
        }
        style={{
          flexShrink: 0,
          width: "40px",
          height: "40px",
          borderRadius: "9999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: speechListening
            ? "var(--color-accent)"
            : "transparent",
          color: speechListening
            ? "var(--color-surface)"
            : "var(--color-text-muted)",
          border: speechListening
            ? "none"
            : "1px solid var(--color-border)",
          cursor: speechSupported ? "pointer" : "not-allowed",
          opacity: speechSupported ? 1 : 0.4,
          transition: "all 180ms var(--praxis-ease-out-quart)",
        }}
      >
        {speechSupported ? <Mic size={16} /> : <MicOff size={16} />}
      </button>

      {/* Voice message recording — distinct from STT above */}
      {voiceMessageSupported && (
        voiceRecordingState === "recording" ? (
          <div
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "voiceRecordPulse 1s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontVariantNumeric: "tabular-nums",
                color: "var(--color-text-muted)",
                minWidth: "2.8ch",
              }}
              aria-live="polite"
              aria-label={`Recording — ${formatSeconds(voiceRecordingSeconds)}`}
            >
              {formatSeconds(voiceRecordingSeconds)}
            </span>
            <button
              type="button"
              onClick={onVoiceRecordStop}
              aria-label="Send voice message"
              title="Send voice message"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Square size={14} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onVoiceRecordCancel}
              aria-label="Cancel recording"
              title="Cancel recording"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onVoiceRecordStart}
            disabled={voiceRecordingState === "uploading" || loading}
            aria-label={
              voiceRecordingState === "uploading"
                ? "Uploading voice message…"
                : "Record voice message"
            }
            title={
              voiceRecordingState === "uploading"
                ? "Uploading…"
                : "Record a voice message"
            }
            style={{
              flexShrink: 0,
              width: "40px",
              height: "40px",
              borderRadius: "9999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color:
                voiceRecordingState === "uploading"
                  ? "var(--color-accent)"
                  : "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              cursor:
                voiceRecordingState === "uploading" || loading
                  ? "not-allowed"
                  : "pointer",
              opacity: voiceRecordingState === "uploading" || loading ? 0.5 : 1,
              transition: "all 180ms var(--praxis-ease-out-quart)",
            }}
          >
            <Mic2 size={16} />
          </button>
        )
      )}

      <button
        type="submit"
        disabled={loading || !value.trim()}
        aria-label="Send"
        style={{
          flexShrink: 0,
          width: "44px",
          height: "44px",
          borderRadius: "9999px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-accent)",
          color: "var(--color-surface)",
          border: "none",
          cursor: loading || !value.trim() ? "not-allowed" : "pointer",
          opacity: loading || !value.trim() ? 0.4 : 1,
          transition: "background 180ms var(--praxis-ease-out-quart)",
        }}
      >
        <Send size={16} />
      </button>
    </form>
  );
}
