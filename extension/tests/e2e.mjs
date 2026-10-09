/**
 * End-to-end test. Loads the built extension into Chromium, serves a fake x.com timeline with X-like markup,
 * and checks chips, observer behavior, the trade popup, the on/off switch, and the backend path.
 * Needs: pnpm build, a Chromium (npx playwright-core install chromium), and the frontend on http://localhost:3000.
 */
import { chromium } from "playwright-core";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, ok, extra = "") => {
  results.push(ok);
  console.log((ok ? "PASS " : "FAIL ") + name + (extra ? "  " + extra : ""));
};

function tweet(id, text, extra = {}) {
  const promoted = extra.promoted ? '<div data-testid="placementTracking"></div>' : "";
  return `
  <article data-testid="tweet" role="article" tabindex="0">
    <div><div>
      <div><a href="/someone/status/${id}"><time datetime="2026-10-09T10:00:00Z">2m</time></a></div>
      <div><div><div lang="en" data-testid="tweetText"><span>${text}</span></div></div>
        <div class="media" style="height:40px"></div>
      </div>
      <div><div role="group" aria-label="actions"><button>reply</button></div></div>
      ${promoted}
    </div></div>
  </article>`;
}

function page(bg, body) {
  return `<!doctype html><html lang="en"><body style="background:${bg};margin:0"><main data-testid="primaryColumn" id="feed">${body}</main></body></html>`;
}

const base = [
  tweet("1001", "SOL is going to rip past 300 before Halloween"),
  tweet("1002", "gm, coffee first"),
  tweet("1003", "ETH to 5k by year end, calling it"),
  tweet("1004", "BTC will print 100k soon"),
  tweet("1005", "SOL 300 sponsored", { promoted: true }),
].join("");

async function launch(dist) {
  const userDataDir = mkdtempSync(join(tmpdir(), "sorot-e2e-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ["--headless=new", `--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
  });
  let [sw] = context.serviceWorkers();
  if (!sw) sw = await context.waitForEvent("serviceworker");
  const extId = new URL(sw.url()).host;
  const errors = [];
  context.on("weberror", (e) => errors.push("weberror: " + e.error().message));
  return { context, sw, extId, errors };
}

const chipText = (p, tweetId) =>
  p.evaluate((id) => {
    const host = document.querySelector(`[data-sorot-chip="${id}"]`);
    if (!host) return null;
    const r = host.shadowRoot;
    return {
      title: r.querySelector(".title")?.textContent,
      brand: r.querySelector(".brand")?.textContent,
      yes: r.querySelector(".yes")?.textContent ?? null,
      no: r.querySelector(".no")?.textContent ?? null,
      see: r.querySelector(".see")?.textContent ?? null,
      demo: r.querySelector(".demo")?.textContent ?? null,
    };
  }, tweetId);

