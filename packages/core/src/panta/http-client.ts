import { SorotError, type ErrorCode } from "../types.ts";
import type { CatalogMarket, Position, Quote, QuoteRequest, RecentTrade } from "../types.ts";
import type { PantaClient } from "./client.ts";
import { SlidingWindowLimiter } from "./limiter.ts";
import {
  listOf,
  nextCursor,
  normalizeBuilt,
  normalizeMarket,
  normalizePosition,
  normalizeQuote,
  normalizeTrade,
  normalizeVerify,
} from "./normalize.ts";
import { PANTA_BASE_URL, isAllowedPath, routes } from "./routes.ts";

export type HttpPantaConfig = {
  apiKey: string;
  baseUrl?: string;
  /** Sorot's attribution id. Sent as userId so Panta can attribute trades to Sorot. */
  attributionId?: string;
  fetchImpl?: typeof fetch;
  limiter?: SlidingWindowLimiter;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
};

const MAX_PAGES = 20;
const DEFAULT_SLIPPAGE_BPS = 100;

const CODE_MAP: Record<string, ErrorCode> = {
  MARKET_NOT_FOUND: "NOT_FOUND",
  NOT_FOUND: "NOT_FOUND",
  NOT_CLAIMABLE: "NOT_CLAIMABLE",
  QUOTE_EXPIRED: "QUOTE_EXPIRED",
  SLIPPAGE_EXCEEDED: "SLIPPAGE",
  SLIPPAGE: "SLIPPAGE",
  MARKET_CLOSED: "MARKET_CLOSED",
  INVALID_MARKET_PARAMS: "INVALID_PARAMS",
  INVALID_PARAMS: "INVALID_PARAMS",
  TX_FAILED: "TX_FAILED",
};

export class HttpPantaClient implements PantaClient {
  readonly source: "live" | "sandbox";

  private cfg: HttpPantaConfig;
  private base: string;
  private fetchImpl: typeof fetch;
  private limiter: SlidingWindowLimiter;
  private now: () => number;
  private sleep: (ms: number) => Promise<void>;
  private maxRetries: number;

