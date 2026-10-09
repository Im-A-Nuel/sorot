import type { MatchResult } from "../shared/types.ts";

/** Minimal storage surface so the cache can be tested without the chrome.* APIs. */
export type KeyValueStore = {
  get(keys: string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string[]): Promise<void>;
};

type Entry = { at: number; match: MatchResult["match"] };

const PREFIX = "m:";

const keyFor = (tweetId: string) => PREFIX + tweetId;

function isEntry(value: unknown): value is Entry {
  return typeof value === "object" && value !== null && typeof (value as Entry).at === "number" && "match" in value;
}

/** Match results are cached per tweet id, including "no match", so the same tweet is never sent twice. */
export function createCache(store: KeyValueStore, ttlMs: number, now: () => number = Date.now) {
  return {
    async read(tweetIds: string[]): Promise<Map<string, MatchResult["match"]>> {
      const stored = await store.get(tweetIds.map(keyFor));
      const hits = new Map<string, MatchResult["match"]>();
      for (const id of tweetIds) {
        const entry = stored[keyFor(id)];
        if (isEntry(entry) && now() - entry.at < ttlMs) hits.set(id, entry.match);
      }
      return hits;
    },

    async write(results: MatchResult[]): Promise<void> {
      const at = now();
      const items: Record<string, Entry> = {};
      for (const r of results) items[keyFor(r.tweetId)] = { at, match: r.match };
      await store.set(items);
    },

    async prune(): Promise<number> {
      const all = await store.get(null);
      const stale = Object.keys(all).filter((k) => {
        if (!k.startsWith(PREFIX)) return false;
        const entry = all[k];
        return !isEntry(entry) || now() - entry.at >= ttlMs;
      });
      if (stale.length > 0) await store.remove(stale);
      return stale.length;
    },
  };
}
