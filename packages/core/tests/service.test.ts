import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HashEmbedder } from "../src/match/embedding.ts";
import { Matcher } from "../src/match/pipeline.ts";
import { HeuristicVerifier, type Verifier } from "../src/match/verify.ts";
import { FixturePantaClient } from "../src/panta/fixture-client.ts";
import { createService } from "../src/service.ts";
import { MemoryStore } from "../src/store.ts";

function setup(opts: { sim?: string; verifier?: Verifier } = {}) {
  let verifierCalls = 0;
  const base = opts.verifier ?? new HeuristicVerifier();
  const verifier: Verifier = { id: base.id, verify: async (t, m) => (verifierCalls++, base.verify(t, m)) };
  const embedder = new HashEmbedder();
  const panta = new FixturePantaClient({ sim: () => opts.sim ?? null });
  const store = new MemoryStore();
  const matcher = new Matcher({ embedder, verifier, threshold: 0.2 });
  const service = createService({ panta, store, matcher, embedderId: embedder.id });
  return { service, store, calls: () => verifierCalls };
}

const tweet = (id: string, text: string) => ({ tweetId: id, text, lang: "en" });
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

describe("service: matching", () => {
  it("returns labeled demo matches, null prices for ETH, and nothing for resolved or unrelated tweets", async () => {
    const { service } = setup();
    const out = await service.matchTweets([
      tweet("1", "SOL is going to rip past 300 before Halloween"),
      tweet("2", "gm, coffee first"),
      tweet("3", "ETH to 5k by year end"),
      tweet("4", "BTC will print 100k soon"),
    ]);
    assert.equal(out[0].match?.marketId, "demo-sol-300");
    assert.equal(out[0].match?.demo, true);
    assert.equal(out[0].match?.yesPrice, "0.62");
    assert.equal(out[1].match, null);
    assert.equal(out[2].match?.marketId, "demo-eth-5k");
    assert.equal(out[2].match?.yesPrice, null);
    assert.equal(out[3].match, null);
  });

  it("caches per tweet, so the same tweet is never verified twice", async () => {
    const { service, calls } = setup();
    const t = [tweet("1", "SOL is going to rip past 300 before Halloween")];
    await service.matchTweets(t);
    const first = calls();
    assert.ok(first >= 1);
    const again = await service.matchTweets(t);
    assert.equal(calls(), first);
    assert.equal(again[0].match?.marketId, "demo-sol-300");
  });

  it("treats a failing verifier as no match and does not cache the failure", async () => {
    let fail = true;
    const flaky: Verifier = { id: "flaky", verify: async () => { if (fail) throw new Error("llm down"); return { same: true }; } };
    const { service } = setup({ verifier: flaky });
    const t = [tweet("1", "SOL is going to rip past 300 before Halloween")];
    assert.equal((await service.matchTweets(t))[0].match, null);
    fail = false;
    assert.equal((await service.matchTweets(t))[0].match?.marketId, "demo-sol-300");
  });

  it("de-duplicates tweet ids inside one request", async () => {
    const { service } = setup();
    const out = await service.matchTweets([tweet("1", "SOL 300"), tweet("1", "SOL 300")]);
    assert.equal(out.length, 1);
  });

  it("reports health with the data source", async () => {
    const { service } = setup();
    await service.ensureCatalog();
    const h = await service.health();
    assert.equal(h.source, "fixture");
    assert.equal(h.markets, 3);
    assert.equal(h.indexed, 2);
  });
});

describe("service: fresh prices", () => {
  const flaky = (answers: (string | null)[]) => {
    let calls = 0;
    const base = new FixturePantaClient();
    const panta = Object.assign(Object.create(base), {
      source: "live" as const,
      listMarkets: async () => (await base.listMarkets()).map((m) => ({ ...m, yesPrice: "0.40", noPrice: "0.60" })),
      getMarket: async (id: string) => {
        const m = await base.getMarket(id);
        const p = answers[Math.min(calls++, answers.length - 1)];
        return { ...m, yesPrice: p, noPrice: p === null ? null : "0.30" };
      },
    });
    return { panta, calls: () => calls };
  };

  function build(answers: (string | null)[]) {
    const { panta, calls } = flaky(answers);
    const embedder = new HashEmbedder();
    const matcher = new Matcher({ embedder, verifier: new HeuristicVerifier(), threshold: 0.2 });
    const service = createService({ panta, store: new MemoryStore(), matcher, embedderId: embedder.id, sleep: async () => {} });
    return { service, calls };
  }
  const t = [{ tweetId: "1", text: "SOL is going to rip past 300 before Halloween", lang: "en" }];

  it("retries when Panta has no price yet and uses the first real one", async () => {
    const { service, calls } = build([null, null, "0.70"]);
    const out = await service.matchTweets(t);
    assert.equal(out[0].match?.yesPrice, "0.70");
    assert.equal(out[0].match?.noPrice, "0.30");
    assert.equal(calls(), 3);
  });

  it("falls back to the last synced price, and never to a made-up number", async () => {
    const { service } = build([null]);
    const out = await service.matchTweets(t);
    assert.equal(out[0].match?.yesPrice, "0.40");
  });

  it("keeps a missing price null when there is nothing to fall back to", async () => {
    const { panta } = flaky([null]);
    const noSync = Object.assign(Object.create(panta), {
      listMarkets: async () => (await new FixturePantaClient().listMarkets()).map((m) => ({ ...m, yesPrice: null, noPrice: null })),
    });
    const embedder = new HashEmbedder();
    const matcher = new Matcher({ embedder, verifier: new HeuristicVerifier(), threshold: 0.2 });
    const service = createService({ panta: noSync, store: new MemoryStore(), matcher, embedderId: embedder.id, sleep: async () => {} });
    const out = await service.matchTweets(t);
    assert.equal(out[0].match?.yesPrice, null);
    assert.equal(out[0].match?.noPrice, null);
  });

  it("remembers a price for a short time instead of asking Panta again", async () => {
    const { service, calls } = build(["0.55"]);
    await service.matchTweets(t);
    const first = calls();
    await service.matchTweets([{ ...t[0], tweetId: "2" }]);
    assert.equal(calls(), first);
  });
});

