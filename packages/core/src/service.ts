import { syncCatalog, type SyncStats } from "./catalog.ts";
import { checkAmount, toMicro } from "./money.ts";
import { Matcher } from "./match/pipeline.ts";
import type { PantaClient } from "./panta/client.ts";
import type { Store, StoredMatch } from "./store.ts";
import {
  SorotError,
  type ApiMatch,
  type BuiltTransaction,
  type CatalogMarket,
  type Position,
  type Quote,
  type QuoteRequest,
  type RecentTrade,
  type TradeStatus,
  type TweetInput,
} from "./types.ts";

export type ServiceDeps = {
  panta: PantaClient;
  store: Store;
  matcher: Matcher;
  /** Id of the embedding model. Cached vectors are stored per model. */
  embedderId: string;
  catalogTtlMs?: number;
  matchTtlMs?: number;
  now?: () => number;
  /** Pause between price retries. Replaced in tests. */
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string, extra?: unknown) => void;
};

export type MatchResultItem = { tweetId: string; match: ApiMatch | null };

const MATCH_CONCURRENCY = 5;

export function createService(deps: ServiceDeps) {
  const { panta, store, matcher } = deps;
  const now = deps.now ?? Date.now;
  const catalogTtl = deps.catalogTtlMs ?? 5 * 60_000;
  const matchTtl = deps.matchTtlMs ?? 24 * 60 * 60_000;
  const log = deps.log ?? (() => {});
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const demo = panta.source !== "live" ? true : undefined;

  let ready: Promise<void> | null = null;
  let lastIndexedAt = 0;

  async function indexFromStore(): Promise<void> {
    const markets = await store.listMarkets();
    const cache = await store.loadEmbeddings(deps.embedderId);
    const before = cache.size;
    const next = await matcher.indexCatalog(markets, cache);
    if (next.size !== before || markets.length > 0) await store.saveEmbeddings(deps.embedderId, next);
    lastIndexedAt = now();
  }

  /** Syncs the catalog when it is older than the TTL, otherwise just makes sure the matcher has an index. One run at a time. */
  async function ensureCatalog(force = false): Promise<SyncStats | null> {
    if (ready && !force) {
      await ready;
      return null;
    }
    let stats: SyncStats | null = null;
    const run = (async () => {
      const synced = Number(await store.getMeta("catalog_synced_at")) || 0;
      if (force || now() - synced > catalogTtl) {
        stats = await syncCatalog(panta, store, now);
        await indexFromStore();
      } else if (matcher.size === 0 || now() - lastIndexedAt > catalogTtl) {
        await indexFromStore();
      }
    })();
    ready = run
      .catch((e) => {
        // A failed sync is retried by the next call instead of being remembered.
        ready = null;
        throw e;
      })
      .finally(() => {
        // Let the next call after the TTL run again.
        setTimeout(() => {
          ready = null;
        }, Math.min(catalogTtl, 30_000)).unref?.();
      });
    await ready;
    return stats;
  }

  /**
   * Panta fills prices in from on-chain state "when RPC is available", so the same call can return a price and then null.
   * Ask the detail endpoint a few times, remember the answer for 20 seconds, and fall back to the last synced price.
   * A price that is still missing stays null, and the chip says "see odds".
   */
  const priceCache = new Map<string, { at: number; yes: string | null; no: string | null }>();
  const PRICE_TTL_MS = 20_000;
  const PRICE_TRIES = 3;

  async function freshPrices(m: CatalogMarket): Promise<{ yes: string | null; no: string | null }> {
    const hit = priceCache.get(m.id);
    if (hit && now() - hit.at < PRICE_TTL_MS) return hit;

    let yes = m.yesPrice;
    let no = m.noPrice;
    for (let i = 0; i < PRICE_TRIES; i++) {
      try {
        const detail = await panta.getMarket(m.id);
        if (detail.yesPrice !== null && detail.noPrice !== null) {
          yes = detail.yesPrice;
          no = detail.noPrice;
          break;
        }
      } catch (e) {
        log("price refresh failed", e);
      }
      if (i < PRICE_TRIES - 1) await sleep(150);
    }
    const out = { at: now(), yes, no };
    priceCache.set(m.id, out);
    return out;
  }

  function toApi(m: CatalogMarket, prices: { yes: string | null; no: string | null }): ApiMatch {
    return { marketId: m.id, title: m.title, yesPrice: prices.yes, noPrice: prices.no, url: m.url, demo };
  }

  async function runLimited<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
    const out: R[] = new Array(items.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(MATCH_CONCURRENCY, items.length) }, async () => {
        for (;;) {
          const i = next++;
          if (i >= items.length) return;
          out[i] = await fn(items[i]);
        }
      }),
    );
    return out;
  }

  return {
    ensureCatalog,

    /** Matches tweets to at most one market each. Results are cached per tweet for 24 hours, including "no match". */
    async matchTweets(tweets: TweetInput[]): Promise<MatchResultItem[]> {
      await ensureCatalog();
      const ids = [...new Set(tweets.map((t) => t.tweetId))];
      const cached = await store.getMatches(ids, now() - matchTtl);
      const fresh: StoredMatch[] = [];

      const misses = tweets.filter((t, i) => !cached.has(t.tweetId) && tweets.findIndex((x) => x.tweetId === t.tweetId) === i);
      const outcomes = await runLimited(misses, async (tweet) => {
        try {
          return await matcher.match(tweet);
        } catch (e) {
          // A failed embedding or verification is a no, never a guess. It is not cached, so it can be retried.
          log("match failed", e);
          return null;
        }
      });
      outcomes.forEach((o) => {
        if (o) {
          fresh.push({
            tweetId: o.tweetId,
            marketId: o.marketId,
            similarity: o.similarity,
            stage: o.stage,
            verified: o.stage === "match",
            createdAt: now(),
          });
        }
      });
      if (fresh.length > 0) await store.saveMatches(fresh);

      const byTweet = new Map<string, StoredMatch>(cached);
      fresh.forEach((m) => byTweet.set(m.tweetId, m));

      const markets = new Map((await store.listMarkets()).map((m) => [m.id, m]));
      // A market that is no longer open never gets a chip.
      const shown = new Map<string, CatalogMarket>();
      for (const tweetId of ids) {
        const stored = byTweet.get(tweetId);
        const market = stored?.marketId ? markets.get(stored.marketId) : undefined;
        if (market && market.status === "open" && market.title) shown.set(market.id, market);
      }
      const prices = new Map<string, { yes: string | null; no: string | null }>();
      await Promise.all([...shown.values()].map(async (m) => prices.set(m.id, await freshPrices(m))));

      return ids.map((tweetId) => {
        const marketId = byTweet.get(tweetId)?.marketId;
        const market = marketId ? shown.get(marketId) : undefined;
        return { tweetId, match: market ? toApi(market, prices.get(market.id)!) : null };
      });
    },

    /** An open market to send people to from the landing page. Prefers one with a price, then the most volume. */
    async featuredMarket(): Promise<CatalogMarket | null> {
      await ensureCatalog();
      const open = (await store.listMarkets()).filter((m) => m.status === "open" && m.title.trim() !== "");
      const volume = (m: CatalogMarket) => toMicro(m.volumeUsdc) ?? BigInt(0);
      open.sort((a, b) => {
        const priced = Number(b.yesPrice !== null) - Number(a.yesPrice !== null);
        if (priced !== 0) return priced;
        const v = volume(b) - volume(a);
        return v > BigInt(0) ? 1 : v < BigInt(0) ? -1 : a.title.localeCompare(b.title);
      });
      return open[0] ?? null;
    },

    async getMarket(id: string): Promise<CatalogMarket> {
      const market = await panta.getMarket(id);
      if (market.title.trim() === "") {
        const stored = await store.getMarket(id);
        if (stored?.title) return { ...market, title: stored.title };
      }
      return market;
    },

    recentTrades(marketId: string): Promise<RecentTrade[]> {
      return panta.recentTrades(marketId);
    },

    async quote(req: QuoteRequest): Promise<Quote> {
      const amount = checkAmount(req.amountUsdc);
      if (!amount.ok) throw new SorotError("INVALID_PARAMS", "Amount is not valid.");
      const market = await panta.getMarket(req.marketId);
      if (market.status !== "open") throw new SorotError("MARKET_CLOSED", "This market is not open.");

      const quote = await panta.quote({ ...req, amountUsdc: amount.value });
      await store.saveAttempt({
        quoteId: quote.quoteId,
        tweetId: req.tweetId ?? null,
        marketId: req.marketId,
        wallet: req.wallet,
        side: req.side,
        amountUsdc: amount.value,
        quote,
        signature: null,
        status: "quoted",
        createdAt: now(),
      });
      return quote;
    },

    async build(req: { quoteId: string; maxSlippageBps: number; wallet: string }): Promise<BuiltTransaction> {
      const built = await panta.build(req);
      await store.updateAttempt(req.quoteId, { status: "built" });
      return built;
    },

    async submit(req: { signature: string; wallet: string; marketId: string; quoteId?: string }): Promise<void> {
      await panta.submit(req);
      if (req.quoteId) await store.updateAttempt(req.quoteId, { status: "sent", signature: req.signature });
      if (req.quoteId?.startsWith("claim:")) await store.recordClaim(req.wallet, req.marketId);
      try {
        // Attribution report. Panta verifies it on-chain and repeating it for the same signature is safe.
        await panta.reportTrade(req);
      } catch (e) {
        log("trade report failed", e);
      }
    },

    async verify(signature: string): Promise<TradeStatus> {
      const status = await panta.verify(signature);
      if (status === "confirmed") await store.updateAttemptBySignature(signature, "confirmed");
      if (status === "failed") await store.updateAttemptBySignature(signature, "failed");
      return status;
    },

    async positions(wallet: string): Promise<Position[]> {
      const [positions, markets, claimed] = await Promise.all([
        panta.positions(wallet),
        store.listMarkets(),
        store.claimedMarkets(wallet),
      ]);
      const titles = new Map(markets.map((m) => [m.id, m.title]));
      return positions.map((p) => {
        const title = p.marketTitle === "Untitled market" ? (titles.get(p.marketId) ?? p.marketTitle) : p.marketTitle;
        // Demo claims are remembered here. Live claims are reflected by Panta itself.
        return panta.source !== "live" && claimed.has(p.marketId)
          ? { ...p, marketTitle: title, status: "claimed" as const, claimable: false }
          : { ...p, marketTitle: title };
      });
    },

    claimBuild(req: { wallet: string; marketId: string }): Promise<BuiltTransaction> {
      return panta.claimBuild(req);
    },

    async health() {
      const markets = await store.listMarkets();
      return {
        source: panta.source,
        markets: markets.length,
        open: markets.filter((m) => m.status === "open").length,
        indexed: matcher.size,
        catalogSyncedAt: Number(await store.getMeta("catalog_synced_at")) || null,
      };
    },
  };
}

export type SorotService = ReturnType<typeof createService>;
