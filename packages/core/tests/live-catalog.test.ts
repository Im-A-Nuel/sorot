import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HashEmbedder } from "../src/match/embedding.ts";
import { Matcher } from "../src/match/pipeline.ts";
import { HeuristicVerifier } from "../src/match/verify.ts";
import { normalizeMarket, normalizeTrade } from "../src/panta/normalize.ts";
import type { CatalogMarket } from "../src/types.ts";

/**
 * Captured from the live Panta catalog on 2026-10-09 (public market data, shortened).
 * At that moment only 4 of 97 markets were open, 83 had an empty catalog title, and prices had up to nine decimals.
 */
const NOW = Date.parse("2026-10-09T16:00:00Z");

const listRowEmptyTitle = {
  marketId: "EtrjihLvFjmztdXwSxhwiKe4fWvVPspMC4TUeede7GLg",
  category: "sports",
  title: "",
  description: "",
  phase: "primary",
  marketType: "breaking",
  startTime: 1791649800,
  endTime: 1791657000,
  resolutionTime: 1791657000,
  region: "Global",
  resolved: false,
  status: "open",
  volumeUsdc: "0.00",
  yesPrice: null,
  noPrice: null,
  primaryYesPrice: null,
  secondaryYesPrice: null,
};

const detailHydrated = {
  ...listRowEmptyTitle,
  title: "Manchester Vs Tottenham: will both team score a goal",
  question: "Manchester Vs Tottenham: will both team score a goal",
  status: "primary",
  yesPrice: "0.5",
  noPrice: "0.5",
  secondaryYesPrice: "0",
};

const haaland = {
  marketId: "GM2wvtGY5HaG3T4DiVnJTDXsScZLMc9JU9ABzSRGUvKn",
  category: "sports",
  title: "Haaland 8+ points, GW6",
  phase: "primary",
  resolved: false,
  status: "primary",
  endTime: 1791732600,
  yesPrice: "0.501996015",
  noPrice: "0.498003985",
};

const resolvedRow = { ...haaland, marketId: "OldOne", title: "Will BTC close above $90,000?", phase: "resolved", status: "resolved", resolved: true };

describe("live catalog shapes", () => {
  it("keeps an empty catalog title empty so the sync can hydrate it from the detail", () => {
    const m = normalizeMarket(listRowEmptyTitle, NOW)!;
    assert.equal(m.title, "");
    assert.equal(m.titleRaw, null);
    assert.equal(m.status, "open");
    assert.equal(m.yesPrice, null);
  });

  it("reads the hydrated detail, with the title also available as `question`", () => {
    assert.equal(normalizeMarket(detailHydrated, NOW)?.title, "Manchester Vs Tottenham: will both team score a goal");
    assert.equal(normalizeMarket({ ...detailHydrated, title: "" }, NOW)?.title, detailHydrated.question);
  });

  it("cuts nine-decimal prices to four decimals as text", () => {
    const m = normalizeMarket(haaland, NOW)!;
    assert.equal(m.yesPrice, "0.5019");
    assert.equal(m.noPrice, "0.4980");
    assert.equal(normalizeMarket({ ...haaland, yesPrice: "0.5" }, NOW)?.yesPrice, "0.5");
    assert.equal(normalizeMarket({ ...haaland, yesPrice: 0.5 }, NOW)?.yesPrice, "0.5");
  });

  it("treats a market past its end time as closed even if Panta still says primary", () => {
    assert.equal(normalizeMarket(haaland, Date.parse("2026-10-12T00:00:00Z"))?.status, "closed");
    assert.equal(normalizeMarket(resolvedRow, NOW)?.status, "resolved");
  });

  it("reads a live trade: base-unit amounts, the side with the amount, and blockTime in seconds", () => {
    const t = normalizeTrade(
      { id: "cbf59cd7", marketId: "GM2w", wallet: "ERccMpEhvntFm9kZ6hmbf7UyX7pkhNf9fnU8YbzuWrrx", isPrimary: true, yesAmount: 2395219, noAmount: 0, feePaid: 0, blockTime: 1791558662, signature: "5YJD" },
      NOW,
    )!;
    assert.equal(t.side, "yes");
    assert.equal(t.amountUsdc, "2.395219");
    assert.equal(t.at, 1791558662 * 1000);
    assert.equal(normalizeTrade({ wallet: "W", yesAmount: 0, noAmount: 5000000, blockTime: 1 }, NOW)?.side, "no");
    assert.equal(normalizeTrade({ wallet: "W", yesAmount: 0, noAmount: 0 }, NOW), null);
  });
});

describe("matching the real open markets", () => {
  const open = (m: Record<string, unknown>) => normalizeMarket(m, NOW)! as CatalogMarket;
  const catalog = [
    open(haaland),
    open({ ...haaland, marketId: "JP", title: "João Pedro 8+ points, GW6", yesPrice: "0.5", noPrice: "0.5" }),
    open({ ...haaland, marketId: "SAKA", title: "Saka 7+ points, GW6", yesPrice: "0.49", noPrice: "0.51" }),
    open(detailHydrated),
    open(resolvedRow),
  ];

  async function matcher() {
    const m = new Matcher({ embedder: new HashEmbedder(), verifier: new HeuristicVerifier(), threshold: 0.2 });
    await m.indexCatalog(catalog);
    return m;
  }
  const tw = (text: string) => ({ tweetId: "1", text, lang: "en" });

  it("indexes only the open markets", async () => {
    assert.equal((await matcher()).size, 4);
  });

  it("matches clear tweets about each market, even when the market title starts with a name", async () => {
    const m = await matcher();
    assert.equal((await m.match(tw("Haaland to get 8+ points in GW6, easy captain pick"))).marketId, catalog[0].id);
    assert.equal((await m.match(tw("Saka 7+ points GW6? I would bet on it"))).marketId, "SAKA");
    assert.equal((await m.match(tw("Manchester vs Tottenham tonight, both teams will score a goal"))).marketId, detailHydrated.marketId);
  });

  it("stays quiet on tweets that only mention a name", async () => {
    const m = await matcher();
    for (const text of [
      "Haaland is injured again",
      "Saka looked great in training today",
      "Manchester is raining again",
      "My GW6 team is a disaster",
      "BTC will close above $90,000 this week",
    ]) {
      assert.equal((await m.match(tw(text))).marketId, null, text);
    }
  });
});
