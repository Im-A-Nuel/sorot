/**
 * Contract test for the API route handlers. Run against a running server:
 *   pnpm --filter frontend dev   (in one terminal)
 *   pnpm --filter frontend test:api
 * Uses a unique client id per run, so the per-client rate limit does not leak between runs.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const run = Math.random().toString(36).slice(2, 10);
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";

let passed = 0;
let failed = 0;
const check = (name, ok, extra = "") => {
  ok ? passed++ : failed++;
  console.log((ok ? "PASS " : "FAIL ") + name + (!ok && extra ? "  " + extra : ""));
};

async function call(method, path, { body, headers = {}, client = `t-${run}-default` } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", "x-sorot-client": client, ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not json
  }
  return { status: res.status, json, headers: res.headers };
}

const code = (r) => r.json?.error?.code;

// health
{
  const r = await call("GET", "/api/health");
  check("health is 200 and says demo with fixtures", r.status === 200 && r.json.demo === true && r.json.panta === "fixture");
  check("health never leaks secrets", !/key|secret|postgres:\/\/|token/i.test(JSON.stringify(r.json).replace(/"database":"(memory|postgres)"/, "")));
  check("responses are not cached", r.headers.get("cache-control") === "no-store");
}

// match
{
  const ok = await call("POST", "/api/match", {
    body: { tweets: [{ tweetId: "1", text: "SOL is going to rip past 300", lang: "en" }, { tweetId: "2", text: "gm", lang: "en" }] },
  });
  check("match returns a labeled demo market and null for no match", ok.status === 200 && ok.json.results[0].match?.demo === true && ok.json.results[1].match === null);
  check("match rejects a non-numeric tweet id", code(await call("POST", "/api/match", { body: { tweets: [{ tweetId: "abc", text: "x", lang: "en" }] } })) === "INVALID_PARAMS");
  check("match rejects an empty list", code(await call("POST", "/api/match", { body: { tweets: [] } })) === "INVALID_PARAMS");
  const many = Array.from({ length: 21 }, (_, i) => ({ tweetId: String(i + 1), text: "x", lang: "en" }));
  check("match rejects more than 20 tweets", code(await call("POST", "/api/match", { body: { tweets: many } })) === "INVALID_PARAMS");
  check("match rejects invalid JSON", code(await call("POST", "/api/match", { body: "{nope" })) === "INVALID_PARAMS");
  check("match rejects an oversized body", code(await call("POST", "/api/match", { body: JSON.stringify({ tweets: [{ tweetId: "1", text: "x".repeat(70_000), lang: "en" }] }) })) === "INVALID_PARAMS");
}

// markets
{
  const m = await call("GET", "/api/markets/demo-sol-300");
  check("market detail", m.status === 200 && m.json.title.startsWith("Will SOL") && m.json.yesPrice === "0.62" && m.json.demo === true);
  check("market with no price keeps nulls", (await call("GET", "/api/markets/demo-eth-5k")).json.yesPrice === null);
  check("unknown market is 404", (await call("GET", "/api/markets/nope")).status === 404);
  check("bad market id is 400", (await call("GET", "/api/markets/bad%20id")).status === 400);
  const t = await call("GET", "/api/markets/demo-sol-300/trades");
  check("recent trades is a list", t.status === 200 && Array.isArray(t.json) && t.json.length > 0);
}

// trading
{
  const q = await call("POST", "/api/trade/quote", { body: { marketId: "demo-sol-300", side: "yes", amountUsdc: "12.5", wallet: WALLET, tweetId: "1840" } });
  check("quote normalizes the amount", q.status === 200 && q.json.amountUsdc === "12.50" && q.json.avgPrice === "0.62" && q.json.expiresAt > Date.now());

  const b = await call("POST", "/api/trade/build", { body: { quoteId: q.json.quoteId, maxSlippageBps: 100, wallet: WALLET } });
  check("build returns instructions and a blockhash", b.status === 200 && Array.isArray(b.json.instructions) && typeof b.json.recentBlockhash === "string");

  const s = await call("POST", "/api/trade/submit", { body: { signature: "demo-abc12345", wallet: WALLET, marketId: "demo-sol-300", quoteId: q.json.quoteId } });
  check("submit is accepted", s.status === 200 && s.json.ok === true);
  check("verify reports confirmed", (await call("GET", "/api/trade/verify?signature=demo-abc12345")).json.status === "confirmed");

  check("quote rejects a bad wallet", code(await call("POST", "/api/trade/quote", { body: { marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: "short" } })) === "INVALID_PARAMS");
  check("quote rejects bad amounts", code(await call("POST", "/api/trade/quote", { body: { marketId: "demo-sol-300", side: "yes", amountUsdc: "1e3", wallet: WALLET } })) === "INVALID_PARAMS");
  check("quote rejects a bad side", code(await call("POST", "/api/trade/quote", { body: { marketId: "demo-sol-300", side: "maybe", amountUsdc: "5", wallet: WALLET } })) === "INVALID_PARAMS");
  const closed = await call("POST", "/api/trade/quote", { body: { marketId: "demo-btc-100k", side: "yes", amountUsdc: "5", wallet: WALLET } });
  check("a resolved market cannot be quoted", closed.status === 409 && code(closed) === "MARKET_CLOSED");
  check("an unknown market quote is 404", (await call("POST", "/api/trade/quote", { body: { marketId: "nope", side: "yes", amountUsdc: "5", wallet: WALLET } })).status === 404);
  const expired = await call("POST", "/api/trade/build", { body: { quoteId: "demo-q-1-abc", maxSlippageBps: 100, wallet: WALLET } });
  check("an expired quote cannot be built", expired.status === 409 && code(expired) === "QUOTE_EXPIRED");
  check("submit rejects a malformed signature", code(await call("POST", "/api/trade/submit", { body: { signature: "x", wallet: WALLET, marketId: "demo-sol-300" } })) === "INVALID_PARAMS");
  check("verify rejects a missing signature", code(await call("GET", "/api/trade/verify")) === "INVALID_PARAMS");
}

// failure simulation (development only)
{
  const rl = await call("POST", "/api/trade/quote", { headers: { "x-sorot-sim": "rate-limit" }, body: { marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: WALLET } });
  check("simulated rate limit is 429 with Retry-After", rl.status === 429 && code(rl) === "RATE_LIMITED" && Number(rl.headers.get("retry-after")) >= 1);
  const q = await call("POST", "/api/trade/quote", { body: { marketId: "demo-sol-300", side: "yes", amountUsdc: "5", wallet: WALLET } });
  const sl = await call("POST", "/api/trade/build", { headers: { "x-sorot-sim": "slippage" }, body: { quoteId: q.json.quoteId, maxSlippageBps: 100, wallet: WALLET } });
  check("simulated slippage is 409", sl.status === 409 && code(sl) === "SLIPPAGE");
  const me = await call("GET", "/api/markets/demo-sol-300", { headers: { "x-sorot-sim": "market-error" } });
  check("simulated upstream failure is 502", me.status === 502 && code(me) === "PANTA_UPSTREAM");
}

// positions and claims
{
  const wallet = "7xKXq9mPLw3fRZ4bHnTdAuYcVe2sGjQ8NpWk1mZrB4aE";
  const before = await call("GET", `/api/positions?wallet=${wallet}`);
  check("positions list with a claimable flag", before.status === 200 && before.json.some((p) => p.claimable));
  check("positions reject a bad wallet", code(await call("GET", "/api/positions?wallet=short")) === "INVALID_PARAMS");
  const nope = await call("POST", "/api/claim/build", { body: { wallet, marketId: "demo-fed-cut" } });
  check("a lost position cannot be claimed", nope.status === 409 && code(nope) === "NOT_CLAIMABLE");
  const claimable = before.json.find((p) => p.claimable);
  const built = await call("POST", "/api/claim/build", { body: { wallet, marketId: claimable.marketId } });
  check("claim build keeps a claim: quote id", built.status === 200 && built.json.quoteId === `claim:${claimable.marketId}`);
  await call("POST", "/api/trade/submit", { body: { signature: "demo-claim9999", wallet, marketId: claimable.marketId, quoteId: built.json.quoteId } });
  const after = await call("GET", `/api/positions?wallet=${wallet}`);
  check("a claimed position is no longer claimable", after.json.find((p) => p.marketId === claimable.marketId).status === "claimed");
}

// rate limiting
{
  const client = `t-${run}-flood`;
  const results = [];
  for (let i = 0; i < 33; i++) {
    results.push((await call("POST", "/api/trade/quote", { client, body: { marketId: "nope", side: "yes", amountUsdc: "5", wallet: WALLET } })).status);
  }
  check("the 31st quote in a minute is rate limited", results.slice(0, 30).every((s) => s === 404) && results.slice(30).every((s) => s === 429), results.join(","));
  const other = await call("POST", "/api/trade/quote", { client: `t-${run}-other`, body: { marketId: "nope", side: "yes", amountUsdc: "5", wallet: WALLET } });
  check("another client is not affected", other.status === 404);
}

// catalog sync
{
  const r = await call("GET", "/api/cron/sync");
  check("catalog sync works in development without a secret", r.status === 200 && r.json.stats?.total === 3 && r.json.stats.emptyTitles === 0, JSON.stringify(r.json));
}

console.log(`\n${passed}/${passed + failed} passed`);
process.exit(failed ? 1 : 0);
