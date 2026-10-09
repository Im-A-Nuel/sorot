import { formatDecimal, type Quote } from "@/lib/api";

const WINDOW_MS = 90_000;

type Props = {
  quote: Quote;
  remainingMs: number;
};

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Quote details from Panta with a live countdown. Amounts are formatted from decimal strings. */
export function QuoteSummary({ quote, remainingMs }: Props) {
  const share = Math.min(1, Math.max(0, remainingMs / WINDOW_MS));
  const urgent = remainingMs <= 15_000;

  const rows: [string, string][] = [
    ["You pay", `${formatDecimal(quote.amountUsdc)} USDC`],
    ["Estimated shares", formatDecimal(quote.shares, 2)],
    ["Average price", quote.avgPrice],
    ["Fee", `${formatDecimal(quote.feeUsdc)} USDC`],
    ["Max slippage", `${(quote.maxSlippageBps / 100).toFixed(2)}%`],
  ];

  return (
    <section aria-label="Quote" className="rounded-2xl border border-ink/15 bg-white p-4">
      <dl className="space-y-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 text-[14.5px]">
            <dt className="text-muted">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <div className="flex items-center justify-between text-[13.5px]">
          <span className={urgent ? "font-semibold text-danger" : "text-muted"}>Quote expires in</span>
          <span
            role="timer"
            aria-live="off"
            className={`font-semibold tabular-nums ${urgent ? "text-danger" : ""}`}
          >
            {clock(remainingMs)}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none ${
              urgent ? "bg-danger" : "bg-brand-blue"
            }`}
            style={{ width: `${share * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
