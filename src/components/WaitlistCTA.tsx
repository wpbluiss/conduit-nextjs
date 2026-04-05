"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";

export default function WaitlistCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");

    // Simulate API call -- replace with real endpoint
    await new Promise((r) => setTimeout(r, 1200));
    setState("success");
    setEmail("");
  }

  return (
    <section id="waitlist" className="relative py-32 px-6">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/[0.03] rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border2 bg-card/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot" />
            <span className="font-[family-name:var(--font-mono)] text-xs text-text3 uppercase tracking-wider">
              Early Access
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to deploy your{" "}
            <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
              AI workforce?
            </span>
          </h2>
          <p className="text-text2 max-w-lg mx-auto mb-10">
            Join the waitlist for early access. Limited spots for the first
            cohort of companies running entirely on Conduit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {state === "success" ? (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-8">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00e5a0"
                  strokeWidth="2.5"
                  className="w-6 h-6"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-accent mb-2">
                You are on the list.
              </h3>
              <p className="text-text2 text-sm">
                We will reach out when your slot opens. Expect to hear from us
                soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3.5 rounded-lg bg-card border border-border2 text-text font-[family-name:var(--font-mono)] text-sm placeholder:text-text3 focus:outline-none focus:border-accent/50 focus:shadow-[0_0_20px_var(--color-glow-green)] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={state === "loading"}
                className="px-8 py-3.5 rounded-lg font-semibold text-sm bg-accent text-bg shadow-[0_0_20px_var(--color-glow-green)] hover:shadow-[0_0_40px_var(--color-glow-green)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 whitespace-nowrap"
              >
                {state === "loading" ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Deploying...
                  </span>
                ) : (
                  "Join Waitlist"
                )}
              </button>
            </form>
          )}

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {[
              "No credit card required",
              "Early access priority",
              "Cancel anytime",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-text3 text-xs font-[family-name:var(--font-mono)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00e5a0"
                  strokeWidth="2"
                  className="w-3.5 h-3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
