"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is a message?",
    a: "Each AI response from a specialist counts toward your monthly token allowance. Token consumption varies by response length — a short reply might use a few hundred tokens while a detailed analysis or code review can use several thousand. Your plan's allowance covers all specialists.",
  },
  {
    q: "Can I try Praxis free?",
    a: "Yes. The Free tier gives you access to Atlas (your chief of staff) and the Marketing specialist with 50k tokens per month — no credit card required. Tokens reset at the start of each billing cycle.",
  },
  {
    q: "How do the specialists work?",
    a: "Each specialist is a pre-built AI employee tuned for its domain — Marketing, Sales, Engineering, Finance, Compliance, and more. There's no setup or prompt engineering required. Describe your task in plain language; Atlas routes it to the right specialist automatically.",
  },
  {
    q: "Which AI models power the specialists?",
    a: "Praxis specialists run on Claude by Anthropic — frontier models selected for accuracy, speed, and reasoning depth. We handle all model management and continuously update specialists as better models become available. You never need to choose or configure a model.",
  },
  {
    q: "Do I need to bring my own API keys?",
    a: "No. Praxis is fully managed — no Anthropic key, no third-party accounts to set up, no infrastructure to configure. Your subscription covers all AI usage across every specialist. Sign up and you're ready in under a minute.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your data lives in a dedicated database with row-level security — only your account can access it. We never use your conversations to train AI models. All data is encrypted in transit and at rest.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing at any time with no cancellation fees. You keep full access through the end of your billing period — no proration penalties.",
  },
  {
    q: "Is there a setup fee or contract?",
    a: "None. No setup fee, no annual commitment, no cancellation penalty. The Free tier starts immediately with no credit card. Paid plans bill monthly and can be cancelled anytime from Settings → Billing.",
  },
  {
    q: "What happens when I hit the message limit on the free tier?",
    a: "You'll see an in-chat upgrade prompt. No conversations are lost and all your data stays intact. You can upgrade your plan or add a one-time token top-up ($10 / $25 / $50) that never expires.",
  },
  {
    q: "Do I need to manage each specialist?",
    a: "No. The specialists are autonomous agents. Atlas, your chief of staff, decides which specialist handles each task and routes work automatically. You just describe what you need — the team figures out the rest.",
  },
  {
    q: "Can I invite my co-founder or team members?",
    a: "Team collaboration is coming on the Enterprise plan. Today Praxis is a single-seat product optimized for the solo founder. You can join the waitlist by emailing luis@conduitai.io.",
  },
];

export function PricingFAQ() {
  return (
    <AccordionPrimitive.Root type="single" collapsible asChild>
      <dl className="mt-12 space-y-3">
        {FAQ.map((item, i) => (
          <AccordionPrimitive.Item
            key={item.q}
            value={`item-${i}`}
            asChild
          >
            <div className="conduit-card overflow-hidden">
              <AccordionPrimitive.Header asChild>
                <dt>
                  <AccordionPrimitive.Trigger className="group flex w-full items-start justify-between gap-4 p-6 md:p-7 text-left">
                    <span
                      className="text-[18px] md:text-[20px] tracking-[-0.01em] text-[var(--color-cream)]"
                      style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      aria-hidden
                      size={20}
                      className="mt-1 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-data-[state=open]:rotate-180"
                      style={{ color: "var(--color-dept-ops)" }}
                    />
                  </AccordionPrimitive.Trigger>
                </dt>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content
                className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
              >
                <dd className="px-6 md:px-7 pb-6 md:pb-7 text-[15px] md:text-[16px] text-[var(--color-cream-soft)] leading-[1.7]">
                  {item.a}
                </dd>
              </AccordionPrimitive.Content>
            </div>
          </AccordionPrimitive.Item>
        ))}
      </dl>
    </AccordionPrimitive.Root>
  );
}
