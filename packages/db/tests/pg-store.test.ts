import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { HashEmbedder, HeuristicVerifier, Matcher, FixturePantaClient, createService, type CatalogMarket } from "@sorot/core";
import { PgStore, type Db } from "../src/pg-store.ts";
import * as schema from "../src/schema.ts";

async function freshStore() {
  const pg = new PGlite();
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  return { store: new PgStore(db as unknown as Db), pg };
}

const market = (id: string, title: string, over: Partial<CatalogMarket> = {}): CatalogMarket => ({
  id,
  titleRaw: null,
  title,
  category: "Crypto",
  status: "open",
  yesPrice: "0.62",
  noPrice: null,
  volumeUsdc: null,
  url: "https://example.test/" + id,
  updatedAt: 1_700_000_000_000,
  ...over,
});

describe("PgStore on Postgres", () => {
  it("stores markets, keeps null prices null and a hydrated title across syncs", async () => {
    const { store } = await freshStore();
    await store.upsertMarkets([market("a", "Hydrated title"), market("b", "")]);
    const a = await store.getMarket("a");
    assert.equal(a?.yesPrice, "0.62");
    assert.equal(a?.noPrice, null);
    assert.equal(a?.updatedAt, 1_700_000_000_000);

    await store.upsertMarkets([market("a", "", { yesPrice: "0.70", status: "closed" })]);
    const again = await store.getMarket("a");
    assert.equal(again?.title, "Hydrated title");
    assert.equal(again?.yesPrice, "0.70");
    assert.equal(again?.status, "closed");
    assert.equal((await store.listMarkets()).length, 2);
    assert.equal(await store.getMarket("missing"), null);
  });

  it("round-trips embeddings per model", async () => {
    const { store } = await freshStore();
    await store.upsertMarkets([market("a", "A title")]);
    await store.saveEmbeddings("m1", new Map([["a", { titleHash: "h1", vector: [0.25, -0.5, 1] }], ["ghost", { titleHash: "x", vector: [1] }]]));
    const loaded = await store.loadEmbeddings("m1");
    assert.deepEqual([...loaded.keys()], ["a"]);
    assert.deepEqual(loaded.get("a"), { titleHash: "h1", vector: [0.25, -0.5, 1] });
    assert.equal((await store.loadEmbeddings("other")).size, 0);

    await store.saveEmbeddings("m1", new Map([["a", { titleHash: "h2", vector: [2, 2, 2] }]]));
    assert.equal((await store.loadEmbeddings("m1")).get("a")?.titleHash, "h2");
  });

  it("caches matches with a time window and rejects an unknown stage", async () => {
    const { store, pg } = await freshStore();
    await store.upsertMarkets([market("a", "A title")]);
    await store.saveMatches([
      { tweetId: "1", marketId: "a", similarity: 0.5, stage: "match", verified: true, createdAt: 2000 },
      { tweetId: "2", marketId: null, similarity: null, stage: "prefilter", verified: false, createdAt: 500 },
      { tweetId: "3", marketId: "unknown-market", similarity: 0.1, stage: "verify", verified: false, createdAt: 2000 },
    ]);
    const hits = await store.getMatches(["1", "2", "3", "4"], 1000);
    assert.deepEqual([...hits.keys()].sort(), ["1", "3"]);
    assert.equal(hits.get("1")?.marketId, "a");
    assert.equal(hits.get("3")?.marketId, null);
    await assert.rejects(() => pg.query("insert into tweet_matches (tweet_id, verified, stage) values ('x', false, 'bogus')"));
  });

  it("keeps meta values and claims", async () => {
    const { store } = await freshStore();
    assert.equal(await store.getMeta("k"), null);
    await store.setMeta("k", "1");
    await store.setMeta("k", "2");
    assert.equal(await store.getMeta("k"), "2");

    await store.recordClaim("W", "m1");
    await store.recordClaim("W", "m1");
    await store.recordClaim("W", "m2");
    assert.deepEqual([...(await store.claimedMarkets("W"))].sort(), ["m1", "m2"]);
    assert.equal((await store.claimedMarkets("other")).size, 0);
  });

  it("records trade attempts as bigint micro-USDC and follows their status", async () => {
    const { store, pg } = await freshStore();
    const quote = { quoteId: "q1", marketId: "a", side: "yes" as const, amountUsdc: "12.50", shares: "20", avgPrice: "0.62", feeUsdc: "0.12", maxSlippageBps: 100, expiresAt: 1 };
    await store.saveAttempt({ quoteId: "q1", tweetId: "1840", marketId: "a", wallet: "W", side: "yes", amountUsdc: "12.50", quote, signature: null, status: "quoted", createdAt: 5 });
    await store.saveAttempt({ quoteId: "q1", tweetId: null, marketId: "a", wallet: "W", side: "yes", amountUsdc: "99.00", quote, signature: null, status: "quoted", createdAt: 6 });
    await store.updateAttempt("q1", { status: "sent", signature: "sig1" });
    await store.updateAttemptBySignature("sig1", "confirmed");

    const rows = (await pg.query<{ amount: string; status: string; signature: string; quote: { quoteId: string } }>("select amount::text, status, signature, quote from trade_attempts")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, "12500000");
    assert.equal(rows[0].status, "confirmed");
    assert.equal(rows[0].signature, "sig1");
    assert.equal(rows[0].quote.quoteId, "q1");
    await assert.rejects(() => pg.query("update trade_attempts set status = 'weird'"));
  });
});

describe("service on Postgres", () => {
  it("matches, caches in the database, and survives a new service instance", async () => {
    const { store } = await freshStore();
    const build = () => {
      const embedder = new HashEmbedder();
      const matcher = new Matcher({ embedder, verifier: new HeuristicVerifier(), threshold: 0.2 });
      return createService({ panta: new FixturePantaClient(), store, matcher, embedderId: embedder.id });
    };

    const tweets = [
      { tweetId: "1", text: "SOL is going to rip past 300 before Halloween", lang: "en" },
      { tweetId: "2", text: "gm, coffee first", lang: "en" },
    ];
    const first = await build().matchTweets(tweets);
    assert.equal(first[0].match?.marketId, "demo-sol-300");
    assert.equal(first[1].match, null);

    // A cold instance reads the catalog, embeddings and matches back from Postgres.
    const second = build();
    const again = await second.matchTweets(tweets);
    assert.equal(again[0].match?.marketId, "demo-sol-300");
    const health = await second.health();
    assert.equal(health.markets, 3);
    assert.ok(health.indexed >= 1);
    assert.equal((await store.loadEmbeddings("hash-v1")).size, 2);
  });
});
