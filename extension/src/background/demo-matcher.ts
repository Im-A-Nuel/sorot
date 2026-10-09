import type { MatchedMarket, MatchResult, TweetInput } from "../shared/types.ts";

/**
 * Demo matcher used only when no backend is configured. It knows three fixture markets and is deliberately strict:
 * a tweet needs both the asset and the price level. Fixtures are labeled demo so the chip says so.
 * The real pipeline (prefilter, embeddings, verification) lives in the backend.
 */

type Rule = { all: RegExp[]; market: MatchedMarket };

const rules: Rule[] = [
  {
    all: [/\bsol(ana)?\b/i, /\b300\b/],
    market: {
      marketId: "demo-sol-300",
      title: "Will SOL close above $300 on Oct 31?",
      yesPrice: "0.62",
      noPrice: "0.38",
      demo: true,
    },
  },
  {
    all: [/\beth(ereum)?\b/i, /\b(5000|5,000|5k)\b/i],
    market: {
      marketId: "demo-eth-5k",
      title: "Will ETH close above $5,000 on Dec 31?",
      yesPrice: null,
      noPrice: null,
      demo: true,
    },
  },
];

export function normalize(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function demoMatch(tweet: TweetInput): MatchResult {
  const text = normalize(tweet.text);
  const rule = rules.find((r) => r.all.every((re) => re.test(text)));
  return { tweetId: tweet.tweetId, match: rule ? { ...rule.market } : null };
}

export function demoMatchAll(tweets: TweetInput[]): MatchResult[] {
  return tweets.map(demoMatch);
}
