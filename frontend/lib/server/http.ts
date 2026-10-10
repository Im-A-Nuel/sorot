import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { SorotError, isSorotError, type ErrorCode } from "@sorot/core";
import type { ZodType } from "zod";
import { runWithSim, simAllowed } from "./runtime";

const STATUS: Record<ErrorCode, number> = {
  INVALID_PARAMS: 400,
  NOT_FOUND: 404,
  MARKET_CLOSED: 409,
  QUOTE_EXPIRED: 409,
  SLIPPAGE: 409,
  NOT_CLAIMABLE: 409,
  TX_FAILED: 422,
  RATE_LIMITED: 429,
  PANTA_UPSTREAM: 502,
  UNKNOWN: 500,
};

export function errorResponse(err: unknown): NextResponse {
  const e = isSorotError(err) ? err : new SorotError("UNKNOWN", "Something went wrong.");
  if (!isSorotError(err)) console.error("[sorot] unexpected error", err instanceof Error ? err.message : err);
  const headers: Record<string, string> = {};
  if (e.code === "RATE_LIMITED" && e.retryAfterMs) headers["retry-after"] = String(Math.ceil(e.retryAfterMs / 1000));
  return NextResponse.json(
    { error: { code: e.code, message: e.message, ...(e.retryAfterMs ? { retryAfterMs: e.retryAfterMs } : {}) } },
    { status: STATUS[e.code], headers },
  );
}

// Per-client request limiter. In memory, so each server instance keeps its own window.
const windows = new Map<string, number[]>();

export function allow(key: string, max: number, windowMs: number, now = Date.now()): { ok: boolean; retryAfterMs: number } {
  const recent = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    windows.set(key, recent);
    return { ok: false, retryAfterMs: windowMs - (now - recent[0]) };
  }
  recent.push(now);
  windows.set(key, recent);
  if (windows.size > 5000) for (const [k, v] of windows) if (v.every((t) => now - t >= windowMs)) windows.delete(k);
  return { ok: true, retryAfterMs: 0 };
}

export function clientKey(req: NextRequest): string {
  const id = req.headers.get("x-sorot-client");
  if (id && /^[A-Za-z0-9-]{8,64}$/.test(id)) return `c:${id}`;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${ip || "unknown"}`;
}

const MAX_BODY = 64 * 1024;

export async function readJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new SorotError("INVALID_PARAMS", "Request body is too large.");
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new SorotError("INVALID_PARAMS", "Request body is not valid JSON.");
  }
  return parse(raw, schema);
}

export function parse<T>(raw: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.join(".") || "request";
    throw new SorotError("INVALID_PARAMS", `Invalid ${where}.`);
  }
  return result.data;
}

type Options = { limit?: { max: number; windowMs: number } };

/** Wraps a route handler: rate limiting, optional failure simulation (dev only), and uniform JSON errors. */
export function route<C>(opts: Options, fn: (req: NextRequest, ctx: C) => Promise<unknown>) {
  return async (req: NextRequest, ctx: C): Promise<NextResponse> => {
    try {
      if (opts.limit) {
        const gate = allow(`${new URL(req.url).pathname}|${clientKey(req)}`, opts.limit.max, opts.limit.windowMs);
        if (!gate.ok) throw new SorotError("RATE_LIMITED", "Too many requests. Slow down.", gate.retryAfterMs);
      }
      const sim = simAllowed() ? req.headers.get("x-sorot-sim") : null;
      const body = await runWithSim(sim, () => fn(req, ctx));
      return NextResponse.json(body ?? { ok: true }, { headers: { "cache-control": "no-store" } });
    } catch (e) {
      return errorResponse(e);
    }
  };
}
