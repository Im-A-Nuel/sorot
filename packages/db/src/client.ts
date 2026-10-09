import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { Db } from "./pg-store.ts";
import * as schema from "./schema.ts";

/** Neon over HTTP. It suits serverless functions: no connection pool to hold open between requests. */
export function createNeonDb(connectionString: string): Db {
  return drizzle(neon(connectionString), { schema }) as unknown as Db;
}
