import { parse, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { marketParam } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>({ limit: { max: 60, windowMs: 60_000 } }, async (_req, ctx) => {
  const { id } = parse(await ctx.params, marketParam);
  return getRuntime().runtime.service.recentTrades(id);
});
