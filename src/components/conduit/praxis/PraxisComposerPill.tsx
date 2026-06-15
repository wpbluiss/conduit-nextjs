"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mic, Mic2, MicOff, Send, Square } from "lucide-react";
import { EMPLOYEE_ORDER, EMPLOYEES, type EmployeeId } from "@/lib/conduit/employees";
import type { EmployeeKey } from "@/lib/ai/provider";
import { useNicknames } from "@/context/NicknameContext";
import { PraxisAvatar } from "./PraxisAvatar";
import { useDeptTint } from "./usePraxisTint";
import type { RecordingState } from "@/hooks/useVoiceRecorder";
import type { WhisperState } from "@/hooks/useWhisperRecorder";

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
  /** One-off specialist override from @mention — routes this single message only, does not change the pin. */
  mentionOverride?: EmployeeId | null;
  onMentionOverrideChange?(id: EmployeeId | null): void;
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
  /** Whether MediaRecorder-based Whisper transcription is available. */
  whisperSupported?: boolean;
  /** Current state of the Whisper recorder. */
  whisperState?: WhisperState;
  onWhisperStart?(): void;
  onWhisperStop?(): void;
  onWhisperCancel?(): void;
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
  mentionOverride = null,
  onMentionOverrideChange,
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
  whisperSupported = false,
  whisperState = "idle",
  onWhisperStart,
  onWhisperStop,
  onWhisperCancel,
}: Props) {
  const [pinOpen, setPinOpen] = useState(false);
  const tint = useDeptTint();
  const composerRef = useRef<HTMLFormElement>(null);
  const { labelFor } = useNicknames();
  const shouldReduceMotion = useReducedMotion();

  const CHAR_LIMIT = 4000;
  const COUNTER_THRESHOLD = 200;
  const charCount = value.length;
  const tokenEstimate = Math.ceil(charCount / 4);
  const counterColor =
    charCount >= CHAR_LIMIT * 0.95
      ? "var(--color-conduit-danger)"
      : charCount >= CHAR_LIMIT * 0.80
        ? "var(--color-amber)"
        : "var(--color-text-muted)";

  // @-mention state
  const [mentionIndex, setMentionIndex] = useState(0);

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

  // Detect trailing @fragment in the textarea value.
  // Suppressed when a mentionOverride chip is already set (one @mention per message).
  const mentionMatch = !mentionOverride ? value.match(/(^|\s)@(\w*)$/) : null;
  const mentionFragment = mentionMatch ? mentionMatch[2].toLowerCase() : null;

  // Only show employees that are in pinOptions (tier-filtered).
  const allowedEmployeeIds = new Set(
    pinOptions
      .map((o) => o.value)
      .filter((v): v is EmployeeId => v !== "auto" && v !== "team"),
  );

  // Filter employees by the typed fragment, preserving EMPLOYEE_ORDER.
  const mentionItems: EmployeeId[] =
    mentionFragment !== null
      ? EMPLOYEE_ORDER.filter((id) => {
          if (!allowedEmployeeIds.has(id)) return false;
          const canonicalName = EMPLOYEES[id].name.toLowerCase();
          const nick = labelFor(id as EmployeeKey).toLowerCase();
          return (
            id.startsWith(mentionFragment) ||
            canonicalName.startsWith(mentionFragment) ||
            nick.startsWith(mentionFragment)
          );
        })
      : [];

  const mentionOpen = mentionItems.length > 0;

  // Reset highlight index when the list changes.
  useEffect(() => {
    setMentionIndex(0);
  }, [mentionFragment]);

  function applyMention(id: EmployeeId) {
    // Strip the trailing @fragment from the input and set a one-off routing override.
    // Does NOT change the persistent pin — this routes only the current message.
    onChange(value.replace(/(^|\s)@\w*$/, (m, p1: string) => p1));
    onMentionOverrideChange?.(id);
  }

  return (
    <form
      ref={composerRef}
      onSubmit={(e) => {
        e.preventDefault();
        if (!mentionOpen) onSubmit();
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
        <span className="hidden sm:inline">{pinLabel}</span>
        <span aria-hidden>▾</span>
        {pinOpen && (
          <div
            onMouseLeave={() => setPinOpen(false)}
            role="listbox"
            className="cx-glass-float cx-glass-border"
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: "var(--cx-space-2, 8px)",
              width: "16rem",
              borderRadius: "var(--cx-radius-md, 12px)",
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

      {/* Textarea wrapped in a relative container for the @-mention popover */}
      <div style={{ flex: 1, position: "relative" }}>
        {mentionOpen && (
          <div
            role="listbox"
            aria-label="Specialist suggestions"
            className="cx-glass-float cx-glass-border"
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              right: 0,
              borderRadius: "var(--cx-radius-md, 12px)",
              overflow: "hidden",
              zIndex: 20,
            }}
          >
            {mentionItems.map((id, idx) => {
              const emp = EMPLOYEES[id];
              const nick = labelFor(id as EmployeeKey);
              const highlighted = idx === mentionIndex;
              return (
                <button
                  key={id}
                  type="button"
                  role="option"
                  aria-selected={highlighted}
                  onMouseDown={(e) => {
                    // onMouseDown fires before textarea blur, keeping the popover open.
                    e.preventDefault();
                    applyMention(id);
                  }}
                  onMouseEnter={() => setMentionIndex(idx)}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) var(--space-3)",
                    fontSize: "13px",
                    textAlign: "left",
                    background: highlighted ? "var(--color-surface-raised)" : "transparent",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  <PraxisAvatar employee={id} size="sm" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block" }}>{nick}</span>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      {emp.role}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--font-mono)",
                      flexShrink: 0,
                    }}
                  >
                    @{id}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* @mention chip — shown after a specialist is selected; Backspace on empty input removes it */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
          {mentionOverride && (
            <span
              aria-label={`Routing to ${labelFor(mentionOverride as EmployeeKey)} — press Backspace to remove`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 4px 2px 4px",
                borderRadius: "var(--radius-pill)",
                background: EMPLOYEES[mentionOverride].colorSoft,
                border: `1px solid ${EMPLOYEES[mentionOverride].color}`,
                fontSize: "12px",
                color: EMPLOYEES[mentionOverride].color,
                flexShrink: 0,
                lineHeight: 1,
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              <PraxisAvatar employee={mentionOverride} size="sm" />
              <span>@{labelFor(mentionOverride as EmployeeKey)}</span>
              <button
                type="button"
                onClick={() => onMentionOverrideChange?.(null)}
                aria-label="Remove @mention"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "11px",
                  lineHeight: 1,
                  padding: 0,
                  opacity: 0.7,
                }}
              >
                ×
              </button>
            </span>
          )}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Backspace on empty input clears the @mention chip.
              if (!mentionOpen && e.key === "Backspace" && value === "" && mentionOverride) {
                e.preventDefault();
                onMentionOverrideChange?.(null);
                return;
              }
              if (mentionOpen) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.min(i + 1, mentionItems.length - 1));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((i) => Math.max(i - 1, 0));
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyMention(mentionItems[mentionIndex]);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  // Strip the @fragment and close popover.
                  onChange(value.replace(/(^|\s)@\w*$/, (m, p1: string) => p1));
                  return;
                }
              }
              // Enter (no shift) OR Cmd/Ctrl+Enter → submit
              if (e.key === "Enter" && (!e.shiftKey || e.metaKey || e.ctrlKey)) {
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
            minWidth: 0,
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
        </div>
      </div>

      {speechSupported ? (
        <button
          type="button"
          onClick={onSpeechToggle}
          aria-label={speechListening ? "Stop listening" : "Start voice input"}
          title={speechListening ? "Stop and send" : "Click to talk"}
          style={{
            flexShrink: 0,
            width: "40px",
            height: "40px",
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: speechListening ? "var(--color-accent)" : "transparent",
            color: speechListening ? "var(--color-surface)" : "var(--color-text-muted)",
            border: speechListening ? "none" : "1px solid var(--color-border)",
            cursor: "pointer",
            transition: "all 180ms var(--praxis-ease-out-quart)",
          }}
        >
          <Mic size={16} />
        </button>
      ) : !whisperSupported ? (
        <button
          type="button"
          disabled
          aria-label="Voice input not supported in this browser"
          title="Voice input not supported — try Chrome or enable Whisper"
          style={{
            flexShrink: 0,
            width: "40px",
            height: "40px",
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            color: "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            cursor: "not-allowed",
            opacity: 0.4,
          }}
        >
          <MicOff size={16} />
        </button>
      ) : null}

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
                background: "var(--cx-danger)",
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
                background: "var(--cx-danger)",
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

      {/* Whisper (press-to-talk) — shown when browser STT isn't available; hidden during voice message recording */}
      {whisperSupported && !speechSupported && voiceRecordingState === "idle" && (
        whisperState === "recording" ? (
          <div
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
            }}
          >
            {/* Waveform animation */}
            <span
              aria-hidden
              style={{ display: "inline-flex", alignItems: "flex-end", gap: "2px", height: "16px" }}
            >
              {[1, 2, 3, 2, 1].map((h, i) => (
                <span
                  key={i}
                  style={{
                    width: "2px",
                    borderRadius: "1px",
                    background: "var(--color-accent)",
                    height: `${h * 4}px`,
                    animation: `whisperWave${(i % 3) + 1} 0.8s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={onWhisperStop}
              aria-label="Transcribe recording"
              title="Release to transcribe"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-accent)",
                color: "var(--color-surface)",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Square size={12} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onWhisperCancel}
              aria-label="Cancel transcription"
              title="Cancel"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                fontSize: "11px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onWhisperStart?.(); }}
            onTouchStart={(e) => { e.preventDefault(); onWhisperStart?.(); }}
            disabled={whisperState === "transcribing" || loading}
            aria-label={
              whisperState === "transcribing"
                ? "Transcribing…"
                : "Hold to record and transcribe"
            }
            title={
              whisperState === "transcribing"
                ? "Transcribing…"
                : "Hold to record · release to transcribe"
            }
            style={{
              flexShrink: 0,
              width: "40px",
              height: "40px",
              borderRadius: "9999px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: whisperState === "transcribing" ? "var(--color-accent)" : "transparent",
              color: whisperState === "transcribing" ? "var(--color-surface)" : "var(--color-text-muted)",
              border: whisperState === "transcribing" ? "none" : "1px solid var(--color-border)",
              cursor: whisperState === "transcribing" || loading ? "not-allowed" : "pointer",
              opacity: whisperState === "transcribing" || loading ? 0.6 : 1,
              transition: "all 180ms var(--praxis-ease-out-quart)",
            }}
          >
            {whisperState === "transcribing" ? (
              <span
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid currentColor",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }}
              />
            ) : (
              <Mic size={16} />
            )}
          </button>
        )
      )}

      {charCount >= COUNTER_THRESHOLD && (
        <span
          aria-live="polite"
          aria-label={`${charCount} characters, approximately ${tokenEstimate} tokens`}
          style={{
            flexShrink: 0,
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            color: counterColor,
            whiteSpace: "nowrap",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {charCount} chars · ~{tokenEstimate} tokens
        </span>
      )}

      <motion.button
        type="submit"
        disabled={loading || !value.trim()}
        aria-label="Send"
        whileHover={
          !shouldReduceMotion && !(loading || !value.trim())
            ? { boxShadow: "0 0 0 3px rgba(124,108,255,0.25)", backgroundColor: "var(--cx-accent-bright, #9B8CFF)" }
            : undefined
        }
        whileTap={
          !shouldReduceMotion && !(loading || !value.trim())
            ? { scale: 0.97 }
            : undefined
        }
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
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
        }}
      >
        <Send size={16} />
      </motion.button>
    </form>
  );
}
