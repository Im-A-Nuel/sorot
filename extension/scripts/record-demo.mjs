/**
 * Records silent screen clips of Sorot for a demo video. Run it against a deployed site:
 *   OUT_DIR=dist-prod node scripts/build.mjs --api https://<domain>/api
 *   node scripts/record-demo.mjs https://<domain>
 * Output goes to <repo>/demo-video as numbered .webm files with on-screen captions.
 *
 * What is real and what is not, and the captions say so:
 * - Real: the landing page, the Sorot API, the Panta market, odds and quotes, the extension code.
 * - Simulated: the X timeline (a local page that uses X's markup, because no X login is used) and the wallet
 *   (a stand-in for Phantom). The recorder never approves a trade, so nothing is signed or sent.
 */
import { chromium } from "playwright-core";
import { mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = (process.argv[2] ?? "").replace(/\/+$/, "");
if (!/^https:\/\//.test(site)) {
  console.error("Usage: node scripts/record-demo.mjs https://your-app.vercel.app");
  process.exit(2);
}
const here = dirname(fileURLToPath(import.meta.url));
const ext = resolve(here, "..", process.env.OUT_DIR ?? "dist-prod");
const out = resolve(here, "..", "..", "demo-video");
const tmp = mkdtempSync(join(tmpdir(), "sorot-rec-"));
mkdirSync(out, { recursive: true });

const SIZE = { width: 1280, height: 720 };
const WALLET = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
const only = (process.env.SCENES ?? "1,2,3,4").split(",");
const want = (n) => only.includes(String(n));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// A caption bar and a visible cursor, drawn by the page so they land in the recording.
const overlay = () => {
  const mount = () => {
    if (document.getElementById("__cap")) return;
    const cap = document.createElement("div");
    cap.id = "__cap";
    cap.style.cssText =
      "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483647;max-width:920px;padding:12px 22px;border-radius:999px;background:rgba(11,15,26,.92);color:#fff;font:500 18px/1.35 'DM Sans',system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .25s;pointer-events:none";
    const dot = document.createElement("div");
    dot.id = "__cur";
    dot.style.cssText =
      "position:fixed;left:-40px;top:-40px;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(22,38,240,.35);border:2px solid #1626f0;z-index:2147483647;pointer-events:none;transition:transform .12s";
    document.documentElement.append(cap, dot);
    addEventListener("mousemove", (e) => {
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";
    });
    addEventListener("mousedown", () => (dot.style.transform = "scale(.7)"));
    addEventListener("mouseup", () => (dot.style.transform = "scale(1)"));
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", mount);
  else mount();
};
const caption = (page, text) =>
  page.evaluate((t) => {
    const el = document.getElementById("__cap");
    if (!el) return;
    el.textContent = t;
    el.style.opacity = t ? "1" : "0";
  }, text);

async function glide(page, locator, steps = 28) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps });
}
async function click(page, locator) {
  await glide(page, locator);
  await pause(350);
  await locator.click();
}
async function scrollTo(page, selector, block = "start") {
  await caption(page, "");
  await page.evaluate(([s, b]) => document.querySelector(s)?.scrollIntoView({ behavior: "smooth", block: b }), [selector, block]);
  await pause(1300);
}

async function save(page, name) {
  const video = page.video();
  await page.close();
  await video.saveAs(join(out, name));
  console.log("saved", name);
}

const browser = await chromium.launch({ headless: true });

// 1. Landing page
if (want(1)) {
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE } });
  await ctx.addInitScript(overlay);
  const page = await ctx.newPage();
  await page.goto(site, { waitUntil: "networkidle" });
  await pause(500);
  await caption(page, "Sorot: Panta prediction-market odds, right under the tweets people argue about");
  await pause(3800);
  await caption(page, "");
  await scrollTo(page, "#how-it-works");
  await caption(page, "How it works: a chip appears under a tweet only when it matches an open Panta market");
  await pause(4200);
  await scrollTo(page, "#matching");
  await caption(page, "Precision over recall: every stage can stop, and only a clear yes shows a chip");
  await pause(4200);
  await scrollTo(page, "#security", "center");
  await caption(page, "The extension holds no keys. The Panta key stays on the server. Phantom signs.");
  await pause(4200);
  await scrollTo(page, "#panta");
  await caption(page, "Built on the Panta API: catalog, quote, build, submit, verify, positions, claim, attribution");
  await pause(4200);
  await caption(page, "");
  await save(page, "01-landing.webm");
  await ctx.close();
}

