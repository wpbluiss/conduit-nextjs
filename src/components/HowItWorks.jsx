'use client';

import { useRef, useEffect, useState } from 'react';

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

export default function HowItWorks() {
  const steps = [
    {
      num: '1',
      title: "Customer calls, you can't answer",
      desc: "You're on a job, with a client, at lunch, or after hours. The call forwards to your Conduit AI agent.",
    },
    {
      num: '2',
      title: 'AI has a real conversation',
      desc: 'Our voice agent greets them by your business name, asks the right questions, and captures their info naturally.',
    },
    {
      num: '3',
      title: 'You get the lead instantly',
      desc: 'Name, number, what they need — delivered to you via text and email within seconds. Follow up when ready.',
    },
  ];

  return (
    <section id="how" className="relative py-24 md:py-32">
      {/* Subtle gradient separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent" />

      <div className="max-w-6xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-16">
            <span className="section-label">How It Works</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              Three steps. <span className="text-gradient">Zero missed leads.</span>
            </h2>
            <p className="text-brand-text-muted text-lg max-w-xl mx-auto">
              Set up in under 48 hours. No hardware. No complicated software.
            </p>
          </div>
        </FadeInOnScroll>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-px bg-gradient-to-r from-brand-cyan/30 via-brand-blue/30 to-brand-purple/30" />

          {steps.map((step, i) => (
            <FadeInOnScroll key={i} delay={i * 0.15}>
              <div className="relative text-center">
                {/* Step number */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center text-brand-dark text-xl font-black mx-auto mb-6 relative z-10">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-brand-text-muted leading-relaxed">{step.desc}</p>
              </div>
            </FadeInOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
