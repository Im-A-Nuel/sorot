import { readJson, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { buildBody } from "@/lib/server/schemas";

export const POST = route({ limit: { max: 30, windowMs: 60_000 } }, async (req) => {
  const body = await readJson(req, buildBody);
  return getRuntime().runtime.service.build(body);
});
