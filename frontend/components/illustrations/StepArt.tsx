/**
 * Four small illustrations for the "How it works" steps. Same palette as the rest of the page:
 * ink outlines, lavender fills, one electric-blue accent. Decorative, so hidden from assistive tech.
 */

const INK = "#0b0f1a";
const LAV = "#dfe3fb";
const PERI = "#8b92ef";
const BLUE = "#1626f0";

type Props = { className?: string };

function Frame({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** A package dropping into a tray: install the extension. */
export function InstallArt({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="9" y="40" width="54" height="22" rx="9" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M20 51h14" stroke={INK} strokeWidth="2" opacity="0.3" />
      <circle cx="53" cy="51" r="2.6" fill={PERI} />
      <path d="M22 40v-5M50 40v-5" stroke={INK} strokeWidth="2" />
      <circle cx="36" cy="21" r="14" fill={BLUE} />
      <path d="M36 14v13M30.5 22l5.5 5.5 5.5-5.5" stroke="#fff" strokeWidth="2.6" />
    </Frame>
  );
}

/** Two tweets and a scroll arrow: use X as usual. */
export function ScrollArt({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="15" y="6" width="42" height="30" rx="9" fill={LAV} stroke={INK} strokeWidth="2" />
      <rect x="9" y="22" width="46" height="42" rx="10" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx="21" cy="34" r="5" fill={PERI} />
      <path d="M31 32h17M31 38h11" stroke={INK} strokeWidth="2.2" />
      <path d="M17 49h30M17 56h19" stroke={INK} strokeWidth="2" opacity="0.28" />
      <path d="M65 26v24M60.5 45.5 65 50l4.5-4.5" stroke={BLUE} strokeWidth="2.6" />
    </Frame>
  );
}

/** A tweet card with the odds chip and a cursor on it: click the chip. */
export function ChipArt({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="7" y="7" width="58" height="58" rx="13" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M16 19h26M16 26h17" stroke={INK} strokeWidth="2.2" />
      <rect x="14" y="35" width="44" height="22" rx="8" fill="#e9ecff" stroke={BLUE} strokeWidth="1.6" />
      <path d="M19 40.5h14" stroke={INK} strokeWidth="2" opacity="0.4" />
      <rect x="19" y="45" width="15" height="8" rx="4" fill={BLUE} />
      <rect x="38" y="45" width="15" height="8" rx="4" fill={INK} />
      <path
        d="M44 47.5v14.200l3.800-3.600 3.100 6.400 2.800-1.300-3.100-6.200 5.200-.4z"
        fill={INK}
        stroke="#fff"
        strokeWidth="1.6"
      />
    </Frame>
  );
}

/** A wallet with a check badge: approve in Phantom. */
export function SignArt({ className }: Props) {
  return (
    <Frame className={className}>
      <rect x="7" y="20" width="54" height="42" rx="11" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M15 20.500 43 11.500a4 4 0 0 1 5 3.800V20" stroke={INK} strokeWidth="2" fill={LAV} />
      <rect x="40" y="35" width="27" height="15" rx="7.500" fill={LAV} stroke={INK} strokeWidth="2" />
      <circle cx="49.500" cy="42.500" r="2.600" fill={INK} />
      <circle cx="56" cy="14" r="11" fill={BLUE} />
      <path d="m50.500 14.200 3.800 3.800 6.700-7.600" stroke="#fff" strokeWidth="2.600" />
    </Frame>
  );
}
