/**
 * Prints the real shape of Panta responses so panta/normalize.ts can be checked against them.
 * Needs PANTA_API_KEY. Run: pnpm --filter @sorot/core probe
 */
import { PANTA_BASE_URL, routes } from "../src/panta/routes.ts";

const key = process.env.PANTA_API_KEY;
if (!key) {
  console.error("Set PANTA_API_KEY first (in .env or the environment).");
  process.exit(1);
}
const base = (process.env.PANTA_API_BASE || PANTA_BASE_URL).replace(/\/+$/, "");

async function get(path: string) {
  const res = await fetch(`${base}${path}`, { headers: { "X-Api-Key": key as string, accept: "application/json" } });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep the raw text
  }
  return { status: res.status, body };
}

const shape = (v: unknown, depth = 0): unknown => {
  if (Array.isArray(v)) return depth > 2 ? "[…]" : [v.length ? shape(v[0], depth + 1) : "empty"];
  if (typeof v === "object" && v !== null) {
    if (depth > 2) return "{…}";
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x, depth + 1)]));
  }
  return typeof v === "string" && v.length > 40 ? v.slice(0, 40) + "…" : v;
};

const list = await get(routes.markets());
console.log(`GET ${routes.markets()} -> ${list.status}`);
console.log(JSON.stringify(shape(list.body), null, 2));

const items: unknown[] = Array.isArray(list.body)
  ? list.body
  : ((list.body as Record<string, unknown> | null)?.results as unknown[]) ??
    ((list.body as Record<string, unknown> | null)?.data as unknown[]) ??
    [];

if (items.length) {
  const empty = items.filter((m) => !(m as Record<string, unknown>).title).length;
  console.log(`\nFirst page: ${items.length} markets, ${empty} with an empty or missing title.`);
  const id = (items[0] as Record<string, unknown>).id ?? (items[0] as Record<string, unknown>).marketId;
  if (typeof id === "string") {
    const detail = await get(routes.market(id));
    console.log(`\nGET ${routes.market(id)} -> ${detail.status}`);
    console.log(JSON.stringify(shape(detail.body), null, 2));
  }
}

console.log("\nCompare these field names with src/panta/normalize.ts and adjust it if they differ.");