// 2. The extension on a timeline. The timeline is a local page with X's markup, because no X account is used.
if (want(2)) {
  const userDataDir = mkdtempSync(join(tmpdir(), "sorot-ext-"));
  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: SIZE,
    recordVideo: { dir: tmp, size: SIZE },
    args: ["--headless=new", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  await ctx.addInitScript(overlay);
  if (!ctx.serviceWorkers().length) await ctx.waitForEvent("serviceworker");

  const tweet = (id, name, handle, text) => `
  <article data-testid="tweet" role="article" tabindex="0" style="border-bottom:1px solid #eff3f4;padding:14px 18px;display:flex;gap:12px;font-family:system-ui,sans-serif;color:#0f1419">
    <div style="width:42px;height:42px;border-radius:50%;background:#cfd9de;flex:none"></div>
    <div style="min-width:0;flex:1">
      <div><b>${name}</b> <span style="color:#536471">${handle} · <a href="/${handle.slice(1)}/status/${id}" style="color:#536471;text-decoration:none"><time datetime="2026-10-11T10:00:00Z">2m</time></a></span></div>
      <div data-testid="tweetText" lang="en" style="margin-top:4px;font-size:16px;line-height:1.4"><span>${text}</span></div>
      <div role="group" aria-label="actions" style="height:30px;color:#536471;font-size:13px;margin-top:8px">reply · repost · like</div>
    </div>
  </article>`;
  const timeline = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Home</title></head><body style="margin:0;background:#fff"><main data-testid="primaryColumn" style="max-width:600px;margin:0 auto;border-left:1px solid #eff3f4;border-right:1px solid #eff3f4;min-height:100vh">
    <div style="padding:16px 18px;font:700 20px system-ui;border-bottom:1px solid #eff3f4;position:sticky;top:0;background:#fffe">Home</div>
    ${tweet("2001", "Sample account", "@sample_a", "gm, coffee first")}
    ${tweet("2002", "Sample account", "@sample_b", "Bitcoin will make a new all time high before the end of the year")}
    ${tweet("2003", "Sample account", "@sample_c", "Slow day. Going outside.")}
    ${tweet("2004", "Sample account", "@sample_d", "Solana is going to rip past 300 before Halloween")}
  </main></body></html>`;
  await ctx.route("https://x.com/**", (route) => route.fulfill({ contentType: "text/html", body: timeline }));

  // Warm the API so the first match is quick on camera.
  await fetch(site + "/api/match", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sorot-client": "recorder-warmup" },
    body: JSON.stringify({ tweets: [{ tweetId: "1", text: "bitcoin new all time high", lang: "en" }] }),
  }).catch(() => {});

  const page = await ctx.newPage();
  await page.goto("https://x.com/home", { waitUntil: "load" });
  await caption(page, "A simulated X timeline (no X login). The chip and odds below are real, from the live Sorot API.");
  await pause(3500);
  const chip = page.locator('[data-sorot-chip="2002"]');
  await chip.waitFor({ timeout: 30000 });
  await chip.locator(".yes").waitFor({ state: "visible", timeout: 30000 });
  await scrollTo(page, '[data-sorot-chip="2002"]', "center");
  await caption(page, "The Bitcoin tweet matches an open Panta market, so a chip appears with live YES and NO odds.");
  await pause(4500);
  await caption(page, "Tweets with no open market get no chip. One wrong chip costs more trust than a missing one.");
  await page.mouse.move(640, 120, { steps: 20 });
  await pause(4500);
  await caption(page, "Click YES or NO on the chip to open the trade page.");
  const popupPromise = ctx.waitForEvent("page");
  await click(page, chip.locator(".yes"));
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await pause(3500);
  await caption(page, "");
  await save(page, "02-extension-timeline.webm");
  await popup.close().catch(() => {});
  await ctx.close();
  rmSync(userDataDir, { recursive: true, force: true });
}

// 3. Trade page and 4. positions, with a stand-in for Phantom. Nothing is signed or sent.
const phantomStub = ({ wallet }) => {
  const p = {
    isPhantom: true,
    publicKey: null,
    async connect(opts) {
      // Not trusted until the viewer presses Connect, like a first visit.
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
if (want(3)) {
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE } });
  await ctx.addInitScript(overlay);
  await ctx.addInitScript(phantomStub, { wallet: WALLET });
  const page = await ctx.newPage();
  await page.goto(site + "/t/open", { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await caption(page, "The trade page the chip opens: a live Panta market with its YES and NO odds.");
  await pause(3500);
  await caption(page, "Connect Phantom. Here a test stand-in is used, so no real wallet is involved.");
  await click(page, page.getByRole("button", { name: "Connect Phantom" }).last());
  await page.getByRole("button", { name: "Disconnect" }).waitFor();
  await pause(2500);
  await caption(page, "Pick a side and an amount in USDC.");
  await click(page, page.locator("#amount"));
  await page.locator("#amount").pressSequentially("5", { delay: 250 });
  await pause(1500);
  await caption(page, "Get a quote. This is a real quote from Panta: shares, fee and a 90-second timer.");
  // Panta sometimes cannot read a market from the chain for a moment. The page says so and offers Try again, and so does this.
  for (let attempt = 0; attempt < 6; attempt++) {
    await click(page, page.getByRole("button", { name: "Get quote" }));
    try {
      await page.getByRole("timer").waitFor({ timeout: 15000 });
      break;
    } catch {
      await page.getByRole("button", { name: "Try again" }).click({ timeout: 3000 }).catch(() => {});
      await pause(800);
    }
  }
  await page.getByRole("timer").waitFor({ timeout: 5000 });
  await pause(4500);
  await caption(page, "Next is Approve in Phantom. Signing is not shown in this recording, and no trade is sent.");
  await pause(5000);
  await caption(page, "");
  await save(page, "03-trade-page.webm");
  await ctx.close();
}
if (want(4)) {
  const ctx = await browser.newContext({ viewport: SIZE, recordVideo: { dir: tmp, size: SIZE } });
  await ctx.addInitScript(overlay);
  await ctx.addInitScript(phantomStub, { wallet: WALLET });
  const page = await ctx.newPage();
  await page.goto(site + "/positions", { waitUntil: "networkidle" });
  await caption(page, "Positions are read for the wallet you connect. Sorot never gets your keys.");
  await pause(3000);
  await click(page, page.getByRole("button", { name: "Connect Phantom" }).last());
  await page.getByRole("tab", { name: /Open/ }).waitFor({ timeout: 30000 });
  await caption(page, "Positions: read for the connected wallet. This test wallet holds none, so the list is empty.");
  await pause(4500);
  await caption(page, "When a market resolves, a Claim button appears here. There is no sign-up and no account.");
  await pause(4500);
  await caption(page, "");
  await save(page, "04-positions.webm");
  await ctx.close();
}

await browser.close();
rmSync(tmp, { recursive: true, force: true });
console.log("done:", out);
