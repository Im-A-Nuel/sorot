"use client";

import { useEffect, useState } from "react";
import { api, formatDecimal, shortAddress, type RecentTrade } from "@/lib/api";
import { timeAgo } from "@/lib/use-now";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; trades: RecentTrade[]; at: number };

/** Collapsed by default. Loads only when opened, so it never slows the trade flow. */
export function RecentTrades({ marketId }: { marketId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!open || state.status !== "idle") return;
    let cancelled = false;
    setState({ status: "loading" });
    api
      .recentTrades(marketId)
      .then((trades) => !cancelled && setState({ status: "ready", trades, at: Date.now() }))
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [open, state.status, marketId]);

  return (
    <details
      className="group border-t border-ink/10 pt-4"
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
        Recent trades
        <span aria-hidden="true" className="text-muted transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="mt-3" aria-live="polite">
        {state.status === "loading" && (
          <div aria-busy="true" className="space-y-2">
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-5 w-5/6" />
            <div className="skeleton h-5 w-2/3" />
          </div>
        )}
        {state.status === "error" && (
          <p className="text-[13.5px] text-danger">
            Could not load recent trades.{" "}
            <button
              type="button"
              className="cursor-pointer font-semibold underline"
              onClick={() => setState({ status: "idle" })}
            >
              Retry
            </button>
          </p>
        )}
        {state.status === "ready" && state.trades.length === 0 && (
          <p className="text-[13.5px] text-muted">No trades on this market yet.</p>
        )}
        {state.status === "ready" && state.trades.length > 0 && (
          <ul className="divide-y divide-ink/10">
            {state.trades.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="font-mono text-muted">{shortAddress(t.wallet)}</span>
                <span className="font-semibold">
                  {t.side.toUpperCase()} {formatDecimal(t.amountUsdc)} USDC
                </span>
                <span className="text-subtle">{timeAgo(t.at, state.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
