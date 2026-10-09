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
  /**
   * "live" is real Panta data (pk_live_ key). "sandbox" is Panta's test mode (pk_test_ key): fixtures that never touch mainnet.
   * "fixture" is Sorot's built-in demo data. Everything that is not "live" is labeled demo in the UI.
   */
  readonly source: "live" | "sandbox" | "fixture";
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
