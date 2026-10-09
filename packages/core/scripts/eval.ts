/**
 * Scores the matching pipeline on eval/tweets.jsonl and writes eval/results.json.
 *   precision = correct non-null matches / all non-null matches
 *   recall    = correct non-null matches / rows that expect a market
 * Rows whose expectedMarketId is "TODO" are placeholders and are skipped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRuntime, type RuntimeEnv } from "../src/runtime.ts";
import { MemoryStore } from "../src/store.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const input = resolve(root, "eval", "tweets.jsonl");

type Row = { tweetId: string; text: string; expectedMarketId: string | null };

const rows: Row[] = readFileSync(input, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim() !== "")
  .map((l) => JSON.parse(l) as Row)
  .filter((r) => r.expectedMarketId !== "TODO");

if (rows.length === 0) {
  console.error("eval/tweets.jsonl has no labeled rows yet. Add real tweets with an expectedMarketId (or null).");
  process.exit(1);
}

const runtime = createRuntime({ env: process.env as RuntimeEnv, store: new MemoryStore() });
await runtime.service.ensureCatalog();

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
  setup: runtime.describe(),
  mismatches: wrong,
};

writeFileSync(resolve(root, "eval", "results.json"), JSON.stringify(result, null, 2) + "\n");

const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);
console.log(`Rows: ${rows.length}  shown: ${shown}  correct: ${correct}  expected: ${expected}`);
console.log(`Precision: ${pct(precision)}   Recall: ${pct(recall)}`);
console.log(`Stopped at: ${JSON.stringify(stages)}`);
console.log(`Setup: ${JSON.stringify(runtime.describe())}`);
if (runtime.panta.source === "fixture") {
  console.log("Note: this run used the fixture catalog. Set PANTA_API_KEY for a real number.");
}
if (precision !== null && precision < 0.8) {
  console.error("Precision is below the 80% target.");
  process.exit(1);
}
