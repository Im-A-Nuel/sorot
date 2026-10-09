export type Side = "yes" | "no";

export type MatchedMarket = {
  marketId: string;
  title: string;
  /** Null when Panta has no live price. The chip then shows "see odds". */
  yesPrice: string | null;
  noPrice: string | null;
  /** True for fixtures from the demo matcher. The chip labels these so nobody mistakes them for live odds. */
  demo?: boolean;
};

export type TweetInput = {
  tweetId: string;
  text: string;
  lang: string;
};

export type MatchResult = {
  tweetId: string;
  match: MatchedMarket | null;
};

export type Message =
  | { type: "MATCH_REQUEST"; tweets: TweetInput[] }
  | { type: "OPEN_TRADE"; marketId: string; tweetId: string; side?: Side };

export type MatchResponse =
  | { ok: true; results: MatchResult[] }
  | { ok: false; error: string };

export type OpenTradeResponse = { ok: boolean };

export type Settings = { enabled: boolean };
export const DEFAULT_SETTINGS: Settings = { enabled: true };
