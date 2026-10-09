import { CACHE_TTL_MS } from "../config.ts";
import type { MatchResponse, MatchResult, OpenTradeResponse, TweetInput } from "../shared/types.ts";
import { parseMessage } from "../shared/validate.ts";
import { createCache, type KeyValueStore } from "./cache.ts";
import { matchTweets } from "./match.ts";
import { openTrade } from "./trade-window.ts";

const store: KeyValueStore = {
  get: (keys) => chrome.storage.local.get(keys),
  set: (items) => chrome.storage.local.set(items),
  remove: (keys) => chrome.storage.local.remove(keys),
};
const cache = createCache(store, CACHE_TTL_MS);

chrome.runtime.onInstalled.addListener(() => void cache.prune());
chrome.runtime.onStartup.addListener(() => void cache.prune());

async function handleMatch(tweets: TweetInput[]): Promise<MatchResponse> {
  const ids = [...new Set(tweets.map((t) => t.tweetId))];
  const hits = await cache.read(ids);
  const misses = tweets.filter((t, i) => !hits.has(t.tweetId) && tweets.findIndex((x) => x.tweetId === t.tweetId) === i);

  let fresh: MatchResult[] = [];
  if (misses.length > 0) {
    fresh = await matchTweets(misses);
    await cache.write(fresh);
  }

  const byId = new Map<string, MatchResult["match"]>(hits);
  for (const r of fresh) byId.set(r.tweetId, r.match);
  return { ok: true, results: ids.map((tweetId) => ({ tweetId, match: byId.get(tweetId) ?? null })) };
}

chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
  // Only our own content scripts on x.com may talk to the service worker.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith("https://x.com/")) return false;

  const msg = parseMessage(raw);
  if (!msg) {
    sendResponse({ ok: false, error: "bad message" } satisfies MatchResponse);
    return false;
  }

  if (msg.type === "MATCH_REQUEST") {
    handleMatch(msg.tweets)
      .then(sendResponse)
      .catch(() => sendResponse({ ok: false, error: "match failed" } satisfies MatchResponse));
    return true;
  }

  openTrade(msg.marketId, msg.tweetId, msg.side)
    .then(() => sendResponse({ ok: true } satisfies OpenTradeResponse))
    .catch(() => sendResponse({ ok: false } satisfies OpenTradeResponse));
  return true;
});
