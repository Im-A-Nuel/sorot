import type { EmbeddingCache } from "./match/pipeline.ts";
import type { CatalogMarket, MatchStage, Quote, Side } from "./types.ts";

export type StoredMatch = {
  tweetId: string;
  marketId: string | null;
  similarity: number | null;
  stage: MatchStage;
  verified: boolean;
  createdAt: number;
};

export type AttemptStatus = "quoted" | "built" | "sent" | "confirmed" | "failed";

export type TradeAttempt = {
  quoteId: string;
  tweetId: string | null;
  marketId: string;
  wallet: string;
  side: Side;
  amountUsdc: string;
  quote: Quote;
  signature: string | null;
  status: AttemptStatus;
  createdAt: number;
};

/** Persistence used by the service. The Postgres version lives in the frontend app, this one is in memory. */
export interface Store {
  upsertMarkets(markets: CatalogMarket[]): Promise<void>;
  listMarkets(): Promise<CatalogMarket[]>;
  getMarket(id: string): Promise<CatalogMarket | null>;

  loadEmbeddings(model: string): Promise<EmbeddingCache>;
  saveEmbeddings(model: string, cache: EmbeddingCache): Promise<void>;

  getMatches(tweetIds: string[], since: number): Promise<Map<string, StoredMatch>>;
  saveMatches(matches: StoredMatch[]): Promise<void>;

  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;

  saveAttempt(attempt: TradeAttempt): Promise<void>;
  updateAttempt(quoteId: string, patch: Partial<Pick<TradeAttempt, "status" | "signature">>): Promise<void>;
  updateAttemptBySignature(signature: string, status: AttemptStatus): Promise<void>;

  recordClaim(wallet: string, marketId: string): Promise<void>;
  claimedMarkets(wallet: string): Promise<Set<string>>;
}

export class MemoryStore implements Store {
  private markets = new Map<string, CatalogMarket>();
  private embeddings = new Map<string, EmbeddingCache>();
  private matches = new Map<string, StoredMatch>();
  private meta = new Map<string, string>();
  private attempts = new Map<string, TradeAttempt>();
  private claims = new Map<string, Set<string>>();

  async upsertMarkets(markets: CatalogMarket[]) {
    for (const m of markets) {
      const prev = this.markets.get(m.id);
      // Keep a hydrated title when a later sync returns an empty one.
      this.markets.set(m.id, { ...m, title: m.title.trim() !== "" ? m.title : (prev?.title ?? "") });
    }
  }

  async listMarkets() {
    return [...this.markets.values()];
  }

  async getMarket(id: string) {
    return this.markets.get(id) ?? null;
  }

  async loadEmbeddings(model: string) {
    return new Map(this.embeddings.get(model) ?? []);
  }

  async saveEmbeddings(model: string, cache: EmbeddingCache) {
    this.embeddings.set(model, new Map(cache));
  }

  async getMatches(tweetIds: string[], since: number) {
    const out = new Map<string, StoredMatch>();
    for (const id of tweetIds) {
      const m = this.matches.get(id);
      if (m && m.createdAt >= since) out.set(id, m);
    }
    return out;
  }

  async saveMatches(matches: StoredMatch[]) {
    for (const m of matches) this.matches.set(m.tweetId, m);
  }

  async getMeta(key: string) {
    return this.meta.get(key) ?? null;
  }

  async setMeta(key: string, value: string) {
    this.meta.set(key, value);
  }

  async saveAttempt(attempt: TradeAttempt) {
    this.attempts.set(attempt.quoteId, attempt);
  }

  async updateAttempt(quoteId: string, patch: Partial<Pick<TradeAttempt, "status" | "signature">>) {
    const a = this.attempts.get(quoteId);
    if (a) this.attempts.set(quoteId, { ...a, ...patch });
  }

  async updateAttemptBySignature(signature: string, status: AttemptStatus) {
    for (const [id, a] of this.attempts) if (a.signature === signature) this.attempts.set(id, { ...a, status });
  }

  async recordClaim(wallet: string, marketId: string) {
    const set = this.claims.get(wallet) ?? new Set<string>();
    set.add(marketId);
    this.claims.set(wallet, set);
  }

  async claimedMarkets(wallet: string) {
    return new Set(this.claims.get(wallet) ?? []);
  }
}
