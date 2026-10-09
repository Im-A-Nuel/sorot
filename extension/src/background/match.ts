import { API_URL, DEMO_MODE, MAX_BATCH } from "../config.ts";
import type { MatchResult, TweetInput } from "../shared/types.ts";
import { demoMatchAll } from "./demo-matcher.ts";
import { sanitizeResults } from "./sanitize.ts";

async function installId(): Promise<string> {
  const stored = await chrome.storage.local.get("installId");
  if (typeof stored.installId === "string") return stored.installId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ installId: id });
  return id;
}

/** Sends tweets to the Sorot backend in batches. Without a backend it uses the labeled demo matcher. */
export async function matchTweets(tweets: TweetInput[]): Promise<MatchResult[]> {
  if (DEMO_MODE) return demoMatchAll(tweets);

  const client = await installId();
  const out: MatchResult[] = [];

  for (let i = 0; i < tweets.length; i += MAX_BATCH) {
    const batch = tweets.slice(i, i + MAX_BATCH);
    const res = await fetch(`${API_URL}/match`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Sorot-Client": client },
      body: JSON.stringify({ tweets: batch }),
    });
    if (!res.ok) throw new Error(`match failed with ${res.status}`);
    out.push(...sanitizeResults(await res.json(), batch.map((t) => t.tweetId)));
  }

  return out;
}
