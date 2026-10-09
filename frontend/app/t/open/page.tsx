import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { getRuntime } from "@/lib/server/runtime";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open a market: Sorot",
  robots: { index: false },
};

/** Sends the visitor to a market that is open right now, so links never point at a market that has closed. */
export default async function OpenMarketPage() {
  let target: string | null = null;
  try {
    const market = await getRuntime().runtime.service.featuredMarket();
    if (market) target = `/t/${encodeURIComponent(market.id)}`;
  } catch {
    // Panta unreachable. Fall through to the message below.
  }
  if (target) redirect(target);

  return (
    <AppShell wallet={null} current="trade">
      <Notice
        tone="info"
        title="No open market right now"
        actions={
          <Link href="/" className={buttonClasses("secondary")}>
            Back to Sorot
          </Link>
        }
      >
        Panta has no market open for trading at the moment, or it could not be reached. Try again in a few minutes.
      </Notice>
    </AppShell>
  );
}
