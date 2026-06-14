"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Download, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { EmployeeKey } from "@/lib/ai/provider";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  EmployeeAvatar,
  employeeLabel,
} from "./EmployeeBadge";
import { PaywallModal, type PaywallPayload } from "./PaywallModal";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useWhisperRecorder } from "@/hooks/useWhisperRecorder";
import { PraxisAvatar } from "./praxis/PraxisAvatar";
import { PraxisSuggestionTile } from "./praxis/PraxisSuggestionTile";
import { PraxisHandoffBaton } from "./praxis/PraxisHandoffBaton";
import {
  PraxisComposerPill,
  type PinValue as PraxisPinValue,
} from "./praxis/PraxisComposerPill";
import { composeChatEmptyCopy, timeOfDayBucket } from "@/lib/conduit/welcome-copy";
import type { EmployeeId } from "@/lib/conduit/employees";
import { TypingIndicator } from "./TypingIndicator";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  SpecialistSelectorModal,
  useSpecialistChoice,
} from "./SpecialistSelectorModal";

export interface VoicePrefs {
  enabled: boolean;
  autoPlay: boolean;
  // Tier permits TTS output? (Free → false unless internal)
  ttsAllowed: boolean;
}

export interface MessageRow {
  id?: string;
  role: "user" | "assistant" | "system";
  employee?: EmployeeKey | null;
  content: string;
  metadata?: Record<string, unknown> | null;
  pending?: boolean;
  artifacts?: { id: string; title: string; type: string; preview?: string }[];
  handoffTo?: EmployeeKey;
  handoffFrom?: EmployeeKey;
  memories?: { id: string; kind: string; content: string; tags?: string[] }[];
}

interface Suggestion {
  text: string;
  pin?: EmployeeKey;
  dept: EmployeeKey;
  hint: string;
}

// Pool — Chat picks four at runtime weighted by what the tier allows.
const SUGGESTION_POOL: Suggestion[] = [
  {
    text: "Help me grow my business",
    dept: "jarvis",
    hint: "Strategy with Atlas",
  },
  {
    text: "Write me 3 blog posts about getting my first 10 customers",
    pin: "marketing",
    dept: "marketing",
    hint: "Marketing will draft them",
  },
  {
    text: "How would you build me a CRM for my business?",
    pin: "engineering",
    dept: "engineering",
    hint: "Engineering's plan",
  },
  {
    text: "Draft me a cold outreach campaign",
    pin: "sales",
    dept: "sales",
    hint: "Sales builds the play",
  },
  {
    text: "Reconcile my last month's revenue",
    pin: "finance",
    dept: "finance",
    hint: "Finance's framework",
  },
  {
    text: "Draft me a basic NDA for a contractor",
    pin: "legal",
    dept: "legal",
    hint: "Legal first-draft",
  },
  {
    text: "Write me an offer letter for a part-time bookkeeper",
    pin: "hr",
    dept: "hr",
    hint: "HR will write it",
  },
  {
    text: "Set up an SOP for client onboarding",
    pin: "ops",
    dept: "ops",
    hint: "Operations builds it",
  },
];

function suggestionsForTier(allowed: Set<EmployeeKey>): Suggestion[] {
  // Always include Atlas + Marketing first; then fill with others the tier allows.
  const base = SUGGESTION_POOL.filter(
    (s) => s.dept === "jarvis" || s.dept === "marketing",
  );
  const extras = SUGGESTION_POOL.filter(
    (s) => s.dept !== "jarvis" && s.dept !== "marketing" && allowed.has(s.dept),
  );
  // Stable, predictable order: base then extras in pool order. Take 4.
  return [...base, ...extras].slice(0, 4);
}

type PinValue = EmployeeKey | "auto" | "team";

const ALL_PIN_OPTIONS: { value: PinValue; label: string }[] = [
  { value: "auto", label: "Atlas (auto-route)" },
  { value: "team", label: "Team round-table" },
  { value: "jarvis", label: "Atlas only" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "engineering", label: "Engineering" },
  { value: "finance", label: "Finance" },
  { value: "compliance", label: "Compliance" },
  { value: "hr", label: "HR" },
  { value: "ops", label: "Operations" },
  { value: "legal", label: "Legal" },
];

