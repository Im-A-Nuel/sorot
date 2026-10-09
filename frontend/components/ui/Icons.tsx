type IconProps = { className?: string; size?: number };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const CheckIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const PlusIcon = ({ className, size = 16 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CopyIcon = ({ className, size = 16 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6.5A1.500 1.500 0 0 1 6.500 5H15" />
  </svg>
);

export const MenuIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className, size = 22 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ExternalIcon = ({ className, size = 14 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="M7 17 17 7M8.500 7H17v8.500" />
  </svg>
);

export const ChromeIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.500" />
    <path d="M12 8.500h8.300M8.900 14 4.700 6.800M15.100 14l-4.200 7.200" />
  </svg>
);

export const AlertIcon = ({ className, size = 18 }: IconProps) => (
  <svg {...base} width={size} height={size} className={className}>
    <path d="M12 4 2.800 19.500h18.400L12 4z" />
    <path d="M12 10v4.500M12 17.500v.01" />
  </svg>
);
