/**
 * Post-deploy check. Run it against the deployed site:
 *   node tests/deploy-check.mjs https://your-app.vercel.app
 * It only reads and never signs anything. Items marked WARN are not failures but mean you are not fully live yet.
 */
const base = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: node tests/deploy-check.mjs https://your-app.vercel.app");
  process.exit(2);
}

let failed = 0;
const ok = (name, pass, detail = "") => {
  if (!pass) failed++;
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? "  " + detail : ""}`);
};
const warn = (name, pass, detail = "") => console.log(`${pass ? "PASS" : "WARN"} ${name}${detail ? "  " + detail : ""}`);

async function call(path, init) {
  try {
    const res = await fetch(base + path, { redirect: "manual", ...init });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not json
    }
    return { status: res.status, json, text, headers: res.headers };
  } catch (e) {
    return { status: 0, json: null, text: String(e.message), headers: new Headers() };
  }
}

// pages
{
  const landing = await call("/");
  ok("landing page loads", landing.status === 200 && /Sorot/.test(landing.text), `status ${landing.status}`);
  ok("positions page loads", (await call("/positions")).status === 200);
  const open = await call("/t/open");
  ok("/t/open redirects to an open market, or says none is open", open.status === 307 || open.status === 200, `status ${open.status} ${open.headers.get("location") ?? ""}`);
  ok("an unknown page is a 404", (await call("/definitely-not-a-page")).status === 404);
}

// the API and what it is connected to
// A first match request also triggers the lazy catalog sync, so health shows real numbers afterwards.
await call("/api/match", {
  method: "POST",
  headers: { "content-type": "application/json", "x-sorot-client": "deploy-check-0001" },
  body: JSON.stringify({ tweets: [{ tweetId: "1", text: "gm", lang: "en" }] }),
});
const health = await call("/api/health");
ok("health responds", health.status === 200 && health.json?.ok === true, `status ${health.status}`);
if (health.json) {
  const h = health.json;
  warn("Panta key is live (pk_live_), not sandbox or fixtures", h.panta === "live", `panta=${h.panta}`);
  warn("database is Postgres, not in-memory", h.database === "postgres", `database=${h.database}`);
  warn("verifier is an LLM, not the local heuristic", h.verifier && h.verifier !== "heuristic-v1", `verifier=${h.verifier}`);
  ok("catalog has markets after the first request", h.markets > 0, `markets=${h.markets} open=${h.open} indexed=${h.indexed}`);
  warn("at least one open market is indexed", h.indexed > 0, `indexed=${h.indexed}`);
  ok("health leaks no secrets", !/pk_(live|test)_|postgres(ql)?:\/\/|sk-ant|api[_-]?key/i.test(health.text));
}

// things that must be locked down in production
{
  const cron = await call("/api/cron/sync");
  ok("catalog sync refuses requests without the secret", cron.status === 401, `status ${cron.status}`);
  const sim = await call("/api/health", { headers: { "x-sorot-sim": "rate-limit" } });
  ok("failure simulation is off", sim.status === 200);
  const wallet = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
  const quote = await call("/api/trade/quote", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sorot-sim": "rate-limit", "x-sorot-client": "deploy-check-0002" },
    body: JSON.stringify({ marketId: "nope", side: "yes", amountUsdc: "5", wallet }),
  });
  ok("a simulated failure header changes nothing (still 404, not 429)", quote.status === 404, `status ${quote.status}`);
  const bad = await call("/api/trade/quote", { method: "POST", headers: { "content-type": "application/json" }, body: "{nope" });
  ok("invalid JSON is rejected cleanly", bad.status === 400 && bad.json?.error?.code === "INVALID_PARAMS", `status ${bad.status}`);
}

console.log(failed === 0 ? "\nDeploy check passed." : `\n${failed} check(s) failed.`);
process.exit(failed ? 1 : 0);