export function Chat({
  conversationId: initialId,
  initialMessages,
  initialHasMore = false,
  firstName,
  internalAccount = false,
  voice = { enabled: false, autoPlay: true, ttsAllowed: false },
  allowedEmployees,
  isFirstRun = false,
  companyBrief = null,
}: {
  conversationId: string | null;
  initialMessages: MessageRow[];
  initialHasMore?: boolean;
  firstName: string;
  internalAccount?: boolean;
  voice?: VoicePrefs;
  allowedEmployees: EmployeeKey[];
  isFirstRun?: boolean;
  companyBrief?: string | null;
}) {
  const allowedSet = new Set(allowedEmployees);
  // "team" requires at least 2 non-Atlas employees on the tier.
  const teamEligible =
    allowedEmployees.filter((e) => e !== "jarvis").length >= 2;
  const pinOptions = ALL_PIN_OPTIONS.filter(
    (o) =>
      o.value === "auto" ||
      (o.value === "team" && teamEligible) ||
      (o.value !== "team" && allowedSet.has(o.value as EmployeeKey)),
  );
  const suggestions = suggestionsForTier(allowedSet);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(
    initialId,
  );
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pin, setPin] = useState<PinValue>("auto");
  const { hasChosen, persist: persistSpecialistChoice } = useSpecialistChoice();
  const showSpecialistSelector =
    hasChosen === false && messages.length === 0 && !conversationId;
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerArtifactId, setDrawerArtifactId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallPayload | null>(null);
  // Message edit: id of the user message currently being edited inline.
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [streamingEmployee, setStreamingEmployee] =
    useState<EmployeeKey | null>(null);
  const [sendError, setSendError] = useState<{
    text: string;
    retryText: string;
  } | null>(null);

  // Rate-limit countdown: epoch ms when the ban lifts; null = not limited.
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);
  useEffect(() => {
    if (!rateLimitUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((rateLimitUntil - Date.now()) / 1000));
      setRateLimitSecondsLeft(left);
      if (left === 0) setRateLimitUntil(null);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [rateLimitUntil]);

  // Export conversation as Markdown — client-side, no backend needed.
  const exportConversation = useCallback(() => {
    const visibleMessages = messages.filter(
      (m) => m.role === "user" || m.role === "assistant",
    );
    if (visibleMessages.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const dominant = visibleMessages
      .filter((m) => m.role === "assistant" && m.employee)
      .reduce<Record<string, number>>((acc, m) => {
        const emp = m.employee as string;
        acc[emp] = (acc[emp] ?? 0) + 1;
        return acc;
      }, {});
    const specialist =
      Object.entries(dominant).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "praxis";

    const lines: string[] = [
      "---",
      `title: Praxis Conversation`,
      `date: ${today}`,
      `specialist: ${specialist}`,
      "---",
      "",
    ];

    for (const msg of visibleMessages) {
      if (msg.role === "user") {
        lines.push(`**You:** ${msg.content.trim()}`, "");
      } else if (msg.role === "assistant" && msg.employee) {
        const label = employeeLabel(msg.employee as EmployeeKey);
        lines.push(`**${label}:** ${msg.content.trim()}`, "");
      }
    }

    const md = lines.join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `praxis-conversation-${today}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  // Pagination: infinite-scroll-up for message history.
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // R8: workspace handoff. ?pin=<employee>&prompt=<text> from /app/team/* —
  // apply once on mount, then strip from URL so refresh doesn't re-trigger.
  useEffect(() => {
    const pinParam = searchParams.get("pin");
    const promptParam = searchParams.get("prompt");
    let touched = false;
    if (pinParam === "team" && teamEligible) {
      setPin("team");
      touched = true;
    } else if (pinParam && allowedSet.has(pinParam as EmployeeKey)) {
      setPin(pinParam as EmployeeKey);
      touched = true;
    }
    if (promptParam) {
      setInput(promptParam);
      touched = true;
    }
    if (touched) {
      // Strip the query params without scrolling.
      const cid = searchParams.get("c");
      const path = cid ? `/app?c=${cid}` : "/app";
      window.history.replaceState({}, "", path);
    }
    // Run only on mount; we explicitly don't want to react to subsequent
    // searchParams changes (e.g. when /app sets ?c=).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Voice input (browser STT)
  const speech = useSpeechRecognition();
  const lastTranscriptRef = useRef("");
  useEffect(() => {
    if (!speech.listening) return;
    // Replace input with the live transcript while listening.
    setInput(speech.transcript);
    lastTranscriptRef.current = speech.transcript;
  }, [speech.transcript, speech.listening]);

  // Voice message recording (MediaRecorder → Supabase Storage)
  const sendVoiceMessage = useCallback(
    async (blob: Blob, mimeType: string) => {
      const form = new FormData();
      form.append("audio", blob, `voice.${mimeType.split("/")[1]?.split(";")[0] ?? "webm"}`);
      form.append("mime_type", mimeType);
      if (conversationId) form.append("conversation_id", conversationId);

      const resp = await fetch("/api/conduit/voice/message", {
        method: "POST",
        body: form,
      });
      if (!resp.ok) throw new Error("upload_failed");

      const json = (await resp.json()) as {
        message_id: string;
        conversation_id: string;
        url: string;
      };

      if (!conversationId && json.conversation_id) {
        setConversationId(json.conversation_id);
        window.history.replaceState({}, "", `/app?c=${json.conversation_id}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: json.message_id,
          role: "user" as const,
          content: "[Voice message]",
          metadata: { type: "voice", attachment_url: json.url },
        },
      ]);

      router.refresh();
    },
    [conversationId, router],
  );
  const voiceRecorder = useVoiceRecorder(sendVoiceMessage);

  // Whisper STT — fills the text input from server-side transcription.
  const whisperRecorder = useWhisperRecorder(useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []));

  // Voice output (TTS)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // R13: tracks whether the current SSE turn opened a streaming audio
  // queue. When true, message_end SHOULDN'T also fire batched playTTS —
  // the streaming queue is already producing audio.
  const streamingAudioActiveRef = useRef(false);
  const [playingMessageIdx, setPlayingMessageIdx] = useState<number | null>(
    null,
  );
  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = "";
    }
    setPlayingMessageIdx(null);
    // R13: also flush the streaming audio queue so a half-spoken
    // response stops the moment the user starts a new turn.
    void import("./voice/streamingAudio").then((m) => m.stopAll());
    streamingAudioActiveRef.current = false;
  }, []);

  // Global ESC + window event lets any other component cancel playback.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && playingMessageIdx !== null) stopAudio();
    };
    const onStop = () => stopAudio();
    window.addEventListener("keydown", onKey);
    window.addEventListener("conduit:stopAudio", onStop);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("conduit:stopAudio", onStop);
    };
  }, [playingMessageIdx, stopAudio]);
  const playTTS = useCallback(
    async (text: string, employee: EmployeeKey, idx: number) => {
      if (!voice.ttsAllowed || !text.trim()) return;
      try {
        const r = await fetch("/api/conduit/voice/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, employee }),
        });
        if (!r.ok) return;
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const a = audioRef.current;
        a.src = url;
        a.onended = () => {
          setPlayingMessageIdx(null);
          URL.revokeObjectURL(url);
        };
        setPlayingMessageIdx(idx);
        await a.play().catch(() => {
          setPlayingMessageIdx(null);
        });
      } catch {
        // Silently swallow — voice is best-effort.
      }
    },
    [voice.ttsAllowed],
  );

  // Broadcast streaming employee to the Sidebar (and any other listener).
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("conduit:stream", {
        detail: { employee: streamingEmployee },
      }),
    );
  }, [streamingEmployee]);

  useEffect(() => {
    return () => {
      // On unmount, clear streaming so sidebar resets.
      window.dispatchEvent(
        new CustomEvent("conduit:stream", { detail: { employee: null } }),
      );
    };
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(initialId);
    setHasMore(initialHasMore);
  }, [initialId, initialMessages, initialHasMore]);

  // Scroll to bottom when new messages arrive at the bottom (not when prepending older ones).
  const prevMsgCountRef = useRef(initialMessages.length);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevMsgCountRef.current;
    const curr = messages.length;
    // Only auto-scroll when messages were appended (new turn), not prepended (older history).
    if (curr > prev && !loadingOlder) {
      el.scrollTop = el.scrollHeight;
    }
    prevMsgCountRef.current = curr;
  }, [messages, loadingOlder]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingOlder || !hasMore) return;
    const oldestId = messages.find((m) => m.id)?.id;
    if (!oldestId) return;

    setLoadingOlder(true);
    try {
      const params = new URLSearchParams({
        conversation_id: conversationId,
        before_id: oldestId,
      });
      const res = await fetch(`/api/conduit/messages?${params.toString()}`);
      if (!res.ok) return;
      const json = (await res.json()) as {
        messages: MessageRow[];
        hasMore: boolean;
      };

      if (json.messages.length === 0) {
        setHasMore(false);
        return;
      }

      // Preserve scroll position: capture height before prepend, restore after.
      const el = scrollRef.current;
      const prevHeight = el?.scrollHeight ?? 0;

      setMessages((prev) => [...json.messages, ...prev]);
      setHasMore(json.hasMore);

      // After React has flushed the DOM update, restore the scroll offset.
      requestAnimationFrame(() => {
        if (el) {
          el.scrollTop = el.scrollHeight - prevHeight;
        }
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, hasMore, loadingOlder, messages]);

  // Watch the top sentinel; fire loadOlderMessages when it enters the viewport.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadOlderMessages();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlderMessages]);

  const send = useCallback(
    async (text: string, employeePin?: EmployeeKey) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setSendError(null);
      setLoading(true);
      setInput("");

      const explicitPin: PinValue | undefined =
        employeePin ?? (pin === "auto" ? undefined : pin);
      const isTeam = explicitPin === "team";
      const placeholderEmp: EmployeeKey = isTeam
        ? "jarvis"
        : (explicitPin as EmployeeKey | undefined) ?? "jarvis";
      setStreamingEmployee(placeholderEmp);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        // Round-table fan-out doesn't need a placeholder bubble (employees
        // populate their own as they finish). Single-employee path keeps the
        // existing pending placeholder.
        ...(isTeam
          ? ([
              {
                role: "system" as const,
                content: "Team round-table — employees weighing in",
                metadata: { round_table_banner: true },
              },
            ] as MessageRow[])
          : ([
              {
                role: "assistant" as const,
                employee: placeholderEmp,
                content: "",
                pending: true,
              },
            ] as MessageRow[])),
      ]);

      const body: Record<string, unknown> = { message: trimmed };
      if (conversationId) body.conversation_id = conversationId;
      if (explicitPin) body.employee_override = explicitPin;

      const resp = await fetch("/api/conduit/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok || !resp.body) {
        setStreamingEmployee(null);
        if (resp.status === 409) {
          router.refresh();
          return;
        }
        if (resp.status === 429) {
          const retryHeader = resp.headers.get("Retry-After");
          const seconds = retryHeader ? Math.max(1, parseInt(retryHeader, 10)) || 60 : 60;
          setRateLimitUntil(Date.now() + seconds * 1000);
          setMessages((prev) => {
            const next = [...prev];
            if (next[next.length - 1]?.pending) next.pop();
            return next;
          });
          setLoading(false);
          return;
        }
        const fallback =
          "Something hiccuped on my end. Try that again in a moment.";
        setMessages((prev) => {
          const next = [...prev];
          if (next[next.length - 1]?.pending) next.pop();
          return next;
        });
        setSendError({ text: fallback, retryText: trimmed });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let currentEmployee: EmployeeKey = placeholderEmp;

      const ensurePendingFor = (employee: EmployeeKey, handoffFrom?: EmployeeKey) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            return next;
          }
          next.push({
            role: "assistant",
            employee,
            content: "",
            pending: true,
            ...(handoffFrom ? { handoffFrom } : {}),
          });
          return next;
        });
      };

      const appendTo = (employee: EmployeeKey, delta: string) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            last.content += delta;
          }
          return next;
        });
      };

      const finishCurrent = (employee: EmployeeKey) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (
            last &&
            last.role === "assistant" &&
            last.pending &&
            last.employee === employee
          ) {
            last.pending = false;
          }
          return next;
        });
      };

      const recordArtifact = (
        employee: EmployeeKey,
        a: { id: string; title: string; type: string },
      ) => {
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            const m = next[i];
            if (m.role === "assistant" && m.employee === employee) {
              m.artifacts = [...(m.artifacts ?? []), a];
              break;
            }
          }
          return next;
        });
      };

      const handleEvent = (event: string, data: Record<string, unknown>) => {
        if (event === "audio") {
          // R13: PCM16 chunk piggybacking on the chat SSE stream. Decode +
          // queue into the Web Audio scheduler so playback overlaps with
          // remaining tokens.
          const pcm = data.pcm as string | undefined;
          if (pcm) {
            void import("./voice/streamingAudio").then((m) => m.pushChunk(pcm));
          }
          return;
        }
        if (event === "audio_start") {
          streamingAudioActiveRef.current = true;
          return;
        }
        if (event === "audio_end") {
          // Keep the flag set briefly so message_end's batched playTTS
          // doesn't double up; the queue itself drains naturally.
          return;
        }
        if (event === "token") {
          const employee = (data.employee as EmployeeKey) || currentEmployee;
          currentEmployee = employee;
          setStreamingEmployee(employee);
          ensurePendingFor(employee);
          appendTo(employee, (data.delta as string) || "");
        } else if (event === "handoff") {
          const from = currentEmployee;
          const to = data.to as EmployeeKey;
          finishCurrent(from);
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `→ ${employeeLabel(to)} taking this`,
              handoffTo: to,
            },
          ]);
          currentEmployee = to;
          setStreamingEmployee(to);
          ensurePendingFor(to, from);
        } else if (event === "message_end") {
          const employee = (data.employee as EmployeeKey) || currentEmployee;
          finishCurrent(employee);
          // Auto-play the just-finished message if voice is on AND R13's
          // streaming TTS didn't already produce audio for this turn.
          const streamingPlayed = streamingAudioActiveRef.current;
          streamingAudioActiveRef.current = false;
          if (
            !streamingPlayed &&
            voice.enabled &&
            voice.autoPlay &&
            voice.ttsAllowed
          ) {
            // Capture state via closure-safe ref pattern: read from latest setMessages
            setMessages((prev) => {
              for (let i = prev.length - 1; i >= 0; i--) {
                const m = prev[i];
                if (m.role === "assistant" && m.employee === employee) {
                  const text = m.content;
                  if (text && text.length > 1) {
                    void playTTS(text, employee, i);
                  }
                  break;
                }
              }
              return prev;
            });
          }
        } else if (event === "artifact") {
          recordArtifact(
            (data.employee as EmployeeKey) || currentEmployee,
            {
              id: data.id as string,
              title: data.title as string,
              type: data.type as string,
            },
          );
        } else if (event === "memory_written") {
          const mem = {
            id: data.id as string,
            kind: data.kind as string,
            content: data.content as string,
            tags: (data.tags as string[]) ?? [],
          };
          setMessages((prev) => {
            const next = [...prev];
            // Attach to the most recent Atlas assistant message.
            for (let i = next.length - 1; i >= 0; i--) {
              const m = next[i];
              if (m.role === "assistant" && m.employee === "jarvis") {
                m.memories = [...(m.memories ?? []), mem];
                break;
              }
            }
            return next;
          });
        } else if (event === "round_table_thinking") {
          const emp = data.employee as EmployeeKey;
          // Insert a placeholder pending bubble for this employee
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              employee: emp,
              content: "",
              pending: true,
              metadata: { round_table: true },
            },
          ]);
        } else if (event === "round_table_response") {
          const emp = data.employee as EmployeeKey;
          const content = (data.content as string) || "";
          // Resolve the matching pending bubble (last one for this employee)
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              const m = next[i];
              if (
                m.role === "assistant" &&
                m.pending &&
                m.employee === emp &&
                m.metadata &&
                (m.metadata as Record<string, unknown>).round_table
              ) {
                m.pending = false;
                m.content = content;
                if (
                  voice.enabled &&
                  voice.autoPlay &&
                  voice.ttsAllowed &&
                  content.length > 1
                ) {
                  void playTTS(content, emp, i);
                }
                break;
              }
            }
            return next;
          });
        } else if (event === "round_table_synthesis_start") {
          // Banner + pending Atlas bubble
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: "Synthesis from Atlas",
              metadata: { round_table_banner: true },
            },
            {
              role: "assistant",
              employee: "jarvis",
              content: "",
              pending: true,
              metadata: { round_table_synthesis: true },
            },
          ]);
        } else if (event === "round_table_synthesis") {
          const content = (data.content as string) || "";
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              const m = next[i];
              if (
                m.role === "assistant" &&
                m.pending &&
                m.employee === "jarvis" &&
                m.metadata &&
                (m.metadata as Record<string, unknown>).round_table_synthesis
              ) {
                m.pending = false;
                m.content = content;
                if (
                  voice.enabled &&
                  voice.autoPlay &&
                  voice.ttsAllowed &&
                  content.length > 1
                ) {
                  void playTTS(content, "jarvis", i);
                }
                break;
              }
            }
            return next;
          });
        } else if (event === "round_table_rate_limited") {
          setMessages((prev) => {
            const next = [...prev];
            // Replace the round-table banner with the rate-limit notice
            next.push({
              role: "system",
              content: (data.message as string) || "Round-table rate limited.",
              metadata: { round_table_rate_limited: true },
            });
            return next;
          });
        } else if (event === "round_table_start" || event === "round_table_end") {
          // Banners — no UI action needed beyond what runs above.
        } else if (event === "paywall_required") {
          // Suppress for internal accounts (defensive — server already gates).
          if (!internalAccount) {
            setPaywall({
              reason: data.reason as PaywallPayload["reason"],
              message: (data.message as string) || "Upgrade required.",
              employee: data.employee as string | undefined,
              intent: data.intent as string | undefined,
              tier_id: data.tier_id as PaywallPayload["tier_id"],
              tokens_used: data.tokens_used as number | undefined,
              tokens_allowance: data.tokens_allowance as number | undefined,
            });
          }
          // For cap_reached / employee_locked, no message will follow — finish.
          if (
            data.reason === "cap_reached" ||
            data.reason === "employee_locked"
          ) {
            finishCurrent(currentEmployee);
          }
        } else if (event === "done") {
          const cid = data.conversation_id as string;
          if (cid && cid !== conversationId) {
            setConversationId(cid);
            window.history.replaceState({}, "", `/app?c=${cid}`);
          }
        } else if (event === "error") {
          setMessages((prev) => {
            const next = [...prev];
            if (next[next.length - 1]?.pending) next.pop();
            return next;
          });
          setSendError({
            text: (data.message as string) || "Try again in a moment.",
            retryText: trimmed,
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) event = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataLine = line.slice(6);
          }
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine);
            handleEvent(event, data);
          } catch {
            // ignore malformed event
          }
        }
      }

      setStreamingEmployee(null);
      setLoading(false);
      router.refresh();
    },
    [conversationId, loading, pin, router],
  );

  // Handle edit submit: soft-hide from the edited message onwards, then resend.
  const submitEdit = useCallback(
    async (messageId: string, newText: string) => {
      if (!newText.trim() || loading) return;
      setEditingMessageId(null);

      // Optimistically remove messages from the edit point in the local state.
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx === -1) return prev;
        return prev.slice(0, idx);
      });

      // Soft-hide on the server (fire-and-forget; chat will rehydrate on refresh).
      void fetch(`/api/conduit/messages/${messageId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "hide_from" }),
      });

      await send(newText);
    },
    [loading, send],
  );

  return (
    <>
      {showSpecialistSelector && (
        <SpecialistSelectorModal
          allowedEmployees={allowedEmployees}
          onSelect={(specialist) => {
            persistSpecialistChoice(
              (specialist as EmployeeId | null) ?? "auto",
            );
            if (specialist) setPin(specialist as PinValue);
          }}
        />
      )}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8"
      >
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Top sentinel + pagination state — only shown when a conversation is loaded */}
          {conversationId && (
            <div className="flex items-center justify-between pb-2">
              <div ref={topSentinelRef} className="flex-1 flex justify-center">
                {loadingOlder ? (
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Loading older messages…
                  </span>
                ) : !hasMore && messages.length > 0 ? (
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    All messages loaded
                  </span>
                ) : null}
              </div>
              {messages.length > 0 && (
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={exportConversation}
                    title="Download as Markdown"
                    aria-label="Download conversation as Markdown"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors"
                    style={{
                      color: "var(--color-text-muted)",
                      border: "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                      (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                    }}
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Markdown</span>
                  </button>
                  {conversationId && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `/api/conduit/conversations/${conversationId}/export`,
                          "_blank",
                        )
                      }
                      title="Print / Save as PDF"
                      aria-label="Print conversation or save as PDF"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors"
                      style={{
                        color: "var(--color-text-muted)",
                        border: "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--color-text)";
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                      }}
                    >
                      <FileText size={12} />
                      <span className="hidden sm:inline">PDF</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {companyBrief && messages.length === 0 && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 6%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
                color: "var(--color-text-muted)",
              }}
            >
              <span
                aria-hidden
                className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--color-accent)" }}
              />
              <span>
                <span style={{ color: "var(--color-accent-hi)", fontWeight: 500 }}>Brief active</span>
                {" — "}
                {companyBrief.length > 80 ? companyBrief.slice(0, 80) + "…" : companyBrief}
              </span>
            </div>
          )}

          {messages.length === 0 && (
            <EmptyState
              firstName={firstName}
              onSend={send}
              suggestions={suggestions}
              isFirstRun={isFirstRun}
            />
          )}

          {messages.map((m, i) => (
            <MessageBubble
              key={m.id ?? i}
              message={m}
              onOpenArtifact={(id) => setDrawerArtifactId(id)}
              playing={playingMessageIdx === i}
              onStopAudio={stopAudio}
              onReplayAudio={
                voice.ttsAllowed && m.role === "assistant" && m.employee
                  ? () => playTTS(m.content, m.employee as EmployeeKey, i)
                  : undefined
              }
              isEditing={editingMessageId === m.id}
              onEditStart={
                m.role === "user" && m.id && !loading
                  ? () => setEditingMessageId(m.id!)
                  : undefined
              }
              onEditCancel={() => setEditingMessageId(null)}
              onEditSubmit={
                m.id ? (text) => void submitEdit(m.id!, text) : undefined
              }
            />
          ))}

          {sendError && (
            <div
              className="conduit-card flex items-start gap-3 p-4"
              style={{
                borderColor: "rgba(248, 113, 113, 0.25)",
                background: "rgba(248, 113, 113, 0.06)",
              }}
            >
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5"
                style={{ color: "#f87171" }}
              />
              <p
                className="flex-1 text-sm leading-relaxed"
                style={{ color: "var(--color-text)" }}
              >
                {sendError.text}
              </p>
              <button
                type="button"
                onClick={() => {
                  const retry = sendError.retryText;
                  setSendError(null);
                  void send(retry);
                }}
                className="shrink-0 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--color-ember-500)" }}
              >
                Try again
              </button>
            </div>
          )}
          {rateLimitUntil && (
            <motion.div
              role="status"
              aria-live="polite"
              className="conduit-card flex items-center gap-3 p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
              style={{
                borderColor: "rgba(202, 138, 4, 0.30)",
                background: "rgba(202, 138, 4, 0.06)",
              }}
            >
              <AlertCircle
                size={16}
                className="shrink-0"
                style={{ color: "var(--color-amber, #ca8a04)" }}
              />
              <p className="flex-1 text-sm" style={{ color: "var(--color-text)" }}>
                Ready again in{" "}
                <span className="font-medium tabular-nums">{rateLimitSecondsLeft} s</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div
        className="px-4 md:px-8 py-3 md:py-4"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "48rem" }}>
          <PraxisComposerPill
            value={input}
            onChange={(next) => {
              // R13: any user typing into the chat stops in-flight streaming
              // audio so the user's attention isn't competing with the
              // agent's voice.
              if (
                next.length > input.length &&
                (playingMessageIdx !== null || streamingAudioActiveRef.current)
              ) {
                stopAudio();
              }
              setInput(next);
            }}
            onSubmit={() => {
              if (speech.listening) speech.stop();
              send(input);
            }}
            pin={pin as PraxisPinValue}
            pinOptions={pinOptions as { value: PraxisPinValue; label: string }[]}
            onPinChange={(next) => setPin(next as PinValue)}
            speechSupported={speech.supported}
            speechListening={speech.listening}
            onSpeechToggle={() => {
              if (!speech.supported) return;
              if (speech.listening) {
                speech.stop();
                const t = lastTranscriptRef.current.trim();
                if (t) setTimeout(() => send(t), 0);
              } else {
                speech.start();
              }
            }}
            loading={loading || Boolean(rateLimitUntil)}
            streamingEmployee={streamingEmployee as EmployeeId | null}
            placeholder={speech.listening ? "Listening…" : "Talk to your team…"}
            voiceMessageSupported={voiceRecorder.supported}
            voiceRecordingState={voiceRecorder.state}
            voiceRecordingSeconds={voiceRecorder.elapsedSeconds}
            onVoiceRecordStart={() => void voiceRecorder.start()}
            onVoiceRecordStop={() => voiceRecorder.stop()}
            onVoiceRecordCancel={() => voiceRecorder.cancel()}
            whisperSupported={whisperRecorder.supported}
            whisperState={whisperRecorder.state}
            onWhisperStart={() => void whisperRecorder.start()}
            onWhisperStop={() => whisperRecorder.stop()}
            onWhisperCancel={() => whisperRecorder.cancel()}
          />
          <div
            className="mt-2 h-4 text-center"
            style={{ fontSize: "11px" }}
          >
            {streamingEmployee ? (
              <span
                className="presence-line"
                style={{ color: DEPT_COLOR[streamingEmployee] }}
              >
                {employeeLabel(streamingEmployee)} is thinking…
              </span>
            ) : (
              <>
                <span className="hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>
                  Shift+Enter for newline
                </span>
                <span className="sm:hidden" style={{ color: "var(--color-text-muted)" }}>
                  Tap send to submit
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {drawerArtifactId && (
        <ArtifactDrawer
          artifactId={drawerArtifactId}
          onClose={() => setDrawerArtifactId(null)}
        />
      )}

      {paywall && (
        <PaywallModal
          payload={paywall}
          onClose={() => setPaywall(null)}
        />
      )}

      {playingMessageIdx !== null && (() => {
        const speakingEmp =
          (messages[playingMessageIdx]?.employee as EmployeeKey | null) ?? null;
        const deptColor = speakingEmp
          ? DEPT_COLOR[speakingEmp]
          : "var(--color-accent)";
        return (
          <button
            onClick={stopAudio}
            className="fixed bottom-24 right-6 md:bottom-6 z-30 conduit-card px-4 py-2.5 text-xs flex items-center gap-2 transition-colors"
            style={{
              borderColor: deptColor,
              color: deptColor,
            }}
            aria-label="Stop voice playback"
            title="ESC to stop"
          >
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ background: deptColor }}
            />
            Stop voice
          </button>
        );
      })()}
    </>
  );
}

const FIRST_RUN_SUGGESTIONS: Suggestion[] = [
  {
    text: "Write a go-to-market plan for my product",
    pin: "marketing",
    dept: "marketing",
    hint: "Marketing builds the plan",
  },
  {
    text: "Draft an investor update email",
    dept: "jarvis",
    hint: "Atlas routes to the right specialist",
  },
  {
    text: "Build a cold outreach sequence for my first 50 leads",
    pin: "sales",
    dept: "sales",
    hint: "Sales builds the play",
  },
  {
    text: "Set up an SOP for client onboarding",
    pin: "ops",
    dept: "ops",
    hint: "Operations documents it",
  },
];

function EmptyState({
  firstName,
  onSend,
  suggestions,
  isFirstRun = false,
}: {
  firstName: string;
  onSend: (text: string, pin?: EmployeeKey) => void;
  suggestions: Suggestion[];
  isFirstRun?: boolean;
}) {
  const copy = composeChatEmptyCopy({
    firstName,
    timeOfDay: timeOfDayBucket(),
  });

  const activeSuggestions = isFirstRun ? FIRST_RUN_SUGGESTIONS : suggestions;

  return (
    <div
      style={{
        paddingTop: "var(--space-8)",
      }}
    >
      {isFirstRun ? (
        <>
          <p className="praxis-eyebrow">
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: "var(--color-green)",
                boxShadow:
                  "0 0 6px color-mix(in srgb, var(--color-green) 70%, transparent)",
                display: "inline-block",
              }}
            />
            Your team is ready · {firstName}
          </p>
          <div
            style={{
              marginTop: "var(--space-4)",
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
            }}
          >
            <PraxisAvatar employee="jarvis" size="xl" pulse="ambient" />
            <h1 className="praxis-display-1">
              What should your team work on first?
            </h1>
          </div>
          <p
            className="praxis-body-lg"
            style={{ marginTop: "var(--space-4)", maxWidth: "36rem" }}
          >
            Pick a task below or type anything — Atlas will route it to the
            right specialist on your team.
          </p>
        </>
      ) : (
        <>
          <p className="praxis-eyebrow">
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: "var(--color-green)",
                boxShadow:
                  "0 0 6px color-mix(in srgb, var(--color-green) 70%, transparent)",
                display: "inline-block",
              }}
            />
            {copy.eyebrow} · {firstName}
          </p>
          <div
            style={{
              marginTop: "var(--space-4)",
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-3)",
            }}
          >
            <PraxisAvatar employee="jarvis" size="xl" pulse="ambient" />
            <h1 className="praxis-display-1">{copy.headline}</h1>
          </div>
          <p
            className="praxis-body-lg"
            style={{ marginTop: "var(--space-4)", maxWidth: "36rem" }}
          >
            {copy.subline}
          </p>
        </>
      )}
      <div
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{
          marginTop: "var(--space-8)",
          gap: "var(--space-3)",
        }}
      >
        {activeSuggestions.map((s) => (
          <PraxisSuggestionTile
            key={s.text}
            dept={s.dept}
            hint={s.hint}
            prompt={s.text}
            pin={s.pin}
            onSelect={(text, pin) => onSend(text, pin)}
          />
        ))}
      </div>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  onOpenArtifact,
  playing = false,
  onStopAudio,
  onReplayAudio,
  isEditing = false,
  onEditStart,
  onEditCancel,
  onEditSubmit,
}: {
  message: MessageRow;
  onOpenArtifact: (id: string) => void;
  playing?: boolean;
  onStopAudio?: () => void;
  onReplayAudio?: () => void;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
  onEditSubmit?: (text: string) => void;
}) {
  const [editDraft, setEditDraft] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  // Reset draft to current content when entering edit mode.
  useEffect(() => {
    if (isEditing) {
      setEditDraft(message.content);
    }
  }, [isEditing, message.content]);

  // Focus the textarea when entering edit mode.
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      const len = editRef.current.value.length;
      editRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  if (message.role === "user") {
    const meta = (message.metadata ?? {}) as Record<string, unknown>;
    const isVoice = meta.type === "voice";
    const voiceUrl = (meta.attachment_url as string | undefined) ?? null;

    if (isEditing && !isVoice) {
      return (
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
        >
          <div className="w-full max-w-[85%] space-y-2">
            <textarea
              ref={editRef}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (editDraft.trim()) onEditSubmit?.(editDraft.trim());
                }
                if (e.key === "Escape") onEditCancel?.();
              }}
              rows={Math.max(2, editDraft.split("\n").length)}
              className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-none outline-none"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-accent)",
                color: "var(--color-text)",
                fontFamily: "inherit",
              }}
              aria-label="Edit message"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onEditCancel}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editDraft.trim()}
                onClick={() => { if (editDraft.trim()) onEditSubmit?.(editDraft.trim()); }}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-40"
                style={{
                  background: "var(--color-accent)",
                  color: "#0A0908",
                  fontWeight: 600,
                }}
              >
                Save &amp; resend
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="flex justify-end group"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="flex flex-col items-end gap-1 max-w-[85%]">
          <div className="conduit-bubble-user px-4 py-3 text-[var(--color-text)]">
            {isVoice && voiceUrl ? (
              <audio
                controls
                src={voiceUrl}
                aria-label="Voice message"
                style={{ maxWidth: "260px", outline: "none" }}
              />
            ) : (
              <span className="whitespace-pre-wrap">{message.content}</span>
            )}
          </div>
          {onEditStart && !isVoice && (
            <button
              type="button"
              onClick={onEditStart}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-[11px] px-2 py-0.5 rounded"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Edit message"
            >
              Edit
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  if (message.role === "system" && message.handoffTo) {
    const from: EmployeeId = "jarvis";
    return (
      <motion.div
        style={{ marginTop: "var(--space-3)", marginBottom: "var(--space-3)" }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      >
        <PraxisHandoffBaton
          from={from}
          to={message.handoffTo as EmployeeId}
          label={`${employeeLabel("jarvis" as EmployeeKey)} → ${employeeLabel(message.handoffTo)}`}
        />
      </motion.div>
    );
  }

  if (message.role === "system") {
    const meta = (message.metadata ?? {}) as Record<string, unknown>;
    if (meta.round_table_banner || meta.round_table_rate_limited) {
      return (
        <div className="handoff-card flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            {message.content}
          </span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>
      );
    }
    return null;
  }

  const employee = (message.employee as EmployeeKey) ?? "jarvis";
  const empty = !message.content && message.pending;

  // Before any tokens arrive: render a dedicated accessible typing indicator.
  if (empty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
      >
        <TypingIndicator employee={employee} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex gap-3"
      style={{ ["--dept" as string]: DEPT_COLOR[employee] }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="pt-1 shrink-0">
        <EmployeeAvatar employee={employee} size={32} active={message.pending} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[12px] font-medium"
            style={{ color: DEPT_COLOR[employee] }}
          >
            {employeeLabel(employee)}
          </span>
          {message.handoffFrom && (
            <motion.span
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              aria-label={`Handed off from ${employeeLabel(message.handoffFrom as EmployeeKey)}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-[0.1em]"
              style={{
                background: `color-mix(in srgb, ${DEPT_COLOR[message.handoffFrom as EmployeeKey]} 12%, var(--color-surface-elevated))`,
                color: DEPT_COLOR[message.handoffFrom as EmployeeKey],
                border: `1px solid color-mix(in srgb, ${DEPT_COLOR[message.handoffFrom as EmployeeKey]} 28%, transparent)`,
              }}
            >
              ← {employeeLabel(message.handoffFrom as EmployeeKey)}
            </motion.span>
          )}
          {message.pending && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              writing…
            </span>
          )}
          {playing && (
            <button
              onClick={onStopAudio}
              className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]"
              style={{ color: DEPT_COLOR[employee] }}
              aria-label="Stop audio"
            >
              <span className="inline-flex items-end gap-[2px] h-3">
                <span
                  className="w-[2px] rounded-sm"
                  style={{
                    background: DEPT_COLOR[employee],
                    height: "8px",
                    animation: "wave1 1s ease-in-out infinite",
                  }}
                />
                <span
                  className="w-[2px] rounded-sm"
                  style={{
                    background: DEPT_COLOR[employee],
                    height: "12px",
                    animation: "wave2 1s ease-in-out infinite",
                  }}
                />
                <span
                  className="w-[2px] rounded-sm"
                  style={{
                    background: DEPT_COLOR[employee],
                    height: "6px",
                    animation: "wave3 1s ease-in-out infinite",
                  }}
                />
              </span>
              Speaking
            </button>
          )}
          {!playing && !message.pending && onReplayAudio && (
            <button
              onClick={onReplayAudio}
              className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              aria-label="Replay audio"
            >
              ▶ Listen
            </button>
          )}
        </div>
        <div className="conduit-bubble-assistant px-4 py-3 text-[var(--color-text)]">
          <MarkdownRenderer
            content={message.content}
            streaming={message.pending}
            caretColor={message.pending ? DEPT_COLOR[employee] : undefined}
          />
        </div>
        {message.memories?.map((mem) => (
          <div
            key={mem.id}
            className="mt-2 inline-flex items-center gap-2 text-[11px] hairline rounded-full pl-2 pr-3 py-1 max-w-full"
            style={{
              borderColor: "color-mix(in srgb, var(--color-accent) 35%, transparent)",
              background: "color-mix(in srgb, var(--color-accent) 6%, transparent)",
            }}
          >
            <span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--color-accent)" }}
            />
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.15em] text-[10px]">
              {mem.kind} remembered
            </span>
            <span className="text-[var(--color-text)] truncate max-w-[40ch]">
              {mem.content}
            </span>
          </div>
        ))}
        {message.artifacts?.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpenArtifact(a.id)}
            style={{
              ["--dept" as string]: DEPT_COLOR[employee],
            }}
            className="mt-2 group conduit-card border-l-[3px] hover:border-l-[3px] px-4 py-3 text-left flex items-start gap-3 hover:border-[var(--dept)] transition-colors w-full max-w-md"
          >
            <span
              className="mt-0.5 inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
              style={{ background: DEPT_COLOR_SOFT[employee] }}
            >
              <FileText size={16} style={{ color: DEPT_COLOR[employee] }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {a.type.replace("_", " ")} · by {employeeLabel(employee)}
              </span>
              <span className="block text-sm text-[var(--color-text)] mt-0.5 truncate">
                {a.title}
              </span>
              <span className="block text-[11px] text-[var(--color-text-muted)] mt-1 inline-flex items-center gap-1 group-hover:text-[var(--color-text)]">
                Open in drawer
                <ArrowRight size={11} />
              </span>
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
});

function ArtifactDrawer({
  artifactId,
  onClose,
}: {
  artifactId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    title: string;
    content: string;
    type: string;
    produced_by: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/conduit/artifacts/${artifactId}`);
      if (r.ok) {
        const j = await r.json();
        setData(j.artifact);
      }
    })();
  }, [artifactId]);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div onClick={onClose} className="flex-1 bg-black/60" />
      <div className="w-full max-w-2xl bg-[var(--color-surface-elevated)] border-l border-[var(--color-border)] overflow-y-auto p-6 md:p-8">
        {!data ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {data.type.replace("_", " ")} · by {data.produced_by}
                </div>
                <h2 className="serif text-2xl md:text-3xl mt-1 leading-tight">
                  {data.title}
                </h2>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(data.content)
                  }
                  className="btn-secondary !px-3 !py-2 !text-xs"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([data.content], {
                      type: "text/markdown",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${data.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn-secondary !px-3 !py-2 !text-xs"
                >
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[var(--color-text)] leading-relaxed text-[15px]">
              {data.content}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
