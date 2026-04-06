"use client";

export function ConduitLogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <rect width="40" height="40" rx="10" fill="#111118"/>
      <path d="M 27.6 13.6 A 13.2 13.2 0 1 0 27.6 26.4" stroke="#ff6b35" strokeWidth="3.6" fill="none" strokeLinecap="round"/>
      <circle cx="20" cy="20" r="2.4" fill="#ff6b35"/>
      <line x1="28.4" y1="14.4" x2="33.6" y2="11.6" stroke="#ff6b35" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <line x1="28.4" y1="25.6" x2="33.6" y2="28.4" stroke="#ff6b35" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
    </svg>
  );
}

export function ConduitLogoFull({ iconSize = 32 }: { iconSize?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <ConduitLogoMark size={iconSize} />
      <div className="flex items-baseline gap-1">
        <span className="font-[family-name:var(--font-display)] font-bold text-[1.1rem] tracking-[-0.03em] text-white">Conduit</span>
        <span className="font-[family-name:var(--font-display)] font-light text-[1.1rem] tracking-[-0.03em] text-text2">AI</span>
      </div>
    </div>
  );
}
