export function Logo({ size = 31 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Swapify logo" role="img">
      <defs>
        <mask id="logo-cross">
          <rect width="32" height="32" fill="#fff" />
          <rect x="15.1" y="0" width="1.8" height="32" fill="#000" />
          <rect x="0" y="15.1" width="32" height="1.8" fill="#000" />
        </mask>
      </defs>
      <circle cx="16" cy="16" r="16" fill="#0b0f1a" mask="url(#logo-cross)" />
    </svg>
  );
}
