import type { MatchedMarket, MatchResult } from "../shared/types.ts";
import { MARKET_ID_RE } from "../shared/validate.ts";

const MAX_TITLE = 200;

/** Prices stay strings exactly as the API sent them. Anything that is not a plain decimal becomes null. */
function price(value: unknown): string | null {
  return typeof value === "string" && /^\d+(\.\d{1,6})?$/.test(value) ? value : null;
}

function market(raw: unknown): MatchedMarket | null {
  if (typeof raw !== "object" || raw === null) return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.marketId !== "string" || !MARKET_ID_RE.test(m.marketId)) return null;
  if (typeof m.title !== "string" || m.title.trim() === "") return null;
  // Never show a chip for a market that is not open, even if the backend sends one by mistake.
  if (m.status !== undefined && m.status !== "open") return null;
  return {
    marketId: m.marketId,
    title: m.title.slice(0, MAX_TITLE),
    yesPrice: price(m.yesPrice),
    noPrice: price(m.noPrice),
    ...(m.demo === true ? { demo: true } : {}),
  };
}

/** Backend responses are untrusted input. Keep only requested tweet ids and well-formed markets. */
export function sanitizeResults(raw: unknown, requested: string[]): MatchResult[] {
  const list =
    typeof raw === "object" && raw !== null && Array.isArray((raw as { results?: unknown }).results)
      ? ((raw as { results: unknown[] }).results as unknown[])
      : [];
  const wanted = new Set(requested);
  const seen = new Map<string, MatchResult>();

  for (const item of list) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.tweetId !== "string" || !wanted.has(r.tweetId)) continue;
    seen.set(r.tweetId, { tweetId: r.tweetId, match: market(r.match) });
  }

  // A tweet the backend skipped counts as "no match" so it is not sent again.
  return requested.map((id) => seen.get(id) ?? { tweetId: id, match: null });
}
