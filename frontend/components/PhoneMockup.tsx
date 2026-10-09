import { content } from "@/lib/content";
import { u } from "@/lib/units";
import { CryptoCard } from "./CryptoCard";
import { Logo } from "./Logo";

function MarketIcon() {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-white"
      style={{ width: u(30), height: u(30) }}
    >
      <Logo size={18} />
    </span>
  );
}

export function PhoneMockup() {
  const { a, b } = content.cards;

  return (
    <div
      className="absolute z-10"
      style={{ left: u(415), top: u(421), width: u(248), height: u(520) }}
    >
      <div
        className="absolute inset-0 overflow-hidden border border-white/40"
        style={{
          borderRadius: u(30),
          background:
            "linear-gradient(180deg,#4c5bee 0%,#3a47b4 10%,#2c3680 20%,#10153a 30%,#030508 40%,#020304 100%)",
        }}
      >
        <div
          className="absolute flex w-full items-center justify-between text-white"
          style={{ top: u(10), padding: `0 ${u(22)}`, fontSize: u(11), fontWeight: 600 }}
        >
          <span>9:41</span>
          <span className="flex items-center" style={{ gap: u(4) }}>
            <svg width={u(14)} height={u(9)} viewBox="0 0 14 9" fill="#fff" aria-hidden="true">
              <rect x="0" y="6" width="2.4" height="3" rx=".6" />
              <rect x="3.9" y="4" width="2.4" height="5" rx=".6" />
              <rect x="7.8" y="2" width="2.4" height="7" rx=".6" />
              <rect x="11.6" y="0" width="2.4" height="9" rx=".6" />
            </svg>
            <svg
              width={u(13)}
              height={u(9)}
              viewBox="0 0 13 9"
              fill="none"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M1 3.2a8 8 0 0 1 11 0M3 5.4a5 5 0 0 1 7 0" />
              <circle cx="6.5" cy="7.6" r=".9" fill="#fff" stroke="none" />
            </svg>
            <svg width={u(20)} height={u(10)} viewBox="0 0 20 10" fill="none" aria-hidden="true">
              <rect x=".5" y=".5" width="16" height="9" rx="2.6" stroke="#fff" opacity=".6" />
              <rect x="2" y="2" width="13" height="6" rx="1.4" fill="#fff" />
              <rect x="17.6" y="3.2" width="1.6" height="3.6" rx=".8" fill="#fff" opacity=".6" />
            </svg>
          </span>
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
          style={{ top: u(7), width: u(80), height: u(23) }}
        />

        <svg
          className="absolute inset-x-0"
          style={{ top: u(52), height: u(110) }}
          viewBox="0 0 248 110"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M70 100 C98 84 112 92 138 66 S178 38 214 26"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1"
          />
          <path d="m146 60 8-14 5 11-13 3" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        </svg>
      </div>

      <CryptoCard
        variant="glass"
        icon={<MarketIcon />}
        name={a.name}
        symbol={a.symbol}
        price={a.price}
        change={a.change}
        style={{
          left: u(18),
          top: u(100),
          width: u(266),
          height: u(66),
          transform: "rotate(-8deg)",
        }}
        spark={
          <svg width={u(66)} height={u(26)} viewBox="0 0 66 26" fill="none" aria-hidden="true">
            <path
              d="M0 18 4 14l4 3 5-9 4 6 4-2 4 8 5-12 4 5 3-3 4 9 4-8 5 4 4-3 4 5"
              stroke="#e8c97e"
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        }
      />

      <CryptoCard
        variant="dark"
        icon={<MarketIcon />}
        name={b.name}
        symbol={b.symbol}
        price={b.price}
        style={{
          left: u(-35),
          top: u(202),
          width: u(270),
          height: u(66),
          transform: "rotate(8deg)",
        }}
        spark={
          <svg width={u(62)} height={u(26)} viewBox="0 0 62 26" fill="none" aria-hidden="true">
            <path
              d="M0 14l5-6 4 8 5-10 4 11 5-5 4 6 5-9 4 7 4-4 4 5 4-6 4 3"
              stroke="#2a3df0"
              strokeWidth="1.3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        }
      />
    </div>
  );
}
