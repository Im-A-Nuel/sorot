type IconProps = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const TagIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 12.5V5a1 1 0 0 1 1-1h7.5L20 11.5 12.5 19 4 12.5z" />
    <circle cx="8.5" cy="8.5" r="1.2" />
  </svg>
);

export const ShieldIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3 5 6v5.5c0 4.2 2.8 7.5 7 9.5 4.2-2 7-5.3 7-9.5V6l-7-3z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const BoltIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z" />
  </svg>
);

export const WalletIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" />
    <rect x="4" y="8" width="16" height="11" rx="2.5" />
    <circle cx="15.5" cy="13.5" r="1" />
  </svg>
);

export const ChartIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="m7.5 14 3.5-4 3 2.5 4.5-6" />
  </svg>
);

export const LinkIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
  </svg>
);

export const EyeOffIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 8.5 4 9.5 6a12.6 12.6 0 0 1-3 3.7M6.6 7.7A12.5 12.5 0 0 0 2.5 12C3.5 14 7 18 12 18c1.3 0 2.5-.3 3.6-.8" />
    <path d="M9.9 10a3 3 0 0 0 4.1 4.1" />
  </svg>
);

export const KeyIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M16 7l2.5 2.5M14 9l2 2" />
  </svg>
);

export const LockIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9S14.600 18.300 12 21c-2.600-2.700-3.900-5.700-3.900-9S9.400 5.700 12 3z" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ArrowUpRightIcon = ({ className }: IconProps) => (
  <svg {...base} width={16} height={16} className={className}>
    <path d="M6 18 18 6M8.5 6H18v9.5" />
  </svg>
);

export const ChromeIcon = ({ className }: IconProps) => (
  <svg {...base} width={18} height={18} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 8.500h8.300M8.900 14 4.700 6.800M15.100 14l-4.200 7.200" />
  </svg>
);
