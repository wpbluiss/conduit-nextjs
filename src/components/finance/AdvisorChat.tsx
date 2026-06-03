"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle, PaperPlaneRight, CheckCircle } from "@phosphor-icons/react";
import { GradientText } from "./ui";

type Msg = { role: "user" | "assistant"; content: string; actions?: string[] };

const SUGGESTIONS = [
  "Give me my status and best next move.",
  "I got a $150 gift — what do I do with it?",
  "Paid $175 child support today.",
  "Bought $40 VOO in Delia's account.",
  "What's the smartest debt payoff order?",
];

export function AdvisorChat({ initial }: { initial: Msg[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput("");
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/finance/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "…", actions: data.actions ?? [] }]);
      if (data.actions?.length) router.refresh();
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection hiccup — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fin-card flex flex-col" style={{ height: "calc(100dvh - 9rem)" }}>
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div className="rounded-lg bg-violet-400/15 p-2">
          <Sparkle size={20} weight="fill" className="text-violet-300" />
        </div>
        <div>
          <div className="font-semibold leading-tight"><GradientText>Your Private Bank</GradientText></div>
          <div className="text-[11px] text-[var(--fin-muted)]">Full read + write access · knows Luis &amp; Delia</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="fin-display text-2xl mb-2">How can I move you closer to <GradientText>$75K</GradientText>?</div>
            <p className="text-sm text-[var(--fin-muted)] max-w-md mx-auto">
              I can log transactions, engineer your debt payoff, and split any windfall. Just talk to me.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-white text-black rounded-br-sm"
                  : "bg-white/[0.06] border border-white/10 rounded-bl-sm"
              }`}
            >
              {m.content}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                  {m.actions.map((a, j) => (
                    <div key={j} className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                      <CheckCircle size={12} weight="fill" /> {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-300"
                    animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length === 0 && (
        <div className="px-4 sm:px-5 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-[11px] rounded-full border border-white/10 px-3 py-1.5 text-[var(--fin-muted)] hover:text-white hover:bg-white/5 transition">
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-t border-white/5 p-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your private bank…"
          className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-violet-400/50 transition placeholder:text-white/25"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="fin-btn-animate rounded-xl p-2.5 text-white disabled:opacity-40 transition">
          <PaperPlaneRight size={18} weight="fill" />
        </button>
      </form>
    </div>
  );
}
