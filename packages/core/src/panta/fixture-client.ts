import { fromMicro, sharesFor, toMicro } from "../money.ts";
import { SorotError } from "../types.ts";
import type { CatalogMarket, Position, Quote, QuoteRequest, RecentTrade, TradeStatus } from "../types.ts";
import type { PantaClient } from "./client.ts";

/**
 * Built-in demo data. These are NOT real Panta markets, prices or trades.
 * Used when no Panta key is configured. Every consumer labels data from this client as demo.
 */

const markets: CatalogMarket[] = [
  {
    id: "demo-sol-300",
    titleRaw: null,
    title: "Will SOL close above $300 on Oct 31?",
    category: "Crypto",
    status: "open",
    yesPrice: "0.62",
    noPrice: "0.38",
    volumeUsdc: null,
    url: "https://docs.panta.market",
    updatedAt: 0,
  },
  {
    id: "demo-eth-5k",
    titleRaw: null,
    title: "Will ETH close above $5,000 on Dec 31?",
    category: "Crypto",
    status: "open",
    yesPrice: null,
    noPrice: null,
    volumeUsdc: null,
    url: "https://docs.panta.market",
    updatedAt: 0,
  },
  {
    id: "demo-btc-100k",
    titleRaw: null,
    title: "Will BTC close above $100,000 on Sep 30?",
    category: "Crypto",
    status: "resolved",
    yesPrice: null,
    noPrice: null,
    volumeUsdc: null,
    url: "https://docs.panta.market",
    updatedAt: 0,
  },
];

function demoPositions(): Position[] {
  return [
    { marketId: "demo-sol-300", marketTitle: markets[0].title, side: "yes", shares: "8.064516", avgPrice: "0.62", costUsdc: "5.00", status: "open", claimable: false },
    { marketId: "demo-btc-100k", marketTitle: markets[2].title, side: "yes", shares: "20.000000", avgPrice: "0.50", costUsdc: "10.00", status: "won", claimable: true },
    { marketId: "demo-eth-flip", marketTitle: "Will ETH flip BTC in market cap by Aug 31?", side: "no", shares: "12.500000", avgPrice: "0.80", costUsdc: "10.00", status: "won", claimable: true },
    { marketId: "demo-fed-cut", marketTitle: "Will the Fed cut rates at the September meeting?", side: "yes", shares: "4.000000", avgPrice: "0.25", costUsdc: "1.00", status: "lost", claimable: false },
  ];
}

export type FixtureOptions = {
  /** Failure simulation, for development and tests only. Values: rate-limit, slippage, tx-failed, market-error, short-quote. */
  sim?: () => string | null;
  now?: () => number;
};

export class FixturePantaClient implements PantaClient {
  readonly source = "fixture" as const;

  /** Stateless on purpose: serverless instances do not share memory, so a quote id carries its own expiry. */
  private opts: FixtureOptions;

  constructor(opts: FixtureOptions = {}) {
    this.opts = opts;
  }

  private sim() {
    return this.opts.sim?.() ?? null;
  }
  private now() {
    return (this.opts.now ?? Date.now)();
  }

  async listMarkets() {
    return markets.map((m) => ({ ...m, updatedAt: this.now() }));
  }

  async getMarket(id: string) {
    if (this.sim() === "market-error") throw new SorotError("PANTA_UPSTREAM", "Panta returned 502.");
    const m = markets.find((x) => x.id === id);
    if (!m) throw new SorotError("NOT_FOUND", "No market with that id.");
    return { ...m, updatedAt: this.now() };
  }

  async recentTrades(): Promise<RecentTrade[]> {
    const now = this.now();
    return [
      { id: "t1", wallet: "7xKXq9mPLw3fRZ4bHnTdAuYcVe2sGjQ8NpWk1mZrB4aE", side: "yes", amountUsdc: "25.00", at: now - 4 * 60_000 },
      { id: "t2", wallet: "Fa3Rk8tUyPq2NbXw6VcLmDjH5sZeGo9AiWu1KhQxT7vC", side: "no", amountUsdc: "10.00", at: now - 22 * 60_000 },
      { id: "t3", wallet: "9bQe4LpXnTz7YwCu2RkVmHs6AdGf3JiNoPq8UxEtZ1yB", side: "yes", amountUsdc: "5.00", at: now - 71 * 60_000 },
    ];
  }

  async quote(req: QuoteRequest): Promise<Quote> {
    if (this.sim() === "rate-limit") throw new SorotError("RATE_LIMITED", "Panta is rate limiting requests.", 2000);
    const m = markets.find((x) => x.id === req.marketId);
    if (!m) throw new SorotError("NOT_FOUND", "No market with that id.");
    if (m.status !== "open") throw new SorotError("MARKET_CLOSED", "This market is not open.");

    const amount = toMicro(req.amountUsdc);
    if (amount === null) throw new SorotError("INVALID_PARAMS", "Amount is not a decimal.");

    // A market without a listed price still quotes. The quote is where the real price appears.
    const listed = req.side === "yes" ? m.yesPrice : m.noPrice;
    const price = toMicro(listed ?? "0.50") as bigint;
    const fee = amount / BigInt(100);
    const expiresAt = this.now() + (this.sim() === "short-quote" ? 8_000 : 90_000);
    const quote: Quote = {
      quoteId: `demo-q-${expiresAt}-${Math.random().toString(36).slice(2, 8)}`,
      marketId: req.marketId,
      side: req.side,
      amountUsdc: req.amountUsdc,
      shares: fromMicro(sharesFor(amount - fee, price)),
      avgPrice: fromMicro(price).slice(0, 4),
      feeUsdc: fromMicro(fee).slice(0, -4),
      maxSlippageBps: 100,
      expiresAt,
    };
    return quote;
  }

  async build(req: { quoteId: string; maxSlippageBps: number }) {
    const expiresAt = Number(/^demo-q-(\d+)-/.exec(req.quoteId)?.[1]);
    if (!Number.isFinite(expiresAt) || this.now() > expiresAt) {
      throw new SorotError("QUOTE_EXPIRED", "The quote expired. Get a new one.");
    }
    if (this.sim() === "slippage") throw new SorotError("SLIPPAGE", "The price moved beyond your slippage limit.");
    return { quoteId: req.quoteId, instructions: [], recentBlockhash: "demo-blockhash" };
  }

  async submit() {
    // Nothing to register for demo data.
  }

  async verify(): Promise<TradeStatus> {
    return this.sim() === "tx-failed" ? "failed" : "confirmed";
  }

  async positions() {
    return demoPositions();
  }

  async claimBuild(req: { marketId: string }) {
    const p = demoPositions().find((x) => x.marketId === req.marketId);
    if (!p || !p.claimable) throw new SorotError("NOT_CLAIMABLE", "This position can't be claimed.");
    return { quoteId: `claim:${req.marketId}`, instructions: [], recentBlockhash: "demo-blockhash" };
  }

  async reportTrade() {
    // Nothing to report for demo data.
  }
}
