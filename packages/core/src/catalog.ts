import type { PantaClient } from "./panta/client.ts";
import type { Store } from "./store.ts";
import type { CatalogMarket } from "./types.ts";

export type SyncStats = {
  total: number;
  open: number;
  /** Markets whose catalog entry had no title, before hydration. */
  emptyTitles: number;
  hydrated: number;
  stillEmpty: number;
};

const HYDRATE_CONCURRENCY = 4;
const HYDRATE_LIMIT = 150;

/**
 * Pulls the catalog from Panta and fills in empty titles from each market's detail.
 * Titles are often empty in the catalog list, so the hydrated title is what matching and the UI use.
 */
export async function syncCatalog(panta: PantaClient, store: Store, now: () => number = Date.now): Promise<SyncStats> {
  const listed = await panta.listMarkets();
  const known = new Map((await store.listMarkets()).map((m) => [m.id, m]));

  const withTitles: CatalogMarket[] = listed.map((m) => {
    if (m.title.trim() !== "") return m;
    const prev = known.get(m.id);
    return prev && prev.title.trim() !== "" ? { ...m, title: prev.title } : m;
  });

  const emptyTitles = listed.filter((m) => m.title.trim() === "").length;
  const toHydrate = withTitles.filter((m) => m.title.trim() === "" && m.status === "open").slice(0, HYDRATE_LIMIT);

  let hydrated = 0;
  for (let i = 0; i < toHydrate.length; i += HYDRATE_CONCURRENCY) {
    const chunk = toHydrate.slice(i, i + HYDRATE_CONCURRENCY);
    const detail = await Promise.allSettled(chunk.map((m) => panta.getMarket(m.id)));
    detail.forEach((r, j) => {
      if (r.status === "fulfilled" && r.value.title.trim() !== "") {
        const target = withTitles.find((m) => m.id === chunk[j].id);
        if (target) {
          target.title = r.value.title;
          hydrated++;
        }
      }
    });
  }

  await store.upsertMarkets(withTitles);
  await store.setMeta("catalog_synced_at", String(now()));

  return {
    total: listed.length,
    open: withTitles.filter((m) => m.status === "open").length,
    emptyTitles,
    hydrated,
    stillEmpty: withTitles.filter((m) => m.title.trim() === "").length,
  };
}
