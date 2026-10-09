import { parse, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { walletQuery } from "@/lib/server/schemas";

export const GET = route({ limit: { max: 60, windowMs: 60_000 } }, async (req) => {
  const { wallet } = parse({ wallet: new URL(req.url).searchParams.get("wallet") }, walletQuery);
  return getRuntime().runtime.service.positions(wallet);
});