  constructor(cfg: HttpPantaConfig) {
    this.cfg = cfg;
    this.source = cfg.apiKey.startsWith("pk_test_") ? "sandbox" : "live";
    this.base = (cfg.baseUrl ?? PANTA_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = cfg.fetchImpl ?? fetch;
    this.now = cfg.now ?? Date.now;
    this.sleep = cfg.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.limiter = cfg.limiter ?? new SlidingWindowLimiter(90, 60_000, this.now, this.sleep);
    this.maxRetries = cfg.maxRetries ?? 2;
  }

  private async request(method: "GET" | "POST", path: string, body?: unknown): Promise<unknown> {
    if (!isAllowedPath(path)) throw new SorotError("INVALID_PARAMS", "Route is not on the Panta allowlist.");

    const headers: Record<string, string> = { "X-Api-Key": this.cfg.apiKey, accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.cfg.attributionId) headers["X-User-Id"] = this.cfg.attributionId;

    for (let attempt = 0; ; attempt++) {
      await this.limiter.acquire();
      let res: Response;
      try {
        res = await this.fetchImpl(`${this.base}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch {
        throw new SorotError("PANTA_UPSTREAM", "Could not reach Panta.");
      }

      if (res.status === 429 && attempt < this.maxRetries) {
        const retryAfter = Number(res.headers.get("retry-after"));
        await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
        continue;
      }

      const text = await res.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      if (res.ok) return json;
      throw this.mapError(res.status, json, res.headers.get("retry-after"));
    }
  }

  private mapError(status: number, body: unknown, retryAfter: string | null): SorotError {
    const o = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const inner = typeof o.error === "object" && o.error !== null ? (o.error as Record<string, unknown>) : o;
    const raw = String(inner.code ?? o.code ?? "").toUpperCase();
    const message = typeof inner.message === "string" ? inner.message : `Panta returned ${status}`;

    if (status === 429) {
      const secs = Number(retryAfter);
      return new SorotError("RATE_LIMITED", "Panta is rate limiting requests.", Number.isFinite(secs) ? secs * 1000 : 2000);
    }
    if (CODE_MAP[raw]) return new SorotError(CODE_MAP[raw], message);
    if (status === 404) return new SorotError("NOT_FOUND", message);
    if (status === 400 || status === 422) return new SorotError("INVALID_PARAMS", message);
    return new SorotError("PANTA_UPSTREAM", message);
  }

  async listMarkets(): Promise<CatalogMarket[]> {
    const out: CatalogMarket[] = [];
    let path: string = routes.markets();
    for (let page = 0; page < MAX_PAGES; page++) {
      const raw = await this.request("GET", path);
      const now = this.now();
      for (const item of listOf(raw)) {
        const market = normalizeMarket(item, now);
        if (market) out.push(market);
      }
      const cursor = nextCursor(raw);
      if (!cursor) break;
      path = `${routes.markets()}?cursor=${encodeURIComponent(cursor)}`;
    }
    return out;
  }

  async getMarket(id: string): Promise<CatalogMarket> {
    const raw = await this.request("GET", routes.market(id));
    const market = normalizeMarket(raw, this.now());
    if (!market) throw new SorotError("NOT_FOUND", "Panta returned an unreadable market.");
    return market;
  }

  async recentTrades(marketId: string): Promise<RecentTrade[]> {
    try {
      const raw = await this.request("GET", routes.marketTrades(marketId));
      const now = this.now();
      return listOf(raw)
        .map((t) => normalizeTrade(t, now))
        .filter((t): t is RecentTrade => t !== null)
        .slice(0, 10);
    } catch (e) {
      if (e instanceof SorotError && e.code === "NOT_FOUND") return [];
      throw e;
    }
  }

  async quote(req: QuoteRequest): Promise<Quote> {
    const raw = await this.request("POST", routes.orderQuote(), {
      marketId: req.marketId,
      side: req.side.toUpperCase(),
      amount: req.amountUsdc,
      wallet: req.wallet,
      ...(this.cfg.attributionId ? { userId: this.cfg.attributionId } : {}),
    });
    return normalizeQuote(raw, { ...req, maxSlippageBps: DEFAULT_SLIPPAGE_BPS }, this.now());
  }

  async build(req: { quoteId: string; maxSlippageBps: number; wallet: string }) {
    const raw = await this.request("POST", routes.orderBuild(), {
      quoteId: req.quoteId,
      maxSlippageBps: req.maxSlippageBps,
      wallet: req.wallet,
      ...(this.cfg.attributionId ? { userId: this.cfg.attributionId } : {}),
    });
    return normalizeBuilt(raw, req.quoteId);
  }

  async submit(req: { signature: string; wallet: string; marketId: string; quoteId?: string }) {
    await this.request("POST", routes.orderSubmit(), {
      signature: req.signature,
      wallet: req.wallet,
      ...(req.quoteId ? { quoteId: req.quoteId } : {}),
    });
  }

  async verify(signature: string) {
    return normalizeVerify(await this.request("POST", routes.orderVerify(), { signature }));
  }

  async positions(wallet: string): Promise<Position[]> {
    const raw = await this.request("GET", `${routes.positions()}?wallet=${encodeURIComponent(wallet)}`);
    const titles = new Map<string, string>();
    return listOf(raw)
      .map((p) => normalizePosition(p, titles))
      .filter((p): p is Position => p !== null);
  }

  async claimBuild(req: { wallet: string; marketId: string }) {
    const raw = await this.request("POST", routes.claimBuild(), {
      wallet: req.wallet,
      marketId: req.marketId,
      ...(this.cfg.attributionId ? { userId: this.cfg.attributionId } : {}),
    });
    return normalizeBuilt(raw, `claim:${req.marketId}`);
  }

  async reportTrade(req: { signature: string; wallet: string; marketId: string; quoteId?: string }) {
    await this.request("POST", routes.tradesReport(), {
      signature: req.signature,
      wallet: req.wallet,
      marketId: req.marketId,
      ...(req.quoteId && !req.quoteId.startsWith("claim:") ? { quoteId: req.quoteId } : {}),
      ...(this.cfg.attributionId ? { userId: this.cfg.attributionId } : {}),
    });
  }
}
