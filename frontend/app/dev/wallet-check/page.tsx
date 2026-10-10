import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WalletCheck } from "@/components/dev/WalletCheck";

export const metadata: Metadata = {
  title: "Wallet check: Sorot",
  robots: { index: false },
};

/** Development tool. It does not exist in production unless ENABLE_DEV_TOOLS=1 is set. */
export default function WalletCheckPage() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_TOOLS !== "1") notFound();
  return <WalletCheck />;
}
