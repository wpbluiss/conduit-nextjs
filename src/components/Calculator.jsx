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

export default function Calculator() {
  const [missedCalls, setMissedCalls] = useState(5);
  const [jobValue, setJobValue] = useState(300);

  const lostRevenue = missedCalls * jobValue * 52;

  return (
    <section id="calculator" className="relative py-24 md:py-32">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brand-border to-transparent" />

      <div className="max-w-3xl mx-auto px-6">
        <FadeInOnScroll>
          <div className="text-center mb-12">
            <span className="section-label">ROI Calculator</span>
            <h2 className="font-[var(--font-heading)] text-4xl md:text-5xl font-black mt-4 mb-4">
              See what you&apos;re <span className="text-gradient">leaving on the table</span>
            </h2>
            <p className="text-brand-text-muted text-lg">Move the sliders. See the math.</p>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.2}>
          <div className="glass-card p-8 md:p-12">
            {/* Missed calls slider */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-brand-text">Missed calls per week</label>
                <span className="text-lg font-bold text-brand-cyan">{missedCalls} calls</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={missedCalls}
                onChange={(e) => setMissedCalls(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-brand-cyan) 0%, var(--color-brand-cyan) ${((missedCalls - 1) / 29) * 100}%, var(--color-brand-border) ${((missedCalls - 1) / 29) * 100}%, var(--color-brand-border) 100%)`,
                }}
              />
            </div>

            {/* Job value slider */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-brand-text">Average job value</label>
                <span className="text-lg font-bold text-brand-cyan">${jobValue}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={jobValue}
                onChange={(e) => setJobValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-brand-cyan) 0%, var(--color-brand-cyan) ${((jobValue - 50) / 1950) * 100}%, var(--color-brand-border) ${((jobValue - 50) / 1950) * 100}%, var(--color-brand-border) 100%)`,
                }}
              />
            </div>

            {/* Result */}
            <div className="text-center pt-6 border-t border-brand-border">
              <div className="text-6xl md:text-7xl font-black text-gradient mb-2">
                ${lostRevenue.toLocaleString()}
              </div>
              <p className="text-brand-text-muted text-lg">estimated revenue lost per year</p>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Slider thumb styles */}
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-brand-cyan), var(--color-brand-blue));
            cursor: pointer;
            box-shadow: 0 0 12px var(--color-brand-cyan-glow);
          }
          input[type='range']::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-brand-cyan), var(--color-brand-blue));
            cursor: pointer;
            border: none;
            box-shadow: 0 0 12px var(--color-brand-cyan-glow);
          }
        `}</style>
      </div>
    </section>
  );
}
