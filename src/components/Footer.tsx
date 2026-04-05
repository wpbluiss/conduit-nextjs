export default function Footer() {
  return (
    <footer className="relative border-t border-border px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-blue flex items-center justify-center shadow-[0_0_10px_var(--color-glow-green)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              className="w-3.5 h-3.5"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-[family-name:var(--font-display)] font-bold text-sm tracking-tight">
            Conduit<span className="text-accent">AI</span>
          </span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-text3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <span className="text-border2">|</span>
          <span>v4.2.1</span>
        </div>

        {/* Copyright */}
        <div className="font-[family-name:var(--font-mono)] text-xs text-text3">
          {new Date().getFullYear()} Conduit AI LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
