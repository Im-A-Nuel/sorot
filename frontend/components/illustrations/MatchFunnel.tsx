/**
 * The matching pipeline as a picture: five tweets enter, three gates each turn some away, one reaches a chip.
 * Drawn for the dark panel. Decorative; the stage text sits beside it in HTML.
 */

const LANES = [28, 69, 110, 151, 192] as const;
// The lane that passes every gate, and where each other lane stops.
const PASS = 2;
const STOP_X = [300, 300, 0, 500, 700] as const;

const GATES = [300, 500, 700] as const;

function Tweet({ y }: { y: number }) {
  return (
    <g>
      <rect x="0" y={y - 15} width="112" height="30" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" />
      <circle cx="16" cy={y} r="6" fill="#8b92ef" />
      <path d={`M30 ${y - 4}h56M30 ${y + 5}h36`} stroke="rgba(255,255,255,0.5)" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

export function MatchFunnel({ className }: { className?: string }) {
  return (
    <>
      <MatchFunnelVertical className={`mx-auto h-auto w-full max-w-[340px] md:hidden ${className ?? ""}`} />
      <MatchFunnelWide className={`hidden h-auto w-full md:block ${className ?? ""}`} />
    </>
  );
}

function MatchFunnelWide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 960 220"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* gates: a bar with a gap at the passing lane */}
      {GATES.map((x) => (
        <g key={x} fill="rgba(255,255,255,0.14)">
          <rect x={x - 5} y="4" width="10" height={LANES[PASS] - 20 - 4} rx="5" />
          <rect x={x - 5} y={LANES[PASS] + 16} width="10" height={216 - LANES[PASS] - 16} rx="5" />
        </g>
      ))}

      {LANES.map((y, i) => {
        const passes = i === PASS;
        const end = passes ? 740 : STOP_X[i] - 14;
        return (
          <g key={y}>
            <Tweet y={y} />
            <path
              d={`M124 ${y}H${end}`}
              stroke={passes ? "#9aa6ff" : "rgba(255,255,255,0.3)"}
              strokeWidth={passes ? 3.4 : 2}
              strokeDasharray={passes ? undefined : "2 7"}
              strokeLinecap="round"
            />
            {!passes && (
              <g stroke="rgba(255,255,255,0.7)" strokeWidth="2.4" strokeLinecap="round">
                <path d={`M${end + 8} ${y - 6}l12 12M${end + 20} ${y - 6}l-12 12`} />
              </g>
            )}
          </g>
        );
      })}

      {/* the chip at the end of the passing lane */}
      <g transform={`translate(752 ${LANES[PASS] - 38})`}>
        <rect width="208" height="76" rx="18" fill="#fff" />
        <path d="M16 20h92" stroke="#0b0f1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 31h56" stroke="#0b0f1a" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
        <rect x="16" y="43" width="84" height="22" rx="11" fill="#1626f0" />
        <rect x="108" y="43" width="84" height="22" rx="11" fill="#0b0f1a" />
        <path d="M45 54h26M137 54h26" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Phone version: the same story turned on its side. Tweets enter along the top, gates are horizontal, the chip sits at the bottom.
const COLS = [34, 102, 170, 238, 306] as const;
const V_GATES = [150, 240, 330] as const;
const V_STOP_Y = [150, 150, 0, 240, 330] as const;

function VTweet({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 28} y="0" width="56" height="46" rx="11" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" />
      <circle cx={x - 14} cy="14" r="5" fill="#8b92ef" />
      <path d={`M${x - 20} 28h40M${x - 20} 36h24`} stroke="rgba(255,255,255,0.5)" strokeWidth="2.4" strokeLinecap="round" />
    </g>
  );
}

function MatchFunnelVertical({ className }: { className?: string }) {
  const pass = COLS[PASS];
  return (
    <svg viewBox="0 0 340 470" fill="none" aria-hidden="true" focusable="false" className={className}>
      {V_GATES.map((y) => (
        <g key={y} fill="rgba(255,255,255,0.14)">
          <rect x="0" y={y - 5} width={pass - 22} height="10" rx="5" />
          <rect x={pass + 22} y={y - 5} width={340 - pass - 22} height="10" rx="5" />
        </g>
      ))}

      {COLS.map((x, i) => {
        const passes = i === PASS;
        const end = passes ? 380 : V_STOP_Y[i] - 14;
        return (
          <g key={x}>
            <VTweet x={x} />
            <path
              d={`M${x} 58V${end}`}
              stroke={passes ? "#9aa6ff" : "rgba(255,255,255,0.3)"}
              strokeWidth={passes ? 3.4 : 2}
              strokeDasharray={passes ? undefined : "2 7"}
              strokeLinecap="round"
            />
            {!passes && (
              <path
                d={`M${x - 6} ${end + 8}l12 12M${x + 6} ${end + 8}l-12 12`}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}

      <g transform="translate(66 388)">
        <rect width="208" height="76" rx="18" fill="#fff" />
        <path d="M16 20h92" stroke="#0b0f1a" strokeWidth="3" strokeLinecap="round" />
        <path d="M16 31h56" stroke="#0b0f1a" strokeWidth="2.4" strokeLinecap="round" opacity="0.3" />
        <rect x="16" y="43" width="84" height="22" rx="11" fill="#1626f0" />
        <rect x="108" y="43" width="84" height="22" rx="11" fill="#0b0f1a" />
        <path d="M45 54h26M137 54h26" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
