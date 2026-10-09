import { parse, route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";
import { signatureQuery } from "@/lib/server/schemas";

export const GET = route({ limit: { max: 120, windowMs: 60_000 } }, async (req) => {
  const { signature } = parse({ signature: new URL(req.url).searchParams.get("signature") }, signatureQuery);
  const status = await getRuntime().runtime.service.verify(signature);
  return { status };
});
