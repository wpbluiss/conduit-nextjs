'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';

function AnimatedCounter({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = end / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-brand-dark to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan text-sm font-medium animate-[fadeInUp_0.6s_ease-out]">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          Now accepting Founding 10 members
        </div>

        {/* Headline */}
        <h1
          className="font-[var(--font-heading)] text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6 animate-[fadeInUp_0.6s_ease-out_0.1s_both]"
        >
          Stop Losing Customers
          <br />
          <span className="text-gradient">To Missed Calls</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-brand-text-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          When you can&apos;t answer, we do. Our AI voice agent picks up, has a real
          conversation, captures every lead, and sends it to you instantly.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
          <a href="https://app.conduitai.io" className="btn-primary text-lg !py-4 !px-8" onClick={() => track('cta_click', { button: 'start_free_trial', page: 'hero' })}>
            Start Free Trial
            <span>→</span>
          </a>
          <a href="#demo" className="btn-secondary text-lg !py-4 !px-8" onClick={() => track('cta_click', { button: 'hear_ai_live', page: 'hero' })}>
            🎧 Hear the AI live
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
          {[
            { value: 80, suffix: '%', label: 'of callers won\'t leave a voicemail' },
            { value: 120, prefix: '$', suffix: 'K', label: 'avg lost per year to missed calls' },
            { value: 24, suffix: '/7', label: 'coverage, no breaks' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5">
              <div className="text-3xl md:text-4xl font-black text-gradient mb-1">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <div className="text-sm text-brand-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Fade-in keyframes */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
