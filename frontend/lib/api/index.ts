import { createHttpApi } from "./http";
import { mockApi } from "./mock";
import type { SorotApi } from "./types";

const base = process.env.NEXT_PUBLIC_API_URL;

/** True while the UI runs on fixtures. Pages show a "Demo data" banner in this mode. */
export const isMockApi = !base;

export const api: SorotApi = base ? createHttpApi(base) : mockApi;

export * from "./types";
export * from "./money";
