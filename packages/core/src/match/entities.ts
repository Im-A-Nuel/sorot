/**
 * Text normalization and entity extraction for the prefilter.
 * Precision first: a tweet only reaches the embedding stage if it shares a real subject with a market.
 */

const ASSET_ALIASES: Record<string, string[]> = {
  sol: ["sol", "solana"],
  eth: ["eth", "ethereum", "ether"],
  btc: ["btc", "bitcoin"],
  bnb: ["bnb"],
  xrp: ["xrp", "ripple"],
  doge: ["doge", "dogecoin"],
  ada: ["ada", "cardano"],
  avax: ["avax", "avalanche"],
  usdc: ["usdc"],
  usdt: ["usdt", "tether"],
};

const ALIAS_TO_ASSET = new Map<string, string>();
for (const [asset, aliases] of Object.entries(ASSET_ALIASES)) {
  for (const a of aliases) ALIAS_TO_ASSET.set(a, asset);
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const STOPWORDS = new Set([
  "will", "the", "and", "for", "that", "this", "with", "from", "have", "has", "was", "are", "before",
  "after", "above", "below", "over", "under", "close", "end", "by", "on", "in", "of", "to", "be", "or",
  "a", "an", "at", "is", "it", "its", "than", "more", "less", "reach", "hit", "price", "market", "year",
  "week", "month", "day", "today", "tomorrow", "soon", "going", "gonna", "about", "just", "they", "you",
  "your", "all", "any", "not", "but", "can", "who", "what", "when", "how", "why", "yes", "no",
]);

/** Removes links, handles, hashtags markers and emoji, lowercases, and collapses whitespace. */
export function normalizeText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/#/g, " ")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(normalized: string): string[] {
  return normalized.match(/[a-z]+|\d[\d,]*(?:\.\d+)?[km]?/g) ?? [];
}

/** "5k" -> "5000", "$100,000" -> "100000", "1.5m" -> "1500000". Four-digit years are not price levels. */
function numberToken(raw: string, hasDollar: boolean): string | null {
  const m = /^(\d[\d,]*(?:\.\d+)?)([km])?$/.exec(raw);
  if (!m) return null;
  const base = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return null;
  const mult = m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : 1;
  const value = Math.round(base * mult);
  if (!m[2] && !hasDollar && value >= 1990 && value <= 2100) return null;
  return String(value);
}

export type Entities = {
  /** Canonical tickers such as "sol". */
  assets: Set<string>;
  /** Normalized price levels such as "300" or "5000". */
  numbers: Set<string>;
  /** Every plain word, used for name overlap on non-crypto markets. */
  words: Set<string>;
};

export function extractEntities(text: string): Entities {
  const normalized = normalizeText(text);
  const assets = new Set<string>();
  const numbers = new Set<string>();
  const words = new Set<string>();

  const dollarNumbers = new Set<string>();
  for (const m of normalized.matchAll(/\$\s?(\d[\d,]*(?:\.\d+)?[km]?)/g)) dollarNumbers.add(m[1]);

  for (const tok of tokens(normalized)) {
    if (/^\d/.test(tok)) {
      const n = numberToken(tok, dollarNumbers.has(tok));
      if (n) numbers.add(n);
      continue;
    }
    const asset = ALIAS_TO_ASSET.get(tok);
    if (asset) assets.add(asset);
    if (tok.length >= 3 && !STOPWORDS.has(tok) && !MONTHS.includes(tok)) words.add(tok);
  }
  return { assets, numbers, words };
}

export type MarketEntities = {
  assets: Set<string>;
  numbers: Set<string>;
  /** Proper nouns from the title, such as "fed" or "trump". Used when a market has no ticker. */
  names: Set<string>;
  /** Every significant word in the title. A name alone is too weak, so name matches need company. */
  words: Set<string>;
};

/** Names are capitalized words in the original title. Common words such as "Will" are skipped, so a name can open the title. */
export function extractMarketEntities(title: string): MarketEntities {
  const base = extractEntities(title);
  const names = new Set<string>();
  const words = title.split(/\s+/);
  for (const w of words) {
    const clean = w.replace(/[^A-Za-z]/g, "");
    if (clean.length >= 3 && /^[A-Z]/.test(clean) && !STOPWORDS.has(clean.toLowerCase())) {
      const lower = clean.toLowerCase();
      if (!MONTHS.includes(lower) && !ALIAS_TO_ASSET.has(lower)) names.add(lower);
    }
  }
  return { assets: base.assets, numbers: base.numbers, names, words: base.words };
}

/**
 * The prefilter rule. A market is a candidate only when the tweet shares its subject (a ticker or a name)
 * and, if the market names a price level, the same level.
 */
export function sharesSubject(tweet: Entities, market: MarketEntities): boolean {
  const assetOverlap = [...market.assets].some((a) => tweet.assets.has(a));
  // Without a ticker, a shared name must come with at least one more shared word ("Fed up" is not "Fed cut rates").
  const sharedWords = [...market.words].filter((w) => tweet.words.has(w)).length;
  const nameOverlap = [...market.names].some((n) => tweet.words.has(n)) && sharedWords >= 2;
  if (!assetOverlap && !nameOverlap) return false;
  if (market.numbers.size === 0) return true;
  return [...market.numbers].some((n) => tweet.numbers.has(n));
}