// ---------------------------------------------------------------- demo build
const demoDist = resolve(root, "dist");
{
  const { context, sw, extId, errors } = await launch(demoDist);
  const p = await context.newPage();
  await context.route("https://x.com/**", (route) => route.fulfill({ contentType: "text/html", body: page("#fff", base) }));
  await p.goto("https://x.com/home");
  await p.waitForSelector('[data-sorot-chip="1001"]', { timeout: 10000 });
  await p.waitForTimeout(600);

  check("chip on the SOL 300 tweet", (await chipText(p, "1001"))?.title === "Will SOL close above $300 on Oct 31?");
  const sol = await chipText(p, "1001");
  check("YES and NO odds come straight from the match", sol?.yes === "YES 0.62" && sol?.no === "NO 0.38");
  check("powered by Panta label", sol?.brand === "Powered by Panta");
  check("demo fixtures are labeled Demo", sol?.demo === "Demo");
  const eth = await chipText(p, "1003");
  check("missing price shows see odds, no numbers", eth?.see === "see odds" && eth?.yes === null && eth?.no === null);
  check("no chip without a match", (await chipText(p, "1002")) === null);
  check("no chip for a resolved or unknown market", (await chipText(p, "1004")) === null);
  check("no chip on promoted tweets", (await chipText(p, "1005")) === null);

  const placement = await p.evaluate(() => {
    const host = document.querySelector('[data-sorot-chip="1001"]');
    return {
      afterBody: !!host.previousElementSibling?.querySelector('[data-testid="tweetText"]'),
      beforeActions: !!host.nextElementSibling?.querySelector('[role="group"]'),
    };
  });
  check("chip sits between the tweet body and the action bar", placement.afterBody && placement.beforeActions);

  const cached = await sw.evaluate(() => chrome.storage.local.get(null));
  const ids = Object.keys(cached).filter((k) => k.startsWith("m:")).sort();
  check("results cached per tweet including no-match", ids.join() === "m:1001,m:1002,m:1003,m:1004", ids.join());

  // new tweets arriving while scrolling
  await p.evaluate((html) => document.getElementById("feed").insertAdjacentHTML("beforeend", html),
    tweet("1006", "SOL 300 or bust, I am telling you"));
  await p.waitForSelector('[data-sorot-chip="1006"]', { timeout: 5000 });
  check("observer picks up tweets added later", true);

  // X recycles DOM nodes: same article, different tweet
  await p.evaluate(() => {
    const articles = document.querySelectorAll("article");
    const swap = (a, id, text) => {
      a.querySelector("a").setAttribute("href", `/someone/status/${id}`);
      a.querySelector('[data-testid="tweetText"] span').textContent = text;
    };
    swap(articles[0], "1008", "gm again, tea this time");
    swap(articles[1], "1007", "solana 300 is the target");
  });
  await p.waitForSelector('[data-sorot-chip="1007"]', { timeout: 5000 });
  await p.waitForFunction(() => !document.querySelector('[data-sorot-chip="1001"]'), null, { timeout: 5000 });
  check("recycled article: stale chip removed and new chip drawn", true);

  // trade popup
  const popupPromise = context.waitForEvent("page");
  await p.locator('[data-sorot-chip="1006"] >> .yes').click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  const url = new URL(popup.url());
  check("YES click opens the trade page for that market", url.pathname === "/t/demo-sol-300", popup.url());
  check("tweet id and side travel in the url", url.searchParams.get("tweet") === "1006" && url.searchParams.get("side") === "yes");
  await popup.getByRole("heading", { name: /SOL close above/ }).waitFor({ timeout: 10000 });
  check("trade page loads with YES preselected", await popup.getByLabel("YES").isChecked());

  const pagesBefore = context.pages().length;
  await p.bringToFront();
  await p.locator('[data-sorot-chip="1006"] >> .no').click();
  await p.waitForTimeout(1500);
  check("second click reuses the popup window", context.pages().length === pagesBefore && new URL(popup.url()).searchParams.get("side") === "no", popup.url());
  await popup.close();

  // popup toggle
  const ext = await context.newPage();
  await ext.goto(`chrome-extension://${extId}/popup/popup.html`);
  check("popup explains demo mode", (await ext.locator("#mode").textContent()).includes("Demo matching"));
  await ext.getByRole("switch").uncheck();
  await p.bringToFront();
  await p.waitForFunction(() => document.querySelectorAll("[data-sorot-chip]").length === 0, null, { timeout: 5000 });
  check("turning chips off removes them", true);
  await ext.bringToFront();
  await ext.getByRole("switch").check();
  await p.bringToFront();
  await p.waitForSelector('[data-sorot-chip="1006"]', { timeout: 5000 });
  check("turning chips on brings them back from memory", true);
  await ext.close();

  // dark theme
  await p.evaluate(() => (document.body.style.background = "#000"));
  await p.evaluate((html) => document.getElementById("feed").insertAdjacentHTML("beforeend", html), tweet("1009", "SOL 300 again for the night owls"));
  await p.waitForSelector('[data-sorot-chip="1009"]', { timeout: 5000 });
  const dark = await p.evaluate(() => document.querySelector('[data-sorot-chip="1009"]').shadowRoot.querySelector(".chip").dataset.theme);
  check("chip follows X dark theme", dark === "dark", dark);

  // scroll cost: 120 tweets at once
  await p.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] });
  });
  const many = Array.from({ length: 120 }, (_, i) => tweet(String(3000 + i), `random chatter number ${i}`)).join("");
  await p.evaluate((html) => document.getElementById("feed").insertAdjacentHTML("beforeend", html), many);
  await p.waitForTimeout(2500);
  const long = await p.evaluate(() => window.__long);
  console.log("INFO long tasks while adding 120 tweets (ms):", JSON.stringify(long));
  check("no single long task over 150 ms while 120 tweets arrive", long.every((d) => d < 150));

  const swErrors = await sw.evaluate(() => 0).then(() => []);
  check("no extension errors", errors.length === 0 && swErrors.length === 0, errors.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- backend build
{
  const apiDist = resolve(root, "dist-api");
  const seen = { calls: 0, ids: [], clients: new Set(), maxBatch: 0 };
  const server = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/match") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const { tweets } = JSON.parse(body);
        seen.calls++;
        seen.maxBatch = Math.max(seen.maxBatch, tweets.length);
        seen.clients.add(req.headers["x-sorot-client"]);
        tweets.forEach((t) => seen.ids.push(t.tweetId));
        const out = tweets.map((t) => ({
          tweetId: t.tweetId,
          match: /sol/i.test(t.text) && /300/.test(t.text)
            ? { marketId: "live-sol-300", title: "Will SOL close above $300 on Oct 31?", yesPrice: "0.55", noPrice: "0.45", status: "open" }
            : /btc/i.test(t.text)
              ? { marketId: "old-btc", title: "Old market", yesPrice: "0.5", noPrice: "0.5", status: "resolved" }
              : null,
        }));
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ results: out }));
      });
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise((r) => server.listen(4010, "127.0.0.1", r));

  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: root,
    stdio: "ignore",
    env: { ...process.env, OUT_DIR: "dist-api", VITE_API_URL: "http://127.0.0.1:4010" },
  });

  const { context, errors } = await launch(apiDist);
  const manifest = JSON.parse((await import("node:fs")).readFileSync(join(apiDist, "manifest.json"), "utf8"));
  check("manifest host access is x.com plus the backend only", manifest.host_permissions.join() === "https://x.com/*,http://127.0.0.1:4010/*", manifest.host_permissions.join());

  const p = await context.newPage();
  const many = Array.from({ length: 45 }, (_, i) => tweet(String(5000 + i), `filler tweet ${i}`)).join("");
  await context.route("https://x.com/**", (route) => route.fulfill({ contentType: "text/html", body: page("#fff", base + many) }));
  await p.goto("https://x.com/home");
  await p.waitForSelector('[data-sorot-chip="1001"]', { timeout: 10000 });
  await p.waitForTimeout(1500);

  const live = await chipText(p, "1001");
  check("backend match renders without the Demo label", live?.yes === "YES 0.55" && live?.demo === null);
  check("backend market that is not open never gets a chip", (await chipText(p, "1004")) === null);
  check("each tweet was sent to the backend once", new Set(seen.ids).size === seen.ids.length, `${seen.ids.length} sent`);
  check("batches never exceed 20 tweets", seen.maxBatch <= 20, `max ${seen.maxBatch}`);
  check("one stable install id header", seen.clients.size === 1 && [...seen.clients][0]?.length > 10);

  // reload the page: cache answers, backend sees nothing new
  const callsBefore = seen.calls;
  await p.reload();
  await p.waitForSelector('[data-sorot-chip="1001"]', { timeout: 10000 });
  await p.waitForTimeout(1000);
  check("after reload the 24 h cache answers, backend is not called again", seen.calls === callsBefore, `${seen.calls} vs ${callsBefore}`);
  check("no extension errors (backend build)", errors.length === 0, errors.join(" | "));

  await context.close();
  server.close();
}

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
