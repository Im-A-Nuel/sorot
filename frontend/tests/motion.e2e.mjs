import { chromium } from "playwright-core";

/**
 * Motion checks: the FAQ panel animates, the phone menu uses one entrance, every interactive element shares the same
 * 150ms transition, and reduced motion turns it all off. Needs the app running: BASE_URL=http://localhost:3000.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
console.log("chrome", browser.version());
let fails = 0;
const check = (n, ok, x = "") => { if (!ok) fails++; console.log((ok ? "PASS " : "FAIL ") + n + (!ok && x ? "  " + x : "")); };

// FAQ opens and closes, and the height animates (sampled mid-way)
{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const q = page.getByText("Does Sorot hold my funds or keys?");
  await q.scrollIntoViewIfNeeded();
  const answer = page.getByText("No. Sorot never stores wallet keys or seed phrases. You sign every transaction in Phantom.");
  check("faq answer hidden at first", !(await answer.isVisible()));
  await q.click();
  await page.waitForTimeout(60);
  const mid = await page.evaluate(() => {
    const d = [...document.querySelectorAll("details")].find((x) => x.open);
    return d ? d.getBoundingClientRect().height : 0;
  });
  await page.waitForTimeout(450);
  const full = await page.evaluate(() => [...document.querySelectorAll("details")].find((x) => x.open).getBoundingClientRect().height);
  check("faq answer visible after opening", await answer.isVisible());
  check("faq height animates (mid < full)", mid < full, `mid=${mid} full=${full}`);
  await q.click();
  await page.waitForTimeout(450);
  check("faq answer hidden after closing", !(await answer.isVisible()));
}

// reduced motion: alerts and the menu do not animate
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const d = await page.evaluate(() => getComputedStyle(document.getElementById("mobile-nav")).animationDuration);
  check("reduced motion: menu animation is effectively off", parseFloat(d) < 0.001, d);
  await ctx.close();
}
{
  const page = await (await browser.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const d = await page.evaluate(() => getComputedStyle(document.getElementById("mobile-nav")).animationName + " " + getComputedStyle(document.getElementById("mobile-nav")).animationDuration);
  check("normal motion: menu uses enter-menu", /enter-menu 0\.18s/.test(d), d);
  // buttons and links share one timing
  const t = await page.evaluate(() => [...document.querySelectorAll("a[href], button")].slice(0, 40).map((e) => getComputedStyle(e).transitionDuration).filter((x) => x !== "0s"));
  check("interactive elements share the 150ms transition", t.length > 0 && t.every((x) => x.split(",").every((y) => y.trim() === "0.15s")), [...new Set(t)].join(" | "));
}
await browser.close();
process.exit(fails ? 1 : 0);
