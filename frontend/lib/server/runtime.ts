import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { MemoryStore, createRuntime, type Runtime, type RuntimeEnv, type Store } from "@sorot/core";
import { PgStore, createNeonDb } from "@sorot/db";

/**
 * Builds the Sorot runtime once per server instance.
 * No PANTA_API_KEY means fixture data (always labeled demo). No DATABASE_URL means an in-memory store.
 */

const simStore = new AsyncLocalStorage<string | null>();

/** Runs a handler with a failure simulation active. Only used outside production, or when ENABLE_SIM=1. */
export function runWithSim<T>(sim: string | null, fn: () => T): T {
  return simStore.run(sim, fn);
}

export function simAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_SIM === "1";
}

type Holder = { runtime: Runtime; databaseConfigured: boolean };
const globalRef = globalThis as typeof globalThis & { __sorot?: Holder };

export function getRuntime(): Holder {
  if (!globalRef.__sorot) {
    const url = process.env.DATABASE_URL;
    const store: Store = url ? new PgStore(createNeonDb(url)) : new MemoryStore();
    const runtime = createRuntime({
      env: process.env as RuntimeEnv,
      store,
      sim: () => simStore.getStore() ?? null,
      log: (message, extra) => console.error(`[sorot] ${message}`, extra instanceof Error ? extra.message : ""),
    });
    globalRef.__sorot = { runtime, databaseConfigured: Boolean(url) };
  }
  return globalRef.__sorot;
}
