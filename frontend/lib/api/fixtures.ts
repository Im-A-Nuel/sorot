import type { Market, Position, RecentTrade } from "./types";

/**
 * Fixtures for the demo API. These are NOT real Panta markets, prices or trades.
 * The UI shows a "Demo data" banner whenever this module is the data source.
 */

export const markets: Record<string, Market> = {
  "demo-sol-300": {
    id: "demo-sol-300",
    title: "Will SOL close above $300 on Oct 31?",
    category: "Crypto",
    status: "open",
    yesPrice: "0.62",
    noPrice: "0.38",
    url: "https://docs.panta.market",
  },
  "demo-eth-5k": {
    id: "demo-eth-5k",
    title: "Will ETH close above $5,000 on Dec 31?",
    category: "Crypto",
    status: "open",
    yesPrice: null,
    noPrice: null,
    url: "https://docs.panta.market",
  },
  "demo-closed": {
    id: "demo-closed",
    title: "Will BTC close above $100,000 on Sep 30?",
    category: "Crypto",
    status: "resolved",
    yesPrice: null,
    noPrice: null,
    url: "https://docs.panta.market",
  },
};

export function demoPositions(): Position[] {
  return [
    {
      marketId: "demo-sol-300",
      marketTitle: "Will SOL close above $300 on Oct 31?",
      side: "yes",
      shares: "8.064516",
      avgPrice: "0.62",
      costUsdc: "5.00",
      status: "open",
      claimable: false,
    },
    {
      marketId: "demo-closed",
      marketTitle: "Will BTC close above $100,000 on Sep 30?",
      side: "yes",
      shares: "20.000000",
      avgPrice: "0.50",
      costUsdc: "10.00",
      status: "won",
      claimable: true,
    },
    {
      marketId: "demo-eth-flip",
      marketTitle: "Will ETH flip BTC in market cap by Aug 31?",
      side: "no",
      shares: "12.500000",
      avgPrice: "0.80",
      costUsdc: "10.00",
      status: "won",
      claimable: true,
    },
    {
      marketId: "demo-fed-cut",
      marketTitle: "Will the Fed cut rates at the September meeting?",
      side: "yes",
      shares: "4.000000",
      avgPrice: "0.25",
      costUsdc: "1.00",
      status: "lost",
      claimable: false,
    },
  ];
}

export function demoRecentTrades(): RecentTrade[] {
  const now = Date.now();
  return [
    { id: "t1", wallet: "7xKXq9mPLw3fRZ4bHnTdAuYcVe2sGjQ8NpWk1mZrB4aE", side: "yes", amountUsdc: "25.00", at: now - 4 * 60_000 },
    { id: "t2", wallet: "Fa3Rk8tUyPq2NbXw6VcLmDjH5sZeGo9AiWu1KhQxT7vC", side: "no", amountUsdc: "10.00", at: now - 22 * 60_000 },
    { id: "t3", wallet: "9bQe4LpXnTz7YwCu2RkVmHs6AdGf3JiNoPq8UxEtZ1yB", side: "yes", amountUsdc: "5.00", at: now - 71 * 60_000 },
  ];
}
