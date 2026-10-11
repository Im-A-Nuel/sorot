/**
 * Who holds what: extension (no keys), Sorot API (the Panta key), Phantom (signs). Decorative; the roles are
 * written in HTML under each node. Node centers sit at 1/6, 3/6 and 5/6 of the width so three equal columns line up.
 */

const INK = "#0b0f1a";
const LAV = "#dfe3fb";
const PERI = "#8b92ef";
const BLUE = "#1626f0";

function Key({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="-4" cy="3" r="5" />
      <path d="M0 -1 9 -10M5 -6l3 3" />
    </g>
  );
}

function Arrow({ x1, x2, y, back = false }: { x1: number; x2: number; y: number; back?: boolean }) {
  const tip = back ? x1 : x2;
  const dir = back ? 1 : -1;
  return (
    <g stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={back ? 0.35 : 0.8}>
      <path d={`M${x1} ${y}H${x2}`} strokeDasharray={back ? "2 7" : undefined} />
      <path d={`M${tip + dir * 9} ${y - 6}L${tip} ${y}L${tip + dir * 9} ${y + 6}`} />
    </g>
  );
}

function Badge({ cx, cy, fill, children }: { cx: number; cy: number; fill: string; children: React.ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="21" fill={fill} stroke={INK} strokeWidth="2" />
      {children}
    </g>
  );
}

export function TrustDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 960 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* arrows: requests go right, answers come back dashed */}
      <Arrow x1={268} x2={372} y={96} />
      <Arrow x1={268} x2={372} y={122} back />
      <Arrow x1={588} x2={692} y={96} />
      <Arrow x1={588} x2={692} y={122} back />

      {/* 1. extension: a browser window with a tweet and a chip */}
      <g>
        <rect x="52" y="34" width="216" height="152" rx="26" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="86" y="62" width="148" height="100" rx="12" fill={LAV} stroke={INK} strokeWidth="2" />
        <path d="M86 82h148" stroke={INK} strokeWidth="2" />
        <circle cx="99" cy="72" r="2.800" fill={INK} />
        <circle cx="109" cy="72" r="2.800" fill={INK} />
        <circle cx="119" cy="72" r="2.800" fill={INK} />
        <path d="M100 96h58M100 106h38" stroke={INK} strokeWidth="2.400" strokeLinecap="round" opacity="0.4" />
        <rect x="100" y="120" width="120" height="30" rx="9" fill="#fff" stroke={BLUE} strokeWidth="1.600" />
        <rect x="106" y="128" width="50" height="14" rx="7" fill={BLUE} />
        <rect x="162" y="128" width="50" height="14" rx="7" fill={INK} />
        <Badge cx={254} cy={44} fill="#fff">
          <Key x={254} y={44} color={INK} />
          <path d="M240 58 268 30" stroke={INK} strokeWidth="2.400" strokeLinecap="round" />
        </Badge>
      </g>

      {/* 2. Sorot API: a server stack that holds the Panta key */}
      <g>
        <rect x="372" y="34" width="216" height="152" rx="26" fill="#fff" stroke={INK} strokeWidth="2" />
        {[62, 94, 126].map((y, i) => (
          <g key={y}>
            <rect x="408" y={y} width="144" height="24" rx="9" fill={i === 1 ? "#e9ecff" : LAV} stroke={INK} strokeWidth="2" />
            <circle cx="425" cy={y + 12} r="3.400" fill={i === 1 ? BLUE : PERI} />
            <path d={`M440 ${y + 12}h56`} stroke={INK} strokeWidth="2.400" strokeLinecap="round" opacity="0.35" />
          </g>
        ))}
        <Badge cx={574} cy={44} fill={BLUE}>
          <Key x={574} y={44} color="#fff" />
        </Badge>
      </g>

      {/* 3. Phantom: a wallet that signs */}
      <g>
        <rect x="692" y="34" width="216" height="152" rx="26" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="726" y="74" width="148" height="88" rx="16" fill="#fff" stroke={INK} strokeWidth="2" />
        <path d="M740 74 822 52a6 6 0 0 1 8 5.600V74" fill={LAV} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <rect x="822" y="100" width="62" height="30" rx="15" fill={LAV} stroke={INK} strokeWidth="2" />
        <circle cx="839" cy="115" r="4.600" fill={INK} />
        <path d="M744 100h40M744 112h26" stroke={INK} strokeWidth="2.400" strokeLinecap="round" opacity="0.3" />
        <Badge cx={894} cy={44} fill={BLUE}>
          <path d="m884 44.500 6.200 6.200L904 36" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Badge>
      </g>
    </svg>
  );
}
