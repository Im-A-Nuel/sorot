import type { Metadata } from "next";
import { TradeView } from "@/components/trade/TradeView";

export const metadata: Metadata = {
  title: "Trade: Sorot",
  robots: { index: false },
};

type Props = {
  params: Promise<{ marketId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TradePage({ params, searchParams }: Props) {
  const { marketId } = await params;
  const query = await searchParams;

  // Only plain tokens reach the client. Anything else is dropped.
  const side = first(query.side) === "no" ? "no" : "yes";
  const tweet = first(query.tweet);
  const tweetId = tweet && /^\d{1,25}$/.test(tweet) ? tweet : undefined;

  let id = marketId;
  try {
    id = decodeURIComponent(marketId);
  } catch {
    // Keep the raw segment. The API answers NOT_FOUND for ids it does not know.
  }

  return <TradeView marketId={id} tweetId={tweetId} initialSide={side} />;
}
