export default function Footer() {
  return (
    <footer className="relative border-t border-border px-6 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] font-bold text-sm tracking-tight">
            Conduit
          </span>
          <span className="font-[family-name:var(--font-display)] font-light text-sm tracking-tight text-text2">
            AI
          </span>
        </div>

        <div className="flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-text3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange status-dot" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <span className="text-border2">|</span>
          <span>v4.2.1</span>
        </div>

        <div className="font-[family-name:var(--font-mono)] text-xs text-text3">
          {new Date().getFullYear()} Conduit AI LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
