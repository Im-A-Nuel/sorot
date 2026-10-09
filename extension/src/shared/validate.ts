import type { Message, Side, TweetInput } from "./types.ts";

export const MARKET_ID_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
export const TWEET_ID_RE = /^\d{1,25}$/;

const MAX_TEXT = 1000;

function isSide(value: unknown): value is Side {
  return value === "yes" || value === "no";
}

function isTweet(value: unknown): value is TweetInput {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.tweetId === "string" &&
    TWEET_ID_RE.test(t.tweetId) &&
    typeof t.text === "string" &&
    t.text.length > 0 &&
    typeof t.lang === "string"
  );
}

/** Messages come from content scripts, so treat every field as untrusted. */
export function parseMessage(raw: unknown): Message | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;

  if (m.type === "MATCH_REQUEST" && Array.isArray(m.tweets)) {
    const tweets = m.tweets.filter(isTweet).map((t) => ({
      tweetId: t.tweetId,
      text: t.text.slice(0, MAX_TEXT),
      lang: t.lang.slice(0, 12),
    }));
    return tweets.length > 0 ? { type: "MATCH_REQUEST", tweets } : null;
  }

  if (
    m.type === "OPEN_TRADE" &&
    typeof m.marketId === "string" &&
    MARKET_ID_RE.test(m.marketId) &&
    typeof m.tweetId === "string" &&
    TWEET_ID_RE.test(m.tweetId) &&
    (m.side === undefined || isSide(m.side))
  ) {
    return {
      type: "OPEN_TRADE",
      marketId: m.marketId,
      tweetId: m.tweetId,
      side: m.side as Side | undefined,
    };
  }

  return null;
}
