import { fromMicro, toMicro } from "../money.ts";
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
 * Checked against real responses on 2026-10-09: the Panta sandbox (pk_test_) for catalog, detail, positions, quote,
 * build, verify and claim build, and the live catalog, market detail and trades (pk_live_). Still unverified:
 * non-empty positions, and the submit and report routes.
 */

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function pick(o: Obj, ...keys: string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k];
  return undefined;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

/** Live prices can carry nine decimals ("0.501996015"). Display and storage keep four, cut as text, never rounded as a float. */
function price(v: unknown): string | null {
  const d = decimal(v);
  if (d === null) return null;
  const [int, frac = ""] = d.split(".");
  return frac.length > 4 ? `${int}.${frac.slice(0, 4)}` : d;
}

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

/**
 * Panta reports a market phase: primary, secondary, resolved or cancelled. Sorot buys through primary orders only,
 * so only a primary-phase market that has not ended counts as open. Anything unclear is closed, never tradable.
 */
function marketStatus(raw: Obj, now: number): MarketStatus {
  const phase = String(pick(raw, "phase") ?? "").toLowerCase();
  const label = String(pick(raw, "status", "state") ?? "").toLowerCase();

  if (raw.resolved === true || phase === "resolved" || ["resolved", "settled", "finalized", "claimable"].includes(label)) {
    return "resolved";
  }
  if (["cancelled", "canceled", "secondary"].includes(phase)) return "closed";
  if (["closed", "ended", "expired", "cancelled", "canceled", "paused", "suspended"].includes(label)) return "closed";

  const end = toMs(pick(raw, "endTime", "end_time"), Number.NaN);
  if (Number.isFinite(end) && end < now) return "closed";

  return phase === "primary" || ["open", "active", "live", "trading", "primary"].includes(label) ? "open" : "closed";
}

export function normalizeMarket(raw: unknown, now: number, publicBase = "https://panta.market"): CatalogMarket | null {
  if (!isObj(raw)) return null;
  const idValue = pick(raw, "id", "marketId", "market_id", "address", "publicKey");
  const id = typeof idValue === "string" ? idValue : null;
  if (!id || !MARKET_ID_RE.test(id)) return null;

  const prices = isObj(raw.prices) ? raw.prices : {};
  // The catalog row often has an empty title while `question` or the detail endpoint has the text.
  const titleRaw = str(raw.title);
  const title = titleRaw ?? str(raw.question) ?? str(raw.name) ?? "";

  return {
    id,
    titleRaw,
    title,
    category: str(pick(raw, "category", "tag")),
    status: marketStatus(raw, now),
    yesPrice: price(pick(raw, "yesPrice", "yes_price") ?? prices.yes),
    noPrice: price(pick(raw, "noPrice", "no_price") ?? prices.no),
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
  const amountUsdc = decimal(pick(o, "amount", "amountUsdc")) ?? req.amountUsdc;
  const shares = decimal(pick(o, "shares", "estimatedShares", "outShares")) ?? "0";
  return {
    quoteId,
    marketId: req.marketId,
    side: req.side,
    amountUsdc,
    shares,
    // Panta does not send an average price. It is the amount paid divided by the shares received.
    avgPrice: decimal(pick(o, "avgPrice", "avg_price", "price")) ?? averagePrice(amountUsdc, shares),
    feeUsdc: decimal(pick(o, "fee", "feeUsdc", "fee_usdc")) ?? "0",
    maxSlippageBps: req.maxSlippageBps,
    expiresAt: toMs(pick(o, "expiresAt", "expires_at", "validUntil"), now + 90_000),
  };
}

/** amount / shares as a decimal string with integer math, to four decimals and no trailing zeros past two. */
export function averagePrice(amountUsdc: string, shares: string): string {
  const amount = toMicro(amountUsdc);
  const qty = toMicro(shares);
  if (amount === null || qty === null || qty === BigInt(0)) return "0";
  const micro = (amount * BigInt(1_000_000)) / qty;
  const [int, frac = ""] = fromMicro(micro).split(".");
  const trimmed = frac.slice(0, 4).replace(/0+$/, "").padEnd(2, "0");
  return `${int}.${trimmed}`;
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

/** Panta reports trade sizes in USDC base units: yesAmount for a YES buy, noAmount for a NO buy. */
function microAmount(v: unknown): bigint {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return BigInt(Math.trunc(v));
  if (typeof v === "string" && /^\d+$/.test(v)) return BigInt(v);
  return BigInt(0);
}

export function normalizeTrade(raw: unknown, now: number): RecentTrade | null {
  if (!isObj(raw)) return null;
  const wallet = str(pick(raw, "wallet", "trader", "user"));
  if (!wallet) return null;

  const yes = microAmount(raw.yesAmount);
  const no = microAmount(raw.noAmount);
  const base = yes > no ? yes : no;

  let amount = decimal(pick(raw, "amountUsdc", "amount", "usdc"));
  let side = sideOf(pick(raw, "side", "outcome"));
  if (base > BigInt(0)) {
    amount = fromMicro(base);
    side = yes > no ? "yes" : "no";
  }
  if (!amount) return null;

  return {
    id: str(pick(raw, "id", "signature")) ?? `${wallet}-${amount}`,
    wallet,
    side,
    amountUsdc: amount,
    at: toMs(pick(raw, "at", "blockTime", "createdAt", "created_at", "timestamp"), now),
  };
}
