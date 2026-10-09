import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { syncCatalog } from "../src/catalog.ts";
import { HttpPantaClient } from "../src/panta/http-client.ts";
import { SlidingWindowLimiter } from "../src/panta/limiter.ts";
import { isAllowedPath, routes } from "../src/panta/routes.ts";
import { MemoryStore } from "../src/store.ts";
import type { PantaClient } from "../src/panta/client.ts";
import type { CatalogMarket } from "../src/types.ts";

type Seen = { method: string; url: string; headers: IncomingMessage["headers"]; body: unknown };

async function withServer(
  handler: (req: Seen, res: ServerResponse, n: number) => void,
  run: (base: string, seen: Seen[]) => Promise<void>,
) {
  const seen: Seen[] = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const entry: Seen = { method: req.method ?? "", url: req.url ?? "", headers: req.headers, body: raw ? JSON.parse(raw) : null };
      seen.push(entry);
      handler(entry, res, seen.length);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}/api/v1`, seen);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const json = (res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
};

const instantSleep = async () => {};

describe("panta routes", () => {
  it("keeps the trailing slash and encodes ids", () => {
    assert.equal(routes.markets(), "/markets/");
    assert.equal(routes.market("a b"), "/markets/a%20b/");
    assert.equal(routes.orderQuote(), "/primaryorderquote/");
  });

  it("only allows the known route shapes", () => {
    assert.equal(isAllowedPath("/markets/"), true);
    assert.equal(isAllowedPath("/markets/abc/"), true);
    assert.equal(isAllowedPath("/positions/?wallet=x"), true);
    assert.equal(isAllowedPath("/admin/"), false);
    assert.equal(isAllowedPath("/markets/abc/secret/"), false);
    assert.equal(isAllowedPath("/markets"), false);
  });
});

describe("limiter", () => {
  it("waits for a free slot and refuses long waits", async () => {
    let t = 0;
    const slept: number[] = [];
    const limiter = new SlidingWindowLimiter(2, 1000, () => t, async (ms) => { slept.push(ms); t += ms; });
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    assert.deepEqual(slept, [1000]);

    const tight = new SlidingWindowLimiter(1, 60_000, () => t, async () => {});
    await tight.acquire();
    await assert.rejects(() => tight.acquire(1000), { code: "RATE_LIMITED" });
  });
});

describe("http panta client", () => {
  it("sends the key, attribution id and trailing-slash routes", async () => {
    await withServer(
      (_req, res) => json(res, 200, { quoteId: "q1", shares: "10.5", avgPrice: "0.62", fee: "0.05", amount: "5.00" }),
      async (base, seen) => {
        const client = new HttpPantaClient({ apiKey: "pk_test_abc", baseUrl: base, attributionId: "sorot-1", sleep: instantSleep });
        const q = await client.quote({ marketId: "m1", side: "yes", amountUsdc: "5.00", wallet: "W" });
        assert.equal(q.quoteId, "q1");
        assert.equal(q.shares, "10.5");
        assert.equal(seen[0].method, "POST");
        assert.equal(seen[0].url, "/api/v1/primaryorderquote/");
        assert.equal(seen[0].headers["x-api-key"], "pk_test_abc");
        assert.equal(seen[0].headers["x-user-id"], "sorot-1");
        assert.deepEqual(seen[0].body, { marketId: "m1", side: "YES", amount: "5.00", wallet: "W", userId: "sorot-1" });
      },
    );
  });

  it("retries on 429 using Retry-After, then succeeds", async () => {
    await withServer(
      (_req, res, n) => (n < 3 ? json(res, 429, {}, { "retry-after": "2" }) : json(res, 200, { status: "confirmed" })),
      async (base, seen) => {
        const slept: number[] = [];
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: async (ms) => { slept.push(ms); } });
        assert.equal(await client.verify("sig"), "confirmed");
        assert.equal(seen.length, 3);
        assert.deepEqual(slept, [2000, 2000]);
      },
    );
  });

  it("gives up after the retry budget with RATE_LIMITED", async () => {
    await withServer(
      (_req, res) => json(res, 429, {}),
      async (base) => {
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: instantSleep, maxRetries: 1 });
        await assert.rejects(() => client.verify("sig"), { code: "RATE_LIMITED" });
      },
    );
  });

  it("maps Panta error codes to Sorot error codes", async () => {
    await withServer(
      (req, res) =>
        req.url.includes("claim")
          ? json(res, 400, { error: { code: "NOT_CLAIMABLE", message: "nope" } })
          : json(res, 404, {}),
      async (base) => {
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: instantSleep });
        await assert.rejects(() => client.claimBuild({ wallet: "W", marketId: "m" }), { code: "NOT_CLAIMABLE" });
        await assert.rejects(() => client.getMarket("missing"), { code: "NOT_FOUND" });
      },
    );
  });

  it("turns an unreachable Panta into PANTA_UPSTREAM", async () => {
    const client = new HttpPantaClient({ apiKey: "k", baseUrl: "http://127.0.0.1:1/api/v1", sleep: instantSleep });
    await assert.rejects(() => client.getMarket("m"), { code: "PANTA_UPSTREAM" });
  });

  it("follows catalog pages and normalizes markets, keeping missing prices null", async () => {
    await withServer(
      (req, res) =>
        req.url.includes("cursor=p2")
          ? json(res, 200, { results: [{ id: "m3", title: "Third", status: "closed" }] })
          : json(res, 200, {
              results: [
                { id: "m1", title: "", status: "active", prices: { yes: "0.4", no: "0.6" } },
                { id: "m2", title: "Second", status: "open", yesPrice: null, noPrice: null },
                { id: "bad id!", title: "ignored" },
              ],
              next: "p2",
            }),
      async (base) => {
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: instantSleep });
        const list = await client.listMarkets();
        assert.deepEqual(list.map((m) => m.id), ["m1", "m2", "m3"]);
        assert.equal(list[0].title, "");
        assert.equal(list[0].yesPrice, "0.4");
        assert.equal(list[1].yesPrice, null);
        assert.equal(list[2].status, "closed");
      },
    );
  });

  it("treats an unknown market status as not tradable", async () => {
    await withServer(
      (_req, res) => json(res, 200, { id: "m1", title: "T", status: "weird" }),
      async (base) => {
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: instantSleep });
        assert.equal((await client.getMarket("m1")).status, "closed");
      },
    );
  });

  it("does not report claim quote ids as quote ids", async () => {
    await withServer(
      (_req, res) => json(res, 200, {}),
      async (base, seen) => {
        const client = new HttpPantaClient({ apiKey: "k", baseUrl: base, sleep: instantSleep });
        await client.reportTrade({ signature: "s", wallet: "W", marketId: "m", quoteId: "claim:m" });
        assert.equal(seen[0].url, "/api/v1/trades/");
        assert.equal((seen[0].body as Record<string, unknown>).quoteId, undefined);
      },
    );
  });
});

describe("catalog sync", () => {
  const m = (id: string, title: string, status: CatalogMarket["status"] = "open"): CatalogMarket => ({
    id, titleRaw: null, title, category: null, status, yesPrice: null, noPrice: null, volumeUsdc: null, url: "u", updatedAt: 0,
  });

  it("hydrates empty titles from market detail and counts them", async () => {
    const panta = {
      source: "live",
      listMarkets: async () => [m("a", ""), m("b", "Has title"), m("c", ""), m("d", "", "closed")],
      getMarket: async (id: string) => m(id, id === "a" ? "Hydrated A" : ""),
    } as unknown as PantaClient;
    const store = new MemoryStore();
    const stats = await syncCatalog(panta, store);
    assert.deepEqual(stats, { total: 4, open: 3, emptyTitles: 3, hydrated: 1, stillEmpty: 2 });
    assert.equal((await store.getMarket("a"))?.title, "Hydrated A");
  });

  it("keeps a hydrated title when a later sync returns an empty one", async () => {
    const store = new MemoryStore();
    await store.upsertMarkets([m("a", "Kept title")]);
    const panta = { source: "live", listMarkets: async () => [m("a", "")], getMarket: async () => m("a", "") } as unknown as PantaClient;
    await syncCatalog(panta, store);
    assert.equal((await store.getMarket("a"))?.title, "Kept title");
  });
});
