/**
 * Captures sharp screenshots of each UI state of Sorot, plus the position of the elements a cursor would touch,
 * for use as raw material in a video editor (Remotion). Run it against a deployed site:
 *   OUT_DIR=dist-prod node scripts/build.mjs --api https://<domain>/api
 *   node scripts/capture-demo-stills.mjs https://<domain> --out <folder>
 *
 * Why stills instead of a screen recording: Playwright records video at CSS pixel size, so text is soft once the
 * clip is enlarged. Screenshots can be taken at 2-3x device scale and are animated in the editor.
 *
 * What is real and what is not:
 * - Real: the landing page, the Sorot API, the Panta market, odds and quote, the extension code.
 * - Simulated: the X timeline (a local page that uses X's markup, because no X login is used) and the wallet
 *   (a stand-in for Phantom). Nothing is ever approved, signed or sent.
 */
import { chromium } from "playwright-core";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = (process.argv[2] ?? "").replace(/\/+$/, "");
const outIdx = process.argv.indexOf("--out");
if (!/^https:\/\//.test(site) || outIdx === -1) {
  console.error("Usage: node scripts/capture-demo-stills.mjs https://your-app.vercel.app --out <folder>");
  process.exit(2);
}
const out = resolve(process.argv[outIdx + 1]);
mkdirSync(out, { recursive: true });
const here = dirname(fileURLToPath(import.meta.url));
const ext = resolve(here, "..", process.env.OUT_DIR ?? "dist-prod");
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const meta = {};

