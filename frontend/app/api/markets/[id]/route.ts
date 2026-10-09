import { parse, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { marketParam } from "@/lib/server/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>({ limit: { max: 120, windowMs: 60_000 } }, async (_req, ctx) => {
  const { id } = parse(await ctx.params, marketParam);
  const { runtime } = getRuntime();
  const m = await runtime.service.getMarket(id);
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    status: m.status,
    yesPrice: m.yesPrice,
    noPrice: m.noPrice,
    url: m.url,
    demo: runtime.panta.source === "fixture" ? true : undefined,
  };
});
