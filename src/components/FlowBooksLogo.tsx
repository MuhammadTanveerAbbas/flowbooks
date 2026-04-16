interface FlowBooksLogoProps {
  size?: number;
  className?: string;
}

export function FlowBooksLogo({ size = 32, className = "" }: FlowBooksLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-label="FlowBooks"
    >
      <rect width="32" height="32" rx="7" fill="#3d6b52" />
      {/* Vertical stem */}
      <rect x="9" y="8" width="3" height="16" rx="1" fill="#f0ebe0" />
      {/* Top bar */}
      <rect x="9" y="8" width="12" height="3" rx="1" fill="#f0ebe0" />
      {/* Middle bar */}
      <rect x="9" y="14.5" width="9" height="2.5" rx="1" fill="#f0ebe0" />
      {/* Flow wave */}
      <path
        d="M8 27 Q12 25 16 27 Q20 29 24 26"
        stroke="#7ab89a"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
