/** Base URL of the hosted Sorot app (trade page). Set VITE_APP_URL when building. */
export const APP_URL: string = __APP_URL__;

/** Base URL of the Sorot backend. Empty means demo matching with fixtures only. */
export const API_URL: string = __API_URL__;

export const DEMO_MODE = API_URL === "";

export const TRADE_WINDOW = { width: 420, height: 640 } as const;
export const MAX_BATCH = 20;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
