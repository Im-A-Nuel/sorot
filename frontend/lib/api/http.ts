import { ApiError, type ApiErrorCode, type SorotApi } from "./types";

/**
 * Client for the Sorot backend. The contract is defined in docs/SCHEMA.md and the backend is not built yet,
 * so this is only used when NEXT_PUBLIC_API_URL is set.
 */

const KNOWN_CODES: ApiErrorCode[] = [
  "INVALID_PARAMS",
  "NOT_FOUND",
  "MARKET_CLOSED",
  "PANTA_UPSTREAM",
  "RATE_LIMITED",
  "QUOTE_EXPIRED",
  "SLIPPAGE",
  "NOT_CLAIMABLE",
  "TX_FAILED",
];

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("NETWORK", "Could not reach Sorot. Check your connection.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string; retryAfterMs?: number };
    } | null;
    const code = body?.error?.code as ApiErrorCode | undefined;
    throw new ApiError(
      code && KNOWN_CODES.includes(code) ? code : "UNKNOWN",
      body?.error?.message ?? `Request failed with ${res.status}.`,
      body?.error?.retryAfterMs,
    );
  }
  return (await res.json()) as T;
}

export function createHttpApi(base: string): SorotApi {
  const get = <T>(path: string) => request<T>(base, path);
  const post = <T>(path: string, body: unknown) =>
    request<T>(base, path, { method: "POST", body: JSON.stringify(body) });

  return {
    getMarket: (id) => get(`/markets/${encodeURIComponent(id)}`),
    recentTrades: (id) => get(`/markets/${encodeURIComponent(id)}/trades`),
    quote: (req) => post("/trade/quote", req),
    build: (req) => post("/trade/build", req),
    submit: async (req) => {
      await post("/trade/submit", req);
    },
    verify: async (signature) => {
      const res = await get<{ status: "pending" | "confirmed" | "failed" }>(
        `/trade/verify?signature=${encodeURIComponent(signature)}`,
      );
      return res.status;
    },
    positions: (wallet) => get(`/positions?wallet=${encodeURIComponent(wallet)}`),
    claimBuild: (req) => post("/claim/build", req),
  };
}
