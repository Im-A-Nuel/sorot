import { toMicro, type AttemptStatus, type CatalogMarket, type EmbeddingCache, type Store, type StoredMatch, type TradeAttempt } from "@sorot/core";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";

/** Any Drizzle Postgres database: Neon over HTTP in production, PGlite in tests. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const CHUNK = 200;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export class PgStore implements Store {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async upsertMarkets(markets: CatalogMarket[]): Promise<void> {
    for (const part of chunks(markets)) {
      if (part.length === 0) continue;
      await this.db
        .insert(schema.markets)
        .values(
          part.map((m) => ({
            id: m.id,
            titleRaw: m.titleRaw,
            title: m.title,
            category: m.category,
            status: m.status,
            yesPrice: m.yesPrice,
            noPrice: m.noPrice,
            volumeUsdc: m.volumeUsdc,
            url: m.url,
            updatedAt: new Date(m.updatedAt),
          })),
        )
        .onConflictDoUpdate({
          target: schema.markets.id,
          set: {
            titleRaw: sql`excluded.title_raw`,
            // A hydrated title survives a later sync that returns an empty one.
            title: sql`case when excluded.title = '' then ${schema.markets.title} else excluded.title end`,
            category: sql`excluded.category`,
            status: sql`excluded.status`,
            yesPrice: sql`excluded.yes_price`,
            noPrice: sql`excluded.no_price`,
            volumeUsdc: sql`excluded.volume_usdc`,
            url: sql`excluded.url`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }
  }

  private toMarket(r: typeof schema.markets.$inferSelect): CatalogMarket {
    return {
      id: r.id,
      titleRaw: r.titleRaw,
      title: r.title,
      category: r.category,
      status: r.status as CatalogMarket["status"],
      yesPrice: r.yesPrice,
      noPrice: r.noPrice,
      volumeUsdc: r.volumeUsdc,
      url: r.url,
      updatedAt: r.updatedAt.getTime(),
    };
  }

  async listMarkets(): Promise<CatalogMarket[]> {
    return (await this.db.select().from(schema.markets)).map((r) => this.toMarket(r));
  }

  async getMarket(id: string): Promise<CatalogMarket | null> {
    const rows = await this.db.select().from(schema.markets).where(eq(schema.markets.id, id)).limit(1);
    return rows[0] ? this.toMarket(rows[0]) : null;
  }

  async loadEmbeddings(model: string): Promise<EmbeddingCache> {
    const rows = await this.db.select().from(schema.marketEmbeddings).where(eq(schema.marketEmbeddings.model, model));
    return new Map(rows.map((r) => [r.marketId, { titleHash: r.titleHash, vector: r.vector }]));
  }

  async saveEmbeddings(model: string, cache: EmbeddingCache): Promise<void> {
    // Only markets that exist can have a vector, because of the foreign key.
    const known = new Set((await this.db.select({ id: schema.markets.id }).from(schema.markets)).map((r) => r.id));
    const rows = [...cache.entries()]
      .filter(([marketId]) => known.has(marketId))
      .map(([marketId, v]) => ({ marketId, model, vector: v.vector, titleHash: v.titleHash }));
    for (const part of chunks(rows, 50)) {
      if (part.length === 0) continue;
      await this.db
        .insert(schema.marketEmbeddings)
        .values(part)
        .onConflictDoUpdate({
          target: [schema.marketEmbeddings.marketId, schema.marketEmbeddings.model],
          set: { vector: sql`excluded.vector`, titleHash: sql`excluded.title_hash` },
        });
    }
  }

  async getMatches(tweetIds: string[], since: number): Promise<Map<string, StoredMatch>> {
    const out = new Map<string, StoredMatch>();
    for (const part of chunks(tweetIds)) {
      if (part.length === 0) continue;
      const rows = await this.db
        .select()
        .from(schema.tweetMatches)
        .where(and(inArray(schema.tweetMatches.tweetId, part), gte(schema.tweetMatches.createdAt, new Date(since))));
      for (const r of rows) {
        out.set(r.tweetId, {
          tweetId: r.tweetId,
          marketId: r.marketId,
          similarity: r.similarity,
          stage: r.stage as StoredMatch["stage"],
          verified: r.verified,
          createdAt: r.createdAt.getTime(),
        });
      }
    }
    return out;
  }

  async saveMatches(matches: StoredMatch[]): Promise<void> {
    const known = new Set((await this.db.select({ id: schema.markets.id }).from(schema.markets)).map((r) => r.id));
    for (const part of chunks(matches)) {
      if (part.length === 0) continue;
      await this.db
        .insert(schema.tweetMatches)
        .values(
          part.map((m) => ({
            tweetId: m.tweetId,
            marketId: m.marketId && known.has(m.marketId) ? m.marketId : null,
            similarity: m.similarity,
            verified: m.verified,
            stage: m.stage,
            createdAt: new Date(m.createdAt),
          })),
        )
        .onConflictDoUpdate({
          target: schema.tweetMatches.tweetId,
          set: {
            marketId: sql`excluded.market_id`,
            similarity: sql`excluded.similarity`,
            verified: sql`excluded.verified`,
            stage: sql`excluded.stage`,
            createdAt: sql`excluded.created_at`,
          },
        });
    }
  }

  async getMeta(key: string): Promise<string | null> {
    const rows = await this.db.select().from(schema.meta).where(eq(schema.meta.key, key)).limit(1);
    return rows[0]?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.db
      .insert(schema.meta)
      .values({ key, value })
      .onConflictDoUpdate({ target: schema.meta.key, set: { value } });
  }

  async saveAttempt(a: TradeAttempt): Promise<void> {
    const micro = toMicro(a.amountUsdc);
    if (micro === null) return;
    await this.db
      .insert(schema.tradeAttempts)
      .values({
        quoteId: a.quoteId,
        tweetId: a.tweetId,
        marketId: a.marketId,
        wallet: a.wallet,
        side: a.side,
        amountMicro: micro,
        quote: a.quote,
        signature: a.signature,
        status: a.status,
        createdAt: new Date(a.createdAt),
      })
      .onConflictDoNothing({ target: schema.tradeAttempts.quoteId });
  }

  async updateAttempt(quoteId: string, patch: Partial<Pick<TradeAttempt, "status" | "signature">>): Promise<void> {
    if (!patch.status && !patch.signature) return;
    await this.db
      .update(schema.tradeAttempts)
      .set({
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.signature ? { signature: patch.signature } : {}),
      })
      .where(eq(schema.tradeAttempts.quoteId, quoteId));
  }

  async updateAttemptBySignature(signature: string, status: AttemptStatus): Promise<void> {
    await this.db.update(schema.tradeAttempts).set({ status }).where(eq(schema.tradeAttempts.signature, signature));
  }

  async recordClaim(wallet: string, marketId: string): Promise<void> {
    await this.db.insert(schema.claims).values({ wallet, marketId }).onConflictDoNothing();
  }

  async claimedMarkets(wallet: string): Promise<Set<string>> {
    const rows = await this.db.select().from(schema.claims).where(eq(schema.claims.wallet, wallet));
    return new Set(rows.map((r) => r.marketId));
  }
}
