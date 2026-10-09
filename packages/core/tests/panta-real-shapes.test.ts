import assert from "node:assert/strict";
import { createServer, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { HttpPantaClient } from "../src/panta/http-client.ts";
import { averagePrice, normalizeMarket } from "../src/panta/normalize.ts";

/**
 * Responses captured from the Panta sandbox (pk_test_ key) on 2026-10-09, with long strings shortened.
 * They guard against the normalizers drifting away from what Panta really sends.
 */
const DISCLAIMER = "Test mode: this response uses sandbox fixtures and does not access Solana mainnet.";
const MARKET_ID = "TestMarket1111111111111111111111111111111";
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

const sandboxMarket = {
  marketId: MARKET_ID,
  category: "crypto",
  title: "Sandbox test market",
  description: "Fixture market for pk_test_ keys. Not on mainnet.",
  images: [],
  phase: "primary",
  marketType: "standard",
  startTime: "2026-01-01T00:00:00Z",
  endTime: "2026-12-31T23:59:59Z",
  resolutionTime: "2027-01-01T00:00:00Z",
  region: "Global",
  resolved: false,
  status: "primary",
  volumeUsdc: "0.00",
  campaignId: null,
  createdByPartner: false,
  yesPrice: "0.50",
  noPrice: "0.50",
  primaryYesPrice: "0.50",
  primaryNoPrice: "0.50",
  secondaryYesPrice: null,
  secondaryNoPrice: null,
};

const routes: Record<string, unknown> = {
  "GET /api/v1/markets/?limit=50": { items: [sandboxMarket], nextCursor: null, disclaimer: DISCLAIMER },
  [`GET /api/v1/markets/${MARKET_ID}/`]: { ...sandboxMarket, creatorAddress: "TestWallet1", onChain: null, disclaimer: DISCLAIMER },
  [`GET /api/v1/markets/${MARKET_ID}/trades/`]: { marketId: MARKET_ID, items: [], disclaimer: DISCLAIMER },
  [`GET /api/v1/positions/?wallet=${WALLET}`]: { wallet: WALLET, positions: [], disclaimer: DISCLAIMER },
  "POST /api/v1/primaryorderquote/": {
    quoteId: "qt_sandbox_test", marketId: MARKET_ID, wallet: WALLET, side: "YES",
    amountUsdc: "1.00", shares: "2.00", feeUsdc: "0.00", expiresAt: "2099-01-01T00:00:00Z", disclaimer: DISCLAIMER,
  },
  "POST /api/v1/primaryorderbuild/": {
    orderId: "ord_sandbox_test", quoteId: "qt_sandbox_test", wallet: WALLET, instructions: [],
    recentBlockhash: "SandboxBlockhash11111111111111111111111111111", lastValidBlockHeight: 0, disclaimer: DISCLAIMER,
  },
  "POST /api/v1/primaryorderverify/": { orderId: "ord_sandbox_test", status: "confirmed", signature: "sandboxSignature1", disclaimer: DISCLAIMER },
  "POST /api/v1/claim/build/": {
    wallet: WALLET, marketId: MARKET_ID, outcome: "YES", winningShares: "0", instructions: [], derived: {},
    recentBlockhash: "SandboxBlockhash11111111111111111111111111111", lastValidBlockHeight: 0, disclaimer: DISCLAIMER,
  },
};

async function withSandbox(run: (base: string) => Promise<void>) {
  const server = createServer((req, res: ServerResponse) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = routes[`${req.method} ${req.url}`];
      res.writeHead(body ? 200 : 404, { "content-type": "application/json" });
      res.end(JSON.stringify(body ?? {}));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

const NOW = Date.parse("2026-10-09T12:00:00Z");

describe("real Panta shapes (sandbox captures)", () => {
  it("reads the catalog, detail, trades and positions", async () => {
    await withSandbox(async (base) => {
      const client = new HttpPantaClient({ apiKey: "pk_test_abc", baseUrl: base, sleep: async () => {} });
      const list = await client.listMarkets();
      assert.equal(list.length, 1);
      assert.equal(list[0].id, MARKET_ID);
      assert.equal(list[0].title, "Sandbox test market");
      assert.equal(list[0].status, "open");
      assert.equal(list[0].yesPrice, "0.50");
      assert.equal(list[0].category, "crypto");

      const detail = await client.getMarket(MARKET_ID);
      assert.equal(detail.status, "open");
      assert.equal(detail.noPrice, "0.50");

      assert.deepEqual(await client.recentTrades(MARKET_ID), []);
      assert.deepEqual(await client.positions(WALLET), []);
    });
  });

  it("flags a pk_test_ key as sandbox and a pk_live_ key as live", () => {
    assert.equal(new HttpPantaClient({ apiKey: "pk_test_x" }).source, "sandbox");
    assert.equal(new HttpPantaClient({ apiKey: "pk_live_x" }).source, "live");
  });

  it("normalizes a quote and derives the average price Panta does not send", async () => {
    await withSandbox(async (base) => {
      const client = new HttpPantaClient({ apiKey: "pk_test_abc", baseUrl: base, sleep: async () => {} });
      const q = await client.quote({ marketId: MARKET_ID, side: "yes", amountUsdc: "1.00", wallet: WALLET });
      assert.equal(q.quoteId, "qt_sandbox_test");
      assert.equal(q.shares, "2.00");
      assert.equal(q.avgPrice, "0.50");
      assert.equal(q.feeUsdc, "0.00");
      assert.equal(q.side, "yes");
      assert.equal(q.expiresAt, Date.parse("2099-01-01T00:00:00Z"));
    });
  });

  it("normalizes build, verify and claim build", async () => {
    await withSandbox(async (base) => {
      const client = new HttpPantaClient({ apiKey: "pk_test_abc", baseUrl: base, sleep: async () => {} });
      const built = await client.build({ quoteId: "qt_sandbox_test", maxSlippageBps: 100, wallet: WALLET });
      assert.equal(built.quoteId, "qt_sandbox_test");
      assert.deepEqual(built.instructions, []);
      assert.match(built.recentBlockhash, /^SandboxBlockhash/);

      assert.equal(await client.verify("sig"), "confirmed");

      const claim = await client.claimBuild({ wallet: WALLET, marketId: MARKET_ID });
      assert.equal(claim.quoteId, `claim:${MARKET_ID}`);
      assert.match(claim.recentBlockhash, /^SandboxBlockhash/);
    });
  });
});

describe("market status", () => {
  const status = (over: Record<string, unknown>) =>
    normalizeMarket({ ...sandboxMarket, ...over }, NOW)?.status;

  it("only a primary-phase market that has not ended is open", () => {
    assert.equal(status({}), "open");
    assert.equal(status({ phase: "secondary", status: "secondary" }), "closed");
    assert.equal(status({ phase: "cancelled", status: "cancelled" }), "closed");
    assert.equal(status({ phase: "resolved", status: "resolved", resolved: true }), "resolved");
    assert.equal(status({ resolved: true }), "resolved");
    assert.equal(status({ phase: "mystery", status: "mystery" }), "closed");
  });

  it("closes a market whose end time has passed, in ISO text or Unix seconds", () => {
    assert.equal(status({ endTime: "2026-10-01T00:00:00Z" }), "closed");
    assert.equal(status({ endTime: Math.floor(Date.parse("2026-10-01T00:00:00Z") / 1000) }), "closed");
    assert.equal(status({ endTime: Math.floor(Date.parse("2026-12-01T00:00:00Z") / 1000) }), "open");
  });

  it("keeps null prices null, as the catalog does for most markets", () => {
    const m = normalizeMarket({ ...sandboxMarket, yesPrice: null, noPrice: null }, NOW);
    assert.equal(m?.yesPrice, null);
    assert.equal(m?.noPrice, null);
  });
});

describe("average price", () => {
  it("is amount divided by shares with integer math", () => {
    assert.equal(averagePrice("1.00", "2.00"), "0.50");
    assert.equal(averagePrice("5.00", "8.064516"), "0.62");
    assert.equal(averagePrice("10.00", "15.5"), "0.6451");
    assert.equal(averagePrice("1.00", "0"), "0");
    assert.equal(averagePrice("x", "2"), "0");
  });
});
