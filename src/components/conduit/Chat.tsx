"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Check, Copy, Download, FileText, Link, Pin, Search, Share2, Tag, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { UpgradeCTABanner } from "./UpgradeCTABanner";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { MESSAGE_SENT } from "@/lib/ui/motion";
import { CX_ACCENT_BRIGHT, CX_REWARD } from "@/lib/design-system/cx-tokens";
import type { EmployeeKey } from "@/lib/ai/provider";
import {
  DEPT_COLOR,
  DEPT_COLOR_SOFT,
  employeeLabel,
  SpecialistChip,
} from "./EmployeeBadge";
import { SpecialistAvatar } from "./SpecialistAvatar";
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
import { EMPLOYEES, EMPLOYEE_ORDER, type EmployeeId } from "@/lib/conduit/employees";
import { ThinkingBubble, THINKING_STATUS, ROUTING_TO_STATUS } from "./TypingIndicator";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  SpecialistSelectorModal,
  useSpecialistChoice,
} from "./SpecialistSelectorModal";
import {
  PinnedMessagesBanner,
  type PinnedMessage,
} from "./PinnedMessagesBanner";
import { useToast } from "@/context/ToastContext";
import { useRewardMoment } from "@/context/RewardMomentContext";
import { useNicknames } from "@/context/NicknameContext";
import { useSetBreadcrumb } from "@/context/TopBarContext";
import { SaveOutputButton } from "./SaveOutputButton";
import { track } from "@/lib/analytics/track";
import { ConversationLabelManager, type ConversationLabel } from "./ConversationLabels";
import { Tooltip } from "./pdl/Tooltip";
import { SpecialistEmptyArt } from "./SpecialistEmptyArt";
import { Button, PraxisButton } from "@/components/conduit/ui/Button";

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
  feedback?: 1 | -1 | null;
  created_at?: string | null;
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


const SPECIALIST_PROMPTS: Record<EmployeeId, string> = {
  jarvis: "Help me prioritize what to work on this week across my business",
  marketing: "Draft a LinkedIn post announcing our new product feature",
  sales: "Write a cold email sequence targeting e-commerce founders",
  engineering: "Help me design a CRM system for my small business",
  finance: "Analyze my business's cash flow and suggest cost-saving measures",
  compliance: "What are my main compliance requirements for handling customer data?",
  hr: "Draft a job description for a part-time customer support specialist",
  ops: "Create an SOP for onboarding new clients to my consulting business",
  legal: "Review this SaaS contract clause for potential liability risks",
};

