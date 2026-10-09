import { readJson, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { quoteBody } from "@/lib/server/schemas";

export const POST = route({ limit: { max: 30, windowMs: 60_000 } }, async (req) => {
  const body = await readJson(req, quoteBody);
  return getRuntime().runtime.service.quote(body);
});
