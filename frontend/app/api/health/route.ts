import { route } from "@/lib/server/http";
import { getRuntime } from "@/lib/server/runtime";

/** Reports which parts are live and which are demo. It never returns a key or a connection string. */
export const GET = route({ limit: { max: 120, windowMs: 60_000 } }, async () => {
  const { runtime, databaseConfigured } = getRuntime();
  const health = await runtime.service.health();
  return {
    ok: true,
    demo: runtime.panta.source === "fixture",
    ...runtime.describe(),
    database: databaseConfigured ? "postgres" : "memory",
    markets: health.markets,
    open: health.open,
    indexed: health.indexed,
    catalogSyncedAt: health.catalogSyncedAt,
  };
});
