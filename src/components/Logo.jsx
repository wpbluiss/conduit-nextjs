export default function Logo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06d6a0" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
      {/* Lightning bolt */}
      <path
        d="M18.5 6L11 18h5l-1.5 8L22 14h-5l1.5-8z"
        fill="#0a0e1a"
        stroke="#0a0e1a"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
