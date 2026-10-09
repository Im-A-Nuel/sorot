import { demoPositions, demoRecentTrades, markets } from "./fixtures";
import { fromMicro, sharesFor, toMicro } from "./money";
import { ApiError, type Quote, type SorotApi, type TradeStatus } from "./types";

/**
 * Demo implementation of the Sorot API. It only reads fixtures and never talks to Panta.
 * Append `?sim=<mode>` to a page URL to force a failure path:
 * rate-limit, slippage, tx-failed, market-error, short-quote, slow.
 */

const quotes = new Map<string, Quote>();
const claimed = new Set<string>();
const verifyCalls = new Map<string, number>();

function sim(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("sim");
}

function wait(ms: number): Promise<void> {
  const factor = sim() === "slow" ? 4 : 1;
  return new Promise((resolve) => setTimeout(resolve, ms * factor));
}

export const mockApi: SorotApi = {
  async getMarket(id) {
    await wait(500);
    if (sim() === "market-error") throw new ApiError("PANTA_UPSTREAM", "Panta returned 502.");
    const market = markets[id];
    if (!market) throw new ApiError("NOT_FOUND", "No market with that id.");
    return market;
  },

  async recentTrades() {
    await wait(350);
    return demoRecentTrades();
  },

  async quote(req) {
    await wait(700);
    if (sim() === "rate-limit") {
      throw new ApiError("RATE_LIMITED", "Panta is rate limiting requests.", 2000);
    }
    const market = markets[req.marketId];
    if (!market) throw new ApiError("NOT_FOUND", "No market with that id.");
    if (market.status !== "open") throw new ApiError("MARKET_CLOSED", "This market is not open.");

    const amountMicro = toMicro(req.amountUsdc);
    if (amountMicro === null) throw new ApiError("INVALID_PARAMS", "Amount is not a decimal.");

    // A market without a listed price still quotes: the quote is where the real price appears.
    const listed = req.side === "yes" ? market.yesPrice : market.noPrice;
    const priceMicro = toMicro(listed ?? "0.50") as bigint;
    const feeMicro = amountMicro / BigInt(100);
    const quote: Quote = {
      quoteId: `demo-q-${Date.now().toString(36)}`,
      marketId: req.marketId,
      side: req.side,
      amountUsdc: req.amountUsdc,
      shares: fromMicro(sharesFor(amountMicro - feeMicro, priceMicro)),
      avgPrice: fromMicro(priceMicro).slice(0, 4),
      feeUsdc: fromMicro(feeMicro).slice(0, -4),
      maxSlippageBps: 100,
      expiresAt: Date.now() + (sim() === "short-quote" ? 8_000 : 90_000),
    };
    quotes.set(quote.quoteId, quote);
    return quote;
  },

  async build({ quoteId }) {
    await wait(600);
    const quote = quotes.get(quoteId);
    if (!quote || Date.now() > quote.expiresAt) {
      throw new ApiError("QUOTE_EXPIRED", "The quote expired. Get a new one.");
    }
    if (sim() === "slippage") {
      throw new ApiError("SLIPPAGE", "The price moved beyond your slippage limit.");
    }
    return { quoteId, instructions: [], recentBlockhash: "demo-blockhash" };
  },

  async submit({ signature, marketId, quoteId }) {
    await wait(500);
    verifyCalls.set(signature, 0);
    if (quoteId?.startsWith("demo-claim-")) claimed.add("claim:" + marketId);
  },

  async verify(signature): Promise<TradeStatus> {
    await wait(800);
    const calls = (verifyCalls.get(signature) ?? 0) + 1;
    verifyCalls.set(signature, calls);
    if (sim() === "tx-failed") return "failed";
    return calls < 2 ? "pending" : "confirmed";
  },

  async positions() {
    await wait(800);
    return demoPositions().map((p) =>
      claimed.has("claim:" + p.marketId)
        ? { ...p, status: "claimed" as const, claimable: false }
        : p,
    );
  },

  async claimBuild({ marketId }) {
    await wait(600);
    const position = demoPositions().find((p) => p.marketId === marketId);
    if (!position || !position.claimable || claimed.has("claim:" + marketId)) {
      throw new ApiError("NOT_CLAIMABLE", "This position can't be claimed.");
    }
    return { quoteId: `demo-claim-${marketId}`, instructions: [], recentBlockhash: "demo-blockhash" };
  },
};