describe("service: featured market", () => {
  it("picks an open market that has a price", async () => {
    const { service } = setup();
    const m = await service.featuredMarket();
    assert.equal(m?.id, "demo-sol-300");
  });
});

describe("service: trading", () => {
  it("runs quote, build, submit and verify", async () => {
    const { service } = setup();
    const quote = await service.quote({ marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: WALLET, tweetId: "1" });
    assert.equal(quote.amountUsdc, "5.00");
    assert.equal(quote.avgPrice, "0.62");
    const built = await service.build({ quoteId: quote.quoteId, maxSlippageBps: 100, wallet: WALLET });
    assert.equal(built.quoteId, quote.quoteId);
    await service.submit({ signature: "demo-abc12345", wallet: WALLET, marketId: "demo-sol-300", quoteId: quote.quoteId });
    assert.equal(await service.verify("demo-abc12345"), "confirmed");
  });

  it("refuses bad amounts and closed markets", async () => {
    const { service } = setup();
    await assert.rejects(() => service.quote({ marketId: "demo-sol-300", side: "yes", amountUsdc: "0", wallet: WALLET }), { code: "INVALID_PARAMS" });
    await assert.rejects(() => service.quote({ marketId: "demo-sol-300", side: "yes", amountUsdc: "1e3", wallet: WALLET }), { code: "INVALID_PARAMS" });
    await assert.rejects(() => service.quote({ marketId: "demo-btc-100k", side: "yes", amountUsdc: "5", wallet: WALLET }), { code: "MARKET_CLOSED" });
    await assert.rejects(() => service.quote({ marketId: "nope", side: "yes", amountUsdc: "5", wallet: WALLET }), { code: "NOT_FOUND" });
  });

  it("rejects an expired quote at build time", async () => {
    const { service } = setup();
    await assert.rejects(() => service.build({ quoteId: "demo-q-1-abc", maxSlippageBps: 100, wallet: WALLET }), { code: "QUOTE_EXPIRED" });
  });

  it("honors failure simulation for development", async () => {
    await assert.rejects(() => setup({ sim: "rate-limit" }).service.quote({ marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: WALLET }), { code: "RATE_LIMITED" });
    const slip = setup({ sim: "slippage" }).service;
    const q = await slip.quote({ marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: WALLET });
    await assert.rejects(() => slip.build({ quoteId: q.quoteId, maxSlippageBps: 100, wallet: WALLET }), { code: "SLIPPAGE" });
    assert.equal(await setup({ sim: "tx-failed" }).service.verify("demo-x"), "failed");
  });

  it("remembers a demo claim so positions update", async () => {
    const { service } = setup();
    const before = await service.positions(WALLET);
    assert.equal(before.filter((p) => p.claimable).length, 2);
    const built = await service.claimBuild({ wallet: WALLET, marketId: "demo-btc-100k" });
    assert.equal(built.quoteId, "claim:demo-btc-100k");
    await service.submit({ signature: "demo-claim123", wallet: WALLET, marketId: "demo-btc-100k", quoteId: built.quoteId });
    const after = await service.positions(WALLET);
    const claimed = after.find((p) => p.marketId === "demo-btc-100k");
    assert.equal(claimed?.status, "claimed");
    assert.equal(claimed?.claimable, false);
    assert.equal(after.filter((p) => p.claimable).length, 1);
  });

  it("refuses to claim something that is not claimable", async () => {
    const { service } = setup();
    await assert.rejects(() => service.claimBuild({ wallet: WALLET, marketId: "demo-fed-cut" }), { code: "NOT_CLAIMABLE" });
  });
});

describe("error recognition", () => {
  it("recognizes a SorotError by its shape, even from a second copy of the class", async () => {
    const { isSorotError, SorotError } = await import("../src/types.ts");
    class SorotError2 extends Error {
      code = "NOT_FOUND";
      constructor(message: string) {
        super(message);
        this.name = "SorotError";
      }
    }
    assert.equal(isSorotError(new SorotError("NOT_FOUND")), true);
    assert.equal(isSorotError(new SorotError2("copy")), true);
    assert.equal(new SorotError2("copy") instanceof SorotError, false);
    assert.equal(isSorotError(new Error("plain")), false);
    assert.equal(isSorotError(null), false);
    assert.equal(isSorotError({ name: "SorotError" }), false);
  });
});
