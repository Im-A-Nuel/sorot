/** Shapes shared by the UI, the mock API and the HTTP client. USDC amounts and prices stay decimal strings, exactly as Panta returns them. */

export type MarketStatus = "open" | "closed" | "resolved";
export type Side = "yes" | "no";

export type Market = {
  id: string;
  title: string;
  category: string | null;
  status: MarketStatus;
  /** Null for markets without a live price. The UI shows "see odds", never a guess. */
  yesPrice: string | null;
  noPrice: string | null;
  url: string;
  /** True when the data comes from built-in fixtures instead of Panta. */
  demo?: boolean;
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
  /** Epoch milliseconds. A Panta quote lives for about 90 seconds. */
  expiresAt: number;
};

export type BuiltTransaction = {
  quoteId: string;
  /** Unsigned Solana instructions from Panta. The client compiles, signs and broadcasts them. */
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

export type ApiErrorCode =
  | "INVALID_PARAMS"
  | "NOT_FOUND"
  | "MARKET_CLOSED"
  | "PANTA_UPSTREAM"
  | "RATE_LIMITED"
  | "QUOTE_EXPIRED"
  | "SLIPPAGE"
  | "NOT_CLAIMABLE"
  | "USER_REJECTED"
  | "TX_FAILED"
  | "NETWORK"
  | "UNKNOWN";

export class ApiError extends Error {
  code: ApiErrorCode;
  retryAfterMs?: number;

  constructor(code: ApiErrorCode, message?: string, retryAfterMs?: number) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

export type QuoteRequest = {
  marketId: string;
  side: Side;
  amountUsdc: string;
  wallet: string;
  tweetId?: string;
};

export type SubmitRequest = {
  signature: string;
  wallet: string;
  marketId: string;
  quoteId?: string;
};

export interface SorotApi {
  /** Tells the UI whether the backend is serving demo data. */
  meta(): Promise<{ demo: boolean; source: "live" | "sandbox" | "fixture" }>;
  getMarket(id: string): Promise<Market>;
  recentTrades(marketId: string): Promise<RecentTrade[]>;
  quote(req: QuoteRequest): Promise<Quote>;
  build(req: { quoteId: string; maxSlippageBps: number; wallet: string }): Promise<BuiltTransaction>;
  submit(req: SubmitRequest): Promise<void>;
  verify(signature: string): Promise<TradeStatus>;
  positions(wallet: string): Promise<Position[]>;
  claimBuild(req: { wallet: string; marketId: string }): Promise<BuiltTransaction>;
}
