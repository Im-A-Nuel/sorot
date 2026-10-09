import type { CatalogMarket, MatchOutcome, TweetInput } from "../types.ts";
import { cosine, type Embedder } from "./embedding.ts";
import { extractEntities, extractMarketEntities, sharesSubject, type MarketEntities } from "./entities.ts";
import type { Verifier } from "./verify.ts";

/** Cached vectors keyed by market id. A vector is reused while the title hash is unchanged. */
export type EmbeddingCache = Map<string, { titleHash: string; vector: number[] }>;

export type MatcherConfig = {
  embedder: Embedder;
  verifier: Verifier;
  /** Minimum cosine similarity for the top candidate. Scale depends on the embedder. */
  threshold: number;
};

type Indexed = { market: CatalogMarket; entities: MarketEntities; vector: number[] };

export function titleHash(title: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

/**
 * Entity prefilter, embedding similarity, then yes/no verification. Every stage can stop the pipeline.
 * Only open markets with a real title are ever indexed, so closed or resolved markets can never match.
 */
export class Matcher {
  private index: Indexed[] = [];

  private cfg: MatcherConfig;

  constructor(cfg: MatcherConfig) {
    this.cfg = cfg;
  }

  get size(): number {
    return this.index.length;
  }

  /** Embeds only the titles that are new or changed. Returns the cache to persist. */
  async indexCatalog(markets: CatalogMarket[], cache: EmbeddingCache = new Map()): Promise<EmbeddingCache> {
    const usable = markets.filter((m) => m.status === "open" && m.title.trim() !== "");
    const stale = usable.filter((m) => cache.get(m.id)?.titleHash !== titleHash(m.title));

    if (stale.length > 0) {
      const vectors = await this.cfg.embedder.embed(stale.map((m) => m.title));
      stale.forEach((m, i) => cache.set(m.id, { titleHash: titleHash(m.title), vector: vectors[i] }));
    }

    this.index = usable.map((market) => ({
      market,
      entities: extractMarketEntities(market.title),
      vector: cache.get(market.id)!.vector,
    }));
    return cache;
  }

  async match(tweet: TweetInput): Promise<MatchOutcome & { market: CatalogMarket | null }> {
    const none = (stage: MatchOutcome["stage"], similarity: number | null = null) => ({
      tweetId: tweet.tweetId,
      stage,
      marketId: null,
      similarity,
      market: null,
    });

    // Stage 1: entity prefilter.
    const entities = extractEntities(tweet.text);
    const candidates = this.index.filter((i) => sharesSubject(entities, i.entities));
    if (candidates.length === 0) return none("prefilter");

    // Stage 2: embedding similarity, top-1 above the threshold.
    const [vector] = await this.cfg.embedder.embed([tweet.text]);
    let best: { item: Indexed; score: number } | null = null;
    for (const item of candidates) {
      const score = cosine(vector, item.vector);
      if (!best || score > best.score) best = { item, score };
    }
    if (!best || best.score < this.cfg.threshold) return none("similarity", best?.score ?? null);

    // Stage 3: verification. Only a clear yes passes.
    const verdict = await this.cfg.verifier.verify(tweet, best.item.market);
    if (!verdict.same) return none("verify", best.score);

    return {
      tweetId: tweet.tweetId,
      stage: "match",
      marketId: best.item.market.id,
      similarity: best.score,
      market: best.item.market,
    };
  }
}
