import { readJson, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { matchBody } from "@/lib/server/schemas";

// Matching can call an embedding API and an LLM, so give it more than the default time.
export const maxDuration = 30;

export const POST = route({ limit: { max: 60, windowMs: 60_000 } }, async (req) => {
  const { tweets } = await readJson(req, matchBody);
  const results = await getRuntime().runtime.service.matchTweets(tweets);
  return { results };
});
