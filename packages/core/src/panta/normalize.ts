import { MARKET_ID_RE } from "../types.ts";
import type {
  BuiltTransaction,
  CatalogMarket,
  MarketStatus,
  Position,
  PositionStatus,
  Quote,
  RecentTrade,
  Side,
  TradeStatus,
} from "../types.ts";

/**
 * Panta responses are normalized here, in one place.
 * UNVERIFIED: the field names below are inferred from the docs and public integrations.
 * Run `pnpm --filter @sorot/core probe` with a real key and adjust this file if a field is named differently.
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

/** Prices and amounts stay strings. Numbers from JSON are turned into their decimal text, never rounded. */
function decimal(v: unknown): string | null {
  if (typeof v === "string" && /^\d+(\.\d+)?$/.test(v.trim())) return v.trim();
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return String(v);
  return null;
}

export function listOf(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isObj(raw)) {
    const inner = pick(raw, "results", "data", "markets", "items", "positions", "trades");
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

export function nextCursor(raw: unknown): string | null {
  if (!isObj(raw)) return null;
  const next = pick(raw, "next", "nextCursor", "next_cursor", "cursor");
  return typeof next === "string" && next !== "" ? next : null;
}

function marketStatus(v: unknown): MarketStatus {
  const s = String(v ?? "").toLowerCase();
  if (["resolved", "settled", "finalized", "claimable"].includes(s)) return "resolved";
  if (["closed", "ended", "expired", "cancelled", "canceled", "paused", "suspended"].includes(s)) return "closed";
  if (["open", "active", "live", "trading"].includes(s)) return "open";
  // An unknown status is never treated as tradable.
  return "closed";
}

export function normalizeMarket(raw: unknown, now: number, publicBase = "https://panta.market"): CatalogMarket | null {
  if (!isObj(raw)) return null;
  const idValue = pick(raw, "id", "marketId", "market_id", "address", "publicKey");
  const id = typeof idValue === "string" ? idValue : null;
  if (!id || !MARKET_ID_RE.test(id)) return null;

  const prices = isObj(raw.prices) ? raw.prices : {};
  const titleRaw = str(pick(raw, "title", "question", "name"));

  return {
    id,
    titleRaw,
    title: titleRaw ?? "",
    category: str(pick(raw, "category", "tag")),
    status: marketStatus(pick(raw, "status", "state")),
    yesPrice: decimal(pick(raw, "yesPrice", "yes_price") ?? prices.yes),
    noPrice: decimal(pick(raw, "noPrice", "no_price") ?? prices.no),
    volumeUsdc: decimal(pick(raw, "volumeUsdc", "volume_usdc", "volume")),
    url: str(pick(raw, "url", "link")) ?? `${publicBase}/markets/${encodeURIComponent(id)}`,
    updatedAt: now,
  };
}

function toMs(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return fallback;
}

const sideOf = (v: unknown): Side => (String(v ?? "").toLowerCase() === "no" ? "no" : "yes");

export function normalizeQuote(
  raw: unknown,
  req: { marketId: string; side: Side; amountUsdc: string; maxSlippageBps: number },
  now: number,
): Quote {
  const o = isObj(raw) ? raw : {};
  const quoteId = str(pick(o, "quoteId", "quote_id", "id"));
  if (!quoteId) throw new Error("Panta quote has no quoteId");
  return {
    quoteId,
    marketId: req.marketId,
    side: req.side,
    amountUsdc: decimal(pick(o, "amount", "amountUsdc")) ?? req.amountUsdc,
    shares: decimal(pick(o, "shares", "estimatedShares", "outShares")) ?? "0",
    avgPrice: decimal(pick(o, "avgPrice", "avg_price", "price")) ?? "0",
    feeUsdc: decimal(pick(o, "fee", "feeUsdc", "fee_usdc")) ?? "0",
    maxSlippageBps: req.maxSlippageBps,
    expiresAt: toMs(pick(o, "expiresAt", "expires_at", "validUntil"), now + 90_000),
  };
}

export function normalizeBuilt(raw: unknown, quoteId: string): BuiltTransaction {
  const o = isObj(raw) ? raw : {};
  const instructions = pick(o, "instructions");
  const recentBlockhash = str(pick(o, "recentBlockhash", "recent_blockhash", "blockhash"));
  if (!Array.isArray(instructions) || !recentBlockhash) {
    throw new Error("Panta build response is missing instructions or recentBlockhash");
  }
  return { quoteId, instructions, recentBlockhash };
}

export function normalizeVerify(raw: unknown): TradeStatus {
  const s = String(isObj(raw) ? (pick(raw, "status", "state") ?? "") : "").toLowerCase();
  if (["confirmed", "finalized", "success", "succeeded", "complete", "completed"].includes(s)) return "confirmed";
  if (["failed", "error", "rejected", "dropped"].includes(s)) return "failed";
  return "pending";
}

function positionStatus(o: Obj): PositionStatus {
  const s = String(pick(o, "status", "state") ?? "").toLowerCase();
  if (s === "claimed") return "claimed";
  if (["won", "win", "winner"].includes(s)) return "won";
  if (["lost", "loss", "loser"].includes(s)) return "lost";
  if (pick(o, "claimable") === true) return "won";
  return "open";
}

export function normalizePosition(raw: unknown, titles: Map<string, string>): Position | null {
  if (!isObj(raw)) return null;
  const marketId = str(pick(raw, "marketId", "market_id", "market"));
  if (!marketId || !MARKET_ID_RE.test(marketId)) return null;
  const status = positionStatus(raw);
  return {
    marketId,
    marketTitle: str(pick(raw, "marketTitle", "title")) ?? titles.get(marketId) ?? "Untitled market",
    side: sideOf(pick(raw, "side", "outcome")),
    shares: decimal(pick(raw, "shares", "size")) ?? "0",
    avgPrice: decimal(pick(raw, "avgPrice", "avg_price", "price")) ?? "0",
    costUsdc: decimal(pick(raw, "costUsdc", "cost", "cost_usdc")) ?? "0",
    status,
    claimable: pick(raw, "claimable") === true && status !== "claimed",
  };
}

export function normalizeTrade(raw: unknown, now: number): RecentTrade | null {
  if (!isObj(raw)) return null;
  const wallet = str(pick(raw, "wallet", "trader", "user"));
  const amount = decimal(pick(raw, "amountUsdc", "amount", "usdc"));
  if (!wallet || !amount) return null;
  return {
    id: str(pick(raw, "id", "signature")) ?? `${wallet}-${amount}`,
    wallet,
    side: sideOf(pick(raw, "side", "outcome")),
    amountUsdc: amount,
    at: toMs(pick(raw, "at", "createdAt", "created_at", "timestamp"), now),
  };
}
