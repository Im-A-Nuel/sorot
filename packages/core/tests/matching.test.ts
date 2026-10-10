import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractEntities, extractMarketEntities, normalizeText, sharesSubject } from "../src/match/entities.ts";
import { HashEmbedder, cosine } from "../src/match/embedding.ts";
import { Matcher } from "../src/match/pipeline.ts";
import { HeuristicVerifier, type Verifier } from "../src/match/verify.ts";
import type { CatalogMarket } from "../src/types.ts";

const market = (id: string, title: string, status: CatalogMarket["status"] = "open"): CatalogMarket => ({
  id,
  titleRaw: null,
  title,
  category: null,
  status,
  yesPrice: "0.5",
  noPrice: "0.5",
  volumeUsdc: null,
  url: "https://example.test",
  updatedAt: 0,
});

const catalog: CatalogMarket[] = [
  market("sol-300", "Will SOL close above $300 on Oct 31?"),
  market("eth-5k", "Will ETH close above $5,000 on Dec 31?"),
  market("btc-100k", "Will BTC close above $100,000 on Sep 30?", "resolved"),
  market("fed-cut", "Will the Fed cut rates at the September meeting?"),
  market("titleless", ""),
];

const THRESHOLD = 0.2;

async function matcher(verifier: Verifier = new HeuristicVerifier()) {
  const m = new Matcher({ embedder: new HashEmbedder(), verifier, threshold: THRESHOLD });
  await m.indexCatalog(catalog);
  return m;
}

const tw = (text: string, id = "1") => ({ tweetId: id, text, lang: "en" });

describe("entity extraction", () => {
  it("normalizes text", () => {
    assert.equal(normalizeText("Check https://t.co/x @bob #SOL 🚀 now"), "check sol now");
  });

  it("finds tickers through aliases and normalizes price levels", () => {
    const e = extractEntities("Solana to $300, ethereum to 5k, bitcoin 100,000");
    assert.deepEqual([...e.assets].sort(), ["btc", "eth", "sol"]);
    assert.deepEqual([...e.numbers].sort(), ["100000", "300", "5000"]);
  });

  it("does not read a calendar date as a price level", () => {
    assert.equal(extractEntities("Will SOL close above $300 on Oct 31?").numbers.has("31"), false);
    assert.deepEqual([...extractEntities("by December 31, 2026").numbers], []);
    assert.equal(extractEntities("SOL hits $31").numbers.has("31"), true);
  });

  it("does not read a bare year as a price level", () => {
    assert.equal(extractEntities("SOL in 2026").numbers.has("2026"), false);
    assert.equal(extractEntities("SOL at $2026").numbers.has("2026"), true);
  });

  it("finds proper nouns in market titles", () => {
    const m = extractMarketEntities("Will the Fed cut rates at the September meeting?");
    assert.ok(m.names.has("fed"));
    assert.equal(m.names.has("september"), true);
  });

  it("requires subject and price level to overlap", () => {
    const sol = extractMarketEntities("Will SOL close above $300 on Oct 31?");
    assert.equal(sharesSubject(extractEntities("sol to 300"), sol), true);
    assert.equal(sharesSubject(extractEntities("sol is great"), sol), false);
    assert.equal(sharesSubject(extractEntities("300 people came"), sol), false);
    assert.equal(sharesSubject(extractEntities("sol to 250"), sol), false);

    const fed = extractMarketEntities("Will the Fed cut rates at the September meeting?");
    assert.equal(sharesSubject(extractEntities("Fed up with this traffic"), fed), false);
    assert.equal(sharesSubject(extractEntities("The Fed will cut rates, mark my words"), fed), true);
  });
});

describe("hash embedder", () => {
  it("is deterministic and ranks the related title higher", async () => {
    const e = new HashEmbedder();
    const [a, b, c] = await e.embed([
      "SOL is going to rip past 300",
      "Will SOL close above $300 on Oct 31?",
      "Will the Fed cut rates at the September meeting?",
    ]);
    assert.ok(cosine(a, b) > cosine(a, c));
    assert.deepEqual((await e.embed(["same"]))[0], (await e.embed(["same"]))[0]);
  });
});

