/**
 * Browser test. Needs Google Chrome installed, and a dev server started with fixtures:
 *   PANTA_FORCE_FIXTURES=1 pnpm dev      then open each page once so the first compile is done
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const axeSrc = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});
const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok });
  console.log((ok ? "PASS " : "FAIL ") + name + (extra ? "  " + extra : ""));
};

const phantomInit = (opts) => {
  const addr = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
  window.__rejectSign = !!opts.rejectSign;
  const provider = {
    isPhantom: true,
    publicKey: null,
    async connect(o) {
      if (o && o.onlyIfTrusted && !opts.trusted) {
        const e = new Error("not trusted");
        e.code = 4100;
        throw e;
      }
      provider.publicKey = { toString: () => addr };
      return { publicKey: provider.publicKey };
    },
    async disconnect() {
      provider.publicKey = null;
    },
    async signMessage() {
      if (window.__rejectSign) {
        const e = new Error("User rejected");
        e.code = 4001;
        throw e;
      }
      return { signature: new Uint8Array(64) };
    },
    on() {},
    off() {},
  };
  window.phantom = { solana: provider };
};

async function newPage(opts = { phantom: true, trusted: false }, viewport = { width: 420, height: 740 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text());
  });
  if (opts.phantom) await page.addInitScript(phantomInit, opts);
  return { page, errors };
}

async function axe(page, label) {
  await page.addScriptTag({ content: axeSrc });
  const r = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] }),
  );
  const v = r.violations.map((x) => x.id + "(" + x.nodes.length + "): " + x.nodes[0].html.slice(0, 100));
  check("axe " + label, v.length === 0, v.join(" | "));
}

async function run(name, fn) {
  try {
    await fn();
  } catch (e) {
    check(name + " (threw)", false, String(e.message).split("\n")[0]);
  }
}

await run("happy path", async () => {
  const { page, errors } = await newPage({ phantom: true, trusted: false });
  await page.goto(BASE + "/t/demo-sol-300?tweet=1840000000000000001", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /SOL close above/ }).waitFor();
  await page.screenshot({ path: "tr_1_disconnected.png" });
  check("demo banner visible", await page.getByText("Demo data.").isVisible());
  await axe(page, "trade (disconnected)");
  await page.getByRole("button", { name: "Connect Phantom" }).last().click();
  await page.getByRole("button", { name: "Disconnect" }).waitFor();
  check("wallet connected", true);
  await page.getByRole("button", { name: "Get quote" }).click();
  check("empty amount shows inline error", await page.getByText("Enter an amount.").isVisible());
  check("focus moved to amount", await page.evaluate(() => document.activeElement && document.activeElement.id === "amount"));
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Get quote" }).click();
  await page.getByRole("timer").waitFor();
  await page.screenshot({ path: "tr_2_quoted.png" });
  check("quote summary rows", (await page.getByText("Estimated shares").count()) === 1);
  await axe(page, "trade (quoted)");
  await page.locator("#amount").fill("12");
  check("editing amount clears quote", (await page.getByRole("timer").count()) === 0);
  await page.getByRole("button", { name: "Get quote" }).click();
  await page.getByRole("timer").waitFor();
  await page.getByRole("button", { name: "Approve in Phantom" }).click();
  await page.getByText("Demo trade confirmed").waitFor({ timeout: 15000 });
  await page.screenshot({ path: "tr_3_done.png" });
  check(
    "done view focused",
    await page.evaluate(() => /Demo trade confirmed/.test((document.activeElement && document.activeElement.textContent) || "")),
  );
  await page.getByText("Recent trades").click();
  await page.getByText("USDC", { exact: false }).last().waitFor();
  await page.screenshot({ path: "tr_4_recent.png", fullPage: true });
  check("no console errors (happy path)", errors.length === 0, errors.join(" | "));
});

await run("expiry", async () => {
  const { page } = await newPage({ phantom: true, trusted: true });
  await page.goto(BASE + "/t/demo-sol-300?sim=short-quote", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Disconnect" }).waitFor();
  await page.locator("#amount").fill("5");
  await page.getByRole("button", { name: "Get quote" }).click();
  await page.getByRole("timer").waitFor();
  await page.getByRole("button", { name: "Get a new quote" }).waitFor({ timeout: 15000 });
  await page.screenshot({ path: "tr_5_expired.png" });
  check("quote expires and offers a new one", true);
  check("approve button gone after expiry", (await page.getByRole("button", { name: "Approve in Phantom" }).count()) === 0);
});

for (const [sim, title] of [
  ["rate-limit", "Too many requests"],
  ["slippage", "The price moved"],
  ["tx-failed", "The transaction failed"],
]) {
  await run("failure " + sim, async () => {
    const { page } = await newPage({ phantom: true, trusted: true });
    await page.goto(BASE + "/t/demo-sol-300?sim=" + sim, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Disconnect" }).waitFor();
    await page.locator("#amount").fill("5");
    await page.getByRole("button", { name: "Get quote" }).click();
    if (sim !== "rate-limit") await page.getByRole("button", { name: "Approve in Phantom" }).click();
    await page.getByRole("alert").getByText(title).waitFor({ timeout: 30000 });
    check(sim + ": error announced and focused", await page.evaluate(() => document.activeElement && document.activeElement.getAttribute("role") === "alert"));
    await page.screenshot({ path: "tr_6_" + sim + ".png" });
    if (sim === "slippage") await axe(page, "trade (error)");
    await page.getByRole("button", { name: "Try again" }).click();
    check(sim + ": try again returns to form", await page.getByRole("button", { name: "Get quote" }).isVisible());
  });
}

await run("wallet rejection", async () => {
  const { page } = await newPage({ phantom: true, trusted: true, rejectSign: true });
  await page.goto(BASE + "/t/demo-sol-300", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Disconnect" }).waitFor();
  await page.locator("#amount").fill("5");
  await page.getByRole("button", { name: "Get quote" }).click();
  await page.getByRole("button", { name: "Approve in Phantom" }).click();
  await page.getByText("You declined the request").waitFor();
  await page.getByRole("button", { name: "Try again" }).click();
  check("rejected signing returns to the same quote", await page.getByRole("button", { name: "Approve in Phantom" }).isVisible());
});

await run("market states", async () => {
  const { page } = await newPage({ phantom: true, trusted: true });
  await page.goto(BASE + "/t/demo-eth-5k", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /ETH close above/ }).waitFor();
  check("null price shows 'price at quote' for both sides", (await page.getByText("price at quote").count()) === 2);
  await page.screenshot({ path: "tr_7_nullprice.png" });
  await page.goto(BASE + "/t/demo-btc-100k", { waitUntil: "networkidle" });
  await page.getByText("This market has resolved").waitFor();
  check("resolved market is not tradable", (await page.getByRole("button", { name: "Get quote" }).count()) === 0);
  await page.screenshot({ path: "tr_8_closed.png" });
  await page.goto(BASE + "/t/does-not-exist", { waitUntil: "networkidle" });
  await page.getByText("Market not found").first().waitFor();
  check("unknown market shows not found", true);
  await page.goto(BASE + "/t/demo-sol-300?sim=market-error", { waitUntil: "networkidle" });
  await page.getByText("Could not load this market").waitFor();
  check("upstream failure shows retry", await page.getByRole("button", { name: "Try again" }).isVisible());
});

await run("no phantom", async () => {
  const { page } = await newPage({ phantom: false });
  await page.goto(BASE + "/t/demo-sol-300", { waitUntil: "networkidle" });
  await page.getByText("Install Phantom to trade").waitFor({ timeout: 5000 });
  check("no Phantom shows install CTA", true);
  await page.goto(BASE + "/positions", { waitUntil: "networkidle" });
  await page.getByText("Phantom is not installed").waitFor({ timeout: 5000 });
  check("positions without Phantom shows install notice", true);
});

await run("positions", async () => {
  const { page, errors } = await newPage({ phantom: true, trusted: false }, { width: 1100, height: 800 });
  await page.goto(BASE + "/positions", { waitUntil: "networkidle" });
  await page.getByText("Connect your wallet").waitFor();
  await page.screenshot({ path: "po_1_gate.png" });
  await axe(page, "positions (gate)");
  await page.getByRole("button", { name: "Connect Phantom" }).last().click();
  await page.getByRole("tab", { name: /Open/ }).waitFor();
  await page.screenshot({ path: "po_2_open.png" });
  check("open tab lists 1 position", (await page.locator("tbody tr").count()) === 1);
  await axe(page, "positions (list)");
  await page.getByRole("tab", { name: /Open/ }).focus();
  await page.keyboard.press("ArrowRight");
  check("arrow key moves to Claimable tab", (await page.getByRole("tab", { name: /Claimable/ }).getAttribute("aria-selected")) === "true");
  check("claimable tab lists 2", (await page.locator("tbody tr").count()) === 2);
  await page.screenshot({ path: "po_3_claimable.png" });
  await page.getByRole("button", { name: /Claim winnings for Will BTC/ }).click();
  await page.getByRole("button", { name: /Claim winnings for Will BTC/ }).waitFor({ state: "detached", timeout: 20000 });
  check("claim flow completes", (await page.locator("tbody tr").count()) === 1);
  await page.getByRole("tab", { name: /Resolved/ }).click();
  await page.screenshot({ path: "po_4_resolved.png" });
  check("no console errors (positions)", errors.length === 0, errors.join(" | "));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: /Claimable/ }).click();
  await page.screenshot({ path: "po_5_mobile.png", fullPage: true });
  check("positions: no horizontal overflow on mobile", !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)));
});

await run("404 and landing", async () => {
  const { page } = await newPage({ phantom: false }, { width: 1280, height: 800 });
  await page.goto(BASE + "/nope", { waitUntil: "networkidle" });
  await page.getByText("This page does not exist").waitFor();
  await axe(page, "404");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await axe(page, "landing");
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log("\n" + (results.length - failed.length) + "/" + results.length + " passed");
process.exit(failed.length ? 1 : 0);
