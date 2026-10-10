import { ApiError, isApiError, type ApiErrorCode } from "@/lib/api/types";

export type ErrorCopy = {
  title: string;
  body: string;
  /** Where "Try again" should go: back to the amount form for a fresh quote, or retry the same quote. */
  retry: "requote" | "same";
};

const copy: Record<ApiErrorCode, ErrorCopy> = {
  INVALID_PARAMS: {
    title: "That request was not valid",
    body: "Check the amount and try again.",
    retry: "requote",
  },
  NOT_FOUND: {
    title: "Market not found",
    body: "This market is no longer available.",
    retry: "requote",
  },
  MARKET_CLOSED: {
    title: "This market is closed",
    body: "Panta is not taking new trades on it.",
    retry: "requote",
  },
  PANTA_UPSTREAM: {
    title: "Panta is not responding",
    body: "The market service had a problem. Nothing was sent. Try again in a moment.",
    retry: "same",
  },
  RATE_LIMITED: {
    title: "Too many requests",
    body: "Panta is rate limiting Sorot right now. Wait a few seconds and try again.",
    retry: "same",
  },
  QUOTE_EXPIRED: {
    title: "The quote expired",
    body: "Quotes only last about 90 seconds. Get a new one to continue.",
    retry: "requote",
  },
  SLIPPAGE: {
    title: "The price moved",
    body: "The price changed beyond your slippage limit before the trade was built. Get a new quote.",
    retry: "requote",
  },
  NOT_CLAIMABLE: {
    title: "Nothing to claim",
    body: "This position is not claimable, or it was already claimed.",
    retry: "same",
  },
  USER_REJECTED: {
    title: "You declined the request",
    body: "Phantom did not sign anything and nothing was sent.",
    retry: "same",
  },
  TX_FAILED: {
    title: "The transaction failed",
    body: "It did not complete on-chain. Check your wallet before trying again.",
    retry: "requote",
  },
  NETWORK: {
    title: "No connection",
    body: "Sorot could not be reached. Check your connection and try again.",
    retry: "same",
  },
  UNKNOWN: {
    title: "Something went wrong",
    body: "The action could not be completed. Try again.",
    retry: "same",
  },
};

export function toApiError(err: unknown): ApiError {
  if (isApiError(err)) return err;
  return new ApiError("UNKNOWN", err instanceof Error ? err.message : undefined);
}

export function errorCopy(err: ApiError): ErrorCopy {
  const base = copy[err.code];
  // Server messages for unknown failures are shown as plain text, never as HTML.
  if (err.code === "UNKNOWN" && err.message && err.message !== "UNKNOWN") {
    return { ...base, body: err.message };
  }
  return base;
}