describe("matcher pipeline", () => {
  it("matches a clear tweet at the final stage", async () => {
    const m = await matcher();
    const out = await m.match(tw("SOL is going to rip past 300 before Halloween"));
    assert.equal(out.stage, "match");
    assert.equal(out.marketId, "sol-300");
  });

  it("stops at the prefilter when there is no shared subject", async () => {
    const m = await matcher();
    assert.equal((await m.match(tw("gm, coffee first"))).stage, "prefilter");
    assert.equal((await m.match(tw("SOL is having a great week"))).stage, "prefilter");
  });

  it("never matches a resolved or title-less market", async () => {
    const m = await matcher();
    assert.equal(m.size, 3);
    const out = await m.match(tw("BTC will print 100k soon"));
    assert.equal(out.marketId, null);
  });

  it("stops at the similarity stage below the threshold", async () => {
    const strict = new Matcher({ embedder: new HashEmbedder(), verifier: new HeuristicVerifier(), threshold: 0.99 });
    await strict.indexCatalog(catalog);
    const out = await strict.match(tw("SOL is going to rip past 300 before Halloween"));
    assert.equal(out.stage, "similarity");
    assert.equal(out.marketId, null);
  });

  it("stops at verification unless the verifier says yes", async () => {
    const no: Verifier = { id: "no", verify: async () => ({ same: false }) };
    const out = await (await matcher(no)).match(tw("SOL is going to rip past 300 before Halloween"));
    assert.equal(out.stage, "verify");
    assert.equal(out.marketId, null);
  });

  it("reuses cached vectors when titles did not change", async () => {
    let calls = 0;
    const counting = new HashEmbedder();
    const embedder = { id: "c", kind: "hash" as const, embed: async (t: string[]) => (calls += t.length, counting.embed(t)) };
    const m = new Matcher({ embedder, verifier: new HeuristicVerifier(), threshold: THRESHOLD });
    const cache = await m.indexCatalog(catalog);
    const first = calls;
    await m.indexCatalog(catalog, cache);
    assert.equal(calls, first);
    await m.indexCatalog([...catalog, market("new", "Will SOL close above $400 on Nov 30?")], cache);
    assert.equal(calls, first + 1);
  });
});

describe("precision on a synthetic labeled set", () => {
  // Synthetic tweets for regression only. The submission number comes from real tweets in eval/tweets.jsonl.
  const labeled: [string, string | null][] = [
    ["SOL is going to rip past 300 before Halloween", "sol-300"],
    ["solana 300 by end of october, calling it", "sol-300"],
    ["I think $SOL tops $300 this month", "sol-300"],
    ["ETH to 5k by year end", "eth-5k"],
    ["ethereum at $5,000 before Christmas?", "eth-5k"],
    ["The Fed will cut rates in September, mark my words", "fed-cut"],
    ["gm, coffee first", null],
    ["SOL is such a fun chain to build on", null],
    ["SOL fees are tiny", null],
    ["my 300 followers are the best", null],
    ["BTC will print 100k soon", null],
    ["ETH merge anniversary today", null],
    ["Just had the best tacos of my life", null],
    ["Fed up with this traffic", null],
    ["The 5k run on Saturday was brutal", null],
    ["solana 250 is the next stop", null],
  ];

  it("reaches at least 80% precision and keeps recall useful", async () => {
    const m = await matcher();
    let shown = 0;
    let correct = 0;
    let expected = 0;
    for (const [i, [text, want]] of labeled.entries()) {
      const out = await m.match(tw(text, String(i + 1)));
      if (want) expected++;
      if (out.marketId) {
        shown++;
        if (out.marketId === want) correct++;
      }
    }
    const precision = correct / shown;
    const recall = correct / expected;
    console.log(`INFO synthetic precision ${(precision * 100).toFixed(0)}% recall ${(recall * 100).toFixed(0)}% (${correct}/${shown} shown, ${expected} expected)`);
    assert.ok(precision >= 0.9, `precision ${precision}`);
    assert.ok(recall >= 0.5, `recall ${recall}`);
  });
});
