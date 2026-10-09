import type {
  BuiltTransaction,
  CatalogMarket,
  Position,
  Quote,
  QuoteRequest,
  RecentTrade,
  TradeStatus,
} from "../types.ts";

/** What the rest of Sorot needs from Panta. Implemented by the HTTP client and by the fixture client. */
export interface PantaClient {
  /** "live" talks to Panta. "fixture" is built-in demo data and is always labeled as such. */
  readonly source: "live" | "fixture";
  listMarkets(): Promise<CatalogMarket[]>;
  getMarket(id: string): Promise<CatalogMarket>;
  recentTrades(marketId: string): Promise<RecentTrade[]>;
  quote(req: QuoteRequest): Promise<Quote>;
  build(req: { quoteId: string; maxSlippageBps: number; wallet: string }): Promise<BuiltTransaction>;
  submit(req: { signature: string; wallet: string; marketId: string; quoteId?: string }): Promise<void>;
  verify(signature: string): Promise<TradeStatus>;
  positions(wallet: string): Promise<Position[]>;
  claimBuild(req: { wallet: string; marketId: string }): Promise<BuiltTransaction>;
  /** Reports an on-chain trade or claim to Panta for attribution. Safe to repeat for the same signature. */
  reportTrade(req: { signature: string; wallet: string; marketId: string; quoteId?: string }): Promise<void>;
}