// Three contextual starter prompts shown when a user opens a fresh conversation
// with a specific pinned specialist. Tapping inserts the text into the input
// so the user can edit before sending.
const SPECIALIST_STARTER_PROMPTS: Record<EmployeeId, [string, string, string]> = {
  jarvis: [
    "Give me a weekly execution brief",
    "What should I be focused on this quarter?",
    "Review my biggest open risks",
  ],
  marketing: [
    "Write a launch email for our new product",
    "Draft a LinkedIn post announcing our funding",
    "Build a content calendar for Q3",
  ],
  sales: [
    "Write a cold outreach sequence for SaaS founders",
    "Help me handle the 'too expensive' objection",
    "Create a battle card vs. a competitor",
  ],
  engineering: [
    "Design a CRM system for my small business",
    "Review my tech stack and suggest improvements",
    "Write a technical spec for a new feature",
  ],
  finance: [
    "Analyze my revenue and suggest cost-saving measures",
    "Build a 12-month cash flow projection",
    "Help me set up a budget for a new hire",
  ],
  compliance: [
    "What are my GDPR obligations as a SaaS company?",
    "Review my privacy policy for gaps",
    "Walk me through SOC 2 readiness basics",
  ],
  hr: [
    "Draft a job description for a customer success manager",
    "Write an offer letter for a full-time engineer",
    "Create an employee onboarding checklist",
  ],
  ops: [
    "Create an SOP for onboarding new clients",
    "Design a project management workflow for my team",
    "Write a vendor evaluation scorecard",
  ],
  legal: [
    "Draft a basic NDA for a contractor",
    "Review this SaaS contract clause for liability risks",
    "Explain the difference between an employee and a contractor",
  ],
};

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
  conversationTitle: initialTitle = null,
  initialMessages,
  initialHasMore = false,
  firstName,
  internalAccount = false,
  voice = { enabled: false, autoPlay: true, ttsAllowed: false },
  allowedEmployees,
  isFirstRun = false,
  companyBrief = null,
  handoffConversationId: initialHandoffConvId = null,
  handoffEmployee: initialHandoffEmployee = null,
}: {
  conversationId: string | null;
  conversationTitle?: string | null;
  initialMessages: MessageRow[];
  initialHasMore?: boolean;
  firstName: string;
  internalAccount?: boolean;
  voice?: VoicePrefs;
  allowedEmployees: EmployeeKey[];
  isFirstRun?: boolean;
  companyBrief?: string | null;
  handoffConversationId?: string | null;
  handoffEmployee?: string | null;
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
  const { labelFor } = useNicknames();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversationId, setConversationId] = useState<string | null>(
    initialId,
  );
  const [currentTitle, setCurrentTitle] = useState<string | null>(initialTitle);
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pin, setPin] = useState<PinValue>("auto");
  const [mentionOverride, setMentionOverride] = useState<EmployeeKey | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const { hasChosen, persist: persistSpecialistChoice } = useSpecialistChoice();
  const showSpecialistSelector =
    hasChosen === false && messages.length === 0 && !conversationId;

  // Push specialist + conversation title into the top bar breadcrumb.
  const breadcrumbSpecialist =
    pin !== "auto" && pin !== "team" && pin in EMPLOYEES
      ? labelFor(pin as EmployeeKey)
      : undefined;
  useSetBreadcrumb(breadcrumbSpecialist, currentTitle ?? undefined);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // True when the scroll container is within 150px of the bottom — used to
  // decide whether auto-scroll should follow new content.
  const atBottomRef = useRef(true);
  const toast = useToast();
  const { triggerReward } = useRewardMoment();
  const [drawerArtifactId, setDrawerArtifactId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallPayload | null>(null);
  // Message edit: id of the user message currently being edited inline.
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [streamingEmployee, setStreamingEmployee] =
    useState<EmployeeKey | null>(null);
  // Routing target: set briefly during a handoff so the Atlas thinking bubble
  // can show "routing to Engineering…" before the new specialist slot appears.
  const [routingTarget, setRoutingTarget] = useState<EmployeeKey | null>(null);
  // Reward beat: set on message_end, auto-cleared after 700ms
  const [rewardEmployee, setRewardEmployee] = useState<EmployeeKey | null>(null);
  const rewardClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Round-table done beat: set per-specialist when their round_table_response arrives,
  // cleared after 600ms. Drives the per-bubble ✓ indicator.
  const [roundTableDoneEmployee, setRoundTableDoneEmployee] = useState<EmployeeKey | null>(null);
  const roundTableDoneClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Round-table: tracks which specialist is currently active (thinking/streaming).
  // null = none active yet, or round-table just ended.
  const [roundTableActiveEmployee, setRoundTableActiveEmployee] =
    useState<EmployeeKey | null>(null);
  const [sendError, setSendError] = useState<{
    text: string;
    retryText: string;
    capacity?: boolean;
  } | null>(null);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);

  // In-conversation message search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handoff state
  const [handoffInfo, setHandoffInfo] = useState<{
    conversationId: string;
    employee: string;
  } | null>(
    initialHandoffConvId && initialHandoffEmployee
      ? { conversationId: initialHandoffConvId, employee: initialHandoffEmployee }
      : null,
  );
  const [showHandoffPicker, setShowHandoffPicker] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);

  // Conversation labels
  const [assignedLabels, setAssignedLabels] = useState<ConversationLabel[]>([]);
  const [allLabels, setAllLabels] = useState<ConversationLabel[]>([]);

  // SSE connection resilience: tracks offline / reconnecting / reconnected state.
  const [connStatus, setConnStatus] = useState<'connected' | 'reconnecting' | 'reconnected' | 'failed'>('connected');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleAttempt = (attempt: number) => {
      if (navigator.onLine) {
        setConnStatus('reconnected');
        reconnectTimerRef.current = setTimeout(() => setConnStatus('connected'), 2000);
        return;
      }
      if (attempt >= 5) {
        setConnStatus('failed');
        return;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      reconnectTimerRef.current = setTimeout(() => scheduleAttempt(attempt + 1), delay);
    };

    const handleOffline = () => {
      clear();
      setConnStatus('reconnecting');
      scheduleAttempt(0);
    };

    const handleOnline = () => {
      clear();
      setConnStatus('reconnected');
      reconnectTimerRef.current = setTimeout(() => setConnStatus('connected'), 2000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clear();
    };
  }, []);

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

  // Track conversation title — updated by auto-generation and manual renames.
  useEffect(() => {
    const onTitleUpdated = (e: Event) => {
      const { conversation_id, title } = (e as CustomEvent<{ conversation_id: string; title: string }>).detail;
      if (conversation_id === conversationId && title) {
        setCurrentTitle(title);
      }
    };
    window.addEventListener("praxis:title_updated", onTitleUpdated);
    return () => window.removeEventListener("praxis:title_updated", onTitleUpdated);
  }, [conversationId]);

  // Sync browser tab title when the conversation title is set or updated.
  useEffect(() => {
    if (currentTitle) {
      document.title = `${currentTitle} — Praxis`;
    }
  }, [currentTitle]);

  // Focus search input when opened; close on Escape.
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Scroll to first search match when query changes.
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const el = document.querySelector<HTMLElement>("[data-search-match='true']");
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [searchQuery]);

  // Derive matching message indices — recalculated on query or messages change.
  const searchNeedle = searchQuery.trim().toLowerCase();
  const searchMatchSet = new Set<number>(
    searchNeedle
      ? messages.reduce<number[]>((acc, m, i) => {
          if (m.content.toLowerCase().includes(searchNeedle)) acc.push(i);
          return acc;
        }, [])
      : [],
  );

  // Export conversation as Markdown — client-side, no backend needed.
  const exportConversation = useCallback(() => {
    const visibleMessages = messages.filter(
      (m) => m.role === "user" || m.role === "assistant",
    );
    if (visibleMessages.length === 0) return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const exported = now.toISOString();
    const title = currentTitle || "Praxis Conversation";

    // Derive specialist slug from the first assistant message.
    const firstAssistant = visibleMessages.find(
      (m) => m.role === "assistant" && m.employee,
    );
    const specialistSlug = firstAssistant?.employee
      ? employeeLabel(firstAssistant.employee as EmployeeKey)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      : "conversation";

    const lines: string[] = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `date: ${today}`,
      `exported: ${exported}`,
      "---",
      "",
      `# ${title}`,
      "",
    ];

    for (const msg of visibleMessages) {
      if (msg.role === "user") {
        lines.push("**You**", "", msg.content.trim(), "", "---", "");
      } else if (msg.role === "assistant" && msg.employee) {
        const label = employeeLabel(msg.employee as EmployeeKey);
        lines.push(`**${label}**`, "", msg.content.trim(), "", "---", "");
      }
    }

    const md = lines.join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `praxis-${specialistSlug}-${today}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Conversation downloaded");
  }, [messages, currentTitle, toast]);

  // Copy a permalink to this conversation to the clipboard.
  const [linkCopied, setLinkCopied] = useState(false);
  const copyPermalink = useCallback(async () => {
    if (!conversationId) return;
    const url = `${window.location.origin}/app?c=${conversationId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for HTTP contexts where Clipboard API is blocked.
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 1500);
  }, [conversationId, toast]);

  // Load pinned messages when conversation is available.
  const loadPins = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/conduit/conversations/${convId}/pins`);
      if (!res.ok) return;
      const data = await res.json();
      setPinnedMessages(data.pins ?? []);
    } catch {
      // Network error — silently ignore
    }
  }, []);

  useEffect(() => {
    if (conversationId) void loadPins(conversationId);
    else setPinnedMessages([]);
  }, [conversationId, loadPins]);

  useEffect(() => {
    if (!conversationId) { setAssignedLabels([]); return; }
    Promise.all([
      fetch(`/api/conduit/labels`).then((r) => r.json()),
      fetch(`/api/conduit/conversations/${conversationId}/labels`).then((r) => r.json()),
    ])
      .then(([allData, assignedData]: [{ labels?: ConversationLabel[] }, { labels?: ConversationLabel[] }]) => {
        setAllLabels(allData.labels ?? []);
        setAssignedLabels(assignedData.labels ?? []);
      })
      .catch(() => {});
  }, [conversationId]);

  const performHandoff = useCallback(
    async (targetEmployee: EmployeeKey) => {
      if (!conversationId || handoffLoading) return;
      setHandoffLoading(true);
      setShowHandoffPicker(false);
      try {
        const res = await fetch(
          `/api/conduit/conversations/${conversationId}/handoff`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetEmployee }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.error === "already_handed_off") {
            toast.info("This conversation is already handed off.");
          } else {
            toast.error("Handoff failed. Please try again.");
          }
          return;
        }
        const { newConversationId } = await res.json();
        setHandoffInfo({ conversationId: newConversationId, employee: targetEmployee });
        router.push(`/app?c=${newConversationId}`);
      } catch {
        toast.error("Handoff failed. Please try again.");
      } finally {
        setHandoffLoading(false);
      }
    },
    [conversationId, handoffLoading, router, toast],
  );

  const handlePinToggle = useCallback(
    async (messageId: string, shouldPin: boolean) => {
      if (!conversationId) return;
      if (shouldPin) {
        // Optimistic: fetch the message content for the preview
        const msg = messages.find((m) => m.id === messageId);
        if (msg) {
          const tempPin: PinnedMessage = {
            id: `temp-${messageId}`,
            message_id: messageId,
            content: msg.content,
            role: msg.role,
            employee: msg.employee ?? null,
            pinned_at: new Date().toISOString(),
          };
          setPinnedMessages((prev) => [...prev, tempPin]);
        }
        const res = await fetch(
          `/api/conduit/conversations/${conversationId}/pins`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message_id: messageId }),
          },
        );
        if (res.ok) {
          void loadPins(conversationId); // refresh with real data
        } else if (res.status === 422) {
          // Revert optimistic + show limit
          setPinnedMessages((prev) =>
            prev.filter((p) => p.message_id !== messageId),
          );
        } else {
          setPinnedMessages((prev) =>
            prev.filter((p) => p.message_id !== messageId),
          );
        }
      } else {
        // Optimistic unpin
        setPinnedMessages((prev) =>
          prev.filter((p) => p.message_id !== messageId),
        );
        const res = await fetch(
          `/api/conduit/conversations/${conversationId}/pins/${messageId}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          void loadPins(conversationId); // revert by reloading
        }
      }
    },
    [conversationId, messages, loadPins],
  );

  const handleScrollToMessage = useCallback((messageId: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Brief highlight
      (el as HTMLElement).style.transition = "background 0.3s";
      (el as HTMLElement).style.background = "var(--color-surface-raised)";
      setTimeout(() => {
        (el as HTMLElement).style.background = "";
      }, 1200);
    }
  }, []);

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

  // Scroll to a specific message when arriving from conversation search (?msg=).
  useEffect(() => {
    const msgId = searchParams.get("msg");
    if (!msgId) return;
    // Give the DOM a moment to render messages, then scroll.
    const timer = setTimeout(() => {
      handleScrollToMessage(msgId);
      // Strip ?msg= so refresh doesn't re-trigger.
      const cid = searchParams.get("c");
      const path = cid ? `/app?c=${cid}` : "/app";
      window.history.replaceState({}, "", path);
    }, 350);
    return () => clearTimeout(timer);
    // Run only on mount.
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

  // Specialist quick-switch: digit keys 1–9 route to the nth specialist in sidebar order.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const digit = parseInt(e.key, 10);
      if (isNaN(digit) || digit < 1 || digit > 9) return;
      // Don't intercept keys while the user is typing.
      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable) return;
      const empKey = EMPLOYEE_ORDER[digit - 1] as EmployeeKey;
      if (!empKey || !allowedEmployees.includes(empKey)) return;
      setPin(empKey);
      toast.info(`→ ${labelFor(empKey)}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allowedEmployees, labelFor, toast]);

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

  // Track previous conversation so we can trigger auto-summary on switch.
  const prevConvIdRef = useRef<string | null>(initialId);
  const prevMsgLenRef = useRef<number>(initialMessages.length);

  useEffect(() => {
    const prevId = prevConvIdRef.current;
    const prevLen = prevMsgLenRef.current;
    // When the user navigates to a different conversation, summarize the one they left.
    if (prevId && prevId !== initialId && prevLen >= 4) {
      fetch(`/api/conduit/conversations/${prevId}/summarize`, { method: "POST" }).catch(
        () => {/* fire-and-forget */},
      );
    }
    prevConvIdRef.current = initialId;
    prevMsgLenRef.current = initialMessages.length;
    setMessages(initialMessages);
    setConversationId(initialId);
    setHasMore(initialHasMore);
  }, [initialId, initialMessages, initialHasMore]);

  // Track whether the user has scrolled away from the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smooth-scroll to bottom when a new message is added (new turn).
  // Stops if the user has manually scrolled up.
  const prevMsgCountRef = useRef(initialMessages.length);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = prevMsgCountRef.current;
    const curr = messages.length;
    if (curr > prev && !loadingOlder) {
      // Always follow when the user just sent something (two messages added at once:
      // user + pending assistant), or when they are already near the bottom.
      const added = curr - prev;
      const userJustSent = added >= 2;
      if (userJustSent || atBottomRef.current) {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        atBottomRef.current = true;
      }
    }
    prevMsgCountRef.current = curr;
  }, [messages.length, loadingOlder]);

  // During streaming, keep scrolling to bottom if the user is at the bottom.
  // Uses instant scroll (smooth would be jittery on rapid token updates).
  useEffect(() => {
    if (!loading) return;
    const el = scrollRef.current;
    if (!el || !atBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

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
      setFollowUpSuggestions([]);
      setLoading(true);
      setInput("");
      const wasNewConversation = !conversationId;
      // Capture and clear the one-off @mention override before the async send.
      const capturedMentionOverride = mentionOverride;
      setMentionOverride(null);

      // Track the first AI message ever sent — localStorage guards against repeat fires.
      try {
        const key = "praxis_first_ai_msg_v1";
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          track("first_ai_message_sent");
        }
      } catch { /* ignore — storage may be unavailable */ }

      // @mention override takes priority over the parameter pin and the persistent pin.
      const explicitPin: PinValue | undefined =
        capturedMentionOverride ?? (employeePin ?? (pin === "auto" ? undefined : pin));
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

      // RAF-batched token accumulation — collapse per-token setStates into
      // one DOM update per animation frame (~60fps) for smooth streaming perf.
      let tokenBuf = "";
      let tokenBufEmployee: EmployeeKey = placeholderEmp;
      let tokenRafId: number | null = null;

      const flushTokenBuf = () => {
        if (tokenBuf) {
          appendTo(tokenBufEmployee, tokenBuf);
          tokenBuf = "";
        }
        tokenRafId = null;
      };

      const scheduleTokenFlush = () => {
        if (!tokenRafId) tokenRafId = requestAnimationFrame(flushTokenBuf);
      };

      const flushTokenBufNow = () => {
        if (tokenRafId !== null) {
          cancelAnimationFrame(tokenRafId);
          tokenRafId = null;
        }
        flushTokenBuf();
      };

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

      const handleEvent = (event: string, data: Record<string, unknown>): Promise<void> | void => {
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
          if (employee !== tokenBufEmployee) {
            // Employee changed mid-stream — flush the old buffer before switching
            flushTokenBufNow();
            tokenBufEmployee = employee;
          }
          currentEmployee = employee;
          setStreamingEmployee(employee);
          ensurePendingFor(employee);
          tokenBuf += (data.delta as string) || "";
          scheduleTokenFlush();
        } else if (event === "handoff") {
          flushTokenBufNow();
          const from = currentEmployee;
          const to = data.to as EmployeeKey;
          // Stage 3: show "routing to Engineering…" in Atlas's bubble for 350ms
          // before transitioning to the new specialist's pending slot.
          return new Promise<void>((resolve) => {
            // Mark Atlas's pending message with the routing target so TypingIndicator
            // can render "routing to Engineering…" instead of "routing to your team…"
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant" && last.pending && last.employee === from) {
                next[next.length - 1] = {
                  ...last,
                  metadata: { ...(last.metadata ?? {}), routingTo: to },
                };
              }
              return next;
            });
            setRoutingTarget(to);
            setTimeout(() => {
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
              setRoutingTarget(null);
              ensurePendingFor(to, from);
              resolve();
            }, 350);
          });
        } else if (event === "message_end") {
          flushTokenBufNow();
          const employee = (data.employee as EmployeeKey) || currentEmployee;
          finishCurrent(employee);
          // Reward beat — ring pulse on every completion (sparks computed in render for significant)
          if (rewardClearTimerRef.current) clearTimeout(rewardClearTimerRef.current);
          setRewardEmployee(employee);
          rewardClearTimerRef.current = setTimeout(() => setRewardEmployee(null), 750);
          // Global confetti burst — fires from the composer area (bottom-center)
          triggerReward(
            typeof window !== "undefined"
              ? { x: window.innerWidth / 2, y: window.innerHeight - 80 }
              : undefined,
          );
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
        } else if (event === "follow_up_suggestions") {
          const sugs = data.suggestions as string[] | undefined;
          if (Array.isArray(sugs) && sugs.length > 0) {
            setFollowUpSuggestions(sugs);
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
          setRoundTableActiveEmployee(emp);
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
          // Mark this specialist as no longer active; next thinking event will set the new one.
          setRoundTableActiveEmployee((prev) => (prev === emp ? null : prev));
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
          // Done beat: briefly flag this specialist's bubble with a ✓ indicator
          if (roundTableDoneClearTimerRef.current) clearTimeout(roundTableDoneClearTimerRef.current);
          setRoundTableDoneEmployee(emp);
          roundTableDoneClearTimerRef.current = setTimeout(() => setRoundTableDoneEmployee(null), 600);
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
        } else if (event === "title_updated") {
          window.dispatchEvent(
            new CustomEvent("praxis:title_updated", {
              detail: {
                conversation_id: data.conversation_id as string,
                title: data.title as string,
              },
            }),
          );
        } else if (event === "done") {
          const cid = data.conversation_id as string;
          if (cid && cid !== conversationId) {
            setConversationId(cid);
            window.history.replaceState({}, "", `/app?c=${cid}`);
          }
          if (wasNewConversation && cid) {
            fetch(`/api/conduit/conversations/${cid}/auto-title`, { method: "PATCH" })
              .then((r) => (r.ok ? r.json() : null))
              .then((d: { ok: boolean; title?: string } | null) => {
                if (d?.title) {
                  window.dispatchEvent(
                    new CustomEvent("praxis:title_updated", {
                      detail: { conversation_id: cid, title: d.title },
                    }),
                  );
                }
              })
              .catch(() => {/* silent — title stays as first-message excerpt */});
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
            capacity: Boolean(data.capacity),
          });
        }
      };

      try {
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
              // Handoff events return a Promise (350ms routing pause); await it
              // so the routing micro-copy is visible before the transition.
              const maybePromise = handleEvent(event, data);
              if (maybePromise) await maybePromise;
            } catch {
              // ignore malformed event
            }
          }
        }
      } catch {
        // Stream dropped mid-response — flush buffer then mark incomplete.
        flushTokenBufNow();
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.pending) {
            last.pending = false;
            last.metadata = { ...((last.metadata as Record<string, unknown>) ?? {}), incomplete: true };
          }
          return next;
        });
      } finally {
        flushTokenBufNow();
        setStreamingEmployee(null);
        setRoutingTarget(null);
        setRoundTableActiveEmployee(null);
        setLoading(false);
        router.refresh();
      }
    },
    [conversationId, loading, mentionOverride, pin, router],
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
          {/* Pinned messages banner */}
          {pinnedMessages.length > 0 && (
            <PinnedMessagesBanner
              pins={pinnedMessages}
              onUnpin={(msgId) => void handlePinToggle(msgId, false)}
              onJumpTo={handleScrollToMessage}
            />
          )}
          {/* Top sentinel + pagination state — only shown when a conversation is loaded */}
          {conversationId && (
            <div className="flex items-center justify-between pb-2">
              <div ref={topSentinelRef} className="flex-1 flex justify-center">
                {loadingOlder ? (
                  <span
                    className="cx-type-xs uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Loading older messages…
                  </span>
                ) : !hasMore && messages.length > 0 ? (
                  <span
                    className="cx-type-xs uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    All messages loaded
                  </span>
                ) : null}
              </div>
              {messages.length > 0 && (
                <div className="shrink-0 flex items-center gap-1">
                  <PraxisButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchOpen((v) => !v)}
                    title="Search messages"
                    aria-label="Search messages"
                    aria-pressed={searchOpen}
                  >
                    <Search size={12} strokeWidth={1.75} />
                    <span className="hidden sm:inline">Search</span>
                  </PraxisButton>
                  <PraxisButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={exportConversation}
                    title="Export as Markdown"
                    aria-label="Export conversation as Markdown"
                  >
                    <Download size={12} strokeWidth={1.75} />
                    <span className="hidden sm:inline">Markdown</span>
                  </PraxisButton>
                  {conversationId && (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/api/conduit/conversations/${conversationId}/export`,
                          "_blank",
                        )
                      }
                      title="Print / Save as PDF"
                      aria-label="Print conversation or save as PDF"
                    >
                      <FileText size={12} strokeWidth={1.75} />
                      <span className="hidden sm:inline">PDF</span>
                    </PraxisButton>
                  )}
                  {/* Tag button — only when a conversation exists */}
                  {conversationId && (
                    <ConversationLabelManager
                      conversationId={conversationId}
                      assignedLabels={assignedLabels}
                      allLabels={allLabels}
                      onUpdate={setAssignedLabels}
                      compact
                    />
                  )}
                  {/* Copy permalink button — only when a conversation exists */}
                  {conversationId && (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void copyPermalink()}
                      title="Copy link to this conversation"
                      aria-label="Copy link to this conversation"
                    >
                      <Link size={12} strokeWidth={1.75} />
                      <span className="hidden sm:inline">{linkCopied ? "Copied!" : "Copy link"}</span>
                    </PraxisButton>
                  )}
                  {/* Handoff button — only when conversation has messages and no existing handoff */}
                  {conversationId && !handoffInfo && (
                    <PraxisButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHandoffPicker(true)}
                      isDisabled={handoffLoading}
                      title="Hand off to another specialist"
                      aria-label="Hand off to another specialist"
                    >
                      <Share2 size={12} strokeWidth={1.75} />
                      <span className="hidden sm:inline">
                        {handoffLoading ? "Handing off…" : "Handoff"}
                      </span>
                    </PraxisButton>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Inline search bar — shown when searchOpen is true */}
          {searchOpen && conversationId && (
            <div
              className="cx-glass cx-glass-border flex items-center gap-2 px-2 py-2 mb-2 rounded-[8px]"
            >
              <Search size={13} strokeWidth={1.75} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} aria-hidden />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSearchOpen(false); }
                }}
                placeholder="Search messages…"
                aria-label="Search messages in this conversation"
                className="flex-1 bg-transparent cx-body outline-none placeholder:text-[var(--cx-text-muted)]"
              />
              {searchQuery && (
                <span className="cx-type-xs cx-mono shrink-0" style={{ color: "var(--color-text-muted)" }}>
                  {searchMatchSet.size} match{searchMatchSet.size !== 1 ? "es" : ""}
                </span>
              )}
              <PraxisButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={13} strokeWidth={1.75} />
              </PraxisButton>
            </div>
          )}

          {companyBrief && messages.length === 0 && (
            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg cx-type-xs"
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
              pin={pin}
              onPinSelect={(emp) => {
                setPin(emp);
                requestAnimationFrame(() => {
                  document
                    .querySelector<HTMLTextAreaElement>(
                      ".praxis-composer-pill textarea",
                    )
                    ?.focus();
                });
              }}
              onPromptInsert={(text) => {
                setInput(text);
                requestAnimationFrame(() => {
                  document
                    .querySelector<HTMLTextAreaElement>(
                      ".praxis-composer-pill textarea",
                    )
                    ?.focus();
                });
              }}
              onFocusInput={() => {
                requestAnimationFrame(() => {
                  document
                    .querySelector<HTMLTextAreaElement>(
                      ".praxis-composer-pill textarea",
                    )
                    ?.focus();
                });
              }}
            />
          )}

          <AnimatePresence mode="sync">
            {(() => {
              // Index + significance of the last completed assistant message from the rewarded specialist.
              // Significance (> 300 chars) controls whether sparks fire in addition to the ring pulse.
              let lastRewardIdx = -1;
              let lastRewardSignificant = false;
              if (rewardEmployee) {
                for (let j = 0; j < messages.length; j++) {
                  const msg = messages[j];
                  if (msg.role === "assistant" && msg.employee === rewardEmployee && !msg.pending) {
                    lastRewardIdx = j;
                    lastRewardSignificant = msg.content.length > 300;
                  }
                }
              }
              // Round-table done: find the last completed round-table bubble for the done specialist.
              let lastRoundTableDoneIdx = -1;
              if (roundTableDoneEmployee) {
                for (let j = 0; j < messages.length; j++) {
                  const msg = messages[j];
                  const meta = (msg.metadata ?? {}) as Record<string, unknown>;
                  if (
                    msg.role === "assistant" &&
                    msg.employee === roundTableDoneEmployee &&
                    !msg.pending &&
                    meta.round_table
                  ) {
                    lastRoundTableDoneIdx = j;
                  }
                }
              }
              return messages.map((m, i) => {
                // Stable key throughout the message lifecycle. The empty→streaming
                // transition is handled by internal AnimatePresence inside MessageBubble
                // so there's no layout jump when the first token arrives.
                const msgKey = m.id ?? i;
                return (
                  <MessageBubble
                    key={msgKey}
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
                    pinned={m.id ? pinnedMessages.some((p) => p.message_id === m.id) : false}
                    onPinToggle={
                      m.role === "assistant" && m.id && conversationId
                        ? (shouldPin) => void handlePinToggle(m.id!, shouldPin)
                        : undefined
                    }
                    searchMatch={searchMatchSet.has(i)}
                    conversationId={conversationId}
                    roundTableActiveEmployee={roundTableActiveEmployee}
                    rewarded={i === lastRewardIdx}
                    rewardSignificant={i === lastRewardIdx && lastRewardSignificant}
                    roundTableDone={i === lastRoundTableDoneIdx}
                  />
                );
              });
            })()}
          </AnimatePresence>

          {/* Handoff banner — shown when this conversation was handed off */}
          {handoffInfo && (
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl cx-body mt-2"
              style={{
                background: "color-mix(in srgb, var(--color-accent) 7%, var(--color-surface-elevated))",
                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Share2 size={14} strokeWidth={1.75} style={{ color: "var(--color-accent-hi)", flexShrink: 0 }} />
                <span style={{ color: "var(--color-text-muted)" }}>
                  Continued by{" "}
                  <span style={{ color: "var(--color-accent-hi)", fontWeight: 500 }}>
                    {EMPLOYEES[handoffInfo.employee as EmployeeId]?.name ?? handoffInfo.employee}
                  </span>
                </span>
              </div>
              <a
                href={`/app?c=${handoffInfo.conversationId}`}
                className="flex items-center gap-1 cx-type-xs font-medium shrink-0 transition-opacity hover:opacity-80"
                style={{ color: "var(--color-accent-hi)" }}
              >
                Open <ArrowRight size={11} strokeWidth={1.75} />
              </a>
            </div>
          )}

          {/* Follow-up suggestion chips — shown after the latest assistant reply */}
          {followUpSuggestions.length > 0 && !loading && (
            <div className="mx-auto px-2 pb-1" style={{ maxWidth: "48rem" }}>
              <div className="flex flex-wrap gap-2 pt-1">
                {followUpSuggestions.map((s) => (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => {
                      setFollowUpSuggestions([]);
                      void send(s);
                    }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="px-3 py-2 cx-type-xs rounded-full border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-surface-elevated)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {sendError && (
            <div
              className="conduit-card flex items-start gap-3 p-4"
              style={
                sendError.capacity
                  ? {
                      borderColor: "color-mix(in srgb, var(--color-amber) 25%, transparent)",
                      background: "color-mix(in srgb, var(--color-amber) 6%, transparent)",
                    }
                  : {
                      borderColor: "color-mix(in srgb, var(--cx-danger) 25%, transparent)",
                      background: "color-mix(in srgb, var(--cx-danger) 6%, transparent)",
                    }
              }
            >
              <AlertCircle
                size={16}
                strokeWidth={1.75}
                className="shrink-0 mt-0.5"
                style={{ color: sendError.capacity ? "var(--color-yellow)" : "var(--cx-danger)" }}
              />
              <p
                className="flex-1 cx-body"
                style={{ color: "var(--cx-text)" }}
              >
                {sendError.text}
              </p>
              <PraxisButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const retry = sendError.retryText;
                  setSendError(null);
                  void send(retry);
                }}
              >
                Try again
              </PraxisButton>
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
                borderColor: "color-mix(in srgb, var(--color-amber) 30%, transparent)",
                background: "color-mix(in srgb, var(--color-amber) 6%, transparent)",
              }}
            >
              <AlertCircle
                size={16}
                strokeWidth={1.75}
                className="shrink-0"
                style={{ color: "var(--color-amber)" }}
              />
              <p className="flex-1 cx-body" style={{ color: "var(--cx-text)" }}>
                Ready again in{" "}
                <span className="cx-mono font-medium">{rateLimitSecondsLeft} s</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {connStatus !== 'connected' && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 px-4 md:px-8 py-2 cx-type-xs"
          style={{
            background: connStatus === 'reconnected'
              ? 'color-mix(in srgb, var(--cx-reward) 8%, transparent)'
              : connStatus === 'failed'
              ? 'color-mix(in srgb, var(--cx-danger) 8%, transparent)'
              : 'color-mix(in srgb, var(--color-amber) 8%, transparent)',
            borderTop: `1px solid ${
              connStatus === 'reconnected'
                ? 'color-mix(in srgb, var(--cx-reward) 20%, transparent)'
                : connStatus === 'failed'
                ? 'color-mix(in srgb, var(--cx-danger) 20%, transparent)'
                : 'color-mix(in srgb, var(--color-amber) 20%, transparent)'
            }`,
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              color: connStatus === 'reconnected'
                ? 'var(--cx-reward)'
                : connStatus === 'failed'
                ? 'var(--cx-danger)'
                : 'var(--color-amber)',
            }}
          >
            <AlertCircle size={12} strokeWidth={1.75} aria-hidden />
            <span>
              {connStatus === 'reconnecting' && 'Connection lost — reconnecting…'}
              {connStatus === 'reconnected' && 'Reconnected'}
              {connStatus === 'failed' && 'Failed to reconnect — refresh the page'}
            </span>
          </div>
          {(connStatus === 'reconnecting' || connStatus === 'reconnected') && (
            <PraxisButton
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setConnStatus('connected')}
              aria-label="Dismiss"
            >
              <X size={11} strokeWidth={1.75} />
            </PraxisButton>
          )}
        </div>
      )}

      <UpgradeCTABanner internalAccount={internalAccount} />

      <div
        className="cx-glass cx-glass-border border-t px-4 md:px-8 py-3 md:py-4"
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
            mentionOverride={mentionOverride}
            onMentionOverrideChange={(id) => setMentionOverride(id as EmployeeKey | null)}
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
          {/* Presence line — aria-live region so screen readers announce
              specialist activity without interrupting the conversation flow. */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-2 min-h-4 flex items-center justify-center cx-type-xs overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {streamingEmployee ? (
                <motion.span
                  key={streamingEmployee}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="presence-line flex items-center gap-1.5 min-w-0"
                >
                  <span
                    aria-hidden="true"
                    className="presence-dot inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "var(--cx-accent, #7C6CFF)" }}
                  />
                  <span
                    className="shrink-0 font-medium"
                    style={{ color: DEPT_COLOR[streamingEmployee] }}
                  >
                    {labelFor(streamingEmployee)}
                  </span>
                  {/* Status text re-animates when routing resolves */}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={routingTarget && streamingEmployee === "jarvis" ? `routing-${routingTarget}` : `thinking-${streamingEmployee}`}
                      className="cx-mono cx-text-muted truncate"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {routingTarget && streamingEmployee === "jarvis"
                        ? `is ${ROUTING_TO_STATUS[routingTarget] ?? `routing to ${labelFor(routingTarget)}…`}`
                        : `is ${THINKING_STATUS[streamingEmployee] ?? "thinking…"}`}
                    </motion.span>
                  </AnimatePresence>
                </motion.span>
              ) : (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <span className="hidden sm:inline cx-text-faint">
                    Shift+Enter for newline
                  </span>
                  <span className="sm:hidden cx-text-faint">
                    Tap send to submit
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
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

      {/* Handoff specialist picker */}
      {showHandoffPicker && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 cx-scrim"
            aria-hidden
            onClick={() => setShowHandoffPicker(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hand off to a specialist"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="cx-glass-float cx-glass-border w-full max-w-md rounded-[16px] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p
                    className="cx-type-xs uppercase tracking-[0.15em] mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Hand off to…
                  </p>
                  <h2 className="cx-type-md font-semibold" style={{ color: "var(--color-text)" }}>
                    Choose a specialist
                  </h2>
                </div>
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowHandoffPicker(false)}
                  aria-label="Close"
                >
                  <X size={14} strokeWidth={1.75} />
                </PraxisButton>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EMPLOYEE_ORDER.map((empId) => {
                  const emp = EMPLOYEES[empId];
                  const isAllowed = allowedSet.has(empId as EmployeeKey);
                  return (
                    <motion.button
                      key={empId}
                      type="button"
                      disabled={!isAllowed}
                      onClick={() => void performHandoff(empId as EmployeeKey)}
                      whileHover={isAllowed ? { y: -1 } : undefined}
                      whileTap={isAllowed ? { scale: 0.96 } : undefined}
                      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: isAllowed
                          ? "var(--color-surface)"
                          : "transparent",
                        borderColor: "var(--color-border)",
                      }}
                      onMouseEnter={(e) => {
                        if (isAllowed) {
                          (e.currentTarget as HTMLElement).style.borderColor = emp.color;
                          (e.currentTarget as HTMLElement).style.background = emp.colorSoft;
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                        (e.currentTarget as HTMLElement).style.background = isAllowed ? "var(--color-surface)" : "transparent";
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center cx-type-base font-bold"
                        style={{
                          background: emp.colorSoft,
                          color: emp.color,
                          border: `1px solid ${emp.color}30`,
                        }}
                      >
                        {emp.initial}
                      </span>
                      <span
                        className="cx-type-xs font-medium text-center leading-tight"
                        style={{ color: "var(--color-text)" }}
                      >
                        {emp.name}
                      </span>
                      <span
                        className="cx-type-xs text-center leading-tight"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {emp.role}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <p className="cx-type-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
                A new conversation will open with context from this thread.
                {allowedEmployees.length < EMPLOYEE_ORDER.length && (
                  <> Dimmed specialists require a higher plan.</>
                )}
              </p>
            </div>
          </div>
        </>
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
            className="fixed bottom-24 right-6 md:bottom-6 z-30 conduit-card px-4 py-3 cx-type-xs flex items-center gap-2 transition-colors"
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

function EmptyState({
  firstName,
  onSend,
  suggestions,
  isFirstRun = false,
  pin = "auto",
  onPinSelect,
  onPromptInsert,
  onFocusInput,
}: {
  firstName: string;
  onSend: (text: string, pin?: EmployeeKey) => void;
  suggestions: Suggestion[];
  isFirstRun?: boolean;
  pin?: PinValue;
  onPinSelect?: (emp: EmployeeKey) => void;
  onPromptInsert?: (text: string) => void;
  onFocusInput?: () => void;
}) {
  const copy = composeChatEmptyCopy({
    firstName,
    timeOfDay: timeOfDayBucket(),
  });

  const showSpecialistGrid = pin === "auto";
  // true when user has pinned a specific specialist (not auto-route or team)
  const isSpecialistPin = pin !== "auto" && pin !== "team" && pin in EMPLOYEES;

  return (
    <div
      style={{
        paddingTop: "var(--space-8)",
      }}
    >
      {showSpecialistGrid ? (
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
            {isFirstRun ? `Your team is ready · ${firstName}` : `${copy.eyebrow} · ${firstName}`}
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
              {isFirstRun ? "Meet your nine specialists" : copy.headline}
            </h1>
          </div>
          <p
            className="praxis-body-lg"
            style={{ marginTop: "var(--space-4)", maxWidth: "36rem" }}
          >
            {isFirstRun
              ? "Click any specialist to start with a sample prompt, or type anything below and Atlas will route it."
              : copy.subline}
          </p>
          <div
            className="grid grid-cols-2 lg:grid-cols-3"
            style={{
              marginTop: "var(--space-8)",
              gap: "var(--space-3)",
            }}
          >
            {EMPLOYEE_ORDER.map((id) => {
              const emp = EMPLOYEES[id];
              const prompt = SPECIALIST_PROMPTS[id];
              return (
                <motion.button
                  key={emp.id}
                  type="button"
                  onClick={() => {
                    onPinSelect?.(emp.id as EmployeeKey);
                    onPromptInsert?.(prompt);
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="praxis-card praxis-card-team text-left"
                  data-dept={emp.id}
                  style={{ cursor: "pointer", width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      marginBottom: "var(--space-2)",
                    }}
                  >
                    <PraxisAvatar employee={emp.id} size="md" pulse="ambient" />
                    <div>
                      <p
                        style={{
                          fontSize: "var(--cx-type-sm)",
                          fontWeight: 600,
                          color: "var(--color-text)",
                          lineHeight: 1.3,
                        }}
                      >
                        {emp.name}
                      </p>
                      <p
                        className="praxis-microlabel"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {emp.role}
                      </p>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: "var(--cx-type-xs)",
                      color: "var(--color-text-muted)",
                      lineHeight: "var(--cx-lh-body)",
                    }}
                  >
                    {prompt}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </>
      ) : isSpecialistPin ? (
        /* Illustrated zero-state for a pinned specialist (issue #755) */
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              paddingTop: "var(--space-6)",
              paddingBottom: "var(--space-2)",
            }}
          >
            <SpecialistEmptyArt employeeId={pin as EmployeeId} size={220} />
            <h1
              className="praxis-display-1"
              style={{
                marginTop: "var(--space-5)",
                color: EMPLOYEES[pin as EmployeeId].color,
              }}
            >
              {pin === "jarvis"
                ? "Atlas is ready"
                : `Your ${EMPLOYEES[pin as EmployeeId].name.toLowerCase()} specialist is ready`}
            </h1>
            <p
              className="praxis-body-lg"
              style={{
                marginTop: "var(--space-2)",
                maxWidth: "28rem",
                color: "var(--color-text-muted)",
              }}
            >
              {EMPLOYEES[pin as EmployeeId].tagline}
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row flex-wrap"
            style={{
              marginTop: "var(--space-6)",
              gap: "var(--space-2)",
              justifyContent: "center",
            }}
          >
            {SPECIALIST_STARTER_PROMPTS[pin as EmployeeId].map((prompt) => (
              <motion.button
                key={prompt}
                type="button"
                onClick={() => onPromptInsert?.(prompt)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="px-4 py-3 rounded-xl cx-body text-left transition-all"
                style={{
                  border: `1px solid color-mix(in srgb, ${EMPLOYEES[pin as EmployeeId].color} 30%, var(--color-border))`,
                  background: `color-mix(in srgb, ${EMPLOYEES[pin as EmployeeId].color} 6%, var(--color-surface-elevated))`,
                  color: "var(--color-text)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = EMPLOYEES[pin as EmployeeId].color;
                  (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${EMPLOYEES[pin as EmployeeId].color} 12%, var(--color-surface-elevated))`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, ${EMPLOYEES[pin as EmployeeId].color} 30%, var(--color-border))`;
                  (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${EMPLOYEES[pin as EmployeeId].color} 6%, var(--color-surface-elevated))`;
                }}
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        /* Fallback: team round-table or other non-auto, non-specialist pin */
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
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{
              marginTop: "var(--space-8)",
              gap: "var(--space-3)",
            }}
          >
            {suggestions.map((s) => (
              <PraxisSuggestionTile
                key={s.text}
                dept={s.dept}
                hint={s.hint}
                prompt={s.text}
                pin={s.pin}
                onSelect={(text, p) => onSend(text, p)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[^\n]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{3}(.+?)\*{3}/g, "$1")
    .replace(/_{3}(.+?)_{3}/g, "$1")
    .replace(/\*{2}(.+?)\*{2}/g, "$1")
    .replace(/_{2}(.+?)_{2}/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/^[ \t]*[-*+]\s+/gm, "")
    .replace(/^[ \t]*\d+\.\s+/gm, "")
    .replace(/^\|(.+)\|$/gm, (_, inner: string) =>
      inner.split("|").map((c) => c.trim()).filter(Boolean).join("  ")
    )
    .replace(/^\|[-|\s:]+\|$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = useCallback(async () => {
    const plain = stripMarkdown(content);
    const succeed = () => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 1500);
    };
    try {
      await navigator.clipboard.writeText(plain);
      succeed();
    } catch {
      // execCommand fallback for older browsers / non-HTTPS contexts
      try {
        const ta = document.createElement("textarea");
        ta.value = plain;
        ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        succeed();
      } catch {
        toast.error("Copy failed");
      }
    }
  }, [content, toast]);

  const Icon = copied ? Check : Copy;
  return (
    <PraxisButton
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : "Copy message"}
      title={copied ? "Copied!" : "Copy message"}
      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
    >
      <Icon size={13} strokeWidth={1.75} />
      <span className="hidden md:inline cx-type-xs">{copied ? "Copied" : "Copy"}</span>
    </PraxisButton>
  );
}

function MessageFeedbackButtons({
  messageId,
  conversationId,
  initialRating = null,
}: {
  messageId: string;
  conversationId?: string | null;
  initialRating?: 1 | -1 | null;
}) {
  const [rating, setRating] = useState<1 | -1 | null>(initialRating);
  const [busy, setBusy] = useState(false);

  const submit = async (value: 1 | -1) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/conduit/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          ...(conversationId ? { conversation_id: conversationId } : {}),
          rating: value,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { action: string };
        setRating(data.action === "removed" ? null : value);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={rating === 1}
        onClick={() => void submit(1)}
        disabled={busy}
        className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center p-1 rounded transition-colors disabled:pointer-events-none"
        style={{
          color: rating === 1 ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
        onMouseEnter={(e) => { if (rating !== 1) (e.currentTarget as HTMLElement).style.color = "var(--color-text)"; }}
        onMouseLeave={(e) => { if (rating !== 1) (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
      >
        <ThumbsUp size={13} strokeWidth={1.75} fill={rating === 1 ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={rating === -1}
        onClick={() => void submit(-1)}
        disabled={busy}
        className="min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center p-1 rounded transition-colors disabled:pointer-events-none"
        style={{
          color: rating === -1 ? "var(--cx-danger)" : "var(--color-text-muted)",
        }}
        onMouseEnter={(e) => { if (rating !== -1) (e.currentTarget as HTMLElement).style.color = "var(--color-text)"; }}
        onMouseLeave={(e) => { if (rating !== -1) (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)"; }}
      >
        <ThumbsDown size={13} strokeWidth={1.75} fill={rating === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

function MessageHandoffButton({
  messageId,
  conversationId,
  sourceEmployee,
}: {
  messageId: string;
  conversationId: string;
  sourceEmployee: EmployeeKey;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const { labelFor } = useNicknames();
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handoff = async (targetEmployee: EmployeeKey) => {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/conduit/messages/${messageId}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmployee }),
      });
      if (!res.ok) {
        toast.error("Handoff failed. Please try again.");
        return;
      }
      const { newConversationId } = (await res.json()) as { newConversationId: string };
      setDone(true);
      toast.success(`Handed off to ${labelFor(targetEmployee)}.`);
      router.push(`/app?c=${newConversationId}&pin=${targetEmployee}`);
    } catch {
      toast.error("Handoff failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return null;

  const targets = EMPLOYEE_ORDER.filter((e) => e !== sourceEmployee) as EmployeeKey[];

  return (
    <div ref={ref} className="relative">
      <PraxisButton
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Hand off to another specialist"
        title="Hand off to another specialist"
        isDisabled={loading}
        className="opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <Share2 size={13} strokeWidth={1.75} />
      </PraxisButton>
      {open && (
        <div
          className="cx-glass-float cx-glass-border absolute left-0 top-full mt-1 z-20 rounded-xl py-1 min-w-[170px]"
        >
          <p className="px-3 py-2 cx-type-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            Hand off to…
          </p>
          {targets.map((emp) => (
            <button
              key={emp}
              onClick={() => handoff(emp)}
              className="w-full text-left px-3 py-2 cx-type-xs flex items-center gap-2 transition-colors"
              style={{ color: "var(--color-text)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "color-mix(in srgb, var(--color-accent) 8%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <span
                className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center cx-type-xs font-bold uppercase"
                style={{ background: DEPT_COLOR[emp], color: "var(--cx-text)" }}
              >
                {labelFor(emp).slice(0, 2)}
              </span>
              {labelFor(emp)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMessageTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * CountTick — animated word-count readout shown when a specialist completes a turn.
 * Counts from 0 → word count over 380ms (easing [0.22,1,0.36,1]).
 * prefers-reduced-motion: renders the final value without animation.
 */
function CountTick({ target, active }: { target: number; active: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (v) => String(Math.round(v)));

  useEffect(() => {
    if (!active) {
      count.set(0);
      return;
    }
    if (prefersReducedMotion) {
      count.set(target);
      return;
    }
    const controls = animate(count, target, {
      duration: 0.38,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [active, target, count, prefersReducedMotion]);

  return (
    <AnimatePresence>
      {active && (
        <motion.span
          key="count-tick"
          aria-hidden
          className="cx-mono tabular-nums select-none inline-flex items-center gap-0.5"
          style={{ color: CX_REWARD, fontSize: "var(--cx-type-xs)" }}
          initial={{ opacity: 0, x: -3 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span>{displayCount}</motion.span>
          <span>{"w"}</span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// 3 spark particles fanning toward bottom-right — fires on significant completions only.
const TAIL_SPARKS = [
  { angle: 25,  color: CX_REWARD,        dist: 18 },
  { angle: 65,  color: CX_ACCENT_BRIGHT, dist: 22 },
  { angle: 105, color: CX_REWARD,        dist: 15 },
] as const;

function MessageTailSpark({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active &&
        TAIL_SPARKS.map(({ angle, color, dist }, i) => {
          const rad = (angle * Math.PI) / 180;
          const tx = Math.round(Math.cos(rad) * dist);
          const ty = Math.round(Math.sin(rad) * dist);
          return (
            <motion.span
              key={`tail-spark-${i}`}
              aria-hidden
              className="absolute pointer-events-none rounded-full"
              initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
              exit={{}}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
              style={{ width: 3, height: 3, right: 10, bottom: 10, background: color }}
            />
          );
        })}
    </AnimatePresence>
  );
}

/**
 * RoundTableDoneBadge — small ✓ pill shown briefly when a round-table specialist
 * finishes their response. Fades in at 0→1 on mount, then fades out when `active`
 * goes false. Reduced-motion: same fade, no scale.
 */
function RoundTableDoneBadge({ active, color }: { active: boolean; color: string }) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          key="rt-done"
          aria-label="Done"
          className="inline-flex items-center gap-1 cx-mono select-none"
          style={{ color: CX_REWARD, fontSize: "var(--cx-type-xs)" }}
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.85 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <Check size={10} strokeWidth={2.5} color={CX_REWARD} aria-hidden />
          <span style={{ color }}>done</span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function MessageTimestamp({
  createdAt,
  touchVisible,
  side = "top",
}: {
  createdAt: string;
  touchVisible: boolean;
  side?: "top" | "bottom";
}) {
  const full = formatMessageTimestamp(createdAt);
  const short = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (touchVisible) {
    return (
      <time
        dateTime={createdAt}
        className="cx-mono cx-type-xs select-none tabular-nums"
        style={{ color: "var(--color-text-muted)" }}
      >
        {full}
      </time>
    );
  }

  return (
    <Tooltip
      trigger={
        <time
          dateTime={createdAt}
          className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity cx-mono cx-type-xs cursor-default select-none tabular-nums"
          style={{ color: "var(--color-text-muted)" }}
        >
          {short}
        </time>
      }
      side={side}
      delay={300}
    >
      <span className="cx-type-xs whitespace-nowrap">{full}</span>
    </Tooltip>
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
  pinned = false,
  onPinToggle,
  searchMatch = false,
  conversationId,
  roundTableActiveEmployee = null,
  rewarded = false,
  rewardSignificant = false,
  roundTableDone = false,
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
  pinned?: boolean;
  onPinToggle?: (shouldPin: boolean) => void;
  searchMatch?: boolean;
  conversationId?: string | null;
  roundTableActiveEmployee?: EmployeeKey | null;
  rewarded?: boolean;
  rewardSignificant?: boolean;
  /** Fires briefly when a round-table specialist completes their response. Shows a ✓ done beat. */
  roundTableDone?: boolean;
}) {
  const [editDraft, setEditDraft] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const { labelFor: nickLabelFor } = useNicknames();
  const [touchTimestamp, setTouchTimestamp] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setTouchTimestamp(true);
      touchDismissRef.current = setTimeout(() => setTouchTimestamp(false), 2000);
    }, 600);
  }, []);

  const cancelTouchTimer = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  }, []);

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

  const prefersReducedMotion = useReducedMotion();

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
              className="w-full px-4 py-3 rounded-xl cx-body resize-none outline-none"
              style={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-accent)",
                color: "var(--color-text)",
                fontFamily: "inherit",
              }}
              aria-label="Edit message"
            />
            <div className="flex justify-end gap-2">
              <PraxisButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={onEditCancel}
              >
                Cancel
              </PraxisButton>
              <PraxisButton
                type="button"
                variant="primary"
                size="sm"
                isDisabled={!editDraft.trim()}
                onClick={() => { if (editDraft.trim()) onEditSubmit?.(editDraft.trim()); }}
              >
                Save &amp; resend
              </PraxisButton>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        data-search-match={searchMatch || undefined}
        className="flex justify-end group"
        initial={MESSAGE_SENT.initial}
        animate={MESSAGE_SENT.animate}
        transition={MESSAGE_SENT.transition}
        style={searchMatch ? { outline: "2px solid var(--color-accent)", outlineOffset: "3px", borderRadius: "12px" } : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={cancelTouchTimer}
        onTouchMove={cancelTouchTimer}
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
              <MarkdownRenderer content={message.content} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEditStart && !isVoice && (
              <PraxisButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onEditStart}
                aria-label="Edit message"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                Edit
              </PraxisButton>
            )}
            {message.created_at && !message.pending && (
              <MessageTimestamp
                createdAt={message.created_at}
                touchVisible={touchTimestamp}
                side="top"
              />
            )}
          </div>
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
          label={`${nickLabelFor("jarvis" as EmployeeKey)} → ${nickLabelFor(message.handoffTo)}`}
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
          <span className="cx-type-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
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
  const isRoundTable = Boolean((message.metadata as Record<string, unknown>)?.round_table);
  // Active when: not a round-table message, OR no specialist is currently designated active,
  // OR this specialist is the one currently generating.
  const isActive =
    !isRoundTable ||
    roundTableActiveEmployee === null ||
    roundTableActiveEmployee === employee;

  const msgMeta = (message.metadata ?? {}) as Record<string, unknown>;
  const routingTo = msgMeta.routingTo as EmployeeKey | undefined;

  return (
    <motion.div
      data-message-id={message.id}
      data-search-match={searchMatch || undefined}
      className="flex gap-3 group"
      style={{
        ["--dept" as string]: DEPT_COLOR[employee],
        ...(searchMatch
          ? { outline: "2px solid var(--color-accent)", outlineOffset: "3px", borderRadius: "12px" }
          : {}),
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelTouchTimer}
      onTouchMove={cancelTouchTimer}
    >
      <div className="pt-1 shrink-0">
        <SpecialistAvatar employee={employee} size={32} streaming={message.pending} rewarded={rewarded} rewardSignificant={rewardSignificant} />
      </div>
      {/* Inner content area — AnimatePresence crossfades thinking↔streaming
          within a stable layout shell, eliminating the layout-jump that occurred
          when the key changed (typing-N → N) under the old approach. */}
      <motion.div className="min-w-0 flex-1" layout>
        <AnimatePresence mode="popLayout" initial={false}>
          {empty ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <ThinkingBubble
                employee={employee}
                roundTable={isRoundTable}
                isActive={isActive}
                routingTarget={routingTo ?? null}
              />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
        {/* Glass bubble — chip header + content in one pane */}
        <div className="conduit-bubble-assistant max-w-[68ch] relative">
          {/* Reward shimmer — green glow ring that fades when specialist completes */}
          <AnimatePresence>
            {rewarded && !prefersReducedMotion && (
              <motion.span
                key="bubble-reward-shimmer"
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ borderRadius: "var(--cx-radius-md, 12px)", zIndex: 1 }}
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    borderRadius: "var(--cx-radius-md, 12px)",
                    boxShadow: `0 0 0 1px ${CX_REWARD}38, 0 0 18px 5px ${CX_REWARD}16`,
                    pointerEvents: "none",
                  }}
                />
              </motion.span>
            )}
          </AnimatePresence>
          {/* Bubble header: specialist chip + timestamp + meta */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
            {/* Chip with reward pulse ring — accent→green burst on specialist completion */}
            <span className="relative inline-flex">
              <SpecialistChip employee={employee} label={nickLabelFor(employee)} />
              <AnimatePresence>
                {rewarded && !prefersReducedMotion && (
                  <motion.span
                    key="chip-reward-ring"
                    aria-hidden
                    className="pointer-events-none absolute"
                    style={{
                      top: -4,
                      right: -4,
                      bottom: -4,
                      left: -4,
                      borderRadius: 9999,
                      boxShadow: `0 0 0 2px ${DEPT_COLOR[employee]}77, 0 0 10px 3px ${CX_REWARD}40`,
                    }}
                    initial={{ opacity: 0.9, scale: 0.88 }}
                    animate={{ opacity: 0, scale: 1.3 }}
                    exit={{}}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </AnimatePresence>
            </span>
            {/* Word-count tick — counts up when specialist finishes */}
            <CountTick
              target={message.content.split(/\s+/).filter(Boolean).length}
              active={rewarded}
            />
            {/* Round-table done badge — brief ✓ that fades in/out when a RT specialist completes */}
            <RoundTableDoneBadge active={roundTableDone} color={DEPT_COLOR[employee]} />
            {message.created_at && !message.pending && (
              <MessageTimestamp
                createdAt={message.created_at}
                touchVisible={touchTimestamp}
                side="top"
              />
            )}
            {message.handoffFrom && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                aria-label={`Handed off from ${nickLabelFor(message.handoffFrom as EmployeeKey)}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full cx-type-xs uppercase tracking-[0.1em]"
                style={{
                  background: `color-mix(in srgb, ${DEPT_COLOR[message.handoffFrom as EmployeeKey]} 12%, var(--color-surface-elevated))`,
                  color: DEPT_COLOR[message.handoffFrom as EmployeeKey],
                  border: `1px solid color-mix(in srgb, ${DEPT_COLOR[message.handoffFrom as EmployeeKey]} 28%, transparent)`,
                }}
              >
                ← {nickLabelFor(message.handoffFrom as EmployeeKey)}
              </motion.span>
            )}
            {message.pending && (
              <span
                className="cx-mono cx-type-xs uppercase tracking-[0.18em]"
                style={{ color: "var(--cx-text-faint, var(--color-text-muted))" }}
              >
                writing…
              </span>
            )}
            {playing && (
              <button
                onClick={onStopAudio}
                className="inline-flex items-center gap-1.5 cx-type-xs uppercase tracking-[0.18em]"
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
              <PraxisButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReplayAudio}
                aria-label="Replay audio"
                className="cx-type-xs uppercase tracking-[0.18em]"
              >
                ▶ Listen
              </PraxisButton>
            )}
          </div>
          {/* Bubble content */}
          <div className="px-4 pb-3 text-[var(--color-text)]">
            <MarkdownRenderer
              content={message.content}
              streaming={message.pending}
              caretColor={message.pending ? "var(--cx-accent)" : undefined}
            />
          </div>
          {/* Tail spark — 3 particles at bottom-right corner on significant completions */}
          {!prefersReducedMotion && (
            <MessageTailSpark active={rewarded && rewardSignificant} />
          )}
        </div>
        {!!(message.metadata as Record<string, unknown>)?.incomplete && (
          <div
            className="flex items-center gap-1.5 mt-2 cx-type-xs"
            style={{ color: "var(--color-amber)" }}
            aria-label="Response was cut short due to a connection drop"
          >
            <AlertCircle size={11} strokeWidth={1.75} aria-hidden />
            <span>⚠ Incomplete response</span>
          </div>
        )}
        {message.memories?.map((mem) => (
          <div
            key={mem.id}
            className="mt-2 inline-flex items-center gap-2 cx-type-xs hairline rounded-full pl-2 pr-3 py-1 max-w-full"
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
            <span className="text-[var(--color-text-muted)] uppercase tracking-[0.15em] cx-type-xs">
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
              <FileText size={16} strokeWidth={1.75} style={{ color: DEPT_COLOR[employee] }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block cx-type-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {a.type.replace("_", " ")} · by {nickLabelFor(employee)}
              </span>
              <span className="block cx-body text-[var(--cx-text)] mt-0.5 truncate">
                {a.title}
              </span>
              <span className="block cx-type-xs text-[var(--color-text-muted)] mt-1 inline-flex items-center gap-1 group-hover:text-[var(--color-text)]">
                Open in drawer
                <ArrowRight size={11} strokeWidth={1.75} />
              </span>
            </span>
          </button>
        ))}
        {message.id && !message.pending && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <CopyButton content={message.content} />
            <MessageFeedbackButtons
              messageId={message.id}
              conversationId={conversationId}
              initialRating={message.feedback ?? null}
            />
            {onPinToggle && (
              <PraxisButton
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onPinToggle(!pinned)}
                aria-label={pinned ? "Unpin message" : "Pin message"}
                title={pinned ? "Unpin" : "Pin message (max 5)"}
                className="opacity-0 group-hover:opacity-100"
                style={{ color: pinned ? "var(--color-accent)" : undefined }}
              >
                <Pin size={13} strokeWidth={1.75} fill={pinned ? "currentColor" : "none"} />
              </PraxisButton>
            )}
            {message.employee && message.content && (
              <SaveOutputButton
                messageId={message.id}
                content={message.content}
                specialist={message.employee}
                conversationId={conversationId ?? undefined}
                suggestedTitle=""
              />
            )}
            {message.id && message.employee && conversationId && !message.metadata?.handoff && (
              <MessageHandoffButton
                messageId={message.id}
                conversationId={conversationId}
                sourceEmployee={message.employee as EmployeeKey}
              />
            )}
          </motion.div>
        )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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
      <div className="cx-glass cx-glass-border-l w-full max-w-2xl overflow-y-auto p-6 md:p-8">
        {!data ? (
          <div className="space-y-4 pt-2" aria-busy aria-label="Loading artifact">
            <div className="cx-skeleton" style={{ height: 10, width: 120, borderRadius: 9999, opacity: 0.4 }} />
            <div className="cx-skeleton" style={{ height: 32, width: "75%", borderRadius: 6, opacity: 0.5 }} />
            <div className="space-y-2 mt-6">
              {[100, 90, 95, 70, 85].map((w, i) => (
                <div key={i} className="cx-skeleton" style={{ height: 11, width: `${w}%`, borderRadius: 9999, opacity: 0.3 - i * 0.02 }} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="min-w-0">
                <div className="cx-type-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {data.type.replace("_", " ")} · by {data.produced_by}
                </div>
                <h2 className="cx-heading-xl md:cx-heading-2xl mt-1">
                  {data.title}
                </h2>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigator.clipboard?.writeText(data.content)
                  }
                  className="!px-3 !py-2 cx-type-xs"
                >
                  Copy
                </Button>
                <Button
                  variant="secondary"
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
                  className="!px-3 !py-2 cx-type-xs"
                >
                  Download
                </Button>
                <PraxisButton
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ✕
                </PraxisButton>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-[var(--cx-text)] cx-body">
              {data.content}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
