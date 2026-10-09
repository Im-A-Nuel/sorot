import { createHttpApi } from "./http";
import type { SorotApi } from "./types";

/** Same-origin by default. The API lives in this app under /api. */
const base = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api: SorotApi = createHttpApi(base);

export * from "./types";
export * from "./money";
