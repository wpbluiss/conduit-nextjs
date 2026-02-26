'use client';

import { useState, useRef, useEffect } from 'react';

function FadeInOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(30px)',
      transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function FAQItem({ question, answer, isOpen, onToggle }) {
  const contentRef = useRef(null);

  return (
    <div className="border-b border-brand-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-lg font-semibold group-hover:text-brand-cyan transition-colors pr-4">
          {question}
        </span>
        <span
          className={`text-2xl text-brand-text-muted transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: isOpen ? contentRef.current?.scrollHeight + 'px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <p className="pb-5 text-brand-text-muted leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'How long does setup take?',
      a: 'Most businesses are live within 24\u201348 hours. You sign up, we configure your voice agent with your business info and custom scripts, integrate with your phone number, test everything, and go live. No hardware or phone number changes needed.',
    },
    {
      q: 'Does this replace my receptionist?',
      a: 'No. Conduit works alongside your existing team. We catch everything they can\'t \u2014 after-hours, overflow when lines are busy, lunch breaks, weekends, and holidays. Think of us as your backup that never sleeps.',
    },
    {
      q: 'Will callers know it\'s AI?',
      a: 'Our voice agent sounds remarkably natural. It uses your business name, understands context, and handles conversation flow like a trained receptionist. Most callers don\'t realize they\'re speaking with AI.',
    },
    {
      q: 'What if I get no missed calls?',
      a: 'You probably get more than you think. Studies show businesses miss 28-62% of calls. Plus with our 14-day free trial, there\'s zero risk. If you don\'t find value, cancel anytime \u2014 no questions asked.',
    },
    {
      q: 'How does the 14-day trial work?',
      a: 'Start your trial, provide a payment method (you won\'t be charged), and we\'ll have your AI agent live within 48 hours. Use it for 14 days. If you\'re not seeing results, cancel before day 15 and pay nothing.',
    },
    {
      q: 'What information does the AI collect?',
      a: 'Name, phone number, what service they need, and any details relevant to your business. For contractors, it can ask about job scope. For salons, it captures preferred services and availability. Everything is customized to you.',
    },
  ];

  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="max-w-3xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-12">
            <span className="section-label">FAQ</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4">
              Common questions
            </h2>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.15}>
          <div>
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