const rect = async (locator) => {
  const b = await locator.boundingBox();
  return b && { x: Math.round(b.x * 10) / 10, y: Math.round(b.y * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 };
};
const shot = (page, name, opts = {}) => page.screenshot({ path: join(out, name), ...opts });

const browser = await chromium.launch({ headless: true });

// 1. Landing page, one image per section, at 2x.
{
  const VIEW = { width: 1440, height: 810 };
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(site, { waitUntil: "networkidle" });
  await pause(1500);
  await shot(page, "landing-hero.png");
  meta.landing = { viewport: VIEW, scale: 2, sections: {} };
  for (const id of ["how-it-works", "matching", "security", "panta", "install", "faq"]) {
    const el = page.locator("#" + id);
    await el.scrollIntoViewIfNeeded();
    await pause(1100); // lets the section's one fade finish
    await el.screenshot({ path: join(out, `landing-${id}.png`) });
    const b = await rect(el);
    meta.landing.sections[id] = { w: b.w, h: b.h };
    console.log("landing", id);
  }
  await ctx.close();
}

// 2. The extension on a timeline: the same page without and with the chip.
{
  const VIEW = { width: 720, height: 800 };
  const userDataDir = mkdtempSync(join(tmpdir(), "sorot-ext-"));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: VIEW,
    deviceScaleFactor: 3,
    args: ["--headless=new", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  if (!ctx.serviceWorkers().length) await ctx.waitForEvent("serviceworker");
  const tweet = (id, handle, text) => `
  <article data-testid="tweet" role="article" tabindex="0" style="border-bottom:1px solid #eff3f4;padding:14px 18px;display:flex;gap:12px;font-family:system-ui,sans-serif;color:#0f1419">
    <div style="width:42px;height:42px;border-radius:50%;background:#cfd9de;flex:none"></div>
    <div style="min-width:0;flex:1">
      <div><b>Sample account</b> <span style="color:#536471">${handle} &middot; <a href="/${handle.slice(1)}/status/${id}" style="color:#536471;text-decoration:none"><time datetime="2026-10-11T10:00:00Z">2m</time></a></span></div>
      <div data-testid="tweetText" lang="en" style="margin-top:4px;font-size:16px;line-height:1.4"><span>${text}</span></div>
      <div role="group" aria-label="actions" style="height:30px;color:#536471;font-size:13px;margin-top:8px">reply &middot; repost &middot; like</div>
    </div>
  </article>`;
  // A new round means new tweet ids, which sidesteps the extension's 24 h per-tweet cache.
  const timeline = (n) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Home</title></head><body style="margin:0;background:#fff"><main data-testid="primaryColumn" style="max-width:640px;margin:0 auto;border-left:1px solid #eff3f4;border-right:1px solid #eff3f4;min-height:100vh">
    <div style="padding:16px 18px;font:700 20px system-ui;border-bottom:1px solid #eff3f4;position:sticky;top:0;background:#fffe">Home</div>
    ${tweet(`${n}1`, "@sample_a", "gm, coffee first")}
    ${tweet(`${n}2`, "@sample_b", "Bitcoin will make a new all time high before the end of the year")}
    ${tweet(`${n}3`, "@sample_c", "Slow day. Going outside.")}
    ${tweet(`${n}4`, "@sample_d", "Solana is going to rip past 300 before Halloween")}
  </main></body></html>`;
  let round = 1;
  await ctx.route("https://x.com/**", (route) => route.fulfill({ contentType: "text/html", body: timeline(round) }));
  await fetch(site + "/api/match", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sorot-client": "capture-warmup" },
    body: JSON.stringify({ tweets: [{ tweetId: "1", text: "bitcoin new all time high", lang: "en" }] }),
  }).catch(() => {});

  // Panta sometimes cannot read a price for a moment and the chip honestly says "see odds". Keep trying for a priced one.
  let page;
  for (round = 1; round <= 10; round++) {
    page = await ctx.newPage();
    await page.goto("https://x.com/home", { waitUntil: "load" });
    const ok = await page.locator(`[data-sorot-chip="${round}2"] >> .yes`).waitFor({ state: "visible", timeout: 20000 }).then(() => true, () => false);
    if (ok) break;
    console.log("no priced chip on attempt", round);
    await page.close();
    page = undefined;
  }
  if (!page) throw new Error("Panta never returned a price for the market");
  await pause(500);

  const host = page.locator(`[data-sorot-chip="${round}2"]`);
  const style = await page.addStyleTag({ content: "[data-sorot-chip]{display:none!important}" });
  await pause(300);
  await shot(page, "timeline-plain.png");
  await style.evaluate((n) => n.remove());
  await pause(300);
  await shot(page, "timeline-chip.png");
  meta.timeline = {
    viewport: VIEW,
    scale: 3,
    chip: await rect(host),
    yes: await rect(host.locator(".yes")),
    no: await rect(host.locator(".no")),
    title: await host.locator(".title").textContent(),
    yesText: await host.locator(".yes").textContent(),
    noText: await host.locator(".no").textContent(),
    tweetBtc: await rect(page.locator("article").nth(1)),
    tweetSol: await rect(page.locator("article").nth(3)),
  };
  console.log("timeline", meta.timeline.title, meta.timeline.yesText, meta.timeline.noText);
  await page.close();
  await ctx.close();
  rmSync(userDataDir, { recursive: true, force: true });
}

// 3. Trade page and 4. positions, with a stand-in for Phantom. Nothing is signed or sent.
const phantomStub = ({ wallet }) => {
  const p = {
    isPhantom: true,
    publicKey: null,
    async connect(opts) {
      if (opts && opts.onlyIfTrusted) throw new Error("not trusted");
      p.publicKey = { toString: () => wallet };
      return { publicKey: p.publicKey };
    },
    async disconnect() {
      p.publicKey = null;
    },
    on() {},
    off() {},
  };
  window.phantom = { solana: p };
};
for (let tryNo = 1; tryNo <= 8; tryNo++) {
  const VIEW = { width: 420, height: 900 };
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 3 });
  await ctx.addInitScript(phantomStub, { wallet: WALLET });
  const page = await ctx.newPage();
  await page.goto(site + "/t/open", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await pause(800);
  const connect = page.getByRole("button", { name: "Connect Phantom" }).last();
  meta.trade = { viewport: VIEW, scale: 3, url: page.url(), title: await page.getByRole("heading", { level: 1 }).textContent() };
  meta.trade.connect = await rect(connect);
  await shot(page, "trade-0-gate.png");

  await connect.click();
  await page.getByRole("button", { name: "Disconnect" }).waitFor();
  await pause(600);
  meta.trade.amount = await rect(page.locator("#amount"));
  await shot(page, "trade-1-connected.png");

  await page.locator("#amount").pressSequentially("5", { delay: 100 });
  await pause(400);
  const getQuote = page.getByRole("button", { name: "Get quote" });
  meta.trade.getQuote = await rect(getQuote);
  await shot(page, "trade-2-amount.png");

  // Panta sometimes cannot read a market from the chain for a moment. The page says so and offers Try again.
  for (let attempt = 0; attempt < 8; attempt++) {
    await getQuote.click();
    const ok = await page.getByRole("timer").waitFor({ timeout: 15000 }).then(() => true, () => false);
    if (ok) break;
    console.log("quote attempt", attempt + 1, "did not return");
    await page.getByRole("button", { name: "Try again" }).click({ timeout: 3000 }).catch(() => {});
    await pause(800);
  }
  await page.getByRole("timer").waitFor({ timeout: 5000 });
  await pause(500);
  await shot(page, "trade-3-quote.png");
  const timer = page.getByRole("timer");
  meta.trade.timer = await rect(timer);
  meta.trade.approve = await rect(page.getByRole("button", { name: "Approve in Phantom" }));
  meta.trade.quoteText = (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500);
  const pricesShown = (await page.getByText("price at quote").count()) === 0;
  await ctx.close();
  if (pricesShown) break;
  console.log("trade attempt", tryNo, "had a missing price, trying again");
}
{
  const VIEW = { width: 1000, height: 700 };
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 });
  await ctx.addInitScript(phantomStub, { wallet: WALLET });
  const page = await ctx.newPage();
  await page.goto(site + "/positions", { waitUntil: "networkidle" });
  await pause(1200);
  const connect = page.getByRole("button", { name: "Connect Phantom" }).last();
  meta.positions = { viewport: VIEW, scale: 2, connect: await rect(connect) };
  await shot(page, "positions-0-gate.png");
  await connect.click();
  await page.getByRole("tab", { name: /Open/ }).waitFor({ timeout: 30000 });
  await pause(1200);
  await shot(page, "positions-1-list.png");
  await ctx.close();
}

await browser.close();
writeFileSync(join(out, "capture.json"), JSON.stringify(meta, null, 2));
console.log("done:", out);
