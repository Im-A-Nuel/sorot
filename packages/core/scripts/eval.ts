/**
 * Scores the matching pipeline on eval/tweets.jsonl and writes eval/results.json.
 *   precision = correct non-null matches / all non-null matches
 *   recall    = correct non-null matches / rows that expect a market
 * Rows whose expectedMarketId is "TODO" are placeholders and are skipped.
 *
 * Markets close and new ones open, so the labels can go stale. Save the open catalog once while you label,
 * then score against that snapshot at any time:
 *   pnpm eval -- --save-catalog     writes eval/catalog-snapshot.json from the live catalog
 *   pnpm eval -- --catalog          scores against eval/catalog-snapshot.json instead of Panta
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime, type RuntimeEnv } from "../src/runtime.ts";
import { MemoryStore } from "../src/store.ts";
import type { PantaClient } from "../src/panta/client.ts";
import { FixturePantaClient } from "../src/panta/fixture-client.ts";
import type { CatalogMarket } from "../src/types.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const input = resolve(root, "eval", "tweets.jsonl");
const snapshotPath = resolve(root, "eval", "catalog-snapshot.json");
const has = (name: string) => process.argv.includes(name);

type Row = { tweetId: string; text: string; expectedMarketId: string | null };

function loadRows(): Row[] {
  return readFileSync(input, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as Row)
    .filter((r) => r.expectedMarketId !== "TODO");
}

/** Replays a saved catalog as if it were Panta, so the score does not change when markets close. */
function snapshotClient(markets: CatalogMarket[]): PantaClient {
  const base = new FixturePantaClient();
  return Object.assign(Object.create(base), {
    source: "live" as const,
    listMarkets: async () => markets,
    getMarket: async (id: string) => {
      const m = markets.find((x) => x.id === id);
      if (!m) throw new Error(`market ${id} is not in the snapshot`);
      return m;
    },
  }) as PantaClient;
}

let panta: PantaClient | undefined;
if (has("--catalog")) {
  if (!existsSync(snapshotPath)) {
    console.error("eval/catalog-snapshot.json does not exist. Run: pnpm eval -- --save-catalog");
    process.exit(1);
  }
  panta = snapshotClient(JSON.parse(readFileSync(snapshotPath, "utf8")) as CatalogMarket[]);
}

const runtime = createRuntime({ env: process.env as RuntimeEnv, store: new MemoryStore(), panta });
await runtime.service.ensureCatalog();

if (has("--save-catalog")) {
  const open = (await runtime.panta.listMarkets()).filter((m) => m.status === "open");
  const hydrated = [];
  for (const m of open) hydrated.push(m.title ? m : await runtime.panta.getMarket(m.id).catch(() => m));
  writeFileSync(snapshotPath, JSON.stringify(hydrated, null, 2) + "\n");
  console.log(`Saved ${hydrated.length} open markets to eval/catalog-snapshot.json (${runtime.panta.source} catalog).`);
  for (const m of hydrated) console.log(`  ${m.id}  ${m.title || "(no title)"}`);
}

const rows = loadRows();
if (rows.length === 0) {
  console.error("\neval/tweets.jsonl has no labeled rows yet. Add real tweets with an expectedMarketId (or null).");
  process.exit(has("--save-catalog") ? 0 : 1);
}

const stages: Record<string, number> = { prefilter: 0, similarity: 0, verify: 0, match: 0 };
let shown = 0;
let correct = 0;
let expected = 0;
const wrong: { tweetId: string; expected: string | null; got: string | null }[] = [];

for (const row of rows) {
  const out = await runtime.matcher.match({ tweetId: row.tweetId, text: row.text, lang: "en" });
  stages[out.stage]++;
  if (row.expectedMarketId) expected++;
  if (out.marketId) {
    shown++;
    if (out.marketId === row.expectedMarketId) correct++;
  }
  if (out.marketId !== row.expectedMarketId) wrong.push({ tweetId: row.tweetId, expected: row.expectedMarketId, got: out.marketId });
}

const precision = shown === 0 ? null : correct / shown;
const recall = expected === 0 ? null : correct / expected;
const result = {
  ranAt: new Date().toISOString(),
  n: rows.length,
  shown,
  correct,
  expected,
  precision,
  recall,
  stoppedAt: stages,
  setup: { ...runtime.describe(), catalog: has("--catalog") ? "snapshot" : "live" },
  mismatches: wrong,
};

writeFileSync(resolve(root, "eval", "results.json"), JSON.stringify(result, null, 2) + "\n");

const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);
console.log(`Rows: ${rows.length}  shown: ${shown}  correct: ${correct}  expected: ${expected}`);
console.log(`Precision: ${pct(precision)}   Recall: ${pct(recall)}`);
console.log(`Stopped at: ${JSON.stringify(stages)}`);
console.log(`Setup: ${JSON.stringify(runtime.describe())}`);
if (runtime.panta.source === "fixture" && !has("--catalog")) {
  console.log("Note: this run used the fixture catalog. Set PANTA_API_KEY for a real number.");
}
if (precision !== null && precision < 0.8) {
  console.error("Precision is below the 80% target.");
  process.exit(1);
}
