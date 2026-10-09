import type { CSSProperties, ReactNode } from "react";

type Props = {
  variant: "glass" | "dark";
  icon: ReactNode;
  name: string;
  symbol: string;
  price: string;
  change?: string;
  spark: ReactNode;
  style?: CSSProperties;
};

export function CryptoCard({ variant, icon, name, symbol, price, change, spark, style }: Props) {
  const surface =
    variant === "glass"
      ? "bg-[linear-gradient(100deg,rgba(86,100,235,0.78),rgba(70,84,222,0.7))] border-white/35 backdrop-blur-md shadow-[0_18px_40px_-12px_rgba(20,28,120,0.55)]"
      : "bg-[linear-gradient(100deg,rgba(14,16,30,0.96),rgba(8,9,18,0.98))] border-white/25 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]";

  return (
    <div
      className={`absolute flex items-center rounded-full border ${surface}`}
      style={style}
    >
      <div className="flex w-full items-center justify-between pl-[4.5%] pr-[7.5%]">
        <div className="flex items-center gap-[calc(9*var(--u))]">
          {icon}
          <div className="whitespace-nowrap leading-tight">
            <div className="text-[calc(13*var(--u))] font-medium text-white">{name}</div>
            <div className="text-[calc(10.5*var(--u))] text-white/45">{symbol}</div>
          </div>
        </div>
        {spark}
        <div className="whitespace-nowrap text-right leading-tight">
          <div className="text-[calc(13*var(--u))] font-semibold text-white">{price}</div>
          {change && <div className="text-[calc(10.5*var(--u))] text-white/45">{change}</div>}
        </div>
      </div>
    </div>
  );
}
