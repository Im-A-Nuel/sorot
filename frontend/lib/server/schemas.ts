import { z } from "zod";
import { MARKET_ID_RE, SIGNATURE_RE, TWEET_ID_RE, WALLET_RE } from "@sorot/core";

const marketId = z.string().regex(MARKET_ID_RE);
const wallet = z.string().regex(WALLET_RE);
const tweetId = z.string().regex(TWEET_ID_RE);

export const matchBody = z.object({
  tweets: z
    .array(
      z.object({
        tweetId,
        text: z.string().min(1).max(1000),
        lang: z.string().max(12),
      }),
    )
    .min(1)
    .max(20),
});

export const quoteBody = z.object({
  marketId,
  side: z.enum(["yes", "no"]),
  amountUsdc: z.string().min(1).max(24),
  wallet,
  tweetId: tweetId.optional(),
});

export const buildBody = z.object({
  quoteId: z.string().min(1).max(128),
  maxSlippageBps: z.number().int().min(1).max(1000),
  wallet,
});

export const submitBody = z.object({
  signature: z.string().regex(SIGNATURE_RE),
  wallet,
  marketId,
  quoteId: z.string().min(1).max(128).optional(),
});

export const claimBody = z.object({ marketId, wallet });

export const signatureQuery = z.object({ signature: z.string().regex(SIGNATURE_RE) });
export const walletQuery = z.object({ wallet });
export const marketParam = z.object({ id: marketId });
