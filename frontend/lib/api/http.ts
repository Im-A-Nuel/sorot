import { ApiError, type ApiErrorCode, type SorotApi } from "./types";

/** Client for the Sorot API (the route handlers under /api). Contract: docs/SCHEMA.md. */

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

/** `?sim=rate-limit` on a page URL asks the server to simulate a failure. The server ignores it in production. */
function simHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sim = new URLSearchParams(window.location.search).get("sim");
  return sim && /^[a-z-]{1,24}$/.test(sim) ? { "x-sorot-sim": sim } : {};
}

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...simHeader(), ...init?.headers },
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
    meta: async () => ({ demo: (await get<{ demo: boolean }>("/health")).demo }),
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
