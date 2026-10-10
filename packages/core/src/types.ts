export type MarketStatus = "open" | "closed" | "resolved";
export type Side = "yes" | "no";

/** One market as Sorot stores it. `title` is hydrated, because Panta often returns an empty title in the catalog. */
export type CatalogMarket = {
  id: string;
  titleRaw: string | null;
  title: string;
  category: string | null;
  status: MarketStatus;
  /** Decimal strings exactly as Panta returned them. Null when Panta has no live price. */
  yesPrice: string | null;
  noPrice: string | null;
  volumeUsdc: string | null;
  url: string;
  updatedAt: number;
};

export type TweetInput = { tweetId: string; text: string; lang: string };

export type MatchStage = "prefilter" | "similarity" | "verify" | "match";

export type MatchOutcome = {
  tweetId: string;
  stage: MatchStage;
  marketId: string | null;
  similarity: number | null;
};

export type ApiMatch = {
  marketId: string;
  title: string;
  yesPrice: string | null;
  noPrice: string | null;
  url: string;
  /** True when the market came from fixtures, so clients can label it. */
  demo?: boolean;
};

export type QuoteRequest = {
  marketId: string;
  side: Side;
  amountUsdc: string;
  wallet: string;
  tweetId?: string;
};

export type Quote = {
  quoteId: string;
  marketId: string;
  side: Side;
  amountUsdc: string;
  shares: string;
  avgPrice: string;
  feeUsdc: string;
  maxSlippageBps: number;
  expiresAt: number;
};

export type BuiltTransaction = {
  quoteId: string;
  instructions: unknown[];
  recentBlockhash: string;
};

export type TradeStatus = "pending" | "confirmed" | "failed";

export type PositionStatus = "open" | "won" | "lost" | "claimed";

export type Position = {
  marketId: string;
  marketTitle: string;
  side: Side;
  shares: string;
  avgPrice: string;
  costUsdc: string;
  status: PositionStatus;
  claimable: boolean;
};

export type RecentTrade = {
  id: string;
  wallet: string;
  side: Side;
  amountUsdc: string;
  at: number;
};

export type ErrorCode =
  | "INVALID_PARAMS"
  | "NOT_FOUND"
  | "MARKET_CLOSED"
  | "PANTA_UPSTREAM"
  | "RATE_LIMITED"
  | "QUOTE_EXPIRED"
  | "SLIPPAGE"
  | "NOT_CLAIMABLE"
  | "TX_FAILED"
  | "UNKNOWN";

export class SorotError extends Error {
  code: ErrorCode;
  retryAfterMs?: number;

  constructor(code: ErrorCode, message?: string, retryAfterMs?: number) {
    super(message ?? code);
    this.name = "SorotError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * True for a SorotError even when the class was loaded twice. A production bundle can contain two copies of this module,
 * and `instanceof` then fails and turns every mapped error into a 500, so errors are recognized by their shape.
 */
export function isSorotError(e: unknown): e is SorotError {
  return typeof e === "object" && e !== null && (e as { name?: unknown }).name === "SorotError" && typeof (e as { code?: unknown }).code === "string";
}

export const MARKET_ID_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
export const TWEET_ID_RE = /^\d{1,25}$/;
export const SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{43,90}$|^demo-[a-z0-9]{6,40}$/;
export const WALLET_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
