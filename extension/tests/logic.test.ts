import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCache, type KeyValueStore } from "../src/background/cache.ts";
import { demoMatch, normalize } from "../src/background/demo-matcher.ts";
import { sanitizeResults } from "../src/background/sanitize.ts";
import { parseMessage } from "../src/shared/validate.ts";

function memoryStore(): KeyValueStore & { data: Record<string, unknown> } {
  const data: Record<string, unknown> = {};
  return {
    data,
    async get(keys) {
      if (keys === null) return { ...data };
      return Object.fromEntries(keys.filter((k) => k in data).map((k) => [k, data[k]]));
    },
    async set(items) {
      Object.assign(data, items);
    },
    async remove(keys) {
      for (const k of keys) delete data[k];
    },
  };
}

describe("demo matcher", () => {
  const tweet = (text: string) => ({ tweetId: "1", text, lang: "en" });

  it("needs both the asset and the price level", () => {
    assert.equal(demoMatch(tweet("SOL is going to rip past 300 before Halloween")).match?.marketId, "demo-sol-300");
    assert.equal(demoMatch(tweet("SOL is having a great week")).match, null);
    assert.equal(demoMatch(tweet("300 people showed up")).match, null);
  });

  it("labels fixtures as demo and keeps a missing price null", () => {
    const eth = demoMatch(tweet("ETH to 5k by year end")).match;
    assert.equal(eth?.demo, true);
    assert.equal(eth?.yesPrice, null);
    assert.equal(eth?.noPrice, null);
  });

  it("ignores urls and handles when matching", () => {
    assert.equal(normalize("hey @sol300 https://t.co/sol300 gm"), "hey gm");
    assert.equal(demoMatch(tweet("@sol300 https://t.co/sol300 gm")).match, null);
  });

  it("returns a fresh object each time", () => {
    const a = demoMatch(tweet("sol 300")).match;
    const b = demoMatch(tweet("sol 300")).match;
    assert.notEqual(a, b);
  });
});

describe("match cache", () => {
  it("caches matches and no-match results per tweet", async () => {
    const store = memoryStore();
    const cache = createCache(store, 1000, () => 100);
    await cache.write([
      { tweetId: "1", match: { marketId: "m1", title: "t", yesPrice: "0.5", noPrice: "0.5" } },
      { tweetId: "2", match: null },
    ]);
    const hits = await cache.read(["1", "2", "3"]);
    assert.equal(hits.get("1")?.marketId, "m1");
    assert.equal(hits.has("2"), true);
    assert.equal(hits.get("2"), null);
    assert.equal(hits.has("3"), false);
  });

  it("expires entries after the ttl and prunes them", async () => {
    const store = memoryStore();
    let t = 0;
    const cache = createCache(store, 1000, () => t);
    await cache.write([{ tweetId: "1", match: null }]);
    t = 999;
    assert.equal((await cache.read(["1"])).has("1"), true);
    t = 1000;
    assert.equal((await cache.read(["1"])).has("1"), false);
    assert.equal(await cache.prune(), 1);
    assert.deepEqual(Object.keys(store.data), []);
  });

  it("does not prune keys it does not own", async () => {
    const store = memoryStore();
    store.data.installId = "abc";
    const cache = createCache(store, 1, () => 1_000_000);
    await cache.prune();
    assert.equal(store.data.installId, "abc");
  });
});

describe("sanitizeResults", () => {
  const good = { marketId: "m1", title: "Will it?", yesPrice: "0.62", noPrice: "0.38", status: "open" };

  it("keeps requested tweets only and fills the gaps with no match", () => {
    const out = sanitizeResults(
      { results: [{ tweetId: "1", match: good }, { tweetId: "999", match: good }] },
      ["1", "2"],
    );
    assert.deepEqual(out.map((r) => r.tweetId), ["1", "2"]);
    assert.equal(out[0].match?.marketId, "m1");
    assert.equal(out[1].match, null);
  });

  it("never shows a chip for a market that is not open", () => {
    const out = sanitizeResults({ results: [{ tweetId: "1", match: { ...good, status: "resolved" } }] }, ["1"]);
    assert.equal(out[0].match, null);
  });

  it("turns non-decimal prices into null instead of guessing", () => {
    const out = sanitizeResults(
      { results: [{ tweetId: "1", match: { ...good, yesPrice: "62%", noPrice: 0.38 } }] },
      ["1"],
    );
    assert.equal(out[0].match?.yesPrice, null);
    assert.equal(out[0].match?.noPrice, null);
  });

  it("keeps the demo flag so fixture chips stay labeled", () => {
    const out = sanitizeResults({ results: [{ tweetId: "1", match: { ...good, demo: true } }] }, ["1"]);
    assert.equal(out[0].match?.demo, true);
    const live = sanitizeResults({ results: [{ tweetId: "1", match: { ...good, demo: "yes" } }] }, ["1"]);
    assert.equal(live[0].match?.demo, undefined);
  });

  it("rejects bad market ids and survives garbage", () => {
    assert.equal(sanitizeResults({ results: [{ tweetId: "1", match: { ...good, marketId: "../x" } }] }, ["1"])[0].match, null);
    assert.deepEqual(sanitizeResults("nope", ["1"]), [{ tweetId: "1", match: null }]);
    assert.deepEqual(sanitizeResults(null, []), []);
  });
});

describe("parseMessage", () => {
  it("accepts a valid match request and trims fields", () => {
    const msg = parseMessage({ type: "MATCH_REQUEST", tweets: [{ tweetId: "123", text: "x".repeat(5000), lang: "en" }] });
    assert.equal(msg?.type, "MATCH_REQUEST");
    if (msg?.type === "MATCH_REQUEST") assert.equal(msg.tweets[0].text.length, 1000);
  });

  it("drops malformed tweets and rejects an empty request", () => {
    assert.equal(parseMessage({ type: "MATCH_REQUEST", tweets: [{ tweetId: "abc", text: "x", lang: "en" }] }), null);
    assert.equal(parseMessage({ type: "MATCH_REQUEST", tweets: [] }), null);
  });

  it("validates OPEN_TRADE fields", () => {
    assert.ok(parseMessage({ type: "OPEN_TRADE", marketId: "demo-sol-300", tweetId: "123", side: "yes" }));
    assert.equal(parseMessage({ type: "OPEN_TRADE", marketId: "a/b", tweetId: "123" }), null);
    assert.equal(parseMessage({ type: "OPEN_TRADE", marketId: "ok", tweetId: "12x" }), null);
    assert.equal(parseMessage({ type: "OPEN_TRADE", marketId: "ok", tweetId: "1", side: "maybe" }), null);
    assert.equal(parseMessage({ type: "WHATEVER" }), null);
    assert.equal(parseMessage(undefined), null);
  });
});
